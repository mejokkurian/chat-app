import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

export const useChat = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentAudio: null
  });
  const [callState, setCallState] = useState({
    isInCall: false,
    isCallActive: false,
    isIncomingCall: false,
    caller: null,
    receiver: null,
    callId: null,
    callStartTime: null,
    callDuration: 0,
    callType: null // 'audio' or 'video'
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);
  
  // Message loading states
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageDate, setOldestMessageDate] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // State for pull-to-refresh
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showRefreshIcon, setShowRefreshIcon] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callDurationRef = useRef(null);

  // Touch start Y position
  const [touchStartY, setTouchStartY] = useState(0);

  // Call duration timer effect
  useEffect(() => {
    if (callState.isCallActive && callState.callStartTime) {
      callDurationRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callState.callStartTime) / 1000);
        setCallState(prev => ({
          ...prev,
          callDuration: duration
        }));
      }, 1000);
    } else {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
    }

    return () => {
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, [callState.isCallActive, callState.callStartTime]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // End any active calls when component unmounts
      if (callState.isCallActive || callState.isInCall) {
        console.log('📞 Ending call due to component unmount');
        endCall();
      }
    };
  }, [callState.isCallActive, callState.isInCall]);

  // Initialize socket connection
  const initializeSocket = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);
    } catch (error) {
      console.error('Error parsing token:', error);
    }

    console.log('Initializing Socket.IO connection...');
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://web-production-d5c5.up.railway.app';
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      // End any active calls when socket disconnects
      if (callState.isCallActive || callState.isInCall) {
        console.log('📞 Ending call due to socket disconnect');
        endCall();
      }
    });

    // Handle new messages
    newSocket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      const { message } = data;
      
      // Only add if it's not already in the messages list
      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === message._id);
        if (!messageExists) {
          return [...prev, message];
        }
        return prev;
      });
      
      // Immediately scroll to bottom for new messages
      setTimeout(() => forceScrollToBottom(), 50);
    });

    // Handle message sent confirmation
    newSocket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
      const { message } = data;
      
      // Replace temporary message with real message
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.isTemp 
            ? { ...message, isRead: false }
            : msg
        );
        console.log('🔄 Replaced temporary message with real message:', message);
        return updatedMessages;
      });
      
      // Immediately scroll to bottom for sent messages
      setTimeout(() => forceScrollToBottom(), 50);
    });

    // Typing events - moved outside selectedUser dependency
    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing event received:', data);
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(data.userName);
        return newSet;
      });
    });

    newSocket.on('user_stopped_typing', (data) => {
      console.log('🛑 User stopped typing event received:', data);
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userName);
        return newSet;
      });
    });

    // Handle reaction updates
    newSocket.on('reaction_added', (data) => {
      console.log('📝 Reaction added:', data);
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { 
              ...msg, 
              reactions: [...(msg.reactions || []), data.reaction]
            }
          : msg
      ));
    });

    newSocket.on('reaction_removed', (data) => {
      console.log('🗑️ Reaction removed:', data);
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { 
              ...msg, 
              reactions: (msg.reactions || []).filter(reaction => 
                !(reaction.userId === data.userId && reaction.emoji === data.emoji)
              )
            }
          : msg
      ));
    });

    // Handle message read status updates
    newSocket.on('message_read', (data) => {
      console.log('👁️ Message read:', data);
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { 
              ...msg, 
              isRead: true,
              readAt: data.readAt
            }
          : msg
      ));
    });

    // Audio call events
    newSocket.on('audio_call_incoming', (data) => {
      console.log('📞 Incoming audio call:', data);
      setCallState(prev => ({
        ...prev,
        isIncomingCall: true,
        caller: data.callerId,
        callId: data.callId,
        offer: data.offer, // Store the offer data
        callType: 'audio'
      }));
    });

    // Video call events
    newSocket.on('video_call_incoming', (data) => {
      console.log('📹 Incoming video call:', data);
      setCallState(prev => ({
        ...prev,
        isIncomingCall: true,
        caller: data.callerId,
        callId: data.callId,
        offer: data.offer, // Store the offer data
        callType: 'video'
      }));
    });

    newSocket.on('audio_call_answered', async (data) => {
      console.log('📞 Call answered event received:', data);
      
      // Only handle this event if we're the caller (not the answerer)
      if (callState.isInCall && !callState.isCallActive && callState.receiver) {
        console.log('📞 We are the caller, setting remote description');
        
        try {
          if (!peerConnectionRef.current) {
            console.error('❌ No peer connection available');
            return;
          }
          
          console.log('📞 Setting remote description with answer:', data.answer);
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          
          console.log('✅ Remote description set successfully');
          console.log('📞 Updating call state to active...');
          
          setCallState(prev => ({
            ...prev,
            isCallActive: true,
            callStartTime: Date.now(),
            callDuration: 0
          }));
          
          console.log('✅ Call state updated to active');
          
        } catch (error) {
          console.error('❌ Error setting remote description:', error);
          console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.log('📞 Ignoring audio_call_answered event - not the caller or already active');
      }
    });

    newSocket.on('video_call_answered', async (data) => {
      console.log('📹 Video call answered event received:', data);
      
      // Only handle this event if we're the caller (not the answerer)
      if (callState.isInCall && !callState.isCallActive && callState.receiver) {
        console.log('📹 We are the caller, setting remote description');
        
        try {
          if (!peerConnectionRef.current) {
            console.error('❌ No peer connection available');
            return;
          }
          
          console.log('📹 Setting remote description with answer:', data.answer);
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          
          console.log('✅ Remote description set successfully');
          console.log('📹 Updating call state to active...');
          
          setCallState(prev => ({
            ...prev,
            isCallActive: true,
            callStartTime: Date.now(),
            callDuration: 0
          }));
          
          console.log('✅ Call state updated to active');
          
        } catch (error) {
          console.error('❌ Error setting remote description:', error);
          console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.log('📹 Ignoring video_call_answered event - not the caller or already active');
      }
    });

    newSocket.on('audio_call_rejected', (data) => {
      console.log('📞 Call rejected:', data);
      endCall();
    });

    newSocket.on('audio_call_ended', (data) => {
      console.log('📞 Call ended by other user:', data);
      endCall();
    });

    newSocket.on('audio_call_missed', (data) => {
      console.log('📞 Call missed:', data);
      setCallState(prev => ({
        ...prev,
        isIncomingCall: false,
        caller: null,
        callId: null,
        callStartTime: null,
        callDuration: 0
      }));
    });

    newSocket.on('audio_call_disconnected', (data) => {
      console.log('📞 Call disconnected:', data);
      endCall();
    });

    newSocket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted for everyone:', data);
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    setSocket(newSocket);
  };

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/users/friends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.friends || []);
      } else {
        console.error('Failed to fetch friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected user with lazy loading
  const fetchMessages = async (isLoadMore = false) => {
    if (!selectedUser) return;

    try {
      setIsLoadingMessages(true);
      
      let url = `http://localhost:5001/api/messages/conversation/${selectedUser._id}?limit=20`;
      
      if (isLoadMore && oldestMessageDate) {
        url += `&before=${oldestMessageDate}`;
        console.log('📥 Loading more messages before:', oldestMessageDate);
      } else if (isLoadMore) {
        console.log('⚠️ No oldestMessageDate available for loadMore');
        setIsLoadingMessages(false);
        return;
      }

      console.log('🌐 Fetching messages from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        console.log('📨 Fetched messages:', newMessages.length, 'messages');
        
        if (isLoadMore) {
          // Prepend older messages to the beginning, avoiding duplicates
          console.log('📥 Prepending', newMessages.length, 'older messages');
          
          setMessages(prev => {
            // Create a set of existing message IDs for quick lookup
            const existingIds = new Set(prev.map(msg => msg._id));
            
            // Filter out messages that already exist
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
            
            console.log('🔍 Duplicate check:', {
              newMessagesCount: newMessages.length,
              uniqueMessagesCount: uniqueNewMessages.length,
              duplicatesFound: newMessages.length - uniqueNewMessages.length
            });
            
            if (uniqueNewMessages.length === 0) {
              console.log('⚠️ All new messages are duplicates, not adding any');
              return prev;
            }
            
            return [...uniqueNewMessages, ...prev];
          });
        } else {
          // Replace messages for new conversation
          console.log('🔄 Replacing messages for new conversation');
          setMessages(newMessages);
          // Scroll to bottom will be handled by useEffect
        }
        
        // Update pagination state
        if (newMessages.length < 20) {
          console.log('🏁 No more messages to load (less than 20)');
          setHasMoreMessages(false);
        } else {
          console.log('📄 More messages available to load');
          setHasMoreMessages(true);
        }
        
        if (newMessages.length > 0) {
          const oldestMessage = newMessages[newMessages.length - 1];
          setOldestMessageDate(oldestMessage.createdAt);
          console.log('📅 Updated oldest message date:', oldestMessage.createdAt);
        }
      } else {
        console.error('❌ Failed to fetch messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
      setIsRefreshing(false); // Reset refreshing state
    }
  };

  // Load more messages when scrolling up
  const loadMoreMessages = () => {
    console.log('📥 loadMoreMessages called:', {
      isLoadingMessages,
      hasMoreMessages,
      selectedUser: !!selectedUser,
      oldestMessageDate,
      isRefreshing
    });
    
    // Prevent multiple simultaneous requests
    if (isLoadingMessages) {
      console.log('⏳ Already loading messages, skipping request');
      return;
    }
    
    if (!hasMoreMessages) {
      console.log('🏁 No more messages to load');
      setIsRefreshing(false);
      return;
    }
    
    if (!selectedUser) {
      console.log('❌ No user selected');
      setIsRefreshing(false);
      return;
    }
    
    if (!oldestMessageDate) {
      console.log('⚠️ No oldest message date available for pagination');
      setIsRefreshing(false);
      return;
    }
    
    console.log('✅ Starting to load more messages...');
    fetchMessages(true);
  };

  // Fetch unread notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser || !socket) return;

    const tempId = `temp_${Date.now()}`;
    const newMessage = {
      _id: tempId,
      content: message.trim(),
      sender: { _id: currentUserId, firstName: 'You', lastName: '' },
      receiver: selectedUser._id,
      createdAt: new Date(),
      isRead: false,
      isTemp: true
    };

    // Add message to UI immediately (optimistic update)
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    handleStopTyping();
    
    // Immediately scroll to bottom for new messages
    setTimeout(() => forceScrollToBottom(), 50);

    // Send message via socket with correct format
    socket.emit('send_message', {
      content: newMessage.content,
      receiverId: selectedUser._id,
      messageType: 'text'
    });

    console.log('📤 Message sent via socket');
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Typing indicators
  const handleTyping = () => {
    if (!selectedUser || !socket) {
      console.log('❌ Cannot send typing event - missing selectedUser or socket');
      return;
    }

    console.log('⌨️ Sending typing start event to:', selectedUser._id, 'User:', selectedUser.firstName);
    setIsTyping(true);
    socket.emit('typing_start', { receiverId: selectedUser._id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Typing timeout - stopping typing indicator');
      handleStopTyping();
    }, 2000); // Increased timeout to 2 seconds
  };

  const handleStopTyping = () => {
    if (!selectedUser || !socket) {
      console.log('❌ Cannot send stop typing event - missing selectedUser or socket');
      return;
    }

    console.log('🛑 Sending typing stop event to:', selectedUser._id, 'User:', selectedUser.firstName);
    setIsTyping(false);
    socket.emit('typing_stop', { receiverId: selectedUser._id });

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Improved scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Force scroll to bottom (for immediate scroll)
  const forceScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  };

  // Handle scroll events to detect user scrolling and load more messages
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      const isAtTop = scrollTop <= 0; // Check if exactly at top
      const isNearTop = scrollTop < 50; // More sensitive threshold
      
      console.log('Scroll position:', { scrollTop, scrollHeight, clientHeight, isAtTop, isNearTop, isNearBottom });
      
      setIsUserScrolling(!isNearBottom);
      
      // Show pull-to-refresh indicator when at top and has more messages
      if (isAtTop && hasMoreMessages && !isLoadingMessages) {
        console.log('📍 At top with more messages available');
        // Don't auto-load, let user pull to refresh
      }
    }
  };

  // Touch event handlers for pull-to-refresh
  const handleTouchStart = (e) => {
    console.log('👆 Touch event detected!');
    if (!messagesContainerRef.current) {
      console.log('❌ No messages container ref');
      return;
    }
    
    const { scrollTop } = messagesContainerRef.current;
    console.log('👆 Touch start at scrollTop:', scrollTop);
    
    // Allow pull-to-refresh when at top or very near top
    if (scrollTop <= 5) {
      setTouchStartY(e.touches[0].clientY);
      setIsPulling(true);
      console.log('✅ Starting pull-to-refresh');
    } else {
      console.log('❌ Not at top, ignoring touch. ScrollTop:', scrollTop);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || !messagesContainerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY);
    
    console.log('👆 Touch move, distance:', distance);
    
    if (distance > 0) {
      e.preventDefault();
      e.stopPropagation();
      setPullDistance(distance);
      
      // Show refresh icon when pulled down enough
      if (distance > 50) {
        setShowRefreshIcon(true);
        console.log('🔄 Show refresh icon');
      } else {
        setShowRefreshIcon(false);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isPulling) return;
    
    console.log('👆 Touch end, showRefreshIcon:', showRefreshIcon, 'hasMoreMessages:', hasMoreMessages);
    
    if (showRefreshIcon && hasMoreMessages && !isLoadingMessages) {
      // Trigger refresh
      console.log('🔄 Triggering refresh');
      setIsRefreshing(true);
      loadMoreMessages();
    } else {
      console.log('❌ Not triggering refresh:', {
        showRefreshIcon,
        hasMoreMessages,
        isLoadingMessages
      });
    }
    
    // Reset pull state
    setIsPulling(false);
    setPullDistance(0);
    setShowRefreshIcon(false);
    setTouchStartY(0);
  };

  // Mouse event handlers for desktop testing
  const handleMouseDown = (e) => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop } = messagesContainerRef.current;
    console.log('🖱️ Mouse down at scrollTop:', scrollTop);
    
    // Allow pull-to-refresh when at top or very near top
    if (scrollTop <= 5) {
      setTouchStartY(e.clientY);
      setIsPulling(true);
      console.log('✅ Starting pull-to-refresh (mouse)');
    } else {
      console.log('❌ Not at top, ignoring mouse');
    }
  };

  const handleMouseMove = (e) => {
    if (!isPulling || !messagesContainerRef.current) return;
    
    const currentY = e.clientY;
    const distance = Math.max(0, currentY - touchStartY);
    
    console.log('🖱️ Mouse move, distance:', distance);
    
    if (distance > 0) {
      e.preventDefault();
      e.stopPropagation();
      setPullDistance(distance);
      
      // Show refresh icon when pulled down enough
      if (distance > 50) {
        setShowRefreshIcon(true);
        console.log('🔄 Show refresh icon (mouse)');
      } else {
        setShowRefreshIcon(false);
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isPulling) return;
    
    console.log('🖱️ Mouse up, showRefreshIcon:', showRefreshIcon, 'hasMoreMessages:', hasMoreMessages);
    
    if (showRefreshIcon && hasMoreMessages && !isLoadingMessages) {
      // Trigger refresh
      console.log('🔄 Triggering refresh (mouse)');
      setIsRefreshing(true);
      loadMoreMessages();
    } else {
      console.log('❌ Not triggering refresh (mouse):', {
        showRefreshIcon,
        hasMoreMessages,
        isLoadingMessages
      });
    }
    
    // Reset pull state
    setIsPulling(false);
    setPullDistance(0);
    setShowRefreshIcon(false);
    setTouchStartY(0);
  };

  // Format time functions
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatSeenTime = (timestamp) => {
    if (!timestamp) return 'just now';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatCallDuration = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAudioTime = (seconds) => {
    // Handle invalid values
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRecordingTime = (seconds) => {
    // Handle invalid values
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio recording functions
  const startRecording = async () => {
    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio recording completed, blob size:', blob.size);
        setAudioBlob(blob);
        const audioUrl = URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendAudioMessage = () => {
    if (!audioBlob || !selectedUser || !socket) {
      console.log('Cannot send audio: missing audioBlob, selectedUser, or socket');
      return;
    }

    // Create temporary audio message for immediate UI display
    const tempId = `temp_audio_${Date.now()}`;
    const tempAudioMessage = {
      _id: tempId,
      content: 'Audio message',
      sender: { _id: currentUserId, firstName: 'You', lastName: '' },
      receiver: selectedUser._id,
      createdAt: new Date(),
      isRead: false,
      isTemp: true,
      messageType: 'audio',
      fileUrl: audioUrl // Use the audioUrl for immediate playback
    };

    // Add temporary message to UI immediately (optimistic update)
    setMessages(prev => {
      console.log('🎵 Adding temporary audio message to UI:', tempAudioMessage);
      return [...prev, tempAudioMessage];
    });
    
    // Immediately scroll to bottom for new audio message
    setTimeout(() => forceScrollToBottom(), 50);

    console.log('Converting audio blob to base64...');
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = reader.result.split(',')[1]; // Remove data URL prefix
      console.log('Audio converted to base64, length:', base64Audio.length);
      
      // Send audio message via socket
      socket.emit('send_message', {
        content: 'Audio message',
        receiverId: selectedUser._id,
        messageType: 'audio',
        audioBlob: base64Audio
      });
      
      console.log('🎵 Audio message sent via socket');
      
      // Clear audio state
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      
      // Clean up the temporary audio URL to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading audio file:', error);
    };
    
    reader.readAsDataURL(audioBlob);
  };

  // Audio player functions
  const playAudio = (audioUrl, messageId) => {
    console.log('Playing audio for message:', messageId, 'URL:', audioUrl);
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      
      // Validate duration before setting it
      const duration = audio.duration;
      if (duration && isFinite(duration) && duration > 0) {
        setAudioPlayer(prev => ({
          ...prev,
          duration: duration,
          currentAudio: messageId
        }));
      } else {
        console.warn('Invalid audio duration:', duration);
        setAudioPlayer(prev => ({
          ...prev,
          duration: 0,
          currentAudio: messageId
        }));
      }
    });

    audio.addEventListener('timeupdate', () => {
      // Validate currentTime before setting it
      const currentTime = audio.currentTime;
      if (currentTime && isFinite(currentTime) && currentTime >= 0) {
        setAudioPlayer(prev => ({
          ...prev,
          currentTime: currentTime
        }));
      }
    });

    audio.addEventListener('ended', () => {
      console.log('Audio playback ended');
      setAudioPlayer(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    });

    audio.addEventListener('play', () => {
      console.log('Audio playback started');
      setAudioPlayer(prev => ({
        ...prev,
        isPlaying: true
      }));
    });

    audio.addEventListener('pause', () => {
      console.log('Audio playback paused');
      setAudioPlayer(prev => ({
        ...prev,
        isPlaying: false
      }));
    });

    audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
      alert('Error playing audio message');
    });

    // Start playing
    audio.play().catch(error => {
      console.error('Error starting audio playback:', error);
      alert('Error playing audio message');
    });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleAudioSeek = (e, messageId) => {
    if (audioRef.current && audioPlayer.currentAudio === messageId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * audioPlayer.duration;
      audioRef.current.currentTime = seekTime;
    }
  };

  // Message deletion
  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!messageId || deletingMessage === messageId) return;

    setDeletingMessage(messageId);
    
    try {
      const url = deleteForEveryone 
        ? `http://localhost:5001/api/messages/${messageId}?forEveryone=true`
        : `http://localhost:5001/api/messages/${messageId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        console.log('Message deleted successfully');
      } else {
        const error = await response.json();
        console.error('Failed to delete message:', error);
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    } finally {
      setDeletingMessage(null);
    }
  };

  const handleMessageContextMenu = (e, messageId, isOwnMessage, messageTime) => {
    e.preventDefault();
    
    if (isOwnMessage) {
      const canDeleteForAll = canDeleteForEveryone(messageTime);
      
      if (canDeleteForAll) {
        const choice = confirm('Delete this message?\n\nClick OK to delete for everyone\nClick Cancel to delete for yourself only');
        deleteMessage(messageId, choice);
      } else {
        if (confirm('Delete this message for yourself?')) {
          deleteMessage(messageId, false);
        }
      }
    }
  };

  const canDeleteForEveryone = (messageTime) => {
    const messageDate = new Date(messageTime);
    const now = new Date();
    const diffInMinutes = (now - messageDate) / (1000 * 60);
    return diffInMinutes <= 2;
  };

  // Call functions
  const getRTCPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Add connection state change handler
    peerConnection.onconnectionstatechange = () => {
      console.log('📞 Connection state changed:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.error('❌ WebRTC connection failed or disconnected');
        // Don't automatically end call on connection failure, let user decide
      }
    };
    
    // Add ICE connection state change handler
    peerConnection.oniceconnectionstatechange = () => {
      console.log('📞 ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
        console.error('❌ ICE connection failed or disconnected');
      }
    };
    
    // Add signaling state change handler
    peerConnection.onsignalingstatechange = () => {
      console.log('📞 Signaling state changed:', peerConnection.signalingState);
    };
    
    return peerConnection;
  };

  const startAudioCall = async (userId) => {
    try {
      console.log('📞 Starting audio call to user:', userId);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      console.log('✅ Microphone access granted for outgoing call');
      setLocalStream(stream);
      
      const peerConnection = getRTCPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.ontrack = (event) => {
        console.log('📞 Remote stream received for outgoing call');
        setRemoteStream(event.streams[0]);
      };
      
      console.log('📞 Creating offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📞 Sending call request with ID:', callId);
      
      socket.emit('audio_call_request', {
        receiverId: userId,
        offer: offer,
        callId: callId
      });
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCallActive: false,
        receiver: userId,
        callId: callId,
        callStartTime: null,
        callDuration: 0,
        callType: 'audio'
      }));
      
      console.log('✅ Call request sent successfully');
      
    } catch (error) {
      console.error('❌ Error starting audio call:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Could not start call: ${error.message}`);
      }
    }
  };

  const startVideoCall = async (userId) => {
    try {
      console.log('📹 Starting video call to user:', userId);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Camera and microphone access granted for outgoing video call');
      setLocalStream(stream);
      
      const peerConnection = getRTCPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.ontrack = (event) => {
        console.log('📹 Remote stream received for outgoing video call');
        setRemoteStream(event.streams[0]);
      };
      
      console.log('📹 Creating offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📹 Sending video call request with ID:', callId);
      
      socket.emit('video_call_request', {
        receiverId: userId,
        offer: offer,
        callId: callId
      });
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCallActive: false,
        receiver: userId,
        callId: callId,
        callStartTime: null,
        callDuration: 0,
        callType: 'video'
      }));
      
      console.log('✅ Video call request sent successfully');
      
    } catch (error) {
      console.error('❌ Error starting video call:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        alert('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please connect a camera and try again.');
      } else {
        alert(`Could not start video call: ${error.message}`);
      }
    }
  };

  const answerAudioCall = async (offer, callId, callerId) => {
    try {
      console.log('📞 Answering call with data:', { offer, callId, callerId });
      
      if (!offer) {
        console.error('No offer data provided');
        alert('Call data is missing. Please try again.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      console.log('✅ Microphone access granted');
      setLocalStream(stream);
      
      const peerConnection = getRTCPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      console.log('📞 Adding local tracks to peer connection (answer)');
      stream.getTracks().forEach(track => {
        console.log('📞 Adding track:', track.kind, track.id);
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.ontrack = (event) => {
        console.log('📞 Remote stream received:', event.streams[0]);
        console.log('📞 Remote tracks:', event.streams[0]?.getTracks().map(t => t.kind));
        setRemoteStream(event.streams[0]);
      };
      
      console.log('📞 Setting remote description...');
      console.log('📞 Current signaling state:', peerConnection.signalingState);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('📞 Remote description set, new signaling state:', peerConnection.signalingState);
      
      console.log('📞 Creating answer...');
      const answer = await peerConnection.createAnswer();
      console.log('📞 Answer created, setting local description...');
      await peerConnection.setLocalDescription(answer);
      console.log('📞 Local description set, signaling state:', peerConnection.signalingState);
      
      console.log('📞 Sending answer to server...');
      socket.emit('audio_call_answer', {
        callerId: callerId,
        answer: answer,
        callId: callId
      });
      
      // Set call as active immediately after sending answer
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCallActive: true,
        isIncomingCall: false,
        caller: callerId,
        callId: callId,
        callStartTime: Date.now(),
        callDuration: 0,
        callType: 'audio'
      }));
      
      console.log('✅ Audio call answered successfully');
      
    } catch (error) {
      console.error('❌ Error answering audio call:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Could not answer call: ${error.message}`);
      }
    }
  };

  const answerVideoCall = async (offer, callId, callerId) => {
    try {
      console.log('📹 Answering video call with data:', { offer, callId, callerId });
      
      if (!offer) {
        console.error('No offer data provided');
        alert('Call data is missing. Please try again.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Camera and microphone access granted');
      setLocalStream(stream);
      
      const peerConnection = getRTCPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      console.log('📹 Adding local tracks to peer connection (video answer)');
      stream.getTracks().forEach(track => {
        console.log('📹 Adding track:', track.kind, track.id);
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.ontrack = (event) => {
        console.log('📹 Remote stream received:', event.streams[0]);
        console.log('📹 Remote tracks:', event.streams[0]?.getTracks().map(t => t.kind));
        setRemoteStream(event.streams[0]);
      };
      
      console.log('📹 Setting remote description...');
      console.log('📹 Current signaling state:', peerConnection.signalingState);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('📹 Remote description set, new signaling state:', peerConnection.signalingState);
      
      console.log('📹 Creating answer...');
      const answer = await peerConnection.createAnswer();
      console.log('📹 Answer created, setting local description...');
      await peerConnection.setLocalDescription(answer);
      console.log('📹 Local description set, signaling state:', peerConnection.signalingState);
      
      console.log('📹 Sending answer to server...');
      socket.emit('video_call_answer', {
        callerId: callerId,
        answer: answer,
        callId: callId
      });
      
      // Set call as active immediately after sending answer
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCallActive: true,
        isIncomingCall: false,
        caller: callerId,
        callId: callId,
        callStartTime: Date.now(),
        callDuration: 0,
        callType: 'video'
      }));
      
      console.log('✅ Video call answered successfully');
      
    } catch (error) {
      console.error('❌ Error answering video call:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        alert('Camera and microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera or microphone found. Please connect a camera and try again.');
      } else {
        alert(`Could not answer video call: ${error.message}`);
      }
    }
  };

  const endCall = () => {
    console.log('📞 Ending call with state:', callState);
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped local track:', track.kind);
      });
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log('🔌 Closed peer connection');
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped remote track:', track.kind);
      });
      setRemoteStream(null);
    }
    
    // Notify server about call end
    if (callState.callId && socket) {
      const endData = {
        callId: callState.callId,
        receiverId: callState.isIncomingCall ? callState.caller : callState.receiver
      };
      console.log('📤 Emitting audio_call_end:', endData);
      socket.emit('audio_call_end', endData);
    }
    
    // Reset call state
    setCallState({
      isInCall: false,
      isCallActive: false,
      isIncomingCall: false,
      caller: null,
      receiver: null,
      callId: null,
      callStartTime: null,
      callDuration: 0,
      callType: null
    });
    
    console.log('✅ Call ended successfully');
  };

  const rejectCall = () => {
    socket.emit('audio_call_reject', {
      callId: callState.callId,
      callerId: callState.caller
    });
    
    setCallState(prev => ({
      ...prev,
      isIncomingCall: false,
      caller: null,
      callId: null,
      callStartTime: null,
      callDuration: 0
    }));
  };

  // Utility functions
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleDiscoverPeople = () => {
    navigate('/available-users');
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  // Menu action handlers
  const handleReply = (message) => {
    console.log('💬 Reply to message:', message);
    // TODO: Implement reply functionality
    // This could pre-fill the input with a reply reference
  };

  const handleForward = (message) => {
    console.log('📤 Forward message:', message);
    // TODO: Implement forward functionality
    // This could open a user selection modal
  };

  const handleCopy = (message) => {
    console.log('📋 Copy message:', message);
    const textToCopy = message.content || 'Audio message';
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('✅ Message copied to clipboard');
        // You could show a toast notification here
      }).catch(err => {
        console.error('❌ Failed to copy message:', err);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('✅ Message copied to clipboard (fallback)');
    }
  };

  const handleReact = async (message, reaction) => {
    console.log('😊 React to message:', message._id, 'with reaction:', reaction);
    
    try {
      const response = await fetch(`http://localhost:5001/api/messages/${message._id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ emoji: reaction })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reaction updated:', data);
        
        // Update the message with new reactions
        setMessages(prev => prev.map(msg => 
          msg._id === message._id 
            ? { ...msg, reactions: data.reactions }
            : msg
        ));
      } else {
        console.error('❌ Failed to add reaction:', response.status);
      }
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
    }
  };

  // Effects
  useEffect(() => {
    fetchFriends();
    fetchUnreadNotifications();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (selectedUser) {
      // Reset loading states for new conversation
      setIsInitialLoad(true);
      setHasMoreMessages(true);
      setOldestMessageDate(null);
      setMessages([]);
      
      fetchMessages();
      setTypingUsers(new Set());
      setIsUserScrolling(false);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setAudioPlayer(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentAudio: null
      }));

      if (isRecording) {
        stopRecording();
      }
    }
  }, [selectedUser]);

  // Scroll to bottom when messages are loaded for a new conversation
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      // Force scroll to bottom immediately
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
        setIsInitialLoad(false);
      }, 100);
    }
  }, [messages, isInitialLoad]);

  useEffect(() => {
    if (messages.length > 0 && selectedUser && socket) {
      const unreadMessages = messages.filter(msg =>
        !msg.isRead && msg.sender._id !== currentUserId && msg.messageType !== 'audio'
      );

      if (unreadMessages.length > 0) {
        console.log('📖 Auto-marking messages as read:', unreadMessages.length);
        unreadMessages.forEach(msg => {
          console.log('📖 Marking message as read:', msg._id);
          socket.emit('mark_as_read', { messageId: msg._id });
        });
      }
    }
  }, [messages, selectedUser, socket, currentUserId]);

  // Mark messages as read when they're viewed
  const markMessagesAsRead = async (messageIds) => {
    if (!socket || !selectedUser) return;
    
    try {
      for (const messageId of messageIds) {
        socket.emit('mark_as_read', { messageId });
        console.log('📤 Marking message as read:', messageId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.receiver._id === currentUserId && !msg.isRead
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        markMessagesAsRead(messageIds);
      }
    }
  }, [selectedUser, messages, currentUserId, socket]);

  // Add global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isPulling) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isPulling) {
        handleMouseUp(e);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPulling]);

  return {
    // State
    users,
    selectedUser,
    messages,
    message,
    loading,
    error,
    unreadNotifications,
    socket,
    isTyping,
    typingUsers,
    currentUserId,
    isUserScrolling,
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    audioPlayer,
    callState,
    localStream,
    remoteStream,
    deletingMessage,
    isLoadingMessages,
    hasMoreMessages,
    
    // Refs
    messagesEndRef,
    messagesContainerRef,
    localAudioRef,
    remoteAudioRef,
    
    // Functions
    setSelectedUser,
    setMessage,
    handleSendMessage,
    handleKeyPress,
    handleTyping,
    handleStopTyping,
    scrollToBottom,
    forceScrollToBottom,
    handleScroll,
    loadMoreMessages,
    formatTime,
    formatSeenTime,
    formatAudioTime,
    formatRecordingTime,
    formatCallDuration,
    startRecording,
    stopRecording,
    sendAudioMessage,
    playAudio,
    pauseAudio,
    handleAudioSeek,
    deleteMessage,
    handleMessageContextMenu,
    startAudioCall,
    startVideoCall,
    answerAudioCall,
    answerVideoCall,
    endCall,
    rejectCall,
    getInitials,
    handleDiscoverPeople,
    handleNotificationsClick,
    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Mouse handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // Menu action handlers
    handleReply,
    handleForward,
    handleCopy,
    handleReact
  };
}; 