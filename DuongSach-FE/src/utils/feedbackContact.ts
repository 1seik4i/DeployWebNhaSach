import type { Language } from '../types';

export function feedbackContactError(value: string, language: Language): string {
  const contact = value.trim();
  if (!contact) return '';
  const email = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
  const phone = /^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/;
  if (contact.length <= 254 && (email.test(contact) || phone.test(contact.replace(/[ .-]/g, '')))) return '';
  if (contact.includes('@')) return language === 'vi'
    ? 'Email không đúng định dạng. Ví dụ: ten@example.com.'
    : 'Enter a valid email address, for example name@example.com.';
  return language === 'vi'
    ? 'Vui lòng nhập email hợp lệ hoặc số điện thoại Việt Nam đúng định dạng (ví dụ: 0912345678 hoặc +84912345678).'
    : 'Enter a valid email or Vietnamese phone number, for example 0912345678 or +84912345678.';
}
