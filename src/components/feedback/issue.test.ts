import { describeIssue } from './issue';
it.each([
  [{ status: 503 }, 'service'],
  [{ status: 403 }, 'permission'],
  [{ status: 401 }, 'session'],
  [{ status: 422 }, 'validation'],
  [{ code: 'OFFLINE' }, 'offline'],
  [new TypeError('Network request failed'), 'connection'],
])(
  'distinguishes responsibility without guessing network faults: %s',
  (error, kind) => {
    const issue = describeIssue(error);
    expect(issue.kind).toBe(kind);
    expect(issue.next.length).toBeGreaterThan(15);
  },
);
