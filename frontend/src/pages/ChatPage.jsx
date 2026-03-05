import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';
import { chatApi, adminApi } from '../lib/api';
import { Avatar } from '../components/UserMenu';
import Picker from '@emoji-mart/react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import rawData from '@emoji-mart/data';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY);

const data = {
  ...rawData,
  emojis: Object.fromEntries(
    Object.entries(rawData.emojis).filter(([id]) => id !== 'middle_finger')
  ),
  categories: rawData.categories.map(cat => ({
    ...cat,
    emojis: (cat.emojis || []).filter(id => id !== 'middle_finger')
  }))
};
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
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

const GROUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes

function groupMessages(messages) {
  const items = [];
  let currentDate = null;

  messages.forEach((msg, i) => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== currentDate) {
      items.push({ type: 'date', date: msg.created_at, key: date });
      currentDate = date;
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];

    const prevSame = prev && prev.user_id === msg.user_id
      && new Date(msg.created_at) - new Date(prev.created_at) < GROUP_DELAY_MS
      && new Date(prev.created_at).toDateString() === date;

    const nextSame = next && next.user_id === msg.user_id
      && new Date(next.created_at) - new Date(msg.created_at) < GROUP_DELAY_MS
      && new Date(next.created_at).toDateString() === date;

    items.push({
      type: 'message',
      ...msg,
      showName:   !prevSame,  // premier du groupe → affiche le nom
      showAvatar: !nextSame,  // dernier du groupe → affiche l'avatar
    });
  });

  return items;
}

const ALL_KEYWORDS = ['@tous', '@all', '@toutes'];

function renderContent(content, myUsername) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const isAll = ALL_KEYWORDS.includes(part.toLowerCase());
      const isMe = !isAll && myUsername && part.slice(1).toLowerCase() === myUsername.toLowerCase();
      return <span key={i} className={`mention${isMe ? ' mention-me' : ''}${isAll ? ' mention-all' : ''}`}>{part}</span>;
    }
    return part;
  });
}

