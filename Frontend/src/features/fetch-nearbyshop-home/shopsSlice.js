import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchShops = createAsyncThunk(
    'shops/fetchShops',
    async ({ latitude, longitude }, { rejectWithValue }) => {
      try {
        const response = await api.get('/ration-shop/shops/', {
          params: { latitude, longitude },
          withCredentials: true
        });
        console.log('Shops response:', response.data);
        
        return response.data;
      } catch (error) { 
        return rejectWithValue(error.response?.data || 'Failed to fetch shops');
      }
    }
  );
  
  const shopsSlice = createSlice({
    name: 'shops',
    initialState: {
      shops: [],
      loading: false,
      error: null
    },
    reducers: {
      clearErrorShop(state) {
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchShops.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchShops.fulfilled, (state, action) => {
          state.loading = false;
          state.shops = action.payload;
        })
        .addCase(fetchShops.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    }
  });

export const { clearErrorShop } = shopsSlice.actions;
export default shopsSlice.reducer;