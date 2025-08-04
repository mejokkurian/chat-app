import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, getUserFullName, getUserEmail, logout } from '../../utils/auth.js';
import { authAPI, usersAPI, notificationsAPI } from '../../services/api.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchRecentUsers();
    fetchUnreadNotifications();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUserData(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersAPI.discoverUsers({ page: 1, limit: 6 });
      setRecentUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching recent users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      console.log('Sending friend request to:', userId);
      const response = await usersAPI.sendFriendRequest(userId);
      console.log('Friend request response:', response.data);
      
      // Update the user's status in the list
      setRecentUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasSentRequest: true, canSendRequest: false }
          : user
      ));
      
      // Refresh notifications
      fetchUnreadNotifications();
    } catch (error) {
      console.error('Error sending friend request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      alert(errorMessage);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      console.log('Accepting friend request from:', userId);
      const response = await usersAPI.acceptFriendRequest(userId);
      console.log('Accept friend request response:', response.data);
      
      // Update the user's status in the list
      setRecentUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasReceivedRequest: false, isFriends: true }
          : user
      ));
      
      // Refresh notifications
      fetchUnreadNotifications();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to accept friend request';
      alert(errorMessage);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      console.log('Rejecting friend request from:', userId);
      const response = await usersAPI.rejectFriendRequest(userId);
      console.log('Reject friend request response:', response.data);
      
      // Update the user's status in the list
      setRecentUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasReceivedRequest: false }
          : user
      ));
      
      // Refresh notifications
      fetchUnreadNotifications();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject friend request';
      alert(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const handleChatClick = () => {
    navigate('/chat');
  };

  const handleAvailableUsersClick = () => {
    navigate('/available-users');
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-400' : 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-light">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Chat</h1>
                <p className="text-gray-400 text-sm">Welcome back</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNotificationsClick}
                className="relative text-gray-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                {/* Proper notification (bell) icon */}
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Sign Out"
              >
                {/* Proper logout icon */}
                <svg className="h-6 w-6 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="h-32 w-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-bold text-white">
                  {userData?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {getUserFullName()}
              </h2>
              <p className="text-xl text-gray-400 mb-2">{getUserEmail()}</p>
              <p className="text-gray-500">
                Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Recently'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-blue-400">0</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Messages Sent</h3>
            <p className="text-gray-400 text-sm">Start conversations to see your activity</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-green-400">0</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Contacts</h3>
            <p className="text-gray-400 text-sm">Connect with other users</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-purple-400">0h</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Online Time</h3>
            <p className="text-gray-400 text-sm">Track your activity</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">What would you like to do?</h3>
            <p className="text-gray-400 text-lg">Choose an action to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <button
              onClick={handleChatClick}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-left hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Start Chatting</h4>
                    <p className="text-blue-100">Connect with other users in real-time</p>
                  </div>
                </div>
                <svg className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={handleAvailableUsersClick}
              className="group relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-left hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Available Users</h4>
                    <p className="text-green-100">Browse and connect with all users</p>
                  </div>
                </div>
                <svg className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-8 text-left border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Edit Profile</h4>
                    <p className="text-gray-400">Update your information and settings</p>
                  </div>
                </div>
                <svg className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Recent Activity</h3>
            <p className="text-gray-400">Your latest interactions will appear here</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
            <div className="h-20 w-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">No recent activity</h4>
            <p className="text-gray-400 mb-6">Start chatting to see your activity here</p>
            <button
              onClick={handleChatClick}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Start Chatting
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            Chat App • Designed for seamless communication
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 