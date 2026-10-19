import { ApiError } from '../../utils/ApiError.js';
import { proposalMetadata } from '../../utils/eventImage.js';

export async function publishIndependentRegistration(tx, proposal, user) {
  const metadata = proposalMetadata(proposal.managementNotes);
  if (!metadata.standaloneEvent) return null;
  let activityId = proposal.publishedActivityId;
  if (!activityId) {
    const activity = await tx.activity.create({ data: {
      eventId: proposal.eventId, proposalId: proposal.id, organizationId: proposal.organizationId,
      title: proposal.title, titleEn: proposal.titleEn, kind: proposal.kind,
      locationId: proposal.locationId, startAt: proposal.startAt, endAt: proposal.endAt,
      capacity: proposal.capacity, description: proposal.description, speaker: proposal.speaker,
      imageUrl: metadata.imageUrl || null, status: 'published', publishedAt: new Date(), createdBy: user.id,
    } });
    activityId = activity.id;
  }
  await tx.event.update({ where: { id: proposal.eventId }, data: { status: 'published', visibility: 'public', publishedAt: new Date() } });
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
