import { useCallback } from 'react';
import { setServices, useAppDispatch } from '../../store';
import { api } from '../api';
import type { Service } from '../types';

// Fetches the service list into the store, so every page shows an admin's change straight away.
export function useReloadServices(): () => Promise<void> {
  const dispatch = useAppDispatch();
  return useCallback(async () => {
    const services = await api<Service[]>('/services');
    if (Array.isArray(services)) dispatch(setServices(services));
  }, [dispatch]);
}
