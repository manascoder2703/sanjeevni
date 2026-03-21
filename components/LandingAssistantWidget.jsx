'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';

const STARTER_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "Hi, I'm the Sanjeevni assistant. I can explain our platform features, how doctors can save time, and how patients can use Sanjeevni more effectively.",
  },
];

const QUICK_QUESTIONS = [
  'How does Sanjeevni help doctors save time?',
  'How can patients use this platform?',
  'What features does Sanjeevni provide?',
];

export default function LandingAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isOpen, loading]);

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { id: `${Date.now()}-user`, role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/public/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to answer right now.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.reply,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            error.message ||
            'I could not answer that just now. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 14,
        }}
      >
        {isOpen && (
          <div
            style={{
              width: 'min(380px, calc(100vw - 24px))',
              height: 'min(560px, calc(100vh - 120px))',
              background: '#000000',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 28,
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(18px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '18px 18px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 800 }}>Sanjeevni Guide</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                    Product help for doctors and patients
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 18,
                background: '#000000',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.map((message) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div
                    key={message.id}
                    style={{
                      alignSelf: isAssistant ? 'stretch' : 'flex-end',
                      display: 'flex',
                      justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        background: isAssistant ? '#111111' : '#1c1c1c',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: isAssistant ? '20px 20px 20px 8px' : '20px 20px 8px 20px',
                        padding: '12px 14px',
                        lineHeight: 1.6,
                        fontSize: 14,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      background: '#111111',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '20px 20px 20px 8px',
                      padding: '12px 14px',
                      fontSize: 14,
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '14px 16px 16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                background: '#050505',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    disabled={loading}
                    style={{
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '8px 10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(input);
                }}
                style={{ display: 'flex', gap: 10 }}
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about features, time savings, or workflows..."
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#111111',
                    color: '#ffffff',
                    padding: '0 16px',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: loading || !input.trim() ? '#111111' : '#ffffff',
                    color: loading || !input.trim() ? 'rgba(255,255,255,0.4)' : '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Open Sanjeevni assistant"
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 0 8px rgba(255,255,255,0.02)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            backdropFilter: 'blur(18px)',
          }}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
          {!isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 7,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              <Sparkles size={10} />
            </div>
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .landing-assistant-mobile {
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}
