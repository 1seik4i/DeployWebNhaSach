import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { AdminUserManagementView } from '../../../src/components/admin/AdminUserManagementView';
import { PartnerProfilePage } from '../../../src/pages/partner/PartnerProfilePage';
import type { AdminUserAccount } from '../../../src/types/admin';
import type { PartnerOrganization } from '../../../src/types';
import '../../../src/components/admin/AdminPortal.css';

const email = `partner-${'x'.repeat(50)}@example.test`;
const user: AdminUserAccount = { id: 'user', code: 'PARTNER', fullName: 'Test Partner', email, phone: '0912345678', role: 'partner', roleLabelVi: 'Partner', status: 'active', statusLabelVi: 'Active', lastActive: '', createdDate: '', avatarInitials: 'TP' };
const organization = { id: 'organization', name: 'Test Publisher', email, phone: '0912345678', representativeName: 'Test Partner', categories: [], isVerified: true } as PartnerOrganization;
function Harness() {
  const [updated, setUpdated] = useState<unknown>(null);
  const partner = new URLSearchParams(window.location.search).has('partner');
  const users = new URLSearchParams(window.location.search).has('many')
    ? Array.from({ length: 25 }, (_, index) => ({ ...user, id: `user-${index}`, fullName: `Account ${index + 1}`, code: `PARTNER-${index}` }))
    : [user];
  return <>
    {partner ? <PartnerProfilePage language="en" organization={organization} onUpdateOrg={data => { setUpdated(data); }} />
      : <AdminUserManagementView language="vi" users={users} onAddUser={() => {}} onUpdateUser={(_id, data) => { setUpdated(data); }} onToggleLock={() => {}} onResetPassword={() => {}} />}
    <output>{JSON.stringify(updated)}</output>
  </>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
