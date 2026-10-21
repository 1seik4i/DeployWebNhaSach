import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { OrganizationExperience } from '../../../src/pages/OrganizationExperience';
import { JourneyExperience } from '../../../src/pages/JourneyExperience';
import { DigitalLibrarySection } from '../../../src/components/library/DigitalLibrarySection';
import { PartnerBookSalesPage } from '../../../src/pages/partner/PartnerBookSalesPage';
import { DatePicker } from '../../../src/components/ui/DatePicker';
import { SafeImage } from '../../../src/components/ui/SafeImage';
import '../../../src/index.css';
const mode = new URLSearchParams(location.search).get('mode');
createRoot(document.getElementById('root')!).render(<BrowserRouter>
  {mode === 'dates' ? <DatePicker label="Ngày bắt đầu" value="" onChange={() => {}} language="vi" min="2026-10-21" /> : mode === 'organization' ? <OrganizationExperience open language="en" /> :
   mode === 'journey' ? <JourneyExperience open language="en" /> :
   mode === 'books' ? <PartnerBookSalesPage language="vi" /> :
   mode === 'image' ? <SafeImage src="/missing-tc-image.jpg" alt="Test image" /> :
   <DigitalLibrarySection language="en" />}
</BrowserRouter>);
