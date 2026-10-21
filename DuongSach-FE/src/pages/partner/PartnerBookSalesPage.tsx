import { SafeImage } from '../../components/ui/SafeImage';
import { useUrlTab } from '../../hooks/useUrlTab';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination, useListPagination } from '../../components/ui/ListPagination';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2, 
  Clock, 
  CornerDownRight, 
  Edit3, 
  Eye, 
  FileImage,
  ImagePlus, 
  Info, 
  Layers, 
  Link2,
  Plus, 
  RotateCcw, 
  Search, 
  Store, 
  Trash2, 
  Upload, 
  X 
} from 'lucide-react';
import type { Book, BookCategory, BookInput, BookSubmission, Language, PartnerBooth, StallBookRecord } from '../../types';
import { libraryApi } from '../../services/libraryApi';
import './PartnerBookSalesPage.css';

type ModalMode = 'add' | 'edit' | 'view' | 'resubmit';
type FormState = { 
  isbn: string; 
  title: string; 
  author: string; 
  publisher: string; 
  publicationYear: string; 
  categoryId: string;
  coverUrl: string; 
  description: string; 
  inventoryQuantity: string; 
  soldQuantity: string;
};
type ModalNotice = {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
};
type ConfirmAction = {
  type: 'delete-book' | 'cancel-submission';
  targetId: string;
  title: string;
  message: string;
};

const blankForm: FormState = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publicationYear: '',
  categoryId: '',
  coverUrl: '',
  description: '',
  inventoryQuantity: '',
  soldQuantity: ''
};

const toForm = (row: StallBookRecord): FormState => ({
  isbn: row.book.isbn,
  title: row.book.title,
  author: row.book.author,
  publisher: row.book.publisher || '',
  publicationYear: String(row.book.publicationYear || ''),
  categoryId: row.book.categoryId || '',
  coverUrl: row.book.coverUrl,
  description: row.book.description || '',
  inventoryQuantity: String(row.stall.inventoryQuantity),
  soldQuantity: row.stall.soldQuantity == null ? '' : String(row.stall.soldQuantity)
});

const submissionToForm = (sub: BookSubmission): FormState => ({
  isbn: String(sub.proposedData.isbn || ''),
  title: String(sub.proposedData.title || ''),
  author: String(sub.proposedData.author || ''),
  publisher: String(sub.proposedData.publisher || ''),
  publicationYear: String(sub.proposedData.publicationYear || ''),
  categoryId: String(sub.proposedData.categoryId || ''),
  coverUrl: String(sub.proposedData.coverUrl || ''),
  description: String(sub.proposedData.description || ''),
  inventoryQuantity: String(sub.inventoryQuantity ?? ''),
  soldQuantity: String(sub.soldQuantity ?? '')
});

const metadataChanged = (form: FormState, book: Book) =>
  form.isbn.trim() !== book.isbn ||
  form.title.trim() !== book.title ||
  form.author.trim() !== book.author ||
  (form.publisher.trim() || undefined) !== (book.publisher || undefined) ||
  (form.publicationYear ? Number(form.publicationYear) : undefined) !== (book.publicationYear || undefined) ||
  form.coverUrl.trim() !== book.coverUrl ||
  (form.description.trim() || undefined) !== (book.description || undefined) ||
  (form.categoryId || undefined) !== (book.categoryId || undefined);

const contentLabel = (status: StallBookRecord['contentStatus'] | BookSubmission['status'], language: Language) =>
  status === 'PENDING'
    ? (language === 'vi' ? 'Chờ duyệt' : 'Pending')
    : status === 'REJECTED'
    ? (language === 'vi' ? 'Bị từ chối' : 'Rejected')
    : (language === 'vi' ? 'Đã duyệt' : 'Approved');

