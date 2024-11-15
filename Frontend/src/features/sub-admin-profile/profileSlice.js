import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchProfile = createAsyncThunk(
    'profile/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/ration-shop/profile/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateProfile = createAsyncThunk(
    'profile/updateProfile',
    async (profileData, { rejectWithValue }) => {
      try {
        const response = await api.patch('/ration-shop/profile/update/', profileData, { withCredentials: true });
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const uploadProfilePicture = createAsyncThunk(
    'profile/uploadProfilePicture',
    async (imageFile, { rejectWithValue }) => {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/ration-shop/profile/upload_picture/', formData ,{
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );


  export const uploadShopImage = createAsyncThunk(
    'profile/uploadShopImage',
    async (imageFile, { rejectWithValue }) => {
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/ration-shop/profile/upload_shop_image/', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );


  export const deleteShopImage = createAsyncThunk(
    'profile/deleteShopImage',
    async (imageId, { rejectWithValue }) => {
      try {
        const response = await api.delete(`/ration-shop/profile/delete_shop_image/${imageId}/`, { withCredentials: true });
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        data: {
            ownerName: '',
            shopName: '',
            shopDescription: '',
            location: '',
            profilePicture: '',
            shopImages: [],
            isOpen: false,
        },
        loading: false,
        error: null,
        updateStatus: 'idle',
        uploadStatus: 'idle',
    },
    reducers: {
        resetStatus: (state) => {
          state.updateStatus = 'idle';
          state.uploadStatus = 'idle';
          state.error = null;
        },
      },
      extraReducers: (builder) => {
        builder
          // Fetch Profile
          .addCase(fetchProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(fetchProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.data = action.payload;
          })
          .addCase(fetchProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          })
          
          // Update Profile
          .addCase(updateProfile.pending, (state) => {
            state.updateStatus = 'loading';
            state.error = null;
          })
          .addCase(updateProfile.fulfilled, (state, action) => {
            state.updateStatus = 'succeeded';
            state.data = { ...state.data, ...action.payload };
          })
          .addCase(updateProfile.rejected, (state, action) => {
            state.updateStatus = 'failed';
            state.error = action.payload;
          })
          
          // Update Shop Status
          // .addCase(updateShopStatus.fulfilled, (state, action) => {
          //   state.data.isOpen = action.payload.isOpen;
          // })
        
          // Upload Profile Picture
          .addCase(uploadProfilePicture.pending, (state) => {
            state.uploadStatus = 'loading';
            state.error = null;
          })
          .addCase(uploadProfilePicture.fulfilled, (state, action) => {
            state.uploadStatus = 'succeeded';
            state.data.profilePicture = action.payload.profilePicture;
          })
          .addCase(uploadProfilePicture.rejected, (state, action) => {
            state.uploadStatus = 'failed';
            state.error = action.payload;
          })
          
          // Upload Shop Image
          .addCase(uploadShopImage.pending, (state) => {
            state.uploadStatus = 'loading';
            state.error = null;
          })
          .addCase(uploadShopImage.fulfilled, (state, action) => {
            state.uploadStatus = 'succeeded';
            state.data.shopImages.push(action.payload.image);
          })
          .addCase(uploadShopImage.rejected, (state, action) => {
            state.uploadStatus = 'failed';
            state.error = action.payload;
          })
          
          // Delete Shop Image
          .addCase(deleteShopImage.pending, (state) => {
            state.uploadStatus = 'loading';
            state.error = null;
          })
          .addCase(deleteShopImage.fulfilled, (state, action) => {
            state.uploadStatus = 'succeeded';
            state.data.shopImages = state.data.shopImages.filter(
                (image) => image.id !== action.payload
              );
          })
          .addCase(deleteShopImage.rejected, (state, action) => {
            state.uploadStatus = 'failed';
            state.error = action.payload;
          });
      },
    });
    
export const { resetStatus } = profileSlice.actions;
export default profileSlice.reducer;