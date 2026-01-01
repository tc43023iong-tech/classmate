import React, { useState } from 'react';
import { X, Save, Download, Globe, RefreshCw, Key, Info, CheckCircle2, Link } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerCode: string | null;
  onSave: () => Promise<string>;
  onLoad: (code: string) => Promise<void>;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, trainerCode, onSave, onLoad }) => {
  const [inputCode, setInputCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSyncing(true);
    setStatus(null);
    try {
      const code = await onSave();
      setStatus({ type: 'success', message: `Cloud Link Established! Code: ${code}` });
    } catch (e) {
      setStatus({ type: 'error', message: 'Connection failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoad = async () => {
    if (!inputCode.trim()) return;
    setIsSyncing(true);
    setStatus(null);
    try {
      await onLoad(inputCode.trim());
      setStatus({ type: 'success', message: 'Data Synced Successfully!' });
      setTimeout(onClose, 1500);
    } catch (e) {
      setStatus({ type: 'error', message: 'Invalid code or load failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyShareLink = () => {
    if (trainerCode) {
      const url = new URL(window.location.href);
      url.searchParams.set('code', trainerCode);
      navigator.clipboard.writeText(url.toString());
      setStatus({ type: 'success', message: 'Share link copied to clipboard!' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-pixel">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border-8 border-slate-400 relative">
        
        <div className="bg-slate-800 p-4 border-b-4 border-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
             </div>
             <h3 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
               <Globe size={24} className="text-blue-400" />
               LIVE CLOUD SYNC
             </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {status && (
            <div className={`p-4 rounded-lg border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
               <CheckCircle2 size={24} />
               <span className="text-xl font-bold">{status.message}</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg border-4 border-slate-300 shadow-inner">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h4 className="text-2xl font-black text-slate-800 uppercase tracking-wide">Enable Auto-Sync</h4>
                   <p className="text-slate-500 text-lg">Once linked, scores update automatically on all devices.</p>
                </div>
                {!trainerCode && (
                  <button 
                    onClick={handleSave}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 bg-poke-red text-white rounded-lg font-bold border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSyncing ? <RefreshCw className="animate-spin" /> : <Save size={24} />}
                    CREATE CLOUD LINK
                  </button>
                )}
             </div>
             {trainerCode && (
               <div className="bg-blue-50 p-6 rounded border-2 border-blue-200 flex flex-col items-center">
                  <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Active Sync Code</span>
                  <span className="text-5xl font-black text-blue-700 tracking-[10px] my-2">{trainerCode}</span>
                  <button 
                    onClick={copyShareLink}
                    className="mt-4 flex items-center gap-2 text-blue-600 hover:underline font-bold text-xl"
                  >
                    <Link size={20} /> Copy Shareable URL
                  </button>
                  <p className="mt-2 text-slate-400 text-sm text-center italic">Tip: Bookmark this link on other computers!</p>
               </div>
             )}
          </div>

          {!trainerCode && (
            <div className="bg-slate-800 p-6 rounded-lg border-4 border-slate-900 shadow-xl text-white">
               <h4 className="text-2xl font-black uppercase tracking-wide mb-4 text-blue-400">Join Existing Session</h4>
               <div className="flex gap-4">
                  <div className="relative flex-1">
                     <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                     <input 
                       type="text" 
                       placeholder="ENTER CODE..."
                       value={inputCode}
                       onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                       className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg pl-12 pr-4 py-3 text-3xl font-black text-yellow-400 placeholder:text-slate-700 focus:border-blue-400 focus:outline-none tracking-[5px]"
                     />
                  </div>
                  <button 
                    onClick={handleLoad}
                    disabled={isSyncing || !inputCode}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-lg font-bold border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Download size={24} />
                    CONNECT
                  </button>
               </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-200 border-t-4 border-slate-400 text-center text-slate-600 font-bold uppercase tracking-widest text-sm">
           Miss Iong's Multi-Computer Sync System v2.0
        </div>

      </div>
    </div>
  );
};

export default SyncModal;