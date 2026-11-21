import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  BookOpen,
  FileText,
  Fingerprint,
  HeartPulse,
} from 'lucide-react-native';
import { AppText } from '../../components/primitives/AppText';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import type { DocumentRecord } from '../../api/types';
import {
  AttentionBanner,
  AttentionPanel,
  RecentDocuments,
  type AttentionItem,
} from './HomeSections';

const recentDocument: DocumentRecord = {
  id: 'passport',
  title: 'Passport',
  originalName: 'passport.pdf',
  documentType: 'Passport',
  category: 'Identity',
  classificationStatus: 'verified',
  ownershipStatus: 'verified',
  confidence: 100,
  createdAt: '2026-11-15T00:00:00.000Z',
};

it('keeps the recently viewed section visible when there are no documents', async () => {
  const onViewAll = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <RecentDocuments
          documents={[]}
          onOpen={jest.fn()}
          onViewAll={onViewAll}
        />
      </AppThemeProvider>,
    );
  });

  const labels = renderer.root
    .findAllByType(AppText)
    .map(item => React.Children.toArray(item.props.children).join(''));
  expect(labels).toContain('Recently viewed');
  expect(labels).toContain('No documents yet');
  expect(labels).toContain('Documents you add will appear here.');

  await act(async () => {
    renderer.root
      .findAll(node => node.props.accessibilityRole === 'button')
      .find(node => node.findAllByType(AppText).some(text => text.props.children === 'View all'))!
      .props.onPress();
  });
  expect(onViewAll).toHaveBeenCalledTimes(1);
});

it('shows recent documents and opens the selected document', async () => {
  const onOpen = jest.fn();
  const onViewAll = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <RecentDocuments
          documents={[recentDocument]}
          onOpen={onOpen}
          onViewAll={onViewAll}
        />
      </AppThemeProvider>,
    );
  });

  const labels = renderer.root
    .findAllByType(AppText)
    .map(item => React.Children.toArray(item.props.children).join(''));
  expect(labels).toContain('Recently viewed');
  expect(labels).toContain('Passport');
  expect(labels).toContain('Identity');
  expect(renderer.root.findAllByType(BookOpen).length).toBeGreaterThan(0);

  await act(async () => {
    renderer.root
      .findByProps({ accessibilityLabel: 'View Passport' })
      .props.onPress();
  });
  expect(onOpen).toHaveBeenCalledWith(recentDocument);
});

it('uses an identity icon for Aadhaar in recently viewed', async () => {
  const aadhaarDocument: DocumentRecord = {
    ...recentDocument,
    id: 'aadhaar',
    title: 'Aadhaar card',
    originalName: 'identity.pdf',
    documentType: 'Government ID',
    category: 'Identity',
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <RecentDocuments
          documents={[aadhaarDocument]}
          onOpen={jest.fn()}
          onViewAll={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });

  expect(renderer.root.findAllByType(Fingerprint).length).toBeGreaterThan(0);
});

it('exposes an expandable attention summary', async () => {
  const onPress = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <AttentionBanner
          count={2}
          overdueCount={1}
          expanded={false}
          onPress={onPress}
        />
      </AppThemeProvider>,
    );
  });
  const banner = renderer.root.findByProps({
    accessibilityLabel: '2 items need your attention',
  });
  expect(banner.props.accessibilityState).toEqual({ expanded: false });
  await act(async () => banner.props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('groups documents separately, opens the selected item, and expands long groups', async () => {
  const open = jest.fn();
  const items: AttentionItem[] = [
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `doc-${i}`, kind: 'document' as const, Icon: FileText,
      title: `Document ${i}`, label: 'Expires today', overdue: false, onPress: open,
    })),
    { id: 'health', kind: 'other', Icon: HeartPulse, title: 'Appointment', label: 'Due today', overdue: false, onPress: jest.fn() },
  ];
  const toggle = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <AttentionPanel items={items} emptyMessage="No tasks" expanded={false} onToggle={toggle} />
    </AppThemeProvider>);
  });
  const labels = renderer.root.findAllByType(AppText).map(item => React.Children.toArray(item.props.children).join(''));
  expect(labels).toContain('Documents');
  expect(labels).toContain('Other reminders');
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Documents needing attention' }).length).toBeGreaterThan(0);
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Other reminders needing attention' }).length).toBeGreaterThan(0);
  expect(labels).not.toContain('Document 3');
  await act(async () => {
    renderer.root.findAllByProps({ accessibilityLabel: 'Document 0, Expires today' })
      .find(item => typeof item.props.onPress === 'function')!.props.onPress();
  });
  expect(open).toHaveBeenCalledTimes(1);
  const showAll = renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
    typeof item.props.onPress === 'function' &&
    item.findAllByType(AppText).some(text => text.props.children === 'Show all 5'),
  );
  await act(async () => { showAll!.props.onPress(); });
  expect(toggle).toHaveBeenCalled();
});
