import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Mail, 
  Phone, 
  ExternalLink, 
  Globe, 
  Eye,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Language } from '../types';
import { apiClient } from '../services/apiClient';
import { realtimeWebSocket } from '../services/websocketClient';
import './Footer.css';

interface FooterProps {
  language: Language;
}

interface PublicSiteConfig {
  systemName?: string;
  supportEmail?: string;
  supportPhone?: string;
  physicalAddress?: string;
}

interface VisitStats {
  onlineCount: number;
  todayVisits: number;
  monthVisits: number;
  totalVisits: number;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const isVi = language === 'vi';
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [todayVisits, setTodayVisits] = useState<number | null>(null);
  const [monthVisits, setMonthVisits] = useState<number | null>(null);
  const [trafficError, setTrafficError] = useState('');
  const [siteConfig, setSiteConfig] = useState<PublicSiteConfig | null>(null);
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    const sessionKey = 'duongsach_visit_session';
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, sessionId);
    }

    // Kết nối WebSocket thời gian thực cho số người trực tuyến
    const unsubscribeWs = realtimeWebSocket.subscribe((liveCount) => {
      setOnlineCount(liveCount);
    });

    const unsubscribeStats = realtimeWebSocket.subscribeStats(stats => {
      setOnlineCount(stats.onlineCount);
      setTodayVisits(stats.todayVisits);
      setMonthVisits(stats.monthVisits);
      setTotalVisits(stats.totalVisits);
      setTrafficError('');
    });

    const recordAndRefresh = () => {
      if (document.visibilityState === 'hidden') return;
      void apiClient.post('/public/visits', { sessionId })
        .then(() => apiClient.get<VisitStats>('/public/visit-stats'))
        .then(result => {
          const stats = realtimeWebSocket.getCurrentStats() ?? result;
          // Chỉ fallback cập nhật onlineCount từ API nếu websocket chưa trả về
          setOnlineCount(realtimeWebSocket.getCurrentOnlineCount() ?? stats.onlineCount);
          setTodayVisits(stats.todayVisits);
          setMonthVisits(stats.monthVisits);
          setTotalVisits(stats.totalVisits);
          setTrafficError('');
        })
        .catch(error => setTrafficError(error instanceof Error ? error.message : 'Không thể tải thống kê truy cập'));
    };
    recordAndRefresh();
    const heartbeat = window.setInterval(recordAndRefresh, 60_000);
    document.addEventListener('visibilitychange', recordAndRefresh);
    void apiClient.get<PublicSiteConfig>('/public/site-config')
      .then(config => { setSiteConfig(config); setConfigError(''); })
      .catch(error => setConfigError(error instanceof Error ? error.message : 'Không thể tải thông tin liên hệ'));
    return () => {
      unsubscribeWs();
      unsubscribeStats();
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', recordAndRefresh);
    };
  }, []);

  return (
    <footer className="yg-footer">
      <div className="yg-footer-container">
        {/* Real-time Traffic & Visitor Analytics Bar (Top of Footer) */}
        <div className="yg-traffic-stats-bar">
          <div className="yg-traffic-header-title">
            <BarChart3 size={15} className="yg-traffic-ico" />
            <span>{isVi ? 'LƯU LƯỢNG TRUY CẬP WEBSITE' : 'WEBSITE TRAFFIC & VISITOR STATS'}</span>
          </div>
          {trafficError && <small className="yg-traffic-sub">{trafficError}</small>}
          
          <div className="yg-traffic-metrics-grid">
            {/* Live Online Users */}
            <div className="yg-traffic-card live-card">
              <div className="yg-traffic-card-top">
                <span className="yg-traffic-live-dot" />
                <span className="yg-traffic-label">{isVi ? 'Đang trực tuyến' : 'Live Online'}</span>
              </div>
              <span className="yg-traffic-val highlight-green">{onlineCount?.toLocaleString() ?? '—'}</span>
              <small className="yg-traffic-sub">{isVi ? 'Phiên hoạt động trong 5 phút' : 'Currently connected sessions'}</small>
            </div>

            {/* Today's Visits */}
            <div className="yg-traffic-card">
              <div className="yg-traffic-card-top">
                <Eye size={14} className="yg-metric-ico" />
                <span className="yg-traffic-label">{isVi ? 'Hôm nay' : 'Today'}</span>
              </div>
              <span className="yg-traffic-val">{todayVisits?.toLocaleString() ?? '—'}</span>
              <small className="yg-traffic-sub">{isVi ? 'Lượt truy cập trong ngày' : 'Daily visits'}</small>
            </div>

            {/* This Month's Visits */}
            <div className="yg-traffic-card">
              <div className="yg-traffic-card-top">
                <TrendingUp size={14} className="yg-metric-ico" />
                <span className="yg-traffic-label">{isVi ? 'Tháng này' : 'This Month'}</span>
              </div>
              <span className="yg-traffic-val">{monthVisits?.toLocaleString() ?? '—'}</span>
              <small className="yg-traffic-sub">{isVi ? 'Lượt truy cập tháng' : 'Monthly visits'}</small>
            </div>

            {/* Total Accumulated Visits */}
            <div className="yg-traffic-card total-card">
              <div className="yg-traffic-card-top">
                <Globe size={14} className="yg-metric-ico" />
                <span className="yg-traffic-label">{isVi ? 'Tổng lượt truy cập' : 'Total Visits'}</span>
              </div>
              <span className="yg-traffic-val highlight-gold">{totalVisits?.toLocaleString() ?? '—'}</span>
              <small className="yg-traffic-sub">{isVi ? 'Tổng đã ghi nhận' : 'Recorded total'}</small>
            </div>
          </div>
        </div>

        {/* Top Main Section */}
        <div className="yg-footer-main-grid">
          
          {/* Col 1: Navigation (2 sub-columns) */}
          <div className="yg-footer-col yg-nav-col">
            <span className="yg-section-label">
              {isVi ? 'ĐIỀU HƯỚNG' : 'NAVIGATION'}
            </span>
            <div className="yg-nav-dual-grid">
              <ul className="yg-nav-list">
                <li><Link to="/">{isVi ? 'Trang chủ' : 'Home'}</Link></li>
                <li><Link to="/journey">{isVi ? 'Về Đường Sách' : 'About Us'}</Link></li>
                <li><Link to="/booths">{isVi ? 'Gian hàng ki-ốt' : 'Book Stalls'}</Link></li>
                <li><Link to="/events">{isVi ? 'Lịch sự kiện' : 'Events'}</Link></li>
                <li><Link to="/library">{isVi ? 'Thư viện số' : 'Digital Library'}</Link></li>
              </ul>
              <ul className="yg-nav-list">
                <li><Link to="/news">{isVi ? 'Bản tin & Sự kiện' : 'News & Media'}</Link></li>
                <li><Link to="/organization">{isVi ? 'Bộ máy tổ chức' : 'Organization'}</Link></li>
                <li><Link to="/contact">{isVi ? 'Liên hệ & Góp ý' : 'Contact & Feedback'}</Link></li>
                <li><a href="/#ban-do">{isVi ? 'Bản đồ 3D' : '3D Street Map'}</a></li>
                <li><Link to="/partner/login">{isVi ? 'Dành cho đối tác' : 'Partner Portal'}</Link></li>
              </ul>
            </div>
          </div>

          {/* Col 2: Address & Location Map */}
          <div className="yg-footer-col yg-map-col">
            <span className="yg-section-label">
              {isVi ? 'ĐỊA CHỈ & BẢN ĐỒ' : 'LOCATION & MAP'}
            </span>
            <div className="yg-address-block">
              {siteConfig?.physicalAddress && <p className="yg-address-text">
                <MapPin size={15} className="yg-accent-ico" />
                <span>{siteConfig.physicalAddress}</span>
              </p>}
              {configError && <small className="yg-traffic-sub">{configError}</small>}
            </div>

            {/* Google Map Mini Embed */}
            {siteConfig?.physicalAddress && <div className="yg-map-preview-wrap">
              <iframe
                title="Bản đồ vị trí Đường Sách TP.HCM"
                src={`https://www.google.com/maps?q=${encodeURIComponent(siteConfig.physicalAddress)}&output=embed`}
                width="100%"
                height="110"
                style={{ border: 0, borderRadius: '10px' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(siteConfig.physicalAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="yg-map-direct-link"
              >
                <span>{isVi ? 'Chỉ đường trên Google Maps' : 'Get Directions on Google Maps'}</span>
                <ExternalLink size={13} />
              </a>
            </div>}
          </div>

          <div className="yg-footer-col yg-awards-col">
            <span className="yg-section-label">{isVi ? 'KẾT NỐI' : 'CONNECT'}</span>
            <div className="yg-contact-mini">
              <div className="yg-contact-row">
                {siteConfig?.supportPhone && (
                  <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, '')}`} className="yg-contact-link">
                    <Phone size={13} /> {siteConfig.supportPhone}
                  </a>
                )}
                {siteConfig?.supportEmail && (
                  <a href={`mailto:${siteConfig.supportEmail}`} className="yg-contact-link">
                    <Mail size={13} /> {siteConfig.supportEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="yg-divider" />

        {/* Bottom Meta Row */}
        <div className="yg-bottom-meta">
          <div className="yg-copy">
            © {new Date().getFullYear()} {siteConfig?.systemName || ''}
          </div>
          <div className="yg-legal-links">
            <Link to="/contact">{isVi ? 'Điều khoản & Quy định' : 'Terms & Conditions'}</Link>
            <span className="yg-dot">•</span>
            <Link to="/contact">{isVi ? 'Chính sách bảo mật' : 'Privacy Policy'}</Link>
          </div>
        </div>
      </div>

      {/* Giant Bottom Brand Monument (Full-bleed, Half-clipped like reference) */}
      <div className="yg-brand-monument" aria-hidden="true">
        <span className="yg-monument-text">BOOK STREET</span>
      </div>
    </footer>
  );
};


