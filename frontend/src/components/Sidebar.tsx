import React from 'react';
import { PlusCircle, MessageSquare } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
}

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ chats, activeChatId, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-pastelBlue bg-opacity-30 border-r border-pastelBlue/50 flex flex-col">
      <div className="p-4 border-b border-pastelBlue/50">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-white/60 hover:bg-white text-slate-700 py-2 px-4 rounded-xl shadow-sm transition-all duration-200"
        >
          <PlusCircle size={18} />
          <span className="font-medium">New Trip</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Trips</h3>
        {chats.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No trips planned yet.</p>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl transition-all duration-200 ${
                activeChatId === chat.id 
                  ? 'bg-white shadow-sm border border-pastelBlue text-slate-800 font-medium' 
                  : 'hover:bg-white/50 text-slate-600'
              }`}
            >
              <MessageSquare size={16} className={activeChatId === chat.id ? 'text-blue-500' : 'text-slate-400'} />
              <span className="truncate text-sm">{chat.title}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
