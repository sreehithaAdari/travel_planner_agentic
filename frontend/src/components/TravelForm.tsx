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
  // Allow for empty strings in the form state while typing
  const defaultState = {
    destination: '',
    days: '' as unknown as number,
    people: '' as unknown as number,
    adults: '' as unknown as number,
    children: '' as unknown as number,
    budget: '' as unknown as number,
    currency: 'USD',
    travel_type: 'Luxury'
  } as TripRequest;

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
    setFormData(prev => {
      // If the field is numerical, handle the empty string case so it doesn't default to 0
      const isNumberField = ['days', 'adults', 'children', 'budget', 'people'].includes(name);
      
      let newValue: any = value;
      if (isNumberField) {
         newValue = value === '' ? '' : Number(value);
      }

      // Auto-calculate total people
      let updatedPeople = prev.people;
      if (name === 'adults' || name === 'children') {
         const newAdults = name === 'adults' ? newValue : prev.adults;
         const newChildren = name === 'children' ? newValue : prev.children;
         
         const a = newAdults === '' ? 0 : Number(newAdults);
         const c = newChildren === '' ? 0 : Number(newChildren);
         
         updatedPeople = a + c;
      }
      
      return {
        ...prev,
        [name]: newValue,
        people: updatedPeople
      };
    });
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
    // People is now auto-calculated, so we only need to ensure there is at least one adult
    if (formData.adults < 1) {
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
    <div className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-borderLight p-8 md:p-10 w-full relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-lightBlue rounded-full mix-blend-multiply filter blur-[80px] opacity-40 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
      
      {confirmMode && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex items-center justify-center p-8 rounded-[2rem]">
          <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-borderLight max-w-sm w-full text-center transform transition-all animate-fade-in-up">
            <h3 className="text-xl font-bold text-textPrimary mb-3 flex justify-center items-center gap-2">
              <AlertCircle className="text-primaryBlue" size={24} />
              Wait a second!
            </h3>
            <p className="text-textSecondary mb-8 text-sm">
              {confirmMode === 'major' 
                ? "This will start a new trip and clear the current chat. Do you want to continue?" 
                : "Update current trip or create a new trip?"}
            </p>
            
            <div className="flex flex-col gap-3">
              {confirmMode === 'major' ? (
                <>
                  <button onClick={() => performSubmit('new')} className="w-full py-3.5 bg-primaryBlue text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(79,142,247,0.25)] hover:shadow-[0_12px_25px_rgba(79,142,247,0.35)] hover:-translate-y-0.5 transition-all">
                    Yes, Create New Trip
                  </button>
                  <button onClick={() => setConfirmMode(null)} className="w-full py-3.5 bg-mainBg text-textPrimary font-bold rounded-2xl hover:bg-slate-100 transition-all">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => performSubmit('update')} className="w-full py-3.5 bg-gradient-to-r from-mintGreen to-teal-400 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(110,211,177,0.3)] hover:-translate-y-0.5 transition-all">
                    Update Current Trip
                  </button>
                  <button onClick={() => performSubmit('new')} className="w-full py-3.5 bg-primaryBlue text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(79,142,247,0.25)] hover:shadow-[0_12px_25px_rgba(79,142,247,0.35)] hover:-translate-y-0.5 transition-all">
                    Create New Trip
                  </button>
                  <button onClick={() => setConfirmMode(null)} className="w-full mt-2 py-3.5 bg-white border border-borderLight text-textSecondary font-bold rounded-2xl hover:bg-mainBg transition-all">
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-extrabold text-textPrimary flex items-center justify-center gap-3 tracking-tight">
            {mode === 'edit' ? 'Edit Your Trip' : 'Plan Your Dream Trip'}
          </h2>
          <p className="text-textSecondary mt-2 font-medium">
            {mode === 'edit' ? 'Update your preferences below.' : 'Share your preferences to get started.'}
          </p>
        </div>
        {mode === 'edit' && onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-mainBg rounded-full transition-colors absolute top-8 right-8"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 relative">
          <div className="space-y-2">
            <label className="text-sm font-bold text-textPrimary tracking-wide flex items-center gap-2">
              Destination
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primaryBlue text-textSecondary">
                <MapPin size={20} />
              </div>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. Paris, France"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-primaryBlue/15 focus:border-primaryBlue/50 transition-all font-medium text-textPrimary hover:border-blue-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-textPrimary tracking-wide flex items-center gap-2">
              Duration (Days)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-mintGreen text-textSecondary">
                <Calendar size={20} />
              </div>
              <input
                type="number"
                name="days"
                value={formData.days === '' as unknown as number ? '' : formData.days}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 5"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-mintGreen/15 focus:border-mintGreen/50 transition-all font-medium text-textPrimary hover:border-green-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-textPrimary tracking-wide flex items-center gap-2">
              Travelers
            </label>
            <div className="flex gap-3">
               <div className="relative group flex-1">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-softCoral text-textSecondary">
                   <Users size={20} />
                 </div>
                 <input
                  type="number"
                  name="adults"
                  value={formData.adults === '' as unknown as number ? '' : formData.adults}
                  onChange={handleChange}
                  min="0"
                  placeholder="Adults"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-softCoral/15 focus:border-softCoral/50 transition-all font-medium text-textPrimary hover:border-red-200"
                  required
                />
              </div>
              <div className="relative group flex-1">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-softCoral text-textSecondary">
                   <Users size={20} className="scale-75" />
                 </div>
                 <input
                  type="number"
                  name="children"
                  value={formData.children === '' as unknown as number ? '' : formData.children}
                  onChange={handleChange}
                  min="0"
                  placeholder="Children"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-softCoral/15 focus:border-softCoral/50 transition-all font-medium text-textPrimary hover:border-red-200"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-center p-4 bg-lightBlue/50 rounded-2xl border border-lightBlue">
            <span className="text-[10px] font-bold text-primaryBlue/70 uppercase tracking-widest mb-1">Total Trip Size</span>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primaryBlue" />
              <span className="text-xl font-extrabold text-blue-900 tracking-tight">{formData.people || 0} People</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-textPrimary tracking-wide flex items-center gap-2">
              Total Budget & Currency
            </label>
            <div className="flex gap-3">
              <div className="relative group flex-[2]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-mintGreen text-textSecondary">
                  <DollarSign size={20} />
                </div>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget === '' as unknown as number ? '' : formData.budget}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 1500"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-mintGreen/15 focus:border-mintGreen/50 transition-all font-medium text-textPrimary hover:border-green-200"
                  required
                />
              </div>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="flex-1 px-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-mintGreen/15 focus:border-mintGreen/50 transition-all cursor-pointer font-bold text-textPrimary hover:border-green-200"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-textPrimary tracking-wide flex items-center gap-2">
              Travel Style
            </label>
            <div className="relative group flex-[2]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primaryBlue text-textSecondary">
                  <Plane size={20} />
                </div>
              <select
                name="travel_type"
                value={formData.travel_type}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-borderLight bg-mainBg focus:bg-white focus:outline-none focus:ring-4 focus:ring-primaryBlue/15 focus:border-primaryBlue/50 transition-all cursor-pointer font-bold text-textPrimary hover:border-blue-200"
              >
                <option value="Luxury">Luxury & Premium</option>
                <option value="Budget-friendly">Budget-Friendly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-4 border-t border-borderLight">
          {mode === 'edit' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isButtonDisabled}
              className="flex-1 bg-mainBg hover:bg-borderLight text-textSecondary font-bold py-4 rounded-2xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancel Edit
            </button>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`flex-[2] text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 ${
              mode === 'edit' 
                ? 'bg-gradient-to-r from-mintGreen to-teal-400 hover:from-teal-400 hover:to-teal-500 shadow-[0_10px_25px_rgba(110,211,177,0.25)] hover:shadow-[0_15px_35px_rgba(110,211,177,0.35)]'
                : 'bg-gradient-to-r from-primaryBlue to-mintGreen hover:from-blue-500 hover:to-teal-400 shadow-[0_10px_25px_rgba(79,142,247,0.25)] hover:shadow-[0_15px_35px_rgba(79,142,247,0.35)]'
            }`}
          >
            {isButtonDisabled ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                {isValidating ? 'Validating...' : 'Generating Planner...'}
              </>
            ) : mode === 'edit' ? (
              <>
                <RefreshCw size={20} strokeWidth={2.5} />
                Regenerate Itinerary
              </>
            ) : (
              'Generate Itinerary ✨'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
