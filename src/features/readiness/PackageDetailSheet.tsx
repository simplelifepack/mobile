import React, { useState } from 'react';
import { Linking } from 'react-native';
import { Skeleton } from '../../components/feedback/Skeleton';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
  Lock,
  GraduationCap,
  IdCard,
  Plane,
  HeartPulse,
  Landmark,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react-native';
import { AppModal } from '../../components/primitives/AppModal';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { ReadinessRing } from '../../components/primitives/ReadinessRing';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { DocumentRecord, PackageSummary } from '../../api/types';
import type {
  DerivedRequirement,
  PackReadiness,
} from './calculatePackReadiness';
import { documentMatchesRequirement } from './calculatePackReadiness';
import { sourceProviderName } from './packageSourceDisplay';
import * as S from './packageDetail.styles';
type Props = React.PropsWithChildren<{
  pack: PackageSummary;
  readiness: PackReadiness;
  documents: DocumentRecord[];
  busy: boolean;
  feedback?: string;
  skippedIds: string[];
  includedIds: string[];
  extraIds?: string[];
  tools?: React.ReactNode;
  onClose: () => void;
  onRefresh: () => void;
  onSkip: (id: string) => void;
  onUpload: (id: string) => void;
  onAssign: (item: DerivedRequirement) => void;
  onClear: (item: DerivedRequirement) => void;
  onView: (item: DocumentRecord) => void;
  onToggleDocument: (id: string) => void;
  onDownload: () => void;
  onShare: () => void;
  onExport: () => void;
}>;
export function PackageDetailSheet(p: Props) {
  const { theme } = useAppTheme();
  const c = theme.colors;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addFor, setAddFor] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const found = p.readiness.requirements.filter(
    r => r.status === 'ready' && !p.skippedIds.includes(r.id),
  );
  const needed = p.readiness.requirements.filter(
    r => r.status !== 'ready' && !p.skippedIds.includes(r.id),
  );
  const skipped = p.readiness.requirements.filter(r =>
    p.skippedIds.includes(r.id),
  );
  const sources =
    p.pack.verificationSources?.filter(s => /^https?:\/\//.test(s.url)) ?? [];
  const rawLinks = sources.length
    ? sources
    : p.pack.source?.url && /^https?:\/\//.test(p.pack.source.url)
      ? [p.pack.source]
      : [];
  const links = rawLinks.filter(
    (source, index) =>
      rawLinks.findIndex(
        other =>
          other.url?.replace(/\/$/, '') === source.url?.replace(/\/$/, ''),
      ) === index,
  );
  const checked =
    p.pack.source?.lastCheckedAt ??
    sources[0]?.retrievedAt ??
    p.pack.lastVerifiedAt;
  const date =
    checked && !Number.isNaN(Date.parse(checked))
      ? new Date(checked).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
  const matchedIds = new Set(
    found.flatMap(r => (r.matchedDocument ? [r.matchedDocument.id] : [])),
  );
  const downloadDocuments = p.documents.filter(
    d =>
      matchedIds.has(d.id) ||
      p.extraIds?.includes(d.id) ||
      p.includedIds.includes(d.id),
  );
  const Icon = /education/i.test(p.pack.category)
    ? GraduationCap
    : /travel/i.test(p.pack.category)
      ? Plane
      : /health/i.test(p.pack.category)
        ? HeartPulse
        : /money/i.test(p.pack.category)
          ? Landmark
          : /jobs/i.test(p.pack.category)
            ? Briefcase
            : IdCard;
  const textAction = (label: string, fn: () => void) => (
    <S.TextAction
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={fn}
      disabled={p.busy}
    >
      <S.ActionLabel>{label}</S.ActionLabel>
    </S.TextAction>
  );
  return (
    <AppModal visible animationType="slide" onRequestClose={p.onClose}>
      <S.Surface>
        <S.Scroller keyboardShouldPersistTaps="handled">
          <S.Header>
            <S.Line>
              <S.IconTile>
                <Icon size={24} color={c.primary} />
              </S.IconTile>
              <S.Copy>
                <AppText variant="overviewTitle">{p.pack.title}</AppText>
                <AppText color="secondary">
                  {p.pack.subtitle || p.pack.category}
                </AppText>
              </S.Copy>
              <S.IconAction
                accessibilityRole="button"
                accessibilityLabel="Close package details"
                onPress={p.onClose}
              >
                <X size={22} color={c.textPrimary} />
              </S.IconAction>
            </S.Line>
            {p.pack.description?.trim() &&
            p.pack.description.trim().toLowerCase() !==
              (p.pack.subtitle || p.pack.category).trim().toLowerCase() ? (
              <AppText color="secondary">{p.pack.description}</AppText>
            ) : null}
            <S.SourceCard>
              <AppText variant="caption" color="muted">
                {links.length > 1 ? 'Sources' : 'Source'}
              </AppText>
              {links.length ? (
                links.map((s, i) => (
                  <S.SourceLink
                    key={`${s.url}-${i}`}
                    accessibilityRole="link"
                    onPress={() => void Linking.openURL(s.url!)}
                  >
                    <S.ActionLabel>
                      {sourceProviderName(s)}
                      {links.filter(
                        other =>
                          sourceProviderName(other) === sourceProviderName(s),
                      ).length > 1
                        ? ` · ${s.title && s.title !== sourceProviderName(s) ? s.title : `Page ${i + 1}`}`
                        : ''}
                    </S.ActionLabel>
                  </S.SourceLink>
                ))
              ) : (
                <AppText variant="caption" color="muted">
                  No source saved for this package.
                </AppText>
              )}
              <AppText variant="caption" color="muted">
                {date ? `Last checked ${date}` : 'Not yet checked'}
              </AppText>
              <S.Refresh
                accessibilityRole="button"
                accessibilityLabel="Check latest requirements"
                disabled={p.busy}
                onPress={p.onRefresh}
              >
                {p.busy ? (
                  <Skeleton height={22} />
                ) : (
                  <RefreshCw size={19} color={c.textMuted} />
                )}
              </S.Refresh>
            </S.SourceCard>
            <S.Line>
              <ReadinessRing score={p.readiness.percentage} size={64} />
              <S.Copy>
                <AppText
                  color={
                    p.readiness.percentage === 100 ? 'success' : 'secondary'
                  }
                >
                  {p.readiness.percentage === 100
                    ? 'Everything in place'
                    : `${p.readiness.satisfiedRequired} of ${p.readiness.totalRequired} ready`}
                </AppText>
              </S.Copy>
              <S.IconAction
                accessibilityRole="button"
                accessibilityLabel="Package actions"
                accessibilityState={{ expanded: more }}
                onPress={() => setMore(!more)}
              >
                <MoreHorizontal size={22} color={c.textMuted} />
              </S.IconAction>
            </S.Line>
            {more ? (
              <>
                <S.Actions>
                  {textAction('Share checklist', p.onShare)}
                  {textAction('Export PDF', p.onExport)}
                </S.Actions>
                {p.tools}
              </>
            ) : null}
          </S.Header>
          <S.Body>
            {p.feedback ? (
              <AppText accessibilityRole="alert" color="secondary">
                {p.feedback}
              </AppText>
            ) : null}
            <S.Panel>
              <S.PanelHeader>
                <CheckCircle2 size={18} color={c.success} />
                <AppText variant="label">
                  Already in your vault ({found.length})
                </AppText>
              </S.PanelHeader>
              {found.map(r => {
                const alternatives = p.documents.filter(
                  d =>
                    d.id !== r.matchedDocument?.id &&
                    documentMatchesRequirement(r, d),
                );
                return (
                  <S.Item key={r.id}>
                    <S.RequirementRow
                      $expanded={expanded === r.id}
                      accessibilityRole="button"
                      accessibilityLabel={r.title}
                      accessibilityState={{ expanded: expanded === r.id }}
                      onPress={() =>
                        setExpanded(expanded === r.id ? null : r.id)
                      }
                    >
                      <S.Status $ready>
                        <Check size={14} color={c.success} />
                      </S.Status>
                      <S.Copy>
                        <AppText variant="label">{r.title}</AppText>
                        <AppText variant="caption" color="secondary">
                          {r.matchedDocument?.displayName ||
                            r.matchedDocument?.title ||
                            r.matchedDocument?.originalName}
                        </AppText>
                        {alternatives.length ? (
                          <AppText variant="caption" color="muted">
                            Also available:{' '}
                            {alternatives
                              .map(
                                d => d.displayName || d.title || d.originalName,
                              )
                              .join(', ')}
                          </AppText>
                        ) : null}
                        {typeof r.metadata?.condition === 'string' ? (
                          <AppText variant="caption" color="muted">
                            {r.metadata.condition}
                          </AppText>
                        ) : null}
                      </S.Copy>
                      {expanded === r.id ? (
                        <ChevronDown size={16} color={c.textMuted} />
                      ) : (
                        <ChevronRight size={16} color={c.textMuted} />
                      )}
                    </S.RequirementRow>
                    {expanded === r.id ? (
                      <S.Detail>
                        <AppText variant="label">
                          {r.matchedDocument?.originalName ||
                            r.matchedDocument?.displayName}
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          {r.assignmentSource === 'AUTO'
                            ? 'Automatically matched from Documents'
                            : 'Selected for this requirement'}
                        </AppText>
                        <S.Actions>
                          <S.TextAction
                            accessibilityRole="button"
                            onPress={() =>
                              r.matchedDocument && p.onView(r.matchedDocument)
                            }
                            disabled={p.busy}
                          >
                            <Eye size={16} color={c.primary} />
                            <S.ActionLabel>View</S.ActionLabel>
                          </S.TextAction>
                          {textAction('Replace', () => p.onAssign(r))}
                          {r.assignment
                            ? textAction('Use automatic matching', () =>
                                p.onClear(r),
                              )
                            : null}
                        </S.Actions>
                      </S.Detail>
                    ) : null}
                  </S.Item>
                );
              })}
              {!found.length ? (
                <S.DownloadBody>
                  <AppText variant="caption" color="muted">
                    Matching documents will appear here.
                  </AppText>
                </S.DownloadBody>
              ) : null}
            </S.Panel>
            {needed.length ? (
              <S.Panel>
                <S.PanelHeader>
                  <AlertTriangle size={18} color={c.warning} />
                  <AppText variant="label">
                    Still needed ({needed.length})
                  </AppText>
                </S.PanelHeader>
                {needed.map(r => (
                  <S.Item key={r.id}>
                    <S.RequirementRow as={S.Line}>
                      <S.Status>
                        <X size={13} color={c.warning} />
                      </S.Status>
                      <S.Copy>
                        <AppText variant="label">{r.title}</AppText>
                        {Boolean(r.metadata?.condition) || !r.required ? (
                          <AppText variant="caption" color="muted">
                            {typeof r.metadata?.condition === 'string'
                              ? r.metadata.condition
                              : 'May be required depending on your situation'}
                          </AppText>
                        ) : null}
                      </S.Copy>
                      <S.SmallAction
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${r.title}`}
                        accessibilityState={{ expanded: addFor === r.id }}
                        onPress={() => setAddFor(addFor === r.id ? null : r.id)}
                      >
                        <S.ActionLabel>Add</S.ActionLabel>
                      </S.SmallAction>
                    </S.RequirementRow>
                    {addFor === r.id ? (
                      <S.Detail>
                        {r.description ? (
                          <AppText variant="caption" color="secondary">
                            {r.description}
                          </AppText>
                        ) : null}
                        <S.Actions>
                          {textAction('Upload', () => p.onUpload(r.id))}
                          {textAction('Pick from Documents', () =>
                            p.onAssign(r),
                          )}
                          {textAction('Not needed', () => {
                            p.onSkip(r.id);
                            setAddFor(null);
                          })}
                        </S.Actions>
                      </S.Detail>
                    ) : null}
                  </S.Item>
                ))}
              </S.Panel>
            ) : null}
            {skipped.length ? (
              <S.Panel>
                <S.PanelHeader>
                  <X size={18} color={c.textMuted} />
                  <AppText variant="label">
                    Not needed ({skipped.length})
                  </AppText>
                </S.PanelHeader>
                {skipped.map(r => (
                  <S.Item key={r.id}>
                    <S.RequirementRow as={S.Line}>
                      <S.Copy>
                        <AppText>{r.title}</AppText>
                      </S.Copy>
                      {textAction('Need it after all', () => p.onSkip(r.id))}
                    </S.RequirementRow>
                  </S.Item>
                ))}
              </S.Panel>
            ) : null}
            <S.Panel>
              <S.PanelHeader>
                <S.Copy>
                  <AppText variant="label">In this download</AppText>
                  <AppText variant="caption" color="muted">
                    {p.includedIds.length}{' '}
                    {p.includedIds.length === 1 ? 'document' : 'documents'}{' '}
                    selected
                  </AppText>
                </S.Copy>
              </S.PanelHeader>
              {downloadDocuments.map(d => (
                <S.Item key={d.id}>
                  <S.RequirementRow
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: p.includedIds.includes(d.id),
                    }}
                    accessibilityLabel={d.displayName || d.originalName}
                    onPress={() => p.onToggleDocument(d.id)}
                  >
                    <S.Checkbox $checked={p.includedIds.includes(d.id)}>
                      {p.includedIds.includes(d.id) ? (
                        <Check size={13} color={c.onPrimary} />
                      ) : null}
                    </S.Checkbox>
                    <S.Copy>
                      <AppText>{d.displayName || d.originalName}</AppText>
                    </S.Copy>
                  </S.RequirementRow>
                </S.Item>
              ))}
              <S.DownloadBody>
                {textAction('Add another document', () =>
                  setExtraOpen(!extraOpen),
                )}
                {extraOpen ? (
                  <>
                    {p.documents
                      .filter(d => !matchedIds.has(d.id))
                      .map(d => (
                        <S.TextAction
                          accessibilityRole="checkbox"
                          accessibilityState={{
                            checked: p.includedIds.includes(d.id),
                          }}
                          key={d.id}
                          onPress={() => p.onToggleDocument(d.id)}
                        >
                          <S.Checkbox $checked={p.includedIds.includes(d.id)} />
                          <AppText>{d.displayName || d.originalName}</AppText>
                        </S.TextAction>
                      ))}
                    {textAction('Upload another document', () =>
                      p.onUpload('extra'),
                    )}
                  </>
                ) : null}
                <Button
                  title="Download documents as ZIP"
                  disabled={p.busy || !p.includedIds.length}
                  onPress={p.onDownload}
                />
              </S.DownloadBody>
            </S.Panel>
            <S.Line>
              <Lock size={14} color={c.textMuted} />
              <S.Copy>
                <AppText variant="caption" color="muted">
                  {typeof p.pack.searchMetadata?.disclaimer === 'string'
                    ? p.pack.searchMetadata.disclaimer
                    : 'Checklist based on stored requirements; completeness and eligibility are not guaranteed.'}
                </AppText>
              </S.Copy>
            </S.Line>
          </S.Body>
        </S.Scroller>
        {p.children}
      </S.Surface>
    </AppModal>
  );
}
