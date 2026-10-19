import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { host, port, secure, user, pass } = config.smtp;
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    logger.info(`[MailService] Configured SMTP transporter with host: ${host}:${port}`);
  }
  return transporter;
}

export class MailService {
  /**
   * Gửi email đặt lại mật khẩu với giao diện HTML thương hiệu Đường Sách TP.HCM
   */
  static async sendPasswordResetEmail({ to, name, resetUrl, rawToken }) {
    const activeTransporter = getTransporter();
    const displayName = name || to.split('@')[0];

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khôi phục mật khẩu - Đường Sách TP.HCM</title>
  <style>
    body { margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .email-header { background: #17382e; padding: 32px 24px; text-align: center; color: #ffffff; }
    .email-brand-sub { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #e9bc63; margin-bottom: 6px; }
    .email-title { font-size: 22px; font-weight: 700; margin: 0; color: #ffffff; }
    .email-body { padding: 32px 28px; line-height: 1.65; font-size: 15px; color: #374151; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn-reset { display: inline-block; background-color: #e9bc63; color: #17382e !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 8px; box-shadow: 0 3px 8px rgba(233, 188, 99, 0.4); text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-reset:hover { background-color: #dfaf53; }
    .security-box { background: #fefce8; border-left: 4px solid #eab308; padding: 16px; border-radius: 6px; margin: 24px 0; font-size: 13.5px; color: #713f12; }
    .url-fallback { word-break: break-all; font-size: 12.5px; color: #2563eb; background: #f9fafb; padding: 10px 14px; border-radius: 6px; border: 1px solid #e5e7eb; }
    .email-footer { background: #fafafa; border-top: 1px solid #f3f4f6; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-brand-sub">ĐƯỜNG SÁCH TP. HỒ CHÍ MINH</div>
      <h1 class="email-title">Yêu Cầu Khôi Phục Mật Khẩu</h1>
    </div>
    <div class="email-body">
      <p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Hệ thống Quản lý Đường Sách TP.HCM vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản đăng ký với email <strong>${to}</strong>.</p>
      <p>Để hoàn tất quá trình và thiết lập mật khẩu mới, bạn vui lòng nhấn vào nút xác nhận bên dưới:</p>
      
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn-reset" target="_blank">Đặt Lại Mật Khẩu Ngay</a>
      </div>

      <p style="margin-bottom: 6px;">Nếu nút trên không phản hồi, bạn có thể sao chép liên kết trực tiếp sau và dán vào thanh địa chỉ của trình duyệt:</p>
      <div class="url-fallback">${resetUrl}</div>

      <div class="security-box">
        <strong style="display: block; margin-bottom: 4px;">⚠️ Lưu ý quan trọng về an toàn tài khoản:</strong>
        <ul style="margin: 0; padding-left: 18px;">
          <li>Liên kết khôi phục mật khẩu này chỉ có hiệu lực trong vòng <strong>30 phút</strong>.</li>
          <li>Nếu bạn <strong>không</strong> gửi yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn vẫn được bảo vệ tuyệt đối an toàn.</li>
        </ul>
      </div>
      
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">Trân trọng,<br><strong>Ban Quản Lý Đường Sách TP. Hồ Chí Minh</strong></p>
    </div>
    <div class="email-footer">
      <p style="margin: 0;">Đường Sách Nguyễn Văn Bình, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
      <p style="margin: 4px 0 0 0;">Thư này được tạo tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Xin chào ${displayName},

Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản ${to} trên Hệ thống Quản trị Đường Sách TP.HCM.
Vui lòng truy cập liên kết sau để đặt lại mật khẩu (hiệu lực trong 30 phút):
${resetUrl}

Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này.

Trân trọng,
Ban Quản Lý Đường Sách TP. Hồ Chí Minh
    `.trim();

    if (activeTransporter) {
      try {
        const info = await activeTransporter.sendMail({
          from: config.smtp.from,
          to,
          subject: '[Đường Sách TP.HCM] Hướng dẫn đặt lại mật khẩu tài khoản',
          text: textContent,
          html: htmlContent,
        });
        logger.info(`[MailService] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        logger.error(`[MailService] Failed to send email via SMTP: ${err.message}`);
        throw new ApiError(503, 'Dịch vụ email tạm thời không khả dụng', 'EMAIL_UNAVAILABLE');
      }
    }

    throw new ApiError(503, 'Dịch vụ email chưa được cấu hình', 'EMAIL_UNAVAILABLE');
  }
}

