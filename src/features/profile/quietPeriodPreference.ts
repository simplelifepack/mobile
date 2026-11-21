import * as Keychain from 'react-native-keychain';

export const QUIET_PERIOD_OPTIONS = [0, 12, 24, 48] as const;
export type QuietPeriodHours = (typeof QUIET_PERIOD_OPTIONS)[number];

const serviceFor = (userId: string) =>
  `com.readiness.quiet-period.${encodeURIComponent(userId)}`;

export const quietPeriodPreference = {
  async read(userId: string): Promise<QuietPeriodHours> {
    const stored = await Keychain.getGenericPassword({
      service: serviceFor(userId),
    });
    if (!stored) return 24;
    const hours = QUIET_PERIOD_OPTIONS.find(
      option => String(option) === stored.password,
    );
    if (hours === undefined) {
      throw new Error('The saved quiet period preference is invalid.');
    }
    return hours;
  },
  async write(userId: string, hours: QuietPeriodHours): Promise<void> {
    await Keychain.setGenericPassword('readiness', String(hours), {
      service: serviceFor(userId),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
};
