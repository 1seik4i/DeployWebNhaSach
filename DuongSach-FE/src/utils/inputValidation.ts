export const normalizeSearch = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi-VN');
export const matchesSearch = (query: string, ...values: unknown[]) => {
  const needle = normalizeSearch(query);
  return !needle || values.some(value => normalizeSearch(String(value ?? '')).includes(needle));
};
export function vietnamDateKey(value: string | Date = new Date()): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function isWebUrl(value: string): boolean {
  if (value.length > 2000 || /[\u0000-\u0020\u007F]/.test(value)) return false;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password; }
  catch { return false; }
}
export function isImageSource(value: string): boolean {
  const url = value.trim();
  return url.length <= 10000000 && (!url || /^data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(url) || /^\/(?!\/)[^\s\\]*$/.test(url) || isWebUrl(url));
}
export function isPublicationDate(value: string): boolean {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export const isReadTime = (value: string) => /^(?:[1-9]\d{0,2})(?:\s*(?:phút(?:\s+đọc)?|mins?|minutes?))?$/i.test(value.trim());
export const normalizePhone = (value: string) => value.trim().replace(/[\s().-]/g, '');
export const isSupportPhone = (value: string) => !value.trim() || /^(?:(?:\+?84|0)(?:[35789]\d{8}|2\d{9})|1[89]00\d{4,6})$/.test(normalizePhone(value));

// Validate editable landing content before any of the three sections are saved.
export function validateManagedContent(data: unknown, path = 'content'): void {
  const fail = (message: string) => { throw new Error(`${path}: ${message}`); };
  if (path.split('.').length > 16) fail('Content nesting exceeds 15 levels');
  const key = path.split('.').at(-1) || '';
  if (typeof data === 'string') {
    if (/^(?:image\d*|imageUrl|logoUrl|bgPhoto|visionImage)$/i.test(key)) {
      if (!isImageSource(data)) fail('Invalid image URL');
    } else if (key === 'websiteUrl') {
      if (data && !isWebUrl(data)) fail('Website requires HTTP(S)');
    } else if (/email$/i.test(key)) {
      if (data && (data.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.trim()))) fail('Invalid email');
    } else {
      const image = /^!\[([^\]]*)\]\((.*)\)$/.exec(data);
      if (image && /\.content(?:Vi|En)\.\d+$/.test(path)) {
        if (image[1].length > 5000 || !isImageSource(image[2])) fail('Invalid article image or caption');
      } else if (data.length > 20000) fail('Maximum 20,000 characters');
    }
    if (key === 'year' && !/^\d{4}$/.test(data)) fail('Year requires four digits');
    if (key === 'publishedDate' && !isPublicationDate(data)) fail('Invalid calendar date (DD/MM/YYYY)');
    if (key === 'readTime' && data && !isReadTime(data)) fail('Reading time must be 1–999 minutes');
    if (key === 'titleVi' && (!data.trim() || data.trim().length > 200)) fail('Title requires 1?200 characters');
  } else if (typeof data === 'number') {
    if (!Number.isFinite(data) || (key === 'value' && data < 0)) fail('Invalid number');
    if (key === 'tier' && ![1, 2, 3].includes(data)) fail('Tier must be 1, 2 or 3');
  } else if (Array.isArray(data)) {
    if (data.length > 1000) fail('Maximum 1,000 entries');
    data.forEach((value, index) => validateManagedContent(value, `${path}.${index}`));
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([field, value]) => validateManagedContent(value, `${path}.${field}`));
  }
}
