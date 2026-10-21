import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { vietnamDateKey } from '../../utils/inputValidation';
import { activityDateKey } from '../../utils/activityDate';
import type { Language } from '../../types';
import './DatePicker.css';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  language: Language;
  min?: string;
  align?: 'left' | 'right';
}

export function DatePicker({ label, value, onChange, language, min, align = 'left' }: DatePickerProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [today, setToday] = useState(() => vietnamDateKey());
  useEffect(() => {
    const refresh = () => setToday(vietnamDateKey());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const effectiveMin = min && min < today ? today : min;
  const selected = activityDateKey(value);
  const vi = language === 'vi';

  useEffect(() => {
    if (!open) return;
    const date = selected || effectiveMin;
    if (date) setMonth(new Date(`${date}T12:00:00Z`));
  }, [open, selected, effectiveMin]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const years = Array.from({ length: 101 }, (_, index) => year - 50 + index);
  const toggle = () => setOpen(previous => !previous);

  return <div ref={root} className="date-picker" onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); }
  }}>
    <div className="date-picker-input-wrap">
      <input type="text" aria-label={label} placeholder="dd/mm/yyyy" inputMode="numeric" maxLength={10}
        value={value} onChange={event => onChange(event.target.value)} onClick={() => setOpen(true)}
        onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}
        aria-controls={open ? id : undefined} aria-expanded={open} required />
      <button type="button" className="date-picker-toggle" aria-label={`${vi ? 'Chọn' : 'Choose'} ${label.toLowerCase()}`}
        aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}><Calendar size={17} /></button>
    </div>
    {open && <div id={id} className={`date-picker-calendar align-${align}`} role="group" aria-label={`${vi ? 'Lịch chọn' : 'Calendar for'} ${label.toLowerCase()}`}>
      <div className="date-picker-heading">
        <button type="button" aria-label={vi ? 'Tháng trước' : 'Previous month'} onClick={() => setMonth(new Date(Date.UTC(year, monthIndex - 1, 1)))}><ChevronLeft size={17} /></button>
        <select aria-label={vi ? 'Tháng' : 'Month'} value={monthIndex} onChange={event => setMonth(new Date(Date.UTC(year, Number(event.target.value), 1)))}>
          {Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{vi ? `Tháng ${index + 1}` : new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, index, 1)))}</option>)}
        </select>
        <select aria-label={vi ? 'Năm' : 'Year'} value={year} onChange={event => setMonth(new Date(Date.UTC(Number(event.target.value), monthIndex, 1)))}>
          {years.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" aria-label={vi ? 'Tháng sau' : 'Next month'} onClick={() => setMonth(new Date(Date.UTC(year, monthIndex + 1, 1)))}><ChevronRight size={17} /></button>
      </div>
      <div className="date-picker-days">
        {(vi ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map(day => <span key={day} className="date-picker-weekday">{day}</span>)}
        {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const day = String(index + 1).padStart(2, '0');
          const monthText = String(monthIndex + 1).padStart(2, '0');
          const key = `${year}-${monthText}-${day}`;
          const text = `${day}/${monthText}/${year}`;
          return <button type="button" key={key} aria-label={text} aria-pressed={selected === key} disabled={Boolean(effectiveMin && key < effectiveMin)} onClick={() => { onChange(text); setOpen(false); }}>{index + 1}</button>;
        })}
      </div>
    </div>}
  </div>;
}
