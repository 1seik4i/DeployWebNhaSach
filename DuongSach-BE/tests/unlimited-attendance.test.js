import { describe, expect, it, vi } from 'vitest';
import { checkSchedule } from '../src/modules/event/operations.routes.js';
const input = { eventId: 'event', locationId: 'location', startAt: '2026-10-12T09:00:00+07:00', endAt: '2026-10-12T10:00:00+07:00', capacity: 10000 };
function database() {
  return {
    event: { findFirst: vi.fn().mockResolvedValue({ id: 'event', startAt: new Date('2026-10-12T00:00:00+07:00'), endAt: new Date('2026-10-13T00:00:00+07:00') }) },
    location: { findFirst: vi.fn().mockResolvedValue({ id: 'location', capacity: 10 }) },
    eventLocation: { findUnique: vi.fn().mockResolvedValue({}) },
    activity: { findFirst: vi.fn().mockResolvedValue(null) },
  };
}
describe('unlimited attendance', () => {
  it('accepts attendance estimates above the location capacity', async () => {
    expect((await checkSchedule(database(), input)).capacity).toBe(10000);
  });
  it('allows overlapping schedules at the same location', async () => {
    const tx = database(); tx.activity.findFirst.mockResolvedValue({ id: 'overlap' });
    expect((await checkSchedule(tx, input)).startAt).toEqual(new Date(input.startAt));
    expect(tx.activity.findFirst).not.toHaveBeenCalled();
  });
  it('allows a multi-day range with an earlier clock time on the last day', async () => {
    const range = { ...input, endAt: '2026-10-13T08:00:00+07:00' };
    const tx = database(); tx.event.findFirst.mockResolvedValue({ id: 'event', startAt: new Date('2026-10-12T00:00:00+07:00'), endAt: new Date('2026-10-14T00:00:00+07:00') });
    expect((await checkSchedule(tx, range)).endAt).toEqual(new Date(range.endAt));
  });
  it('rejects reversed start and end times', async () => {
    await expect(checkSchedule(database(), { ...input, endAt: input.startAt })).rejects.toThrow('Thời gian không phù hợp');
  });
  it('still rejects schedules outside event dates', async () => {
    await expect(checkSchedule(database(), { ...input, endAt: '2026-10-14T10:00:00+07:00' })).rejects.toThrow('Thời gian không phù hợp');
  });
});
