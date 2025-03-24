import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { RootState } from '../store';

interface SearchState {
  searchTerm: string;
  isSearching: boolean;
  currentPage: number;
}

const initialState: SearchState = {
  searchTerm: '',
  isSearching: false,
  currentPage: 1,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.currentPage = 1;
    },
    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearSearch: (state) => {
      state.searchTerm = '';
      state.isSearching = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: any) => {
      return {
        ...state,
        ...action.payload.search,
      };
    });
  },
});

export const { setSearchTerm, setIsSearching, setCurrentPage, clearSearch } = searchSlice.actions;

export const selectSearchTerm = (state: RootState) => state.search.searchTerm;
export const selectIsSearching = (state: RootState) => state.search.isSearching;
export const selectCurrentPage = (state: RootState) => state.search.currentPage;

export default searchSlice.reducer;