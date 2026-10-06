import React from 'react';
import Icon from './Icon';

interface NoticeProps {
  message?: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export default function Notice({ message, type = 'success', onClose }: NoticeProps) {
  if (!message) return null;
  return <div className={'notice notice-' + type} role={type === 'error' ? 'alert' : 'status'}>
    <Icon name={type === 'success' ? 'check' : 'close'} size={18} />
    <span>{message}</span>
    {onClose && <button type="button" onClick={onClose} aria-label="Dismiss message"><Icon name="close" size={16} /></button>}
  </div>;
}
