import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Camera } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const ScanningEffect = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 border-4 border-orange-500 animate-pulse"></div>
      <div className="absolute left-0 right-0 h-1 bg-orange-500 animate-scan"></div>
    </div>
  );
};

const FaceAuthenticationComponent = () => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [error2, setError2] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [authenticationSuccess, setAuthenticationSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = useSelector((state) => state.auth.user?.email);
  const shop = location.state?.shop;
  const cardDetails = location.state?.cardDetails;
  const cardNumber = cardDetails?.card_number || 'N/A';
  const phoneNumber = cardDetails?.mobile_number || 'N/A';

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (webcamRef.current && webcamRef.current.stream) {
      webcamRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendOTP = async () => {
    try {
      await api.post('/ration-card/send-otp/', {
        user_email: userEmail,
        card_number: cardNumber,
        phone_number: phoneNumber
      });
      
      toast.success('OTP sent successfully');
      navigate('/home/selected-shop/otp/', {
        state: {
          shop: shop,
          cardDetails: cardDetails
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const captureVideoAuthentication = async () => {
    setIsCapturing(true);
    setError(null);
    setIsAuthenticated(null);
    setCountdown(3);

    const videoConstraints = {
      width: 640,
      height: 480,
      facingMode: "user"
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      
      // Store the stream for potential cleanup
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        
        const formData = new FormData();
        formData.append('live_video', videoBlob, 'captured_video.webm');
        formData.append('card_number', cardNumber);

        setIsCapturing(false);
        setIsVerifying(true);

        try {
          const response = await api.post('/ration-card/face-auth/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setIsAuthenticated(true);
          setAuthenticationSuccess(true);
          
          // Stop media stream before navigation
          stopMediaStream();

          setTimeout(() => {
            navigate('/home/selected-shop/choose-subsidies/',{
              state: {
                shop,
                cardDetails
              }
            });
          }, 3000);
        } catch (err) {
          setIsAuthenticated(false);
          setError(err.response.data.error || 'Authentication failed');
          setError2(err.response.data.reason || 'Authentication failed');
          setAttempts(prevAttempts => prevAttempts + 1);
        } finally {
          setIsVerifying(false);
        }
      };

      mediaRecorder.start();
      
      // Start the countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount === 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);

      setTimeout(() => {
        mediaRecorder.stop();
        clearInterval(countdownInterval);
      }, 3000);
    } catch (err) {
      setError('Failed to access camera');
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    // Cleanup function to stop media stream when component unmounts
    return () => {
      stopMediaStream();
    };
  }, []);

  if (attempts >= 3) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Authentication Failed</h2>
          <p className="mt-2 text-sm text-gray-600">You've reached the maximum number of attempts.</p>
          <button
            onClick={handleSendOTP}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Try OTP Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Face Authentication</h2>
          {!authenticationSuccess && !isVerifying && (
            <p className="mt-2 text-sm text-gray-600">Please look at the camera for 3 seconds</p>
          )}
        </div>
        {authenticationSuccess ? (
          <div className="mt-8 bg-white shadow-lg rounded-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <p className="mt-4 text-lg font-semibold text-green-800">Face Authentication Successful</p>
            <p className="mt-2 text-sm text-gray-600">Redirecting to choose subsidies...</p>
          </div>
        ) : !isVerifying ? (
          <div className={`mt-8 bg-white shadow-lg rounded-lg overflow-hidden relative ${
            isAuthenticated === true ? 'ring-4 ring-green-500' :
            isAuthenticated === false ? 'ring-4 ring-red-500' : ''
          }`}>
            <div className="relative">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
                className="w-full h-64 object-cover"
              />
              {isCapturing && <ScanningEffect />}
            </div>
            <div className="p-4">
              <button
                onClick={captureVideoAuthentication}
                disabled={isCapturing}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isCapturing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                }`}
              >
                {isCapturing ? (
                  `Capturing ends in ${countdown}` 
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Authenticate Face
                  </>
                )}
              </button>
              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">{error2}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-lg font-semibold">Verifying, please wait...</p>
          </div>
        )}
        {isAuthenticated === false && !isVerifying && (
          <div className="mt-4 p-4 rounded-md bg-red-100 text-red-800">
            <div className="flex items-center justify-center">
              <XCircle className="h-6 w-6 mr-2" />
              <p className="text-lg font-medium">Authentication Failed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceAuthenticationComponent;