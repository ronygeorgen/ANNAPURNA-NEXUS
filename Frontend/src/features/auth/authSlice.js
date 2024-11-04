import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
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

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
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
            // .addCase(REHYDRATE, (state, action) => {
            //     console.log('REHYDRATE action received:', action);
            //     if (action.payload && action.payload.auth) {
            //         if (action.payload.auth.accessToken) {
            //           // console.log('Rehydrated auth state:', action.payload.auth);
            //           state.user = action.payload.auth.user;
            //           state.isAuthenticated = true;
            //           state.isLoading = false;
            //         } else {
            //           state.isAuthenticated = false;
            //           state.user = null;
            //           state.isLoading = false;
            //         }
            //       } else {
            //         state.isLoading = false;
            //       }
            //     });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;