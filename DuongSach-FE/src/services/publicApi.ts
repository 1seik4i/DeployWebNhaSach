import type { SubmissionQuota } from '../utils/guestSubmission';
import type { Booth, EventItem } from '../types';
import { apiClient } from './apiClient';

export interface PublicActivity {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  titleEn: string;
  kind: string;
  description: string;
  speaker: string;
  startAt: string;
  endAt: string;
  capacity: number;
  registeredCount: number;
  imageUrl: string | null;
  location: string;
  venue: string | null;
}

export interface PublicFeedbackInput {
  rating: number;
  comments?: string;
  contactEmail?: string;
  targetScope?: string;
  boothId?: string;
  eventId?: string;
  targetName?: string;
  source?: string;
  subject?: string;
  fullName?: string;
  phone?: string;
  organization?: string;
}

export interface EventRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  attendeesCount?: number;
  notes?: string;
}

export interface EventRegistrationResult {
  success: boolean;
  registrationCode: string;
  eventTitle: string;
  registeredAt: string;
  fullName: string;
  email: string;
  phone: string;
  attendeesCount: number;
  notes?: string;
}

export const publicApi = {
  getEvents: () => apiClient.get<EventItem[]>('/public/events'),
  getBooths: () => apiClient.get<Booth[]>('/public/booths'),
  getActivities: () => apiClient.get<PublicActivity[]>('/public/activities'),
  submitFeedback: (payload: PublicFeedbackInput) => apiClient.post<{ id: string; status: string; submissionQuota?: SubmissionQuota }>('/public/feedbacks', payload),
  registerEvent: (eventId: string, payload: EventRegistrationInput) =>
    apiClient.post<EventRegistrationResult>(`/public/events/${encodeURIComponent(eventId)}/register`, payload),
};
