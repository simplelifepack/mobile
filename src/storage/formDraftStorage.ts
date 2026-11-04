import * as Keychain from 'react-native-keychain';
type Values = Record<string, string>;
type Draft = { values: Values; updatedAt: number };
type Pending = {
  timer: ReturnType<typeof setTimeout>;
  promise: Promise<void>;
  run: () => void;
};
const accounts = new Map<string, Record<string, Draft>>();
const chains = new Map<string, Promise<void>>();
const pending = new Map<string, Pending>();
const service = (account: string) =>
  `com.readines.form-drafts.${encodeURIComponent(account)}`;
const sensitive =
  /password|passcode|(?:^|[.:_-])pin(?:$|[.:_-])|(?:current|new|confirm|invitation|reset)Pin|(?:^|[.:_-])otp|token|secret|verificationCode/i;
export function safeDraft(values: Values): Values {
  return Object.fromEntries(
    Object.entries(values)
      .filter(
        ([key, value]) => !sensitive.test(key) && typeof value === 'string',
      )
      .map(([key, value]) => [key, value.slice(0, 20000)]),
  );
}
function queue(account: string) {
  const next = (chains.get(account) ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const entries = Object.entries(accounts.get(account) ?? {})
        .filter(([, entry]) => Date.now() - entry.updatedAt < 7 * 86400000)
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        .slice(0, 10);
      const saved = await Keychain.setGenericPassword(
        'form-drafts',
        JSON.stringify(Object.fromEntries(entries)),
        {
          service: service(account),
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
      );
      if (!saved) throw new Error('Secure draft storage is unavailable.');
    });
  chains.set(account, next);
  return next;
}
export async function readDraft(
  account: string,
  id: string,
): Promise<Values | undefined> {
  if (!accounts.has(account)) {
    const saved = await Keychain.getGenericPassword({
      service: service(account),
    });
    let value: Record<string, Draft> = {};
    try {
      if (saved) value = JSON.parse(saved.password);
    } catch {
      /* Ignore damaged drafts. */
    }
    if (!accounts.has(account))
      accounts.set(account, value && typeof value === 'object' ? value : {});
  }
  const entry = accounts.get(account)?.[id];
  return entry &&
    entry.values &&
    typeof entry.values === 'object' &&
    Date.now() - entry.updatedAt < 7 * 86400000
    ? safeDraft(entry.values)
    : undefined;
}
export function writeDraft(
  account: string,
  id: string,
  values: Values,
): Promise<void> {
  const entries = accounts.get(account) ?? {};
  accounts.set(
    account,
    Object.fromEntries(
      Object.entries({
        ...entries,
        [id]: { values: safeDraft(values), updatedAt: Date.now() },
      })
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        .slice(0, 10),
    ),
  );
  const previous = pending.get(account);
  if (previous) {
    clearTimeout(previous.timer);
    previous.timer = setTimeout(previous.run, 400);
    return previous.promise;
  }
  let run!: () => void;
  const promise = new Promise<void>((resolve, reject) => {
    run = () => {
      const item = pending.get(account);
      if (item) clearTimeout(item.timer);
      pending.delete(account);
      queue(account).then(resolve, reject);
    };
  });
  pending.set(account, { timer: setTimeout(run, 400), promise, run });
  return promise;
}
export function clearDraft(account: string, id: string) {
  const entries = { ...(accounts.get(account) ?? {}) };
  delete entries[id];
  accounts.set(account, entries);
  pending.get(account)?.run();
  return queue(account);
}
export async function flushDrafts() {
  [...pending.values()].forEach(item => item.run());
  const results = await Promise.allSettled([...chains.values()]);
  return results.every(result => result.status === 'fulfilled');
}
export function draftKey(title: string, initial: Values) {
  const input = JSON.stringify([
    title,
    Object.entries(safeDraft(initial)).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++)
    hash = (hash * 31 + input.charCodeAt(index)) % 2147483647;
  return `${title}:${input.length}:${hash}`;
}
