export const boothStatusLabels: Record<string, string> = {
  available: 'Còn trống',
  assigned: 'Đã phân bổ',
};

export function notifyBoothsChanged() {
  window.dispatchEvent(new Event('booths-changed'));
}
