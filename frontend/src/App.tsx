import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TravelForm } from './components/TravelForm';
import { ChatInterface } from './components/ChatInterface';
import { TravelAPI, TripRequest } from './api';

function App() {
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // View states
  const [activeView, setActiveView] = useState<'form' | 'chat'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatDetails, setChatDetails] = useState<any>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await TravelAPI.getChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats", error);
    }
  };

  const loadChatDetails = async (chatId: string) => {
    try {
      const data = await TravelAPI.getChatDetails(chatId);
      setChatDetails(data);
      setActiveChatId(chatId);
      setActiveView('chat');
    } catch (error) {
      console.error("Failed to load chat details", error);
    }
  };

  const handleGenerateItinerary = async (data: TripRequest) => {
    setIsGenerating(true);
    try {
      const result = await TravelAPI.generateItinerary(data);
      await loadChats();
      await loadChatDetails(result.chat_id);
    } catch (error) {
      console.error("Failed to generate itinerary", error);
      alert("Something went wrong while generating the itinerary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setChatDetails(null);
    setActiveView('form');
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-pastelBlue rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 bg-pastelGreen rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pastelPink rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>

      {/* Main Layout */}
      <div className="z-10 flex w-full h-full">
        <Sidebar 
          chats={chats} 
          activeChatId={activeChatId} 
          onSelectChat={loadChatDetails}
          onNewChat={handleNewChat}
        />
        
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          {activeView === 'form' ? (
            <TravelForm onSubmit={handleGenerateItinerary} isLoading={isGenerating} />
          ) : (
            chatDetails && (
              <div className="w-full max-w-4xl h-full flex flex-col">
                <ChatInterface 
                  chatId={activeChatId as string}
                  initialItinerary={chatDetails.itinerary_data?.final_itinerary || ''}
                  initialMessages={chatDetails.messages || []}
                />
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
