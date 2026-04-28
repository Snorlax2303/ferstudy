// ferstudy/screens.jsx — placeholder/full screens for sidebar nav items

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: 'var(--accent)' } : {}}>{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

function ScreenShell({ title, subtitle, children }) {
  return (
    <section className="cal-panel" style={{ padding: '28px 30px', width: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>{title}</h2>
        {subtitle && <p style={{ margin: '4px 0 0', color: 'var(--text-3)', fontSize: 13 }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function HomeScreen({ events, today, onJump }) {
  const todayKey = ymd(today);
  const todayEvts = events.filter(e => e.date === todayKey).sort((a,b) => a.start.localeCompare(b.start));
  const upcomingProva = events
    .filter(e => e.category === 'prova' && fromYMD(e.date).getTime() >= today.getTime() - 86400000)
    .sort((a,b) => a.date.localeCompare(b.date))[0];
  const week = Array.from({length:7}, (_,i) => addDays(startOfWeek(today), i));
  const weekEvts = events.filter(e => {
    const d = fromYMD(e.date);
    return d >= week[0] && d <= week[6];
  });
  const byCat = Object.values(CATEGORIES).map(c => ({
    cat: c, count: weekEvts.filter(e => e.category === c.id).length
  }));
  const total = weekEvts.length || 1;

  return (
    <ScreenShell title="Visão geral" subtitle={`${WEEKDAYS_FULL[today.getDay()]}, ${today.getDate()} de ${MONTHS_PT[today.getMonth()]}`}>
      <div className="stats-grid">
        <StatCard label="Eventos hoje" value={todayEvts.length} hint={todayEvts.length ? `Próximo: ${todayEvts[0].start} ${todayEvts[0].title}` : 'Dia livre'} />
        <StatCard label="Esta semana" value={weekEvts.length} hint={`${byCat.find(c=>c.cat.id==='aula').count} aulas · ${byCat.find(c=>c.cat.id==='foco').count} sessões`} />
        <StatCard label="Próxima prova" value={upcomingProva ? Math.max(0, Math.ceil((fromYMD(upcomingProva.date)-today)/86400000)) + 'd' : '—'} hint={upcomingProva ? upcomingProva.title : '—'} accent />
        <StatCard label="Sequência" value="12 dias" hint="Estudo consistente" />
      </div>

      <div className="home-grid">
        <div className="panel">
          <h3>Hoje</h3>
          {todayEvts.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem eventos hoje.</p>}
          {todayEvts.map(ev => {
            const cat = CATEGORIES[ev.category] || { color: "oklch(0.6 0 0)", soft: "oklch(0.6 0 0 / 0.15)", label: "—" };
            return (
              <div key={ev.id} className="home-evt" onClick={() => onJump('calendar')} style={{ '--evt-color': cat.color }}>
                <div className="home-evt-time">{ev.start}</div>
                <div className="home-evt-bar" style={{ background: cat.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="home-evt-title">{ev.title}</div>
                  <div className="home-evt-sub">{cat.label} · {ev.subject}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <h3>Distribuição da semana</h3>
          {byCat.map(({cat, count}) => (
            <div key={cat.id} className="cat-row">
              <span className="swatch" style={{ background: cat.color }} />
              <span className="cat-name">{cat.label}</span>
              <div className="cat-bar"><div style={{ width: (count/total*100) + '%', background: cat.color }} /></div>
              <span className="cat-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function ProgressScreen({ events }) {
  const total = events.length;
  const byCat = Object.values(CATEGORIES).map(c => ({
    cat: c, count: events.filter(e => e.category === c.id).length
  }));
  const bySubject = SUBJECTS.map(s => ({
    name: s, count: events.filter(e => e.subject === s).length
  })).sort((a,b)=>b.count-a.count);
  const maxSub = Math.max(...bySubject.map(s => s.count), 1);

  return (
    <ScreenShell title="Progresso" subtitle="Acompanhe sua dedicação por matéria e tipo de atividade">
      <div className="stats-grid">
        <StatCard label="Total de eventos" value={total} accent />
        <StatCard label="Sessões de foco" value={byCat.find(c=>c.cat.id==='foco').count} hint="Pomodoro & deep work" />
        <StatCard label="Aulas" value={byCat.find(c=>c.cat.id==='aula').count} />
        <StatCard label="Provas registradas" value={byCat.find(c=>c.cat.id==='prova').count} />
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h3>Horas por matéria</h3>
        {bySubject.map(s => (
          <div key={s.name} className="cat-row">
            <span className="cat-name" style={{ flex: '0 0 160px' }}>{s.name}</span>
            <div className="cat-bar"><div style={{ width: (s.count/maxSub*100)+'%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} /></div>
            <span className="cat-count">{s.count}</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function InboxScreen() {
  const items = [
    { type: 'reminder', title: 'Revisar derivadas antes da aula', sub: 'Cálculo II · Hoje 14:00', cat: 'revisao' },
    { type: 'invite', title: 'Bruna te adicionou ao grupo de ED', sub: 'Trabalho de Estrutura de Dados · há 2h', cat: 'trabalho' },
    { type: 'deadline', title: 'Entrega de Eng. SW se aproxima', sub: 'Faltam 4 dias · 17:00', cat: 'trabalho' },
    { type: 'reminder', title: 'Prova de Física III amanhã', sub: 'Anfiteatro A · 08:00', cat: 'prova' },
    { type: 'tip', title: 'Você não estuda Filosofia há 5 dias', sub: 'Que tal agendar uma sessão?', cat: 'foco' },
  ];
  return (
    <ScreenShell title="Inbox" subtitle="Lembretes, convites e sugestões inteligentes">
      <div className="panel" style={{ marginTop: 0 }}>
        {items.map((it, i) => {
          const cat = CATEGORIES[it.cat] || { color: "oklch(0.6 0 0)", soft: "oklch(0.6 0 0 / 0.15)", label: "—" };
          return (
            <div key={i} className="inbox-row" style={{ '--evt-color': cat.color }}>
              <div className="inbox-bullet" style={{ background: cat.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="inbox-title">{it.title}</div>
                <div className="inbox-sub">{it.sub}</div>
              </div>
              <button className="inbox-action">Ver</button>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}

function SubjectsScreen({ events, onJump }) {
  const data = SUBJECTS.map(s => {
    const evts = events.filter(e => e.subject === s);
    const next = evts.filter(e => fromYMD(e.date).getTime() >= FAKE_TODAY.getTime() - 86400000)
      .sort((a,b)=> a.date.localeCompare(b.date) || a.start.localeCompare(b.start))[0];
    const colors = [
      'oklch(0.7 0.18 245)', 'oklch(0.74 0.16 145)', 'oklch(0.78 0.16 80)',
      'oklch(0.72 0.18 25)', 'oklch(0.72 0.18 305)', 'oklch(0.74 0.14 200)',
      'oklch(0.78 0.13 60)', 'oklch(0.7 0.18 330)'
    ];
    return { name: s, count: evts.length, next, color: colors[SUBJECTS.indexOf(s) % colors.length] };
  });

  return (
    <ScreenShell title="Matérias" subtitle="Suas disciplinas neste semestre">
      <div className="subjects-grid">
        {data.map(s => (
          <div key={s.name} className="subject-card" onClick={() => onJump('calendar')}>
            <div className="subject-color" style={{ background: s.color }} />
            <h4>{s.name}</h4>
            <div className="subject-meta">{s.count} eventos agendados</div>
            {s.next ? (
              <div className="subject-next">
                <span className="slot-time" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>
                  {s.next.date.slice(8,10)}/{s.next.date.slice(5,7)} · {s.next.start}
                </span>
                <span className="subject-next-title">{s.next.title}</span>
              </div>
            ) : (
              <div className="subject-next" style={{ color: 'var(--text-3)' }}>Sem eventos próximos</div>
            )}
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function SettingsScreen({ tweaks, setTweak }) {
  const themes = [
    { v: 'blue',    label: 'Azul',    color: 'oklch(0.68 0.18 245)' },
    { v: 'violet',  label: 'Violeta', color: 'oklch(0.7 0.18 300)' },
    { v: 'emerald', label: 'Verde',   color: 'oklch(0.74 0.16 160)' },
    { v: 'rose',    label: 'Rose',    color: 'oklch(0.7 0.18 15)' },
    { v: 'amber',   label: 'Âmbar',   color: 'oklch(0.78 0.15 70)' },
  ];
  const densities = [
    { v: 'compact', label: 'Compacto', hint: 'Mais eventos visíveis' },
    { v: 'comfy',   label: 'Confortável', hint: 'Equilíbrio' },
    { v: 'cozy',    label: 'Espaçoso', hint: 'Mais respiro' },
  ];
  const styles = [
    { v: 'bar',  label: 'Barra',  hint: 'Borda lateral colorida' },
    { v: 'soft', label: 'Suave',  hint: 'Fundo translúcido' },
    { v: 'pill', label: 'Sólido', hint: 'Pílula preenchida' },
  ];

  return (
    <ScreenShell title="Configurações" subtitle="Personalize a aparência do Ferstudy">
      <div className="panel">
        <h3>Tema de cor</h3>
        <div className="theme-row">
          {themes.map(t => (
            <button
              key={t.v}
              className={'theme-swatch' + (tweaks.theme === t.v ? ' active' : '')}
              onClick={() => setTweak('theme', t.v)}
            >
              <span className="theme-dot" style={{ background: t.color }} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h3>Densidade da grade</h3>
        <div className="opt-row">
          {densities.map(d => (
            <button
              key={d.v}
              className={'opt-card' + (tweaks.density === d.v ? ' active' : '')}
              onClick={() => setTweak('density', d.v)}
            >
              <div className="opt-label">{d.label}</div>
              <div className="opt-hint">{d.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <h3>Estilo do card de evento</h3>
        <div className="opt-row">
          {styles.map(s => (
            <button
              key={s.v}
              className={'opt-card' + (tweaks.evtStyle === s.v ? ' active' : '')}
              onClick={() => setTweak('evtStyle', s.v)}
            >
              <div className="opt-label">{s.label}</div>
              <div className="opt-hint">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>

    </ScreenShell>
  );
}

function CategoriesScreen({ categories, setCategories, events }) {
  const [editing, setEditing] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);

  const PALETTE = [
    'oklch(0.74 0.14 230)', 'oklch(0.72 0.18 25)',  'oklch(0.78 0.16 80)',
    'oklch(0.74 0.16 145)', 'oklch(0.72 0.18 305)', 'oklch(0.7 0.18 270)',
    'oklch(0.78 0.13 50)',  'oklch(0.72 0.16 200)', 'oklch(0.7 0.20 350)',
    'oklch(0.74 0.16 110)', 'oklch(0.7 0.16 180)',  'oklch(0.78 0.14 35)',
  ];

  const slug = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tipo';

  const startCreate = () => setEditing({ id: '', label: '', color: PALETTE[0], mode: 'create' });
  const startEdit = (c) => setEditing({ ...c, originalId: c.id, mode: 'edit' });
  const cancel = () => setEditing(null);

  const save = () => {
    const label = (editing.label || '').trim();
    if (!label) return;
    if (editing.mode === 'create') {
      let id = slug(label), n = 2;
      const existing = new Set(categories.map(c => c.id));
      while (existing.has(id)) id = slug(label) + '_' + (n++);
      setCategories([...categories, { id, label, color: editing.color }]);
    } else {
      setCategories(categories.map(c => c.id === editing.originalId ? { ...c, label, color: editing.color } : c));
    }
    setEditing(null);
  };

  const remove = (id) => {
    setCategories(categories.filter(c => c.id !== id));
    setConfirmDel(null);
  };

  const counts = React.useMemo(() => {
    const m = {};
    for (const e of events) m[e.category] = (m[e.category] || 0) + 1;
    return m;
  }, [events]);

  return (
    <ScreenShell title="Tipos de evento" subtitle="Crie e gerencie as categorias do seu calendário">
      <div className="panel" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Suas categorias</h3>
          <button className="btn-primary cat-add-btn" onClick={startCreate}>
            <Icon name="plus" size={15} /> Novo tipo
          </button>
        </div>

        <div className="cat-list">
          {categories.map(c => {
            const count = counts[c.id] || 0;
            return (
              <div key={c.id} className="cat-item">
                <span className="cat-color-chip" style={{ background: c.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cat-item-label">{c.label}</div>
                  <div className="cat-item-meta">{count} {count === 1 ? 'evento' : 'eventos'}</div>
                </div>
                <button className="cat-action-btn" onClick={() => startEdit(c)} title="Editar">
                  <Icon name="edit" size={14} />
                </button>
                <button className="cat-action-btn danger" onClick={() => setConfirmDel(c)} title="Excluir" disabled={categories.length <= 1}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '8px 0' }}>Nenhuma categoria. Crie a primeira para começar.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={cancel}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <button className="close" onClick={cancel}><Icon name="close" size={16} /></button>
            <h2>{editing.mode === 'create' ? 'Novo tipo' : 'Editar tipo'}</h2>
            <p style={{ margin: '0 0 14px', color: 'var(--text-3)', fontSize: 12.5 }}>
              {editing.mode === 'create' ? 'Defina nome e cor para a nova categoria' : 'Atualize o nome ou a cor'}
            </p>

            <div className="cat-edit-body">
              <div className="cat-field">
                <span>Nome</span>
                <input
                  type="text"
                  value={editing.label}
                  onChange={e => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Ex: Reuniões"
                  autoFocus
                />
              </div>

              <div className="cat-field">
                <span>Cor</span>
                <div className="cat-palette">
                  {PALETTE.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={'palette-swatch' + (editing.color === p ? ' active' : '')}
                      style={{ background: p }}
                      onClick={() => setEditing({ ...editing, color: p })}
                      aria-label="Cor"
                    />
                  ))}
                </div>
              </div>

              <div className="cat-preview">
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Prévia</span>
                <div className="cat-preview-evt" style={{ borderLeftColor: editing.color }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: editing.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{editing.label || 'Nome do tipo'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>10:00</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={cancel}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={!editing.label?.trim()}>
                {editing.mode === 'create' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-backdrop" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
            <button className="close" onClick={() => setConfirmDel(null)}><Icon name="close" size={16} /></button>
            <h2>Excluir tipo?</h2>
            <p style={{ padding: '8px 0 18px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              {(counts[confirmDel.id] || 0) > 0
                ? <>Existem <strong style={{ color: 'var(--text-1)' }}>{counts[confirmDel.id]} eventos</strong> usando "{confirmDel.label}". Eles continuarão visíveis, mas perderão a cor.</>
                : <>Tem certeza que deseja excluir <strong style={{ color: 'var(--text-1)' }}>"{confirmDel.label}"</strong>?</>
              }
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => remove(confirmDel.id)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUBJECTS MANAGER SCREEN — gerencia matérias dinamicamente
// ═══════════════════════════════════════════════════════════════════
function SubjectsManagerScreen({ subjects, setSubjects, events }) {
  const [editing, setEditing] = React.useState(null); // { name, originalName, mode: 'create'|'edit' }
  const [confirmDel, setConfirmDel] = React.useState(null);

  const startCreate = () => setEditing({ name: '', mode: 'create' });
  const startEdit = (name) => setEditing({ name, originalName: name, mode: 'edit' });
  const cancel = () => setEditing(null);

  // Conta eventos por matéria
  const counts = React.useMemo(() => {
    const m = {};
    for (const e of events) m[e.subject] = (m[e.subject] || 0) + 1;
    return m;
  }, [events]);

  const save = () => {
    const name = (editing.name || '').trim();
    if (!name) return;

    // Validação: nome único
    const others = editing.mode === 'edit'
      ? subjects.filter(s => s !== editing.originalName)
      : subjects;
    if (others.includes(name)) {
      alert('Já existe uma matéria com esse nome.');
      return;
    }

    if (editing.mode === 'create') {
      setSubjects([...subjects, name]);
    } else {
      // Renomear: substitui no array E pode opcionalmente atualizar eventos
      setSubjects(subjects.map(s => s === editing.originalName ? name : s));
      // Nota: não estamos renomeando os eventos automaticamente.
      // Se quiser, descomente a linha abaixo para fazer cascade rename:
      // (precisaria receber setEvents como prop)
    }
    setEditing(null);
  };

  const remove = (name) => {
    setSubjects(subjects.filter(s => s !== name));
    setConfirmDel(null);
  };

  return (
    <ScreenShell title="Matérias" subtitle="Crie e gerencie as disciplinas do seu calendário">
      <div className="panel" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Suas matérias</h3>
          <button className="btn-primary cat-add-btn" onClick={startCreate}>
            <Icon name="plus" size={15} /> Nova matéria
          </button>
        </div>

        <div className="cat-list">
          {subjects.map(s => {
            const count = counts[s] || 0;
            return (
              <div key={s} className="cat-item">
                <span className="cat-color-chip" style={{ background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#06080F', fontWeight: 800, fontSize: 14 }}>
                  {s.charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cat-item-label">{s}</div>
                  <div className="cat-item-meta">{count} {count === 1 ? 'evento' : 'eventos'}</div>
                </div>
                <button className="cat-action-btn" onClick={() => startEdit(s)} title="Renomear">
                  <Icon name="edit" size={14} />
                </button>
                <button className="cat-action-btn danger" onClick={() => setConfirmDel(s)} title="Excluir" disabled={subjects.length <= 1}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}
          {subjects.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '8px 0' }}>
              Nenhuma matéria cadastrada. Crie a primeira para começar.
            </p>
          )}
        </div>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={cancel}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
            <button className="close" onClick={cancel}><Icon name="close" size={16} /></button>
            <h2>{editing.mode === 'create' ? 'Nova matéria' : 'Renomear matéria'}</h2>
            <p style={{ margin: '0 0 14px', color: 'var(--text-3)', fontSize: 12.5 }}>
              {editing.mode === 'create'
                ? 'Adicione uma disciplina ao seu calendário'
                : 'Atualize o nome da disciplina'}
            </p>

            <div className="cat-edit-body">
              <div className="cat-field">
                <span>Nome</span>
                <input
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Matemática Discreta"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
                />
              </div>

              {editing.mode === 'edit' && counts[editing.originalName] > 0 && (
                <div style={{
                  padding: '10px 12px',
                  background: 'oklch(0.78 0.16 80 / 0.12)',
                  border: '1px solid oklch(0.78 0.16 80 / 0.3)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-2)',
                  lineHeight: 1.5,
                }}>
                  ⚠️ Esta matéria está vinculada a <strong>{counts[editing.originalName]} evento{counts[editing.originalName] !== 1 ? 's' : ''}</strong>. Renomear aqui não atualiza os eventos existentes — eles continuarão com o nome antigo.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={cancel}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={!editing.name?.trim()}>
                {editing.mode === 'create' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-backdrop" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
            <button className="close" onClick={() => setConfirmDel(null)}><Icon name="close" size={16} /></button>
            <h2>Excluir matéria?</h2>
            <p style={{ padding: '8px 0 18px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              {(counts[confirmDel] || 0) > 0
                ? <>Existem <strong style={{ color: 'var(--text-1)' }}>{counts[confirmDel]} eventos</strong> usando "{confirmDel}". Eles continuarão visíveis, mas a matéria não estará mais disponível para selecionar em novos eventos.</>
                : <>Tem certeza que deseja excluir <strong style={{ color: 'var(--text-1)' }}>"{confirmDel}"</strong>?</>
              }
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => remove(confirmDel)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function HelpScreen() {
  const tips = [
    { k: 'Drag & drop', v: 'Arraste qualquer evento entre dias na visualização Mês.' },
    { k: 'Criar rápido', v: 'Clique no botão + flutuante ou pressione N.' },
    { k: 'Filtros', v: 'Toque nos chips coloridos para mostrar/esconder categorias.' },
    { k: 'Views', v: 'Alterne entre Mês, Semana e Dia no topo do calendário.' },
    { k: 'Tweaks', v: 'Ative o toggle no toolbar para mudar tema, densidade e estilo dos cards.' },
  ];
  return (
    <ScreenShell title="Ajuda" subtitle="Atalhos e dicas rápidas">
      <div className="panel">
        {tips.map((t,i) => (
          <div key={i} className="help-row">
            <div className="help-key">{t.k}</div>
            <div className="help-val">{t.v}</div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

Object.assign(window, { HomeScreen, ProgressScreen, InboxScreen, SubjectsScreen, SettingsScreen, HelpScreen, CategoriesScreen, SubjectsManagerScreen });
