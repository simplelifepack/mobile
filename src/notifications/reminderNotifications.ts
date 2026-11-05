import { Platform } from 'react-native';
import notifee, {
  AuthorizationStatus,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import type { HealthHomeReminder } from '../api/health.api';

const CHANNEL_ID = 'reminders';
const ID_PREFIX = 'reminder-';
const NOTIFY_HOUR = 9;
// Schedule at most this many upcoming alerts; the list is rebuilt on every sync.
const MAX_SCHEDULED = 60;

async function ensurePermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

// Due dates are date-only, so alert at 9am local time on the day.
function triggerTime(dueDate: string) {
  const day = new Date(dueDate);
  if (Number.isNaN(day.getTime())) return undefined;
  const at = new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), NOTIFY_HOUR);
  return at.getTime() > Date.now() ? at.getTime() : undefined;
}

// Replaces every scheduled reminder alert with the current list.
export async function syncReminderNotifications(reminders: HealthHomeReminder[]) {
  try {
    if (!(await ensurePermission())) return;
    if (Platform.OS === 'android') {
      await notifee.createChannel({ id: CHANNEL_ID, name: 'Reminders' });
    }
    const existing = await notifee.getTriggerNotificationIds();
    await Promise.all(
      existing.filter(id => id.startsWith(ID_PREFIX)).map(id => notifee.cancelTriggerNotification(id)),
    );
    const upcoming = reminders
      .map(reminder => ({ reminder, at: reminder.dueDate ? triggerTime(reminder.dueDate) : undefined }))
      .filter((entry): entry is { reminder: HealthHomeReminder; at: number } => entry.at !== undefined)
      .sort((a, b) => a.at - b.at)
      .slice(0, MAX_SCHEDULED);
    await Promise.all(
      upcoming.map(({ reminder, at }) => {
        const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: at };
        return notifee.createTriggerNotification(
          {
            id: `${ID_PREFIX}${reminder.id}`,
            title: reminder.title,
            body: reminder.memberName ? `Reminder for ${reminder.memberName}` : 'Reminder due today',
            android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
          },
          trigger,
        );
      }),
    );
  } catch {
    // Alerts are best effort; the in-app list still shows every reminder.
  }
}
