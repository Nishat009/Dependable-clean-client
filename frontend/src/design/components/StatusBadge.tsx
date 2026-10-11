import React from 'react';

export default function StatusBadge({ status }: { status?: string }) {
  const value = status || 'Pending';
  const kind = value.toLowerCase().replace(/[\s_]+/g, '-');
  return <span className={'status-badge status-' + kind}><span />{value.replaceAll("_", " ")}</span>;
}
