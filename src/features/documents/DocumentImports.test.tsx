import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppState, Linking } from 'react-native';
import { DocumentImports } from './DocumentImports';
import { digilockerApi } from '../../api/digilocker.api';
import { digiLockerSessionStorage } from '../../api/digilockerSessionStorage';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Button } from '../../components/primitives/Button';
jest.mock('../../app/store/hooks', () => ({ useAppSelector: () => 'owner' }));
jest.mock('../../api/client', () => ({ invalidateReadCaches: jest.fn() }));
jest.mock('../../api/mobile.api', () => ({ mobileApi: {} }));
jest.mock('../../api/digilocker.api', () => ({
  digilockerApi: {
    status: jest.fn(),
    start: jest.fn(),
    sessionStatus: jest.fn(),
    documents: jest.fn(),
    import: jest.fn(),
    cancel: jest.fn(),
  },
}));
jest.mock('../../api/digilockerSessionStorage', () => ({
  digiLockerSessionStorage: {
    read: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../shared/FeatureUI', () => ({
  ...jest.requireActual('../shared/resourceHooks'),
  Stack: require('react-native').View,
  AppText: require('react-native').Text,
  Button: require('../../components/primitives/Button').Button,
  Choice: () => null,
  Details: () => null,
  ResourceStatus: () => null,
}));
const api = jest.mocked(digilockerApi);
const storage = jest.mocked(digiLockerSessionStorage);
const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const pending = {
  id,
  status: 'PENDING',
  expiresAt: '2026-12-01T00:00:00Z',
  progress: [],
};
let tree: Renderer.ReactTestRenderer;
let refresh: jest.Mock;
const button = (title: string) =>
  tree.root.findAllByType(Button).find(node => node.props.title === title)!;
async function press(title: string) {
  await act(async () => {
    button(title).props.onPress();
  });
}
async function render(returnSession?: string, returnError?: string) {
  refresh = jest.fn();
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <DocumentImports
          openRequest={1}
          returnSession={returnSession}
          returnError={returnError}
          onRefresh={refresh}
        />
      </AppThemeProvider>,
    );
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: 'active',
  });
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  storage.read.mockResolvedValue(null);
  api.status.mockResolvedValue({ configured: true, message: null });
  api.start.mockResolvedValue({
    ...pending,
    authorizationUrl:
      'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize',
  });
  api.sessionStatus.mockResolvedValue(pending);
  api.cancel.mockResolvedValue({ ...pending, status: 'CANCELLED' });
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
it('persists the pending connection before opening the provider and can disconnect', async () => {
  await render();
  await press('Connect DigiLocker');
  expect(storage.save).toHaveBeenCalledWith(
    'owner',
    id,
    expect.stringContaining('https://digilocker.meripehchaan.gov.in/'),
  );
  expect(Linking.openURL).toHaveBeenCalledWith(
    expect.stringContaining('https://digilocker.meripehchaan.gov.in/'),
  );
  await press('Cancel connection');
  expect(api.cancel).toHaveBeenCalledWith(id);
  expect(storage.clear).toHaveBeenCalledWith('owner');
});
it('shows unavailable configuration and recovers from browser-opening failure', async () => {
  api.status.mockResolvedValueOnce({
    configured: false,
    message: 'Provider unavailable',
  });
  await render();
  await press('Connect DigiLocker');
  expect(JSON.stringify(tree.toJSON())).toContain('Provider unavailable');
  expect(api.start).not.toHaveBeenCalled();
  jest
    .mocked(Linking.openURL)
    .mockRejectedValueOnce(new Error('Browser unavailable'));
  await press('Connect DigiLocker');
  expect(api.cancel).toHaveBeenCalledWith(id);
  expect(storage.clear).toHaveBeenCalledWith('owner');
  expect(JSON.stringify(tree.toJSON())).toContain('Browser unavailable');
  expect(button('Connect DigiLocker').props.disabled).toBe(false);
});
it('rejects a callback for a different account session without fetching it', async () => {
  storage.read.mockResolvedValue(null);
  await render(id);
  expect(JSON.stringify(tree.toJSON())).toContain('does not match');
  expect(api.sessionStatus).not.toHaveBeenCalled();
});
it('copies only selected supported documents with one import action, polls progress and labels duplicates', async () => {
  storage.read.mockResolvedValue({ id });
  api.sessionStatus.mockResolvedValue({ ...pending, status: 'AUTHENTICATED' });
  const supported = {
    reference: 'one',
    name: 'Certificate',
    type: 'Certificate',
    issuer: 'Test issuer',
    issueDate: null,
    modifiedAt: '2026-01-02',
    mimeType: 'application/pdf',
    available: true,
    reason: null,
  };
  api.documents.mockResolvedValue({
    session: { ...pending, status: 'AUTHENTICATED' },
    documents: [
      supported,
      {
        ...supported,
        reference: 'restricted',
        name: 'Restricted',
        available: false,
        reason: 'Unsupported document',
      },
    ],
  });
  api.import.mockResolvedValue({ ...pending, status: 'IMPORTING' });
  await render(id);
  await press('Select all supported documents');
  expect(button('Import selected documents').props.disabled).toBe(false);
  api.sessionStatus.mockResolvedValue({
    ...pending,
    status: 'AUTHENTICATED',
    progress: [
      {
        reference: 'one',
        phase: 'Completed',
        duplicate: true,
        documentId: 'stored',
      },
    ],
  });
  await press('Import selected documents');
  expect(api.import).toHaveBeenCalledWith(id, ['one']);
  expect(refresh).toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('Already imported');
  expect(JSON.stringify(tree.toJSON())).toContain(
    '0 imported · 1 already in your documents',
  );
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Your existing AI processing preference applies.',
  );
});
it.each(['EXPIRED', 'FAILED', 'CONSENT_DENIED'])(
  'shows %s with a reconnect action and clears selection',
  async status => {
    storage.read.mockResolvedValue({ id });
    api.sessionStatus.mockResolvedValue({ ...pending, status });
    await render(id);
    expect(JSON.stringify(tree.toJSON())).toMatch(/expired|failed|declined/);
    expect(button('Connect again').props.disabled).toBe(false);
    expect(button('Import selected documents')?.props.disabled ?? true).toBe(
      true,
    );
  },
);

