import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api from "../../../services/api"

const SignupOtp = ({ user_id, email }) => {

  console.log('SignupOtp rendered with:', { user_id, email });

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [timer, setTimer] = useState(30)
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const navigate = useNavigate()

  useEffect(() => {
    if (!user_id || !email) {
      console.error('Missing required props:', { user_id, email });
      navigate('/signup');
      return;
    }
  }, [user_id, email, navigate]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0))
    }, 1000)

    return () => clearInterval(countdown)
  }, [])

  const handleChange = (index, value) => {
    if (isNaN(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value !== "" && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    
    try {
      setIsVerifying(true);
      const response = await api.post('/user/verify-otp/', {
        user_id: user_id,
        otp: enteredOtp
      });
      
      toast.success("Email verified successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/user/resend-otp/', {
        user_id: user_id
      });
      setTimer(30);
      toast.success("New OTP sent to your email");
    } catch (error) {
      if (error.response?.data?.wait_time) {
        toast.error(`Please wait ${error.response.data.wait_time} seconds`);
      } else {
        toast.error("Failed to resend OTP");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h1 className="text-4xl font-bold text-center text-orange-500 mb-2">an.</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a code to {email}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>
          <div>
            <button
              type="submit"
              disabled={isVerifying || otp.some(digit => !digit)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 ease-in-out disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-sm text-gray-600">Resend OTP in {timer} seconds</p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-orange-600 hover:text-orange-500 focus:outline-none focus:underline transition ease-in-out duration-150"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupOtp;