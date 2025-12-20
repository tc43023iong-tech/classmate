import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, Info, AlertCircle } from 'lucide-react';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportScores: (data: { studentId: string; points: number }[]) => void;
  onExportScores: () => void;
}

const DataModal: React.FC<DataModalProps> = ({ isOpen, onClose, onImportScores, onExportScores }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    setError(null);
    const lines = inputText.split('\n');
    const parsedData = lines
      .map(line => {
        // Try various separators: comma, tab, space
        const parts = line.split(/,|\t|\s+/).map(s => s.trim()).filter(Boolean);
        
        // We look for parts that might be ID and Score. 
        // Expecting something like "Name ID Points" or "ID Points"
        // Most common format is [Name] [ID] [Score]
        if (parts.length >= 2) {
            // Assume the last part is points, and second-to-last is ID
            const points = parseInt(parts[parts.length - 1]);
            const studentId = parts[parts.length - 2];
            
            if (!isNaN(points) && studentId) {
                return { studentId, points };
            }
        }
        return null;
      })
      .filter((item): item is { studentId: string; points: number } => item !== null);

    if (parsedData.length === 0) {
      setError("No valid student scores found. Check your formatting!");
      return;
    }

    onImportScores(parsedData);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-pixel">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border-4 border-slate-900 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-4 bg-emerald-600 text-white border-b-4 border-slate-900">
          <h3 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-wide">
            <FileSpreadsheet size={24} />
            Data Center
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-slate-50 space-y-6">
          
          {/* Export Section */}
          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
             <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">Export Results</h4>
             <p className="text-slate-500 mb-4 text-lg">Download current class standings as a CSV file for Excel/Sheets.</p>
             <button 
               onClick={onExportScores}
               className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-poke-blue text-white rounded-lg font-bold border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all text-xl"
             >
                <Download size={24} />
                Download Scores (.CSV)
             </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-4 text-slate-400 font-bold text-sm uppercase">OR</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          {/* Import Section */}
          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
             <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">Bulk Import Scores</h4>
             <div className="mb-4 bg-amber-50 text-amber-900 p-3 rounded border-2 border-amber-200 text-sm flex items-start gap-2">
                <Info className="shrink-0 mt-0.5" size={16} />
                <p>Paste score list. Format: <b>StudentId Points</b> (one per line). Existing students will be updated.</p>
             </div>

             {error && (
               <div className="mb-4 bg-red-50 text-red-600 p-3 rounded border-2 border-red-200 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
               </div>
             )}

             <textarea
               className="w-full h-40 p-3 border-2 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base"
               placeholder={`ID101 45\nID102 52\nID103 38`}
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
             />

             <button
               onClick={handleImport}
               disabled={!inputText.trim()}
               className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-bold border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Upload size={24} />
                Update All Scores
             </button>
          </div>

        </div>

        <div className="p-4 bg-slate-100 border-t-4 border-slate-900 text-right">
           <button onClick={onClose} className="text-slate-500 font-bold hover:text-slate-700 text-xl px-4 py-2">Close Terminal</button>
        </div>

      </div>
    </div>
  );
};

export default DataModal;