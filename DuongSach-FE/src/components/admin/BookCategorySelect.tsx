import { useState } from 'react';
import type { Book, BookCategory, Language } from '../../types';
import { libraryApi } from '../../services/libraryApi';

export function BookCategorySelect({ book, categories, language, onSaved }: {
  book: Book;
  categories: BookCategory[];
  language: Language;
  onSaved: (book: Book) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const active = categories.filter(category => category.status === 'active');
  const categoryId = active.some(category => category.id === book.categoryId) ? book.categoryId : '';
  return <div onClick={event => event.stopPropagation()}>
    <select
      className={`admin-category-tag admin-category-select ${categoryId ? '' : 'is-uncategorized'}`}
      value={categoryId || ''}
      disabled={saving}
      aria-label={`${language === 'vi' ? 'Phân loại sách' : 'Category for'} ${book.title}`}
      aria-busy={saving}
      onChange={async event => {
        const next = event.target.value;
        setSaving(true); setError('');
        try { onSaved(await libraryApi.assignBookCategory(book.id, next)); }
        catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu phân loại'); }
        finally { setSaving(false); }
      }}
    >
      <option value="">{language === 'vi' ? 'Chưa phân loại' : 'Uncategorized'}</option>
      {active.map(category => <option key={category.id} value={category.id}>{language === 'en' ? category.nameEn || category.name : category.name}</option>)}
    </select>
    {saving && <small role="status">{language === 'vi' ? 'Đang lưu…' : 'Saving…'}</small>}
    {error && <small role="alert" style={{ display: 'block', color: '#b91c1c' }}>{error}</small>}
  </div>;
}
