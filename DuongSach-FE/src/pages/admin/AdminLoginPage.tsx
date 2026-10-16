import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Language } from '../../types';
import { authApi } from '../../services/authApi';
import './AdminLoginPage.css';

interface AdminLoginPageProps {
  language: Language;
  onLoginSuccess: () => void;
}

export const ADMIN_SESSION_KEY = 'duongsach_admin_auth_v1';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
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
      if (user.primaryRole !== 'admin') {
        throw new Error(language === 'vi' ? 'Tài khoản không có quyền Quản trị viên hệ thống' : 'Unauthorized for Admin Portal');
      }

      sessionStorage.removeItem('duongsach_partner_auth_v1');

      sessionStorage.setItem('duongsach_token', accessToken);
      sessionStorage.setItem('duongsach_refresh_token', refreshToken);
      sessionStorage.setItem('duongsach_user', JSON.stringify(user));
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated_admin');

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(
        err?.message || (language === 'vi'
          ? 'Tài khoản hoặc mật khẩu quản trị viên không chính xác trong hệ thống.'
          : 'Invalid administrator credentials in database.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background Ambience */}
      <div className="admin-login-bg">
        <div className="admin-login-glow admin-login-glow-1"></div>
        <div className="admin-login-glow admin-login-glow-2"></div>
      </div>

      <div className="admin-login-container">
        {/* Top Back Link */}
        <div className="admin-login-topbar">
          <Link 
            to="/" 
            className="admin-login-backlink"
          >
            <ArrowLeft size={14} />
            <span>{language === 'vi' ? 'Trang chủ Đường Sách' : 'Home'}</span>
          </Link>
        </div>

        <div className="admin-login-card">
          {/* Brand Header */}
          <div className="admin-login-header">
            <div className="admin-login-badge-wrap">
              <div className="admin-brand-avatar">
                <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" />
              </div>
              <span className="admin-login-badge">
                <ShieldCheck size={14} />
                <span>{language === 'vi' ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'SYSTEM ADMINISTRATOR'}</span>
              </span>
            </div>
            <h1 className="admin-login-title">
              {language === 'vi' ? 'Cổng Quản Trị Hệ Thống' : 'System Admin Portal'}
            </h1>
            <p className="admin-login-subtitle">
              {language === 'vi'
                ? 'Quản lý nội dung, sự kiện, gian hàng và an ninh nền tảng'
                : 'Manage content, events, booths and platform security'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="admin-login-alert">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="admin-username" className="admin-form-label">
                {language === 'vi' ? 'Tài khoản quản trị viên / Email' : 'Admin Username or Email'}
              </label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon">
                  <User size={16} />
                </span>
                <input
                  id="admin-username"
                  aria-label={language === 'vi' ? 'Tài khoản quản trị viên' : 'Admin Username or Email'}
                  type="text"
                  required
                  autoFocus
                  placeholder={language === 'vi' ? 'Tài khoản hoặc email...' : 'Username or email...'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="admin-input-field"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password" className="admin-form-label">
                {language === 'vi' ? 'Mật khẩu quản trị' : 'Password'}
              </label>
              <div className="admin-input-wrap">
                <span className="admin-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="admin-password"
                  aria-label={language === 'vi' ? 'Mật khẩu quản trị' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-pwd-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="admin-login-btn"
            >
              {isLoading ? (
                <span>{language === 'vi' ? 'Đang xác thực an ninh...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{language === 'vi' ? 'Đăng nhập vào Hệ thống' : 'Enter Admin Portal'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="admin-login-footer-text">
          {language === 'vi' 
            ? 'Cổng Quản Trị Hệ Thống • Đường Sách Thành phố Hồ Chí Minh' 
            : 'System Admin Portal • Ho Chi Minh City Book Street'}
        </p>
      </div>
    </div>
  );
};
