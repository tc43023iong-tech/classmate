import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, Info, AlertCircle, FileUp, CheckCircle } from 'lucide-react';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportScores: (data: { studentId: string; points: number }[]) => void;
  onExportScores: () => void;
}

const DataModal: React.FC<DataModalProps> = ({ isOpen, onClose, onImportScores, onExportScores }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseContent = (text: string) => {
    const lines = text.split('\n');
    return lines
      .map(line => {
        // 支援多種分隔符：逗號、Tab、空格
        const parts = line.split(/,|\t|\s+/).map(s => s.trim()).filter(Boolean);
        
        if (parts.length >= 2) {
            // 優先假設最後一個數字是分數，其前一個是學號
            // 如果只有兩個部分，則 [0] 是 ID, [1] 是分數
            const points = parseInt(parts[parts.length - 1]);
            const studentId = parts.length === 2 ? parts[0] : parts[parts.length - 2];
            
            if (!isNaN(points) && studentId) {
                return { studentId, points };
            }
        }
        return null;
      })
      .filter((item): item is { studentId: string; points: number } => item !== null);
  };

  const handleImport = () => {
    setError(null);
    setSuccess(null);
    const parsedData = parseContent(inputText);

    if (parsedData.length === 0) {
      setError("找不到有效的學號與分數資料。請檢查格式！");
      return;
    }

    onImportScores(parsedData);
    setSuccess(`成功導入 ${parsedData.length} 位學生的成績！`);
    setInputText('');
    setTimeout(() => {
        setSuccess(null);
        onClose();
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      setError(null);
      
      const count = parseContent(content).length;
      if (count > 0) {
        setSuccess(`已讀取檔案，偵測到 ${count} 筆資料`);
      } else {
        setError("檔案內容格式不正確，無法辨識資料");
      }
    };
    reader.onerror = () => setError("讀取檔案時發生錯誤");
    reader.readAsText(file);
    
    // 重置 input 以允許再次選擇同一個檔案
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-pixel">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border-4 border-slate-900 animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-4 bg-emerald-600 text-white border-b-4 border-slate-900">
          <h3 className="text-2xl font-bold flex items-center gap-2 uppercase tracking-wide">
            <FileSpreadsheet size={24} />
            資料中心 (Admin Terminal)
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-slate-50 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* 導出區塊 */}
          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
             <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">導出成績報表</h4>
             <p className="text-slate-500 mb-4 text-lg">下載目前的班級積分表為 CSV 檔案，可用 Excel 開啟。</p>
             <button 
               onClick={onExportScores}
               className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-poke-blue text-white rounded-lg font-bold border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all text-xl"
             >
                <Download size={24} />
                下載成績檔案 (.CSV)
             </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="flex-shrink mx-4 text-slate-400 font-bold text-sm uppercase">OR</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          {/* 導入區塊 */}
          <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-wide">批次更新分數</h4>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-lg border-2 border-emerald-100 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <FileUp size={20} />
                  上傳 CSV 檔案
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv,.txt" 
                  className="hidden" 
                />
             </div>

             <div className="mb-4 bg-amber-50 text-amber-900 p-3 rounded border-2 border-amber-200 text-sm flex items-start gap-2">
                <Info className="shrink-0 mt-0.5" size={16} />
                <p>上傳檔案或貼上列表。格式：<b>學號 分數</b> (每行一筆)。系統將自動匹配現有學生。</p>
             </div>

             {error && (
               <div className="mb-4 bg-red-50 text-red-600 p-3 rounded border-2 border-red-200 text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle size={16} />
                  {error}
               </div>
             )}

             {success && (
               <div className="mb-4 bg-green-50 text-green-600 p-3 rounded border-2 border-green-200 text-sm flex items-center gap-2 animate-bounce-short">
                  <CheckCircle size={16} />
                  {success}
               </div>
             )}

             <textarea
               className="w-full h-40 p-3 border-2 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-base"
               placeholder={`學號101 45\n學號102 52\n學號103 38`}
               value={inputText}
               onChange={(e) => {
                 setInputText(e.target.value);
                 setError(null);
                 setSuccess(null);
               }}
             />

             <button
               onClick={handleImport}
               disabled={!inputText.trim()}
               className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-bold border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Upload size={24} />
                執行批次更新
             </button>
          </div>

        </div>

        <div className="p-4 bg-slate-100 border-t-4 border-slate-900 text-right">
           <button onClick={onClose} className="text-slate-500 font-bold hover:text-slate-700 text-xl px-4 py-2">取消並關閉</button>
        </div>

      </div>
    </div>
  );
};

export default DataModal;