import { supabase } from './supabase';

// ============================================
// FUNCIONES DE ADMINISTRACIÓN
// ============================================

// Obtener todos los usuarios
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Obtener emails de auth.users manualmente
  const usersWithEmails = await Promise.all(
    (data || []).map(async (profile) => {
      try {
        // Nota: en producción, esto se haría en el backend
        return {
          ...profile,
          auth_users: {
            email: profile.username + '@ejemplo.com', // Placeholder
          },
        };
      } catch (err) {
        return {
          ...profile,
          auth_users: { email: 'N/A' },
        };
      }
    })
  );

  return usersWithEmails;
}

// Obtener estadísticas del sistema
export async function getSystemStats() {
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
    const stats = {
      totalUsers: profiles.length,
      admins: profiles.filter((p) => p.role === 'admin').length,
      companies: profiles.filter((p) => p.role === 'company').length,
      clients: profiles.filter((p) => p.role === 'client').length,
      totalTemplates: templatesCount || 0,
      totalSubmissions: submissionsCount || 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

// Actualizar perfil de usuario
export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    full_name?: string;
    role?: 'admin' | 'company' | 'client';
  }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar usuario (solo perfil, no auth)
export async function deleteUserProfile(userId: string) {
  // Primero eliminar submissions del usuario
  const { error: subError } = await supabase
    .from('submissions')
    .delete()
    .eq('client_id', userId);
  if (subError) {
    throw subError;
  }

  // Luego eliminar templates si es empresa
  const { error: tmplError } = await supabase
    .from('templates')
    .delete()
    .eq('company_id', userId);
  if (tmplError) {
    throw tmplError;
  }

  // Finalmente eliminar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw profileError;
}

// Obtener email de un usuario (desde auth.users)
export async function getUserEmail(userId: string): Promise<string> {
  try {
    // Intentar obtener del perfil primero
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    // Por ahora retornar username como email
    // En producción, esto vendría de auth.users vía API
    return profile?.username ? `${profile.username}@ali.com` : 'N/A';
  } catch (err) {
    return 'N/A';
  }
}

// Crear nuevo usuario
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

    // El trigger en Supabase debería crear el perfil automáticamente
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Si el perfil no se creó automáticamente, crearlo manualmente
    if (authData.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!existingProfile) {
        // Crear perfil manualmente
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          username: userData.username,
          full_name: userData.full_name || null,
          role: userData.role,
        });

        if (profileError) throw profileError;
      }
    }

    return authData;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
