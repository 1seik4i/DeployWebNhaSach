import { validateManagedContent } from '../../utils/inputValidation';
import { confirmModal } from '../../services/notificationModal';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Newspaper,
  Users,
  Save,
  RotateCcw,
  ExternalLink,
  Edit3,
  Plus,
  Trash2,
  Upload,
  Check,
  X,
  Sparkles,
  Building,
  Mail,
  Search,
  Calendar,
  Clock,
  Eye,
  Tag,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Briefcase,
  Crown,
  ShieldCheck,
  Award,
  Camera,
  Grid,
  ZoomIn,
  ZoomOut,
  Move,
  Target
} from 'lucide-react';
import { Language } from '../../types';
import {
  landingContentService,
  JourneyContent,
  OrganizationContent,
  PartnerItem
} from '../../services/landingContentService';
import { NewsArticle } from '../../pages/NewsExperience';
import VisionMissionBento from '../ui/VisionMissionBento';
import TimelineBlock01, { type TimelineItem } from '../ui/timeline-01';
import '../../pages/ExperienceShell.css';
import '../../pages/JourneyExperience.css';
import '../../pages/OrganizationExperience.css';
import '../../pages/NewsExperience.css';
import './AdminLandingEditorView.css';

export interface AdminLandingEditorViewProps {
  language: Language;
  initialSubTab?: 'journey' | 'news' | 'organization';
  onSubTabChange?: (tab: 'journey' | 'news' | 'organization') => void;
}

type SubTab = 'journey' | 'news' | 'organization';

const JOURNEY_CHAPTERS = [
  { id: 'brand-story', index: '1', vi: 'Giới thiệu chung', en: 'Introduction' },
  { id: 'tam-nhin-su-menh', index: '2', vi: 'Tầm nhìn & Sứ mệnh', en: 'Vision & Mission' },
  { id: 'history', index: '3', vi: 'Lịch sử phát triển', en: 'History & Growth' },
  { id: 'thanh-tuu', index: '4', vi: 'Thành tích', en: 'Achievements' },
  { id: 'doi-tac', index: '5', vi: 'Đối tác & Hợp tác', en: 'Partners' },
] as const;

