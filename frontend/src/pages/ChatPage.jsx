import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';
import { chatApi, roomReadsApi } from '../lib/api';
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


// ─── Regex détection URL ───────────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"{}|\^`[\]]+/i;

// ─── Composant aperçu de lien ──────────────────────────────────────────────
function LinkPreview({ url }) {
  const [preview, setPreview] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!url) return;
    chatApi.getLinkPreview(url)
      .then(data => { setPreview(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [url]);

  if (!loaded || !preview?.title) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview">
      {preview.image && (
        <img src={preview.image} alt="" className="link-preview-img"
          onError={e => e.target.style.display = 'none'} />
      )}
      <div className="link-preview-text">
        {preview.siteName && <span className="link-preview-site">{preview.siteName}</span>}
        <span className="link-preview-title">{preview.title}</span>
        {preview.description && <span className="link-preview-desc">{preview.description.slice(0, 100)}{preview.description.length > 100 ? '…' : ''}</span>}
      </div>
    </a>
  );
}

export default function ChatPage({ unread, setUnread, activeRoomIdRef, onInit }) {
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

  const [adminMode, setAdminMode]                   = useState(false);
  const [showInputPicker, setShowInputPicker]       = useState(false);
  const [showGiphy, setShowGiphy]                   = useState(false);
  const [showScrollBtn, setShowScrollBtn]           = useState(false);
  const [uploadingImg, setUploadingImg]             = useState(false);
  const fileInputRef = useRef(null);
  const [unreadCount, setUnreadCount]               = useState(0);
  const [editingMsgId, setEditingMsgId]             = useState(null);
  const [firstUnreadId, setFirstUnreadId]           = useState(null); // ID du 1er message non lu
  const [pinnedMsg, setPinnedMsg]                   = useState(null);
  const [roomReports, setRoomReports]               = useState([]);
  const [editingText, setEditingText]               = useState('');
  const [giphySearch, setGiphySearch]               = useState('');
  const [reactions, setReactions]                   = useState({}); // { message_id: [{emoji, user_id}] }
  const [pickerMsgId, setPickerMsgId]               = useState(null); // id du msg dont le picker est ouvert
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionIndex, setMentionIndex]   = useState(0);
  const [mentionStart, setMentionStart]   = useState(-1);
  const [lightboxUrl, setLightboxUrl]     = useState(null);
  const [toastMsg, setToastMsg]           = useState(null);
  const [memberReads, setMemberReads]     = useState({}); // { user_id: last_read ISO }

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const channelRef     = useRef(null);
  const activeRoomRef  = useRef(null);
  const pickerRef      = useRef(null);
  const inputPickerRef  = useRef(null);
  const giphyRef        = useRef(null);
  const messagesContainerRef = useRef(null);
  const isAtBottomRef        = useRef(true); // true = utilisateur en bas

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('✓ Message copié'))
      .catch(() => showToast('Erreur copie'));
  };

  // Marquer le salon comme lu — appelé uniquement quand l'utilisateur est en bas
  const markAsRead = useCallback((roomId) => {
    roomReadsApi.setRead(roomId).catch(() => {});
    setUnread(prev => ({ ...prev, [roomId]: 0 }));
    setFirstUnreadId(null); // effacer le séparateur
  }, [setUnread]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setUnreadCount(0);
    setShowScrollBtn(false);
    // Marquer comme lu quand on arrive en bas
    const roomId = activeRoomRef.current?.id;
    if (roomId) markAsRead(roomId);
  }, [markAsRead]);



  // Détecter scroll — mettre à jour isAtBottom + markAsRead si en bas
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= 60;
      isAtBottomRef.current = atBottom;
      setShowScrollBtn(!atBottom);
      if (atBottom) {
        setUnreadCount(0);
        const roomId = activeRoomRef.current?.id;
        if (roomId) markAsRead(roomId);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeRoom, markAsRead]);

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
    // getRooms seulement — les membres sont chargés par salon
    chatApi.getRooms()
      .then(r => {
        setRooms(r);
        if (r.length > 0) setActiveRoom(r[0]);
        onInit?.(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
    if (activeRoomIdRef) activeRoomIdRef.current = activeRoom?.id || null;
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom) return;
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    setMessages([]);

(async () => {
      const [{ data }, reads, members, allReads] = await Promise.all([
        supabase.from('messages')
          .select('*')
          .eq('room_id', activeRoom.id).is('deleted_at', null)
          .order('created_at', { ascending: true }).limit(100),
        roomReadsApi.getAll().catch(() => []),
        chatApi.getMembers(activeRoom.id).catch(() => []),
        supabase.from('room_reads').select('user_id, last_read').eq('room_id', activeRoom.id),
      ]);

      // Membres du salon
      setUsers(members || []);

      // Avatars Lu — last_read de chaque membre
      const readsMap = {};
      (allReads?.data || []).forEach(r => { readsMap[r.user_id] = r.last_read; });
      setMemberReads(readsMap);

      // Séparateur "Nouveaux messages"
      const msgs = data || [];
      const readMap = Object.fromEntries((reads || []).map(r => [r.room_id, r.last_read]));
      const lastRead = readMap[activeRoom.id];
      const firstUnreadMsg = lastRead
        ? msgs.find(m =>
            new Date(m.created_at) > new Date(lastRead) &&
            String(m.user_id) !== String(user?.id)
          )
        : null;
      setFirstUnreadId(firstUnreadMsg?.id ?? null);
      setMessages(msgs);

      // Scroll initial
      setTimeout(() => {
        if (firstUnreadMsg) {
          // Pas encore lu — scroller jusqu'au séparateur
          isAtBottomRef.current = false;
          const sep = document.getElementById('unread-separator');
          if (sep) sep.scrollIntoView({ behavior: 'instant', block: 'center' });
        } else {
          // Tout lu — aller en bas + markAsRead
          scrollToBottom('instant');
        }
      }, 50);
    })();
      chatApi.getPinned(activeRoom.id).then(({ data }) => setPinnedMsg(data || null)).catch(() => setPinnedMsg(null));
      if (isAdmin) chatApi.getReports(activeRoom.id).then(({ data }) => setRoomReports(data || [])).catch(() => setRoomReports([]));

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
    channelRef.reactChannel = supabase.channel(`reactions:${activeRoom.id}`)
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
          const { data: full } = await supabase.from('messages').select('*').eq('id', m.id).single();
          const msg = full || m;
          setMessages(prev => prev.find(x => x.id === msg.id) ? prev : [...prev, msg]);
          if (isAtBottomRef.current) {
            // Utilisateur en bas — scroller et marquer comme lu
            setTimeout(() => scrollToBottom('smooth'), 50);
          } else if (String(msg.user_id) !== String(user?.id)) {
            // Utilisateur scrollé vers le haut — incrémenter le compteur
            setUnreadCount(prev => prev + 1);
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => { if (payload.new.deleted_at) setMessages(prev => prev.filter(m => m.id !== payload.new.id)); })
      .subscribe();

    // Écouter les mises à jour room_reads — avatars Lu en temps réel
    const readsChannel = supabase.channel(`reads:${activeRoom.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_reads',
        filter: `room_id=eq.${activeRoom.id}`
      }, (payload) => {
        const r = payload.new;
        if (!r) return;
        // Mettre à jour les avatars Lu des autres membres seulement
        if (String(r.user_id) !== String(user?.id)) {
          setMemberReads(prev => ({ ...prev, [r.user_id]: r.last_read }));
        }
      })
      .subscribe();

    channelRef.current = channel;
    channelRef.readsChannel = readsChannel;
    setUnread(prev => ({ ...prev, [activeRoom.id]: 0 }));
    return () => {
      if (channelRef.current)       { supabase.removeChannel(channelRef.current);       channelRef.current = null; }
      if (channelRef.readsChannel)  { supabase.removeChannel(channelRef.readsChannel);  channelRef.readsChannel = null; }
      if (channelRef.reactChannel)  { supabase.removeChannel(channelRef.reactChannel);  channelRef.reactChannel = null; }
    };
  }, [activeRoom?.id]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    e.target.value = '';
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('image', file, file.name);
      const { data } = await chatApi.uploadImage(activeRoom.id, formData);
      if (data) {
        const flat = { ...data, ...(data.users || {}) };
        setMessages(prev => [...prev, flat]);
      }
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      showToast('🔇 ' + (err.message || 'Erreur upload'));
    }
    setUploadingImg(false);
  };

  const scrollToMsg = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleResolve = async (msgId) => {
    await chatApi.resolveReport(msgId);
    setRoomReports(prev => prev.filter(r => r.message_id !== msgId));
  };

  const handlePin = async (msg) => {
    const newPinned = pinnedMsg?.id !== msg.id;
    await chatApi.pinMessage(msg.id, newPinned);
    setPinnedMsg(newPinned ? msg : null);
  };

  const handleReport = async (msgId) => {
    await chatApi.reportMessage(msgId, null);
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
    try {
      await chatApi.sendMessage(activeRoom.id, content, wasAdmin);
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
    catch (err) {
      setInput(content);
      showToast('🔇 ' + (err.message || 'Erreur envoi'));
    }
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
    if (room.id === activeRoom?.id) return; // déjà sur ce salon
    setActiveRoom(room);
    setPickerMsgId(null);
    setFirstUnreadId(null); // reset séparateur proprement
    isAtBottomRef.current = true; // présumer en bas jusqu'au chargement
  };

  // Calculer la position de lecture de chaque membre (user_id → message_id le plus récent lu)
  // useMemo — recalcule seulement quand memberReads ou messages changent
  const memberReadPositions = useMemo(() => {
    const positions = {}; // { user_id: message_id }
    const currentUserId = user?.id ? String(user.id) : null;
    Object.entries(memberReads).forEach(([uid, lastRead]) => {
      // Exclure l'utilisateur courant — comparaison string explicite
      if (!lastRead || !currentUserId || String(uid) === currentUserId) return;
      const lastReadTime = new Date(lastRead).getTime();
      // Trouver le dernier message dont created_at <= lastRead (tous messages inclus)
      let best = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (new Date(msg.created_at).getTime() <= lastReadTime) {
          best = msg.id;
          break;
        }
      }
      if (best) positions[uid] = best;
    });
    return positions;
  }, [memberReads, messages, user?.id]);

  // Bug 1 fix — render : comparaison string explicite pour trouver le user
  const findUserById = useCallback((uid) =>
    users.find(u => String(u.id) === String(uid))
  , [users]);

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

            {isAdmin && roomReports.length > 0 && (
              <div className="reports-bar" onClick={() => scrollToMsg(roomReports[0].message_id)}>
                <span className="reports-icon">🚩</span>
                <span className="reports-label">{roomReports.length} message{roomReports.length > 1 ? 's' : ''} signalé{roomReports.length > 1 ? 's' : ''} — cliquer pour voir</span>
              </div>
            )}
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
                const showSeparator = firstUnreadId !== null && item.id === firstUnreadId;
                const isReported = isAdmin && roomReports.some(r => r.message_id === item.id);
                return (
                  <React.Fragment key={item.id}>
                  {showSeparator && (
                    <div id="unread-separator" className="unread-separator">
                      <span>{t('newMessages')}</span>
                    </div>
                  )}
                  <div id={`msg-${item.id}`} className={`chat-msg ${isMe ? 'mine' : 'theirs'}${isMentioned ? ' mentioned' : ''}${isAdminMsg ? ' admin-msg' : ''}${!item.showName && !isMe ? ' grouped' : ''}${isEmojiOnly ? ' emoji-only' : ''}${isReported ? ' reported' : ''}`}>
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
                          <div className={`msg-bubble${item.is_gif || item.is_image ? ' gif-bubble' : ''}`}>
                            {editingMsgId !== item.id && (
                              <div className={`msg-hover-actions ${isMe ? 'actions-left' : 'actions-right'}`}>
                                {isMe && !item.is_gif && <button className="msg-action-btn" onClick={() => startEdit(item)} title="Modifier">✏️</button>}
                                <button className="msg-action-btn" onClick={() => setPickerMsgId(pickerMsgId === item.id ? null : item.id)} title="Réagir">😊</button>
                                {!item.is_gif && !item.is_image && <button className="msg-action-btn" onClick={() => handleCopyMessage(item.content)} title="Copier">📋</button>}
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
                              : item.is_image
                              ? <img src={item.content} alt="image" className="msg-img" onClick={() => setLightboxUrl(item.content)} />
                              : <>{!isEmojiOnly && URL_REGEX.test(item.content) && (
                                  <LinkPreview url={item.content.match(URL_REGEX)?.[0]} />
                                )}
                                <span className="msg-content">{renderContent(item.content, user?.username)}</span>
                              </>
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

                        {/* Boutons modération (admin + message signalé) */}
                        {isReported && (
                          <div className="report-actions">
                            <button className="report-approve" onClick={() => handleResolve(item.id)}>✅ {t('reportApprove')}</button>
                            <button className="report-delete" onClick={() => { handleDelete(item.id); handleResolve(item.id); }}>🗑 {t('chatDelete')}</button>
                          </div>
                        )}

                      </div>{/* fin msg-col */}

                      {/* Readers slot — toujours à droite, seulement sur le dernier msg du groupe */}
                      {item.showAvatar && (() => {
                        const readers = Object.entries(memberReadPositions)
                          .filter(([, msgId]) => msgId === item.id)
                          .map(([uid]) => findUserById(uid))
                          .filter(Boolean);
                        if (readers.length === 0) return null;
                        return (
                          <div className="msg-readers-slot">
                            {readers.map(u => (
                              <div key={u.id} className="reader-avatar" title={`Lu par ${u.username}`}>
                                <Avatar user={u} size={16} />
                              </div>
                            ))}
                          </div>
                        );
                      })()}

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
                <div className="chat-input-btns-row">
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
                  <button className="emoji-input-btn img-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} title="Envoyer une image">
                    {uploadingImg ? '⏳' : '📷'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>
                <textarea ref={inputRef} className={`chat-input${adminMode ? ' admin-mode-input' : ''}`} value={input}
                  onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder='' rows={1} maxLength={1000} />
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
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
          <img src={lightboxUrl} alt="Aperçu" className="lightbox-img" onClick={e => e.stopPropagation()} />
          <a href={lightboxUrl} target="_blank" rel="noopener noreferrer" className="lightbox-open" onClick={e => e.stopPropagation()}>↗ Ouvrir</a>
        </div>
      )}

      {/* Toast */}
      {toastMsg && <div className="chat-toast">{toastMsg}</div>}
    </div>
  );
}
