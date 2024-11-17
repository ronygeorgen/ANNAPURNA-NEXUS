import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { LoginSchema } from '../../../utils/validationSchemas';
import FormInput from '../../common/FormInput';
import Button from '../../common/Button';
import { subAdminLogin } from '../../../features/auth/authSlice'; 
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';


function SubAdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-full max-w-md m-auto bg-white rounded-lg shadow-default py-10 px-16">
        <div className="flex items-center mb-6">
          <svg className="w-10 h-10 mr-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#38B2AC" strokeWidth="10"/>
            <path d="M50 25L75 75H25L50 25Z" fill="#F6AD55"/>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800">ANNAPURNA NEXUS</h1>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
        <p className="text-gray-600 mb-6">Start your website in seconds.</p>
        

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={(values, { setSubmitting }) => {
            dispatch(subAdminLogin({ email: values.email, password: values.password }))
              .unwrap()
              .then((response) => {
                console.log('Login response:', response);
                if (response.sub_admin && response.sub_admin.is_subadmin) {
                  navigate('/sub-admin-dashboard');
                  toast.success('Login successfull')
                } else {
                  toast.error('Login successful but no sub-admin data received')
                  console.error('Login successful but no sub-admin data received');
                }
              })
              .catch((error) => {
                const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
                toast.error(`Login failed: ${errorMessage} `)
                console.error('Login failed:', error);
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <FormInput name="email" type="email" label="Your Email" />
              <FormInput name="password" type="password" label="Password" />
              <div className="flex items-center justify-between">
                <Button type="submit" variant="solid" className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50" disabled={isSubmitting || isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default SubAdminLogin;