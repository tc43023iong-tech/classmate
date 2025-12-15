import React, { useState, useEffect } from 'react';
import { Student, HistoryLog } from '../types';
import { getPokemonImage, POSITIVE_BEHAVIORS, NEGATIVE_BEHAVIORS } from '../constants';
import { X, Shield, Swords, Zap, Repeat, History, Keyboard, Sparkles } from 'lucide-react';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  logs: HistoryLog[];
  onApplyBehavior: (points: number, reason: string) => void;
  onSwitchPokemon: (studentId: string) => void;
}

const BattleModal: React.FC<BattleModalProps> = ({ isOpen, onClose, student, logs, onApplyBehavior, onSwitchPokemon }) => {
  const [animations, setAnimations] = useState<{id: number, text: string, type: 'good' | 'bad'}[]>([]);
  const [activeTab, setActiveTab] = useState<'actions' | 'history'>('actions');
  const [manualAmount, setManualAmount] = useState<string>('');
  
  // New effects state
  const [showFirework, setShowFirework] = useState(false);
  const [showRain, setShowRain] = useState(false);

  if (!isOpen || !student) return null;

  const level = Math.floor(student.points / 10) + 1;
  const expPercentage = (student.points % 10) * 10;

  const handleAction = (points: number, reason: string) => {
    onApplyBehavior(points, reason);
    triggerEffect(points);
  };

  const handleManualSubmit = (multiplier: 1 | -1) => {
    const val = parseInt(manualAmount);
    if (!isNaN(val) && val !== 0) {
      const points = val * multiplier;
      onApplyBehavior(points, 'Manual Input');
      triggerEffect(points);
      setManualAmount('');
    }
  };

  const triggerEffect = (points: number) => {
    // Add floating text
    const id = Date.now();
    setAnimations(prev => [...prev, {
      id,
      text: points > 0 ? `+${points}` : `${points}`,
      type: points > 0 ? 'good' : 'bad'
    }]);
    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a.id !== id));
    }, 1000);

    // Trigger visual effects
    if (points > 0) {
        setShowFirework(true);
        setTimeout(() => setShowFirework(false), 1000);
    } else {
        setShowRain(true);
        setTimeout(() => setShowRain(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-pixel">
      <div className="bg-white w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 flex flex-col md:flex-row relative h-[90vh] md:h-[650px]">
        
        {/* Visual Effects Overlay */}
        {showRain && (
             <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-10 bg-blue-500 rounded-full animate-rain" 
                         style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.5}s` }}></div>
                ))}
             </div>
        )}

        {showFirework && (
            <div className="absolute inset-0 pointer-events-none z-[60] flex items-center justify-center">
                 {[...Array(12)].map((_, i) => (
                    <div key={i} 
                         className="absolute w-4 h-4 rounded-full bg-yellow-400 animate-firework"
                         style={{ 
                             '--x': '0px', '--y': '0px',
                             '--final-x': `${Math.cos(i * 30 * Math.PI / 180) * 150}px`,
                             '--final-y': `${Math.sin(i * 30 * Math.PI / 180) * 150}px`,
                             backgroundColor: ['#ff0000', '#ffd700', '#00ff00', '#0000ff'][i % 4]
                         } as React.CSSProperties}>
                    </div>
                 ))}
            </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-200 text-slate-600 border-2 border-slate-400 hover:bg-red-500 hover:text-white hover:border-red-700 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left Side: Student & Avatar */}
        <div className="w-full md:w-4/12 bg-slate-50 p-6 flex flex-col items-center border-b-4 md:border-b-0 md:border-r-4 border-slate-200 relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-200 rounded-full opacity-50 z-0"></div>

          <div className="z-10 w-full flex flex-col items-center h-full">
              <div className="w-full bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm mb-6">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-wide">{student.name}</h2>
                    <span className="text-xl font-bold text-slate-500">Lv.{level}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                   <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `100%` }}></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                     <div className="h-2 w-full bg-slate-100 rounded-full mt-1 border border-slate-300 mr-2">
                         <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${expPercentage}%` }}></div>
                     </div>
                     <span className="text-sm font-bold text-slate-400 whitespace-nowrap">{student.points} XP</span>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative w-full">
                 {/* Floating Numbers */}
                 {animations.map(anim => (
                   <div 
                     key={anim.id}
                     className={`absolute top-0 text-7xl font-black z-50 animate-float-up pointer-events-none drop-shadow-md
                       ${anim.type === 'good' ? 'text-green-500' : 'text-red-500'}
                     `}
                     style={{ textShadow: '2px 2px 0 #fff' }}
                   >
                     {anim.text}
                   </div>
                 ))}

                 <img 
                   src={getPokemonImage(student.avatarId)} 
                   className={`w-64 h-64 object-contain drop-shadow-2xl animate-bounce-short z-10 ${animations.some(a => a.type === 'bad') ? 'animate-shake' : ''}`}
                   alt="Pokemon"
                 />
                 <div className="absolute bottom-10 w-40 h-8 bg-black/10 rounded-[100%] blur-md"></div>
              </div>

              <button 
                onClick={() => onSwitchPokemon(student.id)}
                className="mt-auto flex items-center gap-2 px-6 py-3 bg-white text-slate-600 border-2 border-slate-300 hover:border-poke-blue hover:text-poke-blue rounded-full text-lg font-bold shadow-sm transition-all w-full justify-center"
              >
                <Repeat size={20} />
                Switch Form
              </button>
          </div>
        </div>

        {/* Right Side: Tabs & Content */}
        <div className="w-full md:w-8/12 bg-white flex flex-col h-full">
          
          {/* Tabs */}
          <div className="flex border-b-4 border-slate-100">
            <button 
               onClick={() => setActiveTab('actions')}
               className={`flex-1 py-4 text-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'actions' ? 'bg-white text-slate-800 border-b-4 border-poke-red -mb-1' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
               <Zap size={24} /> Actions
            </button>
            <button 
               onClick={() => setActiveTab('history')}
               className={`flex-1 py-4 text-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-white text-slate-800 border-b-4 border-poke-red -mb-1' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
               <History size={24} /> Log
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
            
            {activeTab === 'actions' && (
              <div className="space-y-8">
                 
                 {/* Manual Input Section */}
                 <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm">
                    <label className="flex items-center gap-2 text-indigo-900 font-bold mb-2 uppercase tracking-wide text-sm">
                       <Keyboard size={18} /> Manual Adjustment
                    </label>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         placeholder="0"
                         value={manualAmount}
                         onChange={(e) => setManualAmount(e.target.value)}
                         className="flex-1 border-2 border-slate-200 rounded-lg px-4 text-2xl font-bold focus:border-indigo-400 focus:outline-none text-center"
                       />
                       <button onClick={() => handleManualSubmit(1)} className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all">
                          ADD
                       </button>
                       <button onClick={() => handleManualSubmit(-1)} className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all">
                          SUB
                       </button>
                    </div>
                 </div>

                 {/* Positive Grid */}
                 <div>
                    <h3 className="text-green-600 font-bold text-xl uppercase mb-3 flex items-center gap-2">
                       <Sparkles size={20} /> Power Up
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {POSITIVE_BEHAVIORS.map((b) => (
                          <button
                            key={b.label}
                            onClick={() => handleAction(b.points, b.label)}
                            className="bg-white border-2 border-green-100 hover:border-green-400 hover:bg-green-50 p-3 rounded-xl text-left transition-all active:scale-95 shadow-sm group"
                          >
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700 group-hover:text-green-700">{b.label}</span>
                                <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded border border-green-200">+{b.points}</span>
                             </div>
                             <span className="text-slate-400 text-sm">{b.labelZh}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Negative Grid */}
                 <div>
                    <h3 className="text-red-500 font-bold text-xl uppercase mb-3 flex items-center gap-2">
                       <Swords size={20} /> Penalty
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {NEGATIVE_BEHAVIORS.map((b) => (
                          <button
                            key={b.label}
                            onClick={() => handleAction(b.points, b.label)}
                            className="bg-white border-2 border-red-100 hover:border-red-400 hover:bg-red-50 p-3 rounded-xl text-left transition-all active:scale-95 shadow-sm group"
                          >
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700 group-hover:text-red-700">{b.label}</span>
                                <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-0.5 rounded border border-red-200">{b.points}</span>
                             </div>
                             <span className="text-slate-400 text-sm">{b.labelZh}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'history' && (
               <div className="space-y-2">
                  {logs.length === 0 ? (
                     <div className="text-center py-10 text-slate-400 text-xl">
                        No history records yet.
                     </div>
                  ) : (
                     logs.map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-lg border-2 border-slate-100 flex items-center justify-between">
                           <div>
                              <div className="font-bold text-slate-800 text-lg">{log.reason || 'Manual Adjustment'}</div>
                              <div className="text-slate-400 text-sm">
                                 {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                           </div>
                           <span className={`text-2xl font-black ${log.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {log.amount > 0 ? '+' : ''}{log.amount}
                           </span>
                        </div>
                     ))
                  )}
               </div>
            )}

          </div>
          
        </div>

      </div>
    </div>
  );
};

export default BattleModal;