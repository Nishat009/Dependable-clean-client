import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import SearchField from '../components/SearchField';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import { useRemote } from '../hooks/useRemote';
import { describeLocation, thanaOptions } from '../data';
import { useAuth } from '../Auth';
import Pagination from '../components/Pagination';
import { isManager, type Location, type LocationInput } from '../types';

const blank: LocationInput = { name: '', thana: '', address: '' };
const fieldsOf = (location: Location): LocationInput => ({ name: location.name, thana: location.thana || '', address: location.address || '' });

function LocationRow({ location, thanas, canEdit, onSave, onToggle, onDelete }: { location: Location; thanas: string[]; canEdit: boolean; onSave(fields: LocationInput): Promise<void>; onToggle(): void; onDelete(): void }) {
  const active = location.active !== false;
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState(() => fieldsOf(location));

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
    <Select compact searchable required ariaLabel="Thana" placeholder="Choose thana" value={fields.thana} options={thanaOptions(thanas)} onChange={(thana) => setFields({ ...fields, thana })} />
    <input aria-label="Address or landmark" placeholder="Road, block or landmark" value={fields.address} onChange={(event) => setFields({ ...fields, address: event.target.value })} />
    <div className="row-actions">
      <button className="icon-button" type="submit" aria-label="Save location" title="Save"><Icon name="check" size={19} /></button>
      <button className="icon-button" type="button" aria-label="Cancel" title="Cancel" onClick={() => { setFields(fieldsOf(location)); setEditing(false); }}><Icon name="close" size={19} /></button>
    </div>
  </form>;

  return <article className="admin-row">
    <div className="row-icon"><Icon name="pin" size={22} /></div>
    <div className="row-main"><strong>{location.name}</strong><span>{describeLocation(location)}</span></div>
    <StatusBadge status={active ? 'Active' : 'Inactive'} />
    {canEdit && <div className="row-actions">
      <button type="button" className={'small-button' + (active ? ' small-button-danger' : ' small-button-primary')} onClick={onToggle}>{active ? 'Deactivate' : 'Activate'}</button>
      <button className="icon-button" type="button" aria-label={'Edit ' + location.name} title="Edit" onClick={() => setEditing(true)}><Icon name="edit" size={19} /></button>
      <button className="icon-button danger" type="button" aria-label={'Delete ' + location.name} title="Delete" onClick={onDelete}><Icon name="trash" size={19} /></button>
    </div>}
  </article>;
}

// Service areas inside Dhaka. The super admin manages them here, or straight from the service form.
export default function LocationsPage() {
  const { data: locations, loading, error: loadError, refresh } = useRemote<Location[]>('/locationList', []);
  const { data: thanas } = useRemote<string[]>('/dhakaThanas', []);
  const { user } = useAuth();
  const isSuperAdmin = isManager(user?.role);
  const [fields, setFields] = useState<LocationInput>(blank);
  const [pendingDelete, setPendingDelete] = useState<Location | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search,setSearch] = useState('');
  const [page,setPage] = useState(1);
  const visible = locations.filter(l => [l.name,l.thana].join(' ').toLowerCase().includes(search.toLowerCase()));

  async function attempt(action: () => Promise<unknown>, success: string) {
    setError(''); setNotice('');
    try { await action(); setNotice(success); refresh(); }
    catch (cause) { setError(errorMessage(cause)); throw cause; }
  }
  function add(event: FormEvent) {
    event.preventDefault();
    attempt(() => api('/addLocation', jsonOptions('POST', fields)), 'Location added.').then(() => setFields(blank)).catch(() => {});
  }
  async function remove(location: Location) {
    await api('/deleteLocation/' + location._id, jsonOptions('DELETE'));
    setPendingDelete(null);
    setNotice(location.name + ' was removed.');
    refresh();
  }

  return <>
    <PageHeading eyebrow={isSuperAdmin ? 'ADMIN TOOLS' : 'STAFF VIEW'} title={<>Where we <em>clean.</em></>} description="Our service areas inside Dhaka. Customers can book any service in an active area. Switch an area off to stop new bookings there." />
    <Notice message={notice} onClose={() => setNotice('')} />
    <Notice message={error || loadError} type="error" onClose={() => setError('')} />
    {isSuperAdmin && <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> NEW LOCATION · DHAKA</span>
      <h2>Add an area.</h2>
      <form onSubmit={add} className="stack-form">
        <div className="form-two">
          <label>Location name<input required maxLength={80} value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="e.g. Gulshan 2" /></label>
          <Select label="Thana" searchable required placeholder="Choose a Dhaka thana" value={fields.thana} options={thanaOptions(thanas)} onChange={(thana) => setFields({ ...fields, thana })} />
        </div>
        <label>Address or landmark<input maxLength={200} value={fields.address} onChange={(event) => setFields({ ...fields, address: event.target.value })} placeholder="e.g. Road 90, near Gulshan 2 circle" /></label>
        <button className="button" type="submit"><span>Add location</span><Icon name="arrowUp" size={18} /></button>
      </form>
    </div>}
    <div className="dashboard-section-head"><h2>Current locations</h2><span className="result-count">{locations.filter((l) => l.active !== false).length} OF {locations.length} ACTIVE</span></div>
<SearchField className="list-search" ariaLabel="Search areas" placeholder="Search by area or thana" value={search} onChange={value=>{setSearch(value);setPage(1);}} />
    {loading && <p>Loading service areas...</p>}
    {visible.length ? <div className="admin-list">{visible.slice((page-1)*10,page*10).map((location) => <LocationRow key={location._id} location={location} thanas={thanas} canEdit={isSuperAdmin}
      onSave={(next) => attempt(() => api('/updateLocation/' + location._id, jsonOptions('PATCH', next)), 'Location updated.')}
      onToggle={() => attempt(() => api('/locationStatus/' + location._id, jsonOptions('PATCH', { active: location.active === false })), location.name + (location.active === false ? ' is active again.' : ' is now inactive.')).catch(() => {})}
      onDelete={() => setPendingDelete(location)} />)}</div>
      : !loading && <EmptyState title="No locations yet" text="Customers cannot book until at least one area is active." />}
    <Pagination page={page} pageSize={10} total={visible.length} noun="locations" onChange={setPage} />
    {pendingDelete && <ConfirmModal title="Remove this location?" confirmLabel="Remove location" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)}>
      <strong>{pendingDelete.name}</strong> will be removed for good. Existing orders keep their address. To pause it instead, deactivate it.
    </ConfirmModal>}
  </>;
}
