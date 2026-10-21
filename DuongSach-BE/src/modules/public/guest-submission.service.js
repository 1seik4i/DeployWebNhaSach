import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';

export const GUEST_SUBMISSION_LIMIT = 3;
const cookieName = 'duongsach_guest_session';
const sessionUuid = z.string().uuid();

// Explicit session IDs support a frontend hosted on a different origin without
// depending on third-party cookies. Older callers use a browser-session cookie.
export function guestSession(req, res, next) {
  const header = req.get('X-Guest-Session');
  if (header !== undefined && !sessionUuid.safeParse(header).success) {
    return next(ApiError.validation([{ field: 'X-Guest-Session', message: 'Phiên khách không hợp lệ.' }]));
  }
  const cookie = (req.headers.cookie || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  req.guestSessionId = header || (sessionUuid.safeParse(cookie).success ? cookie : randomUUID());
  if (!header && cookie !== req.guestSessionId) {
    res.cookie(cookieName, req.guestSessionId, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/api/public' });
  }
  next();
}

const quota = used => ({ limit: GUEST_SUBMISSION_LIMIT, used, remaining: Math.max(0, GUEST_SUBMISSION_LIMIT - used) });
export async function getGuestQuota(sessionId) {
  const row = await prisma.guestSubmissionSession.findUnique({ where: { id: sessionId } });
  return { feedback: quota(row?.feedbackCount || 0), eventProposal: quota(row?.proposalCount || 0) };
}

export async function saveGuestSubmission(sessionId, kind, save) {
  const field = kind === 'feedback' ? 'feedbackCount' : 'proposalCount';
  return prisma.$transaction(async tx => {
    await tx.guestSubmissionSession.upsert({ where: { id: sessionId }, create: { id: sessionId }, update: { id: sessionId } });
    // Conditional UPDATE takes a row lock: concurrent submissions cannot both
    // spend the last remaining slot. A failed save rolls this increment back.
    const accepted = await tx.guestSubmissionSession.updateMany({
      where: { id: sessionId, [field]: { lt: GUEST_SUBMISSION_LIMIT } },
      data: { [field]: { increment: 1 } },
    });
    if (!accepted.count) throw new ApiError(429, 'Bạn đã gửi tối đa 3 lần cho biểu mẫu này trong phiên hiện tại.', 'GUEST_SUBMISSION_LIMIT');
    const result = await save(tx);
    const session = await tx.guestSubmissionSession.findUnique({ where: { id: sessionId } });
    return { ...result, submissionQuota: quota(session[field]) };
  }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 15000 });
}
