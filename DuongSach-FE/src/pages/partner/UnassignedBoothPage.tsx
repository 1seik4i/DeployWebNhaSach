import { Link } from 'react-router-dom';
import { CalendarDays, Map, Store } from 'lucide-react';
import type { Language } from '../../types';
import './PartnerPages.css';

export function UnassignedBoothPage({ language }: { language: Language }) {
  const vi = language === 'vi';
  return (
    <div className="partner-page">
      <div className="partner-page-header">
        <h1 className="partner-page-title">{vi ? 'Quản lý gian hàng' : 'Booth management'}</h1>
        <p className="partner-page-sub">{vi ? 'Theo dõi gian hàng được phân bổ cho tổ chức của bạn.' : 'View the booth assigned to your organization.'}</p>
      </div>
      <section className="partner-unassigned-booth" aria-labelledby="unassigned-booth-title">
        <div className="partner-unassigned-booth-icon"><Store size={32} aria-hidden="true" /></div>
        <h2 id="unassigned-booth-title">{vi ? 'Chưa có gian hàng được phân bổ' : 'No booth assigned yet'}</h2>
        <p>{vi
          ? 'Bạn vẫn có thể tham gia và tổ chức sự kiện khi chưa có gian hàng. Thông tin quản lý sẽ xuất hiện tại đây sau khi Ban quản lý phân bổ gian hàng cho tổ chức của bạn.'
          : 'You can participate in and organize events without a booth. Booth management will appear here once management assigns a booth to your organization.'}</p>
        <div className="partner-unassigned-booth-actions">
          <Link to="/partner/booths/select" className="btn-part-primary"><Map size={17} aria-hidden="true" />{vi ? 'Xem sơ đồ gian hàng' : 'View booth map'}</Link>
          <Link to="/partner/events" className="btn-part-secondary"><CalendarDays size={17} aria-hidden="true" />{vi ? 'Xem lịch sự kiện' : 'View event calendar'}</Link>
        </div>
      </section>
    </div>
  );
}
