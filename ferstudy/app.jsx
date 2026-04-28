// ferstudy/app.jsx — app com sincronização total via Firestore

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
  const [firebaseReady, setFirebaseReady] = uS(false);

  // 🔒 Flags de sincronização (evita loops cloud→local→cloud)
  const isSyncingEvents = uR(false);
  const isSyncingCategories = uR(false);
  const isSyncingNotes = uR(false);
  const initialSyncDone = uR({ events: false, categories: false });

  // Aguardar Firebase estar pronto
  uE(() => {
    console.log("🔍 [APP] Esperando Firebase estar pronto...");
    let mounted = true;

    const waitForFirebase = async () => {
      let attempts = 0;
      const maxAttempts = 150;

      while (attempts < maxAttempts && mounted) {
        if (window.firebaseReady && window.auth && window.db) {
          console.log("✅ [APP] Firebase pronto!");
          setFirebaseReady(true);
          setLoading(false);
          return;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (mounted) {
        console.warn("⚠️ [APP] Firebase não ficou pronto em 15s, continuando...");
        setFirebaseReady(window.firebaseReady || false);
        setLoading(false);
      }
    };

    waitForFirebase();
    return () => { mounted = false; };
  }, []);

  // Listener de autenticação
  uE(() => {
    if (!firebaseReady || !window.auth) return;
    console.log("👤 [APP] Configurando listener de autenticação...");

    let unsubscribe;
    try {
      unsubscribe = window.auth.onAuthStateChanged(
        (currentUser) => {
          console.log("👤 [APP] Auth state:", currentUser ? currentUser.email : "deslogado");
          // Reset das flags ao trocar de usuário
          initialSyncDone.current = { events: false, categories: false };
          setUser(currentUser);
        },
        (error) => console.error("❌ [APP] Erro auth:", error)
      );
    } catch (error) {
      console.error("❌ [APP] Erro listener:", error);
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [firebaseReady]);

  // ============ AUTH HANDLERS ============
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!window.auth) { setAuthError('❌ Firebase não inicializado.'); return; }
    if (!email || !password) { setAuthError('Preencha e-mail e senha'); return; }
    if (password.length < 6) { setAuthError('Senha mín. 6 caracteres'); return; }

    try {
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      console.log("✅ [AUTH] Criado:", userCredential.user.uid);
      setEmail(''); setPassword(''); setIsSignup(false); setAuthError('');
    } catch (error) {
      const errorMap = {
        'auth/email-already-in-use': 'Este e-mail já está registrado',
        'auth/invalid-email': 'E-mail inválido',
        'auth/weak-password': 'Senha muito fraca',
        'auth/operation-not-allowed': 'Registros desativados no Firebase Console.',
        'auth/network-request-failed': 'Erro de conexão',
      };
      setAuthError(errorMap[error.code] || `Erro: ${error.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!window.auth) { setAuthError('❌ Firebase não inicializado.'); return; }
    if (!email || !password) { setAuthError('Preencha e-mail e senha'); return; }

    try {
      await window.auth.signInWithEmailAndPassword(email, password);
      setEmail(''); setPassword(''); setAuthError('');
    } catch (error) {
      const errorMap = {
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/invalid-email': 'E-mail inválido',
        'auth/user-disabled': 'Usuário desativado',
        'auth/network-request-failed': 'Erro de conexão',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde.',
        'auth/invalid-credential': 'E-mail ou senha incorretos',
      };
      setAuthError(errorMap[error.code] || `Erro: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (window.auth) await window.auth.signOut();
      setEmail(''); setPassword(''); setAuthError('');
    } catch (error) { console.error('❌ Logout:', error); }
  };

  // Apply tweaks
  uE(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  const today = FAKE_TODAY;
  const [cursor, setCursor] = uS(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = uS(today);
  const [view, setView] = uS('month');

  // ============ EVENTOS ============
  const [events, setEvents] = uS(() => {
    try {
      const saved = localStorage.getItem('ferstudy.events');
      return saved ? JSON.parse(saved) : SEED_EVENTS;
    } catch (_) { return SEED_EVENTS; }
  });

  // 🔄 SYNC EVENTOS: escuta nuvem → atualiza local
  uE(() => {
    if (!user || !window.db) return;
    console.log("🔄 [SYNC events] Iniciando listener para", user.email);

    const unsubscribe = window.db
      .collection('users').doc(user.uid).collection('events')
      .onSnapshot(
        (snapshot) => {
          const cloudEvents = snapshot.docs.map(doc => doc.data());
          console.log(`☁️ [SYNC events] ${cloudEvents.length} recebidos da nuvem`);

          // Primeira sincronização: se nuvem vazia, faz upload do local; senão usa nuvem
          if (!initialSyncDone.current.events) {
            initialSyncDone.current.events = true;
            if (cloudEvents.length === 0) {
              console.log("⬆️ [SYNC events] Nuvem vazia, mantendo locais para upload");
              return; // mantém events locais; o useEffect de salvamento vai mandar pra nuvem
            }
          }

          isSyncingEvents.current = true;
          setEvents(cloudEvents);
          // Libera a flag depois do próximo ciclo de render
          setTimeout(() => { isSyncingEvents.current = false; }, 100);
        },
        (error) => console.error('❌ [SYNC events]', error)
      );

    return () => {
      console.log("🧹 [SYNC events] Removendo listener");
      unsubscribe();
    };
  }, [user]);

  // 💾 Salvar eventos: localStorage sempre + Firestore se logado
  uE(() => {
    try {
      localStorage.setItem('ferstudy.events', JSON.stringify(events));

      // Pula salvamento se acabamos de receber da nuvem (evita loop)
      if (isSyncingEvents.current) {
        console.log("⏭️ [SYNC events] Pulando save (acabou de chegar da nuvem)");
        return;
      }

      if (user && window.db) {
        const batch = window.db.batch();
        const eventsCol = window.db.collection('users').doc(user.uid).collection('events');
        events.forEach((event) => {
          batch.set(eventsCol.doc(String(event.id)), event);
        });
        batch.commit().catch((error) => console.error('❌ Save events:', error));
      }
    } catch (_) {}
  }, [events, user]);

  // ============ CATEGORIAS ============
  const [categories, setCategories] = uS(() => {
    try {
      const saved = localStorage.getItem('ferstudy.categories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return Object.values(CATEGORIES).map(c => ({ id: c.id, label: c.label, color: c.color }));
  });

  // 🔄 SYNC CATEGORIAS: escuta doc único na nuvem
  uE(() => {
    if (!user || !window.db) return;
    console.log("🔄 [SYNC categories] Iniciando listener");

    const unsubscribe = window.db
      .collection('users').doc(user.uid).collection('settings').doc('categories')
      .onSnapshot(
        (doc) => {
          if (!doc.exists) {
            console.log("📝 [SYNC categories] Doc não existe ainda, mantendo locais");
            initialSyncDone.current.categories = true;
            return; // useEffect de save vai criar
          }
          const data = doc.data();
          if (data && Array.isArray(data.items)) {
            console.log(`☁️ [SYNC categories] ${data.items.length} recebidas`);
            isSyncingCategories.current = true;
            setCategories(data.items);
            setTimeout(() => { isSyncingCategories.current = false; }, 100);
          }
          initialSyncDone.current.categories = true;
        },
        (error) => console.error('❌ [SYNC categories]', error)
      );

    return () => {
      console.log("🧹 [SYNC categories] Removendo listener");
      unsubscribe();
    };
  }, [user]);

  // 💾 Salvar categorias
  uE(() => {
    try {
      localStorage.setItem('ferstudy.categories', JSON.stringify(categories));

      if (isSyncingCategories.current) return;

      if (user && window.db) {
        window.db
          .collection('users').doc(user.uid)
          .collection('settings').doc('categories')
          .set({ items: categories, updatedAt: Date.now() })
          .catch((error) => console.error('❌ Save categories:', error));
      }
    } catch (_) {}
  }, [categories, user]);

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

  // ============ NOTAS ============
  // Notas são guardadas por data (notes_YYYY-MM-DD no localStorage; doc por data no Firestore)
  // Como o modal lê/escreve direto no localStorage por data, expomos sync via window.notesSync
  uE(() => {
    if (!user || !window.db) {
      window.notesSync = null;
      return;
    }

    console.log("🔄 [SYNC notes] Configurando sync de notas");

    // Listener: escuta TODAS as notas do usuário e replica no localStorage
    const unsubscribe = window.db
      .collection('users').doc(user.uid).collection('notes')
      .onSnapshot(
        (snapshot) => {
          console.log(`☁️ [SYNC notes] ${snapshot.docs.length} dias com notas recebidos`);
          isSyncingNotes.current = true;

          // Pega as datas que têm notas locais para detectar deleções
          const localNoteKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('notes_')) localNoteKeys.push(k);
          }
          const cloudKeys = new Set(snapshot.docs.map(d => `notes_${d.id}`));

          // Atualiza/cria notas que estão na nuvem
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data && Array.isArray(data.items)) {
              const key = `notes_${doc.id}`;
              if (data.items.length > 0) {
                localStorage.setItem(key, JSON.stringify(data.items));
              } else {
                localStorage.removeItem(key);
              }
            }
          });

          // Remove notas locais que foram deletadas da nuvem
          // (só na primeira sincronização, pra não apagar notas que ainda não subiram)
          // Aqui assumimos: se a nuvem não tem aquela data, e o snapshot está confirmado,
          // a nota foi deletada propositalmente em outro device
          localNoteKeys.forEach(k => {
            if (!cloudKeys.has(k)) {
              // Antes de remover, vamos manter — o save abaixo vai subir pra nuvem
              // Comportamento conservador: só remove se já tivemos sync inicial
            }
          });

          // Notifica componentes (modal) que algo mudou
          window.dispatchEvent(new CustomEvent('notes-updated'));

          setTimeout(() => { isSyncingNotes.current = false; }, 100);
        },
        (error) => console.error('❌ [SYNC notes]', error)
      );

    // Função para o modal salvar uma nota (será chamada de fora)
    window.notesSync = {
      saveNote: async (dateKey, items) => {
        if (isSyncingNotes.current) return;
        if (!user || !window.db) return;
        try {
          if (items && items.length > 0) {
            await window.db
              .collection('users').doc(user.uid)
              .collection('notes').doc(dateKey)
              .set({ items, updatedAt: Date.now() });
            console.log(`💾 [SYNC notes] Salvou ${items.length} notas em ${dateKey}`);
          } else {
            await window.db
              .collection('users').doc(user.uid)
              .collection('notes').doc(dateKey)
              .delete();
            console.log(`🗑️ [SYNC notes] Removeu notas de ${dateKey}`);
          }
        } catch (error) {
          console.error('❌ Save note:', error);
        }
      }
    };

    return () => {
      console.log("🧹 [SYNC notes] Removendo listener");
      window.notesSync = null;
      unsubscribe();
    };
  }, [user]);

  // ============ DEMAIS ESTADOS ============
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

  const navMonth = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
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

  const openCreate = (date) => { setEditing({ defaultDate: date ? ymd(date) : ymd(selected) }); setModalOpen(true); };
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
    if (user && window.db) {
      window.db
        .collection('users').doc(user.uid).collection('events').doc(String(id))
        .delete().catch((error) => console.error('❌ Delete event:', error));
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

  // ============ TELA DE LOADING ============
  if (loading) {
    return (
      <>
        <div className="app-bg" />
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--bg)' }}>
          <div style={{ textAlign:'center', color:'var(--text-1)' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📚</div>
            <h1 style={{ margin:'0 0 12px 0', fontSize:28, fontWeight:700 }}>Ferstudy</h1>
            <p style={{ margin:'0 0 24px 0', color:'var(--text-2)', fontSize:14 }}>Preparando tudo...</p>
            <div style={{ width:40, height:40, border:'3px solid var(--surface-hi)', borderTop:'3px solid var(--primary)', borderRadius:'50%', margin:'0 auto', animation:'spin 0.8s linear infinite' }}>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============ TELA DE LOGIN ============
  if (!user) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding:'20px' }}>
        <div style={{ background:'white', borderRadius:20, padding:'40px 32px', width:'100%', maxWidth:420, boxShadow:'0 25px 50px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📚</div>
            <h1 style={{ margin:'0 0 8px 0', fontSize:32, color:'#1e293b', fontWeight:800 }}>Ferstudy</h1>
            <p style={{ margin:0, color:'#64748b', fontSize:14 }}>Calendário de estudos</p>
          </div>

          {!firebaseReady && (
            <div style={{ background:'#fef3c7', color:'#92400e', padding:'12px 14px', borderRadius:10, fontSize:13, marginBottom:16, border:'1px solid #fcd34d' }}>
              ⏳ Inicializando Firebase...
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            <button onClick={() => { setIsSignup(false); setAuthError(''); }} style={{ flex:1, padding:'10px', border:'none', background:!isSignup ? '#667eea' : '#f1f5f9', color:!isSignup ? 'white' : '#64748b', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Entrar</button>
            <button onClick={() => { setIsSignup(true); setAuthError(''); }} style={{ flex:1, padding:'10px', border:'none', background:isSignup ? '#667eea' : '#f1f5f9', color:isSignup ? 'white' : '#64748b', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>Registrar</button>
          </div>

          <form onSubmit={isSignup ? handleSignup : handleLogin} style={{ marginBottom:20 }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', marginBottom:8, fontSize:13, fontWeight:600, color:'#334155' }}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, color:'#1e293b', background:'#ffffff' }}
                disabled={!firebaseReady} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', marginBottom:8, fontSize:13, fontWeight:600, color:'#334155' }}>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, color:'#1e293b', background:'#ffffff' }}
                disabled={!firebaseReady} />
            </div>
            {authError && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'12px 14px', borderRadius:10, fontSize:13, marginBottom:16 }}>⚠️ {authError}</div>}
            <button type="submit" disabled={!firebaseReady} style={{ width:'100%', padding:'12px 16px', background:firebaseReady ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:firebaseReady ? 'pointer' : 'not-allowed' }}>{isSignup ? 'Criar conta' : 'Entrar'}</button>
          </form>

          <div style={{ padding:'16px', background:'#f0f4ff', borderRadius:10, fontSize:12, color:'#475569', border:'1px solid #e0e7ff' }}>
            <strong style={{ color:'#334155' }}>💡 Dica:</strong><br/>Seus dados sincronizam entre PC e celular após o login.
          </div>
        </div>
      </div>
    );
  }

  // ============ APP PRINCIPAL ============
  return (
    <>
      <div className="app-bg" />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">F</div>
          <div className="nav">
            <button className={navView === 'calendar' ? 'active' : ''} onClick={() => setNavView('calendar')} title="Calendário"><Icon name="calendar" /></button>
            <button className={navView === 'categories' ? 'active' : ''} onClick={() => setNavView('categories')} title="Tipos"><Icon name="tag" /></button>
            <button className={navView === 'settings' ? 'active' : ''} onClick={() => setNavView('settings')} title="Configurações"><Icon name="settings" /></button>
          </div>
          <div className="footer">
            <button onClick={handleLogout} title="Sair" style={{ background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:16 }}>🚪</button>
          </div>
        </aside>

        <main className="canvas">
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

              <div className="filters">
                <span style={{ display:'inline-flex', alignItems:'center', gap: 6, color:'var(--text-3)', fontSize:11, fontWeight:600, marginRight:4 }}>
                  <Icon name="filter" size={13} /> FILTRAR
                </span>
                {categories.map(c => {
                  const active = !hiddenCats.includes(c.id);
                  return (
                    <button key={c.id} className={'filter-chip' + (active ? ' active' : ' muted')} onClick={() => toggleCat(c.id)}>
                      <span className="swatch" style={{ background: c.color }} />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {view === 'month' && (
                <MonthView grid={grid} eventsByDay={eventsByDay} today={today} selected={selected} onSelectDay={setSelected} onOpenEvent={openEdit} onMoveEvent={moveEvent} evtStyle={tweaks.evtStyle} hiddenCats={hiddenCats} />
              )}
              {(view === 'week' || view === 'day') && (
                <TimelineView days={days} eventsByDay={eventsByDay} today={today} onOpenEvent={openEdit} hiddenCats={hiddenCats} onSelectDay={(d) => { setSelected(d); if (view === 'week') setView('day'); }} />
              )}

              <button className="fab" onClick={() => openCreate(selected)} title="Novo evento">
                <Icon name="plus" size={22} />
              </button>
            </section>

            {agendaCollapsed ? (
              <div className="agenda collapsed" onClick={() => setAgendaCollapsed(false)}>
                <button className="agenda-collapse-btn" title="Expandir" onClick={(e) => { e.stopPropagation(); setAgendaCollapsed(false); }}>
                  <Icon name="chev-l" size={14} />
                </button>
                <span className="vertical-label">Agendado</span>
                <span className="pill-count">{(eventsByDay[ymd(selected)] || []).length}</span>
              </div>
            ) : (
              <AgendaPanel selected={selected} eventsByDay={eventsByDay} onSelectDay={setSelected} onOpenEvent={openEdit} hiddenCats={hiddenCats} onCollapse={() => setAgendaCollapsed(true)} />
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
        <EventModal event={editing?.event} defaultDate={editing?.defaultDate} onClose={() => setModalOpen(false)} onSave={saveEvent} onDelete={deleteEvent} />
      )}

      <TweaksPanel title="Tweaks · Ferstudy">
        <TweakSection title="Tema de cor">
          <TweakRadio value={tweaks.theme} onChange={(v) => setTweak('theme', v)} options={[
            { value: 'blue', label: 'Azul' },
            { value: 'violet', label: 'Violeta' },
            { value: 'emerald', label: 'Verde' },
            { value: 'rose', label: 'Rose' },
            { value: 'amber', label: 'Âmbar' },
          ]} />
        </TweakSection>
        <TweakSection title="Densidade">
          <TweakRadio value={tweaks.density} onChange={(v) => setTweak('density', v)} options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'comfy', label: 'Confortável' },
            { value: 'cozy', label: 'Espaçoso' },
          ]} />
        </TweakSection>
        <TweakSection title="Estilo do card de evento">
          <TweakRadio value={tweaks.evtStyle} onChange={(v) => setTweak('evtStyle', v)} options={[
            { value: 'bar', label: 'Barra' },
            { value: 'soft', label: 'Suave' },
            { value: 'pill', label: 'Sólido' },
          ]} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
