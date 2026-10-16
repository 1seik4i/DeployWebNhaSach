import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Bus,
  PhoneCall
} from 'lucide-react';
import { Language } from '../types';
import { FeedbackSection } from '../components/FeedbackSection';
import './ContactExperience.css';

interface ContactExperienceProps {
  language: Language;
  open: boolean;
}

export const ContactExperience: React.FC<ContactExperienceProps> = ({ language, open }) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Lock body scroll when sheet is open
  useLayoutEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('contact-experience-open');
    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.classList.remove('contact-experience-open');
      document.body.style.overflow = '';
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const oldTitle = document.title;
    document.title = vi
      ? 'Liên Hệ & Đóng Góp Ý Kiến — Đường Sách TP. Hồ Chí Minh'
      : 'Contact & Feedback — HCMC Book Street';

    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }

    return () => {
      document.title = oldTitle;
    };
  }, [open, vi]);

  // Parallax motion for Hero section
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    const root = panelRef.current;
    let frameId = 0;

    const updateScrollMotion = () => {
      frameId = 0;
      const hero = root.querySelector<HTMLElement>('.contact-hero-fptu');
      const heroHeight = hero?.offsetHeight ?? 440;
      const heroProgress = Math.min(Math.max(root.scrollTop / Math.max(heroHeight, 1), 0), 1);

      root.style.setProperty('--contact-hero-image-y', `${(heroProgress * 28).toFixed(2)}px`);
      root.style.setProperty('--contact-hero-copy-y', `${(heroProgress * 14).toFixed(2)}px`);
      root.style.setProperty('--contact-hero-copy-opacity', `${(1 - heroProgress * 0.45).toFixed(3)}`);
    };

    const scheduleScrollMotion = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateScrollMotion);
    };

    root.addEventListener('scroll', scheduleScrollMotion, { passive: true });
    window.addEventListener('resize', scheduleScrollMotion);
    scheduleScrollMotion();

    return () => {
      root.removeEventListener('scroll', scheduleScrollMotion);
      window.removeEventListener('resize', scheduleScrollMotion);
      if (frameId) window.cancelAnimationFrame(frameId);
      root.style.removeProperty('--contact-hero-image-y');
      root.style.removeProperty('--contact-hero-copy-y');
      root.style.removeProperty('--contact-hero-copy-opacity');
    };
  }, [open]);

  const faqs = useMemo(() => [
    {
      qVi: 'Tôi muốn đăng ký tổ chức sự kiện/ra mắt sách tại Đường Sách thì cần liên hệ ai?',
      qEn: 'Who should I contact to organize an event or book launch at Book Street?',
      aVi: 'Quý đơn vị, tác giả có thể gửi hồ sơ kế hoạch về email sukien@duongsachtphcm.vn hoặc gọi (028) 3822 5683 để được Ban Sự Kiện hỗ trợ thẩm định và sắp xếp lịch.',
      aEn: 'Please email your event plan to sukien@duongsachtphcm.vn or call (028) 3822 5683 for event coordination and scheduling.'
    },
    {
      qVi: 'Đường Sách có thu phí vào cổng hoặc tham quan không?',
      qEn: 'Is there an admission fee to visit Book Street?',
      aVi: 'Đường Sách TP.HCM là không gian văn hóa công cộng mở hoàn toàn miễn phí cho tất cả người dân, độc giả và du khách trong nước lẫn quốc tế.',
      aEn: 'HCMC Book Street is a completely free public cultural space for all residents, readers, and domestic/international visitors.'
    },
    {
      qVi: 'Quy định chụp ảnh và quay phim tại Đường Sách như thế nào?',
      qEn: 'What are the photography and filming regulations at Book Street?',
      aVi: 'Du khách và bạn đọc tự do chụp ảnh lưu niệm cá nhân. Các đoàn quay phim thương mại, truyền hình hoặc sự kiện chuyên nghiệp cần liên hệ đăng ký trước với Ban Quản Lý để đảm bảo an ninh trật tự.',
      aEn: 'Personal commemorative photography is freely welcomed. Commercial filming, television broadcasts, or professional shoots require prior registration with the Management Board.'
    },
    {
      qVi: 'Gửi xe khi đến Đường Sách ở đâu thuận tiện nhất?',
      qEn: 'Where are the most convenient parking locations near Book Street?',
      aVi: 'Bạn đọc có thể gửi xe máy tại bãi giữ xe Bưu điện Trung tâm TP.HCM, bãi xe Đường sách (đầu đường Hai Bà Trưng), hoặc gửi ô tô tại hầm toà nhà Diamond Plaza / Vincom Center Đồng Khởi cách 50m.',
      aEn: 'Motorcycles can be parked at the Central Post Office lot or the Book Street Hai Ba Trung entrance. Cars can park at Diamond Plaza or Vincom Center Dong Khoi basements (50m away).'
    }
  ], []);

  return (
    <div
      ref={panelRef}
      id="contact-page-panel"
      className={`contact-sheet ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={vi ? 'Liên hệ Đường Sách TP.HCM' : 'Contact HCMC Book Street'}
    >
      <main className="contact-document">
        {/* Top Sticky Navigation Bar */}
        <div className="contact-topbar">
          <div className="contact-container contact-topbar-content">
            <button
              type="button"
              className="contact-back-btn"
              onClick={() => navigate('/')}
              title={vi ? 'Quay lại Trang chủ' : 'Back to Home'}
            >
              <ArrowLeft size={16} />
              <span>{vi ? 'Quay lại Trang chủ' : 'Back to Home'}</span>
            </button>

            <div className="contact-breadcrumbs">
              <Link to="/">{vi ? 'Trang chủ' : 'Home'}</Link>
              <ChevronRight size={13} />
              <span className="active">{vi ? 'Liên hệ & Góp ý' : 'Contact & Feedback'}</span>
            </div>
          </div>
        </div>

        {/* 1. Hero Banner matching "Về Đường Sách" FPTU Signature Style */}
        <section className="contact-hero-fptu">
          <div className="contact-hero-bg-photo" aria-hidden="true" />
          <div className="contact-hero-gradient-overlay" aria-hidden="true" />

          <div className="contact-hero-container">
            <div className="contact-hero-brand-lockup">
              <div className="contact-hero-era">
                <span />
                <i>{vi ? 'KẾT NỐI & HỢP TÁC • ĐƯỜNG SÁCH TP.HCM' : 'CONNECT & COLLABORATE'}</i>
                <span />
              </div>

              <h1 className="contact-hero-title">
                {vi ? (
                  <>
                    Lắng Nghe Bạn Đọc &<br />
                    <em>Kết Nối Cộng Đồng</em>
                  </>
                ) : (
                  <>
                    Listening to Readers &<br />
                    <em>Connecting Communities</em>
                  </>
                )}
              </h1>

              <p className="contact-hero-lead">
                {vi
                  ? 'Mọi thắc mắc, đề xuất hợp tác xuất bản, tổ chức sự kiện văn hóa hoặc ý kiến đóng góp xin vui lòng gửi về Ban Quản Lý Đường Sách TP.HCM để được hỗ trợ kịp thời.'
                  : 'Inquiries, event proposals, publishing partnerships and visitor feedback are warmly welcomed by the Management Board.'}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Direct Channels Bento Row (3 Quick Cards) */}
        <section className="contact-channels-section">
          <div className="contact-container">
            <div className="contact-channels-grid">
              <div className="contact-channel-card">
                <div className="contact-channel-icon-box">
                  <MapPin size={22} />
                </div>
                <div className="contact-channel-meta">
                  <span className="contact-channel-badge">{vi ? 'ĐỊA CHỈ TRUNG TÂM' : 'OFFICIAL LOCATION'}</span>
                  <h3 className="contact-channel-title">{vi ? 'Đường Nguyễn Văn Bình' : 'Nguyen Van Binh Street'}</h3>
                  <p className="contact-channel-text">
                    {vi ? 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh (Cạnh Bưu điện Trung tâm)' : 'Ben Nghe Ward, District 1, Ho Chi Minh City'}
                  </p>
                </div>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel-icon-box">
                  <PhoneCall size={22} />
                </div>
                <div className="contact-channel-meta">
                  <span className="contact-channel-badge">{vi ? 'ĐƯỜNG DÂY NÓNG' : 'HOTLINE'}</span>
                  <h3 className="contact-channel-title">(028) 3822 5683</h3>
                  <p className="contact-channel-text">
                    {vi ? 'Bộ phận Lễ tân & Quản lý: 08:00 – 21:00 hàng ngày' : 'Reception & Operations: 08:00 – 21:00 daily'}
                  </p>
                </div>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel-icon-box">
                  <Mail size={22} />
                </div>
                <div className="contact-channel-meta">
                  <span className="contact-channel-badge">{vi ? 'HỘP THƯ ĐIỆN TỬ' : 'EMAIL SUPPORT'}</span>
                  <h3 className="contact-channel-title">vanphong@duongsachtphcm.vn</h3>
                  <p className="contact-channel-text">
                    {vi ? 'Sự kiện & Tọa đàm: sukien@duongsachtphcm.vn' : 'Events: sukien@duongsachtphcm.vn'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Phản hồi, Góp ý & Đề xuất Sự kiện (Unified Feedback Form) */}
        <FeedbackSection language={language} className="contact-feedback-embed" />

        {/* 4. Câu hỏi thường gặp & Hướng dẫn di chuyển (FAQs & Transit) */}
        <section className="contact-faq-transit-section">
          <div className="contact-container">
            <div className="contact-section-header">
              <span className="contact-section-kicker">{vi ? 'THÔNG TIN HỮU ÍCH' : 'HELPFUL INFORMATION'}</span>
              <h2 className="contact-section-heading">
                {vi ? 'Câu Hỏi Thường Gặp & Chỉ Dẫn' : 'FAQ & Visitor Guide'}
              </h2>
              <p className="contact-section-sub">
                {vi
                  ? 'Những giải đáp chi tiết và hướng dẫn di chuyển giúp bạn có trải nghiệm trọn vẹn nhất khi ghé thăm Đường Sách TP.HCM.'
                  : 'Answers to common questions and transportation guidance to make your visit seamless.'}
              </p>
            </div>

            <div className="contact-faq-transit-grid">
              {/* FAQ Accordion */}
              <div className="contact-faq-card">
                <div className="contact-faq-header">
                  <HelpCircle size={20} color="#B27B22" />
                  <h3>{vi ? 'Câu hỏi thường gặp (FAQ)' : 'Frequently Asked Questions'}</h3>
                </div>

                <div className="contact-faq-list">
                  {faqs.map((faq, fIdx) => {
                    const isExpanded = expandedFaq === fIdx;
                    return (
                      <div key={fIdx} className={`contact-faq-item ${isExpanded ? 'is-expanded' : ''}`}>
                        <button
                          type="button"
                          className="contact-faq-question-btn"
                          onClick={() => setExpandedFaq(isExpanded ? null : fIdx)}
                          aria-expanded={isExpanded}
                        >
                          <span>{vi ? faq.qVi : faq.qEn}</span>
                          <ChevronDown size={16} className="contact-faq-chevron" />
                        </button>
                        {isExpanded && (
                          <div className="contact-faq-answer">
                            <p>{vi ? faq.aVi : faq.aEn}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transit & Parking Guide */}
              <div className="contact-transit-card">
                <div className="contact-transit-header">
                  <Bus size={20} color="#162E23" />
                  <h3>{vi ? 'Hướng dẫn di chuyển & Bãi giữ xe' : 'Transit & Parking Locations'}</h3>
                </div>
                <ul className="contact-transit-list">
                  <li>
                    <strong>{vi ? 'Tuyến Xe Buýt:' : 'Bus Lines:'}</strong> {vi ? 'Tuyến 03, 19, 45, 120 (Dừng tại Nhà Thờ Đức Bà / Diamond Plaza, đi bộ 30m).' : 'Routes 03, 19, 45, 120 (Stop at Notre-Dame Cathedral / Diamond Plaza, 30m walk).'}
                  </li>
                  <li>
                    <strong>{vi ? 'Gửi xe máy:' : 'Motorbike Parking:'}</strong> {vi ? 'Bãi xe Bưu Điện Trung tâm hoặc Bãi xe Đường Sách (Đầu đường Hai Bà Trưng).' : 'Central Post Office lot or Book Street entrance (Hai Ba Trung).'}
                  </li>
                  <li>
                    <strong>{vi ? 'Gửi ô tô:' : 'Car Parking:'}</strong> {vi ? 'Hầm toà nhà Diamond Plaza hoặc Vincom Center Đồng Khởi (Cách 50m).' : 'Diamond Plaza or Vincom Center Dong Khoi basements (50m away).'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Operating Hours Section (Dark Theme like Journey) */}
        <section className="contact-hours-section">
          <div className="contact-container">
            <div className="contact-hours-card">
              <div className="contact-hours-content">
                <span className="contact-hours-badge">{vi ? 'KHÔNG GIAN MỞ CỘNG ĐỒNG' : 'OPEN PUBLIC SPACE'}</span>
                <h2 className="contact-hours-title">
                  {vi ? 'Thời Gian Mở Cửa & Phục Vụ Bạn Đọc' : 'Opening Hours & Visitor Services'}
                </h2>
                <p className="contact-hours-desc">
                  {vi
                    ? 'Đường Sách TP.HCM mở cửa chào đón người dân, bạn đọc và du khách tất cả các ngày trong tuần, kể cả Thứ Bảy, Chủ Nhật và các dịp Lễ, Tết.'
                    : 'HCMC Book Street is open to all visitors every day of the week, including weekends and public holidays.'}
                </p>
                <div className="contact-hours-time-tag">
                  <Clock size={20} />
                  <span>{vi ? '08:00 — 22:00 (Mỗi ngày)' : '08:00 — 22:00 (Daily)'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
