import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import type { PickedDocument } from '../../native/documentFiles';
import { UploadDocumentSheet } from '../documents/UploadDocumentSheet';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../../components/primitives/Button';
jest.mock('../shared/BottomSheet', () => ({
  BottomSheet: ({
    children,
    visible,
  }: React.PropsWithChildren<{ visible: boolean }>) =>
    visible ? children : null,
}));
jest.mock('../../native/captureDocuments', () => ({
  captureDocuments: jest.fn(),
}));
jest.mock('../documents/UploadDocumentSheet', () => ({
  UploadDocumentSheet: () => null,
}));
import Renderer, { act } from 'react-test-renderer';
import { HealthScreen } from './HealthScreen';
import { HealthIdentity } from './HealthOverview';
import { HealthPreparation } from './HealthPreparation';
import { DetailSheet } from '../shared/DetailSheet';
import { FeaturePage } from '../shared/FeatureUI';
import { RecordForm } from '../shared/RecordForm';
import { validateFields } from '../shared/formValidation';
import { ReadingDialog } from './ReadingDialog';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { TextInput } from '../../components/primitives/TextInput';
import { healthApi } from '../../api/health.api';
import { documentsApi } from '../../api/documents.api';
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({}),
  useFocusEffect: () => undefined,
}));
jest.mock('../../app/store/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => undefined,
}));
jest.mock('../shared/FeatureUI', () => ({
  ...jest.requireActual('../shared/FeatureUI'),
  FeaturePage: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../../api/health.api', () => ({
  healthApi: {
    members: jest.fn(),
    overview: jest.fn(),
    records: jest.fn(),
    timeline: jest.fn(),
    measurements: jest.fn(),
    createReminder: jest.fn().mockResolvedValue({}),
    createMedication: jest.fn().mockResolvedValue({}),
    createMember: jest.fn().mockResolvedValue({ id: 'new-profile' }),
    updateMember: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock('../../api/documents.api', () => ({
  documentsApi: { list: jest.fn() },
}));
it('shows measurements directly in Trends without a measurement search field', async () => {
  jest.mocked(healthApi.members).mockResolvedValue([
    {
      id: 'member',
      name: 'Test',
      relation: 'self',
      createdAt: '',
      updatedAt: '',
    },
  ]);
  jest
    .mocked(healthApi.overview)
    .mockResolvedValue({ trackedMetrics: [], upcoming: [] } as never);
  jest.mocked(healthApi.records).mockResolvedValue([]);
  jest.mocked(healthApi.timeline).mockResolvedValue([]);
  jest.mocked(healthApi.measurements).mockResolvedValue([
    {
      id: 'reading',
      sourceType: 'manual',
      metricKey: 'test',
      displayName: 'Synthetic measurement',
      value: 12,
      unit: 'units',
      measuredAt: '2026-10-31',
    },
  ] as never);
  jest.mocked(documentsApi.list).mockResolvedValue([]);
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <HealthScreen
          route={{ params: { memberId: 'member', tab: 'Measurements' } }}
        />
      </AppThemeProvider>,
    );
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Synthetic measurement');
  expect(
    tree.root
      .findAllByType(TextInput)
      .some(node => /search measurements/i.test(node.props.label)),
  ).toBe(false);
  for (const view of ['visit', 'emergency', 'insurance']) {
    await act(async () =>
      tree.root.findByType(HealthIdentity).props.onPrepare(view),
    );
    expect(tree.root.findByType(DetailSheet).props.title).toBe(
      view === 'visit'
        ? 'Prepare for a visit'
        : view === 'emergency'
          ? 'Emergency card'
          : 'Insurance card',
    );
    await act(async () => tree.root.findByType(DetailSheet).props.onClose());
  }
  await act(async () => tree.root.findByType(HealthIdentity).props.onEdit());
  expect(tree.root.findByType(RecordForm).props.title).toBe(
    'Edit health profile',
  );
  const profileFields = tree.root.findByType(RecordForm).props.fields;
  expect(
    validateFields(
      profileFields,
      Object.fromEntries(
        profileFields.map((field: { key: string; initial?: string }) => [
          field.key,
          field.initial ?? '',
        ]),
      ),
    ),
  ).toEqual({});
  await act(async () => tree.root.findByType(RecordForm).props.onClose());
  for (const [label, title] of [
    ['A reminder', 'Add reminder'],
    ['A medicine', 'Add medication'],
    ['A family member', 'Add health profile'],
  ]) {
    await act(async () =>
      tree.root
        .findByType(FeaturePage)
        .props.actions.find((item: { label: string }) => item.label === label)
        .onPress(),
    );
    expect(tree.root.findByType(RecordForm).props.title).toBe(title);
    const form = tree.root.findByType(RecordForm);
    if (label === 'A reminder') {
      await act(async () =>
        form.props.onSubmit({
          title: 'Synthetic reminder',
          type: 'appointment',
          dueDate: '2026-11-05',
          frequency: 'once',
        }),
      );
      expect(healthApi.createReminder).toHaveBeenCalledWith({
        memberId: 'member',
        title: 'Synthetic reminder',
        type: 'appointment',
        dueDate: '2026-11-05',
        frequency: 'once',
      });
    }
    if (label === 'A family member') {
      jest.mocked(healthApi.members).mockResolvedValue([
        {
          id: 'member',
          name: 'Test',
          relation: 'self',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'new-profile',
          name: 'Synthetic profile',
          relation: 'other',
          createdAt: '',
          updatedAt: '',
        },
      ]);
      await act(async () =>
        form.props.onSubmit({
          name: 'Synthetic profile',
          relation: 'other',
          conditions: 'Synthetic notes',
          bloodGroup: '',
          dateOfBirth: '',
        }),
      );
      expect(healthApi.createMember).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Synthetic profile',
          relation: 'other',
          conditions: 'Synthetic notes',
          bloodGroup: null,
          dateOfBirth: null,
        }),
      );
      expect(healthApi.updateMember).not.toHaveBeenCalled();
    }
    if (label === 'A medicine') {
      await act(async () =>
        form.props.onSubmit({
          name: 'Synthetic medicine',
          dose: 'Test dose',
          when: 'morning,night',
          meal: 'after_food',
          repeatRunsOut: '',
        }),
      );
      expect(healthApi.createMedication).toHaveBeenCalledWith('member', {
        name: 'Synthetic medicine',
        dose: 'Test dose',
        whenToTake: ['morning', 'night'],
        mealTiming: 'after_food',
        repeatRunsOut: null,
      });
    }

    await act(async () => tree.root.findByType(RecordForm).props.onClose());
  }
  await act(async () =>
    tree.root
      .findByType(FeaturePage)
      .props.actions.find(
        (item: { label: string }) => item.label === 'A reading',
      )
      .onPress(),
  );
  expect(tree.root.findByType(ReadingDialog).props.memberId).toBe(
    'new-profile',
  );
  await act(async () => tree.root.findByType(ReadingDialog).props.onClose());
  expect(tree.root.findByType(HealthPreparation).props.member.id).toBe(
    'new-profile',
  );
  const actions = tree.root.findByType(FeaturePage).props.actions;
  expect(
    actions.filter((item: { label: string }) => /Capture/.test(item.label)),
  ).toHaveLength(0);
  await act(async () =>
    actions
      .find((item: { label: string }) => item.label === 'A record')
      .onPress(),
  );
  let completeCapture!: (files: PickedDocument[]) => void;
  jest.mocked(captureDocuments).mockReturnValue(
    new Promise(resolve => {
      completeCapture = resolve;
    }),
  );
  await act(async () => {
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Capture health record')!
      .props.onPress();
  });
  await act(async () =>
    tree.root
      .findAllByType(BottomSheet)
      .find(node => node.props.title === 'Add health record')!
      .props.onDismiss(),
  );
  expect(captureDocuments).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType(UploadDocumentSheet)).toHaveLength(0);
  const files = [
    {
      uri: 'file:///tmp/captured.jpg',
      name: 'captured.jpg',
      type: 'image/jpeg',
      size: 100,
    },
  ];
  await act(async () => completeCapture(files));
  expect(tree.root.findByType(UploadDocumentSheet).props.initialFiles).toEqual(
    files,
  );
  await act(async () =>
    tree.root.findByType(UploadDocumentSheet).props.onClose(),
  );
  jest.mocked(captureDocuments).mockResolvedValue([]);
  await act(async () =>
    actions
      .find((item: { label: string }) => item.label === 'A record')
      .onPress(),
  );
  await act(async () =>
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Capture health record')!
      .props.onPress(),
  );
  await act(async () =>
    tree.root
      .findAllByType(BottomSheet)
      .find(node => node.props.title === 'Add health record')!
      .props.onDismiss(),
  );
  expect(tree.root.findAllByType(UploadDocumentSheet)).toHaveLength(0);
  await act(async () => tree.unmount());
});
