import React from 'react';

const CallInterface = ({
  callState,
  answerAudioCall,
  answerVideoCall,
  rejectCall,
  endCall,
  users,
  localStream,
  remoteStream,
  formatCallDuration
}) => {
  // Get caller/receiver information
  const getCallerInfo = () => {
    console.log('🔍 Getting caller info:', {
      isIncomingCall: callState.isIncomingCall,
      isCallActive: callState.isCallActive,
      caller: callState.caller,
      receiver: callState.receiver,
      usersCount: users.length
    });
    
    // For incoming calls, use caller
    if (callState.isIncomingCall && callState.caller) {
      const caller = users.find(u => u._id === callState.caller);
      console.log('📞 Found incoming caller:', caller);
      return caller;
    }
    
    // For active calls, use caller (the person we're talking to)
    if (callState.isCallActive && callState.caller) {
      const caller = users.find(u => u._id === callState.caller);
      console.log('📞 Found active caller:', caller);
      return caller;
    }
    
    // For active calls without caller, try receiver (outgoing calls)
    if (callState.isCallActive && callState.receiver) {
      const receiver = users.find(u => u._id === callState.receiver);
      console.log('📞 Found active receiver:', receiver);
      return receiver;
    }
    
    // For outgoing calls that haven't been answered yet, use receiver
    if (callState.receiver) {
      const receiver = users.find(u => u._id === callState.receiver);
      console.log('📞 Found receiver:', receiver);
      return receiver;
    }
    
    console.log('❌ No caller info found');
    return null;
  };

  const callerInfo = getCallerInfo();
  const callerName = callerInfo ? `${callerInfo.firstName} ${callerInfo.lastName}`.trim() : 'Unknown';
  
  // Debug logging
  console.log('📞 CallInterface Debug:', {
    callerInfo,
    callerName,
    callState,
    users: users.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}` }))
  });

  // Show ending call state
  const [isEndingCall, setIsEndingCall] = React.useState(false);
  
  // Fallback function if formatCallDuration is not provided
  const formatDuration = (seconds) => {
    if (typeof formatCallDuration === 'function') {
      return formatCallDuration(seconds);
    }
    // Fallback implementation
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle call answering based on call type
  const handleAnswerCall = () => {
    if (callState.offer) {
      if (callState.callType === 'video') {
        answerVideoCall(callState.offer, callState.callId, callState.caller);
      } else {
        answerAudioCall(callState.offer, callState.callId, callState.caller);
      }
    } else {
      console.error('Missing call data:', { 
        caller: callState.caller, 
        offer: callState.offer, 
        callId: callState.callId 
      });
      alert('Call data is missing. Please try again.');
    }
  };

  return (
    <>
      {/* Incoming Call Modal */}
      {callState.isIncomingCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 max-w-sm w-full mx-4">
            {/* Caller Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              {callerInfo?.profilePicture ? (
                <img 
                  src={callerInfo.profilePicture} 
                  alt={callerName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {callerInfo ? `${callerInfo.firstName?.charAt(0) || ''}${callerInfo.lastName?.charAt(0) || ''}` : '?'}
                </span>
              )}
            </div>
            
            {/* Caller Name */}
            <h3 className="text-xl font-semibold mb-2 text-white">{callerName}</h3>
            <p className="text-gray-400 mb-6">
              Incoming {callState.callType === 'video' ? 'video' : 'audio'} call...
            </p>
            
            {/* Call Actions */}
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleAnswerCall}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center"
              >
                {callState.callType === 'video' ? (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                )}
                Answer
              </button>
              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                </svg>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {callState.isCallActive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 max-w-sm w-full mx-4">
            {/* Video Call Interface */}
            {callState.callType === 'video' ? (
              <div className="space-y-4">
                {/* Remote Video */}
                {remoteStream && (
                  <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={(video) => {
                        if (video && remoteStream) {
                          video.srcObject = remoteStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Local Video (Picture-in-Picture) */}
                {localStream && (
                  <div className="absolute bottom-20 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                    <video
                      ref={(video) => {
                        if (video && localStream) {
                          video.srcObject = localStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Caller Name */}
                <h3 className="text-xl font-semibold mb-2 text-white">{callerName}</h3>
                
                {/* Call Status */}
                <div className="mb-6">
                  <p className="text-green-400 text-sm font-medium mb-1">Connected</p>
                  <p className="text-gray-400 text-lg font-mono">
                    {formatDuration(callState.callDuration)}
                  </p>
                </div>
                
                {/* Call Controls */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsEndingCall(true);
                      setTimeout(() => {
                        endCall();
                        setIsEndingCall(false);
                      }, 500);
                    }}
                    disabled={isEndingCall}
                    className={`${
                      isEndingCall 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center`}
                    title={isEndingCall ? "Ending call..." : "End call"}
                  >
                    {isEndingCall ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Audio Call Interface */
              <>
                {/* Caller Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  {callerInfo?.profilePicture ? (
                    <img 
                      src={callerInfo.profilePicture} 
                      alt={callerName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {callerInfo ? `${callerInfo.firstName?.charAt(0) || ''}${callerInfo.lastName?.charAt(0) || ''}` : '?'}
                    </span>
                  )}
                </div>
                
                {/* Caller Name */}
                <h3 className="text-xl font-semibold mb-2 text-white">{callerName}</h3>
                
                {/* Call Status */}
                <div className="mb-6">
                  <p className="text-green-400 text-sm font-medium mb-1">Connected</p>
                  <p className="text-gray-400 text-lg font-mono">
                    {formatDuration(callState.callDuration)}
                  </p>
                </div>
                
                {/* Call Controls */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsEndingCall(true);
                      setTimeout(() => {
                        endCall();
                        setIsEndingCall(false);
                      }, 500);
                    }}
                    disabled={isEndingCall}
                    className={`${
                      isEndingCall 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white p-4 rounded-full transition-all duration-300 flex items-center justify-center`}
                    title={isEndingCall ? "Ending call..." : "End call"}
                  >
                    {isEndingCall ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Call Info */}
                <div className="mt-6 text-xs text-gray-500">
                  <p>Audio call in progress</p>
                  <p className="mt-1">Tap the red button to end call</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mini Call Indicator (when call is active but modal is minimized) */}
      {callState.isCallActive && (
        <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/20 z-40">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              {callState.callType === 'video' ? (
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{callerName}</p>
              <p className="text-xs text-green-400">{formatDuration(callState.callDuration)}</p>
            </div>
            <button
              onClick={() => {
                setIsEndingCall(true);
                setTimeout(() => {
                  endCall();
                  setIsEndingCall(false);
                }, 500);
              }}
              disabled={isEndingCall}
              className={`${
                isEndingCall 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white p-2 rounded-full transition-all duration-300`}
              title={isEndingCall ? "Ending call..." : "End call"}
            >
              {isEndingCall ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CallInterface; 