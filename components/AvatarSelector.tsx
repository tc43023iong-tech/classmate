import React, { useMemo, useState } from 'react';
import { getPokemonImage, TOTAL_POKEMON_AVAILABLE } from '../constants';
import { X, Search } from 'lucide-react';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  currentAvatarId?: number;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ isOpen, onClose, onSelect, currentAvatarId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const pokemonIds = useMemo(() => Array.from({ length: TOTAL_POKEMON_AVAILABLE }, (_, i) => i + 1), []);

  const filteredIds = useMemo(() => {
    if (!searchTerm) return pokemonIds;
    return pokemonIds.filter(id => id.toString().includes(searchTerm));
  }, [pokemonIds, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-pixel">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border-4 border-slate-900">
        
        <div className="flex items-center justify-between p-4 border-b-4 border-slate-900 bg-poke-red text-white">
          <h3 className="text-2xl font-bold uppercase tracking-wide">Choose Partner Pokémon</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="p-4 bg-slate-100 border-b-2 border-slate-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by ID (e.g. 25)..." 
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-400 rounded text-xl focus:border-poke-blue focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredIds.map((id) => (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`
                  relative group aspect-square rounded-lg flex items-center justify-center p-2 transition-all border-2
                  ${currentAvatarId === id 
                    ? 'bg-blue-100 border-poke-blue scale-105 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-lg hover:scale-110'}
                `}
              >
                <img
                  src={getPokemonImage(id)}
                  alt={`Pokemon ${id}`}
                  loading="lazy"
                  className="w-full h-full object-contain drop-shadow-sm group-hover:drop-shadow-md pixelated"
                />
                <span className="absolute bottom-1 right-2 text-sm text-slate-500 font-bold">#{id}</span>
              </button>
            ))}
            {filteredIds.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500 text-xl">
                No Pokemon found.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t-4 border-slate-900 bg-slate-800 text-center text-xl text-white font-bold tracking-wide">
          SELECT A POKÉMON TO JOIN YOUR TEAM
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;