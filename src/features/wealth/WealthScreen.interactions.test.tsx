import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import type { PickedDocument } from '../../native/documentFiles';
jest.mock('../../native/captureDocuments', () => ({
  captureDocuments: jest.fn(),
}));
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { WealthScreen } from './WealthScreen';
import { WealthGroups } from './WealthGroups';
import { FeaturePage } from '../shared/FeatureUI';
import { DetailSheet } from '../shared/DetailSheet';
import { ProofCaptureDialog } from './ProofCaptureDialog';
import { WealthEntrySheet } from './WealthEntrySheet';
import { mobileApi } from '../../api/mobile.api';
const record = {
  id: 'record',
  title: 'chocolate',
  type: 'LOAN_GIVEN',
  details: { amount: 50, currency: 'INR' },
};
jest.mock('../../api/mobile.api', () => ({
  mobileApi: {
    wealth: { records: jest.fn(), record: jest.fn() },
    documents: { list: jest.fn() },
  },
}));
jest.mock('../../services/api', () => ({
  api: { util: { invalidateTags: jest.fn() } },
}));
jest.mock('../../app/store/hooks', () => ({ useAppDispatch: () => jest.fn() }));
jest.mock('../shared/useRefreshOnFocus', () => ({
  useRefreshOnFocus: () => undefined,
}));
jest.mock('../shared/FeatureUI', () => ({
  ...jest.requireActual('../shared/resourceHooks'),
  FeaturePage: ({ children }: React.PropsWithChildren) => children,
  Stack: require('react-native').View,
  AppText: require('react-native').Text,
  Button: require('../../components/primitives/Button').Button,
  Details: () => null,
  ResourceStatus: () => null,
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../shared/RecordForm', () => ({ ActiveForm: () => null }));
jest.mock('./WealthTools', () => ({
  DynamicWealthForm: () => null,
  Handoff: () => null,
}));
jest.mock('./WealthGroups', () => ({ WealthGroups: () => null }));
jest.mock('./WealthEntrySheet', () => ({ WealthEntrySheet: () => null }));
jest.mock('./ProofCaptureDialog', () => ({ ProofCaptureDialog: () => null }));
it('opens chocolate immediately while record details load separately, and exposes direct capture', async () => {
  jest.mocked(mobileApi.wealth.records).mockResolvedValue([record] as never);
  jest.mocked(mobileApi.documents.list).mockResolvedValue([]);
  jest.mocked(mobileApi.wealth.record).mockReturnValue(new Promise(() => {}));
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <WealthScreen />
      </AppThemeProvider>,
    );
  });
  await act(async () =>
    tree.root.findByType(WealthGroups).props.onOpen(record),
  );
  expect(tree.root.findByType(DetailSheet).props.title).toBe('chocolate');
  expect(mobileApi.wealth.record).toHaveBeenCalledWith(
    'record',
    expect.any(AbortSignal),
  );
  expect(JSON.stringify(tree.toJSON())).toContain('Loading record details…');
  await act(async () => tree.root.findByType(DetailSheet).props.onClose());
  const capture = tree.root
    .findByType(FeaturePage)
    .props.actions.find(
      (action: { label: string }) => action.label === 'Capture document',
    );
  let completeCapture!: (files: PickedDocument[]) => void;
  jest.mocked(captureDocuments).mockReturnValue(
    new Promise(resolve => {
      completeCapture = resolve;
    }),
  );
  await act(async () => capture.onPress());
  expect(captureDocuments).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType(WealthEntrySheet)).toHaveLength(0);
  const files = [
    {
      uri: 'file:///tmp/captured.jpg',
      name: 'captured.jpg',
      type: 'image/jpeg',
      size: 100,
    },
  ];
  await act(async () => completeCapture(files));
  expect(tree.root.findByType(WealthEntrySheet).props.initialFiles).toEqual(
    files,
  );
  await act(async () => tree.root.findByType(WealthEntrySheet).props.onClose());
  const proof = tree.root
    .findByType(FeaturePage)
    .props.actions.find(
      (item: { label: string }) => item.label === 'Capture payment proof',
    );
  jest.mocked(captureDocuments).mockReturnValue(
    new Promise(resolve => {
      completeCapture = resolve;
    }),
  );
  await act(async () => proof.onPress());
  expect(tree.root.findAllByType(ProofCaptureDialog)).toHaveLength(0);
  await act(async () => completeCapture(files));
  expect(tree.root.findByType(ProofCaptureDialog).props.initialFiles).toEqual(
    files,
  );
  await act(async () =>
    tree.root.findByType(ProofCaptureDialog).props.onClose(),
  );
  jest.mocked(captureDocuments).mockResolvedValue([]);
  await act(async () => proof.onPress());
  expect(tree.root.findAllByType(ProofCaptureDialog)).toHaveLength(0);
  await act(async () => tree.unmount());
});
