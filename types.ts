export interface Student {
  id: string;
  name: string;
  studentId: string;
  points: number;
  avatarId: number;
}

export interface HistoryLog {
  id: string;
  studentName: string;
  amount: number;
  timestamp: number;
  reason?: string;
}

export interface CloudSyncData {
  students: Student[];
  logs: HistoryLog[];
  version: string;
}

export interface PokemonData {
  id: number;
  name: string;
}