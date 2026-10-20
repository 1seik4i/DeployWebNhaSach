import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Search, Trophy, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Book, Language } from '../../types';
import { libraryApi } from '../../services/libraryApi';
import { BookCover } from './BookCover';
import { LibraryBookSkeleton } from '../ui/SkeletonCard';
import './DigitalLibrary.css';

export function DigitalLibrarySection({ language }: { language: Language }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      setIsLoading(true);
      Promise.all([libraryApi.getBooks(), libraryApi.getRankings()])
        .then(([items, rankings]) => {
          const rankedById = new Map<string, Partial<Book>>();
          [...rankings.bestsellers, ...rankings.weeklyHot].forEach(book => {
            rankedById.set(book.id, { ...rankedById.get(book.id), ...book });
          });
          setBooks(items.map(book => ({ ...book, ...rankedById.get(book.id) })));
        })
        .finally(() => {
          setIsLoading(false);
        });
    };
    load();
    const handler = () => void load();
    window.addEventListener(libraryApi.changeEvent, handler);
    return () => window.removeEventListener(libraryApi.changeEvent, handler);
  }, []);

  const visible = useMemo(() => {
    return [...books]
      .sort((a, b) => (a.bestsellerRank || 999) - (b.bestsellerRank || 999))
      .slice(0, 12);
  }, [books]);
  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const items = Array.from(track.querySelectorAll<HTMLElement>('.library-ranking-item'));
    if (items.length === 0) {
      setCanScrollBack(false);
      setCanScrollForward(false);
      return;
    }

    const currentScroll = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

    // Có thể lùi lại nếu không ở vị trí bắt đầu
    setCanScrollBack(currentScroll > 15);

    // Tính toán mốc cho từng cụm 4 cuốn sách
    const step = 4;
    const baseLeft = items[0].getBoundingClientRect().left;
    const groupOffsets: number[] = [];

    for (let i = 0; i < items.length; i += step) {
      const offset = items[i].getBoundingClientRect().left - baseLeft;
      groupOffsets.push(Math.round(offset));
    }

    // Còn nhóm sách nào tiếp theo phía trước không?
    const hasNextGroup = groupOffsets.some(offset => offset > currentScroll + 20);

    // Cuốn sách cuối cùng (sách 12) đã vào trọn khung nhìn chưa?
    const lastItem = items[items.length - 1];
    const isLastItemVisible = lastItem
      ? lastItem.getBoundingClientRect().right <= track.getBoundingClientRect().right + 25
      : false;

    // Nút tiến CHỈ hiện khi còn nhóm sách phía sau VÀ cuốn cuối cùng chưa hiển thị
    setCanScrollForward(hasNextGroup && !isLastItemVisible && (maxScroll - currentScroll > 25));
  }, []);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const items = Array.from(track.querySelectorAll<HTMLElement>('.library-ranking-item'));
    if (items.length === 0) {
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
      return;
    }

    const step = 4;
    const currentScroll = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

    // Tính toán mốc vị trí của từng cụm 4 cuốn sách
    const groupOffsets: number[] = [];
    const baseLeft = items[0].getBoundingClientRect().left;

    for (let i = 0; i < items.length; i += step) {
      const offset = items[i].getBoundingClientRect().left - baseLeft;
      groupOffsets.push(Math.min(maxScroll, Math.max(0, Math.round(offset))));
    }

    let targetScroll: number;

    if (direction > 0) {
      // Kéo 4 cuốn đi, hiện 4 cuốn mới tiếp theo
      const nextOffset = groupOffsets.find(offset => offset > currentScroll + 20);
      if (nextOffset !== undefined) {
        targetScroll = nextOffset;
      } else {
        // Đã đến cụm cuối cùng (sách 9-12), dừng lại và không cuộn thêm
        return;
      }
    } else {
      // Lùi lại 4 cuốn sách trước đó
      const prevOffsets = groupOffsets.filter(offset => offset < currentScroll - 20);
      targetScroll = prevOffsets.length > 0 ? prevOffsets[prevOffsets.length - 1] : 0;
    }

    track.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = query.trim();
    navigate(`/thu-vien-so${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior: 'auto' });
    const frame = requestAnimationFrame(updateControls);
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [updateControls, visible]);

  return (
    <section className="digital-library-section" id="thu-vien-so">
      <div className="container library-showcase-container">
        <header className="library-section-heading">
          <span className="library-eyebrow"><BookOpen size={15} />{language === 'vi' ? 'THƯ VIỆN SỐ' : 'DIGITAL LIBRARY'}</span>
          <h2>{language === 'vi' ? 'Khám phá sách tại Đường Sách' : 'Discover books at Book Street'}</h2>
          <p>{language === 'vi' ? 'Tìm kiếm và khám phá những tựa sách đang có tại các gian hàng Đường Sách.' : 'Find and explore books available across Book Street bookstalls.'}</p>
        </header>

        <form className="library-home-search" role="search" onSubmit={submitSearch}>
          <Search size={19} aria-hidden="true" />
          <input maxLength={200}
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label={language === 'vi' ? 'Tìm sách' : 'Search books'}
            placeholder={language === 'vi' ? 'Tìm tên sách, tác giả hoặc ISBN...' : 'Search title, author or ISBN...'}
          />
          <button
            type="button"
            className="library-search-clear"
            onMouseDown={event => event.preventDefault()}
            onClick={() => setQuery('')}
            disabled={!query}
            aria-label={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="library-ranking-shell">
          <button type="button" className="library-carousel-control is-prev" data-unavailable={!canScrollBack} disabled={!canScrollBack} onClick={() => scroll(-1)} aria-label={language === 'vi' ? 'Sách xếp hạng trước' : 'Previous ranked books'}><ChevronLeft size={19} aria-hidden="true" /></button>
          <div ref={trackRef} className="library-ranking-track" onScroll={updateControls} aria-label={language === 'vi' ? 'Bảng xếp hạng sách' : 'Book ranking'}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <LibraryBookSkeleton key={`skeleton-book-${idx}`} index={idx + 1} />
              ))
            ) : (
              visible.map((book, idx) => {
                const rank = book.bestsellerRank || (idx + 1);
                return <Link key={book.id} to={`/thu-vien-so?book=${encodeURIComponent(book.id)}`} className="library-ranking-item">
                  <span className="library-ranking-visual">
                    <span className={`library-ranking-number ${rank >= 10 ? 'is-double-digit' : ''}`} aria-label={`${language === 'vi' ? 'Hạng' : 'Rank'} ${rank}`}>{rank}</span>
                    <BookCover book={book} decorative />
                    <span className="library-ranking-badge"><Trophy size={11} />{language === 'vi' ? 'Bán chạy' : 'Bestseller'}</span>
                  </span>
                </Link>;
              })
            )}
          </div>
          <button type="button" className="library-carousel-control is-next" data-unavailable={!canScrollForward} disabled={!canScrollForward} onClick={() => scroll(1)} aria-label={language === 'vi' ? 'Sách xếp hạng tiếp theo' : 'Next ranked books'}><ChevronRight size={19} aria-hidden="true" /></button>
        </div>

        {/* Nút Xem thêm không có viền đặt dưới danh sách tương tự các tab khác */}
        <div className="section-bottom-see-more-row">
          <Link
            to="/thu-vien-so"
            className="btn-section-see-more-borderless"
            aria-label={language === 'vi' ? 'Xem thêm toàn bộ kho sách tại Thư viện số' : 'Explore full collection in Digital Library'}
          >
            <span className="see-more-text-full">{language === 'vi' ? 'Xem thêm toàn bộ kho sách tại Thư viện số' : 'Explore full collection in Digital Library'}</span>
            <span className="see-more-text-mobile">{language === 'vi' ? 'Xem thêm toàn bộ Thư viện số' : 'Explore Digital Library'}</span>
            <ChevronRight size={22} className="see-more-arrow-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
