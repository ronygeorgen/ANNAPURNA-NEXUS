import React from 'react';
import { Phone } from 'lucide-react';

const VideoCallButton = ({ onClick, isOnline }) => (
  <button
    onClick={onClick}
    disabled={!isOnline}
    className={`flex items-center px-3 py-2 rounded-lg ${
      isOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'
    } text-white transition-colors`}
  >
    <Phone className="w-4 h-4 mr-2" />
    <span>{isOnline ? 'Call Shop' : 'Offline'}</span>
  </button>
);

export default VideoCallButton;