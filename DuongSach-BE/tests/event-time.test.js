import { describe, expect, it } from 'vitest';
import { eventTiming } from '../src/modules/event/event-time.js';

describe('eventTiming', () => {
  it('marks an event scheduled on the current Vietnam date as happening', () => {
    const result = eventTiming(
      {
        status: 'published',
        startAt: new Date('2026-10-10T11:00:00.000Z'),
        endAt: new Date('2026-10-10T14:00:00.000Z'),
      },
      new Date('2026-10-10T01:00:00.000Z'),
    );

    expect(result).toMatchObject({
      startDate: '2026-10-10',
      endDate: '2026-10-10',
      displayStatus: 'happening',
      isOngoingToday: true,
      timeStr: '18:00 – 21:00',
    });
  });

  it('keeps a multi-day event happening throughout its Vietnam date range', () => {
    const result = eventTiming(
      {
        status: 'published',
        startAt: new Date('2026-10-08T02:00:00.000Z'),
        endAt: new Date('2026-10-15T10:00:00.000Z'),
      },
      new Date('2026-10-10T04:00:00.000Z'),
    );

    expect(result).toMatchObject({
      dateRange: '08/10/2026 - 15/10/2026',
      displayStatus: 'happening',
      isOngoingToday: true,
    });
  });
});
