import { userApi } from './user.api';
import { request } from './client';
jest.mock('./client', () => ({ request: jest.fn() }));
it('loads document metadata separately because web bootstrap only returns documentCount', async () => {
  const account = {
    user: { id: 'u1', name: 'User', email: 'u@example.test' },
    documentCount: 1,
    version: '1',
  };
  const documents = [{ id: 'doc1', originalName: 'passport.pdf' }];
  (request as jest.Mock).mockImplementation((path: string) =>
    Promise.resolve(path === '/api/bootstrap' ? account : documents),
  );
  const result = await userApi.bootstrap();
  expect(result.documents[0]).toMatchObject(documents[0]);
  expect(request).toHaveBeenCalledWith('/api/bootstrap', {
    requiresAuth: true,
  });
  expect(request).toHaveBeenCalledWith('/documents', { requiresAuth: true });
});
