import React, { useState } from 'react';
import { Student } from '../types';
import { getPokemonImage } from '../constants';
import { Plus, Minus, Edit2, Trash2, Zap } from 'lucide-react';

interface StudentCardProps {
  student: Student;
  onUpdatePoints: (id: string, newPoints: number) => void;
  onChangeAvatar: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenBattle: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onUpdatePoints, onChangeAvatar, onDelete, onOpenBattle }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Level Logic
  const level = Math.floor(student.points / 10) + 1;
  const expPercentage = Math.max(0, Math.min(100, (student.points % 10) * 10));

  const handleQuickPoint = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    onUpdatePoints(student.id, student.points + delta);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeAvatar(student.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Release this Pokemon (Delete student)?')) {
      onDelete(student.id);
    }
  };

  return (
    <div 
      onClick={() => onOpenBattle(student)}
      className="bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-hidden border-4 border-slate-800 hover:border-poke-blue cursor-pointer select-none flex flex-col font-pixel transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header (Gameboy style) */}
      <div className="bg-poke-red px-3 py-2 flex justify-between items-center border-b-4 border-slate-800 relative">
         {/* Screws */}
         <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-red-900 rounded-full opacity-50"></div>
         <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-900 rounded-full opacity-50"></div>

        <span className="text-white font-black text-2xl tracking-wide truncate pl-2 shadow-black drop-shadow-md">{student.name}</span>
        <div className="flex gap-1 pr-1">
           <div className="w-3 h-3 rounded-full bg-green-400 border border-green-600 animate-pulse"></div>
        </div>
      </div>

      {/* Quick Actions (Hover Overlay) */}
      <div className={`absolute top-14 right-2 z-20 flex flex-col gap-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
        <button onClick={handleEdit} className="p-2 bg-white text-slate-800 hover:text-blue-600 rounded border-2 border-slate-800 shadow-md hover:bg-blue-50" title="Switch Pokemon">
          <Edit2 size={16} />
        </button>
        <button onClick={handleDelete} className="p-2 bg-white text-slate-800 hover:text-red-600 rounded border-2 border-slate-800 shadow-md hover:bg-red-50" title="Release">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-4 bg-yellow-50 flex-1 flex flex-col relative">
        {/* Info Row */}
        <div className="flex justify-between items-end mb-2 text-slate-800">
           <span className="bg-white px-2 py-0.5 rounded border-2 border-slate-400 text-lg font-bold tracking-widest text-slate-500">ID {student.studentId}</span>
           <span className="font-bold text-xl">Lv.<span className="text-3xl">{level}</span></span>
        </div>

        {/* HP/EXP Bar */}
        <div className="flex items-center gap-1 mb-4">
           <span className="text-sm font-black text-orange-500">EXP</span>
           <div className="flex-1 h-5 bg-slate-200 rounded-sm border-2 border-slate-500 relative overflow-hidden">
               <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: `${expPercentage}%` }}></div>
               {/* Shine effect */}
               <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-30"></div>
               {/* Grid lines */}
               <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzj//v37zwjjgzhhYWGMYAIAI8YOAymwF7AAAAAASUVORK5CYII=')] opacity-10"></div>
           </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4 relative h-40">
           {/* Background Circle */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full border-4 border-slate-200 -z-0 opacity-80"></div>
           <img
            src={getPokemonImage(student.avatarId)}
            alt={student.name}
            className="h-full object-contain drop-shadow-xl z-10 group-hover:scale-110 transition-transform duration-200"
            loading="lazy"
          />
        </div>

        {/* Points Control */}
        <div className="mt-auto bg-slate-200 p-2 rounded border-4 border-slate-300 flex items-center justify-between shadow-inner">
          <button
            onClick={(e) => handleQuickPoint(e, -1)}
            className="w-10 h-10 flex items-center justify-center rounded bg-white border-b-4 border-red-400 text-red-500 hover:bg-red-50 active:border-b-0 active:translate-y-1 transition-all"
          >
            <Minus size={24} />
          </button>

          <div className="flex flex-col items-center">
             <span className={`text-4xl font-black leading-none ${student.points >= 0 ? 'text-slate-800' : 'text-red-600'} drop-shadow-sm`}>
               {student.points}
             </span>
             <span className="text-xs font-bold text-slate-500 tracking-widest">SCORE</span>
          </div>

          <button
            onClick={(e) => handleQuickPoint(e, 1)}
            className="w-10 h-10 flex items-center justify-center rounded bg-white border-b-4 border-green-400 text-green-500 hover:bg-green-50 active:border-b-0 active:translate-y-1 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
        
        {/* Battle Prompt Overlay (Hover) */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity duration-300">
           <Zap size={150} />
        </div>
      </div>
    </div>
  );
};

export default StudentCard;