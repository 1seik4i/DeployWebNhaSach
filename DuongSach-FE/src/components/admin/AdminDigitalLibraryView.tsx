import { BookshelfManager } from './BookshelfManager';
import { BookCategorySelect } from './BookCategorySelect';
import { SafeImage } from '../ui/SafeImage';
import { useUrlTab } from '../../hooks/useUrlTab';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertCircle,
  AlertTriangle,
  BookOpen, 
  Check, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3, 
  ExternalLink,
  Eye, 
  FileImage,
  GripVertical, 
  ImagePlus,
  Info, 
  Link2,
  Plus, 
  Printer,
  QrCode,
  RotateCcw,
  Search, 
  Store, 
  Tags, 
  Trash2, 
  Trophy,
  Upload, 
  X 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Book, BookCategory, BookInput, BookLabel, BookStall, BookStallInfo, BookSubmission, Language, RankingType } from '../../types';
import { libraryApi, type LibraryStallSummary } from '../../services/libraryApi';
import './AdminDigitalLibraryView.css';

type Tab = 'books' | 'moderation' | 'taxonomy' | 'stalls' | 'rankings';
type StockStatus = 'all' | 'available' | 'low_stock' | 'out_of_stock';
type InventoryRow = {
    book: Book;
    stall: BookStall;
};
type ModalNotice = {
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
};

const emptyBook: BookInput = { 
    isbn: '', 
    title: '', 
    titleEn: '', 
    author: '', 
    publisher: '', 
    coverUrl: '', 
    description: '', 
    categoryId: '', 
    labelIds: [], 
    status: 'active',
    stallId: '',
    inventoryQuantity: 0
};

const submissionLabel = (item: BookSubmission, language: Language) => item.type === 'CREATE' ? (language === 'vi' ? 'Thêm mới' : 'Create') : (language === 'vi' ? 'Chỉnh sửa' : 'Update');
const fields: [
    keyof BookInput,
    string
][] = [['title', 'Tên sách'], ['author', 'Tác giả'], ['isbn', 'ISBN'], ['publisher', 'Nhà xuất bản'], ['publicationYear', 'Năm xuất bản'], ['description', 'Mô tả']];

