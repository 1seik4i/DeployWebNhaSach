import { z } from 'zod';
import { paginationFields } from '../../utils/input.validation.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidCalendarDate = (dateStr) => {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return false;

  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

export const listProposalSchema = z.object({
  query: z.object({
    eventId: z.string().uuid().optional(),
    ...paginationFields,
    status: z.enum(['pending', 'approved', 'need_revision', 'rejected', 'withdrawn'], {
      errorMap: () => ({ message: 'Trạng thái đề xuất không hợp lệ' }),
    }).optional(),
    fromDate: z.string().refine(isValidCalendarDate, {
      message: 'Từ ngày không hợp lệ, yêu cầu định dạng YYYY-MM-DD',
    }).optional(),
    toDate: z.string().refine(isValidCalendarDate, {
      message: 'Đến ngày không hợp lệ, yêu cầu định dạng YYYY-MM-DD',
    }).optional(),
  }).refine((query) => {
    if (query?.fromDate && query?.toDate && isValidCalendarDate(query.fromDate) && isValidCalendarDate(query.toDate)) {
      return query.fromDate <= query.toDate;
    }
    return true;
  }, {
    message: 'Từ ngày phải nhỏ hơn hoặc bằng đến ngày',
    path: ['toDate'],
  }).optional(),
});

export const getProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID đề xuất không hợp lệ'),
  }),
});

export const approveProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID đề xuất không hợp lệ'),
  }),
  body: z.object({
    note: z.string().nullable().optional(),
  }).optional(),
});

export const requestSupplementSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID đề xuất không hợp lệ'),
  }),
  body: z.object({
    note: z.string({ required_error: 'Ghi chú yêu cầu bổ sung là bắt buộc' })
      .trim()
      .min(1, 'Ghi chú yêu cầu bổ sung là bắt buộc'),
  }),
});

export const rejectProposalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID đề xuất không hợp lệ'),
  }),
  body: z.object({
    note: z.string().trim().min(1, 'Lý do từ chối không hợp lệ').optional(),
  }).optional(),
});
