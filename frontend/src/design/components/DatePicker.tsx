import React, { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Icon from './Icon';

interface DatePickerProps {
  /** The chosen day as YYYY-MM-DD, or '' when none is chosen. */
  value: string;
  onChange(value: string): void;
  /** Earliest and latest days that can be picked, as YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** The visible field label. Leave it out and pass `ariaLabel` for a bare control. */
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (value: number) => String(value).padStart(2, '0');
// Days are worked out in UTC so a calendar day never shifts with the visitor's timezone.
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const fromIso = (iso: string) => new Date(iso + 'T00:00:00Z');
const isIso = (value?: string): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
const addDays = (iso: string, days: number) => { const date = fromIso(iso); date.setUTCDate(date.getUTCDate() + days); return toIso(date); };
const monthStart = (iso: string) => iso.slice(0, 8) + '01';
function addMonths(iso: string, months: number) {
  const date = fromIso(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return toIso(date);
}
function localToday() {
  const now = new Date();
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
}
const formatLong = (iso: string) => fromIso(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatMonth = (iso: string) => fromIso(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// A calendar in the site's colors, used in place of the browser's own date input.
// Arrow keys move by day and week, Page Up/Down by month, Enter picks and Escape closes.
export default function DatePicker({ value, onChange, min, max, label, ariaLabel, placeholder = 'Pick a date', required, className = '' }: DatePickerProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const [focused, setFocused] = useState('');
  const lowest = isIso(min) ? min : '';
  const highest = isIso(max) ? max : '';
  const allowed = (iso: string) => (!lowest || iso >= lowest) && (!highest || iso <= highest);
  const clamp = (iso: string) => lowest && iso < lowest ? lowest : highest && iso > highest ? highest : iso;

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [open, focused]);

  function show() {
    const box = trigger.current?.getBoundingClientRect();
    setUpward(Boolean(box && window.innerHeight - box.bottom < 380 && box.top > window.innerHeight - box.bottom));
    setFocused(clamp(isIso(value) ? value : localToday()));
    setOpen(true);
  }
  function hide(refocus = true) {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }
  function choose(iso: string) {
    if (!allowed(iso)) return;
    onChange(iso);
    hide();
  }
  function onGridKey(event: KeyboardEvent) {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1), ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7), ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1), PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -fromIso(focused).getUTCDay()), End: () => addDays(focused, 6 - fromIso(focused).getUTCDay()),
    };
    if (moves[event.key]) { event.preventDefault(); setFocused(clamp(moves[event.key]())); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(focused); }
  }
  function onKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); show(); }
      return;
    }
    if (event.key === 'Escape') { event.preventDefault(); hide(); }
  }

  const today = localToday();
  const first = monthStart(focused || today);
  const start = addDays(first, -fromIso(first).getUTCDay());
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const canGoBack = !lowest || addDays(first, -1) >= lowest;
  const canGoForward = !highest || addMonths(first, 1) <= highest;
  const labelId = id + '-label';

  return <div className={'date-field' + (open ? ' is-open' : '') + (className ? ' ' + className : '')} ref={root} onKeyDown={onKeyDown}
    onBlur={(event) => { if (open && !root.current?.contains(event.relatedTarget as Node)) setOpen(false); }}>
    {label && <span className="field-label" id={labelId}>{label}</span>}
    <div className="select-anchor">
      <button type="button" ref={trigger} className="select-trigger date-trigger" aria-haspopup="dialog" aria-expanded={open}
        aria-labelledby={label ? labelId + ' ' + id + '-value' : undefined} aria-label={label ? undefined : (ariaLabel || placeholder) + (isIso(value) ? ', ' + formatLong(value) : '')}
        onClick={() => open ? hide() : show()}>
        <Icon name="calendar" size={17} className="date-icon" />
        <span id={id + '-value'} className={isIso(value) ? 'select-value' : 'select-value select-placeholder'}>{isIso(value) ? formatLong(value) : placeholder}</span>
        <Icon name="chevron" size={17} className="select-chevron" />
      </button>
      {/* Lets the browser's own required check stop the form, and point at this field. */}
      {required && <input className="select-required" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} onInvalid={() => trigger.current?.focus()} />}
      {open && <div className={'date-menu' + (upward ? ' is-upward' : '')} role="dialog" aria-label={label || ariaLabel || 'Choose a date'}
        onMouseDown={(event) => event.preventDefault()}>
        <div className="date-head">
          <button type="button" className="date-nav" aria-label="Previous month" disabled={!canGoBack} onClick={() => setFocused(clamp(addMonths(focused, -1)))}><Icon name="chevron" size={16} className="date-prev" /></button>
          <strong aria-live="polite">{formatMonth(first)}</strong>
          <button type="button" className="date-nav" aria-label="Next month" disabled={!canGoForward} onClick={() => setFocused(clamp(addMonths(focused, 1)))}><Icon name="chevron" size={16} /></button>
        </div>
        <div className="date-weekdays" aria-hidden="true">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="date-grid" role="grid" ref={grid} onKeyDown={onGridKey}>
          {days.map((iso, index) => {
            const outside = iso.slice(0, 7) !== first.slice(0, 7);
            const classes = ['date-day', outside && 'is-outside', iso === today && 'is-today', iso === value && 'is-selected'].filter(Boolean).join(' ');
            // Keyed by position so the focused button stays mounted when the month changes.
            return <button type="button" key={index} role="gridcell" className={classes} disabled={!allowed(iso)} tabIndex={iso === focused ? 0 : -1}
              data-focused={iso === focused} aria-selected={iso === value} aria-label={formatLong(iso)}
              onClick={() => choose(iso)}>{Number(iso.slice(8))}</button>;
          })}
        </div>
        <div className="date-foot">
          {lowest ? <span>From {formatLong(lowest)}</span> : <span />}
          {!required && value && <button type="button" className="date-clear" onClick={() => { onChange(''); hide(); }}>Clear</button>}
        </div>
      </div>}
    </div>
  </div>;
}
