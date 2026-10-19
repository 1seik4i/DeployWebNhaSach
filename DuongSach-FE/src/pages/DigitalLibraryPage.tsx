import { useModalBehavior } from '../hooks/useModalBehavior';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BookOpen, Building2, CalendarDays, ChevronLeft, ChevronRight, Funnel, Hash, Search, Sparkles, Tag, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Book, BookCategory, BookStall, Language } from '../types';
import { libraryApi } from '../services/libraryApi';
import { BookCard } from '../components/library/BookCard';
import { BookCover } from '../components/library/BookCover';
import { BookStallAvailability } from '../components/library/BookStallAvailability';
import { getPaginationRange } from '../components/ui/ListPagination';
import '../components/library/DigitalLibrary.css';

type DiscoveryMode = 'shelves' | 'bestseller' | 'weekly_hot' | 'category' | 'all_books';
type Shelf = { id: string; title: string; books: Book[]; mode?: 'bestseller' | 'weekly_hot'; actionLabel?: string; onAction?: () => void };
const SHELF_AUTOPLAY_DELAY = 6000;
const SHELF_SCROLL_SETTLE_DELAY = 700;
const BOOKS_PER_PAGE = 10;

function BookShelfRow({ shelf, language, onOpen, exposeBookIds }: { shelf: Shelf; language: Language; onOpen: (book: Book) => void; exposeBookIds: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const loopResetTimerRef = useRef<number | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const getCycleWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track || !shelf.books.length) return 0;
    const firstBook = track.children.item(0) as HTMLElement | null;
    const firstClone = track.children.item(shelf.books.length) as HTMLElement | null;
    return firstBook && firstClone ? firstClone.offsetLeft - firstBook.offsetLeft : 0;
  }, [shelf.books.length]);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setHasOverflow(getCycleWidth() - track.clientWidth > 2);
  }, [getCycleWidth]);

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
      if (loopResetTimerRef.current) window.clearTimeout(loopResetTimerRef.current);
    };
  }, [shelf.books, updateControls]);

  const scroll = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    const cycleWidth = getCycleWidth();
    if (!track || cycleWidth - track.clientWidth <= 2) return;

    if (loopResetTimerRef.current) window.clearTimeout(loopResetTimerRef.current);
    const page = Math.max(240, track.clientWidth);
    let current = track.scrollLeft;

    if (current >= cycleWidth - 2) {
      current -= cycleWidth;
      track.scrollTo({ left: current, behavior: 'auto' });
    } else if (direction < 0 && current <= 2) {
      current = cycleWidth;
      track.scrollTo({ left: current, behavior: 'auto' });
    }

    const target = direction > 0
      ? Math.min(cycleWidth, current + page)
      : Math.max(0, current - page);
    track.scrollTo({ left: target, behavior: 'smooth' });

    if (target >= cycleWidth - 2) {
      loopResetTimerRef.current = window.setTimeout(() => {
        track.scrollTo({ left: Math.max(0, track.scrollLeft - cycleWidth), behavior: 'auto' });
        loopResetTimerRef.current = null;
      }, SHELF_SCROLL_SETTLE_DELAY);
    }
  }, [getCycleWidth]);

  useEffect(() => {
    if (!hasOverflow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) scroll(1);
    }, SHELF_AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [hasOverflow, scroll, shelf.books]);

  const pauseAutoplay = () => { pausedRef.current = true; };
  const resumeAutoplay = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(document.activeElement)) pausedRef.current = false;
  };

  return <section className="library-shelf" aria-labelledby={`shelf-${shelf.id}`}>
    <header className="library-shelf-heading">
      <div><span>{language === 'vi' ? 'TUYỂN CHỌN TẠI ĐƯỜNG SÁCH' : 'CURATED AT BOOK STREET'}</span><h2 id={`shelf-${shelf.id}`}>{shelf.title}</h2></div>
      {shelf.actionLabel && <button type="button" onClick={shelf.onAction}>{shelf.actionLabel}<ArrowRight size={15} /></button>}
    </header>
    <div className="library-shelf-shell" onPointerEnter={pauseAutoplay} onPointerLeave={resumeAutoplay} onPointerDown={pauseAutoplay} onWheel={pauseAutoplay} onFocusCapture={pauseAutoplay} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false; }}>
      <button type="button" className="library-shelf-control is-prev" data-unavailable={!hasOverflow} disabled={!hasOverflow} onClick={() => scroll(-1)} aria-label={language === 'vi' ? `Xem thêm phía trước trong ${shelf.title}` : `Scroll back in ${shelf.title}`}><ChevronLeft size={19} aria-hidden="true" /></button>
      <div ref={trackRef} className={`library-shelf-track ${hasOverflow ? 'is-looping' : 'is-static'}`} onScroll={updateControls}>
        {shelf.books.map(book => <BookCard key={book.id} book={book} language={language} mode={shelf.mode} exposeBookId={exposeBookIds} compact onClick={() => onOpen(book)} />)}
        {shelf.books.map(book => <BookCard key={`loop-${book.id}`} book={book} language={language} mode={shelf.mode} exposeBookId={false} compact carouselClone onClick={() => onOpen(book)} />)}
      </div>
      <button type="button" className="library-shelf-control is-next" data-unavailable={!hasOverflow} disabled={!hasOverflow} onClick={() => scroll(1)} aria-label={language === 'vi' ? `Xem thêm phía sau trong ${shelf.title}` : `Scroll forward in ${shelf.title}`}><ChevronRight size={19} aria-hidden="true" /></button>
      <div className="library-shelf-line" aria-hidden="true" />
    </div>
  </section>;
}
function BookListView({ title, books, bookStalls, language, onOpen }: { title: string; books: Book[]; bookStalls: BookStall[]; language: Language; onOpen: (book: Book) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLElement>(null);
  const totalPages = Math.max(1, Math.ceil(books.length / BOOKS_PER_PAGE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageStart = (safePage - 1) * BOOKS_PER_PAGE;
  const pageBooks = books.slice(pageStart, pageStart + BOOKS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const paginationRange = useMemo(() => getPaginationRange(safePage, totalPages), [safePage, totalPages]);

  return <section ref={listRef} className="library-list-view" aria-labelledby="library-list-title">
    <header className="library-list-heading">
      <div><span>{language === 'vi' ? 'DANH SÁCH ĐẦY ĐỦ' : 'FULL COLLECTION'}</span><h2 id="library-list-title">{title}</h2></div>
      <p>{books.length} {language === 'vi' ? 'tựa sách' : 'books'}</p>
    </header>
    <div className="library-list-rows">
      {pageBooks.map((book, index) => {
        const available = bookStalls.filter(item => item.bookId === book.id && item.inventoryQuantity > 0);
        return <article className="library-list-row" key={book.id}>
          <span className="library-list-index">{String(pageStart + index + 1).padStart(2, '0')}</span>
          <BookCover book={book} decorative />
          <div className="library-list-copy">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>{language === 'en' && book.category?.nameEn ? book.category.nameEn : book.category?.name || (language === 'vi' ? 'Chưa phân loại' : 'Unclassified')}</span>
              {book.bestsellerRank && (
                <span className="library-list-rank-badge bestseller" style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Top #{book.bestsellerRank}
                </span>
              )}
              {book.weeklyRank && (
                <span className="library-list-rank-badge hot" style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Hot #{book.weeklyRank}
                </span>
              )}
            </div>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
          </div>
          <div className="library-list-status">
            <strong>{available.length ? (language === 'vi' ? `Có tại ${available.length} gian hàng` : `At ${available.length} bookstalls`) : (language === 'vi' ? 'Đang cập nhật tồn kho' : 'Availability updating')}</strong>
            {available[0] && <span>{available.slice(0, 2).map(item => item.stallName).join(' · ')}</span>}
          </div>
          <button type="button" onClick={() => onOpen(book)}>{language === 'vi' ? 'Xem chi tiết' : 'View details'}<ArrowRight size={15} /></button>
        </article>;
      })}
      {!books.length && <p className="library-empty">{language === 'vi' ? 'Chưa có sách phù hợp với bộ lọc này.' : 'No books match these filters.'}</p>}
    </div>
    <nav className="library-pagination" aria-label={language === 'vi' ? 'Phân trang danh sách sách' : 'Book list pagination'}>
      <p>{language === 'vi' ? `Hiển thị ${books.length > 0 ? pageStart + 1 : 0}–${Math.min(pageStart + BOOKS_PER_PAGE, books.length)} trong ${books.length} tựa sách` : `Showing ${books.length > 0 ? pageStart + 1 : 0}–${Math.min(pageStart + BOOKS_PER_PAGE, books.length)} of ${books.length} books`}</p>
      <div>
        <button type="button" className="library-pagination-arrow" disabled={safePage <= 1} onClick={() => goToPage(safePage - 1)} aria-label={language === 'vi' ? 'Trang trước' : 'Previous page'}><ArrowLeft size={16} /></button>
        {paginationRange.map((item, index) => {
          if (item === 'ellipsis') {
            return <span key={`ellipsis-${index}`} className="list-pagination-ellipsis" style={{ padding: '0 6px', color: '#6f7d77', fontWeight: 700 }} aria-hidden="true">…</span>;
          }
          return <button
            type="button"
            key={item}
            className={item === safePage ? 'is-active' : ''}
            aria-current={item === safePage ? 'page' : undefined}
            aria-label={`${language === 'vi' ? 'Trang' : 'Page'} ${item}`}
            onClick={() => goToPage(item)}
          >{item}</button>;
        })}
        <button type="button" className="library-pagination-arrow" disabled={safePage >= totalPages} onClick={() => goToPage(safePage + 1)} aria-label={language === 'vi' ? 'Trang tiếp theo' : 'Next page'}><ArrowRight size={16} /></button>
      </div>
    </nav>
  </section>;
}

export function DigitalLibraryPage({ language }: { language: Language }) {
  const location = useLocation();
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const drawerClosingRef = useRef(false);
  const selectedRef = useRef<Book | null>(null);
  const locationRef = useRef(location);
  const scrollLockRef = useRef<{
    scrollY: number;
    activeElement: HTMLElement | null;
    previousStyle: {
      position: string;
      top: string;
      left: string;
      right: string;
      width: string;
      overflow: string;
    };
  } | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [bookStalls, setBookStalls] = useState<BookStall[]>([]);
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('shelves');
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('search') || '');
  const [category, setCategory] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stall, setStall] = useState('all');
  const [sort, setSort] = useState('rank');
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<Book | null>(null);
  const [selectedStalls, setSelectedStalls] = useState<BookStall[]>([]);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [loadError, setLoadError] = useState('');

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  locationRef.current = location;
  selectedRef.current = selected;
  const selectedBookId = new URLSearchParams(location.search).get('book') || location.pathname.split('/')[2] || '';

  const loadData = useCallback(() => {
    Promise.all([
      libraryApi.getBooks(),
      libraryApi.getCategories(),
      libraryApi.getAllBookStalls(),
      libraryApi.getRankings(),
    ])
      .then(([bookRows, categoryRows, stallRows, rankings]) => {
        const rankedById = new Map<string, Partial<Book>>();
        [...rankings.bestsellers, ...rankings.weeklyHot].forEach(book => {
          rankedById.set(book.id, { ...rankedById.get(book.id), ...book });
        });
        setBooks(bookRows.map(book => ({ ...book, ...rankedById.get(book.id) })));
        setCategories(categoryRows);
        setBookStalls(stallRows);
        setLoadError('');
      })
      .catch(error => setLoadError(error instanceof Error ? error.message : 'Không thể tải thư viện số'));
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => void loadData();
    window.addEventListener(libraryApi.changeEvent, handler);
    return () => window.removeEventListener(libraryApi.changeEvent, handler);
  }, [loadData]);

  useEffect(() => {
    if (!selectedBookId) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSelected(null);
      setDrawerClosing(false);
      drawerClosingRef.current = false;
      return;
    }
    const book = books.find(item => item.id === selectedBookId);
    if (book) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSelected(book);
      setDrawerClosing(false);
      drawerClosingRef.current = false;
    }
  }, [books, selectedBookId]);

  useEffect(() => {
    if (!selected) { setSelectedStalls([]); return; }
    void libraryApi.getBookStalls(selected.id)
      .then(rows => { setSelectedStalls(rows); setLoadError(''); })
      .catch(error => setLoadError(error instanceof Error ? error.message : 'Không thể tải tồn kho sách'));
  }, [selected]);

  useEffect(() => { setLimit(10); }, [discoveryMode, query, category, stall, sort]);
  useEffect(() => () => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); }, []);

  const closeDrawer = useCallback(() => {
    if (!selectedRef.current || drawerClosingRef.current) return;
    drawerClosingRef.current = true;
    setDrawerClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      const currentLocation = locationRef.current;
      const hasHistoryFromCatalogue = Boolean(
        currentLocation.state?.bookModalOpenedFromCatalogue && (window.history.state?.idx ?? 1) > 0
      );

      if (hasHistoryFromCatalogue) {
        navigate(-1);
      } else {
        const params = new URLSearchParams(currentLocation.search);
        params.delete('book');
        const search = params.toString();
        navigate(`/thu-vien-so${search ? `?${search}` : ''}`, { replace: true, preventScrollReset: true });
      }
    }, 220);
  }, [navigate]);

  const isModalOpen = Boolean(selected);
  useModalBehavior(isModalOpen, closeDrawer);

  // Preserve catalogue scroll position across book changes
  useEffect(() => {
    if (!isModalOpen) {
      if (scrollLockRef.current) {
        const { scrollY, activeElement, previousStyle } = scrollLockRef.current;
        scrollLockRef.current = null;
        Object.assign(document.body.style, previousStyle);
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        activeElement?.focus({ preventScroll: true });
      }
      return;
    }

    if (!scrollLockRef.current) {
      const scrollY = window.scrollY;
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const previousStyle = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };
      scrollLockRef.current = { scrollY, activeElement, previousStyle };
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
      return () => cancelAnimationFrame(focusFrame);
    }
  }, [isModalOpen]);

  // When switching between books inside the open modal, reset modal panel scroll to top without affecting catalogue
  useEffect(() => {
    if (selected && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [selected]);

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, closeDrawer]);

  // Cleanup body styles on unmount
  useEffect(() => {
    return () => {
      if (scrollLockRef.current) {
        const { scrollY, activeElement, previousStyle } = scrollLockRef.current;
        scrollLockRef.current = null;
        Object.assign(document.body.style, previousStyle);
        window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
        activeElement?.focus({ preventScroll: true });
      }
    };
  }, []);

  const stalls = useMemo(() => Array.from(new Map(bookStalls.map(item => [item.stallId, {
    id: item.stallId,
    name: item.stallName,
    code: item.stallCode,
  }])).values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')), [bookStalls]);

  const contextBooks = useMemo(() => books.filter(book =>
    (category === 'all' || (category === 'uncategorized' ? (!book.categoryId || book.category?.name === 'Chưa phân loại') : book.categoryId === category)) &&
    (stall === 'all' || bookStalls.some(item => item.bookId === book.id && item.stallId === stall))
  ), [books, bookStalls, category, stall]);

  const sortedContextBooks = useMemo(() => [...contextBooks].sort((a, b) => sort === 'az'
    ? a.title.localeCompare(b.title, 'vi')
    : sort === 'updated'
      ? b.updatedAt.localeCompare(a.updatedAt)
      : sort === 'weekly'
        ? (a.weeklyRank || 999) - (b.weeklyRank || 999)
        : (a.bestsellerRank || 999) - (b.bestsellerRank || 999)), [contextBooks, sort]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('vi');
    if (!needle) return [];
    return sortedContextBooks.filter(book => [book.title, book.author, book.isbn]
      .some(value => value.toLocaleLowerCase('vi').includes(needle)));
  }, [query, sortedContextBooks]);

  const shelves = useMemo<Shelf[]>(() => {
    if (category !== 'all') {
      const selectedCategory = categories.find(item => item.id === category);
      const title = category === 'uncategorized'
        ? (language === 'vi' ? 'Sách chưa phân loại' : 'Uncategorized books')
        : selectedCategory
          ? (language === 'en' && selectedCategory.nameEn ? selectedCategory.nameEn : selectedCategory.name)
          : (language === 'vi' ? 'Chủ đề' : 'Category');
      return [{
        id: category,
        title,
        books: sortedContextBooks,
      }];
    }

    if (discoveryMode !== 'shelves') return [];

    const bestsellers = [...contextBooks]
      .filter(book => book.bestsellerRank)
      .sort((a, b) => (a.bestsellerRank || 999) - (b.bestsellerRank || 999));
    const weekly = [...contextBooks]
      .filter(book => book.weeklyRank)
      .sort((a, b) => (a.weeklyRank || 999) - (b.weeklyRank || 999));

    const rows: Shelf[] = [];
    if (bestsellers.length) rows.push({
      id: 'bestsellers',
      title: language === 'vi' ? 'Sách bán chạy' : 'Bestselling books',
      books: bestsellers,
      mode: 'bestseller',
      actionLabel: language === 'vi' ? 'Xem Top 100' : 'View Top 100',
      onAction: () => setDiscoveryMode('bestseller'),
    });
    if (weekly.length) rows.push({
      id: 'weekly',
      title: language === 'vi' ? 'Hot tuần này' : 'Hot this week',
      books: weekly,
      mode: 'weekly_hot',
      actionLabel: language === 'vi' ? 'Xem tất cả' : 'View all',
      onAction: () => setDiscoveryMode('weekly_hot'),
    });

    // Kệ sách theo từng chủ đề danh mục đang có
    categories.forEach(item => {
      const categoryBooks = sortedContextBooks.filter(book => book.categoryId === item.id);
      if (categoryBooks.length) rows.push({
        id: item.id,
        title: language === 'en' && item.nameEn ? item.nameEn : item.name,
        books: categoryBooks,
        actionLabel: language === 'vi' ? 'Xem tất cả' : 'View all',
        onAction: () => { setCategory(item.id); setDiscoveryMode('category'); },
      });
    });

    // Kệ sách chưa phân loại (Default tag - khi sách bị xóa tag hoặc chưa phân loại)
    const uncategorizedBooks = sortedContextBooks.filter(book => !book.categoryId || book.category?.name === 'Chưa phân loại');
    if (uncategorizedBooks.length) {
      rows.push({
        id: 'uncategorized',
        title: language === 'vi' ? 'Sách chưa phân loại' : 'Uncategorized books',
        books: uncategorizedBooks,
        actionLabel: language === 'vi' ? 'Xem tất cả' : 'View all',
        onAction: () => { setCategory('uncategorized'); setDiscoveryMode('category'); },
      });
    }

    // Kệ "Tất cả sách đang có tại Đường Sách" - luôn hiển thị đầy đủ mọi cuốn sách có sẵn
    if (sortedContextBooks.length > 0) {
      rows.push({
        id: 'all_available_books',
        title: language === 'vi' ? 'Tất cả sách đang có tại Đường Sách' : 'All available books at Book Street',
        books: sortedContextBooks,
        actionLabel: language === 'vi' ? 'Xem danh sách đầy đủ' : 'View full list',
        onAction: () => { setDiscoveryMode('all_books'); },
      });
    }

    return rows;
  }, [categories, category, contextBooks, discoveryMode, language, sortedContextBooks]);

  const fullList = useMemo(() => {
    if (discoveryMode === 'all_books') return {
      title: language === 'vi' ? 'Tất cả sách đang có tại Đường Sách' : 'All available books at Book Street',
      books: sortedContextBooks,
    };
    if (discoveryMode === 'bestseller') return {
      title: language === 'vi' ? 'Top 100 bán chạy' : 'Top 100 bestsellers',
      books: [...contextBooks].filter(book => book.bestsellerRank).sort((a, b) => (a.bestsellerRank || 999) - (b.bestsellerRank || 999)),
    };
    if (discoveryMode === 'weekly_hot') return {
      title: language === 'vi' ? 'Tất cả sách hot tuần này' : 'All hot books this week',
      books: [...contextBooks].filter(book => book.weeklyRank).sort((a, b) => (a.weeklyRank || 999) - (b.weeklyRank || 999)),
    };
    if (discoveryMode === 'category') {
      const isUncat = category === 'uncategorized';
      const selectedCategory = categories.find(item => item.id === category);
      return {
        title: isUncat
          ? (language === 'vi' ? 'Tất cả sách chưa phân loại' : 'All uncategorized books')
          : selectedCategory
            ? `${language === 'vi' ? 'Tất cả sách chủ đề' : 'All books in'} ${language === 'en' && selectedCategory.nameEn ? selectedCategory.nameEn : selectedCategory.name}`
            : (language === 'vi' ? 'Tất cả sách' : 'All books'),
        books: sortedContextBooks,
      };
    }
    return null;
  }, [categories, category, contextBooks, discoveryMode, language, sortedContextBooks]);

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(location.search);
    params.delete('search');
    params.delete('book');
    const next = params.toString();
    navigate(`/thu-vien-so${next ? `?${next}` : ''}`, { replace: true, preventScrollReset: true });
  };

  const openDrawer = (book: Book) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const currentSearch = typeof window !== 'undefined' ? window.location.search : locationRef.current.search;
    const isBookModalAlreadyOpen = !drawerClosingRef.current && Boolean(
      selectedRef.current ||
      new URLSearchParams(currentSearch).get('book') ||
      new URLSearchParams(locationRef.current.search).get('book')
    );
    drawerClosingRef.current = false;
    setDrawerClosing(false);
    const params = new URLSearchParams(currentSearch);
    params.set('book', book.id);
    navigate(`/thu-vien-so?${params.toString()}`, {
      replace: isBookModalAlreadyOpen,
      state: {
        ...locationRef.current.state,
        bookModalOpenedFromCatalogue: isBookModalAlreadyOpen
          ? locationRef.current.state?.bookModalOpenedFromCatalogue
          : true,
      },
      preventScrollReset: true,
    });
  };

  const drawer = selected && createPortal(
    <div className={`book-detail-overlay ${drawerClosing ? 'is-closing' : 'is-open'}`} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <article ref={panelRef} className="book-detail-panel" role="dialog" aria-modal="true" aria-labelledby="book-detail-title" aria-describedby="book-detail-description">
        <div className="book-detail-topbar">
          <span>{language === 'vi' ? 'CHI TIẾT SÁCH' : 'BOOK DETAILS'}</span>
          <button ref={closeButtonRef} type="button" className="book-detail-close" onClick={closeDrawer} aria-label={language === 'vi' ? 'Đóng chi tiết sách' : 'Close book details'}><X size={20} /></button>
        </div>
        <div className="book-detail-showcase">
          <div className="book-detail-visual">
            <BookCover book={selected} className="book-detail-cover" />
          </div>
          <div className="book-detail-content">
            <div className="book-detail-heading">
              <span className="book-detail-category">{selected.category?.name || (language === 'vi' ? 'Chưa phân loại' : 'Unclassified')}</span>
              <h2 id="book-detail-title">{selected.title}</h2>
              <p>{selected.author}</p>
              <div className="book-detail-ranks">
                {selected.bestsellerRank && <span>#{String(selected.bestsellerRank).padStart(2, '0')} {language === 'vi' ? 'Bán chạy' : 'Bestseller'}</span>}
                {selected.weeklyRank && <span className="is-hot">#{String(selected.weeklyRank).padStart(2, '0')} {language === 'vi' ? 'Hot tuần' : 'Weekly hot'}</span>}
                {selected.labels && selected.labels.length > 0 && selected.labels.map(label => (
                  <span key={label.id} className="book-detail-label-tag">
                    <Tag size={12} /> {label.name}
                  </span>
                ))}
              </div>
            </div>
            <dl className="book-detail-facts">
              <div><dt><Hash size={14} />ISBN</dt><dd>{selected.isbn}</dd></div>
              <div><dt><Building2 size={14} />{language === 'vi' ? 'Nhà xuất bản' : 'Publisher'}</dt><dd>{selected.publisher || '—'}</dd></div>
              {selected.publicationYear && <div><dt><CalendarDays size={14} />{language === 'vi' ? 'Năm xuất bản' : 'Published'}</dt><dd>{selected.publicationYear}</dd></div>}
            </dl>
            <BookStallAvailability stalls={selectedStalls} language={language} />
            <div className="book-detail-summary">
              <h3>{language === 'vi' ? 'Giới thiệu' : 'About this book'}</h3>
              <p id="book-detail-description">{selected.description || '—'}</p>
            </div>
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );

  return <>
    {loadError && <p className="app-error-state">{loadError}</p>}
    <main className="library-page" id="main-content">
      {/* Sticky Editorial Navigation Bar */}
      <nav className="library-topbar" aria-label={language === 'vi' ? 'Điều hướng trang' : 'Page Navigation'}>
        <div className="library-topbar-inner">
          <button
            type="button"
            className="library-back-btn"
            onClick={() => navigate('/')}
            title={language === 'vi' ? 'Trang chủ' : 'Back to Home'}
          >
            <ArrowLeft size={16} />
            <span>{language === 'vi' ? 'Trang chủ' : 'Back to Home'}</span>
          </button>

          <div className="library-breadcrumbs">
            <button type="button" onClick={() => navigate('/')} className="library-crumb-link">
              {language === 'vi' ? 'Trang chủ' : 'Home'}
            </button>
            <ChevronRight size={13} className="library-crumb-sep" />
            <span className="library-crumb-active">
              {language === 'vi' ? 'Thư viện số & Tra cứu' : 'Digital Library'}
            </span>
          </div>
        </div>
      </nav>

      {/* Editorial Heritage Hero Section */}
      <header className="library-page-hero">
        <div className="library-hero-bg-photo" aria-hidden="true" />
        <div className="library-hero-gradient-overlay" aria-hidden="true" />

        <div className="library-hero-container">
          <div className="library-hero-brand-lockup">
            <div className="library-hero-era">
              <span />
              <i>{language === 'vi' ? 'KHÔNG GIAN TRI THỨC SỐ • ĐƯỜNG SÁCH TP.HCM' : 'DIGITAL KNOWLEDGE SPACE • HCMC BOOK STREET'}</i>
              <span />
            </div>

            <h1 className="library-hero-title">
              {language === 'vi' ? (
                <>
                  Thư viện số & Tra cứu<br />
                  <em>Đường Sách TP. Hồ Chí Minh</em>
                </>
              ) : (
                <>
                  Digital Library & Catalogue<br />
                  <em>HCMC Book Street</em>
                </>
              )}
            </h1>

            <p className="library-hero-lead">
              {language === 'vi'
                ? 'Hệ thống tra cứu trực tuyến hàng ngàn tựa sách từ các nhà xuất bản và ki-ốt tại Đường Sách Nguyễn Văn Bình, hỗ trợ kiểm tra nhanh vị trí kệ sách và tình trạng tồn kho thực tế.'
                : 'Online catalogue connecting thousands of curated titles across publishers and stalls along Nguyen Van Binh Book Street, with live bookshelf locator and stock availability.'}
            </p>
          </div>
        </div>
      </header>
      <section className="container library-catalogue">
        <div className="library-catalogue-head">
          <div className="library-view-tabs">
            <button 
              type="button" 
              className={discoveryMode === 'shelves' ? 'is-active' : ''} 
              onClick={() => { setDiscoveryMode('shelves'); setCategory('all'); }}
            >
              {language === 'vi' ? 'Kệ sách' : 'Bookshelves'}
            </button>
            <button 
              type="button" 
              className={discoveryMode === 'all_books' ? 'is-active' : ''} 
              onClick={() => { setDiscoveryMode('all_books'); setCategory('all'); }}
            >
              {language === 'vi' ? 'Tất cả sách đang có' : 'All available books'}
            </button>
            <button 
              type="button" 
              className={discoveryMode === 'bestseller' ? 'is-active' : ''} 
              onClick={() => { setDiscoveryMode('bestseller'); setCategory('all'); setSort('rank'); }}
            >
              Top 100 {language === 'vi' ? 'bán chạy' : 'bestsellers'}
            </button>
            <button 
              type="button" 
              className={discoveryMode === 'weekly_hot' ? 'is-active' : ''} 
              onClick={() => { setDiscoveryMode('weekly_hot'); setCategory('all'); setSort('weekly'); }}
            >
              {language === 'vi' ? 'Hot tuần này' : 'Hot this week'}
            </button>
          </div>
          <span className="library-results-meta">{fullList ? fullList.books.length : contextBooks.length} {language === 'vi' ? 'tựa sách' : 'books'}</span>
        </div>
        <div className="library-toolbar library-toolbar-collapsible">
          <div className="library-control library-search-control"><label htmlFor="library-search">{language === 'vi' ? 'Tìm kiếm' : 'Search'}</label><div className="library-input-shell"><Search size={17} /><input id="library-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={language === 'vi' ? 'Tìm tên sách, tác giả hoặc ISBN...' : 'Search title, author or ISBN...'} /></div></div>
          <button type="button" className="library-filter-toggle" aria-expanded={filtersOpen} aria-controls="library-extra-filters" onClick={() => setFiltersOpen(open => !open)}><Funnel size={17} aria-hidden="true" /><span>{language === 'vi' ? 'Bộ lọc' : 'Filters'}</span></button>
          {filtersOpen && <div id="library-extra-filters" className="library-extra-filters">
          <div className="library-control">
            <label htmlFor="library-category">{language === 'vi' ? 'Chủ đề' : 'Category'}</label>
            <select 
              id="library-category" 
              value={category} 
              onChange={event => { 
                const val = event.target.value;
                setCategory(val); 
                setDiscoveryMode(val === 'all' ? 'shelves' : 'category'); 
              }}
            >
              <option value="all">{language === 'vi' ? 'Tất cả chủ đề' : 'All categories'}</option>
              {categories.map(item => <option key={item.id} value={item.id}>{language === 'en' && item.nameEn ? item.nameEn : item.name}</option>)}
              <option value="uncategorized">{language === 'vi' ? 'Chưa phân loại (Mặc định)' : 'Uncategorized (Default)'}</option>
            </select>
          </div>
          <div className="library-control"><label htmlFor="library-stall">{language === 'vi' ? 'Gian hàng' : 'Bookstall'}</label><select id="library-stall" value={stall} onChange={event => setStall(event.target.value)}><option value="all">{language === 'vi' ? 'Tất cả gian hàng' : 'All bookstalls'}</option>{stalls.map(item => <option key={item.id} value={item.id}>{item.name}{item.code ? ` — ${item.code}` : ''}</option>)}</select></div>
          <div className="library-control"><label htmlFor="library-sort">{language === 'vi' ? 'Sắp xếp' : 'Sort'}</label><select id="library-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="rank">{language === 'vi' ? 'Bán chạy nhất' : 'Bestselling'}</option><option value="weekly">{language === 'vi' ? 'Hot tuần này' : 'Hot this week'}</option><option value="az">{language === 'vi' ? 'Tên A–Z' : 'Title A–Z'}</option><option value="updated">{language === 'vi' ? 'Mới cập nhật' : 'Recently updated'}</option></select></div>
          </div>}
        </div>
        {query.trim() ? <section className="library-search-results" aria-live="polite">
          <header><div><span>{language === 'vi' ? 'KẾT QUẢ TÌM KIẾM CHO' : 'SEARCH RESULTS FOR'}</span><h2>“{query.trim()}”</h2><p>{searchResults.length} {language === 'vi' ? 'kết quả' : 'results'}</p></div><button type="button" onClick={clearSearch}><X size={16} />{language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}</button></header>
          <div className="library-catalogue-grid">{searchResults.slice(0, limit).map(book => <BookCard key={book.id} book={book} language={language} onClick={() => openDrawer(book)} />)}{!searchResults.length && <p className="library-empty">{language === 'vi' ? 'Không tìm thấy sách phù hợp. Hãy thử tên tác giả, ISBN hoặc từ khóa khác.' : 'No matching books. Try an author, ISBN or another keyword.'}</p>}</div>
          {limit < searchResults.length && <div className="library-load-more"><button type="button" onClick={() => setLimit(value => value + 10)}>{language === 'vi' ? 'Xem thêm sách' : 'Load more books'}</button></div>}
        </section> : fullList
          ? <BookListView key={`${discoveryMode}-${category}-${stall}-${sort}`} title={fullList.title} books={fullList.books} bookStalls={bookStalls} language={language} onOpen={openDrawer} />
          : <div className="library-shelves">{shelves.map((shelf, index) => <BookShelfRow key={shelf.id} shelf={shelf} language={language} onOpen={openDrawer} exposeBookIds={index === 0} />)}{!shelves.length && <p className="library-empty">{language === 'vi' ? 'Chưa có sách phù hợp với bộ lọc này.' : 'No books match these filters.'}</p>}</div>}
      </section>
    </main>
    {drawer}
  </>;
}
