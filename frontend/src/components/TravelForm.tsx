import React, { useState } from 'react';
import { TripRequest } from '../api';
import { Plane, MapPin, Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';

interface TravelFormProps {
  onSubmit: (data: TripRequest) => void;
  isLoading: boolean;
}

export function TravelForm({ onSubmit, isLoading }: TravelFormProps) {
  const [formData, setFormData] = useState<TripRequest>({
    destination: '',
    days: 3,
    people: 2,
    adults: 2,
    children: 0,
    budget: 1000,
    currency: 'USD',
    travel_type: 'Luxury'
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: typeof prev[name as keyof TripRequest] === 'number' ? Number(value) : value
    }));
  };

  const validate = () => {
    // Destination: real place (non-gibberish)
    if (!formData.destination || formData.destination.trim().length < 2 || /\d/.test(formData.destination)) {
      setError("Enter a valid place");
      return false;
    }
    // Days
    if (formData.days <= 0 || !Number.isInteger(formData.days)) {
      setError("Days must be a positive integer");
      return false;
    }
    // Budget
    if (formData.budget <= 0 || !Number.isInteger(formData.budget)) {
      setError("Budget must be a positive integer");
      return false;
    }
    // People
    if (formData.people !== formData.adults + formData.children) {
      setError("People must equal adults + children");
      return false;
    }
    if (formData.children > 0 && formData.adults < 1) {
      setError("At least one adult required");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
          <Plane className="text-blue-500" size={32} />
          Plan Your Dream Trip
        </h2>
        <p className="text-slate-500 mt-2">Let our AI craft the perfect itinerary for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-pastelBlue" />
              Destination
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g. Paris, France"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelBlue transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-pastelGreen" />
              Days
            </label>
            <input
              type="number"
              name="days"
              value={formData.days}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelGreen transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-pastelPink" />
              Adults & Children
            </label>
            <div className="flex gap-2">
               <input
                type="number"
                name="adults"
                value={formData.adults}
                onChange={handleChange}
                min="0"
                placeholder="Adults"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelPink transition-all"
                required
              />
              <input
                type="number"
                name="children"
                value={formData.children}
                onChange={handleChange}
                min="0"
                placeholder="Children"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelPink transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-pastelPink" />
              Total People
            </label>
            <input
              type="number"
              name="people"
              value={formData.people}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelPink transition-all"
              readOnly
              onClick={() => setError("Total people is evaluated from Adults + Children")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DollarSign size={16} className="text-green-500" />
              Budget & Currency
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all"
                required
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-32 px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all cursor-pointer"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Plane size={16} className="text-pastelPurple" />
              Travel Type
            </label>
            <select
              name="travel_type"
              value={formData.travel_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-pastelPurple transition-all cursor-pointer"
            >
              <option value="Luxury">Luxury</option>
              <option value="Budget-friendly">Budget-friendly</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            'Generate Itinerary'
          )}
        </button>
      </form>
    </div>
  );
}
