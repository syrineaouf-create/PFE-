import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { Bot, Send } from 'lucide-react';

const C = {
  navy: "#0f1c3f",
  accent: "#1e40af",
  bg: "#f4f6fb",
  userMsg: "#1a2d5a",
  botMsg: "#ffffff",
  text: "#1a2340",
  textMuted: "#8892a4"
};

export default function AIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Bonjour ! Je suis WaialysBot 🤖, expert en Industrie 4.0, Automatisme et Ingénierie. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // Pass the message and previous history
      const res = await api.post('/chat/message', {
        message: userText,
        history: messages
      });
      setMessages(prev => [...prev, { role: 'model', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ Problème de connexion avec le serveur de l'Agent IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton Bulle Flottante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 99999,
          width: 48, height: 48, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.navy}, #1a2d5a)`,
          color: '#ffffff', border: `2px solid #ffffff`,
          boxShadow: '0 8px 20px rgba(15,28,63,0.25)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'scale(0.8)' : 'scale(1)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = isOpen ? 'scale(0.8)' : 'scale(1)'}
      >
        {isOpen ? '✕' : <Bot size={22} />}
      </button>

      {/* Fenêtre de Chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 105, right: 30, zIndex: 99998,
          width: 360, height: 500, background: C.bg,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          border: `1px solid rgba(30, 64, 175, 0.3)`,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          {/* Header */}
          <div style={{
            background: C.navy, color: '#fff', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `2px solid #ffffff`
          }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>WaialysBot 4.0</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Expert Industriel Virtuel</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? C.userMsg : C.botMsg,
                color: m.role === 'user' ? '#fff' : C.text,
                padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                fontSize: 14, lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: C.botMsg, padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontSize: 13, color: C.textMuted, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="dot-pulse" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={14} /> Analyse en cours...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: 12, background: '#fff', borderTop: '1px solid #e4e8f0',
            display: 'flex', gap: 8
          }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ex: Qu'est-ce que le SCADA ?"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 20,
                border: '1px solid #e4e8f0', outline: 'none',
                fontFamily: 'inherit', fontSize: 14
              }}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: input.trim() && !isLoading ? C.accent : '#e4e8f0',
                color: '#fff', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}
