import type { EventRegistrationData } from '../components/portal/EventRegistrationModal';

export function eventRegistrationPayload(data: EventRegistrationData) {
  return {
    title: data.title, kind: data.type, locationId: data.location,
    startAt: data.startAt, endAt: data.endAt, capacity: data.capacity,
    targetAudience: data.targetAudience?.trim() || 'Mọi lứa tuổi, độc giả yêu sách',
    description: data.description, speaker: data.speaker,
    imageUrl: data.thumbnail || undefined,
    isPublished: data.isPublished,
    devices: data.devices || [],
  };
}
