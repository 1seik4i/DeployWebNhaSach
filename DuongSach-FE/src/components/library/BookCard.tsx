import { Flame, Trophy } from 'lucide-react';
import type { Book, Language } from '../../types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  language: Language;
  mode?: 'bestseller' | 'weekly_hot';
  onClick?: () => void;
  exposeBookId?: boolean;
  compact?: boolean;
  carouselClone?: boolean;
}
export function BookCard({ book, language, mode, onClick, exposeBookId = true, compact = false, carouselClone = false }: BookCardProps) {
  const rank = mode === 'weekly_hot' 
    ? book.weeklyRank 
    : mode === 'bestseller' 
      ? book.bestsellerRank 
      : (book.bestsellerRank || book.weeklyRank);
  const effectiveMode = mode || (book.bestsellerRank ? 'bestseller' : book.weeklyRank ? 'weekly_hot' : undefined);
  const category = language === 'en' && book.category?.nameEn
    ? book.category.nameEn
    : book.category?.name || (language === 'vi' ? 'Chưa phân loại' : 'Unclassified');

  return (
    <button
      type="button"
      className={`library-book-card ${compact ? 'is-compact' : ''} ${carouselClone ? 'is-carousel-clone' : ''}`}
      data-book-id={exposeBookId ? book.id : undefined}
      onClick={onClick}
      aria-hidden={carouselClone || undefined}
      tabIndex={carouselClone ? -1 : undefined}
      aria-label={`${language === 'vi' ? 'Xem chi tiết' : 'View details'} ${language === 'en' && book.titleEn ? book.titleEn : book.title}`}
    >
      <span className="library-cover-wrap">
        <BookCover book={book} language={language} />
        {rank && <span className={`library-rank ${rank <= 10 ? 'is-top-ten' : ''}`}><span>{language === 'vi' ? 'Hạng' : 'Rank'}</span>{String(rank).padStart(2, '0')}</span>}
        {effectiveMode && <span className={`library-card-badge ${effectiveMode === 'weekly_hot' ? 'is-hot' : ''}`}>
          {effectiveMode === 'weekly_hot' ? <Flame size={11} /> : <Trophy size={11} />}
          {effectiveMode === 'weekly_hot' ? (language === 'vi' ? 'Hot tuần' : 'Weekly hot') : (language === 'vi' ? 'Bán chạy' : 'Bestseller')}
        </span>}
      </span>
      <span className="library-book-copy">
        {!compact && <small>{category}</small>}
        <strong>{language === 'en' && book.titleEn ? book.titleEn : book.title}</strong>
        {!compact && <span>{book.author}</span>}
      </span>
    </button>
  );
}
