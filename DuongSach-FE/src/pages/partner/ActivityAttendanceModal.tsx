import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState } from 'react';
import { 
  QrCode, 
  X, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Language, PartnerActivityProposal, AttendanceScanRecord } from '../../types';
import './PartnerPages.css';

interface ActivityAttendanceModalProps {
  language: Language;
  activity: PartnerActivityProposal;
  scans: AttendanceScanRecord[];
  onClose: () => void;
  onRecordScan: (record: Omit<AttendanceScanRecord, 'id'>) => void;
  onScanQr: (qrToken: string) => Promise<Omit<AttendanceScanRecord, 'id'>>;
}

export const ActivityAttendanceModal: React.FC<ActivityAttendanceModalProps> = ({
  language,
  activity,
  scans,
  onClose,
  onRecordScan,
  onScanQr,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [lastScanResult, setLastScanResult] = useState<AttendanceScanRecord | null>(null);

  useModalBehavior(true, onClose);

  const activityScans = scans.filter(s => s.activityId === activity.id);
  const successfulScans = activityScans.filter(s => s.status === 'success');

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    try {
      const record = await onScanQr(manualCode.trim());
      const result = { ...record, id: crypto.randomUUID() };
      setLastScanResult(result);
      onRecordScan(record);
    } catch (error) {
      const invalidRecord: AttendanceScanRecord = {
        id: crypto.randomUUID(), activityId: activity.id, activityTitle: activity.title,
        participantName: 'Không xác định', ticketCode: manualCode.trim(), scanTime: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), status: 'invalid',
      };
      setLastScanResult(invalidRecord);
    }
    setManualCode('');
  };


  return (
    <div className="attendance-modal-overlay" onClick={onClose}>
      <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header matching Sketch Screen 10 */}
        <div className="attendance-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#172421', fontFamily: 'var(--font-serif)' }}>
              {language === 'vi' ? 'Điểm danh hoạt động' : 'Activity Attendance Check-in'}
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#637771', marginTop: '0.2rem' }}>
              <strong>{activity.title}</strong> • {activity.eventName}
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#637771' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="attendance-modal-body">
          {/* Progress / Check-in Counter */}
          <div style={{
            background: '#FAF8F3',
            border: '1px solid #EAE2D1',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#637771', fontWeight: 600 }}>
                {language === 'vi' ? 'Số lượng đã check-in:' : 'Check-in Progress:'}
              </span>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 800, color: '#172421' }}>
                {successfulScans.length} {language === 'vi' ? 'người' : 'attendees'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#637771' }}>{language === 'vi' ? 'Người tham dự' : 'Attendance'}</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                Không giới hạn
              </div>
            </div>
          </div>

          {/* Result Alert Box */}
          {lastScanResult && (
            <div className={`scan-result-card ${lastScanResult.status}`}>
              {lastScanResult.status === 'success' && <CheckCircle2 size={24} color="#059669" />}
              {lastScanResult.status === 'already_scanned' && <AlertCircle size={24} color="#D97706" />}
              {lastScanResult.status === 'invalid' && <AlertCircle size={24} color="#DC2626" />}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 750 }}>
                  {lastScanResult.status === 'success' && (language === 'vi' ? '✓ Check-in thành công!' : 'Check-in Verified!')}
                  {lastScanResult.status === 'already_scanned' && (language === 'vi' ? '⚠️ Vé này đã được quét trước đó!' : 'Already Scanned!')}
                  {lastScanResult.status === 'invalid' && (language === 'vi' ? '✕ Vé không hợp lệ hoặc sai hoạt động!' : 'Invalid Ticket!')}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  <strong>{lastScanResult.participantName}</strong> • Mã: {lastScanResult.ticketCode} • Lúc: {lastScanResult.scanTime}
                </div>
              </div>
            </div>
          )}

          {/* Manual Input Entry */}
          <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <input maxLength={2000}
              type="text"
              required
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={language === 'vi' ? 'Nhập mã vé thủ công (Ví dụ: DS-ATV-9821)...' : 'Enter ticket code manually...'}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                border: '1px solid #D5DFDC',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontFamily: 'inherit'
              }}
            />
            <button type="submit" className="btn-part-primary">
              <QrCode size={16} />
              <span>{language === 'vi' ? 'Xác nhận' : 'Verify'}</span>
            </button>
          </form>

          {/* Recent Scans History Feed */}
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#172421', marginBottom: '0.65rem' }}>
              {language === 'vi' ? 'Lịch sử quét vé gần đây' : 'Recent Scan History'}
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #E5ECE8', borderRadius: '8px' }}>
              {activityScans.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#8C9F9A' }}>
                  {language === 'vi' ? 'Chưa có lượt quét vé nào.' : 'No scans recorded yet.'}
                </div>
              ) : (
                activityScans.slice(0, 10).map((scn) => (
                  <div 
                    key={scn.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      borderBottom: '1px solid #EEF2F0',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>
                      <strong>{scn.participantName}</strong>
                      <span style={{ color: '#637771', marginLeft: '0.5rem' }}>#{scn.ticketCode}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ color: '#8C9F9A' }}>{scn.scanTime}</span>
                      <span className={`status-badge ${scn.status}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        {scn.status === 'success' ? 'Hợp lệ' : scn.status === 'already_scanned' ? 'Đã quét' : 'Lỗi'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

