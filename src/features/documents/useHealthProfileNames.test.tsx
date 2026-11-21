import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { healthApi, type HealthMember } from '../../api/health.api';
import { useHealthProfileNames } from './useHealthProfileNames';

const existingMember: HealthMember = {
  id: 'existing-member',
  name: 'Existing profile',
  relation: 'Self',
  createdAt: '',
  updatedAt: '',
};

it('adds a newly created profile name to the document person-filter options', async () => {
  jest.spyOn(healthApi, 'members').mockResolvedValue([existingMember]);
  jest.spyOn(healthApi, 'records').mockResolvedValue([]);

  let state!: ReturnType<typeof useHealthProfileNames>;
  function Probe() {
    state = useHealthProfileNames();
    return null;
  }

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe />);
  });
  await act(async () => {
    await state.refreshProfileNames({ name: 'New profile' });
  });

  expect(state.profileMembers).toEqual(['Existing profile', 'New profile']);
  await act(async () => renderer.unmount());
  jest.restoreAllMocks();
});
