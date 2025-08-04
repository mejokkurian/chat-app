import React, { useState } from 'react';

const CallButton = ({ onAudioCall, onVideoCall, disabled = false }) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleCallClick = () => {
    setShowOptions(!showOptions);
  };

  const handleAudioCall = () => {
    setShowOptions(false);
    onAudioCall();
  };

  const handleVideoCall = () => {
    setShowOptions(false);
    onVideoCall();
  };

  return (
    <div className="relative">
      {/* Main Call Button */}
      <button
        onClick={handleCallClick}
        disabled={disabled}
        className={`${
          disabled 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white p-3 rounded-full transition-all duration-300 flex items-center justify-center`}
        title="Start call"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </button>

      {/* Call Options Dropdown */}
      {showOptions && (
        <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-md rounded-lg p-2 border border-white/20 shadow-lg z-50 min-w-48">
          <div className="space-y-2">
            {/* Audio Call Option */}
            <button
              onClick={handleAudioCall}
              className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Audio Call</div>
                <div className="text-xs text-gray-400">Voice only</div>
              </div>
            </button>

            {/* Video Call Option */}
            <button
              onClick={handleVideoCall}
              className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Video Call</div>
                <div className="text-xs text-gray-400">Voice and video</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default CallButton; 