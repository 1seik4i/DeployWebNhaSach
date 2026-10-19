import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  ArrowUp,
  Search, 
  MapPin, 
  Clock, 
  BookOpen, 
  X, 
  Sparkles,
  Store
} from 'lucide-react';
import { Booth, Language } from '../types';
import { ListPagination, useListPagination } from '../components/ui/ListPagination';
import './ExperienceShell.css';
import './BoothsExperience.css';

interface BoothsExperienceProps {
  language: Language;
  open: boolean;
  booths: Booth[];
  onSelectBoothOnMap?: (boothId: string) => void;
}

export const BoothsExperience: React.FC<BoothsExperienceProps> = ({
  language,
  open,
  booths,
  onSelectBoothOnMap,
}) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeModalBooth, setActiveModalBooth] = useState<Booth | null>(null);

  useModalBehavior(Boolean(activeModalBooth), () => setActiveModalBooth(null));

  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const categories = [
    { id: 'all', labelVi: 'Tất cả gian hàng', labelEn: 'All Stalls', count: booths.length },
    { id: 'literature', labelVi: 'Văn học & Nghệ thuật', labelEn: 'Literature & Arts', count: booths.filter(b => b.category === 'literature').length },
    { id: 'children', labelVi: 'Thiếu nhi & Tranh truyện', labelEn: 'Children & Comics', count: booths.filter(b => b.category === 'children').length },
    { id: 'history', labelVi: 'Lịch sử & Kỹ năng sống', labelEn: 'History & Mindset', count: booths.filter(b => b.category === 'history').length },
    { id: 'cafe', labelVi: 'Cà phê & Quà lưu niệm', labelEn: 'Cafe & Souvenirs', count: booths.filter(b => b.category === 'cafe').length },
  ];

  const featuredBooth = booths[0];

  const filteredBooths = useMemo(() => {
    return booths.filter((booth) => {
      const matchCat = selectedCategory === 'all' || booth.category === selectedCategory;
      const q = searchQuery.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
      const matchSearch =
        !q ||
        booth.name.toLowerCase().includes(q) ||
        booth.nameEn.toLowerCase().includes(q) ||
        booth.publisher.toLowerCase().includes(q) ||
        booth.description.toLowerCase().includes(q) ||
        booth.featuredBooks.some((b) => b.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [booths, searchQuery, selectedCategory]);

  const pagination = useListPagination(filteredBooths, `${selectedCategory}:${searchQuery}`, 9);

  const handleClose = () => {
    navigate('/');
  };

  const handleLocateOnMap = (boothId: string) => {
    navigate('/#ban-do');
    if (onSelectBoothOnMap) {
      onSelectBoothOnMap(boothId);
    }
  };

  return (
    <div
      ref={panelRef}
      id="booths-page-panel"
      className={`heritage-sheet booths-experience-sheet ${open ? 'is-open' : ''}`}
      inert={!open}
      aria-hidden={!open || undefined}
    >
      <main className="heritage-document">
        {/* Editorial Collection Hero */}
        <section className="heritage-collection-hero">
          <div className="heritage-inner heritage-hero-grid">
            <div className="heritage-introduction">
              <button
                type="button"
                className="exp-btn-return-frameless"
                onClick={handleClose}
                aria-label={vi ? 'Trở về trang chủ Đường Sách' : 'Return to Book Street home'}
              >
                <ArrowLeft size={16} />
                <span>{vi ? 'Trở về trang chủ' : 'Back to Home'}</span>
              </button>

              <span className="heritage-kicker">
                <span />
                {vi ? 'Gian hàng & Nhà xuất bản' : 'Bookstalls & Publishers Directory'}
              </span>
              <h1 tabIndex={-1}>
                {vi ? (
                  <>
                    Dạo bước phố sách.
                    <br />
                    Tìm tri thức vàng.
                  </>
                ) : (
                  <>
                    Stroll the book street.
                    <br />
                    Discover knowledge.
                  </>
                )}
              </h1>
              <p>
                {vi
                  ? 'Hơn 20 nhà xuất bản danh tiếng, ki-ốt sách văn học cổ điển, tranh truyện thiếu nhi và không gian cà phê dưới tán me rợp bóng.'
                  : 'Over 20 prestigious publishers, classic literature corners, children reading pavilions, and quiet coffee stalls under tamarind shade.'}
              </p>

              <div className="heritage-hero-footnote">
                <strong>{booths.length}</strong>
                <span>{vi ? 'gian hàng tuyển chọn' : 'featured kiosks'}</span>
                <i />
                <Store size={17} />
                <span>{vi ? 'Mở cửa 08:00 — 22:00' : 'Daily 08:00 — 22:00'}</span>
              </div>
            </div>

            {/* Featured Showcase Card on the right */}
            {featuredBooth && (
              <div
                className="heritage-featured"
                onClick={() => setActiveModalBooth(featuredBooth)}
                role="button"
                tabIndex={0}
                aria-label={`Khám phá ${featuredBooth.name}`}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={featuredBooth.image.url || '/duong_sach_logo.png'}
                  onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/duong_sach_logo.png'; }}
                  alt={featuredBooth.image.alt}
                  fetchPriority="high"
                />
                <span className="heritage-image-ribbon">{featuredBooth.code}</span>
                <div>
                  <span>{vi ? 'Gian hàng tiêu biểu' : 'Featured Pavilion'}</span>
                  <h2>{vi ? featuredBooth.name : featuredBooth.nameEn}</h2>
                  <span>{vi ? featuredBooth.tagline : featuredBooth.taglineEn}</span>
                </div>
                <ArrowRight className="heritage-featured-arrow" size={24} />
              </div>
            )}
          </div>
        </section>

        {/* Collection Section */}
        <section className="heritage-inner heritage-collection" id="booths-collection">
          <div className="heritage-collection-title">
            <div>
              <span className="heritage-section-marker">
                {vi ? 'Khám phá không gian đọc' : 'Explore the pavilions'}
              </span>
              <h2>{vi ? 'Danh mục các gian hàng' : 'All Bookstalls & Publishers'}</h2>
            </div>
            <div className="heritage-search">
              <Search size={16} />
              <input maxLength={200}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={vi ? 'Tìm tên gian hàng, sách, NXB...' : 'Search stall, books, publisher...'}
                aria-label={vi ? 'Tìm kiếm gian hàng' : 'Search bookstalls'}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#66735e' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="heritage-filter-row">
            <div className="heritage-filters">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {vi ? cat.labelVi : cat.labelEn} ({cat.count})
                </button>
              ))}
            </div>
            <span>{vi ? `${filteredBooths.length} gian hàng` : `${filteredBooths.length} pavilions`}</span>
          </div>

          {filteredBooths.length === 0 ? (
            <div className="heritage-empty-result">
              <p>{vi ? 'Không tìm thấy gian hàng phù hợp với từ khóa.' : 'No kiosks matched your query.'}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                {vi ? 'Xem lại tất cả gian hàng' : 'Reset search & filters'}
              </button>
            </div>
          ) : (
            <>
              <div className="heritage-collection-grid">
                {pagination.items.map((booth) => (
                  <article
                    key={booth.id}
                    className="heritage-collection-card booth-card-enhanced"
                    onClick={() => setActiveModalBooth(booth)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveModalBooth(booth);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="heritage-card-image">
                      {booth.image.url && (
                        <img 
                          src={booth.image.url || '/duong_sach_logo.png'}
                          onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/duong_sach_logo.png'; }}
                          alt={booth.image.alt} 
                          loading="lazy" 
                        />
                      )}
                      <div className="heritage-card-img-gradient" />
                      <span className="heritage-card-code">{booth.code}</span>
                      <span className="heritage-card-period">
                        <Clock size={12} />
                        <span>{booth.openHours}</span>
                      </span>
                    </div>

                    <div className="heritage-card-body">
                      <span className="heritage-card-cat-badge">
                        <BookOpen size={11} />
                        <span>{vi ? booth.categoryLabelVi : booth.categoryLabelEn}</span>
                      </span>

                      <h3>{vi ? booth.name : booth.nameEn}</h3>
                      <p>{vi ? booth.tagline : booth.taglineEn}</p>

                      <div className="booth-card-action-bar">
                        <span className="heritage-card-arrow-text">
                          {vi ? 'Xem thêm' : 'View more'}
                        </span>
                        <div className="booth-card-arrow-circle">
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <ListPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onChange={pagination.setPage}
                vi={vi}
              />
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="heritage-sheet-footer">
          <span>
            ĐƯỜNG SÁCH <span> / </span>
            {vi ? 'Danh mục gian hàng' : 'Bookstalls Directory'}
          </span>
        </footer>

        {/* Detail Modal — rendered via Portal to escape fixed-panel stacking context */}
        {activeModalBooth && createPortal(
          <div className="modal-overlay booths-detail-modal-overlay" onClick={() => setActiveModalBooth(null)} role="dialog" aria-modal="true">
            <div className="modal-content booths-detail-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setActiveModalBooth(null)} aria-label="Đóng">
                <X size={20} />
              </button>
              <div className="booth-detail-scroll-body">
              <div className="modal-booth-header-img">
                <img src={activeModalBooth.image.url || '/duong_sach_logo.png'} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/duong_sach_logo.png'; }} alt={activeModalBooth.image.alt} className="modal-top-img" />
                <div className="modal-img-caption">
                  <span className="kiosk-number-badge">{activeModalBooth.code}</span>
                </div>
              </div>
              <h3 className="modal-heading-title">
                {vi ? activeModalBooth.name : activeModalBooth.nameEn}
              </h3>
              <p className="modal-body-desc">
                {vi ? activeModalBooth.description : activeModalBooth.descriptionEn}
              </p>
              <div className="modal-meta-box">
                <p>🏛️ <strong>{vi ? 'Đơn vị phát hành:' : 'Publisher:'}</strong> {activeModalBooth.publisher}</p>
                <p>⏰ <strong>{vi ? 'Giờ mở cửa:' : 'Hours:'}</strong> {activeModalBooth.openHours}</p>
                <p>📖 <strong>{vi ? 'Sách tuyển chọn:' : 'Featured:'}</strong> {activeModalBooth.featuredBooks.join(', ')}</p>
              </div>
              </div>
              <div className="modal-booth-actions">
                <button
                  type="button"
                  className="btn-figma-primary"
                  onClick={() => {
                    const bId = activeModalBooth.id;
                    setActiveModalBooth(null);
                    handleLocateOnMap(bId);
                  }}
                >
                  <MapPin size={16} />
                  <span>{vi ? 'Định vị' : 'Locate'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </main>
    </div>
  );
};
