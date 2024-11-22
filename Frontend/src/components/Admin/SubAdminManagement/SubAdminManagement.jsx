import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { Users, Plus, Edit, Trash2, Search, BarChart3, ShoppingCart, Settings, LogOut } from 'lucide-react';
import Button from '../../common/Button';
import FormInput from '../../common/FormInput';
import { SignupSchema } from '../../../utils/validationSchemas';
import api from '../../../services/api';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';
import { toast } from 'react-toastify';


function SubAdminManagement() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await dispatch(logoutUser()).unwrap();
        navigate('/admin-login');
        toast.success('Logout successful!')
    } catch (error) {
      const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
      toast.error(`Login failed: ${errorMessage} `)
        console.error("Logout failed", error);
    }
  };

  const handleSubmit = async (values, { resetForm, setSubmitting, setStatus }) => {
    try {
      const response = await api.post('/user/create-sub-admin/', {
        email: values.email,
        password: values.password,
      });
      const newSubAdmin = response.data.sub_admin;
      setSubAdmins([...subAdmins, newSubAdmin]);
      resetForm();
      setStatus({ success: 'Sub-admin created successfully!' });
      toast.success('Sub-admin created successfully!')
    } catch (error) {
      setStatus({ error: error.response.data.error || 'Failed to create sub-admin' });
      toast.error(error?.response?.data?.error || 'Failed to create sub-admin')
    } finally {
      setSubmitting(false);
    }
  };

  

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await api.get('/ration-shop/sub-admins/');
        console.log('Sub-admins fetched:', response.data);

        const filteredAdmins = response.data.filter(admin => admin.value !== '');
        setSubAdmins(filteredAdmins);
      } catch (error) {
        console.error('Failed to fetch sub-admins:', error);
        toast.error('Failed to fetch sub-admins');
      }
    };

    fetchSubAdmins();
  }, []);

  const filteredSubAdmins = subAdmins.filter(admin => 
    admin.label.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
      <AdminAside handleLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-auto">
        <AdminHeader/>
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Sub-Admin Management</h1>
        </header>

        <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg p-6 mb-8 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Sub-Admins</h2>
            <div className="relative">
            <input
                type="text"
                placeholder="Search sub-admins..."
                className="bg-teal-700 bg-opacity-50 text-white placeholder-teal-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-teal-300" />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-teal-300 border-b border-teal-600">
                <th className="py-2">Email</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
                {filteredSubAdmins.length > 0 ? (
                  filteredSubAdmins.map((admin) => (
                    <tr key={admin.value} className="border-b border-teal-700 text-white hover:bg-teal-700 hover:bg-opacity-50 transition-colors">
                      <td className="py-3">{admin.label}</td>
                      <td className="py-3 flex gap-2">
                        <button className="text-teal-300 hover:text-white p-1 rounded hover:bg-teal-600">
                          <Edit size={18} />
                        </button>
                        <button className="text-teal-300 hover:text-red-400 p-1 rounded hover:bg-teal-600">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-teal-300">
                      No sub-admins found
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>

        <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-4 text-white">Create New Sub-Admin</h2>
          <Formik
            initialValues={{ email: '', password: '', repeatPassword: '' }}
            validationSchema={SignupSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, status }) => (
              <Form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormInput label="Email" name="email" type="email" className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" labelClass="text-teal-300 mb-1" />
                  <FormInput label="Password" name="password" type="password"  className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" labelClass="text-teal-300 mb-1" />
                </div>
                <FormInput label="Repeat Password" name="repeatPassword" type="password" className="w-full bg-teal-700 bg-opacity-50 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" labelClass="text-teal-300 mb-1" />
                <Button type="submit" variant="solid" className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors flex items-center" disabled={isSubmitting}>
                  <Plus size={18} className="mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Sub-Admin'}
                </Button>
                {/* {status && status.success && (
                  <div className="mt-2 text-green-400">{status.success}</div>
                )} */}
                {/* {status && status.error && (
                  <div className="mt-2 text-red-400">{status.error}</div>
                )} */}
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  );
}

export default SubAdminManagement;
