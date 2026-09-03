import React from 'react';
import { Camera, FilePlus2, Bell } from 'lucide-react-native';
import { homeOverview } from './homeData';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { Card } from '../../components/primitives/Card';
import { Badge } from '../../components/primitives/Badge';
import { Button } from '../../components/primitives/Button';
export function HomeScreen() {
  const { theme } = useAppTheme();
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: theme.spacing.lg }}>
        <Row align="center" justify="space-between">
          <Stack gap="xs">
            <AppText variant="caption" color="muted">
              GOOD MORNING
            </AppText>
            <AppText variant="title">Hello, {homeOverview.name}</AppText>
          </Stack>
          <Bell color={theme.colors.textPrimary} size={theme.sizes.icon.md} />
        </Row>
        <Card>
          <Stack gap="md">
            <Row justify="space-between" align="center">
              <AppText variant="heading">Your readiness</AppText>
              <Badge label={`${homeOverview.readiness.packs} packs`} />
            </Row>
            <AppText variant="display">
              {homeOverview.readiness.complete}%
            </AppText>
            <AppText color="secondary">
              You’re making good progress. Two items need attention.
            </AppText>
          </Stack>
        </Card>
        <Stack gap="sm">
          <AppText variant="heading">Quick actions</AppText>
          <Button title="Scan document" onPress={() => {}} />
          <Button title="Add document" variant="secondary" onPress={() => {}} />
          <Button
            title="Find readiness pack"
            variant="ghost"
            onPress={() => {}}
          />
        </Stack>
        <Row gap="md">
          <Card style={{ flex: 1 }}>
            <Stack gap="xs">
              <FilePlus2
                size={theme.sizes.icon.md}
                color={theme.colors.primary}
              />
              <AppText variant="heading">
                {homeOverview.documents.total}
              </AppText>
              <AppText variant="caption" color="muted">
                Documents
              </AppText>
            </Stack>
          </Card>
          <Card style={{ flex: 1 }}>
            <Stack gap="xs">
              <Camera size={theme.sizes.icon.md} color={theme.colors.warning} />
              <AppText variant="heading">
                {homeOverview.documents.needsAttention}
              </AppText>
              <AppText variant="caption" color="muted">
                Need attention
              </AppText>
            </Stack>
          </Card>
        </Row>
        <Stack gap="sm">
          <AppText variant="heading">Recent</AppText>
          {homeOverview.recent.map(item => (
            <Card key={item.id}>
              <Row justify="space-between" align="center">
                <AppText variant="label">{item.title}</AppText>
                <AppText variant="caption" color="muted">
                  {item.status}
                </AppText>
              </Row>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Screen>
  );
}
