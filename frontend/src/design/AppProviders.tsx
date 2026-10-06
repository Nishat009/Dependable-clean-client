import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';

export default function AppProviders({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
