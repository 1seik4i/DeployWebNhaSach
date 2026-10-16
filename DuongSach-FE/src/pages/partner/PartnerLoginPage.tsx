import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Language } from '../../types';
import { authApi } from '../../services/authApi';
import './PartnerLoginPage.css';

interface PartnerLoginPageProps {
  language: Language;
  onLoginSuccess: () => void;
}

export const PartnerLoginPage: React.FC<PartnerLoginPageProps> = ({
  language,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg(language === 'vi' ? 'Vui lòng nhập tài khoản và mật khẩu' : 'Please enter credentials');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login({
        email: username.trim(),
        password: password,
      });

      const { user, accessToken, refreshToken } = res;
      if (user.primaryRole !== 'partner') {
        throw new Error(language === 'vi' ? 'Tài khoản không thuộc vai trò Đối tác/Gian hàng' : 'Unauthorized for Partner Portal');
      }

      sessionStorage.removeItem('duongsach_admin_auth_v1');

      sessionStorage.setItem('duongsach_token', accessToken);
      sessionStorage.setItem('duongsach_refresh_token', refreshToken);
      sessionStorage.setItem('duongsach_user', JSON.stringify(user));
      sessionStorage.setItem('duongsach_partner_auth_v1', 'authenticated_partner');

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(
        err?.message || (language === 'vi'
          ? 'Tên đăng nhập hoặc mật khẩu đối tác chưa chính xác trong hệ thống.'
          : 'Invalid credentials in database.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="partner-login-page">
      {/* Background Ambience */}
      <div className="partner-login-bg" aria-hidden="true">
        <div className="partner-login-glow partner-login-glow-1"></div>
        <div className="partner-login-glow partner-login-glow-2"></div>
      </div>

      <div className="partner-login-container">
        {/* Top Back Link */}
        <div className="partner-login-topbar">
          <Link 
            to="/" 
            className="partner-login-backlink"
          >
            <ArrowLeft size={14} />
            <span>{language === 'vi' ? 'Trang chủ Đường Sách' : 'Back to Home'}</span>
          </Link>

          <Link 
            to="/login" 
            className="partner-login-unifiedlink"
          >
            {language === 'vi' ? 'Cổng đăng nhập chung →' : 'Unified Login →'}
          </Link>
        </div>

        {/* Card Header & Brand */}
        <div className="partner-login-card">
          <div className="partner-login-header">
            <div className="partner-brand-badge-wrap">
              <div className="partner-brand-avatar">
                <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" />
              </div>
              <div className="partner-pill-badge">
                <Building2 size={13} color="#E9BC63" />
                <span>{language === 'vi' ? 'ĐỐI TÁC & TRIỂN LÃM' : 'EXHIBITOR & PARTNER'}</span>
              </div>
            </div>

            <h1 className="partner-login-title">
              {language === 'vi' ? 'Cổng Đối tác & Triển lãm' : 'Partner & Exhibitor Portal'}
            </h1>
            <p className="partner-login-subtitle">
              {language === 'vi'
                ? 'Hệ thống đăng ký sự kiện, quản trị gian hàng & đề xuất hoạt động tại Đường Sách TP.HCM'
                : 'Event participation, booth management & activity proposals for HCMC Book Street'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="partner-login-alert" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="partner-login-form" onSubmit={handleSubmit}>
            <div className="partner-form-group">
              <label htmlFor="partner-username" className="partner-form-label">
                {language === 'vi' ? 'Tài khoản đơn vị / Email đại diện' : 'Partner Account / Email'}
              </label>
              <div className="partner-input-wrap">
                <span className="partner-input-icon">
                  <User size={16} />
                </span>
                <input
                  id="partner-username"
                  type="text"
                  required
                  autoFocus
                  placeholder={language === 'vi' ? 'Ví dụ: binhminh@books.com' : 'e.g. binhminh@books.com'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="partner-input-field"
                />
              </div>
            </div>

            <div className="partner-form-group">
              <label htmlFor="partner-password" className="partner-form-label">
                {language === 'vi' ? 'Mật khẩu bảo mật' : 'Password'}
              </label>
              <div className="partner-input-wrap">
                <span className="partner-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="partner-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={language === 'vi' ? 'Nhập mật khẩu đối tác' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="partner-input-field"
                />
                <button
                  type="button"
                  className="partner-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="partner-login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>{language === 'vi' ? 'Đang xác thực...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{language === 'vi' ? 'Đăng nhập vào Cổng Đối tác' : 'Sign In to Partner Portal'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note switching to Admin Portal */}
          <div className="partner-login-footer-crosslink">
            <span>{language === 'vi' ? 'Ban Quản Lý Đường Sách?' : 'Street Management?'}</span>
            <Link to="/admin" className="partner-login-crosslink">
              {language === 'vi' ? 'Đăng nhập Cổng BQL →' : 'Management Portal →'}
            </Link>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="partner-login-bottom-text">
          {language === 'vi'
            ? 'Cổng Đối Tác & Triển Lãm • Đường Sách Thành phố Hồ Chí Minh'
            : 'Partner & Exhibitor Portal • Ho Chi Minh City Book Street'}
        </p>
      </div>
    </div>
  );
};

