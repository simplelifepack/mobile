import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthMember, HealthOverview, HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { HealthDashboard } from './HealthDashboard';

const member: HealthMember = {
  id: 'm1', name: 'Divya Rao', relation: 'self', createdAt: '2026-01-01', updatedAt: '2026-01-01',
};
const records: HealthRecord[] = [
  { id: 'old', memberId: 'm1', documentId: 'd1', type: 'lab_report', documentDate: '2026-01-01', processingStatus: 'processed', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0, createdAt: '2026-01-01' },
  { id: 'new', memberId: 'm1', documentId: 'd2', type: 'prescription', documentDate: '2026-03-01', processingStatus: 'processed', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0, createdAt: '2026-03-01' },
];
const overview: HealthOverview = {
  member, trackedMetrics: [], recentRecords: records,
  upcoming: [
    { id: 'later', title: 'Later reminder', dueDate: '2026-04-01', origin: 'manual', status: 'pending' },
    { id: 'first', title: 'First reminder', dueDate: '2026-03-01', origin: 'manual', status: 'pending' },
  ],
};
const document: DocumentRecord = {
  id: 'd2', displayName: 'Consultation notes', originalName: 'notes.pdf', documentType: 'prescription',
  classificationStatus: 'verified', ownershipStatus: 'verified', confidence: 1, createdAt: '2026-03-01',
};

it('shows member data and routes shortcuts, profile gaps and original record previews', async () => {
  const navigate = jest.fn();
  const edit = jest.fn();
  const preview = jest.fn();
  const reminder = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HealthDashboard
          member={{ ...member, dateOfBirth: '2000-01-01', bloodGroup: 'A+' }} overview={overview} records={records} documents={[document]}
          readings={[{ id: 'bp', title: 'Blood pressure', value: '120/80', unit: 'mmHg', status: 'no range on file', measurements: [], color: 'primary' }]}
          onNavigate={navigate} onEditProfile={edit} onEditIdentity={jest.fn()} onManageFamily={jest.fn()}
          onPreview={preview} onVisit={jest.fn()} onInsurance={jest.fn()} onEmergency={jest.fn()} onAddReminder={reminder}
        />
      </AppThemeProvider>,
    );
  });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toContain('Divya Rao');
  expect(labels).toContain('First reminder');
  expect(labels).not.toContain('Later reminder');
  expect(labels).toContain('Blood pressure · mmHg');
  expect(labels).toContain('Consultation notes');
  const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  const buttonWithText = (text: string) => buttons.find(item =>
    item.findAllByType(AppText).some(label => label.props.children === text),
  )!;
  await act(async () => {
    buttonWithText('Readings').props.onPress();
    buttonWithText('Medicines').props.onPress();
    buttonWithText('Add an emergency contact').props.onPress();
    buttonWithText('+ Reminder').props.onPress();
    buttons.find(item => item.props.accessibilityLabel === 'View original Consultation notes document')!.props.onPress();
  });
  expect(navigate).toHaveBeenCalledWith('Readings');
  expect(navigate).toHaveBeenCalledWith('Medications');
  expect(edit).toHaveBeenCalled();
  expect(reminder).toHaveBeenCalledTimes(1);
  expect(preview).toHaveBeenCalledWith('d2');
  expect(records[0].id).toBe('old');
});

it('does not report missing information when records are unavailable', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HealthDashboard member={member} readings={[]} onNavigate={jest.fn()} onEditProfile={jest.fn()} onEditIdentity={jest.fn()}
          onManageFamily={jest.fn()} onPreview={jest.fn()} onVisit={jest.fn()}
          onInsurance={jest.fn()} onEmergency={jest.fn()} onAddReminder={jest.fn()} />
      </AppThemeProvider>,
    );
  });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).not.toContain('Missing information');
  expect(labels).toContain('Readings unavailable. Pull to refresh.');
});

it('routes a missing prescription to records and keeps visit and family actions available', async () => {
  const navigate = jest.fn();
  const visit = jest.fn();
  const family = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HealthDashboard
          member={{ ...member, bloodGroup: 'A+', allergies: 'None', emergencyContactName: 'Alex', emergencyContactPhone: '123', primaryDoctor: 'Dr Rao', insuranceProvider: 'Insurer' }}
          overview={overview} records={[]} readings={[]}
          onNavigate={navigate} onEditProfile={jest.fn()} onEditIdentity={jest.fn()} onManageFamily={family}
          onPreview={jest.fn()} onVisit={visit} onInsurance={jest.fn()} onEmergency={jest.fn()} onAddReminder={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  for (const text of ['Missing information', 'Manage family', 'Prepare for a visit']) {
    const button = buttons.find(item => item.findAllByType(AppText).some(label => label.props.children === text))!;
    await act(async () => { button.props.onPress(); });
  }
  expect(navigate).toHaveBeenCalledWith('Records');
  expect(family).toHaveBeenCalled();
  expect(visit).toHaveBeenCalled();
});
