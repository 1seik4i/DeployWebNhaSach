import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { securityPolicy } from './security-policy.js';
import { transaction } from '../../utils/contract.js';
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
}
