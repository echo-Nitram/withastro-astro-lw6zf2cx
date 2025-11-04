import { supabase } from './supabase';

// ============================================
// FUNCIONES DE ADMINISTRACIÓN
// ============================================

export interface UserWithEmail {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'client';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  email: string;
}

export interface SystemStats {
  totalUsers: number;
  admins: number;
  companies: number;
  clients: number;
  totalTemplates: number;
  totalSubmissions: number;
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

/**
 * Obtener todos los usuarios del sistema
 */
export async function getAllUsers(): Promise<UserWithEmail[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Agregar emails (en producción real, esto vendría de auth.users vía API)
    const usersWithEmails: UserWithEmail[] = (data || []).map((profile) => ({
      ...profile,
      email: `${profile.username}@certia.app`, // Email consistente
    }));

    return usersWithEmails;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Obtener email de un usuario específico
 */
export async function getUserEmail(userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    return profile?.username ? `${profile.username}@certia.app` : 'N/A';
  } catch (err) {
    console.error('Error getting user email:', err);
    return 'N/A';
  }
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(userId: string): Promise<UserWithEmail | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      ...data,
      email: `${data.username}@certia.app`,
    };
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

// ============================================
// ESTADÍSTICAS DEL SISTEMA
// ============================================

/**
 * Obtener estadísticas generales del sistema
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    // Contar usuarios por rol
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role');

    if (profilesError) throw profilesError;

    // Contar templates
    const { count: templatesCount, error: templatesError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true });

    if (templatesError) throw templatesError;

    // Contar submissions
    const { count: submissionsCount, error: submissionsError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (submissionsError) throw submissionsError;

    // Calcular estadísticas
    const stats: SystemStats = {
      totalUsers: profiles.length,
      admins: profiles.filter((p) => p.role === 'admin').length,
      companies: profiles.filter((p) => p.role === 'company').length,
      clients: profiles.filter((p) => p.role === 'client').length,
      totalTemplates: templatesCount || 0,
      totalSubmissions: submissionsCount || 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas detalladas por estado
 */
export async function getSubmissionStats() {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('status');

    if (error) throw error;

    const stats = {
      pending: data.filter((s) => s.status === 'pending').length,
      reviewed: data.filter((s) => s.status === 'reviewed').length,
      approved: data.filter((s) => s.status === 'approved').length,
      rejected: data.filter((s) => s.status === 'rejected').length,
      total: data.length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting submission stats:', error);
    throw error;
  }
}

// ============================================
// OPERACIONES CRUD DE USUARIOS
// ============================================

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    full_name?: string;
    role?: 'admin' | 'company' | 'client';
    avatar_url?: string;
  }
) {
  try {
    // Validar que el username no esté en uso si se está actualizando
    if (updates.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Eliminar usuario y sus datos relacionados
 * ADVERTENCIA: Esta operación es irreversible
 */
export async function deleteUserProfile(userId: string) {
  try {
    // Las eliminaciones en cascada están configuradas en la BD
    // pero por seguridad, eliminamos manualmente en orden

    // 1. Eliminar archivos de submissions del usuario
    const { data: userSubmissions } = await supabase
      .from('submissions')
      .select('id')
      .eq('client_id', userId);

    if (userSubmissions && userSubmissions.length > 0) {
      const submissionIds = userSubmissions.map((s) => s.id);
      await supabase.from('files').delete().in('submission_id', submissionIds);
    }

    // 2. Eliminar submissions del usuario
    await supabase.from('submissions').delete().eq('client_id', userId);

    // 3. Eliminar templates si es empresa
    await supabase.from('templates').delete().eq('company_id', userId);

    // 4. Finalmente eliminar perfil
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

/**
 * Crear nuevo usuario
 */
export async function createUser(
  email: string,
  password: string,
  userData: {
    username: string;
    full_name?: string;
    role: 'admin' | 'company' | 'client';
  }
) {
  try {
    // Validar que el username no esté en uso
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', userData.username)
      .single();

    if (existingUser) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name || null,
          role: userData.role,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // El trigger en Supabase debería crear el perfil automáticamente
    // Esperamos un momento para que se complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verificar que el perfil se creó
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Si el perfil no se creó automáticamente, crearlo manualmente
      const { error: insertError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: userData.username,
        full_name: userData.full_name || null,
        role: userData.role,
      });

      if (insertError) throw insertError;
    }

    return {
      user: authData.user,
      profile: profile || {
        id: authData.user.id,
        username: userData.username,
        full_name: userData.full_name || null,
        role: userData.role,
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// ============================================
// BÚSQUEDA Y FILTRADO
// ============================================

/**
 * Buscar usuarios por término
 */
export async function searchUsers(
  searchTerm: string,
  role?: 'admin' | 'company' | 'client'
): Promise<UserWithEmail[]> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    return (data || []).map((profile) => ({
      ...profile,
      email: `${profile.username}@certia.app`,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Obtener usuarios por rol
 */
export async function getUsersByRole(
  role: 'admin' | 'company' | 'client'
): Promise<UserWithEmail[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((profile) => ({
      ...profile,
      email: `${profile.username}@certia.app`,
    }));
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
}

// ============================================
// VALIDACIONES
// ============================================

/**
 * Validar si un username está disponible
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query.single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      return true;
    }

    if (error) throw error;

    // If we got data, username is taken
    return !data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Validar si un email está disponible
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    // En producción real, esto se verificaría contra auth.users
    // Por ahora, verificamos contra el patrón de username
    const username = email.split('@')[0];
    return await isUsernameAvailable(username);
  } catch (error) {
    console.error('Error checking email availability:', error);
    return false;
  }
}