import { Platform } from 'react-native';
import notifee, { AlarmType, AndroidNotificationSetting, AuthorizationStatus, IOSNotificationSetting, TriggerType } from '@notifee/react-native';

import type { HealthHomeReminder } from '../api/health.api';
import { initializeDatabase } from '../database';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type LocalReminderSchedule = { id: string; startDate: string; time: string; frequency: ReminderFrequency };
const prefix = 'reminder-';
const maxScheduled = 60;
const horizonPerReminder = 12;

export async function saveReminderSchedule(schedule: LocalReminderSchedule) {
  const db = await initializeDatabase();
  await db.executeAsync(
    'INSERT OR REPLACE INTO reminder_schedule (id, start_date, local_time, frequency) VALUES (?, ?, ?, ?)',
    [schedule.id, schedule.startDate, schedule.time, schedule.frequency],
  );
}

export function reminderOccurrences(schedule: LocalReminderSchedule, now: number, count = horizonPerReminder): number[] {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(schedule.startDate);
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(schedule.time);
  if (!date || !time || !['once', 'daily', 'weekly', 'monthly'].includes(schedule.frequency)) {
    throw new Error('Invalid saved reminder schedule.');
  }
  const year = Number(date[1]), month = Number(date[2]) - 1, day = Number(date[3]);
  const hour = Number(time[1]), minute = Number(time[2]);
  const first = new Date(year, month, day, hour, minute);
  if (first.getFullYear() !== year || first.getMonth() !== month || first.getDate() !== day) {
    throw new Error('Invalid saved reminder date.');
  }
  const occurrences: number[] = [];
  for (let index = 0; index < 100000 && occurrences.length < count; index += 1) {
    let occurrence: Date;
    if (schedule.frequency === 'monthly') {
      const monthStart = new Date(year, month + index, 1, hour, minute);
      const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
      occurrence = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(day, lastDay), hour, minute);
    } else {
      const offset = schedule.frequency === 'weekly' ? index * 7 : schedule.frequency === 'daily' ? index : 0;
      occurrence = new Date(year, month, day + offset, hour, minute);
    }
    if (occurrence.getTime() > now) occurrences.push(occurrence.getTime());
    if (schedule.frequency === 'once') break;
  }
  return occurrences;
}

let syncQueue: Promise<void> = Promise.resolve();

export function syncReminderNotifications(reminders: HealthHomeReminder[], requiredId?: string): Promise<void> {
  const run = syncQueue.catch(() => undefined).then(() => sync(reminders, requiredId));
  syncQueue = run;
  return run;
}

async function sync(reminders: HealthHomeReminder[], requiredId?: string) {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    throw new Error('Notifications are disabled. Enable them in device settings.');
  }
  if (Platform.OS === 'ios' && settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {
    throw new Error('iOS notifications are currently delivered quietly. Enable full notifications in iOS Settings.');
  }
  if (Platform.OS === 'ios' && settings.ios.alert === IOSNotificationSetting.DISABLED) {
    throw new Error('Notification alerts are disabled. Enable alerts in iOS Settings.');
  }
  if (Platform.OS === 'android' && settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
    throw new Error('Exact alarms are disabled. Enable alarms and reminders in device settings.');
  }
  const db = await initializeDatabase();
  const result = await db.executeAsync<LocalReminderSchedule>(
    'SELECT id, start_date AS startDate, local_time AS time, frequency FROM reminder_schedule',
  );
  const local = new Map((result.rows?._array ?? []).map(item => [item.id, item]));
  const now = Date.now();
  const existing = await notifee.getTriggerNotificationIds();
  const capacity = Platform.OS === 'ios'
    ? Math.max(0, Math.min(maxScheduled, 64 - existing.filter(id => !id.startsWith(prefix)).length))
    : maxScheduled;
  const candidates = reminders.flatMap(reminder => {
    const schedule = local.get(reminder.id) ?? (reminder.dueDate && reminder.origin !== 'manual' ? {
      id: reminder.id, startDate: reminder.dueDate.slice(0, 10), time: '09:00', frequency: 'once' as const,
    } : undefined);
    if (!schedule) return [];
    return reminderOccurrences(schedule, now).map(timestamp => ({ reminder, timestamp }));
  }).sort((a, b) => a.timestamp - b.timestamp).slice(0, capacity);
  if (Platform.OS === 'android') await notifee.createChannel({ id: 'reminders', name: 'Reminders' });
  await Promise.all(existing.filter(id => id.startsWith(prefix)).map(id => notifee.cancelTriggerNotification(id)));
  await Promise.all(candidates.map(({ reminder, timestamp }) => notifee.createTriggerNotification(
    {
      id: `${prefix}${reminder.id}-${timestamp}`,
      title: 'Health reminder',
      body: 'Open the app to view your reminder.',
      android: { channelId: 'reminders', pressAction: { id: 'default' } },
      ios: { sound: 'default', foregroundPresentationOptions: { banner: true, list: true, sound: true } },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      ...(Platform.OS === 'android' ? { alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } } : {}),
    },
  )));
  if (requiredId && !candidates.some(item => item.reminder.id === requiredId)) {
    throw new Error('No upcoming notification could be scheduled. The device may have reached its reminder limit.');
  }
}
