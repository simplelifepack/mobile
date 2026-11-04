import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { HealthReadiness, medicalReadiness } from './HealthReadiness';
import type { HealthMember, HealthRecord } from '../../api/web.types';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Button } from '../../components/primitives/Button';
import { Progress } from '../../components/primitives/Progress';
const member: HealthMember = {
  id: 'member',
  name: 'Test',
  relation: 'self',
  createdAt: '',
  updatedAt: '',
  bloodGroup: 'O+',
  allergies: 'Test allergy',
  primaryDoctor: 'Test doctor',
  insuranceProvider: 'Test provider',
};
const prescription = {
  id: 'prescription',
  memberId: 'member',
  type: 'prescription',
} as HealthRecord;
it('matches the reference 71% when conditions and emergency contact are missing', () => {
  const readiness = medicalReadiness(member, [prescription]);
  expect(readiness.percentage).toBe(71);
  expect(
    readiness.items.filter(item => !item.ready).map(item => item.label),
  ).toEqual(['Conditions', 'Emergency contact']);
});
it('counts explicit None answers, excludes another profile’s records, and distinguishes unknown blood group', () => {
  expect(
    medicalReadiness(
      {
        ...member,
        conditions: 'None',
        emergencyContactName: 'Test contact',
        emergencyContactPhone: '+91 98765 43210',
      },
      [prescription],
    ).percentage,
  ).toBe(100);
  const empty = {
    id: 'other',
    bloodGroup: 'Unknown',
    conditions: '  ',
    allergies: '  ',
  } as HealthMember;
  expect(medicalReadiness(empty, [prescription]).percentage).toBe(0);
});
it('shows profile facts, expands the explanation, and routes Edit and Records actions', async () => {
  const edit = jest.fn(),
    records = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <HealthReadiness
          member={member}
          records={[prescription]}
          onEdit={edit}
          onRecords={records}
        />
      </AppThemeProvider>,
    );
  });
  const button = (title: string) =>
    tree.root.findAllByType(Button).find(node => node.props.title === title)!;
  expect(tree.root.findByType(Progress).props.value).toBe(71);
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Still needed: Conditions, Emergency contact',
  );
  expect(JSON.stringify(tree.toJSON())).toContain('Test allergy');
  expect(JSON.stringify(tree.toJSON())).toContain('Not answered yet');
  await act(async () => button('Edit').props.onPress());
  expect(edit).toHaveBeenCalledTimes(1);
  await act(async () => button('How?').props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Each of the seven items counts equally.',
  );
  await act(async () => button('View health records').props.onPress());
  expect(records).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
