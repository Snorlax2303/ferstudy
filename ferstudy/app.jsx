// ferstudy/app.jsx — main app shell

const { useState: uS, useMemo, useEffect: uE, useRef: uR } = React;

const VIEWS = [
  { id: 'month', label: 'Mês' },
  { id: 'week',  label: 'Semana' },
  { id: 'day',   label: 'Dia' },
];

function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "blue",
    "density": "comfy",
    "evtStyle": "bar"
  }/*EDITMODE-END*/;

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks → body data attributes
  uE(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  const today = FAKE_TODAY;
  const [cursor, setCursor] = uS(new Date(today.getFullYear(), today.getMonth(), 1)); // month nav
  const [selected, setSelected] = uS(today);
  const [view, setView] = uS('month');
  const [events, setEvents] = uS(SEED_EVENTS);
  const [editing, setEditing] = uS(null); // { event } | { defaultDate } | null
  const [modalOpen, setModalOpen] = uS(false);
  const [hiddenCats, setHiddenCats] = uS([]);
  const [search, setSearch] = uS('');
  const [navView, setNavView] = uS('calendar');
  const [showMonths, setShowMonths] = uS(false);
  const [agendaCollapsed, setAgendaCollapsed] = uS(false);
  const [categories, setCategories] = uS(() => {
    try {
      const saved = localStorage.getItem('ferstudy.categories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return Object.values(CATEGORIES).map(c => ({ id: c.id, label: c.label, color: c.color }));
  });
  uE(() => { try { localStorage.setItem('ferstudy.categories', JSON.stringify(categories)); } catch(_){} }, [categories]);

  // Build a categories map from current state, merging soft variants on the fly
  const catMap = useMemo(() => {
    const m = {};
    for (const c of categories) {
      // derive soft from color (oklch -> add /alpha) — fallback if not oklch
      const soft = c.color.startsWith('oklch(')
        ? c.color.replace(/\)\s*$/, ' / 0.18)')
        : c.color + '33';
      m[c.id] = { ...c, soft };
    }
    return m;
  }, [categories]);

  // Make catMap available to other components that read window.CATEGORIES
  uE(() => { window.CATEGORIES = catMap; }, [catMap]);

  // Index events by date
  const eventsByDay = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const map = {};
    for (const ev of events) {
      if (lower) {
        const hay = (ev.title + ' ' + ev.subject + ' ' + (ev.location || '')).toLowerCase();
        if (!hay.includes(lower)) continue;
      }
      (map[ev.date] = map[ev.date] || []).push(ev);
    }
    return map;
  }, [events, search]);

  const grid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const navMonth = (delta) => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };
  const navTimeline = (delta) => {
    if (view === 'week') setSelected(addDays(selected, delta * 7));
    else if (view === 'day') setSelected(addDays(selected, delta));
  };

  const openCreate = (date) => {
    setEditing({ defaultDate: date ? ymd(date) : ymd(selected) });
    setModalOpen(true);
  };
  const openEdit = (ev) => { setEditing({ event: ev }); setModalOpen(true); };

  const saveEvent = (data) => {
    if (data.id != null) {
      setEvents(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
    } else {
      const id = Math.max(...events.map(e => e.id)) + 1;
      setEvents(prev => [...prev, { ...data, id }]);
    }
    setModalOpen(false);
  };
  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setModalOpen(false);
  };
  const moveEvent = (id, newDateKey) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, date: newDateKey } : e));
  };

  const toggleCat = (id) => {
    setHiddenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  // Days for week/day views
  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(selected);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    if (view === 'day') return [selected];
    return [];
  }, [view, selected]);

  // Week navigation cursors should sync month label too
  uE(() => {
    if (view !== 'month') {
      setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selected, view]);

  // Greeting
  const greet = (() => {
    const h = today.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  // Find next prova for the deadline pill
  const nextProva = useMemo(() => {
    const now = today.getTime();
    const upcoming = events
      .filter(e => e.category === 'prova' && fromYMD(e.date).getTime() >= now - 86400000)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0];
  }, [events]);

  return (
    <>
      <div className="app-bg" />
      <div className="app-shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">F</div>
          <div className="nav">
            <button className={navView === 'calendar' ? 'active' : ''} onClick={() => setNavView('calendar')} title="Calendário"><Icon name="calendar" /></button>
            <button className={navView === 'categories' ? 'active' : ''} onClick={() => setNavView('categories')} title="Tipos"><Icon name="tag" /></button>
            <button className={navView === 'settings' ? 'active' : ''} onClick={() => setNavView('settings')} title="Configurações"><Icon name="settings" /></button>
          </div>
          <div className="footer">
          </div>
        </aside>

        {/* CANVAS */}
        <main className="canvas">
          {/* Topbar */}
          <header className="topbar">
            <div className="greeting">
              <h1>{greet}, Fernanda<span className="wave">.</span></h1>
              <p>Você tem <strong style={{ color:'var(--text-1)' }}>{(eventsByDay[ymd(today)] || []).length} eventos</strong> hoje · próxima prova em {nextProva ? Math.max(0, Math.ceil((fromYMD(nextProva.date) - today)/86400000)) : '—'} dias</p>
            </div>
            <div className="topbar-right">
              <label className="search">
                <Icon name="search" size={15} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evento, matéria..." />
              </label>
              <button className="icon-btn" title="Notificações">
                <Icon name="bell" size={17} />
                <span className="dot" />
              </button>
            </div>
          </header>

          {/* WORKSPACE */}
          {navView === 'calendar' ? (
          <div className={'workspace' + (agendaCollapsed ? ' agenda-collapsed' : '')}>
            <section className="cal-panel">
              <div className="cal-header">
                <div className="cal-title">
                  <button className="month-select" onClick={() => setShowMonths(s => !s)}>
                    {MONTHS_PT[cursor.getMonth()]}
                    <Icon name="chev-d" size={14} className="chev" />
                  </button>
                  <span className="year-select">{cursor.getFullYear()}</span>
                  {showMonths && (
                    <div className="dropdown" style={{ top: 50, left: 0 }} onMouseLeave={() => setShowMonths(false)}>
                      {MONTHS_PT.map((m, i) => (
                        <button key={m} className={i === cursor.getMonth() ? 'active' : ''} onClick={() => { setCursor(new Date(cursor.getFullYear(), i, 1)); setShowMonths(false); }}>{m.slice(0,3)}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cal-controls">
                  <div className="view-tabs">
                    {VIEWS.map(v => (
                      <button key={v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>{v.label}</button>
                    ))}
                  </div>
                  <button className="today-btn" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }}>Hoje</button>
                  <button className="nav-btn" onClick={() => view === 'month' ? navMonth(-1) : navTimeline(-1)}><Icon name="chev-l" size={15} /></button>
                  <button className="nav-btn" onClick={() => view === 'month' ? navMonth(1) : navTimeline(1)}><Icon name="chev-r" size={15} /></button>
                </div>
              </div>

              {/* filters */}
              <div className="filters">
                <span style={{ display:'inline-flex', alignItems:'center', gap: 6, color:'var(--text-3)', fontSize:11, fontWeight:600, marginRight:4 }}>
                  <Icon name="filter" size={13} /> FILTRAR
                </span>
                {categories.map(c => {
                  const active = !hiddenCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      className={'filter-chip' + (active ? ' active' : ' muted')}
                      onClick={() => toggleCat(c.id)}
                    >
                      <span className="swatch" style={{ background: c.color }} />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* main view */}
              {view === 'month' && (
                <MonthView
                  grid={grid}
                  eventsByDay={eventsByDay}
                  today={today}
                  selected={selected}
                  onSelectDay={setSelected}
                  onOpenEvent={openEdit}
                  onMoveEvent={moveEvent}
                  evtStyle={tweaks.evtStyle}
                  hiddenCats={hiddenCats}
                />
              )}
              {(view === 'week' || view === 'day') && (
                <TimelineView
                  days={days}
                  eventsByDay={eventsByDay}
                  today={today}
                  onOpenEvent={openEdit}
                  hiddenCats={hiddenCats}
                  onSelectDay={(d) => { setSelected(d); if (view === 'week') setView('day'); }}
                />
              )}

              <button className="fab" onClick={() => openCreate(selected)} title="Novo evento">
                <Icon name="plus" size={22} />
              </button>
            </section>

            {agendaCollapsed ? (
              <div className="agenda collapsed" onClick={() => setAgendaCollapsed(false)}>
                <button className="agenda-collapse-btn" title="Expandir agenda" onClick={(e) => { e.stopPropagation(); setAgendaCollapsed(false); }}>
                  <Icon name="chev-l" size={14} />
                </button>
                <span className="vertical-label">Agendado</span>
                <span className="pill-count">{(eventsByDay[ymd(selected)] || []).length}</span>
              </div>
            ) : (
              <AgendaPanel
                selected={selected}
                eventsByDay={eventsByDay}
                onSelectDay={setSelected}
                onOpenEvent={openEdit}
                hiddenCats={hiddenCats}
                onCollapse={() => setAgendaCollapsed(true)}
              />
            )}
          </div>
          ) : (
            <div style={{ display: 'block', width: '100%' }}>
              {navView === 'settings' && <SettingsScreen tweaks={tweaks} setTweak={setTweak} />}
              {navView === 'categories' && <CategoriesScreen categories={categories} setCategories={setCategories} events={events} />}
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <EventModal
          event={editing?.event}
          defaultDate={editing?.defaultDate}
          onClose={() => setModalOpen(false)}
          onSave={saveEvent}
          onDelete={deleteEvent}
        />
      )}

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Tweaks · Ferstudy">
        <TweakSection title="Tema de cor">
          <TweakRadio
            value={tweaks.theme}
            onChange={(v) => setTweak('theme', v)}
            options={[
              { value: 'blue', label: 'Azul' },
              { value: 'violet', label: 'Violeta' },
              { value: 'emerald', label: 'Verde' },
              { value: 'rose', label: 'Rose' },
              { value: 'amber', label: 'Âmbar' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Densidade">
          <TweakRadio
            value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { value: 'compact', label: 'Compacto' },
              { value: 'comfy', label: 'Confortável' },
              { value: 'cozy', label: 'Espaçoso' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Estilo do card de evento">
          <TweakRadio
            value={tweaks.evtStyle}
            onChange={(v) => setTweak('evtStyle', v)}
            options={[
              { value: 'bar', label: 'Barra' },
              { value: 'soft', label: 'Suave' },
              { value: 'pill', label: 'Sólido' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
