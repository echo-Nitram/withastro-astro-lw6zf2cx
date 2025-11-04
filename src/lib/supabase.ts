import { createClient } from '@supabase/supabase-js';

// ======================================
// 🔐 CONFIGURACIÓN SEGURA CON VARIABLES DE ENTORNO
// ======================================

// Obtener credenciales desde variables de entorno
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// ✅ Validación de credenciales
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Missing Supabase credentials.\n' +
      'Please check that you have:\n' +
      '1. Created a .env file in the root directory\n' +
      '2. Added PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY\n' +
      '3. Restarted the development server (npm run dev)'
  );
}

// Validar que no sean las credenciales de ejemplo
if (SUPABASE_URL.includes('YOUR_PROJECT_URL')) {
  console.warn(
    '⚠️ You are using example Supabase credentials.\n' +
      'Please update your .env file with your actual Supabase project credentials.\n' +
      'Get them from: https://app.supabase.com/project/_/settings/api'
  );
}

// ======================================
// 🚀 CLIENTE SUPABASE
// ======================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ======================================
// 🔐 FUNCIONES DE AUTENTICACIÓN
// ======================================

/**
 * Iniciar sesión con email y contraseña
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

/**
 * Registrar nuevo usuario
 * @param email - Email del usuario
 * @param password - Contraseña
 * @param metadata - Datos adicionales (username, full_name, role)
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    username?: string;
    full_name?: string;
    role?: 'admin' | 'company' | 'client';
  }
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: `${
          import.meta.env.PUBLIC_APP_URL || 'http://localhost:4321'
        }/dashboard`,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error };
  }
}

/**
 * Obtener usuario actual
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    return { user, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { user: null, error };
  }
}

/**
 * Obtener perfil del usuario
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting profile:', error);
    return { data: null, error };
  }
}

/**
 * Actualizar perfil del usuario
 */
export async function updateProfile(
  userId: string,
  updates: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user;
}

/**
 * Obtener la sesión actual
 */
export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return { session, error: null };
  } catch (error: any) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }
}

/**
 * Escuchar cambios en la autenticación
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

// ======================================
// 🛡️ FUNCIONES DE SEGURIDAD
// ======================================

/**
 * Verificar si el usuario tiene un rol específico
 */
export async function hasRole(
  userId: string,
  role: 'admin' | 'company' | 'client'
): Promise<boolean> {
  try {
    const { data, error } = await getProfile(userId);

    if (error || !data) return false;

    return data.role === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Obtener el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<
  'admin' | 'company' | 'client' | null
> {
  try {
    const { user } = await getCurrentUser();

    if (!user) return null;

    const { data } = await getProfile(user.id);

    return data?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Verificar si el usuario es administrador
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    return await hasRole(user.id, 'admin');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Verificar si el usuario es empresa
 */
export async function isCompany(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    return await hasRole(user.id, 'company');
  } catch (error) {
    console.error('Error checking company status:', error);
    return false;
  }
}

/**
 * Verificar si el usuario es cliente
 */
export async function isClient(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    return await hasRole(user.id, 'client');
  } catch (error) {
    console.error('Error checking client status:', error);
    return false;
  }
}

// ======================================
// 📊 EXPORTAR CONFIGURACIÓN
// ======================================

export const config = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
};

// ======================================
// 📝 TIPOS
// ======================================

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'company' | 'client';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = 'admin' | 'company' | 'client';