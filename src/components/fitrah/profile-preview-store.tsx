import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-store';
import { isNativeBuild } from '@/lib/native/client';
import { loadLocal, saveLocal, looksOffline, OFFLINE_SAVE_MESSAGE } from '@/lib/native/offline';
import { recordChange } from '@/lib/native/sync';

export type PreviewProfile = { name: string; timezone: string; language: string; avatar: string };
type CachedProfile = { full_name: string; timezone: string; prayer_language: string; setup_complete: boolean };
type PreviewStore = { profile: PreviewProfile; setProfile: (profile: PreviewProfile) => Promise<void> };
const ProfileContext = createContext<PreviewStore | null>(null);
const toLanguage = (value: string) => (value === 'Arabic' || value === 'English' ? value : 'Both');

export function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<PreviewProfile>({ name: '', timezone: 'UTC', language: 'Both', avatar: '' });
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setProfileState({ name: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: 'Both', avatar: '' });
    if (!user) return;
    const show = (row: CachedProfile, avatar: string) => { if (active) setProfileState({ name: row.full_name, timezone: row.timezone, language: row.prayer_language, avatar }); };
    void (async () => {
      // Phone app: show the copy saved on the phone straight away (also when offline).
      if (isNativeBuild) {
        const [cached, photo] = await Promise.all([loadLocal<CachedProfile>('profile', user.id), loadLocal<Blob>('avatar', user.id)]);
        if (cached) { objectUrl = photo ? URL.createObjectURL(photo) : ''; show(cached, objectUrl); }
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error || !data) return;
      let avatar = '';
      if (data.avatar_path) {
        const signed = (await supabase.storage.from('avatars').createSignedUrl(data.avatar_path, 3600)).data?.signedUrl ?? '';
        avatar = signed;
        if (isNativeBuild && signed) {
          try {
            const blob = await fetch(signed).then(r => r.blob());
            await saveLocal('avatar', user.id, blob);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(blob); avatar = objectUrl;
          } catch { /* keep the signed link */ }
        }
      }
      const row = { full_name: data.full_name, timezone: data.timezone, prayer_language: data.prayer_language, setup_complete: data.setup_complete };
      if (isNativeBuild) await saveLocal('profile', user.id, row);
      show(row, avatar);
    })().catch(() => { /* offline: the saved copy is already showing */ });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [user?.id]);

  const setProfile = async (next: PreviewProfile) => {
    if (!user) throw new Error('Sign in to save your profile.');
    const language = toLanguage(next.language);
    const newPhoto = next.avatar.startsWith('data:') || next.avatar.startsWith('blob:');
    const row: CachedProfile = { full_name: next.name.trim(), timezone: next.timezone, prayer_language: language, setup_complete: true };
    const saveOnPhone = async () => {
      if (newPhoto) throw new Error('You’re offline. Connect to the internet to change your photo.');
      const queued = await recordChange(user.id, { id: crypto.randomUUID(), kind: 'profile', name: row.full_name, timezone: row.timezone, language });
      if (!queued) throw new Error(OFFLINE_SAVE_MESSAGE);
      await saveLocal('profile', user.id, row);
      setProfileState(next);
    };
    if (isNativeBuild && navigator.onLine === false) return saveOnPhone();
    try {
      const { data: existing, error: readError } = await supabase.from('profiles').select('avatar_path').eq('id', user.id).single();
      if (readError) throw readError;
      let avatarPath = existing?.avatar_path ?? '';
      let photo: Blob | null = null;
      if (newPhoto) {
        const blob = await fetch(next.avatar).then(r => r.blob());
        photo = blob;
        avatarPath = `${user.id}/avatar-${crypto.randomUUID()}`;
        const { error } = await supabase.storage.from('avatars').upload(avatarPath, blob, { contentType: blob.type });
        if (error) throw error;
      }
      const { error } = await supabase.from('profiles').update({ full_name: row.full_name, timezone: row.timezone, prayer_language: language, setup_complete: true, avatar_path: avatarPath }).eq('id', user.id);
      if (error) throw error;
      if (isNativeBuild) { await saveLocal('profile', user.id, row); if (photo) await saveLocal('avatar', user.id, photo); }
      setProfileState(next);
    } catch (error) {
      if (isNativeBuild && looksOffline(error)) return saveOnPhone();
      throw error;
    }
  };
  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}
export function useProfilePreview() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('ProfilePreviewProvider is required');
  return value;
}
