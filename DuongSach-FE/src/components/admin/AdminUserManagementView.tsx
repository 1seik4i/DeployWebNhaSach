import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useMemo } from 'react';
import { apiClient } from '../../services/apiClient';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Lock, 
  Unlock, 
  KeyRound, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  X,
  Clock,
  Mail,
  Phone
} from 'lucide-react';
import { 
  AdminUserAccount, 
  AdminRoleType, 
  AdminAccountStatus 
} from '../../types/admin';

interface AdminUserManagementViewProps {
  users: AdminUserAccount[];
  onAddUser: (user: { fullName: string; email: string; phone?: string; role: AdminRoleType; status: AdminAccountStatus; password: string }) => void | Promise<void>;
  onUpdateUser: (id: string, updates: Partial<AdminUserAccount>) => void | Promise<void>;
  onToggleLock: (id: string, reason?: string) => void | Promise<void>;
  onResetPassword: (user: AdminUserAccount) => void | Promise<void>;
}

export const AdminUserManagementView: React.FC<AdminUserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onToggleLock,
  onResetPassword
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserAccount | null>(null);
  const [lockTargetUser, setLockTargetUser] = useState<AdminUserAccount | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState<AdminUserAccount | null>(null);

  // New user form state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<AdminRoleType>('partner');
  const [newStatus, setNewStatus] = useState<AdminAccountStatus>('active');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useModalBehavior(isAddModalOpen, () => closeAddModal(), isCreating);
  useModalBehavior(Boolean(editingUser), () => setEditingUser(null));
  useModalBehavior(Boolean(lockTargetUser), () => setLockTargetUser(null));
  useModalBehavior(Boolean(resetTargetUser), () => setResetTargetUser(null));

  const closeAddModal = () => {
    if (isCreating) return;
    setNewPassword('');
    setConfirmPassword('');
    setCreateError('');
    setIsAddModalOpen(false);
  };

  // Edit user form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<AdminRoleType>('partner');
  const [editStatus, setEditStatus] = useState<AdminAccountStatus>('active');

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'admin' && u.role !== 'partner') return false;
      const matchesSearch = 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm) ||
        u.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const handleOpenEdit = (user: AdminUserAccount) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const roleMap: Record<AdminRoleType, string> = {
      admin: 'Quản trị viên',
      partner: 'Đối tác / Gian hàng'
    };

    const statusMap: Record<AdminAccountStatus, string> = {
      active: 'Hoạt động',
      locked: 'Bị khóa',
      pending_verification: 'Chờ xác thực'
    };

    await onUpdateUser(editingUser.id, {
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      role: editRole,
      roleLabelVi: roleMap[editRole],
      status: editStatus,
      statusLabelVi: statusMap[editStatus]
    });

    setEditingUser(null);
  };

  const handleOpenAdd = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('partner');
    setNewStatus('active');
    setNewPassword('');
    setConfirmPassword('');
    setCreateError('');
    setIsAddModalOpen(true);
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!newFullName.trim() || !newEmail.trim()) return;
    setCreateError('');
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      setCreateError('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCreateError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setIsCreating(true);
    try {
      await onAddUser({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
        status: newStatus,
        password: newPassword,
      });
      setNewPassword('');
      setConfirmPassword('');
      setIsAddModalOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmLockToggle = async () => {
    if (!lockTargetUser) return;
    await onToggleLock(lockTargetUser.id, lockReason);
    setLockTargetUser(null);
    setLockReason('');
  };

  const handleConfirmReset = async () => {
    if (!resetTargetUser) return;
    await onResetPassword(resetTargetUser);
    setResetTargetUser(null);
  };

  const getRoleBadgeClass = (role: AdminRoleType) => role === 'partner' ? 'badge-role-partner' : 'badge-role-admin';

  const getStatusBadgeClass = (status: AdminAccountStatus) => {
    switch (status) {
      case 'active': return 'badge-status-active';
      case 'locked': return 'badge-status-locked';
      default: return 'badge-status-pending';
    }
  };

  return (
    <div className="adm-users-view">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Quản lý Tài khoản</h1>
          <p className="adm-page-subtitle">
            Quản lý tài khoản quản trị viên và đối tác/gian hàng trên hệ thống.
          </p>
        </div>
        <div className="adm-page-header-actions">
          <button 
            className="adm-btn adm-btn-primary"
            onClick={handleOpenAdd}
          >
            <UserPlus size={16} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card adm-filter-card">
        <div className="adm-filter-bar">
          {/* Search Box */}
          <div className="adm-search-input-wrap">
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adm-filter-search"
            />
            {searchTerm && (
              <button 
                className="adm-search-clear"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="adm-role-tabs">
            {[
              { id: 'all', label: 'Tất cả vai trò' },
              { id: 'admin', label: 'Quản trị viên' },
              { id: 'partner', label: 'Đối tác / Gian hàng' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`adm-tab-pill ${selectedRole === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="adm-select-wrap">
            <Filter size={14} />
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="adm-filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
              <option value="pending_verification">Chờ xác thực</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="adm-card adm-table-card">
        <div className="adm-table-summary">
          <span>Tìm thấy <strong>{filteredUsers.length}</strong> tài khoản phù hợp</span>
        </div>

        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>MÃ & HỌ TÊN</th>
                <th>LIÊN HỆ</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>HOẠT ĐỘNG GẦN NHẤT</th>
                <th className="adm-th-actions">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="adm-table-empty">
                    <AlertCircle size={32} />
                    <p>Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={user.status === 'locked' ? 'adm-row-locked' : ''}>
                    {/* Name & Code */}
                    <td className="adm-td-user">
                      <div className="adm-user-cell">
                        <div className="adm-user-avatar-sm">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="adm-user-avatar-img"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.adm-user-avatar-fallback')) {
                                  const span = document.createElement('span');
                                  span.className = 'adm-user-avatar-fallback';
                                  span.textContent = user.avatarInitials;
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span>{user.avatarInitials}</span>
                          )}
                        </div>
                        <div>
                          <div className="adm-user-name">{user.fullName}</div>
                          <div className="adm-user-code">ID: {user.code}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div className="adm-contact-cell">
                        <div className="adm-contact-item">
                          <Mail size={13} className="adm-contact-icon" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && user.phone.trim() && (
                          <div className="adm-contact-item">
                            <Phone size={13} className="adm-contact-icon" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`adm-badge-role ${getRoleBadgeClass(user.role)}`}>
                        {user.roleLabelVi}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`adm-badge-status ${getStatusBadgeClass(user.status)}`}>
                        <span className="adm-status-dot"></span>
                        {user.statusLabelVi}
                      </span>
                      {user.status === 'locked' && user.lockReason && (
                        <div className="adm-lock-hint" title={user.lockReason}>
                          Lý do: {user.lockReason}
                        </div>
                      )}
                    </td>

                    {/* Last active */}
                    <td>
                      <div className="adm-time-cell">
                        <Clock size={13} />
                        <span>{user.lastActive}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="adm-td-actions">
                      <div className="adm-action-buttons">
                        {/* Edit button */}
                        <button
                          className="adm-icon-btn"
                          title="Chỉnh sửa thông tin"
                          onClick={() => handleOpenEdit(user)}
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Lock / Unlock button */}
                        <button
                          className={`adm-icon-btn ${user.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`}
                          title={user.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          onClick={() => setLockTargetUser(user)}
                        >
                          {user.status === 'locked' ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>

                        {/* Reset password button */}
                        <button
                          className="adm-icon-btn"
                          title="Đặt lại mật khẩu"
                          onClick={() => setResetTargetUser(user)}
                        >
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {isAddModalOpen && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-content">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Thêm tài khoản người dùng mới</h3>
              <button className="adm-modal-close" onClick={closeAddModal} disabled={isCreating} aria-label="Đóng thêm tài khoản">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveNewUser}>
              <div className="adm-modal-body">
                <fieldset disabled={isCreating} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">Họ và tên *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="adm-form-input"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                  />
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Địa chỉ Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="email@domain.com"
                      className="adm-form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="0912 345 678"
                      className="adm-form-input"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Vai trò trong hệ thống</label>
                    <select className="adm-form-select" value={newRole} onChange={(e) => setNewRole(e.target.value as AdminRoleType)}>
                      <option value="partner">Đối tác / Gian hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Trạng thái khởi tạo</label>
                    <select 
                      className="adm-form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as AdminAccountStatus)}
                    >
                      <option value="active">Hoạt động ngay</option>
                      <option value="pending_verification">Chờ xác thực hồ sơ</option>
                      <option value="locked">Tạm khóa</option>
                    </select>
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label" htmlFor="new-user-password">Mật khẩu ban đầu *</label>
                    <input id="new-user-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className="adm-form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} aria-describedby="new-user-password-hint" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label" htmlFor="new-user-confirm-password">Xác nhận mật khẩu *</label>
                    <input id="new-user-confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className="adm-form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <div className="adm-form-hint" id="new-user-password-hint">
                  Mật khẩu có ít nhất 8 ký tự và phải đáp ứng chính sách bảo mật của hệ thống. Admin hoặc Gian hàng có thể tự đổi mật khẩu trong Hồ sơ → Đổi mật khẩu.
                </div>
                </fieldset>
                {createError && <p role="alert" className="adm-form-hint">{createError}</p>}
              </div>

              <div className="adm-modal-footer">
                <button 
                  type="button" 
                  className="adm-btn adm-btn-secondary"
                  onClick={closeAddModal}
                  disabled={isCreating}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={isCreating}>
                  {isCreating ? 'Đang tạo…' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-content">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Chỉnh sửa tài khoản: {editingUser.code}</h3>
              <button className="adm-modal-close" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Họ và tên</label>
                  <input 
                    type="text" 
                    required
                    className="adm-form-input"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Email (Không thể sửa)</label>
                    <input 
                      type="text" 
                      disabled
                      className="adm-form-input adm-input-disabled"
                      value={editingUser.email}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Số điện thoại</label>
                    <input 
                      type="tel" 
                      className="adm-form-input"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Vai trò</label>
                    <select className="adm-form-select" value={editRole} onChange={(e) => setEditRole(e.target.value as AdminRoleType)}>
                      <option value="partner">Đối tác / Gian hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Trạng thái</label>
                    <select 
                      className="adm-form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as AdminAccountStatus)}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="locked">Bị khóa</option>
                      <option value="pending_verification">Chờ xác thực</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="adm-modal-footer">
                <button 
                  type="button" 
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Lock / Unlock User */}
      {lockTargetUser && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-content adm-dialog-content">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">
                {lockTargetUser.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản người dùng'}
              </h3>
              <button className="adm-modal-close" onClick={() => setLockTargetUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal-body">
              {lockTargetUser.status === 'locked' ? (
                <p className="adm-confirm-text">
                  Bạn có chắc chắn muốn mở khóa cho tài khoản <strong>{lockTargetUser.fullName}</strong> ({lockTargetUser.email})? 
                  Người dùng sẽ có thể đăng nhập lại bình thường.
                </p>
              ) : (
                <>
                  <p className="adm-confirm-text">
                    Xác nhận khóa truy cập tài khoản của <strong>{lockTargetUser.fullName}</strong> ({lockTargetUser.email}).
                    Phiên đăng nhập hiện tại sẽ bị hủy hiệu lực ngay lập tức.
                  </p>
                  <div className="adm-form-group" style={{ marginTop: '1rem' }}>
                    <label className="adm-form-label">Lý do khóa tài khoản (Ghi vào Audit log) *</label>
                    <input 
                      type="text"
                      className="adm-form-input"
                      placeholder="Ví dụ: Vi phạm quy định nội dung, nghi ngờ bị chiếm quyền..."
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="adm-modal-footer">
              <button 
                type="button" 
                className="adm-btn adm-btn-secondary"
                onClick={() => setLockTargetUser(null)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className={`adm-btn ${lockTargetUser.status === 'locked' ? 'adm-btn-primary' : 'adm-btn-danger'}`}
                onClick={handleConfirmLockToggle}
              >
                {lockTargetUser.status === 'locked' ? 'Xác nhận mở khóa' : 'Xác nhận khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Reset Password */}
      {resetTargetUser && (
        <div className="adm-modal-overlay">
          <div className="adm-modal-content adm-dialog-content">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Đặt lại mật khẩu</h3>
              <button className="adm-modal-close" onClick={() => setResetTargetUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal-body">
              <p className="adm-confirm-text">
                Hệ thống sẽ tạo yêu cầu đặt lại mật khẩu cho tài khoản <strong>{resetTargetUser.fullName}</strong> và ghi thông báo bảo mật vào cơ sở dữ liệu.
              </p>
              <div className="adm-callout-info">
                <CheckCircle2 size={16} />
                <span>Yêu cầu đặt lại mật khẩu có hiệu lực trong vòng 30 phút.</span>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button 
                type="button" 
                className="adm-btn adm-btn-secondary"
                onClick={() => setResetTargetUser(null)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="adm-btn adm-btn-primary"
                onClick={handleConfirmReset}
              >
                Tạo yêu cầu đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

