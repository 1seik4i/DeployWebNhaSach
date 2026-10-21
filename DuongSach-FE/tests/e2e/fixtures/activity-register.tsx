import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ActivityManagementView } from '../../../src/components/portal/ActivityManagementView';
import { organizerApi } from '../../../src/services/organizerApi';
import type { OrganizerActivityItem, OrganizerActivityProposal, OrganizerEvent } from '../../../src/types/organizer';
import '../../../src/index.css';
const cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="260"><rect width="600" height="260" fill="#3a4b3a"/><text x="30" y="65" fill="#f7f5f0" font-size="30">BOOK STREET / OCTOBER</text></svg>');
const baseEvent = { id: 'main', title: 'Chương trình đọc sách', imageUrl: cover, startAt: '2026-10-25T02:00:00Z', endAt: '2026-10-25T04:00:00Z', startDate: '2026-10-25', dateRange: '25/10/2026', status: 'upcoming', isPublished: true, location: 'Sân khấu chính', registrationsCount: 8 } as OrganizerEvent;
const initialActivity = { id: 'official', eventId: 'main', title: baseEvent.title, thumbnail: '', type: 'talkshow', dateStr: '25/10/2026', timeStr: '09:00 – 11:00', startAt: baseEvent.startAt, endAt: baseEvent.endAt, location: 'Sân khấu chính', status: 'published', isPublished: true, capacity: 60, registeredCount: 8, attendedCount: 0, partnerName: 'Nhà xuất bản Trẻ', description: 'Gặp gỡ tác giả và trao đổi cùng bạn đọc.' } as OrganizerActivityItem;
const proposal = { id: 'pending', eventId: 'main', title: 'Đọc sách cùng tác giả', kind: 'talkshow', orgName: 'Nhà xuất bản Trẻ', dateStr: '25/10/2026', timeStr: '13:00 – 14:00', location: 'Sân khấu chính', status: 'pending', thumbnail: '', description: 'Nội dung đề xuất từ đối tác.', capacity: 40, requiredEquipments: ['Micro'], contactName: 'Nguyễn Minh', contactEmail: 'minh@example.test', contactPhone: '0901234567' } as OrganizerActivityProposal;
function Fixture() {
  const [activities, setActivities] = useState([initialActivity]);
  const [proposals, setProposals] = useState([proposal, { ...proposal, id: 'revision', title: 'Tọa đàm cần bổ sung', status: 'need_revision' as const }]);
  const [eventId, setEventId] = useState('');
  return <ActivityManagementView language="vi" activities={activities} proposals={proposals} events={[baseEvent]} selectedEventId={eventId} onSelectEventId={setEventId} onOpenCreateActivity={() => {}}
    onApproveProposal={async (id, note) => { await organizerApi.approveProposal(id, note); const source = proposals.find(item => item.id === id)!; setActivities(rows => [...rows, { ...initialActivity, id: `approved-${id}`, title: source.title, timeStr: source.timeStr }]); setProposals(rows => rows.filter(item => item.id !== id)); }}
    onRequestProposalSupplement={async (id, note) => { await organizerApi.requestProposalSupplement(id, note); }}
    onRejectProposal={async id => { setProposals(rows => rows.map(item => item.id === id ? { ...item, status: 'rejected' } : item)); }}
    onDeleteProposal={async id => { setProposals(rows => rows.filter(item => item.id !== id)); }}/>
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Fixture/></BrowserRouter>);
