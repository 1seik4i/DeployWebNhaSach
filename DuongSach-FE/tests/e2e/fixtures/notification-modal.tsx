import { createRoot } from 'react-dom/client';
import { NotificationModal } from '../../../src/components/ui/NotificationModal';
import { confirmModal, notifyModal, promptModal } from '../../../src/services/notificationModal';
import { useState } from 'react';
import { EntityQrButton } from '../../../src/components/ui/EntityQrButton';
function Harness() {
  const [result, setResult] = useState('');
  return <><button onClick={async () => setResult(String(await confirmModal('Xóa bài viết này?')))}>Delete</button>
    <button onClick={async () => setResult(String(await promptModal('Nhập lý do:', 'Nội dung cũ')))}>Input</button>
    <button onClick={() => { void notifyModal('Thông báo thứ nhất'); void notifyModal('Thông báo thứ hai'); }}>Notices</button>
    <EntityQrButton kind="books" id="test-book" name="Sách kiểm thử" admin />
    <EntityQrButton kind="booths" id="test-booth" name="Gian hàng công khai" />
    <output>{result}</output><NotificationModal /></>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
