import { useUrlTab } from '../../hooks/useUrlTab';
import { promptModal, notifyModal } from '../../services/notificationModal';
import { documentFileError } from '../../utils/fileValidation';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit3, 
  RefreshCw, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  Layers,
  Sparkles,
  Info,
  Plus,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Download
} from 'lucide-react';
import { 
  Language, 
  PartnerActivityProposal, 
  PartnerActivityScheduleItem, 
  PartnerActivityDocumentItem 
} from '../../types';
import { partnerApi } from '../../services/partnerApi';
import './PartnerPages.css';

interface PartnerActivityDetailPageProps {
  language: Language;
  activities: PartnerActivityProposal[];
  onOpenAttendanceModal?: (activityId: string) => void;
  onUpdateActivity?: (id: string, updated: Partial<PartnerActivityProposal>) => Promise<void>;
}

export const PartnerActivityDetailPage: React.FC<PartnerActivityDetailPageProps> = ({
  language,
  activities,
  onUpdateActivity,
}) => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useUrlTab(['info', 'schedule', 'registration', 'documents'], 'info');
  const [isEditing, setIsEditing] = useState(false);

  const activity = activities.find(a => a.id === activityId) || activities[0];

  // Edit general info state
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [capacity, setCapacity] = useState(activity?.capacity || 1);
  const [speaker, setSpeaker] = useState(activity?.speaker || '');
  const [targetAudience, setTargetAudience] = useState(activity?.targetAudience || '');
  const [participants, setParticipants] = useState<Array<{ id: string; fullName: string; phone: string; ticketCode: string; status: string; attendeesCount?: number }>>([]);
  const participantCount = participants.reduce((sum, row) => sum + (row.attendeesCount || 1), 0);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantError, setParticipantError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Schedule state
  const [scheduleItems, setScheduleItems] = useState<PartnerActivityScheduleItem[]>([]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    time: '',
    title: '',
    description: '',
    speaker: ''
  });

  // Documents state
  const [documents, setDocuments] = useState<PartnerActivityDocumentItem[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (!activity) return;
    setTitle(activity.title);
    setDescription(activity.description);
    setCapacity(activity.capacity);
    setSpeaker(activity.speaker || '');
    setTargetAudience(activity.targetAudience || '');

    if (activity.schedule && activity.schedule.length > 0) {
      setScheduleItems(activity.schedule);
    } else {
      setScheduleItems([
        {
          id: '1',
          time: activity.time || '09:00 – 10:30',
          title: activity.title,
          description: activity.description || 'Chương trình diễn ra chính thức tại sự kiện',
          speaker: activity.speaker || ''
        }
      ]);
    }

    if (activity.documents && activity.documents.length > 0) {
      setDocuments(activity.documents);
    } else {
      setDocuments([]);
    }

    partnerApi.getActivityParticipants(activity.id)
      .then(items => { 
        setParticipants(items); 
        setParticipantError(''); 
      })
      .catch(error => setParticipantError(error instanceof Error ? error.message : 'Không thể tải danh sách người tham gia'));
  }, [activity]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { 
          title, 
          description, 
          capacity,
          speaker,
          targetAudience
        });
        setSaveError('');
        showToast(language === 'vi' ? 'Đã lưu thông tin hoạt động thành công!' : 'Activity updated successfully!');
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Không thể cập nhật hoạt động');
        return;
      }
    }
    setIsEditing(false);
  };

  // Schedule CRUD Handlers
  const handleStartAddSchedule = () => {
    setEditingScheduleId(null);
    setScheduleForm({
      time: activity?.time || '09:00 – 10:00',
      title: '',
      description: '',
      speaker: ''
    });
    setIsAddingSchedule(true);
  };

  const handleStartEditSchedule = (item: PartnerActivityScheduleItem) => {
    setIsAddingSchedule(false);
    setEditingScheduleId(item.id);
    setScheduleForm({
      time: item.time,
      title: item.title,
      description: item.description || '',
      speaker: item.speaker || ''
    });
  };

  const handleSaveScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title.trim()) return;
    let next: PartnerActivityScheduleItem[];
    if (editingScheduleId) {
      next = scheduleItems.map(item => item.id === editingScheduleId ? {
        ...item,
        time: scheduleForm.time.trim() || item.time,
        title: scheduleForm.title.trim(),
        description: scheduleForm.description.trim(),
        speaker: scheduleForm.speaker.trim()
      } : item);
    } else {
      next = [
        ...scheduleItems,
        {
          id: crypto.randomUUID(),
          time: scheduleForm.time.trim() || '09:00 – 10:00',
          title: scheduleForm.title.trim(),
          description: scheduleForm.description.trim(),
          speaker: scheduleForm.speaker.trim()
        }
      ];
    }
    setScheduleItems(next);
    setIsAddingSchedule(false);
    setEditingScheduleId(null);
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { schedule: next });
        showToast(language === 'vi' ? 'Đã lưu lịch trình thành công!' : 'Schedule updated successfully!');
      } catch (err) {
        setScheduleItems(scheduleItems);
        showToast(err instanceof Error ? err.message : 'Lỗi lưu lịch trình');
      }
    }
  };

  const handleDeleteScheduleItem = async (id: string) => {
    const next = scheduleItems.filter(item => item.id !== id);
    setScheduleItems(next);
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { schedule: next });
        showToast(language === 'vi' ? 'Đã xóa mốc lịch trình!' : 'Schedule milestone removed!');
      } catch (err) {
        setScheduleItems(scheduleItems);
        showToast(err instanceof Error ? err.message : 'Lỗi xóa mốc lịch trình');
      }
    }
  };

  // Documents CRUD Handlers
  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (documents.length + files.length > 100) { showToast('Tối đa 100 tài liệu cho mỗi hoạt động.'); e.target.value = ''; return; }
    const error = Array.from(files).map(file => documentFileError(file)).find(Boolean);
    if (error) { showToast(error); e.target.value = ''; return; }
    const additions = await Promise.all(Array.from(files).map((file, idx) => new Promise<PartnerActivityDocumentItem>((resolve, reject) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = parseFloat(sizeMB) >= 0.1 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = (evt) => {
        resolve({
          id: `${crypto.randomUUID()}-${idx}`,
          name: file.name,
          size: sizeStr,
          url: String(evt.target?.result || ''),
          uploadedAt: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    const next = [...documents, ...additions];
    setDocuments(next);
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { documents: next });
        showToast(language === 'vi' ? `Đã tải lên ${files.length} tài liệu!` : `Uploaded ${files.length} files!`);
      } catch (err) {
        setDocuments(documents);
        showToast(err instanceof Error ? err.message : 'Lỗi tải lên tài liệu');
      }
    }
    e.target.value = '';
  };

  const handleAddDocManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !/^https?:\/\//i.test(newDocUrl.trim())) return;
    const name = newDocName.trim();
    const next = [
      ...documents,
      {
        id: crypto.randomUUID(),
        name,
        size: 'Liên kết',
        url: newDocUrl.trim(),
        uploadedAt: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      }
    ];
    setDocuments(next);
    setNewDocName('');
    setNewDocUrl('');
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { documents: next });
        showToast(language === 'vi' ? 'Đã thêm tài liệu mới!' : 'Document added!');
      } catch (err) {
        setDocuments(documents);
        showToast(err instanceof Error ? err.message : 'Lỗi thêm tài liệu');
      }
    }
  };

  const handleDeleteDoc = async (id: string) => {
    const next = documents.filter(d => d.id !== id);
    setDocuments(next);
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { documents: next });
        showToast(language === 'vi' ? 'Đã xóa tài liệu!' : 'Document deleted!');
      } catch (err) {
        setDocuments(documents);
        showToast(err instanceof Error ? err.message : 'Lỗi xóa tài liệu');
      }
    }
  };

  const handleSaveDocRename = async (id: string) => {
    if (!editingDocName.trim()) return;
    const next = documents.map(d => d.id === id ? { ...d, name: editingDocName.trim() } : d);
    setDocuments(next);
    setEditingDocId(null);
    if (onUpdateActivity) {
      try {
        await onUpdateActivity(activity.id, { documents: next });
        showToast(language === 'vi' ? 'Đã đổi tên tài liệu!' : 'Document renamed!');
      } catch (err) {
        setDocuments(documents);
        showToast(err instanceof Error ? err.message : 'Lỗi đổi tên tài liệu');
      }
    }
  };

  const requestChange = async () => {
    if (!activity) return;
    const reason = await promptModal(language === 'vi' ? 'Nhập nội dung cần thay đổi (ít nhất 10 ký tự):' : 'Describe the requested change (at least 10 characters):');
    if (!reason) return;
    try { 
      await partnerApi.requestActivityChange(activity.id, reason); 
      void notifyModal(language === 'vi' ? 'Đã gửi yêu cầu thay đổi đến Ban Quản Lý.' : 'Change request submitted.'); 
    } catch (error) { 
      void notifyModal(error instanceof Error ? error.message : 'Không thể gửi yêu cầu'); 
    }
  };

  const requestCancellation = async () => {
    if (!activity) return;
    const reason = await promptModal(language === 'vi' ? 'Nhập lý do hủy (ít nhất 10 ký tự):' : 'Enter cancellation reason (at least 10 characters):');
    if (!reason) return;
    try { 
      await partnerApi.requestActivityCancellation(activity.id, reason); 
      void notifyModal(language === 'vi' ? 'Đã gửi yêu cầu hủy đến Ban Quản Lý.' : 'Cancellation request submitted.'); 
    } catch (error) { 
      void notifyModal(error instanceof Error ? error.message : 'Không thể gửi yêu cầu'); 
    }
  };

  if (!activity) return <div className="partner-activity-detail-page"><p className="app-loading-state">Không tìm thấy hoạt động.</p></div>;

  const filteredParticipants = participants.filter(p => 
    p.fullName.toLowerCase().includes(participantSearch.toLowerCase()) ||
    (p.phone && p.phone.includes(participantSearch)) ||
    p.ticketCode.toLowerCase().includes(participantSearch.toLowerCase())
  );

  return (
    <div className="partner-activity-detail-page">
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#17382E',
          color: '#FFFFFF',
          padding: '0.85rem 1.35rem',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          zIndex: 99999,
          fontSize: '0.92rem',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          border: '1.5px solid #E9BC63',
        }}>
          <CheckCircle2 size={18} color="#E9BC63" />
          <span>{toastMsg}</span>
        </div>
      )}

      {(participantError || saveError) && <p className="app-error-state">{participantError || saveError}</p>}
      
      {/* 1. Back button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn-part-secondary"
          onClick={() => navigate('/partner/activities')}
          style={{ padding: '0.35rem 0.85rem', height: '34px', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>{language === 'vi' ? 'Quay lại danh sách hoạt động' : 'Back to Activities'}</span>
        </button>
      </div>

      {/* 2. Detail Header matching Sketch Screen 6 */}
      <div className="partner-card-pad" style={{
        background: '#FFFFFF',
        border: '1px solid #E2EAE5',
        borderRadius: '14px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 className="partner-page-title">
                {activity.title}
              </h1>
              <span className={`status-badge ${activity.status}`}>
                {activity.status === 'approved' && '✓ Đã duyệt'}
                {activity.status === 'pending' && '⏳ Chờ duyệt'}
                {activity.status === 'need_changes' && '⚠️ Cần chỉnh sửa'}
                {activity.status === 'rejected' && '✕ Từ chối'}
                {activity.status === 'withdrawn' && '✕ Đã hủy'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#556B65' }}>
              <span>{activity.eventName}</span> • <span>{activity.category}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={isEditing ? 'btn-part-secondary' : 'btn-part-primary'}
              onClick={() => {
                setActiveTab('info');
                setIsEditing(!isEditing);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.15rem', borderRadius: '8px', fontWeight: 650 }}
            >
              <Edit3 size={16} />
              <span>{isEditing ? (language === 'vi' ? 'Đóng chỉnh sửa' : 'Close Edit') : (language === 'vi' ? 'Chỉnh sửa' : 'Edit')}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="partner-tabs-bar" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'info' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            {language === 'vi' ? 'Thông tin chung' : 'General Info'}
          </button>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'schedule' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            {language === 'vi' ? `Lịch trình (${scheduleItems.length})` : `Schedule (${scheduleItems.length})`}
          </button>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'registration' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            {language === 'vi' ? `Đăng ký (${participantCount})` : `Registration (${participantCount})`}
          </button>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'documents' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            {language === 'vi' ? `Tài liệu (${documents.length})` : `Materials (${documents.length})`}
          </button>
        </div>
      </div>

      {/* 3. Detail Content Body */}
      <div className="partner-card-pad" style={{ background: '#FFFFFF', border: '1px solid #E2EAE5', borderRadius: '14px' }}>
        {isEditing ? (
          <form onSubmit={handleSaveEdit} style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {language === 'vi' ? 'Chỉnh sửa thông tin hoạt động' : 'Edit Activity Information'}
            </h3>
            {saveError && (
              <div style={{ padding: '0.65rem 1rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {saveError}
              </div>
            )}
            <div className="form-field-group">
              <label>{language === 'vi' ? 'Tên hoạt động' : 'Title'}</label>
              <input maxLength={200}
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div className="form-field-group">
                <label>{language === 'vi' ? 'Diễn giả / Khách mời' : 'Speaker / Host'}</label>
                <input maxLength={200}
                  type="text" 
                  value={speaker} 
                  onChange={(e) => setSpeaker(e.target.value)} 
                  placeholder={language === 'vi' ? 'Tên diễn giả, chuyên gia...' : 'Speaker name'}
                />
              </div>
              <div className="form-field-group">
                <label>{language === 'vi' ? 'Đối tượng tham gia' : 'Target Audience'}</label>
                <input maxLength={2000}
                  type="text" 
                  value={targetAudience} 
                  onChange={(e) => setTargetAudience(e.target.value)} 
                  placeholder={language === 'vi' ? 'Ví dụ: Độc giả trẻ, Học sinh...' : 'e.g. Young readers'}
                />
              </div>
            </div>
            <div className="form-field-group">
              <label>{language === 'vi' ? 'Số người tham dự dự kiến' : 'Expected attendees'}</label>
              <input step={1} max={2147483647}
                type="number" 
                min={1}
                value={capacity} 
                onChange={(e) => setCapacity(Number(e.target.value))} 
                required
              />
            </div>
            <div className="form-field-group">
              <label>{language === 'vi' ? 'Mô tả nội dung' : 'Description'}</label>
              <textarea maxLength={20000}
                rows={4} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn-part-secondary" onClick={() => setIsEditing(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button type="submit" className="btn-part-primary">
                {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* TAB 1: THÔNG TIN CHUNG */}
            {activeTab === 'info' && (
              <div>
                <img 
                  src={activity.imageUrl} 
                  alt={activity.title} 
                  className="activity-detail-banner-img"
                />

                {/* Key Specs Grid */}
                <div className="specs-grid-pill">
                  <div className="spec-item">
                    <span className="label">📅 {language === 'vi' ? 'Ngày diễn ra' : 'Date'}</span>
                    <span className="value">{activity.date}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">⏰ {language === 'vi' ? 'Thời gian' : 'Time'}</span>
                    <span className="value">{activity.time}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">📍 {language === 'vi' ? 'Địa điểm' : 'Location'}</span>
                    <span className="value">{activity.location}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">👥 {language === 'vi' ? 'Số người dự kiến' : 'Expected attendees'}</span>
                    <span className="value">{capacity} {language === 'vi' ? 'người' : 'seats'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">🎯 {language === 'vi' ? 'Đối tượng tham gia' : 'Audience'}</span>
                    <span className="value">{activity.targetAudience}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">🎟️ {language === 'vi' ? 'Đã đăng ký' : 'Registered'}</span>
                    <span className="value" style={{ fontWeight: 750, color: '#17382E' }}>
                      {participantCount}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172421', marginBottom: '0.5rem' }}>
                  {language === 'vi' ? 'Mô tả' : 'Description'}
                </h3>
                <p style={{ color: '#495D57', lineHeight: 1.65, fontSize: '0.92rem', marginBottom: '1.75rem', maxWidth: '850px' }}>
                  {activity.description}
                </p>

                {/* Equipment needs */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172421', marginBottom: '0.65rem' }}>
                  {language === 'vi' ? 'Yêu cầu thiết bị (nếu có)' : 'Equipment & Support Needs'}
                </h3>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {activity.requiredEquipments.map((eq, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#F3F7F5',
                        border: '1px solid #D1DDD8',
                        color: '#17382E',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px'
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>

                {/* Bottom Actions Row - Phân luồng logic chuẩn xác theo trạng thái đề xuất */}
                <div style={{ borderTop: '1px solid #EEF2F0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  {activity.status === 'approved' && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.75rem 1rem',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        color: '#166534',
                        fontSize: '0.86rem',
                        marginBottom: '1rem'
                      }}>
                        <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                        <span>
                          {language === 'vi' 
                            ? 'Hoạt động đã được Ban Quản Lý duyệt chính thức. Nếu cần điều chỉnh thời gian, địa điểm, quy mô hoặc hủy tổ chức, vui lòng gửi yêu cầu để được phê duyệt.'
                            : 'This activity is officially approved. To change date, venue, or cancel, please submit a request for management approval.'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-part-primary"
                          onClick={() => {
                            setActiveTab('info');
                            setIsEditing(true);
                          }}
                        >
                          <Edit3 size={15} />
                          <span>{language === 'vi' ? 'Chỉnh sửa thông tin' : 'Edit Information'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-part-secondary"
                          onClick={() => void requestChange()}
                        >
                          <RefreshCw size={15} />
                          <span>{language === 'vi' ? 'Yêu cầu thay đổi' : 'Request Change'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-part-danger"
                          onClick={() => void requestCancellation()}
                        >
                          <XCircle size={15} />
                          <span>{language === 'vi' ? 'Yêu cầu hủy hoạt động' : 'Request Cancellation'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {(activity.status === 'pending' || activity.status === 'need_changes') && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.75rem 1rem',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        color: '#92400E',
                        fontSize: '0.86rem',
                        marginBottom: '1rem'
                      }}>
                        <Info size={16} style={{ flexShrink: 0 }} />
                        <span>
                          {language === 'vi'
                            ? 'Đề xuất đang trong quá trình xét duyệt. Bạn có thể chỉnh sửa nội dung hoặc rút lại đề xuất trước khi Ban Quản Lý phê duyệt.'
                            : 'Proposal is under review. You can edit content directly or withdraw before approval.'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-part-primary"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 size={15} />
                          <span>{language === 'vi' ? 'Chỉnh sửa đề xuất' : 'Edit Proposal'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-part-danger"
                          onClick={() => void requestCancellation()}
                        >
                          <XCircle size={15} />
                          <span>{language === 'vi' ? 'Rút đề xuất' : 'Withdraw Proposal'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activity.status === 'rejected' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 1rem',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      color: '#991B1B',
                      fontSize: '0.86rem'
                    }}>
                      <XCircle size={16} style={{ flexShrink: 0 }} />
                      <span>
                        {language === 'vi' ? 'Đề xuất hoạt động này đã bị từ chối.' : 'This proposal was rejected.'}
                        {activity.feedbacks ? ` Lý do: ${activity.feedbacks}` : ''}
                      </span>
                    </div>
                  )}

                  {activity.status === 'withdrawn' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 1rem',
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: '#4B5563',
                      fontSize: '0.86rem'
                    }}>
                      <XCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{language === 'vi' ? 'Hoạt động này đã được hủy / rút lại.' : 'This activity was cancelled or withdrawn.'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LỊCH TRÌNH (CHỈNH SỬA ĐƯỢC LỊCH TRÌNH CRUD) */}
            {activeTab === 'schedule' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172421', margin: '0 0 0.25rem 0' }}>
                      {language === 'vi' ? 'Lịch trình chi tiết chương trình' : 'Detailed Timeline & Schedule'}
                    </h3>
                    <p style={{ color: '#5C7068', fontSize: '0.86rem', margin: 0 }}>
                      {language === 'vi' ? 'Quản lý các mốc thời gian, tiết mục, nội dung và người phụ trách.' : 'Manage program milestones, timeline, and presenters.'}
                    </p>
                  </div>
                  {!isAddingSchedule && !editingScheduleId && (
                    <button
                      type="button"
                      className="btn-part-primary"
                      onClick={handleStartAddSchedule}
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
                    >
                      <Plus size={15} />
                      <span>{language === 'vi' ? 'Thêm mốc lịch trình' : 'Add Milestone'}</span>
                    </button>
                  )}
                </div>

                {/* Form thêm hoặc chỉnh sửa mốc lịch trình */}
                {(isAddingSchedule || editingScheduleId) && (
                  <form onSubmit={handleSaveScheduleItem} style={{ background: '#FAFBFB', border: '1.5px solid #D5E2DC', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 700, color: '#17382E' }}>
                      {editingScheduleId ? (language === 'vi' ? 'Chỉnh sửa mốc lịch trình' : 'Edit Milestone') : (language === 'vi' ? 'Thêm mốc lịch trình mới' : 'New Milestone')}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                          {language === 'vi' ? 'Khung giờ *' : 'Time *'}
                        </label>
                        <input maxLength={200}
                          type="text"
                          required
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                          placeholder="Ví dụ: 09:00 – 09:30"
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CFDCD6', fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                          {language === 'vi' ? 'Tiêu đề tiết mục / phần việc *' : 'Title *'}
                        </label>
                        <input maxLength={200}
                          type="text"
                          required
                          value={scheduleForm.title}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                          placeholder="Ví dụ: Đón tiếp độc giả & Khai mạc"
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CFDCD6', fontSize: '0.86rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                          {language === 'vi' ? 'Diễn giả / Người phụ trách' : 'Presenter / Lead'}
                        </label>
                        <input maxLength={200}
                          type="text"
                          value={scheduleForm.speaker}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, speaker: e.target.value })}
                          placeholder="Ví dụ: MC & Ban Tổ Chức"
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CFDCD6', fontSize: '0.86rem' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        {language === 'vi' ? 'Nội dung chi tiết' : 'Description / Notes'}
                      </label>
                      <textarea maxLength={20000}
                        rows={2}
                        value={scheduleForm.description}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        placeholder="Mô tả tóm tắt nội dung tiến trình..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CFDCD6', fontSize: '0.86rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button type="submit" className="btn-part-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}>
                        <Check size={14} />
                        <span>{language === 'vi' ? 'Lưu mốc lịch trình' : 'Save Milestone'}</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn-part-secondary" 
                        onClick={() => { setIsAddingSchedule(false); setEditingScheduleId(null); }}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
                      >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Danh sách các mốc lịch trình */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {scheduleItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        padding: '1.1rem 1.25rem', 
                        background: '#FAFBFB', 
                        borderRadius: '10px', 
                        border: '1px solid #E3ECE7',
                        borderLeft: '4px solid #17382E',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ 
                            background: '#EDF4F0', 
                            color: '#17382E', 
                            fontWeight: 750, 
                            fontSize: '0.78rem', 
                            padding: '0.2rem 0.55rem', 
                            borderRadius: '6px' 
                          }}>
                            ⏰ {item.time}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#172421' }}>
                            {index + 1}. {item.title}
                          </h4>
                        </div>
                        {item.speaker && (
                          <div style={{ fontSize: '0.84rem', color: '#B3862A', fontWeight: 600, marginBottom: '0.25rem' }}>
                            👤 {item.speaker}
                          </div>
                        )}
                        {item.description && (
                          <p style={{ margin: 0, fontSize: '0.86rem', color: '#556B65', lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-part-secondary"
                          onClick={() => handleStartEditSchedule(item)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          title="Sửa mốc này"
                        >
                          <Edit3 size={13} />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-part-secondary"
                          onClick={() => handleDeleteScheduleItem(item.id)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#DC2626' }}
                          title="Xóa mốc này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {scheduleItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAF9', borderRadius: '10px', color: '#657B74' }}>
                      <Calendar size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Chưa có mốc lịch trình nào. Bấm "Thêm mốc lịch trình" ở trên để bổ sung.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ĐĂNG KÝ (KHÁCH ĐĂNG KÝ SỰ KIỆN TỰ ĐỘNG HIỆN VÀO ĐÂY) */}
            {activeTab === 'registration' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172421', margin: '0 0 0.25rem 0' }}>
                      {language === 'vi' ? 'Danh sách độc giả đăng ký tham gia' : 'Registered Participants'}
                    </h3>
                    <p style={{ color: '#5C7068', fontSize: '0.86rem', margin: 0 }}>
                      {language === 'vi' 
                        ? `Tổng cộng ${participantCount} độc giả đã đăng ký (Không giới hạn số người tham dự).`
                        : `Total ${participantCount} participants registered (No attendance limit).`}
                    </p>
                  </div>

                  {participants.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F4F7F5', border: '1px solid #D6E2DD', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
                      <Search size={14} color="#657B74" />
                      <input maxLength={200}
                        type="text"
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        placeholder={language === 'vi' ? 'Tìm tên, SĐT, mã vé...' : 'Search name, phone, ticket...'}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', width: '180px' }}
                      />
                      {participantSearch && (
                        <X size={13} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setParticipantSearch('')} />
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop View Table */}
                <div className="partner-participant-desktop-table" style={{ background: '#FFFFFF', border: '1px solid #E5ECE8', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '50px 1.8fr 1.2fr 1.4fr 1.2fr', 
                    padding: '0.75rem 1rem', 
                    background: '#F6F9F7', 
                    borderBottom: '1px solid #E2ECE6',
                    fontSize: '0.78rem',
                    fontWeight: 750,
                    color: '#496057',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    <span>#</span>
                    <span>{language === 'vi' ? 'Họ và tên' : 'Full Name'}</span>
                    <span>{language === 'vi' ? 'Số điện thoại' : 'Phone'}</span>
                    <span>{language === 'vi' ? 'Mã vé / Đăng ký' : 'Ticket Code'}</span>
                    <span style={{ textAlign: 'right' }}>{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                  </div>

                  <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    {filteredParticipants.map((participant, index) => (
                      <div 
                        key={participant.id} 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '50px 1.8fr 1.2fr 1.4fr 1.2fr', 
                          padding: '0.85rem 1rem', 
                          borderBottom: '1px solid #EEF3F0', 
                          fontSize: '0.88rem',
                          alignItems: 'center',
                          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFCFB'
                        }}
                      >
                        <span style={{ color: '#7E918B', fontWeight: 600 }}>{index + 1}</span>
                        <strong style={{ color: '#172421' }}>{participant.fullName}{(participant.attendeesCount || 1) > 1 && <small> · {participant.attendeesCount} người</small>}</strong>
                        <span style={{ color: '#556B65' }}>{participant.phone || '—'}</span>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.82rem', 
                          fontWeight: 700, 
                          color: '#B3862A',
                          background: '#FAF7EE',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          width: 'fit-content'
                        }}>
                          {participant.ticketCode}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '12px',
                            background: participant.status === 'attended' ? '#DCFCE7' : '#FEF3C7',
                            color: participant.status === 'attended' ? '#15803D' : '#B45309'
                          }}>
                            {participant.status === 'attended' ? '✓ Đã tham gia' : 'Đã đăng ký'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredParticipants.length === 0 && (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#657B74' }}>
                      <Users size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.92rem' }}>
                        {participantSearch 
                          ? 'Không tìm thấy độc giả phù hợp với từ khóa tìm kiếm.' 
                          : 'Chưa có độc giả đăng ký tham gia sự kiện này.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile Cards View for Participants */}
                <div className="partner-participant-mobile-cards">
                  {filteredParticipants.map((participant, index) => (
                    <div key={participant.id} className="participant-mobile-card">
                      <div className="participant-mobile-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ 
                            width: '22px', 
                            height: '22px', 
                            borderRadius: '50%', 
                            background: '#F0F4F2', 
                            color: '#17382E', 
                            fontSize: '0.72rem', 
                            fontWeight: 750, 
                            display: 'grid', 
                            placeItems: 'center',
                            flexShrink: 0
                          }}>
                            {index + 1}
                          </span>
                          <strong style={{ color: '#172421', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {participant.fullName}
                            {(participant.attendeesCount || 1) > 1 && <small style={{ color: '#637771', fontWeight: 500 }}> · {participant.attendeesCount} người</small>}
                          </strong>
                        </div>
                        <span style={{ 
                          fontSize: '0.74rem', 
                          fontWeight: 700, 
                          padding: '0.15rem 0.55rem', 
                          borderRadius: '12px',
                          background: participant.status === 'attended' ? '#DCFCE7' : '#FEF3C7',
                          color: participant.status === 'attended' ? '#15803D' : '#B45309',
                          flexShrink: 0
                        }}>
                          {participant.status === 'attended' ? '✓ Đã tham gia' : 'Đã đăng ký'}
                        </span>
                      </div>
                      <div className="participant-mobile-card-bottom">
                        <span style={{ color: '#556B65', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📞 {participant.phone || '—'}
                        </span>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          color: '#B3862A',
                          background: '#FAF7EE',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid #EFE4CC'
                        }}>
                          {participant.ticketCode}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredParticipants.length === 0 && (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#F8FAF9', borderRadius: '10px', color: '#657B74' }}>
                      <Users size={28} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                      <p style={{ margin: 0, fontSize: '0.84rem' }}>
                        {participantSearch 
                          ? 'Không tìm thấy độc giả phù hợp với từ khóa.' 
                          : 'Chưa có độc giả đăng ký tham gia sự kiện này.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TÀI LIỆU (CRUD TÀI LIỆU HOẠT ĐỘNG) */}
            {activeTab === 'documents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#172421', margin: '0 0 0.25rem 0' }}>
                      {language === 'vi' ? 'Hồ sơ & Tài liệu hoạt động' : 'Activity Materials & Documents'}
                    </h3>
                    <p style={{ color: '#5C7068', fontSize: '0.86rem', margin: 0 }}>
                      {language === 'vi' ? 'Giáo án, tài liệu trình chiếu, kịch bản hoặc hướng dẫn gửi Ban Quản Lý.' : 'Workshop guide, slides, presentations and handouts.'}
                    </p>
                  </div>

                  {/* Nút upload file từ máy */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label className="btn-part-primary" style={{ cursor: 'pointer', padding: '0.45rem 0.9rem', fontSize: '0.84rem', margin: 0 }}>
                      <Upload size={14} />
                      <span>{language === 'vi' ? 'Tải tệp từ máy' : 'Upload File'}</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                        style={{ display: 'none' }}
                        onChange={handleUploadDocFile}
                      />
                    </label>
                  </div>
                </div>

                {/* Thêm tài liệu nhanh thủ công */}
                <form onSubmit={handleAddDocManual} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input maxLength={200}
                    type="text"
                    value={newDocName}
                    required
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập tên tài liệu mới (ví dụ: Giao_an_workshop_v1.pdf)...' : 'Enter document title...'}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #D1DDD8', fontSize: '0.86rem' }}
                  />
                  <input maxLength={2000} type="url" required aria-label="Liên kết tài liệu" placeholder="https://..." value={newDocUrl} onChange={event => setNewDocUrl(event.target.value)} style={{ flex: 1, minWidth: '10rem', padding: '0.5rem' }} />
                  <button type="submit" className="btn-part-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.84rem' }}>
                    <Plus size={14} />
                    <span>{language === 'vi' ? 'Thêm tài liệu' : 'Add'}</span>
                  </button>
                </form>

                {/* Danh sách tài liệu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.15rem',
                        background: '#FAFBFB',
                        borderRadius: '10px',
                        border: '1px solid #E1ECE6',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '8px', 
                          background: '#EDF4F0', 
                          color: '#17382E', 
                          display: 'grid', 
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={18} />
                        </div>

                        {editingDocId === doc.id ? (
                          <div style={{ display: 'flex', gap: '0.35rem', flex: 1, alignItems: 'center' }}>
                            <input maxLength={200}
                              type="text"
                              value={editingDocName}
                              onChange={(e) => setEditingDocName(e.target.value)}
                              style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1.5px solid #1E5141', fontSize: '0.85rem' }}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleSaveDocRename(doc.id)}
                              style={{ background: '#1E5141', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.55rem', cursor: 'pointer' }}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingDocId(null)}
                              style={{ background: '#F1F5F3', border: '1px solid #CCD8D2', borderRadius: '6px', padding: '0.35rem 0.55rem', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#172421' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#687D76', marginTop: '0.15rem' }}>
                              {doc.size} {doc.uploadedAt ? `• Ngày tải: ${doc.uploadedAt}` : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        {doc.url && (
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="btn-part-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', textDecoration: 'none' }}
                          >
                            <Download size={13} />
                            <span>{language === 'vi' ? 'Tải về' : 'Download'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-part-secondary"
                          onClick={() => { setEditingDocId(doc.id); setEditingDocName(doc.name); }}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          title="Đổi tên tài liệu"
                        >
                          <Edit3 size={13} />
                          <span>{language === 'vi' ? 'Đổi tên' : 'Rename'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-part-secondary"
                          onClick={() => handleDeleteDoc(doc.id)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#DC2626' }}
                          title="Xóa tài liệu"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {documents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAF9', borderRadius: '10px', color: '#657B74' }}>
                      <FileText size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {language === 'vi' ? 'Chưa có tài liệu nào. Bạn có thể tải tệp lên hoặc thêm tài liệu ở trên.' : 'No materials uploaded yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
