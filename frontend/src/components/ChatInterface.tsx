import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User } from 'lucide-react';
import { TravelAPI } from '../api';

interface Message {
  role: string;
  content: string;
}

interface ChatInterfaceProps {
  chatId: string;
  initialItinerary: string;
  initialMessages: Message[];
}

export function ChatInterface({ chatId, initialItinerary, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await TravelAPI.sendMessage(chatId, userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: res.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white">
      {/* Header */}
      <div className="bg-pastelBlue/30 p-4 border-b border-pastelBlue/50 text-center">
        <h3 className="font-semibold text-slate-800 text-lg">Trip Assistant</h3>
        <p className="text-xs text-slate-500">I can only help with questions about your current itinerary.</p>
      </div>

      {/* Messages / Itinerary Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-pastelBlue flex items-center justify-center flex-shrink-0 text-blue-600 mt-1">
                <Bot size={18} />
              </div>
            )}
            
            <div 
              className={`max-w-[75%] rounded-2xl p-4 prose prose-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white prose-invert' 
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100'
              }`}
            >
              {/* Force markdown links and lists to display correctly */}
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 mt-1">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-pastelBlue flex items-center justify-center flex-shrink-0 text-blue-600">
                <Bot size={18} />
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your trip..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pastelBlue"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl px-5 flex items-center justify-center transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
