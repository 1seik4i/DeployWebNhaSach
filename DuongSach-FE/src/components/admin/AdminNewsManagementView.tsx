import { confirmModal, notifyModal } from '../../services/notificationModal';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Star,
  Sparkles,
  Upload,
  Calendar,
  Clock,
  User,
  Tag,
  Check,
  X,
  ExternalLink,
  RotateCcw,
  Grid,
  List,
  Flame,
  CheckCircle2,
  FileText,
  BookOpen,
  Send,
  Image as ImageIcon,
  MessageSquare,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Language } from '../../types';
import { NewsArticle } from '../../pages/NewsExperience';
import { landingContentService } from '../../services/landingContentService';
import { isImageSource, isPublicationDate, isReadTime } from '../../utils/inputValidation';
import { imageFileError } from '../../utils/fileValidation';
import './AdminNewsManagementView.css';

export interface AdminNewsManagementViewProps {
  language: Language;
}

export type ArticleContentBlock =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; url: string; caption: string };

const CATEGORIES = [
  { id: 'all', labelVi: 'Tất cả bài viết', labelEn: 'All Articles', icon: Newspaper },
  { id: 'van-hoa', labelVi: 'Sự kiện & Hoạt động', labelEn: 'Events & Activities', icon: Sparkles },
  { id: 'tac-gia', labelVi: 'Văn hóa đọc & Tác giả', labelEn: 'Reading Culture', icon: BookOpen },
  { id: 'thong-cao', labelVi: 'Thông cáo báo chí', labelEn: 'Press Releases', icon: MessageSquare },
  { id: 'nhip-song', labelVi: 'Nhịp sống Đường Sách', labelEn: 'Book Street Life', icon: Flame },
] as const;

const SUGGESTED_TAGS = [
  'Kỷ niệm 10 năm',
  'Sự kiện',
  'Ra mắt sách',
  'Văn hóa đọc',
  'Triển lãm sách',
  'Audio Book',
  'Tọa đàm',
  'Di sản Sài Gòn',
  'Gen Z',
  'Thiếu nhi'
];

