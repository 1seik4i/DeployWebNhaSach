import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BoothMapView } from '../../../src/components/portal/BoothMapView';
import { NotificationModal } from '../../../src/components/ui/NotificationModal';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter><BoothMapView language="vi" /><NotificationModal /></BrowserRouter>,
);
