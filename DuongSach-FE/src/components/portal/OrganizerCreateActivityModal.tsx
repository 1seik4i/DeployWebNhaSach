import { useModalBehavior } from '../../hooks/useModalBehavior';
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
import { Language } from '../../types';
import { OrganizerActivityItem, OrganizerEvent } from '../../types/organizer';

interface OrganizerCreateActivityModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  events?: OrganizerEvent[];
  locations?: Array<{ id: string; name: string; capacity: number }>;
  onCreateActivity: (newActivity: OrganizerActivityItem) => void | Promise<void>;
}

export const OrganizerCreateActivityModal: React.FC<OrganizerCreateActivityModalProps> = ({
  language,
  isOpen,
  onClose,
  events = [],
  locations = [],
  onCreateActivity
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('talkshow');
  const [partnerName, setPartnerName] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [thumbnail, setThumbnail] = useState('');

  const [error, setError] = useState<string | null>(null);

  useModalBehavior(isOpen, onClose);

  React.useEffect(() => {
    if (!events.some(event => event.id === eventId)) setEventId(events[0]?.id || '');
  }, [events, eventId]);

  if (!isOpen) return null;

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(language === 'vi' ? 'Vui lòng nhập tên hoạt động' : 'Please enter activity title');
      return;
    }
    if (!dateStr) {
      setError(language === 'vi' ? 'Vui lòng chọn ngày diễn ra' : 'Please select activity date');
      return;
    }
    if (dateStr < todayKey) {
      setError(language === 'vi' ? 'Không thể tạo hoạt động vào ngày đã diễn ra' : 'Cannot create activity on a past date');
      return;
    }

    // Format dateStr to DD/MM/YYYY if provided in YYYY-MM-DD
    let formattedDate = dateStr;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const newActivity: OrganizerActivityItem = {
      id: '',
      eventId,
      title: title.trim(),
      type,
      dateStr: formattedDate,
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
      description: description.trim()
    };

    try {
      await onCreateActivity(newActivity);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo hoạt động');
    }
  };

  return (
    <div className="org-modal-backdrop" onClick={onClose}>
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
              {language === 'vi' ? 'Đăng ký hoạt động mới' : 'Create New Activity'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#556B65', margin: '4px 0 0 0' }}>
              {language === 'vi' 
                ? 'Thiết lập thông tin hoạt động, diễn giả, thời gian và sức chứa tham gia' 
                : 'Configure activity details, speaker, schedule and capacity'}
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
        <form onSubmit={handleSubmit}>
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

            {/* 1. Activity Title */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                {language === 'vi' ? 'Tên hoạt động / Sự kiện *' : 'Activity Title *'}
              </label>
              <input 
                type="text"
                placeholder={language === 'vi' ? 'Ví dụ: Giao lưu tác giả & Ký tặng sách mới' : 'e.g. Author Meet & Greet'}
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

            {/* 2. Grid 2x2: Type & Associated Event */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Tag size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Thể loại hoạt động' : 'Activity Type'}</span>
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
                  <option value="minigame">{language === 'vi' ? 'Mini Game & Quà tặng' : 'Mini Game & Quiz'}</option>
                  <option value="signing">{language === 'vi' ? 'Ký tặng sách' : 'Book Signing'}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', marginBottom: '0.4rem' }}>
                  <Building2 size={14} color="#17382E" />
                  <span>{language === 'vi' ? 'Đơn vị tổ chức / Đối tác' : 'Partner / Organizer'}</span>
                </label>
                <input 
                  type="text"
                  placeholder={language === 'vi' ? 'Ví dụ: NXB Trẻ, Nhã Nam...' : 'e.g. Tre Publishing, Nha Nam...'}
                  value={partnerName}
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
                <input 
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
                <span>{language === 'vi' ? 'THỜI GIAN & ĐỊA ĐIỂM TỔ CHỨC' : 'SCHEDULE & LOCATION'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {language === 'vi' ? 'Ngày diễn ra *' : 'Date *'}
                  </label>
                  <input 
                    type="date"
                    value={dateStr}
                    min={todayKey}
                    onChange={e => setDateStr(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 0.65rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Clock size={12} />
                    <span>{language === 'vi' ? 'Bắt đầu' : 'Start'}</span>
                  </label>
                  <input 
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.76rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Clock size={12} />
                    <span>{language === 'vi' ? 'Kết thúc' : 'End'}</span>
                  </label>
                  <input 
                    type="time"
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
                  <option value="">{language === 'vi' ? 'Chọn địa điểm thuộc sự kiện' : 'Select an event location'}</option>
                  {locations.map(item => <option key={item.id} value={item.id}>{item.name} · {item.capacity} người</option>)}
                </select>
              </div>
            </div>

            {/* 5. Image & Thumbnail Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 650, color: '#1F2937', margin: 0 }}>
                  {language === 'vi' ? 'Hình ảnh đại diện hoạt động' : 'Activity Thumbnail'}
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
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (typeof evt.target?.result === 'string') {
                            setThumbnail(evt.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
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
              <textarea 
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

            {/* 7. Public status toggle */}
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input 
                id="act-published"
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                style={{ width: '17px', height: '17px', accentColor: '#17382E', cursor: 'pointer' }}
              />
              <label htmlFor="act-published" style={{ fontSize: '0.86rem', color: '#1F2937', fontWeight: 500, cursor: 'pointer' }}>
                {language === 'vi' ? 'Công bố hoạt động ngay trên lịch trình công khai (Landing Page)' : 'Publish immediately to public event schedule'}
              </label>
            </div>
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
              <span>{language === 'vi' ? 'Tạo hoạt động' : 'Create Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
