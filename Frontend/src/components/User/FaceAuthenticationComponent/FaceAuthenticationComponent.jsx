import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../../../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Camera } from 'lucide-react';

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
  const [error, setError] = useState(null);
  const [error2, setError2] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const location = useLocation();
  const shop = location.state?.shop;
  const cardDetails = location.state?.cardDetails;
  const cardNumber = cardDetails?.card_number || 'N/A';

  const captureVideoAuthentication = async () => {
    setIsCapturing(true);
    setError(null);
    setIsAuthenticated(null);

    const videoConstraints = {
      width: 640,
      height: 480,
      facingMode: "user"
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        
        const formData = new FormData();
        formData.append('live_video', videoBlob, 'captured_video.webm');
        formData.append('card_number', cardNumber);

        try {
          const response = await api.post('/ration-card/face-auth/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setIsAuthenticated(true);
          // Handle successful response
        } catch (err) {
          setIsAuthenticated(false);
          setError(err.response.data.error || 'Authentication failed');
          setError2(err.response.data.reason || 'Authentication failed');
        } finally {
          setIsCapturing(false);
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 3000); // Record for 3 seconds
    } catch (err) {
      setError('Failed to access camera');
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    // Clean up function to stop all media tracks when component unmounts
    return () => {
      if (webcamRef.current && webcamRef.current.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Face Authentication</h2>
          <p className="mt-2 text-sm text-gray-600">Please look at the camera for 3 seconds</p>
        </div>
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
                'Capturing...'
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Authenticate Face
                </>
              )}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error} : {error2}</p>
            )}
            {isAuthenticated !== null && (
              <div className={`mt-4 p-3 rounded-md ${
                isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="flex items-center">
                  {isAuthenticated ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <p className="text-sm font-medium">
                    {isAuthenticated ? 'Authentication Successful' : 'Authentication Failed'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center mt-4">
          <Link to="/" className="font-medium text-orange-600 hover:text-orange-500">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FaceAuthenticationComponent;

