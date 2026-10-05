import { configureStore, createSlice } from '@reduxjs/toolkit';
import { demoServices } from './design/data';

const servicesSlice = createSlice({
  name: 'services',
  initialState: { items: demoServices },
  reducers: {
    setServices(state, action) {
      state.items = action.payload;
    },
  },
});

export const { setServices } = servicesSlice.actions;
export const store = configureStore({ reducer: { services: servicesSlice.reducer } });
