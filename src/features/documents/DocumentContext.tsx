import React from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { useAppSelector } from '../../app/store/hooks';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { documentsApi } from '../../api/documents.api';
import { normalizeDocument } from '../../api/normalizeDocument';
import { mobileApi } from '../../api/mobile.api';
import type { DocumentRecord, PackageListItem } from '../../api/web.types';
import {
  documentRequirementTypes,
  normalizeRequirementValue,
} from '../readiness/calculatePackReadiness';
import {
  AppText,
  Button,
  ResourceStatus,
  useAction,
  useResource,
} from '../shared/FeatureUI';
import { DetailSheet } from '../shared/DetailSheet';
import * as S from './documentDetail.styles';
export function DocumentContext({
  document,
  onChanged,
  onClose,
  expiryControl,
}: {
  document: DocumentRecord;
  onChanged: (document: DocumentRecord) => void;
  onClose: () => void;
  expiryControl?: React.ReactNode;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(state => state.auth.user);
  const { theme } = useAppTheme();
  const [choosingOwner, setChoosingOwner] = React.useState(false);
  const people = useResource(documentsApi.assignmentOptions);
  const packages = useResource(async signal => {
    const items: PackageListItem[] = [];
    for (let page = 1; !signal.aborted; page++) {
      const result = await mobileApi.packages.list(
        { page, limit: 200, sort: 'title' },
        signal,
      );
      items.push(...result.items);
      if (!result.pagination.hasNextPage) break;
    }
    return items;
  });
  const usedIn = React.useMemo(() => {
    const types = new Set(documentRequirementTypes(document));
    return (packages.data ?? []).flatMap(pack => {
      const requirements = pack.requirements.filter(
        r =>
          r.assignment?.documentId === document.id ||
          r.acceptedDocumentTypes.some(type =>
            types.has(normalizeRequirementValue(type)),
          ),
      );
      return requirements.length
        ? [{ ...pack, required: requirements.some(r => r.required) }]
        : [];
    });
  }, [document, packages.data]);
  const action = useAction();
  const fields = document.fields as {
    assignedPerson?: { id?: string; name?: string };
  };
  const assignedId =
    fields?.assignedPerson?.id ?? document.ownerProfileId ?? user?.id;
  const ownerName =
    people.data?.find(p => p.id === assignedId)?.name ??
    fields?.assignedPerson?.name ??
    user?.name ??
    'Choose…';
  return (
    <>
      <S.Section>
        <AppText variant="label">Belongs to</AppText>
        <ResourceStatus resource={people} />
        <S.Control
          accessibilityRole="button"
          accessibilityLabel="Change document owner"
          accessibilityValue={{ text: ownerName }}
          disabled={action.busy || !people.data?.length}
          onPress={() => setChoosingOwner(true)}
        >
          <S.Copy>
            <AppText>{ownerName}</AppText>
          </S.Copy>
          <ChevronDown size={18} color={theme.colors.textMuted} />
        </S.Control>
      </S.Section>
      {expiryControl}
      {action.message ? (
        <AppText accessibilityRole="alert">{action.message}</AppText>
      ) : null}
      <S.Section>
        <AppText variant="label">Used in packages</AppText>
        <ResourceStatus resource={packages} />
        {!packages.loading && !packages.error && !usedIn.length ? (
          <AppText color="muted">
            No package currently requires this document type.
          </AppText>
        ) : null}
        {usedIn.map(pack => (
          <S.PackageRow
            key={pack.id}
            accessibilityRole="button"
            accessibilityLabel={`Open package ${pack.title}`}
            onPress={() => {
              onClose();
              navigation.navigate('Packages', { slug: pack.slug });
            }}
          >
            <FolderOpen size={17} color={theme.colors.primary} />
            <S.Copy>
              <AppText>{pack.title}</AppText>
            </S.Copy>
            <S.Pill>
              <AppText variant="caption" color="muted">
                {pack.required ? 'required' : 'optional'}
              </AppText>
            </S.Pill>
          </S.PackageRow>
        ))}
      </S.Section>
      {choosingOwner ? (
        <DetailSheet title="Belongs to" onClose={() => setChoosingOwner(false)}>
          {people.data?.map(person => (
            <Button
              key={person.id}
              title={`${person.id === assignedId ? '✓ ' : ''}${person.name}`}
              variant="ghost"
              disabled={action.busy}
              onPress={() => {
                setChoosingOwner(false);
                void action.run(async () => {
                  const result = await documentsApi.bulkAssign(
                    [document.id],
                    person.id,
                  );
                  const updated = result.documents.find(
                    d => d.id === document.id,
                  );
                  onChanged(
                    updated
                      ? normalizeDocument(updated)
                      : await documentsApi.getById(document.id),
                  );
                });
              }}
            />
          ))}
        </DetailSheet>
      ) : null}
    </>
  );
}
