import { SafeImage } from '../components/ui/SafeImage';
import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { landingContentService } from '../services/landingContentService';
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Eye,
  Tag,
  Share2,
  ChevronRight,
  X,
  Newspaper,
  ArrowRight,
  Flame,
  BookOpen
} from 'lucide-react';
import { Language } from '../types';
import { ListPagination, useListPagination } from '../components/ui/ListPagination';
import './ExperienceShell.css';
import './NewsExperience.css';

export interface NewsArticle {
  id: string;
  titleVi: string;
  titleEn: string;
  category: 'van-hoa' | 'thong-cao' | 'tac-gia' | 'nhip-song';
  categoryLabelVi: string;
  categoryLabelEn: string;
  publishedDate: string;
  readTime: string;
  views: number;
  featured?: boolean;
  imageUrl: string;
  imageCaptionVi: string;
  imageCaptionEn: string;
  summaryVi: string;
  summaryEn: string;
  contentVi: string[];
  contentEn: string[];
  author: string;
  tags: string[];
}


interface NewsExperienceProps {
  language: Language;
  open: boolean;
}

export const NewsExperience: React.FC<NewsExperienceProps> = ({ language, open }) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const [articles, setArticles] = useState<NewsArticle[]>(() => landingContentService.getNews());

  useEffect(() => {
    const handleUpdate = () => {
      setArticles(landingContentService.getNews());
    };
    handleUpdate();
    void landingContentService.refreshPublic().then(handleUpdate);
    window.addEventListener('duongsach_landing_content_changed', handleUpdate);
    return () => window.removeEventListener('duongsach_landing_content_changed', handleUpdate);
  }, []);

  // Extract article ID if path is /tin-tuc/:articleId or /tin-tuc-su-kien/:articleId
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isDetailRoute = pathParts.length >= 2 && (pathParts[0] === 'tin-tuc' || pathParts[0] === 'tin-tuc-su-kien');
  const activeArticleId = isDetailRoute ? pathParts[1] : null;

  const activeArticle = useMemo(() => {
    return activeArticleId ? articles.find(a => a.id === activeArticleId) || null : null;
  }, [activeArticleId, articles]);

  useEffect(() => {
    if (!open || !activeArticleId) return;
    void landingContentService.recordNewsRead(activeArticleId).catch((error) => {
      console.error('Không thể ghi nhận lượt đọc bài viết', error);
    });
  }, [open, activeArticleId]);

  // Lock body scroll when the sliding experience sheet is open
  useLayoutEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('news-experience-open');
    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.classList.remove('news-experience-open');
    };
  }, [open]);

  // Set document title & reset scroll on route change
  useLayoutEffect(() => {
    if (!open) return;
    const oldTitle = document.title;
    
    if (activeArticle) {
      document.title = `${vi ? activeArticle.titleVi : activeArticle.titleEn} — Đường Sách TP.HCM`;
    } else {
      document.title = vi
        ? 'Tin Tức & Dòng Chảy Tri Thức — Đường Sách TP.HCM'
        : 'News & Press Releases — HCMC Book Street';
    }

    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }

    return () => {
      document.title = oldTitle;
    };
  }, [open, vi, activeArticle]);

  const newsCategories = useMemo(() => [
    { id: 'all', labelVi: 'Tất cả tin tức', labelEn: 'All News', count: articles.length },
    { id: 'van-hoa', labelVi: 'Sự kiện & Hoạt động', labelEn: 'Events & Activities', count: articles.filter(a => a.category === 'van-hoa').length },
    { id: 'tac-gia', labelVi: 'Văn hóa đọc', labelEn: 'Reading Culture', count: articles.filter(a => a.category === 'tac-gia').length },
    { id: 'thong-cao', labelVi: 'Thông cáo báo chí', labelEn: 'Press Releases', count: articles.filter(a => a.category === 'thong-cao').length },
    { id: 'nhip-song', labelVi: 'Nhịp sống Đường Sách', labelEn: 'Book Street Life', count: articles.filter(a => a.category === 'nhip-song').length },
  ], [articles]);

  const filteredArticles = useMemo(() => {
    return articles
      .filter((item) => {
        const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
        const q = searchQuery.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
        const matchQuery =
          !q ||
          item.titleVi.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.summaryVi.toLowerCase().includes(q) ||
          item.summaryEn.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q));

        return matchCat && matchQuery;
      })
      .sort((a, b) => {
        // Đưa các bài viết có tag Tiêu Điểm lên vị trí ưu tiên ở đầu danh sách
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [searchQuery, selectedCategory, articles]);

  const pagination = useListPagination(filteredArticles, `${selectedCategory}:${searchQuery}`, 6);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return articles.filter(a => a.id !== activeArticle.id).slice(0, 4);
  }, [activeArticle, articles]);

  const handleCopyLink = (article: NewsArticle) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/tin-tuc/${article.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      ref={panelRef}
      id="news-page-panel"
      className={`news-sheet ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={vi ? 'Bản tin & Tin tức Đường Sách TP.HCM' : 'News & Press Releases'}
    >
      <main className="news-document">
        {/* =========================================================================
            CASE 1: DEDICATED FULL ARTICLE READING PAGE (/tin-tuc/:id)
            ========================================================================= */}
        {activeArticle ? (
          <div className="news-article-page-view">
            {/* Top Navigation Bar */}
            <div className="news-topbar">
              <div className="news-container news-topbar-content">
                <button
                  type="button"
                  className="news-back-btn"
                  onClick={() => navigate('/tin-tuc')}
                  title={vi ? 'Trở về danh sách Tin tức' : 'Back to News Index'}
                >
                  <ArrowLeft size={16} />
                  <span>{vi ? 'Trở về danh sách Tin tức' : 'Back to News Index'}</span>
                </button>

                <div className="news-breadcrumbs">
                  <Link to="/">{vi ? 'Trang chủ' : 'Home'}</Link>
                  <ChevronRight size={13} />
                  <Link to="/tin-tuc">{vi ? 'Tin tức' : 'News'}</Link>
                  <ChevronRight size={13} />
                  <span className="active">{vi ? activeArticle.categoryLabelVi : activeArticle.categoryLabelEn}</span>
                </div>
              </div>
            </div>

            {/* Main Article Content Container */}
            <article className="news-detail-container">
              <div className="news-detail-header">
                <div className="news-detail-meta-top">
                  <span className="news-pill-cat">{vi ? activeArticle.categoryLabelVi : activeArticle.categoryLabelEn}</span>
                  <span className="news-meta-dim"><Calendar size={13} /> {activeArticle.publishedDate}</span>
                  <span className="news-meta-dim"><Clock size={13} /> {activeArticle.readTime}</span>
                  <span className="news-meta-dim"><Eye size={13} /> {activeArticle.views.toLocaleString()} {vi ? 'lượt xem' : 'views'}</span>
                </div>

                <h1 className="news-detail-headline">
                  {vi ? activeArticle.titleVi : activeArticle.titleEn}
                </h1>

                <div className="news-detail-author-row">
                  <div className="news-detail-author-info">
                    <span className="news-detail-author-avatar">{activeArticle.author.charAt(0)}</span>
                    <div>
                      <strong>{activeArticle.author}</strong>
                      <small>{vi ? 'Ban Biên Tập • Đường Sách TP. Hồ Chí Minh' : 'Editorial Board • HCMC Book Street'}</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="news-share-button"
                    onClick={() => handleCopyLink(activeArticle)}
                  >
                    <Share2 size={14} />
                    <span>{copiedLink ? (vi ? 'Đã sao chép link!' : 'Link Copied!') : (vi ? 'Chia sẻ bài viết' : 'Share Article')}</span>
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              <figure className="news-detail-cover-wrap">
                <SafeImage src={activeArticle.imageUrl} alt={activeArticle.titleVi} className="news-detail-cover-img" />
                <figcaption className="news-detail-caption">
                  {vi ? activeArticle.imageCaptionVi : activeArticle.imageCaptionEn}
                </figcaption>
              </figure>

              {/* Lead Summary Callout */}
              <div className="news-detail-lead-callout">
                <p>{vi ? activeArticle.summaryVi : activeArticle.summaryEn}</p>
              </div>

              {/* Article Paragraphs & Inline Media */}
              <div className="news-detail-body">
                {(vi ? activeArticle.contentVi : activeArticle.contentEn).map((item, pIdx) => {
                  const imgMatch = item.match(/^!\[(.*?)\]\((.*?)\)$/);
                  if (imgMatch) {
                    const caption = imgMatch[1];
                    const url = imgMatch[2];
                    return (
                      <figure key={pIdx} className="news-inline-media-wrap">
                        <SafeImage
                          src={url}
                          alt={caption || 'Hình ảnh minh họa'}
                          className="news-inline-media-img"
                          loading="lazy"
                        />
                        {caption && <figcaption className="news-inline-media-caption">{caption}</figcaption>}
                      </figure>
                    );
                  }
                  return <p key={pIdx}>{item}</p>;
                })}
              </div>

              {/* Tags & Return Footer */}
              <div className="news-detail-footer">
                <div className="news-detail-tags">
                  <Tag size={15} color="#6E8276" />
                  <span className="tags-label">{vi ? 'Từ khóa:' : 'Tags:'}</span>
                  {activeArticle.tags.map((t, idx) => (
                    <span key={idx} className="news-tag-chip">#{t}</span>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-figma-primary"
                  onClick={() => navigate('/tin-tuc')}
                >
                  <ArrowLeft size={16} />
                  <span>{vi ? 'Xem các bài viết khác' : 'Explore more articles'}</span>
                </button>
              </div>

              {/* Related Articles Section */}
              <section className="news-related-section">
                <div className="news-related-header">
                  <h3>{vi ? 'Bài viết cùng chuyên mục & tin mới' : 'Related Stories & Latest News'}</h3>
                  <Link to="/tin-tuc" className="news-related-all-link">
                    <span>{vi ? 'Xem tất cả' : 'View all'}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="news-baomoi-grid">
                  {relatedArticles.map((rel) => (
                    <article
                      key={rel.id}
                      className="news-baomoi-card"
                      onClick={() => navigate(`/tin-tuc/${rel.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="news-baomoi-thumb-wrap">
                        <SafeImage src={rel.imageUrl} alt={rel.titleVi} className="news-baomoi-thumb-img" loading="lazy" />
                        <span className="news-baomoi-cat-pill">{vi ? rel.categoryLabelVi : rel.categoryLabelEn}</span>
                      </div>

                      <div className="news-baomoi-content">
                        <h4 className="news-baomoi-title">
                          {vi ? rel.titleVi : rel.titleEn}
                        </h4>

                        <p className="news-baomoi-snippet">
                          {vi ? rel.summaryVi : rel.summaryEn}
                        </p>

                        <div className="news-baomoi-meta-row">
                          <div className="news-baomoi-source-group">
                            <span className="news-baomoi-source-name">{rel.author}</span>
                            <span className="news-baomoi-dot dot-author">•</span>
                            <span className="news-baomoi-time news-baomoi-date">{rel.publishedDate}</span>
                          </div>
                          <span className="news-meta-dim">
                            <Eye size={12} />
                            {rel.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </article>
          </div>
        ) : (
          /* =========================================================================
              CASE 2: MAIN NEWS INDEX / FEED PAGE (/tin-tuc)
              ========================================================================= */
          <>
            {/* Top Sticky Navigation Bar */}
            <div className="news-topbar">
              <div className="news-container news-topbar-content">
                <button
                  type="button"
                  className="news-back-btn"
                  onClick={() => navigate('/')}
                  title={vi ? 'Trang chủ' : 'Back to Home'}
                >
                  <ArrowLeft size={16} />
                  <span>{vi ? 'Trang chủ' : 'Back to Home'}</span>
                </button>

                <div className="news-breadcrumbs">
                  <Link to="/">{vi ? 'Trang chủ' : 'Home'}</Link>
                  <ChevronRight size={13} />
                  <span className="active">{vi ? 'Tin tức & Dòng chảy tri thức' : 'News & Press'}</span>
                </div>
              </div>
            </div>

            {/* 1. Hero Section matching FPTU style with Left White Gradient Fade & Right Photo */}
            <section className="news-hero-fptu">
              <div className="news-hero-bg-photo" aria-hidden="true" />
              <div className="news-hero-gradient-overlay" aria-hidden="true" />

              <div className="news-hero-container">
                <div className="news-hero-brand-lockup">
                  <div className="news-hero-era">
                    <span />
                    <i>{vi ? 'BẢN TIN CHÍNH THỨC • ĐƯỜNG SÁCH TP.HCM' : 'OFFICIAL NEWS • HCMC BOOK STREET'}</i>
                    <span />
                  </div>

                  <h1 className="news-hero-title">
                    {vi ? (
                      <>
                        Dòng Chảy Tri Thức &<br />
                        <em>Nhịp Sống Đường Sách</em>
                      </>
                    ) : (
                      <>
                        The Flow of Knowledge &<br />
                        <em>Book Street Pulse</em>
                      </>
                    )}
                  </h1>

                  <p className="news-hero-lead">
                    {vi
                      ? 'Cập nhật liên tục những tin tức mới nhất về ngành xuất bản, thông cáo báo chí, sự kiện giao lưu tác giả và các hoạt động văn hóa tiêu biểu tại trung tâm TP. Hồ Chí Minh.'
                      : 'Stay informed with official publishing updates, press releases, author conversations, and cultural highlights in the heart of Ho Chi Minh City.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Main Collection Section with Search & Filter Tabs */}
            <section className="heritage-inner heritage-collection news-collection-section" id="news-collection">
              <div className="heritage-collection-title">
                <div>
                  <span className="heritage-section-marker">
                    {vi ? 'Tin tức & Hoạt động' : 'News & Activities'}
                  </span>
                  <h2>{vi ? 'Danh mục các bài viết' : 'All News & Articles'}</h2>
                </div>
                <div className="heritage-search">
                  <Search size={16} />
                  <input maxLength={200}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={vi ? 'Tìm bài viết, tác giả, chủ đề...' : 'Search articles, author, topic...'}
                    aria-label={vi ? 'Tìm kiếm bài viết' : 'Search news articles'}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#66735e' }}
                      aria-label="Xóa tìm kiếm"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="heritage-filter-row">
                <div className="heritage-filters">
                  {newsCategories.map((cat) => (
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
                <span>{vi ? `${filteredArticles.length} bài viết` : `${filteredArticles.length} articles`}</span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="heritage-empty-result">
                  <p>{vi ? 'Không tìm thấy bài viết nào phù hợp với từ khóa và bộ lọc.' : 'No articles matched your search and filters.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                  >
                    {vi ? 'Xem lại tất cả bài viết' : 'Reset search & filters'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Baomoi-style News Cards Grid - Các bài viết Tiêu Điểm sẽ to ra chiếm trọn chiều rộng */}
                  <div className="news-baomoi-grid">
                    {pagination.items.map((article) => (
                      <article
                        key={article.id}
                        id={article.id}
                        className={`news-baomoi-card ${article.featured ? 'news-baomoi-card-featured' : ''}`}
                        onClick={() => navigate(`/tin-tuc/${article.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="news-baomoi-thumb-wrap">
                          <SafeImage src={article.imageUrl} alt={article.titleVi} className="news-baomoi-thumb-img" loading="lazy" />
                          <span className="news-baomoi-cat-pill">{vi ? article.categoryLabelVi : article.categoryLabelEn}</span>
                          {article.featured && (
                            <span className="news-baomoi-featured-pill">
                              <Flame size={12} />
                              <span>{vi ? 'TIÊU ĐIỂM' : 'FEATURED'}</span>
                            </span>
                          )}
                        </div>

                        <div className="news-baomoi-content">
                          <h3 className="news-baomoi-title">
                            {vi ? article.titleVi : article.titleEn}
                          </h3>

                          <p className="news-baomoi-snippet">
                            {vi ? article.summaryVi : article.summaryEn}
                          </p>

                          <div className="news-baomoi-meta-row">
                            <div className="news-baomoi-source-group">
                              <span className="news-baomoi-source-name">{article.author}</span>
                              <span className="news-baomoi-dot dot-author">•</span>
                              <span className="news-baomoi-time news-baomoi-date">{article.publishedDate}</span>
                              <span className="news-baomoi-dot">•</span>
                              <span className="news-baomoi-time news-baomoi-read">{article.readTime}</span>
                            </div>

                            <div className="news-baomoi-right-meta">
                              {article.featured && (
                                <span className="news-featured-read-btn">
                                  <span>{vi ? 'Đọc bài viết' : 'Read Story'}</span>
                                  <ArrowRight size={14} />
                                </span>
                              )}
                              <span className="news-meta-dim">
                                <Eye size={12} />
                                {article.views.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                className="news-baomoi-share-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(article);
                                }}
                                title={vi ? 'Chia sẻ bài viết' : 'Share article'}
                              >
                                <Share2 size={13} />
                              </button>
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
          </>
        )}
      </main>
    </div>
  );
};
