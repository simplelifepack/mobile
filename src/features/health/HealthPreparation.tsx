import styled from 'styled-components/native';
import { DetailSheet } from '../shared/DetailSheet';
import { WrapRow } from '../../components/primitives/Layout';
import React from 'react';
import type {
  DocumentRecord,
  HealthMember,
  HealthRecord,
  HealthTimelineEvent,
} from '../../api/web.types';
import { documentsApi } from '../../api/documents.api';
import {
  openDownload,
  previewDownload,
  exportTextPdf,
} from '../../native/documentFiles';
import {
  Stack,
  AppText,
  Button,
  Choice,
  useAction,
  Details,
} from '../shared/FeatureUI';
import { Card } from '../../components/primitives/Card';
const PreparationButton = styled(Button)(() => ({
  flexBasis: '46%',
  flexGrow: 1,
  paddingHorizontal: 8,
}));
export function HealthPreparation({
  member,
  onLogReading,
  records,
  timeline,
  documents,
  hideTriggers = false,
  openRequest,
}: {
  hideTriggers?: boolean;
  openRequest?: { id: number; view: string };
  member: HealthMember;
  onLogReading: () => void;
  records: HealthRecord[];
  timeline: HealthTimelineEvent[];
  documents: DocumentRecord[];
}) {
  const [view, setView] = React.useState('');
  React.useEffect(() => {
    if (openRequest) {
      setView(openRequest.view);
      setSelected([]);
    }
  }, [openRequest]);
  const [provider, setProvider] = React.useState('All');
  const [selected, setSelected] = React.useState<string[]>([]);
  const action = useAction();
  const medicines = timeline
    .filter(
      item =>
        item.eventType === 'medication' &&
        item.medication?.status !== 'stopped',
    )
    .map(
      item =>
        `${item.title}: ${item.medication?.dose ?? ''} · ${item.medication?.whenToTake?.join(', ') ?? ''}`,
    );
  const emergency = {
    Name: member.name,
    'Blood group': member.bloodGroup || 'Not answered',
    Allergies: member.allergies || 'Not answered',
    Conditions: member.conditions || 'Not answered',
    Medications: medicines.length ? medicines.join('\n') : 'None recorded',
    Doctor: member.primaryDoctor || 'Not answered',
    'Emergency contact':
      [member.emergencyContactName, member.emergencyContactPhone]
        .filter(Boolean)
        .join(' · ') || 'Not answered',
    'Insurance provider': member.insuranceProvider || 'Not answered',
    'Policy number': member.insurancePolicyNumber || 'Not answered',
  };
  const providers = [
    ...new Set(
      records
        .flatMap(item => [item.doctor, item.provider])
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const visitRecords = records.filter(
    item =>
      provider === 'All' ||
      item.doctor === provider ||
      item.provider === provider,
  );
  const recordDocuments = new Set(records.map(record => record.documentId));
  const insurance = documents.filter(
    document =>
      (recordDocuments.has(document.id) || document.owner === 'self') &&
      /insurance|policy/i.test(`${document.category} ${document.documentType}`),
  );
  return (
    <>
      {!hideTriggers ? (
        <WrapRow gap="sm">
          <PreparationButton
            title="Prepare for a visit"
            onPress={() => {
              setView('visit');
              setSelected([]);
            }}
          />
          <PreparationButton
            title="Log reading"
            variant="secondary"
            onPress={onLogReading}
          />
          <PreparationButton
            title="In an emergency"
            variant="secondary"
            onPress={() => setView('emergency')}
          />
          <PreparationButton
            title="Insurance card"
            variant="secondary"
            onPress={() => setView('insurance')}
          />
        </WrapRow>
      ) : null}
      {view ? (
        <DetailSheet
          title={
            view === 'visit'
              ? 'Prepare for a visit'
              : view === 'emergency'
                ? 'Emergency card'
                : 'Insurance card'
          }
          onClose={() => setView('')}
        >
          {view === 'emergency' ? (
            <Card>
              <Stack>
                <Details value={emergency} />
                <AppText variant="caption" color="muted">
                  Recorded facts only · generated{' '}
                  {new Date().toLocaleDateString()}
                </AppText>
                <Button
                  title="Export emergency PDF"
                  disabled={action.busy}
                  onPress={() => {
                    void action.run(
                      () =>
                        exportTextPdf(
                          `Emergency information · ${member.name}`,
                          Object.entries(emergency)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n\n'),
                        ),
                      '',
                    );
                  }}
                />
              </Stack>
            </Card>
          ) : null}
          {view === 'insurance' ? (
            <>
              <Details
                value={{
                  'Insurance provider':
                    member.insuranceProvider || 'Not recorded',
                  'Policy number':
                    member.insurancePolicyNumber || 'Not recorded',
                }}
              />
              {insurance.map(document => (
                <Button
                  key={document.id}
                  title={`Open ${document.displayName || document.originalName}`}
                  disabled={action.busy}
                  onPress={() => {
                    void action.run(
                      async () =>
                        previewDownload(
                          await documentsApi.preview(document.id),
                        ),
                      '',
                    );
                  }}
                />
              ))}
            </>
          ) : null}
          {view === 'visit' ? (
            <>
              <Choice
                label="Doctor / provider"
                value={provider}
                options={['All', ...providers]}
                onChange={value => {
                  setProvider(value);
                  setSelected([]);
                }}
              />
              {visitRecords.length === 0 ? (
                <AppText>
                  No records for this visit. Add a health record from your
                  library.
                </AppText>
              ) : null}
              {visitRecords.map(record => (
                <Button
                  key={record.id}
                  title={`${selected.includes(record.documentId) ? '✓ ' : ''}${record.type.replace(/_/g, ' ')} · ${record.documentDate?.slice(0, 10) ?? 'Undated'} · ${record.provider ?? ''}`}
                  variant="secondary"
                  onPress={() =>
                    setSelected(ids =>
                      ids.includes(record.documentId)
                        ? ids.filter(id => id !== record.documentId)
                        : [...ids, record.documentId],
                    )
                  }
                />
              ))}
              <Button
                title="Download selected visit records as ZIP"
                disabled={!selected.length || action.busy}
                onPress={() => {
                  void action.run(
                    async () =>
                      openDownload(await documentsApi.bulkDownload(selected)),
                    '',
                  );
                }}
              />
            </>
          ) : null}
          {action.message ? <AppText>{action.message}</AppText> : null}
        </DetailSheet>
      ) : null}
    </>
  );
}
