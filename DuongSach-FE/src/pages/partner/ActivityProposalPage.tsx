import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { matchesSearch } from '../../utils/inputValidation';
import { Calendar, Clock, MapPin, Users, Eye, Edit3, AlertCircle, Mic } from 'lucide-react';
import { Language, PartnerActivityProposal } from '../../types';
import './PartnerPages.css';

interface ActivityProposalPageProps {
  language: Language;
  activities: PartnerActivityProposal[];
  locations: Array<{ id: string; name: string; capacity: number }>;
  assets: Array<{ id: string; name: string; totalQuantity: number }>;
  onAddActivity: (newAct: Omit<PartnerActivityProposal, 'id'>) => void | Promise<void>;
  onOpenAttendanceModal?: (activityId: string) => void;
}

export const ActivityProposalPage: React.FC<ActivityProposalPageProps> = ({
  language,
  activities,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'need_changes' | 'rejected' | 'withdrawn'>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSearch = (searchParams.get('search') || '').slice(0, 200);
  const query = rawSearch.normalize('NFC').trim();
  const pendingCount = activities.filter(a => a.status === 'pending').length;
  const approvedCount = activities.filter(a => a.status === 'approved').length;
  const needChangesCount = activities.filter(a => a.status === 'need_changes').length;
  const rejectedCount = activities.filter(a => a.status === 'rejected').length;
  const withdrawnCount = activities.filter(a => a.status === 'withdrawn').length;

  const filteredActivities = activities.filter(a => {
    if (!matchesSearch(query, a.title, a.speaker, a.location)) return false;
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  return (
    <div className="activity-proposal-page">
      {query && <p role="status">{language === 'vi' ? 'Kết quả tìm kiếm' : 'Search results'}: {query} <button type="button" onClick={() => { const params = new URLSearchParams(searchParams); params.delete('search'); setSearchParams(params); }}>{language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}</button></p>}
      {/* 1. Header matching Sketch Screen 5 */}
      <div className="partner-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="partner-page-title">
            {language === 'vi' ? 'Quản lý hoạt động' : 'Activity Management'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Khởi tạo và theo dõi các hoạt động văn hóa, workshop và tọa đàm do đối tác tổ chức.' 
              : 'Create and manage cultural workshops, talkshows and book signings.'}
          </p>
        </div>


      </div>

      <input
        className="partner-activity-mobile-search"
        type="search"
        aria-label={language === 'vi' ? 'Tìm hoạt động' : 'Search activities'}
        placeholder={language === 'vi' ? 'Tìm hoạt động...' : 'Search activities...'}
        maxLength={200}
        value={rawSearch}
        onChange={event => {
          const params = new URLSearchParams(searchParams);
          if (event.target.value) params.set('search', event.target.value);
          else params.delete('search');
          setSearchParams(params, { replace: true });
        }}
      />
      {/* 2. Filter Tabs matching Sketch Screen 5 */}
      <div className="partner-tabs-bar">
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {language === 'vi' ? `Tất cả (${activities.length})` : `All (${activities.length})`}
        </button>
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          {language === 'vi' ? `Chờ duyệt (${pendingCount})` : `Pending (${pendingCount})`}
        </button>
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'approved' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          {language === 'vi' ? `Đã duyệt (${approvedCount})` : `Approved (${approvedCount})`}
        </button>
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'need_changes' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('need_changes')}
        >
          {language === 'vi' ? `Cần chỉnh sửa (${needChangesCount})` : `Needs Revision (${needChangesCount})`}
        </button>
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'rejected' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          {language === 'vi' ? `Từ chối (${rejectedCount})` : `Rejected (${rejectedCount})`}
        </button>
        <button
          type="button"
          className={`partner-tab-btn ${activeTab === 'withdrawn' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('withdrawn')}
        >
          {language === 'vi' ? `Đã hủy (${withdrawnCount})` : `Withdrawn (${withdrawnCount})`}
        </button>
      </div>

      {/* 3. Activity List Items matching Sketch Screen 5 */}
      {filteredActivities.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2EAE5',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#637771'
        }}>
          <p>{language === 'vi' ? 'Không có hoạt động nào trong danh mục này.' : 'No activities found.'}</p>
        </div>
      ) : (
        <div className="partner-activities-list">
          {filteredActivities.map((act) => {
            const isApproved = act.status === 'approved';
            const isPending = act.status === 'pending';
            const isNeedChanges = act.status === 'need_changes';

            return (
              <div key={act.id} className="partner-activity-row-card">
                <div className="activity-row-left">
                  <img 
                    src={act.imageUrl} 
                    alt={act.title} 
                    className="activity-thumb-img"
                  />
                  <div className="activity-info-col">
                    <div className="activity-tags-row">
                      <span className="activity-category-tag">
                        {act.category}
                      </span>
                      {act.boothCode && (
                        <span className="activity-booth-tag">
                          {language === 'vi' ? `Gian hàng ${act.boothCode}` : `Booth ${act.boothCode}`}
                        </span>
                      )}
                    </div>
                    <h3 className="activity-title-text">{act.title}</h3>

                    <div className="activity-specs-line">
                      <span className="activity-spec-item"><Calendar size={13} /> {act.date}</span>
                      <span className="activity-spec-item"><Clock size={13} /> {act.time}</span>
                      <span className="activity-spec-item"><MapPin size={13} /> {act.location}</span>
                      <span className="activity-spec-item"><Users size={13} /> {language === 'vi' ? `${act.capacity} người` : `${act.capacity} pax`}</span>
                      {act.speaker && <span className="activity-spec-item speaker-item"><Mic size={13} /> {act.speaker}</span>}
                    </div>

                    {act.feedbacks && isNeedChanges && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.8rem',
                        color: '#B91C1C',
                        background: '#FEE2E2',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <AlertCircle size={14} />
                        <span>{act.feedbacks}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="activity-row-right">
                  <div>
                    <span className={`status-badge ${act.status}`}>
                      {isApproved && 'Đã duyệt'}
                      {isPending && 'Chờ duyệt'}
                      {isNeedChanges && 'Cần chỉnh sửa'}
                      {act.status === 'rejected' && (language === 'vi' ? 'Từ chối' : 'Rejected')}
                      {act.status === 'withdrawn' && (language === 'vi' ? 'Đã hủy' : 'Withdrawn')}
                    </span>
                  </div>

                  <div className="activity-row-actions">
                    <Link 
                      to={`/partner/activities/${act.id}`} 
                      className="btn-part-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <Eye size={14} />
                      <span>{language === 'vi' ? 'Xem' : 'View'}</span>
                    </Link>

                    <Link 
                      to={`/partner/activities/${act.id}`}
                      className="btn-part-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} />
                      <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: Đăng ký Đề xuất Hoạt động mới (Sử dụng chuẩn Form từ Đăng ký Tổ chức Sự kiện) */}
    </div>
  );
};
