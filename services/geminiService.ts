
import { GoogleGenAI } from "@google/genai";
import { Student } from '../types';

/**
 * Initialize a new GoogleGenAI instance using the API key from environment variables.
 * We initialize this as needed to ensure the client is up-to-date.
 */
const getAI = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateEncouragement = async (student: Student, action: 'add' | 'subtract'): Promise<string> => {
  const ai = getAI();
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
    // Basic Text Tasks (e.g., summarization, proofreading, and simple Q&A): 'gemini-3-flash-preview'
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Property access .text instead of method call .text()
    return response.text || "Keep it up!";
  } catch (e) {
    console.error(e);
    return "Points updated!";
  }
};

export const generateClassReport = async (students: Student[]): Promise<string> => {
  const ai = getAI();
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
    // Complex Text Tasks (e.g., advanced reasoning): 'gemini-3-pro-preview' is also an option, 
    // but for this task 'gemini-3-flash-preview' is sufficient and faster.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Property access .text instead of method call .text()
    return response.text || "Report unavailable.";
  } catch (e) {
    console.error(e);
    return "Could not contact the Professor.";
  }
};
