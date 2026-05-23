const Recommendations = (() => {
  const TIPS = {
    'Matemática':  ['Funções e equações', 'Geometria plana e espacial', 'Estatística e probabilidade', 'Trigonometria', 'Progressões PA/PG'],
    'Física':      ['Mecânica (Cinemática e Dinâmica)', 'Termodinâmica', 'Ondas e óptica', 'Eletromagnetismo', 'Gravitação'],
    'Química':     ['Estequiometria', 'Funções orgânicas e reações', 'Eletroquímica', 'Soluções e concentração', 'Equilíbrio químico'],
    'Biologia':    ['Genética e evolução', 'Ecologia e biomas', 'Bioquímica celular', 'Fisiologia humana', 'Botânica'],
    'História':    ['Brasil Colônia e Império', 'Século XX e Guerras Mundiais', 'Ditadura Militar', 'Revoluções Industriais', 'Período Vargas'],
    'Geografia':   ['Geopolítica e globalização', 'Climatologia e biomas', 'Urbanização brasileira', 'Cartografia', 'Questões ambientais'],
    'Filosofia':   ['Teoria do conhecimento', 'Ética e moral', 'Política e Estado', 'Filósofos clássicos (Platão, Aristóteles)', 'Iluminismo'],
    'Sociologia':  ['Conceitos básicos (Durkheim, Weber, Marx)', 'Movimentos sociais', 'Cultura e identidade', 'Trabalho e capitalismo', 'Desigualdade'],
    'Português':   ['Interpretação de texto', 'Gramática e sintaxe', 'Coerência e coesão textual', 'Figuras de linguagem', 'Variação linguística'],
    'Literatura':  ['Modernismo brasileiro', 'Romantismo e Realismo', 'Pré-modernismo', 'Obras obrigatórias', 'Análise literária'],
    'Inglês':      ['Interpretação de texto em inglês', 'Vocabulário contextualizado', 'Gramática básica', 'Phrasal verbs', 'Falsos cognatos'],
    'Redação':     ['Estrutura da dissertação-argumentativa', 'Argumentação e repertório', 'Proposta de intervenção (ENEM)', 'Competências do ENEM', 'Coesão e coerência']
  };

  const HOURS = { critical: 6, high: 4, medium: 3, low: 2, achieved: 1, unknown: 2 };

  function generate() {
    const stats    = Storage.getStats();
    const goals    = Storage.getGoals();
    const subjects = Storage.getSubjects();
    if (!stats) return [];

    return subjects.map(subject => {
      const ss   = stats.subjectStats[subject];
      const goal = goals[subject] || 70;
      const avg  = ss?.avg ?? null;
      const last = ss?.last ?? null;
      const count = ss?.count ?? 0;
      const gap  = avg !== null ? goal - avg : null;

      let urgency;
      if (gap === null)  urgency = 'unknown';
      else if (gap > 20) urgency = 'critical';
      else if (gap > 10) urgency = 'high';
      else if (gap > 5)  urgency = 'medium';
      else if (gap > 0)  urgency = 'low';
      else               urgency = 'achieved';

      const urgencyOrder = { critical: 1, high: 2, medium: 3, low: 4, achieved: 5, unknown: 6 };
      const trend = (last !== null && avg !== null && count > 1) ? Math.round((last - avg) * 10) / 10 : null;

      return {
        subject, avg, last, goal, gap,
        urgency,
        priority: urgencyOrder[urgency],
        hoursPerWeek: HOURS[urgency],
        trend,
        tips: TIPS[subject] || []
      };
    }).sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : (b.gap || 0) - (a.gap || 0));
  }

  function getWeeklyPlan() {
    const recs = generate().filter(r => r.avg !== null);
    const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const totalHours = recs.reduce((s, r) => s + r.hoursPerWeek, 0);
    const hoursPerDay = Math.ceil(totalHours / days.length);

    const plan = days.map(day => ({ day, subjects: [], totalH: 0 }));
    recs.forEach(rec => {
      let remaining = rec.hoursPerWeek;
      for (let di = 0; di < days.length && remaining > 0; di++) {
        const slot = hoursPerDay - plan[di].totalH;
        if (slot <= 0) continue;
        const alloc = Math.min(remaining, slot);
        plan[di].subjects.push({ subject: rec.subject, hours: alloc });
        plan[di].totalH += alloc;
        remaining -= alloc;
      }
    });
    return plan;
  }

  return { generate, getWeeklyPlan };
})();
