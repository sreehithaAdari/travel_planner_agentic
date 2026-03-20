import React from 'react';
import { TripRequest } from '../api';
import { Plane, MapPin, Calendar, Users, DollarSign, Edit2 } from 'lucide-react';

interface TripSummaryCardProps {
  data: TripRequest;
  onEdit: () => void;
}

export function TripSummaryCard({ data, onEdit }: TripSummaryCardProps) {
  return (
    <div className="w-full bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-pastelBlue/50 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="text-pastelBlue" size={20} />
          <span className="font-semibold text-lg">{data.destination}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="text-pastelGreen" size={18} />
          <span>{data.days} Days</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600">
          <Users className="text-pastelPink" size={18} />
          <span>{data.people} People</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600">
          <DollarSign className="text-green-500" size={18} />
          <span>{data.budget} {data.currency}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600">
          <Plane className="text-pastelPurple" size={18} />
          <span>{data.travel_type}</span>
        </div>
      </div>
      
      <button 
        onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium text-sm flex-shrink-0"
      >
        <Edit2 size={16} />
        Edit Trip
      </button>
    </div>
  );
}
