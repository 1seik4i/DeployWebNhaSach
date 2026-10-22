export type BookStatus = 'active' | 'draft' | 'archived';
export type CategoryStatus = 'active' | 'archived';
export type RankingType = 'bestseller' | 'weekly_hot';
export type RankingSource = 'auto' | 'admin';
export type LabelStatus = 'active' | 'archived';
export type BookAvailabilityStatus = 'available' | 'low_stock' | 'out_of_stock';
export type BookSubmissionType = 'CREATE' | 'UPDATE';
export type BookSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BookCategory {
  id: string;
  name: string;
  nameEn?: string;
  status: CategoryStatus;
}

export interface BookLabel {
  id: string;
  name: string;
  nameEn?: string;
  status: LabelStatus;
}

export interface BookStallInfo {
  id: string;
  stallId: string;
  stallName: string;
  stallCode?: string;
  inventoryQuantity: number;
  soldQuantity?: number;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  titleEn?: string;
  author: string;
  publisher?: string;
  coverUrl: string;
  description?: string;
  descriptionEn?: string | null;
  publicationYear?: number;
  categoryId?: string;
  category?: BookCategory;
  labelIds?: string[];
  labels?: BookLabel[];
  stalls?: BookStallInfo[];
  status: BookStatus;
  totalSold?: number;
  weeklySold?: number;
  bestsellerRank?: number;
  weeklyRank?: number;
  bestsellerSource?: RankingSource;
  weeklySource?: RankingSource;
  updatedAt: string;
}

export interface BookStall {
  id: string;
  bookId: string;
  stallId: string;
  stallName: string;
  stallCode?: string;
  inventoryQuantity: number;
  soldQuantity?: number;
  availabilityStatus: BookAvailabilityStatus;
  updatedAt: string;
}

export interface BookSubmission {
  id: string;
  bookId?: string;
  stallId: string;
  stallName: string;
  stallCode?: string;
  submitterName?: string;
  type: BookSubmissionType;
  status: BookSubmissionStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  currentApprovedData?: Partial<BookInput>;
  proposedData: Partial<BookInput> & { categoryName?: string };
  inventoryQuantity?: number;
  soldQuantity?: number;
}

export interface StallBookRecord {
  book: Book;
  stall: BookStall;
  contentStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  latestSubmission?: BookSubmission;
}

export interface BookSaleRecord {
  id: string;
  boothId: string;
  boothName?: string;
  bookId: string;
  isbn: string;
  bookTitle: string;
  quantity: number;
  soldDate: string;
  createdAt: string;
}

export interface BookRanking {
  bookId: string;
  rank: number;
  rankingType: RankingType;
  salesCount?: number;
  source: RankingSource;
  updatedAt: string;
}

export type BookInput = Omit<Book, 'id' | 'category' | 'labels' | 'updatedAt' | 'totalSold' | 'weeklySold' | 'bestsellerRank' | 'weeklyRank' | 'stalls'> & {
  stallId?: string;
  inventoryQuantity?: number;
};
export type BookSaleInput = Pick<BookSaleRecord, 'bookId' | 'isbn' | 'bookTitle' | 'quantity' | 'soldDate'> & {
  boothId?: string;
  boothName?: string;
};
