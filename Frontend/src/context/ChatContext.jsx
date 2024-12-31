import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [messagesByUser, setMessagesByUser] = useState({});
    const reconnectTimeoutRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
      return () => {
          clearAllStates();
          if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
          }
          if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.close();
          }
      };
  }, []);

  const clearAllStates = useCallback(() => {
      setMessages([]);
      setMessagesByUser({});
      setUsers([]);
      setIsConnected(false);
  }, []);

    const handleMessage = useCallback((data) => {
        switch (data.type) {
            case 'chat_message':
                const newMessage = data.message;
                const userId = newMessage.room?.user_id;

                // Update messagesByUser for sub-admin view
                if (userId) {
                    setMessagesByUser(prev => ({
                        ...prev,
                        [userId]: [...(prev[userId] || []), newMessage].sort(
                            (a, b) => new Date(a.created_at) - new Date(b.created_at)
                        )
                    }));
                }

                // Update messages for both user and sub-admin views
                setMessages(prev => {
                    const messageExists = prev.some(msg => msg.id === newMessage.id);
                    if (messageExists) return prev;
                    return [...prev, newMessage].sort(
                        (a, b) => new Date(a.created_at) - new Date(b.created_at)
                    );
                });

                // Update users list with latest message
                setUsers(prev => prev.map(user => {
                    if (user.user_id === userId) {
                        return {
                            ...user,
                            last_message: newMessage.message,
                            last_message_time: newMessage.created_at
                        };
                    }
                    return user;
                }));
                break;

            case 'chat_history':
                if (data.messages && data.messages.length > 0) {
                    const sortedMessages = [...data.messages].sort(
                        (a, b) => new Date(a.created_at) - new Date(b.created_at)
                    );
                    
                    const userId = data.messages[0]?.room?.user_id;
                    if (userId) {
                        setMessagesByUser(prev => ({
                            ...prev,
                            [userId]: sortedMessages
                        }));
                    }
                    setMessages(sortedMessages);
                } else {
                    // Handle empty message history
                    const userId = data.userId;
                    if (userId) {
                        setMessagesByUser(prev => ({
                            ...prev,
                            [userId]: []
                        }));
                        setMessages([]);
                    }
                }
                break;

            case 'user_list':
                setUsers(data.users);
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }, []);

    const connectWebSocket = useCallback((userId, userEmail, shopId, is_sub_Admin = false) => {
        // Clear any existing timeouts
        clearAllStates();
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close existing socket if any
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.close();
        }

        const wsUrl = is_sub_Admin 
            ? `ws://localhost:8004/ws/chat/${userId}/${shopId}/?is_sub_Admin=true&email=${encodeURIComponent(userEmail)}`
            : `ws://localhost:8004/ws/chat/${userId}/${shopId}/?email=${encodeURIComponent(userEmail)}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            
            // Only attempt to reconnect if this is still the current socket
            if (ws === socketRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket(userId, userEmail, shopId, is_sub_Admin);
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        setSocket(ws);

        // Return cleanup function
        return () => {
          clearAllStates();
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [handleMessage]);

    const sendMessage = useCallback((message, senderId, senderType, targetUserId = null) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'chat_message',
                message,
                sender_id: senderId,
                sender_type: senderType,
                user_id: targetUserId
            }));
        } else {
            console.warn('WebSocket is not connected. Message not sent:', message);
        }
    }, []);

    const getChatHistory = useCallback((userId) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'get_chat_history',
                user_id: userId
            }));
        } else {
            console.warn('WebSocket is not connected. Cannot fetch chat history.');
        }
    }, []);

    const clearMessages = useCallback((userId) => {
        if (userId) {
            setMessagesByUser(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        } else {
            setMessagesByUser({});
        }
        setMessages([]);
    }, []);

    const contextValue = {
        messages,
        messagesByUser,
        users,
        isConnected,
        connectWebSocket,
        sendMessage,
        getChatHistory,
        clearMessages,
        clearAllStates,
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export default ChatContext;