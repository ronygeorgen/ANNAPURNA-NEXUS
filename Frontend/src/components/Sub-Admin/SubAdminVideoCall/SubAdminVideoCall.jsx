// SubAdminVideoCall.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import VideoCallManager from '../../common/VideoCallManager';
import VideoCallModal from '../../common/VideoCallModal';
import { useSelector } from 'react-redux';

const SubAdminVideoCall = ({ shopId }) => {
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerName, setCallerName] = useState('');
  const user = useSelector(state => state.auth.user);
  const audioRef = useRef(new Audio('/Audio/Ringingtone.mp3'));
  
  const videoCall = VideoCallManager({
    userId: user?.id,
    shopId: shopId,
    isAdmin: false,
    email: user?.email
  });

  // Ring tone for incoming calls
  useEffect(() => {
    if (videoCall.isReceivingCall) {
      // Play with user interaction handling
      const playAudio = async () => {
        try {
          audioRef.current.loop = true;
          await audioRef.current.play();
        } catch (err) {
          console.log('Audio playback failed:', err);
        }
      };
      playAudio();
    }

    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, [videoCall.isReceivingCall]);

  return (
    <>
      {/* Incoming Call Notification */}
      {videoCall.isReceivingCall && !videoCall.isCallActive && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 animate-bounce">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-2 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Incoming Call</h3>
              <p className="text-sm text-gray-600">Admin is calling...</p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={videoCall.acceptCall}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={videoCall.rejectCall}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Call Status Indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
          videoCall.isCallActive ? 'bg-green-500' : 'bg-gray-500'
        } text-white`}>
          {videoCall.isCallActive ? (
            <>
              <Phone className="w-4 h-4" />
              <span>In Call</span>
            </>
          ) : (
            <>
              <PhoneOff className="w-4 h-4" />
              <span>Ready for Calls</span>
            </>
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoCall.isCallActive || videoCall.isReceivingCall}
        onClose={videoCall.endCall}
        localStream={videoCall.localStream}
        remoteStream={videoCall.remoteStream}
        isReceivingCall={videoCall.isReceivingCall}
        onAcceptCall={videoCall.acceptCall}
        onRejectCall={videoCall.rejectCall}
        callerName="Admin"
      />
    </>
  );
};

export default SubAdminVideoCall;