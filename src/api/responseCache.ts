/** Bounded in-memory cache. Callers must clear it at session and mutation boundaries. */
export class ResponseCache {
  private entries = new Map<
    string,
    { value: unknown; expires: number; bytes: number }
  >();
  private bytes = 0;
  constructor(
    private maxEntries = 40,
    private maxBytes = 4 * 1024 * 1024,
  ) {}
  get<T>(key: string, allowStale = false): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now() && !allowStale) {
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value as T;
  }
  set(key: string, value: unknown, ttl: number) {
    this.remove(key);
    const bytes = (JSON.stringify(value)?.length ?? 0) * 2;
    if (ttl <= 0 || bytes > this.maxBytes) return;
    this.entries.set(key, { value, expires: Date.now() + ttl, bytes });
    this.bytes += bytes;
    while (this.entries.size > this.maxEntries || this.bytes > this.maxBytes)
      this.remove(this.entries.keys().next().value!);
  }
  private remove(key: string) {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.bytes;
    this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
    this.bytes = 0;
  }
}
