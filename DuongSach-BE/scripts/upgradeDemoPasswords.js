import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';

// Upgrade only the known seeded demo accounts which still use the old shared password.
// Custom passwords and all other accounts remain intact.
export async function upgradeDemoPasswords() {
  const password = process.env.DEMO_PASSWORD || 'Demo2026!';
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('DEMO_PASSWORD must contain at least 8 characters and at most 72 UTF-8 bytes.');
  const users = await prisma.user.findMany({ where: {
    code: { in: ['USR-ADMIN-01', 'USR-PARTNER-01'] }, isDeleted: false,
  } });
  for (const user of users) {
    if (!await bcrypt.compare('123456', user.passwordHash)) continue;
    await prisma.$transaction(async tx => {
      const now = new Date();
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: now } });
      await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } });
    });
  }
}
if (process.argv[1]?.endsWith('upgradeDemoPasswords.js')) {
  upgradeDemoPasswords().finally(() => prisma.$disconnect());
}
