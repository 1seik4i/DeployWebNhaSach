import { z } from 'zod';
import { imageSource, webUrl } from '../../utils/input.validation.js';

export function isPublicationDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
const contentBlock = z.string().refine(value => {
  const image = /^!\[([^\]]*)\]\((.*)\)$/.exec(value);
  return image ? image[1].length <= 5000 && imageSource.safeParse(image[2]).success : value.length <= 20000;
}, 'Nội dung tối đa 20.000 ký tự hoặc một ảnh hợp lệ');
const article = z.object({
  id: z.string().trim().min(1).max(200),
  titleVi: z.string().trim().min(1).max(200),
  titleEn: z.string().max(200).optional(),
  category: z.enum(['van-hoa', 'thong-cao', 'tac-gia', 'nhip-song']).optional(),
  publishedDate: z.string().refine(isPublicationDate, 'Ngày xuất bản phải là ngày có thật, định dạng DD/MM/YYYY').optional(),
  readTime: z.string().trim().regex(/^(?:[1-9]\d{0,2})(?:\s*(?:phút(?:\s+đọc)?|mins?|minutes?))?$/i).or(z.literal('')).optional(),
  author: z.string().trim().max(160).optional(),
  imageUrl: imageSource.optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  contentVi: z.array(contentBlock).max(200).optional(),
  contentEn: z.array(contentBlock).max(200).optional(),
}).passthrough();

// The landing editor also uses contentEditable; it must pass the same checks as normal inputs.
export const managedContentData = z.record(z.unknown()).superRefine((data, ctx) => {
  const issue = (path, message) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  function walk(value, path = []) {
    if (path.length > 15) { issue(path, 'Nội dung lồng quá nhiều cấp'); return; }
    const key = String(path.at(-1) || '');
    if (typeof value === 'string') {
      if (/^(?:image\d*|imageUrl|logoUrl|bgPhoto|visionImage)$/i.test(key)) {
        if (!imageSource.safeParse(value).success) issue(path, 'Đường dẫn ảnh không hợp lệ');
      } else if (key === 'websiteUrl') {
        if (value && !webUrl.safeParse(value).success) issue(path, 'Website phải dùng HTTP(S)');
      } else if (/email$/i.test(key)) {
        if (value && !z.string().trim().email().max(254).safeParse(value).success) issue(path, 'Email không hợp lệ');
      } else if (['contentVi', 'contentEn'].includes(String(path.at(-2)))) {
        if (!contentBlock.safeParse(value).success) issue(path, 'Nội dung hoặc ảnh không hợp lệ');
      } else if (value.length > 20000) issue(path, 'Nội dung tối đa 20.000 ký tự mỗi trường');
      if (key === 'year' && !/^\d{4}$/.test(value)) issue(path, 'Năm phải gồm 4 chữ số');
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value) || (key === 'value' && value < 0)) issue(path, 'Số liệu phải hữu hạn và không âm');
      if (key === 'tier' && ![1, 2, 3].includes(value)) issue(path, 'Cấp lãnh đạo phải là 1, 2 hoặc 3');
    } else if (Array.isArray(value)) {
      if (value.length > 1000) { issue(path, 'Tối đa 1.000 phần tử'); return; }
      value.forEach((item, index) => walk(item, [...path, index]));
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([field, item]) => walk(item, [...path, field]));
    }
  }
  walk(data);
  if (data.articles !== undefined) {
    const result = z.array(article).max(1000).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, 'ID bài viết bị trùng').safeParse(data.articles);
    if (!result.success) result.error.issues.forEach(error => issue(['articles', ...error.path], error.message));
  }
});
