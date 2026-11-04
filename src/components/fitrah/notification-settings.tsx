import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Bell, LocateFixed, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { AppShell } from './foundation';
import { useFeatures } from './feature-store';
import { prayerNames } from '@/lib/feature-model';
import { type Preferences, type Reminder } from '@/lib/reminder-model';
import { prayerTimesFor, CHECK_IN_TIME } from '@/lib/reminder-schedule';
import { isNativeBuild } from '@/lib/native/client';
import { enableReminders, WEB_REMINDER_NOTICE, BLOCKED_REMINDER_NOTICE } from '@/lib/reminder-permission';

const methods: { value: Preferences['method']; label: string }[] = [
 { value: 'MuslimWorldLeague', label: 'Muslim World League' },
 { value: 'Karachi', label: 'Karachi (University of Islamic Sciences)' },
 { value: 'NorthAmerica', label: 'ISNA (North America)' },
 { value: 'UmmAlQura', label: 'Umm al-Qura (Makkah)' },
];

async function locate(): Promise<{ latitude: number; longitude: number }> {
 if (isNativeBuild) {
  const { Geolocation } = await import('@capacitor/geolocation');
  const permission = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] });
  if (permission.coarseLocation !== 'granted' && permission.location !== 'granted') throw new Error('denied');
  const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
 }
 return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }), reject, { timeout: 15000, maximumAge: 3600000 }));
}
const round = (n: number) => Math.round(n * 1000) / 1000;

