import type { Book } from '../../types';
import { useState } from 'react';

interface BookCoverProps {
  book: Book;
  className?: string;
  decorative?: boolean;
}

export function BookCover({ book, className = '', decorative = false }: BookCoverProps) {
  const [failedCover, setFailedCover] = useState<string | undefined>();
  const tone = book.id.charCodeAt(book.id.length - 1) % 6;
  const hasRealCover = Boolean(book.coverUrl);
  const initials = book.title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toLocaleUpperCase('vi');

  return (
    <span className={`library-cover-art cover-tone-${tone} ${decorative ? 'is-decorative' : ''} ${className}`}>
      <span className="library-cover-spine" aria-hidden="true" />
      <span className="library-cover-imprint">ĐƯỜNG SÁCH · TP.HCM</span>
      <span className="library-cover-monogram" aria-hidden="true">{initials}</span>
      <span className="library-cover-title">{book.title}</span>
      <span className="library-cover-rule" aria-hidden="true" />
      <span className="library-cover-author">{book.author}</span>
      <span className="library-cover-publisher">{book.publisher}</span>
      {hasRealCover && failedCover !== book.coverUrl && <img src={book.coverUrl} alt={`Bìa sách ${book.title}`} loading="lazy" onError={() => setFailedCover(book.coverUrl)} />}
    </span>
  );
}
