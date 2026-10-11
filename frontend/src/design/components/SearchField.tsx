import React, { useId, useRef } from 'react';
import Icon from './Icon';

interface SearchFieldProps {
  value: string;
  onChange(value: string): void;
  /** The visible field label. Leave it out and pass `ariaLabel` for a bare search box. */
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

// The one search box used across the dashboard: a search icon, the input and a clear button once something is typed.
export default function SearchField({ value, onChange, label, ariaLabel, placeholder = 'Search…', className = '' }: SearchFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return <div className={'search-field' + (className ? ' ' + className : '')}>
    {label && <label className="field-label" htmlFor={id}>{label}</label>}
    <div className="search-box">
      <Icon name="search" size={17} className="search-icon" />
      <input id={id} ref={input} type="search" value={value} placeholder={placeholder} aria-label={label ? undefined : ariaLabel || placeholder}
        autoComplete="off" spellCheck={false} onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Escape' && value) { event.preventDefault(); onChange(''); } }} />
      {value && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { onChange(''); input.current?.focus(); }}><Icon name="close" size={14} /></button>}
    </div>
  </div>;
}
