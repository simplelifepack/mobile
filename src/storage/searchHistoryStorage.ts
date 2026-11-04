import * as Keychain from 'react-native-keychain';
const service = (accountId: string) =>
  `com.readines.search-history.${accountId}`;
export const searchHistoryStorage = {
  async read(accountId: string): Promise<string[]> {
    const stored = await Keychain.getGenericPassword({
      service: service(accountId),
    });
    if (!stored) return [];
    try {
      const value: unknown = JSON.parse(stored.password);
      return Array.isArray(value)
        ? value
            .filter(
              (item): item is string =>
                typeof item === 'string' && item.length <= 160,
            )
            .slice(0, 8)
        : [];
    } catch {
      return [];
    }
  },
  async write(accountId: string, queries: string[]) {
    await Keychain.setGenericPassword(
      'recent-searches',
      JSON.stringify(queries.slice(0, 8)),
      {
        service: service(accountId),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
  },
  async clear(accountId: string) {
    await Keychain.resetGenericPassword({ service: service(accountId) });
  },
};
