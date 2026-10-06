import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import { useRemote } from '../hooks/useRemote';
import type { Location } from '../types';

interface LocationFields { name: string; city: string }

function LocationRow({ location, onSave, onDelete }: { location: Location; onSave(fields: LocationFields): Promise<void>; onDelete(): void }) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<LocationFields>({ name: location.name, city: location.city || '' });

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await onSave(fields);
      setEditing(false);
    } catch {
      // The page shows the error and the row stays open for another try.
    }
  }

  if (editing) return <form className="admin-row location-edit" onSubmit={save}>
    <div className="row-icon"><Icon name="pin" size={22} /></div>
    <input required aria-label="Location name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} />
    <input aria-label="City or area" placeholder="City or area" value={fields.city} onChange={(event) => setFields({ ...fields, city: event.target.value })} />
    <div className="row-actions">
      <button className="icon-button" type="submit" aria-label="Save location" title="Save"><Icon name="check" size={19} /></button>
      <button className="icon-button" type="button" aria-label="Cancel" title="Cancel" onClick={() => { setFields({ name: location.name, city: location.city || '' }); setEditing(false); }}><Icon name="close" size={19} /></button>
    </div>
  </form>;

  return <article className="admin-row">
    <div className="row-icon"><Icon name="pin" size={22} /></div>
    <div className="row-main"><strong>{location.name}</strong><span>{location.city || 'No city or area added'}</span></div>
    <div className="row-actions">
      <button className="icon-button" type="button" aria-label={'Edit ' + location.name} title="Edit" onClick={() => setEditing(true)}><Icon name="edit" size={19} /></button>
      <button className="icon-button danger" type="button" aria-label={'Delete ' + location.name} title="Delete" onClick={onDelete}><Icon name="trash" size={19} /></button>
    </div>
  </article>;
}

export default function LocationsPage() {
  const { data: locations, loading, refresh } = useRemote<Location[]>('/locations', []);
  const [fields, setFields] = useState<LocationFields>({ name: '', city: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function attempt(action: () => Promise<unknown>, success: string) {
    setError(''); setNotice('');
    try { await action(); setNotice(success); refresh(); }
    catch (cause) { setError(errorMessage(cause)); throw cause; }
  }
  function add(event: FormEvent) {
    event.preventDefault();
    attempt(() => api('/addLocation', jsonOptions('POST', fields)), 'Location added.').then(() => setFields({ name: '', city: '' })).catch(() => {});
  }
  function remove(location: Location) {
    if (!window.confirm(`Remove ${location.name}? Services will no longer list it.`)) return;
    attempt(() => api('/deleteLocation/' + location._id, jsonOptions('DELETE')), 'Location removed.').catch(() => {});
  }

  return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={<>Where we <em>clean.</em></>} description="Customers choose one of these areas when they book. Each service can cover all of them or only some." />
    <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> NEW LOCATION</span>
      <h2>Add an area.</h2>
      <Notice message={notice} onClose={() => setNotice('')} />
      <Notice message={error} type="error" onClose={() => setError('')} />
      <form onSubmit={add} className="stack-form">
        <div className="form-two">
          <label>Location name<input required maxLength={80} value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="e.g. Gulshan" /></label>
          <label>City or area<input maxLength={80} value={fields.city} onChange={(event) => setFields({ ...fields, city: event.target.value })} placeholder="e.g. Dhaka" /></label>
        </div>
        <button className="button" type="submit"><span>Add location</span><Icon name="arrowUp" size={18} /></button>
      </form>
    </div>
    <div className="dashboard-section-head"><h2>Current locations</h2><span className="result-count">{locations.length} AREAS</span></div>
    {locations.length ? <div className="admin-list">{locations.map((location) => <LocationRow key={location._id} location={location}
      onSave={(next) => attempt(() => api('/updateLocation/' + location._id, jsonOptions('PATCH', next)), 'Location updated.')}
      onDelete={() => remove(location)} />)}</div>
      : !loading && <EmptyState title="No locations yet" text="Until you add one, customers can book without choosing an area." />}
  </>;
}
