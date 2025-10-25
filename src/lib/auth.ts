import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'super_admin' | 'clinic_admin' | 'clinic_user';

export interface UserProfile {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  organization_id: string | null;
}

export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as UserProfile | null;
}

export async function getUserRoles() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: roles } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);

  return (roles || []) as UserRole[];
}

export async function isSuperAdmin() {
  const roles = await getUserRoles();
  return roles.some(role => role.role === 'super_admin');
}

export async function isClinicAdmin() {
  const roles = await getUserRoles();
  return roles.some(role => role.role === 'clinic_admin');
}

export async function signOut() {
  await supabase.auth.signOut();
}
