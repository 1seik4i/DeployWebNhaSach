import type { ComponentType, ReactNode } from 'react';
import { BellIcon, CreditCardIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface SettingsSidebarLink {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface SettingsSidebarSection {
  icon: ComponentType<{ className?: string; size?: number }>;
  label: string;
  links: SettingsSidebarLink[];
  value: string;
}

interface SettingsSidebarAccordionProps {
  sections?: SettingsSidebarSection[];
  activeId?: string;
  defaultValue?: string[];
  onSelect?: (id: string) => void;
  className?: string;
}

const defaultSections: SettingsSidebarSection[] = [
  { icon: UserIcon, label: 'Account', links: ['Profile', 'Display Name', 'Email Address', 'Language & Region'].map(label => ({ id: label, label })), value: 'account' },
  { icon: ShieldIcon, label: 'Security', links: ['Password', 'Two-Factor Auth', 'Active Sessions', 'Login History'].map(label => ({ id: label, label })), value: 'security' },
  { icon: BellIcon, label: 'Notifications', links: ['Email Alerts', 'Push Notifications', 'Digest Frequency', 'Do Not Disturb'].map(label => ({ id: label, label })), value: 'notifications' },
  { icon: CreditCardIcon, label: 'Billing', links: ['Subscription Plan', 'Payment Methods', 'Invoices', 'Usage & Limits'].map(label => ({ id: label, label })), value: 'billing' },
];

export function Pattern({ sections = defaultSections, activeId, defaultValue, onSelect, className }: SettingsSidebarAccordionProps) {
  const initialOpen = defaultValue ?? sections.filter(section => section.links.some(link => link.id === activeId)).map(section => section.value);

  return (
    <div className={cn('w-full', className)}>
      <Accordion defaultValue={initialOpen.length ? initialOpen : [sections[0]?.value]} type="multiple">
        {sections.map(({ icon: Icon, label, value, links }) => (
          <AccordionItem className="border-none" key={value} value={value}>
            <AccordionTrigger className="group relative min-h-10 overflow-hidden rounded-lg border border-transparent px-2 py-2 text-[#a9bbb3] transition-all duration-200 ease-out hover:translate-x-0.5 hover:border-white/10 hover:bg-white/[0.07] hover:text-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:no-underline focus-visible:ring-[#e9bc63]/70 data-[state=open]:border-[#e9bc63]/15 data-[state=open]:bg-[#e9bc63]/[0.06] data-[state=open]:text-[#e9bc63] motion-reduce:transform-none motion-reduce:transition-none">
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-current transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" />
                <span className="truncate text-sm font-semibold">{label}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <ul className="ml-6 flex flex-col gap-0.5 border-l border-white/15 pl-3">
                  {links.map(link => {
                    const active = link.id === activeId;
                    return (
                      <li key={link.id}>
                        <button
                          type="button"
                          className={cn(
                            'group relative flex min-h-9 w-full items-center justify-between gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9bc63]/70 motion-reduce:transform-none motion-reduce:transition-none',
                            active 
                              ? 'border-[#e9bc63]/25 bg-[#e9bc63]/15 text-white shadow-[inset_0_1px_0_rgba(233,188,99,0.12),0_4px_12px_rgba(0,0,0,0.14)]' 
                              : 'border-transparent text-[#9fb1a9] hover:translate-x-0.5 hover:border-white/10 hover:bg-white/[0.07] hover:text-white',
                          )}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => onSelect?.(link.id)}
                        >
                          {active ? (
                            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-[#e9bc63] shadow-[0_0_8px_rgba(233,188,99,0.55)]" aria-hidden="true" />
                          ) : null}
                          <span className="min-w-0 flex-1 truncate">{link.label}</span>
                          {link.badge && link.badge > 0 ? (
                            <span className="rounded-full bg-[#c84c32] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(200,76,50,0.3)] transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
                              {link.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export { Pattern as SettingsSidebarAccordion };
export default Pattern;
