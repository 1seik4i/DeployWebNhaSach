import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Map, 
  XCircle, 
  FileText, 
  Image as ImageIcon, 
  X,
  Send,
  Edit3,
  Check,
  Plus,
  Trash2,
  Upload,
  UploadCloud,
  Paperclip
} from 'lucide-react';
import { Language, PartnerBooth } from '../../types';
import { partnerApi } from '../../services/partnerApi';
import './PartnerPages.css';

interface BoothImageItem {
  id: string;
  url: string;
  caption: string;
}

interface BoothDocItem {
  id: string;
  name: string;
  size: string;
  dataUrl?: string;
}

export interface BoothManagementPageProps {
  language: Language;
  booth: PartnerBooth;
  onOpenAttendanceModal?: () => void;
  onRequestCancel?: (reason?: string) => void | Promise<unknown>;
}

export const BoothManagementPage: React.FC<BoothManagementPageProps> = ({
  language,
  booth: initialBooth,
  onOpenAttendanceModal,
  onRequestCancel,
}) => {
  const navigate = useNavigate();
  const [booth, setBooth] = useState<PartnerBooth>(initialBooth);
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'documents'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState<'none' | 'cancel'>('none');

  useModalBehavior(modalType !== 'none', () => setModalType('none'));
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Tab 1: Info State
  const [editName, setEditName] = useState(booth.name);
  const [editDescription, setEditDescription] = useState(booth.description);
  const [editDimensions, setEditDimensions] = useState(booth.dimensions);
  const [editAreaName, setEditAreaName] = useState(booth.areaName);
  const [editOpenHours, setEditOpenHours] = useState(booth.openHours || '08:00 - 22:00');
  const [editImageUrl, setEditImageUrl] = useState(booth.imageUrl || '');
  const [editCategories, setEditCategories] = useState<string[]>(booth.categories);
  const [newCatInput, setNewCatInput] = useState('');

  // Tab 2: Images State
  const [boothImages, setBoothImages] = useState<BoothImageItem[]>(booth.imageUrl ? [
    { id: `booth:${booth.id}`, url: booth.imageUrl, caption: booth.name }
  ] : []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  // Tab 4: Documents State
  const [boothDocs, setBoothDocs] = useState<BoothDocItem[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSize, setNewDocSize] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setBooth(initialBooth);
    partnerApi.getBoothContent(initialBooth.id).then(content => {
      setBooth(current => ({
        ...current,
        name: content.name || current.name,
        description: content.description || '',
        dimensions: content.dimensions || current.dimensions,
        areaName: content.areaName || current.areaName,
        categories: content.categories || [],
        openHours: content.openHours || current.openHours || '08:00 - 22:00',
        imageUrl: content.imageUrl || content.images?.[0]?.url || current.imageUrl,
      }));
      setEditOpenHours(content.openHours || initialBooth.openHours || '08:00 - 22:00');
      setEditImageUrl(content.imageUrl || content.images?.[0]?.url || initialBooth.imageUrl || '');
      setBoothImages(content.images || []);
      setBoothDocs(content.documents || []);
    }).catch(error => showToast(error instanceof Error ? error.message : 'Không tải được nội dung gian hàng'));
  }, [initialBooth.id]);

  const handleStartEdit = () => {
    setEditName(booth.name);
    setEditDescription(booth.description);
    setEditDimensions(booth.dimensions);
    setEditAreaName(booth.areaName);
    setEditOpenHours(booth.openHours || '08:00 - 22:00');
    setEditImageUrl(booth.imageUrl || '');
    setEditCategories([...booth.categories]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(booth.name);
    setEditDescription(booth.description);
    setEditDimensions(booth.dimensions);
    setEditAreaName(booth.areaName);
    setEditOpenHours(booth.openHours || '08:00 - 22:00');
    setEditImageUrl(booth.imageUrl || '');
    setEditCategories([...booth.categories]);
    setIsEditing(false);
  };

  const handleAddCategory = () => {
    if (newCatInput.trim() && !editCategories.includes(newCatInput.trim())) {
      setEditCategories(prev => [...prev, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setEditCategories(prev => prev.filter(c => c !== catToRemove));
  };

  const handleBoothPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result || '');
      setEditImageUrl(dataUrl);
      showToast(language === 'vi' ? 'Đã tải ảnh gian hàng mới! Bấm "Lưu thay đổi" để áp dụng.' : 'Image selected! Click Save to apply.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await partnerApi.updateBoothContent(booth.id, {
        name: editName.trim() || booth.name,
        description: editDescription.trim() || booth.description,
        dimensions: editDimensions.trim() || booth.dimensions,
        areaName: editAreaName.trim() || booth.areaName,
        openHours: editOpenHours.trim() || '08:00 - 22:00',
        imageUrl: editImageUrl.trim() || booth.imageUrl,
        categories: editCategories.length > 0 ? editCategories : booth.categories
      });
      setBooth(prev => ({
        ...prev,
        name: saved.name,
        description: saved.description,
        dimensions: saved.dimensions,
        areaName: saved.areaName,
        openHours: saved.openHours || editOpenHours,
        imageUrl: saved.imageUrl || editImageUrl || prev.imageUrl,
        categories: saved.categories
      }));
      setIsEditing(false);
      showToast(language === 'vi' ? 'Đã lưu thay đổi thông tin gian hàng thành công!' : 'Booth info updated successfully!');
      window.dispatchEvent(new Event('duongsach:data-changed'));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể lưu thông tin gian hàng');
    }
  };

  // Image actions
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    const next = [...boothImages, { id: crypto.randomUUID(), url: newImageUrl.trim(), caption: newImageCaption.trim() }];
    try {
      await partnerApi.updateBoothContent(booth.id, { images: next });
      setBoothImages(next); setNewImageUrl(''); setNewImageCaption('');
      showToast(language === 'vi' ? 'Đã thêm hình ảnh mới!' : 'New photo added!');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể thêm hình ảnh'); }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const additions = await Promise.all(Array.from(files).map((file, index) => new Promise<BoothImageItem>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve({ id: `${crypto.randomUUID()}-${index}`, url: String(event.target?.result || ''), caption: file.name.replace(/\.[^/.]+$/, '') });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    try {
      const next = [...boothImages, ...additions];
      await partnerApi.updateBoothContent(booth.id, { images: next });
      setBoothImages(next);
      showToast(language === 'vi' ? `Đã tải lên ${files.length} hình ảnh từ máy!` : `Uploaded ${files.length} images!`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể tải hình ảnh'); }
    e.target.value = '';
  };

  const handleRemoveImage = async (id: string) => {
    const next = boothImages.filter(img => img.id !== id);
    try { await partnerApi.updateBoothContent(booth.id, { images: next }); setBoothImages(next); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Không thể xóa hình ảnh'); }
  };

  // Document actions
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const next = [...boothDocs, {
        id: crypto.randomUUID(),
        name: newDocName.trim().endsWith('.pdf') ? newDocName.trim() : `${newDocName.trim()}.pdf`,
        size: newDocSize
      }];
    try { await partnerApi.updateBoothContent(booth.id, { documents: next }); setBoothDocs(next); setNewDocName(''); showToast(language === 'vi' ? 'Đã lưu tài liệu mới!' : 'Document added!'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Không thể lưu tài liệu'); }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const additions = await Promise.all(Array.from(files).map((file, index) => new Promise<BoothDocItem>((resolve, reject) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = parseFloat(sizeInMB) >= 0.1 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
      const reader = new FileReader();
      reader.onload = event => resolve({ id: `${crypto.randomUUID()}-${index}`, name: file.name, size: sizeStr, dataUrl: String(event.target?.result || '') });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    try { const next = [...boothDocs, ...additions]; await partnerApi.updateBoothContent(booth.id, { documents: next }); setBoothDocs(next); showToast(language === 'vi' ? `Đã lưu ${files.length} tài liệu!` : `Uploaded ${files.length} files!`); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Không thể lưu tài liệu'); }
    e.target.value = '';
  };

  const handleRemoveDoc = async (id: string) => {
    const next = boothDocs.filter(d => d.id !== id);
    try { await partnerApi.updateBoothContent(booth.id, { documents: next }); setBoothDocs(next); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Không thể xóa tài liệu'); }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (onRequestCancel) {
        await onRequestCancel(requestReason);
      }
      setRequestSubmitted(true);
      setTimeout(() => {
        setRequestSubmitted(false);
        setModalType('none');
        setRequestReason('');
      }, 2000);
      window.dispatchEvent(new Event('duongsach:data-changed'));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể gửi yêu cầu');
    }
  };

  return (
    <div className="booth-management-page">
      {/* Toast Notification */}
      {toastMessage && (
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
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={20} color="#E9BC63" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header matching Sketch Screen 4 */}
      <div className="partner-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="partner-page-title">
            {language === 'vi' ? 'Quản lý gian hàng' : 'Booth Management'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Quản lý thông tin gian hàng chính thức, hình ảnh trưng bày và tài liệu pháp lý.' 
              : 'Manage assigned booth information, display images, and documents.'}
          </p>
        </div>

        <div className="partner-page-header-actions">
          <button
            type="button"
            className="btn-part-secondary"
            onClick={() => navigate('/partner/booths/select')}
          >
            <Map size={15} />
            <span>{language === 'vi' ? 'Xem trên bản đồ' : 'View on Map'}</span>
          </button>
          
          <button
            type="button"
            className="btn-part-primary"
            onClick={() => {
              if (isEditing) {
                handleCancelEdit();
              } else {
                handleStartEdit();
              }
            }}
          >
            <Edit3 size={15} />
            <span>{isEditing ? (language === 'vi' ? 'Hủy chỉnh sửa' : 'Cancel') : (language === 'vi' ? 'Chỉnh sửa' : 'Edit Booth')}</span>
          </button>
        </div>
      </div>

      {/* 2. Booth Detail Card matching Sketch Screen 4 */}
      <div className="booth-detail-card">
        <div>
          <img 
            src={booth.imageUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80'} 
            alt={booth.name} 
            className="booth-photo-preview"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>

        <div className="booth-detail-content">
          <div>
            <div className="booth-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="booth-code-badge">
                {booth.code}
              </span>
              <h2 className="booth-name-heading">
                {booth.name}
              </h2>
            </div>

            <div className="booth-specs-row">
              {booth.areaName && (
                <div className="booth-spec-pill">
                  <strong>{language === 'vi' ? 'Khu vực:' : 'Area:'}</strong> {booth.areaName}
                </div>
              )}

              <div className="booth-spec-pill" style={{ borderColor: '#E9BC63', background: '#FDFBF7' }}>
                <strong style={{ color: '#B3862A' }}>{language === 'vi' ? '⏰ Khung giờ hoạt động:' : '⏰ Hours:'}</strong> {booth.openHours || '08:00 - 22:00'}
              </div>
            </div>
          </div>

          <div className="booth-card-actions">
            <button
              type="button"
              className="btn-part-secondary"
              onClick={() => navigate('/partner/booths/select')}
            >
              <Map size={15} />
              <span>{language === 'vi' ? 'Xem trên bản đồ' : 'View on Map'}</span>
            </button>
            <button
              type="button"
              className="btn-part-danger"
              onClick={() => setModalType('cancel')}
            >
              <XCircle size={15} />
              <span>{language === 'vi' ? 'Yêu cầu hủy gian hàng' : 'Request Cancellation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation matching Sketch Screen 4 */}
      <div className="partner-card-pad" style={{ background: '#FFFFFF', border: '1px solid #E2EAE5', borderRadius: '14px' }}>
        <div className="partner-tabs-bar">
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'info' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            {language === 'vi' ? 'Thông tin chung' : 'General Info'}
          </button>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'images' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            {language === 'vi' ? 'Hình ảnh' : 'Images'}
          </button>
          <button
            type="button"
            className={`partner-tab-btn ${activeTab === 'documents' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            {language === 'vi' ? 'Hồ sơ pháp lý' : 'Documents'}
          </button>
        </div>

        {/* Tab 1: General Info */}
        {activeTab === 'info' && (
          isEditing ? (
            <form onSubmit={handleSaveInfo} style={{ maxWidth: '780px' }}>
              {/* Ảnh đại diện gian hàng */}
              <div className="form-field-group" style={{ background: '#FAFBFB', border: '1px solid #E5EBE8', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 750, color: '#17382E', marginBottom: '0.5rem', display: 'block' }}>
                  {language === 'vi' ? 'Ảnh đại diện gian hàng (Hiển thị Landing page)' : 'Booth Cover Photo (Landing page)'}
                </label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {editImageUrl ? (
                    <img
                      src={editImageUrl}
                      alt="Xem trước ảnh gian hàng"
                      style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #D5E0DB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    />
                  ) : (
                    <div style={{ width: '150px', height: '100px', background: '#EDF2EF', borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#758880', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>
                      Chưa có ảnh đại diện
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label className="btn-part-secondary" style={{ cursor: 'pointer', padding: '0.45rem 0.9rem', fontSize: '0.84rem', margin: 0 }}>
                        <Upload size={14} />
                        <span>{language === 'vi' ? 'Tải ảnh từ máy' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleBoothPhotoUpload}
                        />
                      </label>
                      {editImageUrl && (
                        <button
                          type="button"
                          className="btn-part-secondary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.84rem', color: '#DC2626' }}
                          onClick={() => setEditImageUrl('')}
                        >
                          <Trash2 size={14} />
                          <span>Gỡ ảnh</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Khung giờ hoạt động */}
              <div className="form-field-group" style={{ background: '#FAFBFB', border: '1px solid #E5EBE8', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 750, color: '#17382E', marginBottom: '0.35rem', display: 'block' }}>
                  {language === 'vi' ? '⏰ Khung giờ hoạt động (Hiển thị Landing page) *' : '⏰ Operating Hours (Landing page) *'}
                </label>
                <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.82rem', color: '#5C7068' }}>
                  {language === 'vi' ? 'Khung giờ đón bạn đọc và khách tham quan tại gian hàng sẽ xuất hiện trực tiếp trên thẻ gian hàng ở trang chủ.' : 'Opening hours displayed on the stall card on landing page.'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    value={['08:00 - 22:00', '08:30 - 21:30', '09:00 - 22:00', '08:00 - 21:00', '08:00 - 22:30'].includes(editOpenHours) ? editOpenHours : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setEditOpenHours(e.target.value);
                      }
                    }}
                    style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid #D5E0DB', fontSize: '0.88rem' }}
                  >
                    <option value="08:00 - 22:00">08:00 - 22:00 (Tiêu chuẩn Đường Sách)</option>
                    <option value="08:30 - 21:30">08:30 - 21:30</option>
                    <option value="09:00 - 22:00">09:00 - 22:00</option>
                    <option value="08:00 - 21:00">08:00 - 21:00</option>
                    <option value="08:00 - 22:30">08:00 - 22:30 (Cuối tuần & Ngày lễ)</option>
                    <option value="custom">Tự nhập khung giờ khác...</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={editOpenHours}
                    onChange={(e) => setEditOpenHours(e.target.value)}
                    placeholder="Ví dụ: 08:00 - 22:00"
                    style={{ padding: '0.65rem', borderRadius: '8px', border: '1px solid #D5E0DB', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>{language === 'vi' ? 'Tên gian hàng *' : 'Booth Name *'}</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ví dụ: Gian B03 - Không gian nghệ thuật"
                />
              </div>

              <div className="form-field-group">
                <label>{language === 'vi' ? 'Khu vực gian hàng *' : 'Booth Area *'}</label>
                <input 
                  type="text"
                  required
                  value={editAreaName}
                  onChange={(e) => setEditAreaName(e.target.value)}
                  placeholder="Ví dụ: Khu A"
                />
              </div>

              <div className="form-field-group">
                <label>{language === 'vi' ? 'Mô tả gian hàng *' : 'Booth Description *'}</label>
                <textarea 
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả nội dung, sách hoặc ấn phẩm trưng bày tại gian hàng..."
                />
              </div>

              {/* Danh mục ngành hàng trưng bày */}
              <div className="form-field-group">
                <label>{language === 'vi' ? 'Danh mục ngành hàng trưng bày' : 'Display Categories'}</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  {editCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FAF8F3',
                        border: '1px solid #EFE8D8',
                        color: '#8C6519',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>{cat}</span>
                      <X 
                        size={13} 
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => handleRemoveCategory(cat)}
                      />
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Thêm danh mục mới (Enter hoặc bấm +)..."
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn-part-secondary"
                    onClick={handleAddCategory}
                    style={{ padding: '0 0.85rem' }}
                  >
                    <Plus size={15} />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #EEF2F0', paddingTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn-part-secondary"
                  onClick={handleCancelEdit}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="btn-part-primary">
                  <Check size={16} />
                  <span>{language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAF9', borderRadius: '12px', border: '1px solid #E5EBE8' }}>
                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#728880', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'vi' ? '⏰ Khung giờ hoạt động' : '⏰ Operating Hours'}
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 750, color: '#17382E', marginTop: '0.25rem' }}>
                    {booth.openHours || '08:00 - 22:00 (Tiêu chuẩn)'}
                  </div>
                  <small style={{ color: '#687D75', fontSize: '0.78rem' }}>Được cập nhật tự động lên thẻ gian hàng tại Landing page.</small>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#728880', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'vi' ? '📍 Khu vực gian hàng' : '📍 Booth Area'}
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 750, color: '#17382E', marginTop: '0.25rem' }}>
                    {booth.areaName || 'Khu A'}
                  </div>
                  <small style={{ color: '#687D75', fontSize: '0.78rem' }}>Vị trí phân bổ tại Đường Sách.</small>
                </div>

                <div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#728880', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'vi' ? '🖼️ Ảnh đại diện gian hàng' : '🖼️ Cover Photo'}
                  </span>
                  <div style={{ fontSize: '0.88rem', color: '#2C4A3E', marginTop: '0.25rem' }}>
                    {booth.imageUrl ? '✓ Đã thiết lập ảnh riêng' : 'Dùng ảnh mặc định của Đường Sách'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172421', marginBottom: '0.65rem' }}>
                  {language === 'vi' ? 'Mô tả gian hàng' : 'Booth Description'}
                </h3>
                <p style={{ color: '#495D57', lineHeight: 1.6, fontSize: '0.9rem', margin: 0, maxWidth: '800px' }}>
                  {booth.description}
                </p>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#172421', marginBottom: '0.65rem' }}>
                {language === 'vi' ? 'Danh mục ngành hàng trưng bày' : 'Display Categories'}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {booth.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #EFE8D8',
                      color: '#8C6519',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px'
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )
        )}

        {/* Tab 2: Images */}
        {activeTab === 'images' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ color: '#556B65', fontSize: '0.88rem', margin: 0 }}>
                {language === 'vi' ? `Hình ảnh phối cảnh và hình thực tế của gian hàng (${boothImages.length} ảnh).` : 'Booth rendering and setup photos.'}
              </p>
            </div>

            {/* List of images */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {boothImages.map(img => (
                <div 
                  key={img.id} 
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E2EAE5',
                    background: '#FAF8F3',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <img 
                    src={img.url} 
                    alt={img.caption} 
                    style={{ width: '100%', height: '170px', objectFit: 'cover' }} 
                  />
                  <div style={{ padding: '0.75rem', fontSize: '0.84rem', fontWeight: 650, color: '#172421' }}>
                    {img.caption}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      title="Xóa hình ảnh này"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Form & Upload hình ảnh khi đang ở chế độ chỉnh sửa */}
            {isEditing && (
              <div style={{ background: '#FAF8F3', border: '1px solid #EAE0CE', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 750, color: '#172421', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ImageIcon size={16} color="#B3862A" />
                    <span>{language === 'vi' ? 'Thêm hình ảnh gian hàng mới' : 'Add New Booth Image'}</span>
                  </h4>
                </div>

                {/* Upload từ máy tính / thiết bị */}
                <label 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1.5rem 1rem',
                    border: '2px dashed #B3862A',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBF8F1')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageFileUpload}
                  />
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FAF8F3', border: '1px solid #EAE0CE', display: 'grid', placeItems: 'center' }}>
                    <UploadCloud size={20} color="#B3862A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#17382E' }}>
                      {language === 'vi' ? 'Bấm vào đây để chọn ảnh từ máy tính' : 'Click to browse images from your device'}
                    </span>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#7E928B' }}>
                      {language === 'vi' ? 'Hỗ trợ PNG, JPG, JPEG, WEBP (Có thể chọn nhiều ảnh cùng lúc)' : 'Supports PNG, JPG, JPEG, WEBP'}
                    </p>
                  </div>
                </label>

                {/* Hoặc nhập URL */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EAE0CE' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#8C6519', textTransform: 'uppercase' }}>
                    {language === 'vi' ? 'Hoặc thêm bằng đường dẫn (URL)' : 'Or add via URL'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#EAE0CE' }} />
                </div>

                <form onSubmit={handleAddImage}>
                  <div className="form-row-2col">
                    <div className="form-field-group">
                      <label>{language === 'vi' ? 'Đường dẫn ảnh (URL) *' : 'Image URL *'}</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="url" 
                          required 
                          value={newImageUrl} 
                          onChange={(e) => setNewImageUrl(e.target.value)} 
                          placeholder="/assets/heritage/ds-01.jpg" 
                          style={{ flex: 1 }}
                        />
                        <label className="btn-part-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.62rem 0.9rem', fontSize: '0.84rem' }} title={language === 'vi' ? 'Tải ảnh từ máy tính' : 'Upload from device'}>
                          <Upload size={14} />
                          <span>{language === 'vi' ? 'Tải ảnh' : 'Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setNewImageUrl(String(reader.result || ''));
                                  if (!newImageCaption) setNewImageCaption(file.name.replace(/\.[^/.]+$/, ''));
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                    <div className="form-field-group">
                      <label>{language === 'vi' ? 'Chú thích ảnh' : 'Caption'}</label>
                      <input 
                        type="text" 
                        value={newImageCaption} 
                        onChange={(e) => setNewImageCaption(e.target.value)} 
                        placeholder="Ví dụ: Góc trưng bày sản phẩm chủ đạo" 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-part-primary" style={{ padding: '0.55rem 1.15rem' }}>
                      <Plus size={15} />
                      <span>{language === 'vi' ? 'Thêm ảnh URL' : 'Add URL Photo'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ color: '#556B65', fontSize: '0.88rem', margin: 0 }}>
                {language === 'vi' ? 'Biên bản bàn giao mặt bằng, cam kết PCCC và hồ sơ pháp lý.' : 'Signed booth agreements and fire safety protocols.'}
              </p>
            </div>

            {/* Docs list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {boothDocs.map(doc => (
                <div 
                  key={doc.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem', 
                    background: '#F8FAF9', 
                    borderRadius: '10px',
                    border: '1px solid #E2EAE5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FileText size={20} color="#17382E" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#172421' }}>{doc.name}</div>
                      <span style={{ fontSize: '0.78rem', color: '#7E928B' }}>Dung lượng: {doc.size}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="btn-part-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => showToast(language === 'vi' ? `Đang tải xuống ${doc.name}...` : `Downloading ${doc.name}...`)}
                    >
                      Tải về
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Xóa tài liệu này"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form & Upload tài liệu khi ở chế độ chỉnh sửa */}
            {isEditing && (
              <div style={{ background: '#FAF8F3', border: '1px solid #EAE0CE', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 750, color: '#172421', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} color="#B3862A" />
                    <span>{language === 'vi' ? 'Đính kèm thêm tài liệu / Biên bản' : 'Attach Document'}</span>
                  </h4>
                </div>

                {/* Upload tập tin từ máy */}
                <label 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1.5rem 1rem',
                    border: '2px dashed #B3862A',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBF8F1')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" 
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleDocFileUpload}
                  />
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FAF8F3', border: '1px solid #EAE0CE', display: 'grid', placeItems: 'center' }}>
                    <UploadCloud size={20} color="#B3862A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#17382E' }}>
                      {language === 'vi' ? 'Bấm vào đây để tải tập tin tài liệu từ máy tính' : 'Click to browse document files from your device'}
                    </span>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#7E928B' }}>
                      {language === 'vi' ? 'Hỗ trợ PDF, DOC, DOCX, XLSX (Tự động nhận diện tên và dung lượng file)' : 'Supports PDF, DOC, DOCX, XLSX'}
                    </p>
                  </div>
                </label>

                {/* Hoặc nhập thủ công */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EAE0CE' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#8C6519', textTransform: 'uppercase' }}>
                    {language === 'vi' ? 'Hoặc nhập thông tin tập tin thủ công' : 'Or enter manually'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#EAE0CE' }} />
                </div>

                <form onSubmit={handleAddDoc}>
                  <div className="form-row-2col">
                    <div className="form-field-group">
                      <label>{language === 'vi' ? 'Tên tập tin tài liệu *' : 'Document Name *'}</label>
                      <input 
                        type="text" 
                        required 
                        value={newDocName} 
                        onChange={(e) => setNewDocName(e.target.value)} 
                        placeholder="Ví dụ: Hop-dong-thue-gian-hang-2026.pdf" 
                      />
                    </div>
                    <div className="form-field-group">
                      <label>{language === 'vi' ? 'Dung lượng ước tính' : 'File Size'}</label>
                      <input 
                        type="text" 
                        value={newDocSize} 
                        onChange={(e) => setNewDocSize(e.target.value)} 
                        placeholder="1.5 MB" 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button type="submit" className="btn-part-primary" style={{ padding: '0.55rem 1.15rem' }}>
                      <Plus size={15} />
                      <span>{language === 'vi' ? 'Thêm tài liệu' : 'Add Document'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Request Cancellation */}
      {modalType === 'cancel' && (
        <div className="attendance-modal-overlay" onClick={() => setModalType('none')}>
          <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="attendance-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#172421', fontFamily: 'var(--font-serif)' }}>
                {language === 'vi' ? 'Yêu cầu hủy gian hàng' : 'Request Booth Cancellation'}
              </h3>
              <button 
                type="button" 
                onClick={() => setModalType('none')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#637771' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="attendance-modal-body">
              {requestSubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <CheckCircle2 size={46} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.4rem 0', color: '#172421' }}>
                    {language === 'vi' ? 'Yêu cầu đã được gửi thành công!' : 'Request submitted!'}
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: '#556B65' }}>
                    {language === 'vi' 
                      ? 'Ban Quản Lý sẽ xem xét và phản hồi qua mục Thông báo trong vòng 24 giờ.'
                      : 'Management will review and respond within 24 hours.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest}>
                  <p style={{ fontSize: '0.86rem', color: '#556B65', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {language === 'vi'
                      ? 'Lưu ý: Việc hủy gian hàng cần được gửi trước 10 ngày trước lễ hội theo quy chế của Ban Quản Lý.'
                      : 'Please note cancellation policies apply.'}
                  </p>

                  <div className="form-field-group">
                    <label>{language === 'vi' ? 'Lý do yêu cầu *' : 'Reason *'}</label>
                    <textarea 
                      rows={4}
                      required 
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập lý do chi tiết...' : 'Enter your detailed reason...'}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button 
                      type="button" 
                      className="btn-part-secondary"
                      onClick={() => setModalType('none')}
                    >
                      {language === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                    <button type="submit" className="btn-part-primary">
                      <Send size={15} />
                      <span>{language === 'vi' ? 'Gửi yêu cầu' : 'Submit Request'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

