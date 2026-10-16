const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const displayDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const vietnamDateKey = (value) => dateKeyFormatter.format(new Date(value));

export const eventTiming = (event, now = new Date()) => {
  const startAt = new Date(event.startAt);
  const endAt = new Date(event.endAt);
  const today = vietnamDateKey(now);
  const startDate = vietnamDateKey(startAt);
  const endDate = vietnamDateKey(endAt);
  const occursToday = startDate <= today && endDate >= today;

  let displayStatus = 'upcoming';
  if (event.status === 'draft') displayStatus = 'draft';
  else if (event.status === 'cancelled') displayStatus = 'cancelled';
  else if (occursToday) displayStatus = 'happening';
  else if (endDate < today) displayStatus = 'completed';

  const statusLabelVi = {
    happening: 'Đang diễn ra',
    upcoming: 'Sắp diễn ra',
    completed: 'Đã kết thúc',
    draft: 'Bản nháp',
    cancelled: 'Đã hủy',
  }[displayStatus];

  return {
    startDate,
    endDate,
    dateRange: startDate === endDate
      ? displayDateFormatter.format(startAt)
      : `${displayDateFormatter.format(startAt)} - ${displayDateFormatter.format(endAt)}`,
    timeStr: startDate === endDate
      ? (timeFormatter.format(startAt) === timeFormatter.format(endAt)
          ? timeFormatter.format(startAt)
          : `${timeFormatter.format(startAt)} – ${timeFormatter.format(endAt)}`)
      : 'Cả ngày',
    displayStatus,
    statusLabelVi,
    isOngoingToday: occursToday,
  };
};
