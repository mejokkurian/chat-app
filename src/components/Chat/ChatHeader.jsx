import React from 'react';
import CallButton from './CallButton';

const ChatHeader = ({ 
  selectedUser, 
  callState, 
  startAudioCall,
  startVideoCall,
  endCall, 
  getInitials 
}) => {
  return (
    <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {selectedUser.avatar ? (
            <img
              src={selectedUser.avatar}
              alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {getInitials(selectedUser.firstName, selectedUser.lastName)}
            </div>
          )}
          <div>
            <h2 className="font-semibold">
              {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <p className="text-sm text-gray-400">
              {selectedUser.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        {/* Call Controls */}
        <div className="flex items-center space-x-2">
          {/* Call Button with Audio/Video Options */}
          <CallButton
            onAudioCall={() => startAudioCall(selectedUser._id)}
            onVideoCall={() => startVideoCall(selectedUser._id)}
            disabled={callState.isInCall}
          />
          
          {/* End Call Button (when in call) */}
          {callState.isInCall && (
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300"
              title="End call"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 