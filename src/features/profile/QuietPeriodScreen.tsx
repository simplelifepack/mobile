import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Check, ChevronLeft, Clock3 } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import {
  quietPeriodPreference,
  type QuietPeriodHours,
} from './quietPeriodPreference';

const choices: ReadonlyArray<{
  hours: QuietPeriodHours;
  title: string;
  description: string;
}> = [
  {
    hours: 0,
    title: 'No wait',
    description: 'Send immediately after confirmation.',
  },
  {
    hours: 12,
    title: '12 hours',
    description: 'Saved on this device only.',
  },
  {
    hours: 24,
    title: '24 hours · Recommended',
    description: 'Saved on this device only.',
  },
  {
    hours: 48,
    title: '48 hours',
    description: 'Saved on this device only.',
  },
];

export function QuietPeriodScreen({
  userId,
  userName,
  onClose,
  onSaved,
}: {
  userId: string;
  userName?: string;
  onClose: () => void;
  onSaved: (hours: QuietPeriodHours) => void;
}) {
  const { theme } = useAppTheme();
  const [current, setCurrent] = useState<QuietPeriodHours>();
  const [selected, setSelected] = useState<QuietPeriodHours>(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    quietPeriodPreference
      .read(userId)
      .then(hours => {
        if (!active) return;
        setCurrent(hours);
        setSelected(hours);
      })
      .catch(readError => {
        if (active) {
          setError(
            readError instanceof Error
              ? readError.message
              : 'Unable to load the quiet period preference.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await quietPeriodPreference.write(userId, selected);
      setCurrent(selected);
      onSaved(selected);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the quiet period preference.',
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) onClose();
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.surface.canvas },
          ]}
        >
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          />
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Row align="center" gap="sm" style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                disabled={saving}
                onPress={close}
                style={styles.back}
              >
                <ChevronLeft
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                />
              </Pressable>
              <AppText variant="overviewTitle">Quiet period</AppText>
            </Row>
            <Row
              align="center"
              justify="space-between"
              style={styles.familyContext}
            >
              <AppText variant="caption" color="interactive">
                {userName ? `${userName} · You` : 'You'}
              </AppText>
              <AppText variant="caption" color="secondary">
                Private Wealth register
              </AppText>
            </Row>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <Stack gap="xs">
                <AppText variant="heading">Quiet-period preference</AppText>
                <AppText variant="bodySm" color="secondary">
                  Choose a preferred quiet-period length. This device-only
                  setting does not schedule or delay handoff delivery.
                </AppText>
              </Stack>

              {loading ? (
                <AppText variant="bodySm" color="secondary">
                  Loading your saved preference…
                </AppText>
              ) : (
                choices.map(choice => {
                  const isSelected = selected === choice.hours;
                  return (
                    <Pressable
                      key={choice.hours}
                      accessibilityRole="radio"
                      accessibilityLabel={choice.title}
                      accessibilityState={{ selected: isSelected }}
                      disabled={saving}
                      onPress={() => setSelected(choice.hours)}
                      style={[
                        styles.option,
                        { backgroundColor: theme.colors.surface.raised },
                        isSelected && {
                          borderColor: theme.colors.border.interactive,
                        },
                      ]}
                    >
                      <Clock3
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                      <View style={styles.optionCopy}>
                        <AppText variant="label">{choice.title}</AppText>
                        <AppText variant="bodySm" color="secondary">
                          {current === choice.hours
                            ? 'Current setting'
                            : choice.description}
                        </AppText>
                      </View>
                      {isSelected ? (
                        <Check
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      ) : null}
                    </Pressable>
                  );
                })
              )}

              <Card
                style={[
                  styles.futureNotice,
                  { backgroundColor: theme.colors.surface.brandTint },
                ]}
              >
                <AppText variant="label" color="interactive">
                  For future handoffs
                </AppText>
                <AppText variant="bodySm">
                  Quiet-period scheduling is not available yet. SOS handoffs are
                  sent immediately after confirmation; the active quiet period
                  screen is currently a UI preview only.
                </AppText>
              </Card>
              {error ? (
                <AppText
                  variant="caption"
                  color="danger"
                  accessibilityRole="alert"
                >
                  {error}
                </AppText>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title={saving ? 'Saving…' : 'Save quiet period'}
                disabled={loading || saving}
                onPress={save}
              />
              <Button
                title="Cancel"
                variant="secondary"
                disabled={saving}
                onPress={close}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    minHeight: sizes.minimumTouchTarget,
    paddingHorizontal: space[12],
  },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: {
    minHeight: 23,
    paddingHorizontal: space[20],
  },
  content: {
    padding: layout.gutter,
    gap: spacing.md,
  },
  option: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionCopy: { flex: 1, gap: space[2] },
  futureNotice: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
    borderColor: 'transparent',
  },
  actions: {
    paddingHorizontal: layout.gutter,
    paddingTop: space[16],
    paddingBottom: space[16],
    gap: space[8],
  },
});
