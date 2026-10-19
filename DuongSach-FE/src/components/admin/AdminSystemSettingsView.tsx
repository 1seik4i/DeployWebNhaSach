import { AdminPageHeading } from './AdminPageHeading';
import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Save, 
  RotateCcw, 
  Check, 
  Building, 
  Lock, 
  Mail, 
  Phone,
  Info
} from 'lucide-react';
import { AdminSystemSettings } from '../../types/admin';
import { isSupportPhone, normalizePhone } from '../../utils/inputValidation';

interface AdminSystemSettingsViewProps {
  settings: AdminSystemSettings;
  onSaveSettings: (newSettings: AdminSystemSettings) => void | Promise<void>;
  onResetSettings: () => void;
}

export const AdminSystemSettingsView: React.FC<AdminSystemSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetSettings
}) => {
  const [formData, setFormData] = useState<AdminSystemSettings>({
    general: { ...settings.general },
    security: { ...settings.security },
    notifications: { ...settings.notifications }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGeneralChange = (key: keyof AdminSystemSettings['general'], value: any) => {
    setFormData(prev => ({
      ...prev,
      general: { ...prev.general, [key]: value }
    }));
    setHasChanges(true);
    setSaveToast(false);
  };

  const handleSecurityChange = (key: keyof AdminSystemSettings['security'], value: any) => {
    setFormData(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
    setHasChanges(true);
    setSaveToast(false);
  };

  const handleNotificationChange = (key: keyof AdminSystemSettings['notifications'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    setHasChanges(true);
    setSaveToast(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');
    if (!formData.general.systemName.trim() || !isSupportPhone(formData.general.supportPhone)) {
      setSaveError('Tên hệ thống hoặc số điện thoại hỗ trợ không hợp lệ.'); return;
    }
    setSaving(true);
    try { await onSaveSettings({ ...formData, general: { ...formData.general, systemName: formData.general.systemName.trim(), supportEmail: formData.general.supportEmail.trim(), supportPhone: normalizePhone(formData.general.supportPhone) } }); }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Không thể lưu cài đặt.'); return; }
    finally { setSaving(false); }
    setHasChanges(false);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
    }, 4000);
  };

  const handleReset = () => {
    onResetSettings();
    setFormData({
      general: { ...settings.general },
      security: { ...settings.security },
      notifications: { ...settings.notifications }
    });
    setHasChanges(false);
  };

  return (
    <div className="adm-settings-view">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <AdminPageHeading section="settings" />
        </div>
        <div className="adm-page-header-actions">
          {hasChanges && (
            <button 
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Hủy thay đổi</span>
            </button>
          )}
          <button 
            type="submit"
            form="admin-system-settings"
            className="adm-btn adm-btn-primary"
            disabled={!hasChanges || saving}
          >
            <Save size={16} />
            <span>Lưu cài đặt</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="adm-toast-banner">
          <Check size={16} />
          <span>Đã lưu thành công các cài đặt hệ thống mới. Các cấu hình bảo mật có hiệu lực ngay lập tức.</span>
        </div>
      )}

      {saveError && <p role="alert">{saveError}</p>}
      <form id="admin-system-settings" onSubmit={handleSubmit} className="adm-settings-form">
        {/* Section 1: General Branding */}
        <div className="adm-card adm-settings-card">
          <div className="adm-card-header">
            <div className="adm-card-header-icon">
              <Building size={20} />
            </div>
            <div>
              <h3 className="adm-card-title">Thông tin Nhận diện & Liên hệ Nền tảng</h3>
              <p className="adm-card-subtitle">Hiển thị trên toàn bộ cổng thông tin và các thông báo gửi đến đối tác, độc giả</p>
            </div>
          </div>

          <div className="adm-card-body">
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-form-label">Tên hệ thống</label>
                <input maxLength={200} required
                  type="text"
                  className="adm-form-input"
                  value={formData.general.systemName}
                  onChange={(e) => handleGeneralChange('systemName', e.target.value)}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Khẩu hiệu / Slogan</label>
                <input maxLength={500}
                  type="text"
                  className="adm-form-input"
                  value={formData.general.slogan}
                  onChange={(e) => handleGeneralChange('slogan', e.target.value)}
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-form-label">Email hỗ trợ kỹ thuật</label>
                <input maxLength={254}
                  type="email"
                  className="adm-form-input"
                  value={formData.general.supportEmail}
                  onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Đường dây nóng (Hotline)</label>
                <input maxLength={40}
                  type="text"
                  className="adm-form-input"
                  value={formData.general.supportPhone}
                  onChange={(e) => handleGeneralChange('supportPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Địa chỉ trụ sở điều hành</label>
              <input maxLength={500}
                type="text"
                className="adm-form-input"
                value={formData.general.physicalAddress}
                onChange={(e) => handleGeneralChange('physicalAddress', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Security Policies */}
        <div className="adm-card adm-settings-card">
          <div className="adm-card-header">
            <div className="adm-card-header-icon icon-emerald">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="adm-card-title">Chính sách Bảo mật & Tài khoản</h3>
              <p className="adm-card-subtitle">Quy định độ phức tạp mật khẩu và tự động bảo vệ tài khoản khỏi xâm nhập trái phép</p>
            </div>
          </div>

          <div className="adm-card-body">
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-form-label">Độ dài mật khẩu tối thiểu (ký tự)</label>
                <input maxLength={128} step={1}
                  type="number"
                  min={8}
                  max={64}
                  required
                  className="adm-form-input"
                  value={formData.security.minPasswordLength}
                  onChange={(e) => handleSecurityChange('minPasswordLength', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Giới hạn đăng nhập sai trước khi tự khóa</label>
                <input step={1}
                  type="number"
                  min={3}
                  max={20}
                  required
                  className="adm-form-input"
                  value={formData.security.maxFailedAttempts}
                  onChange={(e) => handleSecurityChange('maxFailedAttempts', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-form-label">Thời gian hết hạn phiên làm việc (Phút)</label>
                <input 
                  type="number"
                  min={5}
                  max={120}
                  step={1}
                  required
                  className="adm-form-input"
                  value={formData.security.sessionTimeoutMinutes}
                  onChange={(e) => handleSecurityChange('sessionTimeoutMinutes', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="adm-form-group">
                <label className="adm-form-label">Xác thực hai bước (2FA bắt buộc với Quản trị viên)</label>
                <div className="adm-toggle-row">
                  <label className="adm-toggle-label">
                    <input 
                      type="checkbox"
                      className="adm-toggle-checkbox"
                      checked={formData.security.twoFactorEnabled}
                      disabled title="Chưa cấu hình dịch vụ xác thực hai bước"
                      onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                    />
                    <span className="adm-toggle-slider"></span>
                  </label>
                  <span className="adm-toggle-status-text">
                    {formData.security.twoFactorEnabled ? 'Bắt buộc xác thực OTP 2FA' : 'Chưa bắt buộc'}
                  </span>
                </div>
              </div>
            </div>

            <div className="adm-setting-toggle-item">
              <div className="adm-setting-toggle-info">
                <span className="adm-setting-toggle-title">Bắt buộc mật khẩu có ký tự đặc biệt & số</span>
                <span className="adm-setting-toggle-desc">Áp dụng cho mọi tài khoản đối tác và ban tổ chức khi khởi tạo hoặc đổi mật khẩu</span>
              </div>
              <label className="adm-toggle-label">
                <input 
                  type="checkbox"
                  className="adm-toggle-checkbox"
                  checked={formData.security.requireSpecialChar}
                  onChange={(e) => handleSecurityChange('requireSpecialChar', e.target.checked)}
                />
                <span className="adm-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="adm-card adm-settings-card">
          <div className="adm-card-header">
            <div className="adm-card-header-icon icon-amber">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="adm-card-title">Cấu hình Thông báo Quản trị</h3>
              <p className="adm-card-subtitle">Kích hoạt các kịch bản gửi email cảnh báo và cập nhật quan trọng</p>
            </div>
          </div>

          <div className="adm-card-body">
            <div className="adm-setting-toggle-item">
              <div className="adm-setting-toggle-info">
                <span className="adm-setting-toggle-title">Gửi email chào mừng khi tạo tài khoản mới</span>
                <span className="adm-setting-toggle-desc">Tự động gửi thông tin đăng nhập và hướng dẫn cho người dùng mới</span>
              </div>
              <label className="adm-toggle-label">
                <input 
                  type="checkbox"
                  className="adm-toggle-checkbox"
                  checked={formData.notifications.sendWelcomeEmail}
                  disabled title="Chưa kết nối nhà cung cấp email"
                  onChange={(e) => handleNotificationChange('sendWelcomeEmail', e.target.checked)}
                />
                <span className="adm-toggle-slider"></span>
              </label>
            </div>

            <div className="adm-setting-toggle-item">
              <div className="adm-setting-toggle-info">
                <span className="adm-setting-toggle-title">Cảnh báo khẩn cấp khi phát hiện đăng nhập sai bất thường</span>
                <span className="adm-setting-toggle-desc">Gửi thông báo tức thì đến quản trị viên khi tài khoản bị khóa do nghi ngờ brute-force</span>
              </div>
              <label className="adm-toggle-label">
                <input 
                  type="checkbox"
                  className="adm-toggle-checkbox"
                  checked={formData.notifications.alertOnFailedLogins}
                  disabled title="Chưa kết nối nhà cung cấp email"
                  onChange={(e) => handleNotificationChange('alertOnFailedLogins', e.target.checked)}
                />
                <span className="adm-toggle-slider"></span>
              </label>
            </div>

            <div className="adm-setting-toggle-item">
              <div className="adm-setting-toggle-info">
                <span className="adm-setting-toggle-title">Thông báo khi có thay đổi ma trận phân quyền</span>
                <span className="adm-setting-toggle-desc">Ghi nhật ký và báo cáo email mỗi khi quyền của bất kỳ vai trò nào bị chỉnh sửa</span>
              </div>
              <label className="adm-toggle-label">
                <input 
                  type="checkbox"
                  className="adm-toggle-checkbox"
                  checked={formData.notifications.notifyRoleChanges}
                  onChange={(e) => handleNotificationChange('notifyRoleChanges', e.target.checked)}
                />
                <span className="adm-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

