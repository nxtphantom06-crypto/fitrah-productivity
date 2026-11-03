// Works out which reminders the phone should show over the next few days, entirely on the device.
import { Coordinates, CalculationMethod, Madhab, PrayerTimes } from 'adhan';
import { fromZonedTime } from 'date-fns-tz';
import { countPrayers, dateInTimezone, prayerNames } from './feature-model';
import { shiftDay, streakSummary, type Completion, type PrayerHistory } from './activity-analytics';
import { reminderOffset, type Preferences } from './reminder-model';

export type ScheduledReminder = { key: string; at: Date; title: string; body: string; path: string };
export const MILESTONES = [7, 30, 100] as const;
export const CHECK_IN_TIME = '21:00';
const MAX_SCHEDULED = 60;

type Input = { preferences: Preferences; timezone: string; prayers: PrayerHistory; completions: Completion[]; now: Date; days?: number };

export function prayerTimesFor(preferences: Preferences, day: string) {
 if (preferences.latitude === null || preferences.longitude === null) return null;
 const params = CalculationMethod[preferences.method]();
 params.madhab = Madhab[preferences.madhab];
 // adhan reads the calendar date from local Y/M/D; local noon keeps that date stable in every device timezone.
 const [y, m, d] = day.split('-').map(Number) as [number, number, number];
 const times = new PrayerTimes(new Coordinates(preferences.latitude, preferences.longitude), new Date(y, m - 1, d, 12), params);
 return { Fajr: times.fajr, Dhuhr: times.dhuhr, Asr: times.asr, Maghrib: times.maghrib, Isha: times.isha };
}

export function upcomingReminders({ preferences, timezone, prayers, completions, now, days = 2 }: Input): ScheduledReminder[] {
 const settings = preferences.settings;
 const today = dateInTimezone(now, timezone);
 const complete = (day: string) => countPrayers(prayers[day] ?? {}) === 5 && completions.some(c => c.day === day);
 const events: ScheduledReminder[] = [];
 for (let i = 0; i <= days; i++) {
  const day = shiftDay(today, i);
  const times = prayerTimesFor(preferences, day);
  if (times) for (const name of prayerNames) {
   const r = settings.prayers[name];
   const status = prayers[day]?.[name]?.status;
   if (!r.enabled || status === 'Completed' || status === 'Missed') continue;
   const offset = reminderOffset(r);
   events.push({ key: `${day}:prayer:${name}`, at: new Date(times[name].getTime() - offset * 60000), title: `${name} reminder`, body: offset ? `${name} begins in ${offset} minutes.` : `It’s time for ${name}.`, path: '/prayers' });
  }
  if (settings.daily) events.push({ key: `${day}:tasks`, at: fromZonedTime(`${day}T${settings.time}:00`, timezone), title: 'A moment for your intentions', body: 'Make room for one meaningful task today.', path: '/tasks' });
  if (settings.streak && !complete(day)) events.push({ key: `${day}:check-in`, at: fromZonedTime(`${day}T${CHECK_IN_TIME}:00`, timezone), title: 'A moment to reconnect', body: 'Your day is not complete yet. There is still time for a small step.', path: '/dashboard' });
 }
 const streak = streakSummary(prayers, completions, today);
 if (settings.streak && !complete(today) && streak.daily > 0) {
  events.push({ key: `${shiftDay(today, 1)}:broken`, at: fromZonedTime(`${shiftDay(today, 1)}T00:00:00`, timezone), title: 'Start fresh!', body: 'A new day is another chance to build your rhythm.', path: '/dashboard' });
 }
 if (settings.milestones && complete(today) && (MILESTONES as readonly number[]).includes(streak.daily)) {
  events.push({ key: `milestone:${streak.daily}:${today}`, at: new Date(now.getTime() + 3000), title: `🔥 ${streak.daily}-Day Streak!`, body: 'Small steps. Lasting intention. Keep going.', path: '/progress' });
 }
 return events.filter(e => e.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
}

/** Stable positive 31-bit id for an Android notification. */
export function notificationId(key: string): number {
 let hash = 0;
 for (let i = 0; i < key.length; i++) hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
 return (hash & 0x7fffffff) || 1;
}
