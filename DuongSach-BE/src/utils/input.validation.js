import { z } from 'zod';

// Do not coerce arrays, objects, decimals or numeric prefixes such as "2abc".
export const queryInteger = (min, max) => z.union([
  z.string().regex(/^\d+$/).transform(Number), z.number(),
]).pipe(z.number().int().min(min).max(max));
export const paginationFields = {
  page: queryInteger(1, 1000000).default(1),
  limit: queryInteger(1, 100).default(20),
};
export const searchText = z.string().max(200).transform(value => value.normalize('NFC').trim());
export const webUrl = z.string().trim().max(2000).refine(value => {
  if (/[\u0000-\u0020\u007F]/.test(value)) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}, 'URL phải bắt đầu bằng http:// hoặc https://');
export const imageSourceFor = (maxLength = 10000000) => z.string().trim().max(maxLength).refine(value => {
  if (!value) return true;
  if (/^data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  return webUrl.safeParse(value).success;
}, 'Ảnh phải là URL HTTP(S), đường dẫn nội bộ hoặc dữ liệu ảnh hợp lệ');
export const imageSource = imageSourceFor();
export const supportPhone = z.string().trim().max(40).transform(value => value.replace(/[\s().-]/g, '')).refine(
  value => !value || /^(?:(?:\+?84|0)(?:[35789]\d{8}|2\d{9})|1[89]00\d{4,6})$/.test(value),
  'Số điện thoại hoặc hotline Việt Nam không hợp lệ',
);
