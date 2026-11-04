import { digilockerApi } from './digilocker.api';
import { request } from './client';
jest.mock('./client', () => ({ request: jest.fn() }));
it('uses the backend mobile return and consent contracts with authenticated uncached requests', () => {
  digilockerApi.start();
  expect(request).toHaveBeenLastCalledWith(
    '/api/integrations/digilocker/sessions',
    expect.objectContaining({
      requiresAuth: true,
      method: 'POST',
      body: {
        redirectUrl: 'readiness://digilocker',
        returnFormat: 'session-v1',
      },
    }),
  );
  digilockerApi.import('owned/id', ['issued']);
  expect(request).toHaveBeenLastCalledWith(
    '/api/integrations/digilocker/sessions/owned%2Fid/import',
    expect.objectContaining({
      requiresAuth: true,
      body: {
        references: ['issued'],
        consent: true,
        consentVersion: 'digilocker-copy-v1',
      },
    }),
  );
  digilockerApi.sessionStatus('owned/id');
  expect(request).toHaveBeenLastCalledWith(
    '/api/integrations/digilocker/sessions/owned%2Fid/status',
    { requiresAuth: true, dedupeMs: 0, cacheMs: 0 },
  );
  digilockerApi.cancel('owned');
  expect(request).toHaveBeenLastCalledWith(
    '/api/integrations/digilocker/sessions/owned/cancel',
    expect.objectContaining({ method: 'POST', requiresAuth: true }),
  );
});
