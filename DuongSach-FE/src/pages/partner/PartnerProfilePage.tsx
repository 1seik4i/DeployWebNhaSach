import { useModalBehavior } from '../../hooks/useModalBehavior';
import { imageFileError } from '../../utils/fileValidation';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  Check, 
  X, 
  Upload,
  Lock,
  User,
  FileText
} from 'lucide-react';
import { Language, PartnerOrganization } from '../../types';
import { partnerApi } from '../../services/partnerApi';
import './PartnerPages.css';

interface PartnerProfilePageProps {
  language: Language;
  organization: PartnerOrganization;
  onUpdateOrg: (updated: Partial<PartnerOrganization>) => void | Promise<void>;
  onLogout?: () => void;
}

export const PartnerProfilePage: React.FC<PartnerProfilePageProps> = ({
  language,
  organization,
  onUpdateOrg,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(organization.name);
  const [shortDesc, setShortDesc] = useState(organization.shortDesc || '');
  const [address, setAddress] = useState(organization.address || '');
  const [website, setWebsite] = useState(organization.website || '');
  const [repName, setRepName] = useState(organization.representativeName || '');
  const [email, setEmail] = useState(organization.email || '');
  const [phone, setPhone] = useState(organization.phone || '');
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl || '');

  // Change password modal
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Logout confirm modal
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  useModalBehavior(isPwdModalOpen, () => setIsPwdModalOpen(false));
  useModalBehavior(isLogoutConfirmOpen, () => setIsLogoutConfirmOpen(false));

  useEffect(() => {
    setName(organization.name);
    setShortDesc(organization.shortDesc || '');
    setAddress(organization.address || '');
    setWebsite(organization.website || '');
    setRepName(organization.representativeName || '');
    setEmail(organization.email || '');
    setPhone(organization.phone || '');
    setLogoUrl(organization.logoUrl || '');
  }, [organization]);

  const showToast = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3200);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileError = imageFileError(file);
      if (fileError) { showToast(fileError); e.target.value = ''; return; }
      if (file.size > 5 * 1024 * 1024) {
        showToast(language === 'vi' ? 'Dung lượng ảnh tối đa là 5MB' : 'Max image size is 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setLogoUrl(result);
        try {
          await onUpdateOrg({ logoUrl: result });
          showToast(language === 'vi' ? 'Đã cập nhật logo đơn vị thành công!' : 'Logo updated successfully!');
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Không thể cập nhật logo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.replace(/[\s().-]/g, '');
    if (name.trim().length < 2 || repName.trim().length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(repName.trim())) {
      showToast('Tên tổ chức hoặc họ tên người đại diện không hợp lệ');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || (phone.trim() && !/^(?:(?:\+?84|0)(?:[35789]\d{8}|2\d{9})|1[89]00\d{4,6})$/.test(normalizedPhone))) {
      showToast('Email hoặc số điện thoại Việt Nam không hợp lệ');
      return;
    }
    try {
      await onUpdateOrg({
        name: name.trim(),
        shortDesc,
        address,
        website,
        representativeName: repName.trim(),
        phone: normalizedPhone,
        logoUrl
      });
      setIsEditing(false);
      showToast(language === 'vi' ? 'Đã lưu thông tin đơn vị đối tác thành công!' : 'Organization profile updated successfully!');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu hồ sơ');
    }
  };

  const handleCancelEdit = () => {
    setName(organization.name);
    setShortDesc(organization.shortDesc || '');
    setAddress(organization.address || '');
    setWebsite(organization.website || '');
    setRepName(organization.representativeName || '');
    setEmail(organization.email || '');
    setPhone(organization.phone || '');
    setLogoUrl(organization.logoUrl || '');
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 8) {
      setPwdError(language === 'vi' ? 'Mật khẩu mới phải có tối thiểu 8 ký tự.' : 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError(language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    try {
      await partnerApi.changePassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setTimeout(() => {
        setPwdSuccess(false);
        setIsPwdModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast(language === 'vi' ? 'Đã cập nhật mật khẩu đối tác thành công!' : 'Password updated successfully!');
      }, 1200);
    } catch (error) {
      setPwdError(error instanceof Error ? error.message : (language === 'vi' ? 'Không thể cập nhật mật khẩu' : 'Password update failed'));
    }
  };

  const handleDefaultLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('duongsach_partner_auth');
      window.location.href = '/doi-tac/login';
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header */}
      <div className="partner-page-header">
        <div>
        <h1 className="partner-page-title">
          {language === 'vi' ? 'Thông tin gian hàng' : 'Booth Information'}
        </h1>
        <p className="partner-page-sub">
          {language === 'vi' 
            ? 'Quản lý thông tin pháp nhân, người đại diện và cài đặt tài khoản.' 
            : 'Manage legal organization profile, representative contact and partner account settings.'}
        </p>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#13241F',
          color: '#FFFFFF',
          padding: '10px 16px',
          borderRadius: 8,
          boxShadow: '0 12px 30px rgba(19, 36, 31, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 9999,
          fontSize: '0.84rem',
          fontWeight: 500,
          borderLeft: '4px solid #E9BC63'
        }}>
          <Check size={16} color="#E9BC63" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 2-Column Balanced Layout */}
      <div className="partner-profile-layout-grid">
        
        {/* LEFT COLUMN: Summary & Session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Summary Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 12,
            padding: '1.15rem 1.25rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 0.65rem auto' }}>
              {logoUrl || organization.logoUrl ? (
                <img
                  src={logoUrl || organization.logoUrl}
                  alt={organization.name}
                  style={{
                    width: 64,
                    height: 64,
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
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#13241F',
                  color: '#E9BC63',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid #E9BC63',
                  boxShadow: '0 4px 12px rgba(19, 36, 31, 0.12)'
                }}>
                  {organization.name ? organization.name.charAt(0).toUpperCase() : 'P'}
                </div>
              )}
              <label 
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: '#17382E',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  border: '2px solid #FFFFFF'
                }}
                title={language === 'vi' ? 'Tải logo đơn vị mới' : 'Upload new logo'}
              >
                <Upload size={11} />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileChange}
                />
              </label>
            </div>

            <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#13241F', margin: '0 0 0.2rem 0' }}>
              {organization.name}
            </h2>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(19, 36, 31, 0.06)',
              color: '#13241F',
              padding: '2px 8px',
              borderRadius: 14,
              fontSize: '0.72rem',
              fontWeight: 600,
              marginBottom: '0.65rem'
            }}>
              <ShieldCheck size={12} color="#B48A3C" />
              <span>{language === 'vi' ? 'Đối tác Xuất bản / Triển lãm' : 'Publishing & Exhibition Partner'}</span>
            </div>

            <p style={{ 
              fontSize: '0.78rem', 
              color: '#4B5563', 
              lineHeight: 1.4, 
              margin: '0 0 0.75rem 0',
              paddingBottom: '0.65rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              {repName ? `${language === 'vi' ? 'Đại diện' : 'Representative'}: ${repName}` : (language === 'vi' ? 'Đơn vị đối tác chính thức' : 'Official Partner')}
            </p>

            {/* Status and metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', fontSize: '0.78rem', color: '#6B7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  color: '#059669', 
                  fontWeight: 600, 
                  fontSize: '0.72rem',
                  background: '#ECFDF5',
                  padding: '1px 7px',
                  borderRadius: 10
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }}></span>
                  {language === 'vi' ? 'Đã xác thực' : 'Verified'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{language === 'vi' ? 'Lần đăng nhập:' : 'Last Login:'}</span>
                <span style={{ color: '#13241F', fontWeight: 500 }}>{organization.lastActiveAt ? new Date(organization.lastActiveAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }) : (language === 'vi' ? 'Chưa có dữ liệu' : 'No login recorded')}</span>
              </div>
            </div>
          </div>

          {/* Session / Account Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 12,
            padding: '1rem 1.15rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            <h3 style={{ fontSize: '0.86rem', fontWeight: 600, color: '#13241F', margin: '0 0 0.35rem 0' }}>
              {language === 'vi' ? 'Phiên làm việc' : 'Session Management'}
            </h3>
            
            <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.4, marginBottom: '0.75rem' }}>
              <div>{language === 'vi' ? 'Trình duyệt: ' : 'Browser: '}<strong>Chrome trên Windows</strong></div>
              <div style={{ marginTop: 2 }}>{language === 'vi' ? 'Kết nối mã hóa phiên an toàn.' : 'Encrypted secure session.'}</div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'transparent',
                border: '1px solid #EF4444',
                color: '#EF4444',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={13} />
              <span>{language === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Unified Organization & Representative Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2EAE5',
            borderRadius: 12,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(23, 36, 33, 0.03)'
          }}>
            {/* Card Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Building2 size={17} color="#13241F" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#13241F', margin: 0 }}>
                  {language === 'vi' ? 'Thông tin đơn vị đối tác' : 'Organization Information'}
                </h3>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 5, 
                    padding: '4px 11px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={12} />
                  <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={{
                      padding: '4px 10px',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      color: '#4B5563',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit" form="partner-profile-form"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: 6,
                      background: '#13241F',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={13} />
                    <span>{language === 'vi' ? 'Lưu' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form grid */}
            <form id="partner-profile-form" onSubmit={handleSave}>
              <div className="partner-profile-form-grid">
                {/* Tên tổ chức */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Tên tổ chức / Nhà xuất bản' : 'Organization / Publisher Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    required
                    minLength={2}
                    maxLength={200}
                    onChange={e => setName(e.target.value)}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '7px 11px',
                      borderRadius: 6,
                      border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                      background: isEditing ? '#FFFFFF' : '#F9FAFB',
                      color: '#1F2937',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Website chính thức */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Website chính thức' : 'Official Website'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '7px 11px 7px 30px',
                        borderRadius: 6,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Họ tên đại diện */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Họ và tên người đại diện' : 'Representative Name'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      value={repName}
                      required
                      minLength={2}
                      maxLength={160}
                      onChange={e => setRepName(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '7px 11px 7px 30px',
                        borderRadius: 6,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Email đối tác */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Email đối tác' : 'Contact Email'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      title={language === 'vi' ? 'Chỉ Admin được thay đổi email.' : 'Only an admin can change this email.'}
                      style={{
                        width: '100%',
                        padding: '7px 11px 7px 30px',
                        borderRadius: 6,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Số điện thoại liên hệ' : 'Contact Phone'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="tel"
                      value={phone}
                      inputMode="tel"
                      onChange={e => setPhone(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '7px 11px 7px 30px',
                        borderRadius: 6,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Địa chỉ trụ sở */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Địa chỉ trụ sở' : 'Headquarters Address'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      value={address}
                      maxLength={1000}
                      onChange={e => setAddress(e.target.value)}
                      disabled={!isEditing}
                      style={{
                        width: '100%',
                        padding: '7px 11px 7px 30px',
                        borderRadius: 6,
                        border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                        background: isEditing ? '#FFFFFF' : '#F9FAFB',
                        color: '#1F2937',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Mô tả tổ chức */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {language === 'vi' ? 'Mô tả giới thiệu đơn vị' : 'Organization Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={shortDesc}
                    maxLength={5000}
                    onChange={e => setShortDesc(e.target.value)}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '7px 11px',
                      borderRadius: 6,
                      border: isEditing ? '1px solid #13241F' : '1px solid #E5E7EB',
                      background: isEditing ? '#FFFFFF' : '#F9FAFB',
                      color: '#1F2937',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                      resize: isEditing ? 'vertical' : 'none'
                    }}
                  />
                </div>
              </div>
            </form>

            {/* Embedded Security & Password Row */}
            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '0.85rem',
              marginTop: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={15} color="#4B5563" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#13241F' }}>
                    {language === 'vi' ? 'Bảo mật & Mật khẩu đối tác' : 'Security & Credentials'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                    {language === 'vi' ? 'Đổi mật khẩu định kỳ để bảo vệ quyền quản trị.' : 'Change password to safeguard account.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPwdModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  color: '#13241F',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#13241F';
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <KeyRound size={13} />
                <span>{language === 'vi' ? 'Đổi mật khẩu' : 'Change Password'}</span>
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
                {language === 'vi' ? 'Đổi mật khẩu đối tác' : 'Change Partner Password'}
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
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#13241F' }}>
                  {language === 'vi' ? 'Đổi mật khẩu thành công!' : 'Password updated successfully!'}
                </h4>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>
                  {language === 'vi' ? 'Mật khẩu mới của bạn đã có hiệu lực.' : 'Your new password is now active.'}
                </p>
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
                      {language === 'vi' ? 'Mật khẩu hiện tại *' : 'Current Password *'}
                    </label>
                    <input maxLength={128}
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
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
                      {language === 'vi' ? 'Mật khẩu mới (tối thiểu 8 ký tự) *' : 'New Password (min 8 chars) *'}
                    </label>
                    <input maxLength={128}
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                      {language === 'vi' ? 'Nhập lại mật khẩu mới *' : 'Confirm New Password *'}
                    </label>
                    <input maxLength={128}
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
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
                    {language === 'vi' ? 'Cập nhật mật khẩu' : 'Update Password'}
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
                {language === 'vi' ? 'Xác nhận đăng xuất' : 'Confirm Logout'}
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
                {language === 'vi' 
                  ? `Bạn có chắc chắn muốn kết thúc phiên làm việc của đối tác ${organization.name}?`
                  : `Are you sure you want to end the session for partner ${organization.name}?`}
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
                {language === 'vi' ? 'Ở lại' : 'Stay'}
              </button>
              <button 
                type="button" 
                onClick={handleDefaultLogout}
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
                {language === 'vi' ? 'Đăng xuất ngay' : 'Logout now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
