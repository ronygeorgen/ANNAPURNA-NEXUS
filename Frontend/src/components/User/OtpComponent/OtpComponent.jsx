import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner'
import { Lock, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

const OtpComponent = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract data from location state
  const shop = location.state?.shop;
  const cardDetails = location.state?.cardDetails;
  const cardNumber = cardDetails?.card_number || 'N/A';
  const phoneNumber = cardDetails?.mobile_number || 'N/A';

  // Get user email from Redux store
  const userEmail = useSelector((state) => state.auth.user?.email);
  

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Input change handler
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Backspace navigation between inputs
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs[index - 1].current.focus();
    }
  };

  // Send OTP handler
  const handleSendOTP = async () => {
    if (!canResend) return;

    try {
      await api.post('/ration-card/send-otp/', {
        'user_email': userEmail,
        'card_number': cardNumber,
        'phone_number': phoneNumber
      });
      
      toast.success('OTP sent successfully');
      // Reset timer and disable resend
      setRemainingTime(30);
      setCanResend(false);
      
      // Reset OTP inputs
      setOtp(['', '', '', '']);
      
      // Focus on first input
      inputRefs[0].current.focus();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      console.log('error message = ',errorMessage);
      toast.error(errorMessage);
    }
  };

  // Verify OTP handler
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await api.post('/ration-card/verify-otp/', {
        'user_email': userEmail,
        'card_number': cardNumber,
        'otp': otpString
      });

      toast.success('OTP Verified Successfully');
      
      // Navigate to next page or perform success action
      navigate('/home/selected-shop/choose-subsidies/', { 
        state: { 
          shop, 
          cardDetails 
        } 
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Invalid OTP';
      const remainingAttempts = error.response?.data?.remaining_attempts;

      if (remainingAttempts !== undefined) {
        toast.error(`${errorMessage}. Remaining attempts: ${remainingAttempts}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-center">OTP Verification</h2>
            <p className="text-gray-500 text-center mt-2">
              Enter the 4-digit OTP sent to {phoneNumber}
            </p>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            {otp.map((digit, index) => (
              <Input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={inputRefs[index]}
                className="w-12 h-12 text-center text-2xl border-2 border-orange-200 focus:border-orange-500 rounded-lg"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || otp.join('').length !== 4}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isVerifying ? (
              <span className="flex items-center">
                Verifying...
                <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : (
              <span className="flex items-center">
                Verify OTP
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            )}
          </Button>

          <div className="mt-4 text-center">
            {!canResend ? (
              <p className="text-gray-500 flex items-center justify-center">
                Resend OTP in {remainingTime} seconds
              </p>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleSendOTP}
                className="text-orange-500 hover:text-orange-600 flex items-center justify-center w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend OTP
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpComponent;