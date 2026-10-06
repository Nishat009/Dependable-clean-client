import React from 'react';

export default function StatusBadge({ status }: { status?: string }) {
  const value = status || 'Pending';
  const kind = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={'status-badge status-' + kind}><span />{value}</span>;
}
