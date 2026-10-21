import type { Book, Language } from '../../types';
import { useState } from 'react';

interface BookCoverProps {
  book: Book;
  language?: Language;
  className?: string;
  decorative?: boolean;
}

export function BookCover({ book, className = '', decorative = false, language = 'vi' }: BookCoverProps) {
  const title = language === 'en' ? book.titleEn || book.title : book.title;
  const [failedCover, setFailedCover] = useState<string | undefined>();
  const tone = book.id.charCodeAt(book.id.length - 1) % 6;
  const hasRealCover = Boolean(book.coverUrl);
  const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toLocaleUpperCase('vi');

  return (
    <span className={`library-cover-art cover-tone-${tone} ${decorative ? 'is-decorative' : ''} ${className}`}>
      <span className="library-cover-spine" aria-hidden="true" />
      <span className="library-cover-imprint">{language === 'vi' ? 'ĐƯỜNG SÁCH · TP.HCM' : 'HCMC BOOK STREET'}</span>
      <span className="library-cover-monogram" aria-hidden="true">{initials}</span>
      <span className="library-cover-title">{title}</span>
      <span className="library-cover-rule" aria-hidden="true" />
      <span className="library-cover-author">{book.author}</span>
      <span className="library-cover-publisher">{book.publisher}</span>
      {hasRealCover && failedCover !== book.coverUrl && <img src={book.coverUrl} alt={`${language === 'vi' ? 'Bìa sách' : 'Book cover'} ${title}`} loading="lazy" onError={() => setFailedCover(book.coverUrl)} />}
    </span>
  );
}
