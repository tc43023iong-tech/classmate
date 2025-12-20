import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Users, Download, Trash, Bot, Gamepad2, ArrowDownUp, Globe, RefreshCw, FileSpreadsheet } from 'lucide-react';

import { Student, HistoryLog, CloudSyncData } from './types';
import { STORAGE_KEY_STUDENTS, STORAGE_KEY_LOGS, TOTAL_POKEMON_AVAILABLE, SOUND_EFFECTS } from './constants';
import { generateClassReport, generateEncouragement } from './services/geminiService';

import StudentCard from './components/StudentCard';
import ImportModal from './components/ImportModal';
import AvatarSelector from './components/AvatarSelector';
import BattleModal from './components/BattleModal';
import SyncModal from './components/SyncModal';
import DataModal from './components/DataModal';

type SortOption = 'id' | 'score-desc' | 'score-asc';

const App: React.FC = () => {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [trainerCode, setTrainerCode] = useState<string | null>(localStorage.getItem('trainer_code'));
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [avatarSelectorData, setAvatarSelectorData] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null,
  });
  
  // Battle/Action Modal State
  const [battleModalData, setBattleModalData] = useState<{ isOpen: boolean; studentId: string | null }>({
    isOpen: false,
    studentId: null,
  });

  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('id');

  // Load from Storage
  useEffect(() => {
    const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    
    if (storedStudents) {
      try {
        setStudents(JSON.parse(storedStudents));
      } catch (e) {
        console.error("Failed to parse students", e);
      }
    }
    
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
  }, []);

  // Save to Storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }, [logs]);

  // Audio Helper
  const playSound = (type: 'positive' | 'negative') => {
    const soundArray = type === 'positive' ? SOUND_EFFECTS.positive : SOUND_EFFECTS.negative;
    const randomSound = soundArray[Math.floor(Math.random() * soundArray.length)];
    const audio = new Audio(randomSound);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn("Audio play failed (interaction required)", e));
  };

  // Handlers
  const handleImportStudents = (data: { name: string; studentId: string }[]) => {
    const newStudents: Student[] = data.map((d) => ({
      id: uuidv4(),
      name: d.name,
      studentId: d.studentId,
      points: 0,
      avatarId: Math.floor(Math.random() * TOTAL_POKEMON_AVAILABLE) + 1, 
    }));
    setStudents((prev) => [...prev, ...newStudents]);
  };

  const handleImportScores = (data: { studentId: string; points: number }[]) => {
    setStudents(prev => prev.map(s => {
      const match = data.find(d => d.studentId === s.studentId);
      if (match) {
        addLog(s.id, s.name, match.points - s.points, 'Bulk Score Import');
        return { ...s, points: match.points };
      }
      return s;
    }));
  };

  const handleExportScores = () => {
    const headers = ['Name', 'Student ID', 'Points'];
    const rows = students.map(s => [s.name, s.studentId, s.points]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `class_scores_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleUpdatePoints = useCallback(async (id: string, newPoints: number, reason?: string) => {
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

  const handleApplyBehavior = async (points: number, reason: string) => {
    if (!battleModalData.studentId) return;
    const student = students.find(s => s.id === battleModalData.studentId);
    if (!student) return;

    const newPoints = student.points + points;
    handleUpdatePoints(student.id, newPoints);
    addLog(student.id, student.name, points, reason);

    if (process.env.API_KEY) {
      if (Math.random() > 0.7) {
        const encouragement = await generateEncouragement(student, points > 0 ? 'add' : 'subtract');
        setAiMessage(encouragement);
      }
    }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter(s => s.id !== id));
  };

  const handleOpenAvatarSelector = (id: string) => {
    setAvatarSelectorData({ isOpen: true, studentId: id });
  };

  const handleSelectAvatar = (avatarId: number) => {
    if (avatarSelectorData.studentId) {
      setStudents(prev => prev.map(s => s.id === avatarSelectorData.studentId ? { ...s, avatarId } : s));
    }
    setAvatarSelectorData({ isOpen: false, studentId: null });
  };

  const handleOpenBattle = (student: Student) => {
    setBattleModalData({ isOpen: true, studentId: student.id });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all students? This cannot be undone.")) {
      setStudents([]);
      setLogs([]);
    }
  };

  const handleAiReport = async () => {
    setIsAiGenerating(true);
    setAiMessage("Professor Oak is analyzing the class data...");
    try {
      const report = await generateClassReport(students);
      setAiMessage(report);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Cloud Sync Logic
  const handleCloudSave = async () => {
    const data: CloudSyncData = { students, logs, version: '1.0' };
    const method = trainerCode ? 'PUT' : 'POST';
    const url = trainerCode ? `https://api.npoint.io/${trainerCode}` : `https://api.npoint.io/bins`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      const code = trainerCode || result.id;
      setTrainerCode(code);
      localStorage.setItem('trainer_code', code);
      return code;
    } catch (e) {
      console.error("Cloud Save Error", e);
      throw e;
    }
  };

  const handleCloudLoad = async (code: string) => {
    try {
      const res = await fetch(`https://api.npoint.io/${code}`);
      const data: CloudSyncData = await res.json();
      if (data.students) {
        setStudents(data.students);
        setLogs(data.logs || []);
        setTrainerCode(code);
        localStorage.setItem('trainer_code', code);
      }
    } catch (e) {
      console.error("Cloud Load Error", e);
      throw e;
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
        if (sortBy === 'id') {
            return a.studentId.localeCompare(b.studentId, undefined, { numeric: true });
        }
        if (sortBy === 'score-desc') return b.points - a.points;
        if (sortBy === 'score-asc') return a.points - b.points;
        return 0;
    });
  }, [students, sortBy]);

  const totalPoints = students.reduce((acc, s) => acc + s.points, 0);
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
                <h1 className="text-3xl font-black tracking-widest text-white uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]" style={{ WebkitTextStroke: '2px #202020' }}>
                  Miss Iong's Class
                </h1>
                {trainerCode && (
                  <div className="flex items-center gap-1 text-xs text-yellow-300 font-bold tracking-tighter uppercase">
                    <Globe size={10} /> LINKED: {trainerCode}
                  </div>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end mr-4 bg-slate-800 px-4 py-2 rounded border-2 border-slate-600 shadow-inner">
               <span className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Class XP</span>
               <span className="text-2xl font-black text-white leading-none font-mono">{totalPoints.toString().padStart(6, '0')}</span>
            </div>
            
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded border-b-4 border-slate-600 hover:bg-slate-700 transition-all text-xl font-bold active:border-b-0 active:translate-y-1 shadow-lg group"
              title="Global Sync"
            >
              <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:inline uppercase">Sync PC</span>
            </button>

            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-400 text-slate-900 rounded border-b-4 border-yellow-700 hover:bg-yellow-300 transition-all text-xl font-bold active:border-b-0 active:translate-y-1 shadow-lg"
            >
              <Users size={24} />
              <span className="hidden sm:inline">ADD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Empty State */}
        {students.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/80 p-10 rounded-xl border-4 border-slate-300 shadow-xl backdrop-blur-sm">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-4 border-slate-300">
              <Download className="text-slate-300" size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight uppercase">Welcome, Professor!</h2>
            <p className="text-slate-500 max-w-md mb-8 text-2xl">
              Your classroom is empty. Import your students or load a saved class from the Cloud PC.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
               <button 
                onClick={() => setIsImportModalOpen(true)}
                className="px-8 py-4 bg-poke-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xl border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 flex items-center gap-2 text-2xl"
              >
                <Users size={24} />
                Import Class Roster
              </button>
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className="px-8 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-xl border-b-4 border-slate-600 active:border-b-0 active:translate-y-1 flex items-center gap-2 text-2xl"
              >
                <RefreshCw size={24} />
                PC Global Load
              </button>
            </div>
          </div>
        )}

        {/* AI Message Banner */}
        {aiMessage && (
          <div className="mb-8 mx-auto max-w-4xl p-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 border-4 border-slate-900">
            <div className="bg-white p-4 flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 border-2 border-indigo-200">
                 <Bot size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-lg mb-1 uppercase tracking-wide">Professor's Update</h4>
                <p className="text-slate-600 leading-relaxed text-xl">
                  "{aiMessage}"
                </p>
              </div>
              <button 
                onClick={() => setAiMessage(null)}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <div className="rotate-45"><Gamepad2 size={24} /></div>
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        {students.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 bg-white p-4 rounded-lg shadow-lg border-4 border-slate-700 relative">
             <div className="absolute -top-2 -left-2 w-4 h-4 bg-slate-400 border-2 border-slate-600 rounded-full"></div>
             <div className="absolute -top-2 -right-2 w-4 h-4 bg-slate-400 border-2 border-slate-600 rounded-full"></div>
             <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-slate-400 border-2 border-slate-600 rounded-full"></div>
             <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-slate-400 border-2 border-slate-600 rounded-full"></div>

             <div className="flex items-center gap-3">
               <h2 className="text-3xl font-black text-slate-800 uppercase">Your Team</h2>
               <span className="bg-blue-100 text-blue-700 font-bold text-lg px-3 py-1 rounded border-2 border-blue-200 shadow-sm">{students.length} Students</span>
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
                   <option value="id">Sort by ID</option>
                   <option value="score-desc">Highest Score</option>
                   <option value="score-asc">Lowest Score</option>
                 </select>
               </div>

               <div className="h-8 w-1 bg-slate-300 hidden sm:block mx-2"></div>

               <button
                 onClick={() => setIsDataModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-emerald-100 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xl font-bold transition-all shadow-sm active:translate-y-0.5"
                 title="Data Center"
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
                 {isAiGenerating ? 'Thinking...' : 'Analysis'}
               </button>
               <button
                 onClick={handleClearAll}
                 className="flex items-center gap-2 px-4 py-2 bg-red-100 border-2 border-red-300 text-red-700 hover:bg-red-200 rounded-lg text-xl font-bold transition-all shadow-sm active:translate-y-0.5"
               >
                 <Trash size={20} />
                 Reset
               </button>
             </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onUpdatePoints={(id, val) => {
                 const student = students.find(s => s.id === id);
                 handleUpdatePoints(id, val);
                 if (student) {
                    const diff = val - student.points;
                    addLog(id, student.name, diff, 'Quick Action');
                 }
              }}
              onChangeAvatar={handleOpenAvatarSelector}
              onDelete={handleDeleteStudent}
              onOpenBattle={handleOpenBattle}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImportStudents} 
      />

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
        onSwitchPokemon={handleOpenAvatarSelector}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        trainerCode={trainerCode}
        onSave={handleCloudSave}
        onLoad={handleCloudLoad}
      />

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onImportScores={handleImportScores}
        onExportScores={handleExportScores}
      />

    </div>
  );
};

export default App;