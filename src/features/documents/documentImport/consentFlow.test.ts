import { Alert } from 'react-native';
import { preferencesApi } from '../../../api/preferences.api';
import { startConsentedImport } from './consentFlow';

afterEach(() => jest.restoreAllMocks());

it('passes all selected files and the account preference to the import callback', async () => {
  jest.spyOn(preferencesApi, 'get').mockResolvedValue({
    country: null,
    passportCountry: null,
    homeCurrency: null,
    appearance: 'system',
    aiProcessingEnabled: true,
  });
  const files = [{ path: '/first' }, { path: '/second' }];
  const onConsent = jest.fn();
  await startConsentedImport({ select: async () => files, onConsent });
  expect(onConsent).toHaveBeenCalledWith(files, true);
});

it('does not start an import when selection is cancelled', async () => {
  jest.spyOn(preferencesApi, 'get').mockResolvedValue({
    country: null, passportCountry: null, homeCurrency: null,
    appearance: 'system', aiProcessingEnabled: false,
  });
  const onConsent = jest.fn();
  await startConsentedImport({ select: async () => undefined, onConsent });
  expect(onConsent).not.toHaveBeenCalled();
});

it('reports selection failures', async () => {
  jest.spyOn(preferencesApi, 'get').mockResolvedValue({
    country: null, passportCountry: null, homeCurrency: null,
    appearance: 'system', aiProcessingEnabled: false,
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const onConsent = jest.fn();
  await startConsentedImport({
    select: async () => { throw new Error('Cannot access files'); },
    onConsent,
  });
  expect(alert).toHaveBeenCalledWith('Unable to select document', 'Cannot access files');
  expect(onConsent).not.toHaveBeenCalled();
});

it('does not select or upload when the AI preference cannot be checked', async () => {
  jest.spyOn(preferencesApi, 'get').mockRejectedValue(new Error('Network unavailable'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const select = jest.fn();
  const onConsent = jest.fn();
  await startConsentedImport({ select, onConsent });
  expect(alert).toHaveBeenCalledWith('Unable to check AI preference', 'Network unavailable');
  expect(select).not.toHaveBeenCalled();
  expect(onConsent).not.toHaveBeenCalled();
});
