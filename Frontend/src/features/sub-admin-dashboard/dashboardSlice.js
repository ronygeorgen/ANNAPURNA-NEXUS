import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardMetrics = createAsyncThunk(
    'dashboard/fetchMetrics',
    async (_, { getState, rejectWithValue }) => {
      try {
        const { profile } = getState();
        const shopId = profile.data.shopID;
        
        if (!shopId) {
          throw new Error('Shop ID not found');
        }
  
        const response = await api.get(`/api/dashboard/metrics/?shop_id=${shopId}`);
        
        
        return {
          revenue: response.data.revenue || 0,
          orders: response.data.orders || [],
          registeredCards: response.data.registered_cards || 0,
          pendingCards: response.data.pending_cards || 0,
          monthlyStats: response.data.monthly_stats || []
        };
      } catch (error) {
        return rejectWithValue(error.response?.data || 'An error occurred');
      }
    }
  );
  
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    metrics: {
      revenue: 0,
      orders: [],
      registeredCards: 0,
      pendingCards: 0,
      orderStats: []
    },
    initialized: false,
    loading: false,
    error: null
  },
  reducers: {
    resetDashboard: (state) => {
      state.error = null;
      state.initialized = false;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.initialized = true;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      });
  }
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;