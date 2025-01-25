import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserLocation } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const LocationPermission = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        await dispatch(updateUserLocation()).unwrap();
        navigate('/home');
      } catch (error) {
        console.error('Location permission error:', error);
        // Optional: Allow user to continue without location
        navigate('/home');
      }
    };

    requestLocationPermission();
  }, [dispatch, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <p>Getting your location...</p>
        <p className="text-sm text-gray-500">
          This helps us show nearby ration shops
        </p>
      </div>
    </div>
  );
};

export default LocationPermission;