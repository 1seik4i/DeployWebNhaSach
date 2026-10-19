import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Language } from '../types';
import { authApi } from '../services/authApi';
import './ResetPasswordPage.css';

interface ResetPasswordPageProps {
  language: Language;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ language }) => {
  const isVi = language === 'vi';
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; fullName: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!token) {
        setIsVerifying(false);
        setTokenValid(false);
        setErrorMsg(isVi ? 'Liên kết không chứa mã token xác thực hợp lệ.' : 'Missing verification token.');
        return;
      }

      try {
        const data = await authApi.verifyResetToken(token);
        if (active) {
          setTokenValid(true);
          setUserInfo({ email: data.email, fullName: data.fullName });
          setErrorMsg('');
        }
      } catch (err: any) {
        if (active) {
          setTokenValid(false);
          setErrorMsg(
            err?.message || (isVi 
              ? 'Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.' 
              : 'Password reset link is invalid or has expired.')
          );
        }
      } finally {
        if (active) setIsVerifying(false);
      }
    };

    verify();
    return () => { active = false; };
  }, [token, isVi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg(isVi ? 'Mật khẩu mới phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isVi 
          ? 'Không thể đặt lại mật khẩu. Vui lòng thử lại hoặc yêu cầu liên kết mới.' 
          : 'Failed to reset password. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rpp-page-root">
      {/* Dynamic ambient backdrop */}
      <div className="rpp-bg-layer" aria-hidden="true">
        <div className="rpp-glow-spot rpp-glow-1"></div>
        <div className="rpp-glow-spot rpp-glow-2"></div>
      </div>

      <div className="rpp-container">
        {/* Top Back Link */}
        <div className="rpp-top-nav">
          <Link to="/login" className="rpp-back-link">
            <ArrowLeft size={16} />
            <span>{isVi ? 'Quay lại Cổng Đăng Nhập' : 'Back to Login'}</span>
          </Link>
        </div>

        <div className="rpp-card">
          {/* Corner motifs (pure CSS ornamental brackets) */}
          <div className="rpp-card-corner corner-tl" aria-hidden="true"></div>
          <div className="rpp-card-corner corner-tr" aria-hidden="true"></div>
          <div className="rpp-card-corner corner-bl" aria-hidden="true"></div>
          <div className="rpp-card-corner corner-br" aria-hidden="true"></div>

          {/* Top ornamental flourish */}
          <div className="rpp-card-ornament" aria-hidden="true">
            <span className="ornament-line"></span>
            <span className="ornament-gem">✦</span>
            <span className="ornament-center"><KeyRound size={13} /></span>
            <span className="ornament-gem">✦</span>
            <span className="ornament-line"></span>
          </div>

          {/* Header */}
          <div className="rpp-header">
            <div className="rpp-brand-badge">
              <div className="rpp-brand-icon">
                <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" />
              </div>
              <div className="rpp-brand-pill">
                <ShieldCheck size={14} color="#E9BC63" />
                <span>{isVi ? 'CỔNG TÀI KHOẢN ĐƯỜNG SÁCH' : 'BOOK STREET ACCOUNT PORTAL'}</span>
              </div>
            </div>

            <h1 className="rpp-title">
              {isVi ? 'Đặt lại mật khẩu mới' : 'Reset Your Password'}
            </h1>
            <p className="rpp-subtitle">
              {isVi 
                ? 'Thiết lập mật khẩu bảo mật mới cho tài khoản của bạn trên hệ thống.' 
                : 'Create a new secure password for your system account.'}
            </p>

            {userInfo && (
              <div className="rpp-user-badge">
                <span>{userInfo.fullName || userInfo.email}</span>
                <span className="rpp-user-email">({userInfo.email})</span>
              </div>
            )}
          </div>

          {/* Verification in Progress */}
          {isVerifying ? (
            <div className="rpp-loading-box">
              <span>{isVi ? 'Đang kiểm tra tính hợp lệ của liên kết...' : 'Verifying reset link...'}</span>
            </div>
          ) : isSuccess ? (
            /* Success Screen */
            <div className="rpp-alert-success">
              <div className="rpp-success-icon-wrap">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="rpp-success-title">
                {isVi ? 'Đặt lại mật khẩu thành công!' : 'Password Reset Successfully!'}
              </h2>
              <p className="rpp-success-desc">
                {isVi 
                  ? 'Mật khẩu tài khoản của bạn đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.' 
                  : 'Your account password has been updated. Please sign in with your new password.'}
              </p>

              <div className="rpp-login-links">
                <Link to="/login" className="rpp-btn-login-primary">
                  <span>{isVi ? 'Đăng nhập vào Hệ thống' : 'Sign In Now'}</span>
                  <ArrowRight size={16} />
                </Link>

                <div className="rpp-portal-nav-row">
                  <Link to="/partner" className="rpp-portal-link">
                    {isVi ? 'Cổng Đối tác →' : 'Partner Portal →'}
                  </Link>
                  <Link to="/admin" className="rpp-portal-link">
                    {isVi ? 'Cổng BQL Admin →' : 'Admin Portal →'}
                  </Link>
                </div>
              </div>
            </div>
          ) : !tokenValid ? (
            /* Invalid / Expired Token Screen */
            <div>
              <div className="rpp-alert-error" role="alert">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMsg}</span>
              </div>

              <div className="rpp-login-links" style={{ marginTop: '24px' }}>
                <Link to="/login" className="rpp-btn-login-primary">
                  <span>{isVi ? 'Quay về trang đăng nhập để gửi lại yêu cầu' : 'Return to Login'}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleSubmit} noValidate>
              {errorMsg && (
                <div className="rpp-alert-error" role="alert">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div className="rpp-form-group">
                <label htmlFor="rpp-new-password" className="rpp-label">
                  {isVi ? 'Mật khẩu mới (tối thiểu 6 ký tự)' : 'New Password (min 6 characters)'}
                </label>
                <div className="rpp-input-wrap">
                  <Lock size={17} className="rpp-input-icon" />
                  <input maxLength={128}
                    id="rpp-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="rpp-input"
                  />
                  <button
                    type="button"
                    className="rpp-pwd-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="rpp-form-group">
                <label htmlFor="rpp-confirm-password" className="rpp-label">
                  {isVi ? 'Xác nhận lại mật khẩu mới' : 'Confirm New Password'}
                </label>
                <div className="rpp-input-wrap">
                  <Lock size={17} className="rpp-input-icon" />
                  <input maxLength={128}
                    id="rpp-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="rpp-input"
                  />
                  <button
                    type="button"
                    className="rpp-pwd-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="rpp-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>{isVi ? 'Đang cập nhật mật khẩu...' : 'Updating password...'}</span>
                ) : (
                  <>
                    <span>{isVi ? 'Lưu mật khẩu mới & Hoàn tất' : 'Reset Password'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
