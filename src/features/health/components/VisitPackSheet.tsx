import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, NativeModules, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Download, Eye, FileText, FolderCheck, Info, Plus, Share2, Stethoscope, UserRound } from 'lucide-react-native';
import { FileSystem } from 'react-native-file-access';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { healthApi, type HealthMember, type HealthRecord } from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import type { DocumentRecord } from '../../../api/types';
import { DocumentPreview } from '../../documents/DocumentPreview';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { SelectionMark } from '../../../components/primitives/ListRow';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { textRoles } from '../../../design/tokens/typography';
import { buildVisitContexts, buildVisitPackZip, formatVisitDate, visitItemDetail, visitItemLabel, type VisitContext, type VisitItem } from '../visitPack';

const filters = [
  { label: 'All records', value: 'all' },
  { label: 'Lab reports', value: 'lab_report' },
  { label: 'Prescriptions', value: 'prescription' },
] as const;

type PreparedPacket = { path: string; fileName: string; createdAt: Date };

export function VisitPackSheet({ member, visible, onClose }: {
  member?: HealthMember;
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [contextId, setContextId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualClinic, setManualClinic] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'lab_report' | 'prescription'>('all');
  const [downloading, setDownloading] = useState(false);
  const downloadingRef = useRef(false);
  const [step, setStep] = useState<'doctor' | 'documents' | 'review' | 'ready'>('doctor');
  const [packet, setPacket] = useState<PreparedPacket>();
  const packetRef = useRef<PreparedPacket | undefined>(undefined);
  const sessionRef = useRef(0);
  const [reload, setReload] = useState(0);
  const [previewItem, setPreviewItem] = useState<VisitItem>();
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    sessionRef.current += 1;
    return () => {
      sessionRef.current += 1;
      const current = packetRef.current;
      packetRef.current = undefined;
      if (current) {
        FileSystem.unlink(current.path).catch(cleanupError => console.warn('Unable to remove visit pack cache', cleanupError));
      }
    };
  }, [visible, member?.id]);

  useEffect(() => {
    if (!visible || !member?.id) return;
    let active = true;
    setRecords([]);
    setDocuments([]);
    setLoading(true);
    setError(undefined);
    setContextId('');
    setManualName('');
    setManualClinic('');
    setManualOpen(false);
    setVisitDate('');
    setSelectedIds(new Set());
    setFilter('all');
    setShowOthers(false);
    setPreviewItem(undefined);
    setStep('doctor');
    setPacket(undefined);
    Promise.all([healthApi.records(member.id), documentsApi.list()])
      .then(([nextRecords, nextDocuments]) => {
        if (active) {
          setRecords(nextRecords);
          setDocuments(nextDocuments);
        }
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Visit details could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visible, member?.id, reload]);

  const contexts = useMemo(() => buildVisitContexts(records), [records]);
  const doctorContexts = contexts.filter(item => item.kind === 'doctor');
  const otherContexts = contexts.filter(item => item.kind !== 'doctor');
  const context = contexts.find(item => item.id === contextId);
  const isManual = contextId === 'manual';
  const selectionLabel = isManual ? manualName.trim() : context?.label ?? '';
  const items = useMemo<VisitItem[]>(() => {
    const byId = new Map(documents.map(document => [document.id, document]));
    return records.map(record => ({ record, document: byId.get(record.documentId) }))
      .sort((a, b) => (b.record.documentDate || b.record.createdAt).localeCompare(a.record.documentDate || a.record.createdAt));
  }, [documents, records]);
  const selected = items.filter(item => selectedIds.has(item.record.id));
  const relatedIds = useMemo(
    () => new Set(isManual ? contexts.find(item => item.kind === 'recent')?.recordIds : context?.recordIds),
    [context, contexts, isManual],
  );
  const related = items.filter(item => relatedIds.has(item.record.id));
  const others = items.filter(item => !relatedIds.has(item.record.id));
  const othersOpen = showOthers || others.some(item => selectedIds.has(item.record.id));
  const filteredOthers = others.filter(item => filter === 'all' || item.record.type === filter);

  const choose = (id: string) => {
    if (id === contextId) return;
    setContextId(id);
    const ids = id === 'manual'
      ? contexts.find(item => item.kind === 'recent')?.recordIds ?? []
      : contexts.find(item => item.id === id)?.recordIds ?? [];
    setSelectedIds(new Set(ids));
    setFilter('all');
    setShowOthers(false);
    setError(undefined);
  };
  const toggle = (id: string) => setSelectedIds(current => {
    const next = new Set(current);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const prepare = async () => {
    if (!member || !selectionLabel || !selected.length || downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloading(true);
    setError(undefined);
    const session = sessionRef.current;
    try {
      const file = await buildVisitPackZip(selected, member.name, selectionLabel, visitDate || undefined, isManual ? manualClinic.trim() || undefined : undefined);
      if (session !== sessionRef.current) {
        await FileSystem.unlink(file.path).catch(cleanupError => console.warn('Unable to remove visit pack cache', cleanupError));
        return;
      }
      const prepared = { ...file, createdAt: new Date() };
      packetRef.current = prepared;
      setPacket(prepared);
      setStep('ready');
    } catch (reason) {
      if (session === sessionRef.current) setError(reason instanceof Error ? reason.message : 'The visit pack could not be prepared.');
    } finally {
      downloadingRef.current = false;
      setDownloading(false);
    }
  };
  const exportPacket = async (action: 'download' | 'share') => {
    if (!packet || downloadingRef.current) return;
    downloadingRef.current = true;
    setDownloading(true);
    setError(undefined);
    const session = sessionRef.current;
    try {
      if (Platform.OS === 'android' && action === 'download') {
        await FileSystem.cpExternal(packet.path, packet.fileName, 'downloads');
        Alert.alert('ZIP saved', `Saved to Downloads/${packet.fileName}.`);
      } else if (Platform.OS === 'ios') {
        await Share.share({ title: packet.fileName, url: `file://${packet.path}` });
      } else {
        const shareModule: { shareZip: (path: string, name: string) => Promise<void> } | undefined = NativeModules.VisitPackShare;
        if (!shareModule) throw new Error('ZIP sharing is unavailable on this device. Please download the ZIP instead.');
        await shareModule.shareZip(packet.path, packet.fileName);
      }
    } catch (reason) {
      if (session === sessionRef.current) setError(reason instanceof Error ? reason.message : 'The visit pack could not be exported.');
    } finally {
      downloadingRef.current = false;
      setDownloading(false);
    }
  };
  const viewDocument = (item: VisitItem) => setPreviewItem(item);
  const inputStyle = [styles.input, { backgroundColor: colors.surface.inset, borderColor: colors.border.default, color: colors.text.primary }];
  const back = () => {
    if (step === 'doctor') onClose();
    else if (step === 'ready') {
      const current = packetRef.current;
      packetRef.current = undefined;
      setPacket(undefined);
      setError(undefined);
      setStep('review');
      if (current) FileSystem.unlink(current.path).catch(cleanupError => console.warn('Unable to remove visit pack cache', cleanupError));
    }
    else setStep(step === 'review' ? 'documents' : 'doctor');
  };
  const renderDocument = (item: VisitItem, review = false) => {
    const checked = selectedIds.has(item.record.id);
    return (
      <View key={item.record.id} style={[styles.document, {
        backgroundColor: !review && checked ? colors.selection.surface : colors.surface.default,
        borderColor: !review && checked ? colors.border.interactive : colors.border.default,
      }]}>
        <Pressable accessibilityRole={review ? 'button' : 'checkbox'}
          accessibilityLabel={review ? `View ${visitItemLabel(item)}` : `Select ${visitItemLabel(item)}`}
          accessibilityState={review ? undefined : { checked }}
          onPress={() => review ? viewDocument(item) : toggle(item.record.id)} style={styles.documentSelect}>
          <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><FileText size={sizes.icon.md} color={colors.icon.interactive} /></View>
          <View style={styles.flex}>
            <AppText variant="compactLabel">{visitItemLabel(item)}</AppText>
            <AppText variant="caption" style={{ color: colors.text.interactive }}>{visitItemDetail(item)}</AppText>
          </View>
          <SelectionMark checked={checked} />
        </Pressable>
        {!review ? <Pressable accessibilityRole="button" accessibilityLabel={`View ${visitItemLabel(item)}`} onPress={() => { viewDocument(item); }} style={styles.viewButton}>
          <AppText variant="caption" style={{ color: colors.text.interactive }}>View</AppText>
        </Pressable> : null}
      </View>
    );
  };
  const contextCard = (item: VisitContext) => {
    const selectedContext = contextId === item.id;
    return (
      <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label}
        accessibilityState={{ checked: selectedContext }} onPress={() => { setManualOpen(false); choose(item.id); }}
        style={[styles.card, {
          borderColor: selectedContext ? colors.border.interactive : colors.border.default,
          backgroundColor: selectedContext ? colors.selection.surface : colors.surface.default,
        }]}>
        <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Stethoscope size={sizes.icon.md} color={colors.icon.interactive} /></View>
        <View style={styles.flex}>
          <AppText variant="compactLabel">{item.label}</AppText>
          <AppText variant="caption" style={{ color: colors.text.interactive }}>
            {item.recordIds.length} {item.recordIds.length === 1 ? 'document' : 'documents'}
          </AppText>
        </View>
        {selectedContext ? <CheckCircle2 size={sizes.icon.sm} color={colors.icon.interactive} /> : <Circle size={sizes.icon.sm} color={colors.icon.interactive} />}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { if (!downloading) onClose(); }}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface.canvas }]}>
          <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel={step === 'doctor' ? 'Close visit preparation' : step === 'ready' ? 'Back to packet review' : step === 'review' ? 'Back to document selection' : 'Back to doctor selection'}
                disabled={downloading} onPress={back} style={styles.back}>
                <ChevronLeft size={sizes.icon.md} color={colors.icon.primary} />
              </Pressable>
              <AppText variant="overviewTitle">{step === 'ready' ? 'Visit packet ready' : 'Prepare for a visit'}</AppText>
            </View>
            <View style={styles.member}>
              <UserRound size={sizes.icon.sm} color={colors.icon.interactive} />
              <AppText variant="caption" numberOfLines={1} style={[styles.memberName, { color: colors.text.interactive }]}>{member?.name ?? 'Health profile'}</AppText>
              <AppText variant="caption" color="muted" style={styles.vault}>Private health vault</AppText>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {step !== 'ready' ? (
                <>
                  <View style={styles.progress}>
                    {[0, 1, 2].map(index => <View key={index} style={[styles.progressBar, { backgroundColor: index <= (step === 'doctor' ? 0 : step === 'documents' ? 1 : 2) ? colors.action.primary.default : colors.border.default }]} />)}
                  </View>
                  <AppText variant="caption" style={{ color: colors.text.interactive }}>{step === 'doctor' ? 'Step 1 of 3 · Select doctor' : step === 'documents' ? 'Step 2 of 3 · Choose documents' : 'Step 3 of 3 · Review & share'}</AppText>
                </>
              ) : null}
              {loading ? <ActivityIndicator color={colors.icon.interactive} /> : step === 'doctor' ? (
                <>
                  <AppText variant="heading">Who are you visiting?</AppText>
                  <AppText variant="bodySm" color="secondary">Build a packet of {member?.name ?? 'your'}&apos;s records to take along. Nothing is shared yet.</AppText>
                  {error ? (
                    <>
                      <AppText color="danger">{error}</AppText>
                      <Pressable accessibilityRole="button" onPress={() => setReload(value => value + 1)}><AppText color="primary">Retry</AppText></Pressable>
                    </>
                  ) : (
                    <>
                      <AppText variant="compactLabel">Your doctors</AppText>
                      {doctorContexts.length ? doctorContexts.map(contextCard) : <AppText variant="caption" color="secondary">No doctors found in your records.</AppText>}
                      <Pressable accessibilityRole="button" accessibilityLabel="Add another doctor" onPress={() => { setManualOpen(true); choose('manual'); }}
                        style={[styles.card, { backgroundColor: colors.surface.default, borderColor: isManual ? colors.border.interactive : colors.border.default }]}>
                        <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Plus size={sizes.icon.md} color={colors.icon.interactive} /></View>
                        <View style={styles.flex}><AppText variant="compactLabel">Add another doctor</AppText><AppText variant="caption" style={{ color: colors.text.interactive }}>Enter a doctor&apos;s name and clinic</AppText></View>
                        <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
                      </Pressable>
                      {manualOpen ? (
                        <>
                          <View style={styles.field}><AppText variant="caption" color="secondary">Doctor&apos;s name</AppText><TextInput accessibilityLabel="Doctor's name" value={manualName} onChangeText={setManualName} maxLength={180} placeholder="Enter name" placeholderTextColor={colors.text.tertiary} style={inputStyle} /></View>
                          <View style={styles.field}><AppText variant="caption" color="secondary">Clinic (optional)</AppText><TextInput accessibilityLabel="Clinic (optional)" value={manualClinic} onChangeText={setManualClinic} maxLength={180} placeholder="Enter clinic" placeholderTextColor={colors.text.tertiary} style={inputStyle} /></View>
                          <AppText variant="caption" color="secondary">This doctor is only used for this packet. Recent records will be preselected.</AppText>
                        </>
                      ) : null}
                      {otherContexts.length ? <AppText variant="compactLabel">Other record selections</AppText> : null}
                      {otherContexts.map(contextCard)}
                      <View style={styles.field}>
                        <AppText variant="caption" color="secondary">Visit date (optional)</AppText>
                        <DatePickerInput value={visitDate} onChangeText={setVisitDate} displayValue={visitDate ? formatVisitDate(visitDate) : undefined} style={inputStyle} />
                      </View>
                      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
                        <Info size={sizes.icon.sm} color={colors.icon.secondary} />
                        <AppText variant="caption" color="secondary" style={styles.flex}>The selection labels your packet. It does not book an appointment or send your records.</AppText>
                      </View>
                    </>
                  )}
                </>
              ) : step === 'documents' ? (
                <>
                  <AppText variant="heading">Choose relevant documents</AppText>
                  <AppText variant="bodySm" color="secondary">For {selectionLabel}{visitDate ? ` · ${formatVisitDate(visitDate)}` : ''}</AppText>
                  {isManual ? <AppText variant="caption" color="secondary">Recent records are preselected; they may not be related to this doctor.</AppText> : null}
                  <View style={styles.rowHeading}>
                    <AppText variant="compactLabel" style={styles.flex}>{isManual ? 'Recent records' : `Records for ${selectionLabel}`}</AppText>
                    <AppText variant="caption" style={{ color: colors.text.interactive }}>{selected.length} selected</AppText>
                  </View>
                  {related.length ? related.map(item => renderDocument(item)) : <AppText variant="bodySm" color="secondary">No records are linked to this selection.</AppText>}
                  {others.length ? (
                    othersOpen ? (
                      <>
                        <AppText variant="compactLabel">More from {member?.name}&apos;s documents</AppText>
                        <View style={styles.filters}>
                          {filters.map(option => (
                            <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: filter === option.value }} onPress={() => setFilter(option.value)}
                              style={[styles.filter, { backgroundColor: filter === option.value ? colors.action.primary.default : colors.surface.brandTint, borderColor: filter === option.value ? colors.action.primary.default : colors.border.default }]}>
                              <AppText variant="caption" style={{ color: filter === option.value ? colors.text.onBrand : colors.text.interactive }}>{option.label}</AppText>
                            </Pressable>
                          ))}
                        </View>
                        {filteredOthers.length ? filteredOthers.map(item => renderDocument(item)) : <AppText variant="bodySm" color="secondary">No other records match this filter.</AppText>}
                      </>
                    ) : (
                      <Pressable accessibilityRole="button" accessibilityLabel="Add more documents" onPress={() => setShowOthers(true)}
                        style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                        <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Plus size={sizes.icon.md} color={colors.icon.interactive} /></View>
                        <View style={styles.flex}>
                          <AppText variant="compactLabel">Add more documents</AppText>
                          <AppText variant="caption" style={{ color: colors.text.interactive }}>Choose from {others.length} other {others.length === 1 ? 'record' : 'records'} in {member?.name}&apos;s profile</AppText>
                        </View>
                        <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
                      </Pressable>
                    )
                  ) : null}
                  <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}><Info size={sizes.icon.sm} color={colors.icon.secondary} /><AppText variant="caption" color="secondary" style={styles.flex}>Only the documents you select will be included. You can remove any item before downloading or sharing.</AppText></View>
                </>
              ) : step === 'review' ? (
                <>
                  <AppText variant="heading">Your visit packet</AppText>
                  <View style={[styles.summary, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                    {[
                      ['Prepared for', member?.name ?? 'Health profile'],
                      ['Doctor', [selectionLabel, isManual ? manualClinic.trim() : ''].filter(Boolean).join(' · ')],
                      ['Visit', visitDate ? formatVisitDate(visitDate) : 'Not specified'],
                      ['Packet', `${selected.length} ${selected.length === 1 ? 'document' : 'documents'} · ZIP`],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.summaryRow}>
                        <AppText variant="caption" color="secondary" style={styles.summaryLabel}>{label}</AppText>
                        <AppText variant="bodySm" style={styles.flex}>{value}</AppText>
                      </View>
                    ))}
                  </View>
                  <View style={styles.rowHeading}>
                    <AppText variant="compactLabel" style={styles.flex}>Included documents</AppText>
                    <Pressable accessibilityRole="button" disabled={downloading} onPress={() => { if (!downloadingRef.current) setStep('documents'); }}><AppText variant="caption" style={{ color: colors.text.interactive }}>Change</AppText></Pressable>
                  </View>
                  {selected.map(item => renderDocument(item, true))}
                  <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}><Info size={sizes.icon.sm} color={colors.icon.secondary} /><AppText variant="caption" color="secondary" style={styles.flex}>Contains personal medical information. Share only with people you trust. The ZIP contains the selected documents and visit details, not a medical summary.</AppText></View>
                  {error ? <AppText color="danger">{error}</AppText> : null}
                </>
              ) : packet ? (
                <>
                  <View style={styles.readyIntro}>
                    <View style={[styles.readyIcon, { backgroundColor: colors.surface.brandTint }]}><FolderCheck size={sizes.icon.lg} color={colors.icon.interactive} /></View>
                    <AppText variant="heading" style={styles.center}>Ready to take along</AppText>
                    <AppText variant="bodySm" color="secondary" style={styles.center}>{member?.name}&apos;s selected documents have been packaged into a ZIP.</AppText>
                  </View>
                  <View style={[styles.summary, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                    <AppText variant="compactLabel">{packet.fileName}</AppText>
                    {[
                      ['Prepared for', [selectionLabel, isManual ? manualClinic.trim() : '', visitDate ? formatVisitDate(visitDate) : ''].filter(Boolean).join(' · ')],
                      ['Contents', `${selected.length} ${selected.length === 1 ? 'document' : 'documents'} · ZIP`],
                      ['Created', packet.createdAt.toLocaleString()],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.summaryRow}>
                        <AppText variant="caption" color="secondary" style={styles.summaryLabel}>{label}</AppText>
                        <AppText variant="bodySm" style={styles.flex}>{value}</AppText>
                      </View>
                    ))}
                  </View>
                  {([
                    { title: Platform.OS === 'ios' ? 'Save to Files' : 'Save to Downloads', description: Platform.OS === 'ios' ? 'Choose Save to Files in the share sheet' : 'Keep an offline copy on this device', icon: Download, action: 'download' },
                    { title: 'Share via another app', description: 'Choose a recipient in your device share sheet', icon: Share2, action: 'share' },
                  ] as const).map(item => (
                    <Pressable key={item.action} accessibilityRole="button" accessibilityLabel={item.title} disabled={downloading} onPress={() => { exportPacket(item.action); }}
                      style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                      <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><item.icon size={sizes.icon.md} color={colors.icon.interactive} /></View>
                      <View style={styles.flex}><AppText variant="compactLabel">{item.title}</AppText><AppText variant="caption" style={{ color: colors.text.interactive }}>{item.description}</AppText></View>
                      <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
                    </Pressable>
                  ))}
                  <View accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Preview ZIP unavailable" style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                    <View style={[styles.icon, { backgroundColor: colors.surface.secondary }]}><Eye size={sizes.icon.md} color={colors.icon.secondary} /></View>
                    <View style={styles.flex}><AppText variant="compactLabel" color="secondary">Preview ZIP unavailable</AppText><AppText variant="caption" color="secondary">Review individual documents on the previous screen</AppText></View>
                  </View>
                  <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}><Info size={sizes.icon.sm} color={colors.icon.secondary} /><AppText variant="caption" color="secondary" style={styles.flex}>Share only with people you trust. Recipients are never selected automatically. This packet is not saved in the app.</AppText></View>
                  {Platform.OS === 'android' ? <AppText variant="caption" color="secondary">Sharing keeps a temporary copy in the app cache. Expired copies are removed when you next share a packet, or by the system.</AppText> : null}
                  {error ? <AppText color="danger">{error}</AppText> : null}
                </>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              {step === 'doctor' ? (
                <Button title="Choose documents" disabled={loading || Boolean(error) || !selectionLabel} onPress={() => setStep('documents')} />
              ) : step === 'documents' ? (
                <Button title="Review" disabled={!selected.length} onPress={() => setStep('review')} />
              ) : step === 'review' ? (
                <>
                  <Button title={downloading ? 'Preparing ZIP…' : 'Prepare ZIP'} disabled={downloading} onPress={() => { prepare(); }} />
                  <Button title="Save packet (unavailable)" disabled />
                </>
              ) : (
                <Button title="Done" disabled={downloading} onPress={onClose} />
              )}
              {step === 'doctor' || step === 'documents' ? <Button title={step === 'doctor' ? 'Cancel' : 'Back'} variant="secondary" disabled={downloading} onPress={step === 'doctor' ? onClose : back} /> : null}
            </View>
          </KeyboardAvoidingView>
          {previewItem ? (
            <DocumentPreview documentId={previewItem.record.documentId} initialDocument={previewItem.document} onClose={() => setPreviewItem(undefined)} />
          ) : null}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  back: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40 },
  memberName: { flexShrink: 1 },
  vault: { flex: 1, textAlign: 'right' },
  content: { padding: 16, gap: 16 },
  progress: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 4, borderRadius: radius.pill },
  flex: { flex: 1, minWidth: 0 },
  card: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  icon: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 4 },
  input: { ...textRoles.bodySm, minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  document: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.surface },
  documentSelect: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  viewButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  rowHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summary: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryLabel: { width: 110 },
  readyIntro: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  readyIcon: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 },
});
