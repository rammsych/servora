import { supabase } from '@/libs/supabaseClient';

export async function getCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      role: null,
      isAdmin: false,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      user,
      profile: null,
      role: null,
      isAdmin: false,
    };
  }

  const isAdmin = ['admin', 'chief_admin'].includes(profile.role);

  return {
    user,
    profile,
    role: profile.role,
    isAdmin,
  };
}