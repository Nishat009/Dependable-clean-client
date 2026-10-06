import React, { useState, type InputHTMLAttributes } from 'react';
import Icon from './Icon';

// A password box with an eye button that shows or hides what was typed.
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return <span className="password-field">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}
      title={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
      <Icon name={visible ? 'eyeOff' : 'eye'} size={19} />
    </button>
  </span>;
}