export function AdminDigitalLibraryView({ language }: {
    language: Language;
}) {
    const [tab, setTab] = useUrlTab(['books', 'moderation', 'taxonomy', 'stalls', 'rankings'], 'books', 'section');
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<BookCategory[]>([]);
    const [labels, setLabels] = useState<BookLabel[]>([]);
    const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
    const [submissionError, setSubmissionError] = useState('');
    const [libraryLoadError, setLibraryLoadError] = useState(false);
    const [inventory, setInventory] = useState<InventoryRow[]>([]);
    const [stallSummaries, setStallSummaries] = useState<LibraryStallSummary[]>([]);

    // Filters for "Tất cả sách"
    const [query, setQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [selectedStallId, setSelectedStallId] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('active');

    // Modals state
    const [editing, setEditing] = useState<Book | null | undefined>(undefined);
    const [viewingBook, setViewingBook] = useState<Book | null>(null);
    const [viewingStallsBook, setViewingStallsBook] = useState<{
        book: Book;
        stalls: Array<{
            id: string;
            stallId: string;
            stallName?: string;
            stallCode?: string;
            inventoryQuantity: number;
            soldQuantity?: number;
        }>;
    } | null>(null);
    const [deletingBook, setDeletingBook] = useState<{
        book: Book;
        permanent: boolean;
    } | null>(null);
    const [modalNotice, setModalNotice] = useState<ModalNotice | null>(null);

    // QR Code modal state
    const [qrModalBook, setQrModalBook] = useState<{
        book: Book;
        selectedStallId?: string;
    } | null>(null);

    // Ranking modal states
    const [rankingModalBook, setRankingModalBook] = useState<{
        book: Book;
        bestsellerRank: number | null;
        weeklyRank: number | null;
    } | null>(null);
    const [addingBookToRank, setAddingBookToRank] = useState(false);
    const [selectedBookToRank, setSelectedBookToRank] = useState('');
    const [newBookRankPosition, setNewBookRankPosition] = useState<number>(1);

    // Taxonomy CRUD Modal state
    const [editingTaxonomy, setEditingTaxonomy] = useState<{
        type: 'category' | 'label';
        id: string;
        name: string;
        nameEn?: string;
        status: 'active' | 'archived';
        count: number;
    } | null>(null);

    const [deletingTaxonomy, setDeletingTaxonomy] = useState<{
        type: 'category' | 'label';
        id: string;
        name: string;
        status: string;
        count: number;
        permanent: boolean;
    } | null>(null);

    const [form, setForm] = useState<BookInput>(emptyBook);
    const [categoryName, setCategoryName] = useState('');
    const [labelName, setLabelName] = useState('');
    const [rankingType, setRankingType] = useState<RankingType>('bestseller');
    const [draggedRankIndex, setDraggedRankIndex] = useState<number | null>(null);
    const [dragOverRankIndex, setDragOverRankIndex] = useState<number | null>(null);
    const [rankingSaving, setRankingSaving] = useState(false);
    const [coverFileName, setCoverFileName] = useState('');
    const [coverError, setCoverError] = useState('');

    // Moderation state
    const [reviewing, setReviewing] = useState<BookSubmission | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [requestStatus, setRequestStatus] = useState<'all' | 'PENDING' | 'REJECTED'>('all');
    const [requestType, setRequestType] = useState('all');
    const [requestDate, setRequestDate] = useState('');

    // Stalls tab state
    const [stallId, setStallId] = useState('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');

    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Prevent background scrolling and enable Escape-to-close for all modals
    useModalBehavior(editing !== undefined, () => setEditing(undefined));
    useModalBehavior(Boolean(viewingBook), () => setViewingBook(null));
    useModalBehavior(Boolean(viewingStallsBook), () => setViewingStallsBook(null));
    useModalBehavior(Boolean(deletingBook), () => setDeletingBook(null));
    useModalBehavior(Boolean(modalNotice), () => setModalNotice(null));
    useModalBehavior(Boolean(qrModalBook), () => setQrModalBook(null));
    useModalBehavior(Boolean(rankingModalBook), () => setRankingModalBook(null));
    useModalBehavior(addingBookToRank, () => setAddingBookToRank(false));
    useModalBehavior(Boolean(editingTaxonomy), () => setEditingTaxonomy(null));
    useModalBehavior(Boolean(deletingTaxonomy), () => setDeletingTaxonomy(null));
    useModalBehavior(Boolean(reviewing), () => { setReviewing(null); setRejecting(false); });
    useModalBehavior(Boolean(previewImage), () => setPreviewImage(null));

    const refresh = useCallback(() => Promise.all([
        libraryApi.getAllBooks(), 
        libraryApi.getCategories(true), 
        libraryApi.getLabels(true), 
        libraryApi.getAllBookSubmissions(), 
        libraryApi.getInventoryAndSales(), 
        libraryApi.getRankings(), 
        libraryApi.getLibraryStalls()
    ]).then(([b, c, l, s, i, r, stallData]) => {
        const rankedById = new Map<string, Partial<Book>>();
        [...r.bestsellers, ...r.weeklyHot].forEach(book => {
            rankedById.set(book.id, { ...rankedById.get(book.id), ...book });
        });
        setBooks(b.map(book => ({ ...book, ...rankedById.get(book.id) })));
        setCategories(c); setLabels(l); setSubmissions(s); setInventory(i); setStallSummaries(stallData);
    }), []);

    useEffect(() => { 
        const handler = () => {
            void refresh().then(() => setLibraryLoadError(false)).catch(() => setLibraryLoadError(true));
        };
        handler();
        window.addEventListener(libraryApi.changeEvent, handler); 
        return () => window.removeEventListener(libraryApi.changeEvent, handler); 
    }, [refresh]);

    // Partner submissions can arrive from another browser or session.
    // Load the queue independently so unrelated catalogue failures cannot hide it.
    useEffect(() => {
        let active = true;
        let loading = false;
        const reload = async () => {
            if (loading || document.visibilityState === 'hidden') return;
            loading = true;
            try {
                const rows = await libraryApi.getAllBookSubmissions();
                if (active) {
                    setSubmissions(rows);
                    setSubmissionError('');
                }
            } catch {
                if (active) setSubmissionError(language === 'vi'
                    ? 'Không thể tải yêu cầu kiểm duyệt. Hệ thống sẽ tự thử lại.'
                    : 'Unable to load review requests. Retrying automatically.');
            } finally {
                loading = false;
            }
        };
        void reload();
        const handler = () => { void reload(); };
        const timer = window.setInterval(handler, 15000);
        window.addEventListener('focus', handler);
        document.addEventListener('visibilitychange', handler);
        window.addEventListener(libraryApi.changeEvent, handler);
        return () => {
            active = false;
            window.clearInterval(timer);
            window.removeEventListener('focus', handler);
            document.removeEventListener('visibilitychange', handler);
            window.removeEventListener(libraryApi.changeEvent, handler);
        };
    }, [tab, language]);

    const getBookStalls = useCallback((book: Book): BookStallInfo[] => {
        if (book.stalls && book.stalls.length > 0) return book.stalls;
        return inventory
            .filter(row => row.book.id === book.id)
            .map(row => ({
                id: row.stall.id,
                stallId: row.stall.stallId,
                stallName: row.stall.stallName,
                stallCode: row.stall.stallCode,
                inventoryQuantity: row.stall.inventoryQuantity,
                soldQuantity: row.stall.soldQuantity,
            }));
    }, [inventory]);

    const openCreate = () => { 
        setEditing(null); 
        setForm({ ...emptyBook }); 
        setCoverFileName(''); 
        setCoverError(''); 
    };

    const openEdit = (book: Book) => { 
        const existingStalls = getBookStalls(book);
        const primaryStall = existingStalls[0];
        setEditing(book); 
        setCoverFileName(''); 
        setCoverError(''); 
        setForm({ 
            isbn: book.isbn, 
            title: book.title, 
            titleEn: book.titleEn || '', 
            author: book.author, 
            publisher: book.publisher || '', 
            coverUrl: book.coverUrl || '', 
            description: book.description || '', 
            publicationYear: book.publicationYear, 
            categoryId: book.categoryId || '', 
            labelIds: book.labelIds || [], 
            status: book.status || 'active',
            stallId: primaryStall?.stallId || '',
            inventoryQuantity: primaryStall?.inventoryQuantity || 0
        }); 
    };

    const openView = (book: Book) => {
        setViewingBook(book);
    };

    const handleCoverUpload = (file?: File) => { 
        if (!file) return; 
        setCoverError(''); 
        if (!/^(?:image\/(?:png|jpeg|gif|webp|avif))$/.test(file.type)) {
            setCoverError(language === 'vi' ? 'Vui lòng chọn đúng định dạng ảnh.' : 'Please choose an image file.');
            return;
        } 
        if (file.size > 5 * 1024 * 1024) {
            setCoverError(language === 'vi' ? 'Ảnh bìa không được vượt quá 5 MB.' : 'Cover image must not exceed 5 MB.');
            return;
        } 
        const reader = new FileReader(); 
        reader.onload = () => { 
            const rawResult = String(reader.result || '');
            const img = new Image();
            img.onload = () => {
                try {
                    const MAX_DIM = 1200;
                    let { width, height } = img;
                    if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) {
                            height = Math.round((height * MAX_DIM) / width);
                            width = MAX_DIM;
                        } else {
                            width = Math.round((width * MAX_DIM) / height);
                            height = MAX_DIM;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', 0.85);
                        setForm(current => ({ ...current, coverUrl: compressed }));
                    } else {
                        setForm(current => ({ ...current, coverUrl: rawResult }));
                    }
                } catch {
                    setForm(current => ({ ...current, coverUrl: rawResult }));
                }
                setCoverFileName(file.name);
            };
            img.onerror = () => {
                setForm(current => ({ ...current, coverUrl: rawResult }));
                setCoverFileName(file.name);
            };
            img.src = rawResult;
        }; 
        reader.onerror = () => setCoverError(language === 'vi' ? 'Không thể đọc tệp ảnh.' : 'Could not read the image file.'); 
        reader.readAsDataURL(file); 
    };

    const saveBook = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!form.isbn.trim() || !form.title.trim() || !form.author.trim()) return; 
        try {
            const payload: BookInput = {
                ...form,
                isbn: form.isbn.trim(),
                title: form.title.trim(),
                titleEn: form.title === editing?.title ? (form.titleEn?.trim() || undefined) : undefined,
                author: form.author.trim(),
                publisher: form.publisher?.trim() || undefined,
                coverUrl: form.coverUrl?.trim() || '',
                description: form.description?.trim() || undefined,
                descriptionEn: form.description === editing?.description ? (editing?.descriptionEn?.trim() || undefined) : undefined,
                publicationYear: form.publicationYear ? Number(form.publicationYear) : undefined,
                categoryId: form.categoryId || undefined,
                stallId: form.stallId || undefined,
                inventoryQuantity: form.inventoryQuantity !== undefined ? Number(form.inventoryQuantity) : 0,
            };
            if (editing) {
                await libraryApi.updateBook(editing.id, payload);
                setModalNotice({
                    type: 'success',
                    title: language === 'vi' ? 'Cập nhật thành công' : 'Update Successful',
                    message: language === 'vi' ? `Thông tin cuốn sách "${form.title}" đã được cập nhật thành công!` : `Book "${form.title}" was updated successfully!`
                });
            } else {
                await libraryApi.createBook(payload);
                setModalNotice({
                    type: 'success',
                    title: language === 'vi' ? 'Thêm sách thành công' : 'Book Added Successfully',
                    message: language === 'vi' ? `Cuốn sách "${form.title}" đã được thêm mới vào hệ thống Thư viện số!` : `Book "${form.title}" was created successfully!`
                });
            }
            setEditing(undefined); 
            await refresh(); 
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Thao tác thất bại' : 'Operation Failed',
                message: error.message || (language === 'vi' ? 'Có lỗi xảy ra trong quá trình lưu dữ liệu sách.' : 'An error occurred while saving the book.')
            });
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingBook) return;
        try {
            await libraryApi.deleteBook(deletingBook.book.id, deletingBook.permanent);
            setModalNotice({
                type: 'success',
                title: deletingBook.permanent
                    ? (language === 'vi' ? 'Xóa vĩnh viễn thành công' : 'Permanently Deleted')
                    : (language === 'vi' ? 'Lưu trữ thành công' : 'Archived Successfully'),
                message: deletingBook.permanent
                    ? (language === 'vi' ? `Sách "${deletingBook.book.title}" đã được xóa hoàn toàn khỏi cơ sở dữ liệu.` : `Book "${deletingBook.book.title}" was permanently deleted.`)
                    : (language === 'vi' ? `Sách "${deletingBook.book.title}" đã được chuyển sang trạng thái lưu trữ.` : `Book "${deletingBook.book.title}" was archived successfully.`)
            });
            setDeletingBook(null);
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi thao tác' : 'Error',
                message: error.message || (language === 'vi' ? 'Không thể thực hiện thao tác sách. Vui lòng thử lại.' : 'Could not perform operation.')
            });
        }
    };

    const handleRestoreBook = async (book: Book) => {
        try {
            await libraryApi.restoreBook(book.id);
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Khôi phục thành công' : 'Restored Successfully',
                message: language === 'vi' ? `Sách "${book.title}" đã được khôi phục về trạng thái đang hiển thị.` : `Book "${book.title}" has been restored to active status.`
            });
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi khôi phục' : 'Restore Error',
                message: error.message || (language === 'vi' ? 'Không thể khôi phục sách này. Vui lòng thử lại.' : 'Could not restore book.')
            });
        }
    };

    const handleSaveTaxonomy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTaxonomy || !editingTaxonomy.name.trim()) return;
        try {
            if (editingTaxonomy.type === 'category') {
                await libraryApi.updateCategory(editingTaxonomy.id, {
                    name: editingTaxonomy.name.trim(),
                    nameEn: editingTaxonomy.nameEn?.trim() || undefined,
                    status: editingTaxonomy.status
                });
            } else {
                await libraryApi.updateLabel(editingTaxonomy.id, {
                    name: editingTaxonomy.name.trim(),
                    status: editingTaxonomy.status
                });
            }
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Cập nhật thành công' : 'Update Successful',
                message: language === 'vi' 
                    ? `Đã cập nhật thông tin cho ${editingTaxonomy.type === 'category' ? 'danh mục' : 'nhãn'} "${editingTaxonomy.name.trim()}".`
                    : 'Updated taxonomy successfully.'
            });
            setEditingTaxonomy(null);
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Cập nhật thất bại' : 'Update Failed',
                message: error.message || (language === 'vi' ? 'Có lỗi xảy ra khi lưu thay đổi.' : 'An error occurred.')
            });
        }
    };

    const handleRestoreTaxonomy = async (type: 'category' | 'label', item: { id: string; name: string }) => {
        try {
            if (type === 'category') {
                await libraryApi.restoreCategory(item.id);
            } else {
                await libraryApi.restoreLabel(item.id);
            }
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Khôi phục thành công' : 'Restored Successfully',
                message: language === 'vi'
                    ? `Đã khôi phục hoạt động cho ${type === 'category' ? 'danh mục' : 'nhãn'} "${item.name}". Mục này sẽ lại xuất hiện trong các bộ lọc.`
                    : `Restored "${item.name}" successfully.`
            });
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi khôi phục' : 'Restore Failed',
                message: error.message || 'Error restoring item.'
            });
        }
    };

    const handleExecuteDeleteTaxonomy = async () => {
        if (!deletingTaxonomy) return;
        try {
            if (deletingTaxonomy.type === 'category') {
                await libraryApi.deleteCategory(deletingTaxonomy.id, deletingTaxonomy.permanent);
            } else {
                await libraryApi.deleteLabel(deletingTaxonomy.id, deletingTaxonomy.permanent);
            }
            const isCategory = deletingTaxonomy.type === 'category';
            const count = deletingTaxonomy.count;
            setModalNotice({
                type: 'success',
                title: deletingTaxonomy.permanent 
                    ? (language === 'vi' ? 'Xóa vĩnh viễn thành công' : 'Deleted Permanently')
                    : (language === 'vi' ? 'Đã xóa danh mục / nhãn' : 'Taxonomy Removed'),
                message: isCategory && count > 0
                    ? (language === 'vi'
                        ? `Đã xóa danh mục "${deletingTaxonomy.name}". ${count} cuốn sách liên kết đã được tự động đưa về phân loại mặc định "Chưa phân loại".`
                        : `Category "${deletingTaxonomy.name}" deleted. ${count} linked books were automatically moved to "Uncategorized".`)
                    : (deletingTaxonomy.permanent
                        ? (language === 'vi' ? `Đã xóa vĩnh viễn "${deletingTaxonomy.name}" khỏi hệ thống.` : 'Deleted permanently.')
                        : (language === 'vi' ? `Đã chuyển "${deletingTaxonomy.name}" sang trạng thái lưu trữ.` : 'Archived successfully.'))
            });
            setDeletingTaxonomy(null);
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Thao tác thất bại' : 'Action Failed',
                message: error.message || (language === 'vi' ? 'Không thể thực hiện hành động này.' : 'Failed to execute action.')
            });
        }
    };

    const handleApproveSubmission = async (item: BookSubmission) => {
        try {
            await libraryApi.approveBookSubmission(item.id);
            setSubmissions(rows => rows.map(row => row.id === item.id ? { ...row, status: 'APPROVED' } : row));
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Phê duyệt thành công' : 'Approved Successfully',
                message: language === 'vi' 
                    ? `Yêu cầu sách "${item.proposedData.title || ''}" của gian hàng ${item.stallName} đã được duyệt và áp dụng vào gian hàng!` 
                    : `Submission for "${item.proposedData.title || ''}" approved successfully!`
            });
            setReviewing(null);
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi phê duyệt' : 'Approval Error',
                message: error.message || (language === 'vi' ? 'Không thể phê duyệt yêu cầu sách.' : 'Could not approve submission.')
            });
        }
    };

    const handleRejectSubmission = async (item: BookSubmission) => {
        if (!rejectionReason.trim()) return;
        try {
            await libraryApi.rejectBookSubmission(item.id, rejectionReason.trim());
            setModalNotice({
                type: 'info',
                title: language === 'vi' ? 'Đã từ chối yêu cầu' : 'Submission Rejected',
                message: language === 'vi' 
                    ? `Đã từ chối yêu cầu sách "${item.proposedData.title || ''}". Lý do: "${rejectionReason.trim()}". Đối tác sẽ nhận được thông báo.` 
                    : `Submission was rejected.`
            });
            setReviewing(null);
            setRejecting(false);
            setRejectionReason('');
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi từ chối' : 'Rejection Error',
                message: error.message || (language === 'vi' ? 'Không thể từ chối yêu cầu.' : 'Could not reject submission.')
            });
        }
    };

    const handleSaveBookRanking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rankingModalBook) return;
        try {
            await libraryApi.setBookRanking(rankingModalBook.book.id, {
                bestsellerRank: rankingModalBook.bestsellerRank,
                weeklyRank: rankingModalBook.weeklyRank
            });
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Thiết lập thứ hạng thành công' : 'Ranking Saved',
                message: language === 'vi' 
                    ? `Đã cập nhật thứ hạng cho cuốn sách "${rankingModalBook.book.title}".` 
                    : 'Updated rankings successfully.'
            });
            setRankingModalBook(null);
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi thiết lập thứ hạng' : 'Ranking Error',
                message: error.message || 'Error updating rankings.'
            });
        }
    };

    const handleAddBookToCurrentRank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookToRank) return;
        try {
            await libraryApi.setBookRanking(selectedBookToRank, {
                [rankingType === 'bestseller' ? 'bestsellerRank' : 'weeklyRank']: Number(newBookRankPosition) || 1
            });
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Thêm vào bảng xếp hạng thành công' : 'Added to Ranking',
                message: language === 'vi' ? 'Đã thêm sách vào bảng xếp hạng.' : 'Book added to ranking.'
            });
            setAddingBookToRank(false);
            setSelectedBookToRank('');
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi thêm vào BXH' : 'Error',
                message: error.message || 'Failed to add book to ranking.'
            });
        }
    };

    const handleRemoveFromRanking = async (bookId: string, bookTitle: string) => {
        try {
            await libraryApi.setBookRanking(bookId, {
                [rankingType === 'bestseller' ? 'bestsellerRank' : 'weeklyRank']: null
            });
            setModalNotice({
                type: 'success',
                title: language === 'vi' ? 'Đã gỡ khỏi bảng xếp hạng' : 'Removed from Ranking',
                message: language === 'vi' ? `Đã gỡ "${bookTitle}" khỏi danh sách xếp hạng.` : 'Removed from ranking.'
            });
            await refresh();
        } catch (error: any) {
            setModalNotice({
                type: 'error',
                title: language === 'vi' ? 'Lỗi gỡ khỏi BXH' : 'Error',
                message: error.message || 'Failed to remove from ranking.'
            });
        }
    };

    const escapeHtml = (str: string) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const handlePrintBookQr = (book: Book, stall?: BookStallInfo) => {
        const svgElem = document.getElementById('admin-qr-code-svg-container')?.querySelector('svg');
        const svgHtml = svgElem ? svgElem.outerHTML : '';
        const printWindow = window.open('', '_blank', 'width=460,height=620');
        if (!printWindow) {
            window.print();
            return;
        }
        const stallHtml = stall 
            ? `<div class="tag-stall">Gian hàng: <strong>${escapeHtml(stall.stallName)}</strong> (${escapeHtml(stall.stallCode || '—')})</div>`
            : `<div class="tag-stall is-general">Thư viện số Đường Sách TP.HCM</div>`;

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>In mã QR - ${escapeHtml(book.title)}</title>
    <style>
        @page { size: auto; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            margin: 0;
            background: #fff;
            color: #111827;
        }
        .tag-card {
            width: 280px;
            padding: 22px 18px;
            border: 2px dashed #17382e;
            border-radius: 12px;
            text-align: center;
            background: #fff;
        }
        .tag-brand {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #17382e;
            padding-bottom: 8px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .tag-qr {
            display: flex;
            justify-content: center;
            margin: 8px auto 14px;
        }
        .tag-qr svg {
            width: 160px;
            height: 160px;
            display: block;
        }
        .tag-title {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.35;
            margin: 0 0 6px;
            color: #111827;
            word-break: break-word;
        }
        .tag-meta {
            font-size: 11px;
            color: #4b5563;
            margin: 0 0 8px;
        }
        .tag-stall {
            font-size: 11px;
            color: #166534;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 4px 8px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 10px;
        }
        .tag-stall.is-general {
            color: #1e40af;
            background: #eff6ff;
            border-color: #bfdbfe;
        }
        .tag-hint {
            font-size: 9px;
            color: #6b7280;
            margin: 0;
            padding-top: 8px;
            border-top: 1px dashed #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="tag-card">
        <div class="tag-brand">ĐƯỜNG SÁCH TP. HỒ CHÍ MINH</div>
        <div class="tag-qr">${svgHtml}</div>
        <h3 class="tag-title">${escapeHtml(book.title)}</h3>
        <p class="tag-meta">${escapeHtml(book.author)} • ISBN: ${escapeHtml(book.isbn)}</p>
        ${stallHtml}
        <p class="tag-hint">Quét mã QR để tra cứu thông tin sách & tồn kho</p>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
        `);
        printWindow.document.close();
    };

    const handleDownloadQr = (book: Book, stallName?: string) => {
        const svg = document.getElementById('admin-qr-code-svg-container')?.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width || 300;
            canvas.height = img.height || 300;
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            }
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `QR-${book.isbn || 'book'}${stallName ? `-${stallName}` : ''}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const latestStallSubmission = (stallId: string, bookId: string) => submissions.find(item => item.stallId === stallId && item.bookId === bookId);

    const stalls = useMemo(
        () =>
            stallSummaries
                .filter(stall => Boolean(stall.account))
                .map(stall => ({ id: stall.id, name: stall.name, code: stall.code }))
                .sort((a, b) => a.code.localeCompare(b.code)),
        [stallSummaries]
    );

    const visibleBooks = useMemo(() => {
        return books
            .filter(book => {
                if (selectedCategoryId === 'all') return true;
                if (selectedCategoryId === 'uncategorized') {
                    return !book.categoryId || !book.category || book.category.status === 'archived';
                }
                return book.categoryId === selectedCategoryId && book.category?.status !== 'archived';
            })
            .filter(book => {
                if (selectedStallId === 'all') return true;
                const bookStallsList = getBookStalls(book);
                return bookStallsList.some(s => s.stallId === selectedStallId);
            })
            .filter(book => selectedStatus === 'all' || book.status === selectedStatus)
            .filter(book => !query || `${book.title} ${book.author} ${book.isbn}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi')));
    }, [books, selectedCategoryId, selectedStallId, selectedStatus, query, getBookStalls]);

    const visibleSubmissions = useMemo(() => {
        return submissions
            .filter(item => item.status !== 'APPROVED')
            .filter(item => requestStatus === 'all' || item.status === requestStatus)
            .filter(item => requestType === 'all' || item.type === requestType)
            .filter(item => !requestDate || item.submittedAt.slice(0, 10) === requestDate)
            .filter(item => !query || `${item.stallName} ${item.stallCode || ''} ${item.proposedData.title || ''} ${item.proposedData.isbn || ''} ${item.submitterName || ''}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi')));
    }, [submissions, requestStatus, requestType, requestDate, query]);

    const ranked = useMemo(() => books.filter(book => rankingType === 'bestseller' ? book.bestsellerRank : book.weeklyRank).sort((a, b) => (rankingType === 'bestseller' ? a.bestsellerRank || 999 : a.weeklyRank || 999) - (rankingType === 'bestseller' ? b.bestsellerRank || 999 : b.weeklyRank || 999)), [books, rankingType]);

    const handleRankDrop = async (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex || rankingSaving) return;
        const reordered = [...ranked];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        setRankingSaving(true);
        try {
            await libraryApi.updateRanking(rankingType, reordered.map(book => book.id));
            await refresh();
        } catch (error) {
            window.alert(error instanceof Error ? error.message : (language === 'vi' ? 'Không thể lưu thứ hạng.' : 'Could not save ranking.'));
        } finally {
            setRankingSaving(false);
            setDraggedRankIndex(null);
            setDragOverRankIndex(null);
        }
    };

    const activeStallIds = useMemo(() => new Set(stalls.map(s => s.id)), [stalls]);
    const stallRows = useMemo(
        () =>
            inventory
                .filter(row => activeStallIds.has(row.stall.stallId))
                .filter(row => stallId === 'all' || row.stall.stallId === stallId)
                .filter(row => stockStatus === 'all' || row.stall.availabilityStatus === stockStatus)
                .filter(
                    row =>
                        !query ||
                        `${row.book.title} ${row.book.isbn} ${row.stall.stallName} ${row.stall.stallCode || ''}`
                            .normalize('NFC').toLocaleLowerCase('vi')
                            .includes(query.trim().normalize('NFC').toLocaleLowerCase('vi'))
                ),
        [inventory, activeStallIds, stallId, stockStatus, query]
    );

    const booksPagination = useListPagination(visibleBooks, `${selectedCategoryId}:${selectedStallId}:${selectedStatus}:${query}`, 10);
    const submissionsPagination = useListPagination(visibleSubmissions, `${requestStatus}:${requestType}:${requestDate}:${query}`, 10);
    const stallRowsPagination = useListPagination(stallRows, `${stallId}:${stockStatus}:${query}`, 10);

    const tabs: {
        id: Tab;
        vi: string;
        en: string;
    }[] = [
        { id: 'books', vi: 'Tất cả sách', en: 'All books' }, 
        { id: 'moderation', vi: 'Kiểm duyệt', en: 'Moderation' }, 
        { id: 'rankings', vi: 'Tủ sách', en: 'Bookshelves' }, 
        { id: 'taxonomy', vi: 'Danh mục', en: 'Categories' }, 
        { id: 'stalls', vi: 'Gian hàng & tồn kho', en: 'Stalls & inventory' }
    ];
    return <div className="admin-library-view">
        <header className="admin-library-header">
            <div>
                <h1>{language === 'vi' ? 'Quản lý thư viện số' : 'Digital Library Management'}</h1>
                <p>{language === 'vi' ? 'Quản lý sách, kiểm duyệt, phân loại và dữ liệu theo từng gian hàng.' : 'Manage books, moderation, taxonomy and stall-level data.'}</p>
            </div>
            {tab === 'books' && (
                <button className="admin-library-primary" onClick={openCreate}>
                    <Plus size={17}/>{language === 'vi' ? 'Thêm sách mới' : 'Add new book'}
                </button>
            )}
        </header>

        {libraryLoadError && <p role="alert">{language === 'vi'
            ? 'Không thể tải đầy đủ dữ liệu thư viện. Vui lòng tải lại trang.'
            : 'Unable to load all library data. Please reload the page.'}</p>}
        <nav className="admin-library-tabs" aria-label="Digital Library">
            {tabs.map(item => (
                <button 
                    key={item.id} 
                    className={tab === item.id ? 'is-active' : ''} 
                    onClick={() => { setTab(item.id); setQuery(''); }}
                >
                    {language === 'vi' ? item.vi : item.en}
                    {item.id === 'moderation' && submissions.some(row => row.status === 'PENDING') && (
                        <span>{submissions.filter(row => row.status === 'PENDING').length}</span>
                    )}
                </button>
            ))}
        </nav>

        {tab === 'books' && (
            <section className="admin-library-panel">
                <div className="admin-library-tools admin-books-tools">
                    <label>
                        <Search size={16}/>
                        <input maxLength={200}
                            value={query} 
                            onChange={e => setQuery(e.target.value)} 
                            placeholder={language === 'vi' ? 'Tìm tên sách, tác giả, ISBN...' : 'Search title, author, ISBN...'}
                        />
                    </label>

                    {/* Filter Phân loại */}
                    <select
                        aria-label={language === 'vi' ? 'Phân loại sách' : 'Category'}
                        value={selectedCategoryId}
                        onChange={e => setSelectedCategoryId(e.target.value)}
                    >
                        <option value="all">{language === 'vi' ? 'Tất cả phân loại' : 'All categories'}</option>
                        <option value="uncategorized">{language === 'vi' ? 'Chưa phân loại' : 'Uncategorized'}</option>
                        {categories.filter(c => c.status === 'active').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Filter Gian hàng */}
                    <select
                        aria-label={language === 'vi' ? 'Gian hàng' : 'Stall'}
                        value={selectedStallId}
                        onChange={e => setSelectedStallId(e.target.value)}
                    >
                        <option value="all">{language === 'vi' ? 'Tất cả gian hàng' : 'All stalls'}</option>
                        {stalls.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                    </select>

                    {/* Filter Trạng thái */}
                    <select
                        aria-label={language === 'vi' ? 'Trạng thái sách' : 'Status'}
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                    >
                        <option value="active">{language === 'vi' ? 'Đang hiển thị' : 'Active'}</option>
                        <option value="archived">{language === 'vi' ? 'Đã lưu trữ' : 'Archived'}</option>
                        <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</option>
                    </select>
                </div>

                <div className="admin-library-table-wrap admin-library-desktop-table">
                    <table>
                        <thead>
                            <tr>
                                <th className="admin-col-cover">{language === 'vi' ? 'Bìa' : 'Cover'}</th>
                                <th style={{ textAlign: 'left' }}>{language === 'vi' ? 'Tên sách' : 'Book'}</th>
                                <th style={{ width: '135px', textAlign: 'left' }}>ISBN</th>
                                <th style={{ width: '135px', textAlign: 'left' }}>{language === 'vi' ? 'Tác giả' : 'Author'}</th>
                                <th style={{ width: '145px', textAlign: 'left' }}>{language === 'vi' ? 'Phân loại' : 'Category'}</th>
                                <th style={{ width: '150px', textAlign: 'left' }}>{language === 'vi' ? 'Gian hàng có sách' : 'Available Stalls'}</th>
                                <th style={{ width: '135px', textAlign: 'center' }}>{language === 'vi' ? 'Xếp hạng' : 'Rank'}</th>
                                <th style={{ width: '135px', textAlign: 'center' }}>{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {booksPagination.items.map(book => {
                                const bookStallList = getBookStalls(book);
                                const hasRank = Boolean(book.bestsellerRank || book.weeklyRank);
                                return (
                                    <tr key={book.id}>
                                        <td 
                                            className="admin-col-cover is-clickable"
                                            onClick={() => openView(book)}
                                            title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                                        >
                                            <SafeImage className="admin-book-cover" src={book.coverUrl} alt={book.title} loading="lazy" />
                                        </td>
                                        <td 
                                            style={{ textAlign: 'left' }}
                                            className="is-clickable"
                                            onClick={() => openView(book)}
                                            title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <strong className="admin-book-title-clean">{book.title}</strong>
                                                {book.status === 'archived' && (
                                                    <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                                                        {language === 'vi' ? 'Đã lưu trữ' : 'Archived'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="admin-book-publisher-clean">{book.publisher || (language === 'vi' ? 'Chưa có NXB' : 'No publisher')}</span>
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            <span className="admin-isbn-mono">{book.isbn}</span>
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            <span className="admin-author-clean">{book.author}</span>
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            <BookCategorySelect book={book} categories={categories} language={language} onSaved={updated => setBooks(rows => rows.map(row => row.id === updated.id ? updated : row))} />
                                        </td>
                                        <td style={{ textAlign: 'left' }}>
                                            {bookStallList.length === 0 ? (
                                                <span className="admin-stall-empty" title={language === 'vi' ? 'Chưa có gian hàng nào phân phối' : 'No stall'}>—</span>
                                            ) : (
                                                <div className="admin-stall-cell-clean">
                                                    <span 
                                                        className="admin-stall-tag"
                                                        title={`${bookStallList[0].stallName} • Mã: ${bookStallList[0].stallCode || '—'} • Tồn kho: ${bookStallList[0].inventoryQuantity} • Đã bán: ${bookStallList[0].soldQuantity ?? 0}`}
                                                    >
                                                        <span className="admin-stall-tag-code">{bookStallList[0].stallCode || bookStallList[0].stallName}</span>
                                                        <span className="admin-stall-tag-qty">({bookStallList[0].inventoryQuantity})</span>
                                                    </span>
                                                    {bookStallList.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="admin-stall-more-clean"
                                                            onClick={() => setViewingStallsBook({ book, stalls: bookStallList })}
                                                            title={language === 'vi' ? `Xem tất cả ${bookStallList.length} gian hàng có sách này` : `View all ${bookStallList.length} stalls`}
                                                        >
                                                            +{bookStallList.length - 1}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                type="button" 
                                                className={`admin-rank-trigger ${hasRank ? 'has-rank' : 'is-unranked'}`}
                                                onClick={() => setRankingModalBook({
                                                    book,
                                                    bestsellerRank: book.bestsellerRank ?? null,
                                                    weeklyRank: book.weeklyRank ?? null,
                                                })}
                                                title={language === 'vi' ? 'Bấm để chỉnh sửa thứ hạng sách này' : 'Click to edit ranking'}
                                            >
                                                {book.bestsellerRank ? (
                                                    <span className="admin-rank-chip bestseller">
                                                        Top #{book.bestsellerRank}
                                                    </span>
                                                ) : null}
                                                {book.weeklyRank ? (
                                                    <span className="admin-rank-chip hot">
                                                        Hot #{book.weeklyRank}
                                                    </span>
                                                ) : null}
                                                {!hasRank ? (
                                                    <>
                                                        <span className="admin-rank-dash">—</span>
                                                        <span className="admin-rank-add-text">{language === 'vi' ? '+ Gán hạng' : '+ Set'}</span>
                                                    </>
                                                ) : (
                                                    <Edit3 size={11} className="admin-rank-pencil" />
                                                )}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="admin-row-actions">
                                                {book.status === 'archived' ? (
                                                    <>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRestoreBook(book)} 
                                                            title={language === 'vi' ? 'Khôi phục sách về đang hiển thị' : 'Restore book to active'}
                                                            style={{ color: '#059669' }}
                                                        >
                                                            <RotateCcw size={15}/>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="is-delete" 
                                                            onClick={() => setDeletingBook({ book, permanent: true })} 
                                                            title={language === 'vi' ? 'Xóa vĩnh viễn khỏi cơ sở dữ liệu' : 'Delete permanently'}
                                                        >
                                                            <Trash2 size={15}/>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button type="button" onClick={() => setQrModalBook({ book, selectedStallId: 'all' })} title={language === 'vi' ? 'Mã QR & In tem' : 'QR Code & Print Tag'}>
                                                            <QrCode size={15}/>
                                                        </button>
                                                        <button type="button" onClick={() => openEdit(book)} title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                                                            <Edit3 size={15}/>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="is-delete" 
                                                            onClick={() => setDeletingBook({ book, permanent: false })} 
                                                            title={language === 'vi' ? 'Lưu trữ sách' : 'Archive'}
                                                        >
                                                            <Trash2 size={15}/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!visibleBooks.length && (
                                <tr>
                                    <td colSpan={8} className="admin-library-empty">
                                        {language === 'vi' ? 'Không tìm thấy sách phù hợp với bộ lọc.' : 'No books match the selected filters.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards for All-Books */}
                <div className="admin-book-mobile-cards">
                    {booksPagination.items.map(book => {
                        const bookStallList = getBookStalls(book);
                        const hasRank = Boolean(book.bestsellerRank || book.weeklyRank);
                        return (
                            <div key={book.id} className="admin-book-mobile-card">
                                <div className="admin-bmc-header">
                                    <SafeImage
                                        className="admin-bmc-cover" 
                                        src={book.coverUrl} 
                                        alt={book.title} 
                                        loading="lazy" 
                                        onClick={() => openView(book)}
                                    />
                                    <div className="admin-bmc-main">
                                        <div className="admin-bmc-title-row">
                                            <strong className="admin-bmc-title" onClick={() => openView(book)}>
                                                {book.title}
                                            </strong>
                                            {book.status === 'archived' && (
                                                <span className="admin-bmc-archived-tag">
                                                    {language === 'vi' ? 'Đã lưu trữ' : 'Archived'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="admin-bmc-author">
                                            {book.author}
                                        </div>
                                        {book.publisher && (
                                            <div className="admin-bmc-publisher">
                                                {book.publisher}
                                            </div>
                                        )}
                                        <div className="admin-bmc-isbn">
                                            <span>ISBN:</span> <code className="admin-isbn-mono">{book.isbn}</code>
                                        </div>
                                        <div className="admin-bmc-category">
                                            <BookCategorySelect book={book} categories={categories} language={language} onSaved={updated => setBooks(rows => rows.map(row => row.id === updated.id ? updated : row))} />
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-bmc-meta-row">
                                    <div className="admin-bmc-stall-info">
                                        <span className="admin-bmc-label">{language === 'vi' ? 'Gian hàng:' : 'Stalls:'}</span>
                                        {bookStallList.length === 0 ? (
                                            <span className="admin-stall-empty">{language === 'vi' ? 'Chưa có' : 'None'}</span>
                                        ) : (
                                            <div className="admin-stall-cell-clean">
                                                <span className="admin-stall-tag">
                                                    <span className="admin-stall-tag-code">{bookStallList[0].stallCode || bookStallList[0].stallName}</span>
                                                    <span className="admin-stall-tag-qty">({bookStallList[0].inventoryQuantity})</span>
                                                </span>
                                                {bookStallList.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        className="admin-stall-more-clean"
                                                        onClick={() => setViewingStallsBook({ book, stalls: bookStallList })}
                                                    >
                                                        +{bookStallList.length - 1}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="admin-bmc-rank-info">
                                        <span className="admin-bmc-label">{language === 'vi' ? 'Xếp hạng:' : 'Rank:'}</span>
                                        <button 
                                            type="button" 
                                            className={`admin-rank-trigger ${hasRank ? 'has-rank' : 'is-unranked'}`}
                                            onClick={() => setRankingModalBook({
                                                book,
                                                bestsellerRank: book.bestsellerRank ?? null,
                                                weeklyRank: book.weeklyRank ?? null,
                                            })}
                                        >
                                            {book.bestsellerRank ? (
                                                <span className="admin-rank-chip bestseller">
                                                    Top #{book.bestsellerRank}
                                                </span>
                                            ) : null}
                                            {book.weeklyRank ? (
                                                <span className="admin-rank-chip hot">
                                                    Hot #{book.weeklyRank}
                                                </span>
                                            ) : null}
                                            {!hasRank ? (
                                                <>
                                                    <span className="admin-rank-dash">—</span>
                                                    <span className="admin-rank-add-text">{language === 'vi' ? '+ Gán hạng' : '+ Set'}</span>
                                                </>
                                            ) : (
                                                <Edit3 size={11} className="admin-rank-pencil" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="admin-bmc-actions">
                                    {book.status === 'archived' ? (
                                        <>
                                            <button 
                                                type="button" 
                                                className="admin-bmc-btn is-restore"
                                                onClick={() => handleRestoreBook(book)}
                                            >
                                                <RotateCcw size={14}/>
                                                <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                                            </button>
                                            <button 
                                                type="button" 
                                                className="admin-bmc-btn is-danger" 
                                                onClick={() => setDeletingBook({ book, permanent: true })}
                                            >
                                                <Trash2 size={14}/>
                                                <span>{language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                type="button" 
                                                className="admin-bmc-btn"
                                                onClick={() => setQrModalBook({ book, selectedStallId: 'all' })}
                                            >
                                                <QrCode size={14}/>
                                                <span>{language === 'vi' ? 'Mã QR' : 'QR'}</span>
                                            </button>
                                            <button 
                                                type="button" 
                                                className="admin-bmc-btn is-edit"
                                                onClick={() => openEdit(book)}
                                            >
                                                <Edit3 size={14}/>
                                                <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                                            </button>
                                            <button 
                                                type="button" 
                                                className="admin-bmc-btn is-danger" 
                                                onClick={() => setDeletingBook({ book, permanent: false })}
                                            >
                                                <Trash2 size={14}/>
                                                <span>{language === 'vi' ? 'Lưu trữ' : 'Archive'}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!visibleBooks.length && (
                        <div className="admin-library-mobile-empty">
                            {language === 'vi' ? 'Không tìm thấy sách phù hợp với bộ lọc.' : 'No books match the selected filters.'}
                        </div>
                    )}
                </div>

                <ListPagination 
                    page={booksPagination.page} 
                    totalPages={booksPagination.totalPages} 
                    onChange={booksPagination.setPage} 
                    vi={language === 'vi'} 
                />
            </section>
        )}

        {tab === 'moderation' && (
            <section className="admin-library-panel">
                {submissionError && <p role="alert">{submissionError}</p>}
                <div className="admin-library-tools admin-moderation-tools">
                    <label>
                        <Search size={16}/>
                        <input maxLength={200}
                            value={query} 
                            onChange={e => setQuery(e.target.value)} 
                            placeholder={language === 'vi' ? 'Gian hàng, tên sách, ISBN hoặc người gửi...' : 'Stall, book title, ISBN or submitter...'}
                        />
                    </label>
                    <select 
                        aria-label={language === 'vi' ? 'Trạng thái kiểm duyệt' : 'Moderation status'} 
                        value={requestStatus} 
                        onChange={e => setRequestStatus(e.target.value as any)}
                    >
                        <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All statuses'}</option>
                        <option value="PENDING">{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</option>
                        <option value="REJECTED">{language === 'vi' ? 'Bị từ chối' : 'Rejected'}</option>
                    </select>
                    <select value={requestType} onChange={e => setRequestType(e.target.value)}>
                        <option value="all">{language === 'vi' ? 'Tất cả loại yêu cầu' : 'All request types'}</option>
                        <option value="CREATE">{language === 'vi' ? 'Thêm mới' : 'Create'}</option>
                        <option value="UPDATE">{language === 'vi' ? 'Chỉnh sửa' : 'Update'}</option>
                    </select>
                    <input type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)}/>
                </div>
                <div className="admin-library-table-wrap admin-library-desktop-table">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '260px', minWidth: '260px', textAlign: 'left' }}>{language === 'vi' ? 'Gian hàng' : 'Stall'}</th>
                                <th style={{ minWidth: '260px', textAlign: 'left' }}>{language === 'vi' ? 'Sách đề xuất' : 'Proposed Book'}</th>
                                <th style={{ width: '140px', textAlign: 'left' }}>{language === 'vi' ? 'Người gửi' : 'Submitter'}</th>
                                <th style={{ width: '120px', textAlign: 'left' }}>{language === 'vi' ? 'Loại yêu cầu' : 'Request'}</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>{language === 'vi' ? 'Ngày gửi' : 'Submitted'}</th>
                                <th style={{ width: '130px', textAlign: 'center' }}>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                                <th style={{ minWidth: '135px', width: '135px', textAlign: 'center' }}>{language === 'vi' ? 'Hành động' : 'Action'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissionsPagination.items.map(item => (
                                <tr key={item.id}>
                                    <td style={{ textAlign: 'left', minWidth: '260px', paddingRight: '1.25rem' }}>
                                        <strong>{item.stallName}</strong>
                                        <small>{item.stallCode}</small>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                        <strong>{String(item.proposedData.title || '—')}</strong>
                                        <small>{item.proposedData.author || ''} {item.proposedData.isbn ? `• ISBN: ${item.proposedData.isbn}` : ''}</small>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#374151' }}>{item.submitterName || (language === 'vi' ? 'Đối tác gian hàng' : 'Partner')}</span>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>{submissionLabel(item, language)}</td>
                                    <td style={{ textAlign: 'center' }}>{new Date(item.submittedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`admin-request-status ${item.status.normalize('NFC').toLowerCase()}`}>
                                            {item.status === 'PENDING' ? (language === 'vi' ? 'Chờ duyệt' : 'Pending') : item.status === 'APPROVED' ? (language === 'vi' ? 'Đã duyệt' : 'Approved') : (language === 'vi' ? 'Bị từ chối' : 'Rejected')}
                                        </span>
                                        {item.rejectionReason && (
                                            <small className="admin-rejection-reason">{item.rejectionReason}</small>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <button className="admin-review-button" onClick={() => setReviewing(item)}>
                                            <Eye size={15}/>
                                            <span>{item.status === 'PENDING' ? (language === 'vi' ? 'Xem xét' : 'Review') : (language === 'vi' ? 'Chi tiết' : 'Details')}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!visibleSubmissions.length && (
                                <tr>
                                    <td colSpan={7} className="admin-library-empty">
                                        {language === 'vi' ? 'Không có yêu cầu phù hợp với bộ lọc.' : 'No submissions match the filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards for Moderation */}
                <div className="admin-moderation-mobile-cards">
                    {submissionsPagination.items.map(item => (
                        <div key={item.id} className="admin-mod-mobile-card">
                            <div className="admin-mod-header">
                                <div className="admin-mod-stall">
                                    <strong>{item.stallName}</strong>
                                    {item.stallCode && <span className="admin-stall-code-tag">{item.stallCode}</span>}
                                </div>
                                <span className={`admin-request-status ${item.status.normalize('NFC').toLowerCase()}`}>
                                    {item.status === 'PENDING' ? (language === 'vi' ? 'Chờ duyệt' : 'Pending') : item.status === 'APPROVED' ? (language === 'vi' ? 'Đã duyệt' : 'Approved') : (language === 'vi' ? 'Bị từ chối' : 'Rejected')}
                                </span>
                            </div>
                            <div className="admin-mod-body">
                                <div className="admin-mod-book-title">
                                    {String(item.proposedData.title || '—')}
                                </div>
                                <div className="admin-mod-book-sub">
                                    {item.proposedData.author && <span>{item.proposedData.author}</span>}
                                    {item.proposedData.isbn && <code>ISBN: {item.proposedData.isbn}</code>}
                                </div>
                                <div className="admin-mod-meta-grid">
                                    <div>
                                        <span className="admin-mod-meta-label">{language === 'vi' ? 'Loại yêu cầu:' : 'Type:'}</span>
                                        <span className="admin-mod-meta-val">{submissionLabel(item, language)}</span>
                                    </div>
                                    <div>
                                        <span className="admin-mod-meta-label">{language === 'vi' ? 'Người gửi:' : 'Submitter:'}</span>
                                        <span className="admin-mod-meta-val">{item.submitterName || (language === 'vi' ? 'Đối tác gian hàng' : 'Partner')}</span>
                                    </div>
                                    <div>
                                        <span className="admin-mod-meta-label">{language === 'vi' ? 'Ngày gửi:' : 'Date:'}</span>
                                        <span className="admin-mod-meta-val">{new Date(item.submittedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</span>
                                    </div>
                                </div>
                                {item.rejectionReason && (
                                    <div className="admin-mod-reject-box">
                                        <strong>{language === 'vi' ? 'Lý do từ chối:' : 'Rejection reason:'}</strong> {item.rejectionReason}
                                    </div>
                                )}
                            </div>
                            <div className="admin-mod-footer">
                                <button className="admin-review-button" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setReviewing(item)}>
                                    <Eye size={15}/>
                                    <span>{item.status === 'PENDING' ? (language === 'vi' ? 'Xem xét đề xuất' : 'Review Proposal') : (language === 'vi' ? 'Xem chi tiết' : 'View Details')}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {!visibleSubmissions.length && (
                        <div className="admin-library-mobile-empty">
                            {language === 'vi' ? 'Không có yêu cầu phù hợp với bộ lọc.' : 'No submissions match the filter.'}
                        </div>
                    )}
                </div>

                <ListPagination 
                    page={submissionsPagination.page} 
                    totalPages={submissionsPagination.totalPages} 
                    onChange={submissionsPagination.setPage} 
                    vi={language === 'vi'} 
                />
            </section>
        )}

        {tab === 'taxonomy' && (
            <section className="admin-taxonomy-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                <TaxonomySection 
                    title={language === 'vi' ? 'Danh mục' : 'Categories'} 
                    icon={<BookOpen size={17}/>} 
                    value={categoryName} 
                    setValue={setCategoryName} 
                    language={language}
                    onCreate={async () => { 
                        if (categoryName.trim()) {
                            try {
                                await libraryApi.createCategory({ name: categoryName.trim() });
                                setCategoryName('');
                                setModalNotice({
                                    type: 'success',
                                    title: language === 'vi' ? 'Tạo danh mục thành công' : 'Category Created',
                                    message: language === 'vi' ? `Danh mục "${categoryName.trim()}" đã được thêm vào hệ thống.` : 'Category created successfully.'
                                });
                                await refresh();
                            } catch (err: any) {
                                setModalNotice({
                                    type: 'error',
                                    title: language === 'vi' ? 'Lỗi tạo danh mục' : 'Error Creating Category',
                                    message: err.message || (language === 'vi' ? 'Không thể tạo danh mục này.' : 'Failed to create category.')
                                });
                            }
                        } 
                    }} 
                    rows={categories.map(item => {
                        const count = books.filter(book => book.categoryId === item.id).length;
                        return {
                            id: item.id, 
                            name: item.name, 
                            nameEn: item.nameEn,
                            status: item.status, 
                            count,
                            onEdit: () => setEditingTaxonomy({
                                type: 'category',
                                id: item.id,
                                name: item.name,
                                nameEn: item.nameEn,
                                status: item.status as any,
                                count
                            }),
                            onRestore: () => handleRestoreTaxonomy('category', item),
                            onDelete: () => setDeletingTaxonomy({
                                type: 'category',
                                id: item.id,
                                name: item.name,
                                status: item.status,
                                count,
                                permanent: item.status === 'archived' && count === 0
                            })
                        };
                    })}
                />
            </section>
        )}

        {tab === 'stalls' && (
            <section className="admin-library-panel">
                <div className="admin-library-tools admin-stall-tools">
                    <label>
                        <Search size={16}/>
                        <input maxLength={200}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={language === 'vi' ? 'Tìm sách hoặc gian hàng' : 'Search book or stall'}
                        />
                    </label>
                    <select
                        aria-label={language === 'vi' ? 'Gian hàng' : 'Stall'}
                        value={stallId}
                        onChange={e => setStallId(e.target.value)}
                    >
                        <option value="all">{language === 'vi' ? 'Tất cả gian hàng' : 'All stalls'}</option>
                        {stalls.map(stall => (
                            <option key={stall.id} value={stall.id}>
                                {stall.name} — {stall.code}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label={language === 'vi' ? 'Tình trạng tồn kho' : 'Stock status'}
                        value={stockStatus}
                        onChange={e => setStockStatus(e.target.value as StockStatus)}
                    >
                        <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                        <option value="available">{language === 'vi' ? 'Còn hàng' : 'Available'}</option>
                        <option value="low_stock">{language === 'vi' ? 'Sắp hết' : 'Low stock'}</option>
                        <option value="out_of_stock">{language === 'vi' ? 'Hết hàng' : 'Out of stock'}</option>
                    </select>
                </div>
                <div className="admin-library-table-wrap admin-library-desktop-table">
                    <table className="admin-stalls-table">
                        <thead>
                            <tr>
                                <th style={{ width: '210px', minWidth: '180px' }}>{language === 'vi' ? 'Gian hàng' : 'Stall'}</th>
                                <th style={{ minWidth: '260px' }}>{language === 'vi' ? 'Sách' : 'Book'}</th>
                                <th style={{ width: '135px' }}>ISBN</th>
                                <th style={{ width: '85px', textAlign: 'center' }}>{language === 'vi' ? 'Tồn kho' : 'Stock'}</th>
                                <th style={{ width: '85px', textAlign: 'center' }}>{language === 'vi' ? 'Đã bán' : 'Sold'}</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>{language === 'vi' ? 'Tình trạng' : 'Status'}</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>{language === 'vi' ? 'Nội dung' : 'Review'}</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>{language === 'vi' ? 'Cập nhật' : 'Updated'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stallRowsPagination.items.map(row => {
                                const submission = latestStallSubmission(row.stall.stallId, row.book.id);
                                const status = submission?.status || 'APPROVED';
                                return (
                                    <tr key={row.stall.id}>
                                        <td>
                                            <div className="admin-stall-identity">
                                                <strong className="admin-stall-name-text">{row.stall.stallName}</strong>
                                                <span className="admin-stall-code-tag">{row.stall.stallCode || '—'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div 
                                                className="admin-book-cell is-clickable"
                                                onClick={() => openView(row.book)}
                                                title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                                            >
                                                <SafeImage className="admin-book-cover" src={row.book.coverUrl} alt={row.book.title} loading="lazy" />
                                                <div className="admin-book-cell-meta">
                                                    <strong className="admin-book-title">{row.book.title}</strong>
                                                    <small className="admin-book-meta">{row.book.author}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="admin-isbn-mono">{row.book.isbn}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`admin-stock-num ${row.stall.inventoryQuantity <= 0 ? 'is-out' : row.stall.inventoryQuantity <= 4 ? 'is-low' : ''}`}>
                                                {row.stall.inventoryQuantity}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="admin-sold-num">{row.stall.soldQuantity ?? 0}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`admin-clean-badge stock-${row.stall.availabilityStatus}`}>
                                                {row.stall.availabilityStatus === 'out_of_stock'
                                                    ? (language === 'vi' ? 'Hết hàng' : 'Out of stock')
                                                    : row.stall.availabilityStatus === 'low_stock'
                                                    ? (language === 'vi' ? 'Sắp hết' : 'Low stock')
                                                    : (language === 'vi' ? 'Còn hàng' : 'Available')}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`admin-clean-badge review-${status.normalize('NFC').toLowerCase()}`}>
                                                {status === 'PENDING'
                                                    ? (language === 'vi' ? 'Chờ duyệt' : 'Pending')
                                                    : status === 'REJECTED'
                                                    ? (language === 'vi' ? 'Bị từ chối' : 'Rejected')
                                                    : (language === 'vi' ? 'Đã duyệt' : 'Approved')}
                                            </span>
                                            {submission?.rejectionReason && (
                                                <small className="admin-rejection-reason">{submission.rejectionReason}</small>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="admin-updated-time">
                                                {new Date(row.stall.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!stallRows.length && (
                                <tr>
                                    <td colSpan={8} className="admin-library-empty">
                                        {language === 'vi' ? 'Không có sách phù hợp với bộ lọc.' : 'No books match the selected filters.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards for Stalls */}
                <div className="admin-stall-mobile-cards">
                    {stallRowsPagination.items.map(row => {
                        const submission = latestStallSubmission(row.stall.stallId, row.book.id);
                        const status = submission?.status || 'APPROVED';
                        return (
                            <div key={row.stall.id} className="admin-stall-mobile-card">
                                <div className="admin-smc-header">
                                    <div className="admin-stall-identity">
                                        <strong className="admin-stall-name-text">{row.stall.stallName}</strong>
                                        <span className="admin-stall-code-tag">{row.stall.stallCode || '—'}</span>
                                    </div>
                                    <span className={`admin-clean-badge stock-${row.stall.availabilityStatus}`}>
                                        {row.stall.availabilityStatus === 'out_of_stock'
                                            ? (language === 'vi' ? 'Hết hàng' : 'Out of stock')
                                            : row.stall.availabilityStatus === 'low_stock'
                                            ? (language === 'vi' ? 'Sắp hết' : 'Low stock')
                                            : (language === 'vi' ? 'Còn hàng' : 'Available')}
                                    </span>
                                </div>
                                <div className="admin-smc-body is-clickable" onClick={() => openView(row.book)}>
                                    <SafeImage className="admin-bmc-cover" src={row.book.coverUrl} alt={row.book.title} loading="lazy" />
                                    <div className="admin-smc-book-info">
                                        <strong className="admin-book-title">{row.book.title}</strong>
                                        <small className="admin-book-meta">{row.book.author}</small>
                                        <div style={{ marginTop: '2px' }}>
                                            <code className="admin-isbn-mono">{row.book.isbn}</code>
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-smc-stats-grid">
                                    <div className="admin-smc-stat-box">
                                        <span className="admin-smc-stat-label">{language === 'vi' ? 'Tồn kho' : 'Stock'}</span>
                                        <span className={`admin-stock-num ${row.stall.inventoryQuantity <= 0 ? 'is-out' : row.stall.inventoryQuantity <= 4 ? 'is-low' : ''}`}>
                                            {row.stall.inventoryQuantity}
                                        </span>
                                    </div>
                                    <div className="admin-smc-stat-box">
                                        <span className="admin-smc-stat-label">{language === 'vi' ? 'Đã bán' : 'Sold'}</span>
                                        <span className="admin-sold-num">{row.stall.soldQuantity ?? 0}</span>
                                    </div>
                                    <div className="admin-smc-stat-box">
                                        <span className="admin-smc-stat-label">{language === 'vi' ? 'Duyệt nội dung' : 'Review'}</span>
                                        <span className={`admin-clean-badge review-${status.normalize('NFC').toLowerCase()}`}>
                                            {status === 'PENDING'
                                                ? (language === 'vi' ? 'Chờ duyệt' : 'Pending')
                                                : status === 'REJECTED'
                                                ? (language === 'vi' ? 'Bị từ chối' : 'Rejected')
                                                : (language === 'vi' ? 'Đã duyệt' : 'Approved')}
                                        </span>
                                    </div>
                                </div>
                                {submission?.rejectionReason && (
                                    <div className="admin-mod-reject-box" style={{ marginTop: '0.4rem' }}>
                                        <strong>{language === 'vi' ? 'Lý do từ chối:' : 'Rejection:'}</strong> {submission.rejectionReason}
                                    </div>
                                )}
                                <div className="admin-smc-footer">
                                    <span>{language === 'vi' ? 'Cập nhật:' : 'Updated:'} {new Date(row.stall.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</span>
                                </div>
                            </div>
                        );
                    })}
                    {!stallRows.length && (
                        <div className="admin-library-mobile-empty">
                            {language === 'vi' ? 'Không có sách phù hợp với bộ lọc.' : 'No books match the selected filters.'}
                        </div>
                    )}
                </div>

                <ListPagination 
                    page={stallRowsPagination.page} 
                    totalPages={stallRowsPagination.totalPages} 
                    onChange={stallRowsPagination.setPage} 
                    vi={language === 'vi'} 
                />
            </section>
        )}

        {tab === 'rankings' && <BookshelfManager books={books} language={language} onEditBook={openEdit} />}

        {/* Modal Thêm / Chỉnh sửa sách */}
        {editing !== undefined && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"

            >
                <form className="admin-book-form" onSubmit={saveBook} onClick={e => e.stopPropagation()} autoComplete="off">
                    <div className="admin-form-head">
                        <div>
                            <h2>{editing ? (language === 'vi' ? 'Chỉnh sửa thông tin sách' : 'Edit Book Information') : (language === 'vi' ? 'Thêm sách mới' : 'Add New Book')}</h2>
                            <p>{language === 'vi' ? 'Điền thông tin xuất bản, phân loại và gian hàng phân phối sách.' : 'Enter publishing details, taxonomy, and distribution stall.'}</p>
                        </div>
                        <button type="button" onClick={() => setEditing(undefined)}><X /></button>
                    </div>
                    <div className="admin-book-form-grid">
                        <label>
                            ISBN *
                            <input name="isbn" autoComplete="off" inputMode="numeric" pattern="(?:[0-9]{10}|[0-9]{13})" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value.replace(/[^0-9]/g, '') })} required maxLength={13} placeholder="VD: 9786041000009"/>
                        </label>
                        <label>
                            {language === 'vi' ? 'Tên sách *' : 'Title *'}
                            <input name="bookTitle" autoComplete="off" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={200} placeholder={language === 'vi' ? 'Nhập tên sách...' : 'Enter book title...'}/>
                        </label>
                        <label>
                            {language === 'vi' ? 'Tác giả *' : 'Author *'}
                            <input name="bookAuthor" autoComplete="off" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required maxLength={200} placeholder={language === 'vi' ? 'Tên tác giả...' : 'Author name...'}/>
                        </label>
                        <label>
                            {language === 'vi' ? 'Nhà xuất bản' : 'Publisher'}
                            <input value={form.publisher || ''} onChange={e => setForm({ ...form, publisher: e.target.value })} maxLength={200} placeholder="VD: NXB Trẻ, Nhã Nam..."/>
                        </label>
                        <label>
                            {language === 'vi' ? 'Năm xuất bản' : 'Publication year'}
                            <input type="number" min={1} max={new Date().getFullYear() + 1} step={1} value={form.publicationYear || ''} onChange={e => setForm({ ...form, publicationYear: Number(e.target.value) || undefined })} placeholder="VD: 2024"/>
                        </label>
                        <label>
                            {language === 'vi' ? 'Phân loại danh mục' : 'Category'}
                            <select value={form.categoryId || ''} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                                <option value="">{language === 'vi' ? 'Chưa phân loại' : 'Unclassified'}</option>
                                {categories.filter(item => item.status === 'active').map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Stall assignment & initial inventory */}
                        <label>
                            {language === 'vi' ? 'Gán gian hàng phân phối' : 'Assign Distribution Stall'}
                            <select value={form.stallId || ''} onChange={e => setForm({ ...form, stallId: e.target.value, inventoryQuantity: e.target.value ? form.inventoryQuantity : 0 })}>
                                <option value="">{language === 'vi' ? '— Không gán gian hàng ban đầu —' : '— No initial stall —'}</option>
                                {stalls.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            {language === 'vi' ? 'Số lượng sách đưa vào kho' : 'Initial Inventory'}
                            <input 
                                type="number" 
                                min="0" 
                                max="2147483647"
                                step="1"
                                disabled={!form.stallId}
                                value={form.inventoryQuantity ?? 0} 
                                onChange={e => setForm({ ...form, inventoryQuantity: Number(e.target.value) })}
                            />
                            {!form.stallId && <small>{language === 'vi' ? 'Chọn gian hàng để nhập số lượng sách.' : 'Select a stall to enter the book quantity.'}</small>}
                        </label>

                        <div className="admin-form-wide admin-cover-upload-section">
                            <span className="admin-cover-label">{language === 'vi' ? 'Ảnh bìa sách' : 'Book Cover'}</span>
                            <div className="admin-cover-upload-card">
                                {/* Khung ảnh xem trước bìa sách chuẩn tỉ lệ */}
                                <div className="admin-cover-preview-box">
                                    {form.coverUrl ? (
                                        <SafeImage
                                            src={form.coverUrl} 
                                            alt="Cover Preview" 
                                            className="admin-cover-img-preview" 

                                        />
                                    ) : (
                                        <div className="admin-cover-no-img">
                                            <ImagePlus size={20} className="admin-cover-empty-icon" />
                                            <span>{language === 'vi' ? 'Chưa có ảnh' : 'No image'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Các điều khiển ảnh bìa nằm thẳng trên 1 hàng */}
                                <div className="admin-cover-controls">
                                    <div className="admin-cover-actions-row">
                                        <div className="admin-cover-url-box">
                                            <Link2 size={16} className="admin-cover-url-icon" />
                                            <input 
                                                maxLength={10000000}
                                                type="text"
                                                name="bookCoverUrl"
                                                autoComplete="off"
                                                data-lpignore="true"
                                                value={form.coverUrl.startsWith('data:') ? '' : form.coverUrl} 
                                                onChange={e => { setForm({ ...form, coverUrl: e.target.value }); setCoverFileName(''); setCoverError(''); }} 
                                                placeholder={form.coverUrl.startsWith('data:') 
                                                    ? (language === 'vi' ? 'Đang dùng ảnh tải lên từ máy tính' : 'Using uploaded image from device') 
                                                    : (language === 'vi' ? 'Dán đường dẫn ảnh (URL https://... hoặc /duong_sach_logo.png)' : 'Paste image URL or enter path...')}
                                            />
                                            <div className="admin-cover-url-actions">
                                                {form.coverUrl && /^https?:\/\//.test(form.coverUrl) && (
                                                    <a 
                                                        href={form.coverUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="admin-cover-open-url" 
                                                        title={language === 'vi' ? 'Mở ảnh trong thẻ mới' : 'Open image in new tab'} 
                                                        aria-label={language === 'vi' ? 'Mở ảnh trong thẻ mới' : 'Open image in new tab'}
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                                {form.coverUrl && !form.coverUrl.startsWith('data:') && (
                                                    <button 
                                                        type="button" 
                                                        className="admin-cover-clear-url" 
                                                        onClick={() => setForm(curr => ({ ...curr, coverUrl: '' }))}
                                                        title={language === 'vi' ? 'Xóa URL' : 'Clear URL'}
                                                        aria-label={language === 'vi' ? 'Xóa URL' : 'Clear URL'}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <label 
                                            className="admin-upload-btn" 
                                            title={language === 'vi' ? 'Tải ảnh lên từ máy tính' : 'Upload image from device'}
                                            aria-label={language === 'vi' ? 'Tải ảnh lên' : 'Upload image'}
                                        >
                                            <Upload size={18} />
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                style={{ display: 'none' }} 
                                                onChange={e => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); e.target.value = ''; }}
                                            />
                                        </label>

                                        {form.coverUrl && (
                                            <button 
                                                type="button" 
                                                className="admin-cover-btn-delete"
                                                onClick={() => { setForm({ ...form, coverUrl: '' }); setCoverFileName(''); setCoverError(''); }} 
                                                title={language === 'vi' ? 'Xóa ảnh bìa hiện tại' : 'Remove cover image'}
                                                aria-label={language === 'vi' ? 'Xóa ảnh' : 'Remove image'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="admin-cover-footer-row">
                                        {coverFileName ? (
                                            <div className="admin-cover-file-info">
                                                <FileImage size={13} className="admin-file-badge-icon" />
                                                <span className="admin-cover-filename-badge" title={coverFileName}>{coverFileName}</span>
                                                <button 
                                                    type="button" 
                                                    className="admin-cover-reset-btn" 
                                                    onClick={() => { setForm(prev => ({ ...prev, coverUrl: '' })); setCoverFileName(''); setCoverError(''); }}
                                                    title={language === 'vi' ? 'Hủy ảnh tải lên' : 'Remove uploaded file'}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="admin-cover-hint-text">
                                                {language === 'vi' 
                                                    ? 'Dán đường dẫn ảnh trực tuyến hoặc tải tệp từ máy tính (khuyến nghị tỉ lệ 2:3, tối đa 5MB).' 
                                                    : 'Paste an online image URL or upload from device (ratio 2:3, max 5MB).'}
                                            </span>
                                        )}

                                        {coverError && (
                                            <span className="admin-cover-error-pill">
                                                <AlertCircle size={13} />
                                                {coverError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <fieldset className="admin-form-wide admin-label-picker">
                            <legend>{language === 'vi' ? 'Nhãn đặc biệt' : 'Special Labels'}</legend>
                            {labels.filter(item => item.status === 'active').map(item => (
                                <label key={item.id}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.labelIds?.includes(item.id) || false} 
                                        onChange={e => setForm({ 
                                            ...form, 
                                            labelIds: e.target.checked 
                                                ? [...(form.labelIds || []), item.id] 
                                                : (form.labelIds || []).filter(id => id !== item.id) 
                                        })}
                                    />
                                    {item.name}
                                </label>
                            ))}
                        </fieldset>

                        <label className="admin-form-wide">
                            {language === 'vi' ? 'Tóm tắt / Mô tả nội dung sách' : 'Description'}
                            <textarea maxLength={20000} rows={4} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={language === 'vi' ? 'Giới thiệu ngắn về cuốn sách...' : 'Brief description...'}/>
                        </label>
                    </div>
                    <div className="admin-form-actions">
                        <button type="button" onClick={() => setEditing(undefined)}>{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                        <button className="admin-library-primary" type="submit">{language === 'vi' ? 'Lưu thông tin sách' : 'Save book'}</button>
                    </div>
                </form>
            </div>,
            document.body
        )}

        {/* Modal Xem chi tiết sách */}
        {viewingBook && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) setViewingBook(null); }}
            >
                <div className="admin-book-detail-modal" onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div>
                            <h2>{language === 'vi' ? 'Chi tiết cuốn sách' : 'Book Details'}</h2>
                            <p>ISBN: <code>{viewingBook.isbn}</code></p>
                        </div>
                        <button type="button" onClick={() => setViewingBook(null)}><X size={18} /></button>
                    </div>
                    <div className="admin-book-detail-body">
                        <div 
                            className="admin-book-detail-cover-wrap is-clickable"
                            onClick={() => {
                                if (viewingBook.coverUrl) {
                                    setPreviewImage({ url: viewingBook.coverUrl, title: viewingBook.title });
                                }
                            }}
                            title={language === 'vi' ? 'Nhấn để phóng to xem ảnh' : 'Click to zoom image'}
                        >
                            <SafeImage className="admin-book-detail-cover" src={viewingBook.coverUrl} alt={viewingBook.title} />
                            {viewingBook.status && (
                                <span className={`admin-book-detail-status ${viewingBook.status}`}>
                                    {viewingBook.status === 'active' ? (language === 'vi' ? 'Đang hiển thị' : 'Active') : (language === 'vi' ? 'Đã lưu trữ' : 'Archived')}
                                </span>
                            )}
                        </div>
                        <div className="admin-book-detail-info">
                            <h3 className="admin-book-detail-title">{viewingBook.title}</h3>
                            {viewingBook.titleEn && (
                                <p className="admin-book-detail-title-en">{viewingBook.titleEn}</p>
                            )}

                            <div className="admin-book-detail-grid">
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">{language === 'vi' ? 'Tác giả' : 'Author'}</span>
                                    <span className="admin-detail-value">{viewingBook.author}</span>
                                </div>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">{language === 'vi' ? 'Nhà xuất bản' : 'Publisher'}</span>
                                    <span className="admin-detail-value">{viewingBook.publisher || '—'}</span>
                                </div>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">{language === 'vi' ? 'Năm xuất bản' : 'Year'}</span>
                                    <span className="admin-detail-value">{viewingBook.publicationYear || '—'}</span>
                                </div>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">{language === 'vi' ? 'Phân loại' : 'Category'}</span>
                                    <div className="admin-detail-value">
                                        <BookCategorySelect book={viewingBook} categories={categories} language={language} onSaved={updated => { setViewingBook(updated); setBooks(rows => rows.map(row => row.id === updated.id ? updated : row)); }} />
                                    </div>
                                </div>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">{language === 'vi' ? 'Xếp hạng' : 'Ranking'}</span>
                                    <div className="admin-detail-value admin-detail-ranks">
                                        {viewingBook.bestsellerRank ? (
                                            <span className="admin-rank-chip bestseller">Top #{viewingBook.bestsellerRank} {language === 'vi' ? 'Bán chạy' : 'Bestseller'}</span>
                                        ) : null}
                                        {viewingBook.weeklyRank ? (
                                            <span className="admin-rank-chip hot">Hot #{viewingBook.weeklyRank} {language === 'vi' ? 'Hot tuần' : 'Weekly Hot'}</span>
                                        ) : null}
                                        {!viewingBook.bestsellerRank && !viewingBook.weeklyRank ? (
                                            <span className="admin-rank-unranked">{language === 'vi' ? 'Chưa xếp hạng' : 'Unranked'}</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <div className="admin-detail-stalls-section">
                                <span className="admin-detail-section-title">{language === 'vi' ? 'Gian hàng phân phối & Tồn kho' : 'Stalls & Stock'}</span>
                                <div className="admin-detail-stalls-body">
                                    {getBookStalls(viewingBook).length === 0 ? (
                                        <span className="admin-no-stall-badge">{language === 'vi' ? 'Chưa có gian hàng nào phân phối sách này' : 'No stalls carry this book'}</span>
                                    ) : (
                                        <div className="admin-book-stalls-list">
                                            {getBookStalls(viewingBook).map(s => (
                                                <span key={s.id || s.stallId} className="admin-stall-pill">
                                                    <Store size={13} />
                                                    <strong className="admin-stall-pill-name">{s.stallName} ({s.stallCode || '—'})</strong>
                                                    <span className="admin-stall-pill-qty">{language === 'vi' ? 'Tồn:' : 'Stock:'} <strong>{s.inventoryQuantity}</strong> | {language === 'vi' ? 'Bán:' : 'Sold:'} <strong>{s.soldQuantity ?? 0}</strong></span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const b = viewingBook;
                                                            setViewingBook(null);
                                                            setQrModalBook({ book: b, selectedStallId: s.id || s.stallId });
                                                        }}
                                                        className="admin-stall-qr-btn"
                                                        title={language === 'vi' ? `Tạo mã QR riêng cho gian hàng ${s.stallName}` : 'QR Code for this stall'}
                                                    >
                                                        <QrCode size={13} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {viewingBook.description && (
                                <div className="admin-book-detail-desc">
                                    <span className="admin-detail-section-title">{language === 'vi' ? 'Tóm tắt nội dung' : 'Summary'}</span>
                                    <p>{language === 'en' && viewingBook.descriptionEn ? viewingBook.descriptionEn : viewingBook.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="admin-form-actions">
                        <button type="button" className="admin-btn-detail-close" onClick={() => setViewingBook(null)}>
                            {language === 'vi' ? 'Đóng' : 'Close'}
                        </button>
                        <button 
                            type="button" 
                            className="admin-library-secondary"
                            onClick={() => {
                                const b = viewingBook;
                                setViewingBook(null);
                                setRankingModalBook({
                                    book: b,
                                    bestsellerRank: b.bestsellerRank ?? null,
                                    weeklyRank: b.weeklyRank ?? null,
                                });
                            }}
                        >
                            <Trophy size={15} />
                            <span>{language === 'vi' ? 'Gán / Sửa xếp hạng' : 'Edit ranking'}</span>
                        </button>
                        <button className="admin-library-primary" onClick={() => { const b = viewingBook; setViewingBook(null); openEdit(b); }}>
                            <Edit3 size={15}/>
                            <span>{language === 'vi' ? 'Chỉnh sửa sách' : 'Edit Book'}</span>
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Xác nhận Xóa / Lưu trữ sách */}
        {deletingBook && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) setDeletingBook(null); }}
            >
                <div className="admin-confirm-modal-box" onClick={e => e.stopPropagation()}>
                    <div className="admin-confirm-head">
                        <div className="admin-confirm-head-icon" style={deletingBook.permanent ? { background: '#fee2e2', color: '#dc2626' } : undefined}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3>
                                {deletingBook.permanent 
                                    ? (language === 'vi' ? 'Xác nhận xóa vĩnh viễn sách' : 'Confirm Permanent Delete')
                                    : (language === 'vi' ? 'Xác nhận lưu trữ sách' : 'Confirm Archive Book')}
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                {deletingBook.permanent
                                    ? (language === 'vi' ? 'Dữ liệu sách sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu' : 'This will permanently remove the book from the database')
                                    : (language === 'vi' ? 'Hành động này sẽ ẩn sách khỏi Thư viện số' : 'This will hide the book from the digital library')}
                            </span>
                        </div>
                    </div>

                    <div className="admin-confirm-target-card">
                        <SafeImage src={deletingBook.book.coverUrl} alt="" />
                        <div className="admin-confirm-target-info">
                            <strong>{deletingBook.book.title}</strong>
                            <small>{deletingBook.book.author} • ISBN: {deletingBook.book.isbn}</small>
                        </div>
                    </div>

                    <p className="admin-confirm-warning">
                        {deletingBook.permanent
                            ? (language === 'vi'
                                ? `Bạn có chắc chắn muốn xóa vĩnh viễn cuốn sách "${deletingBook.book.title}"? Mọi thông tin sách, bảng xếp hạng và tồn kho sẽ bị xóa vĩnh viễn và không thể khôi phục!`
                                : `Are you sure you want to permanently delete "${deletingBook.book.title}"? This cannot be undone.`)
                            : (language === 'vi' 
                                ? 'Bạn có chắc chắn muốn chuyển cuốn sách này sang trạng thái lưu trữ? Sách sẽ không còn xuất hiện trong danh sách hiển thị và các gian hàng sẽ không thể bán cuốn sách này.'
                                : 'Are you sure you want to archive this book? It will no longer be visible to public users or searchable in the library.')}
                    </p>

                    <div className="admin-confirm-actions">
                        <button className="admin-confirm-btn-cancel" onClick={() => setDeletingBook(null)}>
                            {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                        </button>
                        <button className="admin-confirm-btn-danger" onClick={handleConfirmDelete}>
                            {deletingBook.permanent
                                ? (language === 'vi' ? 'Xác nhận xóa vĩnh viễn' : 'Permanently Delete')
                                : (language === 'vi' ? 'Xác nhận lưu trữ' : 'Confirm Archive')}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Xem xét / Kiểm duyệt yêu cầu sách */}
        {reviewing && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) { setReviewing(null); setRejecting(false); } }}
            >
                <div className="admin-review-modal" onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div>
                            <h2>{language === 'vi' ? 'Xem xét yêu cầu sách từ đối tác' : 'Review Book Submission'}</h2>
                            <p>{reviewing.stallName} — {reviewing.stallCode} · {submissionLabel(reviewing, language)} · {language === 'vi' ? 'Người gửi:' : 'Submitter:'} {reviewing.submitterName || 'Đối tác'}</p>
                        </div>
                        <button onClick={() => { setReviewing(null); setRejecting(false); }}><X /></button>
                    </div>

                    <div className={`admin-version-comparison ${reviewing.type === 'CREATE' ? 'is-create' : ''}`}>
                        {reviewing.type === 'UPDATE' && (
                            <VersionCard title={language === 'vi' ? 'Thông tin hiện tại trên hệ thống' : 'Current Approved Information'} data={reviewing.currentApprovedData}/>
                        )}
                        <VersionCard title={language === 'vi' ? 'Thông tin đề xuất từ gian hàng' : 'Proposed Information from Partner'} data={reviewing.proposedData}/>
                    </div>

                    {reviewing.status === 'PENDING' ? (
                        <div className="admin-review-actions">
                            {rejecting ? (
                                <>
                                    <label>
                                        {language === 'vi' ? 'Lý do từ chối (bắt buộc nhập để đối tác biết và sửa):' : 'Rejection Reason:'}
                                        <textarea maxLength={2000}
                                            value={rejectionReason} 
                                            onChange={e => setRejectionReason(e.target.value)} 
                                            rows={3}
                                            placeholder={language === 'vi' ? 'Nhập rõ lý do từ chối (ví dụ: Thiếu ảnh bìa sắc nét, sai ISBN...)' : 'Enter rejection reason...'}
                                        />
                                    </label>
                                    <button onClick={() => setRejecting(false)}>{language === 'vi' ? 'Quay lại' : 'Back'}</button>
                                    <button 
                                        className="is-reject" 
                                        disabled={!rejectionReason.trim()} 
                                        onClick={() => handleRejectSubmission(reviewing)}
                                    >
                                        {language === 'vi' ? 'Xác nhận từ chối' : 'Confirm Reject'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="is-reject" onClick={() => setRejecting(true)}>
                                        {language === 'vi' ? 'Từ chối yêu cầu' : 'Reject Submission'}
                                    </button>
                                    <button className="admin-library-primary" onClick={() => handleApproveSubmission(reviewing)}>
                                        {language === 'vi' ? 'Phê duyệt sách' : 'Approve Book'}
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="admin-review-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span className={`admin-request-status ${reviewing.status.normalize('NFC').toLowerCase()}`}>
                                    {reviewing.status === 'APPROVED' ? (language === 'vi' ? 'Đã duyệt' : 'Approved') : (language === 'vi' ? 'Bị từ chối' : 'Rejected')}
                                </span>
                                {reviewing.rejectionReason && (
                                    <span style={{ fontSize: '0.8rem', color: '#9b4135' }}>
                                        <strong>{language === 'vi' ? 'Lý do: ' : 'Reason: '}</strong>{reviewing.rejectionReason}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setReviewing(null)}>{language === 'vi' ? 'Đóng' : 'Close'}</button>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        )}

        {/* Modal Sửa Danh mục / Nhãn */}
        {editingTaxonomy && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) setEditingTaxonomy(null); }}
            >
                <form className="admin-taxonomy-edit-modal" onSubmit={handleSaveTaxonomy} onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div>
                            <h2>{editingTaxonomy.type === 'category' ? (language === 'vi' ? 'Chỉnh sửa danh mục sách' : 'Edit Category') : (language === 'vi' ? 'Chỉnh sửa nhãn đặc biệt' : 'Edit Label')}</h2>
                            <p>{editingTaxonomy.count > 0 ? (language === 'vi' ? `Hiện có ${editingTaxonomy.count} cuốn sách thuộc mục này.` : `${editingTaxonomy.count} books linked.`) : (language === 'vi' ? 'Chưa có sách nào liên kết.' : 'No linked books.')}</p>
                        </div>
                        <button type="button" onClick={() => setEditingTaxonomy(null)}><X /></button>
                    </div>

                    <div className="admin-taxonomy-edit-body">
                        <label>
                            {language === 'vi' ? 'Tên hiển thị *' : 'Display Name *'}
                            <input maxLength={200}
                                value={editingTaxonomy.name} 
                                onChange={e => setEditingTaxonomy({ ...editingTaxonomy, name: e.target.value })} 
                                required 
                                placeholder={language === 'vi' ? 'Nhập tên...' : 'Enter name...'}
                            />
                        </label>

                        {editingTaxonomy.type === 'category' && (
                            <label>
                                {language === 'vi' ? 'Tên tiếng Anh (tùy chọn)' : 'English Name (Optional)'}
                                <input maxLength={200}
                                    value={editingTaxonomy.nameEn || ''} 
                                    onChange={e => setEditingTaxonomy({ ...editingTaxonomy, nameEn: e.target.value })} 
                                    placeholder="e.g. Vietnamese Literature"
                                />
                            </label>
                        )}

                        <label>
                            {language === 'vi' ? 'Trạng thái hoạt động' : 'Status'}
                            <select 
                                value={editingTaxonomy.status} 
                                onChange={e => setEditingTaxonomy({ ...editingTaxonomy, status: e.target.value as any })}
                            >
                                <option value="active">{language === 'vi' ? 'Hoạt động (Hiển thị ở bộ lọc)' : 'Active (Visible in filters)'}</option>
                                <option value="archived">{language === 'vi' ? 'Đã lưu trữ (Ẩn khỏi bộ lọc)' : 'Archived (Hidden from filters)'}</option>
                            </select>
                        </label>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" onClick={() => setEditingTaxonomy(null)}>
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button className="admin-library-primary" type="submit">
                            {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>,
            document.body
        )}

        {/* Modal Xác nhận Xóa / Lưu trữ Danh mục / Nhãn */}
        {deletingTaxonomy && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) setDeletingTaxonomy(null); }}
            >
                <div className="admin-confirm-modal-box" onClick={e => e.stopPropagation()}>
                    <div className="admin-confirm-head">
                        <div className="admin-confirm-head-icon">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3>
                                {deletingTaxonomy.permanent 
                                    ? (language === 'vi' ? 'Xác nhận xóa vĩnh viễn' : 'Confirm Permanent Delete') 
                                    : (language === 'vi' ? 'Xác nhận lưu trữ mục' : 'Confirm Archive')}
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                {deletingTaxonomy.type === 'category' 
                                    ? (language === 'vi' ? 'Danh mục sách' : 'Book Category') 
                                    : (language === 'vi' ? 'Nhãn đặc biệt' : 'Book Label')}
                            </span>
                        </div>
                    </div>

                    <div className="admin-confirm-target-card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong>{deletingTaxonomy.name}</strong>
                            <small style={{ color: '#6b7280' }}>
                                {deletingTaxonomy.count > 0 
                                    ? (language === 'vi' ? `Có ${deletingTaxonomy.count} cuốn sách liên kết` : `${deletingTaxonomy.count} books linked`) 
                                    : (language === 'vi' ? 'Không có sách liên kết' : '0 books linked')}
                                {' · '}
                                {deletingTaxonomy.status === 'active' ? (language === 'vi' ? 'Đang hoạt động' : 'Active') : (language === 'vi' ? 'Đã lưu trữ' : 'Archived')}
                            </small>
                        </div>
                    </div>

                    <p className="admin-confirm-warning">
                        {deletingTaxonomy.type === 'category'
                            ? (deletingTaxonomy.count > 0
                                ? (language === 'vi'
                                    ? `Mục "${deletingTaxonomy.name}" đang có ${deletingTaxonomy.count} cuốn sách liên kết. Khi bạn xóa, tất cả các sách này sẽ tự động được chuyển về phân loại mặc định "Chưa phân loại".`
                                    : `This category has ${deletingTaxonomy.count} linked books. When deleted, all these books will automatically be moved to default "Uncategorized".`)
                                : (language === 'vi'
                                    ? `Mục "${deletingTaxonomy.name}" không có sách nào liên kết. Bạn có chắc chắn muốn xóa không?`
                                    : `Are you sure you want to delete "${deletingTaxonomy.name}"?`))
                            : (deletingTaxonomy.count > 0
                                ? (language === 'vi'
                                    ? `Nhãn "${deletingTaxonomy.name}" đang gán cho ${deletingTaxonomy.count} cuốn sách. Khi xóa, nhãn này sẽ được gỡ khỏi tất cả các sách.`
                                    : `This label is assigned to ${deletingTaxonomy.count} books. It will be removed from all books.`)
                                : (language === 'vi'
                                    ? `Bạn có chắc chắn muốn xóa nhãn "${deletingTaxonomy.name}"?`
                                    : `Are you sure you want to delete "${deletingTaxonomy.name}"?`))}
                    </p>

                    <div className="admin-confirm-actions">
                        <button className="admin-confirm-btn-cancel" onClick={() => setDeletingTaxonomy(null)}>
                            {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                        </button>
                        <button className="admin-confirm-btn-danger" onClick={handleExecuteDeleteTaxonomy}>
                            {language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Danh sách Gian hàng có sách */}
        {viewingStallsBook && createPortal(
            <div className="admin-library-modal" role="dialog" aria-modal="true" onClick={() => setViewingStallsBook(null)}>
                <div className="admin-stalls-popup-modal" onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div className="admin-stalls-popup-icon">
                                <Store size={20} />
                            </div>
                            <div>
                                <h2>{language === 'vi' ? 'Danh sách gian hàng phân phối sách' : 'Distributing Stalls'}</h2>
                                <p>
                                    <strong>{viewingStallsBook.book.title}</strong>
                                    {' · ISBN: '}{viewingStallsBook.book.isbn}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setViewingStallsBook(null)}><X size={18} /></button>
                    </div>

                    <div className="admin-stalls-popup-summary">
                        <div className="admin-stalls-summary-item">
                            <span>{language === 'vi' ? 'Tổng số gian hàng:' : 'Total Stalls:'}</span>
                            <strong>{viewingStallsBook.stalls.length}</strong>
                        </div>
                        <div className="admin-stalls-summary-item">
                            <span>{language === 'vi' ? 'Tổng tồn kho:' : 'Total In Stock:'}</span>
                            <strong style={{ color: '#166534' }}>
                                {viewingStallsBook.stalls.reduce((sum, s) => sum + (s.inventoryQuantity || 0), 0)} {language === 'vi' ? 'cuốn' : 'copies'}
                            </strong>
                        </div>
                        <div className="admin-stalls-summary-item">
                            <span>{language === 'vi' ? 'Tổng đã bán:' : 'Total Sold:'}</span>
                            <strong style={{ color: '#2563eb' }}>
                                {viewingStallsBook.stalls.reduce((sum, s) => sum + (s.soldQuantity || 0), 0)} {language === 'vi' ? 'cuốn' : 'copies'}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-stalls-popup-table-wrap admin-stalls-popup-desktop-table">
                        <table className="admin-stalls-popup-table">
                            <thead>
                                <tr>
                                    <th>{language === 'vi' ? 'Mã gian' : 'Code'}</th>
                                    <th>{language === 'vi' ? 'Tên gian hàng' : 'Stall Name'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'vi' ? 'Tồn kho' : 'Stock'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'vi' ? 'Đã bán' : 'Sold'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewingStallsBook.stalls.map(s => {
                                    const isOut = s.inventoryQuantity === 0;
                                    const isLow = s.inventoryQuantity > 0 && s.inventoryQuantity <= 4;
                                    return (
                                        <tr key={s.id || s.stallId}>
                                            <td>
                                                <code className="admin-isbn-code" style={{ fontSize: '0.78rem' }}>
                                                    {s.stallCode || '—'}
                                                </code>
                                            </td>
                                            <td>
                                                <strong>{s.stallName || 'Gian hàng'}</strong>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`admin-qty-badge ${isOut ? 'is-out' : isLow ? 'is-low' : ''}`}>
                                                    {s.inventoryQuantity}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="admin-sold-qty">{s.soldQuantity ?? 0}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`admin-availability ${isOut ? 'out_of_stock' : isLow ? 'low_stock' : 'available'}`}>
                                                    {isOut 
                                                        ? (language === 'vi' ? 'Hết hàng' : 'Out of stock')
                                                        : isLow
                                                            ? (language === 'vi' ? 'Sắp hết' : 'Low stock')
                                                            : (language === 'vi' ? 'Còn hàng' : 'In stock')}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards for stalls popup */}
                    <div className="admin-stalls-popup-mobile-cards">
                        {viewingStallsBook.stalls.map(s => {
                            const isOut = s.inventoryQuantity === 0;
                            const isLow = s.inventoryQuantity > 0 && s.inventoryQuantity <= 4;
                            return (
                                <div key={s.id || s.stallId} className="admin-stalls-popup-mobile-card">
                                    <div className="admin-spmc-header">
                                        <strong>{s.stallName || 'Gian hàng'}</strong>
                                        <code className="admin-isbn-code">{s.stallCode || '—'}</code>
                                    </div>
                                    <div className="admin-spmc-row">
                                        <div>
                                            <span className="admin-spmc-label">{language === 'vi' ? 'Tồn kho:' : 'Stock:'} </span>
                                            <span className={`admin-qty-badge ${isOut ? 'is-out' : isLow ? 'is-low' : ''}`}>{s.inventoryQuantity}</span>
                                        </div>
                                        <div>
                                            <span className="admin-spmc-label">{language === 'vi' ? 'Đã bán:' : 'Sold:'} </span>
                                            <span className="admin-sold-qty">{s.soldQuantity ?? 0}</span>
                                        </div>
                                        <div>
                                            <span className={`admin-availability ${isOut ? 'out_of_stock' : isLow ? 'low_stock' : 'available'}`}>
                                                {isOut 
                                                    ? (language === 'vi' ? 'Hết' : 'Out')
                                                    : isLow
                                                        ? (language === 'vi' ? 'Sắp hết' : 'Low')
                                                        : (language === 'vi' ? 'Còn' : 'In')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="admin-form-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                            type="button" 
                            onClick={() => {
                                const bookToView = viewingStallsBook.book;
                                setViewingStallsBook(null);
                                setViewingBook(bookToView);
                            }}
                            style={{ fontSize: '0.78rem', color: '#166534', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {language === 'vi' ? 'Xem đầy đủ chi tiết sách →' : 'View full book details →'}
                        </button>
                        <button 
                            className="admin-library-primary" 
                            type="button" 
                            onClick={() => setViewingStallsBook(null)}
                        >
                            {language === 'vi' ? 'Đóng' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Thông báo CRUD (Success / Error / Notice Modal) */}
        {modalNotice && createPortal(
            <div 
                className="admin-library-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={e => { if (e.target === e.currentTarget) setModalNotice(null); }}
            >
                <div className="admin-notice-modal-box" onClick={e => e.stopPropagation()}>
                    <div className={`admin-notice-icon ${modalNotice.type}`}>
                        {modalNotice.type === 'success' && <CheckCircle2 size={32} />}
                        {modalNotice.type === 'error' && <AlertCircle size={32} />}
                        {modalNotice.type === 'info' && <Info size={32} />}
                    </div>
                    <h3 className="admin-notice-title">{modalNotice.title}</h3>
                    <p className="admin-notice-msg">{modalNotice.message}</p>
                    <button className="admin-notice-btn" onClick={() => setModalNotice(null)}>
                        {language === 'vi' ? 'Đã hiểu' : 'OK'}
                    </button>
                </div>
            </div>,
            document.body
        )}

        {/* Modal Thiết lập Thứ hạng Sách */}
        {rankingModalBook && createPortal(
            <div className="admin-library-modal" role="dialog" aria-modal="true" onClick={() => setRankingModalBook(null)}>
                <form className="admin-ranking-edit-modal" onSubmit={handleSaveBookRanking} onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div>
                            <h2>{language === 'vi' ? 'Thiết lập xếp hạng sách' : 'Set Book Ranking'}</h2>
                            <p>{language === 'vi' ? 'Gán vị trí Top Bestseller hoặc Hot tuần này' : 'Assign bestseller or weekly hot ranking position'}</p>
                        </div>
                        <button type="button" onClick={() => setRankingModalBook(null)}><X size={18} /></button>
                    </div>

                    <div className="admin-ranking-modal-body">
                        <div className="admin-ranking-book-snippet">
                            <SafeImage src={rankingModalBook.book.coverUrl} alt="" className="admin-ranking-snippet-cover" />
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#111827' }}>{rankingModalBook.book.title}</strong>
                                <small style={{ color: '#6b7280' }}>
                                    {rankingModalBook.book.author} · ISBN: {rankingModalBook.book.isbn}
                                </small>
                                <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#4b5563' }}>
                                    {language === 'vi' ? 'Đã bán: ' : 'Sold: '}<strong>{rankingModalBook.book.totalSold || 0}</strong> {language === 'vi' ? 'cuốn' : 'copies'}
                                </div>
                            </div>
                        </div>

                        <div className="admin-ranking-fields-grid">
                            <div className="admin-ranking-field-card">
                                <div className="admin-ranking-field-title">
                                    <strong>Top 100 {language === 'vi' ? 'Bán chạy (Bestseller)' : 'Bestsellers'}</strong>
                                    <span className="admin-ranking-field-hint">{language === 'vi' ? 'Vị trí từ 1 - 100' : 'Rank 1 - 100'}</span>
                                </div>
                                <div className="admin-ranking-input-group">
                                    <span className="admin-ranking-input-prefix">#</span>
                                    <input step={1}
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={rankingModalBook.bestsellerRank ?? ''}
                                        onChange={e => {
                                            const v = e.target.value.trim();
                                            setRankingModalBook({
                                                ...rankingModalBook,
                                                bestsellerRank: v === '' ? null : Math.max(1, Math.min(100, parseInt(v, 10) || 1))
                                            });
                                        }}
                                        placeholder={language === 'vi' ? 'Chưa xếp hạng' : 'Unranked'}
                                    />
                                    {rankingModalBook.bestsellerRank !== null && rankingModalBook.bestsellerRank !== undefined && (
                                        <button
                                            type="button"
                                            className="admin-ranking-clear-btn"
                                            onClick={() => setRankingModalBook({ ...rankingModalBook, bestsellerRank: null })}
                                            title={language === 'vi' ? 'Gỡ xếp hạng bán chạy' : 'Clear rank'}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="admin-ranking-field-card">
                                <div className="admin-ranking-field-title">
                                    <strong>{language === 'vi' ? 'Hot tuần này (Weekly Hot)' : 'Weekly Hot'}</strong>
                                    <span className="admin-ranking-field-hint">{language === 'vi' ? 'Vị trí từ 1 - 100' : 'Rank 1 - 100'}</span>
                                </div>
                                <div className="admin-ranking-input-group">
                                    <span className="admin-ranking-input-prefix">#</span>
                                    <input step={1}
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={rankingModalBook.weeklyRank ?? ''}
                                        onChange={e => {
                                            const v = e.target.value.trim();
                                            setRankingModalBook({
                                                ...rankingModalBook,
                                                weeklyRank: v === '' ? null : Math.max(1, Math.min(100, parseInt(v, 10) || 1))
                                            });
                                        }}
                                        placeholder={language === 'vi' ? 'Chưa xếp hạng' : 'Unranked'}
                                    />
                                    {rankingModalBook.weeklyRank !== null && rankingModalBook.weeklyRank !== undefined && (
                                        <button
                                            type="button"
                                            className="admin-ranking-clear-btn"
                                            onClick={() => setRankingModalBook({ ...rankingModalBook, weeklyRank: null })}
                                            title={language === 'vi' ? 'Gỡ xếp hạng hot tuần' : 'Clear rank'}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="admin-ranking-modal-help">
                            {language === 'vi'
                                ? 'Khi gán thứ hạng, sách sẽ được đưa vào BXH và hiển thị tương ứng ở Thư viện số và Landing page (Top 12 hiển thị trang chủ). Để trống ô để gỡ sách khỏi bảng xếp hạng.'
                                : 'Setting a rank will place the book into the ranking list. Leave blank or click the X icon to remove from ranking.'}
                        </p>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" onClick={() => setRankingModalBook(null)}>
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button className="admin-library-primary" type="submit">
                            {language === 'vi' ? 'Lưu xếp hạng' : 'Save Ranking'}
                        </button>
                    </div>
                </form>
            </div>,
            document.body
        )}

        {/* Modal Thêm Sách vào Bảng Xếp Hạng */}
        {addingBookToRank && createPortal(
            <div className="admin-library-modal" role="dialog" aria-modal="true" onClick={() => setAddingBookToRank(false)}>
                <form className="admin-ranking-add-modal" onSubmit={handleAddBookToCurrentRank} onClick={e => e.stopPropagation()}>
                    <div className="admin-form-head">
                        <div>
                            <h2>
                                {language === 'vi'
                                    ? `Thêm sách vào BXH ${rankingType === 'bestseller' ? 'Bán chạy' : 'Hot tuần này'}`
                                    : `Add Book to ${rankingType === 'bestseller' ? 'Bestsellers' : 'Weekly Hot'}`}
                            </h2>
                            <p>{language === 'vi' ? 'Chọn sách có sẵn trong hệ thống và chỉ định vị trí xếp hạng.' : 'Select an active book and specify its rank position.'}</p>
                        </div>
                        <button type="button" onClick={() => setAddingBookToRank(false)}><X size={18} /></button>
                    </div>

                    <div className="admin-ranking-modal-body">
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                            {language === 'vi' ? 'Chọn cuốn sách cần xếp hạng *' : 'Select Book *'}
                            <select
                                value={selectedBookToRank}
                                onChange={e => {
                                    const bookId = e.target.value;
                                    setSelectedBookToRank(bookId);
                                    const b = books.find(item => item.id === bookId);
                                    if (b) {
                                        const cur = rankingType === 'bestseller' ? b.bestsellerRank : b.weeklyRank;
                                        if (cur) setNewBookRankPosition(cur);
                                    }
                                }}
                                required
                                style={{ padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                            >
                                <option value="">{language === 'vi' ? '-- Chọn sách từ thư viện --' : '-- Choose a book --'}</option>
                                {books
                                    .filter(b => b.status === 'active')
                                    .map(b => {
                                        const currentRank = rankingType === 'bestseller' ? b.bestsellerRank : b.weeklyRank;
                                        return (
                                            <option key={b.id} value={b.id}>
                                                {b.title} — {b.author} {currentRank ? `(Hiện tại: #${currentRank})` : `(${language === 'vi' ? 'Chưa xếp hạng' : 'Unranked'})`}
                                            </option>
                                        );
                                    })}
                            </select>
                        </label>

                        {selectedBookToRank && (() => {
                            const book = books.find(b => b.id === selectedBookToRank);
                            if (!book) return null;
                            return (
                                <div className="admin-ranking-book-snippet" style={{ margin: '0.2rem 0' }}>
                                    <SafeImage src={book.coverUrl} alt="" className="admin-ranking-snippet-cover" />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#111827' }}>{book.title}</strong>
                                        <small style={{ color: '#6b7280' }}>{book.author} · ISBN: {book.isbn}</small>
                                        <div style={{ marginTop: '3px', fontSize: '0.78rem', color: '#4b5563' }}>
                                            {language === 'vi' ? 'Đã bán: ' : 'Sold: '}<strong>{book.totalSold || 0}</strong> {language === 'vi' ? 'cuốn' : 'copies'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                            {language === 'vi' ? 'Vị trí thứ hạng mong muốn (Hạng 1 - 100) *' : 'Target Rank Position (1 - 100) *'}
                            <div className="admin-ranking-input-group">
                                <span className="admin-ranking-input-prefix">#</span>
                                <input step={1}
                                    type="number"
                                    min="1"
                                    max="100"
                                    required
                                    value={newBookRankPosition}
                                    onChange={e => setNewBookRankPosition(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                                    placeholder="1 - 100"
                                />
                            </div>
                        </label>
                    </div>

                    <div className="admin-form-actions">
                        <button type="button" onClick={() => setAddingBookToRank(false)}>
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button className="admin-library-primary" type="submit" disabled={!selectedBookToRank}>
                            {language === 'vi' ? 'Thêm vào BXH' : 'Add to Ranking'}
                        </button>
                    </div>
                </form>
            </div>,
            document.body
        )}

        {/* Modal Mã QR & In tem sách */}
        {qrModalBook && createPortal((() => {
            const bookStallsList = getBookStalls(qrModalBook.book);
            const activeStall = bookStallsList.find(s => (s.id || s.stallId) === qrModalBook.selectedStallId);
            const qrUrl = qrModalBook.selectedStallId && qrModalBook.selectedStallId !== 'all'
                ? `${window.location.origin}/thu-vien-so?book=${encodeURIComponent(qrModalBook.book.id)}&stall=${encodeURIComponent(qrModalBook.selectedStallId)}`
                : `${window.location.origin}/thu-vien-so?book=${encodeURIComponent(qrModalBook.book.id)}`;

            return (
                <div className="admin-library-modal" role="dialog" aria-modal="true" onClick={() => setQrModalBook(null)}>
                    <div className="admin-qr-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="admin-form-head">
                            <div>
                                <h2>{language === 'vi' ? 'Mã QR & Thẻ in tem sách' : 'Book QR Code & Print Tag'}</h2>
                                <p>{language === 'vi' ? 'Mã QR tra cứu thông tin sách & vị trí kệ dành cho độc giả.' : 'QR Code linking to book details and stall location.'}</p>
                            </div>
                            <button type="button" onClick={() => setQrModalBook(null)}><X size={18} /></button>
                        </div>

                        <div className="admin-qr-modal-body">
                            {/* Chọn phạm vi gian hàng */}
                            {bookStallsList.length > 0 && (
                                <div className="admin-qr-scope-picker">
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                                        {language === 'vi' ? 'Chọn gian hàng in tem mã QR:' : 'Select Target Bookstall:'}
                                    </label>
                                    <select
                                        value={qrModalBook.selectedStallId || 'all'}
                                        onChange={e => setQrModalBook({ ...qrModalBook, selectedStallId: e.target.value })}
                                        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                    >
                                        <option value="all">
                                            {language === 'vi' ? 'Tất cả / Chung (Mở chi tiết sách chung tại Đường Sách)' : 'General (All Book Street stalls)'}
                                        </option>
                                        {bookStallsList.map(s => (
                                             <option key={s.id || s.stallId} value={s.id || s.stallId}>
                                                {s.stallName} ({s.stallCode || '—'}) — {language === 'vi' ? `Tồn: ${s.inventoryQuantity}` : `Stock: ${s.inventoryQuantity}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Card xem trước tem in */}
                            <div className="admin-qr-preview-wrapper">
                                <div className="admin-printable-qr-tag" id="admin-printable-qr-card">
                                    <div className="admin-qr-tag-brand">ĐƯỜNG SÁCH TP. HỒ CHÍ MINH</div>
                                    <div className="admin-qr-tag-code" id="admin-qr-code-svg-container">
                                        <QRCodeSVG
                                            value={qrUrl}
                                            size={170}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <h4 className="admin-qr-tag-title">{qrModalBook.book.title}</h4>
                                    <p className="admin-qr-tag-meta">
                                        {qrModalBook.book.author} · ISBN: {qrModalBook.book.isbn}
                                    </p>
                                    {activeStall ? (
                                        <div className="admin-qr-tag-stall">
                                            <Store size={12} />
                                            <span>{activeStall.stallName} ({activeStall.stallCode || '—'})</span>
                                        </div>
                                    ) : (
                                        <div className="admin-qr-tag-stall is-general">
                                            <BookOpen size={12} />
                                            <span>Thư viện số Đường Sách TP.HCM</span>
                                        </div>
                                    )}
                                    <p className="admin-qr-tag-hint">Quét mã QR để tra cứu thông tin sách & tồn kho</p>
                                </div>
                            </div>

                        </div>

                        <div className="admin-form-actions">
                            <button type="button" onClick={() => setQrModalBook(null)}>
                                {language === 'vi' ? 'Đóng' : 'Close'}
                            </button>
                            <button 
                                type="button" 
                                className="admin-library-secondary"
                                onClick={() => handleDownloadQr(qrModalBook.book, activeStall?.stallName)}
                            >
                                <Download size={16} /> {language === 'vi' ? 'Tải ảnh QR (PNG)' : 'Download PNG'}
                            </button>
                            <button 
                                type="button" 
                                className="admin-library-primary"
                                onClick={() => handlePrintBookQr(qrModalBook.book, activeStall)}
                            >
                                <Printer size={16} /> {language === 'vi' ? 'In tem mã QR' : 'Print QR Tag'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        })(), document.body)}

        {/* Modal Xem ảnh bìa kích thước lớn (Lightbox) cho Admin */}
        {previewImage && createPortal(
            <div 
                className="partner-image-lightbox-modal" 
                role="dialog" 
                aria-modal="true"
                onClick={() => setPreviewImage(null)}
            >
                <div className="partner-image-lightbox-card" onClick={e => e.stopPropagation()}>
                    <header className="partner-image-lightbox-header">
                        <div className="partner-image-lightbox-title-box">
                            <span className="partner-image-lightbox-label">{language === 'vi' ? 'Bìa cuốn sách' : 'Book Cover'}</span>
                            <strong className="partner-image-lightbox-title">{previewImage.title}</strong>
                        </div>
                        <button 
                            type="button" 
                            className="partner-image-lightbox-close"
                            onClick={() => setPreviewImage(null)}
                            title={language === 'vi' ? 'Đóng xem ảnh' : 'Close preview'}
                        >
                            <X size={18} />
                        </button>
                    </header>
                    <div className="partner-image-lightbox-body">
                        <SafeImage 
                            src={previewImage.url} 
                            alt={previewImage.title} 
                            className="partner-image-lightbox-img" 
                        />
                    </div>
                </div>
            </div>,
            document.body
        )}
    </div>;
}
function Tools({ query, setQuery, placeholder }: {
    query: string;
    setQuery: (value: string) => void;
    placeholder: string;
}) { return <div className="admin-library-tools"><label><Search size={16}/><input maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder}/></label></div>; }
function TaxonomySection({ title, icon, value, setValue, onCreate, rows, language }: {
    title: string;
    icon: React.ReactNode;
    value: string;
    setValue: (value: string) => void;
    onCreate: () => void;
    language: Language;
    rows: Array<{
        id: string;
        name: string;
        nameEn?: string;
        status: string;
        count: number;
        onEdit: () => void;
        onRestore?: () => void;
        onDelete: () => void;
    }>;
}) { 
    return (
        <section className="admin-library-panel admin-taxonomy-section">
            <header className="admin-taxonomy-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {icon}
                    <h2>{title}</h2>
                </div>
                <span className="admin-taxonomy-count-tag">{rows.length} {language === 'vi' ? 'mục' : 'items'}</span>
            </header>
            <form onSubmit={e => { e.preventDefault(); onCreate(); }} className="admin-taxonomy-form">
                <input maxLength={200}
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    placeholder={language === 'vi' ? `Nhập tên ${title.normalize('NFC').toLowerCase()} mới...` : `New ${title.normalize('NFC').toLowerCase()}...`}
                />
                <button className="admin-library-primary" type="submit">
                    <Plus size={15}/>{language === 'vi' ? 'Thêm' : 'Add'}
                </button>
            </form>
            <ul className="admin-taxonomy-list">
                {rows.map(row => (
                    <li key={row.id} className={`admin-taxonomy-item ${row.status === 'archived' ? 'is-archived' : ''}`}>
                        <div className="admin-taxonomy-info">
                            <div className="admin-taxonomy-title-row">
                                <strong>{row.name}</strong>
                                {row.status === 'archived' && (
                                    <span className="admin-taxonomy-status-badge archived">
                                        {language === 'vi' ? 'Đã lưu trữ' : 'Archived'}
                                    </span>
                                )}
                            </div>
                            <small className="admin-taxonomy-sub">
                                {row.nameEn ? `${row.nameEn} · ` : ''}
                                {row.count > 0 
                                    ? (language === 'vi' ? `${row.count} sách liên kết` : `${row.count} books`) 
                                    : (language === 'vi' ? '0 sách liên kết' : '0 books')}
                            </small>
                        </div>
                        <div className="admin-row-actions">
                            <button 
                                onClick={row.onEdit} 
                                title={language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                                className="admin-tax-action-btn"
                            >
                                <Edit3 size={14}/>
                            </button>
                            {row.status === 'archived' && row.onRestore && (
                                <button 
                                    onClick={row.onRestore} 
                                    title={language === 'vi' ? 'Khôi phục hoạt động' : 'Restore'}
                                    className="admin-tax-action-btn is-restore"
                                >
                                    <RotateCcw size={14}/>
                                </button>
                            )}
                            <button 
                                onClick={row.onDelete} 
                                title={row.status === 'archived' && row.count === 0 
                                    ? (language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete permanently') 
                                    : (language === 'vi' ? 'Lưu trữ / Vô hiệu hóa' : 'Archive')}
                                className={`admin-tax-action-btn ${row.status === 'archived' && row.count === 0 ? 'is-danger' : ''}`}
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </li>
                ))}
                {!rows.length && (
                    <li className="admin-library-empty" style={{ padding: '2rem 1rem' }}>
                        {language === 'vi' ? 'Chưa có dữ liệu.' : 'No data.'}
                    </li>
                )}
            </ul>
        </section>
    ); 
}
function VersionCard({ title, data }: {
    title: string;
    data?: Partial<BookInput>;
}) { return <section><h3>{title}</h3>{data?.coverUrl && <SafeImage className="admin-version-cover" src={data.coverUrl} alt=""/>}{fields.map(([key, label]) => <div key={key}><span>{label}</span><p>{String(data?.[key] ?? '—')}</p></div>)}</section>; }
