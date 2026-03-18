import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, SYMPTOM_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { symptoms } = await request.json();
    if (!symptoms?.trim()) {
      return NextResponse.json({ error: 'Please describe your symptoms' }, { status: 400 });
    }

    const model = getGeminiModel(SYMPTOM_SYSTEM_PROMPT);
    const result = await model.generateContent(
      `Patient symptoms: ${symptoms.trim()}`
    );

    // Check if response was blocked
    if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
      return NextResponse.json({ error: 'AI could not analyze these symptoms. Please try being more specific or seek medical advice.' }, { status: 400 });
    }

    const text = result.response.text().trim();

    // Parse the JSON response from Gemini more robustly
    let analysis;
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Raw text:', text);
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Symptom check error:', error);
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 });
  }
}
