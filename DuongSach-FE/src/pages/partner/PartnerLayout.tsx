import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Store, 
  Layers, 
  BarChart3, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  BookOpen,
  ChevronDown,
  QrCode
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Language, PartnerOrganization, PartnerNotification } from '../../types';
import { RoleSidebar } from '../../components/ui/RoleSidebar';
import './PartnerLayout.css';

interface PartnerLayoutProps {
  language: Language;
  organization: PartnerOrganization;
  unreadNotificationsCount?: number;
  notifications?: PartnerNotification[];
  onMarkAllAsRead?: () => void;
  onMarkItemAsRead?: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({
  language,
  organization,
  unreadNotificationsCount = 0,
  notifications = [],
  onMarkAllAsRead,
  onMarkItemAsRead,
  onLogout,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Close popups on click outside or Esc
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.partner-notif-menu') && !target.closest('.partner-user-menu')) {
        setNotifDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      path: '/partner',
      exact: true,
      labelVi: 'Tổng quan',
      labelEn: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'events',
      path: '/partner/events',
      labelVi: 'Lịch sự kiện',
      labelEn: 'Event Calendar',
      icon: <CalendarDays size={18} />,
    },
    {
      id: 'booths',
      path: '/partner/booths',
      labelVi: 'Quản lý gian hàng',
      labelEn: 'Booth Management',
      icon: <Store size={18} />,
    },
    {
      id: 'activities',
      path: '/partner/activities',
      labelVi: 'Quản lý hoạt động',
      labelEn: 'Activity Management',
      icon: <Layers size={18} />,
    },
    {
      id: 'books',
      path: '/partner/books',
      labelVi: 'Quản lý sách',
      labelEn: 'Book Management',
      icon: <BookOpen size={18} />,
    },
    {
      id: 'reports',
      path: '/partner/reports',
      labelVi: 'Báo cáo & Thống kê',
      labelEn: 'Reports',
      icon: <BarChart3 size={18} />,
    },
    {
      id: 'notifications',
      path: '/partner/notifications',
      labelVi: 'Thông báo',
      labelEn: 'Notifications',
      icon: <Bell size={18} />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined
    },
    {
      id: 'profile',
      path: '/partner/profile',
      labelVi: 'Hồ sơ tài khoản',
      labelEn: 'Profile',
      icon: <User size={18} />,
    },
  ];

