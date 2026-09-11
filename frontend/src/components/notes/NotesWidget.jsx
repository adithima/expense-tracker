import React, { useEffect, useState, useRef } from 'react';
import { FiX, FiPlus, FiTrash2, FiFileText, FiSave, FiSmile, FiCalendar, FiEdit2, FiSearch } from 'react-icons/fi';
import { getNotes, createNote, updateNote, deleteNote } from '../../api/noteAPI';
import ConfirmDialog from '../common/ConfirmDialog';
import Spinner from '../common/Spinner';

const EMOJI_GROUPS = {
  Smileys: ['😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '🙂', '😉', '😢', '😭', '😡', '🥺', '😴', '🤔', '😅', '🙃', '😇', '🥳', '😜', '🤗', '😬', '🙄', '😌', '😋', '🤯', '😱', '🥹', '😤', '🤒', '🤕', '🥴', '😵', '🤓', '🧐', '😏', '🤐', '😶', '😐', '😑', '🤨', '😮', '😯', '😲', '🥱', '😪', '🤪'],
  People: ['👧', '👦', '👩', '👨', '👵', '👴', '👶', '🧑', '👩‍💼', '👨‍💼', '👩‍🎓', '👨‍🎓', '🧕', '👳', '👮', '🕵️', '👩‍⚕️', '👨‍⚕️', '👩‍🍳', '👨‍🍳', '🧑‍💻', '👸', '🤴', '🧙', '🧑‍🎨', '💃', '🕺', '🚶', '🏃', '🧍', '👯', '🧑‍🤝‍🧑'],
  Gestures: ['👍', '👎', '👏', '🙌', '🙏', '💪', '✌️', '🤝', '👋', '🤞', '👌', '🤟', '🫶', '👊', '🤙', '💅', '🫡', '🤲', '🖐️', '✋', '👆', '👇', '👈', '👉', '✊', '🖖', '🤌', '🫰'],
  Money: ['💰', '💵', '💸', '🤑', '🏦', '💳', '📈', '📉', '🪙', '💹', '🧾', '💴', '💶', '💷', '🛍️', '🛒', '🏷️', '📊', '💎', '🎟️', '🏧', '💱', '🪪', '📇'],
  Objects: ['📝', '📌', '📅', '⏰', '🎯', '✅', '❌', '⭐', '🔥', '💡', '📚', '🖊️', '📖', '🗓️', '⏳', '🔔', '🎒', '🧠', '🔑', '📎', '📁', '🗂️', '📋', '🧮', '📐', '✂️', '🔒'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💯', '💗', '💓', '💞', '💖', '💘', '❣️', '💔', '🤎', '💟', '♥️', '💝', '💫', '✨', '🌟'],
  Food: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍜', '☕', '🍩', '🍰', '🍿', '🥗', '🍎', '🍫', '🧋', '🍦', '🍧', '🍨', '🎂', '🍪', '🥤', '🍱', '🍗', '🥪', '🍇', '🍉', '🍓', '🥑', '🍳', '🍛', '🍭', '🍬', '🧁', '🍉', '🥭', '🍒'],
  Animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐝', '🦋', '🐢', '🐬', '🐳'],
};

/**
 * Returns today's date as 'YYYY-MM-DD' using the LOCAL timezone (not UTC),
 * so "today" matches what the user actually sees, not what UTC thinks.
 */
const getTodayLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a 'YYYY-MM-DD' string into a short label, e.g. "24 Aug".
 * Parsed manually (not `new Date(str)`) to avoid timezone shifting the
 * date backward/forward by a day.
 */
const formatPinnedDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/**
 * EmojiPicker
 * Uses position: fixed with coordinates computed from the trigger button's
 * actual on-screen position. This means it renders relative to the VIEWPORT,
 * not the widget panel — so it can never be clipped by the panel's
 * overflow:hidden (used for the panel's rounded corners), and always
 * shows its full height (tabs + full emoji grid).
 */
const EmojiPicker = ({ anchorRect, onSelect, onClose }) => {
  const [activeGroup, setActiveGroup] = useState('Smileys');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!anchorRect) return null;

  const PICKER_HEIGHT = 340;
  const PICKER_WIDTH = 270;

  const spaceAbove = anchorRect.top;
  const openUpward = spaceAbove > PICKER_HEIGHT + 10;

  const top = openUpward
    ? anchorRect.top - PICKER_HEIGHT - 8
    : anchorRect.bottom + 8;

  const panelRightEdge = document.querySelector('[data-inkwell-panel]')?.getBoundingClientRect()?.right;
  const spaceOnRight = panelRightEdge
    ? window.innerWidth - panelRightEdge
    : window.innerWidth - anchorRect.right;

  const left = spaceOnRight > PICKER_WIDTH + 16
    ? (panelRightEdge || anchorRect.right) + 8
    : Math.min(anchorRect.left, window.innerWidth - PICKER_WIDTH - 12);

  return (
    <div
      ref={pickerRef}
      className="card"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${PICKER_WIDTH}px`,
        height: `${PICKER_HEIGHT}px`,
        padding: '10px',
        zIndex: 2000,
        boxShadow: 'var(--shadow-lg)',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '8px',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          paddingBottom: '4px',
          flexShrink: 0,
        }}
      >
        {Object.keys(EMOJI_GROUPS).map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setActiveGroup(group)}
            style={{
              flexShrink: 0,
              fontSize: '11px',
              fontWeight: 600,
              padding: '5px 9px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              backgroundColor: activeGroup === group ? '#2f5fa8' : '#e3edfb',
              color: activeGroup === group ? '#fff' : '#1b2a4a',
            }}
          >
            {group}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '2px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {EMOJI_GROUPS[activeGroup].map((emoji, i) => (
          <button
            key={`${activeGroup}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            style={{
              fontSize: '20px',
              padding: '6px',
              borderRadius: '6px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e3edfb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * RuledTextarea
 * A textarea with reliable ruled-paper lines. Instead of relying on the
 * textarea's own CSS background (unreliable across browsers, especially
 * combined with resize:vertical), lines are drawn on a separate absolutely
 * positioned div sitting BEHIND the textarea, with the textarea's own
 * background made transparent so the lines show through.
 */
const RuledTextarea = ({ value, onChange, placeholder, textareaRef, theme }) => {
  const LINE_HEIGHT = 26;

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: theme.bgLight,
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${LINE_HEIGHT - 1}px,
            ${theme.line} ${LINE_HEIGHT - 1}px,
            ${theme.line} ${LINE_HEIGHT}px
          )`,
          backgroundPosition: `0 ${10 + LINE_HEIGHT - 4}px`,
          pointerEvents: 'none',
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={5}
        style={{
          position: 'relative',
          width: '100%',
          resize: 'vertical',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${theme.border}`,
          backgroundColor: 'transparent',
          color: theme.text,
          fontSize: '14px',
          fontFamily: 'inherit',
          lineHeight: `${LINE_HEIGHT}px`,
          outline: 'none',
        }}
      />
    </div>
  );
};

