import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  BookOpen, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Store,
  Building2,
  KeyRound,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Language } from '../types';
import { authApi } from '../services/authApi';
import { NotificationCallout } from '../components/ui/NotificationCallout';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import './LoginPage.css';

interface LoginPageProps { language: Language; }

export const LoginPage: React.FC<LoginPageProps> = ({ language }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const completeLogin = (res: Awaited<ReturnType<typeof authApi.login>>) => {
      const { user, accessToken, refreshToken } = res;
      sessionStorage.setItem('duongsach_token', accessToken);
      sessionStorage.setItem('duongsach_refresh_token', refreshToken);
      sessionStorage.setItem('duongsach_user', JSON.stringify(user));

      sessionStorage.removeItem('duongsach_admin_auth_v1');
      sessionStorage.removeItem('duongsach_partner_auth_v1');

      if (user.primaryRole === 'admin') {
        sessionStorage.setItem('duongsach_admin_auth_v1', 'authenticated_admin');
        setSuccessMsg(language === 'vi' ? 'Đăng nhập Quản Trị Viên thành công!' : 'Signed in as Administrator!');
        setTimeout(() => { navigate('/admin'); window.location.reload(); }, 500);
      } else if (user.primaryRole === 'partner') {
        sessionStorage.setItem('duongsach_partner_auth_v1', 'authenticated_partner');
        setSuccessMsg(language === 'vi' ? 'Đăng nhập Đối tác thành công!' : 'Signed in as Partner!');
        setTimeout(() => { navigate('/partner'); window.location.reload(); }, 500);
      } else {
        setErrorMsg(language === 'vi' ? 'Tài khoản không thuộc vai trò Quản trị hoặc Đối tác.' : 'This account is not an Admin or Partner account.');
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg(language === 'vi' ? 'Vui lòng nhập email hoặc tên đăng nhập' : 'Please enter your email or username');
      return;
    }
    if (!password) {
      setErrorMsg(language === 'vi' ? 'Vui lòng nhập mật khẩu' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Gọi API Backend PostgreSQL để xác thực tài khoản
      const res = await authApi.login({
        email: identifier.trim(),
        password: password,
      });

      completeLogin(res);
    } catch (err: any) {
      setErrorMsg(
        err?.message || (language === 'vi'
          ? 'Tài khoản hoặc mật khẩu không chính xác trong hệ thống.'
          : 'Invalid account credentials in database.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      {/* Dynamic ambient backdrop */}
      <div className="auth-bg-layer" aria-hidden="true">
        <div className="auth-glow-spot auth-glow-1"></div>
        <div className="auth-glow-spot auth-glow-2"></div>
        <div className="auth-cultural-motif-watermark"></div>
      </div>

      <div className="auth-container">
        {/* Back link to Home */}
        <div className="auth-top-nav">
          <Link to="/" className="auth-back-link" title={language === 'vi' ? 'Về trang chủ' : 'Back to Home'}>
            <ArrowLeft size={16} />
            <span>{language === 'vi' ? 'Trang chủ' : 'Back to Home'}</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="auth-card">

          {/* Corner motifs (pure CSS ornamental brackets) */}
          <div className="auth-card-corner corner-tl" aria-hidden="true"></div>
          <div className="auth-card-corner corner-tr" aria-hidden="true"></div>
          <div className="auth-card-corner corner-bl" aria-hidden="true"></div>
          <div className="auth-card-corner corner-br" aria-hidden="true"></div>

          {/* Top ornamental flourish */}
          <div className="auth-card-ornament" aria-hidden="true">
            <span className="ornament-line"></span>
            <span className="ornament-gem">✦</span>
            <span className="ornament-center"><BookOpen size={13} /></span>
            <span className="ornament-gem">✦</span>
            <span className="ornament-line"></span>
          </div>


          {/* Header & Brand */}
          <div className="auth-header">
            <Link to="/" className="auth-brand-badge" title="Đường Sách TP.HCM">
              <div className="auth-brand-icon" style={{ padding: '2px', background: '#FFFFFF', borderRadius: '50%', overflow: 'hidden' }}>
                <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              </div>
              <div className="auth-brand-pill">
                <ShieldCheck size={14} color="#E9BC63" />
                <span>{language === 'vi' ? 'CỔNG TÀI KHOẢN ĐƯỜNG SÁCH' : 'BOOK STREET ACCOUNT PORTAL'}</span>
              </div>
            </Link>

            <h1 className="auth-title">
              {language === 'vi' ? 'Đăng nhập hệ thống' : 'Sign in to the system'}
            </h1>
            <p className="auth-subtitle">
              {language === 'vi'
                ? 'Dành cho Quản trị viên và Đối tác/Gian hàng của Đường Sách TP.HCM.'
                : 'For administrators and registered partners or booth operators.'}
            </p>
          </div>

          {/* Alert Message Area */}
          {errorMsg && (
            <NotificationCallout variant="error" title={language === 'vi' ? 'Đăng nhập thất bại' : 'Sign in failed'}>
              {errorMsg}
            </NotificationCallout>
          )}

          {successMsg && (
            <NotificationCallout variant="success" title={language === 'vi' ? 'Đăng nhập thành công' : 'Signed in'}>
              {successMsg}
            </NotificationCallout>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Identifier Field */}
            <div className="auth-field">
              <label htmlFor="login-identifier">
                {language === 'vi' ? 'Email hoặc Tên đăng nhập' : 'Email or Username'}
              </label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-identifier"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder={language === 'vi' ? 'vi-du@duongsach.vn' : 'name@domain.com'}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <div className="auth-field-label-row">
                <label htmlFor="login-password">
                  {language === 'vi' ? 'Mật khẩu' : 'Password'}
                </label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => setForgotModalOpen(true)}
                >
                  {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                </button>
              </div>

              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
                <button
                  type="button"
                  className="auth-btn-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="auth-remember-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="auth-checkbox-custom">
                  {rememberMe && <Check size={12} strokeWidth={3.5} color="#14221E" />}
                </span>
                <span className="auth-checkbox-text">
                  {language === 'vi' ? 'Ghi nhớ đăng nhập trên thiết bị này' : 'Remember me on this device'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="auth-btn-loading-content">
                  <span className="auth-spinner"></span>
                  <span>{language === 'vi' ? 'Đang xác thực...' : 'Signing in...'}</span>
                </span>
              ) : (
                <>
                  <span>{language === 'vi' ? 'Đăng nhập ngay' : 'Sign In'}</span>
                  <ArrowRight size={18} className="auth-btn-arrow" />
                </>
              )}
            </button>

          </form>

          {/* Footer Switching to Register */}
          <div className="auth-switch-section">
            <span>
              {language === 'vi' ? 'Đơn vị chưa có tài khoản đối tác?' : "Your organization does not have a partner account?"}{' '}
            </span>
            <Link to="/lien-he" className="auth-switch-link">
              {language === 'vi' ? 'Gửi yêu cầu đăng ký' : 'Request registration'}
            </Link>
          </div>

          {/* Link to Partner portal & Admin portal */}
          <div className="auth-portal-hint" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#A7BCB6', fontSize: '0.74rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={13} color="#E9BC63" />
              <span>{language === 'vi' ? 'Cổng Chức năng & Quản trị:' : 'Portals & Administration:'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <Link to="/partner" className="auth-portal-link">
                <Store size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                {language === 'vi' ? 'Cổng Đối tác' : 'Partner Portal'} →
              </Link>
              <span style={{ color: '#D5DFDC' }}>•</span>
              <Link to="/admin" className="auth-portal-link">
                <ShieldCheck size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                {language === 'vi' ? 'Cổng Quản Trị Hệ Thống' : 'Admin Portal'} →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={forgotModalOpen} 
        onClose={() => setForgotModalOpen(false)} 
        language={language} 
        portalType="public"
        initialEmail={identifier} 
      />
    </div>
  );
};

