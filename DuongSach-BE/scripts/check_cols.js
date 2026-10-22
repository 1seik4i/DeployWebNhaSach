import { prisma } from '../src/config/database.js';

async function main() {
  await prisma.$executeRawUnsafe("ALTER TABLE book_labels ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);");
  console.log('ALTER book_labels SUCCESS');
  // Seed English names for standard labels
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'Vietnamese Author' WHERE name = 'Tác giả Việt' AND (name_en IS NULL OR name_en = '');");
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'Classic Book' WHERE name = 'Sách kinh điển' AND (name_en IS NULL OR name_en = '');");
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'Recommended' WHERE name = 'Khuyên đọc' AND (name_en IS NULL OR name_en = '');");
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'Award Winner' WHERE name = 'Đoạt giải thưởng' AND (name_en IS NULL OR name_en = '');");
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'Bestseller' WHERE name = 'Bán chạy' AND (name_en IS NULL OR name_en = '');");
  await prisma.$executeRawUnsafe("UPDATE book_labels SET name_en = 'New Release' WHERE name = 'Mới phát hành' AND (name_en IS NULL OR name_en = '');");
  console.log('SEED book_labels SUCCESS');
}

main().catch(console.error).finally(() => process.exit(0));
