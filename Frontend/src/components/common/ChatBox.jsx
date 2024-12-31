import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';

const ChatBox = ({ onClose }) => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, sendMessage, connectWebSocket, isConnected } = useChat();
  const chatBoxRef = useRef(null);
  const messagesEndRef = useRef(null);

  const user = useSelector(state => state.auth.user);
  const shopData = useSelector(state => state.profile.data);

  useEffect(() => {
    const cleanup = connectWebSocket(user.id, user.email, shopData.shopID);
    return () => cleanup && cleanup();
  }, [user.id, user.email, shopData.shopID, connectWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage, user.id, 'user');
      setInputMessage('');
    }
  };

  return (
    <div ref={chatBoxRef} className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={shopData.profilePicture} 
              alt={shopData.shopName} 
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-shop-avatar.png';
              }}
            />
            <div>
              <h3 className="font-semibold text-white">{shopData.shopName}</h3>
              <p className="text-xs text-orange-100">
                {isConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-orange-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 bg-gray-50">
        {messages && messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-2 ${message.sender_type === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span className={`inline-block p-2 rounded-lg ${
              message.sender_type === 'user' ? 'bg-orange-500 text-white' : 'bg-white text-gray-800'
            } shadow`}>
              <div>{message.message}</div>
              <div className="text-xs mt-1 opacity-75">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-grow px-3 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            disabled={!isConnected || !inputMessage.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;