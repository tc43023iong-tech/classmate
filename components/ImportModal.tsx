import React, { useState } from 'react';
import { X, Upload, Info } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { name: string; studentId: string }[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    const lines = inputText.split('\n');
    const parsedData = lines
      .map(line => {
        // Support comma or tab separated
        const parts = line.split(/,|\t/).map(s => s.trim());
        if (parts.length >= 2) {
          return { name: parts[0], studentId: parts[1] };
        }
        return null;
      })
      .filter((item): item is { name: string; studentId: string } => item !== null);

    onImport(parsedData);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-pixel">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-slate-900">
        
        <div className="flex items-center justify-between p-4 bg-poke-blue text-white border-b-4 border-slate-900">
          <h3 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-wide">
            <Upload size={24} />
            Batch Import
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-slate-50">
          <div className="mb-4 bg-blue-100 text-blue-900 p-3 rounded border-2 border-blue-200 text-lg flex items-start gap-2">
            <Info className="shrink-0 mt-1" size={20} />
            <p>Paste your student list below. Format: <b>Name, Student ID</b> (one per line).</p>
          </div>

          <textarea
            className="w-full h-48 p-3 border-2 border-slate-400 rounded focus:ring-2 focus:ring-poke-blue focus:border-poke-blue font-mono text-lg"
            placeholder={`Ash Ketchum, 101\nMisty Waterflower, 102\nBrock, 103`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded transition-colors text-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!inputText.trim()}
              className="px-6 py-2 bg-poke-blue text-white font-bold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 text-xl"
            >
              Import Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;