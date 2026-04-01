import React, { useState } from 'react';
import { api } from '../../../services/api';

export default function TabMessages({ messages, setMessages, unreadCount, setUnreadCount, flash }) {
  const [replyText,  setReplyText]  = useState({});
  const [replyingTo, setReplyingTo] = useState(null);

  return (
    <div className="adm-content">
      <div className="adm-search-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>💬 Contact Messages</h3>
          {unreadCount > 0 && <span className="adm-unread-badge">{unreadCount} unread</span>}
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{messages.length} total</span>
      </div>

      {messages.length === 0 ? (
        <div className="adm-empty"><span>💬</span><p>No messages yet.</p></div>
      ) : (
        <div className="adm-messages-list">
          {messages.map(m => (
            <div key={m.id} className={`adm-msg-card ${m.status === 'unread' ? 'unread' : ''}`}>
              <div className="adm-msg-header">
                <div className="adm-msg-sender">
                  <div className="adm-msg-avatar">{m.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{m.name}</strong>
                    <span>{m.email}</span>
                    {m.phone && <span>📞 {m.phone}</span>}
                  </div>
                </div>
                <div className="adm-msg-meta">
                  {m.subject && <span className="adm-msg-subject">{m.subject}</span>}
                  <span className={`adm-msg-status ${m.status}`}>
                    {m.status === 'unread'  ? '🔵 Unread'  :
                     m.status === 'replied' ? '✅ Replied' : '👁️ Read'}
                  </span>
                  <small>{new Date(m.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</small>
                </div>
              </div>

              <div className="adm-msg-body"><p>{m.message}</p></div>

              {m.reply && (
                <div className="adm-msg-reply-sent">
                  <strong>✅ Your Reply:</strong>
                  <p>{m.reply}</p>
                </div>
              )}

              <div className="adm-msg-actions">
                {m.status === 'unread' && (
                  <button className="adm-btn-edit"
                    onClick={async () => {
                      await api.markMessageRead(m.id);
                      setMessages(ms => ms.map(x => x.id === m.id ? { ...x, status: 'read' } : x));
                      setUnreadCount(c => Math.max(0, c - 1));
                    }}>
                    👁️ Mark Read
                  </button>
                )}
                <button className="adm-btn-save"
                  style={{ fontSize: '12px', padding: '5px 14px' }}
                  onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}>
                  {replyingTo === m.id ? '✕ Close' : '↩️ Reply'}
                </button>
                <button className="adm-btn-delete"
                  onClick={async () => {
                    if (!window.confirm('Delete this message?')) return;
                    await api.deleteContactMessage(m.id);
                    setMessages(ms => ms.filter(x => x.id !== m.id));
                    if (m.status === 'unread') setUnreadCount(c => Math.max(0, c - 1));
                    flash('Message deleted');
                  }}>
                  🗑️ Delete
                </button>
              </div>

              {replyingTo === m.id && (
                <div className="adm-msg-reply-form">
                  <textarea
                    placeholder={`Reply to ${m.name}...`}
                    value={replyText[m.id] || ''}
                    onChange={e => setReplyText(r => ({ ...r, [m.id]: e.target.value }))}
                    rows={3}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="adm-btn-save"
                      onClick={async () => {
                        const reply = replyText[m.id];
                        if (!reply?.trim()) return;
                        await api.replyToMessage(m.id, { reply });
                        setMessages(ms => ms.map(x =>
                          x.id === m.id ? { ...x, reply, status: 'replied' } : x
                        ));
                        setReplyText(r => ({ ...r, [m.id]: '' }));
                        setReplyingTo(null);
                        flash('Reply saved!');
                      }}>
                      ✅ Save Reply
                    </button>
                    <button className="adm-btn-cancel" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
