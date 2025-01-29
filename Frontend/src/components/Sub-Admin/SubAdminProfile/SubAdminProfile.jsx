import React, { useState, useEffect } from 'react'
import { Formik, Form, Field } from 'formik'
import { Home, CreditCard, ShoppingBag, Package, Store, Bell, Phone, User, Search, Settings, Edit2, MapPin, Upload, Power, LogOut } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import SubAdminAside from '../SubAdminAside/SubAdminAside'
import { logoutUser } from '../../../features/auth/authSlice';
import ProfilePictureUpload from '../SubAdminProfilePictureUpload/SubAdminProfilePictureUpload'
import { fetchProfile, updateProfile, uploadProfilePicture, uploadShopImage, deleteShopImage, resetStatus } from '../../../features/sub-admin-profile/profileSlice'
import { ProfileSchema } from '../../../utils/validationSchemas'
import { toast } from 'sonner';


function SubAdminProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const dispatch = useDispatch();
  const navigate = useNavigate();

   // Get profile data from Redux store
   const { data: profile,uploadStatus, status, error } = useSelector((state) => state.profile);

  

  // Fetch profile data on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetStatus());
    }
  }, [error, dispatch]);

  const handleProfileSubmit = async (values) => {
    try {
      const updateData = {
        shopName: values.shopName,
        shopDescription: values.shopDescription,
        location: values.location,
        ownerName: values.ownerName,
        isOpen: profile.isOpen,
      };
      await dispatch(updateProfile(updateData)).unwrap();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

 

  const handleToggleShopStatus = async () => {
    try {
      const updatedData = { isOpen: !profile.isOpen }; // Toggle the isOpen value
      await dispatch(updateProfile(updatedData)).unwrap();
      toast.success(`Shop is now ${!profile.isOpen ? 'open' : 'closed'}`);
    } catch (error) {
      toast.error('Failed to update shop status');
    }
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      await dispatch(uploadProfilePicture(file)).unwrap();
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    }
  };

  const handleShopImageUpload = async (file) => {
    try {
      if (profile.shopImages.length >= 3) {
        toast.error('Maximum 3 images allowed');
        return;
      }
      await dispatch(uploadShopImage(file)).unwrap();
      toast.success('Shop image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload shop image');
    }
  };

  const handleShopImageDelete = async (imageId) => {
    try {
      await dispatch(deleteShopImage(imageId)).unwrap();
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }


  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/sub-admin-login')
      toast.success('Logout successful!')
    } catch (error) {
      const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
      toast.error(`Logout failed: ${errorMessage} `)
      console.error("Logout failed", error)
    }
  }

  const renderShopImages = () => {
    return (
      <div className="grid grid-cols-3 gap-4 mb-4">
        {profile?.shopImages && profile.shopImages.length > 0 ? (
          profile.shopImages.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.url}
                alt="shop"
                className="w-full h-48 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => handleShopImageDelete(image.id)}
                disabled={uploadStatus === 'loading'}
                className={`absolute top-2 right-2 ${
                  uploadStatus === 'loading' 
                    ? 'bg-gray-400' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white p-1 rounded-full transition-colors`}
              >
                {uploadStatus === 'loading' ? '...' : '×'}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No shop images uploaded yet</p>
          </div>
        )}

        {(!profile?.shopImages || profile.shopImages.length < 3) && (
          <label className={`border-2 border-dashed border-gray-300 rounded flex items-center justify-center h-48 ${
            uploadStatus === 'loading' 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:border-teal-500'
          } transition-colors duration-200`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadStatus === 'loading'}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleShopImageUpload(e.target.files[0]);
                }
              }}
            />
            <div className="text-center">
              <Upload className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Upload Image</p>
              <p className="text-xs text-gray-400 mt-1">
                {profile?.shopImages ? 
                  `${3 - (profile.shopImages.length)} slots remaining` : 
                  'Upload up to 3 images'
                }
              </p>
            </div>
          </label>
        )}
      </div>
    );
  };



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - keeping the same as your dashboard */}
      <SubAdminAside handleLogout={handleLogout}/>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Profile</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <Settings className="text-gray-500 mr-4" />
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">{profile?.ownerName || profile?.ownerEmail}</span>
              {/* <span className="mr-2 text-xs text-gray-400">Sub-Admin</span> */}
              <img src={profile?.profilePicture?.url || "/api/placeholder/32/32"}  alt="Profile" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ProfilePictureUpload
                currentImage={profile?.profilePicture?.url || "/api/placeholder/100/100"}
                onImageChange={handleProfilePictureUpload}
              />
              <div className="ml-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">
                    {profile?.ownerName || profile?.ownerEmail}
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-teal-500 hover:text-teal-600"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-gray-500">Shop Owner</p>
              </div>
            </div>
              <button
                onClick={handleToggleShopStatus} 
                className={`px-4 py-2 rounded-full flex items-center ${
                  profile?.isOpen ? 'bg-green-500' : 'bg-red-500'
                } text-white`}
              >
                <Power className="mr-2" />
                {profile?.isOpen ? 'Open' : 'Closed'}
            </button>
          </div>


          <Formik
            initialValues={{
              ownerName:profile?.owner_details?.owner_name || '',
              shopName: profile?.shopName || '',
              shopDescription: profile?.shopDescription || '',
              location: profile?.location || '',
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleProfileSubmit}
            enableReinitialize
          >
            {({ values, errors, touched }) => (
              <Form>
                
                <div className="space-y-6">
                  {isEditing && (
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Owner Name</label>
                      <Field
                        name="ownerName"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
                        placeholder={profile?.ownerName}
                      />
                      {errors.ownerName && touched.ownerName && (
                        <div className="text-red-500 text-sm mt-1">{errors.ownerName}</div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Name</label>
                    {isEditing ? (
                      <div>
                      <Field
                        name="shopName"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
                      />
                      {errors.shopName && touched.shopName && (
                          <div className="text-red-500 text-sm mt-1">{errors.shopName}</div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">{values.shopName}</p>
                        
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Description</label>
                    {isEditing ? (
                      <div>
                      <Field
                        as="textarea"
                        name="shopDescription"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
                        rows="4"
                      />
                      {errors.shopDescription && touched.shopDescription && (
                        <div className="text-red-500 text-sm mt-1">{errors.shopDescription}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">{values.shopDescription}</p>
                  )}
                </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Location</label>
                    <div className="flex items-center">
                      <MapPin className="text-gray-400 mr-2" />
                      {isEditing ? (
                        <div className="flex-1">
                        <Field
                          name="location"
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-500"
                        />
                        {errors.location && touched.location && (
                            <div className="text-red-500 text-sm mt-1">{errors.location}</div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-600">{values.location}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Images</label>
                    {renderShopImages()}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  )
}

export default SubAdminProfile