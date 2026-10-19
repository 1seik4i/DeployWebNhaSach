import { AdminPageHeading } from '../admin/AdminPageHeading';
import { useUrlTab } from '../../hooks/useUrlTab';
import { notifyModal } from '../../services/notificationModal';
import { imageFileError } from '../../utils/fileValidation';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination } from '../ui/ListPagination';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw,
  CheckCircle,
  X,
  Upload,
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Store,
  Building2,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerBoothItem, OrganizerEvent } from '../../types/organizer';
import { MapLocationPoint } from '../../types/map';
import { facilityRequest } from '../../services/facilities';
import { notifyBoothsChanged } from '../../services/booths';
import {
  saveSharedMapPoints,
  getSharedMapImage, 
  MAX_MAP_IMAGE_MB,
  fetchMapHotspotsFromApi,
} from '../../services/mapService';

interface BoothMapViewProps {
  language: Language;
  events?: OrganizerEvent[];
  selectedEventId?: string;
  onSelectEventId?: (id: string) => void;
  booths?: OrganizerBoothItem[];
  onBackToList?: () => void;
  onApproveBooth?: (boothId: string) => void;
  onRejectBooth?: (boothId: string) => void;
}

interface LocalBoothItem {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  orgName?: string;
  category?: MapLocationPoint['category'];
  zone: string;
  areaType?: string;
  dimensions: string;
  status: OrganizerBoothItem['status'];
  statusLabelVi: string;
  x: number | null;
  y: number | null;
  shortDesc?: string;
  imageUrl?: string;
  openHours?: string;
}

interface SelectedBoothState {
  booth: LocalBoothItem;
}

