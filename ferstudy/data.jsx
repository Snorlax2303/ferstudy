// ferstudy/data.jsx — seed data, helpers, categories
const CATEGORIES = {
  aula:      { id: 'aula',      label: 'Aulas',          color: 'oklch(0.74 0.14 230)', soft: 'oklch(0.74 0.14 230 / 0.18)' },
  prova:     { id: 'prova',     label: 'Provas',         color: 'oklch(0.72 0.18 25)',  soft: 'oklch(0.72 0.18 25 / 0.18)' },
  trabalho:  { id: 'trabalho',  label: 'Trabalhos',      color: 'oklch(0.78 0.16 80)',  soft: 'oklch(0.78 0.16 80 / 0.20)' },
  foco:      { id: 'foco',      label: 'Sessão de foco', color: 'oklch(0.74 0.16 145)', soft: 'oklch(0.74 0.16 145 / 0.18)' },
  revisao:   { id: 'revisao',   label: 'Revisão',        color: 'oklch(0.72 0.18 305)', soft: 'oklch(0.72 0.18 305 / 0.18)' },
};

const SUBJECTS = ['Cálculo II', 'Algoritmos', 'Estrutura de Dados', 'Física III', 'Banco de Dados', 'Eng. de Software', 'Inglês', 'Filosofia'];

// Reference "today" — locked to a specific date so the UI looks alive on screenshots.
const FAKE_TODAY = new Date(2026, 3, 8); // 08 abril 2026

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS_PT = ['dom','seg','ter','qua','qui','sex','sáb'];
const WEEKDAYS_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fromYMD(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d, n) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth()+1, 0); }
function startOfWeek(d) {
  const x = new Date(d);
  x.setDate(d.getDate() - d.getDay());
  return x;
}

// Build month grid: 42 cells (6 weeks × 7 days) starting from Sunday before the 1st.
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    cells.push({
      date: d,
      key: ymd(d),
      otherMonth: d.getMonth() !== month,
    });
  }
  return cells;
}

// Time helpers
function pad(n) { return String(n).padStart(2,'0'); }
function fmtHM(h, m) { return `${pad(h)}:${pad(m)}`; }
function durationMin(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh*60+em) - (sh*60+sm);
}
function fmtDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min/60), m = min%60;
  return m === 0 ? `${h} h` : `${h}h ${m}min`;
}

// ---------- Seed events ----------
let _id = 1;
function evt(date, start, end, cat, title, subject, extra = {}) {
  return {
    id: _id++,
    date,
    start, end,
    category: cat,
    title,
    subject,
    location: extra.location || null,
    note: extra.note || null,
    members: extra.members || null,
  };
}

const AVATARS = [
  { initials: 'MR', color: 'oklch(0.7 0.18 30)' },
  { initials: 'JS', color: 'oklch(0.7 0.18 200)' },
  { initials: 'AC', color: 'oklch(0.74 0.16 145)' },
  { initials: 'BL', color: 'oklch(0.72 0.18 305)' },
  { initials: 'PV', color: 'oklch(0.78 0.15 70)' },
];

