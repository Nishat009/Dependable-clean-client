import React, { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Icon from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  /** A second, quieter line under the label. */
  hint?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange(value: string): void;
  /** The visible field label. Leave it out and pass `ariaLabel` for a compact control inside a row. */
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  required?: boolean;
  /** Shows a filter box at the top of the list, for long lists such as the Dhaka thanas. */
  searchable?: boolean;
  compact?: boolean;
  className?: string;
}

// A dropdown in the site's colors, used in place of the browser's own <select>.
// It keeps keyboard support (arrows, Enter, Escape, typing to filter) and blocks form submit when required and empty.
export default function Select({ value, options, onChange, label, ariaLabel, placeholder = 'Choose…', required, searchable, compact, className = '' }: SelectProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const selected = options.find((option) => option.value === value);
  const visible = query ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())) : options;

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function show() {
    const box = trigger.current?.getBoundingClientRect();
    setUpward(Boolean(box && window.innerHeight - box.bottom < 300 && box.top > window.innerHeight - box.bottom));
    setQuery('');
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
    if (searchable) requestAnimationFrame(() => search.current?.focus());
  }
  function hide(refocus = true) {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }
  function choose(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    hide();
  }
  function step(from: number, direction: 1 | -1) {
    for (let index = from + direction; index >= 0 && index < visible.length; index += direction) {
      if (!visible[index].disabled) return index;
    }
    return from;
  }
  function onKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); show(); }
      return;
    }
    if (event.key === 'Escape') { event.preventDefault(); hide(); }
    else if (event.key === 'Tab') hide(false);
    else if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => step(index, 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => step(index, -1)); }
    else if (event.key === 'Enter') { event.preventDefault(); if (visible[active]) choose(visible[active]); }
  }

  const labelId = id + '-label';
  return <div className={'select-field' + (compact ? ' select-compact' : '') + (open ? ' is-open' : '') + (className ? ' ' + className : '')} ref={root} onKeyDown={onKeyDown}>
    {label && <span className="field-label" id={labelId}>{label}</span>}
    <div className="select-anchor">
      <button type="button" ref={trigger} className="select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={id + '-list'}
        aria-labelledby={label ? labelId + ' ' + id + '-value' : undefined} aria-label={label ? undefined : ariaLabel}
        onClick={() => open ? hide() : show()}>
        <span id={id + '-value'} className={selected ? 'select-value' : 'select-value select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <Icon name="chevron" size={17} className="select-chevron" />
      </button>
      {/* Lets the browser's own required check stop the form, and point at this field. */}
      {required && <input className="select-required" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} onInvalid={() => trigger.current?.focus()} />}
      {open && <div className={'select-menu' + (upward ? ' is-upward' : '')}>
        {searchable && <div className="select-search"><Icon name="search" size={16} /><input ref={search} value={query} placeholder="Type to search" aria-label="Search the list"
          onChange={(event) => { setQuery(event.target.value); setActive(0); }} /></div>}
        <ul role="listbox" id={id + '-list'} ref={list} aria-labelledby={label ? labelId : undefined} aria-label={label ? undefined : ariaLabel}>
          {visible.map((option, index) => <li key={option.value} role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined}
            data-active={index === active} className={(option.value === value ? 'is-selected' : '') + (option.disabled ? ' is-disabled' : '')}
            onMouseEnter={() => !option.disabled && setActive(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)}>
            <span className="select-option-text"><span>{option.label}</span>{option.hint && <small>{option.hint}</small>}</span>
            {option.value === value && <Icon name="check" size={16} />}
          </li>)}
          {!visible.length && <li className="select-empty" role="presentation">Nothing matches “{query}”.</li>}
        </ul>
      </div>}
    </div>
  </div>;
}
