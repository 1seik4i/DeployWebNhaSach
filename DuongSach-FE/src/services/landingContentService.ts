import { validateManagedContent } from '../utils/inputValidation';
import type { NewsArticle } from '../pages/NewsExperience';
import { apiClient } from './apiClient';
import {
  DEFAULT_JOURNEY,
  DEFAULT_NEWS,
  DEFAULT_ORGANIZATION
} from './defaultLandingContent';

export interface JourneyContent {
  hero: { era: string; titleLine1: string; titleLine2: string; titleLine3: string; summary: string; bgPhoto?: string };
  brandStory: { title: string; desc: string; heading: string; paragraph1: string; paragraph2: string; quote: string; quoteAuthor: string; image1: string; image1Caption?: string; image2: string; image2Caption?: string; image3: string; image3Caption?: string; image4: string; image4Caption?: string };
  visionMission: { introTitleLine1?: string; introTitleLine2?: string; introDesc?: string; visionTitle?: string; visionDesc?: string; visionImage?: string; missionTitle?: string; missionDesc?: string; missionPoints?: string[]; openAccessTitle?: string; openAccessDesc?: string; networkTitle?: string; networkDesc?: string; innovationTitle?: string; innovationDesc?: string };
  milestonesHeader?: { title: string; desc: string };
  milestones: Array<{ id?: string; year: string; title: string; desc: string; image: string; badge: string }>;
  achievementsHeader?: { title: string; desc: string };
  achievements: Array<{ value: number; suffix: string; label: string; desc: string }>;
  partnersHeader?: { title: string; eduTitle: string; corpTitle: string };
  educationPartners?: PartnerItem[];
  enterprisePartners?: PartnerItem[];
}

export interface PartnerItem {
  id: string;
  name: string;
  category: 'education' | 'enterprise';
  logoUrl?: string;
  logoText?: string;
  subText?: string;
  websiteUrl?: string;
}

export interface OrganizationLeader {
  id: string;
  nameVi: string;
  roleVi: string;
  badgeVi: string;
  subVi: string;
  bioVi: string;
  contactEmail: string;
  avatarText: string;
  imageUrl?: string;
  tagsVi: string[];
  tier?: 1 | 2 | 3;
}

export interface OrganizationContent {
  hero: { era: string; title: string; lead: string };
  directory: { kicker: string; heading: string; sub: string; titleLine1?: string; titleHighlight?: string; subtitle?: string; tier1Title?: string; tier1Badge?: string; tier2Title?: string; tier2Badge?: string; tier3Title?: string; tier3Badge?: string };
  leaders: OrganizationLeader[];
  principles: Array<{ num: string; title: string; desc: string }>;
}

type ContentKind = 'journey' | 'news' | 'organization';
type ContentEntry = { id: string; slug: string; kind: ContentKind; title: string; data: Record<string, unknown>; status: 'draft' | 'published' | 'hidden'; version: number };
const EVENT_NAME = 'duongsach_landing_content_changed';
const CONTENT_SLUGS: Record<ContentKind, string> = {
  journey: 'landing-journey',
  news: 'landing-news',
  organization: 'landing-org',
};

class LandingContentService {
  private journey: JourneyContent = structuredClone(DEFAULT_JOURNEY);
  private news: NewsArticle[] = structuredClone(DEFAULT_NEWS);
  private organization: OrganizationContent = structuredClone(DEFAULT_ORGANIZATION);
  private entries = new Map<ContentKind, ContentEntry>();

  constructor() {
    void this.refreshPublic().catch((error) => {
      console.error('Không thể tải nội dung landing từ máy chủ', error);
    });
  }

  private emit(type: ContentKind) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type } }));
  }

  async refreshPublic(): Promise<void> {
    const entries = await apiClient.get<ContentEntry[]>('/public/content');
    const findContent = (kind: ContentKind) =>
      entries.find(entry => entry.slug === CONTENT_SLUGS[kind])
      ?? entries.find(entry => entry.kind === kind);

    const journey = findContent('journey');
    if (journey && journey.data) {
      const jData = journey.data as unknown as JourneyContent;
      if (jData.hero?.titleLine1 || (Array.isArray(jData.milestones) && jData.milestones.length > 0)) {
        this.journey = jData;
      }
      this.entries.set('journey', journey);
      this.emit('journey');
    }

    const news = findContent('news');
    if (news) {
      if (Array.isArray(news.data.articles) && news.data.articles.length > 0) {
        this.news = news.data.articles as NewsArticle[];
      }
      this.entries.set('news', news);
      this.emit('news');
    }

    const organization = findContent('organization');
    if (organization && organization.data) {
      const oData = organization.data as unknown as OrganizationContent;
      if (oData.hero?.title || (Array.isArray(oData.leaders) && oData.leaders.length > 0)) {
        this.organization = oData;
      }
      this.entries.set('organization', organization);
      this.emit('organization');
    }
  }

  private async save(kind: ContentKind, title: string, data: Record<string, unknown>): Promise<ContentEntry> {
    validateManagedContent(data);
    let entry = this.entries.get(kind);
    if (!entry) {
      const rows = await apiClient.get<ContentEntry[]>('/admin/content');
      entry = rows.find(row => row.slug === CONTENT_SLUGS[kind]);
    }
    const saved = entry
      ? await apiClient.patch<ContentEntry>(`/admin/content/${encodeURIComponent(entry.id)}`, { data, status: 'published', expectedVersion: entry.version })
      : await apiClient.post<ContentEntry>('/admin/content', { slug: CONTENT_SLUGS[kind], kind, title, data, status: 'published' });
    this.entries.set(kind, saved);
    this.emit(kind);
    return saved;
  }

  getJourney() { return this.journey; }
  async saveJourney(data: JourneyContent) {
    await this.save('journey', 'Hành trình Đường Sách', data as unknown as Record<string, unknown>);
    this.journey = data;
    this.emit('journey');
  }
  async resetJourney() {
    const value = structuredClone(DEFAULT_JOURNEY);
    await this.saveJourney(value);
    return value;
  }

  getNews() { return this.news; }
  async saveNews(articles: NewsArticle[]) {
    const saved = await this.save('news', 'Tin tức Đường Sách', { articles });
    this.news = Array.isArray(saved.data.articles) ? saved.data.articles as NewsArticle[] : [];
    this.emit('news');
  }
  async recordNewsRead(articleId: string): Promise<number> {
    const storageKey = 'duongsach_visit_session';
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);
    }
    const result = await apiClient.post<{ articleId: string; viewCount: number }>(
      `/public/news/${encodeURIComponent(articleId)}/read`,
      { sessionId },
    );
    this.news = this.news.map(article => article.id === articleId ? { ...article, views: result.viewCount } : article);
    this.emit('news');
    return result.viewCount;
  }
  async resetNews() {
    const value = structuredClone(DEFAULT_NEWS);
    await this.saveNews(value);
    return value;
  }

  getOrganization() { return this.organization; }
  async saveOrganization(data: OrganizationContent) {
    await this.save('organization', 'Tổ chức Đường Sách', data as unknown as Record<string, unknown>);
    this.organization = data;
    this.emit('organization');
  }
  async resetOrganization() {
    const value = structuredClone(DEFAULT_ORGANIZATION);
    await this.saveOrganization(value);
    return value;
  }

  subscribe(callback: (type: ContentKind) => void): () => void {
    const handler = (event: Event) => {
      const type = (event as CustomEvent<{ type: ContentKind }>).detail?.type;
      if (type) callback(type);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }
}

export const landingContentService = new LandingContentService();
