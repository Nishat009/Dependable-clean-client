import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import { api, jsonOptions } from '../api';
import ButtonLink from '../components/ButtonLink';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import { formatMoney } from '../data';
import { useReloadServices } from '../hooks/useReloadServices';
import { useAuth } from '../Auth';
import type { Service } from '../types';

const savedMessages: Record<string, string> = { added: 'Service added.', updated: 'Service updated.' };

// The super admin adds, edits and deletes services here. Staff see the same list without the controls.
export default function ManageServicesPage() {
  const router = useRouter();
  const services = useAppSelector((state) => state.services.items);
  const reloadServices = useReloadServices();
  const { user } = useAuth();
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [notice, setNotice] = useState('');
  const isSuperAdmin = user?.role === 'superAdmin' || user?.role === 'admin';
  const saved = typeof router.query.saved === 'string' ? savedMessages[router.query.saved] : '';

  useEffect(() => { reloadServices().catch(() => {}); }, [reloadServices]);

  async function remove(service: Service) {
    await api('/deleteClasses/' + service._id, jsonOptions('DELETE'));
    await reloadServices();
    setPendingDelete(null);
    setNotice(service.serviceName + ' was deleted.');
  }

  return <>
    <PageHeading eyebrow={isSuperAdmin ? 'ADMIN TOOLS' : 'STAFF VIEW'} title={<>{isSuperAdmin ? 'Manage' : 'Our'} <em>services.</em></>}
      description={isSuperAdmin ? 'Keep your service collection fresh and up to date.' : 'Every service customers can book. Only the super admin can change them.'} />
    <Notice message={notice || saved} onClose={notice ? () => setNotice('') : undefined} />
    <div className="dashboard-section-head"><h2>Current services</h2>{isSuperAdmin && <ButtonLink href="/addService">Add service</ButtonLink>}</div>
    {services.length ? <div className="admin-list">{services.map((service) => <article className="admin-row" key={service._id}>
      <div className="row-icon"><Icon name="sparkle" size={22} /></div>
      <div className="row-main">
        <strong>{service.serviceName}</strong>
        <span>{service.category || 'Cleaning service'} · {service.duration || 'Flexible timing'} · {service.teamSize || 1} {service.teamSize && service.teamSize > 1 ? 'cleaners' : 'cleaner'}</span>
        <small>{service.includes?.length ? service.includes.length + ' items included' : 'No checklist yet'} · {service.locations?.length ? service.locations.length + (service.locations.length === 1 ? ' location' : ' locations') : 'All locations'}</small>
      </div>
      <strong className="row-price">{formatMoney(service.price)}</strong>
      {isSuperAdmin && <div className="row-actions">
        <Link className="icon-button" href={'/editService/' + service._id} aria-label={'Edit ' + service.serviceName} title="Edit"><Icon name="edit" size={19} /></Link>
        <button className="icon-button danger" type="button" aria-label={'Delete ' + service.serviceName} title="Delete" onClick={() => setPendingDelete(service)}><Icon name="trash" size={19} /></button>
      </div>}
    </article>)}</div> : <EmptyState title="No services yet" text={isSuperAdmin ? 'Add your first cleaning service to get started.' : 'There are no services to show yet.'} href={isSuperAdmin ? '/addService' : undefined} action={isSuperAdmin ? 'Add service' : undefined} />}
    {pendingDelete && <ConfirmModal title="Delete this service?" confirmLabel="Delete service" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)}>
      <strong>{pendingDelete.serviceName}</strong> will be removed and customers will no longer be able to book it. Past orders stay as they are.
    </ConfirmModal>}
  </>;
}
