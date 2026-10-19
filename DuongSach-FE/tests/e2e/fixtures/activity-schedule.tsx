import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { EventRegistrationModal } from '../../../src/components/portal/EventRegistrationModal';
import type { EventRegistrationData } from '../../../src/components/portal/EventRegistrationModal';
import type { PartnerOrganization } from '../../../src/types';

const partner = new URLSearchParams(window.location.search).has('partner');
const organization = {
  id: 'organization', name: 'Test Publisher', representativeName: 'Test Representative',
  email: 'partner@example.test', phone: '0912345678',
} as PartnerOrganization;

function Harness() {
  const [created, setCreated] = useState<EventRegistrationData[]>([]);
  return <>
    <EventRegistrationModal language="en" isOpen onClose={() => {}}
      initialDate={partner ? '2030-10-20' : undefined}
      organization={partner ? organization : undefined}
      assets={[{ id: 'microphone', name: 'Microphone', totalQuantity: 2 }]}
      locations={[{ id: 'location', name: 'Main stage', capacity: 50 }]}
      onRegister={activity => { setCreated(previous => [...previous, activity]); }} />
    <output>{JSON.stringify(created)}</output>
  </>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
