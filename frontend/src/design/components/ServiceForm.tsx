import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { errorMessage } from '../api';
import { describeLocation, serviceCategories, thanaOptions } from '../data';
import type { Location, LocationInput, ServiceInput } from '../types';
import Icon from './Icon';
import Notice from './Notice';
import Select from './Select';

interface ServiceFormProps {
  initial?: ServiceInput;
  locations: Location[];
  /** Dhaka thanas, for adding a location without leaving the form. */
  thanas: string[];
  /** Creates a location. Only the super admin sees this form, so they may always add one. */
  onAddLocation(input: LocationInput): Promise<Location>;
  submitLabel: string;
  /** Saves the service. A thrown error is shown above the form. */
  onSubmit(input: ServiceInput): Promise<void>;
}

interface Fields {
  serviceName: string;
  category: string;
  price: string;
  duration: string;
  teamSize: string;
  idealFor: string;
  suppliesIncluded: boolean;
  details: string;
  includes: string;
  locations: string[];
}

const toFields = (service?: ServiceInput): Fields => ({
  serviceName: service?.serviceName || '',
  category: service?.category || 'Home care',
  price: service?.price ? String(service.price) : '',
  duration: service?.duration || '',
  teamSize: String(service?.teamSize || 1),
  idealFor: service?.idealFor || '',
  suppliesIncluded: service?.suppliesIncluded ?? true,
  details: service?.details || '',
  includes: (service?.includes || []).join('\n'),
  locations: service?.locations || [],
});

// Adds a Dhaka location inline and hands it back, so it can be ticked for this service straight away.
function NewLocation({ thanas, onAdd, onDone }: { thanas: string[]; onAdd(input: LocationInput): Promise<void>; onDone(): void }) {
  const [fields, setFields] = useState<LocationInput>({ name: '', thana: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // This sits inside the service form, so it saves on its own button rather than a nested <form>.
  async function add() {
    if (!fields.name.trim() || !fields.thana) { setError('Add a name and choose a thana.'); return; }
    setBusy(true); setError('');
    try { await onAdd(fields); onDone(); }
    catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }

  return <div className="new-location">
    <div className="form-two">
      <label>Location name<input maxLength={80} value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="e.g. Banani DOHS"
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label>
      <Select label="Thana" searchable placeholder="Choose a Dhaka thana" value={fields.thana} options={thanaOptions(thanas)} onChange={(thana) => setFields({ ...fields, thana })} />
    </div>
    <label>Address or landmark<input maxLength={200} value={fields.address} onChange={(event) => setFields({ ...fields, address: event.target.value })} placeholder="Optional"
      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} /></label>
    {error && <small className="field-error" role="alert">{error}</small>}
    <div className="new-location-actions">
      <button type="button" className="small-button" onClick={onDone}>Cancel</button>
      <button type="button" className="small-button small-button-primary" disabled={busy} onClick={add}>{busy ? 'Adding…' : 'Add and select'}</button>
    </div>
  </div>;
}

// The add and edit service screens share this form.
export default function ServiceForm({ initial, locations, thanas, onAddLocation, submitLabel, onSubmit }: ServiceFormProps) {
  const [fields, setFields] = useState<Fields>(() => toFields(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  // Locations added from this form show up before the page's list reloads.
  const [added, setAdded] = useState<Location[]>([]);
  const allLocations = [...locations, ...added.filter((item) => !locations.some((location) => location._id === item._id))];
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((current) => ({ ...current, [key]: value }));
  const toggleLocation = (id: string) => set('locations', fields.locations.includes(id) ? fields.locations.filter((item) => item !== id) : [...fields.locations, id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await onSubmit({
        serviceName: fields.serviceName.trim(),
        category: fields.category,
        price: Number(fields.price),
        duration: fields.duration.trim(),
        teamSize: Number(fields.teamSize) || 1,
        idealFor: fields.idealFor.trim(),
        suppliesIncluded: fields.suppliesIncluded,
        details: fields.details.trim(),
        includes: fields.includes.split('\n').map((item) => item.trim()).filter(Boolean),
        locations: fields.locations,
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
      <label>Service name<input required maxLength={120} value={fields.serviceName} onChange={(event) => set('serviceName', event.target.value)} placeholder="e.g. Weekend home reset" /></label>
      <div className="form-two">
        <Select label="Category" value={fields.category} options={serviceCategories.slice(1).map((item) => ({ value: item, label: item }))} onChange={(category) => set('category', category)} />
        <label>Starting price ($)<input required min="1" step="1" type="number" value={fields.price} onChange={(event) => set('price', event.target.value)} /></label>
      </div>
      <div className="form-two">
        <label>Estimated duration<input value={fields.duration} onChange={(event) => set('duration', event.target.value)} placeholder="e.g. 2–3 hours" /></label>
        <label>Team size<input required min="1" max="20" type="number" value={fields.teamSize} onChange={(event) => set('teamSize', event.target.value)} /></label>
      </div>
      <label>Ideal for<input maxLength={160} value={fields.idealFor} onChange={(event) => set('idealFor', event.target.value)} placeholder="e.g. Homes up to 3 bedrooms" /></label>
      <label>Description<textarea required rows={4} value={fields.details} onChange={(event) => set('details', event.target.value)} placeholder="What makes this service special?" /></label>
      <label>What's included<textarea rows={5} value={fields.includes} onChange={(event) => set('includes', event.target.value)} placeholder={'One item per line, for example:\nKitchen counters wiped\nFloors vacuumed and mopped'} /></label>
      <label className="check-row"><input type="checkbox" checked={fields.suppliesIncluded} onChange={(event) => set('suppliesIncluded', event.target.checked)} /> We bring the cleaning supplies</label>
      <fieldset className="location-picker">
        <legend>Locations covered</legend>
        <p>{allLocations.length ? 'Tick the Dhaka areas this service covers. Leave all unticked to offer it everywhere.' : 'No locations yet, so this service is offered everywhere. Add one here or from the Locations page.'}</p>
        {allLocations.length > 0 && <div className="location-options">{allLocations.map((location) => <label key={location._id} className="check-row">
          <input type="checkbox" checked={fields.locations.includes(location._id)} onChange={() => toggleLocation(location._id)} />
          <span>{location.name}<small>{describeLocation(location)}</small></span>
        </label>)}</div>}
        {adding
          ? <NewLocation thanas={thanas} onDone={() => setAdding(false)} onAdd={async (input) => {
            const location = await onAddLocation(input);
            setAdded((current) => [...current, location]);
            setFields((current) => ({ ...current, locations: [...current.locations, location._id] }));
          }} />
          : <div className="location-picker-foot">
            <button type="button" className="small-button" onClick={() => setAdding(true)}><Icon name="plus" size={14} /> New location</button>
            <Link href="/locations" className="inline-link">Manage all locations</Link>
          </div>}
      </fieldset>
      <button type="submit" className="button" disabled={busy}><span>{busy ? 'Saving…' : submitLabel}</span><Icon name="arrowUp" size={18} /></button>
    </form>
  </>;
}
