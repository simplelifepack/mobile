import { open, type NitroSQLiteConnection } from 'react-native-nitro-sqlite';
import { initialMigration } from './migrations/001_initial';
let connection: NitroSQLiteConnection | null = null;
let initializing: Promise<NitroSQLiteConnection> | null = null;
export async function initializeDatabase() {
  if (connection) return connection;
  if (initializing) return initializing;
  const candidate = open({ name: 'readiness.sqlite' });
  initializing = (async () => {
    try {
      await candidate.executeAsync('PRAGMA foreign_keys = ON');
      for (const statement of initialMigration) await candidate.executeAsync(statement);
      connection = candidate;
      return candidate;
    } catch (error) {
      candidate.close(); throw error;
    } finally { initializing = null; }
  })();
  return initializing;
}
export function getDatabase() {
  if (!connection) throw new Error('Database has not been initialized.');
  return connection;
}
