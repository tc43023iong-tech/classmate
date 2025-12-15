export interface Student {
  id: string;
  name: string;
  studentId: string; // The roll number/ID provided by school
  points: number;
  avatarId: number; // Pokemon Pokedex ID (1-151+)
}

export interface HistoryLog {
  id: string;
  studentName: string;
  amount: number;
  timestamp: number;
  reason?: string;
}

export interface PokemonData {
  id: number;
  name: string;
}
