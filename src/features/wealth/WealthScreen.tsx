import { LoadingState } from '../../components/feedback/LoadingState';
import { captureDocuments } from '../../native/captureDocuments';
import type { PickedDocument } from '../../native/documentFiles';
import { EmptyState } from '../../components/feedback/EmptyState';
import { NoSearchResults } from '../../components/feedback/NoSearchResults';
import { WealthEntrySheet } from './WealthEntrySheet';
import { TextAction } from '../../components/primitives/TextAction';
import { SearchBar } from '../../components/primitives/SearchBar';
import { classifyWealthRecord, wealthRecordFacts } from './wealthPresentation';
import { Camera, FileText, Plus, Coins } from 'lucide-react-native';
import { WealthGroups } from './WealthGroups';
import { ProofCaptureDialog } from './ProofCaptureDialog';
import { useAppDispatch } from '../../app/store/hooks';
import { api as appApi } from '../../services/api';
import { Progress } from '../../components/primitives/Progress';
import { Row } from '../../components/primitives/Row';
import { SectionTabs } from '../shared/SectionTabs';
import { wealthSummary } from './wealthSummary';
import { DetailSheet } from '../shared/DetailSheet';
import { DynamicWealthForm, Handoff } from './WealthTools';
import { wealthRecordPayload as payload } from '../../api/wealthRecord';
import React from 'react';
import { useRefreshOnFocus } from '../shared/useRefreshOnFocus';
import { mobileApi } from '../../api/mobile.api';
import type { WealthRecord, WealthRecordType } from '../../api/web.types';
import { Card } from '../../components/primitives/Card';
import {
  FeaturePage,
  Stack,
  AppText,
  Button,
  Details,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import {
  ActiveForm,
  type FormConfig,
  type FormField,
} from '../shared/RecordForm';
const types: WealthRecordType[] = [
  'ASSET',
  'LOAN_TAKEN',
  'LOAN_GIVEN',
  'INSURANCE',
  'PAYMENT_PROOF',
];
const baseFields: FormField[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'type', label: 'Record type', options: types, initial: 'ASSET' },
  { key: 'notes', label: 'Notes', type: 'multiline' },
  { key: 'followUpDate', label: 'Follow-up date', type: 'date' },
  { key: 'followUpNote', label: 'Follow-up note' },
];
export function WealthScreen({
  route,
}: {
  route?: { params?: { recordId?: string } };
}) {
  const dispatch = useAppDispatch();
  const [entryFiles, setEntryFiles] = React.useState<PickedDocument[]>();
  const [entry, setEntry] = React.useState<'holding' | 'money'>();
  const [proof, setProof] = React.useState<{
    record?: WealthRecord;
    files?: PickedDocument[];
  } | null>(null);
  const [holdingRequest, setHoldingRequest] = React.useState(0);
  const [handoffRequest, setHandoffRequest] = React.useState(0);
  const records = useResource(mobileApi.wealth.records);
  const documents = useResource(mobileApi.documents.list);
  useRefreshOnFocus(records.revalidate, documents.revalidate);
  const [query, setQuery] = React.useState('');
  const [showMath, setShowMath] = React.useState(false);
  const [filter, setFilter] = React.useState('All');
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const [selected, setSelected] = React.useState<WealthRecord>();
  const recordDetail = useResource(
    signal =>
      selected
        ? mobileApi.wealth.record(selected.id, signal)
        : Promise.resolve(undefined),
    [selected?.id],
  );
  React.useEffect(() => {
    if (recordDetail.data)
      setSelected(current =>
        current?.id === recordDetail.data?.id ? recordDetail.data : current,
      );
  }, [recordDetail.data]);
  const action = useAction(records.refresh);
  React.useEffect(() => {
    if (route?.params?.recordId)
      void action.run(
        async () =>
          setSelected(await mobileApi.wealth.record(route.params!.recordId!)),
        '',
      );
  }, [route?.params?.recordId]); // eslint-disable-line react-hooks/exhaustive-deps
  const edit = async (
    record?: WealthRecord,
    defaultType: WealthRecordType = 'ASSET',
  ) => {
    const full = record ? await mobileApi.wealth.record(record.id) : undefined;
    setForm({
      title: full ? 'Edit wealth record' : 'Add wealth record',
      draftId: full ? `wealth:${full.id}` : 'wealth:new-record',
      fields: [
        ...baseFields.map(field => ({
          ...field,
          initial: full
            ? String(full[field.key as keyof WealthRecord] ?? '')
            : field.key === 'type'
              ? defaultType
              : field.initial,
        })),
        ...Object.entries(
          full?.details ?? {
            amount: '',
            currency: 'INR',
            provider: '',
            accountNumber: '',
            nominee: '',
          },
        ).map(([key, value]) => ({
          key: `detail:${key}`,
          label: key.replace(/([A-Z])/g, ' $1'),
          initial: String(value ?? ''),
        })),
      ],
      submit: async values => {
        const details = { ...(full?.details ?? {}) };
        Object.entries(values)
          .filter(([key]) => key.startsWith('detail:'))
          .forEach(([key, value]) => {
            const name = key.slice(7);
            details[name] =
              typeof details[name] === 'boolean'
                ? value === 'true'
                : typeof details[name] === 'number'
                  ? Number(value)
                  : Array.isArray(details[name])
                    ? value.split(',').map(item => item.trim())
                    : value;
          });
        const next = {
          type: values.type as WealthRecordType,
          title: values.title,
          details,
          notes: values.notes,
          followUpDate: values.followUpDate || null,
          followUpNote: values.followUpNote,
          attachmentDocumentIds: full
            ? payload(full).attachmentDocumentIds
            : [],
        };
        const saved = full
          ? await mobileApi.wealth.updateRecord(full.id, next)
          : await mobileApi.wealth.createRecord(next);
        setSelected(saved);
        records.refresh();
      },
    });
  };
  const shown = React.useMemo(
    () =>
      records.data?.filter(
        record =>
          (filter === 'All' || classifyWealthRecord(record) === filter) &&
          `${record.title} ${Object.values(record.details).join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [records.data, filter, query],
  );
  const summary = React.useMemo(
    () => wealthSummary(records.data ?? []),
    [records.data],
  );
  return (
    <FeaturePage
      title="Wealth"
      subtitle="Assets, insurance and liabilities"
      loading={records.loading && !records.data}
      refreshing={records.loading}
      actionTitle="Add to Wealth"
      actions={[
        {
          label: 'Capture document',
          Icon: Camera,
          onPress: () => {
            void action.run(async () => {
              const files = await captureDocuments();
              if (!files.length) return;
              setEntryFiles(files);
              setEntry('holding');
            }, '');
          },
        },
        {
          label: 'From a document',
          Icon: FileText,
          onPress: () => {
            setEntryFiles(undefined);
            setEntry('holding');
          },
        },
        {
          label: 'Enter manually',
          Icon: Plus,
          onPress: () => setHoldingRequest(value => value + 1),
        },
        {
          label: 'Capture payment proof',
          Icon: Camera,
          onPress: () => {
            void action.run(async () => {
              const files = await captureDocuments();
              if (files.length) setProof({ files });
            }, '');
          },
        },
        {
          label: 'Lent or borrowed',
          Icon: Coins,
          onPress: () => {
            setEntryFiles(undefined);
            setEntry('money');
          },
        },
      ]}
    >
      <ResourceStatus resource={records} showLoading={false} />
      <DynamicWealthForm
        hideTrigger
        openRequest={holdingRequest}
        onSaved={records.refresh}
      />
      <Handoff hideTrigger openRequest={handoffRequest} />
      <Button
        title="SOS handoff"
        variant="danger"
        onPress={() => setHandoffRequest(value => value + 1)}
      />
      <Card>
        <Stack>
          <Row align="center" justify="space-between">
            <AppText variant="label">Record readiness</AppText>
            <AppText variant="heading" color="warning">
              {summary.readiness}%
            </AppText>
          </Row>
          <Progress
            value={summary.readiness}
            tone="warning"
            label="Record readiness"
          />
          <Stack gap="xs">
            <AppText variant="caption" color="muted">
              Documents linked: {summary.documented} of{' '}
              {records.data?.length ?? 0}{' '}
              {records.data?.length === 1 ? 'record' : 'records'}
            </AppText>
            <AppText variant="caption" color="muted">
              Missing access instructions: {summary.accessMissing}
            </AppText>
            <TextAction
              title={showMath ? 'Hide details' : 'How it works'}
              onPress={() => setShowMath(value => !value)}
            />
          </Stack>
          {summary.currencies.map(total => (
            <AppText key={total.currency} variant="caption" color="muted">
              {total.currency} · Owed to you {total.lent.toLocaleString()} · You
              owe {total.owed.toLocaleString()}
            </AppText>
          ))}
          {showMath ? (
            <AppText color="muted">
              This score checks for a linked document and access instructions on
              each record. It does not measure family permissions or nominees.
            </AppText>
          ) : null}
        </Stack>
      </Card>
      <SearchBar
        accessibilityLabel="Search wealth records"
        placeholder="Search wealth…"
        value={query}
        onChangeText={setQuery}
      />
      <SectionTabs
        label="Wealth categories"
        value={filter}
        options={[
          'All',
          { value: 'asset', label: 'Accounts and investments' },
          { value: 'liability', label: 'Loans' },
          { value: 'protection', label: 'Insurance' },
          { value: 'lentBorrowed', label: 'Lent, borrowed and proofs' },
        ]}
        onChange={setFilter}
      />
      <DynamicWealthForm onSaved={records.refresh} />
      {action.message ? <AppText>{action.message}</AppText> : null}
      {!records.loading && !records.error && shown?.length === 0 ? (
        query.trim() ? (
          <NoSearchResults
            query={query}
            onSearch={setQuery}
            subject="Wealth records"
          />
        ) : (
          <EmptyState
            title="No Wealth records here yet"
            message={
              records.data?.length
                ? 'This category is empty. Show all categories to see your other records.'
                : 'No accounts, policies or loans have been recorded. Add one to prepare your Wealth overview.'
            }
            actionLabel={
              records.data?.length ? 'Show all categories' : 'Add a record'
            }
            onAction={() =>
              records.data?.length
                ? setFilter('All')
                : setHoldingRequest(value => value + 1)
            }
          />
        )
      ) : null}
      <WealthGroups
        records={shown ?? []}
        disabled={action.busy}
        onOpen={record => setSelected(record)}
      />
      {selected ? (
        <DetailSheet
          title={selected.title}
          onClose={() => setSelected(undefined)}
        >
          <Card>
            <Stack>
              <ResourceStatus resource={recordDetail} showLoading={false} />
              {recordDetail.loading ? (
                <LoadingState
                  compact
                  skeleton={false}
                  label="Loading record details…"
                />
              ) : null}
              {recordDetail.data ? (
                <Details value={wealthRecordFacts(selected)} />
              ) : null}
              <Stack gap="sm">
                <Button
                  title="Edit"
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => {
                    void action.run(() => edit(selected), '');
                  }}
                />
                <Button
                  title="Upload new proof"
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => {
                    setSelected(undefined);
                    setProof({ record: selected });
                  }}
                />
                <Button
                  title="Attach document"
                  variant="secondary"
                  disabled={action.busy || !documents.data?.length}
                  onPress={() =>
                    setForm({
                      title: 'Attach proof',
                      fields: [
                        {
                          key: 'documentId',
                          label: 'Document',
                          required: true,
                          options: (documents.data ?? []).map(document => ({
                            label:
                              document.displayName || document.originalName,
                            value: document.id,
                          })),
                        },
                      ],
                      submit: async values => {
                        const full = await mobileApi.wealth.record(selected.id);
                        await mobileApi.wealth.updateRecord(selected.id, {
                          ...payload(full),
                          attachmentDocumentIds: [
                            ...new Set([
                              ...payload(full).attachmentDocumentIds,
                              values.documentId,
                            ]),
                          ],
                        });
                        records.refresh();
                      },
                    })
                  }
                />
                {['LOAN_GIVEN', 'LOAN_TAKEN'].includes(selected.type) ||
                selected.details.recordKind === 'money_lent_borrowed' ||
                selected.followUpDate ||
                selected.details.followUpDone ? (
                  <Button
                    title={
                      ['LOAN_GIVEN', 'LOAN_TAKEN'].includes(selected.type) ||
                      selected.details.recordKind === 'money_lent_borrowed'
                        ? selected.details.followUpDone
                          ? 'Mark unsettled'
                          : 'Mark settled'
                        : selected.details.followUpDone
                          ? 'Reopen follow-up'
                          : 'Complete follow-up'
                    }
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() => {
                      void action.run(async () => {
                        const full = await mobileApi.wealth.record(selected.id);
                        const updated = await mobileApi.wealth.updateRecord(
                          selected.id,
                          {
                            ...payload(full),
                            details: {
                              ...full.details,
                              followUpDone: !full.details.followUpDone,
                            },
                            followUpDate: full.details.followUpDone
                              ? full.followUpDate
                              : null,
                          },
                        );
                        setSelected(updated);
                      });
                    }}
                  />
                ) : null}
                <Button
                  title="Delete"
                  variant="danger"
                  disabled={action.busy}
                  onPress={() =>
                    confirmAction('Delete wealth record?', () => {
                      void action.run(async () => {
                        await mobileApi.wealth.deleteRecord(selected.id);
                        setSelected(undefined);
                      });
                    })
                  }
                />
              </Stack>
              <ActiveForm form={form} onClose={() => setForm(null)} />
            </Stack>
          </Card>
        </DetailSheet>
      ) : null}
      {!selected ? (
        <ActiveForm form={form} onClose={() => setForm(null)} />
      ) : null}
      {entry ? (
        <WealthEntrySheet
          initialFiles={entryFiles}
          mode={entry}
          onClose={() => setEntry(undefined)}
          onSaved={records.refresh}
          onVaultChanged={() => {
            documents.refresh();
            dispatch(appApi.util.invalidateTags(['Bootstrap']));
          }}
        />
      ) : null}
      {proof ? (
        <ProofCaptureDialog
          record={proof.record}
          initialFiles={proof.files}
          onClose={() => setProof(null)}
          onSaved={records.refresh}
          onVaultChanged={() => {
            documents.refresh();
            dispatch(appApi.util.invalidateTags(['Bootstrap']));
          }}
        />
      ) : null}
    </FeaturePage>
  );
}
