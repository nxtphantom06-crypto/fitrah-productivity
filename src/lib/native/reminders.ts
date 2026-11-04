// Packaged app only: schedules reminders as on-device notifications, so they work without internet.
import { LocalNotifications } from '@capacitor/local-notifications';
import { upcomingReminders, notificationId } from '../reminder-schedule';
import type { FeatureData } from '../sync-model';

const CHANNEL = 'fitrah-reminders';
const SHOWN = 'fitrah-shown-milestones';
let channelReady = false;

export type PermissionResult = 'granted' | 'denied' | 'prompt';

/** Asks for notification permission (Android 13+ shows the system prompt). Must follow a tap. */
export async function requestReminderPermission(): Promise<PermissionResult> {
 const current = await LocalNotifications.checkPermissions();
 if (current.display === 'granted') return 'granted';
 const result = await LocalNotifications.requestPermissions();
 return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'prompt';
}

export async function reminderPermission(): Promise<PermissionResult> {
 const { display } = await LocalNotifications.checkPermissions();
 return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
}

/** Android 12+ may ask the user to allow on-time alarms; without it reminders can arrive a few minutes late. */
export async function exactAlarmsAllowed(): Promise<boolean> {
 try { return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'; } catch { return true; }
}
export async function openExactAlarmSettings() {
 try { await LocalNotifications.changeExactNotificationSetting(); } catch { /* not available on this Android version */ }
}

function shownMilestones(): string[] { try { return JSON.parse(localStorage.getItem(SHOWN) ?? '[]') as string[]; } catch { return []; } }

/** Replaces every scheduled Fitrah reminder with the ones that match the latest data and settings. */
export async function syncLocalReminders(data: FeatureData) {
 try {
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
  if (!channelReady) {
   await LocalNotifications.createChannel({ id: CHANNEL, name: 'Reminders', description: 'Prayer, task and streak reminders', importance: 4, visibility: 1 });
   channelReady = true;
  }
  const shown = shownMilestones();
  const events = upcomingReminders({ preferences: data.preferences, timezone: data.timezone, prayers: data.prayers, completions: data.completions, now: new Date() })
   .filter(e => !(e.key.startsWith('milestone:') && shown.includes(e.key)));
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
  if (events.length) {
   await LocalNotifications.schedule({ notifications: events.map(e => ({
    id: notificationId(e.key), title: e.title, body: e.body, channelId: CHANNEL,
    smallIcon: 'ic_stat_fitrah', iconColor: '#0F766E',
    schedule: { at: e.at, allowWhileIdle: true }, extra: { path: e.path },
   })) });
  }
  const milestones = events.filter(e => e.key.startsWith('milestone:')).map(e => e.key);
  if (milestones.length) localStorage.setItem(SHOWN, JSON.stringify([...shown, ...milestones].slice(-50)));
 } catch (error) {
  console.warn('Reminders could not be scheduled', error);
 }
}

/** Removes all scheduled reminders (used on sign-out). */
export async function clearLocalReminders() {
 try {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
 } catch { /* plugin unavailable */ }
}
