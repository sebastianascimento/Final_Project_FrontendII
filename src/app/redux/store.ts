import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import searchReducer from './features/searchSlice';

export const makeStore = () => 
  configureStore({
    reducer: {
      search: searchReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(makeStore);