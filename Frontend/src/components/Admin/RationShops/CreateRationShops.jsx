import React, { useEffect, useState } from 'react';
import { Search, Bell, ChevronDown, MapPin, Phone, User, Store } from 'lucide-react';
import { Formik, Form } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../features/auth/authSlice';
import Button from '../../common/Button';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';
import { RationShopSchema } from '../../../utils/validationSchemas';
import api from '../../../services/api';

function CreateRationShop() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([
    { value: '', label: 'Select an owner' }
  ]);

  useEffect(() => {
    // Fetch sub-admin list when component mounts
    const fetchOwners = async () => {
      try {
        const response = await api.get('/ration-shop/sub-admins/');
        console.log('checking vaalues',response);
        
        setOwners([
          { value: '', label: 'Select an owner' },
          ...response.data
        ]);
      } catch (error) {
        console.error('Failed to fetch owners:', error);
      }
    };

    fetchOwners();
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/admin-login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
      try {
        const response = await api.post('/ration-shop/create/',{
            shopName: values.shopName,
            ownerId: values.ownerId,
            mobileNumber: values.mobileNumber,
            location: values.location
          });
        setStatus({ success: response.data.message });
      } catch (error) {
        setStatus({ error: error.response.data.error || 'Failed to create ration shop' });
      } finally {
        setSubmitting(false);
      }
    };


  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
      <AdminAside handleLogout={handleLogout} />

      <main className="flex-1 p-8">
        <AdminHeader/>

        <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Store className="mr-2" /> Create New Ration Shop
          </h2>

          <Formik
            initialValues={{
              shopName: '',
              ownerId: '',
              mobileNumber: '',
              location: '',
            }}
            validationSchema={RationShopSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form className="space-y-6">
                  <FormInput
                    name="shopName"
                    label="Shop Name"
                    type="text"
                    placeholder="Enter shop name"
                    className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    labelClass="text-teal-300 mb-2"
                  />

                <FormSelect
                  name="ownerId"
                  label="Select Owner"
                  options={owners}
                  className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  labelClass="text-teal-300 mb-2"
                />

                <FormInput
                  name="mobileNumber"
                  label="Mobile Number"
                  type="tel"
                  placeholder="Enter mobile number"
                  className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  labelClass="text-teal-300 mb-2"
                />

                <FormInput
                  name="location"
                  label="Choose Location"
                  type="text"
                  placeholder="Enter location"
                  className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  labelClass="text-teal-300 mb-2"
                />

                <Button
                  type="submit"
                  variant="solid"
                  className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Ration Shop'}
                </Button>

                {status?.success && (
                  <div className="mt-4 p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded text-green-400">
                    {status.success}
                  </div>
                )}
                {status?.error && (
                  <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-400">
                    {status.error}
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  );
}

export default CreateRationShop;