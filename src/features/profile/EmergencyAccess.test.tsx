import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import * as Keychain from 'react-native-keychain';
import { trustApi, type TrustMember } from '../../api/trust.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { HealthField } from '../health/components/HealthForms';
import { EmergencyAccessScreen } from './EmergencyAccessScreen';
import { EmergencyPersonSheet } from './EmergencyPersonSheet';
import { describePermissions, permissionsForAccess } from './emergencyAccess';

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
}));
jest.mock('../../api/trust.api', () => ({
  trustApi: {
    get: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useIsFocused: () => true,
}));
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { id: 'user-1', name: 'Divya' } } }),
}));
jest.mock('../../components/primitives/Screen', () => ({
  Screen: ({ children }: React.PropsWithChildren) => children,
}));

const member: TrustMember = {
  id: 'one',
  name: 'Alex',
  email: 'alex@example.com',
  relation: 'PARENT',
  relationLabel: 'Mother',
  customRelation: 'Mother',
  dateOfBirth: '1980-01-01',
  bloodGroup: 'O+',
  accessType: { id: 'FAMILY_MEMBER', name: 'Full member' },
  status: 'ACTIVE',
  invitationStatus: 'ACCEPTED',
  permissions: permissionsForAccess('FAMILY_MEMBER'),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(trustApi.get).mockResolvedValue({ members: [member] });
  jest.mocked(trustApi.update).mockResolvedValue(member);
});

function contactRow(
  renderer: ReactTestRenderer.ReactTestRenderer,
  name: string,
) {
  return renderer.root.findAll(
    node =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith(`Edit ${name},`),
  )[0];
}

async function openContact(
  renderer: ReactTestRenderer.ReactTestRenderer,
  name = 'Alex',
) {
  await act(async () => {
    contactRow(renderer, name).props.onPress();
  });
}

it('matches web permission sets and displays actual custom permissions', () => {
  expect(permissionsForAccess('EMERGENCY_ACCESS')).toEqual([
    { module: 'DOCUMENTS', canView: true, canDownload: false },
    { module: 'HEALTH', canView: false, canDownload: false },
    { module: 'WEALTH', canView: true, canDownload: true },
  ]);
  expect(
    describePermissions([
      { module: 'HEALTH', canView: true, canDownload: false },
    ]),
  ).toBe('Documents: no access. Health: view. Wealth: no access.');
});

it('validates new trusted people and requires consent before sending verification', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyPersonSheet onClose={jest.fn()} onSave={onSave} />
      </AppThemeProvider>,
    );
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save and send verification')!
      .props.onPress();
  });
  expect(onSave).not.toHaveBeenCalled();
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.accessibilityRole === 'alert'),
  ).toBe(true);
  await act(async () => {
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Full name *')!
      .props.onChangeText('Sam');
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Email address *')!
      .props.onChangeText('sam@example.com');
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Relationship: Choose relationship',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityLabel === 'Parent')[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save and send verification')!
      .props.onPress();
  });
  expect(onSave).not.toHaveBeenCalled();
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          node.props.children ===
          'Confirm that you have this person’s permission to add them.',
      ),
  ).toBe(true);
  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityRole === 'checkbox')[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save and send verification')!
      .props.onPress();
  });
  expect(alert).toHaveBeenCalledWith(
    'Confirm access',
    expect.stringContaining('Wealth: view and download'),
    expect.any(Array),
  );
  const buttons = alert.mock.calls[0][2]!;
  await act(async () => {
    buttons[1].onPress!();
  });
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Sam',
      email: 'sam@example.com',
      relation: 'PARENT',
      accessTypeCode: 'EMERGENCY_ACCESS',
      permissions: permissionsForAccess('EMERGENCY_ACCESS'),
    }),
  );
  alert.mockRestore();
});

it('updates an edited trusted person email', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await openContact(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Email address *')!
      .props.onChangeText('alex.new@example.com');
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(trustApi.update).toHaveBeenCalledWith(
    'one',
    expect.objectContaining({ email: 'alex.new@example.com' }),
  );
});

it('shows the designed empty trusted-people state and its add action', async () => {
  jest.mocked(trustApi.get).mockResolvedValue({ members: [] });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('Trusted people');
  expect(text).toContain('Divya · You');
  expect(text).toContain('Choose someone you trust');
  expect(text).toContain(
    'No trusted people added. Nothing can be shared until you add someone and verify at least one contact.',
  );
  expect(text).toContain('Who should I add?');
  expect(text).toContain('Quiet period · 24 hours');
  expect(
    renderer.root.findAllByType(Button).map(node => node.props.title),
  ).toContain('Add trusted person');
});

