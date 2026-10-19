import { z } from 'zod';
import { paginationFields, searchText, imageSource } from '../../utils/input.validation.js';

const isValidDateString = (val) => z.string().datetime({ offset: true }).safeParse(val).success;

export const listEventSchema = z.object({
  query: z.object({
    ...paginationFields,
    search: searchText.optional(),
    priorityLevel: z.enum(['regular', 'medium', 'high'], {
      errorMap: () => ({ message: 'Độ ưu tiên chỉ được là regular, medium hoặc high' }),
    }).optional(),
    status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Trạng thái sự kiện không hợp lệ' }),
    }).optional(),
  }).optional(),
});

export const getEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID sự kiện không hợp lệ'),
  }),
});

export const createEventSchema = z.object({
  body: z.object({
    visibility: z.enum(['public','internal']).optional(),
    publicUntil: z.string().datetime({offset:true}).nullable().optional(),
    coverImageUrl: imageSource.nullable().optional(),
    summary: z.string().max(5000).nullable().optional(),
    title: z.string({ required_error: 'Tiêu đề là bắt buộc' })
      .trim()
      .min(1, 'Tiêu đề là bắt buộc')
      .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
    startAt: z.string({ required_error: 'Thời gian bắt đầu là bắt buộc' })
      .refine(isValidDateString, 'Thời gian bắt đầu không hợp lệ'),
    endAt: z.string({ required_error: 'Thời gian kết thúc là bắt buộc' })
      .refine(isValidDateString, 'Thời gian kết thúc không hợp lệ'),
    venueId: z.string().uuid('ID địa điểm không hợp lệ').nullable().optional(),
    description: z.string().max(20000).nullable().optional(),
    priorityLevel: z.enum(['regular', 'medium', 'high'], {
      errorMap: () => ({ message: 'Độ ưu tiên chỉ được là regular, medium hoặc high' }),
    }).default('regular'),
    status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  }).refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
    path: ['endAt'],
  }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID sự kiện không hợp lệ'),
  }),
  body: z.object({
    visibility: z.enum(['public','internal']).optional(),
    publicUntil: z.string().datetime({offset:true}).nullable().optional(),
    coverImageUrl: imageSource.nullable().optional(),
    summary: z.string().max(5000).nullable().optional(),
    title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề không được vượt quá 200 ký tự').optional(),
    startAt: z.string().refine(isValidDateString, 'Thời gian bắt đầu không hợp lệ').optional(),
    endAt: z.string().refine(isValidDateString, 'Thời gian kết thúc không hợp lệ').optional(),
    venueId: z.string().uuid('ID địa điểm không hợp lệ').nullable().optional(),
    description: z.string().max(20000).nullable().optional(),
    priorityLevel: z.enum(['regular', 'medium', 'high'], {
      errorMap: () => ({ message: 'Độ ưu tiên chỉ được là regular, medium hoặc high' }),
    }).optional(),
  }).refine((data) => {
    if (data.startAt && data.endAt) {
      return new Date(data.startAt) < new Date(data.endAt);
    }
    return true;
  }, {
    message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
    path: ['endAt'],
  }),
});

export const deleteEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID sự kiện không hợp lệ'),
  }),
});
