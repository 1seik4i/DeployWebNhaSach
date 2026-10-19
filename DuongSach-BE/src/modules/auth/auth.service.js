import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { securityPolicy } from './security-policy.js';
import { transaction } from '../../utils/contract.js';
import { MailService } from '../../services/mail.service.js';
const attempts = new Map();

export class AuthService {
  // BR-03: Đăng nhập & sinh JWT token
  static async login({ email, password }, ip = '') {
    const rawId = (email || '').trim().toLowerCase();
    const policy=await securityPolicy(),key=ip+':'+rawId,now=Date.now();
    let attempt=attempts.get(key);
    if(!attempt||attempt.until<now){attempt={count:0,until:now+15*60000};attempts.set(key,attempt);}
    if(attempt.count>=policy.maxFailedAttempts)throw new ApiError(429,'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.','RATE_LIMITED');
    if(attempts.size>10000)for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);
    
    // Tìm theo email chính xác hoặc mã code người dùng (USR-xxx) hoặc bí danh hệ thống
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawId },
          { code: { equals: rawId, mode: 'insensitive' } },
        ],
      },
    });

    if (!user || user.isDeleted) {
      attempt.count++;
      throw ApiError.unauthorized('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.status === 'locked') {
      throw ApiError.forbidden(`Tài khoản đã bị khóa. Lý do: ${user.lockReason || 'Liên hệ BQL'}`);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      attempt.count++;
      throw ApiError.unauthorized('Tài khoản hoặc mật khẩu không chính xác');
    }

    if(user.status!=='active')throw ApiError.forbidden('Tài khoản chưa được kích hoạt');
    attempts.delete(key);
    // Cập nhật thời điểm hoạt động
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.mapUser(user),
      ...tokens,
    };
  }

  // BR-04: Làm mới Refresh Token
  static async refreshToken(refreshTokenString) {
    try {
      jwt.verify(refreshTokenString, config.jwt.refreshSecret);
    } catch {
      throw ApiError.unauthorized('Refresh Token không hợp lệ hoặc đã hết hạn');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
    // Read policy before opening the interactive transaction. Using the global
    // Prisma client from inside the transaction can exhaust a small connection
    // pool and turn a concurrent refresh into a P2028/500 response.
    const policy = await securityPolicy();
    return transaction(async tx => {
    const storedToken = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || new Date() > storedToken.expiresAt) {
      throw ApiError.unauthorized('Refresh Token đã bị thu hồi hoặc không hợp lệ');
    }
    if (storedToken.user.isDeleted || storedToken.user.status !== 'active') throw ApiError.unauthorized('Tài khoản không còn hoạt động');

    // Thu hồi token cũ (Refresh token rotation)
    const revoked = await tx.refreshToken.updateMany({
      where: { id: storedToken.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (!revoked.count) throw ApiError.unauthorized('Refresh Token đã được sử dụng');

    const tokens = await this.generateTokens(storedToken.user, tx, policy);
    return tokens;
    });
  }

  // BR-05: Đăng xuất & thu hồi Refresh Token
  static async logout(refreshTokenString) {
    if (!refreshTokenString) return;
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  static async generateTokens(user, db = prisma, resolvedPolicy = null) {
    const policy = resolvedPolicy || await securityPolicy();
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.primaryRole,
        passwordVersion: user.passwordChangedAt?.getTime() || 0,
      },
      config.jwt.accessSecret,
      { expiresIn: `${policy.sessionTimeoutMinutes}m` }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, jti: crypto.randomUUID() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpires }
    );

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: `${policy.sessionTimeoutMinutes}m`,
    };
  }

  static mapUser(user) {
    return {
      id: user.id,
      code: user.code,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.primaryRole,
      primaryRole: user.primaryRole,
      status: user.status,
      avatar: user.avatarUrl || '',
      totalPoints: user.totalPoints,
      emailNotifications: user.emailNotifications,
    };
  }

  // Khôi phục mật khẩu - Gửi mã qua email
  static async forgotPassword(rawEmail) {
    const email = (rawEmail || '').trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) {
      throw ApiError.notFound('Email này chưa được đăng ký.');
    }

    if (user.status === 'locked') {
      throw ApiError.forbidden(`Tài khoản đã bị khóa. Lý do: ${user.lockReason || 'Vui lòng liên hệ Ban Quản Lý'}`);
    }

    // Tạo token ngẫu nhiên an toàn 32-byte hex (64 ký tự)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Hiệu lực 30 phút

    // Vô hiệu hóa các mã token cũ chưa sử dụng
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Lưu token mới vào bảng password_resets
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Tạo đường dẫn đặt lại mật khẩu và gửi email
    const resetUrl = `${config.publicSiteUrl}/reset-password?token=${rawToken}`;
    try {
      await MailService.sendPasswordResetEmail({
        to: user.email,
        name: user.fullName || user.email,
        resetUrl,
        rawToken,
      });
    } catch (error) {
      await prisma.passwordReset.deleteMany({ where: { tokenHash } });
      throw error;
    }

    return {
      message: 'Hướng dẫn khôi phục mật khẩu đã được gửi qua email. Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam/Rác).',
    };
  }

  // Xác thực token đặt lại mật khẩu hợp lệ trước khi hiển thị form
  static async verifyResetToken(rawToken) {
    if (!rawToken) throw ApiError.badRequest('Thiếu mã token đặt lại mật khẩu');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true, status: true, isDeleted: true } },
      },
    });

    if (!record || !record.user || record.user.isDeleted) {
      throw ApiError.badRequest('Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu mới.');
    }

    return {
      valid: true,
      email: record.user.email,
      fullName: record.user.fullName,
    };
  }

  // Đặt lại mật khẩu mới
  static async resetPassword({ token: rawToken, newPassword }) {
    if (!rawToken) throw ApiError.badRequest('Mã token không hợp lệ');
    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return transaction(async (tx) => {
      const record = await tx.passwordReset.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!record || !record.user || record.user.isDeleted) {
        throw ApiError.badRequest('Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.');
      }

      if (record.user.status === 'locked') {
        throw ApiError.forbidden(`Tài khoản đã bị khóa. Lý do: ${record.user.lockReason || 'Liên hệ BQL'}`);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const now = new Date();

      // Đánh dấu token đã được sử dụng
      await tx.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: now },
      });

      // Cập nhật mật khẩu mới của người dùng
      await tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          passwordChangedAt: now,
        },
      });

      // Thu hồi tất cả Refresh Token cũ để bắt buộc đăng nhập lại
      await tx.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });

      return {
        message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
      };
    });
  }
}
