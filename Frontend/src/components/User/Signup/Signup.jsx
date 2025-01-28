import React, { useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { SignupSchema } from '../../../utils/validationSchemas';
import FormInput from '../../common/FormInput';
import Button from '../../common/Button';
import GradientBackground from '../../common/GradientBackground';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../../../features/auth/authSlice';
import SignupOtp from '../SignupOtp/SignupOtp';
import api from '../../../services/api';


const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOTP, setShowOTP] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  console.log('Signup -> userData', userData);
  console.log('Signup -> showOTP', showOTP);
  

    const handleGoogleSuccess = (credentialResponse) => {
      dispatch(googleLogin(credentialResponse.credential))
        .unwrap()
        .then((response) => {
          if (response.user) {
            navigate('/');
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

    if (showOTP) {
      return <SignupOtp user_id={userData.id} email={userData.email} />;
    }
  

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-col justify-center w-1/2 p-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-500">an.</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Explore</h2>
          <h2 className="text-3xl font-bold text-orange-500">ANNAPURNA NEXUS</h2>
          <p className="text-gray-600 mt-2">Welcome, Please create your account.</p>
        </div>
        
        <Formik
          initialValues={{ email: '', password: '', repeatPassword: '' }}
          validationSchema={SignupSchema}
          onSubmit={ async (values, { setSubmitting }) => {
            try {
              setIsLoading(true);
              const response = await api.post('/user/register/', {
                email: values.email,
                password: values.password
              });

              console.log('Registration response:', response.data.user);
              
              
              setUserData(response.data.user);
              setShowOTP(true);
              toast.success('Registration successful');
            } catch (error) {
              toast.error(error.response?.data?.message || 'Registration failed!');
              console.error('Registration failed:', error);
            } finally {
              setIsLoading(false);
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <FormInput name="email" type="email" label="Your Email" />
              <FormInput name="password" type="password" label="Password" />
              <FormInput name="repeatPassword" type="password" label="Repeat Password" />
              <div className="flex items-center justify-between">
                <Button type="submit" variant="solid" disabled={isSubmitting || isLoading}>
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </Button>
                <p>Already have an account? <Link to="/login" className='text-blue-500'>Login</Link></p>
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

export default Signup;