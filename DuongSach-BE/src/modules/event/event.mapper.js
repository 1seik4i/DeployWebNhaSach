import { formatDateVietnam } from '../../utils/dateFormat.js';
import { eventTiming } from './event-time.js';

export class EventMapper {
  static toClient(event) {
    if (!event) return null;
    const { dateStr, dayOfWeek } = formatDateVietnam(event.startAt);
    const timing = eventTiming(event);

    const titleLower = (event.title || '').toLowerCase();
    const themeLower = (event.theme || '').toLowerCase();
    let type = 'talkshow';
    let typeLabelVi = 'Tọa đàm & Giao lưu';
    let typeLabelEn = 'Talkshows & Panels';

    if (titleLower.includes('ra mắt') || themeLower.includes('ra mắt') || titleLower.includes('launch')) {
      type = 'launch';
      typeLabelVi = 'Ra mắt sách mới';
      typeLabelEn = 'Book Launches';
    } else if (
      titleLower.includes('workshop') || themeLower.includes('workshop') ||
      titleLower.includes('lễ hội') || themeLower.includes('lễ hội') ||
      titleLower.includes('hội sách') || themeLower.includes('hội sách') ||
      titleLower.includes('ngày hội') || themeLower.includes('ngày hội') ||
      titleLower.includes('thực hành') || titleLower.includes('mộc bản')
    ) {
      type = 'workshop';
      typeLabelVi = 'Workshop & Lễ hội';
      typeLabelEn = 'Workshops & Festivals';
    }

    const speaker = event.activities?.find(a => a.speaker)?.speaker || '';

    return {
      id: event.id,
      title: event.title,
      titleEn: event.titleEn || event.title,
      slug: event.slug,
      theme: event.theme || '',
      type,
      typeLabelVi,
      typeLabelEn,
      dateStr,
      dateRange: timing.dateRange,
      timeStr: timing.timeStr,
      dayOfWeek,
      startDate: timing.startDate,
      endDate: timing.endDate,
      location: event.venue?.name || 'Đường Sách TP.HCM',
      locationEn: event.venue?.name || 'Ho Chi Minh City Book Street',
      priorityLevel: event.priorityLevel || 'regular',
      status: timing.displayStatus,
      statusLabelVi: timing.statusLabelVi,
      startAt: event.startAt,
      endAt: event.endAt,
      isOngoingToday: timing.isOngoingToday,
      summary: event.summary || event.description?.slice(0, 150) || '',
      summaryEn: event.summaryEn || event.summary || event.description?.slice(0, 150) || '',
      speaker,
      image: {
        url: event.coverImageUrl || '/duong_sach_logo.png',
        alt: event.title,
        source: '',
        license: '',
        isIllustrationOnly: false,
      },
    };
  }

  static withTiming(event) {
    if (!event) return null;
    const timing = eventTiming(event);
    return {
      ...event,
      ...timing,
    };
  }
}
