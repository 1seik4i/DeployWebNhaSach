import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { Language } from '../../types';
import './AdminTrafficView.css';

interface MonthlyStat {
  month: number;
  year: number;
  count: number;
}

interface TrafficStats {
  onlineCount: number;
  todayVisits: number;
  monthVisits: number;
  totalVisits: number;
  generatedAt: string;
  dailyVisits: { date: string; count: number }[];
  monthlyStats?: MonthlyStat[];
  selectedMonth?: number | null;
  selectedYear?: number;
}

export function AdminTrafficView({ language }: { language: Language }) {
  const vi = language === 'vi';
  const locale = vi ? 'vi-VN' : 'en-US';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [viewType, setViewType] = useState<'week' | 'month' | 'year_overview'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (viewType === 'month') {
          queryParams.set('month', String(selectedMonth));
          queryParams.set('year', String(selectedYear));
        } else if (viewType === 'year_overview') {
          queryParams.set('year', String(selectedYear));
        }
        const endpoint = `/admin/visit-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const result = await apiClient.get<TrafficStats>(endpoint);
        if (active) { setStats(result); setError(''); }
      } catch {
        if (active) setError(vi ? 'Không thể tải thống kê truy cập. Vui lòng thử lại.' : 'Unable to load visitor analytics. Please try again.');
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [revision, vi, viewType, selectedMonth, selectedYear]);

  // Determine active dataset and labels based on viewType
  const chartItems = viewType === 'week'
    ? (stats?.dailyVisits.slice(-7) ?? []).map(r => ({
        key: r.date,
        label: new Date(`${r.date}T00:00:00+07:00`).toLocaleDateString(locale, { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }),
        fullLabel: new Date(`${r.date}T00:00:00+07:00`).toLocaleDateString(locale, { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }),
        count: r.count
      }))
    : viewType === 'year_overview'
    ? (stats?.monthlyStats ?? []).map(m => ({
        key: `m-${m.month}`,
        label: vi ? `T${m.month}` : `M${m.month}`,
        fullLabel: vi ? `Tháng ${m.month}/${m.year}` : `Month ${m.month}, ${m.year}`,
        count: m.count
      }))
    : (stats?.dailyVisits ?? []).map(r => ({
        key: r.date,
        label: `${new Date(`${r.date}T00:00:00+07:00`).toLocaleDateString(locale, { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit'})}`,
        fullLabel: new Date(`${r.date}T00:00:00+07:00`).toLocaleDateString(locale, { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }),
        count: r.count
      }));

  const maximum = Math.max(1, ...chartItems.map(row => row.count));
  const total = chartItems.reduce((sum, row) => sum + row.count, 0);

  // Calculate SVG line chart coordinates (viewBox 0 0 900 260)
  const chartWidth = 900;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = chartWidth - paddingX * 2;
  const graphHeight = chartHeight - paddingY * 2;

  const points = chartItems.map((row, idx) => {
    const x = chartItems.length > 1 ? paddingX + (idx / (chartItems.length - 1)) * graphWidth : chartWidth / 2;
    const y = paddingY + graphHeight - (row.count / maximum) * graphHeight;
    return { ...row, x, y };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, idx) => {
        if (idx === 0) return `M ${curr.x} ${curr.y}`;
        const prev = points[idx - 1];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + graphHeight} L ${points[0].x} ${paddingY + graphHeight} Z`
    : '';

  const cards = [
    { label: vi ? 'Đang trực tuyến' : 'Online now', value: stats?.onlineCount, note: vi ? 'Có hoạt động trong 5 phút gần nhất' : 'Active in the last 5 minutes' },
    { label: vi ? 'Truy cập hôm nay' : 'Visits today', value: stats?.todayVisits, note: vi ? 'Theo ngày tại Việt Nam' : 'Vietnam calendar day' },
    { label: vi ? 'Truy cập tháng này' : 'Visits this month', value: stats?.monthVisits, note: vi ? 'Từ đầu tháng đến hiện tại' : 'From the start of this month' },
    { label: vi ? 'Tổng lượt truy cập' : 'Total visits', value: stats?.totalVisits, note: vi ? 'Toàn bộ dữ liệu đã ghi nhận' : 'All recorded visits' },
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return <div className="adm-dashboard-view adm-traffic" aria-busy={loading}>
    <div className="adm-page-header">
      <div><span className="adm-dashboard-eyebrow">{vi ? 'LƯỢNG TRUY CẬP WEBSITE' : 'WEBSITE TRAFFIC'}</span>
        <h1 className="adm-page-title">{vi ? 'Thống kê truy cập' : 'Visitor analytics'}</h1>
        <p className="adm-page-subtitle">{vi ? 'Theo dõi lượt truy cập thực tế, tự động cập nhật mỗi 30 giây.' : 'Monitor recorded visits, refreshed every 30 seconds.'}</p>
      </div>
      <button className="adm-btn adm-btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} />{vi ? 'Làm mới' : 'Refresh'}</button>
    </div>
    {error && <p role="alert" className="adm-traffic-error">{error} {stats && (vi ? 'Đang hiển thị dữ liệu cập nhật lần trước.' : 'Showing the last successful update.')}</p>}
    <div className="adm-kpi-grid adm-kpi-grid-refined">
      {cards.map(card => <div className="adm-kpi-card" key={card.label}>
        <div className="adm-kpi-top"><span className="adm-kpi-label">{card.label}</span><div className="adm-kpi-icon-wrap icon-emerald"><BarChart3 size={20} /></div></div>
        <div className="adm-kpi-value">{card.value?.toLocaleString(locale) ?? '—'}</div>
        <p className="adm-kpi-trend trend-neutral">{card.note}</p>
      </div>)}
    </div>
    {!stats && <p role="status">{loading ? (vi ? 'Đang tải thống kê…' : 'Loading analytics…') : (vi ? 'Chưa tải được dữ liệu.' : 'Data unavailable.')}</p>}
    {stats && <section className="adm-card adm-traffic-chart">
      <div className="adm-page-header" style={{ marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="adm-card-title">{vi ? 'Lượt truy cập theo thời gian' : 'Visits over time'}</h2>
          <p className="adm-card-subtitle">
            {total.toLocaleString(locale)} {vi ? 'lượt trong' : 'visits in'}{' '}
            <strong>
              {viewType === 'week'
                ? (vi ? '7 ngày gần nhất' : 'the last 7 days')
                : viewType === 'year_overview'
                ? (vi ? `năm ${selectedYear} (12 tháng)` : `year ${selectedYear} (12 months)`)
                : (vi ? `tháng ${selectedMonth}/${selectedYear}` : `month ${selectedMonth}/${selectedYear}`)}
            </strong>
          </p>
        </div>
        
        {/* Bộ lọc theo Chế độ và Chọn Tháng từ 1 đến 12 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div className="adm-traffic-filter-tabs" role="group" aria-label={vi ? 'Bộ lọc thời gian' : 'Time filter'}>
            <button
              type="button"
              className={`adm-filter-btn ${viewType === 'week' ? 'is-active' : ''}`}
              onClick={() => { setViewType('week'); setHoveredPoint(null); }}
            >
              {vi ? '7 ngày gần nhất' : 'Last 7 days'}
            </button>
            <button
              type="button"
              className={`adm-filter-btn ${viewType === 'month' ? 'is-active' : ''}`}
              onClick={() => { setViewType('month'); setHoveredPoint(null); }}
            >
              {vi ? 'Theo tháng' : 'By Month'}
            </button>
            <button
              type="button"
              className={`adm-filter-btn ${viewType === 'year_overview' ? 'is-active' : ''}`}
              onClick={() => { setViewType('year_overview'); setHoveredPoint(null); }}
            >
              {vi ? `Cả năm ${selectedYear}` : `Full Year ${selectedYear}`}
            </button>
          </div>

          {/* Selector chọn từng tháng (1 đến 12) khi ở chế độ Theo tháng */}
          {viewType === 'month' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <select
                aria-label={vi ? 'Chọn tháng' : 'Select month'}
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setHoveredPoint(null);
                }}
                className="adm-month-select"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {vi ? `Tháng ${m}` : `Month ${m}`}
                  </option>
                ))}
              </select>

              <select
                aria-label={vi ? 'Chọn năm' : 'Select year'}
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setHoveredPoint(null);
                }}
                className="adm-month-select"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {total === 0 && <p role="status" style={{ padding: '2rem 0', textAlign: 'center', color: '#6B7280' }}>{vi ? 'Chưa ghi nhận lượt truy cập trong khoảng thời gian này.' : 'No visits recorded during this period.'}</p>}
      
      {/* Biểu đồ đường (Line Chart SVG) */}
      <div className="adm-traffic-line-wrapper">
        <svg
          className="adm-traffic-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={vi ? `Biểu đồ đường, tổng ${total} lượt truy cập.` : `Line chart: ${total} visits.`}
        >
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#17382E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#17382E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Đường lưới ngang (Grid lines) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + graphHeight * (1 - ratio);
            const val = Math.round(maximum * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray={ratio === 0 ? 'none' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9CA3AF"
                  fontFamily="sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Vùng mờ bên dưới đường (Area fill) */}
          {areaD && <path d={areaD} fill="url(#trafficGradient)" />}

          {/* Đường biểu đồ chính (Line stroke) */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#17382E"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Các điểm tròn (Points) & Vùng tương tác hover */}
          {points.map((pt) => {
            const isHovered = hoveredPoint?.label === pt.fullLabel;
            return (
              <g key={pt.key}>
                {/* Điểm hiển thị */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : (viewType === 'year_overview' ? 5 : (viewType === 'week' ? 4.5 : 3.5))}
                  fill={isHovered ? '#B48A3C' : '#FFFFFF'}
                  stroke="#17382E"
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                />
                {/* Vùng hover rộng hơn để dễ rê chuột */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint({ label: pt.fullLabel, count: pt.count, x: pt.x, y: pt.y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Trục nhãn mốc bên dưới */}
        <div className="adm-traffic-x-axis">
          {points.map((pt, idx) => {
            // Giảm bớt mật độ hiển thị nhãn nếu là cả tháng để tránh chen chúc
            const showLabel = viewType === 'week' || viewType === 'year_overview' || idx % 2 === 0 || idx === points.length - 1;
            return (
              <div
                key={pt.key}
                className="adm-traffic-x-tick"
                style={{
                  left: `${(pt.x / chartWidth) * 100}%`,
                  opacity: showLabel ? 1 : 0
                }}
              >
                <span>{pt.label}</span>
              </div>
            );
          })}
        </div>

        {/* Tooltip hiển thị khi hover */}
        {hoveredPoint && (
          <div
            className="adm-traffic-tooltip"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}%`,
            }}
          >
            <div className="adm-traffic-tooltip-date">{hoveredPoint.label}</div>
            <div className="adm-traffic-tooltip-count">
              <strong>{hoveredPoint.count.toLocaleString(locale)}</strong> {vi ? 'lượt truy cập' : 'visits'}
            </div>
          </div>
        )}
      </div>

      <p className="adm-card-subtitle">{vi ? 'Cập nhật lúc: ' : 'Updated: '}{new Date(stats.generatedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
    </section>}
    <p className="adm-page-subtitle">{vi ? 'Mỗi phiên trình duyệt được tính một lượt mỗi ngày theo múi giờ Việt Nam. Tải lại trang không tăng thêm lượt trong cùng ngày. Đây là số phiên truy cập, không phải số người duy nhất.' : 'Each browser session counts once per Vietnam calendar day. Reloading does not add a visit that day. Counts represent sessions, not unique people.'}</p>
  </div>;
}
