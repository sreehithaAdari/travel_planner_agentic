import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TravelForm } from './components/TravelForm';
import { ChatInterface } from './components/ChatInterface';
import { TripSummaryCard } from './components/TripSummaryCard';
import { TravelAPI, TripRequest } from './api';
import { Compass } from 'lucide-react';

function App() {
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // View states
  const [activeView, setActiveView] = useState<'form' | 'chat'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [isEditingTrip, setIsEditingTrip] = useState(false);

  useEffect(() => {
    loadChats();
    const savedChatId = localStorage.getItem('activeTravelChatId');
    if (savedChatId) {
      loadChatDetails(savedChatId);
    }
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
      setIsEditingTrip(false);
      localStorage.setItem('activeTravelChatId', chatId);
    } catch (error) {
      console.error("Failed to load chat details", error);
      localStorage.removeItem('activeTravelChatId');
      setActiveView('form');
    }
  };

  const handleGenerateItinerary = async (data: TripRequest) => {
    setIsGenerating(true);
    try {
      const result = await TravelAPI.generateItinerary(data);
      await loadChats();
      await loadChatDetails(result.chat_id);
      setIsEditingTrip(false);
    } catch (error) {
      console.error("Failed to generate itinerary", error);
      alert("Something went wrong while generating the itinerary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSubmit = async (data: TripRequest, action?: 'new' | 'update') => {
    if (action === 'new' || !activeChatId) {
      await handleGenerateItinerary(data);
    } else {
      setIsGenerating(true);
      try {
        const result = await TravelAPI.updateItinerary(activeChatId, data);
        await loadChats();
        await loadChatDetails(result.chat_id);
        setIsEditingTrip(false);
      } catch (error) {
        console.error("Failed to update itinerary", error);
        alert("Something went wrong while updating the itinerary.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setChatDetails(null);
    setActiveView('form');
    setIsEditingTrip(false);
    localStorage.removeItem('activeTravelChatId');
  };

  const handleDeleteChat = async (chatId: string) => {
    // Optional: Add a simple confirmation dialog native to browser
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    
    try {
      await TravelAPI.deleteChat(chatId);
      await loadChats();
      
      // If the deleted chat was the currently active one, reset the view
      if (activeChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
      alert("Failed to delete the trip.");
    }
  };

  // Helper to construct TripRequest from chat details, memoized to prevent form reset during re-render
  const tripData = useMemo((): TripRequest | undefined => {
    if (!chatDetails || !chatDetails.itinerary_data) return undefined;
    const { destination, days, people, adults, children, budget, currency, travel_type } = chatDetails.itinerary_data;
    
    return {
      destination: destination || '',
      days: days || 3,
      budget: budget || 1000,
      currency: currency || 'USD',
      travel_type: travel_type || 'Luxury',
      people: chatDetails.itinerary_data.people || 2,
      adults: chatDetails.itinerary_data.adults || 2,
      children: chatDetails.itinerary_data.children || 0
    };
  }, [chatDetails]);

  return (
    <div className="flex h-screen w-full bg-mainBg font-sans text-textPrimary selection:bg-primaryBlue/20">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-borderLight)_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primaryBlue rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-mintGreen rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-softCoral rounded-full mix-blend-multiply filter blur-[120px] opacity-15"></div>
      </div>

      {/* Main Layout */}
      <div className="z-10 flex w-full h-full relative">
        <Sidebar 
          chats={chats} 
          activeChatId={activeChatId} 
          onSelectChat={loadChatDetails}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
        
        <main className={`flex-1 overflow-y-auto flex flex-col items-center justify-start ${activeView === 'form' ? 'pt-12 lg:pt-16 pb-12 px-6 lg:px-12 xl:px-20' : ''}`}>
          {activeView === 'form' ? (
            <div className="w-full max-w-2xl flex flex-col items-center justify-center transition-all duration-500">
              {!isGenerating && (
                <div className="text-center mb-8 transform transition-all duration-500 hover:-translate-y-1">
                  {chats.length === 0 ? (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-[0_10px_30px_rgba(79,142,247,0.15)] mb-6 border border-borderLight transition-all duration-300 hover:shadow-[0_15px_40px_rgba(79,142,247,0.25)] hover:scale-105">
                          <Compass className="text-primaryBlue drop-shadow-sm" size={32} strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-textPrimary tracking-tight mb-3">Plan your first journey ✨</h1>
                        <p className="text-textSecondary text-lg font-medium tracking-wide">Let our AI craft the perfect itinerary for your next adventure.</p>
                      </>
                  ) : (
                      <h1 className="text-3xl font-extrabold text-textPrimary tracking-tight mb-2">Create a New Trip ✈️</h1>
                  )}
                </div>
              )}
              <div className="w-full">
                <TravelForm onSubmit={handleGenerateItinerary} isLoading={isGenerating} />
              </div>
            </div>
          ) : (
            chatDetails && (
              <div className="w-full h-full flex flex-col">
                {isEditingTrip ? (
                  <TravelForm 
                    initialData={tripData} 
                    mode="edit" 
                    onSubmit={handleEditSubmit} 
                    isLoading={isGenerating}
                    onCancel={() => setIsEditingTrip(false)}
                  />
                ) : (
                  <TripSummaryCard 
                    data={tripData!} 
                    onEdit={() => setIsEditingTrip(true)} 
                  />
                )}
                
                <div className="flex-1 overflow-hidden">
                   <ChatInterface 
                     chatId={activeChatId as string}
                     initialItinerary={chatDetails.itinerary_data?.final_itinerary || ''}
                     initialMessages={chatDetails.messages || []}
                   />
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
