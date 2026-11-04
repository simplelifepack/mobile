import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { RecordForm } from './RecordForm';
import { Button } from '../../components/primitives/Button';
import { TextInput } from '../../components/primitives/TextInput';
jest.mock('../../components/primitives/AppModal', () => ({
  AppModal: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../../app/store/hooks', () => ({ useAppSelector: () => 'owner' }));
jest.mock('../../storage/formDraftStorage', () => ({
  draftKey: () => 'test-form',
  readDraft: jest.fn().mockResolvedValue(undefined),
  writeDraft: jest.fn().mockResolvedValue(undefined),
  clearDraft: jest.fn().mockResolvedValue(undefined),
}));
it('flags exact fields, prevents invalid submission, and confirms success with a next step', async () => {
  const submit = jest.fn().mockResolvedValue(undefined),
    close = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <RecordForm
          title="Add record"
          fields={[
            { key: 'title', label: 'Title', required: true },
            { key: 'date', label: 'Date', type: 'date' },
          ]}
          onSubmit={submit}
          onClose={close}
        />
      </AppThemeProvider>,
    );
  });
  const save = () =>
    tree.root.findAllByType(Button).find(node => node.props.title === 'Save')!;
  expect(save().props.disabled).toBe(true);
  await act(async () => save().props.onPress());
  expect(submit).not.toHaveBeenCalled();
  const title = () =>
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label.startsWith('Title'))!;
  const date = () =>
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label.startsWith('Date'))!;
  expect(title().props.error).toContain('required');
  await act(async () => {
    title().props.onChangeText('Synthetic');
    date().props.onChangeText('2026-02-30');
  });
  await act(async () => save().props.onPress());
  expect(date().props.error).toContain('YYYY-MM-DD');
  expect(save().props.disabled).toBe(true);
  await act(async () => date().props.onChangeText('2026-10-31'));
  expect(save().props.disabled).toBe(false);
  await act(async () => save().props.onPress());
  expect(submit).toHaveBeenCalledWith({
    title: 'Synthetic',
    date: '2026-10-31',
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Saved to your account');
  expect(
    tree.root.findAllByType(Button).some(node => node.props.title === 'Done'),
  ).toBe(true);
  expect(close).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});
