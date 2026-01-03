import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../api/axios';

const Chatbot = () => {
    const { user } = useSelector(state => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hello! I am your Medicare assistant. How can I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. Reset Chat on User Change (Login/Logout)
    useEffect(() => {
        if (user) {
            setMessages([
                { role: 'bot', text: 'Hello! I am your Medicare assistant. How can I help you today?' }
            ]);
        } else {
            setMessages([
                { role: 'bot', text: 'Please sign in or create an account to use the Medicare Assistant.' }
            ]);
        }
        setHistoryLoaded(false);
        setIsOpen(false);
    }, [user]);

    const preloadedQuestions = useMemo(() => {
        if (user?.role === 'doctor') {
            return [
                "How to view my schedule?",
                "How to upload a patient report?",
                "Check my appointments",
                "Update my availability"
            ];
        }
        // Default / Patient
        return [
            "Find a Cardiologist",
            "How to book an appointment?",
            "What specializations are available?",
            "Clinic timings"
        ];
    }, [user]);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (text) => {
        const messageText = text || inputValue.trim();
        if (!messageText) return;

        // Add User Message
        setMessages(prev => [...prev, { role: 'user', text: messageText }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await api.post('/chat', { message: messageText });
            const botReply = response.data.response;

            setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        } catch (error) {
            console.error("Chat Error", error);
            setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadHistory = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/chat/history');
            if (response.data.messages && response.data.messages.length > 0) {
                // Merge history (excluding default greeting if history exists)
                setMessages(response.data.messages);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: "No previous chat history found." }]);
            }
            setHistoryLoaded(true);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <h3 className="font-semibold">Medicare Assistant</h3>
                        </div>
                        <button onClick={toggleChat} className="hover:bg-blue-700 p-1 rounded transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 h-[500px] max-h-[60vh] overflow-y-auto overscroll-contain bg-gray-50 dark:bg-zinc-950/50 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-zinc-700 shadow-sm">
                                    <Loader2 className="animate-spin text-blue-600" size={16} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Preloaded Chips */}
                    {user && messages.length < 3 && !isLoading && (
                        <div className="px-4 pb-2 bg-gray-50 dark:bg-zinc-950/50 flex flex-wrap gap-2">
                            {/* History Button - Only if logged in and not loaded yet */}
                            {user && !historyLoaded && (
                                <button
                                    onClick={handleLoadHistory}
                                    className="text-xs bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium"
                                >
                                    Load Previous Chat
                                </button>
                            )}

                            {preloadedQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(q)}
                                    className="text-xs bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!user}
                            placeholder={user ? "Type your question..." : "Please sign in to chat"}
                            className="flex-1 bg-gray-100 dark:bg-zinc-900 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!user || !inputValue.trim() || isLoading}
                            className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen
                    ? 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 transform rotate-90'
                    : 'bg-blue-600 text-white animate-bounce-slow'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

export default Chatbot;
