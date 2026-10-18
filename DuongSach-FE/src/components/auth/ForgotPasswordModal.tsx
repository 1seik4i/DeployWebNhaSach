import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { Language } from '../../types';
import { authApi } from '../../services/authApi';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  portalType?: 'admin' | 'partner' | 'public';
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  language,
  portalType = 'public',
  initialEmail = '',
}) => {
  const isVi = language === 'vi';
  useModalBehavior(isOpen, onClose);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setErrorMsg('');
      setSuccessData(null);
      setIsLoading(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg(isVi ? 'Vui lòng nhập địa chỉ email của bạn' : 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(trimmed);
      setSuccessData(res);
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isVi 
          ? 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.' 
          : 'Failed to send password reset request. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPortalLabel = () => {
    if (portalType === 'admin') return isVi ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'SYSTEM ADMINISTRATOR';
    if (portalType === 'partner') return isVi ? 'ĐỐI TÁC GIAN HÀNG' : 'PARTNER & BOOTH';
    return isVi ? 'ĐƯỜNG SÁCH TP. HỒ CHÍ MINH' : 'HCMC BOOK STREET';
  };

  return (
    <div 
      className="fpm-modal-backdrop" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fpm-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          type="button" 
          className="fpm-close-btn" 
          onClick={onClose}
          aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="fpm-header">
          <div className="fpm-brand-badge">
            <div className="fpm-brand-logo-wrap">
              <img src="/duong_sach_logo.png" alt="Logo Đường Sách" className="fpm-brand-logo" />
            </div>
            <div className="fpm-brand-pill">
              <ShieldCheck size={13} color="#D4A359" />
              <span>{getPortalLabel()}</span>
            </div>
          </div>
          <h2 className="fpm-title">
            {isVi ? 'Khôi phục mật khẩu' : 'Reset Password'}
          </h2>
          <p className="fpm-subtitle">
            {isVi 
              ? 'Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.' 
              : 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {/* Body */}
        <div className="fpm-body">
          {errorMsg && (
            <div className="fpm-alert-error" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successData ? (
            <div className="fpm-success-card">
              <div className="fpm-success-icon-wrap">
                <CheckCircle2 size={32} color="#166534" />
              </div>
              <h3 className="fpm-success-title">
                {isVi ? 'Đã gửi liên kết khôi phục' : 'Reset Link Sent'}
              </h3>
              <p className="fpm-success-text">
                {isVi 
                  ? 'Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) để đặt lại mật khẩu.' 
                  : 'Please check your email inbox or Spam folder to reset your password.'}
              </p>
              <div className="fpm-actions fpm-actions-center">
                <button type="button" className="fpm-btn-primary-close" onClick={onClose}>
                  {isVi ? 'Đã hiểu' : 'Got it'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="fpm-form-group">
                <label htmlFor="fpm-email-input" className="fpm-label">
                  {isVi ? 'Địa chỉ email đăng ký' : 'Registered Email Address'}
                </label>
                <div className="fpm-input-wrap">
                  <Mail size={17} className="fpm-input-icon" />
                  <input
                    id="fpm-email-input"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder={isVi ? 'Ví dụ: admin@duongsach.example.vn' : 'name@example.com'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="fpm-input"
                  />
                </div>
              </div>

              <div className="fpm-actions">
                <button 
                  type="button" 
                  className="fpm-btn-cancel" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {isVi ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="fpm-btn-submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>{isVi ? 'Đang gửi mã...' : 'Sending...'}</span>
                  ) : (
                    <>
                      <span>{isVi ? 'Gửi liên kết khôi phục' : 'Send Reset Link'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

