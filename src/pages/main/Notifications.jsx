import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI, usersAPI } from '../../services/api.js';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markSingleAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      ));
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
      
      // Update unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    try {
      console.log('Accepting friend request from notification:', notification);
      // Accept the friend request
      const response = await usersAPI.acceptFriendRequest(notification.sender._id);
      console.log('Accept friend request response:', response.data);
      
      // Mark notification as read
      await notificationsAPI.markSingleAsRead(notification._id);
      
      // Update local state - mark as read and change type
      setNotifications(prev => prev.map(n => 
        n._id === notification._id 
          ? { ...n, isRead: true, type: 'friend_request_accepted' }
          : n
      ));
      
      // Update unread count
      fetchUnreadCount();
      
      // Show success message
      alert('Friend request accepted! You can now chat with this user.');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to accept friend request';
      alert(errorMessage);
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    try {
      console.log('Rejecting friend request from notification:', notification);
      // Reject the friend request
      const response = await usersAPI.rejectFriendRequest(notification.sender._id);
      console.log('Reject friend request response:', response.data);
      
      // Mark notification as read
      await notificationsAPI.markSingleAsRead(notification._id);
      
      // Update local state - mark as read and change type
      setNotifications(prev => prev.map(n => 
        n._id === notification._id 
          ? { ...n, isRead: true, type: 'friend_request_rejected' }
          : n
      ));
      
      // Update unread count
      fetchUnreadCount();
      
      // Show success message
      alert('Friend request rejected.');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject friend request';
      alert(errorMessage);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return (
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'friend_request_accepted':
        return (
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'friend_request_rejected':
        return (
          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-6">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                          <div>
              <h1 className="text-2xl font-semibold">Notifications</h1>
              <p className="text-gray-400 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-blue-400 hover:text-blue-300 px-4 py-2 rounded-full hover:bg-blue-500/10 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications List */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {/* Bell icon for notifications */}
              <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
                              <div
                  key={notification._id}
                  className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 ${
                    !notification.isRead ? 'border-blue-500/30 bg-blue-500/5' : ''
                  }`}
                >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  {getNotificationIcon(notification.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                        <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                        <p className="text-gray-400 text-xs">{formatTime(notification.createdAt)}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Friend Request Actions */}
                        {notification.type === 'friend_request' && !notification.isRead && (
                          <>
                            <button
                              onClick={() => handleAcceptFriendRequest(notification)}
                              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectFriendRequest(notification)}
                              className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {/* General Actions */}
                        {!notification.isRead && notification.type !== 'friend_request' && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded-full hover:bg-blue-500/10 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-full hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Notifications; 