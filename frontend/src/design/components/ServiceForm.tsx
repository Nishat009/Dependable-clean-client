import React, { useState, type FormEvent } from 'react';
import { errorMessage } from '../api';
import { businessConfig, serviceCategories } from '../data';
import type { ServiceInput } from '../types';
import Icon from './Icon';
import Notice from './Notice';
import Select from './Select';

interface ServiceFormProps {
  initial?: ServiceInput;
  submitLabel: string;
  /** Saves the service. A thrown error is shown above the form. */
  onSubmit(input: ServiceInput): Promise<void>;
}

interface Fields {
  active: boolean;
  serviceName: string;
  category: string;
  price: string;
  duration: string;
  teamSize: string;
  idealFor: string;
  suppliesIncluded: boolean;
  details: string;
  includes: string;
}

const toFields = (service?: ServiceInput): Fields => ({
  active: service?.active !== false,
  serviceName: service?.serviceName || '',
  category: service?.category || 'Home care',
  price: service?.price ? String(service.price) : '',
  duration: service?.duration || '',
  teamSize: String(service?.teamSize || 1),
  idealFor: service?.idealFor || '',
  suppliesIncluded: service?.suppliesIncluded ?? true,
  details: service?.details || '',
  includes: (service?.includes || []).join('\n'),
});

// The add and edit service screens share this form.
export default function ServiceForm({ initial, submitLabel, onSubmit }: ServiceFormProps) {
  const [fields, setFields] = useState<Fields>(() => toFields(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await onSubmit({
        active: fields.active,
        serviceName: fields.serviceName.trim(),
        category: fields.category,
        price: Number(fields.price),
        duration: fields.duration.trim(),
        teamSize: Number(fields.teamSize) || 1,
        idealFor: fields.idealFor.trim(),
        suppliesIncluded: fields.suppliesIncluded,
        details: fields.details.trim(),
        includes: fields.includes.split('\n').map((item) => item.trim()).filter(Boolean),
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Notice message={error} type="error" onClose={() => setError('')} />
    <form onSubmit={submit} className="stack-form">
      <label><input type="checkbox" checked={fields.active} onChange={e => setFields({ ...fields, active: e.target.checked })} /> Active service</label><label>Service name<input required maxLength={120} value={fields.serviceName} onChange={(event) => set('serviceName', event.target.value)} placeholder="e.g. Weekend home reset" /></label>
      <div className="form-two">
        <Select label="Category" value={fields.category} options={serviceCategories.slice(1).map((item) => ({ value: item, label: item }))} onChange={(category) => set('category', category)} />
        <label>Starting price ({businessConfig.currency})<input required min="1" step="1" type="number" value={fields.price} onChange={(event) => set('price', event.target.value)} /></label>
      </div>
      <div className="form-two">
        <label>Estimated duration<input value={fields.duration} onChange={(event) => set('duration', event.target.value)} placeholder="e.g. 2–3 hours" /></label>
        <label>Team size<input required min="1" max="20" type="number" value={fields.teamSize} onChange={(event) => set('teamSize', event.target.value)} /></label>
      </div>
      <label>Ideal for<input maxLength={160} value={fields.idealFor} onChange={(event) => set('idealFor', event.target.value)} placeholder="e.g. Homes up to 3 bedrooms" /></label>
      <label>Description<textarea required rows={4} value={fields.details} onChange={(event) => set('details', event.target.value)} placeholder="What makes this service special?" /></label>
      <label>What's included<textarea rows={5} value={fields.includes} onChange={(event) => set('includes', event.target.value)} placeholder={'One item per line, for example:\nKitchen counters wiped\nFloors vacuumed and mopped'} /></label>
      <label className="check-row"><input type="checkbox" checked={fields.suppliesIncluded} onChange={(event) => set('suppliesIncluded', event.target.checked)} /> We bring the cleaning supplies</label>
      <button type="submit" className="button" disabled={busy}><span>{busy ? 'Saving…' : submitLabel}</span><Icon name="arrowUp" size={18} /></button>
    </form>
  </>;
}