export function NotificationSettingsPage() {
 const { preferences, savePreferences, today, timezone } = useFeatures();
 const [draft, setDraft] = useState<Preferences>(preferences);
 const [notice, setNotice] = useState('');
 const [locating, setLocating] = useState(false);
 const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'web'>('web');
 const [exact, setExact] = useState(true);
 useEffect(() => { setDraft(preferences); }, [preferences]);
 useEffect(() => {
  if (!isNativeBuild) return;
  void import('@/lib/native/reminders').then(async m => { setPermission(await m.reminderPermission()); setExact(await m.exactAlarmsAllowed()); });
 }, []);
 const settings = draft.settings;
 const setSettings = (patch: Partial<Preferences['settings']>) => setDraft({ ...draft, settings: { ...settings, ...patch } });
 const update = (name: typeof prayerNames[number], patch: Partial<Reminder>) => setSettings({ prayers: { ...settings.prayers, [name]: { ...settings.prayers[name], ...patch } } });
 const times = today ? prayerTimesFor(draft, today) : null;
 const fmt = (d: Date) => d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', timeZone: timezone });
 async function useLocation() {
  setLocating(true); setNotice('');
  try { const { latitude, longitude } = await locate(); setDraft({ ...draft, latitude: round(latitude), longitude: round(longitude) }); }
  catch { setNotice('Your location could not be found. Allow location for Fitrah, or enter it below.'); }
  finally { setLocating(false); }
 }
 async function submit(e: React.FormEvent) {
  e.preventDefault(); setNotice('');
  const saved = await savePreferences(draft);
  if (!saved) { setNotice('Your reminder preferences could not be saved. Please try again.'); return; }
  if (!isNativeBuild) { setNotice(`Saved. ${WEB_REMINDER_NOTICE}`); return; }
  const message = await enableReminders();
  const { reminderPermission } = await import('@/lib/native/reminders');
  setPermission(await reminderPermission());
  setNotice(message === BLOCKED_REMINDER_NOTICE ? `Saved. ${message}` : draft.latitude === null ? 'Saved. Add your location so prayer reminders can be scheduled.' : 'Saved. Reminders are scheduled on this phone and work offline.');
 }
 return <AppShell><div className="editor-heading"><Button asChild variant="ghost" size="icon"><Link to="/profile" aria-label="Back to profile"><ArrowLeft/></Link></Button><h1>Notifications</h1></div>
  <form className="notification-form" onSubmit={e => void submit(e)}>
   <p className="auth-notice mb-7"><Bell size={16} className="inline mr-2"/>{isNativeBuild
    ? permission === 'granted' ? 'Reminders are shown by this phone, even without internet.' : permission === 'denied' ? BLOCKED_REMINDER_NOTICE : 'Save to allow Fitrah to show reminders on this phone.'
    : WEB_REMINDER_NOTICE}</p>
   {isNativeBuild && permission === 'granted' && !exact && <div className="auth-notice mb-7"><p>Allow “Alarms & reminders” so reminders arrive exactly on time.</p><Button type="button" variant="link" className="p-0 h-auto" onClick={() => void import('@/lib/native/reminders').then(m => m.openExactAlarmSettings())}>Open setting</Button></div>}
   <section className="settings-section mt-0">
    <h2 className="settings-heading">Prayer times</h2>
    <p className="text-sm text-muted-foreground mb-4">Prayer times are calculated on your phone from your location.</p>
    <Button type="button" variant="secondary" onClick={() => void useLocation()} loading={locating} disabled={locating}><LocateFixed/>Use my location</Button>
    <div className="grid grid-cols-2 gap-3 mt-4">
     <div><label htmlFor="latitude">Latitude</label><Input id="latitude" type="number" step="0.001" min={-90} max={90} value={draft.latitude ?? ''} onChange={e => setDraft({ ...draft, latitude: e.target.value === '' ? null : Number(e.target.value) })}/></div>
     <div><label htmlFor="longitude">Longitude</label><Input id="longitude" type="number" step="0.001" min={-180} max={180} value={draft.longitude ?? ''} onChange={e => setDraft({ ...draft, longitude: e.target.value === '' ? null : Number(e.target.value) })}/></div>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-4">
     <div><label htmlFor="method">Calculation method</label><select id="method" className="foundation-select" value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value as Preferences['method'] })}>{methods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
     <div><label htmlFor="madhab">Asr time</label><select id="madhab" className="foundation-select" value={draft.madhab} onChange={e => setDraft({ ...draft, madhab: e.target.value as Preferences['madhab'] })}><option value="Shafi">Standard (Shafi, Maliki, Hanbali)</option><option value="Hanafi">Hanafi</option></select></div>
    </div>
    {times && <p className="text-sm text-muted-foreground mt-4" role="status">Today: {prayerNames.map(n => `${n} ${fmt(times[n])}`).join(' · ')}</p>}
   </section>
   <h2 className="settings-heading">Prayer reminders</h2>
   {prayerNames.map(name => { const reminder = settings.prayers[name]; return <div className="reminder-row" key={name}><div className="preference-row"><h2>{name}</h2><Switch checked={reminder.enabled} onCheckedChange={enabled => update(name, { enabled })} aria-label={`${name} reminder`}/></div><div className="reminder-controls"><label htmlFor={`offset-${name}`} className="sr-only">{name} reminder timing</label><select id={`offset-${name}`} className="foundation-select" value={reminder.offset} disabled={!reminder.enabled} onChange={e => update(name, { offset: e.target.value as Reminder['offset'] })}>{(['15 minutes before', 'At prayer time', 'Custom'] as const).map(v => <option key={v}>{v}</option>)}</select>{reminder.offset === 'Custom' && <div><label htmlFor={`minutes-${name}`}>Minutes before</label><Input id={`minutes-${name}`} type="number" min={0} max={120} required disabled={!reminder.enabled} value={reminder.minutes} onChange={e => update(name, { minutes: Math.max(0, Math.min(120, Math.round(Number(e.target.value) || 0))) })}/></div>}</div></div>; })}
   <section className="settings-section"><h2 className="settings-heading">Daily rhythm</h2>
    <div className="preference-row"><div><h2>Daily task reminder</h2><p>A moment for your intentions.</p></div><Switch checked={settings.daily} onCheckedChange={daily => setSettings({ daily })} aria-label="Daily task reminder"/></div>
    <div className="mt-4"><label htmlFor="daily-time">Reminder time</label><Input id="daily-time" type="time" required disabled={!settings.daily} value={settings.time} onChange={e => setSettings({ time: e.target.value })}/></div>
    <div className="preference-row"><div><h2>End-of-day check-in</h2><p>At {CHECK_IN_TIME === '21:00' ? '9:00 pm' : CHECK_IN_TIME} if prayers or tasks are incomplete, and a fresh-start note if a streak ends.</p></div><Switch checked={settings.streak} onCheckedChange={streak => setSettings({ streak })} aria-label="End-of-day reminder"/></div>
    <div className="preference-row"><div><h2>Streak milestones</h2><p>7, 30 and 100 days.</p></div><Switch checked={settings.milestones} onCheckedChange={milestones => setSettings({ milestones })} aria-label="Streak milestones"/></div>
   </section>
   <div className="settings-save"><Button type="submit"><Save/>Save preferences</Button>{notice && <p className="auth-notice" role="status">{notice}</p>}</div>
  </form></AppShell>;
}
