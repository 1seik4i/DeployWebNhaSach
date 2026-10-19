import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Sparkles,
  Store,
  Map,
  Building2,
  Package,
  BookOpen,
  BarChart3,
  MessageSquare,
  Users,
  ShieldCheck,
  Settings,
  Bell,
  User,
  Sliders,
  Globe,
  Newspaper,
  ClipboardList
} from 'lucide-react';
import { Language } from '../../types';
import { AdminProfile } from '../../types/admin';
import { RoleSidebar, RoleSidebarItem } from '../ui/RoleSidebar';

import type { AdminTab } from '../../utils/adminNavigation';
export type { AdminTab } from '../../utils/adminNavigation';

export interface AdminSidebarProps {
  language: Language;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  unreadNotificationsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  profile?: AdminProfile;
  onOpenProfile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  language,
  activeTab,
  onSelectTab,
  unreadNotificationsCount = 2,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
  profile,
  onOpenProfile
}) => {
  const isVi = language === 'vi';

  const navItems: RoleSidebarItem[] = [
    // 1. Tổng quan
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={18} />,
      label: isVi ? 'Tổng quan' : 'Dashboard'
    },
    {
      id: 'traffic',
      icon: <BarChart3 size={18} />,
      label: isVi ? 'Thống kê truy cập' : 'Visitor analytics'
    },

    // 2. Nhóm Sự kiện & Hoạt động (Sổ xuống)
    {
      id: 'events-group',
      icon: <Calendar size={18} />,
      label: isVi ? 'Sự kiện & Hoạt động' : 'Events & Activities',
      children: [
        {
          id: 'events',
          icon: <CalendarDays size={15} />,
          label: isVi ? 'Lịch & Sự kiện' : 'Events Management'
        },
        {
          id: 'event-suggestions',
          icon: <MessageSquare size={15} />,
          label: isVi ? 'Đề xuất sự kiện' : 'Event suggestions'
        },
        {
          id: 'event-applications',
          icon: <ClipboardList size={15} />,
          label: isVi ? 'Đơn tham gia sự kiện' : 'Event Applications'
        },
        {
          id: 'activities',
          icon: <Sparkles size={15} />,
          label: isVi ? 'Hoạt động & Tọa đàm' : 'Activities & Workshops'
        },
        {
          id: 'landing-news',
          icon: <Newspaper size={15} />,
          label: isVi ? 'Tin tức & Hoạt động' : 'News & Activities'
        }
      ]
    },

    // 3. Nhóm Mặt bằng, Gian hàng & Thư viện (Sổ xuống)
    {
      id: 'facilities-group',
      icon: <Store size={18} />,
      label: isVi ? 'Mặt bằng & Gian hàng' : 'Booths & Facilities',
      children: [
        {
          id: 'booth-map',
          icon: <Map size={15} />,
          label: isVi ? 'Sơ đồ gian hàng' : 'Interactive Map'
        },
        {
          id: 'booths',
          icon: <Store size={15} />,
          label: isVi ? 'Danh mục gian hàng' : 'Booth Catalog'
        },
        {
          id: 'venues',
          icon: <Building2 size={15} />,
          label: isVi ? 'Địa điểm tổ chức' : 'Venues'
        },
        {
          id: 'assets',
          icon: <Package size={15} />,
          label: isVi ? 'Thiết bị & Cơ sở' : 'Assets & Equipment'
        },
        {
          id: 'library',
          icon: <BookOpen size={15} />,
          label: isVi ? 'Thư viện số' : 'Digital Library'
        }
      ]
    },

    // 4. Nhóm Báo cáo & Ý kiến độc giả (Sổ xuống)
    {
      id: 'analytics-group',
      icon: <BarChart3 size={18} />,
      label: isVi ? 'Báo cáo & Đóng góp' : 'Reports & Feedback',
      children: [
        {
          id: 'reports',
          icon: <BarChart3 size={15} />,
          label: isVi ? 'Báo cáo & Thống kê' : 'Reports & Analytics'
        },
        {
          id: 'feedback',
          icon: <MessageSquare size={15} />,
          label: isVi ? 'Ý kiến đóng góp' : 'Feedback'
        },
        {
          id: 'audit',
          icon: <ClipboardList size={15} />,
          label: isVi ? 'Nhật ký hệ thống' : 'Audit Logs'
        }
      ]
    },

    // 5. Quản lý Nội dung Trang (Sổ xuống: Về đường sách, Bộ máy tổ chức)
    {
      id: 'landing-group',
      icon: <Globe size={18} />,
      label: isVi ? 'Quản lý Nội dung Trang' : 'Landing Page Content',
      children: [
        {
          id: 'landing-journey',
          icon: <BookOpen size={15} />,
          label: isVi ? 'Về Đường Sách' : 'About Book Street'
        },
        {
          id: 'landing-org',
          icon: <Users size={15} />,
          label: isVi ? 'Bộ Máy Tổ Chức' : 'Organization Structure'
        }
      ]
    },

    // 5. Nhóm Người dùng & Phân quyền (Sổ xuống)
    {
      id: 'users-group',
      icon: <Users size={18} />,
      label: isVi ? 'Tài khoản & Phân quyền' : 'Users & Access',
      children: [
        {
          id: 'users',
          icon: <Users size={15} />,
          label: isVi ? 'Quản lý người dùng' : 'User Accounts'
        },
        {
          id: 'roles',
          icon: <ShieldCheck size={15} />,
          label: isVi ? 'Vai trò & Phân quyền' : 'Roles & Permissions'
        }
      ]
    },

    // 6. Nhóm Hệ thống & Hồ sơ cá nhân (Sổ xuống)
    {
      id: 'system-group',
      icon: <Settings size={18} />,
      label: isVi ? 'Cài đặt & Tài khoản' : 'System & Profile',
      children: [
        {
          id: 'settings',
          icon: <Sliders size={15} />,
          label: isVi ? 'Cài đặt hệ thống' : 'System Settings'
        },
        {
          id: 'notifications',
          icon: <Bell size={15} />,
          label: isVi ? 'Thông báo' : 'Notifications',
          badge: unreadNotificationsCount
        },
        {
          id: 'profile',
          icon: <User size={15} />,
          label: isVi ? 'Hồ sơ Quản trị' : 'Admin Profile'
        }
      ]
    }
  ];

  return (
    <RoleSidebar
      ariaLabel="Điều hướng quản trị viên"
      roleLabel={isVi ? 'Quản trị viên' : 'Administrator'}
      editionLabel={isVi ? 'Cổng Quản trị 2026' : 'Admin Portal 2026'}
      items={navItems}
      activeId={activeTab}
      isOpenMobile={isOpenMobile}
      onCloseMobile={onCloseMobile}
      onSelect={id => onSelectTab(id as AdminTab)}
      userProfile={{
        name: profile?.name || (isVi ? 'Quản Trị Viên Hệ Thống' : 'System Administrator'),
        subtitle: 'System Admin',
        avatar: profile?.avatarUrl,
        onProfileClick: () => {
          if (onOpenProfile) {
            onOpenProfile();
          } else {
            onSelectTab('profile');
          }
          onCloseMobile?.();
        },
        onLogout: onLogout,
        logoutLabel: isVi ? 'Đăng xuất' : 'Sign Out'
      }}
    />
  );
};
