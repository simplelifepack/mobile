import React from 'react';
import { useAppSelector } from '../../app/store/hooks';
import {
  clearDraft,
  readDraft,
  writeDraft,
  draftKey,
} from '../../storage/formDraftStorage';
export function useFormDraft(
  title: string,
  initial: Record<string, string>,
  draftId?: string,
) {
  const account = useAppSelector(state => state.auth.user?.id);
  const id = React.useRef(draftId ?? draftKey(title, initial)).current;
  const [values, setValues] = React.useState(initial);
  const [notice, setNotice] = React.useState('');
  const edited = React.useRef(false);
  const current = React.useRef(values);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  React.useEffect(() => {
    let active = true;
    if (account)
      readDraft(account, id)
        .then(saved => {
          if (active && saved && !edited.current) {
            current.current = { ...current.current, ...saved };
            setValues(current.current);
            setNotice('Draft restored');
          }
        })
        .catch(() => {
          if (active)
            setNotice('Couldn’t restore your draft. Keep this form open.');
        });
    return () => {
      active = false;
    };
  }, [account, id]);
  const change = (key: string, value: string) => {
    edited.current = true;
    const next = { ...current.current, [key]: value };
    current.current = next;
    setValues(next);
    if (account)
      writeDraft(account, id, next)
        .then(() => mounted.current && setNotice('Draft saved'))
        .catch(
          () =>
            mounted.current &&
            setNotice(
              'Couldn’t keep a draft. Leave this form open until you save.',
            ),
        );
  };
  const clear = async () => {
    if (account) await clearDraft(account, id);
    setNotice('');
  };
  return { values, change, clear, notice };
}
