import React, { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { errorMessage } from '../api';
import Icon, { type IconName } from './Icon';

interface ConfirmModalProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** The dismiss button, 'Cancel' unless that would read oddly next to the action, as with cancelling a booking. */
  cancelLabel?: string;
  icon?: IconName;
  /** 'danger' (red) for deletes and cancellations, 'primary' (lime) for ordinary confirmations. */
  tone?: 'danger' | 'primary';
  /** Fields shown under the message, such as a date or a note the action needs. */
  body?: ReactNode;
  /** Keeps the confirm button off, for example until a required field is filled in. */
  confirmDisabled?: boolean;
  /** Runs the action. The modal stays open with the error if it throws, and the caller closes it on success. */
  onConfirm(): Promise<unknown>;
  onCancel(): void;
}

const focusable = 'button:not(:disabled), textarea:not(:disabled), input:not(:disabled):not([tabindex="-1"]), [tabindex="0"]';

// Asks before an action, in the site's colors instead of the browser's own confirm box. Escape or a click outside cancels.
export default function ConfirmModal({ title, children, confirmLabel, cancelLabel = 'Cancel', icon = 'trash', tone = 'danger', body, confirmDisabled, onConfirm, onCancel }: ConfirmModalProps) {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Start in the first field when there is one, otherwise on Cancel so Enter never confirms by accident.
    (section.current?.querySelector<HTMLElement>('.modal-body textarea, .modal-body input:not([tabindex="-1"]), .modal-body button') || cancel.current)?.focus();
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
      // A dropdown or calendar inside the modal closes itself on Escape first.
      if (event.key === 'Escape' && !busy && !event.defaultPrevented) onCancel();
      // Keep Tab inside the modal.
      if (event.key === 'Tab') {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>(focusable)];
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey ? index - 1 : index + 1;
        if (next < 0 || next >= items.length) { event.preventDefault(); items[(next + items.length) % items.length]?.focus(); }
      }
    }}>
    <section className={'confirm-modal' + (tone === 'primary' ? ' is-primary' : '')} ref={section} role="alertdialog" aria-modal="true" aria-labelledby={id + '-title'} aria-describedby={id + '-text'}>
      <div className="modal-icon"><Icon name={icon} size={25} /></div>
      <h2 id={id + '-title'}>{title}</h2>
      <p id={id + '-text'}>{children}</p>
      {body && <div className="modal-body">{body}</div>}
      {error && <p className="modal-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" ref={cancel} className="button button-secondary" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={'button ' + (tone === 'primary' ? 'button-confirm' : 'button-danger')} disabled={busy || confirmDisabled} onClick={confirm}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
