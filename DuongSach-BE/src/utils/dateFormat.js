export const formatDateVietnam = (date) => {
  if (!date) return { dateStr: '', timeStr: '', dayOfWeek: '' };
  const d = new Date(date);
  
  const optionsDate = { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('vi-VN', optionsDate).formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const dateStr = `${year}-${month}-${day}`;

  const optionsTime = { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false };
  const timeStr = new Intl.DateTimeFormat('vi-VN', optionsTime).format(d);

  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeek = days[new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).getDay()];

  return {
    dateStr,
    timeStr,
    dayOfWeek,
  };
};
