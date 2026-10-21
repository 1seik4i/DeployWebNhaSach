export const GUEST_SUBMISSION_LIMIT = 3;
export type GuestForm = 'feedback' | 'eventProposal';
export interface SubmissionQuota { limit: number; used: number; remaining: number }
export interface GuestQuota { feedback: SubmissionQuota; eventProposal: SubmissionQuota }
export const guestQuotaChanged = 'duongsach:guest-quota-changed';
let memorySession = '';
export function guestSessionId(): string {
  try {
    let id = sessionStorage.getItem('duongsach_guest_session');
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('duongsach_guest_session', id); }
    return id;
  } catch { return memorySession ||= crypto.randomUUID(); }
}
const quota = (used = 0): SubmissionQuota => ({ limit: 3, used, remaining: Math.max(0, 3 - used) });
export function readGuestQuota(): GuestQuota {
  try {
    const data = JSON.parse(sessionStorage.getItem(`duongsach_guest_quota:${guestSessionId()}`) || '{}');
    return { feedback: quota(Number(data.feedback?.used) || 0), eventProposal: quota(Number(data.eventProposal?.used) || 0) };
  } catch { return { feedback: quota(), eventProposal: quota() }; }
}
export function mergeGuestQuota(data: Partial<GuestQuota>): GuestQuota {
  const current = readGuestQuota();
  for (const kind of ['feedback', 'eventProposal'] as const) {
    if (data[kind]) current[kind] = quota(Math.max(current[kind].used, data[kind]!.used));
  }
  try { sessionStorage.setItem(`duongsach_guest_quota:${guestSessionId()}`, JSON.stringify(current)); } catch { /* Server still enforces the quota if storage is unavailable. */ }
  window.dispatchEvent(new Event(guestQuotaChanged));
  return current;
}
export function recordGuestSubmission(kind: GuestForm, result?: SubmissionQuota): GuestQuota {
  return mergeGuestQuota({ [kind]: result || quota(readGuestQuota()[kind].used + 1) });
}
