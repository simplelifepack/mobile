import React from 'react';
import { healthApi } from '../../api/health.api';
import type {
  HealthMember,
  HealthMemberResolution,
  HealthProcessResponse,
} from '../../api/web.types';
import { DetailSheet } from '../shared/DetailSheet';
import { ActiveForm } from '../shared/RecordForm';
import { AppText, Button, Choice, useAction } from '../shared/FeatureUI';

export function HealthProfileResolution({
  resolution,
  members,
  onClose,
  onProcessed,
  onMembersChanged,
}: {
  resolution: HealthMemberResolution;
  members: HealthMember[];
  onClose: () => void;
  onProcessed: (result: HealthProcessResponse) => void;
  onMembersChanged: () => void;
}) {
  const [memberId, setMemberId] = React.useState(
    resolution.memberMatch.candidates[0]?.id ?? '',
  );
  const [creating, setCreating] = React.useState(false);
  const created = React.useRef<string | undefined>(undefined);
  const action = useAction();
  const assign = async (id: string) => {
    const result = await healthApi.createRecord({
      memberId: id,
      documentId: resolution.documentId,
      type: resolution.type,
    });
    if (result.processingStatus === 'awaiting_profile_match')
      throw new Error(
        'The selected profile still needs review. Check its patient details.',
      );
    onProcessed(result);
  };
  return (
    <DetailSheet
      title="Who does this report belong to?"
      onClose={onClose}
      busy={action.busy}
    >
      <AppText>
        {resolution.patient?.name
          ? `Patient: ${resolution.patient.name}`
          : 'No patient could be identified.'}{' '}
        Choose a matching profile or create one.
      </AppText>
      <Choice
        label="Health profile"
        value={memberId}
        options={members.map(member => ({
          label: `${member.name} · ${member.relation}`,
          value: member.id,
        }))}
        onChange={setMemberId}
      />
      <Button
        title="Confirm profile"
        disabled={!memberId || action.busy}
        onPress={() => {
          void action.run(() => assign(memberId), '');
        }}
      />
      <Button
        title="Create a profile for this patient"
        variant="secondary"
        disabled={action.busy}
        onPress={() => setCreating(true)}
      />
      {action.message ? (
        <AppText color="danger">{action.message}</AppText>
      ) : null}
      <ActiveForm
        onClose={() => setCreating(false)}
        form={
          creating
            ? {
                title: 'New health profile',
                fields: [
                  {
                    key: 'name',
                    label: 'Name',
                    required: true,
                    initial: resolution.patient?.name ?? '',
                  },
                  {
                    key: 'relation',
                    label: 'Relationship',
                    options: [
                      'self',
                      'spouse',
                      'father',
                      'mother',
                      'child',
                      'other',
                    ],
                    initial: 'other',
                  },
                  {
                    key: 'dateOfBirth',
                    label: 'Date of birth',
                    type: 'date',
                    initial:
                      resolution.patient?.dateOfBirth?.slice(0, 10) ?? '',
                  },
                ],
                submit: async values => {
                  if (!created.current) {
                    const member = await healthApi.createMember({
                      name: values.name,
                      relation: values.relation,
                      dateOfBirth: values.dateOfBirth || null,
                    });
                    created.current = member.id;
                    onMembersChanged();
                  }
                  await assign(created.current);
                },
              }
            : null
        }
      />
    </DetailSheet>
  );
}
