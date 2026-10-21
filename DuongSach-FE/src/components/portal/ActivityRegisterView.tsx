import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronRight, Edit3, Eye, Image as ImageIcon, MapPin, Plus, Search, Trash2, X } from 'lucide-react';
import type { Language } from '../../types';
import type { OrganizerActivityItem, OrganizerActivityProposal, OrganizerEvent } from '../../types/organizer';
import { useUrlTab } from '../../hooks/useUrlTab';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { confirmModal } from '../../services/notificationModal';
import './ActivityRegisterView.css';

export interface ActivityManagementViewProps {
  language: Language; activities?: OrganizerActivityItem[]; proposals?: OrganizerActivityProposal[]; events?: OrganizerEvent[];
  selectedEventId?: string; onSelectEventId?: (id: string) => void; onOpenCreateActivity: () => void;
  onOpenCalendarEvent?: (id: string) => void; onEditCalendarEvent?: (id: string) => void | Promise<void>;
  onDeleteCalendarEvent?: (id: string) => Promise<void>; onApproveCalendarEvent?: (id: string) => Promise<void>;
  onApproveActivity?: (id: string) => void | Promise<void>; onRejectActivity?: (id: string) => void | Promise<void>;
  onPublishActivity?: (id: string) => void | Promise<void>; onUpdateActivity?: (activity: OrganizerActivityItem) => void;
  onDeleteActivity?: (id: string) => void | Promise<void>; onDeleteProposal?: (id: string) => void | Promise<void>;
  onOpenAttendanceForActivity?: (id: string) => void;
  onApproveProposal?: (id: string, note?: string) => void | Promise<void>; onRejectProposal?: (id: string, note?: string) => void | Promise<void>;
  onRequestProposalSupplement?: (id: string, note: string) => void | Promise<void>;
  onCreateActivityFromProposal?: (id: string) => void | Promise<void>;
}
type Entry = {
  key: string; id: string; source: 'proposal' | 'activity' | 'event'; eventId: string; eventName: string;
  title: string; type: string; date: string; time: string; location: string; organization: string;
  image: string; status: string; description: string; capacity: number; registered: number;
  startAt?: string; endAt?: string; note?: string; contact?: string; email?: string; phone?: string; equipment?: string[];
};
const pending = (status: string) => ['pending', 'need_revision', 'draft'].includes(status);
const approved = (status: string) => ['approved', 'published', 'ongoing', 'completed', 'upcoming', 'happening'].includes(status);
const typeName = (kind: string, vi: boolean) => ({ launch: vi ? 'Ra mắt sách' : 'Book launch', signing: vi ? 'Ký tặng' : 'Signing', exhibition: vi ? 'Triển lãm' : 'Exhibition', talkshow: 'Talkshow', workshop: 'Workshop', minigame: 'Mini game' }[kind.toLowerCase()] || kind);
function statusName(status: string, vi: boolean) {
  return ({ pending: vi ? 'Chờ duyệt' : 'Pending', need_revision: vi ? 'Cần bổ sung' : 'Needs revision', draft: vi ? 'Bản nháp' : 'Draft', rejected: vi ? 'Không duyệt' : 'Rejected', withdrawn: vi ? 'Đã rút' : 'Withdrawn', cancelled: vi ? 'Đã hủy' : 'Cancelled' })[status] || (approved(status) ? (vi ? 'Đã duyệt' : 'Approved') : status);
}

