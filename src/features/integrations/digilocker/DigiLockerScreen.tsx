import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { useAppDispatch } from '../../../app/store/hooks';
import { AppText } from '../../../components/primitives/AppText';
import { Row } from '../../../components/primitives/Row';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { api } from '../../../services/api';
import { DigiLockerCard } from './DigiLockerCard';
import { sizes } from '../../../design/tokens/sizes';

export function DigiLockerScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen scroll>
      <Stack gap="md" style={styles.container}>
        <Row align="center" gap="sm">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()}>
            <ArrowLeft size={sizes.icon.md} color={theme.colors.text.primary} />
          </Pressable>
          <AppText variant="title">Import from DigiLocker</AppText>
        </Row>
        <DigiLockerCard onImported={() => dispatch(api.util.invalidateTags(['Documents']))} />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 20, paddingBottom: 32 },
});
