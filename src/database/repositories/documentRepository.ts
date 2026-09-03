import { getDatabase } from '..';
import type { DocumentRecord } from '../schema/models';
export const documentRepository = {
  async list(): Promise<DocumentRecord[]> {
    const result = await getDatabase().executeAsync<DocumentRecord>(
      'SELECT id, type, title, category, page_count AS pageCount, created_at AS createdAt, updated_at AS updatedAt FROM documents ORDER BY updated_at DESC',
    );
    return result.rows?._array ?? [];
  },
};
