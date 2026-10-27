import { DatePicker } from '../ui/DatePicker';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { imageFileError } from '../../utils/fileValidation';
import React, { useState } from 'react';
import {
  X,
  MapPin,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Building2,
  Mic,
  Tag,
  Upload
} from 'lucide-react';
import { Language, PartnerOrganization } from '../../types';
import './OrganizerPortal.css';
import { OrganizerActivityItem } from '../../types/organizer';
import { activityDateKey } from '../../utils/activityDate';
import { MAX_EVENT_IMAGE_MB } from '../../utils/eventImage';

function firstRegistrationDate() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export interface EventRegistrationData extends Omit<OrganizerActivityItem, 'eventId' | 'startAt' | 'endAt'> {
  startAt: string;
  endAt: string;
  devices?: Array<{ name: string; quantity: number }>;
  eventId?: string;
}

interface EventRegistrationModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  locations?: Array<{ id: string; name: string; capacity: number }>;
  initialDate?: string;
  organization?: PartnerOrganization;
  assets?: Array<{ id: string; name: string; totalQuantity: number }>;
  onRegister: (newActivity: EventRegistrationData) => void | Promise<void>;
  titleOverride?: string;
  subtitleOverride?: string;
  submitLabel?: string;
  isActivity?: boolean;
  events?: Array<{ id: string; title: string; startDate?: string; endDate?: string }>;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  language,
  isOpen,
  onClose,
  locations = [],
  onRegister,
  initialDate,
  organization,
  assets = [],
  titleOverride,
  subtitleOverride,
  submitLabel,
  isActivity,
  events = [],
}) => {
  const isActivityMode = isActivity ?? Boolean(
    titleOverride?.toLowerCase().includes('hoạt động') || 
    submitLabel?.toLowerCase().includes('hoạt động')
  );
  const [selectedEventId, setSelectedEventId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('talkshow');
  const [partnerName, setPartnerName] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [targetAudience, setTargetAudience] = useState(
    language === 'vi' ? 'Mọi lứa tuổi, độc giả yêu sách' : 'General public, book lovers'
  );
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [thumbnail, setThumbnail] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useModalBehavior(isOpen, onClose, isSubmitting);

  React.useEffect(() => {
    if (!isOpen) return;
    const date = initialDate && initialDate >= firstRegistrationDate() ? initialDate.split('-').reverse().join('/') : '';
    setDateStr(date);
    setEndDateStr(date);
    setTargetAudience(prev => prev.trim() ? prev : (language === 'vi' ? 'Mọi lứa tuổi, độc giả yêu sách' : 'General public, book lovers'));
    setError(null);
  }, [isOpen, initialDate, language]);

  if (!isOpen) return null;
  const minRegistrationDate = firstRegistrationDate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isReadingImage) return;
    if (!title.trim() || title.trim().length > 200) {
      setError(
        language === 'vi' 
          ? (isActivityMode ? 'Vui lòng nhập tên hoạt động' : 'Vui lòng nhập tên sự kiện') 
          : (isActivityMode ? 'Please enter activity title' : 'Please enter event title')
      );
      return;
    }
    const startDate = activityDateKey(dateStr);
    const endDate = activityDateKey(endDateStr);
    if (!startDate || !endDate) {
      setError(language === 'vi' ? 'Ngày bắt đầu và kết thúc phải hợp lệ, theo định dạng dd/mm/yyyy.' : 'Enter valid start and end dates in dd/mm/yyyy format.');
      return;
    }
    if (!location || !locations.some(item => item.id === location)) {
      setError(language === 'vi' ? 'Vui lòng chọn địa điểm tổ chức hợp lệ' : 'Please select a valid location');
      return;
    }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1 || Number(capacity) > 2147483647) {
      setError(language === 'vi' ? 'Sức chứa phải là số nguyên dương' : 'Capacity must be a positive integer');
      return;
    }

    const finalTargetAudience = targetAudience.trim() || (language === 'vi' ? 'Mọi lứa tuổi, độc giả yêu sách' : 'General public, book lovers');
    if (!finalTargetAudience) {
      setError(language === 'vi' ? 'Vui lòng nhập đối tượng tham gia' : 'Please enter target audience');
      return;
    }

    if (startDate < firstRegistrationDate() || endDate < firstRegistrationDate()) {
      setError(language === 'vi' ? 'Ngày bắt đầu và ngày kết thúc phải từ ngày mai trở đi.' : 'Start and end dates must be tomorrow or later.');
      return;
    }

    const startAt = `${startDate}T${startTime}:00+07:00`;
    const endAt = `${endDate}T${endTime}:00+07:00`;
    if (!startTime || !endTime || new Date(endAt) <= new Date(startAt)) {
      setError(language === 'vi' ? 'Ngày giờ kết thúc phải sau ngày giờ bắt đầu.' : 'End date and time must be after the start.');
      return;
    }

    if (organization && !agreedTerms) {
      setError(
        language === 'vi' 
          ? (isActivityMode ? 'Vui lòng xác nhận tuân thủ quy chế tổ chức hoạt động.' : 'Vui lòng xác nhận tuân thủ quy chế tổ chức sự kiện.')
          : (isActivityMode ? 'Please agree to the activity registration terms.' : 'Please agree to the event registration terms.')
      );
      return;
    }
    const newActivity: EventRegistrationData = {
      id: '',
      title: title.trim(),
      type,
      dateStr: dateStr.trim(),
      startAt,
      endAt,
      timeStr: `${startTime} – ${endTime}`,
      location: location.trim(),
      capacity: Number(capacity),
      registeredCount: 0,
      attendedCount: 0,
      partnerName: partnerName.trim(),
      speaker: speaker.trim(),
      status: 'approved',
      statusLabelVi: 'Đã duyệt',
      isPublished,
      thumbnail,
      targetAudience: finalTargetAudience,
      description: description.trim(),
      devices: selectedEquipment.map(name => ({ name, quantity: 1 })),
      eventId: selectedEventId || undefined,
    };

    setIsSubmitting(true);
    try {
      await onRegister(newActivity);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (isActivityMode ? 'Không thể đăng ký hoạt động' : 'Không thể đăng ký sự kiện'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="org-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => { if (!isSubmitting) onClose(); }}>
      <div
        className="org-modal-box"
        style={{
          maxWidth: '720px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2EAE5',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="org-modal-header" style={{ padding: '1.25rem 1.75rem', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#17382E', fontFamily: 'var(--font-serif, serif)' }}>
              {titleOverride || (language === 'vi' ? (organization ? 'Đăng ký sự kiện mới' : 'Tạo sự kiện mới') : (organization ? 'Register New Event' : 'Create New Event'))}
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#556B65', margin: '4px 0 0 0' }}>
              {subtitleOverride || (language === 'vi'
                ? 'Thiết lập thông tin sự kiện, diễn giả, thời gian và số người tham gia'
                : 'Configure event details, speaker, schedule and attendance')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F3F4F6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280',
              transition: 'all 0.15s ease'
            }}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} data-event-registration-form>
          <div className="org-modal-body" style={{ padding: '1.5rem 1.75rem', maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#DC2626',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {/* 1. Event / Activity Title */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                {language === 'vi' ? (isActivityMode ? 'Tên hoạt động *' : 'Tên sự kiện *') : (isActivityMode ? 'Activity Title *' : 'Event Title *')}
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Ví dụ: Giao lưu tác giả & Ký tặng sách mới' : 'e.g. Author Meet & Greet'}
                maxLength={200}
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '0.9rem',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Associated Event Selection for Activity */}
            {isActivityMode && events && events.length > 0 && (
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Calendar size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Thuộc sự kiện (Sự kiện bạn tham gia)' : 'Associated Event'}</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => {
                    const evtId = e.target.value;
                    setSelectedEventId(evtId);
                    const found = events.find(ev => ev.id === evtId);
                    if (found?.startDate) {
                      const d = found.startDate.split('-').reverse().join('/');
                      setDateStr(d);
                      if (found.endDate) {
                        setEndDateStr(found.endDate.split('-').reverse().join('/'));
                      } else {
                        setEndDateStr(d);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.88rem',
                    color: '#111827',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">
                    {language === 'vi' ? '— Hoạt động độc lập (Không thuộc sự kiện nào) —' : '— Independent activity (No parent event) —'}
                  </option>
                  {events.map(evt => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} {evt.startDate ? `(${evt.startDate.split('-').reverse().join('/')}${evt.endDate ? ` – ${evt.endDate.split('-').reverse().join('/')}` : ''})` : ''}
                    </option>
                  ))}
                </select>
                {selectedEventId && (() => {
                  const found = events.find(ev => ev.id === selectedEventId);
                  if (!found) return null;
                  return (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.4rem 0.65rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>ℹ️</span>
                      <span>
                        {language === 'vi'
                          ? `Sự kiện diễn ra từ ${found.startDate?.split('-').reverse().join('/') || '...'} đến ${found.endDate?.split('-').reverse().join('/') || '...'}. Hoạt động cần diễn ra trong khung thời gian này.`
                          : `Event runs from ${found.startDate} to ${found.endDate}. Activity must be scheduled within this period.`}
                      </span>
                    </p>
                  );
                })()}
              </div>
            )}

            {/* 2. Grid 2x2: Type & Associated Event */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Tag size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Thể loại' : 'Type'}</span>
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.88rem',
                    color: '#111827',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="talkshow">{language === 'vi' ? 'Talkshow & Giao lưu' : 'Talkshow & Panel'}</option>
                  <option value="workshop">{language === 'vi' ? 'Workshop & Thực hành' : 'Workshop & Hands-on'}</option>
                  <option value="launch">{language === 'vi' ? 'Ra mắt sách mới' : 'Book Launch'}</option>
                  <option value="exhibition">{language === 'vi' ? 'Triển lãm' : 'Exhibition'}</option>
                  <option value="minigame">{language === 'vi' ? 'Mini Game & Quà tặng' : 'Mini Game & Quiz'}</option>
                  <option value="signing">{language === 'vi' ? 'Ký tặng sách' : 'Book Signing'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Building2 size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Đơn vị tổ chức / Đối tác' : 'Partner / Organizer'}</span>
                </label>
                <input maxLength={200}
                  type="text"
                  placeholder={language === 'vi' ? 'Ví dụ: NXB Trẻ, Nhã Nam...' : 'e.g. Tre Publishing, Nha Nam...'}
                  value={organization?.name || partnerName}
                  readOnly={Boolean(organization)}
                  onChange={e => setPartnerName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.9rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 3. Grid 2x2: Speaker & Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Mic size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Diễn giả / Khách mời' : 'Speaker / Host'}</span>
                </label>
                <input maxLength={200}
                  type="text"
                  placeholder={language === 'vi' ? 'Ví dụ: Nhà văn Nguyễn Nhật Ánh' : 'e.g. Author Nguyen Nhat Anh'}
                  value={speaker}
                  onChange={e => setSpeaker(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.9rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Users size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Số người tham dự dự kiến' : 'Expected attendees'}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="2147483647"
                  required

                  step="1"
                  value={capacity}
                  onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.9rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Target Audience */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                <Users size={14} color="#17382E" />
                <span>{language === 'vi' ? 'Đối tượng tham gia *' : 'Target Audience *'}</span>
              </label>
              <input maxLength={2000}
                type="text"
                required
                placeholder={language === 'vi' ? 'Ví dụ: Độc giả trẻ, học sinh, sinh viên, đại chúng...' : 'e.g. Young readers, students, general public...'}
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '0.9rem',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 4. Schedule Card: Date & Time */}
            <div style={{
              background: '#F8FAF9',
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              border: '1px solid #E2EAE5',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#17382E', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} />
                <span>{language === 'vi' ? (isActivityMode ? 'THỜI GIAN & ĐỊA ĐIỂM TỔ CHỨC HOẠT ĐỘNG' : 'THỜI GIAN & ĐỊA ĐIỂM TỔ CHỨC') : (isActivityMode ? 'ACTIVITY SCHEDULE & LOCATION' : 'SCHEDULE & LOCATION')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {language === 'vi' ? (isActivityMode ? 'Ngày bắt đầu hoạt động *' : 'Ngày bắt đầu *') : (isActivityMode ? 'Activity start date *' : 'Start date *')}
                  </label>
                  <DatePicker
                    label={language === 'vi' ? 'Ngày bắt đầu' : 'Start date'}
                    value={dateStr}
                    onChange={val => {
                      setDateStr(val);
                      if (isActivityMode && (!endDateStr || endDateStr === dateStr)) {
                        setEndDateStr(val);
                      }
                    }}
                    language={language}
                    min={minRegistrationDate}
                    align="left"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {language === 'vi' ? (isActivityMode ? 'Ngày kết thúc hoạt động *' : 'Ngày kết thúc *') : (isActivityMode ? 'Activity end date *' : 'End date *')}
                  </label>
                  <DatePicker label={language === 'vi' ? 'Ngày kết thúc' : 'End date'} value={endDateStr} onChange={setEndDateStr} language={language} min={(activityDateKey(dateStr) || '') > minRegistrationDate ? activityDateKey(dateStr)! : minRegistrationDate} align="right" />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Clock size={12} />
                    <span>{language === 'vi' ? 'Giờ bắt đầu' : 'Start time'}</span>
                  </label>
                  <input
                    type="time"
                    aria-label={language === 'vi' ? 'Giờ bắt đầu' : 'Start time'}
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Clock size={12} />
                    <span>{language === 'vi' ? 'Giờ kết thúc' : 'End time'}</span>
                  </label>
                  <input
                    type="time"
                    aria-label={language === 'vi' ? 'Giờ kết thúc' : 'End time'}
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <MapPin size={12} />
                  <span>{language === 'vi' ? 'Địa điểm cụ thể tại Đường Sách' : 'Specific Location'}</span>
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                >
                  <option value="">{language === 'vi' ? 'Chọn địa điểm tổ chức' : 'Select a location'}</option>
                  {locations.map(item => <option key={item.id} value={item.id}>{item.name} · {item.capacity} người</option>)}
                </select>
              </div>
            </div>

            {/* 5. Image & Thumbnail Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', margin: 0 }}>
                  {language === 'vi' ? (isActivityMode ? 'Hình ảnh đại diện hoạt động' : 'Hình ảnh đại diện sự kiện') : (isActivityMode ? 'Activity Image' : 'Event Image')}
                </label>
                <label
                  className="btn-org-secondary"
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    color: '#17382E',
                    fontWeight: 650
                  }}
                  title={language === 'vi' ? 'Tải ảnh từ máy tính' : 'Upload from device'}
                >
                  <Upload size={12} />
                  <span>{language === 'vi' ? 'Tải ảnh lên' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSubmitting || isReadingImage}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) {
                        const error = imageFileError(file, MAX_EVENT_IMAGE_MB);
                        if (error) { setError(error); e.target.value = ''; return; }
                        setError(null);
                        setIsReadingImage(true);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (typeof evt.target?.result === 'string') {
                            setThumbnail(evt.target.result);
                          }
                          setIsReadingImage(false);
                        };
                        reader.onerror = () => {
                          setIsReadingImage(false);
                          setError(language === 'vi' ? 'Không thể đọc ảnh. Vui lòng chọn lại tệp.' : 'Unable to read image. Please select it again.');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <small>{language === 'vi' ? `Ảnh tối đa ${MAX_EVENT_IMAGE_MB} MB` : `Images up to ${MAX_EVENT_IMAGE_MB} MB`}</small>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input maxLength={10000000}
                  type="text"
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  placeholder="https://... hoặc dán liên kết ảnh"
                  style={{
                    flex: 1,
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    fontSize: '0.82rem',
                    color: '#1F2937',
                    boxSizing: 'border-box'
                  }}
                />
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    style={{ width: 44, height: 38, borderRadius: '6px', objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0 }}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
              </div>
            </div>

            {/* 6. Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                {language === 'vi' ? 'Nội dung tóm tắt & Giới thiệu' : 'Description & Highlights'}
              </label>
              <textarea maxLength={20000}
                rows={3}
                placeholder={language === 'vi' ? 'Mô tả ngắn về chủ đề buổi giao lưu, các phần quà tặng, hoạt động tương tác...' : 'Brief summary of the activity highlights, guest speaker bio...'}
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {organization && <>
              <fieldset style={{ marginBottom: '1rem', border: '1px solid #E2EAE5', borderRadius: '8px', padding: '1rem' }}>
                <legend>{language === 'vi' ? 'Thiết bị hỗ trợ' : 'Equipment'}</legend>
                {assets.map(asset => <label key={asset.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input type="checkbox" checked={selectedEquipment.includes(asset.name)} onChange={() => setSelectedEquipment(previous => previous.includes(asset.name) ? previous.filter(name => name !== asset.name) : [...previous, asset.name])} />{' '}
                  {asset.name}
                </label>)}
                {assets.length === 0 && <small>{language === 'vi' ? 'Chưa có thiết bị khả dụng.' : 'No equipment available.'}</small>}
              </fieldset>
              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <input type="checkbox" required checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} />{' '}
                {language === 'vi' ? 'Tôi cam kết tuân thủ quy chế tổ chức hoạt động tại Đường Sách.' : 'I agree to the activity registration terms.'}
              </label>
            </>}
            {/* 7. Public status toggle */}
            {!organization && <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                id="act-published"
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: '#17382E', cursor: 'pointer' }}
              />
              <label htmlFor="act-published" style={{ fontSize: '0.86rem', color: '#1F2937', fontWeight: 500, cursor: 'pointer' }}>
                {language === 'vi' ? 'Công bố sự kiện ngay trên lịch trình công khai' : 'Publish immediately to public event schedule'}
              </label>
            </div>}
          </div>

          {/* Modal Footer */}
          <div className="org-modal-footer" style={{ padding: '1rem 1.75rem', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-org-secondary"
              onClick={onClose}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
            >
              {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isReadingImage}
              className="btn-org-primary"
              style={{
                padding: '0.5rem 1.4rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#17382E',
                boxShadow: '0 4px 12px rgba(23, 56, 46, 0.2)'
              }}
            >
              <span>{isSubmitting ? (language === 'vi' ? 'Đang gửi…' : 'Submitting…') : (submitLabel || (language === 'vi' ? (organization ? 'Đăng ký sự kiện' : 'Tạo sự kiện') : (organization ? 'Register Event' : 'Create Event')))}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
