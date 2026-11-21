import { documentsApi } from '../../api/documents.api';
import { healthApi } from '../../api/health.api';

/**
 * Removes a profile and the documents behind its health records.
 * The profile is deleted first so a failed document cleanup never leaves a half-removed profile;
 * the returned message describes a cleanup failure for the caller to surface.
 */
export async function deleteMemberWithDocuments(memberId: string): Promise<string | undefined> {
  const records = await healthApi.records(memberId);
  const documentIds = [...new Set(records.map(record => record.documentId))];
  await healthApi.deleteMember(memberId);
  if (!documentIds.length) return undefined;
  try {
    await documentsApi.bulkDelete(documentIds);
    return undefined;
  } catch (reason) {
    return reason instanceof Error ? reason.message : 'Unable to delete documents.';
  }
}
