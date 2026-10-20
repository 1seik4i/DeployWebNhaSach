import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useMemo } from 'react';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { matchesSearch } from '../../utils/inputValidation';
import { apiClient } from '../../services/apiClient';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Lock, 
  Unlock, 
  KeyRound, 
  Edit3, 
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
  initialSearch?: string;
  users: AdminUserAccount[];
  onAddUser: (user: { fullName: string; email: string; phone?: string; role: AdminRoleType; status: AdminAccountStatus; password: string }) => void | Promise<void>;
  onUpdateUser: (id: string, updates: Partial<AdminUserAccount>) => void | Promise<void>;
  onToggleLock: (id: string, reason?: string) => void | Promise<void>;
  onResetPassword: (user: AdminUserAccount, newPassword: string) => void | Promise<void>;
}

export const AdminUserManagementView: React.FC<AdminUserManagementViewProps> = ({
  initialSearch = '',
  users,
  onAddUser,
  onUpdateUser,
  onToggleLock,
  onResetPassword
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserAccount | null>(null);
  const [lockTargetUser, setLockTargetUser] = useState<AdminUserAccount | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [resetTargetUser, setResetTargetUser] = useState<AdminUserAccount | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState('');
  const closeResetModal = () => {
    if (isResetting) return;
    setResetTargetUser(null);
    setResetPassword('');
    setResetConfirmation('');
    setResetError('');
  };

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
  useModalBehavior(Boolean(resetTargetUser), closeResetModal, isResetting);

  const closeAddModal = () => {
    if (isCreating) return;
    setNewPassword('');
    setConfirmPassword('');
    setCreateError('');
    setIsAddModalOpen(false);
  };

  // Edit user form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState('');
  const nameValid = (value: string) => /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(value.trim()) && value.trim().length >= 2 && value.trim().length <= 160;
  const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 200;
  const phoneValid = (value: string) => !value.trim() || /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/.test(value.replace(/[\s.-]/g, ''));
  const [editRole, setEditRole] = useState<AdminRoleType>('partner');
  const [editStatus, setEditStatus] = useState<AdminAccountStatus>('active');

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'admin' && u.role !== 'partner') return false;
      const matchesQuery = matchesSearch(searchTerm, u.fullName, u.email, u.phone, u.code, u.id);
      
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);
  const pagination = useListPagination(filteredUsers, `${searchTerm}:${selectedRole}:${selectedStatus}`);

  const handleOpenEdit = (user: AdminUserAccount) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditError('');
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!nameValid(editFullName) || !emailValid(editEmail) || !phoneValid(editPhone)) {
      setEditError('Vui lòng kiểm tra họ tên, email và số điện thoại Việt Nam.');
      return;
    }

    const roleMap: Record<AdminRoleType, string> = {
      admin: 'Quản trị viên',
      partner: 'Đối tác / Gian hàng'
    };

    const statusMap: Record<AdminAccountStatus, string> = {
      active: 'Hoạt động',
      locked: 'Bị khóa',
      pending_verification: 'Chờ xác thực'
    };

    try { await onUpdateUser(editingUser.id, {
      fullName: editFullName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.replace(/[\s.-]/g, ''),
      role: editRole,
      roleLabelVi: roleMap[editRole],
      status: editStatus,
      statusLabelVi: statusMap[editStatus]
    }); setEditingUser(null); } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.');
    }
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
    if (!nameValid(newFullName) || !emailValid(newEmail) || !phoneValid(newPhone)) {
      setCreateError('Vui lòng kiểm tra họ tên, email và số điện thoại Việt Nam.');
      return;
    }
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
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.replace(/[\s.-]/g, ''),
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
    if (lockTargetUser.status !== 'locked' && !lockReason.trim()) return;
    await onToggleLock(lockTargetUser.id, lockReason);
    setLockTargetUser(null);
    setLockReason('');
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetTargetUser || isResetting) return;
    setResetError('');
    if (resetPassword.length < 8 || new TextEncoder().encode(resetPassword).length > 72) {
      setResetError('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.');
      return;
    }
    if (resetPassword !== resetConfirmation) {
      setResetError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setIsResetting(true);
    try {
      await onResetPassword(resetTargetUser, resetPassword);
      setPasswordNotice(`Đã đổi mật khẩu cho tài khoản ${resetTargetUser.fullName}.`);
      setResetTargetUser(null);
      setResetPassword('');
      setResetConfirmation('');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsResetting(false);
    }
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
      {passwordNotice && <div className="adm-toast-banner" role="status">{passwordNotice}</div>}
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
            <input maxLength={200}
              type="text"
              placeholder="Tìm theo tên, email, SĐT hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="adm-filter-search"
            />
            {searchTerm && (
              <button 
                type="button"
                className="adm-search-clear"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Tabs (Segmented Control on mobile) */}
          <div className="adm-role-tabs">
            {[
              { id: 'all', label: 'Tất cả vai trò', shortLabel: 'Tất cả' },
              { id: 'admin', label: 'Quản trị viên', shortLabel: 'Quản trị' },
              { id: 'partner', label: 'Đối tác / Gian hàng', shortLabel: 'Đối tác' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`adm-tab-pill ${selectedRole === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(tab.id)}
              >
                <span className="adm-tab-label-full">{tab.label}</span>
                <span className="adm-tab-label-short">{tab.shortLabel}</span>
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
      <div className="adm-card adm-table-card adm-user-table-card">
        <div className="adm-table-summary">
          <span>Tìm thấy <strong>{filteredUsers.length}</strong> tài khoản phù hợp</span>
        </div>

        {/* Desktop Table */}
        <div className="adm-table-responsive adm-user-desktop-table">
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
                pagination.items.map((user) => (
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
                          <div className="adm-user-name" title={user.fullName}>{user.fullName}</div>
                          <div className="adm-user-code" title={user.id}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div className="adm-contact-cell">
                        <div className="adm-contact-item">
                          <Mail size={13} className="adm-contact-icon" />
                          <span title={user.email}>{user.email}</span>
                        </div>
                        {user.phone && user.phone.trim() && (
                          <div className="adm-contact-item">
                            <Phone size={13} className="adm-contact-icon" />
                            <span title={user.phone}>{user.phone}</span>
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
                          title="Đổi mật khẩu"
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

        {/* Mobile Cards View */}
        <div className="adm-user-mobile-cards">
          {filteredUsers.length === 0 ? (
            <div className="adm-table-empty">
              <AlertCircle size={32} />
              <p>Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            pagination.items.map((user) => (
              <div key={user.id} className={`adm-user-mobile-card ${user.status === 'locked' ? 'adm-row-locked' : ''}`}>
                <div className="adm-user-card-top">
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
                      <div className="adm-user-name" title={user.fullName}>{user.fullName}</div>
                      <div className="adm-user-code" title={user.id}>ID: {user.id}</div>
                    </div>
                  </div>
                  <div className="adm-user-badges-wrap">
                    <span className={`adm-badge-role ${getRoleBadgeClass(user.role)}`}>
                      {user.roleLabelVi}
                    </span>
                    <span className={`adm-badge-status ${getStatusBadgeClass(user.status)}`}>
                      <span className="adm-status-dot"></span>
                      {user.statusLabelVi}
                    </span>
                  </div>
                </div>

                <div className="adm-user-card-body">
                  <div className="adm-contact-cell">
                    <div className="adm-contact-item">
                      <Mail size={13} className="adm-contact-icon" />
                      <span title={user.email}>{user.email}</span>
                    </div>
                    {user.phone && user.phone.trim() && (
                      <div className="adm-contact-item">
                        <Phone size={13} className="adm-contact-icon" />
                        <span title={user.phone}>{user.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="adm-time-cell">
                    <Clock size={12} />
                    <span>Hoạt động: {user.lastActive}</span>
                  </div>
                  {user.status === 'locked' && user.lockReason && (
                    <div className="adm-lock-hint" title={user.lockReason}>
                      Lý do: {user.lockReason}
                    </div>
                  )}
                </div>

                <div className="adm-user-card-footer">
                  <button
                    className="adm-card-action-btn"
                    onClick={() => handleOpenEdit(user)}
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit3 size={14} />
                    <span>Sửa</span>
                  </button>
                  <button
                    className={`adm-card-action-btn ${user.status === 'locked' ? 'btn-unlock' : 'btn-lock'}`}
                    onClick={() => setLockTargetUser(user)}
                    title={user.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                  >
                    {user.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                    <span>{user.status === 'locked' ? 'Mở khóa' : 'Khóa'}</span>
                  </button>
                  <button
                    className="adm-card-action-btn btn-key"
                    onClick={() => setResetTargetUser(user)}
                    title="Đổi mật khẩu"
                  >
                    <KeyRound size={14} />
                    <span>Đổi MK</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi />

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
                    minLength={2}
                    maxLength={160}
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
                      maxLength={200}
                      className="adm-form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Số điện thoại</label>
                    <input maxLength={40}
                      type="tel" 
                      placeholder="0912 345 678"
                      inputMode="tel"
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
              <h3 className="adm-modal-title">Chỉnh sửa tài khoản: {editingUser.id}</h3>
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
                    minLength={2}
                    maxLength={160}
                    className="adm-form-input"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-form-label" htmlFor="admin-edit-user-email">Email</label>
                    <input 
                      id="admin-edit-user-email"
                      type="email"
                      required
                      maxLength={200}
                      className="adm-form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                    {editError && <p role="alert">{editError}</p>}
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Số điện thoại</label>
                    <input maxLength={40}
                      type="tel" 
                      inputMode="tel"
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
                {editError && <p role="alert" className="adm-form-hint">{editError}</p>}
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
                    <input maxLength={2000}
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
                disabled={lockTargetUser.status !== 'locked' && !lockReason.trim()}
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
          <form className="adm-modal-content adm-dialog-content" onSubmit={handleConfirmReset}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Đổi mật khẩu</h3>
              <button type="button" className="adm-modal-close" disabled={isResetting} onClick={closeResetModal}>
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal-body">
              <p className="adm-confirm-text">
                Nhập mật khẩu mới cho tài khoản <strong>{resetTargetUser.fullName}</strong>.
              </p>
              <div className="adm-form-group">
                <label htmlFor="admin-reset-password">Mật khẩu mới</label>
                <input id="admin-reset-password" className="adm-form-input" type="password" autoComplete="new-password" required minLength={8} value={resetPassword} disabled={isResetting} onChange={e => setResetPassword(e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label htmlFor="admin-reset-confirmation">Xác nhận mật khẩu mới</label>
                <input id="admin-reset-confirmation" className="adm-form-input" type="password" autoComplete="new-password" required value={resetConfirmation} disabled={isResetting} onChange={e => setResetConfirmation(e.target.value)} />
              </div>
              {resetError && <p className="adm-error-text" role="alert">{resetError}</p>}
            </div>
            <div className="adm-modal-footer">
              <button 
                type="button" 
                className="adm-btn adm-btn-secondary"
                onClick={closeResetModal}
                disabled={isResetting}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="adm-btn adm-btn-primary"
                disabled={isResetting}
              >
                {isResetting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

