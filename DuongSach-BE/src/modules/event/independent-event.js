import { ApiError } from '../../utils/ApiError.js';
import { proposalMetadata } from '../../utils/eventImage.js';

export async function publishIndependentRegistration(tx, proposal, user) {
  if (!proposalMetadata(proposal.managementNotes).standaloneEvent) return null;
  return publishApprovedProposal(tx, proposal, user);
}

export async function publishApprovedProposal(tx, proposal, user) {
  const metadata = proposalMetadata(proposal.managementNotes);
  const existing = await tx.activity.findFirst({ where: { proposalId: proposal.id } });
  const event = await tx.event.findUnique({ where: { id: proposal.eventId }, select: { coverImageUrl: true } });
  let activityId = existing?.id || proposal.publishedActivityId;
  if (!activityId) {
    const activity = await tx.activity.create({ data: {
      eventId: proposal.eventId, proposalId: proposal.id, organizationId: proposal.organizationId,
      title: proposal.title, titleEn: proposal.titleEn, kind: proposal.kind,
      locationId: proposal.locationId, startAt: proposal.startAt, endAt: proposal.endAt,
      capacity: proposal.capacity, description: proposal.description, speaker: proposal.speaker,
      imageUrl: event?.coverImageUrl || metadata.imageUrl || null, status: 'published', publishedAt: new Date(), createdBy: user.id,
    } });
    activityId = activity.id;
  }
  if (existing && ['draft', 'approved'].includes(existing.status)) {
    await tx.activity.update({ where: { id: existing.id }, data: { status: 'published', publishedAt: new Date(), imageUrl: event?.coverImageUrl || metadata.imageUrl || existing.imageUrl || null } });
  }
  if (!metadata.standaloneEvent) return activityId;
  await tx.event.update({ where: { id: proposal.eventId }, data: { status: 'published', visibility: 'public', publishedAt: new Date() } });
  const reviewedAt = new Date();
  await tx.partnerApplication.upsert({
    where: { eventId_organizationId: { eventId: proposal.eventId, organizationId: proposal.organizationId } },
    create: {
      eventId: proposal.eventId, organizationId: proposal.organizationId,
      status: 'approved', submittedAt: proposal.submittedAt || reviewedAt,
      reviewedAt, reviewedBy: user.id,
    },
    update: { status: 'approved', reviewedAt, reviewedBy: user.id },
  });
  return activityId;
}

export async function checkIndependentSchedule(tx, data) {
  const startAt = new Date(data.startAt), endAt = new Date(data.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || startAt >= endAt) {
    throw ApiError.validation([{ field: 'endAt', message: 'Ngày giờ kết thúc phải sau ngày giờ bắt đầu.' }]);
  }
  const location = await tx.location.findFirst({ where: { id: data.locationId, isDeleted: false } });
  if (!location) throw ApiError.notFound('Không tìm thấy địa điểm tổ chức.');
  await tx.event.update({ where: { id: data.eventId }, data: {
    title: data.title, startAt, endAt, venueId: location.venueId, description: data.description,
    ...(data.imageUrl !== undefined ? { coverImageUrl: data.imageUrl || null } : {}),
  } });
  await tx.eventLocation.upsert({
    where: { eventId_locationId: { eventId: data.eventId, locationId: data.locationId } },
    create: { eventId: data.eventId, locationId: data.locationId }, update: {},
  });
  return { ...data, startAt, endAt };
}