export const AdminLandingEditorView: React.FC<AdminLandingEditorViewProps> = ({
  language,
  initialSubTab,
  onSubTabChange: _onSubTabChange
}) => {
  const vi = language === 'vi';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialSubTab || 'journey');
  const [activeChapter, setActiveChapter] = useState('brand-story');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [journey, setJourney] = useState<JourneyContent>(() => landingContentService.getJourney());
  const [newsList, setNewsList] = useState<NewsArticle[]>(() => landingContentService.getNews());
  const [org, setOrg] = useState<OrganizationContent>(() => landingContentService.getOrganization());
  const [newsFilter, setNewsFilter] = useState<string>('all');
  const filteredNews = useMemo(() => {
    const list = newsFilter === 'all' ? newsList : newsList.filter(n => n.category === newsFilter);
    return [...list].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [newsList, newsFilter]);

  // Image editing modal state
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;

    url: string;
    onSave: (url: string) => void;
    title: string;
  }>({
    isOpen: false,
    url: '',
    onSave: () => {},
    title: ''
  });

  useModalBehavior(imageModal.isOpen, () => setImageModal(previous => ({ ...previous, isOpen: false })));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync activeSubTab when prop changes from parent
  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAll = async () => {
    try {
      [journey, { articles: newsList }, org].forEach(value => validateManagedContent(value));
      await Promise.all([
        landingContentService.saveJourney(journey),
        landingContentService.saveNews(newsList),
        landingContentService.saveOrganization(org),
      ]);
      setHasUnsavedChanges(false);
      showToast(vi ? '✅ Đã lưu toàn bộ thay đổi lên máy chủ.' : '✅ All changes were saved to the server.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : (vi ? 'Không thể lưu nội dung.' : 'Could not save content.'));
    }
  };

  const handleResetCurrent = async () => {
    if (!await confirmModal(vi ? 'Bạn có chắc chắn muốn đặt lại nội dung phần này về mặc định ban đầu?' : 'Reset this section to default?')) {
      return;
    }
    try {
      if (activeSubTab === 'journey') {
        setJourney(await landingContentService.resetJourney());
      } else if (activeSubTab === 'news') {
        setNewsList(await landingContentService.resetNews());
      } else if (activeSubTab === 'organization') {
        setOrg(await landingContentService.resetOrganization());
      }
      setHasUnsavedChanges(false);
      showToast(vi ? '🔄 Đã xóa nội dung của phần này trên máy chủ.' : '🔄 This section was cleared on the server.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : (vi ? 'Không thể đặt lại nội dung.' : 'Could not reset content.'));
    }
  };

  const handleAddMilestone = () => {
    const newId = crypto.randomUUID();
    const newYear = String(new Date().getFullYear());
    setJourney(prev => {
      const milestones = prev.milestones || [];
      return {
        ...prev,
        milestones: [
          ...milestones,
          {
            id: newId,
            year: newYear,
            title: '',
            desc: '',
            image: '',
            badge: ''
          }
        ]
      };
    });
    setHasUnsavedChanges(true);

    setTimeout(() => {
      const items = document.querySelectorAll('.timeline-01-item');
      if (items.length > 0) {
        items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Image interactive position & zoom state
  const [imgZoom, setImgZoom] = useState<number>(1);
  const [imgPan, setImgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgShowGrid, setImgShowGrid] = useState<boolean>(true);
  const [imgShape, setImgShape] = useState<'circle' | 'rect'>('circle');
  const [isImgDragging, setIsImgDragging] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const openImagePicker = (currentUrl: string, title: string, onSave: (url: string) => void) => {
    setImgZoom(1);
    setImgPan({ x: 0, y: 0 });
    setImgShowGrid(true);
    const isAvatar = title.toLowerCase().includes('chân dung') || title.toLowerCase().includes('cán bộ');
    setImgShape(isAvatar ? 'circle' : 'rect');
    setImageModal({
      isOpen: true,
      url: currentUrl,
      title,
      onSave: (newUrl) => {
        onSave(newUrl);
        setHasUnsavedChanges(true);
        setImageModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleApplyImageCrop = () => {
    if (!imageModal.url) return;

    // If user didn't change pan and zoom, use raw URL
    if (imgZoom === 1 && imgPan.x === 0 && imgPan.y === 0) {
      imageModal.onSave(imageModal.url);
      return;
    }

    // Try canvas crop export
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const outputSize = 600;
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          imageModal.onSave(imageModal.url);
          return;
        }

        const vpSize = 320;
        const ratio = outputSize / vpSize;

        // Fill background
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, outputSize, outputSize);

        // Center origin & apply pan/zoom
        ctx.save();
        ctx.translate(outputSize / 2 + imgPan.x * ratio, outputSize / 2 + imgPan.y * ratio);
        ctx.scale(imgZoom, imgZoom);

        // Calculate aspect fit size of image in 320px box
        let renderW = vpSize;
        let renderH = (img.height / img.width) * vpSize;
        if (renderH < vpSize) {
          renderH = vpSize;
          renderW = (img.width / img.height) * vpSize;
        }

        ctx.drawImage(
          img,
          (-renderW / 2) * ratio,
          (-renderH / 2) * ratio,
          renderW * ratio,
          renderH * ratio
        );
        ctx.restore();

        const croppedData = canvas.toDataURL('image/jpeg', 0.92);
        imageModal.onSave(croppedData);
      } catch (err) {
        console.warn('Canvas export tainted, using original URL:', err);
        imageModal.onSave(imageModal.url);
      }
    };
    img.onerror = () => {
      imageModal.onSave(imageModal.url);
    };
    img.src = imageModal.url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!/^image\/(png|jpeg|gif|webp|avif)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
        showToast('Chọn ảnh PNG, JPEG, GIF, WebP hoặc AVIF, tối đa 5 MB.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setImgZoom(1);
          setImgPan({ x: 0, y: 0 });
          setImageModal(prev => ({ ...prev, url: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Inline Direct Editable Component
  const EditableText = ({
    value,
    onChange,
    className = '',
    tag = 'span',
    placeholder = 'Nhập nội dung...',
    style = {}
  }: {
    value: string;
    onChange: (val: string) => void;
    className?: string;
    tag?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'i' | 'div';
    placeholder?: string;
    style?: React.CSSProperties;
  }) => {
    const Tag = tag;
    return (
      <Tag
        className={`cms-live-editable ${className}`}
        contentEditable
        suppressContentEditableWarning
        style={style}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          const text = e.currentTarget.innerText || '';
          if (text !== value) {
            onChange(text);
            setHasUnsavedChanges(true);
          }
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' && tag !== 'p' && tag !== 'div') {
            e.preventDefault();
            (e.target as HTMLElement).blur();
          }
        }}
        data-placeholder={placeholder}
      >
        {value}
      </Tag>
    );
  };

  // Timeline Milestones for TimelineBlock01
  const timelineMilestones = useMemo(() => {
    if (journey.milestones && journey.milestones.length > 0) {
      return journey.milestones.map(m => ({
        year: m.year,
        badge: m.badge,
        title: m.title,
        desc: m.desc,
        tags: [m.badge],
        image: m.image,
        imageAlt: m.title
      }));
    }
    return [];
  }, [journey.milestones]);

  // Educational & Enterprise Partners (Dynamic from journey state)
  const educationPartners = journey.educationPartners || [];
  const enterprisePartners = journey.enterprisePartners || [];

  const renderPartnerLogo = (partner: PartnerItem) => {
    if (partner.logoUrl) {
      return (
        <img
          src={partner.logoUrl}
          alt={partner.name}
          style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain' }}
        />
      );
    }
    const lower = (partner.name || '').toLowerCase();
    const id = (partner.id || '').toLowerCase();

    if (id.includes('deakin') || lower.includes('deakin')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#111827" strokeWidth="6" />
            <path d="M36 30h16c14 0 22 8 22 20s-8 20-22 20H36V30zm10 32h6c8 0 12-4 12-12s-4-12-12-12h-6v24z" fill="#111827" />
          </svg>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', display: 'block' }}>DEAKIN</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4B5563', letterSpacing: '0.04em' }}>UNIVERSITY</span>
          </div>
        </div>
      );
    }
    if (id.includes('ntu') || lower.includes('nanyang')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="30" height="34" viewBox="0 0 60 70" fill="none">
            <path d="M30 2L5 14v26c0 18 25 28 25 28s25-10 25-28V14L30 2z" fill="#D92D20" />
            <path d="M30 6L9 16v22c0 14 21 24 21 24s21-10 21-24V16L30 6z" fill="#1E3A8A" />
            <path d="M30 18l4 8h9l-7 6 3 9-9-6-9 6 3-9-7-6h9z" fill="#FDB022" />
          </svg>
          <div style={{ lineHeight: 1.05, textAlign: 'left' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1E3A8A', letterSpacing: '-0.01em', display: 'block' }}>NANYANG</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#D92D20', letterSpacing: '0.02em', display: 'block' }}>TECHNOLOGICAL UNIVERSITY</span>
            <span style={{ fontSize: '0.52rem', fontWeight: 600, color: '#4B5563' }}>SINGAPORE</span>
          </div>
        </div>
      );
    }
    if (id.includes('nus') || lower.includes('nus') || lower.includes('singapore')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="32" height="36" viewBox="0 0 70 80" fill="none">
            <path d="M5 8h60v40c0 18-20 28-30 30-10-2-30-12-30-30V8z" fill="#003D7C" />
            <path d="M35 18c-8 0-14 6-14 14 0 6 4 11 10 13l-4 15h16l-4-15c6-2 10-7 10-13 0-8-6-14-14-14z" fill="#EF7C00" />
          </svg>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#003D7C', letterSpacing: '0.04em', display: 'block' }}>NUS</span>
            <span style={{ fontSize: '0.52rem', fontWeight: 600, color: '#4B5563', lineHeight: 1 }}>National University<br/>of Singapore</span>
          </div>
        </div>
      );
    }
    if (id.includes('swinburne') || lower.includes('swinburne')) {
      return (
        <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: '4px', overflow: 'hidden', border: '1px solid #111827' }}>
          <div style={{ background: '#111827', color: '#fff', padding: '4px 6px', fontSize: '0.72rem', fontWeight: 900, lineHeight: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span>SWIN</span>
            <span>BUR</span>
            <span style={{ color: '#E11D48' }}>*NE*</span>
          </div>
          <div style={{ background: '#DC2626', color: '#fff', padding: '4px 6px', fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, display: 'flex', alignItems: 'center', maxWidth: '82px' }}>
            SWINBURNE UNIVERSITY OF TECHNOLOGY
          </div>
        </div>
      );
    }
    if (id.includes('epita') || lower.includes('epita')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="40" height="30" viewBox="0 0 120 80" fill="none">
            <polygon points="10,40 50,10 70,25 40,40 70,55 50,70" fill="#0090D0" />
            <polygon points="50,10 110,40 50,70 70,55 90,40 70,25" fill="#005B94" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#005B94', letterSpacing: '0.06em', display: 'block', lineHeight: 1 }}>EPITA</span>
            <span style={{ fontSize: '0.48rem', fontWeight: 600, color: '#64748B' }}>GRADUATE SCHOOL OF ENGINEERING</span>
          </div>
        </div>
      );
    }
    if (id.includes('kedge') || lower.includes('kedge')) {
      return (
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', display: 'block', lineHeight: 0.95 }}>KEDGE</span>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.14em', borderTop: '1.5px solid #E11D48', paddingTop: '2px', display: 'inline-block' }}>BUSINESS SCHOOL</span>
        </div>
      );
    }
    if (id.includes('fpt') || lower.includes('fpt')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#0284C7' }}>F</span>
            <span style={{ color: '#EA580C' }}>P</span>
            <span style={{ color: '#16A34A' }}>T</span>
          </div>
          {partner.subText && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1F2937' }}>{partner.subText}</span>}
        </div>
      );
    }
    if (id.includes('vinai') || lower.includes('vinai')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#1E3A8A', color: '#fff', fontWeight: 900, fontSize: '0.9rem', padding: '3px 8px', borderRadius: '4px' }}>VinAI</div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E3A8A', letterSpacing: '0.05em' }}>RESEARCH</span>
        </div>
      );
    }
    if (id.includes('vingroup') || lower.includes('vingroup')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FACC15">
              <path d="M12 2L15 9H22L16.5 13.5L18.5 20.5L12 16L5.5 20.5L7.5 13.5L2 9H9L12 2Z" />
            </svg>
          </div>
          <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#DC2626', letterSpacing: '0.04em' }}>VINGROUP</span>
        </div>
      );
    }
    if (id.includes('topcv') || lower.includes('topcv')) {
      return (
        <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00B14F', letterSpacing: '-0.02em' }}>top</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>cv</span>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00B14F', display: 'inline-block', marginLeft: '1px' }} />
          </div>
          <span style={{ fontSize: '0.45rem', fontWeight: 600, color: '#6B7280' }}>Tiếp lợi thế, nối thành công</span>
        </div>
      );
    }
    if (id.includes('vinfast') || lower.includes('vinfast')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="24" height="22" viewBox="0 0 60 50" fill="none">
            <path d="M30 46L2 6h14l14 26L44 6h14L30 46z" fill="#94A3B8" />
            <path d="M30 38L12 8h8l10 18L40 8h8L30 38z" fill="#475569" />
          </svg>
          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#334155', letterSpacing: '0.12em' }}>VINFAST</span>
        </div>
      );
    }
    if (id.includes('siemens') || lower.includes('siemens')) {
      return (
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00646E', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>SIEMENS</span>
      );
    }
    if (id.includes('samsung') || lower.includes('samsung')) {
      return (
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1428A0', letterSpacing: '0.12em', fontFamily: 'sans-serif' }}>SAMSUNG</span>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14241F', letterSpacing: '0.02em', lineHeight: 1.2 }}>
          {partner.logoText || partner.name}
        </span>
        {partner.subText && (
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#6B7280', marginTop: '2px' }}>
            {partner.subText}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="admin-landing-editor-root">
      {/* 1. Header Toolbar */}
      <header className="editor-control-topbar">
        {/* Left: Active Section Title Badge */}
        <div className="editor-current-title-badge">
          <div className="editor-current-icon-box">
            {activeSubTab === 'journey' && <BookOpen size={20} />}
            {activeSubTab === 'news' && <Newspaper size={20} />}
            {activeSubTab === 'organization' && <Users size={20} />}
          </div>
          <div>
            <h2 className="editor-current-title">
              {activeSubTab === 'journey'
                ? (vi ? 'Chỉnh sửa trực tiếp: Về Đường Sách' : 'Direct Edit: About Book Street')
                : activeSubTab === 'news'
                ? (vi ? 'Chỉnh sửa trực tiếp: Tin tức & Hoạt động' : 'Direct Edit: News & Activities')
                : (vi ? 'Chỉnh sửa trực tiếp: Bộ Máy Tổ Chức' : 'Direct Edit: Organization Structure')}
            </h2>
 
          </div>
        </div>

        {/* Right: Actions */}
        <div className="editor-actions-group">

          <div className="editor-action-buttons-row">
            {/* Reset button */}
            <button
              type="button"
              className="editor-action-btn secondary"
              onClick={handleResetCurrent}
              title={vi ? 'Khôi phục nội dung phần này về mặc định' : 'Reset to default'}
            >
              <RotateCcw size={15} />
              <span>{vi ? 'Đặt lại' : 'Reset'}</span>
            </button>

            {/* View Public Page Link */}
            <a
              href={
                activeSubTab === 'journey'
                  ? '/hanh-trinh'
                  : activeSubTab === 'news'
                  ? '/tin-tuc'
                  : '/bo-may-to-chuc'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="editor-action-btn secondary"
              title={vi ? 'Mở trang thực tế ở tab mới' : 'View live page'}
            >
              <ExternalLink size={15} />
              <span>{vi ? 'Xem trang web' : 'Live Page'}</span>
            </a>

            {/* Save Button */}
            <button
              type="button"
              className={`editor-action-btn primary ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}
              onClick={handleSaveAll}
            >
              <Save size={16} />
              <span>{hasUnsavedChanges ? (vi ? 'Lưu thay đổi *' : 'Save Changes *') : (vi ? 'Đã lưu' : 'Saved')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Helper Bar */}
      <div className="editor-helper-bar">
        {hasUnsavedChanges && (
          <span style={{ color: '#D97706', fontWeight: 700 }}>
            {vi ? '⚠️ Có thay đổi chưa lưu' : '⚠️ Unsaved changes'}
          </span>
        )}
      </div>

      {/* 2. Main Live Canvas Stage (100% Identical Public Landing Page) */}
      <div className="editor-canvas-stage">
        {/* ==============================================================
            TAB 1: VỀ ĐƯỜNG SÁCH (100% Public Journey Experience)
            ============================================================== */}
        {activeSubTab === 'journey' && (
          <div className="journey-sheet is-open" style={{ position: 'relative', inset: 'auto', height: 'auto', overflow: 'visible', borderRadius: 0, width: '100%', maxWidth: '100%', boxShadow: 'none' }}>
            <div className="journey-document" style={{ width: '100%', maxWidth: '100%' }}>
              
              {/* 1. Hero Banner matching FPTU signature style with Left White Gradient Fade & Right Photo */}
              <section className="journey-hero fptu-style-hero">
                <div
                  className="fptu-hero-bg-photo editable-image-wrapper"
                  aria-hidden="true"
                  style={{
                    backgroundImage: journey.hero?.bgPhoto ? `url(${journey.hero.bgPhoto})` : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => openImagePicker(
                    journey.hero?.bgPhoto || '',
                    vi ? 'Ảnh bìa Hero Đường Sách' : 'Hero Cover Photo',
                    (url) => setJourney(prev => ({ ...prev, hero: { ...prev.hero, bgPhoto: url } }))
                  )}
                >
                  <div className="editable-image-overlay" style={{ opacity: 0.9, top: 16, right: 16, left: 'auto', bottom: 'auto', borderRadius: 8, padding: '8px 14px', background: 'rgba(0,0,0,0.65)', color: '#fff' }}>
                    <Upload size={16} />
                    <span>{vi ? 'Thay ảnh bìa Hero' : 'Change Hero Photo'}</span>
                  </div>
                </div>
                <div className="fptu-hero-gradient-overlay" aria-hidden="true" />
                <div className="journey-container fptu-hero-container">
                  <div className="fptu-hero-brand-lockup">
                    <div className="journey-hero-era" aria-label={journey.hero.era}>
                      <span aria-hidden="true" />
                      <strong>
                        <EditableText
                          value={journey.hero.era?.split('—')[0]?.trim() || ''}
                          onChange={(val) => {
                            const second = journey.hero.era?.split('—')[1]?.trim() || '';
                            setJourney(prev => ({ ...prev, hero: { ...prev.hero, era: `${val} — ${second}` } }));
                          }}
                        />
                      </strong>
                      <i aria-hidden="true">—</i>
                      <strong>
                        <EditableText
                          value={journey.hero.era?.split('—')[1]?.trim() || ''}
                          onChange={(val) => {
                            const first = journey.hero.era?.split('—')[0]?.trim() || '';
                            setJourney(prev => ({ ...prev, hero: { ...prev.hero, era: `${first} — ${val}` } }));
                          }}
                        />
                      </strong>
                    </div>
                    <h1 className="fptu-hero-main-title">
                      <span className="fptu-hero-line-1">
                        <EditableText
                          value={journey.hero.titleLine1}
                          onChange={(val) => setJourney(prev => ({ ...prev, hero: { ...prev.hero, titleLine1: val } }))}
                        />
                      </span>
                      <span className="fptu-hero-line-2">
                        <EditableText
                          value={journey.hero.titleLine2}
                          onChange={(val) => setJourney(prev => ({ ...prev, hero: { ...prev.hero, titleLine2: val } }))}
                        />
                      </span>
                      <span className="fptu-hero-line-3">
                        <EditableText
                          value={journey.hero.titleLine3}
                          onChange={(val) => setJourney(prev => ({ ...prev, hero: { ...prev.hero, titleLine3: val } }))}
                        />
                      </span>
                    </h1>
                    <p className="journey-hero-summary">
                      <EditableText
                        value={journey.hero.summary}
                        onChange={(val) => setJourney(prev => ({ ...prev, hero: { ...prev.hero, summary: val } }))}
                        tag="span"
                      />
                    </p>
                  </div>
                </div>
              </section>

              {/* Chapter Navigation Rail (100% match) */}
              <nav className="journey-chapter-rail" aria-label={vi ? 'Các chương hành trình' : 'Journey chapters'}>
                <div className="journey-container journey-chapter-rail-inner">
                  <div className="journey-rail-links-group">
                    {JOURNEY_CHAPTERS.map(chapter => (
                      <a
                        key={chapter.id}
                        href={`#${chapter.id}`}
                        className={`journey-chapter-link ${activeChapter === chapter.id ? 'is-active' : ''}`}
                        onClick={event => {
                          event.preventDefault();
                          setActiveChapter(chapter.id);
                          document.getElementById(chapter.id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <span className="journey-chapter-link-index">{chapter.index}</span>
                        <span>{vi ? chapter.vi : chapter.en}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </nav>

              {/* 2. CÂU CHUYỆN VỀ ĐƯỜNG SÁCH (Brand Story Gallery Mosaic) */}
              <section id="brand-story" className="journey-section journey-chapter journey-chapter--paper journey-brand-story-section">
                <div className="journey-container">
                  <div className="journey-section-header">
                    <h2 className="journey-section-title">
                      <EditableText
                        value={journey.brandStory.title}
                        onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, title: val } }))}
                        tag="span"
                      />
                    </h2>
                    <p className="journey-section-desc">
                      <EditableText
                        value={journey.brandStory.desc || ''}
                        onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, desc: val } }))}
                        tag="span"
                      />
                    </p>
                  </div>

                  <div className="journey-story-grid">
                    <div className="journey-story-left">
                      <h3 className="journey-story-heading">
                        <EditableText
                          value={journey.brandStory.heading}
                          onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, heading: val } }))}
                          tag="span"
                        />
                      </h3>
                      <p className="journey-story-paragraph">
                        <EditableText
                          value={journey.brandStory.paragraph1 || ''}
                          onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, paragraph1: val } }))}
                          tag="span"
                        />
                      </p>
                      <p className="journey-story-paragraph">
                        <EditableText
                          value={journey.brandStory.paragraph2 || ''}
                          onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, paragraph2: val } }))}
                          tag="span"
                        />
                      </p>
                      <div className="journey-story-quote">
                        <p>
                          <EditableText
                            value={journey.brandStory.quote || ''}
                            onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, quote: val } }))}
                            tag="span"
                          />
                        </p>
                        <span>
                          — <EditableText
                            value={journey.brandStory.quoteAuthor}
                            onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, quoteAuthor: val } }))}
                          />
                        </span>
                      </div>
                    </div>

                    {/* Story Gallery Mosaic with click-to-change images & editable captions */}
                    <div className="journey-gallery-mosaic">
                      <div className="gallery-mosaic-col">
                        <div
                          className="gallery-mosaic-item large editable-image-wrapper"
                          onClick={() => openImagePicker(
                            journey.brandStory?.image1 || '',
                            'Ảnh 1: Không gian rợp bóng me',
                            (url) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image1: url } }))
                          )}
                        >
                          {journey.brandStory?.image1 && <img src={journey.brandStory.image1} alt="Không gian Đường Sách" />}
                          <div className="gallery-item-caption" onClick={(e) => e.stopPropagation()}>
                            <EditableText
                              value={journey.brandStory?.image1Caption || ''}
                              onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image1Caption: val } }))}
                            />
                          </div>
                          <div className="editable-image-overlay">
                            <Upload size={18} />
                            <span>{vi ? 'Thay ảnh' : 'Change Image'}</span>
                          </div>
                        </div>

                        <div className="gallery-mosaic-subrow">
                          <div
                            className="gallery-mosaic-item editable-image-wrapper"
                            onClick={() => openImagePicker(
                              journey.brandStory?.image2 || '',
                              'Ảnh 2: Cà phê sách',
                              (url) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image2: url } }))
                            )}
                          >
                            {journey.brandStory?.image2 && <img src={journey.brandStory.image2} alt="Cà phê sách" />}
                            <div className="gallery-item-caption" onClick={(e) => e.stopPropagation()}>
                              <EditableText
                                value={journey.brandStory?.image2Caption || ''}
                                onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image2Caption: val } }))}
                              />
                            </div>
                            <div className="editable-image-overlay">
                              <Upload size={16} />
                              <span>{vi ? 'Thay ảnh' : 'Change'}</span>
                            </div>
                          </div>

                          <div
                            className="gallery-mosaic-item editable-image-wrapper"
                            onClick={() => openImagePicker(
                              journey.brandStory?.image3 || '',
                              'Ảnh 3: Triển lãm',
                              (url) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image3: url } }))
                            )}
                          >
                            {journey.brandStory?.image3 && <img src={journey.brandStory.image3} alt="Triển lãm di sản" />}
                            <div className="gallery-item-caption" onClick={(e) => e.stopPropagation()}>
                              <EditableText
                                value={journey.brandStory?.image3Caption || ''}
                                onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image3Caption: val } }))}
                              />
                            </div>
                            <div className="editable-image-overlay">
                              <Upload size={16} />
                              <span>{vi ? 'Thay ảnh' : 'Change'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="gallery-mosaic-col single">
                        <div
                          className="gallery-mosaic-item tall editable-image-wrapper"
                          onClick={() => openImagePicker(
                            journey.brandStory?.image4 || '',
                            'Ảnh 4: Giao lưu tác giả & Sự kiện',
                            (url) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image4: url } }))
                          )}
                        >
                          {journey.brandStory?.image4 && <img src={journey.brandStory.image4} alt="Sự kiện sách" />}
                          <div className="gallery-item-caption" onClick={(e) => e.stopPropagation()}>
                            <EditableText
                              value={journey.brandStory?.image4Caption || ''}
                              onChange={(val) => setJourney(prev => ({ ...prev, brandStory: { ...prev.brandStory, image4Caption: val } }))}
                            />
                          </div>
                          <div className="editable-image-overlay">
                            <Upload size={18} />
                            <span>{vi ? 'Thay ảnh' : 'Change Image'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. TẦM NHÌN & SỨ MỆNH (VisionMissionBento 100% Public Match & Editable) */}
              <section id="tam-nhin-su-menh" className="journey-section journey-chapter journey-chapter--paper journey-vision-section">
                <div className="journey-container">
                  <VisionMissionBento
                    language={language}
                    data={journey.visionMission}
                    isEditable={true}
                    onUpdate={(updates) => {
                      setJourney(prev => ({
                        ...prev,
                        visionMission: { ...prev.visionMission, ...updates }
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    openImagePicker={openImagePicker}
                  />
                </div>
              </section>

              {/* 4. LỊCH SỬ HÌNH THÀNH (TimelineBlock01 100% Public Match & Editable) */}
              <section id="history" className="journey-section journey-chapter journey-chapter--sage">
                <div className="journey-container">
                  <TimelineBlock01
                    title={
                      <EditableText
                        value={journey.milestonesHeader?.title || ''}
                        onChange={(val) => setJourney(prev => ({ ...prev, milestonesHeader: { ...(prev.milestonesHeader || { desc: '' }), title: val } }))}
                      />
                    }
                    description={
                      <EditableText
                        value={journey.milestonesHeader?.desc || ''}
                        onChange={(val) => setJourney(prev => ({ ...prev, milestonesHeader: { ...(prev.milestonesHeader || { title: '' }), desc: val } }))}
                        tag="p"
                      />
                    }
                    items={journey.milestones.map((item, mIdx) => ({
                      id: item.id || `ms-${mIdx}`,
                      date: (
                        <EditableText
                          value={item.year}
                          onChange={(val) => {
                            const next = [...journey.milestones];
                            next[mIdx] = { ...next[mIdx], year: val };
                            setJourney(p => ({ ...p, milestones: next }));
                          }}
                        />
                      ),
                      title: (
                        <EditableText
                          value={item.title}
                          onChange={(val) => {
                            const next = [...journey.milestones];
                            next[mIdx] = { ...next[mIdx], title: val };
                            setJourney(p => ({ ...p, milestones: next }));
                          }}
                        />
                      ),
                      badge: (
                        <EditableText
                          value={item.badge}
                          onChange={(val) => {
                            const next = [...journey.milestones];
                            next[mIdx] = { ...next[mIdx], badge: val };
                            setJourney(p => ({ ...p, milestones: next }));
                          }}
                        />
                      ),
                      description: (
                        <div>
                          <div style={{ margin: '0 0 0.5rem' }}>
                            <EditableText
                              value={item.desc}
                              onChange={(val) => {
                                const next = [...journey.milestones];
                                next[mIdx] = { ...next[mIdx], desc: val };
                                setJourney(p => ({ ...p, milestones: next }));
                              }}
                              tag="p"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="editor-card-del-btn"
                              style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
                              title={vi ? 'Thêm sự kiện tiếp theo' : 'Add event next'}
                              onClick={() => {
                                const newId = crypto.randomUUID();
                                const next = [...journey.milestones];
                                next.splice(mIdx + 1, 0, {
                                  id: newId,
                                  year: item.year || String(new Date().getFullYear()),
                                  title: '',
                                  desc: '',
                                  image: '',
                                  badge: ''
                                });
                                setJourney(p => ({ ...p, milestones: next }));
                                setHasUnsavedChanges(true);
                              }}
                            >
                              <Plus size={12} />
                              <span>{vi ? 'Thêm sự kiện' : 'Add Event'}</span>
                            </button>
                            <button
                              type="button"
                              className="editor-card-del-btn"
                              style={{ background: '#E0F2FE', color: '#0284C7', borderColor: '#BAE6FD' }}
                              onClick={() => openImagePicker(
                                item.image,
                                `Ảnh mốc ${item.year}`,
                                (url) => {
                                  const next = [...journey.milestones];
                                  next[mIdx] = { ...next[mIdx], image: url };
                                  setJourney(p => ({ ...p, milestones: next }));
                                }
                              )}
                            >
                              <Upload size={12} />
                              <span>{vi ? 'Thay ảnh' : 'Change Image'}</span>
                            </button>
                            <button
                              type="button"
                              className="editor-card-del-btn"
                              onClick={async () => {
                                if (await confirmModal(vi ? `Xóa cột mốc ${item.year}?` : 'Delete milestone?')) {
                                  setJourney(p => ({ ...p, milestones: p.milestones.filter((_, idx) => idx !== mIdx) }));
                                  setHasUnsavedChanges(true);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                              <span>{vi ? 'Xóa mốc' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      ),
                      image: item.image,
                      imageAlt: item.title,
                      tags: [item.badge]
                    }))}
                  />

                  {/* Nút chuyển xuống dưới để thêm cột mốc / sự kiện lịch sử */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
                    <button
                      type="button"
                      className="editor-add-item-btn"
                      style={{
                        padding: '0.85rem 2.25rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        gap: '0.65rem',
                        borderRadius: '999px',
                        background: '#182924',
                        color: '#FFFFFF',
                        border: '1px solid #2d4c42',
                        boxShadow: '0 6px 18px rgba(24, 41, 36, 0.18)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      onClick={handleAddMilestone}
                    >
                      <Plus size={18} />
                      <span>{vi ? 'Thêm cột mốc / sự kiện lịch sử mới' : 'Add New Milestone / Event'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 5. THÀNH TỰU & CON SỐ NỔI BẬT (Achievements 100% Match & Editable) */}
              <section id="thanh-tuu" className="journey-section journey-chapter journey-chapter--dark">
                <div className="journey-container">
                  <div className="journey-section-header">
                    <h2 className="journey-section-title">
                      <EditableText
                        value={journey.achievementsHeader?.title || ''}
                        onChange={(val) => setJourney(prev => ({ ...prev, achievementsHeader: { ...(prev.achievementsHeader || { desc: '' }), title: val } }))}
                      />
                    </h2>
                    <p className="journey-section-desc">
                      <EditableText
                        value={journey.achievementsHeader?.desc || ''}
                        onChange={(val) => setJourney(prev => ({ ...prev, achievementsHeader: { ...(prev.achievementsHeader || { title: '' }), desc: val } }))}
                        tag="p"
                      />
                    </p>
                  </div>

                  {/* Achievement Cards with direct editable numbers & labels */}
                  <div className="journey-achieve-grid">
                    {(journey.achievements || []).map((ach, idx) => (
                      <div key={idx} className="journey-achieve-card">
                        <div className="journey-achieve-num">
                          <EditableText
                            value={String(ach.value)}
                            onChange={(val) => {
                              const num = parseInt(val, 10) || 0;
                              const next = [...journey.achievements];
                              next[idx].value = num;
                              setJourney(p => ({ ...p, achievements: next }));
                            }}
                          />
                          <EditableText
                            value={ach.suffix}
                            onChange={(val) => {
                              const next = [...journey.achievements];
                              next[idx].suffix = val;
                              setJourney(p => ({ ...p, achievements: next }));
                            }}
                          />
                        </div>
                        <div className="journey-achieve-label">
                          <EditableText
                            value={ach.label}
                            onChange={(val) => {
                              const next = [...journey.achievements];
                              next[idx].label = val;
                              setJourney(p => ({ ...p, achievements: next }));
                            }}
                          />
                        </div>
                        <p className="journey-achieve-desc">
                          <EditableText
                            value={ach.desc}
                            onChange={(val) => {
                              const next = [...journey.achievements];
                              next[idx].desc = val;
                              setJourney(p => ({ ...p, achievements: next }));
                            }}
                            tag="p"
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 6. ĐỐI TÁC VÀ HỢP TÁC QUỐC TẾ (100% Match & Editable) */}
              <section id="doi-tac" className="journey-section journey-chapter journey-chapter--paper journey-partners-section">
                <div className="journey-container">
                  <div className="journey-partners-header-wrap">
                    <div>
                      <h2 className="journey-partners-main-title">
                        <EditableText
                          value={journey.partnersHeader?.title || ''}
                          onChange={(val) => setJourney(prev => ({ ...prev, partnersHeader: { ...(prev.partnersHeader || { eduTitle: '', corpTitle: '' }), title: val } }))}
                        />
                      </h2>
                    </div>
                  </div>

                  {/* Category 1: Educational Partners */}
                  <div className="journey-partners-category">
                    <div className="journey-partners-cat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 className="journey-partners-cat-title" style={{ margin: 0 }}>
                        <GraduationCap size={18} color="#EA580C" />
                        <EditableText
                          value={journey.partnersHeader?.eduTitle || ''}
                          onChange={(val) => setJourney(prev => ({ ...prev, partnersHeader: { ...(prev.partnersHeader || { title: '', corpTitle: '' }), eduTitle: val } }))}
                        />
                      </h3>
                      <button
                        type="button"
                        className="editor-add-item-btn"
                        style={{ margin: 0, padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          const newPartner: PartnerItem = {
                            id: `edu-${Date.now()}`,
                            name: vi ? 'Trường Đại học Mới' : 'New University',
                            category: 'education',
                            logoText: 'NEW UNI',
                            subText: vi ? 'Đối tác học thuật' : 'Academic Partner',
                            logoUrl: ''
                          };
                          setJourney(prev => ({
                            ...prev,
                            educationPartners: [...(prev.educationPartners || []), newPartner]
                          }));
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <Plus size={14} />
                        <span>{vi ? 'Thêm Logo Đối tác Giáo dục' : 'Add Education Partner'}</span>
                      </button>
                    </div>
                    <div className="journey-partners-cat-line" style={{ marginBottom: '1.25rem' }} />

                    {/* Interactive Editable Grid of Education Partner Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {educationPartners.map((partner, pIdx) => (
                        <div
                          key={partner.id || pIdx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Logo Box with Click to Upload / Change */}
                          <div
                            onClick={() => {
                              setImageModal({
                                isOpen: true,
                                url: partner.logoUrl || '',
                                title: vi ? `Thay đổi logo: ${partner.name}` : `Change Logo: ${partner.name}`,
                                onSave: (newUrl) => {
                                  const next = [...(journey.educationPartners || [])];
                                  next[pIdx] = { ...next[pIdx], logoUrl: newUrl };
                                  setJourney(prev => ({ ...prev, educationPartners: next }));
                                  setHasUnsavedChanges(true);
                                  setImageModal(p => ({ ...p, isOpen: false }));
                                }
                              });
                            }}
                            title={vi ? 'Bấm để thay đổi hình ảnh logo hoặc tải từ máy tính' : 'Click to change logo'}
                            style={{
                              minHeight: '64px',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#F8FAFC',
                              borderRadius: '8px',
                              border: '1px dashed #CBD5E1',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              marginBottom: '0.75rem',
                              position: 'relative'
                            }}
                          >
                            {renderPartnerLogo(partner)}
                            <span
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(15,23,42,0.75)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                padding: '2px 5px',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <Edit3 size={10} />
                              <span>{vi ? 'Đổi logo' : 'Edit'}</span>
                            </span>
                          </div>

                          <div style={{ width: '100%', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block' }}>{vi ? 'Tên đối tác:' : 'Name:'}</span>
                            <EditableText
                              value={partner.name}
                              onChange={(val) => {
                                const next = [...(journey.educationPartners || [])];
                                next[pIdx] = { ...next[pIdx], name: val };
                                setJourney(prev => ({ ...prev, educationPartners: next }));
                              }}
                              style={{ fontWeight: 750, color: '#0F172A', fontSize: '0.88rem' }}
                            />
                          </div>

                          <div style={{ width: '100%', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block' }}>{vi ? 'Phụ đề / Ngành:' : 'Subtext:'}</span>
                            <EditableText
                              value={partner.subText || ''}
                              placeholder={vi ? 'Nhập phụ đề...' : 'Enter subtext...'}
                              onChange={(val) => {
                                const next = [...(journey.educationPartners || [])];
                                next[pIdx] = { ...next[pIdx], subText: val };
                                setJourney(prev => ({ ...prev, educationPartners: next }));
                              }}
                              style={{ fontSize: '0.75rem', color: '#475569' }}
                            />
                          </div>

                          <button
                            type="button"
                            className="editor-card-del-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={async () => {
                              if (await confirmModal(vi ? `Xóa logo đối tác "${partner.name}"?` : 'Delete partner?')) {
                                const next = (journey.educationPartners || []).filter((_, idx) => idx !== pIdx);
                                setJourney(prev => ({ ...prev, educationPartners: next }));
                                setHasUnsavedChanges(true);
                              }
                            }}
                          >
                            <Trash2 size={12} />
                            <span>{vi ? 'Xóa logo' : 'Delete'}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Marquee ticker live preview */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="#EA580C" />
                      <span>{vi ? 'Thanh cuộn logo tự động trên Landing Page:' : 'Live Marquee Preview:'}</span>
                    </div>
                    <div className="journey-partners-marquee-container">
                      <div className="journey-partners-marquee-track">
                        {[...educationPartners, ...educationPartners].map((partner, pIdx) => (
                          <div key={`${partner.id}-${pIdx}`} className="journey-partner-card" title={partner.name}>
                            <div className="journey-partner-logo-wrap">
                              {renderPartnerLogo(partner)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Enterprise Partners */}
                  <div className="journey-partners-category" style={{ marginTop: '2.5rem' }}>
                    <div className="journey-partners-cat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 className="journey-partners-cat-title" style={{ margin: 0 }}>
                        <Briefcase size={18} color="#0284C7" />
                        <EditableText
                          value={journey.partnersHeader?.corpTitle || ''}
                          onChange={(val) => setJourney(prev => ({ ...prev, partnersHeader: { ...(prev.partnersHeader || { title: '', eduTitle: '' }), corpTitle: val } }))}
                        />
                      </h3>
                      <button
                        type="button"
                        className="editor-add-item-btn"
                        style={{ margin: 0, padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
                        onClick={() => {
                          const newPartner: PartnerItem = {
                            id: `corp-${Date.now()}`,
                            name: vi ? 'Doanh nghiệp Mới' : 'New Enterprise',
                            category: 'enterprise',
                            logoText: 'NEW CORP',
                            subText: vi ? 'Đối tác doanh nghiệp' : 'Corporate Partner',
                            logoUrl: ''
                          };
                          setJourney(prev => ({
                            ...prev,
                            enterprisePartners: [...(prev.enterprisePartners || []), newPartner]
                          }));
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <Plus size={14} />
                        <span>{vi ? 'Thêm Logo Doanh Nghiệp' : 'Add Corporate Partner'}</span>
                      </button>
                    </div>
                    <div className="journey-partners-cat-line" style={{ marginBottom: '1.25rem' }} />

                    {/* Interactive Editable Grid of Enterprise Partner Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {enterprisePartners.map((partner, pIdx) => (
                        <div
                          key={partner.id || pIdx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Logo Box with Click to Upload / Change */}
                          <div
                            onClick={() => {
                              setImageModal({
                                isOpen: true,
                                url: partner.logoUrl || '',
                                title: vi ? `Thay đổi logo: ${partner.name}` : `Change Logo: ${partner.name}`,
                                onSave: (newUrl) => {
                                  const next = [...(journey.enterprisePartners || [])];
                                  next[pIdx] = { ...next[pIdx], logoUrl: newUrl };
                                  setJourney(prev => ({ ...prev, enterprisePartners: next }));
                                  setHasUnsavedChanges(true);
                                  setImageModal(p => ({ ...p, isOpen: false }));
                                }
                              });
                            }}
                            title={vi ? 'Bấm để thay đổi hình ảnh logo hoặc tải từ máy tính' : 'Click to change logo'}
                            style={{
                              minHeight: '64px',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#F8FAFC',
                              borderRadius: '8px',
                              border: '1px dashed #CBD5E1',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              marginBottom: '0.75rem',
                              position: 'relative'
                            }}
                          >
                            {renderPartnerLogo(partner)}
                            <span
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(15,23,42,0.75)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                padding: '2px 5px',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <Edit3 size={10} />
                              <span>{vi ? 'Đổi logo' : 'Edit'}</span>
                            </span>
                          </div>

                          <div style={{ width: '100%', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', display: 'block' }}>{vi ? 'Tên doanh nghiệp:' : 'Name:'}</span>
                            <EditableText
                              value={partner.name}
                              onChange={(val) => {
                                const next = [...(journey.enterprisePartners || [])];
                                next[pIdx] = { ...next[pIdx], name: val };
                                setJourney(prev => ({ ...prev, enterprisePartners: next }));
                              }}
                              style={{ fontWeight: 750, color: '#0F172A', fontSize: '0.88rem' }}
                            />
                          </div>

                          <div style={{ width: '100%', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'block' }}>{vi ? 'Phụ đề / Ngành:' : 'Subtext:'}</span>
                            <EditableText
                              value={partner.subText || ''}
                              placeholder={vi ? 'Nhập phụ đề...' : 'Enter subtext...'}
                              onChange={(val) => {
                                const next = [...(journey.enterprisePartners || [])];
                                next[pIdx] = { ...next[pIdx], subText: val };
                                setJourney(prev => ({ ...prev, enterprisePartners: next }));
                              }}
                              style={{ fontSize: '0.75rem', color: '#475569' }}
                            />
                          </div>

                          <button
                            type="button"
                            className="editor-card-del-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={async () => {
                              if (await confirmModal(vi ? `Xóa logo doanh nghiệp "${partner.name}"?` : 'Delete enterprise?')) {
                                const next = (journey.enterprisePartners || []).filter((_, idx) => idx !== pIdx);
                                setJourney(prev => ({ ...prev, enterprisePartners: next }));
                                setHasUnsavedChanges(true);
                              }
                            }}
                          >
                            <Trash2 size={12} />
                            <span>{vi ? 'Xóa logo' : 'Delete'}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Marquee ticker live preview */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="#0284C7" />
                      <span>{vi ? 'Thanh cuộn logo tự động trên Landing Page:' : 'Live Marquee Preview:'}</span>
                    </div>
                    <div className="journey-partners-marquee-container">
                      <div className="journey-partners-marquee-track track-reverse">
                        {[...enterprisePartners, ...enterprisePartners].map((partner, pIdx) => (
                          <div key={`${partner.id}-${pIdx}`} className="journey-partner-card" title={partner.name}>
                            <div className="journey-partner-logo-wrap">
                              {renderPartnerLogo(partner)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 2: TIN TỨC & HOẠT ĐỘNG (100% Public News Experience)
            ============================================================== */}
        {activeSubTab === 'news' && (
          <div className="news-sheet is-open" style={{ position: 'relative', inset: 'auto', height: 'auto', overflow: 'visible', borderRadius: 0, width: '100%', maxWidth: '100%', boxShadow: 'none' }}>
            <main className="news-document" style={{ width: '100%', maxWidth: '100%' }}>
              
              {/* 1. Hero Section matching FPTU signature style with Left White Gradient Fade & Right Photo */}
              <section className="news-hero-fptu">
                <div className="news-hero-bg-photo" aria-hidden="true" />
                <div className="news-hero-gradient-overlay" aria-hidden="true" />

                <div className="news-hero-container">
                  <div className="news-hero-brand-lockup">
                    <div className="news-hero-era">
                      <span />
                      <i>{vi ? 'BẢN TIN CHÍNH THỨC • ĐƯỜNG SÁCH TP.HCM' : 'OFFICIAL NEWS • HCMC BOOK STREET'}</i>
                      <span />
                    </div>

                    <h1 className="news-hero-title">
                      {vi ? (
                        <>
                          Dòng Chảy Tri Thức &<br />
                          <em>Nhịp Sống Đường Sách</em>
                        </>
                      ) : (
                        <>
                          The Flow of Knowledge &<br />
                          <em>Book Street Pulse</em>
                        </>
                      )}
                    </h1>

                    <p className="news-hero-lead">
                      {vi
                        ? 'Cập nhật liên tục những tin tức mới nhất về ngành xuất bản, thông cáo báo chí, sự kiện giao lưu tác giả và các hoạt động văn hóa tiêu biểu tại trung tâm TP. Hồ Chí Minh.'
                        : 'Stay informed with official publishing updates, press releases, author conversations, and cultural highlights in the heart of Ho Chi Minh City.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Main Collection Section with Category Filter Tabs & Add Button */}
              <section className="heritage-inner heritage-collection" id="news-collection" style={{ paddingTop: '2.5rem' }}>
                <div className="heritage-collection-title">
                  <div>
                    <span className="heritage-section-marker">
                      {vi ? 'Tin tức & Hoạt động' : 'News & Activities'}
                    </span>
                    <h2>{vi ? 'Danh mục các bài viết' : 'All News & Articles'}</h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="button"
                      className="editor-add-item-btn"
                      style={{ margin: 0, padding: '0.65rem 1.25rem' }}
                      onClick={() => {
                        const newArt: NewsArticle = {
                          id: crypto.randomUUID(),
                          titleVi: '',
                          titleEn: '',
                          category: 'van-hoa',
                          categoryLabelVi: 'Sự kiện & Hoạt động',
                          categoryLabelEn: 'Events',
                          publishedDate: new Date().toLocaleDateString('vi-VN'),
                          readTime: '',
                          views: 0,
                          imageUrl: '',
                          imageCaptionVi: '',
                          imageCaptionEn: '',
                          summaryVi: '',
                          summaryEn: '',
                          contentVi: [],
                          contentEn: [],
                          author: '',
                          tags: []
                        };
                        setNewsList(prev => [newArt, ...prev]);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <Plus size={16} />
                      <span>{vi ? 'Thêm bài viết mới' : 'Add New Article'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Row */}
                <div className="heritage-filter-row">
                  <div className="heritage-filters">
                    <button type="button" aria-pressed={newsFilter === 'all'} onClick={() => setNewsFilter('all')}>
                      {vi ? 'Tất cả tin tức' : 'All'} ({newsList.length})
                    </button>
                    <button type="button" aria-pressed={newsFilter === 'van-hoa'} onClick={() => setNewsFilter('van-hoa')}>
                      {vi ? 'Sự kiện & Hoạt động' : 'Events'} ({newsList.filter(n => n.category === 'van-hoa').length})
                    </button>
                    <button type="button" aria-pressed={newsFilter === 'tac-gia'} onClick={() => setNewsFilter('tac-gia')}>
                      {vi ? 'Văn hóa đọc' : 'Reading Culture'} ({newsList.filter(n => n.category === 'tac-gia').length})
                    </button>
                    <button type="button" aria-pressed={newsFilter === 'thong-cao'} onClick={() => setNewsFilter('thong-cao')}>
                      {vi ? 'Thông cáo báo chí' : 'Press'} ({newsList.filter(n => n.category === 'thong-cao').length})
                    </button>
                    <button type="button" aria-pressed={newsFilter === 'nhip-song'} onClick={() => setNewsFilter('nhip-song')}>
                      {vi ? 'Nhịp sống Đường Sách' : 'Life'} ({newsList.filter(n => n.category === 'nhip-song').length})
                    </button>
                  </div>
                  <span>{filteredNews.length} {vi ? 'bài viết' : 'articles'}</span>
                </div>

                {/* Baomoi-style News Cards Grid */}
                <div className="news-baomoi-grid">
                  {filteredNews.map((article) => {
                    const aIdx = newsList.findIndex(n => n.id === article.id);
                    return (
                      <article
                        key={article.id}
                        className={`news-baomoi-card ${article.featured ? 'news-baomoi-card-featured' : ''}`}
                        style={{ position: 'relative' }}
                      >
                        <div
                          className="news-baomoi-thumb-wrap editable-image-wrapper"
                          onClick={() => openImagePicker(article.imageUrl, `Ảnh bài viết: ${article.titleVi}`, (url) => {
                            const next = [...newsList];
                            if (aIdx >= 0) {
                              next[aIdx].imageUrl = url;
                              setNewsList(next);
                            }
                          })}
                        >
                          <img src={article.imageUrl} alt={article.titleVi} className="news-baomoi-thumb-img" loading="lazy" />
                          <div className="editable-image-overlay">
                            <Upload size={16} />
                            <span>{vi ? 'Đổi ảnh' : 'Change'}</span>
                          </div>
                          {article.featured && (
                            <span className="news-baomoi-featured-pill">
                              <Sparkles size={11} />
                              <span>{vi ? 'TIÊU ĐIỂM' : 'FEATURED'}</span>
                            </span>
                          )}
                          <span className="news-baomoi-cat-pill">
                            <EditableText
                              value={article.categoryLabelVi}
                              onChange={(val) => {
                                const next = [...newsList];
                                if (aIdx >= 0) {
                                  next[aIdx].categoryLabelVi = val;
                                  setNewsList(next);
                                }
                              }}
                            />
                          </span>
                        </div>

                        <div className="news-baomoi-content">
                          <h3 className="news-baomoi-title">
                            <EditableText
                              value={article.titleVi}
                              onChange={(val) => {
                                const next = [...newsList];
                                if (aIdx >= 0) {
                                  next[aIdx].titleVi = val;
                                  setNewsList(next);
                                }
                              }}
                            />
                          </h3>

                          <p className="news-baomoi-snippet">
                            <EditableText
                              value={article.summaryVi}
                              onChange={(val) => {
                                const next = [...newsList];
                                if (aIdx >= 0) {
                                  next[aIdx].summaryVi = val;
                                  setNewsList(next);
                                }
                              }}
                            />
                          </p>

                          <div className="news-baomoi-meta-row">
                            <div className="news-baomoi-source-group">
                              <span className="news-baomoi-source-name">
                                <EditableText
                                  value={article.author}
                                  onChange={(val) => {
                                    const next = [...newsList];
                                    if (aIdx >= 0) {
                                      next[aIdx].author = val;
                                      setNewsList(next);
                                    }
                                  }}
                                />
                              </span>
                              <span className="news-baomoi-dot">•</span>
                              <span className="news-baomoi-time">
                                <EditableText
                                  value={article.publishedDate}
                                  onChange={(val) => {
                                    const next = [...newsList];
                                    if (aIdx >= 0) {
                                      next[aIdx].publishedDate = val;
                                      setNewsList(next);
                                    }
                                  }}
                                />
                              </span>
                            </div>

                            <button
                              type="button"
                              className="editor-card-del-btn"
                              onClick={async () => {
                                if (await confirmModal(vi ? `Xóa bài viết "${article.titleVi}"?` : 'Delete article?')) {
                                  setNewsList(prev => prev.filter(item => item.id !== article.id));
                                  setHasUnsavedChanges(true);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                              <span>{vi ? 'Xóa' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </main>
          </div>
        )}

        {/* ==============================================================
            TAB 3: BỘ MÁY TỔ CHỨC (100% Public Organization Experience)
            ============================================================== */}
        {activeSubTab === 'organization' && (
          <div className="org-sheet is-open" style={{ position: 'relative', inset: 'auto', height: 'auto', overflow: 'visible', borderRadius: 0, width: '100%', maxWidth: '100%', boxShadow: 'none' }}>
            <main className="org-document" style={{ width: '100%', maxWidth: '100%' }}>
              
              {/* 1. Hero Banner matching "Về Đường Sách" FPTU Signature Style (100% Match) */}
              <section className="org-hero-fptu">
                <div className="org-hero-bg-photo" aria-hidden="true" />
                <div className="org-hero-gradient-overlay" aria-hidden="true" />

                <div className="org-hero-container">
                  <div className="org-hero-brand-lockup">
                    <div className="org-hero-era">
                      <span />
                      <i>
                        <EditableText
                          value={org.hero.era}
                          onChange={(val) => setOrg(p => ({ ...p, hero: { ...p.hero, era: val } }))}
                        />
                      </i>
                      <span />
                    </div>

                    <h1 className="org-hero-title">
                      <EditableText
                        value={org.hero.title}
                        onChange={(val) => setOrg(p => ({ ...p, hero: { ...p.hero, title: val } }))}
                      />
                    </h1>

                    <p className="org-hero-lead">
                      <EditableText
                        value={org.hero.lead || ''}
                        onChange={(val) => setOrg(p => ({ ...p, hero: { ...p.hero, lead: val } }))}
                        tag="span"
                      />
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Leadership Directory Section (3-Tier Circular Hierarchy Tree Editor) */}
              <section className="org-directory-section" style={{ background: '#FFFFFF' }}>
                <div className="org-container">
                  {/* Header with Live Editable Text */}
                  <div className="org-fptu-header-card">
                    <h2 className="org-fptu-main-title">
                      <EditableText
                        value={org.directory?.titleLine1 || ''}
                        onChange={(val) => {
                          setOrg(p => ({
                            ...p,
                            directory: { ...p.directory, titleLine1: val }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        tag="span"
                      />
                      {' '}
                      <span className="org-fptu-title-highlight">
                        <EditableText
                          value={org.directory?.titleHighlight || ''}
                          onChange={(val) => {
                            setOrg(p => ({
                              ...p,
                              directory: { ...p.directory, titleHighlight: val }
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          tag="span"
                        />
                      </span>
                    </h2>

                    <div className="org-fptu-divider-flourish" aria-hidden="true">
                      <span className="flourish-line" />
                      <span className="flourish-dot" />
                      <span className="flourish-diamond">❖</span>
                      <span className="flourish-dot" />
                      <span className="flourish-line" />
                    </div>

                    <p className="org-fptu-subtitle">
                      <EditableText
                        value={org.directory?.subtitle || ''}
                        onChange={(val) => {
                          setOrg(p => ({
                            ...p,
                            directory: { ...p.directory, subtitle: val }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        tag="span"
                      />
                    </p>
                  </div>

                  {/* 3-TIER LIVE EDITABLE TREE CONTAINER */}
                  <div className="org-tree-wrapper">
                    
                    {/* --- TẦNG 1: VỊ TRÍ LÃNH ĐẠO CAO NHẤT (ĐỈNH) --- */}
                    <div className="org-tree-tier-wrapper">
                      <div className="org-tree-editor-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ display: 'inline-flex', padding: '5px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706' }}>
                            <Crown size={16} />
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#92400E' }}>
                            {vi ? 'TẦNG 1: VỊ TRÍ LÃNH ĐẠO CAO NHẤT (GIÁM ĐỐC / CHỦ TỊCH)' : 'TIER 1: HIGHEST LEADERSHIP'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="editor-add-item-btn"
                          style={{ margin: 0, padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                          onClick={() => {
                            const newLeader: OrganizationContent['leaders'][0] = {
                              id: crypto.randomUUID(),
                              tier: 1,
                              nameVi: '', roleVi: '', badgeVi: '', subVi: '', bioVi: '',
                              contactEmail: '', avatarText: '', imageUrl: '', tagsVi: []
                            };
                            setOrg(p => ({ ...p, leaders: [newLeader, ...p.leaders] }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <Plus size={13} />
                          <span>{vi ? 'Thêm cán bộ Tầng 1' : 'Add Tier 1 Leader'}</span>
                        </button>
                      </div>

                      <div className="org-tree-tier tier-1">
                        {org.leaders
                          .map((leader, lIdx) => ({ leader, lIdx }))
                          .filter(({ leader }) => (leader.tier || 1) === 1)
                          .map(({ leader, lIdx }) => (
                            <div
                              key={leader.id}
                              className="org-tree-card tier-1-card"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '20px',
                                padding: '1.5rem 1.25rem 1rem',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                width: '310px'
                              }}
                            >
                              {/* Avatar Box with Hover Camera */}
                              <div
                                className="org-tree-avatar-box tier-1-avatar"
                                style={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => {
                                  openImagePicker(
                                    leader.imageUrl || '',
                                    vi ? `Thay ảnh chân dung: ${leader.nameVi}` : `Change Photo: ${leader.nameVi}`,
                                    (newUrl) => {
                                      const next = [...org.leaders];
                                      next[lIdx].imageUrl = newUrl;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }
                                  );
                                }}
                                title={vi ? 'Bấm để đổi ảnh chân dung' : 'Click to change portrait photo'}
                              >
                                <img
                                  src={leader.imageUrl}
                                  alt={leader.nameVi}
                                  className="org-tree-avatar-img"
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    color: '#FFFFFF',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    borderRadius: '50%'
                                  }}
                                  className="editor-avatar-hover-overlay"
                                >
                                  <Camera size={22} />
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{vi ? 'Đổi ảnh' : 'Change'}</span>
                                </div>
                              </div>

                              {/* Leader Fields */}
                              <div className="org-tree-info" style={{ width: '100%' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Danh xưng & Họ tên:' : 'Prefix & Name:'}
                                </span>
                                <h3 className="org-tree-name" style={{ width: '100%', marginBottom: '0.35rem' }}>
                                  <EditableText
                                    value={leader.nameVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].nameVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </h3>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Chức vụ / Vị trí:' : 'Position / Role:'}
                                </span>
                                <p className="org-tree-role" style={{ width: '100%', margin: '0 0 0.35rem' }}>
                                  <EditableText
                                    value={leader.roleVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].roleVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </p>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Phòng ban / Đơn vị kiêm nhiệm:' : 'Department:'}
                                </span>
                                <p className="org-tree-sub" style={{ width: '100%', margin: '0 0 0.75rem' }}>
                                  <EditableText
                                    value={leader.subVi || ''}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].subVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    placeholder={vi ? 'Nhập đơn vị kiêm nhiệm...' : 'Enter sub text...'}
                                  />
                                </p>
                              </div>

                              {/* Actions Bar */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  paddingTop: '0.65rem',
                                  borderTop: '1px dashed #E2E8F0',
                                  gap: '0.5rem'
                                }}
                              >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>{vi ? 'Tầng:' : 'Tier:'}</span>
                                  <select
                                    value={leader.tier || 1}
                                    onChange={(e) => {
                                      const newTier = Number(e.target.value) as 1 | 2 | 3;
                                      const next = [...org.leaders];
                                      next[lIdx].tier = newTier;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      color: '#D97706',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value={1}>{vi ? '👑 Tầng 1' : '👑 Tier 1'}</option>
                                    <option value={2}>{vi ? '🛡️ Tầng 2' : '🛡️ Tier 2'}</option>
                                    <option value={3}>{vi ? '🎖️ Tầng 3' : '🎖️ Tier 3'}</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  className="editor-card-del-btn"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                  onClick={async () => {
                                    if (await confirmModal(vi ? `Xóa cán bộ "${leader.nameVi}"?` : 'Delete leader?')) {
                                      setOrg(p => ({ ...p, leaders: p.leaders.filter(i => i.id !== leader.id) }));
                                      setHasUnsavedChanges(true);
                                    }
                                  }}
                                >
                                  <Trash2 size={12} />
                                  <span>{vi ? 'Xóa' : 'Delete'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* --- TẦNG 2: BAN ĐIỀU HÀNH & PHÓ GIÁM ĐỐC (GIỮA) --- */}
                    <div className="org-tree-tier-wrapper">
                      <div className="org-tree-editor-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ display: 'inline-flex', padding: '5px', borderRadius: '8px', background: '#E0F2FE', color: '#0284C7' }}>
                            <ShieldCheck size={16} />
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0369A1' }}>
                            {vi ? 'TẦNG 2: BAN ĐIỀU HÀNH & PHÓ GIÁM ĐỐC THƯỜNG TRỰC' : 'TIER 2: EXECUTIVE BOARD & DEPUTY DIRECTORS'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="editor-add-item-btn"
                          style={{ margin: 0, padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                          onClick={() => {
                            const newLeader: OrganizationContent['leaders'][0] = {
                              id: crypto.randomUUID(),
                              tier: 2,
                              nameVi: '', roleVi: '', badgeVi: '', subVi: '', bioVi: '',
                              contactEmail: '', avatarText: '', imageUrl: '', tagsVi: []
                            };
                            setOrg(p => ({ ...p, leaders: [...p.leaders, newLeader] }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <Plus size={13} />
                          <span>{vi ? 'Thêm cán bộ Tầng 2' : 'Add Tier 2 Leader'}</span>
                        </button>
                      </div>

                      <div className="org-tree-tier tier-2">
                        {org.leaders
                          .map((leader, lIdx) => ({ leader, lIdx }))
                          .filter(({ leader }) => leader.tier === 2)
                          .map(({ leader, lIdx }) => (
                            <div
                              key={leader.id}
                              className="org-tree-card tier-2-card"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '20px',
                                padding: '1.5rem 1.25rem 1rem',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                width: '290px'
                              }}
                            >
                              {/* Avatar Box with Hover Camera */}
                              <div
                                className="org-tree-avatar-box tier-2-avatar"
                                style={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => {
                                  openImagePicker(
                                    leader.imageUrl || '',
                                    vi ? `Thay ảnh chân dung: ${leader.nameVi}` : `Change Photo: ${leader.nameVi}`,
                                    (newUrl) => {
                                      const next = [...org.leaders];
                                      next[lIdx].imageUrl = newUrl;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }
                                  );
                                }}
                                title={vi ? 'Bấm để đổi ảnh chân dung' : 'Click to change portrait photo'}
                              >
                                <img
                                  src={leader.imageUrl}
                                  alt={leader.nameVi}
                                  className="org-tree-avatar-img"
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    color: '#FFFFFF',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    borderRadius: '50%'
                                  }}
                                  className="editor-avatar-hover-overlay"
                                >
                                  <Camera size={20} />
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{vi ? 'Đổi ảnh' : 'Change'}</span>
                                </div>
                              </div>

                              {/* Leader Fields */}
                              <div className="org-tree-info" style={{ width: '100%' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Danh xưng & Họ tên:' : 'Prefix & Name:'}
                                </span>
                                <h3 className="org-tree-name" style={{ width: '100%', marginBottom: '0.35rem' }}>
                                  <EditableText
                                    value={leader.nameVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].nameVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </h3>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Chức vụ / Vị trí:' : 'Position / Role:'}
                                </span>
                                <p className="org-tree-role" style={{ width: '100%', margin: '0 0 0.35rem' }}>
                                  <EditableText
                                    value={leader.roleVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].roleVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </p>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Phòng ban / Đơn vị kiêm nhiệm:' : 'Department:'}
                                </span>
                                <p className="org-tree-sub" style={{ width: '100%', margin: '0 0 0.75rem' }}>
                                  <EditableText
                                    value={leader.subVi || ''}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].subVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    placeholder={vi ? 'Nhập đơn vị kiêm nhiệm...' : 'Enter sub text...'}
                                  />
                                </p>
                              </div>

                              {/* Actions Bar */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  paddingTop: '0.65rem',
                                  borderTop: '1px dashed #E2E8F0',
                                  gap: '0.5rem'
                                }}
                              >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>{vi ? 'Tầng:' : 'Tier:'}</span>
                                  <select
                                    value={leader.tier || 2}
                                    onChange={(e) => {
                                      const newTier = Number(e.target.value) as 1 | 2 | 3;
                                      const next = [...org.leaders];
                                      next[lIdx].tier = newTier;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      color: '#0284C7',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value={1}>{vi ? '👑 Tầng 1' : '👑 Tier 1'}</option>
                                    <option value={2}>{vi ? '🛡️ Tầng 2' : '🛡️ Tier 2'}</option>
                                    <option value={3}>{vi ? '🎖️ Tầng 3' : '🎖️ Tier 3'}</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  className="editor-card-del-btn"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                  onClick={async () => {
                                    if (await confirmModal(vi ? `Xóa cán bộ "${leader.nameVi}"?` : 'Delete leader?')) {
                                      setOrg(p => ({ ...p, leaders: p.leaders.filter(i => i.id !== leader.id) }));
                                      setHasUnsavedChanges(true);
                                    }
                                  }}
                                >
                                  <Trash2 size={12} />
                                  <span>{vi ? 'Xóa' : 'Delete'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* --- TẦNG 3: TRƯỞNG CÁC BAN CHUYÊN MÔN (DƯỚI CÙNG) --- */}
                    <div className="org-tree-tier-wrapper">
                      <div className="org-tree-editor-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ display: 'inline-flex', padding: '5px', borderRadius: '8px', background: '#D1FAE5', color: '#059669' }}>
                            <Award size={16} />
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#065F46' }}>
                            {vi ? 'TẦNG 3: TRƯỞNG CÁC BAN CHUYÊN MÔN & ĐỐI TÁC' : 'TIER 3: DEPARTMENT HEADS & SPECIALISTS'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="editor-add-item-btn"
                          style={{ margin: 0, padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                          onClick={() => {
                            const newLeader: OrganizationContent['leaders'][0] = {
                              id: crypto.randomUUID(),
                              tier: 3,
                              nameVi: '', roleVi: '', badgeVi: '', subVi: '', bioVi: '',
                              contactEmail: '', avatarText: '', imageUrl: '', tagsVi: []
                            };
                            setOrg(p => ({ ...p, leaders: [...p.leaders, newLeader] }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <Plus size={13} />
                          <span>{vi ? 'Thêm cán bộ Tầng 3' : 'Add Tier 3 Leader'}</span>
                        </button>
                      </div>

                      <div className="org-tree-tier tier-3">
                        {org.leaders
                          .map((leader, lIdx) => ({ leader, lIdx }))
                          .filter(({ leader }) => (leader.tier || 3) === 3)
                          .map(({ leader, lIdx }) => (
                            <div
                              key={leader.id}
                              className="org-tree-card tier-3-card"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '20px',
                                padding: '1.5rem 1.25rem 1rem',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                                width: '280px'
                              }}
                            >
                              {/* Avatar Box with Hover Camera */}
                              <div
                                className="org-tree-avatar-box tier-3-avatar"
                                style={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => {
                                  openImagePicker(
                                    leader.imageUrl || '',
                                    vi ? `Thay ảnh chân dung: ${leader.nameVi}` : `Change Photo: ${leader.nameVi}`,
                                    (newUrl) => {
                                      const next = [...org.leaders];
                                      next[lIdx].imageUrl = newUrl;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }
                                  );
                                }}
                                title={vi ? 'Bấm để đổi ảnh chân dung' : 'Click to change portrait photo'}
                              >
                                <img
                                  src={leader.imageUrl}
                                  alt={leader.nameVi}
                                  className="org-tree-avatar-img"
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    color: '#FFFFFF',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    borderRadius: '50%'
                                  }}
                                  className="editor-avatar-hover-overlay"
                                >
                                  <Camera size={20} />
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{vi ? 'Đổi ảnh' : 'Change'}</span>
                                </div>
                              </div>

                              {/* Leader Fields */}
                              <div className="org-tree-info" style={{ width: '100%' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Danh xưng & Họ tên:' : 'Prefix & Name:'}
                                </span>
                                <h3 className="org-tree-name" style={{ width: '100%', marginBottom: '0.35rem' }}>
                                  <EditableText
                                    value={leader.nameVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].nameVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </h3>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Chức vụ / Vị trí:' : 'Position / Role:'}
                                </span>
                                <p className="org-tree-role" style={{ width: '100%', margin: '0 0 0.35rem' }}>
                                  <EditableText
                                    value={leader.roleVi}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].roleVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </p>

                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                  {vi ? 'Phòng ban / Đơn vị kiêm nhiệm:' : 'Department:'}
                                </span>
                                <p className="org-tree-sub" style={{ width: '100%', margin: '0 0 0.75rem' }}>
                                  <EditableText
                                    value={leader.subVi || ''}
                                    onChange={(val) => {
                                      const next = [...org.leaders];
                                      next[lIdx].subVi = val;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    placeholder={vi ? 'Nhập đơn vị kiêm nhiệm...' : 'Enter sub text...'}
                                  />
                                </p>
                              </div>

                              {/* Actions Bar */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  paddingTop: '0.65rem',
                                  borderTop: '1px dashed #E2E8F0',
                                  gap: '0.5rem'
                                }}
                              >
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>{vi ? 'Tầng:' : 'Tier:'}</span>
                                  <select
                                    value={leader.tier || 3}
                                    onChange={(e) => {
                                      const newTier = Number(e.target.value) as 1 | 2 | 3;
                                      const next = [...org.leaders];
                                      next[lIdx].tier = newTier;
                                      setOrg(p => ({ ...p, leaders: next }));
                                      setHasUnsavedChanges(true);
                                    }}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      color: '#059669',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value={1}>{vi ? '👑 Tầng 1' : '👑 Tier 1'}</option>
                                    <option value={2}>{vi ? '🛡️ Tầng 2' : '🛡️ Tier 2'}</option>
                                    <option value={3}>{vi ? '🎖️ Tầng 3' : '🎖️ Tier 3'}</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  className="editor-card-del-btn"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                  onClick={async () => {
                                    if (await confirmModal(vi ? `Xóa cán bộ "${leader.nameVi}"?` : 'Delete leader?')) {
                                      setOrg(p => ({ ...p, leaders: p.leaders.filter(i => i.id !== leader.id) }));
                                      setHasUnsavedChanges(true);
                                    }
                                  }}
                                >
                                  <Trash2 size={12} />
                                  <span>{vi ? 'Xóa' : 'Delete'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* 3. Core Operating Principles Section (3 Trụ Cột Quản Trị Vững Bền) */}
              <section className="org-principles-section">
                <div className="org-container">
                  <div className="org-section-header light">
                    <span className="org-section-kicker gold">{vi ? 'TRIẾT LÝ VẬN HÀNH' : 'OPERATING PRINCIPLES'}</span>
                    <h2 className="org-section-heading light">
                      {vi ? '3 Trụ Cột Quản Trị Vững Bền' : '3 Pillars of Sustainable Governance'}
                    </h2>
                    <p className="org-principles-header-desc">
                      {vi
                        ? 'Những định hướng cốt lõi định hình sự phát triển bền vững và sứ mệnh văn hóa của Đường Sách TP.HCM.'
                        : 'Core principles shaping sustainable growth and the cultural mission of Book Street.'}
                    </p>
                  </div>

                  <div className="org-principles-grid">
                    {org.principles.map((pr, pIdx) => (
                      <div key={pIdx} className="org-principle-card">
                        <div className="org-principle-badge">
                          <EditableText
                            value={pr.num}
                            onChange={(val) => {
                              const next = [...org.principles];
                              next[pIdx].num = val;
                              setOrg(p => ({ ...p, principles: next }));
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <h3 className="org-principle-title">
                          <EditableText
                            value={pr.title}
                            onChange={(val) => {
                              const next = [...org.principles];
                              next[pIdx].title = val;
                              setOrg(p => ({ ...p, principles: next }));
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </h3>
                        <p className="org-principle-text">
                          <EditableText
                            value={pr.desc}
                            onChange={(val) => {
                              const next = [...org.principles];
                              next[pIdx].desc = val;
                              setOrg(p => ({ ...p, principles: next }));
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </main>
          </div>
        )}
      </div>

      {/* 3. Image Picker Modal */}
      {imageModal.isOpen && (
        <div className="editor-modal-backdrop" onClick={() => setImageModal(p => ({ ...p, isOpen: false }))}>
          <div className="editor-modal-box" onClick={e => e.stopPropagation()}>
            <div className="editor-modal-header">
              <h3 className="editor-modal-title">{imageModal.title || (vi ? 'Thay đổi hình ảnh' : 'Change Image')}</h3>
              <button
                type="button"
                className="editor-modal-close"
                onClick={() => setImageModal(p => ({ ...p, isOpen: false }))}
              >
                <X size={20} />
              </button>
            </div>

            <div className="editor-modal-body">
              <div>
                <label className="editor-input-label">{vi ? 'Đường dẫn ảnh (URL):' : 'Image URL:'}</label>
                <input maxLength={10000000}
                  type="text"
                  className="editor-input-field"
                  value={imageModal.url}
                  onChange={e => setImageModal(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://... hoặc /assets/..."
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label className="editor-input-label">{vi ? 'Hoặc tải ảnh trực tiếp từ máy tính:' : 'Or upload from your computer:'}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <div
                  className="editor-file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} style={{ color: '#0284C7', margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
                    {vi ? 'Bấm vào đây để chọn ảnh từ thiết bị' : 'Click to select image file'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Hỗ trợ PNG, JPG, WEBP, SVG
                  </span>
                </div>
              </div>

              {imageModal.url && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className="editor-input-label" style={{ margin: 0 }}>
                      {vi ? 'Canh chỉnh khung & vị trí ảnh:' : 'Adjust Position & Crop:'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      {vi ? '💡 Kéo chuột để di chuyển ảnh' : '💡 Drag to move image'}
                    </span>
                  </div>

                  <div className="image-cropper-stage">
                    {/* Viewport Box */}
                    <div
                      className={`image-viewport-box ${imgShape === 'circle' ? 'is-circle' : ''}`}
                      style={{ cursor: isImgDragging ? 'grabbing' : 'grab' }}
                      onMouseDown={(e) => {
                        setIsImgDragging(true);
                        setDragStartPos({ x: e.clientX - imgPan.x, y: e.clientY - imgPan.y });
                      }}
                      onMouseMove={(e) => {
                        if (!isImgDragging) return;
                        setImgPan({ x: e.clientX - dragStartPos.x, y: e.clientY - dragStartPos.y });
                      }}
                      onMouseUp={() => setIsImgDragging(false)}
                      onMouseLeave={() => setIsImgDragging(false)}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        setIsImgDragging(true);
                        setDragStartPos({ x: touch.clientX - imgPan.x, y: touch.clientY - imgPan.y });
                      }}
                      onTouchMove={(e) => {
                        if (!isImgDragging) return;
                        const touch = e.touches[0];
                        setImgPan({ x: touch.clientX - dragStartPos.x, y: touch.clientY - dragStartPos.y });
                      }}
                      onTouchEnd={() => setIsImgDragging(false)}
                    >
                      {/* Image Layer with Pan & Zoom */}
                      <div
                        className="image-viewport-layer"
                        style={{
                          transform: `translate(${imgPan.x}px, ${imgPan.y}px) scale(${imgZoom})`,
                          transformOrigin: 'center center',
                          transition: isImgDragging ? 'none' : 'transform 0.05s ease-out'
                        }}
                      >
                        <img
                          src={imageModal.url}
                          alt="Crop Preview"
                          className="image-viewport-img"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      {/* 3x3 Grid Overlay (Rule of Thirds) */}
                      {imgShowGrid && (
                        <div className={`image-grid-overlay ${imgShape === 'circle' ? 'circle-mask' : ''}`}>
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-cell" />
                          <div className="image-grid-center-cross" />
                        </div>
                      )}

                      <div className="image-drag-hint">
                        <Move size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        {vi ? 'Kéo để canh giữa' : 'Drag to center'}
                      </div>
                    </div>

                    {/* Toolbar Controls */}
                    <div className="image-controls-toolbar">
                      {/* Zoom Row */}
                      <div className="image-zoom-row">
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ZoomOut size={14} /> {vi ? 'Thu nhỏ' : 'Zoom Out'}
                        </span>
                        <input
                          type="range"
                          min="0.8"
                          max="3"
                          step="0.05"
                          value={imgZoom}
                          onChange={(e) => setImgZoom(parseFloat(e.target.value))}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ZoomIn size={14} /> {vi ? 'Phóng to' : 'Zoom In'} ({Math.round(imgZoom * 100)}%)
                        </span>
                      </div>

                      {/* Presets & Toggles */}
                      <div className="image-quick-presets">
                        <button
                          type="button"
                          className={`image-preset-btn ${imgShowGrid ? 'active' : ''}`}
                          onClick={() => setImgShowGrid(p => !p)}
                          title={vi ? 'Bật/Tắt đường lưới 3x3' : 'Toggle 3x3 Grid'}
                        >
                          <Grid size={14} />
                          <span>{imgShowGrid ? (vi ? 'Lưới: Đang Bật' : 'Grid: ON') : (vi ? 'Lưới: Đang Tắt' : 'Grid: OFF')}</span>
                        </button>

                        <button
                          type="button"
                          className={`image-preset-btn ${imgShape === 'circle' ? 'active' : ''}`}
                          onClick={() => setImgShape(p => p === 'circle' ? 'rect' : 'circle')}
                          title={vi ? 'Chuyển đổi hình dạng khung' : 'Toggle frame shape'}
                        >
                          <span>{imgShape === 'circle' ? (vi ? '⭕ Khung tròn' : '⭕ Circle') : (vi ? '🔲 Khung chữ nhật' : '🔲 Rectangle')}</span>
                        </button>

                        <button
                          type="button"
                          className="image-preset-btn"
                          onClick={() => setImgPan({ x: 0, y: 0 })}
                          title={vi ? 'Đưa ảnh về chính giữa' : 'Center Image'}
                        >
                          <Target size={14} />
                          <span>{vi ? '🎯 Canh chính giữa' : '🎯 Center'}</span>
                        </button>

                        <button
                          type="button"
                          className="image-preset-btn"
                          onClick={() => {
                            setImgPan({ x: 0, y: 35 });
                            setImgZoom(1.2);
                          }}
                          title={vi ? 'Canh khuôn mặt phía trên' : 'Center Face'}
                        >
                          <span>{vi ? '👤 Canh khuôn mặt' : '👤 Face'}</span>
                        </button>

                        <button
                          type="button"
                          className="image-preset-btn"
                          onClick={() => {
                            setImgPan({ x: 0, y: 0 });
                            setImgZoom(1);
                          }}
                          title={vi ? 'Đặt lại vị trí ban đầu' : 'Reset'}
                        >
                          <RotateCcw size={13} />
                          <span>{vi ? 'Đặt lại' : 'Reset'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="editor-modal-footer">
              <button
                type="button"
                className="editor-action-btn secondary"
                onClick={() => setImageModal(p => ({ ...p, isOpen: false }))}
              >
                {vi ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                className="editor-action-btn primary"
                onClick={handleApplyImageCrop}
              >
                <Check size={16} />
                <span>{vi ? 'Xác nhận áp dụng' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Toast Notification */}
      {toastMessage && (
        <div className="editor-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
