import React, { useEffect, useRef, useState } from 'react';

const VideoCallManager = ({ userId, shopId, isAdmin, email }) => {
  const [ws, setWs] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false); // New state for outgoing calls
  const [currentCallData, setCurrentCallData] = useState(null);
  const peerConnection = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    const wsUrl = `ws://localhost:8004/ws/video/${shopId}/${userId}/?email=${email}&is_sub_admin=${!isAdmin}`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = handleWebSocketMessage;

    return () => {
      cleanupCall();
      if (websocket) {
        websocket.close();
      }
    };
  }, [shopId, userId, email, isAdmin]);

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setIsCallActive(false);
    setIsReceivingCall(false);
    setIsCalling(false);
    setCurrentCallData(null);
  };

  const handleWebSocketMessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      
      switch (data.type) {
        case 'call_request':
          // Handle incoming call
          if (data.caller_id && data.receiver_id) {
            // Check if this user is the intended receiver
            if (data.receiver_id.toString() === userId.toString()) {
              setCurrentCallData({
                roomId: `${data.caller_id}-${data.receiver_id}-${Date.now()}`,
                callerId: data.caller_id,
                receiverId: data.receiver_id
              });
              setIsReceivingCall(true);
              console.log('Incoming call detected, showing call window');
            }
          }
          break;
          
        case 'call_accepted':
          setIsCalling(false); // Hide the calling dialog
          setIsCallActive(true);
          await createPeerConnection();
          await createOffer();
          break;
          
        case 'call_declined':
          toast.error('Call was declined');
          cleanupCall();
          break;
          
        case 'call_ended':
          cleanupCall();
          break;

        case 'offer':
          if (data.offer) {
            await handleOffer(data.offer);
          }
          break;
          
        case 'answer':
          if (data.answer) {
            await handleAnswer(data.answer);
          }
          break;
          
        case 'ice_candidate':
          if (data.candidate) {
            await handleIceCandidate(data.candidate);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const createPeerConnection = async () => {
    try {
      peerConnection.current = new RTCPeerConnection(configuration);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && ws && currentCallData) {
          ws.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate,
            caller_id: currentCallData.callerId,
            receiver_id: currentCallData.receiverId
          }));
        }
      };

    } catch (error) {
      console.error('Error creating peer connection:', error);
      cleanupCall();
    }
  };

  const startCall = async (receiverId) => {
    if (!ws) {
      console.error('WebSocket not connected');
      return;
    }

    const roomId = `${userId}-${receiverId}-${Date.now()}`;
    setCurrentCallData({
      roomId,
      callerId: userId,
      receiverId
    });

    // Set calling state to show outgoing call dialog
    setIsCalling(true);

    // Send call request
    ws.send(JSON.stringify({
      type: 'call_request',
      caller_id: userId,
      receiver_id: receiverId
    }));
    
    console.log('Call request sent:', {
      type: 'call_request',
      caller_id: userId,
      receiver_id: receiverId
    });

    // Initialize local stream for the caller
    try {
      await createPeerConnection();
    } catch (error) {
      console.error('Error initializing call:', error);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!currentCallData) {
      console.error('No active call to accept');
      return;
    }

    try {
      ws.send(JSON.stringify({
        type: 'call_accepted',
        caller_id: currentCallData.callerId,
        receiver_id: currentCallData.receiverId
      }));

      await createPeerConnection();
      setIsReceivingCall(false);
      setIsCallActive(true);
    } catch (error) {
      console.error('Error accepting call:', error);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (!currentCallData) {
      console.error('No active call to reject');
      return;
    }

    ws.send(JSON.stringify({
      type: 'call_declined',
      caller_id: currentCallData.callerId,
      receiver_id: currentCallData.receiverId
    }));

    cleanupCall();
  };

  const endCall = () => {
    if (!currentCallData) {
      console.error('No active call to end');
      return;
    }

    ws.send(JSON.stringify({
      type: 'call_ended',
      caller_id: currentCallData.callerId,
      receiver_id: currentCallData.receiverId
    }));

    cleanupCall();
  };

  return {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream,
    remoteStream,
    isCallActive,
    isReceivingCall,
    isCalling, // Add this to the returned object
  };
};

export default VideoCallManager;