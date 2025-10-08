import React, { useEffect, useRef } from 'react';

// Simple component to display chat messages
const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const alignClass = isUser ? 'self-end bg-green-500 text-white' : 'self-start bg-gray-200 text-gray-800';
    
    let textContent = message.text;
    if (message.requires_auth) {
        textContent = "⚠️ Please use the 'Sign In' button to track inventory or receive personalized suggestions." + "\n\n" + message.text;
    }

    return (
        <div className={`max-w-xs sm:max-w-md p-3 my-2 rounded-xl shadow-md ${alignClass}`}>
            <p className="whitespace-pre-wrap">{textContent}</p>
            {message.timestamp && (
                <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </span>
            )}
        </div>
    );
};

// Chat View Component
const ChatView = ({ messages, currentMessage, setCurrentMessage, sendMessage, isLoading, error }) => {
    const messagesEndRef = useRef(null);

    // Scroll to the latest message whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col flex-grow overflow-hidden h-full">
            <div className="flex-grow overflow-y-auto p-4 space-y-4" style={{ minHeight: '80vh' }}>
                <div className="flex flex-col items-start w-full">
                    <MessageBubble 
                        message={{
                            role: 'assistant',
                            text: "Hello! I'm NutriSmart. You can chat with me now, but please use the 'Sign In' button or the Dashboard to track your data.",
                            timestamp: Date.now() - 5000 
                        }}
                    />
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {error && (
                    <div className="mb-3 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                        {error}
                    </div>
                )}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(currentMessage);
                }} className="flex space-x-3">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder={isLoading ? "Waiting for AI response..." : "Ask me for healthy recipes or suggestions..."}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className={`py-3 px-6 rounded-lg font-semibold transition duration-150 ${
                            isLoading || !currentMessage.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        disabled={isLoading || !currentMessage.trim()}
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </div>
                        ) : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatView;