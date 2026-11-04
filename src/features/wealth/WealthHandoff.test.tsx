import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Handoff } from './WealthTools';
import { Button } from '../../components/primitives/Button';
import { TextAction } from '../../components/primitives/TextAction';
import { DetailSheet } from '../shared/DetailSheet';
import { confirmAction } from '../shared/FeatureUI';
import { mobileApi } from '../../api/mobile.api';

const mockResource = {
  loading: false,
  error: '',
  data: {
    recipients: {
      family: [
        {
          id: 'family',
          name: 'Family person',
          email: 'family@example.test',
          type: 'family',
          canReceiveHandoff: true,
        },
      ],
      emergency: [
        {
          id: 'emergency',
          name: 'Emergency person',
          email: 'emergency@example.test',
          type: 'emergency',
          canReceiveHandoff: false,
        },
      ],
    },
  },
};
jest.mock('../../api/mobile.api', () => ({
  mobileApi: { wealth: { sendHandoff: jest.fn() } },
}));
jest.mock('../shared/RecordForm', () => ({ ActiveForm: () => null }));
jest.mock('../../components/primitives/InlineSelect', () => ({
  InlineSelect: () => null,
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../../components/primitives/Button', () => ({ Button: () => null }));
jest.mock('../../components/primitives/TextAction', () => ({
  TextAction: () => null,
}));
jest.mock('../shared/FeatureUI', () => ({
  Stack: ({ children }: React.PropsWithChildren) => children,
  AppText: ({ children }: React.PropsWithChildren) => children,
  Button: require('../../components/primitives/Button').Button,
  ResourceStatus: () => null,
  useResource: () => mockResource,
  useAction: () => ({ busy: false, message: '', run: jest.fn() }),
  confirmAction: jest.fn(),
}));

it('keeps sharing details optional, requires an eligible recipient, and clears selection on reopening', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Handoff openRequest={1} />);
  });
  const buttons = () => tree.root.findAllByType(Button);
  const send = () =>
    buttons().find(n => /^Select a recipient$|^Send to /.test(n.props.title))!;
  expect(send().props.disabled).toBe(true);
  expect(
    buttons().find(n => n.props.title.includes('Emergency person'))!.props
      .disabled,
  ).toBe(true);
  expect(JSON.stringify(tree.toJSON())).not.toContain(
    'Both include Wealth records',
  );
  await act(async () => tree.root.findByType(TextAction).props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Both include Wealth records',
  );
  await act(async () =>
    buttons()
      .find(n => n.props.title.includes('Family person'))!
      .props.onPress(),
  );
  expect(send().props.title).toBe('Send to 1 person');
  expect(send().props.disabled).toBe(false);
  await act(async () => send().props.onPress());
  expect(confirmAction).toHaveBeenCalledWith(
    'Send Wealth records?',
    expect.any(Function),
    expect.stringContaining('family@example.test'),
  );
  expect(mobileApi.wealth.sendHandoff).not.toHaveBeenCalled();
  await act(async () => tree.root.findByType(DetailSheet).props.onClose());
  await act(async () => tree.update(<Handoff openRequest={2} />));
  expect(send().props.disabled).toBe(true);
  expect(JSON.stringify(tree.toJSON())).not.toContain(
    'Both include Wealth records',
  );
  await act(async () => tree.unmount());
});
