import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { PackageDetailSheet } from './PackageDetailSheet';
import type { DocumentRecord, PackageSummary } from '../../api/types';
import type { PackReadiness } from './calculatePackReadiness';
jest.mock('../../components/primitives/AppModal', () => ({
  AppModal: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
const document: DocumentRecord = {
  id: 'doc',
  originalName: 'identity.pdf',
  displayName: 'Aadhaar (UIDAI) Card',
  documentType: 'aadhaar',
  classificationStatus: 'verified',
  ownershipStatus: 'verified',
  confidence: 1,
  createdAt: '2026-01-01',
};
const ready = {
  id: 'identity',
  title: 'Identity Proof',
  required: true,
  acceptedDocumentTypes: ['identity_proof'],
  status: 'ready' as const,
  assignmentSource: 'AUTO' as const,
  matchedDocument: document,
};
const missing = {
  id: 'marks',
  title: 'Mark sheets',
  required: true,
  acceptedDocumentTypes: ['marksheet'],
  status: 'missing' as const,
  assignmentSource: null,
};
const pack: PackageSummary = {
  id: 'college',
  slug: 'college',
  title: 'College admission',
  category: 'Education',
  description: 'Undergraduate',
  source: {
    url: 'https://example.test/admissions',
    name: 'Admissions office',
    lastCheckedAt: '2026-10-04',
  },
  requirements: [ready, missing],
};
const readiness: PackReadiness = {
  totalRequired: 2,
  satisfiedRequired: 1,
  missingRequired: 1,
  percentage: 50,
  requirements: [ready, missing],
};
it('groups real requirements and reveals contextual actions instead of a wall of controls', async () => {
  const assign = jest.fn(),
    upload = jest.fn(),
    skip = jest.fn(),
    view = jest.fn(),
    toggle = jest.fn();
  const noop = () => undefined;
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <PackageDetailSheet
          pack={pack}
          readiness={readiness}
          documents={[
            document,
            {
              ...document,
              id: 'licence',
              displayName: 'Driving Licence',
              documentType: 'driving_licence',
              owner: 'self',
            },
          ]}
          busy={false}
          skippedIds={[]}
          includedIds={['doc']}
          onClose={noop}
          onRefresh={noop}
          onSkip={skip}
          onUpload={upload}
          onAssign={assign}
          onClear={noop}
          onView={view}
          onToggleDocument={toggle}
          onDownload={noop}
          onShare={noop}
          onExport={noop}
        />
      </AppThemeProvider>,
    );
  });
  const text = () => JSON.stringify(tree.toJSON());
  const press = async (label: string) => {
    const button = tree.root.findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onPress === 'function',
    )[0];
    await act(async () => button.props.onPress());
  };
  expect(text()).toContain('Already in your vault (');
  expect(text()).toContain('Aadhaar (UIDAI) Card');
  expect(text()).toContain('Also available:');
  expect(text()).toContain('Driving Licence');
  expect(text()).toContain('Still needed (');
  expect(text()).not.toContain('Automatically matched from Documents');
  await press('Identity Proof');
  expect(text()).toContain('Automatically matched from Documents');
  expect(text()).toContain('identity.pdf');
  await press('Add Mark sheets');
  expect(text()).toContain('Pick from Documents');
  expect(text()).toContain('Not needed');
  await press('Pick from Documents');
  expect(assign).toHaveBeenCalledWith(missing);
  await press('Aadhaar (UIDAI) Card');
  expect(toggle).toHaveBeenCalledWith('doc');
  await act(async () => tree.unmount());
});