  const isNavActive = (itemPath: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === itemPath || location.pathname === itemPath + '/';
    }
    return location.pathname.startsWith(itemPath);
  };


  const latestNotifications = notifications.slice(0, 4);

  return (
    <div className="partner-app-shell">
      {/* 1. TOP HEADER (Dark Forest Teal bar matching sketch) */}
      <header className="partner-top-bar">
        <div className="top-bar-left">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="partner-mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand Logo */}
          <Link to="/partner" className="partner-brand">
            <div className="partner-brand-icon" style={{ padding: '2px', background: '#FFFFFF', borderRadius: '50%', overflow: 'hidden' }}>
              <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div className="partner-brand-text">
              <span className="brand-main">ĐƯỜNG SÁCH</span>
              <span className="brand-sub">TP.HCM • PARTNER</span>
            </div>
          </Link>
        </div>

        <div className="top-bar-right">
  {/* Notifications Bell Dropdown */}
          <div className="partner-notif-menu">
            <button 
              type="button"
              className={`partner-icon-btn ${notifDropdownOpen ? 'is-active' : ''}`}
              title={language === 'vi' ? 'Thông báo mới' : 'Notifications'}
              aria-label="Thông báo"
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserDropdownOpen(false);
              }}
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && <span className="partner-notif-dot"></span>}
            </button>

            {notifDropdownOpen && (
              <div className="partner-notif-dropdown-popover">
                <div className="notif-dropdown-header">
                  <strong className="notif-header-title-text">{language === 'vi' ? 'Thông báo mới nhất' : 'Recent Notifications'}</strong>
                  <div className="notif-header-center">
                    {unreadNotificationsCount > 0 && (
                      <span className="notif-unread-badge">
                        {unreadNotificationsCount} {language === 'vi' ? 'mới' : 'new'}
                      </span>
                    )}
                  </div>
                  <div className="notif-header-right">
                    {unreadNotificationsCount > 0 && onMarkAllAsRead ? (
                      <button 
                        type="button"
                        className="notif-mark-read-btn"
                        onClick={() => onMarkAllAsRead()}
                      >
                        {language === 'vi' ? 'Đã đọc tất cả' : 'Mark all read'}
                      </button>
                    ) : (
                      <span style={{ width: '60px' }}></span>
                    )}
                  </div>
                </div>

                <div className="notif-dropdown-list">
                  {latestNotifications.length === 0 ? (
                    <div className="notif-dropdown-empty">
                      <Bell size={24} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                      <p>{language === 'vi' ? 'Không có thông báo nào' : 'No notifications'}</p>
                    </div>
                  ) : (
                    latestNotifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`notif-dropdown-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          if (!notif.isRead && onMarkItemAsRead) {
                            onMarkItemAsRead(notif.id);
                          }
                          if (notif.link) {
                            setNotifDropdownOpen(false);
                            navigate(notif.link);
                          }
                        }}
                      >
                        <div className="notif-item-indicator">
                          {!notif.isRead && <span className="notif-blue-dot"></span>}
                        </div>
                        <div className="notif-item-content">
                          <h4 className="notif-item-title">{notif.title}</h4>
                          <span className="notif-item-time">{notif.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="notif-dropdown-footer">
                  <Link 
                    to="/partner/notifications" 
                    className="notif-view-all-link"
                    onClick={() => setNotifDropdownOpen(false)}
                  >
                    {language === 'vi' ? 'Xem tất cả thông báo →' : 'View all notifications →'}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule Dropdown */}
          <div className="partner-user-menu">
            <button
              type="button"
              className="partner-user-pill"
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifDropdownOpen(false);
              }}
            >
              <div className="partner-avatar-circle">
                {organization.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'ĐT'}
              </div>
              <div className="partner-info-text">
                <span className="partner-name">{organization.name}</span>
                <span className="partner-role">{language === 'vi' ? 'Đối tác / Đơn vị triển lãm' : 'Partner'}</span>
              </div>
              <ChevronDown size={14} className="user-chevron" />
            </button>

            {userDropdownOpen && (
              <div className="partner-dropdown-popover">
                <div className="dropdown-partner-header">
                  <strong>{organization.name}</strong>
                  <small>{organization.email}</small>
                </div>
                <div className="dropdown-divider"></div>
                <Link 
                  to="/partner/profile" 
                  className="dropdown-item"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <User size={15} />
                  <span>{language === 'vi' ? 'Thông tin tổ chức' : 'Organization Info'}</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="dropdown-item logout"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} />
                  <span>{language === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: LEFT SIDEBAR + MAIN CONTENT AREA */}
      <div className="partner-body-container">
        <RoleSidebar
          ariaLabel="Điều hướng đối tác"
          roleLabel={language === 'vi' ? 'Đối tác' : 'Partner'}
          editionLabel={language === 'vi' ? 'Cổng Đối tác 2026' : 'Partner Portal 2026'}
          items={navItems.map(item => ({ id: item.id, icon: item.icon, label: language === 'vi' ? item.labelVi : item.labelEn, badge: item.badge }))}
          activeId={navItems.find(item => isNavActive(item.path, item.exact))?.id || 'dashboard'}
          isOpenMobile={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onSelect={id => {
            const item = navItems.find(navItem => navItem.id === id);
            if (item) navigate(item.path);
          }}
          userProfile={{
            name: organization.name,
            subtitle: language === 'vi' ? 'Đối tác / Đơn vị triển lãm' : 'Partner',
            avatar: organization.logoUrl,
            onProfileClick: () => navigate('/partner/profile'),
            onLogout: onLogout,
            logoutLabel: language === 'vi' ? 'Đăng xuất' : 'Sign Out'
          }}
        />

        {/* Main Routed Page Content */}
        <main className="partner-main-viewport">
          {children}
        </main>
      </div>
    </div>
  );
};

