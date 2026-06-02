const Storage = (() => {
  const KEY = 'vestibular_gui_v1';

  const SUBJECTS = [
    'Matemática', 'Física', 'Química', 'Biologia',
    'História', 'Geografia', 'Filosofia e Sociologia',
    'Português', 'Inglês', 'Redação'
  ];

  const DEFAULT_GOALS = {
    'Matemática': 70, 'Física': 65, 'Química': 65, 'Biologia': 70,
    'História': 70, 'Geografia': 70, 'Filosofia e Sociologia': 65,
    'Português': 75, 'Inglês': 70, 'Redação': 70
  };

  function _default() {
    return { subjects: [...SUBJECTS], goals: { ...DEFAULT_GOALS }, simulados: [], events: [] };
  }

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || _default(); }
    catch { return _default(); }
  }

  function _save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function getSubjects() { return [...SUBJECTS]; }
  function getGoals()    { return _load().goals; }

  function saveGoals(goals) {
    const d = _load(); d.goals = goals; _save(d);
  }

  function getSimulados() {
    return _load().simulados.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function addSimulado(s) {
    const d = _load();
    s.id = Date.now().toString();
    s.createdAt = new Date().toISOString();
    d.simulados.push(s);
    _save(d);
    return s;
  }

  function updateSimulado(id, updates) {
    const d = _load();
    const i = d.simulados.findIndex(s => s.id === id);
    if (i !== -1) { d.simulados[i] = { ...d.simulados[i], ...updates }; _save(d); }
  }

  function deleteSimulado(id) {
    const d = _load(); d.simulados = d.simulados.filter(s => s.id !== id); _save(d);
  }

  function getSimuladoById(id) { return _load().simulados.find(s => s.id === id); }

  function getEvents() {
    return _load().events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function addEvent(ev) {
    const d = _load(); ev.id = Date.now().toString(); d.events.push(ev); _save(d); return ev;
  }

  function deleteEvent(id) {
    const d = _load(); d.events = d.events.filter(e => e.id !== id); _save(d);
  }

  function getStats() {
    const simulados = getSimulados();
    const goals     = getGoals();
    const subjects  = getSubjects();
    if (!simulados.length) return null;

    const subjectStats = {};
    subjects.forEach(subj => {
      const scores = simulados
        .map(s => s.scores[subj])
        .filter(v => v !== undefined && v !== null && v !== '')
        .map(Number);
      if (!scores.length) { subjectStats[subj] = { avg: null, count: 0, last: null, scores: [] }; return; }
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      subjectStats[subj] = { avg: Math.round(avg * 10) / 10, count: scores.length, last: scores[scores.length - 1], scores };
    });

    const overallPerSim = simulados.map(s => {
      const vals = Object.values(s.scores).filter(v => v !== undefined && v !== null && v !== '').map(Number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }).filter(v => v !== null);

    const overallAvg = overallPerSim.length
      ? Math.round(overallPerSim.reduce((a, b) => a + b, 0) / overallPerSim.length * 10) / 10
      : 0;

    const trend = overallPerSim.length >= 2
      ? Math.round((overallPerSim[overallPerSim.length - 1] - overallPerSim[overallPerSim.length - 2]) * 10) / 10
      : null;

    const withAvg = subjects.map(s => ({ subject: s, avg: subjectStats[s]?.avg, goal: goals[s] || 70 }))
      .filter(s => s.avg !== null);
    const best  = withAvg.length ? withAvg.reduce((a, b) => a.avg > b.avg ? a : b) : null;
    const worst = withAvg.length ? withAvg.reduce((a, b) => a.avg < b.avg ? a : b) : null;

    return { total: simulados.length, overallAvg, trend, subjectStats, best, worst, overallPerSim };
  }

  // School simulado calendar (Escola Mobile 2026)
  const SCHOOL_CALENDAR = [
    { code: 'S1', date: '2026-03-07', name: 'S1 — FUVEST (Questões selecionadas)', type: 'simulado' },
    { code: 'S2', date: '2026-04-11', name: 'S2 — FUVEST (Simulado próprio)',       type: 'simulado' },
    { code: 'S3', date: '2026-05-23', name: 'S3 — FUVEST SAS',                      type: 'simulado' },
    { code: 'S4', date: '2026-06-18', name: 'S4 — FUVEST SAS',                      type: 'simulado' },
    { code: 'S5', date: '2026-08-15', name: 'S5 — UNICAMP SAS',                     type: 'simulado' },
    { code: 'S6', date: '2026-08-22', name: 'S6 — ENEM SAS',                        type: 'simulado' },
    { code: 'S7', date: '2026-09-26', name: 'S7 — FUVEST SAS',                      type: 'simulado' },
    { code: 'S8', date: '2026-10-10', name: 'S8 — FUVEST SAS 2025',                 type: 'simulado' },
  ];

  function getSchoolCalendar() { return SCHOOL_CALENDAR; }

  // Study schedule
  const SCHEDULE_KEY = 'vestibular_gui_schedule_v1';
  function getSchedule() {
    try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || []; }
    catch { return []; }
  }
  function addScheduleEntry(e) {
    const l = getSchedule();
    e.id = Date.now().toString();
    e.createdAt = new Date().toISOString();
    l.push(e);
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(l));
    return e;
  }
  function updateScheduleEntry(id, u) {
    const l = getSchedule();
    const i = l.findIndex(e => e.id === id);
    if (i !== -1) { l[i] = { ...l[i], ...u }; localStorage.setItem(SCHEDULE_KEY, JSON.stringify(l)); }
  }
  function deleteScheduleEntry(id) {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(getSchedule().filter(e => e.id !== id)));
  }

  function loadSampleData() {
    const d = _default();
    // S1, S2 already past — load as completed simulados
    const sampleDates = ['2026-03-07', '2026-04-11', '2026-05-23'];
    const sampleNames = ['S1 — FUVEST (Questões selecionadas)', 'S2 — FUVEST (Simulado próprio)', 'S3 — FUVEST SAS'];
    const scoreMatrix = [
      { Matemática:57, Física:51, Química:54, Biologia:62, História:64, Geografia:67, 'Filosofia e Sociologia':60, Português:69, Inglês:71, Redação:59 },
      { Matemática:61, Física:54, Química:57, Biologia:67, História:67, Geografia:69, 'Filosofia e Sociologia':63, Português:72, Inglês:74, Redação:63 },
      { Matemática:65, Física:57, Química:60, Biologia:70, História:70, Geografia:72, 'Filosofia e Sociologia':66, Português:74, Inglês:76, Redação:66 },
    ];
    const erros = [
      { nao_sabia:8, nao_lembrava:5, atencao:3, chute:2, duvida:4 },
      { nao_sabia:7, nao_lembrava:4, atencao:4, chute:2, duvida:3 },
      { nao_sabia:6, nao_lembrava:4, atencao:3, chute:2, duvida:3 },
    ];
    sampleDates.forEach((date, i) => d.simulados.push({
      id: `sample_${i}`, name: sampleNames[i], date, type: 'simulado',
      scores: scoreMatrix[i], erros: erros[i], notes: '', createdAt: new Date().toISOString()
    }));
    // S4–S8 + ENEM as upcoming events
    d.events.push(
      { id: 'ev_s4',   name: 'S4 — FUVEST SAS',             date: '2026-06-18', type: 'simulado',   notes: 'Escola Mobile' },
      { id: 'ev_s5',   name: 'S5 — UNICAMP SAS',             date: '2026-08-15', type: 'simulado',   notes: 'Escola Mobile' },
      { id: 'ev_s6',   name: 'S6 — ENEM SAS',                date: '2026-08-22', type: 'simulado',   notes: 'Escola Mobile' },
      { id: 'ev_s7',   name: 'S7 — FUVEST SAS',              date: '2026-09-26', type: 'simulado',   notes: 'Escola Mobile' },
      { id: 'ev_s8',   name: 'S8 — FUVEST SAS 2025',         date: '2026-10-10', type: 'simulado',   notes: 'Escola Mobile' },
      { id: 'ev_en1',  name: 'ENEM 2026 — Dia 1',            date: '2026-11-01', type: 'enem',       notes: 'Linguagens, Ciências Humanas + Redação' },
      { id: 'ev_en2',  name: 'ENEM 2026 — Dia 2',            date: '2026-11-08', type: 'enem',       notes: 'Matemática e Ciências da Natureza' }
    );
    _save(d);
  }

  return {
    getSubjects, getGoals, saveGoals,
    getSimulados, addSimulado, updateSimulado, deleteSimulado, getSimuladoById,
    getEvents, addEvent, deleteEvent,
    getStats, loadSampleData, getSchoolCalendar,
    getSchedule, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry
  };
})();
