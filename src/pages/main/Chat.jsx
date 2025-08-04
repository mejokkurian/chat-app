import React, { useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatHeader from '../../components/Chat/ChatHeader';
import MessageItem from '../../components/Chat/MessageItem';
import MessageInput from '../../components/Chat/MessageInput';
import CallInterface from '../../components/Chat/CallInterface';

const Chat = () => {
  const {
    // State
    users,
    selectedUser,
    messages,
    message,
    loading,
    error,
    unreadNotifications,
    typingUsers,
    currentUserId,
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
    
    // Pull-to-refresh state
    isPulling,
    pullDistance,
    showRefreshIcon,
    isRefreshing,
    
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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // Menu action handlers
    handleReply,
    handleForward,
    handleCopy,
    handleReact
  } = useChat();

  // Connect streams to audio elements
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      console.log('📞 Connected local stream to audio element');
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      console.log('📞 Connected remote stream to audio element');
    }
  }, [remoteStream]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex">
      {/* Left Sidebar - Friends List */}
      <div className="w-80 bg-black/20 backdrop-blur-md border-r border-white/10 flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Chats</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNotificationsClick}
                className="relative text-gray-400 hover:text-white px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6.75 6.75 0 00-6.75 6.75v3.75l-.984 2.647A1.5 1.5 0 004.5 15.75h12.75a1.5 1.5 0 001.5-1.5V10.5a6.75 6.75 0 00-6.75-6.75z" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No friends yet</p>
              <button
                onClick={handleDiscoverPeople}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Discover People
              </button>
            </div>
          ) : (
            <div className="space-y-1 flex-1">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 text-left hover:bg-white/10 transition-colors ${
                    selectedUser?._id === user._id ? 'bg-white/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(user.firstName, user.lastName)}
                          </span>
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                        user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${
                          user.isOnline ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-gray-400 text-sm">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {selectedUser ? (
          <>
                    <ChatHeader
          selectedUser={selectedUser}
          callState={callState}
          startAudioCall={startAudioCall}
          startVideoCall={startVideoCall}
          endCall={endCall}
          getInitials={getInitials}
        />

            {/* Messages Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 relative" 
                ref={messagesContainerRef} 
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* Pull-to-refresh indicator */}
                {isPulling && (
                  <div 
                    className="absolute top-0 left-0 right-0 flex justify-center items-center py-4 z-10"
                    style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
                  >
                    <div className="bg-black/50 backdrop-blur-md rounded-full p-3">
                      {showRefreshIcon ? (
                        <svg 
                          className={`h-6 w-6 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Pull to refresh hint when at top */}
                {!isPulling && hasMoreMessages && !isLoadingMessages && (
                  <div className="flex justify-center py-2">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      <span>Pull down to load older messages</span>
                    </div>
                  </div>
                )}

                {/* Touch detection indicator for debugging */}
                <div className="text-xs text-gray-500 text-center py-1">
                  Touch events: {isPulling ? 'Active' : 'Inactive'} | 
                  Pull distance: {pullDistance}px | 
                  Refresh icon: {showRefreshIcon ? 'Shown' : 'Hidden'}
                </div>

                {/* Load more button for non-touch devices */}
                {hasMoreMessages && !isLoadingMessages && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => {
                        console.log('🖱️ Load more button clicked');
                        loadMoreMessages();
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Load Older Messages
                    </button>
                  </div>
                )}

                {/* Loading indicator for older messages */}
                {isLoadingMessages && !isRefreshing && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span className="text-sm">Loading older messages...</span>
                    </div>
                  </div>
                )}
                
                {/* Refresh indicator */}
                {isRefreshing && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-sm">Refreshing messages...</span>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.sender._id === currentUserId || msg.sender._id === 'current-user';
                  
                  return (
                    <MessageItem
                      key={msg._id || index}
                      message={msg}
                      isOwnMessage={isOwnMessage}
                      currentUserId={currentUserId}
                      audioPlayer={audioPlayer}
                      playAudio={playAudio}
                      pauseAudio={pauseAudio}
                      handleAudioSeek={handleAudioSeek}
                      formatAudioTime={formatAudioTime}
                      formatTime={formatTime}
                      formatSeenTime={formatSeenTime}
                      deleteMessage={deleteMessage}
                      deletingMessage={deletingMessage}
                      handleMessageContextMenu={handleMessageContextMenu}
                      onReply={handleReply}
                      onForward={handleForward}
                      onCopy={handleCopy}
                      onReact={handleReact}
                    />
                  );
                })}
                
                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white px-4 py-2 rounded-2xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-blue-300 font-medium">
                          {Array.from(typingUsers).join(', ')} is typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <MessageInput
                message={message}
                setMessage={setMessage}
                handleSendMessage={handleSendMessage}
                handleKeyPress={handleKeyPress}
                handleTyping={handleTyping}
                handleStopTyping={handleStopTyping}
                isRecording={isRecording}
                audioBlob={audioBlob}
                recordingTime={recordingTime}
                startRecording={startRecording}
                stopRecording={stopRecording}
                sendAudioMessage={sendAudioMessage}
                formatRecordingTime={formatRecordingTime}
                audioPlayer={audioPlayer}
                playAudio={playAudio}
                audioUrl={audioUrl}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-24 w-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
              <p className="text-gray-400 mb-6">Choose a friend from the list to start chatting</p>
              <button
                onClick={handleDiscoverPeople}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Discover People
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call Interface */}
      <CallInterface
        callState={callState}
        answerAudioCall={answerAudioCall}
        answerVideoCall={answerVideoCall}
        rejectCall={rejectCall}
        endCall={endCall}
        users={users}
        localStream={localStream}
        remoteStream={remoteStream}
        formatCallDuration={formatCallDuration}
      />

      {/* Hidden audio elements for streams */}
      <audio
        ref={localAudioRef}
        autoPlay
        muted
        style={{ display: 'none' }}
      />
      <audio
        ref={remoteAudioRef}
        autoPlay
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Chat; 