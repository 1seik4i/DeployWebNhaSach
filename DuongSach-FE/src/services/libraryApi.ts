import type {
  Book,
  BookCategory,
  BookInput,
  BookLabel,
  BookSaleInput,
  BookSaleRecord,
  BookStall,
  BookSubmission,
  StallBookRecord,
} from '../types/library';
import { apiClient } from './apiClient';

const CHANGE_EVENT = 'duongsach:library-changed';
const changed = <T>(value: T): T => {
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return value;
};

type AssignedStall = { id: string; code: string; name: string };
export type LibraryStallSummary = {
  id: string;
  code: string;
  name: string;
  account: { id: string; email: string; fullName: string; status: string } | null;
  bookCount: number;
  inventoryQuantity: number;
  soldQuantity: number;
};
type Rankings = {
  bestsellers: Book[];
  weeklyHot: Book[];
  configuration: { formula: string; period: string; resultCount: number; provisional?: boolean };
};

export const libraryApi = {
  changeEvent: CHANGE_EVENT,

  getBooks: () => apiClient.get<Book[]>('/public/books'),
  getAllBooks: () => apiClient.get<Book[]>('/admin/books'),
  getBook: (id: string) => apiClient.get<Book>(`/public/books/${encodeURIComponent(id)}`),
  getBookStalls: (bookId: string) => apiClient.get<BookStall[]>(`/public/books/${encodeURIComponent(bookId)}/stalls`),
  getAllBookStalls: () => apiClient.get<BookStall[]>('/public/book-stalls'),
  getLibraryStalls: () => apiClient.get<LibraryStallSummary[]>('/admin/library-stalls'),
  getCategories: (includeArchived = false) => apiClient.get<BookCategory[]>(includeArchived ? '/admin/book-categories' : '/public/book-categories'),
  getLabels: (includeArchived = false) => apiClient.get<BookLabel[]>(includeArchived ? '/admin/book-labels' : '/public/book-labels'),

  async getRankings(): Promise<Rankings> {
    return apiClient.get<Rankings>('/public/book-rankings');
  },
  async getBestsellers(): Promise<Book[]> {
    return (await this.getRankings()).bestsellers;
  },
  async getWeeklyHotBooks(): Promise<Book[]> {
    return (await this.getRankings()).weeklyHot;
  },
  async updateRanking(rankingType: 'bestseller' | 'weekly_hot', bookIds: string[]): Promise<void> {
    await apiClient.put('/admin/book-rankings', { rankingType, bookIds });
    changed(undefined);
  },
  async setBookRanking(bookId: string, rankings: { bestsellerRank?: number | null; weeklyRank?: number | null }): Promise<void> {
    await apiClient.patch(`/admin/books/${encodeURIComponent(bookId)}/ranking`, rankings);
    changed(undefined);
  },

  getMyAssignedStall: () => apiClient.get<AssignedStall>('/partner/assigned-stall'),
  getMyStallBooks: (_stallId?: string) => apiClient.get<StallBookRecord[]>('/partner/books'),
  getMyBookSubmissions: (_stallId?: string) => apiClient.get<BookSubmission[]>('/partner/book-submissions'),
  findGlobalBookByIsbn: async (value: string) => {
    const rows = await apiClient.get<Book[]>(`/public/books?search=${encodeURIComponent(value.trim())}`);
    const needle = value.trim().toLocaleLowerCase('vi');
    return rows.find(book => book.isbn === value.trim()) || rows.find(book => `${book.title} ${book.author}`.toLocaleLowerCase('vi').includes(needle));
  },

  async addBookToMyStall(_stall: AssignedStall, bookId: string, inventoryQuantity: number, soldQuantity?: number): Promise<BookStall> {
    return changed(await apiClient.post<BookStall>('/partner/books', { bookId, inventoryQuantity, soldQuantity: soldQuantity ?? null }));
  },
  async submitNewBook(_stall: AssignedStall, input: BookInput, inventoryQuantity: number, soldQuantity?: number): Promise<BookSubmission> {
    const { labelIds: _labelIds, status: _status, stallId: _stallId, ...proposedData } = input;
    return changed(await apiClient.post<BookSubmission>('/partner/book-submissions', { proposedData, inventoryQuantity, soldQuantity: soldQuantity ?? null }));
  },
  async submitBookUpdate(_stall: AssignedStall, bookId: string, updates: Partial<BookInput>): Promise<BookSubmission> {
    const { labelIds: _labelIds, status: _status, stallId: _stallId, ...proposedData } = updates;
    return changed(await apiClient.post<BookSubmission>('/partner/book-submissions', { bookId, proposedData }));
  },
  async updateInventory(_stallId: string, bookId: string, inventoryQuantity: number): Promise<BookStall> {
    return changed(await apiClient.patch<BookStall>(`/partner/books/${encodeURIComponent(bookId)}/quantities`, { inventoryQuantity }));
  },
  async updateSoldQuantity(_stallId: string, bookId: string, soldQuantity?: number): Promise<BookStall> {
    return changed(await apiClient.patch<BookStall>(`/partner/books/${encodeURIComponent(bookId)}/quantities`, { soldQuantity: soldQuantity ?? null }));
  },
  async removeBookFromMyStall(_stallId: string, bookId: string): Promise<void> {
    await apiClient.delete(`/partner/books/${encodeURIComponent(bookId)}`);
    changed(undefined);
  },
  async cancelBookSubmission(id: string): Promise<void> {
    await apiClient.delete(`/partner/book-submissions/${encodeURIComponent(id)}`);
    changed(undefined);
  },

  getPendingBookSubmissions: async () => (await apiClient.get<BookSubmission[]>('/admin/book-submissions')).filter(item => item.status === 'PENDING'),
  getAllBookSubmissions: () => apiClient.get<BookSubmission[]>('/admin/book-submissions'),
  async getBookSubmission(id: string) {
    return (await apiClient.get<BookSubmission[]>('/admin/book-submissions')).find(item => item.id === id);
  },
  async approveBookSubmission(id: string): Promise<BookSubmission> {
    return changed(await apiClient.post<BookSubmission>(`/admin/book-submissions/${encodeURIComponent(id)}/approve`, {}));
  },
  async rejectBookSubmission(id: string, rejectionReason: string): Promise<BookSubmission> {
    return changed(await apiClient.post<BookSubmission>(`/admin/book-submissions/${encodeURIComponent(id)}/reject`, { rejectionReason }));
  },
  async assignBookStall(bookId: string, stallId: string, inventoryQuantity: number): Promise<BookStall> {
    return changed(await apiClient.post<BookStall>('/admin/book-stalls', { bookId, stallId, inventoryQuantity }));
  },
  async removeBookStall(id: string): Promise<void> {
    await apiClient.delete(`/admin/book-stalls/${encodeURIComponent(id)}`);
    changed(undefined);
  },

  async getInventoryAndSales(): Promise<Array<{ book: Book; stall: BookStall }>> {
    const [books, stalls] = await Promise.all([
      apiClient.get<Book[]>('/admin/books'),
      apiClient.get<BookStall[]>('/admin/book-stalls'),
    ]);
    const byId = new Map(books.map(book => [book.id, book]));
    return stalls.flatMap(stall => {
      const book = byId.get(stall.bookId);
      return book ? [{ book, stall }] : [];
    });
  },
  async getBooksByStall(stallId: string): Promise<StallBookRecord[]> {
    const [inventory, submissions] = await Promise.all([this.getInventoryAndSales(), this.getAllBookSubmissions()]);
    return inventory.filter(row => row.stall.stallId === stallId).map(({ book, stall }) => {
      const latestSubmission = submissions.find(item => item.stallId === stallId && item.bookId === book.id);
      return { book, stall, latestSubmission, contentStatus: latestSubmission?.status || 'APPROVED' };
    });
  },

  async createBook(input: BookInput): Promise<Book> {
    const payload = {
      ...input,
      titleEn: input.titleEn?.trim() || undefined,
      publisher: input.publisher?.trim() || undefined,
      description: input.description?.trim() || undefined,
      coverUrl: input.coverUrl?.trim() || undefined,
      categoryId: input.categoryId || undefined,
      stallId: input.stallId || undefined,
      publicationYear: input.publicationYear ? Number(input.publicationYear) : undefined,
    };
    return changed(await apiClient.post<Book>('/admin/books', payload));
  },
  async updateBook(id: string, updates: Partial<BookInput>): Promise<Book> {
    const payload = {
      ...updates,
      ...(updates.titleEn !== undefined ? { titleEn: updates.titleEn?.trim() || null } : {}),
      ...(updates.publisher !== undefined ? { publisher: updates.publisher?.trim() || null } : {}),
      ...(updates.description !== undefined ? { description: updates.description?.trim() || null } : {}),
      ...(updates.coverUrl !== undefined ? { coverUrl: updates.coverUrl?.trim() || undefined } : {}),
      ...(updates.publicationYear !== undefined ? { publicationYear: updates.publicationYear ? Number(updates.publicationYear) : null } : {}),
      ...(updates.categoryId !== undefined ? { categoryId: updates.categoryId || null } : {}),
      ...(updates.stallId !== undefined ? { stallId: updates.stallId || null } : {}),
    };
    return changed(await apiClient.patch<Book>(`/admin/books/${encodeURIComponent(id)}`, payload));
  },
  async deleteBook(id: string, permanent: boolean = false): Promise<void> {
    await apiClient.delete(`/admin/books/${encodeURIComponent(id)}${permanent ? '?permanent=true' : ''}`);
    changed(undefined);
  },
  async restoreBook(id: string): Promise<Book> {
    const res = await apiClient.post<Book>(`/admin/books/${encodeURIComponent(id)}/restore`, {});
    changed(undefined);
    return res;
  },
  assignBookCategory: (bookId: string, categoryId?: string) => libraryApi.updateBook(bookId, { categoryId }),
  assignBookLabels: (bookId: string, labelIds: string[]) => libraryApi.updateBook(bookId, { labelIds }),

  async createCategory(input: Pick<BookCategory, 'name' | 'nameEn'>): Promise<BookCategory> {
    return changed(await apiClient.post<BookCategory>('/admin/book-categories', input));
  },
  async updateCategory(id: string, updates: Partial<Pick<BookCategory, 'name' | 'nameEn' | 'status'>>): Promise<BookCategory> {
    return changed(await apiClient.patch<BookCategory>(`/admin/book-categories/${encodeURIComponent(id)}`, updates));
  },
  async deleteCategory(id: string, permanent: boolean = false): Promise<void> {
    await apiClient.delete(`/admin/book-categories/${encodeURIComponent(id)}${permanent ? '?permanent=true' : ''}`);
    changed(undefined);
  },
  restoreCategory: (id: string) => libraryApi.updateCategory(id, { status: 'active' }),

  async createLabel(input: Pick<BookLabel, 'name'>): Promise<BookLabel> {
    return changed(await apiClient.post<BookLabel>('/admin/book-labels', input));
  },
  async updateLabel(id: string, updates: Partial<Pick<BookLabel, 'name' | 'status'>>): Promise<BookLabel> {
    return changed(await apiClient.patch<BookLabel>(`/admin/book-labels/${encodeURIComponent(id)}`, updates));
  },
  async deleteLabel(id: string, permanent: boolean = false): Promise<void> {
    await apiClient.delete(`/admin/book-labels/${encodeURIComponent(id)}${permanent ? '?permanent=true' : ''}`);
    changed(undefined);
  },
  restoreLabel: (id: string) => libraryApi.updateLabel(id, { status: 'active' }),

  getMyBookSales: (_boothId?: string) => apiClient.get<BookSaleRecord[]>('/partner/book-sales'),
  getAllSales: () => apiClient.get<BookSaleRecord[]>('/admin/book-sales'),
  async submitBookSales(rows: BookSaleInput[]): Promise<BookSaleRecord[]> {
    const payload = rows.map(({ bookId, quantity, soldDate }) => ({ bookId, quantity, soldDate }));
    return changed(await apiClient.post<BookSaleRecord[]>('/partner/book-sales', payload));
  },
};
