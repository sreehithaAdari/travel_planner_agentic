import React from 'react';
import { PlusCircle, MessageSquare, Trash2 } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
}

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  return (
    <div className="w-64 h-full bg-pastelBlue bg-opacity-30 border-r border-pastelBlue/50 flex flex-col z-20">
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
            <div 
              key={chat.id} 
              className={`group flex items-center justify-between gap-2 w-full px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                activeChatId === chat.id 
                  ? 'bg-white shadow-sm border border-pastelBlue text-slate-800 font-medium' 
                  : 'hover:bg-white/50 text-slate-600'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                 <MessageSquare size={16} className={`flex-shrink-0 ${activeChatId === chat.id ? 'text-blue-500' : 'text-slate-400'}`} />
                 <span className="truncate text-sm">{chat.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className={`p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ${activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                title="Delete Trip"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
