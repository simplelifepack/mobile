import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  wealthApi,
  type WealthHandoffSendResponse,
  type WealthHandoffSummary,
} from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { WealthHandoffModal } from './WealthScreen';

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
}));
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { id: 'user-1', name: 'Divya' } } }),
}));
jest.mock('../../api/wealth.api', () => ({
  wealthApi: { handoffSummary: jest.fn(), sendHandoff: jest.fn() },
}));

const summary: WealthHandoffSummary = {
  generatedAt: '2026-01-01',
  smsSupported: true,
  smsConfigured: true,
  recipients: {
    family: [
      {
        id: 'one',
        name: 'Sam',
        email: 'sam@example.com',
        relationship: 'Parent',
        accessType: 'FAMILY_MEMBER',
        accessTypeLabel: 'Full member',
        canReceiveHandoff: true,
        verificationStatus: 'verified',
        type: 'family',
        hasPhone: true,
      },
    ],
    emergency: [],
  },
  handoffTypes: [
    {
      type: 'family',
      label: 'Family',
      contents: ['Wealth register', 'Attached documents'],
      excluded: ['Health records', 'Personal notes'],
      counts: {
        assets: 2,
        insurance: 1,
        loans: 1,
        financialRecords: 1,
        documents: 4,
        images: 1,
      },
    },
  ],
};

async function renderHandoff(
  value: WealthHandoffSummary,
  onEditQuietPeriod?: () => void,
  onManageTrustedPeople?: () => void,
) {
  jest.mocked(wealthApi.handoffSummary).mockResolvedValue(value);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthHandoffModal
          onClose={jest.fn()}
          onEditQuietPeriod={onEditQuietPeriod}
          onManageTrustedPeople={onManageTrustedPeople}
        />
      </AppThemeProvider>,
    );
  });
  return renderer;
}

function PersistentHandoffHarness() {
  const [visible, setVisible] = React.useState(true);
  return (
    <AppThemeProvider>
      <Button title="Reopen handoff" onPress={() => setVisible(true)} />
      <WealthHandoffModal visible={visible} onClose={() => setVisible(false)} />
    </AppThemeProvider>
  );
}

async function continueToConsent(
  renderer: ReactTestRenderer.ReactTestRenderer,
) {
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title.startsWith('Continue with'))!
      .props.onPress();
  });
}

async function reviewHandoff(renderer: ReactTestRenderer.ReactTestRenderer) {
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Review handoff')!
      .props.onPress();
  });
}

function textContent(value: unknown): string {
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
}

async function acknowledgeImmediateSend(
  renderer: ReactTestRenderer.ReactTestRenderer,
) {
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Confirm immediate SOS handoff',
      )[0]
      .props.onPress();
  });
}

async function releaseHandoff(renderer: ReactTestRenderer.ReactTestRenderer) {
  await continueToConsent(renderer);
  await acknowledgeImmediateSend(renderer);
  await reviewHandoff(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title.startsWith('Release handoff'))!
      .props.onPress();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(wealthApi.sendHandoff).mockResolvedValue({
    message: 'completed',
    results: [
      {
        recipientId: 'one',
        email: 'sam@example.com',
        handoffType: 'family',
        sent: true,
        sms: { status: 'accepted' },
      },
    ],
  });
});

it('requests SMS with the email only after consent and shows the separate outcome', async () => {
  const renderer = await renderHandoff(summary);
  const release = () =>
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title.startsWith('Release handoff'))!;
  expect(
    renderer.root
      .findAllByType(Button)
      .some(node => node.props.title.startsWith('Continue with 1')),
  ).toBe(true);
  await continueToConsent(renderer);
  const review = () =>
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Review handoff')!;
  expect(review().props.disabled).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.children === 'Your Wealth register'),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.children === '5 entries'),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.children === '5 documents'),
  ).toBe(true);
  await acknowledgeImmediateSend(renderer);
  expect(review().props.disabled).toBe(false);
  await reviewHandoff(renderer);
  expect(release().props.disabled).toBe(false);
  expect(release().props.title).toBe('Release handoff now');
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => textContent(node.props.children) === 'To Sam'),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node => textContent(node.props.children) === '1 verified email address',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          textContent(node.props.children) === 'Wealth register + 5 documents',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          textContent(node.props.children) ===
          'Device-only preference · does not schedule delivery',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          textContent(node.props.children) ===
          'This handoff will send immediately',
      ),
  ).toBe(true);
  await act(async () => {
    release().props.onPress();
  });
  expect(wealthApi.sendHandoff).toHaveBeenCalledWith({
    familyRecipientIds: ['one'],
    emergencyRecipientIds: [],
    sendSms: true,
  });
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node =>
        JSON.stringify(node.props.children).includes('delivery not confirmed'),
      ),
  ).toBe(true);
});

