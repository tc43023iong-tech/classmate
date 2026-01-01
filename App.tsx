import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bot, Gamepad2, ArrowDownUp, RefreshCw, FileSpreadsheet, LayoutGrid, UserCheck, Cloud, CloudOff, Wifi, Link, X, Sparkles } from 'lucide-react';

import { Student, HistoryLog, CloudSyncData } from './types';
import { STORAGE_KEY_STUDENTS, STORAGE_KEY_LOGS, TOTAL_POKEMON_AVAILABLE, SOUND_EFFECTS, PRESET_CLASSES } from './constants';
import { generateClassReport, generateEncouragement } from './services/geminiService';

import StudentCard from './components/StudentCard';
import AvatarSelector from './components/AvatarSelector';
import BattleModal from './components/BattleModal';
import SyncModal from './components/SyncModal';
import DataModal from './components/DataModal';

type SortOption = 'id' | 'score-desc' | 'score-asc';

// --- 全局固定同步代碼 (容老師專屬) ---
// 只要使用這個 ID，全世界任何電腦打開這個網頁都會看到同一份名單
const MASTER_SYNC_ID = 'Miss_Iong_PokeClass_Master_v2'; 

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [currentClass, setCurrentClass] = useState<string>(PRESET_CLASSES[0].name);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');
  
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [avatarSelectorData, setAvatarSelectorData] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null,
  });
  
  const [battleModalData, setBattleModalData] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null,
  });

  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('id');

  const lastSyncTime = useRef<number>(0);
  const isInitialLoadDone = useRef(false);

  // 1. 初始化預設名單
  const getInitialDefaultStudents = useCallback(() => {
    const allStudents: Student[] = [];
    PRESET_CLASSES.forEach(preset => {
      const names = preset.students.split(',');
      names.forEach((name, index) => {
        allStudents.push({
          id: uuidv4(),
          name: name.trim(),
          studentId: (index + 1).toString(),
          points: 0,
          avatarId: Math.floor(Math.random() * TOTAL_POKEMON_AVAILABLE) + 1,
          classGroup: preset.name
        });
      });
    });
    return allStudents;
  }, []);

  // 2. 雲端儲存函式
  const saveToCloud = useCallback(async (currentStudents: Student[], currentLogs: HistoryLog[]) => {
    if (currentStudents.length === 0) return;
    setSyncStatus('syncing');
    try {
      const data: CloudSyncData = { students: currentStudents, logs: currentLogs, version: '2.0' };
      const response = await fetch(`https://api.npoint.io/${MASTER_SYNC_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) setSyncStatus('synced');
    } catch (e) {
      console.error("Cloud Save Error:", e);
      setSyncStatus('offline');
    }
  }, []);

  // 3. 雲端讀取函式
  const loadFromCloud = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch(`https://api.npoint.io/${MASTER_SYNC_ID}`);
      if (!res.ok) {
        // 如果雲端還沒有資料 (404)，則初始化並上傳
        if (res.status === 404 && !isInitialLoadDone.current) {
          console.log("Initializing first-time cloud data...");
          const defaults = getInitialDefaultStudents();
          setStudents(defaults);
          await saveToCloud(defaults, []);
        }
        throw new Error("No data yet");
      }
      const data: CloudSyncData = await res.json();
      if (data.students && data.students.length > 0) {
        setStudents(data.students);
        setLogs(data.logs || []);
        setSyncStatus('synced');
      }
    } catch (e) {
      console.warn("Cloud load failed, using local/default.");
      setSyncStatus('offline');
    } finally {
      isInitialLoadDone.current = true;
    }
  }, [getInitialDefaultStudents, saveToCloud]);

  // 4. 啟動：立刻嘗試從雲端抓資料
  useEffect(() => {
    loadFromCloud();
    
    // 每 15 秒背景檢查一次是否有其他電腦更新了分數
    const interval = setInterval(() => {
      // 只有在最近 5 秒內沒有點擊操作時才更新，避免打斷老師當前的加分動作
      if (Date.now() - lastSyncTime.current > 5000) {
        loadFromCloud();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [loadFromCloud]);

  // 5. 資料變動：自動儲存到雲端
  useEffect(() => {
    if (!isInitialLoadDone.current || students.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      saveToCloud(students, logs);
    }, 1500); // 延遲儲存，避免短時間內頻繁請求
    
    return () => clearTimeout(timeoutId);
  }, [students, logs, saveToCloud]);

  const classList = useMemo(() => PRESET_CLASSES.map(p => p.name), []);

  const handleUpdatePoints = useCallback((id: string, newPoints: number) => {
    lastSyncTime.current = Date.now();
    setStudents((prev) => prev.map(s => s.id === id ? { ...s, points: newPoints } : s));
    
    const student = students.find(s => s.id === id);
    if (student) {
        const delta = newPoints - student.points;
        const soundType = delta > 0 ? 'positive' : 'negative';
        const audio = new Audio(SOUND_EFFECTS[soundType][0]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }
  }, [students]);

  const addLog = (studentId: string, studentName: string, amount: number, reason?: string) => {
    const newLog: HistoryLog = { id: uuidv4(), studentName, amount, timestamp: Date.now(), reason };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleApplyBehavior = async (points: number, reason: string) => {
    if (!battleModalData.studentId) return;
    const student = students.find(s => s.id === battleModalData.studentId);
    if (!student) return;

    handleUpdatePoints(student.id, student.points + points);
    addLog(student.id, student.name, points, reason);

    setIsAiGenerating(true);
    try {
      const encouragement = await generateEncouragement(student, points > 0 ? 'add' : 'subtract');
      setAiMessage(encouragement);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiReport = async () => {
    if (filteredStudents.length === 0) return;
    setIsAiGenerating(true);
    try {
      const report = await generateClassReport(filteredStudents);
      setAiMessage(report);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.classGroup === currentClass)
      .sort((a, b) => {
        if (sortBy === 'id') return a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
        if (sortBy === 'score-desc') return b.points - a.points;
        if (sortBy === 'score-asc') return a.points - b.points;
        return 0;
      });
  }, [students, sortBy, currentClass]);

  return (
    <div className="min-h-screen pb-20 font-pixel">
      <header className="sticky top-0 z-30 bg-poke-red border-b-8 border-slate-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="relative w-16 h-16 flex items-center justify-center cursor-pointer hover:rotate-180 transition-transform duration-500">
                <div className="absolute inset-0 bg-white rounded-full border-4 border-slate-900 shadow-lg"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-red-600 rounded-t-full border-b-4 border-slate-900"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-4 border-slate-900 z-10"></div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-4xl font-black font-sans tracking-tight text-white uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] leading-none">
                  Miss Iong's Classes
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1 text-[10px] font-bold tracking-tighter uppercase font-sans px-2 py-0.5 rounded ${syncStatus === 'synced' ? 'bg-green-500 text-white' : syncStatus === 'syncing' ? 'bg-yellow-400 text-slate-900' : 'bg-red-500 text-white'}`}>
                    {syncStatus === 'synced' ? <Cloud size={10} /> : <RefreshCw size={10} className="animate-spin" />}
                    {syncStatus === 'synced' ? 'Auto-Synced (Cloud Active)' : 'Connecting...'}
                  </div>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadFromCloud()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded border-b-4 border-black hover:bg-slate-700 transition-all text-xl font-bold active:border-b-0 active:translate-y-1 shadow-lg"
            >
              <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">FORCE REFRESH</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {aiMessage && (
          <div className="mb-8 p-6 bg-indigo-50 border-4 border-indigo-200 rounded-xl relative shadow-md animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setAiMessage(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600"><X size={24} /></button>
            <div className="flex gap-4 items-start">
              <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg"><Bot size={32} /></div>
              <div>
                <h4 className="font-black text-indigo-900 uppercase text-lg mb-1 tracking-widest flex items-center gap-2">Professor's Message <Sparkles size={18} className="text-yellow-500" /></h4>
                <p className="text-indigo-800 text-xl leading-relaxed italic">"{aiMessage}"</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {classList.map(className => (
              <button
                key={className}
                onClick={() => setCurrentClass(className)}
                className={`px-6 py-3 rounded-lg font-bold text-xl uppercase tracking-wider transition-all border-b-4 active:translate-y-1 active:border-b-0 shadow-md ${currentClass === className ? 'bg-poke-blue text-white border-blue-900 scale-105 z-10' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
              >
                {className}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-lg shadow-lg border-4 border-slate-700">
             <div className="flex items-center gap-3">
               <LayoutGrid size={24} className="text-poke-blue" />
               <h2 className="text-3xl font-black text-slate-800 uppercase font-sans">{currentClass}</h2>
               <span className="bg-blue-100 text-blue-700 font-bold text-lg px-3 py-1 rounded border-2 border-blue-200 flex items-center gap-1 font-sans">
                 <UserCheck size={16} /> {filteredStudents.length} Students
               </span>
             </div>

             <div className="flex flex-wrap items-center gap-3">
               <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-4 pr-10 py-2 bg-slate-100 border-2 border-slate-400 text-slate-700 rounded-lg text-xl font-bold hover:border-poke-blue focus:outline-none transition-colors"
               >
                 <option value="id">Seat No.</option>
                 <option value="score-desc">Top Score</option>
                 <option value="score-asc">Low Score</option>
               </select>
               <button onClick={() => setIsDataModalOpen(true)} className="px-4 py-2 bg-emerald-100 border-2 border-emerald-300 text-emerald-700 rounded-lg text-xl font-bold hover:bg-emerald-200 transition-all"><FileSpreadsheet size={20} /></button>
               <button onClick={handleAiReport} disabled={isAiGenerating} className="px-4 py-2 bg-indigo-100 border-2 border-indigo-300 text-indigo-700 rounded-lg text-xl font-bold hover:bg-indigo-200 transition-all disabled:opacity-50">
                 {isAiGenerating ? <RefreshCw size={20} className="animate-spin" /> : <Bot size={20} />}
               </button>
             </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onUpdatePoints={handleUpdatePoints}
              onChangeAvatar={(id) => setAvatarSelectorData({ isOpen: true, studentId: id })}
              onDelete={(id) => setStudents(prev => prev.filter(s => s.id !== id))}
              onOpenBattle={(s) => setBattleModalData({ isOpen: true, studentId: s.id })}
            />
          ))}
        </div>
      </main>

      <BattleModal
        isOpen={battleModalData.isOpen}
        onClose={() => setBattleModalData({ ...battleModalData, isOpen: false })}
        student={students.find(s => s.id === battleModalData.studentId) || null}
        logs={battleModalData.studentId ? logs.filter(l => l.studentName === students.find(s => s.id === battleModalData.studentId)?.name) : []}
        onApplyBehavior={handleApplyBehavior}
        onSwitchPokemon={(id) => setAvatarSelectorData({ isOpen: true, studentId: id })}
      />
      
      <AvatarSelector 
        isOpen={avatarSelectorData.isOpen} 
        onClose={() => setAvatarSelectorData({ ...avatarSelectorData, isOpen: false })} 
        onSelect={(avatarId) => {
            if (avatarSelectorData.studentId) {
                setStudents(prev => prev.map(s => s.id === avatarSelectorData.studentId ? { ...s, avatarId } : s));
            }
            setAvatarSelectorData({ isOpen: false, studentId: null });
        }}
      />
      
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onImportScores={(data) => {
            setStudents(prev => prev.map(s => {
                const match = data.find(d => d.studentId === s.studentId && s.classGroup === currentClass);
                return match ? { ...s, points: match.points } : s;
            }));
        }}
        onExportScores={() => {
            const csv = students.map(s => `${s.classGroup},${s.studentId},${s.name},${s.points}`).join('\n');
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Scores.csv';
            a.click();
        }}
      />
    </div>
  );
};

export default App;