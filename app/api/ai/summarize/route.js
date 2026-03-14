import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, SUMMARIZE_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes, patientName } = await request.json();
    if (!notes?.trim()) {
      return NextResponse.json({ error: 'No notes to summarize' }, { status: 400 });
    }

    const model = getGeminiModel(SUMMARIZE_SYSTEM_PROMPT);
    const prompt = `Patient: ${patientName || 'Unknown'}\n\nAppointment Notes:\n${notes.trim()}`;
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 });
  }
}
