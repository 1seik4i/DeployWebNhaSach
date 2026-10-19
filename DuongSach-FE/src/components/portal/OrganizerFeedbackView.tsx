import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useEffect, useMemo, useState } from 'react';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { 
  CheckCircle2, 
  Clock, 
  Mail, 
  MessageSquare, 
  Search, 
  Star, 
  User, 
  Building, 
  Phone, 
  X, 
  AlertCircle,
  Send,
  SlidersHorizontal,
  ThumbsUp,
  Inbox
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerFeedback, OrganizerFeedbackStatus, organizerApi } from '../../services/organizerApi';

const STATUS_OPTIONS: Array<{ value: OrganizerFeedbackStatus | 'all'; labelVi: string; labelEn: string; color: string; bg: string }> = [
  { value: 'all', labelVi: 'Tất cả', labelEn: 'All', color: '#374151', bg: '#F3F4F6' },
  { value: 'new', labelVi: 'Mới tiếp nhận', labelEn: 'New', color: '#B45309', bg: '#FEF3C7' },
  { value: 'in_progress', labelVi: 'Đang xử lý', labelEn: 'In Progress', color: '#1D4ED8', bg: '#DBEAFE' },
  { value: 'responded', labelVi: 'Đã phản hồi', labelEn: 'Responded', color: '#065F46', bg: '#D1FAE5' },
  { value: 'closed', labelVi: 'Đã đóng', labelEn: 'Closed', color: '#6B7280', bg: '#F3F4F6' },
];

