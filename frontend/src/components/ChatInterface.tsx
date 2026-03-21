import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { TravelAPI } from '../api';
import { ItineraryDisplay } from './ItineraryDisplay';

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

  const tryParseJSON = (str: string) => {
    try {
      // First attempt: direct parse
      const obj = JSON.parse(str);
      if (obj && typeof obj === 'object' && obj.day_wise_plan) return obj;
    } catch (e) {
      // Deep cleanup for local LLM artifacts
      try {
        // 1. Find the largest block between { and }
        const startIdx = str.indexOf('{');
        const endIdx = str.lastIndexOf('}');
        
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
           let jsonString = str.substring(startIdx, endIdx + 1);
           
           // 2. Remove common markdown artifacts that break JSON
           jsonString = jsonString
             .replace(/```json/g, '')
             .replace(/```/g, '')
             .replace(/^\s*\*\s*/gm, '') // Remove markdown bullet points
             .replace(/\n\s*\n/g, '\n'); // Remove double newlines
             
           const obj = JSON.parse(jsonString);
           if (obj && typeof obj === 'object' && obj.day_wise_plan) return obj;
        }
      } catch (innerE) {
        return null; 
      }
    }
    return null;
  };

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
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden border border-borderLight">
      {/* Header */}
      <div className="bg-mainBg/50 backdrop-blur-sm p-5 border-b border-borderLight text-center flex items-center justify-center gap-2">
        <Sparkles size={20} className="text-primaryBlue" />
        <div>
          <h3 className="font-extrabold text-textPrimary text-lg tracking-tight">Expert Trip Assistant</h3>
        </div>
      </div>

      {/* Messages / Itinerary Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-mainBg/30 hidden-scrollbar">
        {messages.map((msg, idx) => {
          const itineraryData = msg.role === 'ai' ? tryParseJSON(msg.content) : null;
          
          return (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && !itineraryData && (
                <div className="w-9 h-9 rounded-full bg-white border border-borderLight shadow-sm flex items-center justify-center flex-shrink-0 text-primaryBlue mt-1">
                   <Bot size={20} strokeWidth={2.5} />
                </div>
              )}
              
              <div 
                className={`${itineraryData ? 'w-full' : 'max-w-[85%]'} rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-lightBlue text-primaryBlue font-medium px-6 py-4 rounded-br-sm' 
                    : itineraryData 
                      ? '' 
                      : 'bg-white text-textPrimary p-6 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-borderLight rounded-bl-sm'
                } prose prose-p:leading-[1.7] text-[15px] max-w-none`}
              >
                {itineraryData ? (
                  <ItineraryDisplay data={itineraryData} />
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 justify-start items-end animate-fade-in-up">
             <div className="w-9 h-9 rounded-full bg-white border border-borderLight shadow-sm flex items-center justify-center flex-shrink-0 text-primaryBlue">
                <Bot size={20} strokeWidth={2.5} />
             </div>
             <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-sm shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-borderLight">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 bg-primaryBlue/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primaryBlue/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primaryBlue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-borderLight rounded-b-[2rem]">
        <form onSubmit={handleSend} className="relative flex items-center w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your trip..."
            className="w-full bg-mainBg border border-borderLight rounded-full pl-8 pr-20 py-5 font-semibold text-[15px] text-textPrimary placeholder-textSecondary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primaryBlue/15 focus:border-primaryBlue/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-primaryBlue hover:bg-[#3d7ae6] disabled:bg-primaryBlue/40 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_12px_rgba(79,142,247,0.3)] disabled:shadow-none"
          >
            <Send size={20} className={`transform transition-transform ${input.trim() ? '-mt-0.5 ml-0.5' : ''}`} />
          </button>
        </form>
      </div>
    </div>
  );
}
