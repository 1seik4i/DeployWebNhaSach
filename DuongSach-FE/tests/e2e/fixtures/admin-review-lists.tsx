import { createRoot } from 'react-dom/client';
import { AdminEventSuggestionsView } from '../../../src/components/admin/AdminEventSuggestionsView';
import { AdminEventApplicationsView } from '../../../src/components/admin/AdminEventApplicationsView';
import '../../../src/index.css';
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('mode') === 'applications' ? <AdminEventApplicationsView language="vi"/> : <AdminEventSuggestionsView language="vi"/>);
