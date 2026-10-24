import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { prayerNames } from '@/lib/feature-model';

export type Reminder = { enabled: boolean; offset: string; minutes: number };
export type ReminderSettings = { prayers: Record<string, Reminder>; daily: boolean; time: string; streak: boolean; milestones: boolean };
export type PreviewProfile = { name: string; timezone: string; language: string; avatar: string };
const defaults: ReminderSettings = { prayers: Object.fromEntries(prayerNames.map(p => [p, { enabled: true, offset: '15 minutes before', minutes: 15 }])), daily: true, time: '09:00', streak: true, milestones: true };
type PreviewStore = { profile: PreviewProfile; setProfile: (profile: PreviewProfile) => void; reminders: ReminderSettings; setReminders: (settings: ReminderSettings) => void };
const ProfileContext = createContext<PreviewStore | null>(null);
export function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PreviewProfile>({ name: '', timezone: 'UTC', language: 'Both', avatar: '' });
  const [reminders, setReminders] = useState(defaults);
  useEffect(() => { setProfile(p => ({ ...p, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })); }, []);
  return <ProfileContext.Provider value={{ profile, setProfile, reminders, setReminders }}>{children}</ProfileContext.Provider>;
}
export function useProfilePreview() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('ProfilePreviewProvider is required');
  return value;
}