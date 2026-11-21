import { open, type NitroSQLiteConnection } from 'react-native-nitro-sqlite';
import { initialMigration } from './migrations/001_initial';
let connection: NitroSQLiteConnection | null = null;
let initializing: Promise<NitroSQLiteConnection> | null = null;
export async function initializeDatabase() {
  if (initializing) return initializing;
  initializing = (async () => {
    const db = connection ?? open({ name: 'readiness.sqlite' });
    connection = db;
    await db.executeAsync('PRAGMA foreign_keys = ON');
    for (const statement of initialMigration) await db.executeAsync(statement);
    return db;
  })();
  try {
    return await initializing;
  } catch (error) {
    initializing = null;
    throw error;
  }
}
export function getDatabase() {
  if (!connection) throw new Error('Database has not been initialized.');
  return connection;
}
