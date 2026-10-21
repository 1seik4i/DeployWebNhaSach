import english from './landingEnglish.json';
import type { Language } from '../types';

/** CMS may supply explicit En siblings; existing Vietnamese entries use reviewed translations. */
export function localizeLanding<T>(content: T, language: Language): T {
  if (language === 'vi') return content;
  const translate = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return (english as Record<string, string>)[value] ?? value.replace(/^Ông /, 'Mr. ').replace(/^Bà /, 'Ms. ');
    }
    if (Array.isArray(value)) return value.map(translate);
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return Object.fromEntries(Object.entries(record).map(([key, item]) => {
        const englishKey = key.endsWith('Vi') ? key.slice(0, -2) + 'En' : key + 'En';
        if (/^(id|slug|category|contactEmail|image\d*|.*Url|bgPhoto|websiteUrl)$/i.test(key)) return [key, item];
        return [key, record[englishKey] || translate(item)];
      }));
    }
    return value;
  };
  return translate(content) as T;
}
