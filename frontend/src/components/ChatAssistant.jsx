import React, { useState, useEffect, useRef } from 'react';

export default function ChatAssistant({ token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "Draft a follow-up email to a recruiter",
    "How should I explain a 6-month job gap?",
    "Give me salary negotiation bullet phrases",
    "How do I prepare for a system design review?"
  ];

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    setInput('');
    // Optimistic user bubble append
    const updatedUserMsg = [...messages, { id: 'temp-u', sender: 'user', message: msg }];
    setMessages(updatedUserMsg);
    setLoading(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      // Append real responses
      setMessages([...messages, 
        { id: 'temp-u', sender: 'user', message: msg },
        { id: 'temp-ai', sender: 'ai', message: data.aiMessage }
      ]);
      fetchChatHistory(); // refresh to replace temporary IDs
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipText) => {
    handleSendMessage(chipText);
  };

  return (
    <div className="chat-container">
      
      {/* Messages list area */}
      <div className="chat-history">
        {messages.length === 0 && !loading && (
          <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: 'var(--text-secondary)',
            gap: '12px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Your AI Career Assistant</h3>
            <p style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
              Ask me anything about formatting your resume, drafting recruiter emails, explaining career gaps, or salary negotiation tactics.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={msg.id || idx} 
            className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              whiteSpace: 'pre-wrap'
            }}
          >
            {msg.message}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble ai" style={{ alignSelf: 'flex-start', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {!loading && (
        <div className="chips-container">
          {suggestionChips.map((chip, idx) => (
            <button 
              key={idx} 
              className="chip" 
              onClick={() => handleChipClick(chip)}
              style={{ color: 'var(--text-primary)' }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="chat-input-area">
        <input 
          type="text" 
          className="form-input" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Ask your coach (e.g. Write a cold introduction message for an engineering manager...)"
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          Send 🚀
        </button>
      </form>

    </div>
  );
}
