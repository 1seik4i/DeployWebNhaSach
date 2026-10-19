import type { Language } from '../../types';
import './AdminPageHeading.css';

const headings = {
  events: {
    vi: ['Lịch & Quản lý sự kiện', 'Theo dõi lịch tổ chức, đăng ký sự kiện và quản lý các chương trình tại Đường Sách.'],
    en: ['Event Calendar & Management', 'View schedules, register events and manage programs at Book Street.'],
  },
  news: {
    vi: ['Quản lý & Đăng Tải Bài Viết', 'Soạn thảo, chỉnh sửa và đăng tải tin tức, bài viết lên trang công khai.'],
    en: ['News & Articles Publishing', 'Write, edit and publish news and articles on the public website.'],
  },
  map: {
    vi: ['Sơ đồ & Quản lý vị trí gian hàng', 'Cập nhật bản đồ, sắp xếp vị trí gian hàng và địa điểm tổ chức.'],
    en: ['Booth Map & Layout Management', 'Update the map and arrange booth and event location positions.'],
  },
  settings: {
    vi: ['Cài đặt Hệ thống', 'Thiết lập thông tin chung, bảo mật và thông báo của hệ thống.'],
    en: ['System Settings', 'Configure general information, security and system notifications.'],
  },
  notifications: {
    vi: ['Thông báo Quản trị', 'Theo dõi thông báo mới và các cập nhật cần xử lý trong hệ thống.'],
    en: ['Admin Notifications', 'Review new notifications and system updates that need attention.'],
  },
  profile: {
    vi: ['Hồ sơ Quản trị viên', 'Xem và cập nhật thông tin cá nhân, ảnh đại diện và bảo mật tài khoản.'],
    en: ['Administrator Profile', 'View and update your personal details, avatar and account security.'],
  },
} as const;

export function AdminPageHeading({ section, language = 'vi' }: { section: keyof typeof headings; language?: Language }) {
  const [title, description] = headings[section][language];
  return <div className="system-page-heading">
    <h1 className="system-page-title">{title}</h1>
    <p className="system-page-description">{description}</p>
  </div>;
}
