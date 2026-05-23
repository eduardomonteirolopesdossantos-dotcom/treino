const Charts = (() => {
  const instances = {};

  const COLORS = {
    'Matemática': '#4F46E5', 'Física': '#06B6D4', 'Química': '#10B981', 'Biologia': '#84CC16',
    'História': '#F59E0B', 'Geografia': '#EF4444', 'Filosofia': '#8B5CF6', 'Sociologia': '#EC4899',
    'Português': '#14B8A6', 'Literatura': '#F97316', 'Inglês': '#6366F1', 'Redação': '#A855F7'
  };

  function _destroy(id) {
    if (instances[id]) { try { instances[id].destroy(); } catch {} delete instances[id]; }
  }

  function destroyAll() {
    Object.keys(instances).forEach(_destroy);
  }

  function overallLine(canvasId) {
    _destroy(canvasId);
    const simulados = Storage.getSimulados();
    const ctx = document.getElementById(canvasId);
    if (!ctx || !simulados.length) return;

    const labels = simulados.map(s => new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
    const data   = simulados.map(s => {
      const vals = Object.values(s.scores).filter(v => v !== undefined && v !== null && v !== '').map(Number);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Média Geral', data, borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,.12)', borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 7, fill: true, tension: .3, spanGaps: true }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` Média: ${c.parsed.y?.toFixed(1)}%` } } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#F1F5F9' } }, x: { grid: { display: false } } }
      }
    });
  }

  function radar(canvasId) {
    _destroy(canvasId);
    const stats    = Storage.getStats();
    const goals    = Storage.getGoals();
    const subjects = Storage.getSubjects();
    const ctx = document.getElementById(canvasId);
    if (!ctx || !stats) return;

    instances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: subjects.map(s => s.length > 9 ? s.slice(0, 9) + '.' : s),
        datasets: [
          { label: 'Média Atual', data: subjects.map(s => stats.subjectStats[s]?.avg ?? 0), backgroundColor: 'rgba(79,70,229,.15)', borderColor: '#4F46E5', borderWidth: 2, pointBackgroundColor: '#4F46E5', pointRadius: 3 },
          { label: 'Meta',        data: subjects.map(s => goals[s] || 70),                  backgroundColor: 'rgba(16,185,129,.08)', borderColor: '#10B981', borderWidth: 1.5, borderDash: [5,5],  pointBackgroundColor: '#10B981', pointRadius: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
        scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: '#E2E8F0' }, pointLabels: { font: { size: 10 } } } }
      }
    });
  }

  function subjectBar(canvasId) {
    _destroy(canvasId);
    const stats    = Storage.getStats();
    const goals    = Storage.getGoals();
    const subjects = Storage.getSubjects();
    const ctx = document.getElementById(canvasId);
    if (!ctx || !stats) return;

    const avgs   = subjects.map(s => stats.subjectStats[s]?.avg ?? 0);
    const goalVs = subjects.map(s => goals[s] || 70);
    const colors = subjects.map(s => {
      const a = stats.subjectStats[s]?.avg ?? 0, g = goals[s] || 70;
      return a >= g ? '#10B981' : a >= g * .85 ? '#F59E0B' : '#EF4444';
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: subjects,
        datasets: [
          { label: 'Média', data: avgs, backgroundColor: colors, borderRadius: 4, borderSkipped: false },
          { label: 'Meta',  data: goalVs, type: 'line', borderColor: '#6366F1', borderWidth: 2, borderDash: [4,4], pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#F1F5F9' } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 40 } } }
      }
    });
  }

  function evolution(canvasId) {
    _destroy(canvasId);
    const simulados = Storage.getSimulados();
    const stats     = Storage.getStats();
    const subjects  = Storage.getSubjects();
    const ctx = document.getElementById(canvasId);
    if (!ctx || !simulados.length || !stats) return;

    const labels = simulados.map(s => s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name);
    const top = subjects.filter(s => (stats.subjectStats[s]?.count || 0) > 0).slice(0, 6);

    const datasets = top.map(subj => ({
      label: subj,
      data: simulados.map(s => { const v = s.scores[subj]; return (v !== undefined && v !== null && v !== '') ? Number(v) : null; }),
      borderColor: COLORS[subj] || '#4F46E5',
      backgroundColor: (COLORS[subj] || '#4F46E5') + '22',
      borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: .3, spanGaps: true
    }));

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#F1F5F9' } }, x: { grid: { display: false } } }
      }
    });
  }

  return { destroyAll, overallLine, radar, subjectBar, evolution };
})();
