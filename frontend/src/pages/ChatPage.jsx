import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';
import { chatApi } from '../lib/api';
import { supabase } from '../lib/supabase';

function getMyLevel() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 99;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.role_level ?? (payload.is_admin ? 2 : 99);
  } catch { return 99; }
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function groupByDate(messages) {
  const groups = [];
  let currentDate = null;
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== currentDate) {
      groups.push({ type: 'date', date: msg.created_at, key: date });
      currentDate = date;
    }
    groups.push({ type: 'message', ...msg });
  });
  return groups;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const myLevel = getMyLevel();
  const isAdmin = myLevel <= 2;

  const [rooms, setRooms]           = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [unread, setUnread]         = useState({});

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const channelRef     = useRef(null);
  const activeRoomRef  = useRef(null);

  // Scroll en bas
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Charger les salons
  useEffect(() => {
    chatApi.getRooms()
      .then(r => {
        setRooms(r);
        if (r.length > 0) setActiveRoom(r[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Garder activeRoomRef à jour
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Charger messages + Supabase Realtime au changement de salon
  useEffect(() => {
    if (!activeRoom) return;

    // Désabonner du canal précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setMessages([]);

    // Charger les 100 derniers messages
    supabase.from('messages')
      .select('*')
      .eq('room_id', activeRoom.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || []);
        setTimeout(() => scrollToBottom('instant'), 50);
      });

    // Subscription Realtime
    const channel = supabase.channel(`room:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.deleted_at) return;
        setMessages(prev => {
          // Eviter les doublons
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
        // Marquer comme non-lu si pas dans ce salon
        if (activeRoomRef.current?.id !== newMsg.room_id) {
          setUnread(prev => ({ ...prev, [newMsg.room_id]: (prev[newMsg.room_id] || 0) + 1 }));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, (payload) => {
        const updated = payload.new;
        if (updated.deleted_at) {
          setMessages(prev => prev.filter(m => m.id !== updated.id));
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Effacer les non-lus pour ce salon
    setUnread(prev => ({ ...prev, [activeRoom.id]: 0 }));

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeRoom?.id]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !activeRoom) return;
    setInput('');
    setSending(true);
    try {
      await chatApi.sendMessage(activeRoom.id, content);
    } catch (e) {
      setInput(content); // remettre si erreur
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm(t('chatDeleteConfirm'))) return;
    try {
      await chatApi.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRoomClick = (room) => {
    setActiveRoom(room);
    setUnread(prev => ({ ...prev, [room.id]: 0 }));
  };

  if (loading) return <div className="chat-loading"><div className="spinner" /><p>{t('loading')}</p></div>;

  const grouped = groupByDate(messages);

  return (
    <div className="chat-page">
      {/* Sidebar salons */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">{t('chatRooms')}</div>
        {rooms.map(room => {
          const badge = unread[room.id] || 0;
          return (
            <button
              key={room.id}
              className={`chat-room-btn ${activeRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => handleRoomClick(room)}
            >
              <span className="room-icon">{room.type === 'general' ? '🌐' : '👥'}</span>
              <span className="room-name">{room.type === 'general' ? t('chatGeneral') : room.name}</span>
              {badge > 0 && <span className="unread-badge">{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Zone chat */}
      <div className="chat-main">
        {activeRoom ? (
          <>
            {/* Header salon */}
            <div className="chat-header">
              <span className="chat-header-icon">{activeRoom.type === 'general' ? '🌐' : '👥'}</span>
              <span className="chat-header-name">
                {activeRoom.type === 'general' ? t('chatGeneral') : activeRoom.name}
              </span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">{t('chatEmpty')}</div>
              )}
              {grouped.map((item, i) => {
                if (item.type === 'date') {
                  return (
                    <div key={item.key} className="chat-date-divider">
                      <span>{formatDate(item.date)}</span>
                    </div>
                  );
                }
                const isMe = item.user_id === user?.id;
                return (
                  <div key={item.id} className={`chat-msg ${isMe ? 'mine' : 'theirs'}`}>
                    {!isMe && <span className="msg-author">{item.username}</span>}
                    <div className="msg-bubble">
                      <span className="msg-content">{item.content}</span>
                      <span className="msg-time">{formatTime(item.created_at)}</span>
                      {isAdmin && (
                        <button className="msg-delete" onClick={() => handleDelete(item.id)} title={t('chatDelete')}>🗑</button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chatPlaceholder')}
                rows={1}
                maxLength={1000}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || sending}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </>
        ) : (
          <div className="chat-empty">{t('chatNoRooms')}</div>
        )}
      </div>
    </div>
  );
}
