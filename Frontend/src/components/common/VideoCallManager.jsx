import React, { useEffect, useRef, useState } from 'react';

const VideoCallManager = ({ userId, shopId, isAdmin, email }) => {
  const [ws, setWs] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCallData, setCurrentCallData] = useState(null);
  const [isStreamInitialized, setIsStreamInitialized] = useState(false);
  const peerConnection = useRef(null);
  const wsRef = useRef(null);
  const currentCallDataRef = useRef(null);

  useEffect(() => {
    currentCallDataRef.current = currentCallData;
  }, [currentCallData]);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: [
          "turn:bn-turn2.xirsys.com:80?transport=udp",
          "turn:bn-turn2.xirsys.com:3478?transport=udp",
          "turn:bn-turn2.xirsys.com:80?transport=tcp",
          "turn:bn-turn2.xirsys.com:3478?transport=tcp",
          "turns:bn-turn2.xirsys.com:443?transport=tcp",
          "turns:bn-turn2.xirsys.com:5349?transport=tcp"
        ],
        username: "o8_s2lbVKiqxpNa5Ntw5kG_h7g9zYj-AbK49RHWtnH26b_exoUgSkD5MrvzAQkpMAAAAAGcrwiBzYXJhdGhz",
        credential: "90886c3c-9c74-11ef-8e6e-0242ac140004"
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  // Only initialize stream when starting or receiving a call
  const initializeLocalStream = async () => {
    if (isStreamInitialized && localStream?.active) return localStream;
    
    try {
      console.log('Requesting media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      console.log('Media permissions granted, tracks:', stream.getTracks().length);
      stream.getTracks().forEach(track => {
        track.enabled = true;
        console.log(`Track ${track.kind} enabled:`, track.enabled);
      });
      
      setLocalStream(stream);
      setIsStreamInitialized(true);
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  };

  // WebSocket setup
  useEffect(() => {
    const wsUrl = `wss://annapoornanexus.ronygeorge.online/ws/video/${shopId}/${userId}/?email=${email}&is_sub_admin=${!isAdmin}`;
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
      wsRef.current = websocket;
    };

    websocket.onmessage = handleWebSocketMessage;

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (websocket) {
        websocket.close();
      }
      cleanupCall();
    };
  }, [shopId, userId, email, isAdmin]);

  useEffect(() => {
    if (peerConnection.current) {
      const pc = peerConnection.current;
      
      const checkConnection = setInterval(() => {
        console.log('Connection Status:', {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          signalingState: pc.signalingState,
          hasRemoteStream: !!remoteStream,
          remoteStreamActive: remoteStream?.active,
          remoteTracks: remoteStream?.getTracks().length
        });
      }, 5000);
  
      return () => clearInterval(checkConnection);
    }
  }, [peerConnection.current, remoteStream]);

  const createPeerConnection = async () => {
    if (peerConnection.current?.connectionState === 'connected') {
      return peerConnection.current;
    }

    console.log('Creating new peer connection');
    const pc = new RTCPeerConnection(configuration);
    peerConnection.current = pc;

    // Add connection state logging
    pc.onconnectionstatechange = () => {
      console.log('Connection State:', pc.connectionState);
      console.log('ICE Connection State:', pc.iceConnectionState);
      console.log('ICE Gathering State:', pc.iceGatheringState);
      console.log('Signaling State:', pc.signalingState);
    };
  
    let stream;
    try {
      stream = localStream;
      if (!stream || !stream.active) {
        stream = await initializeLocalStream();
      }
      
      console.log('Adding tracks to peer connection...');
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind, track.enabled);
        pc.addTrack(track, stream);
      });
    } catch (error) {
      console.error('Error setting up media:', error);
      throw error;
    }
  
    pc.ontrack = (event) => {
      if (!event.track || !event.streams || !event.streams[0]) {
        console.error('Invalid track event:', event);
        return;
      }

      console.log('Received remote track:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted,
        id: event.track.id
      });
    
      // Ensure track is enabled
      event.track.enabled = true;
      
      const stream = event.streams[0];
      console.log('Setting remote stream:', {
        streamActive: stream.active,
        trackCount: stream.getTracks().length
      });

      // Force all tracks to be enabled
      stream.getTracks().forEach(track => {
        track.enabled = true;
        console.log(`Enabled ${track.kind} track:`, {
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState
        });
      });

      setRemoteStream(stream);
    };
  
    pc.onicecandidate = (event) => {
      console.log('New ICE candidate:', event.candidate);
      if (event.candidate && wsRef.current && currentCallDataRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate,
          room_id: currentCallDataRef.current.roomId,
          caller_id: currentCallDataRef.current.callerId,
          receiver_id: currentCallDataRef.current.receiverId
        }));
      }
    };
  
    return pc;
  };

  const startCall = async (receiverId) => {
    try {
      if (!wsRef.current) {
        console.error('WebSocket not connected');
        return;
      }
  
      // Initialize stream at call start
      await initializeLocalStream();
  
      const roomId = `room-${userId}-${receiverId}-${Date.now()}`;
      const callData = {
        roomId,
        callerId: userId,
        receiverId
      };
      
      // Set the call data first
      await new Promise(resolve => {
        setCurrentCallData(callData);
        resolve();
      });
  
      setIsCalling(true);
  
      wsRef.current.send(JSON.stringify({
        type: 'call_request',
        room_id: roomId,
        caller_id: userId,
        receiver_id: receiverId
      }));
  
    } catch (error) {
      console.error('Error starting call:', error);
      cleanupCall();
    }
  };

  const handleWebSocketMessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received message:', data.type);
      const currentCallInfo = currentCallDataRef.current;
  
      switch (data.type) {
        case 'call_request':
          if (data.receiver_id.toString() === userId.toString()) {
            console.log('Received call request');
            await initializeLocalStream();
            setCurrentCallData({
              roomId: data.room_id,
              callerId: data.caller_id,
              receiverId: data.receiver_id
            });
            setIsReceivingCall(true);
          }
          break;
  
        case 'call_accepted':
          if (currentCallInfo?.callerId.toString() === userId.toString()) {
            console.log('Call accepted, creating and sending offer');
            setIsCalling(false);
            setIsCallActive(true);
            
            try {
              const pc = await createPeerConnection();
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              wsRef.current?.send(JSON.stringify({
                type: 'offer',
                offer: offer,
                room_id: currentCallInfo.roomId,
                caller_id: currentCallInfo.callerId,
                receiver_id: currentCallInfo.receiverId
              }));
            } catch (error) {
              console.error('Error creating/sending offer:', error);
            }
          }
          break;
  
        case 'offer':
          if (data.offer && !peerConnection.current?.remoteDescription) {
            console.log('Received offer:', data.offer);
            try {
              const pc = peerConnection.current || await createPeerConnection();
              console.log('Setting remote description from offer');
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              
              console.log('Creating answer');
              const answer = await pc.createAnswer();
              console.log('Setting local description:', answer);
              await pc.setLocalDescription(answer);
              
              wsRef.current?.send(JSON.stringify({
                type: 'answer',
                answer: answer,
                room_id: data.room_id,
                caller_id: data.caller_id,
                receiver_id: data.receiver_id
              }));
            } catch (error) {
              console.error('Error handling offer:', error);
            }
          }
          break;

        case 'answer':
          if (data.answer && peerConnection.current && !peerConnection.current.remoteDescription) {
            console.log('Received answer:', data.answer);
            try {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              console.log('Successfully set remote description from answer');
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
          break;
  
        case 'ice_candidate':
          if (data.candidate && peerConnection.current?.remoteDescription) {
            console.log('Received ICE candidate');
            try {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
              console.log('Successfully added ICE candidate');
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
          break;
  
        case 'call_ended':
          console.log('Call ended');
          cleanupCall();
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const acceptCall = async () => {
    try {
      console.log('Accepting call');
      if (!wsRef.current) {
        console.error('No WebSocket connection');
        return;
      }
  
      // Ensure we have call data
      if (!currentCallData) {
        console.error('No call data available');
        return;
      }
  
      // Create peer connection first
      const pc = await createPeerConnection();
      
      wsRef.current.send(JSON.stringify({
        type: 'call_accepted',
        room_id: currentCallData.roomId,
        caller_id: currentCallData.callerId,
        receiver_id: currentCallData.receiverId
      }));
  
      setIsReceivingCall(false);
      setIsCallActive(true);
  
    } catch (error) {
      console.error('Error accepting call:', error);
      cleanupCall();
    }
  };

  const endCall = () => {
    if (wsRef.current && currentCallData) {
      wsRef.current.send(JSON.stringify({
        type: 'call_ended',
        room_id: currentCallData.roomId,
        caller_id: currentCallData.callerId,
        receiver_id: currentCallData.receiverId
      }));
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setIsStreamInitialized(false);
    setIsCallActive(false);
    setIsReceivingCall(false);
    setIsCalling(false);
    setCurrentCallData(null);
  };

  return {
    startCall,
    acceptCall,
    rejectCall: endCall,
    endCall,
    localStream,
    remoteStream,
    isCallActive,
    isReceivingCall,
    isCalling,
  };
};

export default VideoCallManager;