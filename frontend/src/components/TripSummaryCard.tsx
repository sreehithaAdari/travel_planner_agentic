import React from 'react';
import { TripRequest } from '../api';
import { Plane, MapPin, Calendar, Users, DollarSign, Edit2 } from 'lucide-react';

interface TripSummaryCardProps {
  data: TripRequest;
  onEdit: () => void;
}

export function TripSummaryCard({ data, onEdit }: TripSummaryCardProps) {
  const isFamily = data.people > 2;
  const isLuxury = data.travel_type === 'Luxury';
  
  const moodEmoji = isFamily ? '👨‍👩‍👧' : isLuxury ? '🌴' : '⚡';
  const moodText = isFamily ? 'Family/Group' : isLuxury ? 'Relaxed' : 'Adventure';

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl px-10 py-5 border-b border-borderLight flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0 relative z-20 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-2.5 text-textPrimary">
          <MapPin className="text-primaryBlue" size={20} strokeWidth={2.5} />
          <span className="font-extrabold text-lg tracking-tight">{data.destination}</span>
        </div>
        
        <div className="w-px h-6 bg-borderLight hidden md:block"></div>
        
        <div className="flex items-center gap-2 text-textSecondary font-medium">
          <Calendar className="text-mintGreen" size={18} />
          <span>{data.days} Days</span>
        </div>
        
        <div className="flex items-center gap-2 text-textSecondary font-medium">
          <Users className="text-softCoral" size={18} />
          <span>{data.people} People</span>
        </div>
        
        <div className="flex items-center gap-2 text-textSecondary font-medium">
          <DollarSign className="text-green-500" size={18} />
          <span>{data.budget} {data.currency}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="bg-lightBlue text-primaryBlue px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5">
            {moodEmoji} {moodText}
          </span>
        </div>
      </div>
      
      <button 
        onClick={onEdit}
        className="flex items-center gap-2 px-5 py-2.5 bg-mainBg hover:bg-lightBlue hover:text-primaryBlue text-textSecondary rounded-full transition-all duration-200 font-bold text-sm flex-shrink-0 border border-transparent hover:border-primaryBlue/20 hover:scale-105"
      >
        <Edit2 size={16} strokeWidth={2.5} />
        Edit Trip
      </button>
    </div>
  );
}
