const MB = 1024 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);
const documentExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|webp)$/i;
const documentTypes = /^(?:application\/(?:pdf|msword|octet-stream|vnd\.[a-z0-9.+-]+)|image\/(?:png|jpeg|webp))$/i;

export function imageFileError(file: File, maxMb = 5): string | null {
  if (!imageTypes.has(file.type)) return 'Chọn ảnh PNG, JPEG, GIF, WebP hoặc AVIF.';
  if (file.name.length > 200) return 'Tên ảnh tối đa 200 ký tự.';
  if (!file.size || file.size > maxMb * MB) return `Ảnh phải có dung lượng từ 1 byte đến ${maxMb} MB.`;
  return null;
}

export function documentFileError(file: File, maxMb = 5): string | null {
  if (!documentExtensions.test(file.name) || (file.type && !documentTypes.test(file.type))) return 'Định dạng tài liệu không hợp lệ.';
  if (file.name.length > 200) return 'Tên tài liệu tối đa 200 ký tự.';
  if (!file.size || file.size > maxMb * MB) return `Tài liệu phải có dung lượng từ 1 byte đến ${maxMb} MB.`;
  return null;
}
