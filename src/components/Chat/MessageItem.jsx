import React from 'react';

const MessageItem = ({
  message,
  isOwnMessage,
  currentUserId,
  audioPlayer,
  playAudio,
  pauseAudio,
  handleAudioSeek,
  formatAudioTime,
  formatTime,
  formatSeenTime,
  deleteMessage,
  deletingMessage,
  handleMessageContextMenu
}) => {
  const showReadReceipt = isOwnMessage && message.isRead;

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
      onContextMenu={(e) => handleMessageContextMenu(e, message._id, isOwnMessage, message.createdAt)}
    >
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
        isOwnMessage 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
          : 'bg-white/10 text-white'
      }`}>
        {message.messageType === 'audio' ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const audioUrl = message.fileUrl || message.audioUrl;
                console.log('Playing audio message:', message._id, 'URL:', audioUrl);
                console.log('Message data:', message);
                
                if (!audioUrl) {
                  console.error('No audio URL found for message:', message);
                  alert('Audio URL not found');
                  return;
                }
                
                if (audioPlayer.isPlaying && audioPlayer.currentAudio === message._id) {
                  pauseAudio();
                } else {
                  playAudio(audioUrl, message._id);
                }
              }}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              {audioPlayer.isPlaying && audioPlayer.currentAudio === message._id ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <div className="flex-1">
              <div 
                className="w-full bg-white/20 rounded-full h-2 cursor-pointer"
                onClick={(e) => handleAudioSeek(e, message._id)}
              >
                <div 
                  className="bg-white/60 h-2 rounded-full transition-all duration-100" 
                  style={{ 
                    width: audioPlayer.currentAudio === message._id && audioPlayer.duration > 0
                      ? `${Math.min((audioPlayer.currentTime / audioPlayer.duration) * 100, 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-300">Audio message</p>
                {audioPlayer.currentAudio === message._id && (
                  <div className="text-xs text-gray-400">
                    {audioPlayer.duration > 0 
                      ? `${formatAudioTime(audioPlayer.currentTime || 0)} / ${formatAudioTime(audioPlayer.duration || 0)}`
                      : formatAudioTime(audioPlayer.currentTime || 0)
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
        <div className={`flex items-center justify-end mt-1 space-x-1 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-400'
        }`}>
          <span className="text-xs">{formatTime(message.createdAt)}</span>
          {isOwnMessage && showReadReceipt && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-blue-200 font-medium">
                Seen at {formatSeenTime(message.readAt)}
              </span>
            </div>
          )}
        </div>
        
        {/* Delete Button - Only show for own messages */}
        {isOwnMessage && (
          <button
            onClick={() => deleteMessage(message._id)}
            disabled={deletingMessage === message._id}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete message"
          >
            {deletingMessage === message._id ? (
              <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageItem; 