const getStatusBadge = (status: OrganizerFeedbackStatus, vi: boolean) => {
  switch (status) {
    case 'new':
      return { label: vi ? 'Mới tiếp nhận' : 'New', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    case 'in_progress':
      return { label: vi ? 'Đang xử lý' : 'In Progress', color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' };
    case 'responded':
      return { label: vi ? 'Đã phản hồi' : 'Responded', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' };
    case 'closed':
      return { label: vi ? 'Đã đóng' : 'Closed', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
    default:
      return { label: status, color: '#374151', bg: '#F3F4F6', border: '#E5E7EB' };
  }
};

const targetLabel = (feedback: OrganizerFeedback) =>
  feedback.targetName || feedback.booth?.name || 'Đường Sách TP.HCM';

const sourceLabel = (feedback: OrganizerFeedback, vi: boolean) => {
  const isProposal = feedback.source === 'web_event_proposal' || feedback.comments?.includes('Phân loại: Đề xuất sự kiện');
  return isProposal ? (vi ? 'Đề xuất sự kiện' : 'Event Proposal') : (vi ? 'Góp ý độc giả' : 'Reader Feedback');
};

export const OrganizerFeedbackView: React.FC<{ language: Language }> = ({ language }) => {
  const isVi = language === 'vi';
  const [feedbacks, setFeedbacks] = useState<OrganizerFeedback[]>([]);
  const [filter, setFilter] = useState<OrganizerFeedbackStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrganizerFeedback | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<OrganizerFeedbackStatus>('new');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useModalBehavior(Boolean(selected), () => closeFeedbackModal(), saving);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await organizerApi.getFeedbacks();
      setFeedbacks(data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVi ? 'Không tải được góp ý.' : 'Could not load feedback.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
    const refresh = () => { void loadFeedbacks(); };
    window.addEventListener('duongsach:public-submission', refresh);
    return () => window.removeEventListener('duongsach:public-submission', refresh);
  }, []);

  // Filtered feedbacks
  const visibleFeedbacks = useMemo(() => feedbacks.filter(feedback => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    const matchesFilter = filter === 'all' || feedback.status === filter;
    const matchesKeyword = !keyword || [
      feedback.subject,
      targetLabel(feedback),
      feedback.comments,
      feedback.contactEmail,
      feedback.fullName,
      feedback.organization
    ].filter(Boolean).some(value => String(value).toLocaleLowerCase('vi-VN').includes(keyword));
    return matchesFilter && matchesKeyword;
  }), [feedbacks, filter, search]);
  const pagination = useListPagination(visibleFeedbacks, `${filter}:${search}`);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const newCount = feedbacks.filter(f => f.status === 'new').length;
    const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length;
    const respondedCount = feedbacks.filter(f => f.status === 'responded').length;
    const avgRating = total > 0 
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / total).toFixed(1)
      : '5.0';
    return { total, newCount, inProgressCount, respondedCount, avgRating };
  }, [feedbacks]);

  const openFeedback = (feedback: OrganizerFeedback) => {
    setSelected(feedback);
    setNote(feedback.internalNote || '');
    setStatus(feedback.status);
    setError('');
  };

  const closeFeedbackModal = () => {
    setSelected(null);
    setError('');
  };

  const saveFeedback = async () => {
    if (!selected) return;
    if (status === 'responded' && !note.trim()) {
      setError(isVi ? 'Vui lòng nhập nội dung phản hồi trước khi chuyển sang "Đã phản hồi".' : 'Please provide a response before marking as responded.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await organizerApi.updateFeedback(selected.id, { status, internalNote: note.trim() || undefined });
      setFeedbacks(items => items.map(item => item.id === updated.id ? { ...item, ...updated } : item));
      setSelected(null);
      setSuccessToast(isVi ? 'Đã lưu phản hồi & cập nhật trạng thái thành công!' : 'Feedback updated successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVi ? 'Không thể cập nhật góp ý.' : 'Could not update feedback.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="organizer-content" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1.5rem', 
        flexWrap: 'wrap', 
        marginBottom: '1.5rem' 
      }}>
        <div>
          <div className="feedback-center-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#E6F4EA', borderRadius: '20px', color: '#105B48', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
            <MessageSquare size={13} />
            <span>{isVi ? 'Trung tâm tiếp nhận & Phản hồi' : 'Feedback & Inquiry Center'}</span>
          </div>
          <h1 className="organizer-view-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#172421', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            {isVi ? 'Góp ý & Đề xuất Sự kiện' : 'Feedback & Event Proposals'}
          </h1>
          <p className="organizer-view-sub" style={{ margin: 0, color: '#5C7069', fontSize: '0.92rem', lineHeight: 1.5 }}>
            {isVi 
              ? 'Tiếp nhận, xử lý và phản hồi ý kiến đóng góp từ bạn đọc & đề xuất phối hợp tổ chức sự kiện từ các đối tác.' 
              : 'Review, process, and respond to reader feedback and partner event proposals.'}
          </p>
        </div>
      </div>

      {/* KPI / Metric Cards Grid */}
      <div className="feedback-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Total */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2EAE5',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#637771', fontSize: '0.82rem', fontWeight: 600 }}>
              {isVi ? 'Tổng số tiếp nhận' : 'Total Submissions'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#17382E', lineHeight: 1.1, display: 'block' }}>
              {stats.total}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#637771', marginTop: '0.35rem', display: 'inline-block' }}>
              {isVi ? 'Gồm góp ý & đề xuất' : 'Feedback & proposals'}
            </span>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #FEF3C7',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#92400E', fontSize: '0.82rem', fontWeight: 600 }}>
              {isVi ? 'Chờ tiếp nhận & Xử lý' : 'Pending Review'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
              <Clock size={18} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B45309', lineHeight: 1.1, display: 'block' }}>
              {stats.newCount}
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                color: stats.newCount > 0 ? '#B45309' : '#059669', 
                background: stats.newCount > 0 ? '#FEF3C7' : '#DCFCE7', 
                padding: '2px 8px', 
                borderRadius: '6px' 
              }}>
                {stats.newCount > 0 
                  ? (isVi ? 'Cần phản hồi sớm' : 'Action needed') 
                  : (isVi ? 'Đã xử lý hết' : 'Up to date')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Responded */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D1FAE5',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#065F46', fontSize: '0.82rem', fontWeight: 600 }}>
              {isVi ? 'Đã gửi phản hồi' : 'Resolved & Sent'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#065F46', lineHeight: 1.1, display: 'block' }}>
              {stats.respondedCount}
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: '6px' }}>
                {isVi ? `Tỉ lệ giải quyết: ${stats.total > 0 ? Math.round((stats.respondedCount / stats.total) * 100) : 0}%` : `Rate: ${stats.total > 0 ? Math.round((stats.respondedCount / stats.total) * 100) : 0}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Satisfaction */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #FEF08A',
          borderRadius: '16px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 2px 8px rgba(202, 138, 4, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#854D0E', fontSize: '0.82rem', fontWeight: 600 }}>
              {isVi ? 'Mức độ hài lòng' : 'Satisfaction Score'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF9C3', border: '1px solid #FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CA8A04' }}>
              <Star size={18} fill="#CA8A04" />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#854D0E', lineHeight: 1.1 }}>
                {stats.avgRating}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#A16207' }}>/ 5.0</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.35rem' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={11} fill={s <= Math.round(Number(stats.avgRating) || 0) ? '#EAB308' : '#E5E7EB'} color={s <= Math.round(Number(stats.avgRating) || 0) ? '#EAB308' : '#D1D5DB'} />
              ))}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#854D0E', marginLeft: '4px' }}>
                {isVi ? 'Bạn đọc hài lòng' : 'Reader approval'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1.25rem',
          color: '#065F46',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. Filter Toolbar & Search */}
      {/* 2. Filter Toolbar & Search */}
      <div className="feedback-filter-card">
        {/* Status Tabs */}
        <div className="feedback-status-tabs-wrap">
          <div className="feedback-status-tabs">
            {STATUS_OPTIONS.map(option => {
              const isActive = filter === option.value;
              const count = option.value === 'all' 
                ? feedbacks.length 
                : feedbacks.filter(f => f.status === option.value).length;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`feedback-status-tab-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => setFilter(option.value)}
                >
                  <span>{isVi ? option.labelVi : option.labelEn}</span>
                  <span className="feedback-status-tab-badge">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="organizer-search-box feedback-search-box">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isVi ? 'Tìm nội dung, người gửi...' : 'Search feedback, sender...'}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7280' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Feedbacks List Container */}
      {loading ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2EAE5', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#637771' }}>
          <p>{isVi ? 'Đang tải danh sách góp ý...' : 'Loading feedback...'}</p>
        </div>
      ) : visibleFeedbacks.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2EAE5', borderRadius: '14px', padding: '3.5rem 1.5rem', textAlign: 'center', color: '#637771' }}>
          <Inbox size={40} style={{ opacity: 0.35, marginBottom: '0.75rem', color: '#17382E' }} />
          <h3 style={{ margin: '0 0 0.35rem', color: '#172421', fontSize: '1.05rem', fontWeight: 700 }}>
            {isVi ? 'Không tìm thấy góp ý phù hợp' : 'No feedback found'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {isVi ? 'Hãy thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.' : 'Try changing your status filter or search keyword.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {pagination.items.map(feedback => {
            const badge = getStatusBadge(feedback.status, isVi);
            const isProposal = sourceLabel(feedback, isVi) === (isVi ? 'Đề xuất sự kiện' : 'Event Proposal');
            const hasResponse = feedback.internalNote && feedback.internalNote.trim().length > 0;

            return (
              <article
                key={feedback.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2EAE5',
                  borderLeft: `4px solid ${feedback.status === 'new' ? '#D97706' : feedback.status === 'responded' ? '#059669' : '#2563EB'}`,
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 2px 6px rgba(23, 36, 33, 0.02)',
                  transition: 'all 160ms ease'
                }}
              >
                {/* Header Row: Subject, Badges, Star Rating & Action Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 750, color: '#172421' }}>
                        {feedback.subject || targetLabel(feedback)}
                      </h3>

                      {/* Source Badge */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: isProposal ? '#EEF2FF' : '#F0F7F4',
                        color: isProposal ? '#4338CA' : '#17382E',
                        border: isProposal ? '1px solid #C7D2FE' : '1px solid #D6E8DF'
                      }}>
                        {sourceLabel(feedback, isVi)}
                      </span>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= (feedback.rating || 5) ? '#F59E0B' : 'none'}
                          color={star <= (feedback.rating || 5) ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginLeft: '4px' }}>
                        ({feedback.rating || 5}/5)
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="btn-org-secondary"
                    style={{
                      padding: '0.45rem 0.95rem',
                      fontSize: '0.82rem',
                      fontWeight: 650,
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onClick={() => openFeedback(feedback)}
                  >
                    <MessageSquare size={14} />
                    <span>{feedback.status === 'responded' ? (isVi ? 'Xem & Sửa phản hồi' : 'View / Edit') : (isVi ? 'Xử lý góp ý' : 'Process')}</span>
                  </button>
                </div>

                {/* Reader Comments Quote Block */}
                <div style={{
                  background: '#F9FBFA',
                  border: '1px solid #EAEFEA',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '0.85rem',
                  color: '#2C3E3A',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}>
                  "{feedback.comments || (isVi ? 'Không có nội dung chi tiết.' : 'No detailed message.')}"
                </div>

                {/* Previous Internal Response / Note Preview (if exists) */}
                {hasResponse && (
                  <div style={{
                    background: '#F0F9F5',
                    border: '1px solid #D1EADE',
                    borderRadius: '8px',
                    padding: '0.65rem 0.9rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.84rem',
                    color: '#065F46'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.78rem', color: '#17382E' }}>
                      ✓ {isVi ? 'Nội dung đã phản hồi / giải quyết:' : 'Response content:'}
                    </strong>
                    {feedback.internalNote}
                  </div>
                )}

                {/* Footer: Author Info & Timestamp */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #F3F4F6',
                  fontSize: '0.8rem',
                  color: '#6B7280'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#374151', fontWeight: 600 }}>
                      <User size={13} color="#6B7280" />
                      {feedback.fullName || (isVi ? 'Ẩn danh' : 'Anonymous')}
                    </span>

                    {feedback.contactEmail && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} />
                        {feedback.contactEmail}
                      </span>
                    )}

                    {feedback.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} />
                        {feedback.phone}
                      </span>
                    )}

                    {feedback.organization && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Building size={13} />
                        {feedback.organization}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#9CA3AF' }}>
                    <Clock size={13} />
                    <span>{new Date(feedback.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && <ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi={isVi} />}

      {/* 4. MODAL: Phản hồi & Xử lý Góp ý (Centered Backdrop Modal) */}
      {selected && (
        <div className="org-modal-backdrop" onClick={closeFeedbackModal}>
          <div className="org-modal-box" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="org-modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#172421', margin: '0 0 2px' }}>
                  {sourceLabel(selected, isVi) === (isVi ? 'Đề xuất sự kiện' : 'Event Proposal') 
                    ? (isVi ? 'Xử lý Đề xuất Sự kiện' : 'Process Event Proposal') 
                    : (isVi ? 'Phản hồi Góp ý Độc giả' : 'Respond to Feedback')}
                </h3>
                <small style={{ color: '#637771', fontSize: '0.84rem' }}>
                  {selected.subject || targetLabel(selected)}
                </small>
              </div>
              <button
                type="button"
                onClick={closeFeedbackModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="org-modal-body" style={{ padding: '1.5rem' }}>
              {error && (
                <div style={{
                  padding: '0.65rem 1rem',
                  color: '#991B1B',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.84rem'
                }}>
                  {error}
                </div>
              )}

              {/* Reader Feedback Context Box */}
              <div style={{
                background: '#F8FAF9',
                border: '1px solid #E2EAE5',
                borderRadius: '10px',
                padding: '1rem 1.15rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#637771', textTransform: 'uppercase' }}>
                    {isVi ? 'Nội dung gửi đến' : 'Submitted content'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={12}
                        fill={star <= (selected.rating || 5) ? '#F59E0B' : 'none'}
                        color={star <= (selected.rating || 5) ? '#F59E0B' : '#D1D5DB'}
                      />
                    ))}
                  </div>
                </div>

                <p style={{ margin: '0 0 0.65rem', color: '#172421', fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {selected.comments || (isVi ? 'Không có nội dung chi tiết.' : 'No details.')}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#637771', borderTop: '1px solid #EAEFEA', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#172421' }}>{selected.fullName || (isVi ? 'Ẩn danh' : 'Anonymous')}</span>
                  {selected.contactEmail && <span>• {selected.contactEmail}</span>}
                  {selected.phone && <span>• {selected.phone}</span>}
                  {selected.organization && <span>• {selected.organization}</span>}
                </div>
              </div>

              {/* Status Select */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', color: '#172421', marginBottom: '0.45rem' }}>
                  {isVi ? 'Trạng thái xử lý' : 'Processing Status'}
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as OrganizerFeedbackStatus)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1.5px solid #D1DCD7',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#172421',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="new">{isVi ? 'Mới tiếp nhận' : 'New'}</option>
                  <option value="in_progress">{isVi ? 'Đang xử lý' : 'In Progress'}</option>
                  <option value="responded">{isVi ? 'Đã phản hồi người gửi' : 'Responded'}</option>
                  <option value="closed">{isVi ? 'Đã đóng / Lưu trữ' : 'Closed / Archived'}</option>
                </select>
              </div>

              {/* Response Textarea */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.86rem', color: '#172421', marginBottom: '0.45rem' }}>
                  {isVi ? 'Nội dung phản hồi hoặc ghi chú giải quyết' : 'Response Message or Resolution Note'}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder={isVi 
                    ? 'Nhập nội dung phản hồi gửi đến người liên hệ hoặc ghi chú giải quyết nội bộ...' 
                    : 'Enter feedback response or internal resolution notes...'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem 0.95rem',
                    border: '1.5px solid #D1DCD7',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    color: '#172421',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
                <small style={{ color: '#637771', fontSize: '0.76rem', display: 'block', marginTop: '4px' }}>
                  {isVi 
                    ? 'Nội dung này sẽ được ghi nhận vào lịch sử xử lý và hiển thị cho quản trị viên.' 
                    : 'This response will be recorded into the feedback history.'}
                </small>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="org-modal-footer">
              <button
                type="button"
                className="btn-org-secondary"
                onClick={closeFeedbackModal}
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem', fontWeight: 600 }}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn-org-primary"
                disabled={saving}
                onClick={() => void saveFeedback()}
                style={{
                  padding: '0.55rem 1.35rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{saving ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu xử lý' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
