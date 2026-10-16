export class BoothMapper {
  static toClient(booth) {
    if (!booth) return null;

    // Trích xuất sách từ bookStalls
    const stallBooks = (booth.bookStalls || [])
      .filter((bs) => bs.book && bs.book.status === 'active')
      .map((bs) => ({
        id: bs.book.id,
        title: bs.book.title,
        author: bs.book.author || '',
        soldQuantity: bs.soldQuantity || 0,
        inventoryQuantity: bs.inventoryQuantity || 0,
      }));

    stallBooks.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));

    const topBook = stallBooks[0] || null;
    const featuredBooks = stallBooks.length > 0
      ? stallBooks.slice(0, 3).map((b) => b.title)
      : (Array.isArray(booth.content?.featuredBooks) && booth.content.featuredBooks.length > 0
          ? booth.content.featuredBooks
          : ['Đắc Nhân Tâm', 'Cánh Đồng Bất Tận']);

    return {
      id: booth.id,
      code: booth.code,
      name: booth.name,
      nameEn: booth.nameEn || booth.name,
      publisher: booth.publisher || '',
      category: booth.category || 'literature',
      categoryLabelVi: this.getCategoryLabelVi(booth.category),
      categoryLabelEn: this.getCategoryLabelEn(booth.category),
      tagline: booth.description?.slice(0, 100) || '',
      taglineEn: booth.descriptionEn?.slice(0, 100) || '',
      description: booth.description || '',
      descriptionEn: booth.descriptionEn || booth.description || '',
      featuredBooks,
      featuredBooksEn: featuredBooks,
      topSellingBook: topBook ? {
        title: topBook.title,
        soldQuantity: topBook.soldQuantity,
      } : null,
      mapLocationId: booth.locationId,
      openHours: booth.openHours || '08:00 - 22:00',
      opStatus: booth.opStatus,
      image: {
        url: booth.imageUrl || booth.content?.images?.[0]?.url || 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=800&q=80',
        alt: booth.imageAlt || booth.name,
        source: booth.imageSource || '',
        license: booth.imageLicense || '',
        isIllustrationOnly: false,
      },
    };
  }

  static getCategoryLabelVi(cat) {
    const map = {
      literature: 'Văn học & Tuổi trẻ',
      children: 'Thiếu nhi & Tranh truyện',
      history: 'Lịch sử & Văn hóa',
      lifestyle: 'Đời sống & Nghệ thuật',
      cafe: 'Cà phê & Không gian sách',
    };
    return map[cat] || 'Tổng hợp';
  }

  static getCategoryLabelEn(cat) {
    const map = {
      literature: 'Literature & Youth',
      children: 'Children & Comics',
      history: 'History & Culture',
      lifestyle: 'Lifestyle & Art',
      cafe: 'Book Cafe & Space',
    };
    return map[cat] || 'General';
  }
}
