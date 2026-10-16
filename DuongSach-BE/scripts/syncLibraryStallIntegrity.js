import bcrypt from 'bcrypt';
import { prisma } from '../src/config/database.js';

const INITIAL_PASSWORD = 'Stall@2026';
const emailForCode = code => `${code.toLowerCase()}@stall.duongsach.vn`;
const userCodeForBooth = code => `STALL-${code}`.slice(0, 20);

async function main() {
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 12);
  const booths = await prisma.booth.findMany({
    where: { isDeleted: false },
    orderBy: { code: 'asc' },
  });
  const partnerRole = await prisma.role.findUnique({ where: { code: 'partner' } });
  if (!partnerRole) throw new Error('Không tìm thấy role partner');

  const accountRows = [];
  await prisma.$transaction(async tx => {
    for (const booth of booths) {
      const existing = await tx.userStallAssignment.findFirst({
        where: { stallId: booth.id },
        include: { user: true },
      });
      if (existing) {
        accountRows.push({ code: booth.code, email: existing.user.email, created: false });
        continue;
      }

      const email = emailForCode(booth.code);
      const user = await tx.user.upsert({
        where: { email },
        create: {
          code: userCodeForBooth(booth.code),
          fullName: `Tài khoản ${booth.name}`,
          email,
          passwordHash,
          primaryRole: 'partner',
          status: 'active',
          avatarUrl: booth.imageUrl || null,
        },
        update: {
          fullName: `Tài khoản ${booth.name}`,
          primaryRole: 'partner',
          status: 'active',
          avatarUrl: booth.imageUrl || null,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      });
      await tx.userRoleAssignment.upsert({
        where: { userId_roleId: { userId: user.id, roleId: partnerRole.id } },
        create: { userId: user.id, roleId: partnerRole.id },
        update: {},
      });
      await tx.userStallAssignment.create({ data: { userId: user.id, stallId: booth.id } });
      accountRows.push({ code: booth.code, email, created: true });
    }

    const saleGroups = await tx.bookSale.groupBy({
      by: ['bookId', 'boothId'],
      _sum: { quantity: true },
    });
    for (const sale of saleGroups) {
      await tx.bookStall.upsert({
        where: { bookId_stallId: { bookId: sale.bookId, stallId: sale.boothId } },
        create: {
          bookId: sale.bookId,
          stallId: sale.boothId,
          inventoryQuantity: 0,
          soldQuantity: sale._sum.quantity || 0,
        },
        update: {},
      });
    }

    const stockRows = await tx.bookStall.findMany();
    for (const stock of stockRows) {
      const sales = await tx.bookSale.aggregate({
        where: { bookId: stock.bookId, boothId: stock.stallId },
        _sum: { quantity: true },
      });
      let recorded = sales._sum.quantity || 0;
      const reported = stock.soldQuantity || 0;
      if (recorded === 0 && reported > 0) {
        await tx.bookSale.create({
          data: {
            bookId: stock.bookId,
            boothId: stock.stallId,
            quantity: reported,
            soldDate: new Date(),
          },
        });
        recorded = reported;
      }
      if (stock.soldQuantity !== recorded) {
        await tx.bookStall.update({
          where: { id: stock.id },
          data: { soldQuantity: recorded, version: { increment: 1 } },
        });
      }
    }
  });

  const [accountCount, bookCount, stockCount] = await Promise.all([
    prisma.userStallAssignment.count({ where: { stall: { isDeleted: false } } }),
    prisma.book.count({ where: { status: 'active' } }),
    prisma.bookStall.count({ where: { stall: { isDeleted: false } } }),
  ]);
  console.log(JSON.stringify({ boothCount: booths.length, accountCount, bookCount, stockCount, initialPassword: INITIAL_PASSWORD, accounts: accountRows }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
