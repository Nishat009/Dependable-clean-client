import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import { api, errorMessage, jsonOptions } from '../api';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import { formatMoney } from '../data';
import { useReloadServices } from '../hooks/useReloadServices';

const savedMessages: Record<string, string> = { added: 'Service added.', updated: 'Service updated.' };

export default function ManageServicesPage() {
  const router = useRouter();
  const services = useAppSelector((state) => state.services.items);
  const reloadServices = useReloadServices();
  const [error, setError] = useState('');
  const saved = typeof router.query.saved === 'string' ? savedMessages[router.query.saved] : '';

  useEffect(() => { reloadServices().catch(() => {}); }, [reloadServices]);

  async function remove(id: string, name: string) {
    if (!window.confirm(`Remove ${name}? Customers will no longer be able to book it.`)) return;
    try { await api('/deleteClasses/' + id, jsonOptions('DELETE')); await reloadServices(); }
    catch (cause) { setError(errorMessage(cause)); }
  }

  return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={<>Manage <em>services.</em></>} description="Keep your service collection fresh and up to date." />
    <Notice message={saved} />
    <Notice message={error} type="error" onClose={() => setError('')} />
    <div className="dashboard-section-head"><h2>Current services</h2><ButtonLink href="/addService">Add service</ButtonLink></div>
    {services.length ? <div className="admin-list">{services.map((service) => <article className="admin-row" key={service._id}>
      <div className="row-icon"><Icon name="sparkle" size={22} /></div>
      <div className="row-main">
        <strong>{service.serviceName}</strong>
        <span>{service.category || 'Cleaning service'} · {service.duration || 'Flexible timing'} · {service.teamSize || 1} {service.teamSize && service.teamSize > 1 ? 'cleaners' : 'cleaner'}</span>
        <small>{service.includes?.length ? service.includes.length + ' items included' : 'No checklist yet'} · {service.locations?.length ? service.locations.length + ' locations' : 'All locations'}</small>
      </div>
      <strong className="row-price">{formatMoney(service.price)}</strong>
      <div className="row-actions">
        <Link className="icon-button" href={'/editService/' + service._id} aria-label={'Edit ' + service.serviceName} title="Edit"><Icon name="edit" size={19} /></Link>
        <button className="icon-button danger" type="button" aria-label={'Delete ' + service.serviceName} title="Delete" onClick={() => remove(service._id, service.serviceName)}><Icon name="trash" size={19} /></button>
      </div>
    </article>)}</div> : <EmptyState title="No services yet" text="Add your first cleaning service to get started." href="/addService" action="Add service" />}
  </>;
}
