import React from 'react';
import styled from 'styled-components/native';
import { Screen } from '../../components/primitives/Screen';
import { AppText } from '../../components/primitives/AppText';
import { AccentLoader } from '../../components/primitives/AccentLoader';
import { BrandMark } from '../../components/navigation/BrandMark';

const Content = styled.View(({ theme }) => ({
  flex: 1,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: theme.spacing.lg,
}));
const Identity = styled.View(({ theme }) => ({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.md,
}));
const Halo = styled.View(({ theme }) => ({
  width: 144,
  height: 144,
  borderRadius: 72,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Tagline = styled(AppText)(() => ({ maxWidth: 280 }));
const Footer = styled.View(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing.lg,
  right: theme.spacing.lg,
  bottom: theme.spacing.xl,
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
/** Session and app-lock restoration share one branded launch surface. */
export function StartupSplash() {
  return (
    <Screen padded={false}>
      <Content>
        <Identity>
          <Halo>
            <BrandMark size={84} />
          </Halo>
        </Identity>
        <Footer>
          <AppText variant="title" align="center">
            Readines
          </AppText>
          <Tagline variant="caption" color="secondary" align="center">
            Everything important, in one place.
          </Tagline>
          <AccentLoader size={20} />
          <AppText variant="caption" color="muted" align="center">
            Documents · Health · Wealth
          </AppText>
        </Footer>
      </Content>
    </Screen>
  );
}
