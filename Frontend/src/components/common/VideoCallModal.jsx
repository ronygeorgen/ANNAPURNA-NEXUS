import React, { useEffect, useRef } from 'react';

const VideoCallModal = ({ 
  isOpen, 
  onClose, 
  localStream, 
  remoteStream, 
  isReceivingCall,
  isCalling,
  onAcceptCall,
  onRejectCall,
  callerName 
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // For local video
  useEffect(() => {
    const setupLocalVideo = async () => {
      if (localVideoRef.current && localStream) {
        console.log('Setting up local video...');
        try {
          localVideoRef.current.srcObject = null;
          localVideoRef.current.srcObject = localStream;
          
          // Ensure tracks are enabled
          localStream.getTracks().forEach(track => {
            console.log(`Local ${track.kind} track:`, {
              enabled: track.enabled,
              readyState: track.readyState
            });
            track.enabled = true;
          });

          try {
            await localVideoRef.current.play();
            console.log('Local video playing successfully');
          } catch (playError) {
            console.error('Local video play error:', playError);
          }
        } catch (err) {
          console.error('Local video setup error:', err);
        }
      }
    };

    setupLocalVideo();
  }, [localStream]);

  // For remote video
  useEffect(() => {
    const setupRemoteVideo = async () => {
      if (remoteVideoRef.current && remoteStream) {
        console.log('Setting up remote video...');
        console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState
        })));

        try {
          // Clear existing srcObject
          remoteVideoRef.current.srcObject = null;
          
          // Ensure tracks are enabled
          remoteStream.getTracks().forEach(track => {
            console.log(`Remote ${track.kind} track:`, {
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted
            });
            track.enabled = true;
          });

          // Set new srcObject
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1.0;

          try {
            await remoteVideoRef.current.play();
            console.log('Remote video playing successfully');
          } catch (playError) {
            console.error('Remote video play error:', playError);
          }
        } catch (err) {
          console.error('Remote video setup error:', err);
        }
      }
    };

    setupRemoteVideo();
  }, [remoteStream]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative w-full h-[300px] bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-contain"
                style={{ transform: 'scaleX(-1)', backgroundColor: 'black' }}
              />
              <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                You {localStream?.getVideoTracks()[0]?.enabled ? '(Video On)' : '(Video Off)'}
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative w-full h-[300px] bg-gray-900 rounded-lg overflow-hidden">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ backgroundColor: 'black' }}
                  />
                  <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {callerName || 'Remote'} {remoteStream?.getVideoTracks()[0]?.enabled ? '(Video On)' : '(Video Off)'}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  {isCalling ? 'Calling...' : isReceivingCall ? 'Incoming call...' : 'Waiting for remote stream...'}
                </div>
              )}
            </div>
          </div>

          {/* Stream Status Indicators */}
          {/* <div className="flex justify-center space-x-4 text-sm">
            <div className={`px-2 py-1 rounded ${localStream ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              Local: {localStream ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`px-2 py-1 rounded ${remoteStream ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              Remote: {remoteStream ? 'Connected' : 'Disconnected'}
            </div>
          </div> */}

          {/* Debug Information */}
          {/* <div className="text-xs text-gray-500 space-y-1"> */}
            {/* <p>Local Tracks: {localStream?.getTracks().length || 0}</p>
            <p>Remote Tracks: {remoteStream?.getTracks().length || 0}</p> */}
            {/* {remoteStream?.getTracks().map((track, i) => (
              <p key={i}>
                Remote {track.kind}: enabled={String(track.enabled)} state={track.readyState}
              </p>
            ))}
          </div> */}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {isReceivingCall ? (
              <>
                <button
                  onClick={onAcceptCall}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none"
                >
                  Accept
                </button>
                <button
                  onClick={onRejectCall}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 focus:outline-none"
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 focus:outline-none"
              >
                {isCalling ? 'Cancel Call' : 'End Call'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;