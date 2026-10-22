import { prisma } from '../src/config/database.js';
import { translateViToEn } from '../src/services/translate.service.js';

async function main() {
  const books = await prisma.book.findMany();
  console.log(`Found ${books.length} books. Checking translations...`);

  for (const book of books) {
    let needsUpdate = false;
    let newTitleEn = book.titleEn;
    let newDescEn = book.descriptionEn;

    // Check if titleEn is missing or if title was changed (e.g. contains "Cà phê cùng Tony tôi tên nguyên" while titleEn is still "Coffee with Tony")
    if (!book.titleEn || !book.titleEn.trim() || (book.title.includes('tôi tên nguyên') && !book.titleEn.includes('my name is Nguyen') && !book.titleEn.includes('Nguyen'))) {
      newTitleEn = await translateViToEn(book.title);
      needsUpdate = true;
      console.log(`[Translate Title] "${book.title}" -> "${newTitleEn}"`);
    }

    if (book.description && (!book.descriptionEn || !book.descriptionEn.trim())) {
      newDescEn = await translateViToEn(book.description);
      needsUpdate = true;
      console.log(`[Translate Desc] "${book.title}" -> "${newDescEn.slice(0, 60)}..."`);
    }

    if (needsUpdate) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          titleEn: newTitleEn,
          descriptionEn: newDescEn,
        },
      });
    }
  }

  console.log('Finished backfill successfully!');
}

main().catch(console.error).finally(() => process.exit(0));