export const BoothMapView: React.FC<BoothMapViewProps> = ({
  language,
}) => {
  const [localBooths, setLocalBooths] = useState<LocalBoothItem[]>([]);
  const [venuePoints, setVenuePoints] = useState<MapLocationPoint[]>([]);

  const [selectedBooth, setSelectedBooth] = useState<SelectedBoothState | null>(null);
  const [selectedVenuePoint, setSelectedVenuePoint] = useState<MapLocationPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapImageUrl, setMapImageUrl] = useState<string>(() => getSharedMapImage());
  const pendingMapImage = useRef<string | null>(null);
  const [hasPendingImage, setHasPendingImage] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    markerId: string | null;
    kind: 'booth' | 'venue' | null;
    startX: number;
    startY: number;
    hasMoved: boolean;
  }>({
    markerId: null,
    kind: null,
    startX: 0,
    startY: 0,
    hasMoved: false
  });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table filter and pagination states
  const [activeTab, setActiveTab] = useUrlTab(['all', 'assigned', 'available'], 'all', 'section');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const reloadMap = () => {
      void fetchMapHotspotsFromApi().then(points => {
        const boothPoints = points.filter(point => point.category === 'booth');
        // The map endpoint is the sole source here, so marker count, legend count and
        // database scope are always the same even when another admin screen is stale.
        setLocalBooths(boothPoints.map(point => ({
          id: point.id,
          code: point.code,
          name: point.name,
          nameEn: point.nameEn,
          orgName: point.orgName,
          category: 'booth',
          zone: point.zone || '',
          areaType: point.areaType,
          dimensions: point.dimensions || '',
          status: point.status === 'on_hold' ? 'pending' : point.status,
          statusLabelVi: point.statusLabelVi,
          x: point.x,
          y: point.y,
          shortDesc: point.shortDesc,
          imageUrl: point.imageUrl,
          openHours: point.openHours,
        })));
        setVenuePoints(points.filter(point => point.category !== 'booth'));
        if (!pendingMapImage.current) setMapImageUrl(getSharedMapImage());
      }).catch((error) => {
        console.error('Không thể tải cấu hình sơ đồ', error);
      });
    };
    reloadMap();
    window.addEventListener('duongsach:data-changed', reloadMap);
    return () => window.removeEventListener('duongsach:data-changed', reloadMap);
  }, []);

  const [isSaved, setIsSaved] = useState(false);

  // Add location modals state
  const [addModalType, setAddModalType] = useState<'booth' | 'venue' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useModalBehavior(Boolean(addModalType), () => setAddModalType(null), isSubmitting);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [boothForm, setBoothForm] = useState({
    code: '',
    name: '',
    campus: 'Đường Nguyễn Văn Bình, Bến Nghé, Quận 1',
    areaName: 'Khu A',
    dimensions: '3m x 3m',
    openHours: '08:00 – 22:00',
    description: '',
  });

  const [venueForm, setVenueForm] = useState({
    code: '',
    name: '',
    campus: 'Đường Nguyễn Văn Bình, Bến Nghé, Quận 1',
    kind: 'main_stage' as 'main_stage' | 'workshop_area' | 'reading_area' | 'other',
    capacity: 100,
    description: '',
  });

  const handleOpenAddBooth = () => {
    setFormError('');
    const existingNums = localBooths
      .map(b => {
        const match = b.code.match(/B-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : localBooths.length + 1;
    const suggestedCode = `B-${nextNum < 10 ? `0${nextNum}` : nextNum}`;

    setBoothForm({
      code: suggestedCode,
      name: '',
      campus: 'Đường Nguyễn Văn Bình, Bến Nghé, Quận 1',
      areaName: 'Khu B',
      dimensions: '3m x 3m',
      openHours: '08:00 – 22:00',
      description: '',
    });
    setAddModalType('booth');
  };

  const handleOpenAddVenue = () => {
    setFormError('');
    const nextIdx = venuePoints.length + 1;
    const suggestedCode = `LOC-STAGE-0${nextIdx}`;

    setVenueForm({
      code: suggestedCode,
      name: '',
      campus: 'Đường Nguyễn Văn Bình, Bến Nghé, Quận 1',
      kind: 'main_stage',
      capacity: 100,
      description: '',
    });
    setAddModalType('venue');
  };

  const handleSubmitBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothForm.name.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng nhập tên gian hàng' : 'Please enter booth name');
      return;
    }
    if (!boothForm.code.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng nhập mã gian hàng' : 'Please enter booth code');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await facilityRequest<any>('booths', {
        method: 'POST',
        body: JSON.stringify({
          name: boothForm.name.trim(),
          code: boothForm.code.trim(),
          campus: boothForm.campus.trim(),
          areaName: boothForm.areaName.trim() || undefined,
          dimensions: boothForm.dimensions.trim() || undefined,
          openHours: boothForm.openHours.trim() || undefined,
          description: boothForm.description.trim() || undefined,
          x: 50,
          y: 50,
        }),
      });

      const newBooth: LocalBoothItem = {
        id: res.id || `booth-${Date.now()}`,
        code: res.code || boothForm.code.trim(),
        name: res.name || boothForm.name.trim(),
        category: 'booth',
        zone: boothForm.areaName.trim() || 'Khu B',
        dimensions: boothForm.dimensions.trim() || '3m x 3m',
        status: 'available',
        statusLabelVi: 'Còn trống',
        x: 50,
        y: 50,
        shortDesc: boothForm.description.trim(),
        openHours: boothForm.openHours.trim() || '08:00 – 22:00',
      };

      setLocalBooths(prev => [...prev, newBooth]);
      setSelectedBooth({ booth: newBooth });
      setAddModalType(null);
      notifyBoothsChanged();
      window.dispatchEvent(new Event('duongsach:data-changed'));
      setSuccessToast(language === 'vi' ? 'Đã thêm gian hàng mới! Kéo thả điểm trên sơ đồ để đặt vị trí mong muốn.' : 'New booth added! Drag marker on map to position.');
      setTimeout(() => setSuccessToast(''), 4500);
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo gian hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueForm.name.trim() || !venueForm.code.trim() || !Number.isInteger(Number(venueForm.capacity)) || Number(venueForm.capacity) < 1) {
      setFormError(language === 'vi' ? 'Vui lòng nhập tên địa điểm' : 'Please enter venue name');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await facilityRequest<any>('locations', {
        method: 'POST',
        body: JSON.stringify({
          name: venueForm.name.trim(),
          code: venueForm.code.trim() || undefined,
          capacity: Number(venueForm.capacity),
          kind: venueForm.kind,
          zone: venueForm.campus.trim(),
          x: 50,
          y: 35,
        }),
      });

      const newPoint: MapLocationPoint = {
        id: res.id || `venue-${Date.now()}`,
        code: venueForm.code.trim() || 'LOC-NEW',
        name: venueForm.name.trim(),
        category: venueForm.kind === 'main_stage' ? 'stage' : 'facility',
        status: 'available',
        statusLabelVi: 'Địa điểm tổ chức',
        x: 50,
        y: 35,
        capacity: Number(venueForm.capacity),
        shortDesc: `${venueForm.name.trim()} · Sức chứa: ${venueForm.capacity} người`,
      } as any;

      setVenuePoints(prev => [...prev, newPoint]);
      setAddModalType(null);
      window.dispatchEvent(new Event('duongsach:data-changed'));
      setSuccessToast(language === 'vi' ? 'Đã thêm địa điểm tổ chức mới! Kéo thả điểm trên sơ đồ để đặt vị trí.' : 'New venue added! Drag marker on map to position.');
      setTimeout(() => setSuccessToast(''), 4500);
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo địa điểm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep the map image synchronized after the server confirms an update.
  useEffect(() => {
    const handleImageUpdate = (e: any) => {
      if (e.detail?.imageUrl && !pendingMapImage.current) {
        setMapImageUrl(e.detail.imageUrl);
      }
    };
    window.addEventListener('duongsach_map_image_updated', handleImageUpdate);
    return () => {
      window.removeEventListener('duongsach_map_image_updated', handleImageUpdate);
    };
  }, []);

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBooth(null);
        setSelectedVenuePoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep edits local until the administrator explicitly saves the map.
  const syncAndSave = (updatedList: LocalBoothItem[]) => {
    setLocalBooths(updatedList);
  };

  // Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragInfoRef.current;
      if (!drag.markerId || !drag.kind || !mapContainerRef.current) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (!drag.hasMoved) {
        if (Math.hypot(dx, dy) < 4) return;
        drag.hasMoved = true;
        setDraggingMarkerId(drag.markerId);
      }
      
      const rect = mapContainerRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp coordinates
      x = Math.max(0, Math.min(100, Math.round(x * 10) / 10));
      y = Math.max(0, Math.min(100, Math.round(y * 10) / 10));

      const targetId = drag.markerId;
      if (drag.kind === 'booth') {
        setLocalBooths(prev => prev.map(b => b.id === targetId ? { ...b, x, y } : b));
        setSelectedBooth(prev => (prev && prev.booth.id === targetId) ? { booth: { ...prev.booth, x, y } } : prev);
      } else {
        setVenuePoints(prev => prev.map(point => point.id === targetId ? { ...point, x, y } : point));
      }
    };

    const handleMouseUp = () => {
      const drag = dragInfoRef.current;
      if (drag.markerId) {
        if (drag.hasMoved) {
          // Persist on drag end
          setLocalBooths(current => {
            syncAndSave(current);
            return current;
          });
        }
        setDraggingMarkerId(null);
        setTimeout(() => {
          dragInfoRef.current = {
            markerId: null,
            kind: null,
            startX: 0,
            startY: 0,
            hasMoved: false
          };
        }, 50);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleBoothClick = (b: LocalBoothItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragInfoRef.current.hasMoved) return;
    setSelectedBooth(prev => (prev?.booth.id === b.id ? null : { booth: b }));
  };

  const handleBoothMouseDown = (b: LocalBoothItem, e: React.MouseEvent) => {
    e.stopPropagation();
    dragInfoRef.current = {
      markerId: b.id,
      kind: 'booth',
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };
  };

  const handleVenueMouseDown = (point: MapLocationPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    dragInfoRef.current = {
      markerId: point.id,
      kind: 'venue',
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
  };

  const handleSaveMap = async () => {
    if (isSavingMap || isReadingImage) return;
    setIsSavingMap(true);
    try {
      const boothPoints = localBooths.filter(b => b.x != null && b.y != null).map(b => ({
        id: b.id, code: b.code, name: b.name, nameEn: b.nameEn, orgName: b.orgName,
        category: b.category || 'booth', zone: b.zone, areaType: b.areaType,
        dimensions: b.dimensions, status: b.status, statusLabelVi: b.statusLabelVi,
        x: b.x!, y: b.y!, shortDesc: b.shortDesc, imageUrl: b.imageUrl, openHours: b.openHours,
      }));
      await saveSharedMapPoints([...boothPoints, ...venuePoints], pendingMapImage.current ?? undefined);
      pendingMapImage.current = null;
      setHasPendingImage(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      void notifyModal(error instanceof Error ? error.message : 'Không thể lưu sơ đồ');
    } finally {
      setIsSavingMap(false);
    }
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (isSavingMap || isReadingImage) return;
    if (file) {
      const error = imageFileError(file, MAX_MAP_IMAGE_MB);
      if (error) { void notifyModal(error); e.target.value = ''; return; }
      setIsReadingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          pendingMapImage.current = result;
          setMapImageUrl(result);
          setHasPendingImage(true);
          setIsSaved(false);
        }
        setIsReadingImage(false);
      };
      reader.onerror = () => {
        setIsReadingImage(false);
        void notifyModal(language === 'vi' ? 'Không thể đọc ảnh. Vui lòng chọn lại tệp.' : 'Unable to read image. Please select it again.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter booths for table
  const filteredBooths = localBooths.filter(b => {
    if (selectedBooth) {
      return b.id === selectedBooth.booth.id;
    }
    if (activeTab === 'assigned' && b.status !== 'assigned') return false;
    if (activeTab === 'available' && b.status !== 'available') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().normalize('NFC').toLowerCase();
      return b.name.normalize('NFC').toLowerCase().includes(q) || b.code.normalize('NFC').toLowerCase().includes(q) || (b.orgName && b.orgName.normalize('NFC').toLowerCase().includes(q));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage) || 1;
  const paginatedBooths = selectedBooth 
    ? filteredBooths 
    : filteredBooths.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusChip = (status: LocalBoothItem['status']) => {
    if (status === 'assigned') {
      return <span className="org-chip" style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB' }}>● {language === 'vi' ? 'Đã thuê' : 'Assigned'}</span>;
    }
    if (status === 'pending') {
      return <span className="org-chip" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>● {language === 'vi' ? 'Đang giữ chỗ' : 'Pending'}</span>;
    }
    if (status === 'unavailable') {
      return <span className="org-chip" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>● {language === 'vi' ? 'Không khả dụng' : 'Unavailable'}</span>;
    }
    return <span className="org-chip available" style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}>● {language === 'vi' ? 'Còn trống' : 'Available'}</span>;
  };

  return (
    <div className="organizer-content">
      {/* 1. Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div>
            <AdminPageHeading section="map" language={language} />
          </div>
        </div>

      </div>

      {/* 2. Primary Actions Toolbar: Create & Map Operation */}
      <div className="booth-map-action-bar">
        {/* Creation Buttons Group */}
        <div className="booth-map-create-group">
          <button
            type="button"
            className="booth-map-btn-primary"
            onClick={handleOpenAddBooth}
          >
            <Store size={15} />
            <span>{language === 'vi' ? 'Thêm gian hàng' : 'Add Booth'}</span>
          </button>

          <button
            type="button"
            className="booth-map-btn-venue"
            onClick={handleOpenAddVenue}
          >
            <Building2 size={15} />
            <span>{language === 'vi' ? 'Thêm địa điểm tổ chức' : 'Add Venue'}</span>
          </button>
        </div>

        {/* Map Management Actions: Upload & Save */}
        <div className="booth-map-manage-group">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleMapUpload} 
            disabled={isSavingMap || isReadingImage}
            style={{ display: 'none' }} 
          />
          <button
            type="button"
            className="booth-map-btn-secondary"
            disabled={isSavingMap || isReadingImage}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            <span>{language === 'vi' ? 'Tải bản đồ lên' : 'Upload Map'}</span>
          </button>

          <button
            type="button"
            className={`booth-map-btn-save ${isSaved ? 'is-saved' : ''}`}
            onClick={handleSaveMap}
            disabled={isSavingMap || isReadingImage}
          >
            {isSaved ? <CheckCircle size={14} /> : <Save size={14} />}
            <span>{isSavingMap ? (language === 'vi' ? 'Đang lưu bản đồ…' : 'Saving map…') : isSaved ? (language === 'vi' ? 'Đã lưu!' : 'Saved!') : (language === 'vi' ? 'Lưu sơ đồ' : 'Save Map')}</span>
          </button>
          <small role="status">
            {hasPendingImage
              ? (language === 'vi' ? 'Ảnh xem trước chưa lưu. Bấm “Lưu sơ đồ” để áp dụng.' : 'Unsaved preview. Click “Save Map” to apply.')
              : (language === 'vi' ? `Ảnh tối đa ${MAX_MAP_IMAGE_MB} MB` : `Images up to ${MAX_MAP_IMAGE_MB} MB`)}
          </small>
        </div>
      </div>

      {/* 3. Interactive Map Container */}
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedBooth(null);
          }
        }}
        style={{
        background: '#FFFFFF',
        border: '1.5px solid #DFCDBD',
        borderRadius: '16px',
        padding: 0,
        position: 'relative',
        overflow: 'visible',
        boxShadow: '0 10px 35px rgba(24, 41, 36, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'default',
        marginBottom: '2rem'
      }}>
        <div 
          ref={mapContainerRef}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
              setSelectedBooth(null);
              setSelectedVenuePoint(null);
            }
          }}
          style={{
          width: '100%',
          position: 'relative',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: draggingMarkerId ? 'none' : 'transform 0.2s ease',
          background: '#E8E0D2'
        }}>
          {/* Illustrated Map Picture */}
          <img 
            src={mapImageUrl} 
            alt="Bản đồ"
            style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
            draggable={false}
          />

          {/* Venue and activity-space markers come directly from Location records. */}
          {venuePoints.map(point => (
            <div
              key={point.id}
              onMouseDown={event => handleVenueMouseDown(point, event)}
              onClick={event => {
                event.stopPropagation();
                if (!dragInfoRef.current.hasMoved) {
                  setSelectedVenuePoint(point);
                  setSelectedBooth(null);
                }
              }}
              style={{
                position: 'absolute', left: `${point.x}%`, top: `${point.y}%`,
                transform: 'translate(-50%, -50%)', zIndex: 8,
                cursor: draggingMarkerId === point.id ? 'grabbing' : 'grab',
              }}
            >
              <span
                title={`${point.code} - ${point.name} - Kéo để đổi vị trí`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                  borderRadius: 12, background: '#DCFCE7', border: '2px solid #16A34A',
                  color: '#166534', boxShadow: '0 2px 7px rgba(0,0,0,0.18)',
                  fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap',
                }}
              >
                <span>⌖</span><span>{point.code}</span>
              </span>
            </div>
          ))}

          {/* Interactive Booth Markers */}
          {localBooths.filter(b => b.x != null && b.y != null).map(b => {
            const isSelected = selectedBooth?.booth.id === b.id;
            const isDragging = draggingMarkerId === b.id;

            let badgeBg = '#E0F2FE';
            let badgeBorder = '#7DD3FC';

            if (b.status === 'assigned') {
              badgeBg = '#9CA3AF';
              badgeBorder = '#6B7280';
            } else if (b.status === 'pending') {
              badgeBg = '#FEF3C7';
              badgeBorder = '#F59E0B';
            } else if (b.status === 'unavailable') {
              badgeBg = '#FEE2E2';
              badgeBorder = '#DC2626';
            }

            if (isSelected || isDragging) {
              badgeBorder = '#17382E';
            }

            return (
              <div
                key={b.id}
                onClick={(e) => handleBoothClick(b, e)}
                onMouseDown={(e) => handleBoothMouseDown(b, e)}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: (isSelected || isDragging) ? 25 : 10,
                  transition: isDragging ? 'none' : 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                <button
                  type="button"
                  style={{
                    background: badgeBg,
                    border: `2px solid ${badgeBorder}`,
                    borderRadius: '20px',
                    padding: '3px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: (isSelected || isDragging)
                      ? '0 0 0 4px rgba(23, 56, 46, 0.35), 0 6px 16px rgba(0,0,0,0.3)' 
                      : '0 3px 8px rgba(0,0,0,0.22)',
                    color: b.status === 'available' ? '#0369A1' : '#1F2937',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: (isSelected || isDragging) ? 'scale(1.15)' : 'scale(1)',
                    transition: isDragging ? 'none' : 'transform 180ms ease, box-shadow 180ms ease'
                  }}
                  title={`${b.code} - ${b.name}${b.orgName ? ' | ' + b.orgName : ''} (${b.statusLabelVi}) - Kéo để đổi vị trí`}
                >
                  <span>{b.code}</span>
                  {b.status === 'assigned' && <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>🔒</span>}
                </button>
              </div>
            );
          })}

          {selectedVenuePoint && (
            <div
              onClick={event => event.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${Math.max(18, Math.min(82, selectedVenuePoint.x))}%`,
                top: `${selectedVenuePoint.y >= 50 ? selectedVenuePoint.y - 3 : selectedVenuePoint.y + 3}%`,
                transform: selectedVenuePoint.y >= 50 ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                width: '300px', maxWidth: '88vw', padding: '1rem', boxSizing: 'border-box',
                background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 12,
                boxShadow: '0 12px 30px rgba(0,0,0,0.18)', zIndex: 100,
              }}
            >
              <button type="button" onClick={() => setSelectedVenuePoint(null)} aria-label="Đóng thông tin địa điểm" style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={16} /></button>
              <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 800 }}>{selectedVenuePoint.code}</div>
              <strong style={{ display: 'block', color: '#172421', marginTop: 4 }}>{selectedVenuePoint.name}</strong>
              <p style={{ margin: '0.5rem 0 0', color: '#475569', fontSize: '0.82rem', lineHeight: 1.45 }}>{selectedVenuePoint.shortDesc || 'Địa điểm tổ chức'}</p>
              <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 99, background: '#DCFCE7', color: '#166534', fontSize: '0.72rem', fontWeight: 700 }}>{selectedVenuePoint.category === 'stage' ? 'Sân khấu sự kiện' : 'Không gian hoạt động'}</span>
            </div>
          )}

          {/* 4. Popover Detail Card Anchored Directly to Clicked Booth */}
          {selectedBooth && selectedBooth.booth.x != null && selectedBooth.booth.y != null && (() => {
            const isAbove = (selectedBooth.booth.y ?? 0) >= 50;
            const rawLeftPercent = selectedBooth.booth.x ?? 0;
            const rawTopPercent = selectedBooth.booth.y ?? 0;
            const clampedLeftPercent = Math.max(18, Math.min(82, rawLeftPercent));
            const arrowPercent = Math.max(10, Math.min(90, 50 + (rawLeftPercent - clampedLeftPercent) * 2.5));

            return (
              <div 
                key={selectedBooth.booth.id}
                onClick={(e) => e.stopPropagation()}
                className={`booth-popover-card ${isAbove ? 'above' : 'below'}`}
                style={{
                  top: isAbove ? `calc(${rawTopPercent}% - 24px)` : `calc(${rawTopPercent}% + 24px)`,
                  left: `${clampedLeftPercent}%`,
                  padding: '1.25rem 1.4rem',
                  width: '460px',
                  maxWidth: '92vw',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  zIndex: 100,
                  position: 'absolute'
                }}
              >
                <div
                  className={`booth-popover-tail ${isAbove ? 'tail-down' : 'tail-up'}`}
                  style={{ left: `${arrowPercent}%` }}
                />

                {/* Header Inputs + Close Button on the same row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F3F4F6' }}>
                  <input 
                    type="text"
                    value={selectedBooth.booth.code}
                    readOnly
                    style={{ 
                      width: '64px', height: '36px', flexShrink: 0, padding: '0 0.35rem', fontWeight: 800, fontSize: '0.95rem', 
                      color: '#17382E', background: '#F4FBF7', border: '1.5px solid #A7F3D0', 
                      borderRadius: '8px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' 
                    }}
                  />
                  <input
                    type="text"
                    value={selectedBooth.booth.name}
                    readOnly
                    placeholder="Tên gian hàng..."
                    style={{ 
                      flex: 1, minWidth: 0, height: '36px', padding: '0 0.75rem', fontWeight: 650, fontSize: '0.95rem', 
                      color: '#1F2937', background: '#F9FAFB', border: '1px solid #E5E7EB', 
                      borderRadius: '8px', outline: 'none', boxSizing: 'border-box' 
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedBooth(null); }}
                    style={{
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Đóng (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 2x2 Grid Form Info Card */}
                <div 
                  className="bpop-info" 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.75rem 0.9rem', 
                    background: '#F8FAF9', 
                    padding: '0.9rem 1rem', 
                    borderRadius: '12px',
                    border: '1px solid #E5ECE8'
                  }}
                >
                  {/* Row 1, Col 1: Trạng thái (Chỉ 2 lựa chọn) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Trạng thái gian hàng
                    </label>
                    <select
                      value={selectedBooth.booth.status}
                      disabled
                      style={{ 
                        width: '100%', height: '34px', padding: '0 0.5rem', borderRadius: '6px', 
                        border: '1px solid #D1D5DB', fontSize: '0.84rem', background: '#FFFFFF',
                        color: '#111827', fontWeight: 600, outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                      }}
                    >
                      <option value="available">Còn trống</option>
                      <option value="assigned">Đã thuê</option>
                      <option value="pending">Đang giữ chỗ</option>
                      <option value="unavailable">Không khả dụng</option>
                    </select>
                  </div>

                  {/* Row 1, Col 2: Đơn vị */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#556B65', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Đơn vị tham gia (NXB / Đối tác)
                    </label>
                    <input
                      type="text"
                      value={selectedBooth.booth.orgName || ''}
                      readOnly
                      placeholder="Nhập tên đơn vị..."
                      style={{ 
                        width: '100%', height: '34px', padding: '0 0.6rem', borderRadius: '6px', 
                        border: '1px solid #D1D5DB', fontSize: '0.84rem', background: '#FFFFFF',
                        color: '#111827', fontWeight: 500, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="bpop-actions" style={{ marginTop: '1.1rem', display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="bpop-btn-detail"
                    onClick={() => {
                      syncAndSave(localBooths);
                      setSelectedBooth(null);
                    }}
                    style={{ 
                      flex: 1, background: '#17382E', color: '#FFFFFF', border: 'none', 
                      borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.88rem', 
                      cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(23, 56, 46, 0.15)'
                    }}
                  >
                    Đóng chi tiết
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Floating Zoom Controls on Map Canvas */}
        <div className="booth-map-floating-zoom">
          <button
            type="button"
            className="booth-zoom-btn"
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
            title={language === 'vi' ? 'Phóng to' : 'Zoom in'}
            aria-label="Zoom in"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className="booth-zoom-btn"
            onClick={() => setZoomLevel(1)}
            title={language === 'vi' ? 'Mặc định (100%)' : 'Reset zoom'}
            aria-label="Reset zoom"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className="booth-zoom-btn"
            onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.1))}
            title={language === 'vi' ? 'Thu nhỏ' : 'Zoom out'}
            aria-label="Zoom out"
          >
            <Minus size={15} />
          </button>
        </div>
      </div>

      {/* 4. Map Legend Status Bar (Placed directly under map for quick reference) */}
      <div className="booth-map-legend-card">
        <div className="booth-map-legend-items">
          <span className="booth-legend-item">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9CA3AF', border: '1px solid #6B7280' }}></span>
            <span>{language === 'vi' ? 'Đã thuê' : 'Assigned'} ({localBooths.filter(b => b.status === 'assigned').length})</span>
          </span>
          <span className="booth-legend-item">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E0F2FE', border: '1px solid #7DD3FC' }}></span>
            <span>{language === 'vi' ? 'Còn trống' : 'Available'} ({localBooths.filter(b => b.status === 'available').length})</span>
          </span>
          {localBooths.some(booth => booth.status === 'pending') && (
            <span className="booth-legend-item">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FEF3C7', border: '1px solid #FCD34D' }}></span>
              <span>{language === 'vi' ? 'Đang giữ chỗ' : 'Pending'} ({localBooths.filter(booth => booth.status === 'pending').length})</span>
            </span>
          )}
          {localBooths.some(booth => booth.status === 'unavailable') && (
            <span className="booth-legend-item">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FEE2E2', border: '1px solid #FCA5A5' }}></span>
              <span>{language === 'vi' ? 'Không khả dụng' : 'Unavailable'} ({localBooths.filter(booth => booth.status === 'unavailable').length})</span>
            </span>
          )}
          {venuePoints.length > 0 && (
            <span className="booth-legend-item">
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#DCFCE7', border: '1px solid #16A34A' }}></span>
              <span>{language === 'vi' ? 'Địa điểm tổ chức' : 'Event locations'} ({venuePoints.length})</span>
            </span>
          )}
        </div>
      </div>

      {/* 5. Integrated Table View Below the Map */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2EAE5',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(23, 36, 33, 0.04)'
      }}>
        {/* Table Title & Filter Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#17382E', margin: 0 }}>
              {language === 'vi' ? 'Danh sách chi tiết gian hàng' : 'Booth Details List'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#556B65', margin: '0.25rem 0 0 0' }}>
              {selectedBooth 
                ? (language === 'vi' 
                    ? `Đang chọn điểm trên sơ đồ: ${selectedBooth.booth.code} - ${selectedBooth.booth.name}`
                    : `Selected marker: ${selectedBooth.booth.code} - ${selectedBooth.booth.name}`)
                : (language === 'vi'
                    ? 'Kéo điểm trên bản đồ để đổi tọa độ; chỉnh sửa thông tin tại mục Quản lý gian hàng'
                    : 'Click any point on the map to inspect')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input maxLength={200}
                type="text"
                placeholder={language === 'vi' ? 'Tìm mã, tên gian hàng, đơn vị...' : 'Search code, name...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  fontSize: '0.82rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  outline: 'none',
                  width: '240px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Tab filters (Only: Tất cả, Đã thuê, Còn trống) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.5rem' }}>
          {[
            { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All', count: localBooths.length },
            { id: 'assigned', label: language === 'vi' ? 'Đã thuê / Đã có' : 'Assigned', count: localBooths.filter(b => b.status === 'assigned').length },
            { id: 'available', label: language === 'vi' ? 'Còn trống' : 'Available', count: localBooths.filter(b => b.status === 'available').length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
              style={{
                background: activeTab === tab.id ? '#17382E' : '#F9FAFB',
                color: activeTab === tab.id ? '#FFFFFF' : '#4B5563',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          {selectedBooth && (
            <button
              type="button"
              onClick={() => setSelectedBooth(null)}
              style={{
                marginLeft: 'auto',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✕ {language === 'vi' ? 'Bỏ chọn bộ lọc điểm' : 'Clear marker filter'}
            </button>
          )}
        </div>

        {/* Table Content */}
        {/* Table Content */}
        <div className="booth-map-desktop-table" style={{ overflowX: 'auto' }}>
          <table className="org-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#F8FAF9', borderBottom: '1.5px solid #E2EAE5' }}>
                <th style={{ padding: '0.95rem 1rem', color: '#556B65', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mã gian</th>
                <th style={{ padding: '0.95rem 1rem', color: '#556B65', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Tên gian hàng & Quy cách</th>
                <th style={{ padding: '0.95rem 1rem', color: '#556B65', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Đơn vị tham gia</th>
                <th style={{ padding: '0.95rem 1rem', color: '#556B65', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Trạng thái</th>
                <th style={{ padding: '0.95rem 1rem', color: '#556B65', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooths.length > 0 ? (
                paginatedBooths.map(b => (
                  <tr 
                    key={b.id} 
                    style={{ 
                      borderBottom: '1px solid #EEF2F0',
                      background: selectedBooth?.booth.id === b.id ? '#F0F7F4' : '#FFFFFF',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '1.05rem 1rem' }}>
                      <span style={{ 
                        fontWeight: 800, 
                        color: '#17382E', 
                        background: '#E8F5E9', 
                        padding: '0.25rem 0.55rem', 
                        borderRadius: '6px',
                        border: '1px solid #C8E6C9',
                        fontSize: '0.82rem'
                      }}>
                        {b.code}
                      </span>
                    </td>
                    <td style={{ padding: '1.05rem 1rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#172421', display: 'block', marginBottom: '4px' }}>
                        {b.name}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#637771' }}>
                        {b.dimensions} • {b.areaType}
                      </span>
                    </td>
                    <td style={{ padding: '1.05rem 1rem' }}>
                      {b.orgName ? (
                        <span style={{ color: '#172421', fontWeight: 600, fontSize: '0.86rem' }}>{b.orgName}</span>
                      ) : (
                        <span style={{ color: '#8E9F97', fontStyle: 'italic', fontSize: '0.84rem' }}>Chưa có đơn vị</span>
                      )}
                    </td>
                    <td style={{ padding: '1.05rem 1rem' }}>
                      {getStatusChip(b.status)}
                    </td>
                    <td style={{ padding: '1.05rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-org-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooth({ booth: b });
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                        >
                          <Search size={13} />
                          <span>Xem</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#6B7280' }}>
                    {language === 'vi' ? 'Không tìm thấy gian hàng phù hợp.' : 'No booths found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards for Booth List */}
        <div className="booth-map-mobile-cards">
          {paginatedBooths.length > 0 ? (
            paginatedBooths.map(b => (
              <div
                key={b.id}
                className={`booth-map-mobile-card ${selectedBooth?.booth.id === b.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedBooth({ booth: b });
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              >
                <div className="booth-card-head">
                  <span className="booth-code-badge">{b.code}</span>
                  {getStatusChip(b.status)}
                </div>

                <div className="booth-card-body">
                  <h4 className="booth-card-title">{b.name}</h4>
                  <div className="booth-card-meta">
                    <span>📐 {b.dimensions} • {b.areaType}</span>
                    {b.orgName ? (
                      <span className="booth-card-org">🏢 {b.orgName}</span>
                    ) : (
                      <span className="booth-card-org-empty">🏢 Chưa có đơn vị</span>
                    )}
                  </div>
                </div>

                <div className="booth-card-footer">
                  <button
                    type="button"
                    className="btn-org-secondary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooth({ booth: b });
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                  >
                    <Search size={14} />
                    <span>{language === 'vi' ? 'Xem vị trí trên sơ đồ' : 'View on map'}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6B7280', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2EAE5' }}>
              {language === 'vi' ? 'Không tìm thấy gian hàng phù hợp.' : 'No booths found.'}
            </div>
          )}
        </div>

        {/* Pagination when showing all */}
        {!selectedBooth && (
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
            vi={language === 'vi'}
          />
        )}
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#065F46',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.86rem',
          fontWeight: 600,
          animation: 'fadeIn 0.25s ease'
        }}>
          <CheckCircle size={18} color="#A7F3D0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Modal 1: Thêm gian hàng */}
      {addModalType === 'booth' && (
        <div
          onClick={() => !isSubmitting && setAddModalType(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAF9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#E8F5EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Store size={20} color="#17382E" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#17382E' }}>
                    {language === 'vi' ? 'Thêm gian hàng mới' : 'Add New Booth'}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                    {language === 'vi' ? 'Tạo gian hàng mới và hiển thị vị trí trên sơ đồ mặt bằng' : 'Create a booth and place marker on layout'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalType(null)}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitBooth} style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {formError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Mã gian hàng *' : 'Booth Code *'}
                  </label>
                  <input maxLength={20}
                    type="text"
                    value={boothForm.code}
                    onChange={(e) => setBoothForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="B-13"
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#17382E',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Tên gian hàng *' : 'Booth Name *'}
                  </label>
                  <input maxLength={160}
                    type="text"
                    value={boothForm.name}
                    onChange={(e) => setBoothForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Nhà xuất bản Trẻ, Gian hàng Fahasa..."
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Phân khu / Khu vực' : 'Zone'}
                  </label>
                  <input maxLength={80}
                    type="text"
                    value={boothForm.areaName}
                    onChange={(e) => setBoothForm(prev => ({ ...prev, areaName: e.target.value }))}
                    placeholder="VD: Khu A, Khu B..."
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Giờ mở cửa' : 'Open Hours'}
                  </label>
                  <input maxLength={60}
                    type="text"
                    value={boothForm.openHours}
                    onChange={(e) => setBoothForm(prev => ({ ...prev, openHours: e.target.value }))}
                    placeholder="08:00 – 22:00"
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Cơ sở / Khuôn viên' : 'Campus'}
                </label>
                <input maxLength={160}
                  type="text"
                  value={boothForm.campus}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, campus: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Mô tả ngắn' : 'Description'}
                </label>
                <textarea maxLength={20000}
                  value={boothForm.description}
                  onChange={(e) => setBoothForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Giới thiệu về gian hàng, thể loại sách nổi bật..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
                <button
                  type="button"
                  className="btn-org-secondary"
                  onClick={() => setAddModalType(null)}
                  disabled={isSubmitting}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-org-primary"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#17382E',
                    color: '#FFFFFF'
                  }}
                >
                  <Plus size={15} />
                  <span>{isSubmitting ? (language === 'vi' ? 'Đang tạo…' : 'Creating…') : (language === 'vi' ? 'Tạo gian hàng' : 'Create Booth')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Thêm địa điểm tổ chức */}
      {addModalType === 'venue' && (
        <div
          onClick={() => !isSubmitting && setAddModalType(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.22)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FDFCF7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={20} color="#B48A3C" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#17382E' }}>
                    {language === 'vi' ? 'Thêm địa điểm tổ chức' : 'Add Event Venue'}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                    {language === 'vi' ? 'Tạo sân khấu, khu workshop hoặc không gian tổ chức sự kiện' : 'Create a stage, workshop or event activity area'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalType(null)}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitVenue} style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {formError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Tên địa điểm / sân khấu *' : 'Venue / Stage Name *'}
                </label>
                <input maxLength={160}
                  type="text"
                  value={venueForm.name}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Sân Khấu Chính, Khu Workshop Trải Nghiệm..."
                  required
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Mã địa điểm' : 'Venue Code'}
                  </label>
                  <input maxLength={20} required
                    type="text"
                    value={venueForm.code}
                    onChange={(e) => setVenueForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="LOC-STAGE-02"
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#B48A3C',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                    {language === 'vi' ? 'Sức chứa (người) *' : 'Capacity *'}
                  </label>
                  <input step={1}
                    type="number"
                    min={1}
                    max={10000}
                    value={venueForm.capacity}
                    onChange={(e) => setVenueForm(prev => ({ ...prev, capacity: Number(e.target.value) || 0 }))}
                    required
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Loại không gian' : 'Venue Type'}
                </label>
                <select
                  value={venueForm.kind}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, kind: e.target.value as any }))}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="main_stage">{language === 'vi' ? 'Sân khấu chính' : 'Main Stage'}</option>
                  <option value="workshop_area">{language === 'vi' ? 'Khu vực Workshop & Trải nghiệm' : 'Workshop Area'}</option>
                  <option value="reading_area">{language === 'vi' ? 'Không gian đọc sách cộng đồng' : 'Reading Area'}</option>
                  <option value="other">{language === 'vi' ? 'Khu vực triển lãm & chức năng khác' : 'Exhibition & Other'}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  {language === 'vi' ? 'Cơ sở / Khuôn viên' : 'Campus'}
                </label>
                <input maxLength={40}
                  type="text"
                  value={venueForm.campus}
                  onChange={(e) => setVenueForm(prev => ({ ...prev, campus: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
                <button
                  type="button"
                  className="btn-org-secondary"
                  onClick={() => setAddModalType(null)}
                  disabled={isSubmitting}
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-org-primary"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#B48A3C',
                    color: '#FFFFFF'
                  }}
                >
                  <Plus size={15} />
                  <span>{isSubmitting ? (language === 'vi' ? 'Đang tạo…' : 'Creating…') : (language === 'vi' ? 'Tạo địa điểm' : 'Create Venue')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