it('shows trusted contact cards and SOS controls when people exist', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('People your family can rely on');
  expect(text).toContain('Only people you select during an SOS handoff');
  expect(text).toContain('Alex · Mother');
  expect(text).toContain('alex@example.com');
  expect(text).toContain('Email verified');
  expect(text).toContain('Quiet period');
  expect(text).toContain('You control every handoff');
  expect(
    renderer.root.findAllByType(Button).map(node => node.props.title),
  ).toContain('Add trusted person');
});

it('marks a pending trusted contact as ineligible until email verification', async () => {
  const pendingMember: TrustMember = {
    ...member,
    id: 'pending',
    name: 'Arjun Rao',
    email: 'arjun.rao@example.com',
    relation: 'SIBLING',
    relationLabel: 'Brother',
    customRelation: null,
    status: 'ACTIVE',
    invitationStatus: 'PENDING',
  };
  jest.mocked(trustApi.get).mockResolvedValue({ members: [pendingMember] });

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });

  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('Arjun Rao · Brother');
  expect(text).toContain('arjun.rao@example.com');
  expect(text).toContain(
    'Email verification pending · Not eligible for handoff',
  );
  expect(text).not.toContain(
    'Arjun Rao · Brother arjun.rao@example.com Email verified',
  );
});

it('saves the chosen quiet period locally and clearly warns that delivery stays immediate', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityLabel === 'Set quiet period')[0]
      .props.onPress();
  });
  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('Quiet-period preference');
  expect(text).toContain('For future handoffs');
  expect(text).toContain('does not schedule or delay handoff delivery');
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'radio' &&
          node.props.accessibilityLabel === '48 hours',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save quiet period')!
      .props.onPress();
  });
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith('readiness', '48', {
    service: 'com.readiness.quiet-period.user-1',
    accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  });
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes(
            '48 hours · device only; delivery remains immediate',
          ),
      ),
  ).toBe(true);
});

it('shows update errors and reloads after a failed edit', async () => {
  jest.mocked(trustApi.update).mockRejectedValue(new Error('Update failed'));
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await openContact(renderer);
  await act(async () => {
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Full name *')!
      .props.onChangeText('Alex Updated');
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(trustApi.get).toHaveBeenCalledTimes(2);
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes('Update failed'),
      ),
  ).toBe(true);
});

it('keeps existing permissions and email unchanged while editing other details', async () => {
  const custom = {
    ...member,
    permissions: [
      { module: 'DOCUMENTS' as const, canView: true, canDownload: false },
    ],
  };
  jest.mocked(trustApi.get).mockResolvedValue({ members: [custom] });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await openContact(renderer);
  expect(
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Email address *')!.props.editable,
  ).toBe(true);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(trustApi.update).toHaveBeenCalledWith('one', {
    name: 'Alex',
    relation: 'PARENT',
    customRelation: 'Mother',
  });
});

it('matches the edit form fields and shows email verification and removal actions', async () => {
  const onRemove = jest.fn().mockResolvedValue(undefined);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyPersonSheet
          person={member}
          onClose={jest.fn()}
          onSave={jest.fn().mockResolvedValue(undefined)}
          onRemove={onRemove}
        />
      </AppThemeProvider>,
    );
  });
  expect(
    renderer.root.findAllByType(HealthField).map(node => node.props.label),
  ).toEqual(['Full name *', 'Email address *', 'Phone (optional)']);
  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('Changing an email requires verification');
  expect(text).toContain(
    'The updated address must be verified before it can receive future handoffs.',
  );
  expect(
    renderer.root.findAllByType(Button).map(node => node.props.title),
  ).toEqual(['Save changes', 'Cancel']);
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Review trusted person removal',
      )[0]
      .props.onPress();
  });
  const removalText = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(removalText).toContain('Remove Alex');
  expect(removalText).toContain('Alex · Mother');
  expect(removalText).toContain('alex@example.com');
  expect(removalText).toContain(
    'This does not revoke a register already shared with them.',
  );
  expect(
    renderer.root.findAllByType(Button).map(node => node.props.title),
  ).toEqual(['Keep trusted person']);
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Keep trusted person')!
      .props.onPress();
  });
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.children === 'Edit trusted person'),
  ).toBe(true);
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Review trusted person removal',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Confirm remove trusted person',
      )[0]
      .props.onPress();
  });
  await act(async () => {});
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it('removes a trusted person only after confirming the removal screen', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await openContact(renderer);
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Review trusted person removal',
      )[0]
      .props.onPress();
  });
  expect(trustApi.remove).not.toHaveBeenCalled();
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Keep trusted person')!
      .props.onPress();
  });
  expect(trustApi.remove).not.toHaveBeenCalled();
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Review trusted person removal',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Confirm remove trusted person',
      )[0]
      .props.onPress();
  });
  expect(trustApi.remove).toHaveBeenCalledWith('one');
});

