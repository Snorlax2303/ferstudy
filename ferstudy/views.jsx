// ferstudy/views.jsx — Month/Week/Day calendar views & Agenda panel

function MonthView({ grid, eventsByDay, today, selected, onSelectDay, onOpenEvent, onMoveEvent, evtStyle, hiddenCats }) {
  const [dragOver, setDragOver] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const onDayDrop = (key) => {
    if (draggingId == null) return;
    onMoveEvent(draggingId, key);
    setDraggingId(null);
    setDragOver(null);
  };

  const visible = (e) => !hiddenCats.includes(e.category);

  return (
    <>
      <div className="weekdays">
        {WEEKDAYS_PT.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="cal-grid">
        {grid.map(cell => {
          const events = (eventsByDay[cell.key] || []).filter(visible);
          const isToday = isSameDay(cell.date, today);
          const isSelected = isSameDay(cell.date, selected);
          const max = 3;
          const overflow = events.length - max;
          return (
            <div
              key={cell.key}
              className={
                'day' +
                (cell.otherMonth ? ' other-month' : '') +
                (isToday ? ' today' : '') +
                (!isToday && isSelected ? ' selected' : '') +
                (dragOver === cell.key ? ' drag-over' : '')
              }
              onClick={() => onSelectDay(cell.date)}
              onDragOver={(e) => { e.preventDefault(); setDragOver(cell.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => onDayDrop(cell.key)}
            >
              <span className="day-num">{cell.date.getDate()}</span>
              <div className="day-events">
                {events.slice(0, max).map(ev => {
                  const cat = CATEGORIES[ev.category] || { color: "oklch(0.6 0 0)", soft: "oklch(0.6 0 0 / 0.15)", label: "—" };
                  return (
                    <div
                      key={ev.id}
                      className={'evt style-' + evtStyle + (draggingId === ev.id ? ' dragging' : '')}
                      style={{
                        '--evt-color': cat.color,
                        '--evt-bg': cat.soft,
                      }}
                      draggable
                      onDragStart={() => setDraggingId(ev.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                      onClick={(e) => { e.stopPropagation(); onOpenEvent(ev); }}
                      title={`${ev.start}–${ev.end} ${ev.title}`}
                    >
                      <span className="title">{ev.title}</span>
                      {evtStyle !== 'pill' && <span className="time">{ev.start}</span>}
                    </div>
                  );
                })}
                {overflow > 0 && <div className="more-evts">+{overflow} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function TimelineView({ days, eventsByDay, today, onOpenEvent, hiddenCats, onSelectDay }) {
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07–20
  const HOUR_PX = 56;
  const visible = (e) => !hiddenCats.includes(e.category);

  const evtRect = (ev) => {
    const [sh, sm] = ev.start.split(':').map(Number);
    const [eh, em] = ev.end.split(':').map(Number);
    const startMin = (sh - 7) * 60 + sm;
    const endMin = (eh - 7) * 60 + em;
    const top = (startMin / 60) * HOUR_PX;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 28);
    return { top, height };
  };

  // current time indicator (on today)
  const nowTop = (() => {
    const h = today.getHours(); // for fake today this returns wall clock - harmless
    const m = today.getMinutes();
    return ((h - 7) * 60 + m) / 60 * HOUR_PX;
  })();

  return (
    <div className={'timeline ' + (days.length === 7 ? 'week' : 'day')}>
      <div className="tl-hourcol">
        {HOURS.map(h => <div key={h} className="hr">{pad(h)}:00</div>)}
      </div>
      {days.map((d, idx) => {
        const isToday = isSameDay(d, FAKE_TODAY);
        const evts = (eventsByDay[ymd(d)] || []).filter(visible);
        return (
          <div key={idx} className="tl-day-col" onClick={() => onSelectDay(d)}>
            <div className={'col-head' + (isToday ? ' today' : '')}>
              {WEEKDAYS_PT[d.getDay()]}<span className="num">{d.getDate()}</span>
            </div>
            <div style={{ position: 'relative', height: HOURS.length * HOUR_PX }}>
              <div className="tl-grid-bg" style={{ position:'absolute', inset:0 }} />
              {isToday && nowTop > 0 && nowTop < HOURS.length * HOUR_PX &&
                <div className="now-line" style={{ top: nowTop }} />
              }
              {evts.map(ev => {
                const r = evtRect(ev);
                const cat = CATEGORIES[ev.category] || { color: "oklch(0.6 0 0)", soft: "oklch(0.6 0 0 / 0.15)", label: "—" };
                return (
                  <div key={ev.id}
                    className="tl-evt"
                    style={{
                      top: r.top, height: r.height,
                      '--evt-color': cat.color,
                      '--evt-bg': cat.soft,
                      background: cat.soft,
                    }}
                    onClick={(e) => { e.stopPropagation(); onOpenEvent(ev); }}
                  >
                    <div className="tl-time">{ev.start}–{ev.end}</div>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                    {r.height > 50 && ev.location && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{ev.location}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ Right-side agenda panel ============
function AgendaPanel({ selected, eventsByDay, onSelectDay, onOpenEvent, hiddenCats, onCollapse }) {
  const key = ymd(selected);
  const events = (eventsByDay[key] || [])
    .filter(e => !hiddenCats.includes(e.category))
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));

  const isToday = isSameDay(selected, FAKE_TODAY);

  // group by start hour for the slot label
  const grouped = events.map(e => ({ ...e, slot: e.start }));

  return (
    <div className="agenda">
      <div className="agenda-header">
        <div>
          <h3>Agendado</h3>
        </div>
        <div className="agenda-controls">
          <button className="nav-btn" onClick={() => onSelectDay(addDays(selected, -1))} title="Anterior">
            <Icon name="chev-l" size={14} />
          </button>
          <button className="nav-btn" onClick={() => onSelectDay(FAKE_TODAY)} title="Hoje">
            <Icon name="today" size={14} />
          </button>
          <button className="nav-btn" onClick={() => onSelectDay(addDays(selected, 1))} title="Próximo">
            <Icon name="chev-r" size={14} />
          </button>
          {onCollapse && (
            <button className="nav-btn" onClick={onCollapse} title="Minimizar painel" style={{ marginLeft: 4 }}>
              <Icon name="chev-r" size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="agenda-date">
        {isToday ? 'Hoje · ' : ''}
        {selected.getDate()} de {MONTHS_PT[selected.getMonth()]}, {selected.getFullYear()}
      </div>

      <div className="agenda-list">
        {grouped.length === 0 && (
          <div className="agenda-empty">
            <div className="icon"><Icon name="calendar" size={20} /></div>
            Sem eventos para este dia.<br />
            Clique em <strong>+</strong> para criar.
          </div>
        )}
        {grouped.map(ev => {
          const cat = CATEGORIES[ev.category] || { color: "oklch(0.6 0 0)", soft: "oklch(0.6 0 0 / 0.15)", label: "—" };
          const dur = fmtDuration(durationMin(ev.start, ev.end));
          return (
            <div key={ev.id} className="agenda-slot">
              <div className="slot-time">{ev.start}</div>
              <div
                className="agenda-card"
                style={{ '--evt-color': cat.color }}
                onClick={() => onOpenEvent(ev)}
              >
                <div className="row1">
                  <span className="tag-chip">
                    <span className="swatch" style={{ background: cat.color }} />
                    {cat.label}
                  </span>
                </div>
                <h4>{ev.title}</h4>
                <div className="subtitle">{ev.subject}{ev.location ? ' · ' + ev.location : ''}</div>
                <div className="meta">
                  <Icon name="clock" size={12} />
                  <span>{ev.start} — {ev.end}</span>
                  <span className="duration">{dur}</span>
                </div>
                {(ev.members || ev.note) && (
                  <div className="footer">
                    {ev.members ? (
                      <>
                        <div className="avatars">
                          {ev.members.slice(0, 4).map((a, i) => (
                            <div key={i} className="av" style={{ background: a.color }}>{a.initials}</div>
                          ))}
                        </div>
                        <div className="names">
                          {ev.members[0].initials}{ev.members.length > 1 ? ', +' + (ev.members.length - 1) + ' colegas' : ''}
                        </div>
                      </>
                    ) : (
                      <div className="names" style={{ display:'flex', alignItems:'center', gap: 6 }}>
                        <Icon name="note" size={12} /> {ev.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.MonthView = MonthView;
window.TimelineView = TimelineView;
window.AgendaPanel = AgendaPanel;
