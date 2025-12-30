import React, { useEffect, useState, useRef } from 'react';

const AdminChat = ({ currentUserId, otherUserId, otherName }) => {
  const [admin, setAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const pollingRef = useRef(null);

  const loadAdmin = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.users || []);
      const admins = list.filter(u => {
        if (!u) return false;
        if (u.role && typeof u.role === 'string' && u.role.toUpperCase() === 'ADMIN') return true;
        if (Array.isArray(u.roles) && u.roles.map(r => (r||'').toString().toUpperCase()).includes('ADMIN')) return true;
        if (typeof u.roles === 'string' && u.roles.toUpperCase() === 'ADMIN') return true;
        return false;
      });
      if (admins.length > 0) setAdmin(admins[0]);
    } catch (err) {
      console.error('Failed to load admins', err);
    }
  };

  const loadConversation = async () => {
    // If caller provided otherUserId, treat currentUserId as admin and otherUserId as target
    const target = otherUserId || (admin && admin._id);
    if (!currentUserId || !target) return;
    try {
      const qs = new URLSearchParams({ userA: currentUserId, userB: target });
      const res = await fetch('/api/messages/conversation?' + qs.toString());
      const data = await res.json();
      if (data && data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  useEffect(() => { if (!otherUserId) loadAdmin(); }, []);
  useEffect(() => {
    loadConversation();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(loadConversation, 3000);
    return () => clearInterval(pollingRef.current);
  }, [admin, currentUserId, otherUserId]);

  const sendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!text) return;
    try {
      const recipientId = otherUserId || (admin && admin._id);
      if (!recipientId) return alert('No recipient selected');
      const payload = { senderId: currentUserId, recipientId, content: text };
      const res = await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data && data.success) {
        setText('');
        loadConversation();
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      console.error('Send failed', err);
      alert('Network error');
    }
  };

  const chatTitle = otherName || (otherUserId ? 'Chat' : 'Chat with Admin');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary to-green-600 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {(chatTitle || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{chatTitle}</h3>
            <p className="text-green-100 text-xs">Online</p>
          </div>
        </div>
      </div>

      {!otherUserId && !admin && (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Finding admin...</p>
        </div>
      )}

      {(otherUserId || admin) && (
        <>
          {/* Messages Area */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.senderId && (m.senderId._id || m.senderId) === currentUserId;
                return (
                  <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-primary to-green-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
                    }`}>
                      <p className="text-sm leading-relaxed">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
              >
                <span>Send</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminChat;
