import React from 'react';
import { EmptyState } from '../../components/feedback/EmptyState';
import { mobileApi } from '../../api/mobile.api';
import type {
  TrustMember,
  TrustMemberPayload,
  TrustPermission,
} from '../../api/web.types';
import { Card } from '../../components/primitives/Card';
import {
  FeaturePage,
  Stack,
  AppText,
  Button,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
export function TrustScreen({
  route,
}: {
  route?: { name?: string; params?: { memberId?: string } };
}) {
  const family = route?.name === 'Family';
  const [focusedMember, setFocusedMember] = React.useState(
    route?.params?.memberId,
  );
  React.useEffect(
    () => setFocusedMember(route?.params?.memberId),
    [route?.params?.memberId],
  );
  const resource = useResource(mobileApi.trust.get);
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const action = useAction(resource.refresh);
  const edit = (member?: TrustMember) =>
    setForm({
      draftId: member ? `trust:${member.id}` : 'trust:new-person',
      title: member
        ? 'Edit trusted member'
        : family
          ? 'Add family member'
          : 'Invite trusted member',
      fields: [
        { key: 'name', label: 'Name', required: true, initial: member?.name },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          initial: member?.email,
        },
        {
          key: 'relation',
          label: 'Relationship',
          required: true,
          options: [
            'SPOUSE',
            'PARENT',
            'CHILD',
            'SIBLING',
            'GUARDIAN',
            'RELATIVE',
            'FRIEND',
            'OTHER',
          ],
          initial: member?.relation ?? 'SPOUSE',
        },
        {
          key: 'customRelation',
          label: 'Custom relationship',
          initial: member?.customRelation ?? '',
        },
        {
          key: 'dateOfBirth',
          label: 'Date of birth',
          type: 'date',
          required: true,
          initial: member?.dateOfBirth?.slice(0, 10),
        },
        {
          key: 'bloodGroup',
          label: 'Blood group',
          required: true,
          options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
          initial: member?.bloodGroup ?? 'O+',
        },
        {
          key: 'accessTypeCode',
          label: 'Access level',
          options: ['VIEW_ONLY', 'FAMILY_MEMBER', 'EMERGENCY_ACCESS'],
          initial:
            member?.accessType.code ?? (family ? 'FAMILY_MEMBER' : 'VIEW_ONLY'),
        },
        ...(['DOCUMENTS', 'HEALTH', 'WEALTH'] as const).flatMap(module => [
          {
            key: `${module}_view`,
            label: `Allow viewing ${module.toLowerCase()}`,
            options: ['yes', 'no'],
            initial: member?.permissions.find(
              permission => permission.module === module,
            )?.canView
              ? 'yes'
              : 'no',
          },
          {
            key: `${module}_download`,
            label: `Allow downloading ${module.toLowerCase()}`,
            options: ['yes', 'no'],
            initial: member?.permissions.find(
              permission => permission.module === module,
            )?.canDownload
              ? 'yes'
              : 'no',
          },
        ]),
        ...(!member && !family
          ? [
              {
                key: 'pin',
                label: 'Invitation PIN (6 digits)',
                type: 'password' as const,
                required: true,
              },
            ]
          : []),
      ],
      submit: async values => {
        if (values.pin && !/^\d{6}$/.test(values.pin))
          throw new Error('Enter a 6-digit invitation PIN.');
        const permissions: TrustPermission[] = (
          ['DOCUMENTS', 'HEALTH', 'WEALTH'] as const
        ).map(module => ({
          module,
          canView: values[`${module}_view`] === 'yes',
          canDownload:
            values[`${module}_view`] === 'yes' &&
            values[`${module}_download`] === 'yes',
        }));
        const payload: TrustMemberPayload = {
          name: values.name,
          email: values.email,
          relation: values.relation as 'SPOUSE',
          customRelation: values.customRelation || undefined,
          dateOfBirth: values.dateOfBirth,
          bloodGroup: values.bloodGroup as 'O+',
          accessTypeCode: values.accessTypeCode as 'VIEW_ONLY',
          permissions,
          ...(values.pin ? { pin: values.pin } : {}),
        };
        const result = member
          ? await mobileApi.trust.updateMember(member.id, payload)
          : family
            ? await mobileApi.trust.addFamilyMember(payload)
            : await mobileApi.trust.addMember(payload);
        resource.refresh();
        if (result.invitationDelivery?.sent === false)
          void action.run(async () => {
            throw new Error(
              `Member saved; invitation email was not sent: ${result.invitationDelivery?.reason}. Retry from the member card.`,
            );
          });
      },
    });
  return (
    <FeaturePage
      actions={[
        {
          label: family ? 'Add person' : 'Invite trusted member',
          onPress: () => edit(),
        },
      ]}
      title={
        family
          ? 'Family and access'
          : route?.name === 'Legacy'
            ? 'Legacy & trusted access'
            : 'Trust'
      }
      subtitle={
        family
          ? 'Plan who receives your records'
          : 'Choose who can access your records'
      }
      description={
        family
          ? 'Set up trusted recipients before using SOS handoff in Wealth.'
          : 'Manage the people and permissions you choose for your documents, health and wealth.'
      }
    >
      <ResourceStatus resource={resource} />
      {action.message ? <AppText>{action.message}</AppText> : null}
      {resource.data?.members.length === 0 ? (
        <EmptyState
          title="No trusted people yet"
          message="No one has been invited to access your records. Invite one person and choose exactly what they can see."
          actionLabel="Invite a trusted person"
          onAction={() => edit()}
        />
      ) : null}
      {focusedMember ? (
        <Button
          title="Show all members"
          variant="ghost"
          onPress={() => setFocusedMember(undefined)}
        />
      ) : null}
      {resource.data?.members
        .filter(member => !focusedMember || member.id === focusedMember)
        .map(member => (
          <Card key={member.id}>
            <Stack gap="sm">
              <AppText variant="rowTitle">{member.name}</AppText>
              <AppText>{member.email}</AppText>
              <AppText>
                {member.relationLabel} · {member.accessType.name} ·{' '}
                {member.status
                  .toLowerCase()
                  .replace(/^./, char => char.toUpperCase())}
              </AppText>
              <AppText variant="caption">
                Invitation:{' '}
                {member.invitationStatus
                  .toLowerCase()
                  .replace(/_/g, ' ')
                  .replace(/^./, char => char.toUpperCase())}
                {member.inviteExpiresAt
                  ? ` · expires ${member.inviteExpiresAt.slice(0, 10)}`
                  : ''}
              </AppText>
              {member.permissions.map(permission => (
                <AppText
                  key={permission.module}
                  variant="caption"
                  color="muted"
                >
                  {permission.module.charAt(0) +
                    permission.module.slice(1).toLowerCase()}
                  :{' '}
                  {permission.canDownload
                    ? 'View and download'
                    : permission.canView
                      ? 'View only'
                      : 'No access'}
                </AppText>
              ))}
              <Button
                title="Edit access"
                disabled={action.busy}
                onPress={() => edit(member)}
              />
              {member.status === 'INVITED' ? (
                <>
                  <Button
                    title="Resend invitation"
                    disabled={action.busy}
                    variant="secondary"
                    onPress={() => {
                      void action.run(async () => {
                        const result = await mobileApi.trust.resendInvitation(
                          member.id,
                        );
                        if (result.invitationDelivery?.sent === false)
                          throw new Error(
                            `Email could not be sent: ${result.invitationDelivery.reason}`,
                          );
                      }, 'Invitation sent.');
                    }}
                  />
                  <Button
                    title="Reset invitation PIN"
                    variant="secondary"
                    onPress={() =>
                      setForm({
                        title: 'Reset invitation PIN',
                        fields: [
                          {
                            key: 'pin',
                            label: 'New 6-digit PIN',
                            type: 'password',
                            required: true,
                          },
                        ],
                        submit: async values => {
                          if (!/^\d{6}$/.test(values.pin))
                            throw new Error('Enter a 6-digit PIN.');
                          await mobileApi.trust.resetInvitationPin(
                            member.id,
                            values.pin,
                          );
                          resource.refresh();
                        },
                      })
                    }
                  />
                </>
              ) : null}
              {member.status !== 'REVOKED' ? (
                <Button
                  title="Revoke access"
                  variant="danger"
                  disabled={action.busy}
                  onPress={() =>
                    confirmAction(
                      'Revoke trusted access?',
                      () => {
                        void action.run(() =>
                          mobileApi.trust.revokeMember(member.id),
                        );
                      },
                      'This person will lose the access you shared with them.',
                    )
                  }
                />
              ) : null}
            </Stack>
          </Card>
        ))}
      <AppText variant="heading">Shared with you</AppText>
      {resource.data?.connections.length === 0 ? (
        <EmptyState
          title="Nothing has been shared with you"
          message="There are no accepted invitations for this account. Ask the person sharing records to invite your account email."
        />
      ) : null}
      {resource.data?.connections.map(connection => (
        <Card key={connection.id}>
          <Stack>
            <AppText variant="rowTitle">{connection.owner.name}</AppText>
            <AppText>
              {connection.owner.email} · {connection.accessType.name}
            </AppText>
            <Button
              title="Leave connection"
              variant="danger"
              disabled={action.busy}
              onPress={() =>
                confirmAction(
                  'Leave connection?',
                  () => {
                    void action.run(() =>
                      mobileApi.trust.leaveConnection(connection.id),
                    );
                  },
                  'You will lose access to the records this person shared with you.',
                )
              }
            />
          </Stack>
        </Card>
      ))}
      <ActiveForm form={form} onClose={() => setForm(null)} />
    </FeaturePage>
  );
}
