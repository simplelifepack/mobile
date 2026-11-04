import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from './Stack';
import { Row } from './Row';
import { AppText } from './AppText';

export const PageContent = styled(Stack).attrs({ gap: 'lg' as const })(
  ({ theme }) => ({
    paddingVertical: theme.spacing.lg,
  }),
);
export const AuthContent = styled(Stack).attrs({ gap: 'lg' as const })(
  ({ theme }) => ({
    paddingVertical: theme.spacing.xl,
  }),
);
export const ProfileContent = styled(Stack).attrs({ gap: 'lg' as const })(
  ({ theme }) => ({
    paddingTop: theme.spacing.lg,
  }),
);
export const OnboardingLayout = styled(Stack).attrs({ gap: 'xl' as const })(
  ({ theme }) => ({
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  }),
);
export const CenteredContent = styled(Stack)(() => ({
  flex: 1,
  justifyContent: 'center',
}));
export const WrapRow = styled(Row)(() => ({ flexWrap: 'wrap' }));
export const FlexText = styled(AppText)(() => ({ flex: 1 }));
export const HiddenText = styled(AppText)(() => ({
  position: 'absolute',
  opacity: 0,
}));
export const ModalSurface = styled(SafeAreaView).attrs({
  edges: ['top', 'bottom'] as const,
})(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
}));
export const ModalContent = styled(Stack)(({ theme }) => ({
  width: '100%',
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.lg,
}));
export const ModalOptions = styled.ScrollView.attrs({
  automaticallyAdjustKeyboardInsets: true,
  keyboardDismissMode: 'interactive' as const,
})(() => ({ flex: 1 }));

export const ModalPanel = styled(ModalContent)(() => ({ flex: 1 }));
