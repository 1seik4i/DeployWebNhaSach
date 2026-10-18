import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Info, 
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Store,
  Sparkles,
  ArrowRight,
  ArrowDown,
  MapPin
} from 'lucide-react';
import { Language, PartnerBooth, PartnerOrganization } from '../../types';
import { fetchMapHotspotsFromApi, getSharedMapPoints, getSharedMapImage } from '../../services/mapService';
import { MapLocationPoint } from '../../types/map';
import './PartnerPages.css';

interface BoothSelectionPageProps {
  language: Language;
  booths?: PartnerBooth[];
  currentAssignedBoothId?: string;
  currentAssignedBoothCode?: string;
  organization?: PartnerOrganization;
  onSelectBooth?: (boothId: string) => void;
}

export const BoothSelectionPage: React.FC<BoothSelectionPageProps> = ({
  language,
  booths = [],
  currentAssignedBoothId,
  currentAssignedBoothCode,
  organization,
}) => {
  const navigate = useNavigate();
  const [mapPoints, setMapPoints] = useState<MapLocationPoint[]>(() => getSharedMapPoints());
  const [mapImageUrl, setMapImageUrl] = useState<string>(() => getSharedMapImage());
  const [activePoint, setActivePoint] = useState<MapLocationPoint | null>(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Helper check: Có phải gian hàng của tổ chức đối tác này đang thuê không?
  const isMyAssignedBooth = (point: MapLocationPoint): boolean => {
    if (currentAssignedBoothId && (point.id === currentAssignedBoothId || (point as any).boothId === currentAssignedBoothId)) {
      return true;
    }
    if (currentAssignedBoothCode && point.code.trim().toUpperCase() === currentAssignedBoothCode.trim().toUpperCase()) {
      return true;
    }
    if (organization?.id && point.assignedOrgId === organization.id) {
      return true;
    }
    if (organization?.name && point.orgName && point.orgName.trim().toLowerCase() === organization.name.trim().toLowerCase()) {
      return true;
    }
    if (booths.some(b => 
      (b.id === point.id || b.code.trim().toUpperCase() === point.code.trim().toUpperCase()) &&
      (b.assignedOrgId === organization?.id || (b.assignedOrgName && organization?.name && b.assignedOrgName.trim().toLowerCase() === organization.name.trim().toLowerCase()))
    )) {
      return true;
    }
    return false;
  };

  // Xác định điểm gian hàng của đối tác
  const myAssignedBoothPoint = useMemo(() => {
    return mapPoints.find(isMyAssignedBooth);
  }, [mapPoints, currentAssignedBoothId, currentAssignedBoothCode, organization, booths]);

  // Listen for BQL Map Updates in Real-time
  useEffect(() => {
    void fetchMapHotspotsFromApi().then(points => {
      setMapPoints(points);
    });
    const handleMapUpdate = (e: any) => {
      if (e.detail?.points) {
        setMapPoints(e.detail.points);
      } else {
        setMapPoints(getSharedMapPoints());
      }
    };
    const handleImageUpdate = (e: any) => {
      if (e.detail?.imageUrl) {
        setMapImageUrl(e.detail.imageUrl);
      }
    };
    const reloadShared = () => {
      setMapPoints(getSharedMapPoints());
      setMapImageUrl(getSharedMapImage());
    };

    window.addEventListener('duongsach_map_updated', handleMapUpdate);
    window.addEventListener('duongsach_map_image_updated', handleImageUpdate);
    window.addEventListener('duongsach:data-changed', reloadShared);
    window.addEventListener('focus', reloadShared);

    return () => {
      window.removeEventListener('duongsach_map_updated', handleMapUpdate);
      window.removeEventListener('duongsach_map_image_updated', handleImageUpdate);
      window.removeEventListener('duongsach:data-changed', reloadShared);
      window.removeEventListener('focus', reloadShared);
    };
  }, []);

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.35, 2.5));
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

  const filteredPoints = mapPoints;

  const handlePointClick = (p: MapLocationPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePoint(prev => (prev?.id === p.id ? null : p));
  };

  return (
    <div className="booth-selection-page">
      {/* 1. Header */}
      <div className="partner-page-header">
        <h1 className="partner-page-title">
          {language === 'vi' ? 'Sơ đồ gian hàng' : 'Booth Map'}
        </h1>
        <p className="partner-page-sub">
          {language === 'vi' 
            ? 'Sơ đồ quy hoạch vị trí gian hàng và nhận biết vị trí được phân công trên Đường Sách TP.HCM.' 
            : 'Explore the official Book Street layout and discover your assigned stall.'}
        </p>
      </div>

      {/* Banner Nổi bật gian hàng của đối tác (nếu đã có gian thuê) */}
      {(myAssignedBoothPoint || currentAssignedBoothCode) && (
        <div style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
          border: '1.5px solid #6EE7B7',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 3px 10px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#059669',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)',
              flexShrink: 0
            }}>
              <ArrowDown size={20} strokeWidth={2.8} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{language === 'vi' ? 'Gian hàng của đơn vị bạn:' : 'Your Rented Booth:'}</span>
                <span style={{
                  background: '#047857',
                  color: '#FFFFFF',
                  padding: '2px 9px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 900
                }}>
                  {myAssignedBoothPoint?.code || currentAssignedBoothCode}
                </span>
                {organization?.name && <span style={{ color: '#047857', fontSize: '0.88rem' }}>({organization.name})</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.2rem' }}>
                {language === 'vi'
                  ? 'Vị trí này đang hiển thị nổi bật với viền xanh ngọc lấp lánh trên bản đồ bên dưới.'
                  : 'Your booth is prominently highlighted on the map below.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {myAssignedBoothPoint && (
              <button
                type="button"
                className="btn-part-secondary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', background: '#FFFFFF', borderColor: '#A7F3D0', color: '#065F46', fontWeight: 700 }}
                onClick={() => setActivePoint(myAssignedBoothPoint)}
              >
                <span>{language === 'vi' ? 'Định vị trên sơ đồ' : 'Locate on Map'}</span>
              </button>
            )}
            <Link
              to="/partner/booths"
              className="btn-part-primary"
              style={{
                textDecoration: 'none',
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                background: '#059669',
                borderColor: '#047857',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Store size={14} />
              <span>{language === 'vi' ? 'Quản lý gian hàng' : 'Manage Booth'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Interactive Map Container */}
      <div className="booth-map-container">
        {/* Legend & Filter Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Status Legend (Nổi bật: Gian của bạn, Đã thuê đơn vị khác, Còn trống) */}
          <div className="booth-legend-row" style={{ margin: 0, gap: '1.15rem' }}>
            {myAssignedBoothPoint && (
              <div className="legend-item" style={{
                background: '#ECFDF5',
                padding: '3px 10px',
                borderRadius: '16px',
                border: '1.5px solid #6EE7B7',
                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.15)'
              }}>
                <ArrowDown size={14} strokeWidth={2.6} style={{ color: '#059669' }} />
                <span style={{ color: '#065F46', fontWeight: 800 }}>
                  {language === 'vi' ? `Gian hàng của bạn (${myAssignedBoothPoint.code})` : `Your Booth (${myAssignedBoothPoint.code})`}
                </span>
              </div>
            )}
            <div className="legend-item">
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9CA3AF', border: '1px solid #6B7280' }}></div>
              <span>{language === 'vi' ? 'Đã thuê bởi đơn vị khác' : 'Assigned (Other)'}</span>
            </div>
            <div className="legend-item">
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E0F2FE', border: '1px solid #7DD3FC' }}></div>
              <span>{language === 'vi' ? 'Còn trống' : 'Available'} ({mapPoints.filter(p => p.status === 'available').length})</span>
            </div>
          </div>

          {/* Right cluster: Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F4F7F5', padding: '3px', borderRadius: '8px', border: '1px solid #E2EAE5' }}>
              <button
                type="button"
                onClick={handleZoomIn}
                style={{ background: 'none', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: '#17382E' }}
                title="Phóng to"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                style={{ background: 'none', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer', color: zoomLevel <= 1 ? '#9CA3AF' : '#17382E' }}
                title="Thu nhỏ"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                style={{ background: 'none', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: '#17382E', fontSize: '0.75rem', fontWeight: 700 }}
                title="Đặt lại"
              >
                <RotateCcw size={12} style={{ marginRight: '3px' }} />
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Map Viewport */}
        <div 
          ref={mapContainerRef}
          onClick={() => setActivePoint(null)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            background: '#E8E0D2',
            border: '1.5px solid #DFCDBD',
            borderRadius: '14px',
            overflow: zoomLevel > 1 ? 'hidden' : 'visible',
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Illustrated Map Background */}
            <img 
              src={mapImageUrl} 
              alt="Bản đồ Đường Sách" 
              style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
              draggable={false}
            />

            {/* Interactive Booth Markers on Map */}
            {filteredPoints.map((point) => {
              const isSelected = activePoint?.id === point.id;
              const isMyBooth = isMyAssignedBooth(point);
              const isAvailable = point.status === 'available';
              const markerScale = 1 / zoomLevel;

              let badgeBg = '#E0F2FE';
              let badgeBorder = '#7DD3FC';
              let textColor = '#0369A1';

              if (point.status === 'assigned') {
                badgeBg = '#9CA3AF';
                badgeBorder = '#6B7280';
                textColor = '#374151';
              } else if (point.status === 'pending' || point.status === 'on_hold') {
                badgeBg = '#FEF3C7';
                badgeBorder = '#F59E0B';
                textColor = '#92400E';
              } else if (point.status === 'unavailable') {
                badgeBg = '#FEE2E2';
                badgeBorder = '#DC2626';
                textColor = '#991B1B';
              }

              // Styling ưu tiên riêng biệt cho gian hàng của đối tác
              let currentBg = badgeBg;
              let currentBorder = badgeBorder;
              let currentTextColor = textColor;
              let currentBoxShadow = '0 3px 8px rgba(0,0,0,0.22)';
              let currentScale = 'scale(1)';

              if (isMyBooth) {
                currentBg = 'linear-gradient(135deg, #059669 0%, #10B981 100%)';
                currentBorder = '#047857';
                currentTextColor = '#FFFFFF';
                currentBoxShadow = isSelected
                  ? '0 0 0 5px rgba(16, 185, 129, 0.5), 0 0 22px rgba(16, 185, 129, 0.7), 0 8px 24px rgba(0,0,0,0.35)'
                  : '0 0 0 3.5px rgba(16, 185, 129, 0.45), 0 0 15px rgba(16, 185, 129, 0.6), 0 4px 10px rgba(0,0,0,0.25)';
                currentScale = isSelected ? 'scale(1.22)' : 'scale(1.1)';
              } else if (isSelected) {
                currentBg = '#E9BC63';
                currentBorder = '#17382E';
                currentTextColor = '#172421';
                currentBoxShadow = '0 0 0 4px rgba(23, 56, 46, 0.35), 0 8px 24px rgba(0,0,0,0.3)';
                currentScale = 'scale(1.15)';
              }

              return (
                <div
                  key={point.id}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: `translate(-50%, ${isSelected ? '-65%' : '-50%'}) scale(${markerScale})`,
                    zIndex: isMyBooth ? 35 : isSelected ? 30 : 10,
                    transition: 'all 0.18s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => handlePointClick(point, e)}
                    style={{
                      background: currentBg,
                      border: `2px solid ${currentBorder}`,
                      borderRadius: '20px',
                      padding: isMyBooth ? '3px 10px' : '3px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: currentBoxShadow,
                      color: currentTextColor,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transform: currentScale,
                      transition: 'all 160ms ease'
                    }}
                    title={
                      isMyBooth
                        ? `GIAN HÀNG CỦA BẠN: ${point.code} - ${point.name} (${organization?.name || point.orgName})`
                        : `${point.code} - ${point.name}${point.orgName ? ' | ' + point.orgName : ''} (${point.statusLabelVi})`
                    }
                  >
                    {isMyBooth && (
                      <ArrowDown size={13} strokeWidth={3} style={{ flexShrink: 0, color: '#FFFFFF' }} />
                    )}
                    <span>{point.code}</span>
                    {!isMyBooth && !isAvailable && (
                      <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>🔒</span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Popover anchored on the clicked booth */}
            {activePoint && (() => {
              const isAbove = activePoint.y >= 45;
              const rawLeftPercent = activePoint.x;
              const rawTopPercent = activePoint.y;
              const clampedLeftPercent = Math.max(22, Math.min(78, rawLeftPercent));
              const isAvailable = activePoint.status === 'available';
              const isCurrentMyBooth = isMyAssignedBooth(activePoint);

              return (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: isAbove ? `calc(${rawTopPercent}% - 16px)` : `calc(${rawTopPercent}% + 16px)`,
                    left: `${clampedLeftPercent}%`,
                    transform: isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                    padding: '1.15rem 1.25rem',
                    width: '360px',
                    maxWidth: '90vw',
                    maxHeight: '90%',
                    overflowY: 'auto',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: isCurrentMyBooth ? '2px solid #10B981' : '1.5px solid #E2EAE5',
                    zIndex: 60,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0.15rem 0 0 0', fontSize: '1.05rem', color: '#172421', fontWeight: 800 }}>
                        {activePoint.code} • {activePoint.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePoint(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '3px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Highlight banner nếu là gian hàng của chính đối tác */}
                  {isCurrentMyBooth && (
                    <div style={{
                      marginBottom: '0.65rem',
                      background: '#ECFDF5',
                      border: '1.5px solid #10B981',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#065F46',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ArrowDown size={14} strokeWidth={2.8} />
                        <span>{language === 'vi' ? 'ĐÂY LÀ GIAN HÀNG CỦA ĐƠN VỊ BẠN' : 'THIS IS YOUR ASSIGNED BOOTH'}</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#059669', color: '#FFFFFF', padding: '2px 7px', borderRadius: '10px' }}>
                        {language === 'vi' ? 'Đang thuê' : 'Renting'}
                      </span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  {!isCurrentMyBooth && (
                    <div style={{ marginBottom: '0.65rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '12px',
                        background: isAvailable ? '#E0F2FE' : '#F3F4F6',
                        color: isAvailable ? '#0369A1' : '#4B5563',
                        border: `1px solid ${isAvailable ? '#BAE6FD' : '#D1D5DB'}`
                      }}>
                        ● {activePoint.statusLabelVi}
                      </span>
                    </div>
                  )}

                  <p style={{ fontSize: '0.82rem', color: '#556B65', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                    {activePoint.shortDesc || '—'}
                  </p>

                  <div style={{ background: '#F8FAF9', border: '1px solid #E2EAE5', borderRadius: '8px', padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                    <div><strong>{language === 'vi' ? 'Phân loại:' : 'Category:'}</strong> {activePoint.areaType || '—'}</div>
                    {(activePoint.orgName || (isCurrentMyBooth && organization?.name)) && (
                      <div>
                        <strong>{language === 'vi' ? 'Đơn vị đang thuê:' : 'Renting Organization:'}</strong> {isCurrentMyBooth ? (organization?.name || activePoint.orgName) : activePoint.orgName}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {isCurrentMyBooth && (
                      <Link
                        to="/partner/booths"
                        className="btn-part-primary"
                        style={{
                          textDecoration: 'none',
                          flex: 1,
                          padding: '0.45rem',
                          fontSize: '0.8rem',
                          justifyContent: 'center',
                          background: '#059669',
                          borderColor: '#047857',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Store size={14} />
                        <span>{language === 'vi' ? 'Quản lý gian hàng này' : 'Manage This Booth'}</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn-part-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', justifyContent: 'center' }}
                      onClick={() => setActivePoint(null)}
                    >
                      {language === 'vi' ? 'Đóng' : 'Close'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 3. Bottom Summary Card */}
      {activePoint ? (
        <div className="booth-selection-summary-card" style={isMyAssignedBooth(activePoint) ? { border: '1.5px solid #10B981', background: '#F0FDF4' } : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {activePoint.imageUrl && <img src={activePoint.imageUrl} alt={activePoint.name} style={{ width: '100px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />}
            <div>
              <div style={{ fontSize: '0.78rem', color: isMyAssignedBooth(activePoint) ? '#065F46' : '#637771', fontWeight: 700, marginBottom: '0.2rem' }}>
                {isMyAssignedBooth(activePoint) 
                  ? (language === 'vi' ? '⭐ GIAN HÀNG CỦA ĐƠN VỊ BẠN (ĐANG THUÊ)' : '⭐ YOUR ASSIGNED BOOTH')
                  : (language === 'vi' ? 'Thông tin gian hàng đang xem' : 'Inspected Booth Info')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#172421' }}>
                  {activePoint.code}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isMyAssignedBooth(activePoint) ? '#ECFDF5' : activePoint.status === 'available' ? '#E0F2FE' : '#F3F4F6',
                  color: isMyAssignedBooth(activePoint) ? '#065F46' : activePoint.status === 'available' ? '#0369A1' : '#4B5563',
                  border: `1px solid ${isMyAssignedBooth(activePoint) ? '#A7F3D0' : activePoint.status === 'available' ? '#BAE6FD' : '#D1D5DB'}`
                }}>
                  ● {isMyAssignedBooth(activePoint) ? (language === 'vi' ? 'Đang thuê bởi bạn' : 'Rented by you') : activePoint.statusLabelVi}
                </span>
              </div>
              {(activePoint.orgName || (isMyAssignedBooth(activePoint) && organization?.name)) && (
                <div style={{ fontSize: '0.84rem', color: '#556B65', marginTop: '0.25rem' }}>
                  <span>{language === 'vi' ? 'Đơn vị:' : 'Org:'} {isMyAssignedBooth(activePoint) ? (organization?.name || activePoint.orgName) : activePoint.orgName}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {isMyAssignedBooth(activePoint) && (
              <Link
                to="/partner/booths"
                className="btn-part-primary"
                style={{
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.84rem',
                  background: '#059669',
                  borderColor: '#047857',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Store size={15} />
                <span>{language === 'vi' ? 'Quản lý gian hàng' : 'Manage Booth'}</span>
              </Link>
            )}
            <button 
              type="button"
              className="btn-booth-cancel"
              onClick={() => setActivePoint(null)}
            >
              {language === 'vi' ? 'Đóng chi tiết' : 'Close'}
            </button>
          </div>
        </div>
      ) : (
        <div className="booth-selection-summary-card" style={{ background: '#F8FAF9', border: '1px dashed #D1DCD7', justifyContent: 'center', textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#637771', fontSize: '0.88rem' }}>
            <Info size={18} color="#17382E" />
            <span>{language === 'vi' ? 'Nhấp vào một gian hàng trên sơ đồ để xem thông tin chi tiết vị trí và hiện trạng.' : 'Click on a booth on the map to view detailed information.'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

