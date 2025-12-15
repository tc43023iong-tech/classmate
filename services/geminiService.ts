import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini Client", error);
}

export const generateEncouragement = async (student: Student, action: 'add' | 'subtract'): Promise<string> => {
  if (!ai) return "Great job! (AI Key missing)";

  const prompt = `
    You are a playful, encouraging teacher's assistant in a Pokemon-themed classroom.
    Student Name: ${student.name}
    Student Avatar ID (Pokemon): ${student.avatarId}
    Current Points: ${student.points}
    Action: ${action === 'add' ? 'Just gained points' : 'Just lost points'}.

    Write a very short, witty, 1-sentence comment. 
    If they gained points, relate it to their Pokemon evolving or getting stronger.
    If they lost points, tell them to visit the Pokemon Center or try harder next time.
    Do not use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Keep it up!";
  } catch (e) {
    console.error(e);
    return "Points updated!";
  }
};

export const generateClassReport = async (students: Student[]): Promise<string> => {
  if (!ai) return "Add an API Key to generate class reports.";
  if (students.length === 0) return "No students to analyze.";

  // Sort top 3 for context
  const topStudents = [...students].sort((a, b) => b.points - a.points).slice(0, 3);
  const topNames = topStudents.map(s => `${s.name} (${s.points})`).join(', ');

  const prompt = `
    Analyze this class of ${students.length} students.
    Top students: ${topNames}.
    
    Write a short "Battle Report" (max 50 words) summarizing the current standings in a dramatic Pokemon announcer style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Report unavailable.";
  } catch (e) {
    console.error(e);
    return "Could not contact the Professor.";
  }
};
