import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { uploadToCloudinary } from "../../services/cloudinaryConfig";

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
        const profileResponse = await api.get('/ration-shop/profile/');
        return profileResponse.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const uploadProfilePicture = createAsyncThunk(
    'profile/uploadProfilePicture',
    async (imageData, { rejectWithValue }) => {
      console.log('imagedata in slice: ',imageData)
      try {
        const response = await api.post('/ration-shop/profile/upload_picture/', {
          profile_picture: imageData.cloudinaryUrl,
          cloudinary_public_id: imageData.cloudinaryPublicId
        }, {
          withCredentials: true
        });
        // After successful upload, update the profile data in the state
      const profileResponse = await api.get('/ration-shop/profile/');
      return profileResponse.data;
      
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


export const uploadShopImage = createAsyncThunk(
  'profile/uploadShopImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      // Upload to Cloudinary first
      const cloudinaryResponse = await uploadToCloudinary(imageFile);

      // Send Cloudinary URL to backend
      const response = await api.post('/ration-shop/profile/upload_shop_image/', {
        image_url: cloudinaryResponse.url,
        cloudinary_public_id: cloudinaryResponse.public_id
      }, {
        withCredentials: true
      });

      return {
        id: response.data.id, // Assuming backend returns an ID
        url: cloudinaryResponse.url
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


  export const deleteShopImage = createAsyncThunk(
    'profile/deleteShopImage',
    async (imageId, { rejectWithValue }) => {
      try {
        await api.delete(`/ration-shop/profile/delete_shop_image/${imageId}/`, { withCredentials: true });
        return imageId;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        data: {
            ownerEmail:'',
            ownerName: '',
            shopID: '',
            shopName: '',
            shopDescription: '',
            location: '',
            profilePicture: null,
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
            state.data = {
              ownerEmail: action.payload.owner_details.email,
              ownerName: action.payload.owner_details.owner_name,
              shopID: action.payload.shop_id,
              shopName: action.payload.shopName,
              shopDescription: action.payload.shopDescription,
              location: action.payload.location,
              profilePicture: action.payload.profile_picture,
              shopImages: action.payload.shop_images,
              isOpen: action.payload.isOpen,
            };
            
            
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
            state.data = {
              ownerEmail: action.payload.owner_details.email,
              ownerName: action.payload.owner_details.owner_name,
              shopID: action.payload.shop_id,
              shopName: action.payload.shopName,
              shopDescription: action.payload.shopDescription,
              location: action.payload.location,
              profilePicture: action.payload.profile_picture,
              shopImages: action.payload.shop_images,
              isOpen: action.payload.isOpen,
            };

          })
          .addCase(updateProfile.rejected, (state, action) => {
            state.updateStatus = 'failed';
            state.error = action.payload;
          })
          
          // Upload Profile Picture
          .addCase(uploadProfilePicture.pending, (state) => {
            state.uploadStatus = 'loading';
            state.error = null;
          })
          .addCase(uploadProfilePicture.fulfilled, (state, action) => {
            state.uploadStatus = 'succeeded';
            state.data = {
              ownerEmail: action.payload.owner_details.email,
              ownerName: action.payload.owner_details.owner_name,
              shopID: action.payload.shop_id,
              shopName: action.payload.shopName,
              shopDescription: action.payload.shopDescription,
              location: action.payload.location,
              profilePicture: action.payload.profile_picture,
              shopImages: action.payload.shop_images,
              isOpen: action.payload.isOpen,
            };
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
            // Add the new image to the array
            state.data.shopImages.push({
              id: action.payload.id,
              url: action.payload.url
            });
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