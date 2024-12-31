import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';

const ChatModal = ({ isOpen, onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [currentMessages, setCurrentMessages] = useState([]);
  const { messagesByUser, users, sendMessage, connectWebSocket, getChatHistory, isConnected, clearAllStates,clearMessages } = useChat();
  const modalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const user = useSelector(state => state.auth.user);
  const shopData = useSelector(state => state.profile.data);

  useEffect(() => {
    if (isOpen) {
        clearAllStates()
      const cleanup = connectWebSocket(user.id, user.email, shopData.shopID, true);
      return () => {
        cleanup();
        clearAllStates();
      }
    }
  }, [isOpen, user.id, user.email, shopData.shopID, connectWebSocket]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  useEffect(() => {
    if (selectedUser) {
      getChatHistory(selectedUser.user_id);
    }
  }, [selectedUser, getChatHistory]);

  

  useEffect(() => {
    if (selectedUser) {
      const updatedUser = users.find(u => u.user_id === selectedUser.user_id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  }, [users]);

  const handleUserSelect = (user) => {
    // Step 1: Clear states when switching users
    setSelectedUser(user);      // Update selected user
    setMessage([]);            // Clear previous messages
    clearMessages();            // Clear user-specific buffer
    clearAllStates();           // Reset states globally

    clearAllStates(); // Clear previous connection states
    connectWebSocket(user.id, user.email, shopData.shopID, true); // Reconnect socket


    // Step 3: Establish a new WebSocket connection
    connectWebSocket(user.id, user.email, shopData.shopID, true);
    getChatHistory(user.user_id); // Fetch updated chat history
};

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (selectedUser) { // ERROR LINE
        sendMessage(message, user.id, 'shop', selectedUser.user_id);
        setMessage(''); // Clear input
    }
};


  useEffect(() => {
    if (selectedUser && messagesByUser[selectedUser.user_id]) {
      setCurrentMessages(messagesByUser[selectedUser.user_id]);
    }
  }, [selectedUser, messagesByUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pl-24">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-3/4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-teal-500 text-white rounded-t-lg shrink-0">
          <h2 className="text-xl font-bold">
            Chat {isConnected ? '(Connected)' : '(Connecting...)'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0"> {/* min-h-0 is crucial for nested flex containers */}
          {/* Users List */}
          <div className="w-1/4 border-r overflow-y-auto bg-gray-50">
            {users.map((user) => (
              <div
                key={user.user_id}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 border-b
                  ${selectedUser?.user_id === user.user_id ? 'bg-teal-100' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex-1 min-w-0"> {/* prevents content from overflowing */}
                  <p className="font-medium truncate">{user.user_email}</p>
                  <p className="text-xs text-gray-500">
                    {user.last_message_time ? new Date(user.last_message_time).toLocaleString() : ''}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user.last_message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="w-3/4 flex flex-col min-h-0"> {/* min-h-0 ensures proper scrolling */}
            {selectedUser ? (
              <>
                {/* Selected User Header */}
                <div className="p-4 border-b bg-teal-50 shrink-0">
                  <h3 className="font-bold text-lg text-teal-700">{selectedUser.user_email}</h3>
                </div>

                {/* Messages Container */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 p-4 overflow-y-auto"
                  style={{ maxHeight: 'calc(80vh - 13rem)' }} // Adjust based on your header and input heights
                >
                  {currentMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex mb-2 ${msg.sender_type === 'shop' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`rounded-lg py-2 px-4 max-w-xl break-words
                          ${msg.sender_type === 'shop' 
                            ? 'bg-teal-500 text-white' 
                            : 'bg-gray-200 text-gray-800'}`}
                      >
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white shrink-0">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a user to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;