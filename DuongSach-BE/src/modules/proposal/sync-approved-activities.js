import { prisma } from '../../config/database.js';
import { transaction } from '../../utils/contract.js';
import { publishApprovedProposal } from '../event/independent-event.js';

// Repair approvals made before approval and publication became a single operation.
export async function syncApprovedActivities() {
  const proposals = await prisma.activityProposal.findMany({
    where: { status: 'approved', event: { isDeleted: false, status: { not: 'cancelled' } }, OR: [
      { publishedActivityId: null }, { activities: { some: { status: { in: ['draft', 'approved'] } } } },
    ] },
    select: { id: true },
  });
  for (const { id } of proposals) {
    await transaction(async tx => {
      const proposal = await tx.activityProposal.findUnique({ where: { id }, include: {
        reviews: { where: { action: 'approve' }, orderBy: { createdAt: 'desc' }, take: 1 },
        event: { select: { createdBy: true } },
      } });
      if (!proposal || proposal.status !== 'approved') return;
      const activityId = await publishApprovedProposal(tx, proposal, { id: proposal.reviews[0]?.reviewerId || proposal.event?.createdBy || null });
      await tx.activityProposal.update({ where: { id }, data: { publishedActivityId: activityId } });
    });
  }
  return proposals.length;
}
