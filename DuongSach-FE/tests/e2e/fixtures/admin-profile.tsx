import { createRoot } from 'react-dom/client';
import { AdminProfileView } from '../../../src/components/admin/AdminProfileView';
import '../../../src/components/admin/AdminPortal.css';

createRoot(document.getElementById('root')!).render(
  <div className="admin-app-shell">
    <header className="admin-topbar">Admin</header>
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <aside style={{ width: 260, flexShrink: 0 }} />
      <main className="admin-main-viewport">
        <AdminProfileView profile={{ id: 'admin', name: 'Nguyễn Văn Quản Trị', role: 'Quản trị viên', department: 'Ban quản lý Đường Sách Thành phố Thủ Đức', email: 'admin@duongsachthuduc.vn', phone: '0901234567', avatarInitials: 'QT', lastLogin: '19/10/2026 20:30' }} onUpdateProfile={() => {}} onChangePassword={async () => {}} onLogout={() => {}} />
      </main>
    </div>
  </div>,
);
