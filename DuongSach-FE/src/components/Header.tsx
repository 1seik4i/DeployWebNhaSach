import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Menu, 
  X, 
  LogIn, 
  User, 
  CircleUser,
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  Layers,
  Award,
  FileText,
  LogOut,
  Landmark,
  Mail,
  Sparkles,
  BookOpen,
  Home,
  Compass,
  History,
  Users,
  Newspaper,
  Calendar,
  Store,
  Globe
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconBookmark 
} from './CustomIcons';
import { Language } from '../types';
import './Header.css';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  language, 
  onLanguageChange,
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useModalBehavior(mobileMenuOpen, () => setMobileMenuOpen(false));
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('trang-chu');
  const [passedSections, setPassedSections] = useState<string[]>([]);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const headerVisibleRef = useRef(true);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const homeDropdownRef = useRef<HTMLDivElement>(null);
  const aboutCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationHeaderHoldUntilRef = useRef(0);

  const isHomePage = location.pathname === '/' || location.pathname === '';
  const isJourneyPage = location.pathname.startsWith('/hanh-trinh');
  const isBoothsPage = /^\/gian-hang(?:\/|$)/.test(location.pathname);
  const isEventsPage = /^\/su-kien(?:\/|$)/.test(location.pathname);
  const isNewsPage = /^\/(?:tin-tuc|tin-tuc-su-kien)(?:\/|$)/.test(location.pathname);
  const isOrganizationPage = /^\/bo-may-to-chuc(?:\/|$)/.test(location.pathname);
  const isContactPage = /^\/lien-he(?:\/|$)/.test(location.pathname);

  const closeAllDropdownsImmediately = () => {
    if (homeCloseTimeoutRef.current) {
      clearTimeout(homeCloseTimeoutRef.current);
      homeCloseTimeoutRef.current = null;
    }
    if (aboutCloseTimeoutRef.current) {
      clearTimeout(aboutCloseTimeoutRef.current);
      aboutCloseTimeoutRef.current = null;
    }
    setHomeDropdownOpen(false);
    setAboutDropdownOpen(false);
    setAccountDropdownOpen(false);
  };

  const handleHomeMouseEnter = () => {
    if (aboutCloseTimeoutRef.current) {
      clearTimeout(aboutCloseTimeoutRef.current);
      aboutCloseTimeoutRef.current = null;
    }
    setAboutDropdownOpen(false);

    if (homeCloseTimeoutRef.current) {
      clearTimeout(homeCloseTimeoutRef.current);
      homeCloseTimeoutRef.current = null;
    }
    setHomeDropdownOpen(true);
  };

  const handleHomeMouseLeave = () => {
    if (homeCloseTimeoutRef.current) {
      clearTimeout(homeCloseTimeoutRef.current);
    }
    homeCloseTimeoutRef.current = setTimeout(() => {
      setHomeDropdownOpen(false);
    }, 150);
  };

  const handleAboutMouseEnter = () => {
    if (homeCloseTimeoutRef.current) {
      clearTimeout(homeCloseTimeoutRef.current);
      homeCloseTimeoutRef.current = null;
    }
    setHomeDropdownOpen(false);

    if (aboutCloseTimeoutRef.current) {
      clearTimeout(aboutCloseTimeoutRef.current);
      aboutCloseTimeoutRef.current = null;
    }
    setAboutDropdownOpen(true);
  };

  const handleAboutMouseLeave = () => {
    if (aboutCloseTimeoutRef.current) {
      clearTimeout(aboutCloseTimeoutRef.current);
    }
    aboutCloseTimeoutRef.current = setTimeout(() => {
      setAboutDropdownOpen(false);
    }, 150);
  };

  const keepHeaderVisibleDuringNavigation = () => {
    navigationHeaderHoldUntilRef.current = Date.now() + 800;
    headerVisibleRef.current = true;
    setIsHeaderVisible(true);
  };

  const toggleLang = () => {
    onLanguageChange(language === 'vi' ? 'en' : 'vi');
  };

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(e.target as Node)) {
        setAboutDropdownOpen(false);
      }
      if (homeDropdownRef.current && !homeDropdownRef.current.contains(e.target as Node)) {
        setHomeDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountDropdownOpen(false);
        setAboutDropdownOpen(false);
        setHomeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Danh mục menu điều hướng chính trỏ về các trang riêng biệt:
  const navLinksAfterAbout = useMemo(() => [
    { id: 'bo-may-to-chuc', href: '/bo-may-to-chuc', isRoute: true, labelVi: 'Bộ máy tổ chức', labelEn: 'Organization', icon: <Users size={15} /> },
    { id: 'lien-he', href: '/lien-he', isRoute: true, labelVi: 'Liên hệ', labelEn: 'Contact', icon: <Mail size={15} /> },
  ], []);

  useEffect(() => {
    if (isBoothsPage) {
      setActiveSection('gian-hang');
      return;
    }
    if (isEventsPage) {
      setActiveSection('su-kien');
      return;
    }
    if (isNewsPage) {
      setActiveSection('tin-tuc');
      return;
    }
    if (isOrganizationPage) {
      setActiveSection('bo-may-to-chuc');
      return;
    }
    if (isContactPage) {
      setActiveSection('lien-he');
      return;
    }
    if (isJourneyPage) {
      setActiveSection('ve-duong-sach');
      return;
    }
    if (isHomePage) {
      setActiveSection('trang-chu');
    }
  }, [isHomePage, isJourneyPage, isBoothsPage, isEventsPage, isNewsPage, isOrganizationPage, isContactPage, location.pathname]);

  // Close all dropdown menus immediately whenever header hides
  useEffect(() => {
    if (!isHeaderVisible) {
      closeAllDropdownsImmediately();
      setMobileMenuOpen(false);
    }
  }, [isHeaderVisible]);

  useEffect(() => {
    const readScrollY = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return Math.min(Math.max(0, window.scrollY), Math.max(0, max));
    };
    let lastScrollY = readScrollY();
    let accumulatedDelta = 0;
    let frameId = 0;
    headerVisibleRef.current = true;
    setIsHeaderVisible(true);

    const updateHeaderVisibility = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const currentScrollY = readScrollY();
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // 1. Khi ở gần đỉnh trang (<= 80px) hoặc đang giữ header trong điều hướng: luôn giữ hiện
        if (currentScrollY <= 80 || Date.now() < navigationHeaderHoldUntilRef.current) {
          if (!headerVisibleRef.current) {
            headerVisibleRef.current = true;
            setIsHeaderVisible(true);
          }
          accumulatedDelta = 0;
          return;
        }

        // Clamp overscroll at both ends; ignore subpixel noise.
        if (Math.abs(delta) < 1) return;

        // 3. Đóng dropdown khi bắt đầu cuộn có chủ đích
        if (Math.abs(delta) >= 8) {
          closeAllDropdownsImmediately();
        }

        // 4. Kiểm tra chiều cuộn với bộ lọc nhiễu (hysteresis):
        if (delta > 0) {
          // LƯỚT XUỐNG:
          if (accumulatedDelta < 0) accumulatedDelta = 0;
          accumulatedDelta += delta;

          // Cần cuộn xuống liên tục tối thiểu 18px để ẩn (tránh giật cục khi nhích nhẹ)
          if (accumulatedDelta >= 18 && headerVisibleRef.current) {
            headerVisibleRef.current = false;
            setIsHeaderVisible(false);
            closeAllDropdownsImmediately();
            setMobileMenuOpen(false);
            accumulatedDelta = 0;
          }
        } else if (delta < 0) {
          // LƯỚT LÊN:
          if (accumulatedDelta > 0) accumulatedDelta = 0;
          accumulatedDelta += delta;

          // Cần cuộn lên chủ đích tối thiểu 25px để hiện lại (chống nhiễu do nhấc tay/quán tính ngược)
          if (accumulatedDelta <= -25 && !headerVisibleRef.current) {
            headerVisibleRef.current = true;
            setIsHeaderVisible(true);
            accumulatedDelta = 0;
          }
        }

      });
    };

    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateHeaderVisibility);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname]);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`header-ticket-wrapper ${isHeaderVisible ? '' : 'header-ticket-hidden'}`}>
        <div className="container header-ticket-container">
        {/* Horizontal Admission Ticket Header Bar */}
        <div className="header-ticket-bar">
          {/* Ticket Left Section: Brand Logo */}
          <Link to="/" className="ticket-brand-section" aria-label="Đường Sách TP.HCM Trực Tuyến">
            <div className="ticket-white-punch-hole" aria-hidden="true"></div>
            <div className="ticket-logo-circle">
              <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" className="ticket-logo-img" />
            </div>
            <div className="ticket-brand-text">
              <span className="brand-title-serif">ĐƯỜNG SÁCH</span>
              <span className="brand-sub-gold">TRỰC TUYẾN</span>
            </div>
          </Link>

          {/* Ticket Perforated Divider */}
          <div className="ticket-perforation-divider">
            <div className="ticket-notch notch-top"></div>
            <div className="ticket-perforation-line"></div>
            <div className="ticket-notch notch-bottom"></div>
          </div>

          {/* Ticket Center Section: Compact Navigation Items with Dropdowns */}
          <nav className="ticket-nav-section" aria-label="Điều hướng chính">
            <div className="ticket-nav-compact-list">
              {/* 1. Menu Dropdown: Trang chủ (Hero & các phân vùng Trang chủ) */}
              <div
                className="ticket-nav-dropdown-wrap"
                ref={homeDropdownRef}
                onMouseEnter={handleHomeMouseEnter}
                onMouseLeave={handleHomeMouseLeave}
              >
                <Link
                  to="/"
                  onClick={() => {
                    keepHeaderVisibleDuringNavigation();
                    setHomeDropdownOpen(false);
                    if (isHomePage) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`ticket-nav-compact-link ${activeSection === 'trang-chu' ? 'is-current' : ''}`}
                >
                  <span className="ticket-compact-text">
                    {language === 'vi' ? 'Trang chủ' : 'Home'}
                  </span>
                </Link>
                <button
                  type="button"
                  className="ticket-nav-dropdown-toggle"
                  onClick={() => setHomeDropdownOpen((prev) => !prev)}
                  aria-label={language === 'vi' ? 'Mở menu Trang chủ' : 'Open Home menu'}
                  aria-haspopup="menu"
                  aria-expanded={homeDropdownOpen}
                >
                  <ChevronDown size={13} className={`ticket-compact-chevron ${homeDropdownOpen ? 'open' : ''}`} />
                </button>

                {/* Dropdown Popover: Danh sách các khu vực/hero ở Trang chủ */}
                {homeDropdownOpen && (
                  <div className="ticket-subnav-popover" role="menu">
                    <div className="ticket-subnav-arrow" aria-hidden="true" />
                    <Link
                      to="/#hero"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                        const el = document.getElementById('hero');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Không gian Đường Sách' : 'Hero & Welcome'}</span>
                    </Link>
                    <Link
                      to="/#gian-hang"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                        const el = document.getElementById('gian-hang');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Gian hàng sách' : 'Bookstalls'}</span>
                    </Link>
                    <Link
                      to="/#su-kien"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                        const el = document.getElementById('su-kien');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Sự kiện văn hóa' : 'Events'}</span>
                    </Link>
                    <Link
                      to="/tin-tuc"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                      }}
                    >
                      <span>{language === 'vi' ? 'Tin tức & Bản tin' : 'News & Articles'}</span>
                    </Link>
                    <Link
                      to="/#ban-do"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                        const el = document.getElementById('ban-do');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Bản đồ tương tác' : 'Interactive Map'}</span>
                    </Link>
                    <Link
                      to="/lien-he"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setHomeDropdownOpen(false);
                      }}
                    >
                      <span>{language === 'vi' ? 'Đóng góp ý kiến' : 'Feedback'}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 2. Menu Dropdown: Về Đường Sách */}
              <div 
                className="ticket-nav-dropdown-wrap" 
                ref={aboutDropdownRef}
                onMouseEnter={handleAboutMouseEnter}
                onMouseLeave={handleAboutMouseLeave}
              >
                <Link
                  to="/hanh-trinh"
                  className={`ticket-nav-compact-link ${activeSection === 've-duong-sach' ? 'is-current' : ''}`}
                  onClick={() => {
                    keepHeaderVisibleDuringNavigation();
                    setAboutDropdownOpen(false);
                  }}
                >
                  <span className="ticket-compact-text">
                    {language === 'vi' ? 'Về Đường Sách' : 'About Book Street'}
                  </span>
                </Link>
                <button
                  type="button"
                  className="ticket-nav-dropdown-toggle"
                  onClick={() => setAboutDropdownOpen((prev) => !prev)}
                  aria-label={language === 'vi' ? 'Mở menu Về Đường Sách' : 'Open About Book Street menu'}
                  aria-haspopup="menu"
                  aria-expanded={aboutDropdownOpen}
                >
                  <ChevronDown size={13} className={`ticket-compact-chevron ${aboutDropdownOpen ? 'open' : ''}`} />
                </button>

                {/* Dropdown Popover Card */}
                {aboutDropdownOpen && (
                  <div className="ticket-subnav-popover" role="menu">
                    <div className="ticket-subnav-arrow" aria-hidden="true" />
                    <Link
                      to="/hanh-trinh"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => setAboutDropdownOpen(false)}
                    >
                      <span>{language === 'vi' ? 'Giới thiệu chung' : 'General Introduction'}</span>
                    </Link>
                    <Link
                      to="/hanh-trinh#tam-nhin-su-menh"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setAboutDropdownOpen(false);
                        const el = document.getElementById('tam-nhin-su-menh');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Tầm nhìn và sứ mệnh' : 'Vision & Mission'}</span>
                    </Link>
                    <Link
                      to="/hanh-trinh#history"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setAboutDropdownOpen(false);
                        const el = document.getElementById('history');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Lịch sử phát triển' : 'History & Growth'}</span>
                    </Link>
                    <Link
                      to="/hanh-trinh#thanh-tuu"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setAboutDropdownOpen(false);
                        const el = document.getElementById('thanh-tuu');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Thành tích' : 'Achievements'}</span>
                    </Link>
                    <Link
                      to="/hanh-trinh#doi-tac"
                      className="ticket-subnav-item"
                      role="menuitem"
                      onClick={() => {
                        setAboutDropdownOpen(false);
                        const el = document.getElementById('doi-tac');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      <span>{language === 'vi' ? 'Đối tác & Hợp tác' : 'Partners & Cooperation'}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Menu Điều hướng: Tin tức (Direct Link, không dùng popover) */}
              <Link
                to="/tin-tuc"
                onMouseEnter={closeAllDropdownsImmediately}
                className={`ticket-nav-compact-link ${activeSection === 'tin-tuc' ? 'is-current' : ''}`}
                onClick={() => {
                  keepHeaderVisibleDuringNavigation();
                  closeAllDropdownsImmediately();
                }}
              >
                <span className="ticket-compact-text">
                  {language === 'vi' ? 'Tin tức' : 'News'}
                </span>
              </Link>

              {/* 4. Bộ máy tổ chức, Liên hệ */}
              {navLinksAfterAbout.map((item) => {
                const isCurrent = activeSection === item.id;
                const linkHref = item.isRoute ? item.href : (isHomePage ? item.href : `/${item.href}`);

                return (
                  <Link
                    key={item.href}
                    to={linkHref}
                    onMouseEnter={closeAllDropdownsImmediately}
                    onClick={() => {
                      keepHeaderVisibleDuringNavigation();
                      if (isHomePage && !item.isRoute) {
                        const targetId = item.href.replace('#', '');
                        const el = document.getElementById(targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }
                    }}
                    className={`ticket-nav-compact-link ${isCurrent ? 'is-current' : ''}`}
                  >
                    <span className="ticket-compact-text">
                      {language === 'vi' ? item.labelVi : item.labelEn}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Ticket Right Section: Account + Language Switcher + Mobile Menu Toggle */}
          <div className="ticket-actions-section">
            <div className="ticket-account-menu-wrapper" ref={accountDropdownRef}>
              <button
                type="button"
                className="ticket-login-btn"
                onClick={() => setAccountDropdownOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={accountDropdownOpen}
                aria-label={language === 'vi' ? 'Đăng nhập hoặc đăng ký' : 'Sign in or register'}
                title={language === 'vi' ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
              >
                <CircleUser size={20} className="ticket-account-icon" />
              </button>

              {accountDropdownOpen && (
                <div className="ticket-account-dropdown-menu" role="menu">
                  <span className="dropdown-arrow-up" aria-hidden="true" />
                  <Link
                    to="/login"
                    className="dropdown-auth-btn primary"
                    role="menuitem"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    {language === 'vi' ? 'Đăng nhập' : 'Sign in' }
                  </Link>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <button 
              type="button" 
              className="ticket-lang-pill"
              onClick={toggleLang}
              aria-label="Chuyển đổi ngôn ngữ Việt - Anh"
              title="Chuyển đổi ngôn ngữ"
            >
              <span className={`lang-text ${language === 'vi' ? 'active' : ''}`}>VI</span>
              <span className="lang-sep">|</span>
              <span className={`lang-text ${language === 'en' ? 'active' : ''}`}>EN</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="ticket-mobile-btn"
              onClick={() => {
                setMobileMenuOpen((isOpen) => !isOpen);
              }}
              aria-label="Mở danh mục điều hướng"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Mobile Drawer Menu & Backdrop */}
      {mobileMenuOpen && createPortal(
        <>
          <div 
            className="mobile-drawer-backdrop" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div id="mobile-navigation-drawer" className="mobile-drawer-figma" role="dialog" aria-modal="true" aria-label="Menu điều hướng di động">
            <div className="mobile-drawer-top">
              <span className="drawer-logo-text">{language === 'vi' ? 'Menu' : 'Menu'}</span>
              <button 
                className="drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Auth Actions */}
            <div className="mobile-drawer-auth">
              <Link
                to="/login"
                className="mobile-auth-btn primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{language === 'vi' ? 'Đăng nhập' : 'Sign in'}</span>
              </Link>
            </div>

            <nav className="mobile-nav-figma">
              <div style={{ marginBottom: '0.65rem' }}>
                <Link
                  to="/"
                  onClick={() => {
                    keepHeaderVisibleDuringNavigation();
                    setMobileMenuOpen(false);
                    if (isHomePage) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`mobile-nav-link-item ${activeSection === 'trang-chu' ? 'is-current' : ''}`}
                >
                  <span className="ticket-item-circle" style={{ width: '34px', height: '34px' }}>
                    <Home size={15} />
                  </span>
                  <span>{language === 'vi' ? 'Trang chủ' : 'Home'}</span>
                </Link>
              </div>

              <div style={{ marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#E9BC63', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'vi' ? 'Về Đường Sách' : 'About Book Street'}
                </span>
                <ul style={{ listStyle: 'none', padding: '0.35rem 0 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>
                    <Link
                      to="/hanh-trinh"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <BookOpen size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Giới thiệu chung' : 'General Introduction'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/hanh-trinh#tam-nhin-su-menh"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Compass size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Tầm nhìn và sứ mệnh' : 'Vision & Mission'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/hanh-trinh#history"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <History size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Lịch sử phát triển' : 'History & Growth'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/hanh-trinh#thanh-tuu"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Award size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Thành tích' : 'Achievements'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/hanh-trinh#doi-tac"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Globe size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Đối tác & Hợp tác' : 'Partners & Cooperation'}</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#E9BC63', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'vi' ? 'Tin tức & Hoạt động' : 'News & Activities'}
                </span>
                <ul style={{ listStyle: 'none', padding: '0.35rem 0 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>
                    <Link
                      to="/tin-tuc"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Newspaper size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Tất cả tin tức' : 'All News'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tin-tuc#su-kien"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Calendar size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Sự kiện & Hoạt động' : 'Events & Activities'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tin-tuc#van-hoa-doc"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <BookOpen size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Văn hóa đọc' : 'Reading Culture'}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tin-tuc#thong-cao"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-nav-link-item"
                    >
                      <span className="ticket-item-circle" style={{ width: '32px', height: '32px' }}>
                        <Mail size={14} />
                      </span>
                      <span>{language === 'vi' ? 'Thông cáo báo chí' : 'Press Releases'}</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {navLinksAfterAbout.map((item) => {
                    const isCurrent = activeSection === item.id;
                    const linkHref = item.isRoute ? item.href : (isHomePage ? item.href : `/${item.href}`);

                    return (
                      <li key={item.href}>
                        <Link 
                          to={linkHref}
                          onClick={() => {
                            keepHeaderVisibleDuringNavigation();
                            setMobileMenuOpen(false);
                            if (isHomePage && !item.isRoute) {
                              const targetId = item.href.replace('#', '');
                              const el = document.getElementById(targetId);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }}
                          className={`mobile-nav-link-item${isCurrent ? ' is-current' : ''}`}
                        >
                          <span className="ticket-item-circle" style={{ width: '34px', height: '34px' }}>
                            {item.icon}
                          </span>
                          <span>{language === 'vi' ? item.labelVi : item.labelEn}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
          </div>
        </>,
        document.body,
      )}
    </>
  );
};
