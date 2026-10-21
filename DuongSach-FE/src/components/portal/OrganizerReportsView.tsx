import React, { useEffect, useState } from 'react';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { 
  Star, 
  Users, 
  Store, 
  CalendarCheck, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  BarChart3, 
  PieChart, 
  ChevronRight,
  FileSpreadsheet,
  User 
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerEvent } from '../../types/organizer';
import { organizerApi } from '../../services/organizerApi';
import './OrganizerPortal.css';

interface OrganizerReportsViewProps {
  language: Language;
  events: OrganizerEvent[];
  selectedEventId: string;
  onSelectEventId: (id: string) => void;
}

interface OrganizerReport {
  eventId: string;
  eventName: string;
  totalParticipants: number;
  attended: number;
  pending: number;
  cancelled: number;
  totalBooths: number;
  totalActivities: number;
  attendanceRate: number;
  averageRating: number;
  ratingCount: number;
  activityStats: Array<{ name: string; count: number }>;
  ratingDistribution: Array<{ stars: number; count: number }>;
  feedbacks: Array<{ id: string; rating: number; comment: string | null; authorName: string | null; activityName: string | null; createdAt: string; source: 'event' | 'activity' }>;
}

export const OrganizerReportsView: React.FC<OrganizerReportsViewProps> = ({ 
  language, 
  events, 
  selectedEventId, 
  onSelectEventId 
}) => {
  const vi = language === 'vi';
  const effectiveEventId = selectedEventId || events[0]?.id || '';
  const [report, setReport] = useState<OrganizerReport | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pagination = useListPagination(report?.feedbacks || [], effectiveEventId);

  useEffect(() => {
    setError('');
    if (!effectiveEventId) {
      setReport(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    organizerApi.getReport(effectiveEventId)
      .then(data => {
        if (data) setReport(data);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Không tải được báo cáo');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [effectiveEventId]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Sự kiện', report.eventName],
      ['Tổng lượt đăng ký', report.totalParticipants],
      ['Đã tham gia', report.attended],
      ['Chưa tham gia', report.pending],
      ['Đã hủy', report.cancelled],
      ['Gian hàng', report.totalBooths],
      ['Hoạt động', report.totalActivities],
      ['Tỷ lệ tham dự', Number(report.attendanceRate || 0).toFixed(2) + '%'],
      ['Đánh giá trung bình', Number(report.averageRating || 0).toFixed(1)],
      [],
      ['Hoạt động', 'Lượt đăng ký'],
      ...report.activityStats.map(item => [item.name, item.count]),
      [],
      ['Sao', 'Số lượng đánh giá'],
      ...report.ratingDistribution.map(item => [`${item.stars} sao`, item.count]),
      [],
      ['Thời gian', 'Người đánh giá', 'Điểm', 'Phạm vi', 'Ý kiến'],
      ...(report.feedbacks || []).map(item => [new Date(item.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), item.authorName || 'Ẩn danh', item.rating, item.activityName || 'Toàn sự kiện', item.comment || '']),
    ];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bao-cao-${report.eventId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Tính toán các tỷ lệ phục vụ vẽ biểu đồ thanh (progress bars)
  const totalRegistrations = report?.totalParticipants || 1;
  const attendedRate = report ? Math.round((report.attended / totalRegistrations) * 100) : 0;
  const pendingRate = report ? Math.round((report.pending / totalRegistrations) * 100) : 0;
  const cancelledRate = report ? Math.round((report.cancelled / totalRegistrations) * 100) : 0;

  // Tìm max count của activity để normalize thanh progress
  const maxActivityCount = report?.activityStats?.length 
    ? Math.max(...report.activityStats.map(a => a.count), 1) 
    : 1;

  // Tính tổng số lượt đánh giá
  const totalRatings = report?.ratingCount || 1;

  return (
    <div className="organizer-content org-reports-page">
      {/* Header bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1.25rem', 
        flexWrap: 'wrap', 
        marginBottom: '1.75rem' 
      }}>
        <div>
          <h1 className="organizer-view-title" style={{ margin: '0 0 0.35rem 0' }}>
            {vi ? 'Báo cáo sự kiện' : 'Event Reports & Analytics'}
          </h1>
          <p className="organizer-view-sub" style={{ margin: 0 }}>
            {vi 
              ? 'Số liệu được tổng hợp trực tiếp từ đăng ký, điểm danh và đánh giá trải nghiệm.' 
              : 'Live aggregated data from participant check-ins, registrations and feedback.'}
          </p>
        </div>

        {/* Controls: Chọn sự kiện & Xuất CSV */}
        <div className="org-reports-controls">
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedEventId} 
              onChange={event => onSelectEventId(event.target.value)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 10,
                padding: '9px 36px 9px 14px',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#182924',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                outline: 'none',
                maxWidth: 360,
                textOverflow: 'ellipsis'
              }}
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }}>
              <ChevronRight size={15} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>

          <button 
            type="button" 
            className="btn-org-secondary" 
            onClick={exportCsv} 
            disabled={!report || isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 600,
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              color: '#182924',
              cursor: report ? 'pointer' : 'not-allowed',
              opacity: report ? 1 : 0.6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <FileSpreadsheet size={16} color="#059669" />
            <span>{vi ? 'Xuất CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 10,
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#B91C1C',
          marginBottom: '1.5rem',
          fontSize: '0.88rem'
        }}>
          {error}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
          {vi ? 'Đang tổng hợp dữ liệu báo cáo...' : 'Aggregating event analytics...'}
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* ========================================================= */}
          {/* TOP 4 KEY METRIC CARDS */}
          {/* ========================================================= */}
          <div className="org-reports-kpi-grid">
            {/* Card 1: Tổng lượt đăng ký */}
            <div className="org-reports-card org-reports-kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
                  {vi ? 'Tổng lượt đăng ký' : 'Total Registrations'}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(24, 41, 36, 0.08)', display: 'grid', placeItems: 'center', color: '#182924', flexShrink: 0 }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="org-reports-kpi-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
                {report.totalParticipants.toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.65rem', fontSize: '0.78rem', color: '#16A34A', fontWeight: 600 }}>
                <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vi ? `${report.attended} đã tham gia` : `${report.attended} checked in`}
                </span>
              </div>
            </div>

            {/* Card 2: Gian hàng */}
            <div className="org-reports-card org-reports-kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
                  {vi ? 'Gian hàng' : 'Active Bookstalls'}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(233, 188, 99, 0.15)', display: 'grid', placeItems: 'center', color: '#B48A3C', flexShrink: 0 }}>
                  <Store size={18} />
                </div>
              </div>
              <div className="org-reports-kpi-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
                {report.totalBooths}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.65rem', fontSize: '0.78rem', color: '#64748B' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B48A3C', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vi ? 'Gian hàng đang mở' : 'Operational units'}
                </span>
              </div>
            </div>

            {/* Card 3: Hoạt động */}
            <div className="org-reports-card org-reports-kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
                  {vi ? 'Hoạt động sự kiện' : 'Activities & Workshops'}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(2, 132, 199, 0.12)', display: 'grid', placeItems: 'center', color: '#0284C7', flexShrink: 0 }}>
                  <CalendarCheck size={18} />
                </div>
              </div>
              <div className="org-reports-kpi-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
                {report.totalActivities}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.65rem', fontSize: '0.78rem', color: '#0284C7', fontWeight: 600 }}>
                <TrendingUp size={13} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vi ? `${Number(report.attendanceRate || 0).toFixed(1)}% tham dự` : `${Number(report.attendanceRate || 0).toFixed(1)}% rate`}
                </span>
              </div>
            </div>

            {/* Card 4: Đánh giá trung bình */}
            <div className="org-reports-card org-reports-kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>
                  {vi ? 'Đánh giá TB' : 'Avg Rating'}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245, 158, 11, 0.14)', display: 'grid', placeItems: 'center', color: '#D97706', flexShrink: 0 }}>
                  <Star size={18} fill="#D97706" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="org-reports-kpi-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-serif)', lineHeight: 1.1 }}>
                  {report.averageRating ? Number(report.averageRating).toFixed(1) : '—'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.65rem', fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>
                <Star size={12} fill="#D97706" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vi ? `${report.ratingCount.toLocaleString()} đánh giá` : `${report.ratingCount.toLocaleString()} reviews`}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DETAILED 3 COLUMNS ANALYTICS SECTIONS */}
          {/* ========================================================= */}
          <div className="org-reports-charts-grid">
            {/* 1. Trạng thái tham gia */}
            <div className="org-reports-card org-reports-chart-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(24, 41, 36, 0.08)', display: 'grid', placeItems: 'center', color: '#182924', flexShrink: 0 }}>
                  <PieChart size={15} />
                </div>
                <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vi ? 'Trạng thái tham gia' : 'Attendance Breakdown'}
                </h2>
              </div>

              {/* Visual Stacked Progress Bar */}
              <div style={{ 
                height: 10, 
                borderRadius: 99, 
                background: '#F1F5F9', 
                overflow: 'hidden', 
                display: 'flex', 
                marginBottom: '1.25rem',
                width: '100%'
              }}>
                <div style={{ width: `${attendedRate}%`, background: '#16A34A', transition: 'width 0.5s ease' }} title={`Đã tham gia: ${attendedRate}%`} />
                <div style={{ width: `${pendingRate}%`, background: '#F59E0B', transition: 'width 0.5s ease' }} title={`Chưa tham gia: ${pendingRate}%`} />
                <div style={{ width: `${cancelledRate}%`, background: '#EF4444', transition: 'width 0.5s ease' }} title={`Đã hủy: ${cancelledRate}%`} />
              </div>

              {/* Status List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center', width: '100%', minWidth: 0 }}>
                {/* Item 1: Đã tham gia */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#15803D' }}>
                        {vi ? 'Đã tham gia' : 'Attended'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#65A30D' }}>
                        {attendedRate}% {vi ? 'tổng đăng ký' : 'of total'}
                      </div>
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: '#166534', fontWeight: 700 }}>
                    {report.attended.toLocaleString()}
                  </strong>
                </div>

                {/* Item 2: Chưa tham gia */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FFFBEB',
                  border: '1px solid #FEF3C7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Clock size={16} color="#D97706" />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#B45309' }}>
                        {vi ? 'Chưa tham gia' : 'Pending Check-in'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#D97706' }}>
                        {pendingRate}% {vi ? 'chờ điểm danh' : 'waiting'}
                      </div>
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: '#92400E', fontWeight: 700 }}>
                    {report.pending.toLocaleString()}
                  </strong>
                </div>

                {/* Item 3: Đã hủy */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <XCircle size={16} color="#DC2626" />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#B91C1C' }}>
                        {vi ? 'Đã hủy' : 'Cancelled'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#EF4444' }}>
                        {cancelledRate}% {vi ? 'hủy tham dự' : 'cancelled'}
                      </div>
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.15rem', color: '#991B1B', fontWeight: 700 }}>
                    {report.cancelled.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Lượt đăng ký theo hoạt động */}
            <div className="org-reports-card org-reports-chart-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(2, 132, 199, 0.1)', display: 'grid', placeItems: 'center', color: '#0284C7', flexShrink: 0 }}>
                    <BarChart3 size={15} />
                  </div>
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vi ? 'Đăng ký theo hoạt động' : 'Registrations by Activity'}
                  </h2>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, flexShrink: 0 }}>
                  {report.activityStats.length} {vi ? 'hoạt động' : 'activities'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1, width: '100%', minWidth: 0 }}>
                {report.activityStats.map((item, idx) => {
                  const percent = Math.round((item.count / maxActivityCount) * 100);
                  const isTop = idx === 0;
                  return (
                    <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <span style={{ 
                            width: 18, 
                            height: 18, 
                            borderRadius: '50%', 
                            background: isTop ? '#E9BC63' : '#F1F5F9', 
                            color: isTop ? '#182924' : '#64748B',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ 
                            fontSize: '0.82rem', 
                            fontWeight: 600, 
                            color: '#1E293B',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <strong style={{ fontSize: '0.86rem', color: '#182924', fontWeight: 700, flexShrink: 0, marginLeft: 6 }}>
                          {item.count.toLocaleString()}
                        </strong>
                      </div>

                      {/* Visual Bar */}
                      <div style={{ height: 6, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden', width: '100%' }}>
                        <div 
                          style={{ 
                            width: `${percent}%`, 
                            height: '100%', 
                            borderRadius: 99,
                            background: isTop 
                              ? 'linear-gradient(90deg, #E9BC63 0%, #B48A3C 100%)' 
                              : 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
                            transition: 'width 0.5s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}

                {report.activityStats.length === 0 && (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                    {vi ? 'Chưa có dữ liệu hoạt động.' : 'No activity data available.'}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Phân bố đánh giá */}
            <div className="org-reports-card org-reports-chart-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245, 158, 11, 0.12)', display: 'grid', placeItems: 'center', color: '#D97706', flexShrink: 0 }}>
                    <Star size={15} fill="#D97706" />
                  </div>
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vi ? 'Phân bố đánh giá' : 'Rating Distribution'}
                  </h2>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, flexShrink: 0 }}>
                  {report.ratingCount} {vi ? 'đánh giá' : 'reviews'}
                </span>
              </div>

              {/* Star Rating Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, justifyContent: 'center', width: '100%', minWidth: 0 }}>
                {report.ratingDistribution.map(item => {
                  const percent = Math.round((item.count / totalRatings) * 100);
                  const isFive = item.stars === 5;
                  return (
                    <div key={item.stars} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
                      {/* Star label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 42, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                          {item.stars}
                        </span>
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                      </div>

                      {/* Bar */}
                      <div style={{ flex: 1, minWidth: 0, height: 8, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percent}%`, 
                            height: '100%', 
                            borderRadius: 99,
                            background: isFive ? '#F59E0B' : '#FCD34D',
                            transition: 'width 0.5s ease'
                          }} 
                        />
                      </div>

                      {/* Count & Percent */}
                      <div style={{ minWidth: 54, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                          {item.count}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 3 }}>
                          ({percent}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <section className="org-reports-card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: '#111827' }}>{vi ? 'Ý kiến đánh giá của người dùng' : 'User review comments'}</h2>
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>{report.ratingCount} {vi ? 'đánh giá' : 'reviews'}</span>
            </div>
            {(report.feedbacks || []).length ? (
              <div className="review-feedback-list">
                {pagination.items.map(item => {
                  const initial = item.authorName ? item.authorName.trim().charAt(0).toUpperCase() : null;
                  const dateObj = new Date(item.createdAt);
                  const dateStr = dateObj.toLocaleDateString(vi ? 'vi-VN' : 'en-GB', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  const timeStr = dateObj.toLocaleTimeString(vi ? 'vi-VN' : 'en-GB', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <article key={`${item.source}-${item.id}`} className="review-feedback-card">
                      <div className="review-card-header">
                        <div className="review-author-group">
                          <div className="review-avatar" aria-hidden="true">
                            {initial || <User size={16} />}
                          </div>
                          <div className="review-author-info">
                            <div className="review-author-name-row">
                              <strong className="review-author-name">
                                {item.authorName || (vi ? 'Người dùng ẩn danh' : 'Anonymous user')}
                              </strong>
                              <span className="review-scope-pill">
                                {item.activityName || (vi ? 'Đánh giá sự kiện' : 'Event review')}
                              </span>
                            </div>
                            <span className="review-date-text">{timeStr} · {dateStr}</span>
                          </div>
                        </div>

                        <div className="review-stars-group" aria-label={`${item.rating}/5`}>
                          {[1, 2, 3, 4, 5].map(starNum => (
                            <Star
                              key={starNum}
                              size={14}
                              className={starNum <= item.rating ? 'review-star filled' : 'review-star empty'}
                            />
                          ))}
                        </div>
                      </div>

                      {item.comment ? (
                        <p className="review-comment-text">{item.comment}</p>
                      ) : (
                        <p className="review-comment-empty">
                          {vi ? '(Không để lại nhận xét viết tay)' : '(No written comment)'}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : <p style={{ margin: 0, color: '#64748B' }}>{vi ? 'Chưa có đánh giá thực tế cho sự kiện này.' : 'No reviews for this event yet.'}</p>}
            <ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi={vi} />
          </section>
        </>
      )}
    </div>
  );
};

