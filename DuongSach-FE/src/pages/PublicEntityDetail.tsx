import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { EntityQrButton, type QrEntity } from '../components/ui/EntityQrButton';
import './PublicEntityDetail.css';
interface Detail { id: string; name?: string; title?: string; description?: string; author?: string; publisher?: string; code?: string; campus?: string; facility?: string; zone?: string; capacity?: number; openHours?: string; imageUrl?: string; coverUrl?: string; }
export function PublicEntityDetail() {
  const [, , type, rawId] = window.location.pathname.split('/');
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError('');
    if (!['booths', 'venues', 'locations', 'books'].includes(type) || !rawId) { setError('Đường dẫn không hợp lệ.'); return; }
    apiClient.get<Detail>(`/public/${type}/${rawId}`).then(result => { if (active) setData(result); }).catch(() => { if (active) setError('Không tìm thấy thông tin hoặc dữ liệu hiện không khả dụng.'); });
    return () => { active = false; };
  }, [type, rawId, retry]);
  return <main className="public-entity-detail"><a href="/">← Trang chủ Đường Sách</a>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Thử lại</button></div> : !data ? <p role="status">Đang tải thông tin…</p> : <article>
      <h1>{data.title || data.name}</h1>
      {(data.coverUrl || data.imageUrl) && <img src={data.coverUrl || data.imageUrl} alt={data.title || data.name} />}
      <p className="public-entity-description">{data.description || 'Chưa có mô tả.'}</p>
      <dl>{[['Mã', data.code], ['Tác giả', data.author], ['Nhà xuất bản', data.publisher], ['Cơ sở', data.campus || data.facility], ['Khu vực', data.zone], ['Sức chứa', data.capacity], ['Giờ mở cửa', data.openHours]].filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <EntityQrButton kind={type as QrEntity} id={data.id} name={data.title || data.name || 'Thông tin'} />
    </article>}
  </main>;
}
