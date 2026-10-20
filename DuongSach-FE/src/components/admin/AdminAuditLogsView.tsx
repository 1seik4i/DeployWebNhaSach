import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  X,
  Eye,
  Calendar,
  Layers,
  Activity,
  MapPin,
  Store,
  Users,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  Tag
} from 'lucide-react';
import { AdminAuditLogItem } from '../../types/admin';
import { ListPagination } from '../ui/ListPagination';
import { vietnamDateKey, matchesSearch } from '../../utils/inputValidation';

interface AdminAuditLogsViewProps {
  logs: AdminAuditLogItem[];
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  useModalBehavior(Boolean(selectedLog), () => setSelectedLog(null));
  const [copiedId, setCopiedId] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterTimeRange]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = logs.length;
    const now = new Date();
    const todayStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    let todayCount = 0;
    let dataUpdateCount = 0;
    let securityCount = 0;

    logs.forEach(l => {
      if (l.createdAt ? vietnamDateKey(l.createdAt) === vietnamDateKey() : l.timestamp.includes(todayStr) || l.timestamp.includes('Hôm nay')) {
        todayCount++;
      }
      const act = (l.actionLabelVi || l.actionType || '').toLowerCase();
      const target = (l.targetObject || '').toLowerCase();
      if (act.includes('update') || act.includes('cập nhật') || act.includes('create') || act.includes('tạo') || target.includes('map') || target.includes('booth')) {
        dataUpdateCount++;
      }
      if (act.includes('lock') || act.includes('khóa') || act.includes('permission') || act.includes('auth') || act.includes('role')) {
        securityCount++;
      }
    });

    return { total, todayCount, dataUpdateCount, securityCount };
  }, [logs]);

  // Bộ lọc dữ liệu
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const matchQuery = matchesSearch(searchTerm, item.actorName, item.actorEmail, item.targetObject, item.details, item.actionLabelVi, item.ipAddress);

      let matchCategory = true;
      const target = item.targetObject.toLowerCase();
      const act = (item.actionType || item.actionLabelVi).toLowerCase();

      if (filterCategory === 'map_space') {
        matchCategory = target.includes('map') || target.includes('location') || act.includes('bản đồ') || act.includes('vị trí');
      } else if (filterCategory === 'booth') {
        matchCategory = target.includes('booth') || act.includes('gian hàng');
      } else if (filterCategory === 'account') {
        matchCategory = target.includes('user') || target.includes('account') || act.includes('tài khoản') || act.includes('khóa');
      } else if (filterCategory === 'event_activity') {
        matchCategory = target.includes('event') || target.includes('activity') || act.includes('sự kiện') || act.includes('hoạt động');
      } else if (filterCategory === 'security') {
        matchCategory = act.includes('lock') || act.includes('permission') || act.includes('role') || act.includes('auth') || act.includes('quyền');
      }

      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      let matchTime = true;
      if (filterTimeRange === 'today') {
        const now = new Date();
        const todayStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        matchTime = item.createdAt ? vietnamDateKey(item.createdAt) === vietnamDateKey() : item.timestamp.includes(todayStr) || item.timestamp.includes('Hôm nay');
      }

      return matchQuery && matchCategory && matchStatus && matchTime;
    });
  }, [logs, searchTerm, filterCategory, filterStatus, filterTimeRange]);

  // Phân trang
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (Math.min(currentPage, totalPages) - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize, totalPages]);

  const handleExportCSV = () => {
    const headers = ['Mã log', 'Thời gian', 'Người thực hiện', 'Email', 'Vai trò', 'Hành động', 'Đối tượng', 'Chi tiết thay đổi', 'Trạng thái', 'IP'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorEmail || ''}"`,
      `"${l.actorRole}"`,
      `"${l.actionLabelVi}"`,
      `"${l.targetObject}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.ipAddress}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nhat_ky_Quan_tri_Duong_Sach_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionIcon = (action: string, target: string) => {
    const act = (action || '').toLowerCase();
    const tgt = (target || '').toLowerCase();
    if (tgt.includes('map') || act.includes('map') || act.includes('vị trí')) return <MapPin size={15} />;
    if (tgt.includes('booth') || act.includes('gian hàng')) return <Store size={15} />;
    if (tgt.includes('user') || act.includes('tài khoản')) return <Users size={15} />;
    if (tgt.includes('event') || act.includes('sự kiện')) return <Calendar size={15} />;
    if (act.includes('lock') || act.includes('khóa') || act.includes('permission')) return <Shield size={15} />;
    return <Activity size={15} />;
  };

  const getActionBadgeClass = (action: string, target: string) => {
    const act = (action || '').toLowerCase();
    const tgt = (target || '').toLowerCase();
    if (tgt.includes('map') || act.includes('map') || act.includes('vị trí')) return 'badge-map';
    if (tgt.includes('booth') || act.includes('gian hàng')) return 'badge-booth';
    if (tgt.includes('user') || act.includes('tài khoản')) return 'badge-user';
    if (tgt.includes('event') || act.includes('sự kiện')) return 'badge-event';
    if (act.includes('lock') || act.includes('khóa')) return 'badge-danger';
    return 'badge-neutral';
  };

  const formatDetailSummary = (rawDetails: string) => {
    if (!rawDetails || !rawDetails.trim()) return '—';
    try {
      if (rawDetails.startsWith('{') || rawDetails.startsWith('[')) {
        const parsed = JSON.parse(rawDetails);
        if (parsed.pointCount !== undefined || parsed.updatedCount !== undefined) {
          return `Cập nhật tọa độ ${parsed.updatedCount || parsed.pointCount} điểm bản đồ`;
        }
        if (parsed.x !== undefined && parsed.y !== undefined) {
          return `Tọa độ bản đồ mới: X=${parsed.x}%, Y=${parsed.y}%`;
        }
        if (parsed.status !== undefined) {
          return `Thay đổi trạng thái: ${parsed.status}${parsed.reason ? ' (' + parsed.reason + ')' : ''}`;
        }
        if (parsed.title) {
          return `Sự kiện: "${parsed.title}"`;
        }
        if (parsed.boothName || parsed.boothCode) {
          return `Gian hàng: ${parsed.boothName || parsed.boothCode}`;
        }
        if (parsed.action) {
          return `${parsed.action}`;
        }
        const entries = Object.entries(parsed).slice(0, 3);
        if (entries.length === 0) return '—';
        return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? '...' : String(v)}`).join(' • ');
      }
    } catch {
      // Fallback to plain string
    }
    return rawDetails || '—';
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="adm-audit-view adm-audit-view-pro">
      {/* 1. Header with Stats Bar */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Nhật ký Hoạt động</h1>
          <p className="adm-page-subtitle">
            Giám sát toàn diện mọi thao tác thay đổi vị trí bản đồ, cập nhật gian hàng, phân quyền và điều hành hệ thống.
          </p>
        </div>
        <div className="adm-page-header-actions">
          <button className="adm-btn adm-btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Xuất báo cáo CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Insight Metrics */}
      <div className="adm-audit-kpi-grid">
        <div className="adm-audit-kpi-card">
          <div className="kpi-icon-box icon-emerald">
            <Activity size={18} />
          </div>
          <div>
            <span className="kpi-label">Tổng lượt thao tác</span>
            <strong className="kpi-value">{stats.total.toLocaleString('vi-VN')}</strong>
          </div>
        </div>

        <div className="adm-audit-kpi-card">
          <div className="kpi-icon-box icon-blue">
            <Calendar size={18} />
          </div>
          <div>
            <span className="kpi-label">Hôm nay</span>
            <strong className="kpi-value">{stats.todayCount.toLocaleString('vi-VN')}</strong>
          </div>
        </div>

        <div className="adm-audit-kpi-card">
          <div className="kpi-icon-box icon-amber">
            <Layers size={18} />
          </div>
          <div>
            <span className="kpi-label">Cập nhật dữ liệu & Bản đồ</span>
            <strong className="kpi-value">{stats.dataUpdateCount.toLocaleString('vi-VN')}</strong>
          </div>
        </div>

        <div className="adm-audit-kpi-card">
          <div className="kpi-icon-box icon-purple">
            <Shield size={18} />
          </div>
          <div>
            <span className="kpi-label">Bảo mật & Phân quyền</span>
            <strong className="kpi-value">{stats.securityCount.toLocaleString('vi-VN')}</strong>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="adm-card adm-filter-card adm-audit-filter-card">
        <div className="adm-filter-bar">
          <div className="adm-search-input-wrap">
            <Search size={15} className="adm-search-icon" />
            <input maxLength={200}
              type="text"
              placeholder="Tìm theo người thực hiện, đối tượng, chi tiết hoặc IP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="adm-filter-search"
            />
            {searchTerm && (
              <button 
                type="button"
                className="adm-search-clear"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="adm-select-wrap">
            <Filter size={14} />
            <select 
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="adm-filter-select"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="map_space">Bản đồ & Không gian</option>
              <option value="booth">Gian hàng</option>
              <option value="account">Tài khoản</option>
              <option value="event_activity">Sự kiện & Hoạt động</option>
              <option value="security">Bảo mật & Quyền</option>
            </select>
          </div>

          <div className="adm-select-wrap">
            <Calendar size={14} />
            <select 
              value={filterTimeRange}
              onChange={(e) => { setFilterTimeRange(e.target.value); setCurrentPage(1); }}
              className="adm-filter-select"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
            </select>
          </div>

          <div className="adm-select-wrap">
            <Shield size={14} />
            <select 
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="adm-filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="warning">Cảnh báo</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Card */}
      <div className="adm-card adm-table-card adm-audit-table-card">
        <div className="adm-table-summary-bar">
          <div className="summary-left">
            <span>Hiển thị <strong>{paginatedLogs.length}</strong> / <strong>{filteredLogs.length}</strong> bản ghi nhật ký</span>
          </div>
          <div className="summary-right">
            <label>Hiển thị:</label>
            <select 
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="adm-pagesize-select"
            >
              <option value={10}>10 bản ghi</option>
              <option value={20}>20 bản ghi</option>
              <option value={50}>50 bản ghi</option>
            </select>
          </div>
        </div>

        <div className="adm-table-responsive adm-audit-desktop-table" tabIndex={0} role="region" aria-label="Bảng nhật ký hệ thống">
          <table className="adm-table adm-audit-table">
            <thead>
              <tr>
                <th style={{ width: '155px', minWidth: '150px' }}>THỜI GIAN</th>
                <th style={{ width: '190px', minWidth: '180px' }}>NGƯỜI THỰC HIỆN</th>
                <th style={{ width: '130px', minWidth: '120px' }}>HÀNH ĐỘNG</th>
                <th style={{ width: '130px', minWidth: '120px' }}>ĐỐI TƯỢNG</th>
                <th style={{ minWidth: '160px' }}>CHI TIẾT THAO TÁC</th>
                <th style={{ width: '130px', minWidth: '120px' }}>TRẠNG THÁI & IP</th>
                <th style={{ width: '60px', minWidth: '55px', textAlign: 'center' }}>XEM</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="adm-table-empty">
                    <Clock size={36} style={{ color: '#9CA3AF', marginBottom: '0.5rem' }} />
                    <p style={{ fontWeight: 600, color: '#374151' }}>Không tìm thấy bản ghi nhật ký nào</p>
                    <small style={{ color: '#6B7280' }}>Thử thay đổi từ khóa hoặc bộ lọc phân loại</small>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const badgeClass = getActionBadgeClass(log.actionLabelVi, log.targetObject);
                  const icon = getActionIcon(log.actionLabelVi, log.targetObject);
                  const initials = (log.actorName || 'AD').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(-2).toUpperCase();

                  return (
                    <tr 
                      key={log.id}
                      className={selectedLog?.id === log.id ? 'is-selected-row' : ''}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td>
                        <div className="adm-time-cell">
                          <Clock size={13} style={{ color: '#059669', flexShrink: 0 }} />
                          <span className="time-primary">{log.timestamp}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td>
                        <div className="adm-log-actor-cell">
                          <span className="actor-avatar-circle">{initials}</span>
                          <div className="actor-info-box">
                            <span className="actor-name">{log.actorName || 'Quản trị viên'}</span>
                            <span className="actor-email">{log.actorEmail || (log.actorRole === 'admin' ? 'Quản trị hệ thống' : 'Đối tác')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={`adm-action-pill ${badgeClass}`}>
                          {icon}
                          <span>{log.actionLabelVi || log.actionType}</span>
                        </span>
                      </td>

                      {/* Target Object */}
                      <td>
                        <div className="adm-target-cell">
                          <Tag size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <span className="target-name">{log.targetObject}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td>
                        <div className="adm-log-details-preview" title={log.details}>
                          {formatDetailSummary(log.details)}
                        </div>
                      </td>

                      {/* Status & IP */}
                      <td>
                        <div className="adm-log-status-col">
                          <span className="adm-badge-status badge-status-active">
                            <CheckCircle size={11} />
                            <span>Thành công</span>
                          </span>
                          <span className="adm-ip-text">
                            <Globe size={11} />
                            <span>{log.ipAddress || '127.0.0.1'}</span>
                          </span>
                        </div>
                      </td>

                      {/* View Button */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-view-log"
                          title="Xem chi tiết nhật ký"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="adm-audit-mobile-cards">
          {paginatedLogs.length === 0 ? (
            <div className="adm-table-empty" style={{ padding: '2rem 1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <Clock size={36} style={{ color: '#9CA3AF', marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, color: '#374151', margin: 0 }}>Không tìm thấy bản ghi nhật ký nào</p>
              <small style={{ color: '#6B7280' }}>Thử thay đổi từ khóa hoặc bộ lọc phân loại</small>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const badgeClass = getActionBadgeClass(log.actionLabelVi, log.targetObject);
              const icon = getActionIcon(log.actionLabelVi, log.targetObject);
              const initials = (log.actorName || 'AD').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(-2).toUpperCase();

              return (
                <div
                  key={log.id}
                  className={`adm-audit-mobile-card ${selectedLog?.id === log.id ? 'is-selected-row' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="adm-audit-card-top">
                    <div className="adm-time-cell">
                      <Clock size={12} style={{ color: '#059669', flexShrink: 0 }} />
                      <span className="time-primary" style={{ fontSize: '0.78rem' }}>{log.timestamp}</span>
                    </div>
                    <span className={`adm-action-pill ${badgeClass}`} style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                      {icon}
                      <span>{log.actionLabelVi || log.actionType}</span>
                    </span>
                  </div>

                  <div className="adm-audit-card-mid">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <Tag size={12} style={{ color: '#059669', flexShrink: 0 }} />
                      <span style={{ color: '#1B4D3E', fontWeight: 700, fontSize: '0.84rem' }}>{log.targetObject}</span>
                    </div>
                    <div style={{ color: '#374151', fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.4 }}>
                      {formatDetailSummary(log.details)}
                    </div>
                  </div>

                  <div className="adm-audit-card-bot">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <span className="actor-avatar-circle" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>{initials}</span>
                      <span style={{ fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {log.actorName || 'Quản trị viên'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-view-log"
                      title="Xem chi tiết"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      <Eye size={13} />
                      <span>Chi tiết</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls matching the rest of the system */}
        <div className="adm-audit-pagination-bar">
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
            vi={true}
          />
        </div>
      </div>

      {/* 5. Detail Slide-over Modal */}
      {selectedLog && (
        <div 
          className="adm-modal-backdrop" 
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="adm-modal-container adm-audit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="modal-icon-badge">
                  {getActionIcon(selectedLog.actionLabelVi, selectedLog.targetObject)}
                </div>
                <div>
                  <h3 className="adm-modal-title">Chi tiết Nhật ký Hoạt động</h3>
                  <p className="adm-modal-subtitle">Mã ghi nhận: {selectedLog.id}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="adm-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="adm-modal-body">
              <div className="audit-detail-summary-grid">
                <div className="detail-item">
                  <span className="detail-label">Người thực hiện:</span>
                  <div className="detail-value-strong">{selectedLog.actorName} ({selectedLog.actorRole})</div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Thời điểm ghi nhận:</span>
                  <div className="detail-value">{selectedLog.timestamp}</div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Hành động:</span>
                  <div>
                    <span className={`adm-action-pill ${getActionBadgeClass(selectedLog.actionLabelVi, selectedLog.targetObject)}`}>
                      {selectedLog.actionLabelVi || selectedLog.actionType}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Đối tượng tác động:</span>
                  <div className="detail-value-strong">{selectedLog.targetObject}</div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Địa chỉ IP:</span>
                  <div className="detail-value">{selectedLog.ipAddress || '127.0.0.1'}</div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Trạng thái:</span>
                  <div>
                    <span className="adm-badge-status badge-status-active">
                      <CheckCircle size={12} />
                      <span>Thành công</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON payload inspector */}
              <div className="audit-payload-section">
                <div className="payload-header">
                  <span>NỘI DUNG DỮ LIỆU CHI TIẾT (PAYLOAD)</span>
                  <button
                    type="button"
                    className="btn-copy-payload"
                    onClick={() => handleCopy(selectedLog.details)}
                  >
                    {copiedId ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                    <span>{copiedId ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                  </button>
                </div>
                <pre className="audit-json-viewer">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details || '(Không có dữ liệu payload)';
                    }
                  })()}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="adm-modal-footer">
              <button 
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
