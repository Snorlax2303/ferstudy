// ferstudy/app.jsx — app shell completo com Firebase + Autenticação CORRIGIDO

const { useState: uS, useMemo, useEffect: uE, useRef: uR } = React;

const VIEWS = [
  { id: 'month', label: 'Mês' },
  { id: 'week',  label: 'Semana' },
  { id: 'day',   label: 'Dia' },
];

function App() {
  const TWEAK_DEFAULTS = {
    "theme": "blue",
    "density": "comfy",
    "evtStyle": "bar"
  };

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  
  // Estado de autenticação
  const [user, setUser] = uS(null);
  const [loading, setLoading] = uS(true);
  const [email, setEmail] = uS('');
  const [password, setPassword] = uS('');
  const [isSignup, setIsSignup] = uS(false);
  const [authError, setAuthError] = uS('');

  // Escutar mudanças de autenticação
  uE(() => {
    if (!window.auth) {
      setTimeout(() => setLoading(false), 500);
      return;
    }

    const unsubscribe = window.auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Funções de autenticação
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Preencha e-mail e senha');
      return;
    }

    if (password.length < 6) {
      setAuthError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      await window.auth.createUserWithEmailAndPassword(email, password);
      setEmail('');
      setPassword('');
      setIsSignup(false);
    } catch (error) {
      console.error('Erro signup:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está registrado');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('E-mail inválido');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Senha muito fraca. Use 6+ caracteres');
      } else {
        setAuthError('Erro ao registrar: ' + error.message);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Preencha e-mail e senha');
      return;
    }

    try {
      await window.auth.signInWithEmailAndPassword(email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Erro login:', error.code, error.message);
      if (error.code === 'auth/user-not-found') {
        setAuthError('Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Senha incorreta');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('E-mail inválido');
      } else {
        setAuthError('Erro ao fazer login: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await window.auth.signOut();
      setEmail('');
      setPassword('');
      setAuthError('');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Apply tweaks → body data attributes
  uE(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  const today = FAKE_TODAY;
  const [cursor, setCursor] = uS(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = uS(today);
  const [view, setView] = uS('month');
  
  // PERSISTÊNCIA: Carregar eventos do localStorage + Firebase
  const [events, setEvents] = uS(() => {
    try {
      const saved = localStorage.getItem('ferstudy.events');
      return saved ? JSON.parse(saved) : SEED_EVENTS;
    } catch (_) {
      return SEED_EVENTS;
    }
  });

  // Sincronizar eventos com Firestore quando usuário loga
  uE(() => {
    if (!user || !window.db) return;

    // Buscar eventos do Firestore
    const unsubscribe = window.db
      .collection('users')
      .doc(user.uid)
      .collection('events')
      .onSnapshot((snapshot) => {
        const firestoreEvents = [];
        snapshot.forEach((doc) => {
          firestoreEvents.push({ id: doc.id, ...doc.data() });
        });
        
        // Atualizar estado se houver eventos no Firebase
        if (firestoreEvents.length > 0) {
          setEvents(firestoreEvents);
        }
      }, (error) => {
        console.error('Erro ao sincronizar eventos:', error);
      });

    return () => unsubscribe();
  }, [user]);

  // Salvar eventos no localStorage + Firebase
  uE(() => {
    try {
      localStorage.setItem('ferstudy.events', JSON.stringify(events));
      
      // Salvar no Firestore se usuário está logado
      if (user && window.db) {
        events.forEach((event) => {
          window.db
            .collection('users')
            .doc(user.uid)
            .collection('events')
            .doc(String(event.id))
            .set(event)
            .catch((error) => console.error('Erro ao salvar evento:', error));
        });
      }
    } catch (_) {}
  }, [events, user]);

  const [categories, setCategories] = uS(() => {
    try {
      const saved = localStorage.getItem('ferstudy.categories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return Object.values(CATEGORIES).map(c => ({ id: c.id, label: c.label, color: c.color }));
  });
  
  uE(() => { 
    try { 
      localStorage.setItem('ferstudy.categories', JSON.stringify(categories)); 
    } catch(_){}
  }, [categories]);

  const catMap = useMemo(() => {
    const m = {};
    for (const c of categories) {
      const soft = c.color.startsWith('oklch(')
        ? c.color.replace(/\)\s*$/, ' / 0.18)')
        : c.color + '33';
      m[c.id] = { ...c, soft };
    }
    return m;
  }, [categories]);

  uE(() => { window.CATEGORIES = catMap; }, [catMap]);

  const [search, setSearch] = uS('');

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

  const [editing, setEditing] = uS(null);
  const [modalOpen, setModalOpen] = uS(false);
  const [hiddenCats, setHiddenCats] = uS([]);
  const [navView, setNavView] = uS('calendar');
  const [showMonths, setShowMonths] = uS(false);
  const [agendaCollapsed, setAgendaCollapsed] = uS(false);

  const openCreate = (date) => {
    setEditing({ defaultDate: date ? ymd(date) : ymd(selected) });
    setModalOpen(true);
  };
  const openEdit = (ev) => { setEditing({ event: ev }); setModalOpen(true); };

  const saveEvent = (data) => {
    if (data.id != null) {
      setEvents(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
    } else {
      const id = Math.max(...events.map(e => e.id || 0), 0) + 1;
      setEvents(prev => [...prev, { ...data, id }]);
    }
    setModalOpen(false);
  };
  
  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    
    // Deletar do Firestore também
    if (user && window.db) {
      window.db
        .collection('users')
        .doc(user.uid)
        .collection('events')
        .doc(String(id))
        .delete()
        .catch((error) => console.error('Erro ao deletar evento:', error));
    }
    
    setModalOpen(false);
  };
  
  const moveEvent = (id, newDateKey) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, date: newDateKey } : e));
  };

  const toggleCat = (id) => {
    setHiddenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(selected);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    if (view === 'day') return [selected];
    return [];
  }, [view, selected]);

  uE(() => {
    if (view !== 'month') {
      setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selected, view]);

  const greet = (() => {
    const h = today.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const nextProva = useMemo(() => {
    const now = today.getTime();
    const upcoming = events
      .filter(e => e.category === 'prova' && fromYMD(e.date).getTime() >= now - 86400000)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0];
  }, [events]);

  // TELA DE LOGIN
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📚</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Ferstudy</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 32px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: 32, 
              color: '#1e293b', 
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}>
              Ferstudy
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#64748b', 
              fontSize: 14,
              fontWeight: 500
            }}>
              Calendário de estudos na nuvem
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              onClick={() => { setIsSignup(false); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: !isSignup ? '#667eea' : '#f1f5f9',
                color: !isSignup ? 'white' : '#64748b',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (isSignup) e.target.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { if (isSignup) e.target.style.background = '#f1f5f9'; }}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsSignup(true); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: isSignup ? '#667eea' : '#f1f5f9',
                color: isSignup ? 'white' : '#64748b',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!isSignup) e.target.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { if (!isSignup) e.target.style.background = '#f1f5f9'; }}
            >
              Registrar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isSignup ? handleSignup : handleLogin} style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
              }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#1e293b',
                  background: '#ffffff',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
              }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#1e293b',
                  background: '#ffffff',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {authError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 16,
                border: '1px solid #fecaca',
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              {isSignup ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          {/* Info */}
          <div style={{
            padding: '16px',
            background: '#f0f4ff',
            borderRadius: 10,
            fontSize: 12,
            color: '#475569',
            lineHeight: 1.7,
            border: '1px solid #e0e7ff',
          }}>
            <strong style={{ color: '#334155' }}>💡 Dica:</strong><br/>
            Use qualquer e-mail e senha com 6+ caracteres para registrar e começar!
          </div>
        </div>
      </div>
    );
  }

  // APP PRINCIPAL
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
            <button 
              onClick={handleLogout}
              title="Sair" 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              🚪
            </button>
          </div>
        </aside>

        {/* CANVAS */}
        <main className="canvas">
          {/* Topbar */}
          <header className="topbar">
            <div className="greeting">
              <h1>{greet}, {user.email.split('@')[0]}<span className="wave">.</span></h1>
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
