import notifee, { AlarmType, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { initializeDatabase } from '../database';
import { reminderOccurrences, saveReminderSchedule, syncReminderNotifications } from './reminderNotifications';

jest.mock('../database', () => ({ initializeDatabase: jest.fn() }));

const executeAsync = jest.fn();
const reminder = { id: 'one', title: 'Private title', dueDate: '2030-01-31', memberName: 'Private name', origin: 'manual' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date(2030, 0, 1, 0, 0));
  jest.mocked(initializeDatabase).mockResolvedValue({ executeAsync } as never);
  executeAsync.mockResolvedValue({ rows: { _array: [{ id: 'one', startDate: '2030-01-31', time: '14:30', frequency: 'monthly' }] } });
  jest.mocked(notifee.requestPermission).mockResolvedValue({ authorizationStatus: 1, android: { alarm: 1 }, ios: { alert: 1 } } as never);
  jest.mocked(notifee.getTriggerNotificationIds).mockResolvedValue(['reminder-old', 'other']);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('schedules the selected local time and replenishes monthly reminders without date drift', () => {
  const dates = reminderOccurrences({ id: 'one', startDate: '2030-01-31', time: '14:30', frequency: 'monthly' }, Date.now(), 3)
    .map(timestamp => new Date(timestamp));
  expect(dates.map(date => [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]))
    .toEqual([[2030, 0, 31, 14, 30], [2030, 1, 28, 14, 30], [2030, 2, 31, 14, 30]]);
});

it('stores and schedules the selected time, not private medical information in notifications', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await saveReminderSchedule({ id: 'one', startDate: '2030-01-31', time: '14:30', frequency: 'monthly' });
  expect(executeAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE'), ['one', '2030-01-31', '14:30', 'monthly']);
  await syncReminderNotifications([reminder], 'one');
  expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(12);
  expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Health reminder', body: 'Open the app to view your reminder.' }),
    expect.objectContaining({ type: TriggerType.TIMESTAMP, timestamp: new Date(2030, 0, 31, 14, 30).getTime(), alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE } }),
  );
  expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('reminder-old');
  expect(notifee.cancelTriggerNotification).not.toHaveBeenCalledWith('other');
});

it('reports denied notification or exact alarm permissions', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(notifee.requestPermission).mockResolvedValueOnce({ authorizationStatus: 0, android: { alarm: 1 } } as never);
  await expect(syncReminderNotifications([reminder], 'one')).rejects.toThrow('Notifications are disabled');
  jest.mocked(notifee.requestPermission).mockResolvedValueOnce({ authorizationStatus: 1, android: { alarm: 0 } } as never);
  await expect(syncReminderNotifications([reminder], 'one')).rejects.toThrow('Exact alarms are disabled');
  expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
});

it('does not silently replace a missing device-only time with 9am', async () => {
  executeAsync.mockResolvedValue({ rows: { _array: [] } });
  await expect(syncReminderNotifications([reminder], 'one')).rejects.toThrow('No upcoming notification');
  expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
});

it('schedules iOS alerts with sound and foreground presentation at the selected time', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await syncReminderNotifications([reminder], 'one');
  expect(notifee.createChannel).not.toHaveBeenCalled();
  expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
    expect.objectContaining({ ios: { sound: 'default', foregroundPresentationOptions: { banner: true, list: true, sound: true } } }),
    { type: TriggerType.TIMESTAMP, timestamp: new Date(2030, 0, 31, 14, 30).getTime() },
  );
});

it('reports when iOS notification alerts are disabled without canceling scheduled alerts', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(notifee.requestPermission).mockResolvedValueOnce({ authorizationStatus: 1, ios: { alert: 0 } } as never);
  await expect(syncReminderNotifications([reminder], 'one')).rejects.toThrow('Notification alerts are disabled');
  expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
});

it('reports quiet iOS notifications without claiming an audible alert is scheduled', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(notifee.requestPermission).mockResolvedValueOnce({ authorizationStatus: 2, ios: { alert: 1 } } as never);
  await expect(syncReminderNotifications([reminder], 'one')).rejects.toThrow('delivered quietly');
  expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
});

it('reserves iOS notification capacity for unrelated pending triggers', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(notifee.getTriggerNotificationIds).mockResolvedValueOnce(
    Array.from({ length: 60 }, (_, index) => `other-${index}`),
  );
  await syncReminderNotifications([reminder], 'one');
  expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(4);
});
