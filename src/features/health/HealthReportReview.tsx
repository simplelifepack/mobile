import React from 'react';
import type { HealthRecordDetail } from '../../api/web.types';
import { documentsApi } from '../../api/documents.api';
import { healthApi } from '../../api/health.api';
import { previewDownload } from '../../native/documentFiles';
import { DetailSheet } from '../shared/DetailSheet';
import {
  AppText,
  Button,
  Choice,
  Stack,
  ResourceStatus,
  useAction,
  useResource,
} from '../shared/FeatureUI';
import { metricIdentity } from './healthMetrics';

export function HealthReportReview({
  record,
  onClose,
  onChanged,
}: {
  record: HealthRecordDetail;
  onClose: () => void;
  onChanged: () => void;
}) {
  const tracking = useResource(
    () => healthApi.trackedMetrics(record.memberId),
    [record.memberId],
  );
  const initialized = React.useRef(false);
  const tracked = tracking.data ?? [];
  const [type, setType] = React.useState(record.type);
  const [selected, setSelected] = React.useState(() =>
    tracked.map(metricIdentity),
  );
  // Keep successful individual operations when a later operation fails, allowing a safe retry.
  const applied = React.useRef(
    new Map(tracked.map(metric => [metricIdentity(metric), metric])),
  );
  React.useEffect(() => {
    if (!tracking.data || initialized.current) return;
    initialized.current = true;
    setSelected(tracking.data.map(metricIdentity));
    applied.current = new Map(
      tracking.data.map(metric => [metricIdentity(metric), metric]),
    );
  }, [tracking.data]);
  const action = useAction(onChanged);
  const measurements = [
    ...new Map(
      record.measurements.map(item => [metricIdentity(item), item]),
    ).values(),
  ];
  return (
    <DetailSheet
      title="Review health report"
      onClose={onClose}
      busy={action.busy}
    >
      <Stack>
        <ResourceStatus resource={tracking} />
        <AppText>
          {record.provider || 'Provider not recorded'} ·{' '}
          {record.doctor || 'Doctor not recorded'} ·{' '}
          {record.documentDate?.slice(0, 10) || 'Undated'}
        </AppText>
        {record.processingError ? (
          <AppText color="danger">{record.processingError}</AppText>
        ) : null}
        <Button
          title="View original document"
          disabled={action.busy || tracking.loading || Boolean(tracking.error)}
          onPress={() => {
            void action.run(
              async () =>
                previewDownload(await documentsApi.preview(record.documentId)),
              '',
            );
          }}
        />
        <Choice
          label="Report type"
          value={type}
          options={['lab_report', 'medical_report', 'prescription']}
          onChange={value => setType(value as typeof type)}
        />
        {measurements.map(item => (
          <Stack key={item.id}>
            <AppText variant="label">{item.displayName}</AppText>
            <AppText>
              {item.value}
              {item.secondaryValue != null
                ? ` / ${item.secondaryValue}`
                : ''}{' '}
              {item.unit} · {item.measuredAt?.slice(0, 10) || 'Undated'}
            </AppText>
            <AppText>
              Printed range:{' '}
              {item.referenceText ||
                `${item.referenceMin ?? '—'}–${item.referenceMax ?? '—'}`}
            </AppText>
            <Button
              title={
                selected.includes(metricIdentity(item))
                  ? '✓ Tracked — remove'
                  : 'Track this measurement'
              }
              variant="secondary"
              disabled={
                action.busy || tracking.loading || Boolean(tracking.error)
              }
              onPress={() =>
                setSelected(keys =>
                  keys.includes(metricIdentity(item))
                    ? keys.filter(key => key !== metricIdentity(item))
                    : [...keys, metricIdentity(item)],
                )
              }
            />
          </Stack>
        ))}
        {record.medications.map(item => (
          <AppText key={item.id}>
            {item.name} ·{' '}
            {[item.dose, item.frequency, item.duration, item.quantity]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        ))}
        <Button
          title="Save report and tracked measurements"
          disabled={action.busy || tracking.loading || Boolean(tracking.error)}
          onPress={() => {
            void action.run(async () => {
              if (type !== record.type)
                await healthApi.updateRecord(record.id, { type });
              for (const item of measurements) {
                const key = metricIdentity(item);
                if (selected.includes(key) && !applied.current.has(key)) {
                  const result = await healthApi.trackMetric(
                    record.memberId,
                    item,
                  );
                  applied.current.set(key, result);
                } else if (
                  !selected.includes(key) &&
                  applied.current.has(key)
                ) {
                  await healthApi.untrackMetric(
                    record.memberId,
                    applied.current.get(key)!.id,
                  );
                  applied.current.delete(key);
                }
              }
            }, 'Report and tracking saved.');
          }}
        />
        {action.message ? <AppText>{action.message}</AppText> : null}
      </Stack>
    </DetailSheet>
  );
}
