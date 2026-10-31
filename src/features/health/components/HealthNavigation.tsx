import React from 'react';
import {
Pressable,
ScrollView,
View
} from 'react-native';

import {
CalendarDays,
IdCard,
Shield
} from 'lucide-react-native';



import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { styles } from '../healthStyles';
import { tabs } from '../healthTypes';

export function PrepareVisit({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.prepareVisit,
        {
          backgroundColor:
            theme.colors.primary,
        },
      ]}
    >
      <CalendarDays
        size={22}
        color={
          theme.colors.onPrimary
        }
        strokeWidth={2}
      />

      <AppText
        style={[
          styles.prepareText,
          {
            color:
              theme.colors.onPrimary,
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
  onEmergency,
  onInsurance,
}: {
  onEmergency: () => void;
  onInsurance: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.quickActions}>
      <Pressable
        onPress={onEmergency}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <IdCard
          size={22}
          color={theme.colors.textPrimary}
          strokeWidth={2}
        />

        <AppText
          style={styles.quickActionText}
          numberOfLines={1}
        >
          Emergency info
        </AppText>
      </Pressable>

      <Pressable
        onPress={onInsurance}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Shield
          size={22}
          color={theme.colors.textPrimary}
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
              theme.colors.border,
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
                    theme.colors
                      .primary,
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

              {tab ===
              'Medications' ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor:
                        theme.colors
                          .surfaceElevated,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color="secondary"
                  >
                    2
                  </AppText>
                </View>
              ) : null}

              {tab ===
              'Records' ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor:
                        theme.colors
                          .surfaceElevated,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color="secondary"
                  >
                    5
                  </AppText>
                </View>
              ) : null}
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
