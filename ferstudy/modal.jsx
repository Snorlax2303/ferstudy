// ferstudy/modal.jsx — Event create/edit modal + Notes system com sync

const { useState, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════════
// NOTAS HELPERS
// ═══════════════════════════════════════════════════════════════════
function createNote(content = '', tags = []) {
  return {
    id: Date.now() + Math.random(),
    content,
    tags,
    color: ['yellow', 'pink', 'blue', 'green', 'purple'][Math.floor(Math.random() * 5)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
  };
}

const SUGGESTED_TAGS = ['Importante', 'Revisar', 'Dúvida', 'Resumo', 'Exemplo', 'Dever'];
const NOTE_COLORS = [
  { id: 'yellow', label: 'Amarelo', bg: '#FEF3C7', border: '#FBBF24' },
  { id: 'pink', label: 'Rosa', bg: '#FCE7F3', border: '#F472B6' },
  { id: 'blue', label: 'Azul', bg: '#DBEAFE', border: '#60A5FA' },
  { id: 'green', label: 'Verde', bg: '#DCFCE7', border: '#4ADE80' },
  { id: 'purple', label: 'Roxo', bg: '#EDE9FE', border: '#C084FC' },
];

// Lê notas do localStorage (que é mantido em sync pelo app.jsx via Firestore)
function loadNotesForDate(dateKey) {
  try {
    const saved = localStorage.getItem(`notes_${dateKey}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function EventModal({ event, defaultDate, onClose, onSave, onDelete }) {
  const isNew = !event?.id;
  const [title, setTitle] = useState(event?.title || '');
  const [subject, setSubject] = useState(event?.subject || SUBJECTS[0]);
  const [date, setDate] = useState(event?.date || defaultDate || ymd(FAKE_TODAY));
  const [category, setCategory] = useState(event?.category || 'aula');
  const [start, setStart] = useState(event?.start || '14:00');
  const [end, setEnd] = useState(event?.end || '15:30');
  const [location, setLocation] = useState(event?.location || '');
  const [note, setNote] = useState(event?.note || '');
  const [completed, setCompleted] = useState(event?.completed || false);

  // Notas do dia atual (carrega do localStorage, que é sincronizado pelo app.jsx)
  const [notes, setNotes] = useState(() => loadNotesForDate(date));
  const [showNotes, setShowNotes] = useState(false);

  // Flag para distinguir mudança vinda do usuário vs vinda da nuvem
  const isLocalChange = useRef(false);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Recarrega notas ao trocar a data do evento
  useEffect(() => {
    setNotes(loadNotesForDate(date));
  }, [date]);

  // 🔄 Escuta atualizações vindas da nuvem (outros devices)
  useEffect(() => {
    const handleNotesUpdate = () => {
      // Não recarrega se a mudança veio do próprio modal
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }
      console.log("🔄 [MODAL] Recebendo update de notas da nuvem");
      setNotes(loadNotesForDate(date));
    };
    window.addEventListener('notes-updated', handleNotesUpdate);
    return () => window.removeEventListener('notes-updated', handleNotesUpdate);
  }, [date]);

  // 💾 Salva notas: localStorage + Firestore (via window.notesSync)
  useEffect(() => {
    try {
      isLocalChange.current = true;

      if (notes.length > 0) {
        localStorage.setItem(`notes_${date}`, JSON.stringify(notes));
      } else {
        localStorage.removeItem(`notes_${date}`);
      }

      // Sincroniza com Firestore se usuário estiver logado
      if (window.notesSync && window.notesSync.saveNote) {
        window.notesSync.saveNote(date, notes);
      }
    } catch (_) {}
  }, [notes, date]);

  const setHour = (which, delta) => {
    const cur = which === 'start' ? start : end;
    const [h, m] = cur.split(':').map(Number);
    let nh = h + delta;
    if (nh < 0) nh = 23; if (nh > 23) nh = 0;
    const v = `${pad(nh)}:${pad(m)}`;
    which === 'start' ? setStart(v) : setEnd(v);
  };

  const addNote = () => setNotes([createNote(''), ...notes]);
  const updateNote = (id, updates) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));
  const togglePin = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) updateNote(id, { pinned: !note.pinned });
  };

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      id: event?.id,
      title: title.trim(),
      subject,
      date, category, start, end,
      location: location.trim() || null,
      note: note.trim() || null,
      members: event?.members || null,
      completed,
    });
  };

  const TimeStepper = ({ which, value }) => {
    const [h, m] = value.split(':');
    return (
      <div className="time-stepper">
        <button onClick={() => setHour(which, -1)}><Icon name="chev-l" size={12} /></button>
        <input value={h + ':' + m} readOnly />
        <button onClick={() => setHour(which, 1)}><Icon name="chev-r" size={12} /></button>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isNew ? 'Novo evento' : 'Editar evento'}</h2>
        <button className="close" onClick={onClose}><Icon name="close" size={16} /></button>

        <div style={{ marginTop: 14 }}>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do evento"
            style={{
              width: '100%', background: 'transparent', border: 0, outline: 0,
              fontSize: 22, fontWeight: 700, color: 'var(--text-1)',
              padding: '6px 0 14px',
              borderBottom: '1px solid var(--hairline)',
              letterSpacing: '-0.4px',
            }}
          />
        </div>

        <div className="field">
          <label>Matéria</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{
              background: 'var(--surface-hi)', border: '1px solid var(--hairline)',
              borderRadius: 10, padding: '7px 12px', fontSize: 13, color: 'var(--text-1)',
              outline: 0, width: 'auto', cursor: 'pointer',
            }}
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Tipo</label>
          <div className="cat-select">
            {Object.values(CATEGORIES).map(c => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  className={'cat-pill' + (active ? ' active' : '')}
                  style={active ? {
                    '--cp-color': c.soft,
                    '--cp-border': c.color,
                    '--cp-text': 'var(--text-1)',
                  } : {}}
                  onClick={() => setCategory(c.id)}
                >
                  <span className="swatch" style={{ background: c.color }} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Horário</label>
          <div className="time-picker">
            <TimeStepper which="start" value={start} />
            <span className="time-sep">→</span>
            <TimeStepper which="end" value={end} />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
              {fmtDuration(Math.max(durationMin(start, end), 0))}
            </span>
          </div>
        </div>

        <div className="field">
          <label>Local</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Sala, link ou local" />
        </div>

        <div className="field">
          <label>Observação rápida</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar observação" />
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ margin: 0 }}>✓ Concluído</label>
          <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
        </div>

        {/* Notas */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <label style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
              📝 Anotações ({notes.length})
            </label>
            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                background: showNotes ? 'var(--text-3)' : 'var(--primary)',
                color: 'white', border: 'none',
                borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {showNotes ? '✕ Fechar' : '+ Adicionar'}
            </button>
          </div>

          {showNotes ? (
            <NotesPanel
              notes={notes}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
            />
          ) : notes.length > 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
              ✓ {notes.length} anotação{notes.length !== 1 ? 'ões' : ''} salva{notes.length !== 1 ? 's' : ''}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          {!isNew ? (
            <button className="btn btn-danger" onClick={() => onDelete(event.id)}>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
                <Icon name="trash" size={14} /> Excluir
              </span>
            </button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit}>{isNew ? 'Criar' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOTES PANEL
// ═══════════════════════════════════════════════════════════════════
function NotesPanel({ notes, onAddNote, onUpdateNote, onDeleteNote, onTogglePin }) {
  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);
  const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

  return (
    <div style={{
      background: 'var(--surface-hi)', borderRadius: 8, padding: 0,
      marginBottom: 12, maxHeight: '400px',
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--hairline)', overflow: 'hidden',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px',
        display: 'flex', gap: '8px', flexDirection: 'column', scrollbarWidth: 'thin',
      }}>
        {sortedNotes.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
            Nenhuma anotação ainda. Clique em "+ Criar primeira nota" para começar!
          </div>
        ) : (
          sortedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(updates) => onUpdateNote(note.id, updates)}
              onDelete={() => onDeleteNote(note.id)}
              onTogglePin={() => onTogglePin(note.id)}
            />
          ))
        )}
      </div>

      <button
        onClick={onAddNote}
        style={{
          width: '100%', padding: '10px',
          background: 'var(--primary)', color: 'white',
          border: 'none', borderTop: '1px solid var(--hairline)',
          borderRadius: 0, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        + {sortedNotes.length === 0 ? 'Criar primeira nota' : 'Nova anotação'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOTE CARD
// ═══════════════════════════════════════════════════════════════════
function NoteCard({ note, onUpdate, onDelete, onTogglePin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const colorData = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];

  const handleSave = () => {
    onUpdate({ content: editContent });
    setIsEditing(false);
  };

  const timeAgo = (() => {
    const diff = new Date() - new Date(note.updatedAt);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return 'ontem';
  })();

  return (
    <div
      style={{
        background: colorData.bg,
        borderLeft: `4px solid ${colorData.border}`,
        borderRadius: 6, padding: '10px',
        cursor: 'pointer', transition: 'all 0.2s', fontSize: 12,
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
              style={{ background:'none', border:'none', fontSize:13, cursor:'pointer', padding: 0 }}
              title={note.pinned ? 'Desafixar' : 'Afixar'}
            >
              {note.pinned ? '📌' : '📍'}
            </button>
            <span style={{ fontSize: 10, color: 'var(--text-3)', opacity: 0.7 }}>{timeAgo}</span>
          </div>

          {!isEditing ? (
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                color: 'var(--text-1)', lineHeight: '1.4',
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                cursor: 'pointer',
              }}
            >
              {note.content || '(nota vazia)'}
            </div>
          ) : (
            <textarea
              autoFocus value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', padding: 8,
                border: '1px solid var(--primary)', borderRadius: 4,
                fontSize: 11, fontFamily: 'inherit',
                minHeight: 60, resize: 'vertical', background: 'white', color: '#333',
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                title="Salvar"
                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 4, padding: '5px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >✓</button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditContent(note.content); }}
                title="Cancelar"
                style={{ background: 'var(--hairline)', color: 'var(--text-2)', border: 'none', borderRadius: 4, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}
              >✕</button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                title="Editar"
                style={{ background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', padding: '4px 6px', color: colorData.border, opacity: 0.8 }}
              >✎</button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="Deletar"
                style={{ background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', padding: '4px 6px', color: '#E94B3C', opacity: 0.8 }}
              >✕</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.EventModal = EventModal;
window.NotesPanel = NotesPanel;
window.NoteCard = NoteCard;
