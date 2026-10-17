import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X, BookOpen, Store, ArrowRight } from 'lucide-react';
import { Booth, Language } from '../types';
import './Hero.css';

interface HeroProps {
  language: Language;
  onExploreClick: () => void;
  onMapClick: () => void;
  onSearch?: (query: string) => void;
  booths?: Booth[];
}

export const Hero: React.FC<HeroProps> = ({ 
  language, 
  onExploreClick, 
  onMapClick,
  onSearch,
  booths = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const quickTags = useMemo(() => {
    // Ưu tiên hiển thị tên nhà xuất bản / gian hàng ngắn gọn, sạch sẽ, không trùng lặp
    const rawList = booths.map(b => b.publisher || (language === 'vi' ? b.name : b.nameEn)).filter(Boolean);
    const unique = Array.from(new Set(rawList.map(item => item.trim())));
    // Lấy tối đa 4 tag tiêu biểu để hàng gợi ý gọn gàng, vừa vặn trên mọi kích thước màn hình
    return unique.slice(0, 4).map(value => ({ label: value, query: value }));
  }, [booths, language]);

  // Gợi ý thông minh tức thì theo từ khóa nhập vào
  const suggestions = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q || q.length < 1) return [];

    const results: Array<{
      type: 'booth' | 'book';
      id: string;
      title: string;
      subtitle: string;
      code?: string;
    }> = [];

    // Tìm kiếm ki-ốt / gian hàng
    booths.forEach((b) => {
      const matchName = b.name.toLowerCase().includes(q) || b.nameEn.toLowerCase().includes(q);
      const matchPub = b.publisher.toLowerCase().includes(q);
      if (matchName || matchPub) {
        results.push({
          type: 'booth',
          id: b.id,
          title: language === 'vi' ? b.name : b.nameEn,
          subtitle: `${b.code} • ${language === 'vi' ? b.categoryLabelVi : b.categoryLabelEn}`,
          code: b.code,
        });
      }

      // Tìm kiếm sách nổi bật
      b.featuredBooks.forEach((book) => {
        if (book.toLowerCase().includes(q)) {
          results.push({
            type: 'book',
            id: `${b.id}-${book}`,
            title: book,
            subtitle: `${language === 'vi' ? 'Có tại' : 'Available at'}: ${b.publisher} (${b.code})`,
            code: b.code,
          });
        }
      });
    });

    return results.slice(0, 6);
  }, [searchTerm, language, booths]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchTerm.trim()) {
      setIsDropdownOpen(false);
      onSearch(searchTerm.trim());
    } else if (onSearch) {
      onSearch('');
      setIsDropdownOpen(false);
      const el = document.getElementById('gian-hang');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSuggestion = (queryText: string) => {
    setSearchTerm(queryText);
    setIsDropdownOpen(false);
    if (onSearch) {
      onSearch(queryText);
    }
  };

  const handleQuickTagClick = (tagQuery: string) => {
    setSearchTerm(tagQuery);
    setIsDropdownOpen(false);
    if (onSearch) {
      onSearch(tagQuery);
    }
  };

  return (
    <section id="hero" className="figma-hero-section">
      {/* Background Graphic with dark forest overlay */}
      <div className="figma-hero-bg" aria-hidden="true">
        <div className="figma-hero-overlay"></div>
      </div>

      <div className="container figma-hero-content">
        {/* H1 Main Title from Figma */}
        <h1 className="figma-hero-h1 hero-motion-reveal hero-delay-1">
          {language === 'vi' ? (
            <>
              Chào mừng đến với <br />
              <span className="hero-street-name">Đường Sách</span>{' '}
              <span className="hero-city-name">TP.HCM</span>
            </>
          ) : (
            <>
              Welcome to <br />
              <span className="serif-italic-accent">HCMC Book Street</span>
            </>
          )}
        </h1>

        {/* Subtitle from Figma */}
        <p className="figma-hero-desc hero-motion-reveal hero-delay-3">
          {language === 'vi'
            ? 'Nơi tri thức gặp gỡ đời sống — khám phá gian hàng và sự kiện ngay trên màn hình của bạn. Trải nghiệm không gian phố sách chân thực mọi lúc, mọi nơi.'
            : 'Where knowledge meets urban life — discover publisher pavilions, events right from your screen. Experience the book street anytime, anywhere.'}
        </p>


        {/* Ô Tìm Kiếm Gian Hàng, Sách, Sự Kiện Nổi Bật Tại Hero */}
        <div className="hero-search-wrapper hero-motion-reveal hero-delay-4" ref={searchContainerRef}>
          <form className="hero-search-form" onSubmit={handleSearchSubmit}>
            <div className="hero-search-icon-box">
              <Search size={20} className="hero-search-icon" />
            </div>

            <input 
              type="text"
              className="hero-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={
                language === 'vi' 
                  ? 'Tìm gian hàng, sự kiện...' 
                  : 'Search booths, events...'
              }
              aria-label="Tìm kiếm gian hàng và sách"
            />

            {searchTerm && (
              <button 
                type="button" 
                className="hero-search-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchTerm('');
                  setIsDropdownOpen(false);
                  if (onSearch) onSearch('');
                }}
                aria-label={language === 'vi' ? 'Xóa nội dung tìm kiếm' : 'Clear search'}
              >
                <X size={16} />
              </button>
            )}

            <button type="submit" className="hero-search-submit-btn" aria-label={language === 'vi' ? 'Tìm kiếm' : 'Search'}>
              <span className="hero-search-btn-text">{language === 'vi' ? 'Tìm kiếm' : 'Search'}</span>
              <ArrowRight size={15} className="hero-search-btn-arrow" />
            </button>
          </form>

          {/* Quick Filter Tags / Gợi ý phổ biến */}
          <div className="hero-quick-tags">
            <div className="quick-tags-list">
              <span className="quick-tags-label">
                {language === 'vi' ? 'Gợi ý:' : 'Trending:'}
              </span>
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-tag-chip"
                  onClick={() => handleQuickTagClick(tag.query)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Suggestions Dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="hero-suggestions-dropdown">
              <div className="dropdown-header">
                {language === 'vi' ? 'Kết quả gợi ý tức thì' : 'Instant Suggestions'}
              </div>
              <div className="dropdown-items-list">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="dropdown-item"
                    onClick={() => handleSelectSuggestion(item.title)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dropdown-item-icon">
                      {item.type === 'booth' ? <Store size={18} /> : <BookOpen size={18} />}
                    </div>
                    <div className="dropdown-item-info">
                      <div className="dropdown-item-title">{item.title}</div>
                      <div className="dropdown-item-sub">{item.subtitle}</div>
                    </div>
                    {item.code && (
                      <span className="dropdown-item-badge">{item.code}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Buttons from Figma: Primary Red & Outline Translucent */}
        <div className="figma-hero-actions hero-motion-reveal hero-delay-5">
          <button 
            type="button" 
            className="btn-figma-primary"
            onClick={onExploreClick}
          >
            <span>{language === 'vi' ? 'Khám phá đường sách' : 'Explore Book Street'}</span>
          </button>
          <button 
            type="button" 
            className="btn-figma-outline"
            onClick={onMapClick}
          >
            <MapPin size={18} />
            <span>{language === 'vi' ? 'Xem bản đồ' : 'View Street Map'}</span>
          </button>
        </div>


        {/* Scroll indicator */}
        <div className="hero-scroll-cue hero-motion-reveal hero-delay-6" onClick={onExploreClick} role="button" tabIndex={0}>
          <ChevronDown size={22} className="scroll-arrow-anim" />
        </div>
      </div>
    </section>
  );
};
