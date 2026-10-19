import { describe, expect, it } from 'vitest';
import { activityDateKey } from '../../DuongSach-FE/src/utils/activityDate';

describe('explicit day-month-year activity dates', () => {
  it.each(['31/02/2030', '31/04/2030', '29/02/2030', '10/20/2030', '2030-10-20', '20/10/30'])('rejects invalid or ambiguous date %s', date => {
    expect(activityDateKey(date)).toBeNull();
  });
  it('parses day/month order and accepts leap days', () => {
    expect(activityDateKey('20/10/2030')).toBe('2030-10-20');
    expect(activityDateKey('29/02/2032')).toBe('2032-02-29');
  });
});
