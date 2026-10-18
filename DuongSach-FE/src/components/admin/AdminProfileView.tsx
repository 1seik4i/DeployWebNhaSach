import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  Check, 
  Edit3, 
  X, 
  Clock, 
  CheckCircle2, 
  Upload,
  Bell,
  Lock,
  Shield
} from 'lucide-react';
import { AdminProfile } from '../../types/admin';

interface AdminProfileViewProps {
  profile: AdminProfile;
  onUpdateProfile: (updates: Partial<AdminProfile>) => void | Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => void | Promise<unknown>;
  onLogout: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onChangePassword,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(profile.name);
  const [formEmail, setFormEmail] = useState(profile.email);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formDepartment, setFormDepartment] = useState(profile.department);
  const [formAvatarUrl, setFormAvatarUrl] = useState(profile.avatarUrl || '');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification toggles
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [notifyNewUsers, setNotifyNewUsers] = useState(true);
  const [notifyDailyAudit, setNotifyDailyAudit] = useState(true);

  // Change password modal
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Logout confirm
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useModalBehavior(isPwdModalOpen, () => setIsPwdModalOpen(false));
  useModalBehavior(isLogoutConfirmOpen, () => setIsLogoutConfirmOpen(false));

  useEffect(() => {
    setFormName(profile.name);
    setFormEmail(profile.email);
    setFormPhone(profile.phone);
    setFormDepartment(profile.department);
    setFormAvatarUrl(profile.avatarUrl || '');
  }, [profile]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3200);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Dung lượng ảnh tối đa là 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setFormAvatarUrl(result);
        try {
          await onUpdateProfile({ avatarUrl: result });
          showToast('Đã cập nhật ảnh đại diện quản trị viên thành công!');
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const initials = formName
      .trim()
      .split(' ')
      .slice(-2)
      .map(w => w.charAt(0).toUpperCase())
      .join('') || profile.avatarInitials;

    try {
      await onUpdateProfile({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        department: formDepartment.trim(),
        avatarUrl: formAvatarUrl,
        avatarInitials: initials
      });
      setIsEditing(false);
      showToast('Đã lưu thay đổi thông tin quản trị viên thành công!');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu hồ sơ');
    }
  };

  const handleCancelEdit = () => {
    setFormName(profile.name);
    setFormEmail(profile.email);
    setFormPhone(profile.phone);
    setFormDepartment(profile.department);
    setFormAvatarUrl(profile.avatarUrl || '');
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPwd.length < 8) {
      setPwdError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await onChangePassword(currentPwd, newPwd);
      setPwdSuccess(true);
      setTimeout(() => {
        setPwdSuccess(false);
        setIsPwdModalOpen(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        showToast('Đã đổi mật khẩu quản trị viên thành công!');
      }, 1200);
    } catch (error) {
      setPwdError(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
    }
  };

  return (
    <div className="adm-profile-container">
      {/* 1. Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ 
          fontSize: '1.45rem', 
          fontWeight: 700, 
          color: '#13241F', 
          margin: '0 0 0.35rem 0',
          fontFamily: 'var(--font-serif, "Lora", Georgia, serif)',
          letterSpacing: '0.01em'
        }}>
          Hồ sơ Quản trị viên
        </h1>
      </div>

      {saveToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#13241F',
          color: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: 10,
          boxShadow: '0 12px 30px rgba(19, 36, 31, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 9999,
          fontSize: '0.88rem',
          fontWeight: 500,
          borderLeft: '4px solid #E9BC63'
        }}>
          <Check size={16} color="#E9BC63" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 2-Column Balanced Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Summary & Session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 14,
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 0.85rem auto' }}>
              {profile.avatarUrl || formAvatarUrl ? (
                <img
                  src={formAvatarUrl || profile.avatarUrl}
                  alt={profile.name}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #E9BC63',
                    boxShadow: '0 4px 12px rgba(19, 36, 31, 0.12)'
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#13241F',
                  color: '#E9BC63',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid #E9BC63',
                  boxShadow: '0 4px 12px rgba(19, 36, 31, 0.12)'
                }}>
                  {profile.avatarInitials || '—'}
                </div>
              )}
              <label 
                style={{
                  position: 'absolute',
                  bottom: -3,
                  right: -3,
                  background: '#17382E',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  border: '2px solid #FFFFFF'
                }}
                title="Tải ảnh đại diện mới"
              >
                <Upload size={12} />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileChange}
                />
              </label>
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#13241F', margin: '0 0 0.25rem 0' }}>
              {profile.name}
            </h2>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(19, 36, 31, 0.06)',
              color: '#13241F',
              padding: '3px 10px',
              borderRadius: 16,
              fontSize: '0.76rem',
              fontWeight: 600,
              marginBottom: '0.75rem'
            }}>
              <ShieldCheck size={13} color="#B48A3C" />
              <span>{profile.role || '—'}</span>
            </div>

            {profile.department?.trim() && <p style={{ 
              fontSize: '0.82rem', 
              color: '#4B5563', 
              lineHeight: 1.45, 
              margin: '0 0 1rem 0',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              {profile.department}
            </p>}

            {/* Status and metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', fontSize: '0.8rem', color: '#6B7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Trạng thái:</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  color: '#059669', 
                  fontWeight: 600, 
                  fontSize: '0.75rem',
                  background: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></span>
                  Đang hoạt động
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Lần đăng nhập:</span>
                <span style={{ color: '#13241F', fontWeight: 500 }}>{profile.lastLogin || '—'}</span>
              </div>
            </div>
          </div>

          {/* Session / Account Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 14,
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#13241F', margin: '0 0 0.5rem 0' }}>
              Phiên làm việc
            </h3>
            
            <div style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.45, marginBottom: '1rem' }}>
              <div>Trình duyệt hiện tại: <strong>Chrome trên Windows</strong></div>
              <div style={{ marginTop: 2 }}>Kết nối mã hóa phiên an toàn.</div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              style={{
                width: '100%',
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: 7,
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Personal Info, Notification Settings & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minWidth: 0 }}>

          {/* 1. Thông tin cá nhân */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 14,
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} color="#13241F" />
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#13241F', margin: 0 }}>
                  Thông tin cá nhân
                </h3>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={13} />
                  <span>Chỉnh sửa</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '5px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      color: '#4B5563',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: 6,
                      background: '#13241F',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={14} />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form grid */}
            <form onSubmit={handleSaveProfile}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.1rem'
              }}>
                {/* Họ và tên */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 7,
                      border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                      background: isEditing ? '#FFFFFF' : '#F9FAFB',
                      color: '#1F2937',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Chức vụ */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 7,
                      border: '1px solid #E5E7EB',
                      background: '#F9FAFB',
                      color: '#1F2937',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Cơ quan / Tổ chức trực thuộc */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Cơ quan / Đơn vị quản lý
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={e => setFormDepartment(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: 7,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Email tài khoản */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Email công vụ
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: 7,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    Số điện thoại liên hệ
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        borderRadius: 7,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* 2. Cài đặt thông báo quản trị */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 14,
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1.25rem'
            }}>
              <Bell size={18} color="#13241F" />
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#13241F', margin: 0 }}>
                Cài đặt thông báo điều hành & an ninh
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Row 1 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#13241F', marginBottom: 2 }}>
                    Cảnh báo bảo mật & sự cố hệ thống
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    Nhận cảnh báo tức thời khi có đăng nhập bất thường hoặc lỗi phát sinh.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifySecurity(!notifySecurity);
                    showToast('Đã cập nhật tùy chọn thông báo');
                  }}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    backgroundColor: notifySecurity ? '#13241F' : '#D1D5DB',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    border: 'none',
                    padding: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: notifySecurity ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    display: 'block'
                  }} />
                </button>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#13241F', marginBottom: 2 }}>
                    Thông báo người dùng & đối tác đăng ký mới
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    Gửi thông báo khi có tài khoản đối tác hoặc hồ sơ cần phê duyệt.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyNewUsers(!notifyNewUsers);
                    showToast('Đã cập nhật tùy chọn thông báo');
                  }}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    backgroundColor: notifyNewUsers ? '#13241F' : '#D1D5DB',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    border: 'none',
                    padding: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: notifyNewUsers ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    display: 'block'
                  }} />
                </button>
              </div>

              {/* Row 3 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#13241F', marginBottom: 2 }}>
                    Nhận tóm tắt báo cáo kiểm toán qua Email
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    Gửi báo cáo nhật ký hoạt động của toàn bộ hệ thống vào cuối ngày.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyDailyAudit(!notifyDailyAudit);
                    showToast('Đã cập nhật tùy chọn thông báo');
                  }}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    backgroundColor: notifyDailyAudit ? '#13241F' : '#D1D5DB',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    border: 'none',
                    padding: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transform: notifyDailyAudit ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    display: 'block'
                  }} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Bảo mật & Đổi mật khẩu */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 14,
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1.25rem'
            }}>
              <Lock size={18} color="#13241F" />
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#13241F', margin: 0 }}>
                Bảo mật & Đăng nhập
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#13241F', marginBottom: 2 }}>
                  Mật khẩu tài khoản quản trị
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Thay đổi mật khẩu định kỳ để đảm bảo an toàn tuyệt đối cho tài khoản quản trị.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPwdModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 7,
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  color: '#13241F',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <KeyRound size={14} />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Password Change Modal */}
      {isPwdModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#13241F' }}>
                Đổi mật khẩu tài khoản
              </h3>
              <button 
                type="button" 
                onClick={() => setIsPwdModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={18} />
              </button>
            </div>

            {pwdSuccess ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle2 size={44} style={{ color: '#10B981', margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#13241F' }}>Đổi mật khẩu thành công!</h4>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>Mật khẩu mới của bạn đã có hiệu lực.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {pwdError && (
                    <div style={{ color: '#EF4444', fontSize: '0.8rem', background: '#FEF2F2', padding: '8px 12px', borderRadius: 6 }}>
                      {pwdError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                      Mật khẩu hiện tại *
                    </label>
                    <input 
                      type="password"
                      required
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #D1D5DB',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                      Mật khẩu mới (tối thiểu 8 ký tự) *
                    </label>
                    <input 
                      type="password"
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #D1D5DB',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                      Nhập lại mật khẩu mới *
                    </label>
                    <input 
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #D1D5DB',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid #E5E7EB',
                  background: '#F9FAFB'
                }}>
                  <button 
                    type="button" 
                    onClick={() => setIsPwdModalOpen(false)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#4B5563'
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#13241F',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#13241F' }}>
                Xác nhận đăng xuất
              </h3>
              <button 
                type="button" 
                onClick={() => setIsLogoutConfirmOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#4B5563', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn kết thúc phiên làm việc Quản trị viên của <strong>{profile.name}</strong>?
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #E5E7EB',
              background: '#F9FAFB'
            }}>
              <button 
                type="button" 
                onClick={() => setIsLogoutConfirmOpen(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#4B5563'
                }}
              >
                Ở lại
              </button>
              <button 
                type="button" 
                onClick={onLogout}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Đăng xuất ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
