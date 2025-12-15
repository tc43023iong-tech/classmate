import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { getPokemonImage, POSITIVE_BEHAVIORS, NEGATIVE_BEHAVIORS } from '../constants';
import { X, Shield, Swords, Zap, Repeat } from 'lucide-react';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onApplyBehavior: (points: number, reason: string) => void;
  onSwitchPokemon: (studentId: string) => void;
}

const BattleModal: React.FC<BattleModalProps> = ({ isOpen, onClose, student, onApplyBehavior, onSwitchPokemon }) => {
  const [animations, setAnimations] = useState<{id: number, text: string, type: 'good' | 'bad'}[]>([]);

  if (!isOpen || !student) return null;

  const level = Math.floor(student.points / 10) + 1;
  const expPercentage = (student.points % 10) * 10;

  const handleAction = (points: number, reason: string) => {
    onApplyBehavior(points, reason);
    
    // Add animation
    const id = Date.now();
    setAnimations(prev => [...prev, {
      id,
      text: points > 0 ? `+${points}` : `${points}`,
      type: points > 0 ? 'good' : 'bad'
    }]);

    // Cleanup animation after 1s
    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a.id !== id));
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 font-pixel">
      <div className="bg-slate-200 w-full max-w-6xl rounded-lg overflow-hidden shadow-2xl border-4 border-slate-500 flex flex-col md:flex-row relative h-[90vh] md:h-[600px]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-red-500 text-white border-2 border-red-700 hover:bg-red-600 rounded transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left Side: The "Battle" Scene */}
        <div className="w-full md:w-5/12 bg-slate-100 p-8 flex flex-col items-center justify-end relative border-b-8 md:border-b-0 md:border-r-8 border-slate-400 shrink-0">
          
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

          {/* Stat Block */}
          <div className="absolute top-6 left-6 bg-white p-3 rounded-lg border-4 border-slate-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] w-64 max-w-full z-10">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-2xl text-slate-800 truncate mr-2 tracking-wide">{student.name}</span>
              <span className="font-bold text-lg text-slate-500">Lv.{level}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 border-2 border-slate-400 relative">
               <span className="absolute -left-8 top-0 text-xs font-bold text-orange-500 mt-0.5">HP</span>
               <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-l-full" style={{ width: `100%` }}></div>
            </div>
             <div className="w-full bg-slate-200 rounded-full h-2 mt-1 border border-slate-300">
               <div className="h-full bg-blue-400 rounded-full" style={{ width: `${expPercentage}%` }}></div>
            </div>
            <div className="text-right text-sm mt-1 text-slate-600 font-bold">
              {student.points} / {level * 10} XP
            </div>
          </div>

          {/* Pokemon Sprite Area */}
          <div className="relative mt-20 w-56 h-56 md:w-72 md:h-72 z-0 flex items-center justify-center">
             {/* Animations Overlay */}
             {animations.map(anim => (
               <div 
                 key={anim.id}
                 className={`absolute top-0 text-6xl font-black z-50 animate-float-up pointer-events-none drop-shadow-md
                   ${anim.type === 'good' ? 'text-green-500' : 'text-red-500'}
                 `}
                 style={{ textShadow: '2px 2px 0 #fff' }}
               >
                 {anim.text}
               </div>
             ))}

             <img 
               src={getPokemonImage(student.avatarId)} 
               className={`w-full h-full object-contain drop-shadow-2xl animate-bounce-short ${animations.some(a => a.type === 'bad') ? 'animate-shake' : ''}`}
               alt="Pokemon"
             />
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/10 rounded-[100%] blur-md scale-x-150"></div>
          </div>

          {/* Switch Button */}
          <button 
             onClick={() => onSwitchPokemon(student.id)}
             className="mt-12 flex items-center gap-2 px-6 py-2 bg-yellow-400 text-slate-900 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 hover:bg-yellow-300 rounded text-lg font-bold shadow-sm transition-all"
          >
             <Repeat size={20} />
             SWITCH POKÉMON
          </button>
        </div>

        {/* Right Side: Command Menu (Game Style) */}
        <div className="w-full md:w-7/12 bg-slate-800 text-white p-2 flex flex-col h-full overflow-hidden">
          
          {/* Menu Header */}
          <div className="bg-slate-700 p-4 border-b-4 border-slate-900 flex justify-between items-center shrink-0">
             <div className="text-2xl text-white font-bold tracking-widest uppercase">
               What will {student.name} do?
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-900 custom-scrollbar">
            
            {/* Power Ups Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-1 w-full bg-green-600"></div>
                 <h4 className="text-green-400 font-bold text-xl uppercase tracking-widest whitespace-nowrap">
                   Power Up
                 </h4>
                 <div className="h-1 w-full bg-green-600"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POSITIVE_BEHAVIORS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => handleAction(b.points, b.label)}
                    className="relative bg-slate-800 border-2 border-slate-600 hover:border-green-400 hover:bg-slate-700 p-3 rounded group text-left transition-colors active:scale-95"
                  >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xl text-white group-hover:text-green-300 tracking-wide">{b.label}</span>
                        <span className="bg-green-600 text-white text-lg font-bold px-2 py-0.5 rounded leading-none border border-green-400">+{b.points}</span>
                    </div>
                    <span className="text-lg text-slate-400 font-medium group-hover:text-green-200/70">{b.labelZh}</span>
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-transparent group-hover:border-green-400 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-transparent group-hover:border-green-400 transition-colors"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attacks Section */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-1 w-full bg-red-600"></div>
                 <h4 className="text-red-400 font-bold text-xl uppercase tracking-widest whitespace-nowrap">
                   Attacks
                 </h4>
                 <div className="h-1 w-full bg-red-600"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NEGATIVE_BEHAVIORS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => handleAction(b.points, b.label)}
                    className="relative bg-slate-800 border-2 border-slate-600 hover:border-red-400 hover:bg-slate-700 p-3 rounded group text-left transition-colors active:scale-95"
                  >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xl text-white group-hover:text-red-300 tracking-wide">{b.label}</span>
                        <span className="bg-red-600 text-white text-lg font-bold px-2 py-0.5 rounded leading-none border border-red-400">{b.points}</span>
                    </div>
                    <span className="text-lg text-slate-400 font-medium group-hover:text-red-200/70">{b.labelZh}</span>
                     {/* Corner Accent */}
                     <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-transparent group-hover:border-red-400 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-transparent group-hover:border-red-400 transition-colors"></div>
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          {/* Footer Text */}
          <div className="p-2 bg-black text-center text-slate-500 text-sm border-t border-slate-700">
             SELECT A MOVE TO IMPACT STUDENT XP
          </div>
        </div>

      </div>
    </div>
  );
};

export default BattleModal;