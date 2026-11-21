import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';

export function DocumentImportProgress({ total, completed, saved, currentName, cancelled, onCancel }: {
  total: number;
  completed: number;
  saved: number;
  currentName?: string;
  cancelled: boolean;
  onCancel: () => void;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const movement = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(movement, {
      toValue: 1,
      duration: 1400,
      easing: Easing.linear,
      useNativeDriver: false,
    }));
    animation.start();
    return () => animation.stop();
  }, [movement]);
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.overlay.scrim }]}>
      <View style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
        <AppText variant="heading" numberOfLines={2}>{currentName || 'Preparing documents'}</AppText>
        <AppText variant="bodySm" color="secondary">{completed} of {total} processed · {saved} saved</AppText>
        <View accessibilityRole="progressbar" accessibilityLabel="Document import progress"
          accessibilityValue={{ min: 0, max: total, now: completed }}
          style={[styles.track, { backgroundColor: colors.border.default }]}>
          <View testID="completed-progress" style={[styles.fill, { width: `${percentage}%`, backgroundColor: colors.action.primary.default }]} />
          {completed < total ? (
            <View testID="active-progress-track" style={[styles.activeTrack, { width: `${100 - percentage}%` }]}>
              <Animated.View testID="active-progress" style={[styles.activeFill, {
                backgroundColor: colors.action.primary.default,
                left: movement.interpolate({ inputRange: [0, 1], outputRange: ['-30%', '100%'] }),
              }]} />
            </View>
          ) : null}
        </View>
        <AppText variant="bodySm" style={{ color: colors.text.interactive }}>
          {cancelled ? 'Finishing the current document, then stopping.' : `Processing document… · ${percentage}% of batch completed`}
        </AppText>
        <Button title={cancelled ? 'Stopping…' : 'Cancel remaining'} variant="secondary" disabled={cancelled} onPress={onCancel} />
        <AppText variant="caption" color="secondary">The current document will finish. Saved documents are kept.</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 480, borderWidth: 1, borderRadius: radius.surface, padding: 20, gap: 12 },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row' },
  fill: { height: '100%', borderRadius: radius.pill },
  activeTrack: { height: '100%', overflow: 'hidden' },
  activeFill: { width: '30%', height: '100%', borderRadius: radius.pill },
});
