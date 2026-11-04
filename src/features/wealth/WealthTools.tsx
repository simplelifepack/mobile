import { EmptyState } from '../../components/feedback/EmptyState';
import { InlineSelect } from '../../components/primitives/InlineSelect';
import { DetailSheet } from '../shared/DetailSheet';
import React from 'react';
import { mobileApi } from '../../api/mobile.api';
import { TextAction } from '../../components/primitives/TextAction';
import {
  Stack,
  AppText,
  Button,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
export function DynamicWealthForm({
  onSaved,
  openRequest,
  hideTrigger = false,
}: {
  onSaved: () => void;
  openRequest?: number;
  hideTrigger?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (openRequest) setOpen(true);
  }, [openRequest]);
  const [category, setCategory] = React.useState('');
  const [subtype, setSubtype] = React.useState('');
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const categories = useResource(
    async () => (open ? mobileApi.wealth.formCategories() : []),
    [open],
  );
  const subtypes = useResource(
    async () => (category ? mobileApi.wealth.formSubtypes(category) : []),
    [category],
  );
  const action = useAction();
  return (
    <>
      {!hideTrigger ? (
        <Button
          title="Add holding"
          variant="primary"
          onPress={() => setOpen(value => !value)}
        />
      ) : null}
      {open ? (
        <DetailSheet title="Add holding" onClose={() => setOpen(false)}>
          <ResourceStatus resource={categories} />
          {!categories.loading &&
          !categories.error &&
          categories.data?.length === 0 ? (
            <EmptyState
              title="No record types are available"
              message="The connected service has not supplied any manual-entry categories. Return to Wealth and add a document instead."
              actionLabel="Return to Wealth"
              onAction={() => setOpen(false)}
            />
          ) : null}
          <InlineSelect
            label="Category"
            value={category}
            options={(categories.data ?? []).map(item => ({
              label: item.label,
              value: item.code,
            }))}
            onChange={value => {
              setCategory(value);
              setSubtype('');
            }}
          />
          <ResourceStatus resource={subtypes} />
          <InlineSelect
            key={category}
            disabled={!category || subtypes.loading}
            label="Subtype"
            value={subtype}
            options={(subtypes.data ?? []).map(item => ({
              label: item.label,
              value: item.code,
            }))}
            onChange={setSubtype}
          />
          <Button
            title="Continue"
            disabled={!category || !subtype || action.busy}
            onPress={() => {
              void action.run(async () => {
                const schema = await mobileApi.wealth.formSchema(
                  category,
                  subtype,
                );
                setForm({
                  title: schema.subtype.label,
                  fields: schema.fields
                    .filter(field => field.inputType !== 'file')
                    .sort((a, b) => a.order - b.order)
                    .map(field => ({
                      key: field.id,
                      label: field.label,
                      required: field.required,
                      type:
                        field.inputType === 'number'
                          ? 'number'
                          : field.inputType === 'date'
                            ? 'date'
                            : field.inputType === 'textarea'
                              ? 'multiline'
                              : undefined,
                      options: field.options ?? undefined,
                      initial:
                        field.defaultValue == null
                          ? ''
                          : String(field.defaultValue),
                    })),
                  submit: async values => {
                    const typed = Object.fromEntries(
                      schema.fields
                        .filter(field => field.inputType !== 'file')
                        .map(field => [
                          field.id,
                          field.inputType === 'number' && values[field.id]
                            ? Number(values[field.id])
                            : values[field.id] || null,
                        ]),
                    );
                    await mobileApi.wealth.createRecordFromForm({
                      categoryCode: category,
                      subtypeCode: subtype,
                      values: typed,
                    });
                    onSaved();
                    setOpen(false);
                  },
                });
              }, '');
            }}
          />
          {action.message ? <AppText>{action.message}</AppText> : null}
          <ActiveForm form={form} onClose={() => setForm(null)} />
        </DetailSheet>
      ) : null}
    </>
  );
}
export function Handoff({
  openRequest,
  hideTrigger = false,
}: { openRequest?: number; hideTrigger?: boolean } = {}) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (openRequest) setOpen(true);
  }, [openRequest]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [showDetails, setShowDetails] = React.useState(false);
  React.useEffect(() => {
    setSelected([]);
    setShowDetails(false);
  }, [open]);
  const resource = useResource(
    async () => (open ? mobileApi.wealth.handoffSummary() : null),
    [open],
  );
  const action = useAction();
  const recipients = [
    ...(resource.data?.recipients.family ?? []),
    ...(resource.data?.recipients.emergency ?? []),
  ];
  const chosen = recipients.filter(
    recipient => recipient.canReceiveHandoff && selected.includes(recipient.id),
  );
  const canSend =
    chosen.length > 0 && !resource.loading && !resource.error && !action.busy;
  return (
    <>
      {!hideTrigger ? (
        <Button
          title="SOS handoff"
          variant="secondary"
          onPress={() => setOpen(value => !value)}
        />
      ) : null}
      {open ? (
        <DetailSheet
          title="SOS handoff"
          onClose={() => setOpen(false)}
          busy={action.busy}
        >
          <AppText>
            Choose who receives your Wealth records and linked documents by
            email.
          </AppText>
          <ResourceStatus resource={resource} />
          {!resource.loading && !resource.error && !recipients.length ? (
            <AppText color="secondary">
              No recipients set up. Add a trusted person in Settings → Family
              and access first.
            </AppText>
          ) : null}
          {recipients.map(recipient => (
            <Button
              key={recipient.id}
              title={`${selected.includes(recipient.id) ? '✓ ' : ''}${recipient.name} · ${recipient.email}\n${recipient.type === 'family' ? 'Includes notes' : 'Excludes notes and follow-up notes'}${recipient.canReceiveHandoff ? '' : ' · Wealth view and download access required'}`}
              disabled={!recipient.canReceiveHandoff || action.busy}
              variant="secondary"
              onPress={() =>
                setSelected(items =>
                  items.includes(recipient.id)
                    ? items.filter(id => id !== recipient.id)
                    : [...items, recipient.id],
                )
              }
            />
          ))}
          <Button
            title={
              action.busy
                ? 'Sending…'
                : chosen.length
                  ? `Send to ${chosen.length} ${chosen.length === 1 ? 'person' : 'people'}`
                  : 'Select a recipient'
            }
            disabled={!canSend}
            onPress={() =>
              confirmAction(
                'Send Wealth records?',
                () => {
                  void action.run(async () => {
                    const result = await mobileApi.wealth.sendHandoff({
                      familyRecipientIds: (
                        resource.data?.recipients.family ?? []
                      )
                        .filter(
                          item =>
                            item.canReceiveHandoff &&
                            selected.includes(item.id),
                        )
                        .map(item => item.id),
                      emergencyRecipientIds: (
                        resource.data?.recipients.emergency ?? []
                      )
                        .filter(
                          item =>
                            item.canReceiveHandoff &&
                            selected.includes(item.id),
                        )
                        .map(item => item.id),
                    });
                    if (result.results.some(item => !item.sent))
                      throw new Error(
                        result.results
                          .map(
                            item =>
                              `${item.email}: ${item.sent ? 'sent' : item.reason}`,
                          )
                          .join('\n'),
                      );
                  }, 'Handoff sent.');
                },
                `Email Wealth records and linked documents to:\n${chosen.map(item => `${item.name} · ${item.email}`).join('\n')}\n\nFamily recipients receive notes. Emergency recipients do not receive notes or follow-up notes.`,
              )
            }
          />
          <TextAction
            title={showDetails ? 'Hide sharing details' : 'What gets shared?'}
            accessibilityLabel="What gets shared?"
            accessibilityState={{ expanded: showDetails }}
            onPress={() => setShowDetails(value => !value)}
          />
          {showDetails ? (
            <Stack gap="sm">
              <AppText color="secondary">
                Both include Wealth records, linked documents and a readable
                summary.
              </AppText>
              <AppText color="secondary">
                Family: includes notes and follow-up notes. Emergency: excludes
                both.
              </AppText>
            </Stack>
          ) : null}
          {action.message ? <AppText>{action.message}</AppText> : null}
        </DetailSheet>
      ) : null}
    </>
  );
}