/**
 * NotesWidget ("Inkwell")
 * A small blue, lined-notebook-style notepad panel that slides out from the sidebar.
 * Hybrid: a note can optionally be pinned to ANY date (not just today) via
 * a date picker, or left freeform like a normal scratchpad — same list
 * either way, dated ones just show a date badge.
 */
const NotesWidget = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [content, setContent] = useState('');
  const [pinnedDate, setPinnedDate] = useState(null); // null = freeform, else 'YYYY-MM-DD'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [emojiAnchorRect, setEmojiAnchorRect] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNote = () => {
    setActiveId(null);
    setContent('');
    setPinnedDate(null);
    setEmojiAnchorRect(null);
    setErrorMsg('');
  };

  const handleSelectNote = (note) => {
    setActiveId(note._id);
    setContent(note.content);
    setPinnedDate(note.date || null);
    setEmojiAnchorRect(null);
    setErrorMsg('');
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const togglePin = () => {
    setPinnedDate((prev) => (prev ? null : getTodayLocal()));
  };

  const handleDateChange = (e) => {
    setPinnedDate(e.target.value || null);
  };

  const toggleEmojiPicker = () => {
    if (emojiAnchorRect) {
      setEmojiAnchorRect(null);
    } else if (emojiButtonRef.current) {
      setEmojiAnchorRect(emojiButtonRef.current.getBoundingClientRect());
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + emoji.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      setSaving(true);
      setErrorMsg('');
      if (activeId) {
        const data = await updateNote(activeId, content, pinnedDate);
        setNotes((prev) => prev.map((n) => (n._id === activeId ? data.note : n)));
      } else {
        const data = await createNote(content, pinnedDate);
        setNotes((prev) => [data.note, ...prev]);
        setActiveId(data.note._id);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Failed to save note. Please try again.';
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteNote(deleteTarget._id);
      setNotes((prev) => prev.filter((n) => n._id !== deleteTarget._id));
      if (activeId === deleteTarget._id) {
        handleNewNote();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  // Soft blue theme, matching the navy/gold Kharchup brand instead of the
  // old pink notepad look. Panel background is a pale blue tint, with a
  // deeper blue used for accents/buttons.
  const theme = {
    bg: '#e3edfb',
    bgLight: '#f3f8fe',
    line: 'rgba(27, 42, 74, 0.15)',
    border: '#c3d9f5',
    accent: '#2f5fa8',
    accentSoft: '#dde9fb',
    text: '#1b2a4a',
    textMuted: '#5c7196',
  };

  const filteredNotes = searchQuery.trim()
    ? notes.filter((n) => n.content.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : notes;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 17, 23, 0.35)',
        }}
      />

      <div
         data-inkwell-panel
         style={{
          position: 'fixed',
          left: 'var(--sidebar-width, 260px)',
          bottom: '20px',
          top: '80px',
          width: '320px',
          maxWidth: 'calc(100vw - var(--sidebar-width, 260px) - 20px)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(27, 42, 74, 0.25)',
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.bg,
          animation: 'notesSlideIn 0.18s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex-between"
          style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${theme.border}`,
            backgroundColor: theme.bg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFileText size={18} color={theme.accent} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.text }}>Inkwell</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleNewNote}
              title="New note"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: '50%', color: theme.accent,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.accentSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FiPlus size={18} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: '50%', color: theme.textMuted,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.accentSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
          {activeId && (
            <p style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Editing note
            </p>
          )}

          <RuledTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note... 📝"
            textareaRef={textareaRef}
            theme={theme}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={togglePin}
              title={pinnedDate ? 'Unpin from this day' : 'Attach this note to a date'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                border: `1px solid ${theme.border}`,
                backgroundColor: pinnedDate ? theme.accent : theme.bgLight,
                color: pinnedDate ? '#fff' : theme.textMuted,
              }}
            >
              <FiCalendar size={12} />
              {pinnedDate ? `Pinned to ${formatPinnedDate(pinnedDate)}` : 'Attach to a date'}
            </button>

            {pinnedDate && (
              <input
                type="date"
                value={pinnedDate}
                onChange={handleDateChange}
                max={getTodayLocal()}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgLight,
                  color: theme.text,
                }}
              />
            )}
          </div>

          {errorMsg && (
            <p style={{ fontSize: '12px', color: '#be123c', marginTop: '8px' }}>
              {errorMsg}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={toggleEmojiPicker}
              title="Insert emoji"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${theme.border}`,
                backgroundColor: emojiAnchorRect ? theme.accentSoft : theme.bgLight,
                color: theme.accent,
                flexShrink: 0,
              }}
            >
              <FiSmile size={18} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: theme.accent,
                opacity: saving || !content.trim() ? 0.6 : 1,
              }}
            >
              <FiSave size={15} />
              {saving ? 'Saving...' : activeId ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </div>

        {/* Old notes list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', backgroundColor: theme.bg }}>
          <div className="flex-between" style={{ padding: '4px 8px 8px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: theme.textMuted,
              }}
            >
              Old Notes
            </p>
          </div>

          {notes.length > 0 && (
            <div style={{ position: 'relative', margin: '0 4px 10px' }}>
              <FiSearch
                size={13}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '7px 10px 7px 30px',
                  borderRadius: '999px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgLight,
                  color: theme.text,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spinner />
            </div>
          ) : notes.length === 0 ? (
            <p style={{ fontSize: '13px', color: theme.textMuted, padding: '0 8px' }}>
              No notes yet. Write your first one above. 💭
            </p>
          ) : filteredNotes.length === 0 ? (
            <p style={{ fontSize: '13px', color: theme.textMuted, padding: '0 8px' }}>
              No notes match "{searchQuery}"
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredNotes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => handleSelectNote(note)}
                  title="Click to edit this note"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    backgroundColor: activeId === note._id ? theme.accentSoft : theme.bgLight,
                    border: `1px solid ${activeId === note._id ? theme.accent : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (activeId !== note._id) e.currentTarget.style.backgroundColor = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (activeId !== note._id) e.currentTarget.style.backgroundColor = theme.bgLight;
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {note.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <p style={{ fontSize: '11px', color: theme.textMuted }}>
                        {formatTime(note.updatedAt)}
                      </p>
                      {note.date && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '999px',
                            backgroundColor: theme.accent,
                            color: '#fff',
                          }}
                        >
                          <FiCalendar size={9} />
                          {formatPinnedDate(note.date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectNote(note);
                      }}
                      title="Edit note"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        color: theme.textMuted,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.accentSoft;
                        e.currentTarget.style.color = theme.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.textMuted;
                      }}
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(note);
                      }}
                      title="Delete note"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        color: theme.textMuted,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecdd3';
                        e.currentTarget.style.color = '#be123c';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.textMuted;
                      }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {emojiAnchorRect && (
        <EmojiPicker
          anchorRect={emojiAnchorRect}
          onSelect={handleEmojiSelect}
          onClose={() => setEmojiAnchorRect(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        isLoading={deleting}
        title="Delete note?"
        message="This note will be permanently deleted. This action cannot be undone."
      />

      <style>
        {`
          @keyframes notesSlideIn {
            from { opacity: 0; transform: translateX(-8px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
    </>
  );
};

export default NotesWidget;