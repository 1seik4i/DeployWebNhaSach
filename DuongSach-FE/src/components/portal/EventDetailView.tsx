import { useUrlTab } from '../../hooks/useUrlTab';
import { promptModal, notifyModal } from '../../services/notificationModal';
import { imageFileError } from '../../utils/fileValidation';
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Edit3, 
  Star, 
  Send, 
  Download, 
  Map, 
  CheckCircle2, 
  Save, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Clock,
  User,
  Users,
  MessageSquare,
  Sparkles,
  X,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  Camera,
  Upload
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerEvent, OrganizerBoothItem, OrganizerActivityItem } from '../../types/organizer';
import { OrganizerPartnerApplication, organizerApi } from '../../services/organizerApi';

interface EventFeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string | null;
  activityName?: string | null;
  source?: string;
}

interface EventDetailViewProps {
  language: Language;
  event: OrganizerEvent;
  booths: OrganizerBoothItem[];
  activities: OrganizerActivityItem[];
  locations?: Array<{ id: string; name: string; capacity: number }>;
  partnerApplications?: OrganizerPartnerApplication[];
  onApprovePartnerApplication?: (id: string) => void | Promise<void>;
  onRejectPartnerApplication?: (id: string, note: string) => void | Promise<void>;
  onCreateActivity?: (activityData: OrganizerActivityItem) => void | Promise<void>;
  onUpdateActivity?: (id: string, activityData: Partial<OrganizerActivityItem> & Record<string, unknown>) => void | Promise<void>;
  onDeleteActivity?: (id: string) => void | Promise<void>;
  onBack: () => void;
  onNavigateToBoothsMap: () => void;
  onNavigateToReports: () => void;
  onUpdateEventSettings?: (eventId: string, updatedSettings: Partial<OrganizerEvent>) => void | Promise<void>;
  onTogglePublishEvent?: (eventId: string) => void;
  onBroadcastEvent?: (eventId: string) => void | Promise<void>;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  language,
  event,
  booths,
  activities,
  locations = [],
  partnerApplications = [],
  onApprovePartnerApplication,
  onRejectPartnerApplication,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onBack,
  onNavigateToBoothsMap,
  onNavigateToReports,
  onUpdateEventSettings,
  onTogglePublishEvent,
  onBroadcastEvent
}) => {
  const isPub = event.isPublished ?? (event.status !== 'draft');
  const [activeTab, setActiveTab] = useUrlTab(['overview', 'partners', 'schedule', 'settings'], 'overview', 'section');
  const [currentImageUrl, setCurrentImageUrl] = useState(event.imageUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setCurrentImageUrl(event.imageUrl || '');
  }, [event.id, event.imageUrl]);

  const handleUploadEventImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = imageFileError(file);
    if (error) { void notifyModal(error); e.target.value = ''; return; }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCurrentImageUrl(dataUrl);
        try {
          await organizerApi.updateEvent(event.id, { coverImageUrl: dataUrl });
          window.dispatchEvent(new Event('duongsach:data-changed'));
          void notifyModal(language === 'vi' ? 'Đã tải và cập nhật ảnh sự kiện thành công!' : 'Event image updated successfully!');
        } catch (err) {
          void notifyModal(err instanceof Error ? err.message : 'Không thể cập nhật ảnh sự kiện');
        } finally {
          setUploadingImage(false);
        }
      }
    };
    reader.onerror = () => {
      setUploadingImage(false);
      void notifyModal(language === 'vi' ? 'Không thể đọc tệp ảnh' : 'Failed to read image file');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Event Feedbacks State
  const [feedbacks, setFeedbacks] = useState<EventFeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(event.averageRating || 0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState<boolean>(true);

  // Fetch real reviews/feedbacks for this event
  useEffect(() => {
    let isMounted = true;
    setLoadingFeedbacks(true);
    organizerApi.getReport(event.id)
      .then((report) => {
        if (!isMounted) return;
        if (report?.feedbacks) {
          setFeedbacks(report.feedbacks);
        }
        if (typeof report?.averageRating === 'number') {
          setAverageRating(report.averageRating);
        }
        if (typeof report?.ratingCount === 'number') {
          setRatingCount(report.ratingCount);
        }
      })
      .catch((err) => {
        console.warn('Could not load event report feedback:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingFeedbacks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [event.id]);

  // Event settings form state
  const dateInputValue = (value?: string) => value ? value.slice(0, 10) : '';
  const [boothDeadline, setBoothDeadline] = useState(dateInputValue(event.boothDeadline));
  const [activityDeadline, setActivityDeadline] = useState(dateInputValue(event.activityDeadline));
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setBoothDeadline(dateInputValue(event.boothDeadline));
    setActivityDeadline(dateInputValue(event.activityDeadline));
  }, [event.id, event.boothDeadline, event.activityDeadline]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true); setSettingsError(''); setSavedSettingsSuccess(false);
    try {
      await onUpdateEventSettings?.(event.id, {
        boothDeadline,
        activityDeadline,
      });
      if (currentImageUrl !== event.imageUrl) {
        await organizerApi.updateEvent(event.id, { coverImageUrl: currentImageUrl || null });
        window.dispatchEvent(new Event('duongsach:data-changed'));
      }
      setSavedSettingsSuccess(true);
      setTimeout(() => setSavedSettingsSuccess(false), 2500);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Không thể lưu cấu hình sự kiện.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Schedule Detail Modal State & Edit
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<OrganizerActivityItem | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [editScheduleForm, setEditScheduleForm] = useState({
    title: '',
    kind: 'talkshow',
    locationId: '',
    speaker: '',
    capacity: 50,
    description: ''
  });

  const handleStartEditSchedule = (item: OrganizerActivityItem) => {
    const matchedLoc = locations.find(l => l.name === item.location || l.id === item.locationId);
    setEditScheduleForm({
      title: item.title,
      kind: item.type || 'talkshow',
      locationId: matchedLoc?.id || item.locationId || (locations[0]?.id || ''),
      speaker: item.speaker || '',
      capacity: item.capacity || 50,
      description: item.description || ''
    });
    setScheduleError('');
    setIsEditingSchedule(true);
  };

  const handleSaveScheduleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleDetail || !onUpdateActivity) return;
    setSavingSchedule(true);
    setScheduleError('');
    try {
      const payload: Record<string, unknown> = {
        title: editScheduleForm.title.trim(),
        kind: editScheduleForm.kind,
        speaker: editScheduleForm.speaker.trim(),
        capacity: Number(editScheduleForm.capacity) || 1,
        description: editScheduleForm.description.trim()
      };
      if (editScheduleForm.locationId) {
        payload.locationId = editScheduleForm.locationId;
      }

      await onUpdateActivity(selectedScheduleDetail.id, payload as Partial<OrganizerActivityItem> & Record<string, unknown>);
      
      const locName = locations.find(l => l.id === editScheduleForm.locationId)?.name || selectedScheduleDetail.location;
      setSelectedScheduleDetail({
        ...selectedScheduleDetail,
        title: editScheduleForm.title.trim(),
        type: editScheduleForm.kind,
        location: locName,
        locationId: editScheduleForm.locationId || selectedScheduleDetail.locationId,
        speaker: editScheduleForm.speaker.trim(),
        capacity: Number(editScheduleForm.capacity) || 1,
        description: editScheduleForm.description.trim()
      });
      setIsEditingSchedule(false);
      void notifyModal(
        language === 'vi' ? 'Đã cập nhật thông tin lịch trình thành công!' : 'Schedule item updated successfully!'
      );
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Không thể lưu thay đổi lịch trình');
    } finally {
      setSavingSchedule(false);
    }
  };

  const getActivityKindLabel = (kind?: string) => {
    switch (kind) {
      case 'talkshow': return 'Tọa đàm / Talkshow';
      case 'workshop': return 'Workshop & Trải nghiệm';
      case 'launch': return 'Ra mắt sách & Giới thiệu tác phẩm';
      case 'signing': return 'Giao lưu tác giả & Ký tặng';
      case 'exhibition': return 'Triển lãm & Trưng bày';
      case 'minigame': return 'Hoạt động tương tác / Minigame';
      default: return kind || 'Hoạt động sự kiện';
    }
  };

  return (
    <div className="organizer-content">
      {/* 1. Back button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn-org-secondary"
          onClick={onBack}
          style={{ padding: '0.35rem 0.85rem', height: '34px' }}
        >
          <ArrowLeft size={14} />
          <span>{language === 'vi' ? 'Quay lại danh sách sự kiện' : 'Back to Events'}</span>
        </button>
      </div>

      {/* 2. Event Header Card */}
      <div className="organizer-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '320px' }}>
            <div style={{ 
              position: 'relative', 
              width: '110px', 
              height: '80px', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              border: '1px solid #DCE5E0',
              background: '#F3F4F6',
              flexShrink: 0
            }}>
              <img 
                src={currentImageUrl || '/duong_sach_logo.png'} 
                alt={event.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/duong_sach_logo.png';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <label 
                title={language === 'vi' ? 'Nhấn để tải ảnh sự kiện mới lên' : 'Click to upload new event image'}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(23, 40, 33, 0.65)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  opacity: currentImageUrl ? 0 : 0.85,
                  transition: 'opacity 0.2s ease',
                  flexDirection: 'column',
                  gap: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 650
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = currentImageUrl ? '0' : '0.85'}
              >
                <Camera size={18} />
                <span>{uploadingImage ? '...' : (language === 'vi' ? 'Đổi ảnh' : 'Change')}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleUploadEventImage}
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#172421', margin: 0 }}>
                  {event.title}
                </h1>
                <span className="org-chip happening">
                  ● {event.statusLabelVi}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: '#556B65' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#17382E" />
                  <span>{event.dateRange}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#17382E" />
                  <span>{event.location}</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Toggle publish button */}
            <button
              type="button"
              onClick={() => onTogglePublishEvent && onTogglePublishEvent(event.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isPub ? '#F0FDF4' : '#F9FAFB',
                border: isPub ? '1.5px solid #16A34A' : '1.5px solid #9CA3AF',
                color: isPub ? '#15803D' : '#4B5563'
              }}
              title={isPub 
                ? (language === 'vi' ? 'Nhấn để ẩn sự kiện này khỏi Landing Page' : 'Click to hide from Landing Page') 
                : (language === 'vi' ? 'Nhấn để công bố sự kiện này lên Landing Page' : 'Click to publish to Landing Page')
              }
            >
              {isPub ? <Eye size={14} color="#15803D" /> : <EyeOff size={14} color="#4B5563" />}
              <span>
                {isPub 
                  ? (language === 'vi' ? 'Đang công bố' : 'Published') 
                  : (language === 'vi' ? 'Đang ẩn' : 'Hidden')
                }
              </span>
            </button>

            <button
              type="button"
              className="btn-org-secondary"
              onClick={() => setActiveTab('settings')}
            >
              <Edit3 size={15} />
              <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: Đã bỏ đi Gian hàng và Hoạt động */}
        <div className="org-tabs-bar" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {language === 'vi' ? 'Tổng quan' : 'Overview'}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'partners' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('partners')}
          >
            {language === 'vi' ? `Đối tác (${partnerApplications.length})` : `Partners (${partnerApplications.length})`}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'schedule' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            {language === 'vi' ? `Lịch trình (${activities.length})` : `Schedule (${activities.length})`}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {language === 'vi' ? 'Cài đặt' : 'Settings'}
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB: TỔNG QUAN (Thông tin chung + Đánh giá thực tế từ người tham gia) */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)',
            gap: '1.5rem',
            alignItems: 'start'
          }}>
            {/* Left: Thông tin chung */}
            <div className="organizer-card">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#172421', margin: '0 0 1rem 0' }}>
                {language === 'vi' ? 'Thông tin chung' : 'General Overview'}
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#637771', display: 'block', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Mô tả sự kiện' : 'Description'}
                </span>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#243833', lineHeight: 1.6 }}>
                  {event.description}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                borderTop: '1px solid #EEF2F0',
                paddingTop: '1rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Thời gian' : 'Date'}</span>
                  <strong style={{ color: '#172421' }}>{event.dateRange}</strong>
                </div>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Địa điểm' : 'Location'}</span>
                  <strong style={{ color: '#172421' }}>{event.location}</strong>
                </div>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                  <span className="org-chip happening" style={{ marginTop: '0.2rem' }}>● {event.statusLabelVi}</span>
                </div>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Số khung lịch trình' : 'Scheduled Slots'}</span>
                  <strong style={{ color: '#172421' }}>{activities.length} buổi</strong>
                </div>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Lượt đăng ký' : 'Registrations'}</span>
                  <strong style={{ color: '#172421' }}>{event.registrationsCount.toLocaleString()} người</strong>
                </div>
                <div>
                  <span style={{ color: '#637771', fontSize: '0.76rem', display: 'block' }}>{language === 'vi' ? 'Tổng số đánh giá' : 'Reviews Count'}</span>
                  <strong style={{ color: '#172421' }}>{ratingCount} đánh giá</strong>
                </div>
              </div>
            </div>

            {/* Right: Thống kê nhanh & Thao tác nhanh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="organizer-card">
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#172421', margin: '0 0 1rem 0' }}>
                  {language === 'vi' ? 'Điểm đánh giá thực tế' : 'Rating & Feedback'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ background: '#F8FAF9', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2EAE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={16} color="#E9BC63" fill="#E9BC63" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C6519' }}>Điểm sao</span>
                    </div>
                    <strong style={{ display: 'block', fontSize: '1.5rem', color: '#172421', margin: '0.35rem 0 0.1rem' }}>
                      {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#556B65' }}>Trung bình</span>
                  </div>

                  <div style={{ background: '#F8FAF9', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2EAE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={16} color="#17382E" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17382E' }}>Phản hồi</span>
                    </div>
                    <strong style={{ display: 'block', fontSize: '1.5rem', color: '#172421', margin: '0.35rem 0 0.1rem' }}>
                      {feedbacks.length}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#556B65' }}>Lượt nhận xét</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="organizer-card">
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#172421', margin: '0 0 1rem 0' }}>
                  {language === 'vi' ? 'Thao tác nhanh' : 'Quick Actions'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="btn-org-secondary"
                    style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    onClick={() => void onBroadcastEvent?.(event.id)}
                  >
                    <Send size={15} color="#17382E" />
                    <span>{language === 'vi' ? 'Gửi thông báo' : 'Broadcast Message'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-org-secondary"
                    style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    onClick={onNavigateToReports}
                  >
                    <Download size={15} color="#17382E" />
                    <span>{language === 'vi' ? 'Xem báo cáo thống kê' : 'Export Event Report'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-org-secondary"
                    style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                    onClick={onNavigateToBoothsMap}
                  >
                    <Map size={15} color="#17382E" />
                    <span>{language === 'vi' ? 'Xem bản đồ sự kiện' : 'View Event Map'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DỮ LIỆU ĐÁNH GIÁ THỰC TẾ (REAL FEEDBACKS SECTION) */}
          <div className="organizer-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#FFFBEB', padding: '6px', borderRadius: '8px', color: '#B45309' }}>
                  <Star size={18} fill="#B45309" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#172421', fontWeight: 750 }}>
                    {language === 'vi' ? 'Đánh giá & Nhận xét từ người tham quan' : 'Visitor Reviews & Feedback'}
                  </h3>
                  <small style={{ color: '#637771', fontSize: '0.78rem' }}>
                    Dữ liệu thực tế ghi nhận từ người tham gia sự kiện và các hoạt động thuộc sự kiện
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#17382E' }}>
                  {feedbacks.length} nhận xét
                </span>
              </div>
            </div>

            {loadingFeedbacks ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#637771', fontSize: '0.88rem' }}>
                Đang tải dữ liệu đánh giá thực tế…
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                background: '#FAFCFB',
                borderRadius: '12px',
                border: '1px dashed #D2DDD7'
              }}>
                <MessageSquare size={32} color="#A0AEC0" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontWeight: 650 }}>Chưa có đánh giá nào</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Khi người tham gia gửi cảm nhận và chấm điểm sao sau sự kiện, danh sách sẽ hiển thị trực tiếp tại đây.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {feedbacks.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2EAE5',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#EAEFEA',
                          color: '#17382E',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {(item.authorName || 'K')[0].toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#172421', display: 'block' }}>
                            {item.authorName || 'Khách tham quan'}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#889893' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            color={star <= item.rating ? '#F59E0B' : '#D1D5DB'}
                            fill={star <= item.rating ? '#F59E0B' : 'none'}
                          />
                        ))}
                      </div>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      fontStyle: item.comment ? 'normal' : 'italic',
                      color: item.comment ? '#334155' : '#94A3B8'
                    }}>
                      "{item.comment || 'Người tham quan không để lại bình luận'}"
                    </p>

                    {item.activityName && (
                      <div style={{ marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid #F1F5F3', fontSize: '0.74rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={11} />
                        <span>Chương trình: {item.activityName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ĐỐI TÁC */}
      {activeTab === 'partners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card with Stats */}
          <div className="organizer-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#11281E', margin: '0 0 0.35rem 0', fontWeight: 800 }}>
                  {language === 'vi' ? 'Hồ sơ đối tác tham gia sự kiện' : 'Partner Event Applications'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#5A6D64', lineHeight: 1.5 }}>
                  {language === 'vi'
                    ? 'Danh sách các nhà xuất bản, đơn vị phát hành và đối tác đăng ký tham gia đồng hành cùng sự kiện.'
                    : 'List of publishers and partner organizations applying to participate in this event.'}
                </p>
              </div>

              {/* Status Counters */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                  background: '#F8FAF9',
                  border: '1px solid #E2EAE5',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#5A6D64', fontWeight: 650 }}>Tổng cộng:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#11281E' }}>{partnerApplications.length}</strong>
                </div>

                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 650 }}>Chờ duyệt:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#92400E' }}>
                    {partnerApplications.filter(a => ['submitted', 'pending', 'need_changes'].includes(a.status)).length}
                  </strong>
                </div>

                <div style={{
                  background: '#DEF7EC',
                  border: '1px solid #BCF0DA',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#03543F', fontWeight: 650 }}>Đã duyệt:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#03543F' }}>
                    {partnerApplications.filter(a => a.status === 'approved').length}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* List of Applications */}
          {partnerApplications.length === 0 ? (
            <div className="organizer-card" style={{
              padding: '3.5rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FAFCFB',
              border: '1px dashed #D2DDD7'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: '#EAEFEA',
                color: '#17382E',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1rem'
              }}>
                <Building2 size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.35rem 0', color: '#172421', fontSize: '1.1rem', fontWeight: 750 }}>
                {language === 'vi' ? 'Chưa có hồ sơ đối tác nào' : 'No Partner Applications Yet'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#637771', maxWidth: '420px', lineHeight: 1.5 }}>
                {language === 'vi'
                  ? 'Khi các đơn vị phát hành và nhà sách đăng ký tham gia sự kiện này, hồ sơ sẽ hiển thị tại đây để bạn phê duyệt.'
                  : 'Partner registration applications submitted for this event will appear here for review and approval.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {partnerApplications.map((application) => {
                const isPending = ['submitted', 'pending', 'need_changes'].includes(application.status);
                const isApproved = application.status === 'approved';
                const isRejected = application.status === 'rejected';

                const statusLabel = isApproved 
                  ? (language === 'vi' ? 'Đã duyệt' : 'Approved')
                  : isRejected 
                    ? (language === 'vi' ? 'Đã từ chối' : 'Rejected')
                    : (language === 'vi' ? 'Chờ phê duyệt' : 'Pending Review');

                const statusBg = isApproved ? '#DEF7EC' : isRejected ? '#FDE8E8' : '#FEF3C7';
                const statusColor = isApproved ? '#03543F' : isRejected ? '#9B1C1C' : '#92400E';
                const statusBorder = isApproved ? '#BCF0DA' : isRejected ? '#F8B4B4' : '#FDE68A';

                return (
                  <div
                    key={application.id}
                    className="organizer-card"
                    style={{
                      padding: '1.35rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      borderLeft: isPending ? '4px solid #D97706' : isApproved ? '4px solid #059669' : '4px solid #DC2626',
                      boxShadow: '0 2px 10px rgba(17, 40, 30, 0.04)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Top Row: Organization Name, Event Badge, Status */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      borderBottom: '1px solid #F1F5F3',
                      paddingBottom: '0.85rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isApproved ? '#E8F5EF' : isPending ? '#FEF3C7' : '#FEE2E2',
                          color: isApproved ? '#065F46' : isPending ? '#92400E' : '#B91C1C',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#11281E', fontWeight: 750, letterSpacing: '-0.01em' }}>
                            {application.orgName}
                          </h3>
                          <span style={{ fontSize: '0.76rem', color: '#6A8277', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Calendar size={12} />
                            {language === 'vi' ? 'Nộp ngày:' : 'Submitted on:'} {application.date || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusBorder}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {isApproved && <CheckCircle size={13} />}
                        {isPending && <Clock size={13} />}
                        {isRejected && <XCircle size={13} />}
                        <span>{statusLabel}</span>
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '0.85rem 1.25rem',
                      background: '#F9FBFA',
                      padding: '0.9rem 1.15rem',
                      borderRadius: '10px',
                      border: '1px solid #EAF0ED'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <User size={15} color="#5A6D64" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 650, color: '#6C8178', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {language === 'vi' ? 'Người đại diện' : 'Representative'}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: '#172B23' }}>
                            {application.rep || '—'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <Phone size={15} color="#5A6D64" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 650, color: '#6C8178', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {language === 'vi' ? 'Số điện thoại' : 'Phone'}
                          </span>
                          {application.phone ? (
                            <a href={`tel:${application.phone}`} style={{ fontSize: '0.88rem', color: '#0E6549', fontWeight: 650, textDecoration: 'none' }}>
                              {application.phone}
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.88rem', color: '#172B23' }}>—</span>
                          )}
                        </div>
                      </div>

                      {application.email && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                          <Mail size={15} color="#5A6D64" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 650, color: '#6C8178', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              {language === 'vi' ? 'Email liên hệ' : 'Email'}
                            </span>
                            <a href={`mailto:${application.email}`} style={{ fontSize: '0.88rem', color: '#0E6549', fontWeight: 650, textDecoration: 'none' }}>
                              {application.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description Plan Box */}
                    {application.desc && (
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px dashed #D3E0D9',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4C655A', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                          <FileText size={13} />
                          <span>{language === 'vi' ? 'Nội dung kế hoạch tham gia' : 'Participation details'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2D443B', lineHeight: 1.55 }}>
                          {application.desc}
                        </p>
                      </div>
                    )}

                    {/* Review Note if any */}
                    {application.reviewNote && (
                      <div style={{
                        background: isRejected ? '#FEF2F2' : '#F4FBF7',
                        border: isRejected ? '1px solid #FECACA' : '1px solid #D0EDE0',
                        color: isRejected ? '#991B1B' : '#185E46',
                        borderRadius: '8px',
                        padding: '0.65rem 0.9rem',
                        fontSize: '0.82rem',
                        lineHeight: 1.45
                      }}>
                        <strong>{language === 'vi' ? 'Ghi chú ban tổ chức: ' : 'Review Note: '}</strong>
                        <span>{application.reviewNote}</span>
                      </div>
                    )}

                    {/* Action Buttons for Pending items */}
                    {isPending && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #F1F5F3',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#798E84' }}>
                          {language === 'vi' ? 'Hồ sơ đang chờ duyệt để đối tác chuẩn bị tham gia' : 'Action required to confirm partner participation'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <button
                            type="button"
                            onClick={() => void onApprovePartnerApplication?.(application.id)}
                            style={{
                              padding: '0.45rem 1.15rem',
                              borderRadius: '8px',
                              background: '#17382E',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(23, 56, 46, 0.2)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <CheckCircle size={15} />
                            <span>{language === 'vi' ? 'Phê duyệt' : 'Approve'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const note = await promptModal(language === 'vi' ? 'Lý do từ chối hồ sơ đối tác:' : 'Reason for rejection:');
                              if (note?.trim()) void onRejectPartnerApplication?.(application.id, note.trim());
                            }}
                            style={{
                              padding: '0.45rem 1rem',
                              borderRadius: '8px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              fontWeight: 650,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <XCircle size={15} />
                            <span>{language === 'vi' ? 'Từ chối' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: LỊCH TRÌNH (Chỉ xem chi tiết cho vai trò Admin) */}
      {activeTab === 'schedule' && (
        <div className="organizer-card" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#172421', margin: '0 0 0.35rem 0' }}>
                {language === 'vi' ? 'Khung thời gian & Lịch trình điều hành' : 'Operational Schedule'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#556B65' }}>
                {language === 'vi'
                  ? 'Theo dõi danh sách các mốc thời gian, tọa đàm, lễ ký tặng và hoạt động diễn ra xuyên suốt sự kiện.'
                  : 'Track timelines, talkshows, book signings and activities throughout the event.'}
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              background: '#FAFCFB',
              borderRadius: '12px',
              border: '1px dashed #D2DDD7'
            }}>
              <Calendar size={36} color="#A0AEC0" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontWeight: 650 }}>
                {language === 'vi' ? 'Chưa có lịch trình nào' : 'No schedule items'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                {language === 'vi'
                  ? 'Sự kiện này hiện chưa có lịch trình hoặc hoạt động nào được thiết lập.'
                  : 'No scheduled activities have been established for this event yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #E2EAE5',
                    borderLeft: '4px solid #17382E',
                    background: '#FFFFFF',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    transition: 'box-shadow 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 750,
                        color: '#17382E',
                        background: '#E8F5EF',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={12} />
                        {activity.dateStr} · {activity.timeStr}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        color: '#637771',
                        background: '#F1F5F3',
                        padding: '2px 7px',
                        borderRadius: '6px'
                      }}>
                        {getActivityKindLabel(activity.type)}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: '#172421', fontWeight: 750 }}>
                      {activity.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#556B65', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#17382E" />
                        {activity.location}
                      </span>
                      {activity.speaker && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="#17382E" />
                          Diễn giả: {activity.speaker}
                        </span>
                      )}
                      {activity.capacity > 0 && (
                        <span>
                          Dự kiến: {activity.capacity} người · Không giới hạn đăng ký
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action for Schedule: Xem chi tiết & Chỉnh sửa */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-org-secondary"
                      onClick={() => {
                        setSelectedScheduleDetail(activity);
                        setIsEditingSchedule(false);
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        height: '34px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '8px',
                        fontWeight: 650,
                        color: '#17382E',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={14} />
                      <span>{language === 'vi' ? 'Xem chi tiết' : 'View Details'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-org-secondary"
                      onClick={() => {
                        setSelectedScheduleDetail(activity);
                        handleStartEditSchedule(activity);
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        height: '34px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '8px',
                        fontWeight: 650,
                        color: '#17382E',
                        background: '#FFFFFF',
                        border: '1px solid #D1DDD8',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} />
                      <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CÀI ĐẶT */}
      {activeTab === 'settings' && (
        <form className="organizer-card" onSubmit={handleSaveSettings} style={{ maxWidth: '680px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#172421', margin: '0 0 0.5rem 0' }}>
            {language === 'vi' ? 'Cài đặt thời hạn & Giới hạn vận hành' : 'Configurable Event Limits & Deadlines'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#556B65', margin: '0 0 1.5rem 0' }}>
            {language === 'vi' 
              ? 'Thiết lập các mốc thời gian tự động khóa đăng ký gian hàng, đề xuất hoạt động. Không giới hạn số người tham dự.'
              : 'Configure operational deadlines for booth booking, proposal submission. Attendance is unlimited.'}
          </p>

          {savedSettingsSuccess && (
            <div style={{
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{language === 'vi' ? 'Đã lưu cấu hình sự kiện thành công!' : 'Settings updated successfully!'}</span>
            </div>
          )}
          {settingsError && <p role="alert" style={{ color: '#B91C1C' }}>{settingsError}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Event Cover Image in Settings */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.45rem' }}>
                {language === 'vi' ? 'Hình ảnh / Poster sự kiện' : 'Event Cover / Poster Image'}
              </label>

              <div style={{
                border: '1.5px dashed #D1DDD8',
                borderRadius: '12px',
                padding: '1.25rem',
                background: '#FAFBFB',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <img 
                    src={currentImageUrl || '/duong_sach_logo.png'} 
                    alt="Event Preview" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/duong_sach_logo.png';
                    }}
                    style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#F3F4F6' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1rem',
                      background: '#17382E',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}>
                      <Upload size={15} />
                      <span>{language === 'vi' ? 'Tải ảnh từ máy tính' : 'Upload from device'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={handleUploadEventImage}
                      />
                    </label>
                    {currentImageUrl && (
                      <button
                        type="button"
                        onClick={() => setCurrentImageUrl('')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FEE2E2',
                          border: 'none',
                          color: '#B91C1C',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          width: 'fit-content'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{language === 'vi' ? 'Xóa ảnh sự kiện' : 'Remove image'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'block', marginBottom: '0.25rem' }}>
                    {language === 'vi' ? 'Hoặc dán đường dẫn URL trực tiếp:' : 'Or enter direct image URL:'}
                  </span>
                  <input maxLength={10000000}
                    type="text"
                    value={currentImageUrl}
                    onChange={(e) => setCurrentImageUrl(e.target.value)}
                    placeholder="https://... (URL hình ảnh sự kiện)"
                    style={{ width: '100%', padding: '0.55rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '6px', fontSize: '0.82rem', background: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                {language === 'vi' ? 'Hạn chót đăng ký gian hàng (Booth Deadline)' : 'Booth Request Deadline'}
              </label>
              <input
                type="date"
                value={boothDeadline}
                onChange={(e) => setBoothDeadline(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                {language === 'vi' ? 'Hạn chót nộp đề xuất hoạt động (Activity Proposal Deadline)' : 'Activity Proposal Deadline'}
              </label>
              <input
                type="date"
                value={activityDeadline}
                onChange={(e) => setActivityDeadline(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="submit" className="btn-org-primary" disabled={savingSettings}>
              <Save size={15} />
              <span>{savingSettings ? (language === 'vi' ? 'Đang lưu…' : 'Saving…') : (language === 'vi' ? 'Lưu cấu hình' : 'Save Settings')}</span>
            </button>
          </div>
        </form>
      )}

      {/* POPUP MODAL: XEM CHI TIẾT LỊCH TRÌNH SỰ KIỆN (CHỈ ĐỌC - DÀNH CHO ROLE ADMIN) */}
      {selectedScheduleDetail && (
        <div
          className="org-modal-backdrop"
          onClick={() => setSelectedScheduleDetail(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="org-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: '95%',
              background: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.18)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #EAEFEA',
              background: '#F8FAF9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#17382E" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#172421', fontWeight: 750 }}>
                  {language === 'vi' ? 'Chi tiết lịch trình' : 'Schedule Item Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheduleDetail(null)}
                style={{
                  background: '#EDF2EF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4B5563',
                  transition: 'background 0.15s ease'
                }}
              >
                <X size={17} />
              </button>
            </div>

            {isEditingSchedule ? (
              <form onSubmit={handleSaveScheduleEdit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '68vh', overflowY: 'auto' }}>
                  {scheduleError && (
                    <div style={{ padding: '0.65rem 1rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem' }}>
                      {scheduleError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                      {language === 'vi' ? 'Tên hoạt động' : 'Activity Title'} <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input maxLength={200}
                      type="text"
                      value={editScheduleForm.title}
                      onChange={(e) => setEditScheduleForm({ ...editScheduleForm, title: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                        {language === 'vi' ? 'Loại hoạt động' : 'Activity Type'}
                      </label>
                      <select
                        value={editScheduleForm.kind}
                        onChange={(e) => setEditScheduleForm({ ...editScheduleForm, kind: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem', background: '#FFFFFF' }}
                      >
                        <option value="talkshow">Tọa đàm / Talkshow</option>
                        <option value="workshop">Workshop & Trải nghiệm</option>
                        <option value="launch">Ra mắt sách & Giới thiệu</option>
                        <option value="signing">Giao lưu & Ký tặng</option>
                        <option value="exhibition">Triển lãm & Trưng bày</option>
                        <option value="minigame">Tương tác / Minigame</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                        {language === 'vi' ? 'Địa điểm' : 'Location'}
                      </label>
                      {locations.length > 0 ? (
                        <select
                          value={editScheduleForm.locationId}
                          onChange={(e) => setEditScheduleForm({ ...editScheduleForm, locationId: e.target.value })}
                          style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem', background: '#FFFFFF' }}
                        >
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedScheduleDetail.location || 'Đường Sách TP.HCM'}
                          disabled
                          style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #E5EBE7', borderRadius: '8px', fontSize: '0.88rem', background: '#F8FAF9' }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                        {language === 'vi' ? 'Diễn giả / Khách mời' : 'Speaker / Host'}
                      </label>
                      <input maxLength={200}
                        type="text"
                        value={editScheduleForm.speaker}
                        onChange={(e) => setEditScheduleForm({ ...editScheduleForm, speaker: e.target.value })}
                        placeholder={language === 'vi' ? 'Tên diễn giả, MC...' : 'Speaker name'}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                        {language === 'vi' ? 'Số người tham dự dự kiến' : 'Expected attendees'}
                      </label>
                      <input step={1} max={2147483647}
                        type="number"
                        min={1}
                        value={editScheduleForm.capacity}
                        onChange={(e) => setEditScheduleForm({ ...editScheduleForm, capacity: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#172421', marginBottom: '0.35rem' }}>
                      {language === 'vi' ? 'Mô tả nội dung chi tiết' : 'Description'}
                    </label>
                    <textarea maxLength={20000}
                      rows={4}
                      value={editScheduleForm.description}
                      onChange={(e) => setEditScheduleForm({ ...editScheduleForm, description: e.target.value })}
                      placeholder={language === 'vi' ? 'Nội dung chi tiết chương trình...' : 'Detailed description...'}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #D1DDD8', borderRadius: '8px', fontSize: '0.88rem', lineHeight: 1.5 }}
                    />
                  </div>
                </div>

                {/* Modal Footer (Editing mode) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #EAEFEA',
                  background: '#F8FAF9'
                }}>
                  <button
                    type="button"
                    className="btn-org-secondary"
                    onClick={() => setIsEditingSchedule(false)}
                    style={{ padding: '0.5rem 1.25rem', fontWeight: 650, borderRadius: '8px' }}
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-org-primary"
                    disabled={savingSchedule}
                    style={{ padding: '0.5rem 1.5rem', fontWeight: 650, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={15} />
                    <span>{savingSchedule ? (language === 'vi' ? 'Đang lưu…' : 'Saving…') : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Modal Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Badges & Title */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#17382E',
                        background: '#E8F5EF',
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}>
                        {getActivityKindLabel(selectedScheduleDetail.type)}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 650,
                        color: '#15803D',
                        background: '#DCFCE7',
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}>
                        ● {selectedScheduleDetail.statusLabelVi || 'Đã duyệt'}
                      </span>
                    </div>

                    <h2 style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: 750,
                      color: '#172421',
                      lineHeight: '1.4',
                      fontFamily: 'var(--font-serif)'
                    }}>
                      {selectedScheduleDetail.title}
                    </h2>
                  </div>

                  {/* Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.85rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: '#F8FAF9',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #E5EBE7'
                    }}>
                      <Clock size={18} color="#17382E" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#637771', display: 'block', fontWeight: 600 }}>Thời gian diễn ra</span>
                        <strong style={{ fontSize: '0.88rem', color: '#172421' }}>
                          {selectedScheduleDetail.dateStr} · {selectedScheduleDetail.timeStr}
                        </strong>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: '#F8FAF9',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #E5EBE7'
                    }}>
                      <MapPin size={18} color="#17382E" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#637771', display: 'block', fontWeight: 600 }}>Địa điểm tổ chức</span>
                        <strong style={{ fontSize: '0.88rem', color: '#172421' }}>
                          {selectedScheduleDetail.location || 'Đường Sách TP.HCM'}
                        </strong>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: '#F8FAF9',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #E5EBE7'
                    }}>
                      <User size={18} color="#17382E" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#637771', display: 'block', fontWeight: 600 }}>Diễn giả / Khách mời</span>
                        <strong style={{ fontSize: '0.88rem', color: '#172421' }}>
                          {selectedScheduleDetail.speaker || 'Chưa cập nhật'}
                        </strong>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: '#F8FAF9',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #E5EBE7'
                    }}>
                      <Users size={18} color="#17382E" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#637771', display: 'block', fontWeight: 600 }}>Sức chứa & Tham gia</span>
                        <strong style={{ fontSize: '0.88rem', color: '#172421' }}>
                          Không giới hạn người tham dự
                          {selectedScheduleDetail.registeredCount > 0 ? ` (${selectedScheduleDetail.registeredCount} đã đăng ký)` : ''}
                        </strong>
                      </div>
                    </div>

                    {selectedScheduleDetail.partnerName && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        background: '#F8FAF9',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #E5EBE7',
                        gridColumn: '1 / -1'
                      }}>
                        <Building2 size={18} color="#17382E" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#637771', display: 'block', fontWeight: 600 }}>Đơn vị tổ chức / Đối tác</span>
                          <strong style={{ fontSize: '0.88rem', color: '#172421' }}>
                            {selectedScheduleDetail.partnerName}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description Box */}
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#172421', display: 'block', marginBottom: '0.45rem' }}>
                      Nội dung chương trình / Lịch trình chi tiết
                    </span>
                    <div style={{
                      padding: '1rem',
                      background: '#FDFEFE',
                      border: '1px solid #E5EBE7',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      color: '#374151',
                      minHeight: '70px',
                      whiteSpace: 'pre-line'
                    }}>
                      {selectedScheduleDetail.description || 'Chưa có thông tin mô tả chi tiết cho lịch trình này.'}
                    </div>
                  </div>
                </div>

                {/* Modal Footer (View mode) */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #EAEFEA',
                  background: '#F8FAF9'
                }}>
                  <button
                    type="button"
                    className="btn-org-secondary"
                    onClick={() => setSelectedScheduleDetail(null)}
                    style={{ padding: '0.5rem 1.5rem', fontWeight: 650, borderRadius: '8px' }}
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                  <button
                    type="button"
                    className="btn-org-primary"
                    onClick={() => handleStartEditSchedule(selectedScheduleDetail)}
                    style={{ padding: '0.5rem 1.5rem', fontWeight: 650, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={15} />
                    <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
