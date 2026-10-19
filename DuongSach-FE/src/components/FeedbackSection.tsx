import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Star,
  CheckCircle2,
  QrCode,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronDown,
  Check,
  Store,
  Globe,
  MessageSquare,
  CalendarPlus,
  Send,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  Sparkles
} from 'lucide-react';
import { Language, Booth } from '../types';
import { publicApi } from '../services/publicApi';
import { apiClient } from '../services/apiClient';
import './FeedbackSection.css';

interface FeedbackSectionProps {
  language: Language;
  booths?: Booth[];
  onScrollToTop?: () => void;
  className?: string;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  language,
  booths: initialBooths,
  className = '',
}) => {
  // Tab Switch: 'feedback' (Góp ý trải nghiệm) or 'event_proposal' (Đề xuất sự kiện)
  const [activeTab, setActiveTab] = useState<'feedback' | 'event_proposal'>('feedback');

  // Feedback Form State
  const [targetType, setTargetType] = useState<string>('all');
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [contact, setContact] = useState('');

  // Event Proposal Form State
  const [proposalData, setProposalData] = useState({
    eventTitle: '',
    eventKind: 'talkshow',
    organizer: '',
    expectedDate: '',
    expectedTime: '',
    locationPref: 'stage_a',
    estimatedAttendees: '50-100',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booths, setBooths] = useState<Booth[]>(initialBooths || []);
  const [boothLoadError, setBoothLoadError] = useState('');

  // Searchable Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialBooths || initialBooths.length === 0) {
      publicApi.getBooths()
        .then(items => { setBooths(items); setBoothLoadError(''); })
        .catch(error => setBoothLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách gian hàng'));
    }
  }, [initialBooths]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  // Helper label resolver
  const getSelectedLabel = () => {
    if (targetType === 'all') {
      return language === 'vi' ? 'Toàn Đường Sách TP.HCM (Chung)' : 'Entire HCMC Book Street (General)';
    }
    if (targetType.startsWith('booth:')) {
      const boothId = targetType.replace('booth:', '');
      const found = booths.find(b => b.id === boothId || b.code === boothId);
      if (found) {
        return `${found.code} — ${language === 'vi' ? found.name : found.nameEn} (${language === 'vi' ? 'Gian hàng' : 'Booth'})`;
      }
    }
    return targetType;
  };

  // Filtered lists for search
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const isGeneralMatched = !normalizedQuery || 
    'toàn đường sách tp.hcm chung entire general'.toLowerCase().includes(normalizedQuery);

  const filteredBooths = booths.filter(b => {
    if (!normalizedQuery) return true;
    const nameMatch = (language === 'vi' ? b.name : b.nameEn).toLowerCase().includes(normalizedQuery);
    const codeMatch = b.code.toLowerCase().includes(normalizedQuery);
    const publisherMatch = (b.publisher || '').toLowerCase().includes(normalizedQuery);
    return nameMatch || codeMatch || publisherMatch;
  });

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;
    setIsSubmitting(true);
    try {
      await publicApi.submitFeedback({
        rating,
        comments,
        contactEmail: contact || undefined,
        targetName: getSelectedLabel(),
        source: 'web_landing',
        targetScope: targetType.startsWith('booth:') ? 'booth' : 'entire',
        boothId: targetType.startsWith('booth:') ? targetType.slice(6) : undefined,
      });
      setSubmissionState('success');
    } catch (err) {
      console.warn('Feedback API submit error', err);
      setSubmissionState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalData.eventTitle.trim() || !proposalData.description.trim()) return;
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(proposalData.contactName.trim()) || !/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/.test(proposalData.contactPhone.replace(/[\s.-]/g, '')) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proposalData.contactEmail.trim())) {
      setSubmissionState('error');
      return;
    }
    setIsSubmitting(true);
    try {
      const formattedComments = [
        `[ĐỀ XUẤT SỰ KIỆN]: ${proposalData.eventTitle}`,
        `• Loại hình: ${proposalData.eventKind}`,
        `• Người liên hệ: ${proposalData.contactName} - SĐT: ${proposalData.contactPhone}`,
        `• Nội dung & Đề xuất: ${proposalData.description}`
      ].join('\n');

      await apiClient.post('/public/event-suggestions', {
        fullName: proposalData.contactName,
        phone: proposalData.contactPhone.replace(/[\s.-]/g, ''),
        content: formattedComments,
      });
      setSubmissionState('success');
    } catch (err) {
      console.warn('Event proposal submit error', err);
      setSubmissionState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/lien-he#gop-y` : 'https://duongsach.tphcm.gov.vn/lien-he#gop-y';

  return (
    <section className={`sk05-feedback-section ${className}`.trim()} id="gop-y">
      <div className="sk05-feedback-screen-wrapper">
        <div className="figma-section-header feedback-section-header">
          <span className="figma-eyebrow">
            {language === 'vi' ? 'KẾT NỐI CỘNG ĐỒNG' : 'COMMUNITY VOICE'}
          </span>
          <h2 className="figma-section-title">
            {language === 'vi' ? (
              <>Góp ý cùng <span className="serif-italic-accent">Đường Sách</span></>
            ) : (
              <>Share your perspective with <span className="serif-italic-accent">Book Street</span></>
            )}
          </h2>
          <p className="figma-section-subtitle">
            {language === 'vi'
              ? 'Mỗi góp ý & đề xuất của bạn góp phần làm không gian văn hóa đọc thêm gần gũi, sôi động và trọn vẹn.'
              : 'Every feedback & proposal helps make our cultural reading space more engaging and welcoming.'}
          </p>

          {/* 2 NÚT LỰA CHỌN FORM: GÓP Ý TRẢI NGHIỆM | ĐỀ XUẤT SỰ KIỆN */}
          <div className="sk05-mode-switch-bar">
            <button
              type="button"
              className={`sk05-mode-pill-btn ${activeTab === 'feedback' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('feedback');
                setSubmissionState('idle');
              }}
            >
              <MessageSquare size={17} />
              <span>{language === 'vi' ? 'Góp ý trải nghiệm' : 'Experience Feedback'}</span>
            </button>

            <button
              type="button"
              className={`sk05-mode-pill-btn ${activeTab === 'event_proposal' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab('event_proposal');
                setSubmissionState('idle');
              }}
            >
              <CalendarPlus size={17} />
              <span>{language === 'vi' ? 'Đề xuất sự kiện' : 'Event Proposal'}</span>
            </button>
          </div>
        </div>

        <div className="sk05-feedback-board">
          {/* Header Bar */}
          <div className="sk05-top-header">
            <div className="sk05-header-title-wrap">
              <span className="sk05-tag-code">
                {activeTab === 'feedback' ? (language === 'vi' ? 'GÓP Ý' : 'FEEDBACK') : (language === 'vi' ? 'SỰ KIỆN' : 'EVENT')}
              </span>
              <h2 className="sk05-main-title">
                {activeTab === 'feedback'
                  ? (language === 'vi' ? 'FEEDBACK TRẢI NGHIỆM' : 'VISITOR FEEDBACK')
                  : (language === 'vi' ? 'ĐỀ XUẤT TỔ CHỨC SỰ KIỆN' : 'EVENT PROPOSAL FORM')}
              </h2>
            </div>
            <span className="sk05-header-badge">
              {language === 'vi' ? 'ĐƯỜNG SÁCH TP.HCM' : 'HCMC BOOK STREET'}
            </span>
          </div>

          {/* Body: 2-Column Table Grid */}
          <div className="sk05-board-body">
            {/* Left Column: QR Code & Info */}
            <aside className="sk05-left-col">
              <div className="sk05-qr-box">
                <div className="sk05-qr-tag">
                  {activeTab === 'feedback' ? '[QR FEEDBACK]' : '[QR SỰ KIỆN]'}
                </div>
                <h3 className="sk05-qr-heading">
                  {activeTab === 'feedback'
                    ? (language === 'vi' ? 'Dùng chung toàn Đường Sách' : 'Universal for All Street')
                    : (language === 'vi' ? 'Đăng ký sự kiện trực tuyến' : 'Online Event Proposal')}
                </h3>
                <div className="sk05-qr-visual">
                  <div className="sk05-qr-code-frame">
                    <QRCodeSVG
                      value={feedbackUrl}
                      size={140}
                      level="H"
                      includeMargin={false}
                      fgColor="#152B24"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <span className="sk05-qr-hint">
                    <QrCode size={13} />
                    <span>{language === 'vi' ? 'Quét mã QR để mở form trên di động' : 'Scan QR code to open on mobile'}</span>
                  </span>
                </div>
              </div>

              <div className="sk05-qr-info-box">
                <div className="sk05-qr-count-badge">
                  {activeTab === 'feedback' ? (language === 'vi' ? '01 QR chung' : '01 Universal QR') : (language === 'vi' ? 'Ban Sự Kiện' : 'Events Board')}
                </div>
                <p className="sk05-qr-note">
                  {activeTab === 'feedback'
                    ? (language === 'vi'
                        ? 'Không tự nhận biết di sản hay gian hàng khách vừa tham quan. Khách có thể tùy chọn gian hàng, di sản hoặc đóng góp chung toàn tuyến phố.'
                        : 'Universal QR code for the street. Visitors can search and select a specific booth, heritage site, or evaluate the promenade.')
                    : (language === 'vi'
                        ? 'Tiếp nhận hồ sơ đề xuất tọa đàm, ra mắt sách mới, workshop văn hóa và triển lãm nghệ thuật từ các tác giả, nhà xuất bản và đối tác.'
                        : 'Receiving proposals for author talkshows, book launches, cultural workshops and exhibitions from publishers and partners.')}
                </p>
              </div>
            </aside>

            {/* Right Column: Dynamic Form depending on Active Tab */}
            <main className="sk05-right-col">
              {/* TAB 1: FORM GÓP Ý TRẢI NGHIỆM */}
              {activeTab === 'feedback' && (
                <>
                  <div className="sk05-form-header-row">
                    <h3 className="sk05-form-heading">
                      {language === 'vi' ? 'GÓP Ý TRẢI NGHIỆM' : 'EXPERIENCE FEEDBACK'}
                    </h3>
                    <span className="sk05-form-subtext">
                      {language === 'vi' ? 'Lắng nghe ý kiến xây dựng không gian văn hóa' : 'Listening to your community voice'}
                    </span>
                  </div>

                  {boothLoadError && <div className="sk05-inline-error">{boothLoadError}</div>}

                  {submissionState === 'idle' && (
                    <form onSubmit={handleFeedbackSubmit} className="sk05-feedback-form">
                      {/* Row 1: Searchable Target Selector */}
                      <div className="sk05-field-row">
                        <label className="sk05-field-label" htmlFor="feedback-target-btn">
                          {language === 'vi' ? 'Phạm vi đánh giá:' : 'Evaluation scope:'}
                        </label>
                        
                        <div className="sk05-searchable-select-wrap" ref={dropdownRef}>
                          <button
                            type="button"
                            id="feedback-target-btn"
                            className={`sk05-searchable-trigger ${isDropdownOpen ? 'is-active' : ''}`}
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            aria-haspopup="listbox"
                            aria-expanded={isDropdownOpen}
                          >
                            <span className="sk05-searchable-current-text">
                              {getSelectedLabel()}
                            </span>
                            <ChevronDown 
                              size={18} 
                              className={`sk05-searchable-arrow ${isDropdownOpen ? 'rotate-180' : ''}`} 
                            />
                          </button>

                          {isDropdownOpen && (
                            <div className="sk05-searchable-dropdown-panel" role="listbox">
                              <div className="sk05-dropdown-search-box">
                                <Search size={16} className="sk05-search-icon" />
                                <input maxLength={200}
                                  ref={searchInputRef}
                                  type="text"
                                  className="sk05-dropdown-search-input"
                                  placeholder={language === 'vi' ? 'Nhập để tìm gian hàng hoặc di sản...' : 'Search booths or heritage sites...'}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {searchQuery && (
                                  <button
                                    type="button"
                                    className="sk05-search-clear-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSearchQuery('');
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>

                              <div className="sk05-dropdown-options-list">
                                {isGeneralMatched && (
                                  <div
                                    className={`sk05-dropdown-option ${targetType === 'all' ? 'is-selected' : ''}`}
                                    onClick={() => {
                                      setTargetType('all');
                                      setIsDropdownOpen(false);
                                    }}
                                  >
                                    <span className="sk05-option-icon"><Globe size={16} /></span>
                                    <span className="sk05-option-text">
                                      {language === 'vi' ? 'Toàn Đường Sách TP.HCM (Chung)' : 'Entire HCMC Book Street (General)'}
                                    </span>
                                    {targetType === 'all' && <Check size={16} className="sk05-option-check" />}
                                  </div>
                                )}

                                {filteredBooths.length > 0 && (
                                  <div className="sk05-optgroup-section">
                                    <div className="sk05-optgroup-header">
                                      <Store size={14} />
                                      <span>{language === 'vi' ? 'Gian hàng hiện có' : 'Current Bookstalls'} ({filteredBooths.length})</span>
                                    </div>
                                    {filteredBooths.map(b => {
                                      const optionVal = `booth:${b.id}`;
                                      const isSelected = targetType === optionVal;
                                      return (
                                        <div
                                          key={b.id}
                                          className={`sk05-dropdown-option ${isSelected ? 'is-selected' : ''}`}
                                          onClick={() => {
                                            setTargetType(optionVal);
                                            setIsDropdownOpen(false);
                                          }}
                                        >
                                          <span className="sk05-option-code">{b.code}</span>
                                          <span className="sk05-option-text">
                                            {language === 'vi' ? b.name : b.nameEn}
                                            {b.publisher ? <small className="sk05-option-sub"> • {b.publisher}</small> : null}
                                          </span>
                                          {isSelected && <Check size={16} className="sk05-option-check" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {!isGeneralMatched && filteredBooths.length === 0 && (
                                  <div className="sk05-dropdown-empty">
                                    {language === 'vi' ? 'Không tìm thấy gian hàng phù hợp' : 'No matching booths found'}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Hài lòng 1 2 3 4 5 */}
                      <div className="sk05-field-row">
                        <label className="sk05-field-label">
                          {language === 'vi' ? 'Hài lòng:' : 'Satisfaction:'}
                        </label>
                        <div className="emoji-experience-rating" role="radiogroup" aria-label={language === 'vi' ? 'Mức độ hài lòng' : 'Experience rating'}>
                          <div className="emoji-experience-row">
                            {[
                              { value: 1, icon: '😔', labelVi: 'Cần cải thiện', labelEn: 'Poor' },
                              { value: 2, icon: '😟', labelVi: 'Chưa hài lòng', labelEn: 'Unsatisfied' },
                              { value: 3, icon: '😐', labelVi: 'Bình thường', labelEn: 'Neutral' },
                              { value: 4, icon: '🙂', labelVi: 'Hài lòng', labelEn: 'Satisfied' },
                              { value: 5, icon: '😍', labelVi: 'Rất hài lòng', labelEn: 'Amazing' }
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                className={`emoji-experience-btn ${rating === item.value ? 'active' : ''} ${item.value <= rating ? 'is-lit' : ''}`}
                                onClick={() => setRating(item.value)}
                                role="radio"
                                aria-checked={rating === item.value}
                                aria-label={language === 'vi' ? item.labelVi : item.labelEn}
                              >
                                <span aria-hidden="true">{item.icon}</span>
                              </button>
                            ))}
                          </div>
                          <span className="emoji-experience-caption">
                            {rating === 5 && (language === 'vi' ? 'Rất hài lòng' : 'Amazing')}
                            {rating === 4 && (language === 'vi' ? 'Hài lòng' : 'Satisfied')}
                            {rating === 3 && (language === 'vi' ? 'Bình thường' : 'Neutral')}
                            {rating === 2 && (language === 'vi' ? 'Chưa hài lòng' : 'Unsatisfied')}
                            {rating === 1 && (language === 'vi' ? 'Cần cải thiện' : 'Poor')}
                          </span>
                        </div>
                        <div className="sk05-rating-options">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              className={`sk05-rating-num-btn ${rating === val ? 'active' : ''} ${rating >= val ? 'highlight' : ''}`}
                              onClick={() => setRating(val)}
                              aria-label={`Rating ${val}`}
                            >
                              <span className="num-digit">{val}</span>
                              <Star size={13} className="num-star" />
                            </button>
                          ))}
                          <span className="sk05-rating-caption">
                            {rating === 5 && (language === 'vi' ? 'Rất hài lòng ★★★★★' : 'Very satisfied ★★★★★')}
                            {rating === 4 && (language === 'vi' ? 'Hài lòng ★★★★' : 'Satisfied ★★★★')}
                            {rating === 3 && (language === 'vi' ? 'Bình thường ★★★' : 'Neutral ★★★')}
                            {rating === 2 && (language === 'vi' ? 'Chưa hài lòng ★★' : 'Unsatisfied ★★')}
                            {rating === 1 && (language === 'vi' ? 'Cần cải thiện ★' : 'Needs improvement ★')}
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Nội dung góp ý */}
                      <div className="sk05-field-row">
                        <label className="sk05-field-label" htmlFor="feedback-comment-input">
                          {language === 'vi' ? 'Nội dung góp ý:' : 'Your suggestions / perspective:'}
                        </label>
                        <textarea maxLength={10000}
                          id="feedback-comment-input"
                          required
                          rows={3}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder={
                            language === 'vi'
                              ? 'Mô tả chi tiết cảm nhận của bạn về gian hàng, di sản, thái độ phục vụ hoặc đề xuất cải thiện...'
                              : 'Describe your detailed suggestions or thoughts regarding stalls, heritage sites, or services...'
                          }
                          className="sk05-textarea-input"
                        />
                      </div>

                      {/* Row 4: Liên hệ */}
                      <div className="sk05-field-row">
                        <label className="sk05-field-label" htmlFor="feedback-contact-input">
                          {language === 'vi' ? 'Email / SĐT (tùy chọn):' : 'Email / Phone (optional):'}
                        </label>
                        <input maxLength={254}
                          id="feedback-contact-input"
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder={language === 'vi' ? 'Để Ban Quản Lý có thể phản hồi cho bạn' : 'For management follow-up'}
                          className="sk05-text-input"
                        />
                      </div>

                      {/* Row 5: Action submit */}
                      <div className="sk05-action-row">
                        <button
                          type="submit"
                          disabled={isSubmitting || !comments.trim()}
                          className="sk05-submit-btn"
                        >
                          {isSubmitting ? (
                            <span>{language === 'vi' ? 'Đang gửi ý kiến...' : 'Submitting...'}</span>
                          ) : (
                            <span>{language === 'vi' ? 'Gửi góp ý' : 'Submit Feedback'}</span>
                          )}
                        </button>
                        <span className="sk05-status-hint">
                          {language === 'vi'
                            ? 'Ý kiến sẽ được chuyển trực tiếp tới Ban Quản Lý Đường Sách'
                            : 'Feedback is directly forwarded to Book Street Management'}
                        </span>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* TAB 2: FORM ĐỀ XUẤT SỰ KIỆN */}
              {activeTab === 'event_proposal' && (
                <>
                  <div className="sk05-form-header-row">
                    <h3 className="sk05-form-heading">
                      {language === 'vi' ? 'ĐỀ XUẤT TỔ CHỨC SỰ KIỆN' : 'PROPOSE A CULTURAL EVENT'}
                    </h3>
                  </div>

                  {submissionState === 'idle' && (
                    <form onSubmit={handleProposalSubmit} className="sk05-feedback-form">
                      {/* Row 1: Tên sự kiện & Loại hình */}
                      <div className="sk05-form-grid-2">
                        <div className="sk05-field-row">
                          <label className="sk05-field-label">
                            {language === 'vi' ? 'Tên sự kiện / Tọa đàm *' : 'Event Title *'}
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            maxLength={160}
                            className="sk05-text-input"
                            placeholder={language === 'vi' ? 'Ví dụ: Tọa đàm Ra mắt sách Mùa Thu 2026' : 'e.g., Autumn Book Launch 2026'}
                            value={proposalData.eventTitle}
                            onChange={(e) => setProposalData({ ...proposalData, eventTitle: e.target.value })}
                          />
                        </div>

                        <div className="sk05-field-row">
                          <label className="sk05-field-label">
                            {language === 'vi' ? 'Loại hình hoạt động *' : 'Activity Type *'}
                          </label>
                          <select
                            className="sk05-select-input"
                            value={proposalData.eventKind}
                            onChange={(e) => setProposalData({ ...proposalData, eventKind: e.target.value })}
                          >
                            <option value="talkshow">{language === 'vi' ? 'Tọa đàm & Giao lưu tác giả' : 'Author Talkshow & Panel'}</option>
                            <option value="book_launch">{language === 'vi' ? 'Lễ ra mắt tác phẩm mới' : 'New Book Launch'}</option>
                            <option value="workshop">{language === 'vi' ? 'Workshop kỹ năng & Trải nghiệm' : 'Skill Workshop'}</option>
                            <option value="exhibition">{language === 'vi' ? 'Triển lãm & Sách quý' : 'Exhibition & Rare Books'}</option>
                            <option value="kids_event">{language === 'vi' ? 'Ngày hội thiếu nhi & Gia đình' : 'Kids & Family Fair'}</option>
                            <option value="other">{language === 'vi' ? 'Hoạt động văn hóa khác' : 'Other Cultural Activity'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Mô tả nội dung & Đề xuất hỗ trợ */}
                      <div className="sk05-field-row">
                        <label className="sk05-field-label">
                          {language === 'vi' ? 'Mô tả nội dung & Thiết bị cần hỗ trợ *' : 'Event Description & Technical Needs *'}
                        </label>
                        <textarea maxLength={8000}
                          required
                          rows={3}
                          className="sk05-textarea-input"
                          placeholder={
                            language === 'vi'
                              ? 'Tóm tắt mục đích sự kiện, danh sách diễn giả / tác giả, và các yêu cầu kỹ thuật (âm thanh, màn hình LED, bàn ghế, standee)...'
                              : 'Summarize the event purpose, guest speakers, and technical requirements (sound system, LED screen, seating)...'
                          }
                          value={proposalData.description}
                          onChange={(e) => setProposalData({ ...proposalData, description: e.target.value })}
                        />
                      </div>

                      {/* Row 5: Thông tin người liên hệ */}
                      <div className="sk05-form-grid-3">
                        <div className="sk05-field-row">
                          <label className="sk05-field-label">
                            {language === 'vi' ? 'Họ tên người đại diện *' : 'Contact Person *'}
                          </label>
                          <input maxLength={160}
                            type="text"
                            required
                            className="sk05-text-input"
                            placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                            value={proposalData.contactName}
                            onChange={(e) => setProposalData({ ...proposalData, contactName: e.target.value })}
                          />
                        </div>

                        <div className="sk05-field-row">
                          <label className="sk05-field-label">
                            {language === 'vi' ? 'Số điện thoại *' : 'Phone Number *'}
                          </label>
                          <input maxLength={40}
                            type="tel"
                            required
                            inputMode="tel"
                            className="sk05-text-input"
                            placeholder="0901 234 567"
                            value={proposalData.contactPhone}
                            onChange={(e) => setProposalData({ ...proposalData, contactPhone: e.target.value })}
                          />
                        </div>

                        <div className="sk05-field-row">
                          <label className="sk05-field-label">
                            {language === 'vi' ? 'Email tiếp nhận *' : 'Email Address *'}
                          </label>
                          <input
                            type="email"
                            required
                            maxLength={254}
                            className="sk05-text-input"
                            placeholder="contact@domain.com"
                            value={proposalData.contactEmail}
                            onChange={(e) => setProposalData({ ...proposalData, contactEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="sk05-action-row">
                        <button
                          type="submit"
                          disabled={isSubmitting || !proposalData.eventTitle.trim() || !proposalData.description.trim()}
                          className="sk05-submit-btn event-btn"
                        >
                          <Send size={15} />
                          {isSubmitting ? (
                            <span>{language === 'vi' ? 'Đang gửi hồ sơ đề xuất...' : 'Submitting Proposal...'}</span>
                          ) : (
                            <span>{language === 'vi' ? 'Gửi đề xuất sự kiện' : 'Submit Event Proposal'}</span>
                          )}
                        </button>
                        <span className="sk05-status-hint">
                          {language === 'vi'
                            ? 'Ban Sự Kiện Đường Sách sẽ thẩm định và phản hồi trong 24 — 48h'
                            : 'The Events Board will review and respond within 24 — 48 hours'}
                        </span>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Success Result State */}
              {submissionState === 'success' && (
                <div className="sk05-result-state sk05-result-success">
                  <div className="sk05-result-icon">
                    <CheckCircle2 size={44} color="#17362E" />
                  </div>
                  <div className="sk05-result-content">
                    <h4 className="sk05-result-title">
                      {activeTab === 'feedback'
                        ? (language === 'vi' ? 'Cảm ơn bạn đã đóng góp ý kiến!' : 'Thank you for your valuable feedback!')
                        : (language === 'vi' ? 'Gửi đề xuất sự kiện thành công!' : 'Event Proposal Submitted Successfully!')}
                    </h4>
                    <p className="sk05-result-desc">
                      {activeTab === 'feedback'
                        ? (language === 'vi'
                            ? 'Ý kiến của bạn đã được ghi nhận vào hệ thống quản lý Đường Sách TP.HCM nhằm nâng cao chất lượng dịch vụ và không gian văn hóa.'
                            : 'Your insights have been recorded by HCMC Book Street Administration to continuously refine cultural and service standards.')
                        : (language === 'vi'
                            ? 'Hồ sơ đề xuất sự kiện của bạn đã được chuyển đến Ban Sự Kiện Đường Sách TP.HCM. Chuyên viên phụ trách sẽ liên hệ thẩm định và sắp xếp lịch trong vòng 24 — 48 giờ.'
                            : 'Your event proposal has been forwarded to the Events Board. A coordinator will review and contact you within 24 — 48 hours.')}
                    </p>
                    <button
                      type="button"
                      className="sk05-btn-reset"
                      onClick={() => {
                        setSubmissionState('idle');
                        setComments('');
                        setProposalData({
                          eventTitle: '',
                          eventKind: 'talkshow',
                          organizer: '',
                          expectedDate: '',
                          expectedTime: '',
                          locationPref: 'stage_a',
                          estimatedAttendees: '50-100',
                          description: '',
                          contactName: '',
                          contactPhone: '',
                          contactEmail: ''
                        });
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>
                        {activeTab === 'feedback'
                          ? (language === 'vi' ? 'Gửi thêm góp ý khác' : 'Submit Another Feedback')
                          : (language === 'vi' ? 'Gửi thêm đề xuất sự kiện khác' : 'Submit Another Proposal')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Result State */}
              {submissionState === 'error' && (
                <div className="sk05-result-state sk05-result-error">
                  <div className="sk05-result-icon">
                    <AlertCircle size={44} color="#C84C32" />
                  </div>
                  <div className="sk05-result-content">
                    <h4 className="sk05-result-title error-title">
                      {language === 'vi' ? 'Báo lỗi — Vui lòng thử lại' : 'Submission Failed — Please Retry'}
                    </h4>
                    <p className="sk05-result-desc">
                      {language === 'vi'
                        ? 'Kết nối mạng tạm thời gián đoạn hoặc máy chủ phản hồi chậm. Vui lòng kiểm tra lại đường truyền và gửi lại.'
                        : 'Network issue or temporary server delay. Please check your connection and try again.'}
                    </p>
                    <div className="sk05-error-actions">
                      <button
                        type="button"
                        className="sk05-submit-btn sk05-btn-retry"
                        onClick={() => {
                          setSubmissionState('idle');
                        }}
                      >
                        <RefreshCw size={14} />
                        <span>{language === 'vi' ? 'Thử lại ngay' : 'Retry Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </section>
  );
};
