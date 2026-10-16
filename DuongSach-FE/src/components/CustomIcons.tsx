import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 1. Cuốn sách mở: Điểm đọc & Văn hóa (Cân đối chính tâm 24x24)
export const IconOpenBook: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 4.5h6a3.5 3.5 0 0 1 4 3.5v11.5a3 3 0 0 0-3-2.5H2z" />
    <path d="M22 4.5h-6a3.5 3.5 0 0 0-4 3.5v11.5a3 3 0 0 1 3-2.5h7z" />
    <line x1="12" y1="8" x2="12" y2="19.5" strokeWidth="1.4" />
  </svg>
);

// 2. Gian hàng sách & Ki-ốt xuất bản (Storefront Pavilion with Book Display)
export const IconBookSpine: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    style={style}
  >
    {/* Mái hiên ki-ốt / gian hàng */}
    <path d="M3 8.5l2.5-4.5h13L21 8.5v2H3v-2z" />
    <path d="M4 10.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
    {/* Các cuốn sách trưng bày trên kệ bên trong quầy */}
    <path d="M7.5 13.5v4.5" strokeWidth="2" />
    <path d="M10.5 13.5v4.5" strokeWidth="2" />
    <path d="M13.5 13.5v4.5" strokeWidth="2" />
    <path d="M17 14.5l-1.5 3.5" strokeWidth="2" />
  </svg>
);

// 3. Dấu trang (Bookmark): Tiến trình & Điểm lưu
export const IconBookmark: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    <line x1="12" y1="7" x2="12" y2="11" />
  </svg>
);

// 4. Giới thiệu / Không gian Đường Sách (Sách mở tri thức & Mầm xanh cân đối chính tâm)
export const IconCanopyTree: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    style={style}
  >
    {/* Cuốn sách mở cân đối chuẩn tâm tọa độ */}
    <path d="M3 6.5C5.5 5 9 5.5 12 7.5C15 5.5 18.5 5 21 6.5V18C18.5 16.5 15 17 12 19C9 17 5.5 16.5 3 18V6.5Z" />
    <line x1="12" y1="7.5" x2="12" y2="19" strokeWidth="1.4" />
    {/* Chồi lá mầm tri thức vươn lên chính giữa */}
    <path d="M12 7.5c-.8-2.2-2.5-3.5-4.5-3.5 0 2.2 1.3 3.5 3.5 4.5" strokeWidth="1.5" />
    <path d="M12 7.5c.8-2.2 2.5-3.5 4.5-3.5 0 2.2-1.3 3.5-3.5 4.5" strokeWidth="1.5" />
  </svg>
);

// 5. Tách cà phê phin: Tiện ích thư giãn
export const IconCoffeeCup: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

// 6. Ghim bản đồ hình cuốn sách: Định vị 144m
export const IconMapBookPin: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 21s-7-4.5-7-10.5a7 7 0 1 1 14 0c0 6-7 10.5-7 10.5z" />
    <path d="M9.5 8.5h2.5v4H9.5z" />
    <path d="M12 8.5h2.5v4H12z" />
  </svg>
);

// 7. Tấm vé sự kiện (Paper Ticket): Tọa đàm & Hoạt động
export const IconEventTicket: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
  </svg>
);

// 8. Biểu tượng Di sản (Heritage Pavilion & Sun Aura): Khuê Văn Các / Đình miếu cổ truyền
export const IconHeritageSeal: React.FC<IconProps> = ({ size = 22, color = 'currentColor', className = '', style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="1.6" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    style={style}
  >
    {/* Vòng tròn nhật hoa / mặt trời nền */}
    <circle cx="12" cy="11" r="7.5" strokeDasharray="2 1.5" strokeWidth="1.1" opacity="0.65" />
    {/* Vòng cung lưỡi liềm bao quanh đáy và hai bên đình */}
    <path d="M4.5 9.5C3.8 13.5 6 17.5 10 19c1.3.5 2.7.5 4 0 4-1.5 6.2-5.5 5.5-9.5" strokeWidth="1.8" />
    {/* Mái đình cong vút đặc trưng di tích kiến trúc cổ */}
    <path d="M12 4c.6 1.8 2.2 3.2 5 3.8-1.5.8-2.8 1.4-5 1.4s-3.5-.6-5-1.4c2.8-.6 4.4-2 5-3.8z" fill="currentColor" fillOpacity="0.15" strokeWidth="1.5" />
    <path d="M9.5 6.8h5" strokeWidth="1.2" />
    {/* Cột trụ & lan can gian điện chính */}
    <path d="M8 9.2v5.3h8V9.2" strokeWidth="1.5" />
    <path d="M10.5 9.2v5.3" strokeWidth="1.3" />
    <path d="M13.5 9.2v5.3" strokeWidth="1.3" />
    <path d="M7 14.5h10" strokeWidth="1.5" />
  </svg>
);

