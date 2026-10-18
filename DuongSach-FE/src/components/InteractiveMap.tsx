import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  Phone,
  Clock,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { IconMapBookPin } from './CustomIcons';
import { Booth, Language } from '../types';
import { fetchMapHotspotsFromApi, getSharedMapPoints, getSharedMapImage, MapLocationPoint } from '../services/mapService';
import './InteractiveMap.css';

interface InteractiveMapProps {
  language: Language;
  booths?: Booth[];
  highlightedBoothId: string | null;
  onNavigateToBoothDetail: (boothId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  language,
  booths,
  highlightedBoothId,
  onNavigateToBoothDetail,
}) => {
  const allBooths = booths || [];
  const [mapPoints, setMapPoints] = useState<MapLocationPoint[]>(() => getSharedMapPoints());
  const [mapImageUrl, setMapImageUrl] = useState<string>(() => getSharedMapImage());
  const [selectedPointId, setSelectedPointId] = useState<string>(() => getSharedMapPoints()[0]?.id || '');

  useEffect(() => {
    const reloadMap = () => fetchMapHotspotsFromApi()
      .then(points => {
        setMapPoints(points);
        setSelectedPointId(current => points.some(point => point.id === current) ? current : points[0]?.id || '');
      })
      .catch(error => console.warn('Không thể tải dữ liệu bản đồ', error));
    void reloadMap();
    window.addEventListener('focus', reloadMap);
    window.addEventListener('duongsach:data-changed', reloadMap);
    return () => {
      window.removeEventListener('focus', reloadMap);
      window.removeEventListener('duongsach:data-changed', reloadMap);
    };
  }, []);

  // Listen for BQL map updates
  useEffect(() => {
    const handleMapUpdate = (e: any) => {
      if (e.detail?.points) {
        setMapPoints(e.detail.points);
      }
    };
    const handleImageUpdate = (e: any) => {
      if (e.detail?.imageUrl) {
        setMapImageUrl(e.detail.imageUrl);
      }
    };
    window.addEventListener('duongsach_map_updated', handleMapUpdate);
    window.addEventListener('duongsach_map_image_updated', handleImageUpdate);
    return () => {
      window.removeEventListener('duongsach_map_updated', handleMapUpdate);
      window.removeEventListener('duongsach_map_image_updated', handleImageUpdate);
    };
  }, []);

  // Zoom & Pan state for mobile / desktop
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.35, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Touch handlers for smooth dragging & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPanRef.current = { ...panOffset };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistanceRef.current = dist;
      initialPinchZoomRef.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      const maxPan = (zoomLevel - 1) * 200;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, initialPanRef.current.x + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, initialPanRef.current.y + dy)),
      });
    } else if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / pinchStartDistanceRef.current;
      const newZoom = Math.min(Math.max(initialPinchZoomRef.current * scaleFactor, 1), 3.5);
      setZoomLevel(newZoom);
      if (newZoom === 1) setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
  };

  // Mouse drag support when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      initialPanRef.current = { ...panOffset };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const maxPan = (zoomLevel - 1) * 220;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, initialPanRef.current.x + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, initialPanRef.current.y + dy)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Khi có highlightedBoothId từ "Xem trên bản đồ"
  React.useEffect(() => {
    if (highlightedBoothId) {
      const match = mapPoints.find(point => point.code === allBooths.find(booth => booth.id === highlightedBoothId)?.code);
      if (match) {
        setSelectedPointId(match.id);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
    }
  }, [highlightedBoothId, mapPoints, allBooths]);

  // Selected point data
  const selectedPoint = mapPoints.find(p => p.id === selectedPointId) || mapPoints[0];
  const activeBooth = selectedPoint
    ? allBooths.find(b => b.code === selectedPoint.code || b.name.toLowerCase().includes(selectedPoint.name.toLowerCase()))
    : null;

  if (!selectedPoint) {
    return (
      <section className="figma-map-section" id="ban-do" aria-busy="true">
        <p className="app-loading-state">Đang tải dữ liệu bản đồ Đường Sách…</p>
      </section>
    );
  }

  return (
    <section className="figma-map-section" id="ban-do">
      <div className="blueprint-map-section-container">
        {/* Header section */}
        <div className="figma-section-header">
          <span className="figma-eyebrow">
            <IconMapBookPin size={16} color="var(--figma-gold)" />
            <span>{language === 'vi' ? 'MẶT BẰNG QUY HOẠCH' : 'ARCHITECTURAL SCHEMATIC'}</span>
          </span>
          <h2 className="figma-section-title">
            {language === 'vi' ? (
              <>Bản đồ <span className="serif-italic-accent">Đường Sách</span> Nguyễn Văn Bình</>
            ) : (
              <>Nguyen Van Binh <span className="serif-italic-accent">Book Street</span> Map</>
            )}
          </h2>
          <p className="figma-section-subtitle">
            {language === 'vi'
              ? 'Khám phá vị trí các gian hàng, khu vực sự kiện và tiện ích tại Đường Sách TP.HCM. Chọn một điểm trên bản đồ để xem thông tin chi tiết.'
              : 'Explore stalls, event spaces, and amenities at Ho Chi Minh City Book Street. Select a point to view details.'}
          </p>
        </div>

        {/* Map Blueprint & Detail Column Layout */}
        <div className="blueprint-map-layout">
          {/* Left / Top Canvas: Vector Blueprint */}
          <div className="blueprint-canvas-wrapper">
            <div className="blueprint-toolbar">
              {/* Mobile & Desktop Interactive Zoom Controls */}
              <div className="map-zoom-controls-cluster" aria-label="Công cụ phóng to thu nhỏ bản đồ">
                <button
                  type="button"
                  className="btn-map-zoom"
                  onClick={handleZoomIn}
                  title={language === 'vi' ? 'Phóng to bản đồ (+)' : 'Zoom In (+)'}
                  aria-label="Phóng to"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  className="btn-map-zoom"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  title={language === 'vi' ? 'Thu nhỏ bản đồ (-)' : 'Zoom Out (-)'}
                  aria-label="Thu nhỏ"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  type="button"
                  className={`btn-zoom-indicator ${zoomLevel > 1 ? 'is-active-zoom' : ''}`}
                  onClick={handleResetZoom}
                  title={zoomLevel > 1 ? (language === 'vi' ? 'Khôi phục 100%' : 'Reset 100%') : (language === 'vi' ? 'Phóng to bản đồ' : 'Zoom In')}
                  aria-label="Tỷ lệ thu phóng"
                >
                  <span className="zoom-val-tag">{Math.round(zoomLevel * 100)}%</span>
                </button>
              </div>
            </div>

            <p className="map-touch-hint">{language === 'vi' ? 'Vuốt ngang để xem bản đồ · Chạm vào số để chọn địa điểm' : 'Swipe to explore · Tap a number to select a location'}</p>
            <div
              className={`blueprint-scroll-viewport ${zoomLevel > 1 ? 'is-zoomed' : ''} ${isDragging ? 'is-dragging' : ''}`}
              ref={mapViewportRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="illustrated-map"
                aria-label={language === 'vi' ? 'Bản đồ tương tác Đường Sách Nguyễn Văn Bình' : 'Interactive Nguyen Van Binh Book Street map'}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  touchAction: zoomLevel > 1 ? 'none' : 'pan-x pan-y'
                }}
              >
                <img
                  className="illustrated-map-image"
                  src={mapImageUrl || undefined}
                  alt={language === 'vi' ? 'Sơ đồ minh họa Đường Sách Nguyễn Văn Bình, Quận 1, Thành phố Hồ Chí Minh' : 'Illustrated map of Nguyen Van Binh Book Street in District 1, Ho Chi Minh City'}
                  draggable={false}
                />

                {mapPoints.map((point, index) => {
                  const isSelected = selectedPoint.id === point.id;
                  const markerScale = 1 / zoomLevel;

                  return (
                    <button
                      key={point.id}
                      type="button"
                      className={`illustrated-map-marker ${isSelected ? 'is-selected' : ''}`}
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: `translate(-50%, ${isSelected ? 'calc(-50% - 10px)' : '-50%'}) scale(${markerScale})`,
                        background: isSelected ? '#E9BC63' : '#FFFFFF',
                        borderColor: isSelected ? '#17382E' : '#185E48',
                        color: isSelected ? '#172421' : '#17382E',
                        boxShadow: isSelected ? '0 0 0 4px rgba(23, 56, 46, 0.35), 0 8px 24px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.18)'
                      }}
                      aria-label={`${language === 'vi' ? 'Xem thông tin' : 'View details'}: ${language === 'vi' ? point.name : (point.nameEn || point.name)}`}
                      aria-pressed={isSelected}
                      aria-controls="map-location-detail"
                      onClick={() => {
                        if (!isDragging) setSelectedPointId(point.id);
                      }}
                    >
                      <span className="marker-index">{index + 1}</span>
                      <span className="marker-label">{point.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standard unified marker styling for landing page visitors */}

          </div>

          {/* Right Column: Full Info Card for Selected Unit */}
          <div id="map-location-detail" className="blueprint-detail-panel" aria-live="polite" aria-atomic="true">
            {/* Header with Unit Code badge & Category */}
            <div className="panel-unit-top">
              <span className="panel-code-badge">{selectedPoint.code}</span>
              <span className="panel-category-name">
                {selectedPoint.category === 'stage'
                  ? (language === 'vi' ? 'Sân khấu Sự kiện' : 'Event Stage')
                  : selectedPoint.category === 'cafe'
                  ? (language === 'vi' ? 'Cà phê Sách' : 'Book Cafe')
                  : selectedPoint.category === 'facility'
                  ? (language === 'vi' ? 'Tiện ích & Cảnh quan' : 'Public Facility')
                  : (language === 'vi' ? 'Gian hàng Xuất bản' : 'Bookstall Unit')}
              </span>
            </div>

            {/* Title */}
            <h3 className="panel-unit-title">
              {language === 'vi' ? selectedPoint.name : (selectedPoint.nameEn || selectedPoint.name)}
            </h3>

            {/* Description */}
            <p className="panel-unit-desc">
              {language === 'vi' ? selectedPoint.shortDesc : (selectedPoint.shortDescEn || selectedPoint.shortDesc)}
            </p>

            {/* Highlights & Features Box */}
            {selectedPoint.features && selectedPoint.features.length > 0 && (
              <div className="panel-highlights-box">
                <span className="highlights-header-label">
                  {language === 'vi' ? 'ĐẶC TRƯNG & TIỆN ÍCH NỔI BẬT:' : 'HIGHLIGHTS & SERVICES:'}
                </span>
                <div className="highlights-chips-container">
                  {selectedPoint.features.map((feat: string, fIdx: number) => (
                    <span key={fIdx} className="highlight-chip">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Books if booth is selected */}
            {selectedPoint.featuredBooks && selectedPoint.featuredBooks.length > 0 && (
              <div className="panel-featured-books-box">
                <span className="highlights-header-label">
                  {language === 'vi' ? 'SÁCH TIÊU BIỂU GỢI Ý:' : 'FEATURED TITLES:'}
                </span>
                <p className="featured-books-text">
                  {selectedPoint.featuredBooks.join(' • ')}
                </p>
              </div>
            )}

            {/* Contact & Hours */}
            <div className="panel-contact-list">
              <div className="contact-item">
                <Clock size={15} />
                <span>{selectedPoint.openHours || '—'}</span>
              </div>
              {selectedPoint.phone && (
                <div className="contact-item">
                  <Phone size={15} />
                  <span>{selectedPoint.phone}</span>
                </div>
              )}
            </div>

            {/* Operator info */}
            <div className="panel-booth-preview">
              <div className="preview-thumb">
                <img
                  src={selectedPoint.imageUrl || activeBooth?.image?.url}
                  alt={selectedPoint.name}
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/duong_sach_hero_bg.jpg';
                  }}
                />
              </div>
              <div className="preview-info">
                <span className="preview-label">
                  {selectedPoint.category === 'booth'
                    ? (language === 'vi' ? 'ĐƠN VỊ VẬN HÀNH' : 'OPERATOR')
                    : (language === 'vi' ? 'QUẢN LÝ KHÔNG GIAN' : 'SPACE MANAGEMENT')}
                </span>
                <p className="preview-name">
                  {selectedPoint.orgName || activeBooth?.name || '—'}
                </p>
                {activeBooth && (
                  <button
                    type="button"
                    className="btn-navigate-booth"
                    onClick={() => onNavigateToBoothDetail(activeBooth.id)}
                  >
                    <span>{language === 'vi' ? 'Xem trong danh mục gian hàng' : 'Inspect Stall Catalog'}</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