it('keeps older servers email-only instead of sending an unsupported field', async () => {
  const renderer = await renderHandoff({ ...summary, smsSupported: undefined });
  await continueToConsent(renderer);
  await acknowledgeImmediateSend(renderer);
  await reviewHandoff(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title.startsWith('Release handoff'))!
      .props.onPress();
  });
  expect(wealthApi.sendHandoff).toHaveBeenCalledWith({
    familyRecipientIds: ['one'],
    emergencyRecipientIds: [],
  });
});

it('does not let unsupported recipients count as selected or be sent', async () => {
  const other: WealthHandoffSummary['recipients']['family'][number] = {
    ...summary.recipients.family[0],
    id: 'other',
    name: 'Other contact',
    email: 'other@example.com',
    type: 'other',
  };
  const renderer = await renderHandoff({
    ...summary,
    recipients: { ...summary.recipients, other: [other] },
  });
  const row = renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'checkbox' &&
      node.props.accessibilityState?.disabled,
  )[0];
  expect(row).toBeDefined();
  expect(row.props.accessibilityState.checked).toBe(false);
  await continueToConsent(renderer);
  await acknowledgeImmediateSend(renderer);
  await reviewHandoff(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title.startsWith('Release handoff'))!
      .props.onPress();
  });
  expect(wealthApi.sendHandoff).toHaveBeenCalledWith({
    familyRecipientIds: ['one'],
    emergencyRecipientIds: [],
    sendSms: true,
  });
});

it('keeps Continue disabled when no trusted person can receive a handoff', async () => {
  const renderer = await renderHandoff({
    ...summary,
    recipients: {
      ...summary.recipients,
      family: [{ ...summary.recipients.family[0], canReceiveHandoff: false }],
    },
  });
  const continueButton = renderer.root
    .findAllByType(Button)
    .find(node => node.props.title.startsWith('Continue with 0'));
  expect(continueButton?.props.disabled).toBe(true);
});

it('shows per-recipient-group totals without double-counting registers', async () => {
  const emergencyRecipient = {
    ...summary.recipients.family[0],
    id: 'emergency',
    name: 'Venkat',
    type: 'emergency' as const,
    accessType: 'EMERGENCY_ACCESS' as const,
  };
  const renderer = await renderHandoff({
    ...summary,
    recipients: {
      ...summary.recipients,
      emergency: [emergencyRecipient],
    },
    handoffTypes: [
      ...summary.handoffTypes,
      {
        type: 'emergency',
        label: 'Emergency',
        contents: ['Wealth register'],
        excluded: [],
        counts: {
          assets: 3,
          insurance: 2,
          loans: 1,
          financialRecords: 1,
          documents: 1,
          images: 0,
        },
      },
    ],
  });
  await continueToConsent(renderer);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          node.props.children === 'Family: 5 entries · Emergency: 7 entries',
      ),
  ).toBe(true);
});

it.each([
  {
    title: 'Handoff delivered',
    results: [
      {
        recipientId: 'one',
        email: 'sam@example.com',
        handoffType: 'family' as const,
        sent: true,
      },
    ],
  },
  {
    title: 'Handoff partially delivered',
    results: [
      {
        recipientId: 'one',
        email: 'sam@example.com',
        handoffType: 'family' as const,
        sent: true,
      },
      {
        recipientId: 'two',
        email: 'lee@example.com',
        handoffType: 'family' as const,
        sent: false,
        reason: 'delivery_failed' as const,
      },
    ],
  },
  {
    title: 'Handoff delivery failed',
    results: [
      {
        recipientId: 'one',
        email: 'sam@example.com',
        handoffType: 'family' as const,
        sent: false,
        reason: 'invalid_recipient' as const,
      },
    ],
  },
])('shows the specific $title outcome', async ({ title, results }) => {
  jest.mocked(wealthApi.sendHandoff).mockResolvedValue({
    message: 'completed',
    results,
  });
  const renderer = await renderHandoff(summary);
  await releaseHandoff(renderer);

  const displayedText = renderer.root
    .findAllByType(AppText)
    .map(node => textContent(node.props.children))
    .join(' ');
  expect(displayedText).toContain(title);
});

