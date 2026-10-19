import { ApiError } from '../../utils/ApiError.js';
import { eventTiming } from './event-time.js';

export async function eventOpenForPartnerParticipation(tx, eventId, now = new Date()) {
  const event = await tx.event.findFirst({ where: {
    id: eventId, isDeleted: false, visibility: 'public',
    status: { in: ['published', 'ongoing'] },
  } });
  // Use the same Vietnam-calendar status shown on the event calendar.
  if (!event || event.isDeleted || event.visibility !== 'public' || !['published', 'ongoing'].includes(event.status) || !['happening', 'upcoming'].includes(eventTiming(event, now).displayStatus)) {
    throw ApiError.conflict('Chỉ được đăng ký tham gia sự kiện đang diễn ra hoặc sắp diễn ra.');
  }
  // No application opening date or deadline applies to partner participation.
  return event;
}