it('shows remaining trusted people and quiet-period controls after a removal', async () => {
  const remainingMember: TrustMember = {
    ...member,
    id: 'two',
    name: 'Venkat Rao',
    email: 'venkat.rao@example.com',
    relation: 'SPOUSE',
    relationLabel: 'Spouse',
    customRelation: null,
    phone: '+91 98450 12345',
  };
  jest
    .mocked(trustApi.get)
    .mockResolvedValueOnce({ members: [member, remainingMember] })
    .mockResolvedValueOnce({ members: [remainingMember] });
  jest.mocked(trustApi.remove).mockResolvedValue(undefined);

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyAccessScreen />
      </AppThemeProvider>,
    );
  });
  await openContact(renderer, member.name);
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Review trusted person removal',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Confirm remove trusted person',
      )[0]
      .props.onPress();
  });
  await act(async () => {});

  const text = renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('People your family can rely on');
  expect(text).toContain('Venkat Rao · Spouse');
  expect(text).toContain('venkat.rao@example.com');
  expect(text).toContain('+91 98450 12345');
  expect(text).not.toContain('Alex · Mother');
  expect(text).toContain('Quiet period');
  expect(text).toContain('24 hours · device only; delivery remains immediate');
  expect(trustApi.remove).toHaveBeenCalledWith(member.id);
  expect(trustApi.get).toHaveBeenCalledTimes(2);
});

it('clears the old relationship label when editing a contact to Other', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyPersonSheet
          person={member}
          onClose={jest.fn()}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });

  expect(
    renderer.root
      .findAllByType(AppText)
      .some(node => node.props.children === 'Edit trusted person'),
  ).toBe(true);

  await act(async () => {
    renderer.root
      .findAll(
        node => node.props.accessibilityLabel === 'Relationship: Parent',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityLabel === 'Other')[0]
      .props.onPress();
  });

  const relationDescription = renderer.root
    .findAllByType(HealthField)
    .find(node => node.props.label === 'Relationship description *');
  expect(relationDescription?.props.value).toBe('');
  await act(async () => {
    relationDescription!.props.onChangeText('Family friend');
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      relation: 'OTHER',
      customRelation: 'Family friend',
    }),
  );
});

it('allows a new person to be saved without date of birth or blood group', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyPersonSheet onClose={jest.fn()} onSave={onSave} />
      </AppThemeProvider>,
    );
  });
  await act(async () => {
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Full name *')!
      .props.onChangeText('Sam');
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Email address *')!
      .props.onChangeText('sam@example.com');
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Relationship: Choose relationship',
      )[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityLabel === 'Parent')[0]
      .props.onPress();
    renderer.root
      .findAll(node => node.props.accessibilityRole === 'checkbox')[0]
      .props.onPress();
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save and send verification')!
      .props.onPress();
  });
  await act(async () => {
    alert.mock.calls[0][2]![1].onPress!();
  });
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Sam', email: 'sam@example.com' }),
  );
  expect(onSave.mock.calls[0][0]).not.toHaveProperty('dateOfBirth');
  expect(onSave.mock.calls[0][0]).not.toHaveProperty('bloodGroup');
  alert.mockRestore();
});

it('validates and saves the SOS phone in international format', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EmergencyPersonSheet
          person={member}
          onClose={jest.fn()}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });
  const phone = () =>
    renderer.root
      .findAllByType(HealthField)
      .find(node => node.props.label === 'Phone (optional)')!;
  await act(async () => {
    phone().props.onChangeText('1234');
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(onSave).not.toHaveBeenCalled();
  expect(
    renderer.root
      .findAllByType(AppText)
      .some(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes('international format'),
      ),
  ).toBe(true);
  await act(async () => {
    phone().props.onChangeText('+15555550123');
  });
  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save changes')!
      .props.onPress();
  });
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ phone: '+15555550123' }),
  );
});
