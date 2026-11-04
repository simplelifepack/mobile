import { digiLockerReturnSession } from './digilockerReturn';
import { externalDestination } from './externalLinks';
const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
it('routes valid OAuth returns to the Documents tab without trusting the result as authentication', () => {
  for (const result of [
    'AUTHENTICATED',
    'CONSENT_DENIED',
    'FAILED',
    'EXPIRED',
    'CANCELLED',
  ]) {
    const url = `readiness://digilocker?digilocker=${id}&result=${result}`;
    expect(digiLockerReturnSession(url)).toBe(id);
    expect(externalDestination(url)).toEqual({
      screen: 'Main',
      params: { screen: 'Documents', params: { digilockerSession: id } },
    });
  }
});
it('rejects forged origins, credentials, malformed and duplicate parameters', () => {
  for (const url of [
    `https://evil.example/?digilocker=${id}&result=AUTHENTICATED`,
    `readiness://digilocker.evil?digilocker=${id}&result=AUTHENTICATED`,
    `readiness://digilocker/?digilocker=${id}&result=AUTHENTICATED`,
    `readiness://user@digilocker?digilocker=${id}&result=AUTHENTICATED`,
    `readiness://digilocker?digilocker=${id}&result=AUTHENTICATED&access_token=secret`,
    `readiness://digilocker?digilocker=${id}&digilocker=${id}`,
    `readiness://digilocker?digilocker=%ZZ&result=AUTHENTICATED`,
    `readiness://digilocker?digilocker=other&result=AUTHENTICATED`,
    `readiness://digilocker?digilocker=${id}&result=other`,
    `readiness://digilocker?digilocker=${id}&result=AUTHENTICATED#token`,
  ])
    expect(digiLockerReturnSession(url)).toBeNull();
});

it('handles the session/error return contract and rejects injected parameters', () => {
  expect(digiLockerReturnSession(`readiness://digilocker?session=${id}`)).toBe(
    id,
  );
  expect(externalDestination(`readiness://digilocker?session=${id}`)).toEqual({
    screen: 'Main',
    params: { screen: 'Documents', params: { digilockerSession: id } },
  });
  for (const error of [
    'consent_denied',
    'authorization_failed',
    'session_expired',
    'cancelled',
  ]) {
    expect(
      externalDestination(`readiness://digilocker?error=${error}`),
    ).toEqual({
      screen: 'Main',
      params: { screen: 'Documents', params: { digilockerError: error } },
    });
  }
  for (const query of [
    `session=${id}&error=cancelled`,
    `session=${id}&session=${id}`,
    'error=unknown',
    'error=cancelled&token=secret',
    'session=bad',
  ]) {
    expect(externalDestination(`readiness://digilocker?${query}`)).toBeNull();
  }
});
