import { z } from 'zod';
import { imageSourceFor } from './input.validation.js';

export const MAX_EVENT_IMAGE_MB = 20;
export const eventImageInput = z.string().max(
  4 * Math.ceil(MAX_EVENT_IMAGE_MB * 1024 * 1024 / 3) + 1024,
  `Ảnh sự kiện tối đa ${MAX_EVENT_IMAGE_MB} MB.`,
).pipe(imageSourceFor(4 * Math.ceil(MAX_EVENT_IMAGE_MB * 1024 * 1024 / 3) + 1024)).optional();

export function proposalMetadata(notes) {
  try {
    const value = JSON.parse(notes || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

// Review notes must not discard the image, schedule or documents in metadata.
export function withProposalReviewNote(notes, note) {
  const metadata = proposalMetadata(notes);
  return Object.keys(metadata).length ? JSON.stringify({ ...metadata, reviewNote: note }) : note;
}