export function ActivityManagementView(props: ActivityManagementViewProps) {
  const { language, activities = [], proposals = [], events = [], selectedEventId = '' } = props;
  const vi = language === 'vi';
  const [tab, setTab] = useUrlTab(['all', 'pending', 'approved', 'cancelled'], 'all', 'section');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [selected, setSelected] = useState<Entry | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  useModalBehavior(Boolean(selected), () => { if (!busy) setSelected(null); });
  const entries = useMemo(() => {
    const parent = new Map(events.map(event => [event.id, event]));
    const proposalRows: Entry[] = proposals.map(item => ({
      key: `proposal:${item.id}`, id: item.id, source: 'proposal', eventId: item.eventId, eventName: parent.get(item.eventId)?.title || '',
      title: item.title, type: typeName(item.kind, vi), date: item.dateStr, time: item.timeStr, location: item.location,
      organization: item.orgName, image: parent.get(item.eventId)?.imageUrl || item.thumbnail, status: item.status,
      description: item.description, capacity: item.capacity, registered: 0, note: item.reviewNote,
      contact: item.contactName, email: item.contactEmail, phone: item.contactPhone, equipment: item.requiredEquipments,
    }));
    const official: Entry[] = activities.map(item => ({
      key: `activity:${item.id}`, id: item.id, source: 'activity', eventId: item.eventId, eventName: parent.get(item.eventId)?.title || '',
      title: item.title, type: typeName(item.type, vi), date: item.dateStr, time: item.timeStr, location: item.location,
      organization: item.partnerName, image: parent.get(item.eventId)?.imageUrl || item.thumbnail, status: item.status,
      description: item.description, capacity: item.capacity, registered: item.registeredCount, startAt: item.startAt, endAt: item.endAt,
    }));
    const calendar: Entry[] = Array.from(parent.values()).filter(event =>
      !proposals.some(item => item.eventId === event.id && item.standaloneEvent) &&
      !activities.some(item => item.eventId === event.id && item.title === event.title && item.startAt === event.startAt && item.endAt === event.endAt)
    ).map(event => ({
      key: `event:${event.id}`, id: event.id, source: 'event', eventId: event.id, eventName: '', title: event.title,
      type: vi ? 'Sự kiện' : 'Event', date: event.dateRange || event.startDate, time: event.timeStr || '', location: event.location,
      organization: '', image: event.imageUrl, status: event.status, description: event.description || '',
      capacity: event.maxCapacity || 0, registered: event.registrationsCount || 0, startAt: event.startAt, endAt: event.endAt,
    }));
    return [...proposalRows, ...official, ...calendar].filter(item => !selectedEventId || selectedEventId === 'all' || item.eventId === selectedEventId);
  }, [activities, proposals, events, vi, selectedEventId]);
  const filtered = entries.filter(item => {
    if (tab === 'pending' && !pending(item.status)) return false;
    if (tab === 'approved' && !approved(item.status)) return false;
    if (tab === 'cancelled' && (pending(item.status) || approved(item.status))) return false;
    if (kind !== 'all' && item.type !== kind) return false;
    return `${item.title} ${item.eventName} ${item.organization} ${item.location}`.normalize('NFC').toLocaleLowerCase('vi').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi'));
  });
  const pagination = useListPagination(filtered, `${selectedEventId}:${tab}:${kind}:${query}`, 8);
  const open = (item: Entry) => { setSelected(item); setNote(''); setError(''); };
  const run = async (item: Entry, work: () => void | Promise<void>, close = false) => {
    if (busy) return;
    setBusy(item.key); setError('');
    try { await work(); if (close) setSelected(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu'); }
    finally { setBusy(null); }
  };
  const approve = (item: Entry) => run(item, async () => {
    if (item.source === 'proposal') await props.onApproveProposal?.(item.id, selected?.key === item.key ? note.trim() || undefined : undefined);
    else if (item.source === 'event') await props.onApproveCalendarEvent?.(item.id);
    else await (props.onPublishActivity || props.onApproveActivity)?.(item.id);
  }, true);
  const remove = (item: Entry) => run(item, async () => {
    if (!await confirmModal(vi ? `Xóa “${item.title}”?` : `Delete “${item.title}”?`)) return;
    if (item.source === 'proposal') await props.onDeleteProposal?.(item.id);
    else if (item.source === 'event') await props.onDeleteCalendarEvent?.(item.id);
    else await props.onDeleteActivity?.(item.id);
  });
  const canApprove = (item: Entry) => pending(item.status) && Boolean(item.source === 'proposal' ? props.onApproveProposal : item.source === 'event' ? props.onApproveCalendarEvent : props.onPublishActivity || props.onApproveActivity);
  const canDelete = (item: Entry) => Boolean(item.source === 'proposal' ? props.onDeleteProposal : item.source === 'event' ? props.onDeleteCalendarEvent : props.onDeleteActivity);
  const state = (item: Entry) => <span className={`ar-status ${pending(item.status) ? 'is-pending' : approved(item.status) ? 'is-approved' : 'is-closed'}`}>{statusName(item.status, vi)}</span>;
  const tabs: Array<{ id: 'all' | 'pending' | 'approved' | 'cancelled'; title: string; count: number }> = [
    { id: 'all', title: vi ? 'Tất cả' : 'All', count: entries.length },
    { id: 'pending', title: vi ? 'Chờ xử lý' : 'To review', count: entries.filter(item => pending(item.status)).length },
    { id: 'approved', title: vi ? 'Đã duyệt' : 'Approved', count: entries.filter(item => approved(item.status)).length },
    { id: 'cancelled', title: vi ? 'Không duyệt / Đã hủy' : 'Rejected / Cancelled', count: entries.filter(item => !pending(item.status) && !approved(item.status)).length },
  ];
  return <div className="organizer-content activity-register">
    <header className="ar-header"><div><h1>{vi ? 'Hoạt động & đề xuất' : 'Activities & proposals'}</h1><p>{vi ? 'Duyệt đề xuất, theo dõi lịch và đơn vị tổ chức.' : 'Review proposals and track schedules and organizers.'}</p></div><button className="ar-button ar-primary" onClick={props.onOpenCreateActivity}><Plus size={17}/>{vi ? 'Tạo sự kiện' : 'Create event'}</button></header>
    <nav className="ar-tabs" aria-label={vi ? 'Trạng thái hoạt động' : 'Activity status'}>{tabs.map(item => <button key={item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>{item.title}<span>{item.count}</span></button>)}</nav>
    <div className="ar-filters"><label className="ar-search"><Search size={17}/><input aria-label={vi ? 'Tìm hoạt động' : 'Search activities'} placeholder={vi ? 'Tên hoạt động, đối tác, địa điểm…' : 'Activity, partner, location…'} maxLength={200} value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label={vi ? 'Lọc sự kiện' : 'Filter event'} value={selectedEventId || 'all'} onChange={e => props.onSelectEventId?.(e.target.value === 'all' ? '' : e.target.value)}><option value="all">{vi ? 'Tất cả sự kiện' : 'All events'}</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select><select aria-label={vi ? 'Loại hoạt động' : 'Activity type'} value={kind} onChange={e => setKind(e.target.value)}><option value="all">{vi ? 'Tất cả loại' : 'All types'}</option>{[...new Set(entries.map(item => item.type))].map(type => <option key={type}>{type}</option>)}</select></div>
    {error && !selected && <p role="alert" className="ar-error">{error}</p>}
    <div className="ar-register"><div className="ar-columns" aria-hidden="true"><span>{vi ? 'Hoạt động' : 'Activity'}</span><span>{vi ? 'Lịch tổ chức' : 'Schedule'}</span><span>{vi ? 'Đơn vị tổ chức' : 'Organizer'}</span><span>{vi ? 'Trạng thái' : 'Status'}</span><span>{vi ? 'Thao tác' : 'Actions'}</span></div>
      {pagination.items.map(item => <article className="ar-row" key={item.key} data-activity-id={item.key}>
        <div className="ar-identity">{item.image ? <img src={item.image} alt=""/> : <span className="ar-no-image"><ImageIcon size={23}/><small>{vi ? 'Chưa có ảnh' : 'No image'}</small></span>}<div><span className="ar-kind">{item.type}</span><button className="ar-title" onClick={() => open(item)}>{item.title}</button>{item.eventName && item.eventName !== item.title && <p className="ar-parent">{item.eventName}</p>}</div></div>
        <div className="ar-schedule"><strong>{item.date || '—'}</strong><span>{item.time || '—'}</span><small><MapPin size={12}/>{item.location || (vi ? 'Chưa có địa điểm' : 'No location')}</small></div>
        <div className="ar-organizer">{item.organization || (vi ? 'Ban quản lý' : 'Management')}</div>
        <div className="ar-state">{state(item)}{approved(item.status) && <small>{item.endAt && new Date(item.endAt).getTime() < Date.now() ? (vi ? 'Đã kết thúc' : 'Ended') : (vi ? 'Trong lịch hoạt động' : 'On the calendar')}</small>}</div>
        <div className="ar-actions"><button className="ar-button" onClick={() => open(item)}><Eye size={15}/>{vi ? 'Chi tiết' : 'Details'}</button>{canApprove(item) && <button disabled={Boolean(busy)} className="ar-button ar-primary" onClick={() => void approve(item)}><Check size={15}/>{busy === item.key ? (vi ? 'Đang duyệt…' : 'Approving…') : (vi ? 'Duyệt' : 'Approve')}</button>}{canDelete(item) && <button className="ar-icon-button ar-danger" disabled={Boolean(busy)} aria-label={`${vi ? 'Xóa' : 'Delete'} ${item.title}`} onClick={() => void remove(item)}><Trash2 size={16}/></button>}</div>
      </article>)}
      {!filtered.length && <div className="ar-empty"><CalendarDays size={28}/><h2>{vi ? 'Không có hoạt động phù hợp' : 'No matching activities'}</h2><p>{vi ? 'Thử đổi trạng thái, sự kiện hoặc từ khóa tìm kiếm.' : 'Try another status, event or search term.'}</p></div>}
    </div><ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi={vi}/>
    {selected && createPortal(<div className="ar-overlay" role="dialog" aria-modal="true" aria-labelledby="ar-detail-title" onClick={() => { if (!busy) setSelected(null); }}><section className="ar-detail" onClick={e => e.stopPropagation()}>
      <header><span>{vi ? 'Chi tiết hoạt động' : 'Activity details'}</span><button className="ar-icon-button" disabled={Boolean(busy)} aria-label={vi ? 'Đóng' : 'Close'} onClick={() => setSelected(null)}><X size={21}/></button></header>
      <div className="ar-detail-body">{selected.image && <img className="ar-detail-cover" src={selected.image} alt={selected.title}/>}
        <div className="ar-detail-title"><span className="ar-kind">{selected.type}</span><h2 id="ar-detail-title">{selected.title}</h2>{state(selected)}</div>
        <dl className="ar-facts"><div><dt>{vi ? 'Ngày tổ chức' : 'Date'}</dt><dd>{selected.date || '—'}</dd></div><div><dt>{vi ? 'Khung giờ' : 'Time'}</dt><dd>{selected.time || '—'}</dd></div><div><dt>{vi ? 'Địa điểm' : 'Location'}</dt><dd>{selected.location || '—'}</dd></div><div><dt>{vi ? 'Đơn vị tổ chức' : 'Organizer'}</dt><dd>{selected.organization || (vi ? 'Ban quản lý' : 'Management')}</dd></div><div><dt>{vi ? 'Sức chứa' : 'Capacity'}</dt><dd>{selected.capacity}</dd></div><div><dt>{vi ? 'Đã đăng ký' : 'Registered'}</dt><dd>{selected.registered}</dd></div></dl>
        {selected.description && <section className="ar-detail-section"><h3>{vi ? 'Nội dung chương trình' : 'Program description'}</h3><p>{selected.description}</p></section>}
        {(selected.contact || selected.email || selected.phone) && <section className="ar-detail-section"><h3>{vi ? 'Liên hệ' : 'Contact'}</h3><p>{[selected.contact, selected.email, selected.phone].filter(Boolean).join(' · ')}</p></section>}
        {selected.equipment?.length ? <section className="ar-detail-section"><h3>{vi ? 'Thiết bị đề nghị' : 'Requested equipment'}</h3><p>{selected.equipment.join(', ')}</p></section> : null}
        {selected.note && <section className="ar-detail-section"><h3>{vi ? 'Ghi chú xét duyệt' : 'Review note'}</h3><p>{selected.note}</p></section>}
        {canApprove(selected) && <section className="ar-review"><h3>{vi ? 'Xét duyệt đề xuất' : 'Review proposal'}</h3><p>{vi ? 'Khi được duyệt, hoạt động sẽ tự xuất hiện trong lịch.' : 'Approval adds this activity to the calendar.'}</p><label>{vi ? 'Ghi chú cho đối tác' : 'Note to partner'}<textarea rows={3} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder={vi ? 'Nội dung cần phản hồi hoặc bổ sung…' : 'Feedback or required changes…'}/></label>
          <div className="ar-review-actions">{selected.source !== 'event' && (selected.source === 'proposal' ? props.onRejectProposal : props.onRejectActivity) && <button className="ar-button ar-danger" disabled={Boolean(busy)} onClick={() => void run(selected, () => selected.source === 'proposal' ? props.onRejectProposal?.(selected.id, note.trim() || undefined) : props.onRejectActivity?.(selected.id), true)}>{vi ? 'Không duyệt' : 'Reject'}</button>}<button className="ar-button ar-primary" disabled={Boolean(busy)} onClick={() => void approve(selected)}><Check size={16}/>{vi ? 'Duyệt hoạt động' : 'Approve activity'}</button></div>
        </section>}
        {approved(selected.status) && <p className="ar-calendar-note"><Check size={16}/>{vi ? 'Đã có trong lịch hoạt động.' : 'Added to the activity calendar.'}</p>}
        {error && <p role="alert" className="ar-error">{error}</p>}
      </div><footer>{selected.source === 'event' && props.onEditCalendarEvent && <button className="ar-button" disabled={Boolean(busy)} onClick={() => void run(selected, () => props.onEditCalendarEvent!(selected.id), true)}><Edit3 size={15}/>{vi ? 'Sửa thông tin' : 'Edit information'}</button>}{props.onOpenCalendarEvent && <button className="ar-button" onClick={() => { setSelected(null); props.onOpenCalendarEvent!(selected.eventId); }}><CalendarDays size={16}/>{vi ? 'Xem sự kiện' : 'View event'}<ChevronRight size={15}/></button>}<button className="ar-button" disabled={Boolean(busy)} onClick={() => setSelected(null)}>{vi ? 'Đóng' : 'Close'}</button></footer>
    </section></div>, document.body)}
  </div>;
}
