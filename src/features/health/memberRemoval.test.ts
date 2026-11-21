import { documentsApi } from '../../api/documents.api';
import { healthApi } from '../../api/health.api';
import { deleteMemberWithDocuments } from './memberRemoval';

afterEach(() => jest.restoreAllMocks());

it('deletes the member then its unique documents', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue([{ documentId: 'd1' }, { documentId: 'd1' }, { documentId: 'd2' }] as never);
  const del = jest.spyOn(healthApi, 'deleteMember').mockResolvedValue(undefined as never);
  const bulk = jest.spyOn(documentsApi, 'bulkDelete').mockResolvedValue(undefined as never);
  expect(await deleteMemberWithDocuments('m1')).toBeUndefined();
  expect(del).toHaveBeenCalledWith('m1');
  expect(bulk).toHaveBeenCalledWith(['d1', 'd2']);
});

it('reports a message when document cleanup fails', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue([{ documentId: 'd1' }] as never);
  jest.spyOn(healthApi, 'deleteMember').mockResolvedValue(undefined as never);
  jest.spyOn(documentsApi, 'bulkDelete').mockRejectedValue(new Error('x'));
  expect(typeof (await deleteMemberWithDocuments('m1'))).toBe('string');
});
