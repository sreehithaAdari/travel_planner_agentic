import React from 'react';
import { PlusCircle, MapPin, Trash2, Plane } from 'lucide-react';

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
    <div className="w-64 lg:w-72 h-full bg-gradient-to-b from-lightBlue to-mainBg border-r border-borderLight flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Top Profile / App Logo Section */}
      <div className="p-6 border-b border-borderLight/50 flex items-center gap-3 bg-white/30 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-primaryBlue/20 text-primaryBlue shrink-0">
          <Plane size={20} strokeWidth={2.5} className="rotate-45" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-textPrimary tracking-tight leading-none">Travel AI</span>
          <span className="text-xs text-textSecondary font-medium mt-1">Premium Planner</span>
        </div>
      </div>

      <div className="p-6 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primaryBlue hover:bg-[#3d7ae6] text-white py-3 px-4 rounded-full shadow-[0_8px_20px_rgba(79,142,247,0.3)] hover:shadow-[0_12px_25px_rgba(79,142,247,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <PlusCircle size={20} />
          <span className="font-semibold tracking-wide">New Trip</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 sidebar-scrollbar">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest px-2 mb-2">Recent Journey Plans</h3>
        {chats.length === 0 ? (
          <p className="text-sm text-textSecondary italic px-2">No trips planned yet.</p>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`group flex items-center justify-between gap-2 w-full px-3 py-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                activeChatId === chat.id 
                  ? 'bg-white shadow-[0_4px_15px_rgba(79,142,247,0.1)] border border-primaryBlue/20 text-primaryBlue font-semibold transform scale-[1.02]' 
                  : 'hover:bg-white/60 text-slate-600 hover:text-textPrimary hover:shadow-sm border border-transparent hover:border-borderLight'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className={`p-1.5 rounded-lg transition-colors ${activeChatId === chat.id ? 'bg-lightBlue text-primaryBlue' : 'bg-transparent text-slate-400 group-hover:text-primaryBlue'}`}>
                   <MapPin size={16} strokeWidth={2.5} />
                 </div>
                 <span className="truncate text-sm tracking-wide">{chat.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className={`p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-all ${activeChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
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
