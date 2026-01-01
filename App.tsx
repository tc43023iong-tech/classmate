import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bot, Gamepad2, ArrowDownUp, Globe, RefreshCw, FileSpreadsheet, LayoutGrid, UserCheck, Cloud, CloudOff, Wifi } from 'lucide-react';

import { Student, HistoryLog, CloudSyncData } from './types';
import { STORAGE_KEY_STUDENTS, STORAGE_KEY_LOGS, TOTAL_POKEMON_AVAILABLE, SOUND_EFFECTS, PRESET_CLASSES } from './constants';
import { generateClassReport, generateEncouragement } from './services/geminiService';

import StudentCard from './components/StudentCard';
import AvatarSelector from './components/AvatarSelector';
import BattleModal from './components/BattleModal';
import SyncModal from './components/SyncModal';
import DataModal from './components/DataModal';

type SortOption = 'id' | 'score-desc' | 'score-asc';

const App: React.FC = () => {
  // 從網址讀取同步代碼 (e.g. ?code=MissIong)
  const queryParams = new URLSearchParams(window.location.search);
  const urlCode = queryParams.get('code');

  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [trainerCode, setTrainerCode] = useState<string | null>(urlCode || localStorage.getItem('trainer_code'));
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

  // 避免頻繁同步的 Ref
  const lastSyncTime = useRef<number>(0);
  const isInitialMount = useRef(true);

  // 初始化資料
  const initDefaultData = useCallback(() => {
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
    setStudents(allStudents);
  }, []);

  // 雲端儲存函式
  const saveToCloud = useCallback(async (currentStudents: Student[], currentLogs: HistoryLog[], code: string) => {
    if (!code) return;
    setSyncStatus('syncing');
    try {
      const data: CloudSyncData = { students: currentStudents, logs: currentLogs, version: '1.1' };
      await fetch(`https://api.npoint.io/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setSyncStatus('synced');
    } catch (e) {
      console.error("Cloud Auto-Save Error", e);
      setSyncStatus('offline');
    }
  }, []);

  // 雲端讀取函式
  const loadFromCloud = useCallback(async (code: string) => {
    if (!code) return;
    setSyncStatus('syncing');
    try {
      const res = await fetch(`https://api.npoint.io/${code}`);
      if (!res.ok) throw new Error("Bin not found");
      const data: CloudSyncData = await res.json();
      if (data.students) {
        setStudents(data.students);
        setLogs(data.logs || []);
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error("Cloud Auto-Load Error", e);
      setSyncStatus('offline');
    }
  }, []);

  // 初始讀取邏輯
  useEffect(() => {
    if (trainerCode) {
      loadFromCloud(trainerCode);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (stored) {
        setStudents(JSON.parse(stored));
        const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
        if (storedLogs) setLogs(JSON.parse(storedLogs));
      } else {
        initDefaultData();
      }
    }
  }, [trainerCode, loadFromCloud, initDefaultData]);

  // 定期自動更新 (每 15 秒檢查一次雲端)
  useEffect(() => {
    if (!trainerCode) return;
    const interval = setInterval(() => {
      // 只有在沒在操作時才背景更新，避免覆蓋掉正在加的分數
      if (Date.now() - lastSyncTime.current > 5000) {
        loadFromCloud(trainerCode);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [trainerCode, loadFromCloud]);

  // 資料變動自動同步 (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // 儲存到本地作為備份
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));

    // 如果有 Cloud Code，自動儲存
    if (trainerCode) {
      const timeoutId = setTimeout(() => {
        saveToCloud(students, logs, trainerCode);
        lastSyncTime.current = Date.now();
      }, 1000); // 延遲1秒儲存，避免操作過快頻繁請求
      return () => clearTimeout(timeoutId);
    }
  }, [students, logs, trainerCode, saveToCloud]);

  // 衍生資料
  const classList = useMemo(() => PRESET_CLASSES.map(p => p.name), []);

  const playSound = (type: 'positive' | 'negative') => {
    const soundArray = type === 'positive' ? SOUND_EFFECTS.positive : SOUND_EFFECTS.negative;
    const randomSound = soundArray[Math.floor(Math.random() * soundArray.length)];
    const audio = new Audio(randomSound);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn("Audio play failed", e));
  };

  const handleUpdatePoints = useCallback(async (id: string, newPoints: number) => {
    setStudents((prev) => {
        const student = prev.find(s => s.id === id);
        if (student) {
            const delta = newPoints - student.points;
            if (delta > 0) playSound('positive');
            if (delta < 0) playSound('negative');
        }
        return prev.map(s => s.id === id ? { ...s, points: newPoints } : s);
    });
  }, []);

  const addLog = (studentId: string, studentName: string, amount: number, reason?: string) => {
    const newLog: HistoryLog = {
      id: uuidv4(),
      studentName,
      amount,
      timestamp: Date.now(),
      reason
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleApplyBehavior = async (points: number, reason: string) => {
    if (!battleModalData.studentId) return;
    const student = students.find(s => s.id === battleModalData.studentId);
    if (!student) return;

    const newPoints = student.points + points;
    handleUpdatePoints(student.id, newPoints);
    addLog(student.id, student.name, points, reason);

    if (process.env.API_KEY) {
      if (Math.random() > 0.8) {
        const encouragement = await generateEncouragement(student, points > 0 ? 'add' : 'subtract');
        setAiMessage(encouragement);
      }
    }
  };

  const handleSelectAvatar = (avatarId: number) => {
    if (avatarSelectorData.studentId) {
      setStudents(prev => prev.map(s => s.id === avatarSelectorData.studentId ? { ...s, avatarId } : s));
    }
    setAvatarSelectorData({ isOpen: false, studentId: null });
  };

  const handleAiReport = async () => {
    setIsAiGenerating(true);
    setAiMessage("Professor Oak is analyzing the class data...");
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

  const totalPoints = filteredStudents.reduce((acc, s) => acc + s.points, 0);
  const activeStudent = students.find(s => s.id === battleModalData.studentId) || null;
  const activeLogs = activeStudent ? logs.filter(l => l.studentName === activeStudent.name) : [];

  return (
    <div className="min-h-screen pb-20 font-pixel">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-poke-red border-b-8 border-slate-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="relative w-16 h-16 flex items-center justify-center cursor-pointer hover:rotate-180 transition-transform duration-500" onClick={() => setIsSyncModalOpen(true)}>
                <div className="absolute inset-0 bg-white rounded-full border-4 border-slate-900 shadow-lg"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-red-600 rounded-t-full border-b-4 border-slate-900"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-4 border-slate-900 z-10"></div>
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-4xl font-black font-sans tracking-tight text-white uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] leading-none">
                  Miss Iong's Classes
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {trainerCode ? (
                    <div className={`flex items-center gap-1 text-[10px] font-bold tracking-tighter uppercase font-sans px-2 py-0.5 rounded ${syncStatus === 'synced' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-slate-900'}`}>
                      {syncStatus === 'synced' ? <Cloud size={10} /> : <RefreshCw size={10} className="animate-spin" />}
                      LIVE: {trainerCode}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] bg-slate-700 text-slate-400 font-bold tracking-tighter uppercase font-sans px-2 py-0.5 rounded">
                      <CloudOff size={10} /> Offline Mode
                    </div>
                  )}
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end mr-4 bg-slate-800 px-4 py-2 rounded border-2 border-slate-600 shadow-inner">
               <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest font-sans">Current Class XP</span>
               <span className="text-2xl font-black text-white leading-none font-mono">{totalPoints.toString().padStart(6, '0')}</span>
            </div>
            
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded border-b-4 transition-all text-xl font-bold active:border-b-0 active:translate-y-1 shadow-lg group ${trainerCode ? 'bg-green-600 text-white border-green-800' : 'bg-slate-800 text-white border-slate-600'}`}
            >
              <Wifi size={24} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline uppercase">{trainerCode ? 'SYNCED' : 'CONNECT'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Class Selector Bar */}
        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {classList.map(className => (
              <button
                key={className}
                onClick={() => setCurrentClass(className)}
                className={`
                  px-6 py-3 rounded-lg font-bold text-xl uppercase tracking-wider transition-all border-b-4 active:translate-y-1 active:border-b-0 shadow-md
                  ${currentClass === className 
                    ? 'bg-poke-blue text-white border-blue-900 scale-105 z-10' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}
                `}
              >
                {className}
              </button>
            ))}
          </div>
        </div>

        {/* AI Message Banner */}
        {aiMessage && (
          <div className="mb-8 mx-auto max-w-4xl p-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 border-4 border-slate-900">
            <div className="bg-white p-4 flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 border-2 border-indigo-200">
                 <Bot size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-lg mb-1 uppercase tracking-wide font-sans">Professor's Advice</h4>
                <p className="text-slate-600 leading-relaxed text-xl">"{aiMessage}"</p>
              </div>
              <button onClick={() => setAiMessage(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
                <div className="rotate-45"><Gamepad2 size={24} /></div>
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-lg shadow-lg border-4 border-slate-700 relative">
             <div className="flex items-center gap-3">
               <LayoutGrid size={24} className="text-poke-blue" />
               <h2 className="text-3xl font-black text-slate-800 uppercase font-sans">{currentClass}</h2>
               <span className="bg-blue-100 text-blue-700 font-bold text-lg px-3 py-1 rounded border-2 border-blue-200 shadow-sm font-sans flex items-center gap-1">
                 <UserCheck size={16} /> {filteredStudents.length} Students
               </span>
             </div>

             <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ArrowDownUp size={16} />
                 </div>
                 <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="pl-10 pr-4 py-2 bg-slate-100 border-2 border-slate-400 text-slate-700 rounded-lg text-xl font-bold hover:border-poke-blue focus:outline-none focus:border-poke-blue transition-colors appearance-none cursor-pointer w-full sm:w-auto shadow-sm"
                 >
                   <option value="id">Sort by Seat No.</option>
                   <option value="score-desc">Top Score</option>
                   <option value="score-asc">Lowest Score</option>
                 </select>
               </div>

               <button
                 onClick={() => setIsDataModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xl font-bold transition-all shadow-sm active:translate-y-0.5"
               >
                 <FileSpreadsheet size={20} />
                 Admin
               </button>

               <button
                 onClick={handleAiReport}
                 disabled={isAiGenerating}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-100 border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xl font-bold transition-all shadow-sm active:translate-y-0.5"
               >
                 <Bot size={20} />
                 {isAiGenerating ? 'Analyzing...' : 'Battle Report'}
               </button>
             </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onUpdatePoints={(id, val) => {
                 const s = students.find(item => item.id === id);
                 handleUpdatePoints(id, val);
                 if (s) {
                    const diff = val - s.points;
                    addLog(id, s.name, diff, 'Quick Action');
                 }
              }}
              onChangeAvatar={(id) => setAvatarSelectorData({ isOpen: true, studentId: id })}
              onDelete={(id) => setStudents(prev => prev.filter(s => s.id !== id))}
              onOpenBattle={(s) => setBattleModalData({ isOpen: true, studentId: s.id })}
            />
          ))}
        </div>
      </main>

      <AvatarSelector
        isOpen={avatarSelectorData.isOpen}
        onClose={() => setAvatarSelectorData({ ...avatarSelectorData, isOpen: false })}
        onSelect={handleSelectAvatar}
        currentAvatarId={students.find(s => s.id === avatarSelectorData.studentId)?.avatarId}
      />

      <BattleModal
        isOpen={battleModalData.isOpen}
        onClose={() => setBattleModalData({ ...battleModalData, isOpen: false })}
        student={activeStudent}
        logs={activeLogs}
        onApplyBehavior={handleApplyBehavior}
        onSwitchPokemon={(id) => setAvatarSelectorData({ isOpen: true, studentId: id })}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        trainerCode={trainerCode}
        onSave={async () => {
            const code = trainerCode || uuidv4().slice(0, 8).toUpperCase();
            await saveToCloud(students, logs, code);
            setTrainerCode(code);
            localStorage.setItem('trainer_code', code);
            // 更新網址，方便複製
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('code', code);
            window.history.pushState({}, '', newUrl);
            return code;
        }}
        onLoad={async (code) => {
            await loadFromCloud(code);
            setTrainerCode(code);
            localStorage.setItem('trainer_code', code);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('code', code);
            window.history.pushState({}, '', newUrl);
        }}
      />

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onImportScores={(data) => {
            setStudents(prev => prev.map(s => {
                const match = data.find(d => d.studentId === s.studentId && s.classGroup === currentClass);
                if (match) {
                    addLog(s.id, s.name, match.points - s.points, 'Bulk Update');
                    return { ...s, points: match.points };
                }
                return s;
            }));
        }}
        onExportScores={() => {
            const headers = ['Class', 'Seat', 'Name', 'Points'];
            const rows = students.map(s => [s.classGroup, s.studentId, s.name, s.points]);
            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Miss_Iong_Class_Records.csv`;
            link.click();
        }}
      />

    </div>
  );
};

export default App;