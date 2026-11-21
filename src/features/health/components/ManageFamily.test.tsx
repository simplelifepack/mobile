import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { ManageFamily } from './ManageFamily';

const members: HealthMember[] = [
  { id: 'one', name: 'Divya', relation: 'Myself', createdAt: '', updatedAt: '' },
  { id: 'two', name: 'Padma', relation: 'Mother', bloodGroup: 'A+', allergies: 'Penicillin', emergencyContactName: 'Divya', emergencyContactPhone: '12345', createdAt: '', updatedAt: '' },
];

it('shows family profiles and routes profile, contacts, and add actions', async () => {
  const onView = jest.fn(), onContacts = jest.fn(), onAdd = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><ManageFamily members={members} selectedId="one" contacts={false}
      onView={onView} onContacts={onContacts} onAdd={onAdd} onEdit={jest.fn()} onEditIdentity={jest.fn()} onRemove={jest.fn()} busy={false} /></AppThemeProvider>);
  });
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  await act(async () => {
    press("View Padma's profile").props.onPress();
    press('Emergency contacts').props.onPress();
    renderer.root.findByType(Button).props.onPress();
  });
  expect(onView).toHaveBeenCalledWith('two');
  expect(onContacts).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it('shows only actual profile values and protects the default profile', async () => {
  const onEdit = jest.fn(), onRemove = jest.fn();
  const screen = (detailId: string) => <AppThemeProvider><ManageFamily members={members} selectedId="one" detailId={detailId} contacts={false}
    onView={jest.fn()} onContacts={jest.fn()} onAdd={jest.fn()} onEdit={onEdit} onEditIdentity={jest.fn()} onRemove={onRemove} busy={false} /></AppThemeProvider>;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { renderer = ReactTestRenderer.create(screen('two')); });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toEqual(expect.arrayContaining(['Padma', 'A+', 'Penicillin', 'Unavailable', 'Divya']));
  await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Remove profile')!.props.onPress(); });
  expect(onRemove).toHaveBeenCalledWith(members[1]);
  await act(async () => { renderer.update(screen('one')); });
  expect(renderer.root.findAllByType(Button).find(item => item.props.title === 'Remove profile')).toBeUndefined();
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('The default health profile cannot be removed.');
});
