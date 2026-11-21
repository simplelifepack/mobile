import type { SelectedDocument } from './types';

export class DocumentBatch {
  readonly total: number;
  readonly consent: boolean;
  private remaining: SelectedDocument[];
  private current?: SelectedDocument;
  private currentSaved = false;
  private completed = 0;
  private saved = 0;
  private cancelled = false;

  constructor(files: SelectedDocument[], consent: boolean) {
    this.remaining = [...files];
    this.total = files.length;
    this.consent = consent;
  }

  next() {
    if (this.current || this.cancelled) return undefined;
    this.current = this.remaining.shift();
    this.currentSaved = false;
    return this.current;
  }

  markSaved() {
    if (!this.current || this.currentSaved) return;
    this.currentSaved = true;
    this.saved += 1;
  }

  completeCurrent() {
    if (!this.current) return false;
    this.current = undefined;
    this.completed += 1;
    return true;
  }

  cancel() {
    this.cancelled = true;
    return this.remaining.splice(0);
  }

  snapshot() {
    return {
      total: this.total,
      completed: this.completed,
      saved: this.saved,
      currentName: this.current?.fileName,
      cancelled: this.cancelled,
    };
  }
}
