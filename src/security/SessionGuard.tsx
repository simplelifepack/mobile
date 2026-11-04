import React from 'react';
import { BackHandler } from 'react-native';
import styled from 'styled-components/native';
import { useSessionGate } from './sessionGate';
import { ReauthenticateScreen } from '../features/auth/screens/ReauthenticateScreen';
const Frame = styled.View({ flex: 1 });
const Content = styled.View({ flex: 1 });
const Gate = styled.View(({ theme }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  backgroundColor: theme.colors.background,
}));
export function SessionGuard({ children }: React.PropsWithChildren) {
  const email = useSessionGate();
  React.useEffect(() => {
    if (!email) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, [email]);
  return (
    <Frame>
      <Content
        accessibilityElementsHidden={Boolean(email)}
        importantForAccessibility={email ? 'no-hide-descendants' : 'auto'}
        pointerEvents={email ? 'none' : 'auto'}
      >
        {children}
      </Content>
      {email ? (
        <Gate accessibilityViewIsModal>
          <ReauthenticateScreen email={email} />
        </Gate>
      ) : null}
    </Frame>
  );
}
