import { createFileRoute } from '@tanstack/react-router';
import { NotificationSettingsPage } from '@/components/fitrah/notification-settings';
import { pageHead } from '@/components/fitrah/foundation';
export const Route = createFileRoute('/settings/notifications')({ head: () => pageHead('Notification settings', 'Choose prayer, task and streak reminder preferences in Fitrah.'), component: NotificationSettingsPage });