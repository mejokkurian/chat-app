import React from 'react';

const MessageInput = ({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  handleTyping,
  handleStopTyping,
  isRecording,
  audioBlob,
  recordingTime,
  startRecording,
  stopRecording,
  sendAudioMessage,
  formatRecordingTime,
  audioPlayer,
  playAudio,
  audioUrl
}) => {
  return (
    <div className="sticky bottom-0 z-10 bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Trigger typing indicator on every keystroke
              if (e.target.value.length > 0) {
                handleTyping();
              } else {
                handleStopTyping();
              }
            }}
            onFocus={() => {
              // Start typing indicator when user focuses on input
              if (message.length > 0) {
                handleTyping();
              }
            }}
            onBlur={() => {
              // Stop typing indicator when user leaves input
              handleStopTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full bg-white/10 text-white placeholder-gray-400 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        
        {/* Audio Recording Controls */}
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300"
            title="Record audio"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        )}
        
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 animate-pulse rounded-full p-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-red-400 text-sm font-medium">
              {formatRecordingTime(recordingTime)}
            </span>
            <button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition-all duration-300"
              title="Stop recording"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          </div>
        )}
        
        {audioBlob && !isRecording && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (audioPlayer.isPlaying && audioPlayer.currentAudio === 'preview') {
                  // Handle pause if needed
                } else {
                  playAudio(audioUrl, 'preview');
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-all duration-300"
              title="Play recording"
            >
              {audioPlayer.isPlaying && audioPlayer.currentAudio === 'preview' ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <div className="flex-1 max-w-20">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div 
                  className="bg-white/60 h-1 rounded-full transition-all duration-100" 
                  style={{ 
                    width: audioPlayer.currentAudio === 'preview' 
                      ? `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
            <button
              onClick={sendAudioMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all duration-300"
              title="Send audio"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            <button
              onClick={() => {
                setAudioBlob(null);
                setAudioUrl(null);
                setRecordingTime(0);
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
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition-all duration-300"
              title="Cancel recording"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        )}
        
        {!isRecording && !audioBlob && (
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput; 