export const AdminNewsManagementView: React.FC<AdminNewsManagementViewProps> = ({
  language
}) => {
  const isVi = language === 'vi';
  const [newsList, setNewsList] = useState<NewsArticle[]>(() => landingContentService.getNews());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'edit' | 'preview'>('edit');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  useModalBehavior(isComposerOpen, () => setIsComposerOpen(false));
  useModalBehavior(Boolean(previewArticle), () => setPreviewArticle(null));

  // Form composer states
  const [formTitleVi, setFormTitleVi] = useState('');
  const [formCategory, setFormCategory] = useState<'van-hoa' | 'tac-gia' | 'thong-cao' | 'nhip-song'>('van-hoa');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPublishedDate, setFormPublishedDate] = useState(() => new Date().toLocaleDateString('vi-VN'));
  const [formReadTime, setFormReadTime] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageCaptionVi, setFormImageCaptionVi] = useState('');
  const [formSummaryVi, setFormSummaryVi] = useState('');
  
  // Structured content blocks (paragraphs & inline images)
  const [formBlocks, setFormBlocks] = useState<ArticleContentBlock[]>([]);
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const [activeInlineBlockId, setActiveInlineBlockId] = useState<string | null>(null);
  const [insertAfterBlockIndex, setInsertAfterBlockIndex] = useState<number | null>(null);

  // Subscribe to service updates
  useEffect(() => {
    const unsub = landingContentService.subscribe((type) => {
      if (type === 'news') {
        setNewsList(landingContentService.getNews());
      }
    });
    return unsub;
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isComposerOpen || previewArticle) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isComposerOpen, previewArticle]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert raw strings array to blocks
  const parseRawContentToBlocks = (content: string[]): ArticleContentBlock[] => {
    if (!content || content.length === 0) {
      return [
        { id: crypto.randomUUID(), type: 'text', text: '' }
      ];
    }
    return content.map((item) => {
      const imgMatch = item.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return {
          id: crypto.randomUUID(),
          type: 'image',
          caption: imgMatch[1] || '',
          url: imgMatch[2] || ''
        };
      }
      return {
        id: crypto.randomUUID(),
        type: 'text',
        text: item
      };
    });
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return newsList.filter(article => {
      const matchCat = selectedCategory === 'all' || article.category === selectedCategory;
      const matchSearch =
        article.titleVi.normalize('NFC').toLowerCase().includes(searchTerm.trim().normalize('NFC').toLowerCase()) ||
        (article.summaryVi && article.summaryVi.normalize('NFC').toLowerCase().includes(searchTerm.trim().normalize('NFC').toLowerCase())) ||
        (article.author && article.author.normalize('NFC').toLowerCase().includes(searchTerm.trim().normalize('NFC').toLowerCase())) ||
        (article.tags && article.tags.some(t => t.normalize('NFC').toLowerCase().includes(searchTerm.trim().normalize('NFC').toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [newsList, selectedCategory, searchTerm]);

  // Quick stats
  const totalViews = useMemo(() => {
    return newsList.reduce((acc, curr) => acc + (curr.views || 0), 0);
  }, [newsList]);

  const featuredCount = useMemo(() => {
    return newsList.filter(n => n.featured).length;
  }, [newsList]);

  // Open composer for create
  const handleOpenCreate = () => {
    setEditingArticleId(null);
    setComposerMode('edit');
    setFormTitleVi('');
    setFormCategory('van-hoa');
    setFormAuthor('');
    setFormPublishedDate(new Date().toLocaleDateString('vi-VN'));
    setFormReadTime('');
    setFormImageUrl('');
    setFormImageCaptionVi('');
    setFormSummaryVi('');
    setFormBlocks([{ id: crypto.randomUUID(), type: 'text', text: '' }]);
    setFormSelectedTags([]);
    setFormFeatured(false);
    setIsComposerOpen(true);
  };

  // Open composer for edit
  const handleOpenEdit = (article: NewsArticle) => {
    setEditingArticleId(article.id);
    setComposerMode('edit');
    setFormTitleVi(article.titleVi);
    setFormCategory(article.category);
    setFormAuthor(article.author || '');
    setFormPublishedDate(article.publishedDate);
    setFormReadTime(article.readTime || '');
    setFormImageUrl(article.imageUrl || '');
    setFormImageCaptionVi(article.imageCaptionVi || '');
    setFormSummaryVi(article.summaryVi || '');
    setFormBlocks(parseRawContentToBlocks(article.contentVi || []));
    setFormSelectedTags(article.tags || []);
    setFormFeatured(!!article.featured);
    setIsComposerOpen(true);
  };

  // Block handlers
  const handleAddTextBlock = () => {
    setFormBlocks([
      ...formBlocks,
      { id: crypto.randomUUID(), type: 'text', text: '' }
    ]);
  };

  const handleAddImageBlock = () => {
    setFormBlocks([
      ...formBlocks,
      {
        id: crypto.randomUUID(),
        type: 'image',
        url: '',
        caption: ''
      }
    ]);
    showToast(isVi ? '🖼️ Đã chèn thêm khung ảnh vào bài viết!' : '🖼️ Image block added!');
  };

  const handleDeleteBlock = (id: string) => {
    if (formBlocks.length <= 1) {
      setFormBlocks([{ id: crypto.randomUUID(), type: 'text', text: '' }]);
      return;
    }
    setFormBlocks(formBlocks.filter(b => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formBlocks.length) return;
    const next = [...formBlocks];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setFormBlocks(next);
  };

  // Toggle Tag in selected tags
  const handleToggleTag = (tag: string) => {
    if (formSelectedTags.includes(tag)) {
      setFormSelectedTags(formSelectedTags.filter(t => t !== tag));
    } else {
      setFormSelectedTags([...formSelectedTags, tag]);
    }
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !formSelectedTags.includes(trimmed)) {
      setFormSelectedTags([...formSelectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  // Cover image upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = imageFileError(file);
      if (error) { showToast(error); e.target.value = ''; return; }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormImageUrl(reader.result);
          showToast(isVi ? '🖼️ Đã tải ảnh bìa lên thành công!' : '🖼️ Cover image uploaded!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Inline block image upload handler (supports single or multiple images)
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const error = files.map(file => imageFileError(file)).find(Boolean);
    if (error) { showToast(error); e.target.value = ''; return; }
    
    // Read all files as Data URLs in parallel
    const readFilesPromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    });

    try {
      const dataUrls = (await Promise.all(readFilesPromises)).filter(Boolean);
      if (dataUrls.length === 0) return;

      if (insertAfterBlockIndex !== null) {
        // We are inserting after a specific block index
        const newImageBlocks: ArticleContentBlock[] = dataUrls.map((url) => ({
          id: crypto.randomUUID(),
          type: 'image',
          url,
          caption: isVi ? 'Hình ảnh minh họa trong bài viết' : 'Illustration photo'
        }));

        const next = [...formBlocks];
        if (insertAfterBlockIndex === -1) {
          next.unshift(...newImageBlocks);
        } else {
          next.splice(insertAfterBlockIndex + 1, 0, ...newImageBlocks);
        }
        setFormBlocks(next);
        setInsertAfterBlockIndex(null);
        showToast(
          isVi
            ? `🖼️ Đã chèn thành công ${dataUrls.length} hình ảnh vào bài viết!`
            : `🖼️ Inserted ${dataUrls.length} image(s) successfully!`
        );
      } else if (activeInlineBlockId) {
        // We are replacing/updating an existing block, plus inserting more if multiple files selected
        const blockIdx = formBlocks.findIndex(b => b.id === activeInlineBlockId);
        if (blockIdx !== -1) {
          const next = [...formBlocks];
          // Update the active block with the first image
          next[blockIdx] = {
            ...next[blockIdx],
            url: dataUrls[0]
          } as ArticleContentBlock;

          // If more than 1 image selected, insert the additional ones right after it
          if (dataUrls.length > 1) {
            const additionalBlocks: ArticleContentBlock[] = dataUrls.slice(1).map((url) => ({
              id: crypto.randomUUID(),
              type: 'image',
              url,
              caption: isVi ? 'Hình ảnh minh họa trong bài viết' : 'Illustration photo'
            }));
            next.splice(blockIdx + 1, 0, ...additionalBlocks);
          }

          setFormBlocks(next);
          setActiveInlineBlockId(null);
          showToast(
            isVi
              ? `🖼️ Đã tải lên ${dataUrls.length} hình ảnh minh họa!`
              : `🖼️ Uploaded ${dataUrls.length} image(s)!`
          );
        }
      } else {
        // Default: append to the end of formBlocks
        const newImageBlocks: ArticleContentBlock[] = dataUrls.map((url) => ({
          id: crypto.randomUUID(),
          type: 'image',
          url,
          caption: isVi ? 'Hình ảnh minh họa trong bài viết' : 'Illustration photo'
        }));
        setFormBlocks(prev => [...prev, ...newImageBlocks]);
        showToast(
          isVi
            ? `🖼️ Đã chèn thành công ${dataUrls.length} hình ảnh vào bài viết!`
            : `🖼️ Inserted ${dataUrls.length} image(s) successfully!`
        );
      }
    } catch (err) {
      console.error('Error reading image files:', err);
      showToast(isVi ? '❌ Lỗi khi đọc file ảnh!' : '❌ Error reading image files!');
    } finally {
      e.target.value = '';
    }
  };

  // Save/Publish article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleVi.trim()) {
      void notifyModal(isVi ? 'Vui lòng nhập tiêu đề bài viết!' : 'Please enter article title!');
      return;
    }
    const validationError = formTitleVi.trim().length > 200 ? 'Tiêu đề tối đa 200 ký tự.'
      : !isPublicationDate(formPublishedDate) ? 'Ngày xuất bản không hợp lệ; dùng DD/MM/YYYY.'
      : formReadTime.trim() && !isReadTime(formReadTime) ? 'Thời lượng đọc phải từ 1 đến 999 phút.'
      : !isImageSource(formImageUrl) || formBlocks.some(block => block.type === 'image' && !isImageSource(block.url)) ? 'Đường dẫn ảnh không hợp lệ.'
      : formBlocks.some(block => block.type === 'text' && block.text.length > 20000) || formSummaryVi.length > 20000 ? 'Nội dung mỗi phần tối đa 20.000 ký tự.'
      : formSelectedTags.length > 50 || formSelectedTags.some(tag => !tag.trim() || tag.length > 100) ? 'Tối đa 50 thẻ, mỗi thẻ từ 1 đến 100 ký tự.' : '';
    if (validationError) { void notifyModal(validationError); return; }

    const catObj = CATEGORIES.find(c => c.id === formCategory) || CATEGORIES[1];
    const categoryLabelVi = catObj.labelVi;
    const categoryLabelEn = catObj.labelEn;

    // Convert structured blocks into markdown string array
    const cleanParagraphs: string[] = formBlocks
      .map(block => {
        if (block.type === 'image') {
          const cap = (block.caption || '').trim();
          const u = (block.url || '').trim();
          if (!u) return '';
          return `![${cap}](${u})`;
        }
        return block.text.trim();
      })
      .filter(str => str.length > 0);

    if (cleanParagraphs.length === 0) {
      cleanParagraphs.push(formSummaryVi.trim());
    }

    let updatedList: NewsArticle[];

    if (editingArticleId) {
      // Edit existing
      updatedList = newsList.map(item => {
        if (item.id === editingArticleId) {
          return {
            ...item,
            titleVi: formTitleVi.trim(),
            titleEn: formTitleVi.trim(),
            category: formCategory,
            categoryLabelVi,
            categoryLabelEn,
            author: formAuthor.trim(),
            publishedDate: formPublishedDate.trim(),
            readTime: formReadTime.trim(),
            imageUrl: formImageUrl.trim(),
            imageCaptionVi: formImageCaptionVi.trim(),
            imageCaptionEn: formImageCaptionVi.trim(),
            summaryVi: formSummaryVi.trim(),
            summaryEn: formSummaryVi.trim(),
            contentVi: cleanParagraphs,
            contentEn: cleanParagraphs,
            tags: formSelectedTags,
            featured: formFeatured
          };
        }
        return formFeatured ? { ...item, featured: item.id === editingArticleId } : item;
      });
    } else {
      // Create new
      const newArticle: NewsArticle = {
        id: `tin-${Date.now()}`,
        titleVi: formTitleVi.trim(),
        titleEn: formTitleVi.trim(),
        category: formCategory,
        categoryLabelVi,
        categoryLabelEn,
        author: formAuthor.trim(),
        publishedDate: formPublishedDate.trim(),
        readTime: formReadTime.trim(),
        views: 0,
        imageUrl: formImageUrl.trim(),
        imageCaptionVi: formImageCaptionVi.trim(),
        imageCaptionEn: formImageCaptionVi.trim(),
        summaryVi: formSummaryVi.trim(),
        summaryEn: formSummaryVi.trim(),
        contentVi: cleanParagraphs,
        contentEn: cleanParagraphs,
        tags: formSelectedTags,
        featured: formFeatured
      };

      updatedList = formFeatured
        ? [newArticle, ...newsList.map(n => ({ ...n, featured: false }))]
        : [newArticle, ...newsList];

    }

    try {
      await landingContentService.saveNews(updatedList);
      setNewsList(updatedList);
      setIsComposerOpen(false);
      showToast(editingArticleId
        ? (isVi ? '✅ Đã lưu cập nhật bài viết lên máy chủ!' : '✅ Article updated on the server!')
        : (isVi ? '🚀 Đã đăng bài viết mới!' : '🚀 New article published!'));
    } catch (error) {
      showToast(error instanceof Error ? error.message : (isVi ? 'Không thể lưu bài viết.' : 'Could not save article.'));
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = newsList.map(n => {
      if (n.id === articleId) {
        return { ...n, featured: !n.featured };
      }
      return n;
    });
    try {
      await landingContentService.saveNews(updated);
      setNewsList(updated);
      showToast(isVi ? '⭐ Đã cập nhật trạng thái Tiêu Điểm!' : '⭐ Spotlight status updated!');
    } catch (error) {
      showToast(error instanceof Error ? error.message : (isVi ? 'Không thể cập nhật bài viết.' : 'Could not update article.'));
    }
  };

  // Delete article
  const handleDeleteArticle = async (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmModal(isVi ? `Bạn có chắc muốn xóa bài viết "${article.titleVi}"?` : `Delete article "${article.titleVi}"?`)) {
      const updated = newsList.filter(n => n.id !== article.id);
      try {
        await landingContentService.saveNews(updated);
        setNewsList(updated);
        showToast(isVi ? '🗑️ Đã xóa bài viết thành công!' : '🗑️ Article deleted!');
      } catch (error) {
        showToast(error instanceof Error ? error.message : (isVi ? 'Không thể xóa bài viết.' : 'Could not delete article.'));
      }
    }
  };

  // Clear all news content after explicit confirmation.
  const handleResetDefaults = async () => {
    if (await confirmModal(isVi ? 'Bạn có chắc chắn muốn xóa toàn bộ bài viết?' : 'Clear all news articles?')) {
      try {
        setNewsList(await landingContentService.resetNews());
        showToast(isVi ? '🔄 Đã xóa toàn bộ bài viết trên máy chủ.' : '🔄 All news articles were cleared on the server.');
      } catch (error) {
        showToast(error instanceof Error ? error.message : (isVi ? 'Không thể xóa danh sách bài viết.' : 'Could not clear articles.'));
      }
    }
  };

  return (
    <div className="admin-news-view">
      {/* Hidden file input for inline image blocks (supports selecting multiple images) */}
      <input
        ref={inlineFileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleInlineImageUpload}
      />

      {/* 1. Standard System Page Header */}
      <div className="adm-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(233, 188, 99, 0.18)',
                color: '#8C6519'
              }}
            >
              <Newspaper size={20} />
            </span>
            <h1 className="adm-page-title" style={{ margin: 0 }}>
              {isVi ? 'Quản lý & Đăng Tải Bài Viết' : 'News & Articles Publishing'}
            </h1>
          </div>
        </div>

        <div className="adm-page-header-actions">
          <a
            href="/trai-nghiem-tin-tuc"
            target="_blank"
            rel="noopener noreferrer"
            className="adm-btn adm-btn-secondary"
            title={isVi ? 'Mở cổng tin tức công khai' : 'Open public news page'}
          >
            <ExternalLink size={15} />
            <span>{isVi ? 'Xem Trang Tin Tức' : 'View Portal'}</span>
          </a>

          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={handleResetDefaults}
            title={isVi ? 'Khôi phục tin tức ban đầu' : 'Reset to default sample'}
          >
            <RotateCcw size={15} />
            <span>{isVi ? 'Đặt lại mẫu' : 'Reset'}</span>
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>{isVi ? 'Đăng bài viết mới' : 'New Article'}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick KPI Stats */}
      <section className="admin-news-stats-grid">
        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon orange">
            <Newspaper size={22} />
          </div>
          <div className="admin-news-stat-info">
            <span className="admin-news-stat-num">{newsList.length}</span>
            <span className="admin-news-stat-label">{isVi ? 'Tổng số bài viết' : 'Total Articles'}</span>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon purple">
            <Star size={22} />
          </div>
          <div className="admin-news-stat-info">
            <span className="admin-news-stat-num">{featuredCount}</span>
            <span className="admin-news-stat-label">{isVi ? 'Bài viết Tiêu Điểm' : 'Spotlight Articles'}</span>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon blue">
            <Eye size={22} />
          </div>
          <div className="admin-news-stat-info">
            <span className="admin-news-stat-num">{totalViews.toLocaleString('vi-VN')}</span>
            <span className="admin-news-stat-label">{isVi ? 'Tổng lượt đọc' : 'Total Reads'}</span>
          </div>
        </div>

        <div className="admin-news-stat-card">
          <div className="admin-news-stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div className="admin-news-stat-info">
            <span className="admin-news-stat-num">4</span>
            <span className="admin-news-stat-label">{isVi ? 'Chuyên mục hoạt động' : 'Active Categories'}</span>
          </div>
        </div>
      </section>

      {/* 3. Toolbar: Search, Filters & View Mode */}
      <section className="admin-news-toolbar">
        <div className="admin-news-toolbar-row1">
          <div className="admin-news-search-box">
            <Search size={18} color="#94A3B8" />
            <input maxLength={200}
              type="text"
              placeholder={isVi ? 'Tìm kiếm bài viết theo tiêu đề, tác giả, tag...' : 'Search by title, author, tags...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="admin-news-view-mode-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              {isVi ? `Hiển thị ${filteredArticles.length} bài viết` : `Showing ${filteredArticles.length} articles`}
            </span>

            <div className="admin-news-view-mode">
              <button
                type="button"
                className={`admin-news-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title={isVi ? 'Dạng thẻ lưới' : 'Grid view'}
              >
                <Grid size={16} />
              </button>
              <button
                type="button"
                className={`admin-news-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title={isVi ? 'Dạng bảng danh sách' : 'Table view'}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="admin-news-cats-bar">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all'
              ? newsList.length
              : newsList.filter(n => n.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                className={`admin-news-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{isVi ? cat.labelVi : cat.labelEn}</span>
                <span className="admin-news-cat-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Articles Grid / Table */}
      {filteredArticles.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
          <Newspaper size={48} style={{ color: '#CBD5E1', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#1E293B', fontSize: '1.2rem' }}>
            {isVi ? 'Không tìm thấy bài viết nào phù hợp' : 'No articles match your search'}
          </h3>
          <p style={{ margin: '0 0 1.5rem', color: '#64748B', fontSize: '0.9rem' }}>
            {isVi ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để viết bài mới.' : 'Try changing search filter or create a new article.'}
          </p>
          <button type="button" className="news-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>{isVi ? 'Đăng bài viết mới ngay' : 'Create Article Now'}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="admin-news-grid">
          {filteredArticles.map(article => (
            <article
              key={article.id}
              className={`admin-article-card ${article.featured ? 'is-featured' : ''}`}
            >
              <div className="admin-article-thumb-box">
                <img
                  src={article.imageUrl || undefined}
                  alt={article.titleVi}
                  className="admin-article-thumb-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="admin-article-cat-badge">
                  {article.categoryLabelVi}
                </span>
                {article.featured && (
                  <span className="admin-article-featured-badge">
                    <Star size={12} fill="#FFFFFF" />
                    <span>{isVi ? 'TIÊU ĐIỂM' : 'SPOTLIGHT'}</span>
                  </span>
                )}
              </div>

              <div className="admin-article-body">
                <div className="admin-article-meta-row">
                  <span className="admin-article-meta-item">
                    <Calendar size={13} />
                    <span>{article.publishedDate}</span>
                  </span>
                  <span className="admin-article-meta-item">
                    <Clock size={13} />
                    <span>{article.readTime}</span>
                  </span>
                  <span className="admin-article-meta-item">
                    <Eye size={13} />
                    <span>{article.views || 0} {isVi ? 'lượt xem' : 'views'}</span>
                  </span>
                </div>

                <h3 className="admin-article-title" title={article.titleVi}>
                  {article.titleVi}
                </h3>

                <p className="admin-article-summary">
                  {article.summaryVi}
                </p>

                {article.tags && article.tags.length > 0 && (
                  <div className="admin-article-tags-row">
                    {article.tags.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="admin-article-tag-chip">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="admin-article-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    <User size={13} />
                    <span>{article.author}</span>
                  </div>

                  <div className="admin-article-actions-left">
                    <button
                      type="button"
                      className={`news-icon-btn star ${article.featured ? 'active' : ''}`}
                      onClick={(e) => handleToggleFeatured(article.id, e)}
                      title={article.featured ? (isVi ? 'Bỏ ghim tiêu điểm' : 'Unfeature') : (isVi ? 'Ghim làm tin tiêu điểm' : 'Set as Spotlight')}
                    >
                      <Star size={15} fill={article.featured ? '#D97706' : 'none'} />
                    </button>

                    <button
                      type="button"
                      className="news-icon-btn"
                      onClick={() => setPreviewArticle(article)}
                      title={isVi ? 'Xem trước bài viết' : 'Preview article'}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      className="news-icon-btn edit"
                      onClick={() => handleOpenEdit(article)}
                      title={isVi ? 'Chỉnh sửa bài viết' : 'Edit article'}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      className="news-icon-btn delete"
                      onClick={(e) => handleDeleteArticle(article, e)}
                      title={isVi ? 'Xóa bài viết' : 'Delete article'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-news-table-container">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th>{isVi ? 'Bài viết' : 'Article'}</th>
                <th>{isVi ? 'Chuyên mục' : 'Category'}</th>
                <th>{isVi ? 'Tác giả' : 'Author'}</th>
                <th>{isVi ? 'Ngày đăng' : 'Date'}</th>
                <th>{isVi ? 'Lượt xem' : 'Views'}</th>
                <th>{isVi ? 'Tiêu điểm' : 'Spotlight'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(article => (
                <tr key={article.id}>
                  <td>
                    <div className="admin-table-article-info">
                      <img
                        src={article.imageUrl || undefined}
                        alt=""
                        className="admin-table-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <h4 className="admin-table-title">{article.titleVi}</h4>
                        <p className="admin-table-snippet">{article.summaryVi}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-news-cat-pill" style={{ pointerEvents: 'none', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                      {article.categoryLabelVi}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    {article.author}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {article.publishedDate}
                  </td>
                  <td style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                    {article.views || 0}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`news-icon-btn star ${article.featured ? 'active' : ''}`}
                      onClick={(e) => handleToggleFeatured(article.id, e)}
                    >
                      <Star size={14} fill={article.featured ? '#D97706' : 'none'} />
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="news-icon-btn"
                        onClick={() => setPreviewArticle(article)}
                        title={isVi ? 'Xem trước' : 'Preview'}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="news-icon-btn edit"
                        onClick={() => handleOpenEdit(article)}
                        title={isVi ? 'Chỉnh sửa' : 'Edit'}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="news-icon-btn delete"
                        onClick={(e) => handleDeleteArticle(article, e)}
                        title={isVi ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. USER-FRIENDLY ARTICLE COMPOSER MODAL */}
      {isComposerOpen && (
        <div className="admin-composer-backdrop" onClick={() => setIsComposerOpen(false)}>
          <div className="admin-composer-modal" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header with Mode Switcher */}
            <div className="admin-composer-header">
              <div className="admin-composer-header-title">
                <div className="admin-composer-header-icon-box">
                  <FileText size={20} />
                </div>
                <div className="admin-composer-header-text">
                  <h3 className="admin-composer-header-h3">
                    {editingArticleId
                      ? (isVi ? 'Chỉnh Sửa Bài Viết' : 'Edit Article')
                      : (isVi ? 'Soạn Thảo & Đăng Bài Mới' : 'Compose & Publish Article')}
                  </h3>
                  <span className="admin-composer-header-sub">
                    {editingArticleId
                      ? (isVi ? 'Cập nhật tiêu đề, nội dung và chèn ảnh minh họa cho bài viết' : 'Update headline, content, and inline photos')
                      : (isVi ? 'Tạo nội dung phong phú và xuất bản ngay lên Cổng Thông Tin' : 'Create rich content and publish to portal')}
                  </span>
                </div>
              </div>

              {/* Edit vs Live Preview Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="admin-composer-mode-pills">
                  <button
                    type="button"
                    className={`admin-composer-mode-btn ${composerMode === 'edit' ? 'active' : ''}`}
                    onClick={() => setComposerMode('edit')}
                  >
                    <Edit3 size={14} />
                    <span>{isVi ? 'Soạn thảo' : 'Editor'}</span>
                  </button>
                  <button
                    type="button"
                    className={`admin-composer-mode-btn ${composerMode === 'preview' ? 'active' : ''}`}
                    onClick={() => setComposerMode('preview')}
                  >
                    <Eye size={14} />
                    <span>{isVi ? 'Xem trước' : 'Live Preview'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="admin-composer-close-btn"
                  onClick={() => setIsComposerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {composerMode === 'edit' ? (
              <form onSubmit={handleSaveArticle} className="admin-composer-body">
                
                {/* Section 1: Thông tin cơ bản & Chuyên mục */}
                <div className="composer-section-card">
                  <div className="composer-section-header">
                    <div className="composer-section-title-wrap">
                      <span className="composer-step-num">01</span>
                      <span className="composer-section-title-text">{isVi ? 'Tiêu đề & Chuyên mục bài viết' : 'Title & Category'}</span>
                    </div>
                    <span className="composer-section-badge required">{isVi ? 'Bắt buộc' : 'Required'}</span>
                  </div>

                  {/* Title input */}
                  <div className="admin-composer-group">
                    <label className="admin-composer-label">
                      <span>{isVi ? 'Tiêu đề bài viết' : 'Article Headline'}</span>
                      <span className="req">*</span>
                    </label>
                    <input maxLength={200}
                      type="text"
                      className="admin-composer-input"
                      style={{ fontSize: '1rem', fontWeight: 700, padding: '0.75rem 1rem' }}
                      required
                      placeholder={isVi ? 'Nhập tiêu đề bài viết rõ ràng, hấp dẫn (vd: Khai mạc Tuần lễ Sách Di Sản...)' : 'Enter article headline...'}
                      value={formTitleVi}
                      onChange={e => setFormTitleVi(e.target.value)}
                    />
                  </div>

                  {/* Visual Category Selectors */}
                  <div className="admin-composer-group">
                    <label className="admin-composer-label">
                      <span>{isVi ? 'Chọn chuyên mục đăng bài' : 'Select Category'}</span>
                      <span className="req">*</span>
                    </label>
                    <div className="composer-cat-selector-grid">
                      {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                        const Icon = cat.icon;
                        const isSelected = formCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className={`composer-cat-option-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setFormCategory(cat.id as any)}
                          >
                            <div className="composer-cat-icon">
                              <Icon size={16} />
                            </div>
                            <span>{isVi ? cat.labelVi : cat.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Author, Date & Read Time */}
                  <div className="admin-composer-row">
                    <div className="admin-composer-group">
                      <label className="admin-composer-label">
                        <User size={13} />
                        <span>{isVi ? 'Tác giả / Bút danh' : 'Author'}</span>
                      </label>
                      <input maxLength={160}
                        type="text"
                        className="admin-composer-input"
                        placeholder="Ban Biên Tập Đường Sách"
                        value={formAuthor}
                        onChange={e => setFormAuthor(e.target.value)}
                      />
                    </div>

                    <div className="admin-composer-group">
                      <label className="admin-composer-label">
                        <Calendar size={13} />
                        <span>{isVi ? 'Ngày đăng' : 'Publish Date'}</span>
                      </label>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input maxLength={10}
                          type="text"
                          className="admin-composer-input"
                          style={{ flex: 1 }}
                          placeholder="dd/mm/yyyy"
                          value={formPublishedDate}
                          onChange={e => setFormPublishedDate(e.target.value)}
                        />
                        <button
                          type="button"
                          className="composer-tag-chip-btn"
                          onClick={() => setFormPublishedDate(new Date().toLocaleDateString('vi-VN'))}
                        >
                          {isVi ? 'Hôm nay' : 'Today'}
                        </button>
                      </div>
                    </div>

                    <div className="admin-composer-group">
                      <label className="admin-composer-label">
                        <Clock size={13} />
                        <span>{isVi ? 'Thời gian đọc' : 'Read Time'}</span>
                      </label>
                      <input maxLength={20}
                        type="text"
                        className="admin-composer-input"
                        placeholder="5 phút đọc"
                        value={formReadTime}
                        onChange={e => setFormReadTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Hình ảnh bìa bài viết */}
                <div className="composer-section-card">
                  <div className="composer-section-header">
                    <div className="composer-section-title-wrap">
                      <span className="composer-step-num">02</span>
                      <span className="composer-section-title-text">{isVi ? 'Hình ảnh đại diện bài viết' : 'Cover Image & Thumbnail'}</span>
                    </div>
                    <span className="composer-section-badge">{isVi ? 'Hình ảnh bìa' : 'Cover Media'}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: '1.25rem', alignItems: 'flex-start' }}>
                    {/* Image Preview Box */}
                    <div style={{ width: '100%', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#0F172A', position: 'relative', border: '1px solid #CBD5E1' }}>
                      <img
                        src={formImageUrl || undefined}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {isVi ? 'Ảnh bìa chính' : 'Main Cover'}
                      </div>
                    </div>

                    {/* Upload dropzone + Gallery */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div
                        className="composer-image-smart-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />
                        <Upload size={24} style={{ color: '#D97706', margin: '0 auto 0.4rem' }} />
                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                          {isVi ? 'Bấm để chọn ảnh từ máy tính' : 'Click to upload from device'}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Hỗ trợ định dạng PNG, JPG, JPEG, WEBP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image URL & Caption input */}
                  <div className="admin-composer-row" style={{ marginTop: '0.25rem' }}>
                    <div className="admin-composer-group" style={{ flex: 1 }}>
                      <label className="admin-composer-label">
                        <ImageIcon size={13} />
                        <span>{isVi ? 'Đường dẫn ảnh bìa (URL)' : 'Image URL'}</span>
                      </label>
                      <input maxLength={10000000}
                        type="text"
                        className="admin-composer-input"
                        placeholder="https://... hoặc /assets/..."
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                      />
                    </div>

                    <div className="admin-composer-group" style={{ flex: 1 }}>
                      <label className="admin-composer-label">
                        <span>{isVi ? 'Chú thích ảnh bìa (Caption)' : 'Caption'}</span>
                      </label>
                      <input maxLength={5000}
                        type="text"
                        className="admin-composer-input"
                        placeholder={isVi ? 'Mô tả ngắn gọn về bức ảnh...' : 'Short description...'}
                        value={formImageCaptionVi}
                        onChange={e => setFormImageCaptionVi(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Word-style Rich Document Canvas & Inline Image Editor */}
                <div className="composer-section-card">
                  <div className="composer-section-header">
                    <div className="composer-section-title-wrap">
                      <span className="composer-step-num">03</span>
                      <span className="composer-section-title-text">{isVi ? 'Soạn thảo nội dung bài viết (Trình soạn thảo kiểu Word)' : 'Article Content & Media (Word-style Editor)'}</span>
                    </div>
                    <span className="composer-section-badge">{isVi ? `${formBlocks.length} khối nội dung` : `${formBlocks.length} blocks`}</span>
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: '#64748B' }}>
                    {isVi
                      ? '✍️ Bạn có thể gõ nội dung văn bản tự do, tải ảnh lên chèn vào bất kỳ dòng/đoạn nào, di chuyển lên xuống và thêm chú thích tùy ý giống như Microsoft Word.'
                      : '✍️ Type text freely, upload and insert images at any line, reorder items up/down, and adjust captions just like Microsoft Word.'}
                  </p>

                  {/* Word Document Canvas Container */}
                  <div className="word-doc-wrapper">
                    {/* Word Document Paper Sheet */}
                    <div className="word-paper-canvas">
                      {formBlocks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="composer-inline-upload-btn"
                            onClick={handleAddTextBlock}
                          >
                            <Plus size={14} />
                            <span>{isVi ? 'Bắt đầu viết đoạn văn đầu tiên' : 'Add first paragraph'}</span>
                          </button>
                          <button
                            type="button"
                            className="composer-inline-upload-btn"
                            onClick={() => {
                              setInsertAfterBlockIndex(-1);
                              setActiveInlineBlockId(null);
                              inlineFileInputRef.current?.click();
                            }}
                            style={{ background: '#FFFBEB', borderColor: '#FCD34D', color: '#B45309' }}
                          >
                            <ImageIcon size={14} />
                            <span>{isVi ? '🖼️ Chèn nhiều ảnh cùng lúc' : '🖼️ Insert multiple photos'}</span>
                          </button>
                        </div>
                      )}
                      {formBlocks.map((block, bIdx) => {
                        const isFirstText = bIdx === 0 && block.type === 'text';

                        return (
                          <React.Fragment key={block.id}>
                            {/* Document Block Item */}
                            {block.type === 'text' ? (
                              <div className="word-doc-para-wrap">
                                <div className="word-doc-para-label">
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isFirstText ? '#D97706' : '#64748B', fontWeight: isFirstText ? 800 : 700 }}>
                                    {isFirstText ? (
                                      <>
                                        <Sparkles size={13} color="#D97706" />
                                        <span>{isVi ? '⭐ Đoạn mở đầu (Sapo bài viết):' : '⭐ Lead Summary (Sapo):'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <FileText size={13} />
                                        <span>{isVi ? `Đoạn văn #${bIdx + 1}:` : `Paragraph #${bIdx + 1}:`}</span>
                                      </>
                                    )}
                                  </span>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <button
                                      type="button"
                                      className="composer-block-btn"
                                      disabled={bIdx === 0}
                                      onClick={() => handleMoveBlock(bIdx, 'up')}
                                      title={isVi ? 'Di chuyển lên' : 'Move up'}
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      className="composer-block-btn"
                                      disabled={bIdx === formBlocks.length - 1}
                                      onClick={() => handleMoveBlock(bIdx, 'down')}
                                      title={isVi ? 'Di chuyển xuống' : 'Move down'}
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      className="composer-block-btn delete"
                                      onClick={() => handleDeleteBlock(block.id)}
                                      title={isVi ? 'Xóa đoạn này' : 'Delete paragraph'}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                <textarea maxLength={20000}
                                  className={`word-doc-textarea ${isFirstText ? 'is-sapo' : ''}`}
                                  rows={isFirstText ? 3 : 4}
                                  placeholder={
                                    isFirstText
                                      ? (isVi ? 'Viết 2-3 câu giới thiệu ngắn gọn mở đầu bài viết (Sapo)...' : 'Write 2-3 sentences lead introduction (Sapo)...')
                                      : (isVi ? `Nhập nội dung cho đoạn văn số ${bIdx + 1}...` : `Type paragraph ${bIdx + 1} content here...`)
                                  }
                                  value={block.text}
                                  onChange={e => {
                                    const next = [...formBlocks];
                                    if (next[bIdx].type === 'text') {
                                      (next[bIdx] as any).text = e.target.value;
                                      setFormBlocks(next);
                                      if (isFirstText) {
                                        setFormSummaryVi(e.target.value);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              /* Inline Image Block inside Document */
                              <div className="word-doc-image-card">
                                <div className="word-doc-image-header">
                                  <div className="word-doc-image-badge">
                                    <ImageIcon size={13} />
                                    <span>{isVi ? `🖼️ Hình ảnh tại vị trí dòng #${bIdx + 1}` : `🖼️ Inline Photo at Position #${bIdx + 1}`}</span>
                                  </div>

                                  <div className="word-doc-image-actions">
                                    <button
                                      type="button"
                                      className="composer-block-btn"
                                      disabled={bIdx === 0}
                                      onClick={() => handleMoveBlock(bIdx, 'up')}
                                      title={isVi ? 'Chuyển ảnh lên dòng trên' : 'Move photo up'}
                                    >
                                      <ArrowUp size={13} />
                                      <span style={{ fontSize: '0.7rem' }}>{isVi ? 'Lên' : 'Up'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="composer-block-btn"
                                      disabled={bIdx === formBlocks.length - 1}
                                      onClick={() => handleMoveBlock(bIdx, 'down')}
                                      title={isVi ? 'Chuyển ảnh xuống dòng dưới' : 'Move photo down'}
                                    >
                                      <ArrowDown size={13} />
                                      <span style={{ fontSize: '0.7rem' }}>{isVi ? 'Xuống' : 'Down'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="composer-block-btn delete"
                                      onClick={() => handleDeleteBlock(block.id)}
                                      title={isVi ? 'Xóa ảnh này' : 'Delete photo'}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                <div className="word-doc-img-preview-box">
                                  <img
                                    src={block.url || undefined}
                                    alt="Inline"
                                    className="word-doc-img-preview"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="composer-inline-upload-btn"
                                    onClick={() => {
                                      setInsertAfterBlockIndex(null);
                                      setActiveInlineBlockId(block.id);
                                      inlineFileInputRef.current?.click();
                                    }}
                                    title={isVi ? 'Thay ảnh này hoặc chọn nhiều ảnh để chèn thêm' : 'Replace photo or select multiple photos'}
                                  >
                                    <Upload size={14} />
                                    <span>{isVi ? 'Thay/chèn thêm ảnh từ máy tính' : 'Upload / add photos from device'}</span>
                                  </button>

                                  <input maxLength={10000000}
                                    type="text"
                                    className="admin-composer-input"
                                    style={{ flex: 1, minWidth: '220px', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                                    placeholder={isVi ? 'Hoặc nhập đường dẫn ảnh (URL)...' : 'Or paste Image URL...'}
                                    value={block.url}
                                    onChange={e => {
                                      const next = [...formBlocks];
                                      if (next[bIdx].type === 'image') {
                                        (next[bIdx] as any).url = e.target.value;
                                        setFormBlocks(next);
                                      }
                                    }}
                                  />
                                </div>

                                <input maxLength={5000}
                                  type="text"
                                  className="word-doc-caption-input"
                                  placeholder={isVi ? 'Nhập chú thích hiển thị dưới bức ảnh (vd: Độc giả giao lưu cùng tác giả...)' : 'Enter image caption below photo...'}
                                  value={block.caption}
                                  onChange={e => {
                                    const next = [...formBlocks];
                                    if (next[bIdx].type === 'image') {
                                      (next[bIdx] as any).caption = e.target.value;
                                      setFormBlocks(next);
                                    }
                                  }}
                                />
                              </div>
                            )}

                            {/* Quick Inline Insert Bar between lines */}
                            <div className="word-inline-insert-bar">
                              <button
                                type="button"
                                className="word-insert-btn"
                                onClick={() => {
                                  const next = [...formBlocks];
                                  next.splice(bIdx + 1, 0, {
                                    id: `blk-${Date.now()}`,
                                    type: 'text',
                                    text: ''
                                  });
                                  setFormBlocks(next);
                                }}
                              >
                                <Plus size={11} />
                                <span>{isVi ? 'Thêm đoạn văn tại đây' : 'Insert paragraph here'}</span>
                              </button>

                              <button
                                type="button"
                                className="word-insert-btn image-insert"
                                onClick={() => {
                                  setInsertAfterBlockIndex(bIdx);
                                  setActiveInlineBlockId(null);
                                  inlineFileInputRef.current?.click();
                                }}
                                title={isVi ? 'Chèn một hoặc nhiều ảnh cùng lúc từ máy tính' : 'Insert one or multiple photos from device'}
                              >
                                <ImageIcon size={11} />
                                <span>{isVi ? '🖼️ Chèn ảnh (chọn nhiều ảnh)' : '🖼️ Insert photo(s)'}</span>
                              </button>
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Bottom Append Bar */}
                      {formBlocks.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginTop: '1.25rem',
                            paddingTop: '1rem',
                            borderTop: '1px dashed #CBD5E1',
                            flexWrap: 'wrap'
                          }}
                        >
                          <button
                            type="button"
                            className="word-insert-btn"
                            onClick={handleAddTextBlock}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                          >
                            <Plus size={13} />
                            <span>{isVi ? 'Thêm đoạn văn tiếp theo' : 'Add next paragraph'}</span>
                          </button>
                          <button
                            type="button"
                            className="word-insert-btn image-insert"
                            onClick={() => {
                              setInsertAfterBlockIndex(formBlocks.length - 1);
                              setActiveInlineBlockId(null);
                              inlineFileInputRef.current?.click();
                            }}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            title={isVi ? 'Chọn một hoặc nhiều ảnh từ máy tính để thêm vào cuối' : 'Select one or multiple photos to add at end'}
                          >
                            <ImageIcon size={13} />
                            <span>{isVi ? '🖼️ Chèn thêm ảnh vào cuối (chọn nhiều ảnh)' : '🖼️ Insert photo(s) at end'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Thẻ từ khóa (Tags) & Ghim Tiêu Điểm */}
                <div className="composer-section-card">
                  <div className="composer-section-header">
                    <div className="composer-section-title-wrap">
                      <span className="composer-step-num">04</span>
                      <span className="composer-section-title-text">{isVi ? 'Từ khóa & Ghim nổi bật' : 'Tags & Spotlight'}</span>
                    </div>
                    <span className="composer-section-badge">{isVi ? 'Xuất bản' : 'Publish'}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Tags selector */}
                    <div className="admin-composer-group">
                      <label className="admin-composer-label">
                        <Tag size={13} />
                        <span>{isVi ? 'Chọn thẻ từ khóa (Bấm vào thẻ để thêm/bớt):' : 'Select Tags:'}</span>
                      </label>

                      <div className="composer-suggested-tags">
                        {SUGGESTED_TAGS.map((t, idx) => {
                          const isTagSelected = formSelectedTags.includes(t);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`composer-tag-chip-btn ${isTagSelected ? 'active' : ''}`}
                              onClick={() => handleToggleTag(t)}
                            >
                              {isTagSelected ? '✓ ' : '+ '}#{t}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom tag input */}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', maxWidth: '380px' }}>
                        <input maxLength={100}
                          type="text"
                          className="admin-composer-input"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                          placeholder={isVi ? 'Nhập tag khác...' : 'Add custom tag...'}
                          value={customTagInput}
                          onChange={e => setCustomTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="composer-tag-chip-btn"
                          style={{ padding: '0.4rem 0.85rem', fontWeight: 700 }}
                          onClick={handleAddCustomTag}
                        >
                          {isVi ? 'Thêm' : 'Add'}
                        </button>
                      </div>
                    </div>

                    {/* Spotlight checkbox banner */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        background: formFeatured ? '#FEF3C7' : '#F8FAFC',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: formFeatured ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={e => setFormFeatured(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#D97706', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: formFeatured ? '#B45309' : '#0F172A' }}>
                          ⭐ {isVi ? 'Ghim bài viết làm Tiêu Điểm (Featured Spotlight)' : 'Set as Spotlight Article'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {isVi ? 'Bài viết sẽ được hiển thị to nhất ở vị trí danh dự đầu trang tin tức.' : 'Pin article in prominent hero spotlight spot on news page.'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="admin-composer-footer" style={{ margin: '0 -1.75rem -1.5rem', borderRadius: '0 0 20px 20px' }}>
                  <button
                    type="button"
                    className="news-btn-secondary news-btn-cancel"
                    onClick={() => setIsComposerOpen(false)}
                  >
                    <span>{isVi ? 'Hủy bỏ' : 'Cancel'}</span>
                  </button>

                  <div className="composer-footer-right-actions">
                    <button
                      type="button"
                      className="news-btn-secondary news-btn-preview"
                      onClick={() => setComposerMode('preview')}
                    >
                      <Eye size={16} />
                      <span>{isVi ? 'Xem trước bài viết' : 'Preview'}</span>
                    </button>

                    <button
                      type="submit"
                      className="news-btn-primary news-btn-publish"
                    >
                      <Send size={16} />
                      <span>
                        {editingArticleId
                          ? (isVi ? 'Lưu Thay Đổi Bài Viết' : 'Save Changes')
                          : (isVi ? '🚀 Đăng Bài Viết Ngay' : '🚀 Publish Article')}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Live Preview Mode inside Composer */
              <div className="admin-composer-body">
                <div className="composer-live-preview-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="admin-news-cat-pill active">
                      {CATEGORIES.find(c => c.id === formCategory)?.labelVi || 'Sự kiện'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• {formPublishedDate}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• {formReadTime}</span>
                    {formFeatured && (
                      <span className="admin-article-featured-badge" style={{ position: 'static' }}>
                        <Star size={12} fill="#FFFFFF" />
                        <span>{isVi ? 'TIÊU ĐIỂM' : 'SPOTLIGHT'}</span>
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.35, margin: 0 }}>
                    {formTitleVi || (isVi ? '[Tiêu đề bài viết chưa nhập]' : '[Untitled Article]')}
                  </h1>

                  <div style={{ width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', background: '#0F172A', margin: '0.5rem 0 0' }}>
                    <img
                      src={formImageUrl || undefined}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  {formImageCaptionVi && (
                    <p style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                      {formImageCaptionVi}
                    </p>
                  )}

                  {formSummaryVi && (
                    <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#334155', lineHeight: 1.6, padding: '1rem 1.25rem', background: '#FFFBEB', borderLeft: '4px solid #D97706', borderRadius: '0 8px 8px 0' }}>
                      {formSummaryVi}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1E293B', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {formBlocks.map((block, idx) => {
                      if (block.type === 'image') {
                        return (
                          <figure key={idx} className="news-inline-media-wrap" style={{ margin: '0.5rem 0' }}>
                            <img
                              src={block.url || undefined}
                              alt={block.caption || 'Hình ảnh'}
                              className="news-inline-media-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {block.caption && (
                              <figcaption className="news-inline-media-caption">
                                {block.caption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }
                      return (
                        <p key={idx} style={{ margin: 0 }}>
                          {block.text}
                        </p>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                      Tác giả: {formAuthor}
                    </span>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {formSelectedTags.map((t, idx) => (
                        <span key={idx} className="admin-article-tag-chip">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-composer-footer" style={{ margin: '0 -1.75rem -1.5rem', borderRadius: '0 0 20px 20px' }}>
                  <button
                    type="button"
                    className="news-btn-secondary news-btn-back"
                    onClick={() => setComposerMode('edit')}
                  >
                    <Edit3 size={15} />
                    <span>{isVi ? 'Quay lại chỉnh sửa' : 'Back to Editor'}</span>
                  </button>

                  <button
                    type="button"
                    className="news-btn-primary news-btn-publish"
                    onClick={handleSaveArticle}
                  >
                    <Send size={16} />
                    <span>
                      {editingArticleId
                        ? (isVi ? 'Lưu Thay Đổi Bài Viết' : 'Save Changes')
                        : (isVi ? '🚀 Đăng Bài Viết Ngay' : '🚀 Publish Article')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Live Reader Modal */}
      {previewArticle && (
        <div className="admin-composer-backdrop" onClick={() => setPreviewArticle(null)}>
          <div className="admin-preview-modal" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="admin-composer-close-btn"
              style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
              onClick={() => setPreviewArticle(null)}
              title="Đóng"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingRight: '3.5rem' }}>
              <span className="admin-news-cat-pill active">
                {previewArticle.categoryLabelVi}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• {previewArticle.publishedDate}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• {previewArticle.readTime}</span>
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.35, margin: '0 0 1rem' }}>
              {previewArticle.titleVi}
            </h1>

            <div style={{ width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', background: '#0F172A', marginBottom: '0.5rem' }}>
              <img
                src={previewArticle.imageUrl || undefined}
                alt={previewArticle.titleVi}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {previewArticle.imageCaptionVi && (
              <p style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center', margin: '0 0 1.5rem' }}>
                {previewArticle.imageCaptionVi}
              </p>
            )}

            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', lineHeight: 1.6, padding: '1rem 1.25rem', background: '#FFFBEB', borderLeft: '4px solid #D97706', borderRadius: '0 8px 8px 0', margin: '0 0 1.5rem' }}>
              {previewArticle.summaryVi}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1E293B', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {(previewArticle.contentVi || []).map((item, idx) => {
                const imgMatch = item.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                  const caption = imgMatch[1];
                  const url = imgMatch[2];
                  return (
                    <figure key={idx} className="news-inline-media-wrap">
                      <img
                        src={url}
                        alt={caption || 'Hình ảnh'}
                        className="news-inline-media-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {caption && (
                        <figcaption className="news-inline-media-caption">
                          {caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                return (
                  <p key={idx} style={{ margin: 0 }}>
                    {item}
                  </p>
                );
              })}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                Tác giả: {previewArticle.author}
              </span>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(previewArticle.tags || []).map((t, idx) => (
                  <span key={idx} className="admin-article-tag-chip">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Toast notification */}
      {toastMessage && (
        <div className="editor-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
