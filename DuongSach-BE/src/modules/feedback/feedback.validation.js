import { z } from 'zod';
import { FeedbackStatus } from '@prisma/client';
import { idParams, paginationFields } from '../heritage/heritage.validation.js';

export const feedbackListSchema = z.object({ query: z.object({
  ...paginationFields,
  heritageId: z.string().uuid().optional(),
  rating: z.string().regex(/^[1-5]$/).transform(Number).optional(),
  status: z.nativeEnum(FeedbackStatus).optional(),
}) });
export const feedbackIdSchema = z.object({ params: idParams });
export const feedbackStatusSchema = z.object({
  params: idParams,
  body: z.object({
    status: z.nativeEnum(FeedbackStatus),
    internalNote: z.string().trim().max(50000).nullable().optional(),
  }).strict(),
});
