import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { LoginSchema } from '../../../utils/validationSchemas';
import FormInput from '../../common/FormInput';
import Button from '../../common/Button';
import GradientBackground from '../../common/GradientBackground';
import { loginuser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-col justify-center w-1/2 p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-500">an.</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <h2 className="text-3xl font-bold text-orange-500">ANNAPURNA NEXUS</h2>
          <p className="text-gray-600 mt-2">Please login to your account.</p>
        </div>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={(values, { setSubmitting }) => {
            dispatch(loginuser({ email: values.email, password: values.password }))
              .unwrap()
              .then((response) => {
                console.log('Login response:', response);
                if (response.user) {
                  navigate('/home');
                } else {
                  console.error('Login successful but no user data received');
                }
              })
              .catch((error) => {
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
                <Button type="submit" variant="solid" disabled={isSubmitting || isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <p>Don't have an account? <Link to="/signup" className='text-blue-500'>Sign up</Link></p>
              </div>
            </Form>
          )}
        </Formik>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <a
                href="#"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
                </svg>
                Google
              </a>
            </div>
            <div>
              <a
                href="#"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
      <GradientBackground />
    </div>
  );
};

export default Login;
