import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, notificationsAPI } from '../../services/api.js';

const AvailableUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchUnreadNotifications();
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery
      };
      
      const response = await usersAPI.discoverUsers(params);
      const newUsers = response.data.users;
      
      if (currentPage === 1) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }
      
      setHasMore(newUsers.length === 20);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setUsers([]);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await usersAPI.sendFriendRequest(userId);
      
      // Update the user's status in the list
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasSentRequest: true, canSendRequest: false }
          : user
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.response?.data?.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await usersAPI.acceptFriendRequest(userId);
      
      // Update the user's status in the list
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasReceivedRequest: false, isFriends: true }
          : user
      ));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(error.response?.data?.message || 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await usersAPI.rejectFriendRequest(userId);
      
      // Update the user's status in the list
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, hasReceivedRequest: false }
          : user
      ));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert(error.response?.data?.message || 'Failed to reject friend request');
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-400' : 'bg-gray-400';
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
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
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-semibold">Discover People</h1>
                <p className="text-gray-400 text-sm">Find and connect with new users</p>
              </div>
            </div>
            <button
              onClick={handleNotificationsClick}
              className="relative text-gray-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 ${getStatusColor(user.isOnline)} rounded-full border-2 border-black`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                  
                  {user.bio && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{user.bio}</p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-400 mb-4">
                    <span>{user.followers} followers</span>
                    <span>{user.following} following</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {user.isFriends ? (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        Friends
                      </span>
                    ) : user.hasSentRequest ? (
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                        Request Sent
                      </span>
                    ) : user.hasReceivedRequest ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(user._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(user._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : user.canSendRequest ? (
                      <button
                        onClick={() => handleSendFriendRequest(user._id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition-colors"
                      >
                        Add Friend
                      </button>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm">
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="bg-white/10 text-white px-8 py-3 rounded-full font-medium hover:bg-white/20 transition-colors"
            >
              Load More
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-16">
            <div className="h-20 w-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AvailableUsers; 