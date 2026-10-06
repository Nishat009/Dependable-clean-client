import React from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import { api, jsonOptions } from '../api';
import ButtonLink from '../components/ButtonLink';
import PageHeading from '../components/PageHeading';
import ServiceForm from '../components/ServiceForm';
import { useReloadServices } from '../hooks/useReloadServices';
import { useRemote } from '../hooks/useRemote';
import type { Location, LocationInput, ServiceInput } from '../types';

// Add a service, or edit one when `id` is given. Both save and then return to the service list.
export default function ServiceEditor({ id }: { id?: string }) {
  const router = useRouter();
  const reloadServices = useReloadServices();
  const { data: locations, refresh: refreshLocations } = useRemote<Location[]>('/locations', []);
  const { data: thanas } = useRemote<string[]>('/dhakaThanas', []);
  const service = useAppSelector((state) => id ? state.services.items.find((item) => item._id === id) : undefined);
  const loaded = useAppSelector((state) => state.services.loaded);
  const editing = Boolean(id);

  async function save(input: ServiceInput) {
    if (id) await api('/updateService/' + id, jsonOptions('PATCH', input));
    else await api('/addService', jsonOptions('POST', input));
    await reloadServices();
    router.push('/addManage?saved=' + (editing ? 'updated' : 'added'));
  }
  async function addLocation(input: LocationInput) {
    const location = await api<Location>('/addLocation', jsonOptions('POST', input));
    refreshLocations();
    return location;
  }

  // Wait for the live list, so the form never starts from the built-in sample data.
  if (editing && !loaded) return <PageHeading eyebrow="ADMIN TOOLS" title={<>Loading the <em>service…</em></>} />;
  if (editing && !service) return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={<>Service <em>not found.</em></>} description="It may have been removed." />
    <ButtonLink href="/addManage">Back to services</ButtonLink>
  </>;

  return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={editing ? <>Edit <em>{service?.serviceName}.</em></> : <>Add a <em>service.</em></>}
      description={editing ? 'Update the details customers see when they book.' : 'Create a new way to help customers feel at home.'} />
    <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> SERVICE DETAILS</span>
      <h2>{editing ? 'Keep it fresh.' : 'The next fresh start.'}</h2>
      <ServiceForm key={id || 'new'} initial={service} locations={locations} thanas={thanas} onAddLocation={addLocation} submitLabel={editing ? 'Save changes' : 'Add service'} onSubmit={save} />
    </div>
  </>;
}
