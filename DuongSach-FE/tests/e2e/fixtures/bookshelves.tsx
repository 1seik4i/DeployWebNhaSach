import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BookshelfManager } from '../../../src/components/admin/BookshelfManager';
import { DigitalLibrarySection } from '../../../src/components/library/DigitalLibrarySection';
import { DigitalLibraryPage } from '../../../src/pages/DigitalLibraryPage';
import '../../../src/components/admin/AdminDigitalLibraryView.css';
import type { Book } from '../../../src/types';

const books = [
  { id: '00000000-0000-4000-8000-000000000001', title: 'Sách một', author: 'Tác giả một', isbn: '111', coverUrl: '/duong_sach_logo.png', status: 'active' },
  { id: '00000000-0000-4000-8000-000000000002', title: 'Sách hai', author: 'Tác giả hai', isbn: '222', coverUrl: '/duong_sach_logo.png', status: 'active' },
] as Book[];
createRoot(document.getElementById('root')!).render(<BrowserRouter>
  {new URLSearchParams(window.location.search).has('catalogue') ? <DigitalLibraryPage language="vi"/> : new URLSearchParams(window.location.search).has('landing') ? <DigitalLibrarySection language="vi" /> : <BookshelfManager language="vi" books={books} />}
</BrowserRouter>);