export function PartnerBookSalesPage({ language, booth }: { language: Language; booth?: PartnerBooth }) {
  const stall = { 
    id: booth?.code || booth?.id || 'A02', 
    code: booth?.code || 'A02', 
    name: booth?.name || 'Gian hàng A02' 
  };

  const [activeSubTab, setActiveSubTab] = useUrlTab(['inventory', 'submissions'], 'inventory');
  const [records, setRecords] = useState<StallBookRecord[]>([]);
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);

  const [query, setQuery] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  const [modal, setModal] = useState<ModalMode | null>(null);
  const [current, setCurrent] = useState<StallBookRecord | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<BookSubmission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<BookSubmission | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [modalNotice, setModalNotice] = useState<ModalNotice | null>(null);

  useModalBehavior(Boolean(modal), () => setModal(null));
  useModalBehavior(Boolean(viewingSubmission), () => setViewingSubmission(null));
  useModalBehavior(Boolean(confirmAction), () => setConfirmAction(null));
  useModalBehavior(Boolean(modalNotice), () => setModalNotice(null));

  const [form, setForm] = useState<FormState>(blankForm);
  const [match, setMatch] = useState<Book | null>(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<Book[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRequest, setLookupRequest] = useState(0);
  const [coverFileName, setCoverFileName] = useState('');
  const [coverError, setCoverError] = useState('');

  const refresh = useCallback(() => Promise.all([
    libraryApi.getMyStallBooks(stall.id),
    libraryApi.getMyBookSubmissions(stall.id),
    libraryApi.getCategories()
  ]).then(([rows, requests, cats]) => {
    setRecords(rows);
    setSubmissions(requests);
    setCategories(cats);
  }), [stall.id]);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener(libraryApi.changeEvent, handler);
    return () => window.removeEventListener(libraryApi.changeEvent, handler);
  }, [refresh]);

  const visibleRecords = useMemo(() => 
    records.filter(row => !query || `${row.book.title} ${row.book.author} ${row.book.isbn}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi'))),
    [records, query]
  );

  const visibleSubmissions = useMemo(() =>
    submissions
      .filter(sub => sub.status !== 'APPROVED')
      .filter(sub => submissionStatusFilter === 'all' || sub.status === submissionStatusFilter)
      .filter(sub => !query || `${sub.proposedData.title || ''} ${sub.proposedData.author || ''} ${sub.proposedData.isbn || ''}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi'))),
    [submissions, submissionStatusFilter, query]
  );

  const recordsPagination = useListPagination(visibleRecords, query, 10);
  const submissionsPagination = useListPagination(visibleSubmissions, `${submissionStatusFilter}:${query}`, 10);

  const pending = submissions.filter(item => item.status === 'PENDING').length;
  const rejected = submissions.filter(item => item.status === 'REJECTED').length;
  const lowStock = records.filter(item => item.stall.inventoryQuantity <= 4).length;

  useEffect(() => {
    const value = lookupQuery.trim();
    if (modal !== 'add' || !value || !lookupOpen) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      libraryApi.searchGlobalBooks(value)
        .then(books => {
          if (!cancelled) setLookupResults(books);
        })
        .catch(() => {
          if (!cancelled) {
            setLookupResults([]);
            setLookupError(true);
          }
        })
        .finally(() => {
          if (!cancelled) setLookupLoading(false);
        });
    }, lookupRequest ? 0 : 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lookupQuery, lookupOpen, lookupRequest, modal]);

  const selectExisting = (book: Book) => {
    setMatch(book);
    setLookupOpen(false);
    setLookupResults([]);
    setLookupLoading(false);
    setForm(value => ({
      ...value,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      publicationYear: String(book.publicationYear || ''),
      categoryId: book.categoryId || '',
      coverUrl: book.coverUrl,
      description: book.description || ''
    }));
  };

  const openAdd = () => {
    setCurrent(null);
    setCurrentSubmission(null);
    setMatch(null);
    setLookupQuery('');
    setLookupResults([]);
    setLookupOpen(false);
    setLookupError(false);
    setForm(blankForm);
    setCoverFileName('');
    setCoverError('');
    setModal('add');
  };

  const openRecord = (mode: ModalMode, row: StallBookRecord) => {
    setCurrent(row);
    setCurrentSubmission(null);
    setMatch(null);
    setForm(toForm(row));
    setCoverFileName('');
    setCoverError('');
    setModal(mode);
  };

  const openResubmit = (sub: BookSubmission) => {
    setCurrent(null);
    setCurrentSubmission(sub);
    setMatch(null);
    setForm(submissionToForm(sub));
    setCoverFileName('');
    setCoverError('');
    setModal('resubmit');
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
            setForm(curr => ({ ...curr, coverUrl: compressed }));
          } else {
            setForm(curr => ({ ...curr, coverUrl: rawResult }));
          }
        } catch {
          setForm(curr => ({ ...curr, coverUrl: rawResult }));
        }
        setCoverFileName(file.name);
      };
      img.onerror = () => {
        setForm(curr => ({ ...curr, coverUrl: rawResult }));
        setCoverFileName(file.name);
      };
      img.src = rawResult;
    };
    reader.onerror = () => setCoverError(language === 'vi' ? 'Không thể đọc tệp ảnh.' : 'Could not read image file.');
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const inventory = Number(form.inventoryQuantity);
    const sold = form.soldQuantity.trim() === '' ? undefined : Number(form.soldQuantity);
    const year = form.publicationYear.trim() === '' ? undefined : Number(form.publicationYear);
    if (!form.inventoryQuantity.trim() || !Number.isInteger(inventory) || inventory < 0 || inventory > 2147483647 ||
        (sold !== undefined && (!Number.isInteger(sold) || sold < 0 || sold > 2147483647)) ||
        (year !== undefined && (!Number.isInteger(year) || year < 1 || year > new Date().getFullYear() + 1)) ||
        !/^(?:[0-9]{10}|[0-9]{13})$/.test(form.isbn.trim()) || !form.title.trim() || !form.author.trim()) {
      setModalNotice({ type: 'error', title: 'Dữ liệu không hợp lệ', message: 'Kiểm tra ISBN, tên sách, tác giả, năm xuất bản và số lượng nguyên không âm.' });
      return;
    }

    try {
      if (modal === 'edit' && current) {
        const quantities: { inventoryQuantity?: number; soldQuantity?: number | null } = {};
        if (inventory !== current.stall.inventoryQuantity) quantities.inventoryQuantity = inventory;
        if (sold !== (current.stall.soldQuantity ?? undefined)) quantities.soldQuantity = sold ?? null;
        if (Object.keys(quantities).length) await libraryApi.updateQuantities(current.book.id, quantities);
        if (metadataChanged(form, current.book)) {
          const updates: Partial<BookInput> = {
            isbn: form.isbn.trim(),
            title: form.title.trim(),
            author: form.author.trim(),
            publisher: form.publisher.trim() || undefined,
            publicationYear: form.publicationYear ? Number(form.publicationYear) : undefined,
            categoryId: form.categoryId || undefined,
            coverUrl: form.coverUrl.trim() || undefined,
            description: form.description.trim() || undefined,
            status: 'active'
          };
          await libraryApi.submitBookUpdate(stall, current.book.id, updates);
          setModalNotice({
            type: 'success',
            title: language === 'vi' ? 'Đã gửi duyệt cập nhật' : 'Update Submitted',
            message: language === 'vi'
              ? 'Số lượng tồn kho đã lưu. Thay đổi nội dung thông tin sách đã được chuyển tới Ban quản trị để phê duyệt.'
              : 'Inventory saved. Content edits were submitted for admin review.'
          });
        } else {
          setModalNotice({
            type: 'success',
            title: language === 'vi' ? 'Cập nhật thành công' : 'Updated Successfully',
            message: language === 'vi' ? 'Đã cập nhật tồn kho và số lượng đã bán tại gian hàng.' : 'Inventory and sold quantity updated.'
          });
        }
      } else if (match) {
        await libraryApi.addBookToMyStall(stall, match.id, inventory, sold);
        setModalNotice({
          type: 'success',
          title: language === 'vi' ? 'Thêm sách thành công' : 'Book Added',
          message: language === 'vi' ? `Đã thêm sách "${match.title}" có sẵn trong thư viện vào gian hàng.` : 'Existing book added to stall.'
        });
      } else {
        if (!form.isbn.trim() || !form.title.trim() || !form.author.trim()) return;
        const newBookPayload: BookInput = {
          isbn: form.isbn.trim(),
          title: form.title.trim(),
          author: form.author.trim(),
          publisher: form.publisher.trim() || undefined,
          publicationYear: form.publicationYear ? Number(form.publicationYear) : undefined,
          categoryId: form.categoryId || undefined,
          coverUrl: form.coverUrl.trim() || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
          description: form.description.trim() || undefined,
          status: 'active'
        };
        await libraryApi.submitNewBook(stall, newBookPayload, inventory, sold);
        setModalNotice({
          type: 'success',
          title: language === 'vi' ? 'Gửi duyệt sách thành công' : 'Submission Sent',
          message: language === 'vi' 
            ? `Yêu cầu thêm sách "${form.title}" đã được gửi tới Ban quản trị để phê duyệt. Bạn có thể theo dõi tiến độ ở tab "Sách gửi duyệt".` 
            : 'New book submitted for Admin review.'
        });
        setActiveSubTab('submissions');
      }

      setModal(null);
      await refresh();
    } catch (error: any) {
      setModalNotice({
        type: 'error',
        title: language === 'vi' ? 'Lỗi' : 'Error',
        message: error.message || (language === 'vi' ? 'Có lỗi xảy ra trong quá trình thực hiện.' : 'An error occurred.')
      });
    }
  };

  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'delete-book') {
        await libraryApi.removeBookFromMyStall(stall.id, confirmAction.targetId);
        setModalNotice({
          type: 'success',
          title: language === 'vi' ? 'Đã gỡ sách' : 'Book Removed',
          message: language === 'vi' ? 'Đã gỡ sách khỏi gian hàng của bạn thành công.' : 'Book removed from stall.'
        });
      } else if (confirmAction.type === 'cancel-submission') {
        await libraryApi.cancelBookSubmission(confirmAction.targetId);
        setModalNotice({
          type: 'success',
          title: language === 'vi' ? 'Đã hủy yêu cầu' : 'Submission Cancelled',
          message: language === 'vi' ? 'Đã hủy yêu cầu gửi duyệt sách thành công.' : 'Submission cancelled successfully.'
        });
      }
      setConfirmAction(null);
      await refresh();
    } catch (error: any) {
      setModalNotice({
        type: 'error',
        title: language === 'vi' ? 'Lỗi' : 'Error',
        message: error.message || (language === 'vi' ? 'Không thể thực hiện hành động này.' : 'Failed to execute action.')
      });
    }
  };

  return (
    <div className="partner-page partner-books-page">
      <header className="partner-page-header">
        <div>
          <h1 className="partner-page-title">{language === 'vi' ? 'Quản lý sách' : 'Book Management'}</h1>
          <p className="partner-page-sub">{language === 'vi' ? 'Quản lý danh mục sách, số lượng tồn kho và theo dõi tiến độ duyệt sách.' : 'Manage book inventory, quantities, and review submissions.'}</p>
        </div>
        <button className="partner-books-primary" onClick={openAdd}>
          <Plus size={17}/>{language === 'vi' ? 'Thêm / Gửi duyệt sách' : 'Add / Submit Book'}
        </button>
      </header>

      {/* Assigned Stall Info */}
      <section className="assigned-stall-card">
        <Store size={19}/>
        <span>
          <small>{language === 'vi' ? 'Gian hàng của bạn' : 'Your assigned stall'}</small>
          <strong>{stall.name} — {stall.code}</strong>
        </span>
        <em>{language === 'vi' ? 'Được Admin phân công' : 'Assigned by Admin'}</em>
      </section>

      {/* Summary KPI Cards */}
      <section className="partner-books-summary">
        <div>
          <span>{records.length}</span>
          <small>{language === 'vi' ? 'Sách tại gian hàng' : 'Books in stall'}</small>
        </div>
        <div>
          <span style={{ color: pending > 0 ? '#b45309' : undefined }}>{pending}</span>
          <small>{language === 'vi' ? 'Đang chờ duyệt' : 'Pending review'}</small>
        </div>
        <div>
          <span style={{ color: rejected > 0 ? '#dc2626' : undefined }}>{rejected}</span>
          <small>{language === 'vi' ? 'Bị từ chối' : 'Rejected'}</small>
        </div>
        <div>
          <span>{lowStock}</span>
          <small>{language === 'vi' ? 'Sắp hết hàng' : 'Low stock'}</small>
        </div>
      </section>

      {/* Sub-tabs: Sách tại gian hàng VS Sách gửi duyệt */}
      <div className="partner-books-tabs">
        <button 
          className={`partner-books-tab-btn ${activeSubTab === 'inventory' ? 'is-active' : ''}`}
          onClick={() => { setActiveSubTab('inventory'); setQuery(''); }}
        >
          <BookOpen size={16} />
          <span>{language === 'vi' ? 'Sách tại gian hàng' : 'Stall Books'}</span>
          <span className="partner-tab-badge count">{records.length}</span>
        </button>
        <button 
          className={`partner-books-tab-btn ${activeSubTab === 'submissions' ? 'is-active' : ''}`}
          onClick={() => { setActiveSubTab('submissions'); setQuery(''); }}
        >
          <Clock size={16} />
          <span>{language === 'vi' ? 'Yêu cầu gửi duyệt' : 'Submissions & Approvals'}</span>
          {pending > 0 && <span className="partner-tab-badge pending">{pending}</span>}
          {pending === 0 && <span className="partner-tab-badge count">{submissions.filter(item => item.status !== 'APPROVED').length}</span>}
        </button>
      </div>

      {/* Tab 1: Sách tại gian hàng */}
      {activeSubTab === 'inventory' && (
        <section className="partner-books-card">
          <div className="partner-books-tools">
            <label>
              <Search size={16}/>
              <input maxLength={200}
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder={language === 'vi' ? 'Tìm tên sách, tác giả hoặc ISBN tại gian hàng...' : 'Search title, author, or ISBN...'}
              />
            </label>
          </div>
          <div className="partner-books-table-wrap partner-desktop-table">
            <table>
              <thead>
                <tr>
                  <th className="partner-col-cover">{language === 'vi' ? 'Ảnh' : 'Cover'}</th>
                  <th style={{ minWidth: '220px' }}>{language === 'vi' ? 'Tên sách' : 'Book'}</th>
                  <th style={{ width: '130px' }}>ISBN</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>{language === 'vi' ? 'Tồn kho' : 'Stock'}</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>{language === 'vi' ? 'Đã bán' : 'Sold'}</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>{language === 'vi' ? 'Cập nhật' : 'Updated'}</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {recordsPagination.items.map(row => (
                  <tr key={row.stall.id}>
                    <td 
                      className="partner-col-cover is-clickable"
                      onClick={() => openRecord('view', row)}
                      style={{ cursor: 'pointer' }}
                      title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                    >
                      <SafeImage className="partner-book-table-cover" src={row.book.coverUrl} alt="" loading="lazy" />
                    </td>
                    <td 
                      className="is-clickable"
                      onClick={() => openRecord('view', row)}
                      style={{ cursor: 'pointer' }}
                      title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                    >
                      <strong>{row.book.title}</strong>
                      <small>{row.book.author} {row.book.publisher ? `• ${row.book.publisher}` : ''}</small>
                    </td>
                    <td><code>{row.book.isbn}</code></td>
                    <td style={{ textAlign: 'center' }}>
                      <b className={row.stall.inventoryQuantity <= 4 ? 'is-low' : ''}>{row.stall.inventoryQuantity}</b>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.stall.soldQuantity ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(row.stall.updatedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="partner-book-actions" style={{ justifyContent: 'center' }}>
                        <button onClick={() => openRecord('edit', row)} title={language === 'vi' ? 'Cập nhật tồn kho / Sửa sách' : 'Edit'}>
                          <Edit3 size={15}/>
                        </button>
                        <button 
                          className="is-danger" 
                          onClick={() => setConfirmAction({
                            type: 'delete-book',
                            targetId: row.book.id,
                            title: language === 'vi' ? 'Gỡ sách khỏi gian hàng' : 'Remove Book from Stall',
                            message: language === 'vi' ? `Bạn có chắc muốn gỡ cuốn sách "${row.book.title}" khỏi gian hàng? Sách vẫn còn trên Thư viện số chung.` : `Remove "${row.book.title}" from stall?`
                          })}
                          title={language === 'vi' ? 'Gỡ khỏi gian hàng' : 'Remove'}
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleRecords.length && (
                  <tr>
                    <td colSpan={7} className="partner-books-empty">
                      {language === 'vi' ? 'Gian hàng chưa có cuốn sách nào phù hợp.' : 'No books in this stall match the search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View for Tab 1 (Inventory) */}
          <div className="partner-books-mobile-cards">
            {recordsPagination.items.map(row => (
              <div key={row.stall.id} className="partner-book-mobile-card">
                <div 
                  className="book-mobile-card-cover-wrap" 
                  onClick={() => openRecord('view', row)}
                  title={language === 'vi' ? 'Nhấn để xem chi tiết sách' : 'Click to view book details'}
                >
                  <SafeImage src={row.book.coverUrl} alt={row.book.title} className="book-mobile-card-cover" loading="lazy" />
                </div>
                <div className="book-mobile-card-body">
                  <div 
                    className="book-mobile-card-title-row" 
                    onClick={() => openRecord('view', row)}
                  >
                    <strong className="book-mobile-card-title">{row.book.title}</strong>
                    <small className="book-mobile-card-author">{row.book.author} {row.book.publisher ? `• ${row.book.publisher}` : ''}</small>
                  </div>
                  <div className="book-mobile-card-meta">
                    <code className="book-mobile-isbn">{row.book.isbn}</code>
                    <span className={`book-mobile-stock-pill ${row.stall.inventoryQuantity <= 4 ? 'is-low' : ''}`}>
                      {language === 'vi' ? 'Tồn:' : 'Stock:'} <b>{row.stall.inventoryQuantity}</b>
                    </span>
                    <span className="book-mobile-sold-pill">
                      {language === 'vi' ? 'Đã bán:' : 'Sold:'} {row.stall.soldQuantity ?? 0}
                    </span>
                  </div>
                  <div className="book-mobile-card-actions">
                    <button 
                      type="button"
                      className="book-mobile-action-btn edit"
                      onClick={() => openRecord('edit', row)}
                    >
                      <Edit3 size={14} />
                      <span>{language === 'vi' ? 'Sửa tồn kho' : 'Edit'}</span>
                    </button>
                    <button 
                      type="button"
                      className="book-mobile-action-btn delete"
                      onClick={() => setConfirmAction({
                        type: 'delete-book',
                        targetId: row.book.id,
                        title: language === 'vi' ? 'Gỡ sách khỏi gian hàng' : 'Remove Book from Stall',
                        message: language === 'vi' ? `Bạn có chắc muốn gỡ cuốn sách "${row.book.title}" khỏi gian hàng? Sách vẫn còn trên Thư viện số chung.` : `Remove "${row.book.title}" from stall?`
                      })}
                    >
                      <Trash2 size={14} />
                      <span>{language === 'vi' ? 'Gỡ' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!visibleRecords.length && (
              <div className="partner-books-empty">
                {language === 'vi' ? 'Gian hàng chưa có cuốn sách nào phù hợp.' : 'No books in this stall match the search.'}
              </div>
            )}
          </div>

          <ListPagination
            page={recordsPagination.page}
            totalPages={recordsPagination.totalPages}
            onChange={recordsPagination.setPage}
            vi={language === 'vi'}
          />
        </section>
      )}

      {/* Tab 2: Sách gửi duyệt */}
      {activeSubTab === 'submissions' && (
        <section className="partner-books-card">
          <div className="partner-books-tools" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ flex: 1, minWidth: '260px' }}>
              <Search size={16}/>
              <input maxLength={200}
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder={language === 'vi' ? 'Tìm tên sách gửi duyệt, tác giả, ISBN...' : 'Search submissions...'}
              />
            </label>
            <select
              style={{ height: '40px', padding: '0 0.8rem', border: '1px solid #d8dedb', borderRadius: '7px', background: '#fff', fontSize: '0.82rem', fontWeight: 600 }}
              value={submissionStatusFilter}
              onChange={e => setSubmissionStatusFilter(e.target.value as any)}
            >
              <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}</option>
              <option value="PENDING">{language === 'vi' ? 'Đang chờ duyệt' : 'Pending'}</option>
              <option value="REJECTED">{language === 'vi' ? 'Bị từ chối' : 'Rejected'}</option>
            </select>
          </div>
          <div className="partner-books-table-wrap partner-desktop-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>{language === 'vi' ? 'Ảnh' : 'Cover'}</th>
                  <th style={{ minWidth: '220px' }}>{language === 'vi' ? 'Sách đề xuất' : 'Proposed Book'}</th>
                  <th style={{ width: '130px' }}>ISBN</th>
                  <th style={{ width: '110px', textAlign: 'left' }}>{language === 'vi' ? 'Loại yêu cầu' : 'Request'}</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>{language === 'vi' ? 'Tồn đề xuất' : 'Stock'}</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>{language === 'vi' ? 'Ngày gửi' : 'Submitted'}</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>{language === 'vi' ? 'Trạng thái duyệt' : 'Review Status'}</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>{language === 'vi' ? 'Hành động' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {submissionsPagination.items.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <SafeImage src={sub.proposedData.coverUrl || '/duong_sach_logo.png'} alt=""/>
                    </td>
                    <td>
                      <strong>{String(sub.proposedData.title || '—')}</strong>
                      <small>{sub.proposedData.author || ''} {sub.proposedData.publisher ? `• ${sub.proposedData.publisher}` : ''}</small>
                    </td>
                    <td><code>{String(sub.proposedData.isbn || '—')}</code></td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {sub.type === 'CREATE' ? (language === 'vi' ? 'Thêm mới' : 'Create') : (language === 'vi' ? 'Cập nhật' : 'Update')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{sub.inventoryQuantity ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(sub.submittedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`book-content-status ${sub.status.normalize('NFC').toLowerCase()}`}>
                        {contentLabel(sub.status, language)}
                      </span>
                      {sub.status === 'REJECTED' && sub.rejectionReason && (
                        <div style={{ marginTop: '4px' }}>
                          <small style={{ color: '#b91c1c', display: 'block', fontWeight: 600 }}>
                            {language === 'vi' ? 'Lý do: ' : 'Reason: '}{sub.rejectionReason}
                          </small>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="partner-book-actions" style={{ justifyContent: 'center' }}>
                        <button onClick={() => setViewingSubmission(sub)} title={language === 'vi' ? 'Xem chi tiết đề xuất' : 'View'}>
                          <Eye size={15}/>
                        </button>
                        {sub.status === 'REJECTED' && (
                          <button className="partner-resubmit-btn" onClick={() => openResubmit(sub)} title={language === 'vi' ? 'Sửa & Gửi lại yêu cầu' : 'Resubmit'}>
                            <RotateCcw size={13}/>
                            <span>{language === 'vi' ? 'Gửi lại' : 'Resubmit'}</span>
                          </button>
                        )}
                        {sub.status === 'PENDING' && (
                          <button 
                            className="is-danger" 
                            onClick={() => setConfirmAction({
                              type: 'cancel-submission',
                              targetId: sub.id,
                              title: language === 'vi' ? 'Hủy yêu cầu duyệt sách' : 'Cancel Book Submission',
                              message: language === 'vi' ? `Bạn có chắc muốn hủy yêu cầu duyệt cho sách "${sub.proposedData.title || ''}"?` : 'Cancel this submission?'
                            })}
                            title={language === 'vi' ? 'Hủy yêu cầu' : 'Cancel'}
                          >
                            <Trash2 size={15}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleSubmissions.length && (
                  <tr>
                    <td colSpan={8} className="partner-books-empty">
                      {language === 'vi' ? 'Chưa có yêu cầu gửi duyệt nào.' : 'No book submissions found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View for Tab 2 (Submissions) */}
          <div className="partner-books-mobile-cards">
            {submissionsPagination.items.map(sub => (
              <div key={sub.id} className="partner-book-mobile-card">
                <div 
                  className="book-mobile-card-cover-wrap" 
                  onClick={() => setViewingSubmission(sub)}
                  title={language === 'vi' ? 'Nhấn để xem chi tiết' : 'Click to view details'}
                >
                  <SafeImage src={sub.proposedData.coverUrl || '/duong_sach_logo.png'} alt="" className="book-mobile-card-cover" loading="lazy" />
                </div>
                <div className="book-mobile-card-body">
                  <div 
                    className="book-mobile-card-title-row" 
                    onClick={() => setViewingSubmission(sub)}
                  >
                    <strong className="book-mobile-card-title">{String(sub.proposedData.title || '—')}</strong>
                    <small className="book-mobile-card-author">{sub.proposedData.author || ''} {sub.proposedData.publisher ? `• ${sub.proposedData.publisher}` : ''}</small>
                  </div>
                  <div className="book-mobile-card-meta">
                    <code className="book-mobile-isbn">{String(sub.proposedData.isbn || '—')}</code>
                    <span className="book-mobile-type-pill">
                      {sub.type === 'CREATE' ? (language === 'vi' ? 'Thêm mới' : 'Create') : (language === 'vi' ? 'Cập nhật' : 'Update')}
                    </span>
                    <span className={`book-content-status ${sub.status.normalize('NFC').toLowerCase()}`}>
                      {contentLabel(sub.status, language)}
                    </span>
                  </div>
                  {sub.status === 'REJECTED' && sub.rejectionReason && (
                    <div style={{ marginTop: '4px' }}>
                      <small style={{ color: '#b91c1c', display: 'block', fontWeight: 600 }}>
                        {language === 'vi' ? 'Lý do: ' : 'Reason: '}{sub.rejectionReason}
                      </small>
                    </div>
                  )}
                  <div className="book-mobile-card-actions">
                    <button 
                      type="button"
                      className="book-mobile-action-btn view"
                      onClick={() => setViewingSubmission(sub)}
                    >
                      <Eye size={14} />
                      <span>{language === 'vi' ? 'Chi tiết' : 'View'}</span>
                    </button>
                    {sub.status === 'REJECTED' && (
                      <button 
                        type="button"
                        className="book-mobile-action-btn resubmit"
                        onClick={() => openResubmit(sub)}
                      >
                        <RotateCcw size={14} />
                        <span>{language === 'vi' ? 'Gửi lại' : 'Resubmit'}</span>
                      </button>
                    )}
                    {sub.status === 'PENDING' && (
                      <button 
                        type="button"
                        className="book-mobile-action-btn delete"
                        onClick={() => setConfirmAction({
                          type: 'cancel-submission',
                          targetId: sub.id,
                          title: language === 'vi' ? 'Hủy yêu cầu duyệt sách' : 'Cancel Book Submission',
                          message: language === 'vi' ? `Bạn có chắc muốn hủy yêu cầu duyệt cho sách "${sub.proposedData.title || ''}"?` : 'Cancel this submission?'
                        })}
                      >
                        <Trash2 size={14} />
                        <span>{language === 'vi' ? 'Hủy' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!visibleSubmissions.length && (
              <div className="partner-books-empty">
                {language === 'vi' ? 'Chưa có yêu cầu gửi duyệt nào.' : 'No book submissions found.'}
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

      {/* Modal Thêm / Chỉnh sửa / Gửi lại sách */}
      {modal && createPortal(
        <div 
          className="partner-book-modal" 
          role="dialog" 
          aria-modal="true"

        >
          <form onSubmit={save} className="partner-book-form" onClick={e => e.stopPropagation()} autoComplete="off">
            <header>
              <div>
                <h2>
                  {modal === 'add' 
                    ? (language === 'vi' ? 'Thêm / Đề xuất sách mới' : 'Add / Submit Book') 
                    : modal === 'view' 
                    ? (language === 'vi' ? 'Chi tiết cuốn sách' : 'Book Details') 
                    : modal === 'resubmit'
                    ? (language === 'vi' ? 'Chỉnh sửa & Gửi lại duyệt sách' : 'Resubmit Book for Approval')
                    : (language === 'vi' ? 'Cập nhật sách tại gian hàng' : 'Edit Book')}
                </h2>
                <p>
                  {modal === 'view' 
                    ? '' 
                    : language === 'vi' 
                    ? 'Thông tin công khai của sách sẽ được gửi tới Ban quản trị phê duyệt trước khi xuất bản.' 
                    : 'Public book details require Admin approval.'}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)}><X/></button>
            </header>

            {/* If Resubmitting, show previous rejection banner */}
            {modal === 'resubmit' && currentSubmission?.rejectionReason && (
              <div style={{ padding: '0 1.2rem', marginTop: '1rem' }}>
                <div className="partner-rejection-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>{language === 'vi' ? 'Lý do bị từ chối ở lần duyệt trước:' : 'Previous Rejection Reason:'}</strong>
                    <span>{currentSubmission.rejectionReason}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="partner-book-form-grid">
              {modal === 'add' && (
                <div className="partner-book-lookup">
                  <label>
                    {language === 'vi' ? 'ISBN / Tên sách' : 'ISBN / Book title'}
                    <input maxLength={200}
                      value={lookupQuery}
                      onChange={e => {
                        setLookupQuery(e.target.value);
                        const hasQuery = Boolean(e.target.value.trim());
                        setLookupOpen(hasQuery);
                        setLookupLoading(hasQuery);
                        setLookupResults([]);
                        setLookupError(false);
                        setLookupRequest(0);
                        if (match) {
                          setMatch(null);
                          setForm(current => ({ ...blankForm, inventoryQuantity: current.inventoryQuantity, soldQuantity: current.soldQuantity }));
                        }
                      }}
                      onFocus={() => {
                        if (lookupQuery.trim() && !match) {
                          setLookupOpen(true);
                          setLookupLoading(true);
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Escape') setLookupOpen(false); }}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={lookupOpen}
                      aria-controls="partner-book-lookup-results"
                      placeholder={language === 'vi' ? 'Nhập ISBN hoặc tên sách để tìm trong Thư viện số' : 'Search the Digital Library by ISBN or book title'}
                    />
                  </label>
                  <button type="button" onClick={() => {
                    if (lookupQuery.trim()) {
                      setLookupOpen(true);
                      setLookupLoading(true);
                      setLookupError(false);
                      setLookupRequest(value => value + 1);
                    }
                  }}>
                    <Search size={16}/>{language === 'vi' ? 'Tìm kiếm' : 'Find Book'}
                  </button>
                  {lookupOpen && lookupQuery.trim() && (
                    <div className="partner-book-lookup-results" id="partner-book-lookup-results" role="listbox" aria-label={language === 'vi' ? 'Sách tìm thấy' : 'Matching books'}>
                      {lookupLoading ? (
                        <p>{language === 'vi' ? 'Đang tìm sách...' : 'Searching books...'}</p>
                      ) : lookupError ? (
                        <p>{language === 'vi' ? 'Không thể tìm sách. Vui lòng thử lại.' : 'Search failed. Please try again.'}</p>
                      ) : lookupResults.length ? (
                        lookupResults.map(book => (
                          <button key={book.id} type="button" role="option" aria-selected={false} onClick={() => selectExisting(book)}>
                            <SafeImage src={book.coverUrl || '/duong_sach_logo.png'} alt="" />
                            <span><strong>{book.title}</strong><small>{book.author} · ISBN: {book.isbn}</small></span>
                          </button>
                        ))
                      ) : (
                        <p>{language === 'vi' ? 'Không có sách phù hợp. Bạn có thể nhập thông tin sách mới ở bên dưới.' : 'No matching books. You can enter a new book below.'}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {modal === 'add' && match && (
                <div className="existing-book-match">
                  <CheckCircle2 size={20}/>
                  <span>
                    <small>{language === 'vi' ? 'Đã chọn sách trong Thư viện số TP.HCM' : 'Selected from Digital Library'}</small>
                    <strong>{match.title}</strong>
                    <em>{match.author} · ISBN: {match.isbn}</em>
                  </span>
                </div>
              )}
              <label>
                ISBN *
                <input 
                  value={form.isbn} 
                  maxLength={13}
                  inputMode="numeric"
                  pattern="(?:[0-9]{10}|[0-9]{13})"
                  readOnly={modal === 'view' || Boolean(match)} 
                  onChange={e => setForm({ ...form, isbn: e.target.value.replace(/[^0-9]/g, '') })}
                  required 
                  placeholder="VD: 9786041000009"
                />
              </label>

              <label>
                {language === 'vi' ? 'Tên sách *' : 'Title *'}
                <input 
                  value={form.title} 
                  maxLength={200}
                  readOnly={modal === 'view' || Boolean(match)} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  required 
                  placeholder={language === 'vi' ? 'Tên sách...' : 'Book title...'}
                />
              </label>

              <label>
                {language === 'vi' ? 'Tác giả *' : 'Author *'}
                <input 
                  value={form.author} 
                  maxLength={200}
                  readOnly={modal === 'view' || Boolean(match)} 
                  onChange={e => setForm({ ...form, author: e.target.value })} 
                  required 
                  placeholder={language === 'vi' ? 'Tên tác giả...' : 'Author...'}
                />
              </label>

              <label>
                {language === 'vi' ? 'Nhà xuất bản' : 'Publisher'}
                <input 
                  value={form.publisher} 
                  maxLength={200}
                  readOnly={modal === 'view' || Boolean(match)} 
                  onChange={e => setForm({ ...form, publisher: e.target.value })} 
                  placeholder="NXB Trẻ, Kim Đồng, Nhã Nam..."
                />
              </label>

              <label>
                {language === 'vi' ? 'Năm xuất bản' : 'Publication year'}
                <input 
                  type="number" 
                  min="1"
                  max={new Date().getFullYear() + 1}
                  step="1"
                  value={form.publicationYear} 
                  readOnly={modal === 'view' || Boolean(match)} 
                  onChange={e => setForm({ ...form, publicationYear: e.target.value })} 
                  placeholder="2024"
                />
              </label>

              {/* Category picker for partner when creating a new book */}
              <label>
                {language === 'vi' ? 'Phân loại đề xuất' : 'Proposed Category'}
                <select
                  disabled={modal === 'view' || Boolean(match)}
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">{language === 'vi' ? '— Chưa phân loại —' : '— Unclassified —'}</option>
                  {categories.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <div className="form-wide partner-cover-upload-section">
                <span className="partner-cover-label">{language === 'vi' ? 'Ảnh bìa sách' : 'Book Cover'}</span>
                <div className="partner-cover-upload-card">
                  {/* Khung ảnh xem trước bìa sách chuẩn tỉ lệ */}
                  <div className="partner-cover-preview-box">
                    {form.coverUrl ? (
                      <SafeImage
                        src={form.coverUrl} 
                        alt="Preview" 
                        className="partner-cover-img-preview" 

                      />
                    ) : (
                      <div className="partner-cover-no-img">
                        <ImagePlus size={20} className="partner-cover-empty-icon" />
                        <span>{language === 'vi' ? 'Chưa có ảnh' : 'No image'}</span>
                      </div>
                    )}
                  </div>

                  {/* Cột các điều khiển ảnh bìa nằm thẳng hàng ngang */}
                  <div className="partner-cover-controls">
                    <div className="partner-cover-actions-row">
                      <div className="partner-cover-url-box">
                        <Link2 size={16} className="partner-cover-url-icon" />
                        <input 
                          type="text"
                          name="partnerCoverUrl"
                          autoComplete="off"
                          data-lpignore="true"
                          value={form.coverUrl.startsWith('data:') ? '' : form.coverUrl} 
                          readOnly={modal === 'view' || Boolean(match)} 
                          onChange={e => { setForm({ ...form, coverUrl: e.target.value }); setCoverFileName(''); setCoverError(''); }} 
                          placeholder={form.coverUrl.startsWith('data:') 
                            ? (language === 'vi' ? 'Đang dùng ảnh tải lên từ máy tính' : 'Using uploaded image from device') 
                            : (language === 'vi' ? 'Dán đường dẫn ảnh (URL https://... hoặc /duong_sach_logo.png)' : 'Paste image URL or enter path...')}
                        />
                        {form.coverUrl && /^https?:\/\//.test(form.coverUrl) && <a href={form.coverUrl} target="_blank" rel="noopener noreferrer">{language === 'vi' ? 'Mở ảnh trong thẻ mới' : 'Open image in new tab'}</a>}
                        {form.coverUrl && !form.coverUrl.startsWith('data:') && modal !== 'view' && !match && (
                          <button 
                            type="button" 
                            className="partner-cover-clear-url" 
                            onClick={() => setForm(curr => ({ ...curr, coverUrl: '' }))}
                            title={language === 'vi' ? 'Xóa URL' : 'Clear URL'}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {modal !== 'view' && !match && (
                        <label 
                          className="partner-upload-btn" 
                          title={language === 'vi' ? 'Tải ảnh lên từ máy tính' : 'Upload image from device'}
                          aria-label={language === 'vi' ? 'Tải ảnh lên' : 'Upload image'}
                        >
                          <Upload size={18} />
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); }} 
                          />
                        </label>
                      )}

                      {form.coverUrl && modal !== 'view' && !match && (
                        <button 
                          type="button" 
                          className="partner-cover-btn-delete"
                          onClick={() => { setForm({ ...form, coverUrl: '' }); setCoverFileName(''); setCoverError(''); }} 
                          title={language === 'vi' ? 'Xóa ảnh bìa hiện tại' : 'Remove cover image'}
                          aria-label={language === 'vi' ? 'Xóa ảnh' : 'Remove image'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="partner-cover-footer-row">
                      {coverFileName ? (
                        <div className="partner-cover-file-info">
                          <FileImage size={13} className="partner-file-badge-icon" />
                          <span className="partner-cover-filename" title={coverFileName}>{coverFileName}</span>
                          <button 
                            type="button" 
                            className="partner-cover-reset-btn" 
                            onClick={() => { setForm(prev => ({ ...prev, coverUrl: '' })); setCoverFileName(''); setCoverError(''); }}
                            title={language === 'vi' ? 'Xóa ảnh đã tải lên' : 'Remove uploaded image'}
                          >
                            <X size={12} />
                            <span>{language === 'vi' ? 'Gỡ ảnh' : 'Remove'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="partner-cover-format-hint">
                          <Info size={13} className="partner-hint-icon" />
                          <span>{language === 'vi' ? 'Hỗ trợ JPG, PNG, WEBP (tối đa 5MB) hoặc liên kết ảnh trực tuyến' : 'Supports JPG, PNG, WEBP (up to 5MB) or online image URL'}</span>
                        </span>
                      )}
                      {coverError && <p className="partner-cover-error-msg">{coverError}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <label className="form-wide">
                {language === 'vi' ? 'Mô tả nội dung sách' : 'Description'}
                <textarea rows={3} maxLength={20000} value={form.description} readOnly={modal === 'view' || Boolean(match)} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={language === 'vi' ? 'Tóm tắt nội dung cuốn sách...' : 'Book description...'}/>
              </label>

              <label>
                {language === 'vi' ? 'Số lượng sách đưa vào kho *' : 'Initial Inventory *'}
                <input type="number" min="0" max="2147483647" step="1" value={form.inventoryQuantity} readOnly={modal === 'view'} onChange={e => setForm({ ...form, inventoryQuantity: e.target.value })} required/>
              </label>

              <label>
                {language === 'vi' ? 'Số lượng đã bán (không bắt buộc)' : 'Sold quantity (optional)'}
                <input type="number" min="0" max="2147483647" step="1" value={form.soldQuantity} readOnly={modal === 'view'} onChange={e => setForm({ ...form, soldQuantity: e.target.value })}/>
              </label>
            </div>

            {modal !== 'view' && (
              <footer>
                <button type="button" onClick={() => setModal(null)}>{language === 'vi' ? 'Hủy' : 'Cancel'}</button>
                <button className="partner-books-primary" type="submit">
                  {modal === 'add' || modal === 'resubmit' 
                    ? (match ? (language === 'vi' ? 'Thêm vào gian hàng' : 'Add to stall') : (language === 'vi' ? 'Gửi Ban quản trị duyệt' : 'Submit for Review')) 
                    : (language === 'vi' ? 'Lưu thay đổi' : 'Save changes')}
                </button>
              </footer>
            )}
          </form>
        </div>,
        document.body
      )}

      {/* Modal Xem chi tiết yêu cầu gửi duyệt */}
      {viewingSubmission && createPortal(
        <div 
          className="partner-book-modal" 
          role="dialog" 
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setViewingSubmission(null); }}
        >
          <div className="partner-book-form" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <header>
              <div>
                <h2>{language === 'vi' ? 'Chi tiết yêu cầu duyệt sách' : 'Submission Details'}</h2>
                <p>{language === 'vi' ? 'Ngày gửi:' : 'Submitted on:'} {new Date(viewingSubmission.submittedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-GB')}</p>
              </div>
              <button type="button" onClick={() => setViewingSubmission(null)}><X/></button>
            </header>

            <div style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem' }}>
              <SafeImage
                src={viewingSubmission.proposedData.coverUrl || '/duong_sach_logo.png'} 
                alt="" 
                style={{ width: '110px', height: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827' }}>{viewingSubmission.proposedData.title || '—'}</h3>
                <p style={{ margin: 0, color: '#4b5563' }}><strong>{language === 'vi' ? 'Tác giả:' : 'Author:'}</strong> {viewingSubmission.proposedData.author || '—'}</p>
                <p style={{ margin: 0, color: '#4b5563' }}><strong>ISBN:</strong> {viewingSubmission.proposedData.isbn || '—'}</p>
                <p style={{ margin: 0, color: '#4b5563' }}><strong>{language === 'vi' ? 'NXB:' : 'Publisher:'}</strong> {viewingSubmission.proposedData.publisher || '—'}</p>
                <p style={{ margin: 0, color: '#4b5563' }}><strong>{language === 'vi' ? 'Tồn kho đề xuất:' : 'Stock:'}</strong> {viewingSubmission.inventoryQuantity ?? 0}</p>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>{language === 'vi' ? 'Trạng thái:' : 'Status:'}</strong>{' '}
                  <span className={`book-content-status ${viewingSubmission.status.normalize('NFC').toLowerCase()}`}>
                    {contentLabel(viewingSubmission.status, language)}
                  </span>
                </div>
              </div>
            </div>

            {viewingSubmission.rejectionReason && (
              <div style={{ padding: '0 1.25rem 1rem' }}>
                <div className="partner-rejection-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>{language === 'vi' ? 'Lý do bị từ chối:' : 'Rejection Reason:'}</strong>
                    <span>{viewingSubmission.rejectionReason}</span>
                  </div>
                </div>
              </div>
            )}

            {viewingSubmission.proposedData.description && (
              <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.82rem', color: '#374151', lineHeight: 1.5 }}>
                <strong>{language === 'vi' ? 'Mô tả tóm tắt:' : 'Description:'}</strong>
                <p style={{ margin: '0.3rem 0 0', background: '#f9fafb', padding: '0.6rem', borderRadius: '6px' }}>
                  {viewingSubmission.proposedData.description}
                </p>
              </div>
            )}

            <footer>
              <button type="button" onClick={() => setViewingSubmission(null)}>{language === 'vi' ? 'Đóng' : 'Close'}</button>
              {viewingSubmission.status === 'REJECTED' && (
                <button 
                  className="partner-books-primary"
                  onClick={() => { const s = viewingSubmission; setViewingSubmission(null); openResubmit(s); }}
                >
                  <RotateCcw size={14}/> {language === 'vi' ? 'Chỉnh sửa & Gửi lại' : 'Resubmit'}
                </button>
              )}
            </footer>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Xác nhận (Gỡ sách hoặc Hủy yêu cầu) */}
      {confirmAction && createPortal(
        <div 
          className="partner-book-modal" 
          role="dialog" 
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setConfirmAction(null); }}
        >
          <div className="partner-confirm-modal-box" onClick={e => e.stopPropagation()}>
            <div className="partner-confirm-head">
              <div className="partner-confirm-head-icon">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3>{confirmAction.title}</h3>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{language === 'vi' ? 'Xác nhận thao tác' : 'Confirm Action'}</span>
              </div>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
              {confirmAction.message}
            </p>

            <div className="partner-confirm-actions">
              <button className="partner-confirm-btn-cancel" onClick={() => setConfirmAction(null)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button className="partner-confirm-btn-danger" onClick={handleExecuteConfirm}>
                {language === 'vi' ? 'Xác nhận' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Thông báo CRUD cho Partner */}
      {modalNotice && createPortal(
        <div 
          className="partner-book-modal" 
          role="dialog" 
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setModalNotice(null); }}
        >
          <div className="partner-notice-modal-box" onClick={e => e.stopPropagation()}>
            <div className={`partner-notice-icon ${modalNotice.type}`}>
              {modalNotice.type === 'success' && <CheckCircle2 size={32} />}
              {modalNotice.type === 'error' && <AlertCircle size={32} />}
              {modalNotice.type === 'info' && <Info size={32} />}
            </div>
            <h3 className="partner-notice-title">{modalNotice.title}</h3>
            <p className="partner-notice-msg">{modalNotice.message}</p>
            <button className="partner-notice-btn" onClick={() => setModalNotice(null)}>
              {language === 'vi' ? 'Đã hiểu' : 'OK'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
