import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { 
  MapPin, 
  Calendar, 
  Utensils, 
  Hotel, 
  Info, 
  Lightbulb, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  Compass,
  DollarSign
} from 'lucide-react';

interface Activity {
  time: string;
  activity: string;
  location: string;
  details: string;
}

interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
  food: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  stay: {
    hotel_name: string;
    type: string;
    approx_price: string;
  };
}

interface ItineraryData {
  destination: string;
  summary: string;
  budget_assessment: string;
  total_budget_estimate: string;
  budget_breakdown?: Record<string, number>;
  day_wise_plan: DayPlan[];
  must_visit_places: string[];
  food_recommendations: string[];
  travel_tips: string[];
  local_insights: string[];
  packing_suggestions: string[];
}

interface ItineraryDisplayProps {
  data: ItineraryData;
}

export function ItineraryDisplay({ data }: ItineraryDisplayProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 pb-10"
    >
      
      {/* Hero Summary Section */}
      <motion.section variants={item} className="bg-gradient-to-br from-white to-lightBlue/50 p-10 rounded-[2rem] border border-borderLight shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-4xl font-extrabold text-textPrimary flex items-center gap-4 tracking-tight">
            <Compass className="text-primaryBlue" size={36} strokeWidth={2.5} />
            {data.destination}
          </h2>
        </div>
        <p className="text-textSecondary leading-[1.7] text-xl font-medium mb-10 border-l-[4px] border-primaryBlue pl-6">
          "{data.summary}"
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-5 rounded-[1.5rem] border border-borderLight shadow-sm">
          {/* Budget Analysis Text */}
          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-extrabold text-textPrimary mb-3 flex items-center gap-2 uppercase tracking-widest">
              <DollarSign size={18} className={data.budget_assessment?.startsWith('Insufficient') ? 'text-softCoral' : 'text-mintGreen'} strokeWidth={2.5} />
              Budget Analysis
            </h4>
            <div className={`p-4 rounded-xl border ${data.budget_assessment?.startsWith('Insufficient') ? 'bg-coralBg border-softCoral/20 text-[#d9777f]' : 'bg-lightMint border-mintGreen/30 text-[#4ab894]'}`}>
              <p className="text-sm font-medium leading-relaxed">{data.budget_assessment || "Optimized for your requirements."}</p>
            </div>
          </div>

          {/* Budget Data Pie Chart */}
          {data.budget_breakdown && Object.keys(data.budget_breakdown).length > 0 && (
            <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-borderLight pt-5 lg:pt-0 lg:pl-5">
              <h4 className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-2">Distribution</h4>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(data.budget_breakdown)
                        .map(([name, value]) => {
                          const numValue = typeof value === 'number' 
                            ? value 
                            : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
                          return { name, value: numValue };
                        })
                        .filter(item => item.value > 0)}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {Object.keys(data.budget_breakdown).map((_, index) => {
                        const COLORS = ['#4F8EF7', '#6ED3B1', '#FF9AA2', '#FDE2E4', '#C2E1F5'];
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '1rem', border: '1px solid #E6EAF0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#2D3748' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#718096' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Local Insights & Packing (Dynamic Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white border border-borderLight p-7 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5">
          <h3 className="text-xs font-bold text-textPrimary flex items-center gap-2 mb-5 uppercase tracking-widest">
            <Lightbulb className="text-yellow-500" size={18} strokeWidth={2.5} />
            Local Insights
          </h3>
          <ul className="space-y-3">
            {data.local_insights.map((insight, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-textSecondary font-medium">
                <CheckCircle2 size={18} className="text-mintGreen mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={item} className="bg-white border border-borderLight p-7 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-0.5">
          <h3 className="text-xs font-bold text-textPrimary flex items-center gap-2 mb-5 uppercase tracking-widest">
            <Briefcase className="text-primaryBlue" size={18} strokeWidth={2.5} />
            Packing Suggestions
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {data.packing_suggestions.map((item, idx) => (
              <span key={idx} className="bg-mainBg px-4 py-2 rounded-xl text-xs font-bold tracking-wide text-textSecondary border border-borderLight transition-all hover:bg-lightBlue hover:text-primaryBlue hover:border-primaryBlue/30">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Day-by-Day Journey */}
      <div className="space-y-12 relative mt-4">
        {/* Timeline Line */}
        <div className="absolute left-[19px] top-10 bottom-10 w-1 bg-gradient-to-b from-primaryBlue via-mintGreen to-softCoral/20 hidden md:block rounded-full" />

        {data.day_wise_plan.map((day, dIdx) => (
          <motion.div variants={item} key={dIdx} className="relative md:pl-16">
            {/* Day Number Badge */}
            <div className="absolute left-0 top-6 w-10 h-10 bg-white border-4 border-primaryBlue rounded-full flex items-center justify-center z-10 hidden md:flex shadow-sm">
              <span className="font-extrabold text-primaryBlue text-sm">{day.day}</span>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-borderLight overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-default group/card">
              <div className="bg-lightBlue px-8 py-6 lg:px-10 lg:py-7 border-b border-borderLight flex justify-between items-center transition-colors group-hover/card:bg-[#e0ecff]">
                <h4 className="text-2xl font-extrabold text-textPrimary tracking-tight">Day {day.day}: {day.title}</h4>
                <div className="flex items-center gap-2 text-[12px] font-bold text-primaryBlue uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm">
                   <Calendar size={16} />
                   Itinerary Peak
                </div>
              </div>

              <div className="p-8 lg:p-10 space-y-10">
                {/* Activities */}
                <div className="space-y-10">
                   {day.activities.map((act, aIdx) => (
                      <div key={aIdx} className="flex gap-4 group/act">
                        <div className="flex flex-col items-center gap-1.5 mt-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-sm z-10 ${act.time === 'morning' ? 'bg-yellow-400' : act.time === 'afternoon' ? 'bg-orange-400' : 'bg-indigo-400'}`} />
                          <div className="w-0.5 flex-1 bg-borderLight last:hidden group-hover/act:bg-primaryBlue/30 transition-colors" />
                        </div>
                        <div className="flex-1 pb-5">
                           <div className="flex items-center gap-2.5 mb-1.5">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-textSecondary bg-mainBg px-2.5 py-1 rounded-lg border border-borderLight shadow-sm">{act.time}</span>
                             <h5 className="font-bold text-textPrimary text-base tracking-tight">{act.activity}</h5>
                           </div>
                           <div className="flex items-center gap-1.5 text-[13px] text-primaryBlue font-bold mb-2.5 bg-lightBlue/50 inline-flex px-2 py-0.5 rounded-md">
                             <MapPin size={12} strokeWidth={2.5} />
                             {act.location}
                           </div>
                           <p className="text-[15px] font-medium text-textSecondary leading-[1.7] border-l-[3px] border-borderLight pl-5 group-hover/act:border-primaryBlue transition-colors">
                             {act.details}
                           </p>
                        </div>
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-borderLight mt-4">
                  {/* Food Section (Soft Coral) */}
                  <div className="bg-coralBg p-6 lg:p-8 rounded-[1.5rem] border border-softCoral/30 transition-all hover:shadow-[0_4px_15px_rgba(255,154,162,0.15)]">
                    <h5 className="text-[11px] font-extrabold text-[#d9777f] flex items-center gap-2 uppercase tracking-widest mb-4">
                       <Utensils size={16} strokeWidth={2.5} />
                       Dining Plan
                    </h5>
                    <div className="space-y-3">
                       <div className="flex justify-between items-start gap-4">
                         <span className="text-[11px] font-bold text-[#e08b93] w-16 uppercase tracking-wider">Breakfast</span>
                         <span className="text-sm font-medium text-textPrimary flex-1">{day.food.breakfast}</span>
                       </div>
                       <div className="flex justify-between items-start gap-4">
                         <span className="text-[11px] font-bold text-[#e08b93] w-16 uppercase tracking-wider">Lunch</span>
                         <span className="text-sm font-medium text-textPrimary flex-1">{day.food.lunch}</span>
                       </div>
                       <div className="flex justify-between items-start gap-4">
                         <span className="text-[11px] font-bold text-[#e08b93] w-16 uppercase tracking-wider">Dinner</span>
                         <span className="text-sm font-medium text-textPrimary flex-1">{day.food.dinner}</span>
                       </div>
                    </div>
                  </div>

                  {/* Stay Section (Light Mint) */}
                  <div className="bg-lightMint p-5 rounded-[1.5rem] border border-mintGreen/30 transition-all hover:shadow-[0_4px_15px_rgba(110,211,177,0.15)]">
                     <h5 className="text-[11px] font-extrabold text-[#4ab894] flex items-center gap-2 uppercase tracking-widest mb-4">
                       <Hotel size={16} strokeWidth={2.5} />
                       Tonight's Stay
                    </h5>
                    <div className="flex flex-col gap-2.5 mt-1">
                       <span className="font-extrabold text-textPrimary text-base tracking-tight">{day.stay.hotel_name}</span>
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] bg-white border border-[#4ab894]/20 px-2.5 py-1 rounded-lg text-[#4ab894] font-extrabold uppercase tracking-widest shadow-sm">{day.stay.type}</span>
                         <span className="text-xs text-[#52b395] font-bold">{day.stay.approx_price}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Lists */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
         <div className="bg-textPrimary text-white p-7 rounded-[2rem] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
           <h3 className="text-[11px] font-bold text-mintGreen flex items-center gap-2 mb-5 uppercase tracking-widest">
             <MapPin size={18} strokeWidth={2.5} />
             Must Visit
           </h3>
           <ul className="space-y-3">
             {data.must_visit_places.map((place, idx) => (
               <li key={idx} className="text-sm font-medium border-b border-white/10 pb-3 last:border-0">{place}</li>
             ))}
           </ul>
         </div>

         <div className="bg-coralBg border border-softCoral/20 p-7 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
           <h3 className="text-[11px] font-bold text-[#d9777f] flex items-center gap-2 mb-5 uppercase tracking-widest">
             <Utensils size={18} strokeWidth={2.5} />
             Food Scene
           </h3>
           <ul className="space-y-3">
             {data.food_recommendations.map((food, idx) => (
               <li key={idx} className="text-sm font-medium text-textPrimary flex items-start gap-2.5">
                 <div className="w-2 h-2 rounded-full bg-softCoral mt-1.5 flex-shrink-0" />
                 <span className="leading-relaxed">{food}</span>
               </li>
             ))}
           </ul>
         </div>

         <div className="bg-lightMint border border-mintGreen/30 p-7 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
           <h3 className="text-[11px] font-bold text-[#4ab894] flex items-center gap-2 mb-5 uppercase tracking-widest">
             <Info size={18} strokeWidth={2.5} />
             Travel Tips
           </h3>
           <ul className="space-y-4">
             {data.travel_tips.map((tip, idx) => (
               <li key={idx} className="text-xs font-medium text-textPrimary leading-relaxed bg-white/60 p-3 rounded-2xl shadow-sm border border-white">
                 {tip}
               </li>
             ))}
           </ul>
         </div>
      </motion.div>
    </motion.div>
  );
}
