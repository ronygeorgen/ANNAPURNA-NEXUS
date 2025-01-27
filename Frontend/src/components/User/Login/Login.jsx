import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { LoginSchema } from '../../../utils/validationSchemas';
import FormInput from '../../common/FormInput';
import Button from '../../common/Button';
import GradientBackground from '../../common/GradientBackground';
import { loginuser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../../../features/auth/authSlice';


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleGoogleSuccess = (credentialResponse) => {
    dispatch(googleLogin(credentialResponse.credential))
      .unwrap()
      .then((response) => {
        if (response.user) {
          navigate('/home');
          toast.success('Google login successful');
        }
      })
      .catch((error) => {
        toast.error('Google login failed');
        console.error('Google login error:', error);
      });
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-col justify-center w-1/2 p-12 px-44">
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
                  toast.success('Login successful')
                } else {
                  toast.error('Login successful but no user data received')
                  console.error('Login successful but no user data received');
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
          <div className="mt-6 text-center w-full flex justify-center items-center space-x-4  ">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </div>
        </div>
      </div>
      <GradientBackground />
    </div>
  );
};

export default Login;
