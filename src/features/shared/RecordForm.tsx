import { useFormDraft } from './useFormDraft';
import { validateFields } from './formValidation';
import { ErrorState } from '../../components/feedback/ErrorState';
import { describeIssue } from '../../components/feedback/issue';
import { DialogHeader } from './DialogHeader';
import React from 'react';
import { AppModal as Modal } from '../../components/primitives/AppModal';
import { AppText, Button, TextInput, Choice, confirmAction } from './FeatureUI';
import {
  ModalSurface,
  ModalOptions,
  ModalContent,
} from '../../components/primitives/Layout';
export type FormField = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'number' | 'date' | 'password' | 'email' | 'phone' | 'multiline';
  options?: Array<string | { label: string; value: string }>;
  initial?: string;
};
export function RecordForm({
  title,
  fields,
  onSubmit,
  onClose,
  submitLabel = 'Save',
  draftId,
}: {
  title: string;
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
  onClose: () => void;
  submitLabel?: string;
  draftId?: string;
}) {
  const draft = useFormDraft(
    title,
    Object.fromEntries(fields.map(field => [field.key, field.initial ?? ''])),
    draftId,
  );
  const values = draft.values;
  const invalidFields = validateFields(fields, values);
  const canSubmit = Object.keys(invalidFields).length === 0;
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [saved, setSaved] = React.useState(false);
  const [cleanupWarning, setCleanupWarning] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const submitting = React.useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    const errors = validateFields(fields, values);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await onSubmit(values);
      setSaved(true);
      await draft
        .clear()
        .catch(() =>
          setCleanupWarning(
            'Your account is saved, but this device could not remove the old draft. Do not submit it again.',
          ),
        );
    } catch (reason) {
      setError(reason);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <ModalSurface>
        <DialogHeader title={title} onClose={onClose} disabled={busy} />
        <ModalOptions keyboardShouldPersistTaps="handled">
          <ModalContent gap="md">
            {saved ? (
              <>
                <AppText variant="heading">Saved to your account</AppText>
                {cleanupWarning ? (
                  <AppText color="secondary">{cleanupWarning}</AppText>
                ) : null}
                <AppText>
                  Your updated information is ready. Close this form to see it
                  in the previous screen.
                </AppText>
                <Button title="Done" onPress={onClose} />
              </>
            ) : (
              <>
                {draft.notice ? (
                  <AppText variant="caption" color="secondary">
                    {draft.notice}
                  </AppText>
                ) : null}
                {fields.map(field =>
                  field.options ? (
                    <Choice
                      key={field.key}
                      label={field.label}
                      value={values[field.key]}
                      options={field.options}
                      error={fieldErrors[field.key]}
                      disabled={busy}
                      onChange={value => {
                        draft.change(field.key, value);
                        setFieldErrors(current => ({
                          ...current,
                          [field.key]: '',
                        }));
                      }}
                    />
                  ) : (
                    <TextInput
                      key={field.key}
                      label={`${field.label.trim().replace(/^./, char => char.toUpperCase())}${field.required ? ' *' : ''}${field.type === 'date' ? ' (YYYY-MM-DD)' : ''}`}
                      value={values[field.key]}
                      error={fieldErrors[field.key]}
                      onBlur={() =>
                        setFieldErrors(current => ({
                          ...current,
                          [field.key]: invalidFields[field.key] ?? '',
                        }))
                      }
                      onChangeText={value => {
                        draft.change(field.key, value);
                        setFieldErrors(current => ({
                          ...current,
                          [field.key]: '',
                        }));
                      }}
                      secureTextEntry={field.type === 'password'}
                      autoCapitalize={
                        field.type === 'email' ? 'none' : 'sentences'
                      }
                      keyboardType={
                        field.type === 'number'
                          ? 'decimal-pad'
                          : field.type === 'phone'
                            ? 'phone-pad'
                            : field.type === 'email'
                              ? 'email-address'
                              : 'default'
                      }
                      multiline={field.type === 'multiline'}
                      editable={!busy}
                    />
                  ),
                )}
                {error ? <ErrorState issue={describeIssue(error)} /> : null}
                {!canSubmit ? (
                  <AppText variant="caption" color="secondary">
                    To continue, check:{' '}
                    {fields
                      .filter(field => invalidFields[field.key])
                      .map(field => field.label)
                      .join(', ')}
                    . {submitLabel} becomes available when these fields are
                    valid.
                  </AppText>
                ) : null}
                <Button
                  title={busy ? 'Saving…' : submitLabel}
                  disabled={busy || !canSubmit}
                  onPress={submit}
                />
                <Button
                  title="Save draft and close"
                  variant="secondary"
                  disabled={busy}
                  onPress={onClose}
                />
                <Button
                  title="Discard draft"
                  variant="ghost"
                  disabled={busy}
                  onPress={() =>
                    confirmAction(
                      'Discard this draft?',
                      () => {
                        void draft.clear().then(onClose).catch(setError);
                      },
                      'These unsaved entries will be removed from this device. Your saved account records will be kept.',
                    )
                  }
                />
              </>
            )}
          </ModalContent>
        </ModalOptions>
      </ModalSurface>
    </Modal>
  );
}
export type FormConfig = {
  draftId?: string;
  title: string;
  fields: FormField[];
  submit: (values: Record<string, string>) => Promise<unknown>;
};
export function ActiveForm({
  form,
  onClose,
}: {
  form: FormConfig | null;
  onClose: () => void;
}) {
  return form ? (
    <RecordForm
      draftId={form.draftId}
      title={form.title}
      fields={form.fields}
      onSubmit={form.submit}
      onClose={onClose}
    />
  ) : null;
}