it('keeps pending sign-in actionable and hides import controls until documents are ready', async () => {
  const authorizationUrl =
    'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?state=opaque-state';
  storage.read.mockResolvedValue({ id, authorizationUrl });
  await render(id);
  expect(button('Continue in DigiLocker').props.disabled).toBe(false);
  expect(button('Import selected documents')).toBeUndefined();
  expect(JSON.stringify(tree.toJSON())).not.toContain('Consent to copy');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Status:');
  await press('Continue in DigiLocker');
  expect(Linking.openURL).toHaveBeenCalledWith(authorizationUrl);
  expect(api.start).not.toHaveBeenCalled();
  expect(api.cancel).not.toHaveBeenCalled();
});
it('can restart a pending session saved by an older app instead of leaving the user stuck', async () => {
  storage.read.mockResolvedValue({ id });
  await render(id);
  expect(button('Sign in again').props.disabled).toBe(false);
  await press('Sign in again');
  expect(api.cancel).toHaveBeenCalledWith(id);
  expect(api.start).toHaveBeenCalledTimes(1);
});

it('allows a fresh start when a pending browser attempt cannot be completed', async () => {
  storage.read.mockResolvedValue({
    id,
    authorizationUrl:
      'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?state=old',
  });
  await render(id);
  await press('Start over');
  expect(api.cancel).toHaveBeenCalledWith(id);
  expect(api.start).toHaveBeenCalledTimes(1);
});

it('opens an error-only return without accepting it as authorization', async () => {
  await render(undefined, 'consent_denied');
  expect(JSON.stringify(tree.toJSON())).toContain(
    'DigiLocker sign-in did not complete.',
  );
  expect(api.documents).not.toHaveBeenCalled();
  expect(api.import).not.toHaveBeenCalled();
});
it('recovers an error-only return using the account pending session and server status', async () => {
  storage.read.mockResolvedValue({ id });
  api.sessionStatus.mockResolvedValue({ ...pending, status: 'CONSENT_DENIED' });
  await render(undefined, 'authorization_failed');
  expect(api.sessionStatus).toHaveBeenCalledWith(id);
  expect(JSON.stringify(tree.toJSON())).toContain(
    'DigiLocker consent was declined.',
  );
  expect(api.documents).not.toHaveBeenCalled();
  expect(api.import).not.toHaveBeenCalled();
});
