import React, { useState, useEffect } from 'react';
import { TripRequest } from '../api';
import { Plane, MapPin, Calendar, Users, DollarSign, AlertCircle, RefreshCw, X } from 'lucide-react';

interface TravelFormProps {
  onSubmit: (data: TripRequest, action?: 'new' | 'update') => void;
  isLoading: boolean;
  initialData?: TripRequest;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

export function TravelForm({ onSubmit, isLoading, initialData, mode = 'create', onCancel }: TravelFormProps) {
  const defaultState: TripRequest = {
    destination: '',
    days: 3,
    people: 2,
    adults: 2,
    children: 0,
    budget: 1000,
    currency: 'USD',
    travel_type: 'Luxury'
  };

  const [formData, setFormData] = useState<TripRequest>(initialData || defaultState);
  const [error, setError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<'major' | 'minor' | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: typeof prev[name as keyof TripRequest] === 'number' ? Number(value) : value
    }));
  };

  const validate = async () => {
    if (!formData.destination || formData.destination.trim().length < 2 || /\d/.test(formData.destination)) {
      setError("Please enter a valid place name");
      return false;
    }
    if (formData.days <= 0 || !Number.isInteger(formData.days)) {
      setError("Days must be a positive integer");
      return false;
    }
    if (formData.budget <= 0 || !Number.isInteger(formData.budget)) {
      setError("Budget must be a positive integer");
      return false;
    }
    if (formData.people !== formData.adults + formData.children) {
      setError("People must equal adults + children");
      return false;
    }
    if (formData.children > 0 && formData.adults < 1) {
      setError("At least one adult required");
      return false;
    }

    // OpenCage Map Validation
    const apiKey = (import.meta as any).env.VITE_OPENCAGE_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(formData.destination)}&key=${apiKey}`);
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
          setError(`"${formData.destination}" could not be found. Please enter a valid place.`);
          return false;
        }
      } catch (err) {
        console.error("OpenCage API verification failed", err);
      }
    } else {
      console.warn("VITE_OPENCAGE_API_KEY is not defined in frontend env. Skipping strict place validation.");
    }

    setError(null);
    return true;
  };

  const hasDataChanged = () => {
    if (!initialData) return true;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    const isValid = await validate();
    setIsValidating(false);
    
    if (!isValid) return;

    if (mode === 'edit') {
      if (!hasDataChanged()) {
         if (onCancel) onCancel();
         return;
      }
      
      const isMajorChange = formData.destination.toLowerCase() !== initialData?.destination.toLowerCase();
      setConfirmMode(isMajorChange ? 'major' : 'minor');
    } else {
      onSubmit(formData, 'new');
    }
  };

  const performSubmit = (action: 'new' | 'update') => {
    setConfirmMode(null);
    onSubmit(formData, action);
  };

  const isButtonDisabled = isLoading || isValidating;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white mb-6 relative overflow-hidden">
      
      {/* Confirmation Modal Overlay */}
      {confirmMode && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-8 text-center animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 max-w-md w-full my-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {confirmMode === 'major' ? "Major Changes Detected" : "Update Trip"}
            </h3>
            <p className="text-slate-500 mb-8 text-sm">
              {confirmMode === 'major' 
                ? "This will start a new trip and clear the current chat. Do you want to continue?" 
                : "Update current trip or create a new trip?"}
            </p>
            
            <div className="flex flex-col gap-3">
              {confirmMode === 'major' ? (
                <>
                  <button onClick={() => performSubmit('new')} className="w-full py-3 bg-blue-500 text-white font-semibold flex-1 rounded-xl shadow-lg hover:bg-blue-600 transition-all">
                    Yes, Create New Trip
                  </button>
                  <button onClick={() => setConfirmMode(null)} className="w-full py-3 bg-slate-100 text-slate-700 font-semibold flex-1 rounded-xl hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => performSubmit('update')} className="w-full py-3 bg-gradient-to-r from-pastelPurple to-pastelPink hover:from-pink-300 hover:to-pink-400 text-slate-800 font-semibold flex-1 rounded-xl shadow-lg transition-all">
                    Update Current Trip
                  </button>
                  <button onClick={() => performSubmit('new')} className="w-full py-3 bg-blue-500 text-white font-semibold flex-1 rounded-xl hover:bg-blue-600 transition-all shadow-md">
                    Create New Trip
                  </button>
                  <button onClick={() => setConfirmMode(null)} className="w-full mt-2 py-3 bg-white border border-slate-200 text-slate-500 font-semibold flex-1 rounded-xl hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <Plane className="text-blue-500" size={32} />
            {mode === 'edit' ? 'Edit Your Trip' : 'Plan Your Dream Trip'}
          </h2>
          <p className="text-slate-500 mt-2">
            {mode === 'edit' ? 'Update your preferences below.' : 'Let our AI craft the perfect itinerary for you.'}
          </p>
        </div>
        {mode === 'edit' && onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors absolute top-6 right-6"
            title="Cancel"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
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

        <div className="flex gap-4 mt-6">
          {mode === 'edit' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isButtonDisabled}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 rounded-xl shadow-sm border border-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`flex-[2] text-white font-semibold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
              mode === 'edit' 
                ? 'bg-gradient-to-r from-pastelPurple to-pastelPink hover:from-pink-300 hover:to-pink-400 text-slate-800' 
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
            }`}
          >
            {isButtonDisabled ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                {isValidating ? 'Validating...' : 'Generating...'}
              </>
            ) : mode === 'edit' ? (
              <>
                <RefreshCw size={18} />
                Regenerate Itinerary
              </>
            ) : (
              'Generate Itinerary'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
