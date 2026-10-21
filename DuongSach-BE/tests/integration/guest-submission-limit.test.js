import { afterEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/database.js';
import { getGuestQuota, saveGuestSubmission } from '../../src/modules/public/guest-submission.service.js';
const sessions = [];
afterEach(async () => {
  await prisma.guestSubmissionSession.deleteMany({ where: { id: { in: sessions.splice(0) } } });
});
it('PostgreSQL admits exactly three simultaneous submissions for a fresh session', async () => {
  const id = randomUUID(); sessions.push(id);
  const results = await Promise.allSettled(Array.from({ length: 8 }, () =>
    saveGuestSubmission(id, 'feedback', async () => ({ id: 'test-submission' }))));
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(3);
  const rejected = results.filter(result => result.status === 'rejected');
  expect(rejected).toHaveLength(5);
  for (const result of rejected) expect(result.reason).toMatchObject({ statusCode: 429, code: 'GUEST_SUBMISSION_LIMIT' });
  expect((await getGuestQuota(id)).feedback.used).toBe(3);
  expect((await getGuestQuota(id)).eventProposal.used).toBe(0);
});
it('rolls back quota when saving fails and retains independent form counts', async () => {
  const id = randomUUID(); sessions.push(id);
  await expect(saveGuestSubmission(id, 'feedback', async () => { throw new Error('Test rollback'); })).rejects.toThrow('Test rollback');
  expect((await getGuestQuota(id)).feedback.used).toBe(0);
  await saveGuestSubmission(id, 'feedback', async () => ({}));
  await saveGuestSubmission(id, 'eventProposal', async () => ({}));
  expect(await getGuestQuota(id)).toMatchObject({ feedback: { used: 1, remaining: 2 }, eventProposal: { used: 1, remaining: 2 } });
});