export default function ChatPage({ onUnreadChange }) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const myLevel = getMyLevel();
  const isAdmin = myLevel <= 2;

  const [rooms, setRooms]           = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [unread, setUnread]         = useState({});

  const [adminMode, setAdminMode]                   = useState(false);
  const [showInputPicker, setShowInputPicker]       = useState(false);
  const [showGiphy, setShowGiphy]                   = useState(false);
  const [showScrollBtn, setShowScrollBtn]           = useState(false);
  const [unreadCount, setUnreadCount]               = useState(0);
  const [editingMsgId, setEditingMsgId]             = useState(null);
  const [firstUnreadIdx, setFirstUnreadIdx]         = useState(null);
  const [pinnedMsg, setPinnedMsg]                   = useState(null);
  const [reportMsgId, setReportMsgId]               = useState(null);
  const [roomUnread, setRoomUnread]                 = useState({});
  const [editingText, setEditingText]               = useState('');
  const [giphySearch, setGiphySearch]               = useState('');
  const [reactions, setReactions]                   = useState({}); // { message_id: [{emoji, user_id}] }
  const [pickerMsgId, setPickerMsgId]               = useState(null); // id du msg dont le picker est ouvert
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionIndex, setMentionIndex]   = useState(0);
  const [mentionStart, setMentionStart]   = useState(-1);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const channelRef     = useRef(null);
  const activeRoomRef  = useRef(null);
  const pickerRef      = useRef(null);
  const inputPickerRef  = useRef(null);
  const giphyRef        = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const total = Object.values(roomUnread).reduce((a, b) => a + b, 0);
    onUnreadChange?.(total);
  }, [roomUnread, onUnreadChange]);

  const getLastRead = (roomId) => {
    try { return parseInt(localStorage.getItem(`last_read_${roomId}`) || '0'); } catch { return 0; }
  };
  const setLastRead = (roomId) => {
    try { localStorage.setItem(`last_read_${roomId}`, Date.now()); } catch {}
    setRoomUnread(prev => ({ ...prev, [roomId]: 0 }));
  };

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 60);
    }, 300);
  }, []);

  // Détecter si l'utilisateur a scrollé vers le haut
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollBtn(distanceFromBottom > 60);
      if (distanceFromBottom <= 150) setUnreadCount(0);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeRoom]);

  // Fermer Giphy au clic extérieur
  useEffect(() => {
    if (!showGiphy) return;
    const handleClickOutside = (e) => {
      if (giphyRef.current && !giphyRef.current.contains(e.target)) {
        setShowGiphy(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGiphy]);

  // Fermer le picker d'input au clic extérieur
  useEffect(() => {
    if (!showInputPicker) return;
    const handleClickOutside = (e) => {
      if (inputPickerRef.current && !inputPickerRef.current.contains(e.target)) {
        setShowInputPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInputPicker]);

  // Fermer le picker au clic extérieur
  useEffect(() => {
    if (!pickerMsgId) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerMsgId]);

  useEffect(() => {
    Promise.all([chatApi.getRooms(), adminApi.getUsers()])
      .then(([r, u]) => {
        setRooms(r);
        if (r.length > 0) setActiveRoom(r[0]);
        setUsers(u || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    setMessages([]);

    supabase.from('messages')
      .select('*').eq('room_id', activeRoom.id).is('deleted_at', null)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => {
        const msgs = data || [];
        const lastRead = getLastRead(activeRoom.id);
        // Trouver le premier message non lu
        const idx = lastRead > 0
          ? msgs.findIndex(m => new Date(m.created_at).getTime() > lastRead)
          : -1;
        setFirstUnreadIdx(idx > 0 ? idx : null);
        setMessages(msgs);
        setTimeout(() => {
          if (idx > 0) {
            // Scroller jusqu'au séparateur
            const sep = document.getElementById('unread-separator');
            if (sep) sep.scrollIntoView({ behavior: 'instant', block: 'center' });
          } else {
            scrollToBottom('instant');
          }
        }, 50);
        setLastRead(activeRoom.id);
      });
      chatApi.getPinned(activeRoom.id).then(({ data }) => setPinnedMsg(data || null)).catch(() => setPinnedMsg(null));

    // Charger les réactions du salon
    chatApi.getReactions(activeRoom.id).then(data => {
      const map = {};
      (data || []).forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = [];
        map[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
      });
      setReactions(map);
    });

    // Realtime réactions
    const reactChannel = supabase.channel(`reactions:${activeRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' },
        () => {
          // Recharger toutes les réactions du salon
          chatApi.getReactions(activeRoom.id).then(data => {
            const map = {};
            (data || []).forEach(r => {
              if (!map[r.message_id]) map[r.message_id] = [];
              map[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
            });
            setReactions(map);
          });
        })
      .subscribe();

    const channel = supabase.channel(`room:${activeRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        async (payload) => {
          const m = payload.new;
          if (m.deleted_at) return;
          // Recharger le message complet pour avoir toutes les colonnes (is_admin_msg, avatar, etc.)
          const { data: full } = await supabase.from('messages').select('*').eq('id', m.id).single();
          const msg = full || m;
          setMessages(prev => prev.find(x => x.id === msg.id) ? prev : [...prev, msg]);
          setTimeout(() => scrollToBottom('smooth'), 50);
          if (activeRoomRef.current?.id !== msg.room_id)
            setUnread(prev => ({ ...prev, [msg.room_id]: (prev[msg.room_id] || 0) + 1 }));
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => { if (payload.new.deleted_at) setMessages(prev => prev.filter(m => m.id !== payload.new.id)); })
      .subscribe();

    channelRef.current = channel;
    setUnread(prev => ({ ...prev, [activeRoom.id]: 0 }));
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [activeRoom?.id]);

  const handlePin = async (msg) => {
    const newPinned = pinnedMsg?.id !== msg.id;
    await chatApi.pinMessage(msg.id, newPinned);
    setPinnedMsg(newPinned ? msg : null);
  };

  const handleReport = async (msgId) => {
    await chatApi.reportMessage(msgId, null);
    setReportMsgId(null);
    alert(t('reportSent'));
  };

  const startEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.content);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditingText('');
  };

  const submitEdit = async (msgId) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    try {
      await chatApi.editMessage(msgId, trimmed);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: trimmed, edited_at: new Date().toISOString() } : m));
    } catch {}
    cancelEdit();
  };

  const handleGifClick = async (gif) => {
    setShowGiphy(false);
    setGiphySearch('');
    try {
      await chatApi.sendMessage(activeRoom.id, gif.images.fixed_height.url, false, true);
    } catch {}
  };

  const handleInputEmoji = (e) => {
    const emoji = e.native;
    const pos = inputRef.current?.selectionStart ?? input.length;
    const newVal = input.slice(0, pos) + emoji + input.slice(pos);
    setInput(newVal);
    setShowInputPicker(false);
    setTimeout(() => {
      const newPos = pos + emoji.length;
      inputRef.current?.setSelectionRange(newPos, newPos);
      inputRef.current?.focus();
    }, 0);
  };

  const closeMention = useCallback(() => {
    setMentionSuggestions([]); setMentionStart(-1); setMentionIndex(0);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setInput(val);
    const atMatch = val.slice(0, pos).match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      setMentionStart(pos - atMatch[0].length);
      // Ajouter @tous/@all en première position si ça matche
      const tousKeyword = t('mentionAll');
      const specialAll = { id: '__all__', username: tousKeyword };
      const allMatches = tousKeyword.toLowerCase().startsWith(query) || 'all'.startsWith(query) || 'tous'.startsWith(query);
      const filtered = users.filter(u => u.username.toLowerCase().startsWith(query) && u.id !== user?.id).slice(0, 5);
      setMentionSuggestions(allMatches ? [specialAll, ...filtered] : filtered);
      setMentionIndex(0);
    } else { closeMention(); }
  };

  const selectMention = useCallback((username) => {
    const pos = inputRef.current?.selectionStart ?? input.length;
    const before = input.slice(0, mentionStart);
    const after = input.slice(pos);
    const newVal = `${before}@${username} ${after}`;
    setInput(newVal);
    closeMention();
    setTimeout(() => {
      const newPos = before.length + username.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
      inputRef.current?.focus();
    }, 0);
  }, [input, mentionStart, closeMention]);

  const handleKeyDown = (e) => {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown')  { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, mentionSuggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || (e.key === 'Enter' && mentionSuggestions.length > 0)) { e.preventDefault(); selectMention(mentionSuggestions[mentionIndex].username); return; }
      if (e.key === 'Escape')     { closeMention(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !activeRoom) return;
    const wasAdmin = adminMode;
    setInput(''); closeMention(); setAdminMode(false); setSending(true);
    try { await chatApi.sendMessage(activeRoom.id, content, wasAdmin); }
    catch { setInput(content); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleReaction = async (msgId, emoji) => {
    setPickerMsgId(null);
    // Optimiste: toggle local
    setReactions(prev => {
      const msgReactions = [...(prev[msgId] || [])];
      const idx = msgReactions.findIndex(r => r.emoji === emoji && r.user_id === user?.id);
      if (idx >= 0) msgReactions.splice(idx, 1);
      else msgReactions.push({ emoji, user_id: user?.id });
      return { ...prev, [msgId]: msgReactions };
    });
    try { await chatApi.toggleReaction(msgId, emoji); } catch {}
  };

  const handleDelete = async (msgId) => {
    if (!confirm(t('chatDeleteConfirm'))) return;
    try { await chatApi.deleteMessage(msgId); setMessages(prev => prev.filter(m => m.id !== msgId)); } catch {}
  };

  const handleRoomClick = (room) => {
    setActiveRoom(room);
    setPickerMsgId(null);
    setUnread(prev => ({ ...prev, [room.id]: 0 }));
  };

  if (loading) return <div className="chat-loading"><div className="spinner" /><p>{t('loading')}</p></div>;

  const grouped = groupMessages(messages);

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">{t('chatRooms')}</div>
        {rooms.map(room => {
          const badge = unread[room.id] || 0;
          return (
            <button key={room.id} className={`chat-room-btn ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => handleRoomClick(room)}>
              <span className="room-icon">{room.type === 'general' ? '🌐' : '👥'}</span>
              <span className="room-name">{room.type === 'general' ? t('chatGeneral') : room.name}</span>
              {badge > 0 && <span className="unread-badge">{badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="chat-main">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <span className="chat-header-icon">{activeRoom.type === 'general' ? '🌐' : '👥'}</span>
              <span className="chat-header-name">{activeRoom.type === 'general' ? t('chatGeneral') : activeRoom.name}</span>
            </div>

            {pinnedMsg && (
              <div className="pinned-msg-bar">
                <span className="pinned-icon">📌</span>
                <span className="pinned-content">{pinnedMsg.is_gif ? '🖼 GIF' : pinnedMsg.content?.slice(0, 80)}</span>
                {isAdmin && <button className="pinned-unpin" onClick={() => handlePin(pinnedMsg)}>✕</button>}
              </div>
            )}
            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.length === 0 && <div className="chat-empty">{t('chatEmpty')}</div>}
              {grouped.map((item, idx) => {
                if (item.type === 'date') return (
                  <div key={item.key} className="chat-date-divider"><span>{formatDate(item.date)}</span></div>
                );
                const isMe = item.user_id === user?.id;
                const lowerContent = item.content.toLowerCase();
                const isMentioned = (user?.username && item.content.includes(`@${user.username}`)) ||
                  ALL_KEYWORDS.some(k => lowerContent.includes(k));
                const isAdminMsg = item.is_admin_msg === true;
                const isEmojiOnly = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u.test(item.content.trim()) && item.content.trim().length <= 8;
                const msgAvatar = {
                  avatar_url: item.avatar_url,
                  avatar_type: item.avatar_type || 'letter',
                  avatar_color: item.avatar_color || '#000000',
                  avatar_text_color: item.avatar_text_color || '#FFFFFF',
                  username: item.username,
                };
                const showSeparator = firstUnreadIdx !== null && idx === firstUnreadIdx;
                return (
                  <React.Fragment key={item.id}>
                  {showSeparator && (
                    <div id="unread-separator" className="unread-separator">
                      <span>{t('newMessages')}</span>
                    </div>
                  )}
                  <div id={`msg-${item.id}`} className={`chat-msg ${isMe ? 'mine' : 'theirs'}${isMentioned ? ' mentioned' : ''}${isAdminMsg ? ' admin-msg' : ''}${!item.showName && !isMe ? ' grouped' : ''}${isEmojiOnly ? ' emoji-only' : ''}`}>
                    {/* Nom */}
                    {!isMe && item.showName && (
                      <div className="msg-author-row">
                        <span className="msg-author">{item.username}</span>
                        {isAdminMsg && <span className="msg-admin-badge">{item.role_level === 1 ? '⭐' : '🔑'}</span>}
                      </div>
                    )}

                    {/* Ligne avatar + contenu */}
                    <div className="msg-row">
                      {/* Avatar — affiché seulement pour les messages des autres */}
                      {!isMe && (
                        <div className="msg-avatar-slot">
                          {item.showAvatar && <Avatar user={msgAvatar} size={28} />}
                        </div>
                      )}

                      {/* Colonne : bulle + réactions + heure */}
                      <div className="msg-col">

                        {/* Bulle avec hover actions */}
                        <div className="msg-bubble-wrap">
                          <div className={`msg-bubble${item.is_gif ? ' gif-bubble' : ''}`}>
                            {editingMsgId !== item.id && (
                              <div className={`msg-hover-actions ${isMe ? 'actions-left' : 'actions-right'}`}>
                                {isMe && !item.is_gif && <button className="msg-action-btn" onClick={() => startEdit(item)} title="Modifier">✏️</button>}
                                <button className="msg-action-btn" onClick={() => setPickerMsgId(pickerMsgId === item.id ? null : item.id)} title="Réagir">😊</button>
                                {!isMe && <button className="msg-action-btn" onClick={() => { if(window.confirm(t('reportConfirm'))) handleReport(item.id); }} title={t('reportMsg')}>🚩</button>}
                                {isAdmin && <button className="msg-action-btn" onClick={() => handlePin(item)} title={pinnedMsg?.id === item.id ? t('unpinMsg') : t('pinMsg')}>{pinnedMsg?.id === item.id ? '📌' : '📍'}</button>}
                                {isAdmin && <button className="msg-action-btn msg-action-delete" onClick={() => handleDelete(item.id)} title={t('chatDelete')}>🗑</button>}
                              </div>
                            )}
                            {editingMsgId === item.id ? (
                              <div className="msg-edit-wrap">
                                <textarea
                                  className="msg-edit-input"
                                  value={editingText}
                                  onChange={e => setEditingText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(item.id); }
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                  rows={2}
                                />
                                <div className="msg-edit-actions">
                                  <button className="msg-edit-save" onClick={() => submitEdit(item.id)}>✓</button>
                                  <button className="msg-edit-cancel" onClick={cancelEdit}>✕</button>
                                </div>
                              </div>
                            ) : item.is_gif
                              ? <img src={item.content} alt="GIF" className="msg-gif" />
                              : <span className="msg-content">{renderContent(item.content, user?.username)}</span>
                            }
                          </div>

                          {/* Emoji picker */}
                          {pickerMsgId === item.id && (
                            <div
                              ref={pickerRef}
                              className={`emoji-picker-wrap ${isMe ? 'picker-left' : 'picker-right'}`}
                              style={(() => {
                                const el = document.getElementById(`msg-${item.id}`);
                                if (!el) return {};
                                const rect = el.getBoundingClientRect();
                                const viewportHeight = window.innerHeight;
                                const spaceBelow = viewportHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                if (spaceBelow >= 460) return { bottom: 'auto', top: '100%' };
                                if (spaceAbove >= 460) return {};
                                return {
                                  position: 'fixed',
                                  top: Math.max(8, Math.min(viewportHeight - 460, rect.top - 200)),
                                  bottom: 'auto',
                                  ...(isMe ? { right: Math.max(8, window.innerWidth - rect.left + 6) } : { left: Math.max(8, rect.right + 6) })
                                };
                              })()}
                            >
                              <Picker
                                data={data}
                                onEmojiSelect={(e) => handleReaction(item.id, e.native)}
                                theme="dark"
                                locale={lang?.startsWith('fr') ? 'fr' : 'en'}
                                previewPosition="none"
                                skinTonePosition="none"
                                maxFrequentRows={2}
                                perLine={8}
                              />
                            </div>
                          )}
                        </div>{/* fin msg-bubble-wrap */}

                        {/* Réactions — sous la bulle, largeur libre */}
                        {(reactions[item.id] || []).length > 0 && (
                          <div className={`msg-reactions ${isMe ? 'reactions-mine' : 'reactions-theirs'}`}>
                            {Object.entries(
                              (reactions[item.id] || []).reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || []);
                                acc[r.emoji].push(r.user_id);
                                return acc;
                              }, {})
                            ).map(([emoji, uids]) => (
                              <button key={emoji}
                                className={`reaction-chip${uids.includes(user?.id) ? ' mine' : ''}`}
                                onClick={() => handleReaction(item.id, emoji)}>
                                {emoji} <span>{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Heure — sous les réactions */}
                        <span className="msg-time">{formatTime(item.created_at)}{item.edited_at && editingMsgId !== item.id ? <em className="msg-edited"> · {t('msgEdited')}</em> : null}</span>

                      </div>{/* fin msg-col */}
                    </div>{/* fin msg-row */}
                  </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              {mentionSuggestions.length > 0 && (
                <div className="mention-dropdown">
                  {mentionSuggestions.map((u, i) => (
                    <button key={u.id} className={`mention-option${i === mentionIndex ? ' active' : ''}${u.id === '__all__' ? ' mention-all-option' : ''}`}
                      onMouseDown={e => { e.preventDefault(); selectMention(u.username); }}>
                      <span className="mention-at">@</span>
                      <span className="mention-name">{u.username}</span>
                      {u.id === '__all__' && <span className="mention-all-badge">notifie tout le monde</span>}
                    </button>
                  ))}
                </div>
              )}
              {showScrollBtn && !pickerMsgId && (
                <button className="scroll-to-bottom-btn" onClick={() => scrollToBottom('smooth')}>
                  {unreadCount > 0 ? `↓ ${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''}` : '↓'}
                </button>
              )}
              {showGiphy && (
                <div ref={giphyRef} className="giphy-panel">
                  <input
                    className="giphy-search"
                    placeholder="Rechercher un GIF..."
                    value={giphySearch}
                    onChange={e => setGiphySearch(e.target.value)}
                    autoFocus
                  />
                  <div className="giphy-grid">
                    <Grid
                      key={giphySearch}
                      fetchGifs={giphySearch
                        ? (offset) => gf.search(giphySearch, { offset, limit: 12 })
                        : (offset) => gf.trending({ offset, limit: 12 })
                      }
                      width={320}
                      columns={3}
                      gutter={4}
                      onGifClick={(gif, e) => { e.preventDefault(); handleGifClick(gif); }}
                      noLink
                    />
                  </div>
                  <div className="giphy-attribution">Powered by GIPHY</div>
                </div>
              )}
              {showInputPicker && (
                <div ref={inputPickerRef} className="input-emoji-picker">
                  <Picker
                    data={data}
                    onEmojiSelect={handleInputEmoji}
                    theme="dark"
                    locale={lang?.startsWith('fr') ? 'fr' : 'en'}
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={2}
                    perLine={8}
                  />
                </div>
              )}
              <div className="chat-input-row">
                {isAdmin && (
                  <button
                    className={`admin-mode-btn${adminMode ? ' active' : ''}`}
                    onClick={() => setAdminMode(v => !v)}
                    title={adminMode ? t('adminModeOn') : t('adminModeOff')}
                  >
                    🔑
                  </button>
                )}
                <button className="emoji-input-btn" onClick={() => { setShowInputPicker(v => !v); setShowGiphy(false); }}>😊</button>
                <button className="emoji-input-btn gif-btn" onClick={() => { setShowGiphy(v => !v); setShowInputPicker(false); }}>GIF</button>
                <textarea ref={inputRef} className={`chat-input${adminMode ? ' admin-mode-input' : ''}`} value={input}
                  onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder={adminMode ? t('adminModePlaceholder') : t('chatPlaceholder')} rows={1} maxLength={1000} />
                <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
                  {sending ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty">{t('chatNoRooms')}</div>
        )}
      </div>
    </div>
  );
}
