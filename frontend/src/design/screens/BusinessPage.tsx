import React, { useEffect, useState } from 'react';
import { api, jsonOptions } from '../api';
import { useAction } from '../hooks/useAction';
import { useRemote } from '../hooks/useRemote';
import PageHeading from '../components/PageHeading';
import Notice from '../components/Notice';

type Business = {
    email: string;
    phone: string;
    faq: string;
    cancellationPolicy: string;
    offers: string;
    timezone: string;
    currency: string;
};
export default function BusinessPage() {
    const remote = useRemote<Business>('/business', { email: '', phone: '', faq: '', cancellationPolicy: '', offers: '', timezone: '', currency: '' });
    const [fields, setFields] = useState(remote.data);
    useEffect(() => setFields(remote.data), [remote.data]);
    const { error, busy, run } = useAction(remote.refresh);
    return <><PageHeading title={<>Business content</>} description="Publish your actual contact details, FAQ, cancellation policy and offers. Leave unconfirmed content blank."/><Notice type="error" message={error || remote.error}/><form className="form-card stack-form" onSubmit={e => { e.preventDefault(); run(() => api('/business', jsonOptions('PATCH', fields))); }}>{(['email', 'phone', 'faq', 'cancellationPolicy', 'offers'] as const).map(key => <label key={key}>{key}<textarea value={typeof fields[key] === 'string' ? fields[key] : ''} onChange={e => setFields({ ...fields, [key]: e.target.value })}/></label>)}<p>Timezone: {fields.timezone} · Currency: {fields.currency}</p><button disabled={busy} className="button">Save content</button></form></>;
}
