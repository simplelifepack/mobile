import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShieldCheck, Files, ListChecks } from 'lucide-react-native';
import { useAppDispatch } from '../../app/store/hooks';
import type { OnboardingStackParamList } from '../../app/navigation/types';
import { onboardingCompleted } from './onboardingSlice';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
type Page = {
  title: string;
  body: string;
  icon: 'files' | 'checks' | 'shield';
  next?: keyof OnboardingStackParamList;
};
const pages: Record<keyof OnboardingStackParamList, Page> = {
  Welcome: {
    title: 'Your important documents.\nOne secure place.',
    body: 'Organize the records that matter without turning your phone into another filing cabinet.',
    icon: 'files',
    next: 'ReadinessIntro',
  },
  ReadinessIntro: {
    title: "Know what you're ready for.",
    body: 'Readiness packs turn life events into clear, useful checklists so you can see what is complete and what needs attention.',
    icon: 'checks',
    next: 'PrivacyIntro',
  },
  PrivacyIntro: {
    title: 'Private by design.',
    body: 'A device-first architecture, private document storage, and app lock foundations keep sensitive information under your control.',
    icon: 'shield',
  },
};
export function OnboardingScreen({
  route,
  navigation,
}: NativeStackScreenProps<OnboardingStackParamList>) {
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();
  const page = pages[route.name as keyof OnboardingStackParamList];
  const Icon =
    page.icon === 'files'
      ? Files
      : page.icon === 'checks'
        ? ListChecks
        : ShieldCheck;
  const finish = () => dispatch(onboardingCompleted());
  return (
    <Screen>
      <Stack
        gap="xl"
        style={{
          flex: 1,
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.lg,
        }}
      >
        <Row justify="flex-end">
          <Button title="Skip" variant="ghost" onPress={finish} />
        </Row>
        <Stack gap="lg">
          <Icon size={56} color={theme.colors.text.interactive} />
          <AppText variant="display">{page.title}</AppText>
          <AppText color="secondary">{page.body}</AppText>
        </Stack>
        <Button
          title={page.next ? 'Next' : 'Get Started'}
          onPress={() =>
            page.next ? navigation.navigate(page.next) : finish()
          }
        />
      </Stack>
    </Screen>
  );
}
