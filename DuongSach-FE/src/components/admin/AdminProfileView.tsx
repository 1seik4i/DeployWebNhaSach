import './AdminProfileView.css';
import { AdminPageHeading } from './AdminPageHeading';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { imageFileError } from '../../utils/fileValidation';
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
      const fileError = imageFileError(file);
      if (fileError) { showToast(fileError); e.target.value = ''; return; }
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
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(formName.trim()) || formName.trim().length < 2 || formName.trim().length > 160) {
      showToast('Họ tên phải có từ 2 đến 160 ký tự và chỉ chứa chữ cái.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim()) || (formPhone.trim() && !/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/.test(formPhone.replace(/[\s.-]/g, '')))) {
      showToast('Email hoặc số điện thoại Việt Nam không hợp lệ.');
      return;
    }
    const initials = formName
      .trim()
      .split(' ')
      .slice(-2)
      .map(w => w.charAt(0).toUpperCase())
      .join('') || profile.avatarInitials;

    try {
      await onUpdateProfile({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.replace(/[\s.-]/g, ''),
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
    <div className="adm-profile-container admin-profile-page">
      <AdminPageHeading section="profile" />
      {saveToast && <div className="admin-profile-toast" role="status"><Check size={16} />{saveToast}</div>}
      <div className="admin-profile-layout">
        <aside className="admin-profile-identity">
          <div className="admin-profile-identity-top">
            <span className="admin-profile-eyebrow">TÀI KHOẢN QUẢN TRỊ</span>
            <div className="admin-profile-avatar">
              {formAvatarUrl || profile.avatarUrl
                ? <img src={formAvatarUrl || profile.avatarUrl} alt={profile.name} />
                : <span>{profile.avatarInitials || 'QT'}</span>}
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Tải ảnh đại diện mới"><Upload size={14} /></button>
              <input type="file" ref={fileInputRef} accept="image/*" hidden onChange={handleAvatarFileChange} />
            </div>
            <h2>{profile.name}</h2>
            <span className="admin-profile-role"><ShieldCheck size={14} />{profile.role || 'Quản trị viên'}</span>
            <p className="admin-profile-department">{profile.department || 'Chưa cập nhật đơn vị'}</p>
          </div>
          <div className="admin-profile-session">
            <span className="admin-profile-active"><i />Đang hoạt động</span>
            <div className="admin-profile-login"><Clock size={15} /><div><span>Đăng nhập gần nhất</span><strong>{profile.lastLogin || '—'}</strong></div></div>
            <p><Shield size={14} />Phiên làm việc được bảo mật</p>
            <button type="button" className="admin-profile-logout" onClick={() => setIsLogoutConfirmOpen(true)}><LogOut size={15} />Đăng xuất</button>
          </div>
        </aside>
        <div className="admin-profile-panels">
          <form className="admin-profile-panel admin-profile-info" onSubmit={handleSaveProfile}>
            <div className="admin-profile-panel-heading">
              <h3><User size={17} />Thông tin cá nhân</h3>
              {isEditing ? <div className="admin-profile-edit-actions"><button type="button" className="adm-btn adm-btn-secondary" onClick={handleCancelEdit}>Hủy</button><button type="submit" className="adm-btn adm-btn-primary"><Check size={14} />Lưu thay đổi</button></div>
                : <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setIsEditing(true)}><Edit3 size={14} />Chỉnh sửa</button>}
            </div>
            <div className="admin-profile-fields">
              <label>Họ và tên<input minLength={2} maxLength={160} value={formName} onChange={e => setFormName(e.target.value)} required disabled={!isEditing} /></label>
              <label>Chức vụ<input value={profile.role || 'Quản trị viên'} disabled /></label>
              <label className="admin-profile-field-wide">Cơ quan / Đơn vị quản lý<div><Building size={15} /><input maxLength={200} value={formDepartment} onChange={e => setFormDepartment(e.target.value)} disabled={!isEditing} placeholder="Chưa cập nhật" /></div></label>
              <label>Email công vụ<div><Mail size={15} /><input type="email" maxLength={200} value={formEmail} onChange={e => setFormEmail(e.target.value)} required disabled={!isEditing} /></div></label>
              <label>Số điện thoại<div><Phone size={15} /><input type="tel" inputMode="tel" maxLength={40} value={formPhone} onChange={e => setFormPhone(e.target.value)} disabled={!isEditing} placeholder="Chưa cập nhật" /></div></label>
            </div>
          </form>
          <div className="admin-profile-bottom-panels">
            <section className="admin-profile-panel admin-profile-security">
              <div className="admin-profile-panel-heading"><h3><Lock size={17} />Bảo mật</h3></div>
              <div className="admin-profile-security-icon"><KeyRound size={22} /></div>
              <strong>Mật khẩu tài khoản</strong>
              <p>Chủ động cập nhật mật khẩu để bảo vệ tài khoản quản trị.</p>
              <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setIsPwdModalOpen(true)}><KeyRound size={14} />Đổi mật khẩu</button>
            </section>
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
                      maxLength={128}
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
                      maxLength={128}
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
                      maxLength={128}
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
