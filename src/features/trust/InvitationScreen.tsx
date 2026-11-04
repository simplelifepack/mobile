import React from 'react';
import { mobileApi } from '../../api/mobile.api';
import {
  FeaturePage,
  AppText,
  TextInput,
  Button,
  ResourceStatus,
  useResource,
  useAction,
  Details,
} from '../shared/FeatureUI';
export function InvitationScreen({
  route,
}: {
  route: { params: { token: string } };
}) {
  const resource = useResource(
    () => mobileApi.trust.getInvitation(route.params.token),
    [route.params.token],
  );
  const [pin, setPin] = React.useState('');
  const [done, setDone] = React.useState(false);
  const action = useAction();
  return (
    <FeaturePage
      title="Trusted access invitation"
      subtitle="Review who is sharing access"
    >
      <ResourceStatus resource={resource} />
      {resource.data ? <Details value={resource.data} /> : null}
      {!done && resource.data ? (
        <>
          <TextInput
            label="Invitation PIN"
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            title="Accept invitation"
            disabled={action.busy || !/^\d{6}$/.test(pin)}
            onPress={() => {
              void action.run(async () => {
                await mobileApi.trust.acceptInvitation(route.params.token, pin);
                setDone(true);
              }, 'Invitation accepted.');
            }}
          />
          <Button
            title="Reject invitation"
            variant="danger"
            disabled={action.busy}
            onPress={() => {
              void action.run(async () => {
                await mobileApi.trust.rejectInvitation(route.params.token);
                setDone(true);
              }, 'Invitation rejected.');
            }}
          />
        </>
      ) : null}
      {action.message ? <AppText>{action.message}</AppText> : null}
    </FeaturePage>
  );
}
