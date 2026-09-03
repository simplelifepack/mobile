import { open, type NitroSQLiteConnection } from 'react-native-nitro-sqlite';
import { initialMigration } from './migrations/001_initial';
let connection: NitroSQLiteConnection | null = null;
export async function initializeDatabase() {
  if (connection) return connection;
  connection = open({ name: 'readiness.sqlite' });
  await connection.executeAsync('PRAGMA foreign_keys = ON');
  for (const statement of initialMigration)
    await connection.executeAsync(statement);
  return connection;
}
export function getDatabase() {
  if (!connection) throw new Error('Database has not been initialized.');
  return connection;
}
