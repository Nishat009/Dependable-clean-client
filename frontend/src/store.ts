import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { demoServices } from './design/data';
import type { Service } from './design/types';

interface ServicesState {
  items: Service[];
  /** True once the list has come from the API rather than the built-in sample. */
  loaded: boolean;
}

const servicesSlice = createSlice({
  name: 'services',
  initialState: { items: [], loaded: false } as ServicesState,
  reducers: {
    setServices(state, action: PayloadAction<Service[]>) {
      state.items = action.payload;
      state.loaded = true;
    },
  },
});

export const { setServices } = servicesSlice.actions;
export const store = configureStore({ reducer: { services: servicesSlice.reducer }, preloadedState: { services: { items: demoServices, loaded: false } } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
