import React, { useState, useEffect } from 'react';
import { portalAPI } from '../../services/api';
import './ParentPages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await portalAPI.getMessages();
      setMessages(res.data?.data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await portalAPI.markMessageRead(id);
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m)
      );
    } catch { /* silent */ }
  };

  const toggleExpand = (id) => {
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);
    if (isExpanding) {
      const msg = messages.find(m => m.id === id);
      if (msg && !msg.isRead) handleMarkRead(id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const roleLabel = (role) => {
    if (role === 'super_admin' || role === 'admin') return 'Admin';
    if (role === 'staff') return 'Staff';
    return 'Scribbles';
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="parent-page messages-page">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Messages</h1>
          <p>
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
              : 'Messages from Scribbles Learning Center'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Messages from the learning center will appear here.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-card ${!msg.isRead ? 'unread' : ''}`}
              onClick={() => toggleExpand(msg.id)}
            >
              <div className="message-card-header">
                <div className={`message-icon ${!msg.isRead ? 'unread' : ''}`}>
                  {!msg.isRead ? '✉️' : '📨'}
                </div>
                <div className="message-info">
                  <h4 className="message-subject">{msg.subject}</h4>
                  <div className="message-meta">
                    <span className="sender-badge">{roleLabel(msg.senderRole)}</span>
                    {' '}{msg.senderName} &middot; {formatDate(msg.createdAt)}
                  </div>
                </div>
                {!msg.isRead && <span className="message-unread-dot" />}
              </div>
              {expandedId === msg.id && (
                <div className="message-body">{msg.body}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
