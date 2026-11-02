import React from 'react';
import {
Pressable,
ScrollView,
View
} from 'react-native';

import {
CalendarDays,
Shield
} from 'lucide-react-native';



import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { styles } from '../healthStyles';
import { tabs } from '../healthTypes';
import { sizes } from '../../../design/tokens/sizes';

export function PrepareVisit({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.prepareVisit,
        {
          backgroundColor:
            theme.colors.action.primary.default,
        },
      ]}
    >
      <CalendarDays
        size={sizes.icon.md}
        color={
          theme.colors.text.onBrand
        }
        strokeWidth={2}
      />

      <AppText
        style={[
          styles.prepareText,
          {
            color:
              theme.colors.text.onBrand,
          },
        ]}
      >
        Prepare for a visit
      </AppText>

      
    </Pressable>
  );
}


// ============================================================================
// QUICK ACTIONS
// ============================================================================

export function QuickActions({
  onInsurance,
}: {
  onInsurance: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.quickActions}>
      <Pressable
        onPress={onInsurance}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.surface.raised,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        <Shield
          size={sizes.icon.md}
          color={theme.colors.text.primary}
          strokeWidth={2}
        />

        <AppText
          style={styles.quickActionText}
          numberOfLines={1}
        >
          Insurance card
        </AppText>
      </Pressable>
    </View>
  );
}


// ============================================================================
// TABS
// ============================================================================

export function HealthTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.tabsScroll
      }
    >
      <View
        style={[
          styles.tabs,
          {
            borderBottomColor:
              theme.colors.border.default,
          },
        ]}
      >
        {tabs.map(tab => {
          const active =
            activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() =>
                onChange(tab)
              }
              style={[
                styles.tab,
                active && {
                  borderBottomColor:
                    theme.colors.text.interactive,
                },
              ]}
            >
              <AppText
                variant="label"
                color={
                  active
                    ? 'primary'
                    : 'secondary'
                }
                style={
                  styles.tabText
                }
              >
                {tab}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}


// ============================================================================
// TREND CHART
// ============================================================================
