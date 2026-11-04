import { externalDestination } from './externalLinks';
it('accepts only owned HTTPS origins and rejects malformed paths', () => {
  expect(
    externalDestination('https://evil.example/health?record=secret'),
  ).toBeNull();
  expect(
    externalDestination('https://readines.com.evil.example/health'),
  ).toBeNull();
  expect(externalDestination('http://readines.com/health')).toBeNull();
  expect(externalDestination('https://readines.com/invite/%ZZ')).toBeNull();
});
it('maps email links and exact record destinations without exposing reset tokens in paths', () => {
  expect(
    externalDestination('https://readines.com/reset-password?token=a%2Bb'),
  ).toEqual({ screen: 'ResetPassword', params: { token: 'a+b' } });
  expect(externalDestination('readiness://invite/abc')).toEqual({
    screen: 'Invitation',
    params: { token: 'abc' },
  });
  expect(
    externalDestination(
      'https://frontend-web-nine-amber.vercel.app/documents/identity/doc%201',
    ),
  ).toEqual({ screen: 'DocumentLibrary', params: { documentId: 'doc 1' } });
  expect(
    externalDestination('https://readines.com/packages?pack=visa'),
  ).toEqual({ screen: 'Packages', params: { slug: 'visa' } });
  expect(
    externalDestination(
      'https://readines.com/health?member=m1&record=r1&tab=Records',
    ),
  ).toEqual({
    screen: 'Health',
    params: { memberId: 'm1', recordId: 'r1', tab: 'Records' },
  });
});
