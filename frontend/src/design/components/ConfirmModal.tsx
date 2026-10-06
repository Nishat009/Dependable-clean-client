import React, { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { errorMessage } from '../api';
import Icon, { type IconName } from './Icon';

interface ConfirmModalProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  icon?: IconName;
  /** Runs the action. The modal stays open with the error if it throws, and the caller closes it on success. */
  onConfirm(): Promise<unknown>;
  onCancel(): void;
}

// Asks before something that cannot be undone, such as a delete. Escape or a click outside cancels.
export default function ConfirmModal({ title, children, confirmLabel, icon = 'trash', onConfirm, onCancel }: ConfirmModalProps) {
  const id = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);

  async function confirm() {
    setBusy(true); setError('');
    try { await onConfirm(); }
    catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }

  return <div className="modal-backdrop" role="presentation"
    onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}
    onKeyDown={(event) => {
      if (event.key === 'Escape' && !busy) onCancel();
      // Keep Tab inside the two buttons.
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.shiftKey ? index - 1 : index + 1;
        if (next < 0 || next >= buttons.length) { event.preventDefault(); buttons[(next + buttons.length) % buttons.length]?.focus(); }
      }
    }}>
    <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby={id + '-title'} aria-describedby={id + '-text'}>
      <div className="modal-icon"><Icon name={icon} size={25} /></div>
      <h2 id={id + '-title'}>{title}</h2>
      <p id={id + '-text'}>{children}</p>
      {error && <p className="modal-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" ref={cancel} className="button button-secondary" disabled={busy} onClick={onCancel}>Cancel</button>
        <button type="button" className="button button-danger" disabled={busy} onClick={confirm}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
