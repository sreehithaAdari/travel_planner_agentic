import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TripRequest {
  destination: string;
  days: number;
  people: number;
  adults: number;
  children: number;
  budget: number;
  currency: string;
  travel_type: string;
}

export const TravelAPI = {
  generateItinerary: async (data: TripRequest) => {
    const response = await api.post('/generate-itinerary', data);
    return response.data;
  },
  updateItinerary: async (chatId: string, data: TripRequest) => {
    const response = await api.put(`/generate-itinerary/${chatId}`, data);
    return response.data;
  },
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },
  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  },
  getChatDetails: async (chatId: string) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },
  sendMessage: async (chatId: string, message: string) => {
    const response = await api.post(`/chat/${chatId}`, { message });
    return response.data;
  },
  newChat: async () => {
    const response = await api.post('/new-chat');
    return response.data;
  }
};
