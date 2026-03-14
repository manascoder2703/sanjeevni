import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, SYMPTOM_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { symptoms } = await request.json();
    if (!symptoms?.trim()) {
      return NextResponse.json({ error: 'Please describe your symptoms' }, { status: 400 });
    }

    const model = getGeminiModel(SYMPTOM_SYSTEM_PROMPT);
    const result = await model.generateContent(
      `Patient symptoms: ${symptoms.trim()}`
    );
    const text = result.response.text().trim();

    // Parse the JSON response from Gemini
    let analysis;
    try {
      // Strip markdown code fences if Gemini wraps in ```json
      const cleaned = text.replace(/^```json\n?|\n?```$/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      // Fallback if Gemini didn't return valid JSON
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Symptom check error:', error);
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 });
  }
}
