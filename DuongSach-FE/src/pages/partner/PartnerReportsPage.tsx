import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Layers, 
  Percent, 
  Star, 
  Download, 
  Calendar, 
  ChevronDown 
} from 'lucide-react';
import { Language, PartnerReportStats } from '../../types';
import './PartnerPages.css';

interface PartnerReportsPageProps {
  language: Language;
  reportStats: PartnerReportStats;
}

export const PartnerReportsPage: React.FC<PartnerReportsPageProps> = ({
  language,
  reportStats,
}) => {
  const [selectedEvent, setSelectedEvent] = useState(reportStats.eventId);
  const exportReport = () => {
    const rows = [['Sự kiện', reportStats.eventName], ['Tổng lượt tham gia', reportStats.totalParticipants], ['Hoạt động', reportStats.totalActivities], ['Tỷ lệ tham dự', `${Number(reportStats.attendanceRate || 0).toFixed(2)}%`], ['Đánh giá trung bình', Number(reportStats.averageRating || 0).toFixed(1)], [], ['Hoạt động', 'Lượt tham gia'], ...reportStats.activityStats.map(item => [item.name, item.count]), [], ['Thời gian', 'Người đánh giá', 'Điểm', 'Phạm vi', 'Ý kiến'], ...(reportStats.feedbacks || []).map(item => [new Date(item.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), item.authorName || 'Ẩn danh', item.rating, item.activityName || 'Toàn sự kiện', item.comment || ''])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bao-cao-doi-tac-${reportStats.eventId || 'su-kien'}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="partner-reports-page">
      {/* 1. Header matching Sketch Screen 7 */}
      <div className="partner-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="partner-page-title">
            {language === 'vi' ? 'Báo cáo & Thống kê' : 'Reports & Analytics'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Báo cáo số liệu lượt tham gia, tương tác độc giả và hiệu quả hoạt động.' 
              : 'Post-event performance, attendance metrics and reader feedback.'}
          </p>
        </div>

        {/* Event Filter Dropdown matching Sketch Screen 7 */}
        <div className="partner-reports-actions">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: '1px solid #D5DFDC',
              fontSize: '0.86rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              color: '#172421',
              cursor: 'pointer'
            }}
          >
            <option value={reportStats.eventId}>{reportStats.eventName || (language === 'vi' ? 'Sự kiện hiện tại' : 'Current event')}</option>
          </select>

          <button
            type="button"
            className="btn-part-secondary"
            onClick={exportReport}
          >
            <Download size={15} />
            <span>{language === 'vi' ? 'Xuất báo cáo' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards matching Sketch Screen 7 */}
      <div className="partner-summary-grid">
        {/* Card 1: Total participants */}
        <div className="partner-stat-card">
          <div className="stat-num-box">
            {reportStats.totalParticipants}
          </div>
          <div className="stat-label-muted">
            {language === 'vi' ? 'Tổng lượt tham gia' : 'Total Participants'}
          </div>
        </div>

        {/* Card 2: Total activities */}
        <div className="partner-stat-card">
          <div className="stat-num-box gold">
            {reportStats.totalActivities}
          </div>
          <div className="stat-label-muted">
            {language === 'vi' ? 'Hoạt động tổ chức' : 'Total Activities'}
          </div>
        </div>

        {/* Card 3: Attendance rate */}
        <div className="partner-stat-card">
          <div className="stat-num-box green">
            {Number(reportStats.attendanceRate || 0).toFixed(2)}%
          </div>
          <div className="stat-label-muted">
            {language === 'vi' ? 'Tỷ lệ tham dự' : 'Attendance Rate'}
          </div>
        </div>

        {/* Card 4: Average rating */}
        <div className="partner-stat-card">
          <div className="stat-num-box gold">
            <Star size={24} fill="#B3862A" color="#B3862A" />
            <span>{Number(reportStats.averageRating || 0).toFixed(1)}</span>
          </div>
          <div className="stat-label-muted">
            {language === 'vi' ? 'Đánh giá trung bình' : 'Average Rating'}
          </div>
        </div>
      </div>

      {/* 3. Charts Grid matching Sketch Screen 7 */}
      <div className="partner-charts-grid">
        {/* Chart 1: Participation by Activity (Horizontal bar chart) */}
        <div className="partner-chart-card">
          <h3 className="chart-card-title">
            {language === 'vi' ? 'Lượt tham gia theo hoạt động' : 'Participation by Activity'}
          </h3>

          <div style={{ marginTop: '1.25rem' }}>
            {(() => {
              const highestCount = Math.max(0, ...reportStats.activityStats.map(stat => stat.count));
              const maxScale = highestCount > 200 ? Math.ceil(highestCount / 50) * 50 : 200;

              return (
                <>
                  {reportStats.activityStats.map((item, idx) => {
                    const rawPct = (item.count / maxScale) * 100;
                    const widthPct = item.count > 0 ? Math.max(1.5, Math.min(100, Number(rawPct.toFixed(1)))) : 0;

                    return (
                      <div key={idx} className="horizontal-bar-item">
                        <div className="bar-meta">
                          <span>{item.name}</span>
                          <strong>{item.count} {language === 'vi' ? 'lượt' : 'attendants'}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${widthPct}%` }}
                            title={`${item.count} / ${maxScale} (${rawPct.toFixed(1)}%)`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#8C9F9A', marginTop: '1.5rem', borderTop: '1px solid #EEF2F0', paddingTop: '0.65rem' }}>
                    <span>0</span>
                    <span>{Math.round(maxScale * 0.25)}</span>
                    <span>{Math.round(maxScale * 0.5)}</span>
                    <span>{Math.round(maxScale * 0.75)}</span>
                    <span>{maxScale}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Chart 2: Activity Ratings Breakdown matching Sketch Screen 7 */}
        <div className="partner-chart-card">
          <h3 className="chart-card-title">
            {language === 'vi' ? 'Đánh giá hoạt động' : 'Activity Ratings'}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {/* Visual SVG Donut Indicator dynamically calculated */}
            {(() => {
              const ratingColors = ['#10B981', '#E9BC63', '#60A5FA', '#F87171', '#9CA3AF'];
              const avg = Number(reportStats.averageRating || 0);
              const totalRatingCount = reportStats.ratingDistribution.reduce((acc, curr) => acc + (curr.count || 0), 0);
              const hasRatings = totalRatingCount > 0 || avg > 0;

              let accumulatedOffset = 0;
              const segments = reportStats.ratingDistribution.map((item, idx) => {
                const pct = Number(item.percent || 0);
                const offset = accumulatedOffset;
                accumulatedOffset += pct;
                return {
                  pct,
                  offset,
                  color: ratingColors[idx % ratingColors.length]
                };
              });

              return (
                <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5ECE8" strokeWidth="3.8" />
                    {hasRatings ? (
                      segments.map((seg, sIdx) => seg.pct > 0 && (
                        <circle
                          key={sIdx}
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="3.8"
                          strokeDasharray={`${seg.pct}, 100`}
                          strokeDashoffset={seg.offset === 0 ? '0' : `-${seg.offset}`}
                          strokeLinecap={segments.filter(s => s.pct > 0).length === 1 ? 'round' : 'butt'}
                        />
                      ))
                    ) : (
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#D1D5DB"
                        strokeWidth="3.8"
                        strokeDasharray="100, 100"
                        strokeDashoffset="0"
                        strokeOpacity="0.5"
                      />
                    )}
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#172421'
                  }}>
                    {hasRatings ? avg.toFixed(1) : '0.0'}
                    <span style={{ fontSize: '0.65rem', color: '#637771', fontWeight: 600 }}>/ 5.0</span>
                  </div>
                </div>
              );
            })()}

            {/* Breakdown List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(() => {
                const ratingColors = ['#10B981', '#E9BC63', '#60A5FA', '#F87171', '#9CA3AF'];
                const dist = reportStats.ratingDistribution && reportStats.ratingDistribution.length > 0
                  ? reportStats.ratingDistribution
                  : [
                      { stars: '5', percent: 0, count: 0 },
                      { stars: '4', percent: 0, count: 0 },
                      { stars: '3', percent: 0, count: 0 },
                      { stars: '2', percent: 0, count: 0 },
                      { stars: '1', percent: 0, count: 0 },
                    ];

                return dist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#495D57', fontWeight: 600 }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: ratingColors[idx % ratingColors.length]
                      }}></span>
                      {item.stars}
                    </span>
                    <strong style={{ color: '#172421' }}>
                      {typeof item.percent === 'number' ? Math.round(item.percent) : item.percent}%
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#889893', fontWeight: 500, marginLeft: '4px' }}>
                          ({item.count})
                        </span>
                      )}
                    </strong>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      <section className="partner-chart-card" style={{ marginTop: '1.25rem' }}>
        <h3 className="chart-card-title">{language === 'vi' ? 'Ý kiến đánh giá của người dùng' : 'User review comments'}</h3>
        <p style={{ margin: '0.35rem 0 1rem', color: '#637771', fontSize: '0.82rem' }}>
          {language === 'vi' ? `${reportStats.ratingCount || 0} đánh giá được lưu trong hệ thống` : `${reportStats.ratingCount || 0} reviews stored in the system`}
        </p>
        {(reportStats.feedbacks || []).length ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {(reportStats.feedbacks || []).map(item => (
              <article key={`${item.source}-${item.id}`} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '0.9rem 1rem', background: '#FAFCFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <strong>{item.authorName || (language === 'vi' ? 'Người dùng ẩn danh' : 'Anonymous user')}</strong>
                  <span style={{ color: '#B3862A', fontWeight: 800 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                </div>
                <div style={{ marginTop: 4, color: '#71827D', fontSize: '0.74rem' }}>
                  {item.activityName || (language === 'vi' ? 'Đánh giá toàn sự kiện' : 'Event review')} · {new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </div>
                <p style={{ margin: '0.65rem 0 0', color: '#263B35', whiteSpace: 'pre-wrap' }}>{item.comment || (language === 'vi' ? 'Không để lại ý kiến.' : 'No written comment.')}</p>
              </article>
            ))}
          </div>
        ) : <p style={{ color: '#71827D' }}>{language === 'vi' ? 'Chưa có đánh giá thực tế cho sự kiện này.' : 'No reviews for this event yet.'}</p>}
      </section>
    </div>
  );
};

