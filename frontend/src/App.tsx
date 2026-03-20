import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TravelForm } from './components/TravelForm';
import { ChatInterface } from './components/ChatInterface';
import { TripSummaryCard } from './components/TripSummaryCard';
import { TravelAPI, TripRequest } from './api';

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

  // Helper to construct TripRequest from chat details
  const getTripData = (): TripRequest | undefined => {
    if (!chatDetails || !chatDetails.itinerary_data) return undefined;
    const { destination, days, people, adults, children, budget, currency, travel_type } = chatDetails.itinerary_data;
    // We assume backend stored adults/people/children correctly. If people isn't explicitly mapped in the previous API response, we derive it.
    // The previously mapped API response has destination, days, budget, currency, travel_type.
    // Wait, get_chat_details response actually didn't map adults/children/people explicitly in the db response in main.py, let's just pass defaults if missing.
    return {
      destination: destination || '',
      days: days || 3,
      budget: budget || 1000,
      currency: currency || 'USD',
      travel_type: travel_type || 'Luxury',
      // Provide reasonable fallbacks since the backend endpoint `/api/v1/chat/{chat_id}` only maps specific fields right now
      people: chatDetails.itinerary_data.people || 2,
      adults: chatDetails.itinerary_data.adults || 2,
      children: chatDetails.itinerary_data.children || 0
    };
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
          onDeleteChat={handleDeleteChat}
        />
        
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          {activeView === 'form' ? (
            <TravelForm onSubmit={handleGenerateItinerary} isLoading={isGenerating} />
          ) : (
            chatDetails && (
              <div className="w-full max-w-4xl h-full flex flex-col pt-4">
                {isEditingTrip ? (
                  <TravelForm 
                    initialData={getTripData()} 
                    mode="edit" 
                    onSubmit={handleEditSubmit} 
                    isLoading={isGenerating}
                    onCancel={() => setIsEditingTrip(false)}
                  />
                ) : (
                  <TripSummaryCard 
                    data={getTripData()!} 
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
