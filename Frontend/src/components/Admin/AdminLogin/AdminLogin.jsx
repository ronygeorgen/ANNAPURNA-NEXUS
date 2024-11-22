import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { LoginSchema } from '../../../utils/validationSchemas'
import FormInput from '../../common/FormInput';  
import Button from '../../common/Button';  
import { adminLogin } from '../../../features/auth/authSlice';  
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  return (
    <div className="flex h-screen bg-teal-900">
      <div className="w-1/2 flex items-center justify-center border-r border-teal-800">
        <div className="text-white flex flex-col items-center">
          <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z" fill="#38B2AC"/>
            <path d="M65 35L50 65L35 35H65Z" fill="#F6AD55"/>
          </svg>
          <h1 className="text-4xl mt-4 font-bold text-center">ANNAPURNA NEXUS</h1>
        </div>
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <div className="w-2/3">
          <h2 className="text-4xl text-white mb-2">Welcome</h2>
          <p className="text-teal-300 mb-8">Please login to Admin Dashboard.</p>
          
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}  
            onSubmit={(values, { setSubmitting }) => {
              dispatch(adminLogin({ email: values.email, password: values.password }))
                .unwrap()
                .then((response) => {
                  if (response.admin && response.admin.is_superadmin) {
                    navigate('/admin-dashboard');  
                    toast.success('Login successful!')
                  } else {
                    console.error('Not authorized as an admin');
                    toast.error('Not an authorized user')
                  }
                })
                .catch((error) => {
                  toast.error('Login Failed')
                  console.error('Admin login failed:', error);
                })
                .finally(() => {
                  setSubmitting(false);
                });
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <FormInput name="email" type="email" label="Your Email" labelClass="text-white"/>
                <FormInput name="password" type="password" label="Password" labelClass="text-white"/>
                <div className="flex items-center justify-between">
                  <Button type="submit" variant="solid" className="w-full p-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors" disabled={isSubmitting || isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
