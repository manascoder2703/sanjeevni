import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, INTENT_PARSING_PROMPT } from '@/lib/gemini';
import connectDB from '@/lib/mongodb';
import AICache from '@/models/AICache';
import UserAISession from '@/models/UserAISession';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { OCCUPYING_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const prompt = message.trim().toLowerCase();
    const role = user.role;

    // 1. Check Cache first
    try {
      await connectDB();
      const cached = await AICache.findOne({ prompt, role });
      if (cached) {
        console.log('AI Cache Hit:', prompt);
        return NextResponse.json(cached.response);
      }
    } catch (cacheErr) {
      console.error('Cache Lookup Error (Non-fatal):', cacheErr);
    }

    // 2. Load or create Session
    let session;
    try {
      session = await UserAISession.findOne({ userId: user.userId });
      if (!session) {
        session = new UserAISession({ userId: user.userId, messages: [], bookingContext: null });
      }
    } catch (sessionErr) {
      console.error('Session Load Error:', sessionErr);
    }

    // 3. Use Gemini to parse intent into JSON
    const model = getGeminiModel(INTENT_PARSING_PROMPT);
    
    // Provide current date and history for context-aware parsing
    const now = new Date();
    const currentDateTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }); // IST context
    const historyText = session?.messages?.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n') || '';
    const contextPrompt = `Today's Date/Time: ${currentDateTimeStr}\n${historyText ? `History:\n${historyText}\n\n` : ''}`;
    
    const fullPrompt = `IMPORTANT: Today is ${currentDateTimeStr}. Always use this year/month context for relative dates like "tomorrow" or "30 April".\n\n${contextPrompt}User: ${message.trim()}`;
    const result = await model.generateContent(fullPrompt);

    if (!result.response) {
      throw new Error('AI response blocked or empty');
    }

    const text = result.response.text().trim();
    console.log('AI RAW OUTPUT:', text);
    
    // Extract JSON from the response
    let parsed;
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found');
      }
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonStr);

      console.log('AI PARSED INTENT:', parsed.intent, 'PARAMS:', parsed.params);
      
      // 3.5 DOCTOR VERIFICATION: If a name is provided, look up the real doctor ID
      const extractedName = parsed.params?.doctorName;
      if (extractedName && (parsed.intent === 'BOOK_DOCTOR' || parsed.intent === 'PROVIDE_INFO')) {
        try {
          const cleanName = extractedName.replace(/dr\.?\s+/i, '').trim();
          const userMatch = await User.findOne({ 
            name: { $regex: new RegExp(cleanName, 'i') }, 
            role: 'doctor' 
          });
          
          if (userMatch) {
            const doctorProfile = await Doctor.findOne({ userId: userMatch._id });
            if (doctorProfile) {
              parsed.params.doctorId = doctorProfile._id.toString();
              parsed.params.doctorName = userMatch.name; // Canonical name
              console.log('✅ Doctor Verified:', userMatch.name, 'ID:', parsed.params.doctorId);
            }
          } else if (parsed.intent === 'BOOK_DOCTOR' && !parsed.reply?.includes("couldn't find")) {
             parsed.reply = `I couldn't find a doctor named "${extractedName}" in our directory. Could you please check the name or specialization?`;
             parsed.intent = 'INVALID_REQUEST'; // Don't proceed to booking context update
          }
        } catch (dbErr) {
          console.error('Doctor lookup error:', dbErr);
        }
      }

      // 3.7 CONFLICT CHECK: Prevent overlapping appointments (any doctor/any patient)
      if (parsed.params?.date && (parsed.params?.timeSlot || parsed.params?.time)) {
        try {
          const timeToSearch = parsed.params.timeSlot || parsed.params.time;
          const existing = await Appointment.findOne({
            date: parsed.params.date,
            timeSlot: timeToSearch,
            status: { $in: OCCUPYING_APPOINTMENT_STATUSES },
            $or: [
              { patientId: user.id || session.userId },
              { doctorId: parsed.params.doctorId }
            ]
          }).populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
          
          if (existing) {
             const isSamePatient = existing.patientId?.toString() === (user.id || session.userId);
             if (isSamePatient) {
                const isSameDoc = existing.doctorId?._id?.toString() === parsed.params.doctorId?.toString();
                if (isSameDoc) {
                  parsed.reply = `You already have an appointment with ${parsed.params.doctorName || 'this doctor'} at this time (${parsed.params.date} at ${timeToSearch})! Would you like to view your appointments?`;
                } else {
                  const otherDocName = existing.doctorId?.userId?.name || 'another doctor';
                  parsed.reply = `You already have a conflicting appointment with ${otherDocName} at this time (${parsed.params.date} at ${timeToSearch})! Would you like to book a different time?`;
                }
             } else if (existing.doctorId?._id?.toString() === parsed.params.doctorId?.toString()) {
                // Someone ELSE booked THIS doctor
                parsed.reply = `I'm sorry, but another user has already booked ${parsed.params.doctorName || 'this doctor'} for ${parsed.params.date} at ${timeToSearch}. Please pick another slot!`;
             }
             
             if (parsed.reply) parsed.intent = 'ALREADY_BOOKED';
          }
        } catch (dbErr) {
          console.error('Appointment conflict check error:', dbErr);
        }
      }

      // 4. Update Session and Store in Cache
      try {
        if (session) {
          session.messages.push({ role: 'user', content: message.trim() });
          // Note: Assistant response will be pushed in the widget handleSend or here if we return it
          // For now, we only push the user message to keep the parse route as a pure "parser"
          // but we can update the bookingContext if the parser found anything
          if (parsed.intent === 'BOOK_DOCTOR' || parsed.intent === 'PROVIDE_INFO') {
              // We'll let the frontend handle the merge and send the updated context in a separate call 
              // or we can do a partial merge here if we want the backend to be the source of truth
          }
          await session.save();
        }
        await AICache.create({ prompt, role, response: parsed });
      } catch (cacheStoreErr) {
        console.error('Cache/Session Storage Error (Non-fatal):', cacheStoreErr);
      }

    } catch (e) {
      console.error('Intent Parse Error:', e, 'Raw text:', text);
      return NextResponse.json({ 
        intent: 'UNKNOWN', 
        message: 'Could not categorize intent',
        raw: text 
      });
    }

    return NextResponse.json(parsed);

  } catch (error) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ error: 'AI limit reached. Try again in 30s.' }, { status: 429 });
    }
    console.error('AI Agent Parse Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