// Build a rich set of events around FAKE_TODAY
const SEED_EVENTS = (() => {
  const T = FAKE_TODAY;
  const out = [];

  // Today (Wed 8 abr)
  out.push(evt(ymd(T), '08:00', '09:30', 'aula', 'Cálculo II', 'Cálculo II', { location: 'Sala 304' }));
  out.push(evt(ymd(T), '10:00', '12:00', 'foco', 'Sessão Pomodoro', 'Algoritmos', { note: '4 ciclos de 25min' }));
  out.push(evt(ymd(T), '14:00', '15:30', 'aula', 'Banco de Dados', 'Banco de Dados', { location: 'Lab 2' }));
  out.push(evt(ymd(T), '16:00', '17:00', 'revisao', 'Revisão de derivadas', 'Cálculo II'));
  out.push(evt(ymd(T), '19:00', '21:00', 'trabalho', 'Trabalho de ED', 'Estrutura de Dados', { members: AVATARS.slice(0,3) }));

  // Tomorrow
  const t1 = addDays(T, 1);
  out.push(evt(ymd(t1), '09:00', '11:00', 'aula', 'Algoritmos', 'Algoritmos'));
  out.push(evt(ymd(t1), '14:00', '16:00', 'foco', 'Estudo Física', 'Física III'));

  // +2
  const t2 = addDays(T, 2);
  out.push(evt(ymd(t2), '08:00', '10:00', 'prova', 'Prova de Física III', 'Física III', { location: 'Anfiteatro A' }));
  out.push(evt(ymd(t2), '15:00', '17:00', 'aula', 'Eng. de Software', 'Eng. de Software'));

  // +3
  const t3 = addDays(T, 3);
  out.push(evt(ymd(t3), '10:00', '12:00', 'foco', 'Lista de exercícios', 'Algoritmos'));
  out.push(evt(ymd(t3), '14:00', '15:00', 'revisao', 'Flashcards Inglês', 'Inglês'));
  out.push(evt(ymd(t3), '16:00', '18:00', 'trabalho', 'Relatório de Lab', 'Banco de Dados'));

  // +4 (sex)
  const t4 = addDays(T, 4);
  out.push(evt(ymd(t4), '08:00', '09:30', 'aula', 'Cálculo II', 'Cálculo II'));
  out.push(evt(ymd(t4), '10:00', '12:00', 'aula', 'Algoritmos', 'Algoritmos'));
  out.push(evt(ymd(t4), '14:00', '17:00', 'trabalho', 'Entrega Eng. SW', 'Eng. de Software', { members: AVATARS.slice(0,4) }));

  // +5,6 (weekend)
  const t5 = addDays(T, 5);
  out.push(evt(ymd(t5), '10:00', '12:00', 'foco', 'Estudo geral', 'Cálculo II'));
  const t6 = addDays(T, 6);
  out.push(evt(ymd(t6), '15:00', '17:00', 'revisao', 'Revisão semanal', 'Algoritmos'));

  // -1 yesterday
  const tm1 = addDays(T, -1);
  out.push(evt(ymd(tm1), '08:00', '09:30', 'aula', 'Filosofia', 'Filosofia'));
  out.push(evt(ymd(tm1), '10:00', '11:30', 'aula', 'Inglês', 'Inglês'));
  out.push(evt(ymd(tm1), '15:00', '17:00', 'foco', 'Lista BD', 'Banco de Dados'));

  // -2
  const tm2 = addDays(T, -2);
  out.push(evt(ymd(tm2), '14:00', '16:00', 'prova', 'Prova de Cálculo I', 'Cálculo II'));

  // Spread events across the rest of the month
  const seedDays = [-7, -5, -3, 10, 12, 14, 17, 19, 21, 22, 24, 25];
  const subs = ['Cálculo II', 'Algoritmos', 'Banco de Dados', 'Física III', 'Eng. de Software', 'Inglês'];
  const cats = ['aula','aula','aula','foco','revisao','trabalho','prova'];
  seedDays.forEach((offset, i) => {
    const d = addDays(T, offset);
    const cat = cats[i % cats.length];
    const subject = subs[i % subs.length];
    const titleByCat = {
      aula: subject,
      foco: 'Sessão de foco',
      revisao: 'Revisão',
      trabalho: 'Trabalho ' + subject,
      prova: 'Prova ' + subject,
    };
    const startH = 8 + (i % 6) * 2;
    out.push(evt(ymd(d), `${pad(startH)}:00`, `${pad(startH+2)}:00`, cat, titleByCat[cat], subject));
  });

  return out;
})();

// Expose globals for other JSX scripts
Object.assign(window, {
  CATEGORIES, SUBJECTS, FAKE_TODAY, MONTHS_PT, WEEKDAYS_PT, WEEKDAYS_FULL, AVATARS,
  ymd, fromYMD, isSameDay, addDays, startOfMonth, endOfMonth, startOfWeek,
  buildMonthGrid, pad, fmtHM, durationMin, fmtDuration,
  SEED_EVENTS,
});
