import { useState, type ImgHTMLAttributes } from 'react';

/** Keep an unavailable external image from leaving an empty/broken thumbnail. */
export function SafeImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState<string>();
  const source = src && failed !== src ? src : '/duong_sach_logo.png';
  return <img {...props} src={source} alt={alt} onError={() => { if (src) setFailed(src); }} />;
}
