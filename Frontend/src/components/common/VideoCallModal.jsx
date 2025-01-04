
// VideoCallModal.jsx
import React, { useEffect, useRef, useState } from 'react';

const VideoCallModal = ({ 
  isOpen, 
  onClose, 
  localStream, 
  remoteStream, 
  isReceivingCall,
  onAcceptCall,
  onRejectCall,
  callerName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex flex-col space-y-4">
          {/* Video Streams */}
          <div className="grid grid-cols-2 gap-4 h-[400px]">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={node => node && (node.srcObject = localStream)}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                You
              </span>
            </div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={node => node && (node.srcObject = remoteStream)}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                Remote
              </span>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            {isReceivingCall ? (
              <>
                <button
                  onClick={onAcceptCall}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={onRejectCall}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                End Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;