import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import API from '../services/api';

const SUGGESTIONS = [
  'What laptops do you sell?',
  'Recommend a smartphone',
  'Is the PlayStation 5 in stock?',
  'Suggest premium audio headphones'
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hi! I'm Nova, your TechNova AI assistant. Ask me anything about our products, brands, or availability!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/chat', { message: query });
      const botReply = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response.data.reply,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Chat request failed:', err);
      const errorReply = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: "Sorry, I'm having trouble connecting to the store database right now. Please check if the backend is running.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Container */}
      {isOpen && (
        <div className="w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Chat Header */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Nova AI Assistant
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-slate-400">Powered by RAG & Gemini</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing / Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3.5 py-3 shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Suggestions */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Suggested Questions</p>
              <div className="flex flex-col gap-1">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-left bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={10} className="text-blue-500 shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about products, availability..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-blue-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group flex items-center justify-center border border-slate-800"
      >
        {isOpen ? (
          <X size={20} className="transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-slate-900 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-slate-900 rounded-full"></span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
