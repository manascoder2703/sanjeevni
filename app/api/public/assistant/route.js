import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

const LANDING_ASSISTANT_PROMPT = `You are Sanjeevni Guide, the website assistant for the Sanjeevni telemedicine platform.

Your job:
- Answer questions about what Sanjeevni offers on its website and product.
- Explain how the platform helps patients and doctors save time and improve productivity.
- Encourage practical next steps like booking a doctor, joining as a doctor, using secure video consultations, or using AI-supported features.

Important rules:
- Only talk about platform features that are clearly part of Sanjeevni:
  - booking appointments with doctors
  - secure video consultations
  - doctor and patient dashboards
  - profile management
  - doctor discovery by specialty
  - AI-powered assistance and summaries
  - notifications and appointment tracking
  - verified doctors and approval workflow
- Do not invent pricing, subscriptions, integrations, or features that were not provided.
- Do not provide medical diagnosis or treatment advice. If asked medical questions, gently redirect users to book a consultation with a doctor on Sanjeevni.
- Keep answers concise, friendly, and helpful.
- For greetings, small talk, or simple permission questions like "hey", "hello", "can I ask you anything?", "who are you?", or "thanks", reply in 1 very short sentence.
- For onboarding questions like "what can you do?", "how do I book an appointment?", or "how do I use it as a doctor?", give a short practical answer with simple steps.
- For simple questions, prefer 1 sentence. For normal product questions, keep replies to 2 short paragraphs or a few flat bullets.
- Prefer short paragraphs or flat bullet lists.
- When helpful, tailor the answer separately for doctors and patients.`;

function buildFallbackReply(question = '') {
  const q = question.toLowerCase().trim();
  const normalized = q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const hasAllWords = (...words) => words.every((word) => normalized.includes(word));
  const hasAnyPhrase = (...phrases) => phrases.some((phrase) => normalized.includes(phrase));

  if (['hi', 'hey', 'hello', 'hii', 'heyy'].includes(normalized) || hasAnyPhrase('hey there', 'hello there')) {
    return 'Hi! Ask me anything about Sanjeevni.';
  }

  if (
    hasAnyPhrase('can i ask you anything', 'can i ask anything', 'may i ask you anything') ||
    (hasAllWords('can', 'ask', 'anything')) ||
    (hasAllWords('ask', 'you', 'anything'))
  ) {
    return 'Yes, ask me anything about Sanjeevni features, doctor workflow, or patient booking.';
  }

  if (hasAnyPhrase('who are you', 'what are you') || hasAllWords('who', 'you')) {
    return 'I am Sanjeevni Guide, here to explain how the platform helps doctors and patients.';
  }

  if (
    hasAnyPhrase('what can you do', 'what do you do', 'how can you help') ||
    (hasAllWords('what', 'you', 'do')) ||
    (hasAllWords('can', 'you', 'do'))
  ) {
    return `I can help you understand Sanjeevni features, booking flow, doctor workflow, video consultations, and how the platform saves time for patients and doctors.`;
  }

  if (
    hasAnyPhrase('book a appointment', 'book an appointment', 'how to book', 'how do i book', 'how can i book') ||
    (hasAllWords('book', 'appointment')) ||
    (hasAllWords('book', 'doctor'))
  ) {
    return `To book an appointment:
- open the doctors section
- choose a doctor and date
- pick a time slot
- confirm the booking from the booking panel`;
  }

  if (
    hasAnyPhrase('how to use it as a doctor', 'how do i use it as a doctor', 'use it as a doctor', 'doctor workflow') ||
    (hasAllWords('doctor', 'use')) ||
    (hasAllWords('doctor', 'dashboard')) ||
    (hasAllWords('doctor', 'work'))
  ) {
    return `As a doctor, you can join the platform, manage your profile, review appointment requests, confirm consultations, and meet patients through secure video calls from your dashboard.`;
  }

  if (normalized === 'thanks' || normalized === 'thank you' || hasAnyPhrase('thanks a lot', 'thank you so much')) {
    return 'You are welcome.';
  }

  if (normalized.includes('doctor') && (normalized.includes('productivity') || normalized.includes('time'))) {
    return `Sanjeevni helps doctors save time by centralizing appointments, secure video consultations, patient communication, notes, and dashboard workflows in one place.

Doctors can use it to:
- manage bookings and approvals faster
- consult patients remotely through video calls
- reduce travel and scheduling friction
- keep patient interactions organized from the dashboard

If you want, I can also explain the doctor workflow step by step.`;
  }

  if (normalized.includes('patient') && (normalized.includes('productivity') || normalized.includes('time') || normalized.includes('help'))) {
    return `Sanjeevni helps patients save time by making doctor discovery, appointment booking, and online consultations much faster than traditional in-person scheduling.

Patients can:
- find doctors by specialty
- book appointments online
- attend secure video consultations from anywhere
- manage their profile and appointments in one dashboard
- use AI-guided assistance for platform support and health-related guidance`;
  }

  if (normalized.includes('feature') || normalized.includes('offer') || normalized.includes('provide')) {
    return `Sanjeevni offers a telemedicine experience built for both patients and doctors.

Main features include:
- online doctor discovery and appointment booking
- secure video consultations
- patient and doctor dashboards
- AI-supported assistance
- profile management
- notifications and appointment tracking
- verified doctor onboarding and approval`;
  }

  if (normalized.includes('video') || normalized.includes('consult')) {
    return `Sanjeevni supports secure video consultations so patients can connect with doctors remotely and doctors can handle appointments more efficiently online.

That helps by:
- reducing travel time
- making follow-ups easier
- improving convenience for both sides
- keeping consultations inside the same platform workflow`;
  }

  return `Sanjeevni is a telemedicine platform designed to help patients connect with verified doctors and help doctors manage consultations more efficiently.

It can help through appointment booking, secure video consultations, dashboards, profile management, AI-supported guidance, and smoother day-to-day workflows.

You can ask me about:
- patient benefits
- doctor productivity
- booking and consultation flow
- platform features`;
}

export async function POST(request) {
  try {
    const { messages = [], question = '' } = await request.json();

    const normalizedMessages = Array.isArray(messages)
      ? messages.filter((message) => message?.content && message?.role)
      : [];

    const latestQuestion =
      question?.trim() ||
      normalizedMessages[normalizedMessages.length - 1]?.content?.trim() ||
      '';

    if (!latestQuestion) {
      return NextResponse.json({ error: 'A question is required.' }, { status: 400 });
    }

    try {
      const model = getGeminiModel(LANDING_ASSISTANT_PROMPT);
      const recentMessages = normalizedMessages.slice(-6);

      const history = recentMessages.slice(0, -1).reduce((acc, message) => {
        const role = message.role === 'assistant' ? 'model' : 'user';
        const previous = acc[acc.length - 1];

        if (!previous || previous.role !== role) {
          acc.push({ role, parts: [{ text: message.content }] });
        }

        return acc;
      }, []);

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(latestQuestion);
      const response = await result.response;
      const reply = response.text()?.trim();

      if (reply) {
        return NextResponse.json({ reply });
      }
    } catch (aiError) {
      console.warn('Landing assistant AI fallback triggered:', aiError?.message || aiError);
    }

    return NextResponse.json({ reply: buildFallbackReply(latestQuestion) });
  } catch (error) {
    console.error('Landing assistant error:', error);
    return NextResponse.json({ error: 'Unable to answer right now.' }, { status: 500 });
  }
}
