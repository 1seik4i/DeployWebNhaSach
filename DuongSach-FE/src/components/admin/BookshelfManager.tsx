import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Crown, Edit3, GripVertical, Plus, Settings, Trash2, X } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import type { Book, Language } from '../../types';
import { libraryApi, type Bookshelf } from '../../services/libraryApi';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { SafeImage } from '../ui/SafeImage';
import './BookshelfManager.css';

type Draft = { id?: string; name: string; ranked: boolean; bookIds: string[] };
type Removal = { shelf: Bookshelf; book?: Book };

function RankedBookRow({ book, index, saving, vi, onStart, onEnd, onKeyboardMove, onRemove, onEdit }: {
  book: Book; index: number; saving: boolean; vi: boolean;
  onStart: () => void; onEnd: () => void;
  onKeyboardMove: (direction: number) => void; onRemove: () => void;
  onEdit?: () => void;
}) {
  const controls = useDragControls();
  return <Reorder.Item as="tr" value={book.id} dragListener={false} dragControls={controls} dragMomentum={false}
    onDragStart={onStart} onDragEnd={onEnd} className="bookshelf-ranked-row"
    whileDrag={{ backgroundColor: '#edf5f0', boxShadow: '0 8px 24px rgba(23,56,46,.16)', zIndex: 2 }}>
    <td className="bookshelf-col-rank">
      <span className={`bookshelf-rank-pill rank-${index + 1 <= 3 ? index + 1 : 'other'}`}>
        {index === 0 && <Crown size={13} strokeWidth={2.4} />}
        {index === 1 && <Award size={13} strokeWidth={2.4} />}
        {index === 2 && <Award size={13} strokeWidth={2.4} />}
        <span>#{index + 1}</span>
      </span>
    </td>
    <td className="bookshelf-col-book">
      <div className="admin-book-cell">
        <SafeImage className="admin-book-cover" src={book.coverUrl} alt={book.title} />
        <strong>{book.title}</strong>
      </div>
    </td>
    <td className="bookshelf-col-author">{book.author}</td>
    <td className="bookshelf-col-order">
      <button type="button" className="bookshelf-drag-handle" disabled={saving}
        aria-label={`${vi ? 'Kéo để đổi hạng' : 'Drag to rank'} ${book.title}`}
        title={vi ? 'Nắm và kéo để đổi hạng. Dùng phím ↑ ↓ khi chọn nút này.' : 'Drag to reorder, or use arrow keys.'}
        onPointerDown={event => { if (!saving) controls.start(event); }}
        onKeyDown={event => {
          if (!saving && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault(); onKeyboardMove(event.key === 'ArrowUp' ? -1 : 1);
          }
        }}><GripVertical size={19}/></button>
    </td>
    <td className="bookshelf-col-actions">
      <div className="bookshelf-actions">
        {onEdit && (
          <button type="button" className="admin-library-secondary" disabled={saving} onClick={onEdit}>
            <Edit3 size={16}/>{vi ? 'Chỉnh sửa sách' : 'Edit book'}
          </button>
        )}
        <button type="button" className="bookshelf-remove-book" disabled={saving} onClick={onRemove} aria-label={`${vi ? 'Gỡ khỏi tủ' : 'Remove from shelf'} ${book.title}`}>
          <Trash2 size={16}/>
        </button>
      </div>
    </td>
  </Reorder.Item>;
}
export function BookshelfManager({ books, language, onEditBook }: { books: Book[]; language: Language; onEditBook?: (book: Book) => void }) {
  const vi = language === 'vi';
  const [shelves, setShelves] = useState<Bookshelf[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragSnapshot = useRef<Bookshelf | null>(null);
  const dragOrder = useRef<string[]>([]);
  useEffect(() => {
    const currentBooks = new Map(books.map(book => [book.id, book]));
    setShelves(rows => rows.map(row => ({ ...row, books: row.books.map(book => ({ ...book, ...currentBooks.get(book.id) })) })));
  }, [books]);
  useModalBehavior(Boolean(draft || removal), () => { if (!saving) { setDraft(null); setRemoval(null); } });
  const load = async () => {
    const rows = await libraryApi.getBookshelves(true);
    setShelves(rows);
    setSelected(id => rows.some(row => row.id === id) ? id : rows[0]?.id || '');
  };
  useEffect(() => {
    let active = true;
    libraryApi.getBookshelves(true).then(rows => {
      if (active) { setShelves(rows); setSelected(rows[0]?.id || ''); }
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const shelf = shelves.find(row => row.id === selected);
  const edit = (row?: Bookshelf) => {
    setQuery(''); setError('');
    setDraft(row ? { id: row.id, name: row.name, ranked: row.ranked, bookIds: row.books.map(book => book.id) }
      : { name: '', ranked: false, bookIds: [] });
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setError('');
    try {
      const { id, ...data } = draft;
      if (id) await libraryApi.updateBookshelf(id, data);
      else { const created = await libraryApi.createBookshelf(data); setSelected(created.id); }
      await load(); setDraft(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu tủ sách'); }
    finally { setSaving(false); }
  };
  const commitOrder = async (row: Bookshelf, ids: string[]) => {
    setSaving(true); setError('');
    try { await libraryApi.updateBookshelf(row.id, { bookIds: ids }); await load(); }
    catch (err) {
      setShelves(rows => rows.map(item => item.id === row.id ? row : item));
      setError(err instanceof Error ? err.message : 'Không thể đổi thứ tự');
    }
    finally { setSaving(false); }
  };
  const finishDrag = () => {
    const original = dragSnapshot.current;
    const ids = dragOrder.current;
    dragSnapshot.current = null; setDragging(false);
    if (original && original.books.some((book, index) => book.id !== ids[index])) void commitOrder(original, ids);
  };
  const keyboardMove = (index: number, direction: number) => {
    if (!shelf || saving || dragging || index + direction < 0 || index + direction >= shelf.books.length) return;
    const ids = shelf.books.map(book => book.id);
    const [id] = ids.splice(index, 1); ids.splice(index + direction, 0, id);
    void commitOrder(shelf, ids);
  };
  const confirmRemoval = async () => {
    if (!removal || saving) return;
    setSaving(true); setError('');
    try {
      if (removal.book) await libraryApi.updateBookshelf(removal.shelf.id, { bookIds: removal.shelf.books.filter(book => book.id !== removal.book!.id).map(book => book.id) });
      else await libraryApi.deleteBookshelf(removal.shelf.id);
      await load(); setRemoval(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể xóa'); }
    finally { setSaving(false); }
  };
  const candidates = books.filter(book => book.status === 'active' && `${book.title} ${book.author} ${book.isbn}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi')));
  return <section className="admin-library-panel bookshelf-manager">
    <div className="bookshelf-header-bar">
      <div>
        <h3 className="bookshelf-title">{vi ? 'Tủ sách' : 'Bookshelves'}</h3>
        <p className="bookshelf-subtitle">{vi ? 'Tạo bộ sưu tập sách và chọn cách hiển thị trên thư viện số.' : 'Curate collections for the digital library.'}</p>
      </div>
      <button className="admin-library-primary" onClick={() => edit()} disabled={loading || saving || dragging}>
        <Plus size={16} />{vi ? 'Tạo tủ sách' : 'Create bookshelf'}
      </button>
    </div>
    {error && !draft && <p role="alert" className="bookshelf-error">{error}</p>}
    {loading ? <p role="status" className="bookshelf-empty">{vi ? 'Đang tải tủ sách…' : 'Loading…'}</p> : <>
      <div className="bookshelf-sub-bar">
        <div className="bookshelf-tabs" role="tablist" aria-label={vi ? 'Tủ sách' : 'Bookshelves'}>
          {shelves.map(row => (
            <button
              key={row.id}
              role="tab"
              disabled={saving || dragging}
              aria-selected={row.id === selected}
              className={`bookshelf-tab-btn ${row.id === selected ? 'is-active' : ''}`}
              onClick={() => setSelected(row.id)}
            >
              <span>{row.name}</span>
              <span className="bookshelf-tab-count">{row.books.length}</span>
            </button>
          ))}
        </div>
        {shelf && (
          <div className="bookshelf-actions">
            <button className="admin-library-secondary" onClick={() => edit(shelf)} disabled={saving || dragging}>
              <Settings size={15}/>{vi ? 'Sửa tủ sách / Chọn sách' : 'Edit / Select books'}
            </button>
            {shelf.id !== 'bestseller' && !shelf.name.toLowerCase().includes('top 100') && (
              <button className="admin-library-secondary bookshelf-delete" disabled={saving || dragging} onClick={() => { setError(''); setRemoval({ shelf }); }}>
                <Trash2 size={15}/>{vi ? 'Xóa tủ sách' : 'Delete bookshelf'}
              </button>
            )}
          </div>
        )}
      </div>
      {!shelves.length && <p className="bookshelf-empty">{vi ? 'Chưa có tủ sách. Chọn “Tạo tủ sách” để bắt đầu.' : 'No shelves yet. Create a bookshelf to start.'}</p>}
      {shelf && <>
        <div className="admin-library-table-wrap"><table className="bookshelf-ranked-table"><thead><tr>{shelf.ranked && <th className="bookshelf-col-rank">{vi ? 'Hạng' : 'Rank'}</th>}<th className="bookshelf-col-book">{vi ? 'Sách' : 'Book'}</th><th className="bookshelf-col-author">{vi ? 'Tác giả' : 'Author'}</th>{shelf.ranked && <th className="bookshelf-col-order">{vi ? 'Thứ hạng' : 'Order'}</th>}<th className="bookshelf-col-actions">{vi ? 'Thao tác' : 'Actions'}</th></tr></thead>
          {shelf.ranked ? <Reorder.Group key={shelf.id} as="tbody" axis="y" values={shelf.books.map(book => book.id)} onReorder={(ids: string[]) => {
            if (saving) return;
            dragOrder.current = ids;
            setShelves(rows => rows.map(row => row.id === shelf.id ? { ...row, books: ids.map(id => row.books.find(book => book.id === id)!) } : row));
          }}>
            {shelf.books.map((book, index) => <RankedBookRow key={book.id} book={book} index={index} vi={vi} saving={saving}
              onEdit={onEditBook ? () => { if (!dragging) onEditBook(book); } : undefined}
              onStart={() => { dragSnapshot.current = shelf; dragOrder.current = shelf.books.map(book => book.id); setDragging(true); }}
              onEnd={finishDrag} onKeyboardMove={direction => keyboardMove(index, direction)}
              onRemove={() => { if (!dragging) { setError(''); setRemoval({ shelf, book }); } }}/>) }
          </Reorder.Group> : <tbody>{shelf.books.map(book => <tr key={book.id}><td className="bookshelf-col-book"><div className="admin-book-cell"><SafeImage className="admin-book-cover" src={book.coverUrl} alt={book.title}/><strong>{book.title}</strong></div></td><td className="bookshelf-col-author">{book.author}</td><td className="bookshelf-col-actions"><div className="bookshelf-actions">{onEditBook && <button type="button" className="admin-library-secondary" disabled={saving} onClick={() => onEditBook(book)}><Edit3 size={16}/>{vi ? 'Chỉnh sửa sách' : 'Edit book'}</button>}<button type="button" className="bookshelf-remove-book" disabled={saving} onClick={() => { setError(''); setRemoval({ shelf, book }); }} aria-label={`${vi ? 'Gỡ khỏi tủ' : 'Remove from shelf'} ${book.title}`}><Trash2 size={16}/></button></div></td></tr>)}</tbody>}
        </table></div>
        {!shelf.books.length && <p className="bookshelf-empty">{vi ? 'Tủ sách chưa có sách. Chọn “Sửa tủ sách / Chọn sách” để thêm.' : 'No books yet. Edit this shelf to add books.'}</p>}
      </>}
    </>}
    {removal && createPortal(<div className="admin-library-modal" role="dialog" aria-modal="true" aria-labelledby="bookshelf-remove-title"><div className="bookshelf-form">
      <header><h2 id="bookshelf-remove-title">{removal.book ? (vi ? 'Gỡ sách khỏi tủ?' : 'Remove book from shelf?') : (vi ? 'Xóa tủ sách?' : 'Delete bookshelf?')}</h2></header>
      <div className="bookshelf-form-body"><p>{removal.book ? `“${removal.book.title}” — ${removal.shelf.name}` : `“${removal.shelf.name}”`}</p><p>{vi ? 'Thao tác này không xóa sách khỏi thư viện hoặc thay đổi tồn kho.' : 'Library books and inventory will be preserved.'}</p>{error && <p role="alert" className="bookshelf-error">{error}</p>}</div>
      <footer><button className="admin-library-secondary" disabled={saving} onClick={() => setRemoval(null)}>{vi ? 'Hủy' : 'Cancel'}</button><button className="admin-library-primary" disabled={saving} onClick={() => void confirmRemoval()}>{saving ? (vi ? 'Đang xử lý…' : 'Processing…') : (vi ? 'Xác nhận' : 'Confirm')}</button></footer>
    </div></div>, document.body)}
    {draft && createPortal(<div className="admin-library-modal" role="dialog" aria-modal="true" aria-labelledby="bookshelf-form-title"><form className="bookshelf-form" onSubmit={save}>
      <header><h2 id="bookshelf-form-title">{draft.id ? (vi ? 'Chỉnh sửa tủ sách' : 'Edit bookshelf') : (vi ? 'Tạo tủ sách' : 'Create bookshelf')}</h2><button type="button" disabled={saving} onClick={() => setDraft(null)} aria-label={vi ? 'Đóng' : 'Close'}><X size={20}/></button></header>
      <div className="bookshelf-form-body"><label className="bookshelf-name">{vi ? 'Tên tủ sách' : 'Bookshelf name'}<input autoFocus required maxLength={200} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
        <label className="bookshelf-checkbox"><input type="checkbox" checked={draft.ranked} onChange={e => setDraft({ ...draft, ranked: e.target.checked })}/>{vi ? 'Có xếp hạng' : 'Enable ranking'}</label>
        <p>{vi ? 'Khi bật, sách hiển thị thứ hạng theo thứ tự trong tủ. Khi tắt, chỉ hiển thị sách.' : 'Enable to display rank numbers in shelf order.'}</p>
        <label className="bookshelf-name">{vi ? `Chọn sách (${draft.bookIds.length} đã chọn)` : `Select books (${draft.bookIds.length} selected)`}<input value={query} onChange={e => setQuery(e.target.value)} placeholder={vi ? 'Tìm theo tên, tác giả, ISBN' : 'Search title, author, ISBN'} maxLength={200}/></label>
        <div className="bookshelf-book-picker">{candidates.map(book => <label key={book.id} className="bookshelf-checkbox"><input type="checkbox" checked={draft.bookIds.includes(book.id)} onChange={e => setDraft({ ...draft, bookIds: e.target.checked ? [...draft.bookIds, book.id] : draft.bookIds.filter(id => id !== book.id) })}/><span><strong>{book.title}</strong><small>{book.author} · {book.isbn}</small></span></label>)}{!candidates.length && <p>{vi ? 'Không tìm thấy sách.' : 'No books found.'}</p>}</div>
        {error && <p role="alert" className="bookshelf-error">{error}</p>}
      </div><footer><button type="button" disabled={saving} className="admin-library-secondary" onClick={() => setDraft(null)}>{vi ? 'Hủy' : 'Cancel'}</button><button disabled={saving || !draft.name.trim()} className="admin-library-primary" type="submit">{saving ? (vi ? 'Đang lưu…' : 'Saving…') : (vi ? 'Lưu tủ sách' : 'Save bookshelf')}</button></footer>
    </form></div>, document.body)}
  </section>;
}