it('explains that already-sent handoffs cannot be revoked and offers future access management', async () => {
  const onManageTrustedPeople = jest.fn();
  const renderer = await renderHandoff(
    summary,
    undefined,
    onManageTrustedPeople,
  );
  await releaseHandoff(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Revoke handoff access')!
      .props.onPress();
  });

  const displayedText = renderer.root
    .findAllByType(AppText)
    .map(node => textContent(node.props.children))
    .join(' ');
  expect(displayedText).toContain('Sent links can’t be revoked from this app');
  expect(displayedText).toContain(
    'Removing a trusted person prevents future handoffs',
  );
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Manage trusted people')!
      .props.onPress();
  });
  expect(onManageTrustedPeople).toHaveBeenCalledTimes(1);
});

it('retains sending status when returning to Wealth and reopening the handoff', async () => {
  let resolveSend!: (response: WealthHandoffSendResponse) => void;
  const pendingResponse = new Promise<WealthHandoffSendResponse>(resolve => {
    resolveSend = resolve;
  });
  jest.mocked(wealthApi.sendHandoff).mockReturnValue(pendingResponse);
  jest.mocked(wealthApi.handoffSummary).mockResolvedValue(summary);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<PersistentHandoffHarness />);
  });
  await continueToConsent(renderer);
  await acknowledgeImmediateSend(renderer);
  await reviewHandoff(renderer);

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Release handoff now')!
      .props.onPress();
    await Promise.resolve();
  });

  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => textContent(node.props.children) === 'Sending handoff'),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          textContent(node.props.children) === 'Sending secure access links…',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node =>
        textContent(node.props.children).includes(
          'Included in current send request · sam@example.com',
        ),
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(Button)
      .some(
        node => node.props.title === 'Back to Wealth' && !node.props.disabled,
      ),
  ).toBe(true);

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Back to Wealth')!
      .props.onPress();
  });
  expect(wealthApi.sendHandoff).toHaveBeenCalledTimes(1);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Reopen handoff')!
      .props.onPress();
  });
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => textContent(node.props.children) === 'Sending handoff'),
  ).toBe(true);
  expect(wealthApi.sendHandoff).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveSend({
      message: 'completed',
      results: [
        {
          recipientId: 'one',
          email: 'sam@example.com',
          handoffType: 'family',
          sent: true,
        },
      ],
    });
    await pendingResponse;
  });
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node =>
        textContent(node.props.children).includes('Email accepted'),
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          textContent(node.props.children) ===
          'Email accepted for 1 trusted person',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node => textContent(node.props.children) === 'Wealth register sent',
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node =>
        textContent(node.props.children).includes('Read status unavailable'),
      ),
  ).toBe(true);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node =>
        textContent(node.props.children).includes(
          'The current service does not provide link expiry or revocation',
        ),
      ),
  ).toBe(true);
});

it('shows a clearly labeled quiet-period preview without scheduling or sending', async () => {
  const renderer = await renderHandoff(summary);
  await continueToConsent(renderer);
  await acknowledgeImmediateSend(renderer);
  await reviewHandoff(renderer);

  await act(async () => {
    renderer.root
      .findByProps({
        accessibilityLabel: 'Preview quiet-period active screen',
      })
      .props.onPress();
  });

  const previewText = renderer.root
    .findAllByType(AppText)
    .map(node => textContent(node.props.children))
    .join(' ');
  expect(previewText).toContain('UI preview · Not scheduled');
  expect(previewText).toContain('Preview only · no handoff is scheduled');
  expect(previewText).toContain('No links or documents have been sent.');
  expect(previewText).toContain('23h 59m remaining');
  expect(previewText).toContain('Example countdown · not live');
  expect(previewText).toContain(
    'Leaving this preview does not create, cancel, or send a handoff.',
  );
  expect(
    renderer.root.findAllByType(Button).map(node => node.props.title),
  ).toEqual(['Back to Wealth', 'Return to review']);
  expect(wealthApi.sendHandoff).not.toHaveBeenCalled();

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Return to review')!
      .props.onPress();
  });
  expect(
    renderer.root
      .findAllByType(Button)
      .some(node => node.props.title === 'Release handoff now'),
  ).toBe(true);
  expect(wealthApi.sendHandoff).not.toHaveBeenCalled();
});

it('opens quiet-period preferences from the selection step', async () => {
  const onEditQuietPeriod = jest.fn();
  const renderer = await renderHandoff(summary, onEditQuietPeriod);
  await act(async () => {
    renderer.root
      .findByProps({ accessibilityLabel: 'Quiet period preference' })
      .props.onPress();
  });
  expect(onEditQuietPeriod).toHaveBeenCalledTimes(1);
});
