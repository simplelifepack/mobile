import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, X } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';
import { staticColors } from '../../design/tokens/colors';
import { radius } from '../../design/tokens/radius';

export type DateFormat = 'iso' | 'us';

const pad = (value: number) => String(value).padStart(2, '0');

function parseDate(value: string): Date | undefined {
  const trimmed = value.trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  let year: number;
  let month: number;
  let day: number;
  if (match) {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed))) {
    [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : undefined;
}

function formatDate(date: Date, format: DateFormat) {
  return format === 'iso'
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

export function DatePickerInput({
  value,
  onChangeText,
  placeholder = 'Select date',
  style,
  dateFormat = 'iso',
  minimumDate,
  maximumDate,
  disabled,
  clearable = true,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  dateFormat?: DateFormat;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  clearable?: boolean;
}) {
  const { theme } = useAppTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(new Date());
  const current = parseDate(value);
  const flat = StyleSheet.flatten(style) ?? {};

  const open = () => {
    const initial = current ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'set' && selected) {
            onChangeText(formatDate(selected, dateFormat));
          }
        },
      });
      return;
    }
    setDraft(initial);
    setIosOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Date ${value}. Change date` : placeholder}
        disabled={disabled}
        onPress={open}
        style={[
          style,
          styles.row,
          { justifyContent: 'space-between', opacity: disabled ? 0.55 : 1 },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            {
              fontSize: flat.fontSize ?? 14,
              color: value ? theme.colors.text.primary : theme.colors.text.tertiary,
            },
          ]}
        >
          {value || placeholder}
        </Text>
        {value && clearable ? (
          <Pressable
            accessibilityLabel="Clear date"
            hitSlop={10}
            onPress={() => onChangeText('')}
          >
            <X size={16} color={theme.colors.text.secondary} />
          </Pressable>
        ) : (
          <CalendarDays size={18} color={theme.colors.text.secondary} />
        )}
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <View style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosOpen(false)} />
            <View style={[styles.sheet, { backgroundColor: theme.colors.surface.default }]}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={10}>
                  <AppText color="secondary">Cancel</AppText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChangeText(formatDate(draft, dateFormat));
                    setIosOpen(false);
                  }}
                  hitSlop={10}
                >
                  <AppText style={{ color: theme.colors.text.interactive, fontWeight: '700' }}>Done</AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                themeVariant={theme.isDark ? 'dark' : 'light'}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_event, selected) => selected && setDraft(selected)}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: staticColors.scrim },
  sheet: { borderTopLeftRadius: radius.overlay, borderTopRightRadius: radius.overlay, padding: 16, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});
