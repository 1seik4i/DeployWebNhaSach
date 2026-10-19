import React from 'react';
import { Activity, ArrowRight, Calendar, CheckCircle2, Clock3, LockKeyhole, ShieldAlert, Store, UserPlus, Users } from 'lucide-react';
import { AdminAuditLogItem, AdminUserAccount } from '../../types/admin';
import type { AdminDashboardStats } from '../../services/adminApi';

interface AdminDashboardViewProps {
  adminName?: string;
  onNavigateTab: (tab: string) => void;
  auditLogs: AdminAuditLogItem[];
  users: AdminUserAccount[];
  stats: AdminDashboardStats;
  onOpenAddUser: () => void;
}

const roleLabels: Record<string, string> = {
  partner: 'Đối tác / Gian hàng',
  admin: 'Quản trị viên',
};

const roleColors: Record<string, string> = {
  partner: '#c09349',
  admin: '#9b4d4d',
};

const getActivityIcon = (action: string) => {
  if (/khóa|bảo mật/i.test(action)) return <ShieldAlert size={16} />;
  if (/gian hàng/i.test(action)) return <Store size={16} />;
  if (/tài khoản|người dùng/i.test(action)) return <Users size={16} />;
  return <Activity size={16} />;
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ adminName, onNavigateTab, auditLogs, users, stats, onOpenAddUser }) => {
  const lockedUsersCount = users.filter(user => user.status === 'locked').length;
  const pendingUsersCount = users.filter(user => user.status === 'pending_verification').length;

  // Chuẩn hóa 7 ngày liên tiếp (đảm bảo biểu đồ luôn hiển thị cân xứng 7 cột)
  const full7Days = React.useMemo(() => {
    const countMap = new Map<string, number>();
    (stats.auditByDay || []).forEach(item => {
      countMap.set(item.date, item.count);
      const match = item.date.match(/(\d{1,2})[/-](\d{1,2})$/);
      if (match) {
        countMap.set(`${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`, item.count);
      }
    });

    const result: Array<{ date: string; label: string; count: number; isToday: boolean }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const count = countMap.get(dateKey) ?? countMap.get(`${dd}/${mm}`) ?? countMap.get(`${mm}-${dd}`) ?? 0;
      result.push({
        date: dateKey,
        label: `${dd}/${mm}`,
        count,
        isToday: i === 0,
      });
    }
    return result;
  }, [stats.auditByDay]);

  const maxAudit = Math.max(5, ...full7Days.map(item => item.count));
  const total7DayAudits = full7Days.reduce((sum, item) => sum + item.count, 0);

  const roleBreakdown = Object.entries(roleLabels).map(([role, label]) => ({ role, label, count: stats.usersByRole[role] || 0, color: roleColors[role] }));
  const roleSegments = roleBreakdown.reduce<string[]>((segments, item, index) => {
    const previous = roleBreakdown.slice(0, index).reduce((sum, role) => sum + role.count, 0);
    const start = stats.userCount ? previous / stats.userCount * 100 : 0;
    const end = stats.userCount ? (previous + item.count) / stats.userCount * 100 : 0;
    return [...segments, `${item.color} ${start}% ${end}%`];
  }, []);

  return (
    <div className="adm-dashboard-view adm-dashboard-refined">
      <div className="adm-page-header">
        <div>
          <span className="adm-dashboard-eyebrow">Xin chào, {adminName || 'Quản trị viên'}</span>
          <h1 className="adm-page-title">Tổng quan Quản trị Hệ thống</h1>
          <p className="adm-page-subtitle">Theo dõi vận hành, tài khoản và hoạt động tại Đường Sách TP.HCM.</p>
        </div>
        <div className="adm-page-header-actions">
          <button className="adm-btn adm-btn-secondary" onClick={() => onNavigateTab('users')}><Users size={16} /><span>Danh sách người dùng</span></button>
          <button className="adm-btn adm-btn-primary" onClick={onOpenAddUser}><UserPlus size={16} /><span>Thêm tài khoản</span></button>
        </div>
      </div>

      <div className="adm-kpi-grid adm-kpi-grid-refined">
        {[
          { label: 'Tổng tài khoản', value: stats.userCount, note: `${lockedUsersCount} tài khoản đang khóa`, icon: <Users size={20} />, cls: 'icon-emerald' },
          { label: 'Sự kiện nền tảng', value: stats.eventCount, note: `${stats.openEventCount} sự kiện đang công bố hoặc diễn ra`, icon: <Calendar size={20} />, cls: 'icon-blue' },
          { label: 'Gian hàng', value: stats.boothCount, note: 'Gian hàng đang có trong hệ thống', icon: <Store size={20} />, cls: 'icon-amber' },
          { label: 'Hoạt động hôm nay', value: stats.todayActivityCount, note: `${stats.activityCount} hoạt động đã ghi nhận`, icon: <Clock3 size={20} />, cls: 'icon-purple' },
        ].map(card => (
          <div className="adm-kpi-card" key={card.label}>
            <div className="adm-kpi-top"><span className="adm-kpi-label">{card.label}</span><div className={`adm-kpi-icon-wrap ${card.cls}`}>{card.icon}</div></div>
            <div className="adm-kpi-value">{card.value.toLocaleString('vi-VN')}</div>
            <div className="adm-kpi-trend trend-neutral"><span>{card.note}</span></div>
          </div>
        ))}
      </div>

      <div className="adm-charts-grid">
        <div className="adm-card adm-chart-card adm-audit-card">
          <div className="adm-card-header">
            <div>
              <h3 className="adm-card-title">Thao tác quản trị 7 ngày qua</h3>
              <p className="adm-card-subtitle">Nhịp độ xử lý và điều hành hệ thống</p>
            </div>
            <span className="adm-total-chip">{total7DayAudits} thao tác</span>
          </div>

          <div className="adm-audit-chart-wrapper">
            <div className="adm-audit-chart">
              {full7Days.map(item => {
                const heightPercent = item.count > 0 ? Math.max(12, Math.round((item.count / maxAudit) * 100)) : 4;
                return (
                  <div
                    className={`adm-audit-column ${item.isToday ? 'is-today' : ''} ${item.count === 0 ? 'is-zero' : ''}`}
                    key={item.date}
                    title={`${item.label}: ${item.count} thao tác`}
                  >
                    <span className="adm-audit-col-count">{item.count}</span>
                    <div className="adm-audit-bar-track">
                      <div
                        className="adm-audit-bar"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {item.count > 0 && <span className="adm-bar-glow" />}
                      </div>
                    </div>
                    <div className="adm-audit-col-date">
                      <span>{item.label}</span>
                      {item.isToday && <small className="adm-today-dot" title="Hôm nay" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="adm-card adm-donut-card adm-role-card">
          <div className="adm-card-header"><div><h3 className="adm-card-title">Cơ cấu tài khoản</h3><p className="adm-card-subtitle">Quản trị viên và đối tác/gian hàng</p></div></div>
          <div className="adm-role-overview">
            <div className="adm-role-donut" style={{ background: `conic-gradient(${roleSegments.join(', ')})` }}><div><strong>{stats.userCount.toLocaleString('vi-VN')}</strong><span>người dùng</span></div></div>
            <div className="adm-role-legend">
              {roleBreakdown.map(item => {
                const percent = stats.userCount ? Math.round(item.count / stats.userCount * 100) : 0;
                return <div className="adm-role-legend-item" key={item.role}><div className="adm-role-label"><i style={{ background: item.color }} /><span>{item.label}</span><strong>{percent}%</strong></div><div className="adm-role-progress"><span style={{ width: `${percent}%`, background: item.color }} /></div><small>{item.count.toLocaleString('vi-VN')} tài khoản</small></div>;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="adm-bottom-grid">
        <div className="adm-card adm-activity-card-refined">
          <div className="adm-card-header"><div><h3 className="adm-card-title">Hoạt động quản trị gần đây</h3><p className="adm-card-subtitle">Các thay đổi gần nhất</p></div><button className="adm-card-link" onClick={() => onNavigateTab('audit')}><span>Xem nhật ký</span><ArrowRight size={15} /></button></div>
          <div className="adm-activity-list">
            {auditLogs.slice(0, 5).map(log => <div className="adm-activity-item" key={log.id}><div className="adm-activity-icon">{getActivityIcon(log.actionLabelVi)}</div><div className="adm-activity-content"><strong>{log.actionLabelVi}</strong><p>{log.actorName} · {log.targetObject}</p></div><span className="adm-activity-time"><Clock3 size={13} />{log.timestamp}</span></div>)}
            {!auditLogs.length && <p className="adm-card-subtitle">Chưa có thao tác quản trị.</p>}
          </div>
        </div>
        <div className="adm-card adm-account-status-refined">
          <div className="adm-card-header"><div><h3 className="adm-card-title">Trạng thái tài khoản</h3><p className="adm-card-subtitle">Các tài khoản cần quản trị viên xem xét</p></div></div>
          <div className="adm-account-status-body adm-status-highlight"><div className="adm-status-icon"><LockKeyhole size={22} /></div><div><strong>{lockedUsersCount} tài khoản đang khóa</strong><p className="adm-card-subtitle">{pendingUsersCount} tài khoản chờ xác minh</p></div></div>
          <div className="adm-status-footer"><CheckCircle2 size={16} /><span>Các yêu cầu khác đã được xử lý.</span></div>
          <button className="adm-btn adm-btn-secondary" onClick={() => onNavigateTab('users')}>Mở quản lý tài khoản <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};
