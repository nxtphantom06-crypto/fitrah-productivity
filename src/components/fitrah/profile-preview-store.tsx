import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { prayerNames } from '@/lib/feature-model';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-store';

export type Reminder = { enabled: boolean; offset: string; minutes: number };
export type ReminderSettings = { prayers: Record<string, Reminder>; daily: boolean; time: string; streak: boolean; milestones: boolean };
export type PreviewProfile = { name: string; timezone: string; language: string; avatar: string };
const defaults: ReminderSettings = { prayers: Object.fromEntries(prayerNames.map(p => [p, { enabled: true, offset: '15 minutes before', minutes: 15 }])), daily: true, time: '09:00', streak: true, milestones: true };
type PreviewStore = { profile: PreviewProfile; setProfile: (profile: PreviewProfile) => Promise<void>; reminders: ReminderSettings; setReminders: (settings: ReminderSettings) => void };
const ProfileContext = createContext<PreviewStore | null>(null);
export function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<PreviewProfile>({ name: '', timezone: 'UTC', language: 'Both', avatar: '' });
  const [reminders, setReminders] = useState(defaults);
  useEffect(() => {
    let active = true;
    setProfileState({ name: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: 'Both', avatar: '' });
    setReminders(defaults);
    if (user) void supabase.from('profiles').select('*').eq('id',user.id).single().then(async ({ data }) => {
      if (!data) return;
      const avatar = data.avatar_path ? (await supabase.storage.from('avatars').createSignedUrl(data.avatar_path,3600)).data?.signedUrl ?? '' : '';
      if (active) setProfileState({ name: data.full_name, timezone: data.timezone, language: data.prayer_language, avatar });
    });
    return () => { active = false; };
  }, [user?.id]);
  const setProfile = async (next: PreviewProfile) => {
    if (!user) throw new Error('Sign in to save your profile.');
    const { data: existing } = await supabase.from('profiles').select('avatar_path').eq('id',user.id).single();
    let avatarPath = existing?.avatar_path ?? '';
    if (next.avatar.startsWith('data:') || next.avatar.startsWith('blob:')) {
      const blob = await fetch(next.avatar).then(r => r.blob());
      avatarPath = `${user.id}/avatar-${crypto.randomUUID()}`;
      const { error } = await supabase.storage.from('avatars').upload(avatarPath,blob,{ contentType: blob.type });
      if (error) throw error;
    }
    const language = next.language === 'Arabic' || next.language === 'English' ? next.language : 'Both';
    const { error } = await supabase.from('profiles').update({ full_name: next.name.trim(), timezone: next.timezone, prayer_language: language, avatar_path: avatarPath, setup_complete: true }).eq('id',user.id);
    if (error) throw error;
    setProfileState(next);
  };
  return <ProfileContext.Provider value={{ profile, setProfile, reminders, setReminders }}>{children}</ProfileContext.Provider>;
}
export function useProfilePreview() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('ProfilePreviewProvider is required');
  return value;
}