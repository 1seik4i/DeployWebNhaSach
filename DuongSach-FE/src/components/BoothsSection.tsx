import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, X, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { IconBookSpine, IconBookmark } from './CustomIcons';
import { Booth, Language } from '../types';
import { BoothCardSkeleton } from './ui/SkeletonCard';
import './BoothsSection.css';

interface BoothsSectionProps {
  language: Language;
  booths?: Booth[];
  isLoading?: boolean;
  onSelectBoothOnMap: (boothId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  focusedBoothId?: string | null;
}

export const BoothsSection: React.FC<BoothsSectionProps> = ({
  language,
  booths: initialBooths,
  isLoading = false,
  onSelectBoothOnMap,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  focusedBoothId,
}) => {
  const booths = initialBooths || [];
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeModalBooth, setActiveModalBooth] = useState<Booth | null>(null);
  const [isBoothSheetClosing, setIsBoothSheetClosing] = useState(false);

  useModalBehavior(Boolean(activeModalBooth), () => closeBoothModal());
  const [carouselPage, setCarouselPage] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState<1 | -1>(1);
  const sheetDragStartY = React.useRef<number | null>(null);
  const didSheetDrag = React.useRef(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isMobileCarousel, setIsMobileCarousel] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  );
  const stallsTrackRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const isPointerDragging = React.useRef(false);
  const pointerStartX = React.useRef(0);
  const pointerStartScroll = React.useRef(0);

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea')) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button === 0) {
      isPointerDragging.current = true;
      pointerStartX.current = e.clientX;
      pointerStartScroll.current = stallsTrackRef.current?.scrollLeft || 0;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDragging.current || !stallsTrackRef.current) return;
    const diff = e.clientX - pointerStartX.current;
    if (Math.abs(diff) > 2) {
      stallsTrackRef.current.scrollLeft = pointerStartScroll.current - diff;
    }
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPointerDragging.current) {
      isPointerDragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const clearSearch = () => {
    if (!searchQuery) return;
    setSearchQuery('');
    setCarouselPage(0);
    searchInputRef.current?.focus();
  };

  const closeBoothModal = () => {
    if (!activeModalBooth || isBoothSheetClosing) return;
    if (!window.matchMedia('(max-width: 540px)').matches) {
      setActiveModalBooth(null);
      return;
    }
    setIsBoothSheetClosing(true);
    window.setTimeout(() => {
      setActiveModalBooth(null);
      setSheetDragOffset(0);
      setIsBoothSheetClosing(false);
    }, 260);
  };

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateCarouselMode = () => setIsMobileCarousel(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateCarouselMode);
    return () => mediaQuery.removeEventListener('change', updateCarouselMode);
  }, []);

  React.useEffect(() => {
    if (!activeModalBooth) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeBoothModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalBooth]);

  // Khi người dùng bấm "Xem trong danh mục gian hàng" từ bản đồ hoặc mở chi tiết gian hàng
  React.useEffect(() => {
    if (focusedBoothId) {
      const found = booths.find((b) => b.id === focusedBoothId);
      if (found) {
        // eslint-disable-next-line react/set-state-in-effect
        setActiveModalBooth(found);
      }
    }
  }, [focusedBoothId, booths]);

  const handleOpenBoothModal = (booth: Booth, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsBoothSheetClosing(false);
    setSheetDragOffset(0);
    setActiveModalBooth(booth);
  };


  const categories = [
    { id: 'all', labelVi: 'Tất cả', labelEn: 'All Stalls' },
    { id: 'literature', labelVi: 'Văn học', labelEn: 'Literature' },
    { id: 'children', labelVi: 'Thiếu nhi', labelEn: 'Children' },
    { id: 'history', labelVi: 'Lịch sử & Tri thức', labelEn: 'History & Wisdom' },
    { id: 'cafe', labelVi: 'Cà phê sách', labelEn: 'Book Cafe' },
  ];

  const filteredBooths = useMemo(() => {
    const matchingBooths = booths.filter((booth) => {
      const matchCat = activeCategory === 'all' || booth.category === activeCategory;
      const q = searchQuery.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
      const matchSearch =
        !q ||
        booth.name.toLowerCase().includes(q) ||
        booth.nameEn.toLowerCase().includes(q) ||
        booth.publisher.toLowerCase().includes(q) ||
        booth.featuredBooks.some((b) => b.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });

    return matchingBooths;
  }, [searchQuery, activeCategory, booths]);

  React.useEffect(() => {
    if (!isMobileCarousel) return;

    // Defer until after browser scroll restoration and the horizontal track's layout.
    const frameId = requestAnimationFrame(() => {
      stallsTrackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frameId);
  }, [isMobileCarousel, activeCategory, searchQuery, filteredBooths]);
  const carouselPages = [
    filteredBooths.slice(0, 4),
    filteredBooths.slice(4, 8),
    filteredBooths.slice(8, 11),
  ].filter((page) => page.length > 0);
  const activeCarouselPage = Math.min(carouselPage, Math.max(carouselPages.length - 1, 0));
  const visibleBooths = carouselPages[activeCarouselPage] || [];
  const displayedBooths = isMobileCarousel ? filteredBooths : visibleBooths;
  const showExploreCard = isMobileCarousel || (activeCarouselPage === carouselPages.length - 1 && carouselPages.length > 0);
  const carouselMotion = {
    enter: (direction: number) => ({ opacity: 0, x: `${direction * 105}%` }),
    center: { opacity: 1, x: '0%' },
    exit: (direction: number) => ({ opacity: 0, x: `${direction * -105}%` }),
  };

  return (
    <section className="figma-bookstalls-section" id="gian-hang">
      <div className="container">
        {/* Figma Eyebrow & Title */}
        <div className="figma-section-header">
          <span className="figma-eyebrow">
            <IconBookSpine size={16} color="var(--figma-gold)" />
            <span>{language === 'vi' ? 'DANH MỤC GIAN HÀNG' : 'BOOKSTALL DIRECTORY'}</span>
          </span>
          <h2 className="figma-section-title">
            {language === 'vi' ? (
              <>Các gian hàng tại <span className="serif-italic-accent">Đường Sách</span></>
            ) : (
              <>Bookstalls & Pavilions at <span className="serif-italic-accent">Book Street</span></>
            )}
          </h2>
          <p className="figma-section-subtitle">
            {language === 'vi'
              ? 'Hơn 20 nhà xuất bản và đơn vị phát hành sách uy tín luôn sẵn sàng đón chào bạn đọc.'
              : 'Over 20 prestigious publishers and distributors welcoming reading enthusiasts.'}
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="figma-stalls-controls">
          <div className="figma-search-bar">
            <Search size={18} className="search-ico" />
            <input maxLength={200}
              type="text"
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'vi'
                  ? 'Tìm gian hàng, nhà xuất bản...'
                  : 'Search stalls, publishers...'
              }
              className="figma-search-input"
            />
            <button
              type="button"
              className={`search-clear ${searchQuery ? 'is-active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearSearch}
              disabled={!searchQuery}
              aria-label={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
            >
              <X size={16} />
            </button>
          </div>

          <div className="figma-category-pills">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {language === 'vi' ? cat.labelVi : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div className="booths-carousel-nav-btns" aria-label={language === 'vi' ? 'Điều hướng danh sách gian hàng' : 'Bookstall carousel navigation'}>
          <button
            type="button"
            className="booths-carousel-nav-btn"
            onClick={() => {
              setCarouselDirection(-1);
              setCarouselPage((page) => Math.max(page - 1, 0));
            }}
            hidden={activeCarouselPage === 0}
            aria-label={language === 'vi' ? 'Xem gian hàng trước' : 'Previous bookstalls'}
            title={language === 'vi' ? 'Gian hàng trước' : 'Previous'}
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="booths-carousel-nav-btn"
            onClick={() => {
              setCarouselDirection(1);
              setCarouselPage((page) => Math.min(page + 1, carouselPages.length - 1));
            }}
            hidden={activeCarouselPage >= carouselPages.length - 1}
            aria-label={language === 'vi' ? 'Xem gian hàng tiếp theo' : 'Next bookstalls'}
            title={language === 'vi' ? 'Gian hàng tiếp theo' : 'Next'}
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </div>

        {/* Horizontal Scrolling Carousel / Slider */}
        <div 
          className="figma-stalls-slider-track"
          ref={stallsTrackRef}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
          tabIndex={0}
          role="region"
          aria-label="Danh sách gian hàng lướt ngang"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={carouselDirection}>
          <motion.div
            key={isLoading ? 'loading' : activeCarouselPage}
            className="booths-carousel-page"
            custom={carouselDirection}
            variants={carouselMotion}
            initial={isMobileCarousel ? false : 'enter'}
            animate={isMobileCarousel ? false : 'center'}
            exit={isMobileCarousel ? undefined : 'exit'}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
          >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <BoothCardSkeleton key={`skeleton-booth-${idx}`} />
            ))
          ) : (
            displayedBooths.map((booth, idx) => {
            const isFocused = focusedBoothId === booth.id;
            return (
              <div 
                key={booth.id}
                id={`booth-card-${booth.id}`}
                className={`figma-kiosk-card ${isFocused ? 'kiosk-card-focus-once' : ''}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Real Photography Header with Label */}
                <div className="kiosk-card-photo-wrapper">
                  <img 
                    src={booth.image.url || '/duong_sach_logo.png'}
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/duong_sach_logo.png'; }}
                    alt={booth.image.alt} 
                    loading="lazy" 
                    className="kiosk-photo-img"
                  />
                  <div className="kiosk-photo-overlay"></div>
                </div>

                <div className="kiosk-card-body">
                  <h3 className="kiosk-title">
                    {language === 'vi' ? booth.name : booth.nameEn}
                  </h3>
                  <p className="kiosk-desc">
                    {language === 'vi' ? booth.tagline : booth.taglineEn}
                  </p>

                  <div className="kiosk-highlights">
                    {booth.topSellingBook && (
                      <div className="kiosk-bestseller-stat-box" title={`${language === 'vi' ? 'Bán chạy nhất' : 'Top Seller'}: ${booth.topSellingBook.title}`}>
                        <div className="kiosk-bestseller-left">
                          <span
                            className="kiosk-bestseller-badge"
                            title={language === 'vi' ? 'Bán chạy nhất' : 'Top Seller'}
                            aria-label={language === 'vi' ? 'Bán chạy nhất' : 'Top Seller'}
                          >
                            🔥
                          </span>
                          <span className="kiosk-bestseller-name">{booth.topSellingBook.title}</span>
                        </div>
                      </div>
                    )}

                    <span className="kiosk-hl-label">
                      <IconBookmark size={13} />
                      <span>{language === 'vi' ? 'Đầu sách đặc trưng:' : 'Notable reads:'}</span>
                    </span>
                    <div className="kiosk-books-row">
                      {booth.featuredBooks.slice(0, 2).map((bk, i) => (
                        <span key={i} className="kiosk-book-tag">{bk}</span>
                      ))}
                    </div>
                  </div>

                  <div className="kiosk-card-footer">
                    <button
                      type="button"
                      className="btn-kiosk-detail"
                      onClick={(e) => handleOpenBoothModal(booth, e)}
                    >
                      <span>{language === 'vi' ? 'Xem chi tiết' : 'View details'}</span>
                      <ChevronRight size={15} />
                    </button>

                    <button
                      type="button"
                      className="btn-kiosk-map"
                      onClick={() => onSelectBoothOnMap(booth.id)}
                    >
                      <MapPin size={15} />
                      <span>{language === 'vi' ? 'Xem trên bản đồ' : 'Map Pin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
          )}
          {!isLoading && showExploreCard && (
            <Link to="/gian-hang" className="booths-explore-card">
              <span>{language === 'vi' ? 'Khám phá thêm gian hàng' : 'Explore more bookstalls'}</span>
              <ChevronsRight size={30} aria-hidden="true" />
            </Link>
          )}
          </motion.div>
          </AnimatePresence>
        </div>

        {/* Nút Xem thêm nhỏ không có khung viền đặt dưới danh sách */}
        <div className="section-bottom-see-more-row">
          <Link
            to="/gian-hang"
            className="btn-section-see-more-borderless"
            aria-label="Xem thêm toàn bộ gian hàng tại Đường Sách"
          >
            <span className="see-more-text-full">{language === 'vi' ? 'Xem thêm toàn bộ các gian hàng tại Đường Sách' : 'View all bookstalls & pavilions at Book Street'}</span>
            <span className="see-more-text-mobile">{language === 'vi' ? 'Xem toàn bộ gian hàng' : 'View all bookstalls'}</span>
            <ChevronRight size={17} className="see-more-arrow-icon" />
          </Link>
        </div>
      </div>

      {/* Detail Modal with 30% Logic Preservation */}
      {activeModalBooth && createPortal(
        <div
          className="modal-overlay booth-detail-modal-overlay"
          onClick={closeBoothModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booth-detail-modal-title"
        >
          <div
            className={`modal-content booth-detail-modal-content ${isBoothSheetClosing ? 'is-closing' : ''}`}
            style={!isBoothSheetClosing && (isSheetDragging || sheetDragOffset !== 0) ? { transform: `translateY(${sheetDragOffset}px)`, transition: isSheetDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="booth-sheet-handle"
              aria-label={language === 'vi' ? 'Kéo xuống để đóng chi tiết gian hàng' : 'Drag down to close booth details'}
              onClick={() => { if (!didSheetDrag.current) closeBoothModal(); }}
              onPointerDown={(event) => {
                sheetDragStartY.current = event.clientY;
                didSheetDrag.current = false;
                setIsSheetDragging(true);
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (sheetDragStartY.current === null) return;
                const distance = event.clientY - sheetDragStartY.current;
                if (Math.abs(distance) > 3) didSheetDrag.current = true;
                setSheetDragOffset(Math.max(-72, Math.min(distance, window.innerHeight * 0.82)));
              }}
              onPointerUp={(event) => {
                if (sheetDragStartY.current === null) return;
                const distance = event.clientY - sheetDragStartY.current;
                sheetDragStartY.current = null;
                setIsSheetDragging(false);
                if (distance > 120) closeBoothModal();
                else setSheetDragOffset(0);
                window.setTimeout(() => { didSheetDrag.current = false; }, 0);
              }}
              onPointerCancel={() => { sheetDragStartY.current = null; setIsSheetDragging(false); setSheetDragOffset(0); }}
            >
              <span aria-hidden="true" />
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={closeBoothModal}
              aria-label={language === 'vi' ? 'Đóng chi tiết gian hàng' : 'Close booth details'}
            >
              <X size={20} />
            </button>
            <div className="booth-detail-scroll-body">
              <div className="modal-booth-header-img">
                <img src={activeModalBooth.image.url || '/duong_sach_logo.png'} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/duong_sach_logo.png'; }} alt={activeModalBooth.image.alt} className="modal-top-img" />
                <div className="modal-img-caption">
                  <span className="kiosk-number-badge">{activeModalBooth.code}</span>
                </div>
              </div>
              <h3 className="modal-heading-title" id="booth-detail-modal-title">
                {language === 'vi' ? activeModalBooth.name : activeModalBooth.nameEn}
              </h3>
              <p className="modal-body-desc">
                {language === 'vi' ? activeModalBooth.description : activeModalBooth.descriptionEn}
              </p>
              <div className="modal-meta-box">
                <p><strong>{language === 'vi' ? 'Giờ mở cửa:' : 'Hours:'}</strong> {activeModalBooth.openHours || '08:00 - 22:00'}</p>
                {activeModalBooth.topSellingBook && (
                  <p>
                    <strong>{language === 'vi' ? 'Sách bán chạy nhất:' : 'Best-seller:'}</strong>{' '}
                    <span style={{ color: '#D97706', fontWeight: 700 }}>{activeModalBooth.topSellingBook.title}</span>
                    {typeof activeModalBooth.topSellingBook.soldQuantity === 'number' && activeModalBooth.topSellingBook.soldQuantity > 0
                      ? ` (${activeModalBooth.topSellingBook.soldQuantity.toLocaleString('vi-VN')} bản đã bán)`
                      : ''}
                  </p>
                )}
                <p><strong>{language === 'vi' ? 'Sách tuyển chọn:' : 'Featured:'}</strong> {activeModalBooth.featuredBooks.join(', ')}</p>
              </div>
            </div>
            <div className="modal-booth-actions">
              <button
                type="button"
                className="btn-figma-primary"
                onClick={() => {
                  const b = activeModalBooth;
                  setActiveModalBooth(null);
                  onSelectBoothOnMap(b.id);
                }}
              >
                <MapPin size={16} />
                <span>{language === 'vi' ? 'Định vị trên bản đồ tương tác' : 'Locate on Map'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
};
