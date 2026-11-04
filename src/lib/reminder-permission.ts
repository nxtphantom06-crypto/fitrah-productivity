import { isNativeBuild } from './native/client';

export const WEB_REMINDER_NOTICE = 'Reminders are delivered by the Fitrah Android app. Your choices are saved to your account and used on your phone.';
export const BLOCKED_REMINDER_NOTICE = 'Notifications are turned off for Fitrah. Turn them on in your phone’s Settings → Apps → Fitrah → Notifications.';

/** Asks for permission to show reminders and returns a message describing the result. Call from a tap. */
export async function enableReminders(): Promise<string> {
 if (!isNativeBuild) return WEB_REMINDER_NOTICE;
 try {
  const { requestReminderPermission } = await import('./native/reminders');
  const result = await requestReminderPermission();
  return result === 'granted' ? 'Reminders are on for this phone.' : BLOCKED_REMINDER_NOTICE;
 } catch {
  return 'Reminders could not be turned on. Please try again.';
 }
}
