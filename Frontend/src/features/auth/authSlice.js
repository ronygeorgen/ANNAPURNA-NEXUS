import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import { fetchShops } from '../fetch-nearbyshop-home/shopsSlice';
import { REHYDRATE } from 'redux-persist';

export const registeruser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/user/register/', userData);
            return response.data.user
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const loginuser = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
      try {
        const response = await api.post('/user/login/', { email, password }, { withCredentials: true });
        console.log('Login response:', response.data);
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async ({ email, password }, {rejectWithValue}) => {
    try {
      const response = await api.post('/user/admin-login/', { email, password }, { withCredentials: true });
      console.log('Admin login response:', response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const subAdminLogin = createAsyncThunk(
  'auth/subAdminLogin',
  async ({ email, password }, {rejectWithValue}) => {
    try {
      const response = await api.post('/user/sub-admin-login/', { email, password }, { withCredentials: true });
      console.log('Sub-Admin login response:', response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await api.post('/logout/',  { withCredentials: true });
            return null;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Logout failed');
        }
    }
);


export const updateUserLocation = createAsyncThunk(
  'auth/updateUserLocation',
  async (_, { rejectWithValue, dispatch }) => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => reject(new Error(error.message || 'Failed to get geolocation'))
          );
        });

        const { latitude, longitude } = position.coords;

        const response = await api.patch('/user/update-location/', { 
          latitude, 
          longitude 
        },{ withCredentials: true });

        dispatch(fetchShops({ latitude, longitude }));

        // Return the server's response data
        return response.data;
      } catch (error) {
        // Handle API or geolocation errors
        if (error.response && error.response.data) {
          return rejectWithValue(error.response.data);
        }
        return rejectWithValue(error.message || 'Something went wrong');
      }
    } else {
      return rejectWithValue('Geolocation not supported');
    }
  }
);




const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        location: {
          latitude: null,
          longitude: null
        }
    },
    reducers: {
        clearError(state) {
          state.error = null;
        },
      },
    extraReducers: (builder) => {
        builder
            .addCase(registeruser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registeruser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(registeruser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
        
            .addCase(loginuser.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(loginuser.fulfilled, (state, action) => {
              console.log('Login fulfilled payload:', action.payload);
              state.isLoading = false;
              state.user = action.payload.user;
              state.isAuthenticated = true;
              console.log('Login fulfilled:', state)
            })
            .addCase(loginuser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
            })
            // Update User Location
            .addCase(updateUserLocation.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(updateUserLocation.fulfilled, (state, action) => {
              state.isLoading = false;
              state.location = {
                latitude: action.payload.latitude,
                longitude: action.payload.longitude,
              };
            })
            .addCase(updateUserLocation.rejected, (state, action) => {
              state.isLoading = false;
              state.error = action.payload;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(adminLogin.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(adminLogin.fulfilled, (state, action) => {
              state.isLoading = false;
              state.user = action.payload.admin;
              state.isAuthenticated = true;
              console.log('Admin login fulfilled:', action.payload.admin);
            })
            .addCase(adminLogin.rejected, (state, action) => {
              state.isLoading = false;
              state.error = action.payload;
              state.isAuthenticated = false;
              state.user = null;
            })            
            .addCase(subAdminLogin.pending, (state) => {
              state.isLoading = true;
              state.error = null;
            })
            .addCase(subAdminLogin.fulfilled, (state, action) => {
              state.isLoading = false;
              state.user = action.payload.sub_admin;
              state.isAuthenticated = true;
              console.log('Sub-Admin login fulfilled:', action.payload.sub_admin);
            })
            .addCase(subAdminLogin.rejected, (state, action) => {
              state.isLoading = false;
              state.error = action.payload;
              state.isAuthenticated = false;
              state.user = null;
            })
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;