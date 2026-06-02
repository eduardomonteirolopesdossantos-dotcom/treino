const App = (() => {
  let editingId = null;
  let _cartoSubj = '';
  let _cartoFilters = { year: '', fuvest: '', vunesp: '', fgv: '', enem: '', status: '', periodo: [] };
  let _editingVestIdx = null;
  let _schedView    = 'semana';
  let _schedRefDate = new Date();
  let _editingSchedId = null;

  const ERR_TYPES = [
    { key: 'nao_sabia',    label: 'Não sabia',    icon: '❌', color: '#EF4444', hint: 'conteúdo novo' },
    { key: 'nao_lembrava', label: 'Não lembrava', icon: '🔁', color: '#F97316', hint: 'revisar cartografia' },
    { key: 'atencao',      label: 'Atenção',       icon: '⚠️', color: '#F59E0B', hint: 'erro de distração' },
    { key: 'chute',        label: 'Chute',         icon: '🎲', color: '#8B5CF6', hint: 'sem base' },
    { key: 'duvida',       label: 'Dúvida',        icon: '🤔', color: '#06B6D4', hint: 'entre alternativas' },
  ];

  /* ── Boot ── */
  function init() {
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.page);
        document.getElementById('sidebar').classList.remove('open');
      });
    });
    const hamburger = document.getElementById('hamburger');
    if (hamburger) hamburger.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });
    renderPage('dashboard');
  }

  /* ── Routing ── */
  function navigate(page) {
    document.querySelectorAll('.nav-item').forEach(l => l.classList.toggle('active', l.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    renderPage(page);
    window.scrollTo(0, 0);
  }

  function renderPage(page) {
    Charts.destroyAll();
    if      (page === 'dashboard')     renderDashboard();
    else if (page === 'cartografias')  renderCartografias();
    else if (page === 'simulados')     renderSimulados();
    else if (page === 'novo-simulado') renderForm();
    else if (page === 'recomendacoes') renderRecomendacoes();
    else if (page === 'cronograma')    renderCronograma();
    else if (page === 'vestibulares')  renderVestibulares();
    else if (page === 'metas')         renderMetas();
    else if (page === 'estudos')            renderCronogramaEstudos();
    else if (page === 'dashboard-estudos') renderDashboardEstudos();
    else if (page === 'gestao')             renderGestaoCarto();
  }

  /* ── Dashboard ── */
  function renderDashboard() {
    const el = document.getElementById('dashboard-content');
    const stats = Storage.getStats();

    if (!stats) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <h3>Nenhum simulado registrado ainda</h3>
          <p>Comece adicionando o resultado do primeiro simulado de Bia.</p>
          <button class="btn btn-primary" onclick="App.navigate('novo-simulado')">+ Adicionar Primeiro Simulado</button>
          <br><br>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="Storage.loadSampleData();App.renderPage('dashboard')">Ver com dados de exemplo (S1–S3)</button>
        </div>`;
      return;
    }

    const trendHtml = stats.trend !== null
      ? `<span class="${stats.trend >= 0 ? 'trend-up' : 'trend-down'}">${stats.trend >= 0 ? '▲' : '▼'} ${Math.abs(stats.trend).toFixed(1)}% no último simulado</span>`
      : '<span style="color:var(--text-muted)">Primeiro simulado</span>';

    el.innerHTML = `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-label">Simulados Realizados</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-sub">desde o início</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-icon">📈</div>
          <div class="stat-label">Média Geral</div>
          <div class="stat-value">${stats.overallAvg.toFixed(1)}%</div>
          <div class="stat-sub">${trendHtml}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">🏆</div>
          <div class="stat-label">Melhor Disciplina</div>
          <div class="stat-value" style="font-size:18px;line-height:1.3">${stats.best?.subject || '—'}</div>
          <div class="stat-sub">${stats.best ? stats.best.avg.toFixed(1) + '% de média' : ''}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">⚡</div>
          <div class="stat-label">Maior Prioridade</div>
          <div class="stat-value" style="font-size:18px;line-height:1.3">${stats.worst?.subject || '—'}</div>
          <div class="stat-sub">${stats.worst ? stats.worst.avg.toFixed(1) + '% de média' : ''}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="chart-card">
          <h3>📈 Evolução da Média Geral</h3>
          <div class="chart-wrap"><canvas id="chart-overall"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>🕸 Perfil por Disciplina</h3>
          <div class="chart-wrap"><canvas id="chart-radar"></canvas></div>
        </div>
      </div>

      <div class="chart-card">
        <h3>📊 Média por Disciplina vs Meta</h3>
        <div class="chart-wrap-lg"><canvas id="chart-bar"></canvas></div>
      </div>

      <div class="chart-card">
        <h3>📉 Evolução por Disciplina</h3>
        <div class="chart-wrap"><canvas id="chart-evolution"></canvas></div>
      </div>`;

    setTimeout(() => {
      Charts.overallLine('chart-overall');
      Charts.radar('chart-radar');
      Charts.subjectBar('chart-bar');
      Charts.evolution('chart-evolution');
    }, 50);
  }

  /* ── Cartografias ── */
  function renderCartografias() {
    const el = document.getElementById('cartografias-content');
    const data = Cartografias.getAll();
    const subjects = Object.keys(data);

    let totalAll = 0, doneAll = 0, studyingAll = 0;
    subjects.forEach(s => {
      const p = Cartografias.getSubjectProgress(s);
      totalAll += p.total; doneAll += p.done; studyingAll += p.studying;
    });
    const overallPct = totalAll > 0 ? Math.round(doneAll / totalAll * 100) : 0;

    const cards = subjects.map(subj => {
      const { total, done, studying } = Cartografias.getSubjectProgress(subj);
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      const d = data[subj];
      return `
        <div class="carto-card" onclick="App.showCartografiaModal('${escHtml(subj)}')">
          <div class="carto-card-header" style="background:${d.color}18; border-left: 4px solid ${d.color}">
            <span class="carto-icon">${d.icon}</span>
            <div class="carto-name">${escHtml(subj)}</div>
          </div>
          <div class="carto-progress">
            <div class="carto-stats">
              <span class="carto-done">${done}/${total} tópicos</span>
              <span class="carto-pct" style="color:${d.color}">${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%;background:${d.color}"></div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:5px">${studying > 0 ? studying + ' em revisão · ' : ''}${done} estudados</div>
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="card" style="margin-bottom:22px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:10px">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px">Progresso Total</div>
            <div style="font-size:22px;font-weight:700;margin-top:2px">${doneAll} / ${totalAll} tópicos estudados</div>
          </div>
          <div style="font-size:34px;font-weight:700;color:var(--primary)">${overallPct}%</div>
        </div>
        <div class="progress-bar" style="height:10px">
          <div class="progress-fill" style="width:${overallPct}%;background:var(--primary)"></div>
        </div>
        <div class="carto-legend" style="margin-top:10px">
          <span><span style="color:#9CA3AF;font-size:17px">○</span> Pendente</span>
          <span><span style="color:#F59E0B;font-size:17px">◑</span> Em revisão</span>
          <span><span style="color:#10B981;font-size:17px">●</span> Estudado</span>
          <span style="color:var(--text-muted);margin-left:4px">· Clique em uma disciplina para marcar tópicos</span>
        </div>
      </div>
      <div class="carto-grid">${cards}</div>`;
  }

  function showCartografiaModal(subj) {
    const data = Cartografias.getAll();
    const d = data[subj]; if (!d) return;

    _cartoSubj = subj;
    _cartoFilters = { year: '', fuvest: '', vunesp: '', fgv: '', enem: '', status: '', periodo: [] };

    const anos = Object.keys(d.anos);

    const yearBtns = `<button class="filter-btn active" data-type="year" data-val="" onclick="App.setCartoFilter('year','')">Todos</button>`
      + anos.map(a => `<button class="filter-btn" data-type="year" data-val="${escHtml(a)}" onclick="App.setCartoFilter('year','${escHtml(a).replace(/'/g,"&#39;")}')">${escHtml(a)}</button>`).join('');

    const fuvestBtns = [
      { val: '',  label: 'Todas' },
      { val: 'A', label: 'A — Nas duas fases' },
      { val: 'B', label: 'B — Apenas 2ª fase' },
      { val: 'C', label: 'C — Apenas 1ª fase' },
    ].map(s => `<button class="filter-btn ${s.val===''?'active':''} ${s.val?'fuvest-btn':''}" data-type="fuvest" data-val="${s.val}" onclick="App.setCartoFilter('fuvest','${s.val}')">${escHtml(s.label)}</button>`).join('');

    const vnspBtns = [
      { val: '',  label: 'Todas' },
      { val: 'D', label: 'D — Frequente' },
      { val: 'E', label: 'E — Muito frequente' },
    ].map(s => `<button class="filter-btn ${s.val===''?'active':''} ${s.val?'vunesp-btn':''}" data-type="vunesp" data-val="${s.val}" onclick="App.setCartoFilter('vunesp','${s.val}')">${escHtml(s.label)}</button>`).join('');

    const fgvBtns = [
      { val: '',  label: 'Todas' },
      { val: 'F', label: 'F — Frequente' },
      { val: 'G', label: 'G — Muito frequente' },
    ].map(s => `<button class="filter-btn ${s.val===''?'active':''} ${s.val?'fgv-btn':''}" data-type="fgv" data-val="${s.val}" onclick="App.setCartoFilter('fgv','${s.val}')">${escHtml(s.label)}</button>`).join('');

    const enemBtns = [
      { val: '',  label: 'Todas' },
      { val: 'H', label: 'H — Frequente' },
      { val: 'I', label: 'I — Muito frequente' },
    ].map(s => `<button class="filter-btn ${s.val===''?'active':''} ${s.val?'enem-btn':''}" data-type="enem" data-val="${s.val}" onclick="App.setCartoFilter('enem','${s.val}')">${escHtml(s.label)}</button>`).join('');

    const statusBtns = [
      { val: '',         label: 'Todos'        },
      { val: 'pending',  label: '○ Pendente'   },
      { val: 'studying', label: '◑ Em revisão' },
      { val: 'done',     label: '● Estudado'   },
    ].map(s => `<button class="filter-btn ${s.val===''?'active':''}" data-type="status" data-val="${s.val}" onclick="App.setCartoFilter('status','${s.val}')">${escHtml(s.label)}</button>`).join('');

    const periodoBtns = [{ val: '', label: 'Todos' }, ...Cartografias.PERIODO_OPTIONS.map(p => ({ val: p, label: p }))]
      .map(s => `<button class="filter-btn ${s.val===''?'active':''} periodo-btn" data-type="periodo" data-val="${escHtml(s.val)}" onclick="App.setCartoFilter('periodo',${JSON.stringify(s.val)})">${escHtml(s.label)}</button>`).join('');

    openModal(`${d.icon} ${escHtml(subj)}`, `
      <div class="carto-legend" style="padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:14px">
        <span><span style="color:#9CA3AF">○</span> Pendente</span>
        <span><span style="color:#F59E0B">◑</span> Em revisão</span>
        <span><span style="color:#10B981">●</span> Estudado</span>
        <span style="color:var(--text-muted)">· Clique para alternar</span>
      </div>
      <div class="carto-filters" id="carto-filter-bar">
        <div class="filter-group">
          <span class="filter-label">Ano</span>
          <div class="filter-btns">${yearBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label" style="color:#4F46E5">FUVEST</span>
          <div class="filter-btns">${fuvestBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label" style="color:#DC2626">VUNESP</span>
          <div class="filter-btns">${vnspBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label" style="color:#F97316">FGV</span>
          <div class="filter-btns">${fgvBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label" style="color:#059669">ENEM</span>
          <div class="filter-btns">${enemBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Revisão</span>
          <div class="filter-btns">${statusBtns}</div>
        </div>
        <div class="filter-group">
          <span class="filter-label" style="color:#0F766E">Período</span>
          <div class="filter-btns">${periodoBtns}</div>
        </div>
      </div>
      <div id="carto-topics"></div>`);

    _renderCartoTopics();
  }

  function _renderCartoTopics() {
    const subj = _cartoSubj;
    const { year, fuvest, vunesp, fgv, enem, status, periodo } = _cartoFilters;
    const d = Cartografias.getAll()[subj]; if (!d) return;
    const SC = { pending: '#D1D5DB', studying: '#F59E0B', done: '#10B981' };
    const SL = { pending: '○', studying: '◑', done: '●' };

    const html = Object.entries(d.anos)
      .filter(([ano]) => !year || ano === year)
      .map(([ano, allTopics]) => {
        // Filter each topic individually by its own vestibular classification
        const visibleTopics = allTopics.filter(topic => {
          const rel = Cartografias.getTopicRelevance(subj, ano, topic);
          if (fuvest  && rel.FUVEST !== fuvest) return false;
          if (vunesp  && rel.VUNESP !== vunesp) return false;
          if (fgv     && rel.FGV    !== fgv)    return false;
          if (enem    && rel.ENEM   !== enem)   return false;
          if (status  && Cartografias.getStatus(subj, ano, topic) !== status) return false;
          if (periodo.length && !periodo.includes(Cartografias.getPeriodo(subj, ano, topic))) return false;
          return true;
        });
        if (!visibleTopics.length) return '';

        const doneN = allTopics.filter(t => Cartografias.getStatus(subj, ano, t) === 'done').length;
        const pct   = Math.round(doneN / allTopics.length * 100);

        const items = visibleTopics.map(topic => {
          const rel = Cartografias.getTopicRelevance(subj, ano, topic);
          const st  = Cartografias.getStatus(subj, ano, topic);
          const safeSubj  = escHtml(subj).replace(/'/g, '&#39;');
          const safeAno   = escHtml(ano).replace(/'/g, '&#39;');
          const safeTopic = escHtml(topic).replace(/'/g, '&#39;');
          // Show relevance badges on each topic when a vestibular filter is active
          let badges = '';
          if (fuvest && rel.FUVEST) badges += `<span class="rel-badge rel-fuvest">${rel.FUVEST}</span>`;
          if (vunesp && rel.VUNESP) badges += `<span class="rel-badge rel-vunesp">${rel.VUNESP}</span>`;
          if (fgv    && rel.FGV)    badges += `<span class="rel-badge rel-fgv">${rel.FGV}</span>`;
          if (enem   && rel.ENEM)   badges += `<span class="rel-badge rel-enem">${rel.ENEM}</span>`;
          const per = Cartografias.getPeriodo(subj, ano, topic);
          if (per) badges += `<span class="rel-badge rel-periodo">${escHtml(per)}</span>`;
          return `<div class="topic-item" style="border-left-color:${SC[st]}"
               onclick="App.toggleTopic(this,'${safeSubj}','${safeAno}','${safeTopic}')">
            <span class="topic-status" style="color:${SC[st]}">${SL[st]}</span>
            <span class="topic-name">${escHtml(topic)}${badges}</span>
          </div>`;
        }).join('');

        return `<div class="carto-section" style="margin-bottom:18px" data-ano="${escHtml(ano)}">
          <div class="carto-section-header">
            <span style="font-size:13px;font-weight:600;color:${d.color}">${escHtml(ano)}</span>
            <span style="font-size:12px;color:var(--text-muted)">${doneN}/${allTopics.length} · ${pct}%</span>
          </div>
          <div class="progress-bar" style="margin-bottom:8px">
            <div class="progress-fill" style="width:${pct}%;background:${d.color}"></div>
          </div>
          <div class="topic-list">${items}</div>
        </div>`;
      }).join('');

    const container = document.getElementById('carto-topics');
    if (container) container.innerHTML = html || '<p style="color:var(--text-muted);font-size:14px;text-align:center;padding:24px">Nenhum tópico para este filtro.</p>';
  }

  function setCartoFilter(type, val) {
    if (type === 'periodo') {
      if (val === '') {
        // "Todos" — limpa seleção
        _cartoFilters.periodo = [];
      } else {
        const arr = _cartoFilters.periodo;
        const idx = arr.indexOf(val);
        if (idx === -1) arr.push(val); else arr.splice(idx, 1);
      }
      const isEmpty = _cartoFilters.periodo.length === 0;
      document.querySelectorAll('#carto-filter-bar .filter-btn[data-type="periodo"]').forEach(btn => {
        btn.classList.toggle('active',
          btn.dataset.val === '' ? isEmpty : _cartoFilters.periodo.includes(btn.dataset.val));
      });
      _renderCartoTopics();
      return;
    }
    _cartoFilters[type] = val;
    document.querySelectorAll(`#carto-filter-bar .filter-btn[data-type="${type}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === val);
    });
    _renderCartoTopics();
  }

  function toggleTopic(el, subj, ano, topic) {
    const SC = { pending: '#D1D5DB', studying: '#F59E0B', done: '#10B981' };
    const SL = { pending: '○', studying: '◑', done: '●' };
    const newStatus = Cartografias.toggleStatus(subj, ano, topic);
    el.style.borderLeftColor = SC[newStatus];
    el.querySelector('.topic-status').style.color = SC[newStatus];
    el.querySelector('.topic-status').textContent = SL[newStatus];

    // Update section progress from data (not DOM) to handle filtered views
    const section = el.closest('.carto-section');
    if (section) {
      const allTopics = Cartografias.getAll()[subj]?.anos[ano] || [];
      const doneN = allTopics.filter(t => Cartografias.getStatus(subj, ano, t) === 'done').length;
      const pct   = Math.round(doneN / allTopics.length * 100);
      const header = section.querySelector('.carto-section-header span:last-child');
      const bar    = section.querySelector('.progress-fill');
      if (header) header.textContent = `${doneN}/${allTopics.length} · ${pct}%`;
      if (bar)    bar.style.width = pct + '%';

      // If status filter is active and topic no longer matches the filter, hide it
      if (_cartoFilters.status && _cartoFilters.status !== newStatus) {
        el.style.display = 'none';
        const visible = [...section.querySelectorAll('.topic-item')].filter(i => i.style.display !== 'none');
        if (!visible.length) section.style.display = 'none';
      }
    }
  }

  /* ── Simulados list ── */
  function renderSimulados() {
    const el = document.getElementById('simulados-content');
    const list = Storage.getSimulados().slice().reverse();
    if (!list.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Nenhum simulado</h3><p>Adicione o resultado do primeiro simulado.</p><button class="btn btn-primary" onclick="App.navigate('novo-simulado')">+ Novo Simulado</button></div>`;
      return;
    }
    const rows = list.map(s => {
      const vals = Object.values(s.scores).filter(v => v !== undefined && v !== null && v !== '').map(Number);
      const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const date = new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR');
      const erroTotal = s.erros ? Object.values(s.erros).reduce((a, b) => a + (Number(b)||0), 0) : null;
      return `
        <tr>
          <td><strong>${escHtml(s.name)}</strong></td>
          <td>${date}</td>
          <td><span class="badge badge-${s.type}">${s.type}</span></td>
          <td><span class="score-badge ${scoreClass(avg)}">${avg.toFixed(1)}%</span></td>
          <td>${erroTotal !== null ? `<span style="font-size:12px;color:var(--text-muted)">${erroTotal} erros analisados</span>` : '—'}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-sm btn-outline" onclick="App.viewSimulado('${s.id}')">Ver</button>
            <button class="btn btn-sm btn-ghost"   onclick="App.editSimulado('${s.id}')">Editar</button>
            <button class="btn btn-sm btn-danger"  onclick="App.deleteSimulado('${s.id}')">Excluir</button>
          </td>
        </tr>`;
    }).join('');
    el.innerHTML = `<div class="table-container"><table class="table"><thead><tr><th>Nome</th><th>Data</th><th>Tipo</th><th>Média</th><th>Erros</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* ── Form ── */
  function renderForm(existingId) {
    const el       = document.getElementById('form-content');
    const subjects = Storage.getSubjects();
    const existing = existingId ? Storage.getSimuladoById(existingId) : null;
    editingId = existingId || null;
    document.getElementById('form-page-title').textContent = existingId ? 'Editar Simulado' : 'Novo Simulado';

    const scoreRows = subjects.map(subj => {
      const a = existing?.acertos?.[subj] ?? '';
      const e = existing?.erradas?.[subj] ?? '';
      return `
        <tr data-subj="${escHtml(subj)}">
          <td class="col-disc">${escHtml(subj)}</td>
          <td class="col-num"><input type="number" class="sim-input sim-acerto-input" min="0" placeholder="—" value="${a}" oninput="App.updateSimRow(this)"></td>
          <td class="col-num"><input type="number" class="sim-input sim-erro-input"   min="0" placeholder="—" value="${e}" oninput="App.updateSimRow(this)"></td>
          <td class="col-num sim-row-total">—</td>
          <td class="col-pct sim-row-pct">—</td>
        </tr>`;
    }).join('');

    const erros = existing?.erros || {};

    el.innerHTML = `
      <div class="card">
        <form id="sim-form">
          <div class="form-section">
            <div class="form-section-title">Informações Gerais</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Nome do Simulado *</label>
                <input type="text" class="form-control" name="name" required placeholder="Ex: S4 — FUVEST SAS" value="${escHtml(existing?.name ?? '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Data *</label>
                <input type="date" class="form-control" name="date" required value="${existing?.date ?? new Date().toISOString().slice(0,10)}">
              </div>
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="form-control" name="type">
                  <option value="simulado"   ${existing?.type === 'simulado'   ? 'selected' : ''}>Simulado</option>
                  <option value="prova"      ${existing?.type === 'prova'      ? 'selected' : ''}>Prova</option>
                  <option value="enem"       ${existing?.type === 'enem'       ? 'selected' : ''}>ENEM</option>
                  <option value="vestibular" ${existing?.type === 'vestibular' ? 'selected' : ''}>Vestibular</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Resultado por Disciplina</div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Deixe em branco disciplinas não aplicáveis. Total e % são calculados automaticamente.</p>
            <div class="sim-score-table-wrap">
              <table class="sim-score-table">
                <thead>
                  <tr>
                    <th class="col-disc">Disciplina</th>
                    <th class="col-num">Acertos</th>
                    <th class="col-num">Erros</th>
                    <th class="col-num">Total</th>
                    <th class="col-pct">% Acerto</th>
                  </tr>
                </thead>
                <tbody>${scoreRows}</tbody>
                <tfoot>
                  <tr>
                    <td class="col-disc sim-total-label">Total Geral</td>
                    <td class="col-num" id="sim-total-acertos">—</td>
                    <td class="col-num" id="sim-total-erros">—</td>
                    <td class="col-num" id="sim-total-total">—</td>
                    <td class="col-pct" id="sim-total-pct">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Análise de Erros — Metodologia Escola Mobile</div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Após ver o gabarito, classifique os erros de cada disciplina por causa. Isso orienta o que estudar para o próximo simulado.</p>
            <div class="sim-score-table-wrap">
              <table class="sim-score-table err-table">
                <thead>
                  <tr>
                    <th class="col-disc">Disciplina</th>
                    ${ERR_TYPES.map(t => `<th class="col-err" title="${t.hint}"><span class="err-th-icon">${t.icon}</span><span class="err-th-label" style="color:${t.color}">${t.label}</span></th>`).join('')}
                    <th class="col-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjects.map(subj => {
                    const se = (erros[subj] && typeof erros[subj] === 'object') ? erros[subj] : {};
                    const cells = ERR_TYPES.map(t =>
                      `<td class="col-err"><input type="number" class="sim-input err-cell-input" data-type="${t.key}" min="0" placeholder="—" value="${se[t.key] ?? ''}" oninput="App.updateErrRow(this)"></td>`
                    ).join('');
                    return `<tr data-subj="${escHtml(subj)}" class="err-row">
                      <td class="col-disc">${escHtml(subj)}</td>
                      ${cells}
                      <td class="col-num err-row-total">—</td>
                    </tr>`;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td class="col-disc sim-total-label">Total Geral</td>
                    ${ERR_TYPES.map(t => `<td class="col-err" id="errt-${t.key}">—</td>`).join('')}
                    <td class="col-num" id="errt-total">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Observações</div>
            <div class="form-group">
              <textarea class="form-control" name="notes" rows="3" placeholder="Como foi o simulado? Pontos de atenção para o próximo…">${escHtml(existing?.notes ?? '')}</textarea>
            </div>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button type="button" class="btn btn-ghost" onclick="App.navigate('simulados')">Cancelar</button>
            <button type="submit" class="btn btn-primary">${existingId ? '💾 Salvar Alterações' : '✓ Registrar Simulado'}</button>
          </div>
        </form>
      </div>`;

    document.getElementById('sim-form').addEventListener('submit', handleFormSubmit);

    // Initialize row displays for pre-filled values (edit mode)
    document.querySelectorAll('.sim-score-table tbody tr').forEach(row => {
      const ai = row.querySelector('.sim-acerto-input');
      const ei = row.querySelector('.sim-erro-input');
      if (ai && ei && (ai.value !== '' || ei.value !== '')) updateSimRow(ai);
    });
    _updateSimTotals();

    // Initialize error table row totals (edit mode)
    document.querySelectorAll('.err-table tbody tr').forEach(row => {
      const first = row.querySelector('.err-cell-input');
      if (first) updateErrRow(first);
    });
    _updateErrTotals();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const scores = {}, acertos = {}, erradas = {};
    document.querySelectorAll('.sim-score-table tbody tr').forEach(row => {
      const subj = row.dataset.subj;
      const aEl = row.querySelector('.sim-acerto-input');
      const eEl = row.querySelector('.sim-erro-input');
      if (!aEl || !eEl) return; // skip err-table rows
      const aVal = aEl.value;
      const eVal = eEl.value;
      if (aVal !== '' || eVal !== '') {
        const a = parseInt(aVal) || 0;
        const er = parseInt(eVal) || 0;
        acertos[subj] = a;
        erradas[subj] = er;
        const total = a + er;
        scores[subj] = total > 0 ? Math.round(a / total * 100) : 0;
      }
    });
    const erros = {};
    document.querySelectorAll('.err-table tbody tr').forEach(row => {
      const subj = row.dataset.subj;
      const subjErrs = {};
      let hasAny = false;
      ERR_TYPES.forEach(t => {
        const inp = row.querySelector(`.err-cell-input[data-type="${t.key}"]`);
        if (inp && inp.value !== '') {
          hasAny = true;
          subjErrs[t.key] = parseInt(inp.value) || 0;
        }
      });
      if (hasAny) erros[subj] = subjErrs;
    });
    const payload = { name: fd.get('name'), date: fd.get('date'), type: fd.get('type'), scores, acertos, erradas, erros, notes: fd.get('notes') };

    if (editingId) { Storage.updateSimulado(editingId, payload); toast('Simulado atualizado!', 'success'); }
    else           { Storage.addSimulado(payload);               toast('Simulado registrado!', 'success'); }
    editingId = null;
    navigate('simulados');
  }

  /* ── Sim score table helpers ── */
  function updateSimRow(input) {
    const row  = input.closest('tr');
    const aEl  = row.querySelector('.sim-acerto-input');
    const eEl  = row.querySelector('.sim-erro-input');
    const a    = parseInt(aEl.value) || 0;
    const er   = parseInt(eEl.value) || 0;
    const empty = aEl.value === '' && eEl.value === '';
    const totalEl = row.querySelector('.sim-row-total');
    const pctEl   = row.querySelector('.sim-row-pct');
    if (empty) {
      totalEl.textContent = '—';
      pctEl.textContent   = '—';
      pctEl.style.color   = '';
    } else {
      const total = a + er;
      const pct   = total > 0 ? Math.round(a / total * 100) : 0;
      totalEl.textContent = total;
      if (total > 0) {
        pctEl.textContent = `${pct}%`;
        pctEl.style.color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
      } else {
        pctEl.textContent = '—';
        pctEl.style.color = '';
      }
    }
    _updateSimTotals();
  }

  function _updateSimTotals() {
    const rows = document.querySelectorAll('.sim-score-table tbody tr');
    let totalA = 0, totalE = 0, anyFilled = false;
    rows.forEach(row => {
      const aEl = row.querySelector('.sim-acerto-input');
      const eEl = row.querySelector('.sim-erro-input');
      if (!aEl || !eEl) return; // skip err-table rows that share the wrapper class
      const aVal = aEl.value;
      const eVal = eEl.value;
      if (aVal !== '' || eVal !== '') {
        anyFilled = true;
        totalA += parseInt(aVal) || 0;
        totalE += parseInt(eVal) || 0;
      }
    });
    const totalQ = totalA + totalE;
    const pct    = totalQ > 0 ? Math.round(totalA / totalQ * 100) : 0;
    const taEl   = document.getElementById('sim-total-acertos');
    const teEl   = document.getElementById('sim-total-erros');
    const ttEl   = document.getElementById('sim-total-total');
    const tpEl   = document.getElementById('sim-total-pct');
    if (!taEl) return; // form not in DOM
    taEl.textContent = anyFilled ? totalA  : '—';
    teEl.textContent = anyFilled ? totalE  : '—';
    ttEl.textContent = anyFilled ? totalQ  : '—';
    if (anyFilled && totalQ > 0) {
      tpEl.textContent = `${pct}%`;
      tpEl.style.color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    } else {
      tpEl.textContent = '—';
      tpEl.style.color = '';
    }
  }

  /* ── Error table helpers ── */
  function updateErrRow(input) {
    const row = input.closest('tr');
    let rowTotal = 0, anyFilled = false;
    row.querySelectorAll('.err-cell-input').forEach(inp => {
      if (inp.value !== '') { anyFilled = true; rowTotal += parseInt(inp.value) || 0; }
    });
    const totalEl = row.querySelector('.err-row-total');
    if (totalEl) totalEl.textContent = anyFilled ? rowTotal : '—';
    _updateErrTotals();
  }

  function _updateErrTotals() {
    const colTotals = {};
    ERR_TYPES.forEach(t => { colTotals[t.key] = 0; });
    let grandTotal = 0, anyFilled = false;
    document.querySelectorAll('.err-table tbody tr').forEach(row => {
      ERR_TYPES.forEach(t => {
        const inp = row.querySelector(`.err-cell-input[data-type="${t.key}"]`);
        if (inp && inp.value !== '') {
          anyFilled = true;
          const v = parseInt(inp.value) || 0;
          colTotals[t.key] += v;
          grandTotal += v;
        }
      });
    });
    ERR_TYPES.forEach(t => {
      const el = document.getElementById(`errt-${t.key}`);
      if (el) el.textContent = anyFilled ? colTotals[t.key] : '—';
    });
    const gtEl = document.getElementById('errt-total');
    if (gtEl) gtEl.textContent = anyFilled ? grandTotal : '—';
  }

  /* ── Recomendações ── */
  function renderRecomendacoes() {
    const el = document.getElementById('recomendacoes-content');
    if (!Storage.getStats()) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💡</div><h3>Sem dados suficientes</h3><p>Registre ao menos um simulado para receber recomendações.</p><button class="btn btn-primary" onclick="App.navigate('novo-simulado')">+ Adicionar Simulado</button></div>`;
      return;
    }
    const recs   = Recommendations.generate();
    const plan   = Recommendations.getWeeklyPlan();
    const total  = recs.reduce((s, r) => s + r.hoursPerWeek, 0);
    const urgent = recs.filter(r => r.urgency === 'critical' || r.urgency === 'high').length;
    const urgLabel = { critical:'🔴 Crítico', high:'🟠 Alta', medium:'🟡 Média', low:'🟢 Baixa', achieved:'✅ Meta atingida', unknown:'⚪ Sem dados' };

    // Error analysis summary from all simulados
    const sims = Storage.getSimulados();
    const erroTotals = { nao_sabia: 0, nao_lembrava: 0, atencao: 0, chute: 0, duvida: 0 };
    sims.forEach(s => { if (s.erros) Object.keys(erroTotals).forEach(k => { erroTotals[k] += Number(s.erros[k]) || 0; }); });
    const erroTotal = Object.values(erroTotals).reduce((a, b) => a + b, 0);
    const erroBanner = erroTotal > 0 ? `
      <div class="card" style="margin-bottom:22px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:14px">📊 Análise de Erros Acumulada</h3>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;text-align:center">
          ${[
            ['❌','Não sabia','nao_sabia','#EF4444'],
            ['🔁','Não lembrava','nao_lembrava','#F97316'],
            ['⚠️','Atenção','atencao','#F59E0B'],
            ['🎲','Chute','chute','#8B5CF6'],
            ['🤔','Dúvida','duvida','#06B6D4']
          ].map(([ico, lbl, key, cor]) => {
            const n = erroTotals[key];
            const pct = erroTotal > 0 ? Math.round(n/erroTotal*100) : 0;
            return `<div style="background:${cor}12;border-radius:8px;padding:12px 8px;border-top:3px solid ${cor}">
              <div style="font-size:18px">${ico}</div>
              <div style="font-size:22px;font-weight:700;color:${cor}">${n}</div>
              <div style="font-size:11px;color:var(--text-muted)">${lbl}</div>
              <div style="font-size:11px;font-weight:600;color:${cor}">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          ${erroTotals.nao_sabia >= erroTotals.nao_lembrava && erroTotals.nao_sabia > 0
            ? '📌 Maioria dos erros por conteúdo não visto — priorize novos tópicos na cartografia.'
            : erroTotals.nao_lembrava > 0
              ? '📌 Maioria por falta de revisão — use as Cartografias para marcar o que precisa rever.'
              : ''}
        </p>
      </div>` : '';

    const cards = recs.filter(r => r.avg !== null).map((r, i) => {
      const pClass   = i === 0 ? 'priority-1' : i === 1 ? 'priority-2' : i === 2 ? 'priority-3' : 'priority-n';
      const gapText  = r.gap !== null ? (r.gap > 0 ? `−${r.gap.toFixed(1)}%` : `+${Math.abs(r.gap).toFixed(1)}%`) : '—';
      const gapClass = r.gap !== null ? (r.gap > 0 ? 'gap-neg' : 'gap-pos') : '';
      const trendTxt = r.trend !== null ? ` · ${r.trend >= 0 ? '↑' : '↓'} ${Math.abs(r.trend).toFixed(1)}% na última` : '';
      const chips    = r.tips.slice(0, 3).map(t => `<span style="background:#F1F5F9;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:3px;margin-top:3px;display:inline-block">${escHtml(t)}</span>`).join('');
      return `
        <div class="rec-card">
          <div class="rec-priority ${pClass}">${i + 1}</div>
          <div class="rec-content">
            <div class="rec-subject">${escHtml(r.subject)}</div>
            <div class="rec-detail">${urgLabel[r.urgency]} · ${r.hoursPerWeek}h/semana${trendTxt}</div>
            <div style="margin-top:6px">${chips}</div>
          </div>
          <div class="rec-score-info">
            <div class="rec-current">${r.avg?.toFixed(1) ?? '—'}%</div>
            <div class="rec-goal">meta: ${r.goal}%</div>
            <div class="rec-gap ${gapClass}">${gapText}</div>
          </div>
        </div>`;
    }).join('');

    const planRows = plan.map(day => {
      const chips = day.subjects.map(s => `<span style="background:#EDE9FE;color:#6D28D9;padding:2px 8px;border-radius:4px;font-size:12px;margin-right:3px">${escHtml(s.subject)} ${s.hours}h</span>`).join('') || '<span style="color:var(--text-muted);font-size:12px">Revisão livre</span>';
      return `<tr><td><strong>${day.day}</strong></td><td style="padding-top:8px;padding-bottom:8px">${chips}</td></tr>`;
    }).join('');

    el.innerHTML = `
      ${erroBanner}
      <div class="grid-2">
        <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-label">Horas Recomendadas / Semana</div><div class="stat-value">${total}h</div><div class="stat-sub">distribuídas por disciplina</div></div>
        <div class="stat-card danger"><div class="stat-icon">🚨</div><div class="stat-label">Disciplinas Prioritárias</div><div class="stat-value">${urgent}</div><div class="stat-sub">críticas ou de alta prioridade</div></div>
      </div>
      <div class="card" style="margin-bottom:22px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:14px">🔥 Prioridade de Estudos</h3>
        ${cards || '<p style="color:var(--text-muted)">Sem dados suficientes.</p>'}
      </div>
      <div class="card">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:14px">📅 Sugestão de Plano Semanal</h3>
        <div class="table-container"><table class="table"><thead><tr><th>Dia</th><th>Disciplinas</th></tr></thead><tbody>${planRows}</tbody></table></div>
      </div>`;
  }

  /* ── Cronograma ── */
  function _getVestDates() {
    const entries = [];
    Cartografias.getVestibulares().forEach(v => {
      if (!Array.isArray(v.datas)) return;
      v.datas.forEach(d => {
        if (!d.data) return;
        entries.push({ date: d.data, nome: v.nome, icon: v.icon, cor: v.cor || '#4F46E5', fase: d.fase || '1', tipos: d.tipos || [] });
      });
    });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  }

  function _vestEvCard(e, today) {
    const d        = new Date(e.date + 'T00:00:00');
    const daysLeft = Math.round((d - today) / 86400000);
    const day      = String(d.getDate()).padStart(2, '0');
    const month    = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const TIPO     = { dissertativa: 'Dissertativa', redacao: 'Redação', teste: 'Teste' };
    const tiposStr = e.tipos.map(t => TIPO[t] || t).join(' + ');
    const faseStr  = e.fase === '2' ? '2ª fase' : '1ª fase';
    let txt, cls;
    if      (daysLeft === 0) { txt = 'Hoje!';         cls = 'ev-urgent'; }
    else if (daysLeft === 1) { txt = 'Amanhã!';       cls = 'ev-urgent'; }
    else if (daysLeft <=  7) { txt = `${daysLeft}d`;  cls = 'ev-soon';   }
    else if (daysLeft <   0) { txt = 'Realizado';     cls = '';          }
    else                     { txt = `${daysLeft}d`;  cls = 'ev-ok';     }
    const dateBg = daysLeft < 0 ? 'var(--text-muted)' : e.cor;
    return `
      <div class="event-card">
        <div class="event-date" style="background:${dateBg}">
          <div class="event-day">${day}</div>
          <div class="event-month">${month}</div>
        </div>
        <div class="event-info">
          <div class="event-name">${escHtml(e.icon)} ${escHtml(e.nome)}</div>
          <div class="event-type">${escHtml(faseStr)}${tiposStr ? ' · ' + escHtml(tiposStr) : ''}</div>
        </div>
        <span class="${cls}" style="font-size:13px;font-weight:600;flex-shrink:0;white-space:nowrap">${txt}</span>
      </div>`;
  }

  function renderCronograma() {
    const el    = document.getElementById('cronograma-content');
    const today = new Date(); today.setHours(0,0,0,0);
    const all   = Storage.getEvents();
    const upcoming = all.filter(e => new Date(e.date + 'T00:00:00') >= today);
    const past     = all.filter(e => new Date(e.date + 'T00:00:00') <  today).reverse();

    const vestDates         = _getVestDates();
    const upcomingVest      = vestDates.filter(e => new Date(e.date + 'T00:00:00') >= today);
    const pastVest          = vestDates.filter(e => new Date(e.date + 'T00:00:00') <  today).reverse();


    function evCard(ev) {
      const d = new Date(ev.date + 'T00:00:00');
      const daysLeft = Math.round((d - today) / 86400000);
      const day = String(d.getDate()).padStart(2,'0');
      const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');
      let txt, cls;
      if (daysLeft === 0)      { txt = 'Hoje!';   cls = 'ev-urgent'; }
      else if (daysLeft === 1) { txt = 'Amanhã!'; cls = 'ev-urgent'; }
      else if (daysLeft <= 7)  { txt = `${daysLeft} dias`; cls = 'ev-soon'; }
      else if (daysLeft < 0)   { txt = 'Realizado'; cls = ''; }
      else                     { txt = `${daysLeft} dias`; cls = 'ev-ok'; }
      return `
        <div class="event-card">
          <div class="event-date" style="${daysLeft < 0 ? 'background:var(--text-muted)' : ''}">
            <div class="event-day">${day}</div><div class="event-month">${month}</div>
          </div>
          <div class="event-info">
            <div class="event-name">${escHtml(ev.name)}</div>
            <div class="event-type"><span class="badge badge-${ev.type}">${ev.type}</span>${ev.notes ? ' · ' + escHtml(ev.notes) : ''}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
            <span class="${cls}" style="font-size:13px;font-weight:600">${txt}</span>
            <button class="btn btn-sm btn-danger" onclick="App.deleteEvent('${ev.id}')">✕</button>
          </div>
        </div>`;
    }

    const vestSection = `
      <div class="card" style="margin-bottom:22px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:14px">🏆 Provas e Vestibulares</h3>
        ${upcomingVest.length
          ? `<div class="event-list">${upcomingVest.map(e => _vestEvCard(e, today)).join('')}</div>`
          : `<p style="color:var(--text-muted);font-size:14px">Nenhum vestibular com data cadastrada. <a href="#" onclick="App.navigate('vestibulares');return false" style="color:var(--primary)">Cadastrar datas →</a></p>`
        }
        ${pastVest.length ? `
          <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:12px">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">✓ Realizados</div>
            <div class="event-list">${pastVest.map(e => _vestEvCard(e, today)).join('')}</div>
          </div>` : ''}
      </div>`;

    el.innerHTML = `
      ${vestSection}
      <div style="margin-bottom:18px">
        <button class="btn btn-primary" onclick="App.showAddEventModal()">+ Adicionar Evento</button>
      </div>
      <div class="card" style="margin-bottom:22px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:14px">📅 Próximos Eventos</h3>
        ${upcoming.length ? `<div class="event-list">${upcoming.map(evCard).join('')}</div>` : '<p style="color:var(--text-muted);font-size:14px">Nenhum evento futuro. Adicione acima.</p>'}
      </div>
      ${past.length ? `<div class="card"><h3 style="font-size:15px;font-weight:600;margin-bottom:14px;color:var(--text-muted)">✓ Eventos Passados</h3><div class="event-list">${past.map(evCard).join('')}</div></div>` : ''}`;
  }

  /* ── Vestibulares ── */
  function renderVestibulares() {
    const el   = document.getElementById('vestibulares-content');
    const list = Cartografias.getVestibulares();

    const cards = list.map((v, idx) => `
      <div class="vest-card" style="border-top-color:${v.cor}">
        <div class="vest-header">
          <span class="vest-icon">${v.icon}</span>
          <div style="flex:1;min-width:0">
            <div class="vest-nome" style="color:${v.cor}">${escHtml(v.nome)}</div>
            <div class="vest-desc">${escHtml(v.descricao)}</div>
          </div>
          <div class="vest-card-btns">
            <button class="gestao-btn gestao-btn-edit" title="Editar" onclick="App.vestibularEdit(${idx})">✎</button>
            <button class="gestao-btn gestao-btn-del"  title="Excluir" onclick="App.vestibularDelete(${idx})">✕</button>
          </div>
        </div>
        <div class="vest-rows">
          <div class="vest-row"><span class="vest-row-label">Formato</span><span class="vest-row-val">${escHtml(v.formato)}</span></div>
          <div class="vest-row"><span class="vest-row-label">Datas</span><span class="vest-row-val vest-datas-val">${_fmtDatas(v.datas)}</span></div>
          <div class="vest-row">
            <span class="vest-row-label">Inscrição</span>
            <button class="vest-inscricao-btn ${v.inscricao ? 'inscricao-sim' : 'inscricao-nao'}"
              onclick="App.vestibularToggleInscricao(${idx})">
              ${v.inscricao ? '✅ Sim' : '❌ Não'}
            </button>
          </div>
        </div>
      </div>`).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn btn-primary" onclick="App.vestibularNew()">+ Novo Vestibular</button>
      </div>
      <div class="vest-grid">${cards}</div>`;
  }

  /* ── Vestibulares CRUD ── */
  function _vestDateRow(idx, d) {
    const fase = d?.fase || '1';
    const tipos = d?.tipos || [];
    const chk = (val, lbl) =>
      `<label class="vd-tipo-chk"><input type="checkbox" value="${val}"${tipos.includes(val) ? ' checked' : ''}> ${lbl}</label>`;
    return `<div class="vest-date-row">
      <span class="vest-date-num">${idx + 1}.</span>
      <input type="date" class="vd-date" value="${d?.data || ''}">
      <select class="vd-fase">
        <option value="1"${fase === '1' ? ' selected' : ''}>1ª fase</option>
        <option value="2"${fase === '2' ? ' selected' : ''}>2ª fase</option>
      </select>
      ${chk('dissertativa', 'Dissertativa')}
      ${chk('redacao',      'Redação')}
      ${chk('teste',        'Teste')}
      <button type="button" class="gestao-btn gestao-btn-del" title="Remover" onclick="App.vestibularRemoveDate(this)">✕</button>
    </div>`;
  }

  function _fmtDatas(datas) {
    if (!datas || datas.length === 0) return '—';
    if (typeof datas === 'string') return escHtml(datas); // legado
    const TIPO = { dissertativa: 'Dissertativa', redacao: 'Redação', teste: 'Teste' };
    return datas.map(d => {
      const dt   = d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
      const fase = d.fase === '2' ? '2ª fase' : '1ª fase';
      const tip  = (d.tipos || []).map(t => TIPO[t] || t).join(' + ');
      return `${dt} · ${fase}${tip ? ' · ' + tip : ''}`;
    }).join('<br>');
  }

  function _vestibularForm(v) {
    const field = (id, label, type, val, ph) => {
      const ctrl = type === 'textarea'
        ? `<textarea class="form-control" id="vf-${id}" rows="2" placeholder="${ph}">${escHtml(val || '')}</textarea>`
        : type === 'color'
          ? `<input type="color" class="vf-color" id="vf-${id}" value="${val || '#4F46E5'}">`
          : `<input type="text" class="form-control" id="vf-${id}" value="${escHtml(val || '')}" placeholder="${ph}">`;
      return `<div class="form-group"><label class="form-label">${label}</label>${ctrl}</div>`;
    };
    const existingDates = Array.isArray(v?.datas) ? v.datas : [];
    const dateRows = (existingDates.length > 0 ? existingDates : [null]).map((d, i) => _vestDateRow(i, d)).join('');
    const hideAdd  = existingDates.length >= 4;
    return `
      <div style="display:grid;grid-template-columns:1fr 64px 96px;gap:12px;align-items:end">
        ${field('nome',     'Nome *',  'text',  v?.nome,  'Ex: FUVEST')}
        ${field('icon',     'Ícone',   'text',  v?.icon,  '🎓')}
        <div class="form-group">
          <label class="form-label">Cor</label>
          <input type="color" class="vf-color" id="vf-cor" value="${v?.cor || '#4F46E5'}">
        </div>
      </div>
      ${field('descricao', 'Descrição', 'text',     v?.descricao, 'Ex: Universidade de São Paulo (USP)')}
      ${field('formato',   'Formato',   'textarea', v?.formato,   'Ex: 2 fases: 1ª Múltipla escolha + 2ª Dissertativa')}
      <div class="form-group">
        <label class="form-label">Inscrição Feita</label>
        <select class="form-control" id="vf-inscricao">
          <option value="nao"${!v?.inscricao ? ' selected' : ''}>❌ Não</option>
          <option value="sim"${v?.inscricao  ? ' selected' : ''}>✅ Sim</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Datas <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(1 a 4)</span></label>
        <div class="vest-dates-list" id="vf-dates-list">${dateRows}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="vf-add-date" onclick="App.vestibularAddDate()"${hideAdd ? ' style="display:none"' : ''}>+ Adicionar data</button>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.vestibularSave()">💾 Salvar</button>
      </div>`;
  }

  function vestibularAddDate() {
    const list = document.getElementById('vf-dates-list');
    if (!list) return;
    const count = list.querySelectorAll('.vest-date-row').length;
    if (count >= 4) return;
    list.insertAdjacentHTML('beforeend', _vestDateRow(count, null));
    _vestUpdateDateBtns();
  }

  function vestibularRemoveDate(btn) {
    btn.closest('.vest-date-row')?.remove();
    const list = document.getElementById('vf-dates-list');
    if (!list) return;
    list.querySelectorAll('.vest-date-row').forEach((r, i) => {
      r.querySelector('.vest-date-num').textContent = `${i + 1}.`;
    });
    _vestUpdateDateBtns();
  }

  function _vestUpdateDateBtns() {
    const list = document.getElementById('vf-dates-list');
    if (!list) return;
    const count = list.querySelectorAll('.vest-date-row').length;
    const btn = document.getElementById('vf-add-date');
    if (btn) btn.style.display = count >= 4 ? 'none' : '';
  }

  function vestibularNew() {
    _editingVestIdx = null;
    openModal('+ Novo Vestibular', _vestibularForm(null));
  }

  function vestibularEdit(idx) {
    const v = Cartografias.getVestibulares()[idx];
    if (!v) return;
    _editingVestIdx = idx;
    openModal(`✎ Editar — ${escHtml(v.nome)}`, _vestibularForm(v));
  }

  function vestibularDelete(idx) {
    const v = Cartografias.getVestibulares()[idx];
    if (!v) return;
    if (!confirm(`Excluir "${v.nome}"?\nEsta ação não pode ser desfeita.`)) return;
    Cartografias.deleteVestibular(idx);
    renderVestibulares();
    toast(`"${v.nome}" removido.`, 'success');
  }

  function vestibularToggleInscricao(idx) {
    const v = Cartografias.getVestibulares()[idx];
    if (!v) return;
    Cartografias.updateVestibular(idx, { ...v, inscricao: !v.inscricao });
    renderVestibulares();
  }

  function vestibularSave() {
    const nome = document.getElementById('vf-nome')?.value.trim();
    if (!nome) { toast('O nome é obrigatório.', 'error'); return; }
    const datas = [];
    document.querySelectorAll('#vf-dates-list .vest-date-row').forEach(row => {
      const dt    = row.querySelector('.vd-date')?.value;
      const fase  = row.querySelector('.vd-fase')?.value || '1';
      const tipos = Array.from(row.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
      if (dt) datas.push({ data: dt, fase, tipos });
    });
    const v = {
      nome,
      icon:      document.getElementById('vf-icon')?.value.trim()      || '🎓',
      cor:       document.getElementById('vf-cor')?.value              || '#4F46E5',
      descricao: document.getElementById('vf-descricao')?.value.trim() || '',
      formato:   document.getElementById('vf-formato')?.value.trim()   || '',
      inscricao: document.getElementById('vf-inscricao')?.value === 'sim',
      datas,
    };
    if (_editingVestIdx !== null) {
      Cartografias.updateVestibular(_editingVestIdx, v);
      toast(`"${v.nome}" atualizado.`, 'success');
    } else {
      Cartografias.addVestibular(v);
      toast(`"${v.nome}" adicionado.`, 'success');
    }
    closeModal();
    renderVestibulares();
  }

  /* ── Cronograma de Estudos ── */
  function renderCronogramaEstudos() {
    const el = document.getElementById('estudos-content');
    if (!el) return;
    const schedule = Storage.getSchedule();
    const views = [
      { id:'lista',  label:'☰ Lista'   },
      { id:'semana', label:'📅 Semana'  },
      { id:'mes',    label:'🗓️ Mês'    },
    ];
    const viewBtns = views.map(v =>
      `<button class="sched-view-btn${_schedView===v.id?' active':''}" onclick="App.schedSetView('${v.id}')">${v.label}</button>`
    ).join('');
    let content;
    if      (_schedView === 'lista')  content = _renderSchedList(schedule);
    else if (_schedView === 'semana') content = _renderSchedWeek(schedule);
    else                              content = _renderSchedMonth(schedule);
    el.innerHTML = `
      <div class="sched-toolbar">
        <div class="sched-view-btns">${viewBtns}</div>
        <button class="btn btn-primary" onclick="App.schedAddModal()">+ Adicionar Sessão</button>
      </div>
      <div class="sched-content">${content}</div>`;
  }

  function schedSetView(v)         { _schedView = v; renderCronogramaEstudos(); }
  function schedNavigate(days)     { const d=new Date(_schedRefDate); d.setDate(d.getDate()+days); _schedRefDate=d; renderCronogramaEstudos(); }
  function schedNavigateMonth(delta){ const d=new Date(_schedRefDate); d.setMonth(d.getMonth()+delta); _schedRefDate=d; renderCronogramaEstudos(); }

  function _renderSchedList(schedule) {
    const today = new Date().toISOString().slice(0,10);
    if (!schedule.length) return `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <h3>Nenhuma sessão agendada</h3>
        <p>Planeje seus estudos clicando em "+ Adicionar Sessão".</p>
      </div>`;
    const sorted = [...schedule].sort((a,b) => a.date.localeCompare(b.date));
    const byDate = {};
    sorted.forEach(s => { if (!byDate[s.date]) byDate[s.date]=[]; byDate[s.date].push(s); });
    const upcoming = Object.entries(byDate).filter(([d]) => d >= today);
    const past     = Object.entries(byDate).filter(([d]) => d <  today).reverse();
    const renderGroup = ([date, sessions]) => {
      const d = new Date(date + 'T12:00:00');
      const label = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
      const totalH = sessions.reduce((s,e) => s+(e.hours||0), 0);
      return `<div class="sched-list-group">
        <div class="sched-list-date-hdr">
          <span class="sched-list-date-label">${label}</span>
          <span class="sched-list-date-total">${totalH}h</span>
        </div>
        ${sessions.map(s => _schedSessionCard(s,'full')).join('')}
      </div>`;
    };
    return `
      ${upcoming.length
        ? `<div class="sched-list-section"><div class="sched-list-sec-title">📅 Próximas sessões</div>${upcoming.map(renderGroup).join('')}</div>`
        : '<p style="color:var(--text-muted);font-size:14px;margin-bottom:20px">Nenhuma sessão futura agendada.</p>'}
      ${past.length
        ? `<div class="sched-list-section sched-list-past"><div class="sched-list-sec-title">✓ Realizadas</div>${past.map(renderGroup).join('')}</div>`
        : ''}`;
  }

  function _renderSchedWeek(schedule) {
    const today = new Date(); today.setHours(0,0,0,0);
    const ref   = new Date(_schedRefDate); ref.setHours(0,0,0,0);
    const dow   = ref.getDay();
    const mon   = new Date(ref); mon.setDate(ref.getDate() - (dow===0 ? 6 : dow-1));
    const sun   = new Date(mon); sun.setDate(mon.getDate()+6);
    const fmt   = d => d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    const title = `${fmt(mon)} – ${fmt(sun)} ${sun.getFullYear()}`;
    const DAYS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const cols  = Array.from({length:7}, (_,i) => {
      const d       = new Date(mon); d.setDate(mon.getDate()+i);
      const dateStr = d.toISOString().slice(0,10);
      const isToday = d.getTime()===today.getTime();
      const isPast  = d < today;
      const sessions = schedule.filter(s => s.date===dateStr);
      const totalH   = sessions.reduce((s,e) => s+(e.hours||0), 0);
      return `
        <div class="sched-week-col${isToday?' sched-w-today':''}${isPast?' sched-w-past':''}">
          <div class="sched-week-col-hdr">
            <span class="sched-wday">${DAYS[i]}</span>
            <span class="sched-wdate${isToday?' sched-wdate-today':''}">${String(d.getDate()).padStart(2,'0')}</span>
            ${totalH>0?`<span class="sched-wday-hrs">${totalH}h</span>`:''}
          </div>
          <div class="sched-week-col-body">
            ${sessions.map(s => _schedSessionCard(s,'compact')).join('')}
            <button class="sched-add-day" onclick="App.schedAddModal('${dateStr}')">+</button>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="sched-nav">
        <button class="btn btn-ghost btn-sm" onclick="App.schedNavigate(-7)">‹ Anterior</button>
        <span class="sched-nav-lbl">${title}</span>
        <button class="btn btn-ghost btn-sm" onclick="App.schedNavigate(7)">Próxima ›</button>
      </div>
      <div class="sched-week-wrap"><div class="sched-week-grid">${cols}</div></div>`;
  }

  function _renderSchedMonth(schedule) {
    const ref   = new Date(_schedRefDate);
    const year  = ref.getFullYear(), month = ref.getMonth();
    const title = ref.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const today = new Date(); today.setHours(0,0,0,0);
    const first = new Date(year, month, 1);
    const last  = new Date(year, month+1, 0).getDate();
    const offset = first.getDay()===0 ? 6 : first.getDay()-1;
    const DAYS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const hdrs  = DAYS.map(d=>`<div class="sched-month-hdr">${d}</div>`).join('');
    const empty = Array.from({length:offset},()=>'<div class="sched-mc-empty"></div>').join('');
    const cells = Array.from({length:last},(_,i) => {
      const day     = i+1;
      const date    = new Date(year, month, day);
      const dateStr = date.toISOString().slice(0,10);
      const isToday = date.getTime()===today.getTime();
      const isPast  = date < today;
      const sessions = schedule.filter(s => s.date===dateStr);
      const totalH   = sessions.reduce((s,e) => s+(e.hours||0), 0);
      const pills = sessions.slice(0,3).map(s => {
        const color = Cartografias.getAll()[s.subject]?.color || '#4F46E5';
        const icon  = Cartografias.getAll()[s.subject]?.icon  || '📚';
        return `<div class="sched-mc-pill${s.done?' done':''}" style="background:${color}20;border-left:3px solid ${color}"
          onclick="App.schedEdit('${s.id}');event.stopPropagation()">${icon} ${escHtml(s.subject.substring(0,6))} ${s.hours}h</div>`;
      }).join('');
      const more = sessions.length>3 ? `<div class="sched-mc-more">+${sessions.length-3} mais</div>` : '';
      return `
        <div class="sched-month-cell${isToday?' sched-mc-today':''}${isPast?' sched-mc-past':''}" onclick="App.schedAddModal('${dateStr}')">
          <div class="sched-mc-num">${day}${totalH>0?` <span class="sched-mc-hrs">${totalH}h</span>`:''}</div>
          ${pills}${more}
        </div>`;
    }).join('');
    return `
      <div class="sched-nav">
        <button class="btn btn-ghost btn-sm" onclick="App.schedNavigateMonth(-1)">‹ Anterior</button>
        <span class="sched-nav-lbl">${title}</span>
        <button class="btn btn-ghost btn-sm" onclick="App.schedNavigateMonth(1)">Próximo ›</button>
      </div>
      <div class="sched-month-grid">${hdrs}${empty}${cells}</div>`;
  }

  function _schedSessionCard(s, mode) {
    const cd    = Cartografias.getAll();
    const color = cd[s.subject]?.color || '#4F46E5';
    const icon  = cd[s.subject]?.icon  || '📚';
    const tops  = s.topics?.length
      ? s.topics.slice(0,2).join(', ')+(s.topics.length>2?` +${s.topics.length-2}`:'')
      : '';
    if (mode === 'compact') return `
      <div class="sched-session-compact${s.done?' done':''}" style="border-left-color:${color}">
        <div class="sched-sc-top">
          <span class="sched-sc-subj" style="color:${color}">${escHtml(s.subject)}</span>
          <span class="sched-sc-hrs">${s.hours}h</span>
        </div>
        ${tops?`<div class="sched-sc-topics">${escHtml(tops)}</div>`:''}
        <div class="sched-sc-btns">
          <button class="sched-real-btn${s.done?' sched-real-sim':' sched-real-nao'}" onclick="App.schedToggleDone('${s.id}');event.stopPropagation()">${s.done?'✅ Sim':'❌ Não'}</button>
          <button class="sched-btn-sm" onclick="App.schedEdit('${s.id}');event.stopPropagation()">✎</button>
          <button class="sched-btn-sm danger" onclick="App.schedDelete('${s.id}');event.stopPropagation()">✕</button>
        </div>
      </div>`;
    return `
      <div class="sched-session-full${s.done?' done':''}" style="border-left-color:${color}">
        <div class="sched-sf-row">
          <button class="sched-real-btn-lg${s.done?' sched-real-sim':' sched-real-nao'}" onclick="App.schedToggleDone('${s.id}')">${s.done?'✅ Sim':'❌ Não'}</button>
          <div class="sched-sf-body">
            <div class="sched-sf-top">
              <span>${icon}</span>
              <span class="sched-sf-subj" style="color:${color}">${escHtml(s.subject)}</span>
              <span class="sched-hours-badge">${s.hours}h</span>
            </div>
            ${s.topics?.length?`<div class="sched-sf-topics">${escHtml(s.topics.join(' · '))}</div>`:''}
            ${s.notes?`<div class="sched-sf-notes">${escHtml(s.notes)}</div>`:''}
          </div>
          <div class="sched-sf-btns">
            <button class="gestao-btn gestao-btn-edit" onclick="App.schedEdit('${s.id}')">✎</button>
            <button class="gestao-btn gestao-btn-del"  onclick="App.schedDelete('${s.id}')">✕</button>
          </div>
        </div>
      </div>`;
  }

  function _schedTopicsHtml(subject, selected) {
    const data = Cartografias.getAll()[subject];
    if (!data) return '<p style="font-size:13px;color:var(--text-muted)">Sem tópicos para esta matéria.</p>';
    return Object.entries(data.anos).map(([ano, topics]) => `
      <div class="sf-topic-section">
        <div class="sf-topic-ano">${escHtml(ano)}</div>
        <div class="sf-topic-list">
          ${topics.map(t=>`<label class="sf-topic-chk"><input type="checkbox" value="${escHtml(t)}"${selected.includes(t)?' checked':''}> ${escHtml(t)}</label>`).join('')}
        </div>
      </div>`).join('');
  }

  function schedLoadTopics() {
    const subj = document.getElementById('sf-subject')?.value;
    const wrap = document.getElementById('sf-topics-wrap');
    if (!wrap) return;
    wrap.innerHTML = subj
      ? _schedTopicsHtml(subj, [])
      : '<p style="font-size:13px;color:var(--text-muted)">Selecione uma matéria para ver os tópicos.</p>';
  }

  function _schedForm(entry) {
    const subjects = Storage.getSubjects();
    const subjOpts = `<option value="">— Selecione —</option>`
      + subjects.map(s=>`<option value="${escHtml(s)}"${entry?.subject===s?' selected':''}>${escHtml(s)}</option>`).join('');
    const topicsHtml = entry?.subject
      ? _schedTopicsHtml(entry.subject, entry.topics||[])
      : '<p style="font-size:13px;color:var(--text-muted)">Selecione uma matéria para ver os tópicos.</p>';
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Data *</label>
          <input type="date" class="form-control" id="sf-date" value="${entry?.date||new Date().toISOString().slice(0,10)}">
        </div>
        <div class="form-group">
          <label class="form-label">Horas de Estudo *</label>
          <input type="number" class="form-control" id="sf-hours" min="0.5" max="12" step="0.5" value="${entry?.hours||1.5}">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Matéria *</label>
        <select class="form-control" id="sf-subject" onchange="App.schedLoadTopics()">${subjOpts}</select>
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label class="form-label">Tópicos <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(opcional — pode selecionar vários)</span></label>
        <div id="sf-topics-wrap" class="sf-topics-wrap">${topicsHtml}</div>
      </div>
      <div class="form-group" style="margin-bottom:18px">
        <label class="form-label">Observações</label>
        <textarea class="form-control" id="sf-notes" rows="2" placeholder="Objetivo da sessão, material a usar…">${escHtml(entry?.notes||'')}</textarea>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.schedSave()">💾 Salvar</button>
      </div>`;
  }

  function schedAddModal(date) {
    _editingSchedId = null;
    openModal('+ Nova Sessão de Estudo', _schedForm(date ? { date } : null));
  }

  function schedEdit(id) {
    const entry = Storage.getSchedule().find(e => e.id===id);
    if (!entry) return;
    _editingSchedId = id;
    openModal('✎ Editar Sessão', _schedForm(entry));
  }

  function schedDelete(id) {
    if (!confirm('Excluir esta sessão de estudo?')) return;
    Storage.deleteScheduleEntry(id);
    renderCronogramaEstudos();
    toast('Sessão excluída.', 'success');
  }

  function schedToggleDone(id) {
    const entry = Storage.getSchedule().find(e => e.id===id);
    if (!entry) return;
    Storage.updateScheduleEntry(id, { done: !entry.done });
    renderCronogramaEstudos();
  }

  function schedSave() {
    const date    = document.getElementById('sf-date')?.value;
    const subject = document.getElementById('sf-subject')?.value;
    const hours   = parseFloat(document.getElementById('sf-hours')?.value);
    const notes   = document.getElementById('sf-notes')?.value.trim()||'';
    if (!date)             { toast('Informe a data.',          'error'); return; }
    if (!subject)          { toast('Selecione uma matéria.',   'error'); return; }
    if (!hours||hours<=0)  { toast('Informe as horas.',        'error'); return; }
    const topics = Array.from(document.querySelectorAll('#sf-topics-wrap input[type="checkbox"]:checked')).map(c=>c.value);
    const payload = { date, subject, topics, hours, notes };
    if (_editingSchedId) {
      Storage.updateScheduleEntry(_editingSchedId, payload);
      toast('Sessão atualizada!', 'success');
    } else {
      Storage.addScheduleEntry({ ...payload, done: false });
      toast('Sessão adicionada!', 'success');
    }
    _editingSchedId = null;
    closeModal();
    renderCronogramaEstudos();
  }

  /* ── Dashboard de Estudos ── */
  function renderDashboardEstudos() {
    const el = document.getElementById('dashboard-estudos-content');
    if (!el) return;
    const schedule = Storage.getSchedule();
    const subjects = Storage.getSubjects();
    const cd       = Cartografias.getAll();

    if (!schedule.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <h3>Sem sessões de estudo registradas</h3>
          <p>Adicione sessões no <a href="#" onclick="App.navigate('estudos');return false" style="color:var(--primary)">Cronograma de Estudos</a> para ver o dashboard.</p>
        </div>`;
      return;
    }

    // ── Overall stats ──
    const totalSessions  = schedule.length;
    const doneSessions   = schedule.filter(s => s.done).length;
    const plannedHours   = schedule.reduce((a, s) => a + (s.hours || 0), 0);
    const doneHours      = schedule.filter(s => s.done).reduce((a, s) => a + (s.hours || 0), 0);
    const completionRate = totalSessions > 0 ? Math.round(doneSessions / totalSessions * 100) : 0;

    // ── Per-subject stats ──
    const subjectData = {};
    subjects.forEach(subj => {
      const entries = schedule.filter(s => s.subject === subj);
      if (!entries.length) return;
      const planned = entries.reduce((a, s) => a + (s.hours || 0), 0);
      const done    = entries.filter(s => s.done).reduce((a, s) => a + (s.hours || 0), 0);
      subjectData[subj] = { planned, done, color: cd[subj]?.color || '#4F46E5', icon: cd[subj]?.icon || '📚' };
    });

    // ── Weekly evolution — last 8 weeks ──
    const today = new Date(); today.setHours(0,0,0,0);
    const dow   = today.getDay();
    const daysToMon = dow === 0 ? 6 : dow - 1;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysToMon);

    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(thisMonday); wStart.setDate(thisMonday.getDate() - i * 7);
      const wEnd   = new Date(wStart);     wEnd.setDate(wStart.getDate() + 6);
      const wStartStr = wStart.toISOString().slice(0,10);
      const wEndStr   = wEnd.toISOString().slice(0,10);
      const wSessions = schedule.filter(s => s.date >= wStartStr && s.date <= wEndStr);
      weeks.push({
        label:   wStart.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }),
        planned: wSessions.reduce((a, s) => a + (s.hours||0), 0),
        done:    wSessions.filter(s => s.done).reduce((a, s) => a + (s.hours||0), 0),
      });
    }

    // ── Stat cards ──
    const rateCls = completionRate >= 70 ? ' success' : completionRate >= 40 ? '' : ' danger';
    const statCards = `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-label">Sessões Planejadas</div>
          <div class="stat-value">${totalSessions}</div>
          <div class="stat-sub">${doneSessions} realizadas</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-icon">⏱️</div>
          <div class="stat-label">Horas Planejadas</div>
          <div class="stat-value">${plannedHours.toFixed(1)}h</div>
          <div class="stat-sub">no cronograma</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">✅</div>
          <div class="stat-label">Horas Realizadas</div>
          <div class="stat-value">${doneHours.toFixed(1)}h</div>
          <div class="stat-sub">${plannedHours > 0 ? Math.round(doneHours/plannedHours*100)+'% do planejado' : '—'}</div>
        </div>
        <div class="stat-card${rateCls}">
          <div class="stat-icon">🎯</div>
          <div class="stat-label">Taxa de Conclusão</div>
          <div class="stat-value">${completionRate}%</div>
          <div class="stat-sub">das sessões marcadas</div>
        </div>
      </div>`;

    // ── Subject progress rows ──
    const subjRows = Object.entries(subjectData)
      .sort((a, b) => b[1].planned - a[1].planned)
      .map(([subj, d]) => {
        const pct = d.planned > 0 ? Math.min(Math.round(d.done / d.planned * 100), 100) : 0;
        return `
          <div class="dest-subj-row">
            <div class="dest-subj-info">
              <span>${d.icon}</span>
              <span class="dest-subj-name" style="color:${d.color}">${escHtml(subj)}</span>
            </div>
            <div class="dest-subj-hours">
              <span class="dest-hours-done">${d.done.toFixed(1)}h</span>
              <span class="dest-hours-sep"> / </span>
              <span class="dest-hours-plan">${d.planned.toFixed(1)}h plan.</span>
            </div>
            <div class="dest-subj-bar">
              <div class="dest-bar-fill" style="width:${pct}%;background:${d.color}"></div>
            </div>
            <div class="dest-subj-pct" style="color:${d.color}">${pct}%</div>
          </div>`;
      }).join('');

    el.innerHTML = `
      ${statCards}
      <div class="grid-2">
        <div class="chart-card">
          <h3>📊 Planejado vs Realizado por Matéria</h3>
          <div class="chart-wrap"><canvas id="chart-dest-subj"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>📈 Evolução Semanal — últimas 8 semanas</h3>
          <div class="chart-wrap"><canvas id="chart-dest-week"></canvas></div>
        </div>
      </div>
      <div class="card">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:16px">📚 Detalhamento por Matéria</h3>
        <div class="dest-subj-list">${subjRows || '<p style="color:var(--text-muted);font-size:14px">Nenhuma sessão por matéria ainda.</p>'}</div>
      </div>`;

    setTimeout(() => {
      // Chart 1 — grouped bar: subject planned vs done
      const c1 = document.getElementById('chart-dest-subj');
      if (c1) {
        const ex = Chart.getChart(c1); if (ex) ex.destroy();
        const lbls = Object.keys(subjectData).map(s => s.length > 9 ? s.substring(0,9)+'…' : s);
        new Chart(c1, {
          type: 'bar',
          data: {
            labels: lbls,
            datasets: [
              { label:'Planejado', data: Object.values(subjectData).map(d=>d.planned), backgroundColor:'#6D28D940', borderColor:'#6D28D9', borderWidth:1, borderRadius:4 },
              { label:'Realizado', data: Object.values(subjectData).map(d=>d.done),    backgroundColor:'#10B98140', borderColor:'#10B981', borderWidth:1, borderRadius:4 },
            ]
          },
          options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ font:{ family:'Inter', size:11 } } } },
            scales:{
              x:{ ticks:{ font:{ family:'Inter', size:10 } } },
              y:{ beginAtZero:true, title:{ display:true, text:'Horas', font:{ family:'Inter', size:11 } }, ticks:{ font:{ family:'Inter', size:10 } } }
            }
          }
        });
      }

      // Chart 2 — weekly evolution
      const c2 = document.getElementById('chart-dest-week');
      if (c2) {
        const ex = Chart.getChart(c2); if (ex) ex.destroy();
        new Chart(c2, {
          type: 'bar',
          data: {
            labels: weeks.map(w => w.label),
            datasets: [
              { label:'Planejado', data: weeks.map(w=>w.planned), backgroundColor:'#6D28D940', borderColor:'#6D28D9', borderWidth:1, borderRadius:4 },
              { label:'Realizado', data: weeks.map(w=>w.done),    backgroundColor:'#10B98140', borderColor:'#10B981', borderWidth:1, borderRadius:4 },
            ]
          },
          options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ font:{ family:'Inter', size:11 } } } },
            scales:{
              x:{ ticks:{ font:{ family:'Inter', size:10 } } },
              y:{ beginAtZero:true, title:{ display:true, text:'Horas', font:{ family:'Inter', size:11 } }, ticks:{ font:{ family:'Inter', size:10 } } }
            }
          }
        });
      }
    }, 50);
  }

  /* ── Metas ── */
  function renderMetas() {
    const el       = document.getElementById('metas-content');
    const subjects = Storage.getSubjects();
    const goals    = Storage.getGoals();
    const stats    = Storage.getStats();

    const cards = subjects.map(subj => {
      const goal = goals[subj] || 70;
      const avg  = stats?.subjectStats[subj]?.avg;
      const diff = avg != null ? avg - goal : null;
      let statusHtml = '';
      if (diff !== null) statusHtml = diff >= 0
        ? `<div style="color:var(--success);font-size:12px;margin-top:4px">✓ Meta atingida (+${diff.toFixed(1)}%)</div>`
        : `<div style="color:var(--danger);font-size:12px;margin-top:4px">✗ Faltam ${Math.abs(diff).toFixed(1)}%</div>`;
      const pct = avg != null ? Math.min(avg / goal * 100, 100) : 0;
      const fillColor = diff !== null && diff >= 0 ? 'var(--success)' : 'var(--warning)';
      return `
        <div class="meta-card">
          <div class="meta-subject">${escHtml(subj)}</div>
          <div class="meta-row">
            <span style="font-size:13px;color:var(--text-muted)">Meta:</span>
            <input type="number" class="meta-input" data-subject="${escHtml(subj)}" value="${goal}" min="0" max="100">
            <span style="font-size:13px;color:var(--text-muted)">%</span>
          </div>
          <div style="font-size:13px;color:var(--text-light)">${avg != null ? `Média atual: <strong>${avg.toFixed(1)}%</strong>` : 'Sem dados'}</div>
          ${statusHtml}
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${fillColor}"></div></div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="card">
        <p style="font-size:14px;color:var(--text-light);margin-bottom:20px">Defina a nota mínima por disciplina. As recomendações são calculadas com base nessas metas.</p>
        <div class="meta-grid">${cards}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:20px">
          <button class="btn btn-primary" onclick="App.saveGoals()">💾 Salvar Metas</button>
        </div>
      </div>`;
  }

  function saveGoals() {
    const goals = {};
    document.querySelectorAll('.meta-input').forEach(inp => { goals[inp.dataset.subject] = Number(inp.value) || 70; });
    Storage.saveGoals(goals);
    toast('Metas salvas!', 'success');
    renderMetas();
  }

  /* ── View / edit / delete simulado ── */
  function viewSimulado(id) {
    const s = Storage.getSimuladoById(id); if (!s) return;
    const entries = Object.entries(s.scores).filter(([,v]) => v !== undefined && v !== null && v !== '');
    const avg = entries.length ? entries.reduce((sum,[,v]) => sum + Number(v), 0) / entries.length : 0;
    const date = new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR');
    const rows = entries.map(([subj, score]) => `<tr><td>${escHtml(subj)}</td><td><span class="score-badge ${scoreClass(Number(score))}">${score}%</span></td></tr>`).join('');

    const errosHtml = s.erros ? (() => {
      const e = s.erros;
      const tot = Object.values(e).reduce((a, b) => a + (Number(b)||0), 0);
      return `
        <div style="margin-top:16px">
          <div style="font-size:12px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Análise de Erros (${tot} erros)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${[['❌','Não sabia',e.nao_sabia,'#EF4444'],['🔁','Não lembrava',e.nao_lembrava,'#F97316'],['⚠️','Atenção',e.atencao,'#F59E0B'],['🎲','Chute',e.chute,'#8B5CF6'],['🤔','Dúvida',e.duvida,'#06B6D4']]
              .filter(([,,,, v]) => true)
              .map(([ico,lbl,val,cor]) => `<span style="background:${cor}15;border:1px solid ${cor}40;border-radius:6px;padding:4px 10px;font-size:12px"><strong style="color:${cor}">${ico} ${val||0}</strong> ${lbl}</span>`).join('')}
          </div>
        </div>`;
    })() : '';

    openModal(escHtml(s.name), `
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:14px">${date} · <span class="badge badge-${s.type}">${s.type}</span> · Média: <strong>${avg.toFixed(1)}%</strong></p>
      <table class="subj-table"><thead><tr><th>Disciplina</th><th>Nota</th></tr></thead><tbody>${rows}</tbody></table>
      ${errosHtml}
      ${s.notes ? `<div style="margin-top:14px;padding:12px;background:var(--bg);border-radius:8px;font-size:13px"><strong>Obs:</strong> ${escHtml(s.notes)}</div>` : ''}`);
  }

  function editSimulado(id)    { navigate('novo-simulado'); setTimeout(() => renderForm(id), 60); }
  function deleteSimulado(id)  {
    if (!confirm('Excluir este simulado?')) return;
    Storage.deleteSimulado(id); toast('Simulado excluído.', 'success'); renderSimulados();
  }
  function deleteEvent(id) {
    if (!confirm('Excluir este evento?')) return;
    Storage.deleteEvent(id); toast('Evento excluído.', 'success'); renderCronograma();
  }

  /* ── Add event modal ── */
  function showAddEventModal() {
    openModal('Novo Evento', `
      <form id="event-form">
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Nome *</label>
          <input type="text" class="form-control" name="name" required placeholder="Ex: Prova Bimestral">
        </div>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Data *</label>
          <input type="date" class="form-control" name="date" required value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Tipo</label>
          <select class="form-control" name="type">
            <option value="simulado">Simulado</option><option value="prova">Prova</option>
            <option value="enem">ENEM</option><option value="vestibular">Vestibular</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:18px">
          <label class="form-label">Observações</label>
          <input type="text" class="form-control" name="notes" placeholder="Matérias, local…">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">✓ Adicionar</button>
        </div>
      </form>`);
    document.getElementById('event-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Storage.addEvent({ name: fd.get('name'), date: fd.get('date'), type: fd.get('type'), notes: fd.get('notes') });
      closeModal(); toast('Evento adicionado!', 'success'); renderCronograma();
    });
  }

  /* ── Modal helpers ── */
  function openModal(title, body) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML  = body;
    document.getElementById('modalOverlay').classList.add('active');
  }
  function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

  /* ── Toast ── */
  function toast(msg, type = '') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 3000);
  }

  /* ── Gestão da Cartografia ── */
  let _gestaoSubj = '';

  function renderGestaoCarto() {
    const data = Cartografias.getAll();
    const subjects = Object.keys(data);
    if (!_gestaoSubj || !data[_gestaoSubj]) _gestaoSubj = subjects[0];

    const tabs = subjects.map(s => {
      const active = s === _gestaoSubj ? 'active' : '';
      return `<button class="gestao-tab ${active}" onclick="App.gestaoSelectSubj('${escHtml(s).replace(/'/g,"&#39;")}')">${escHtml(data[s].icon)} ${escHtml(s)}</button>`;
    }).join('');

    const d = data[_gestaoSubj];
    const sections = Object.entries(d.anos).map(([ano, topics]) => {
      const rows = topics.length
        ? topics.map((t, idx) => _gestaoTopicRow(_gestaoSubj, ano, t, idx, topics.length)).join('')
        : `<div class="gestao-empty-section">Nenhum tópico. Adicione um abaixo.</div>`;
      return `
        <div class="gestao-section" data-disc="${escHtml(_gestaoSubj)}" data-ano="${escHtml(ano)}">
          <div class="gestao-section-hdr">
            <span class="gestao-section-title" style="color:${d.color}">${escHtml(ano)}</span>
            <span class="gestao-section-count">${topics.length} tópico${topics.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="gestao-topic-list">${rows}</div>
          <div class="gestao-add-row" id="gadd-${escHtml(ano).replace(/\s/g,'-')}">
            <button class="gestao-btn-add" onclick="App.gestaoShowAdd('${escHtml(ano).replace(/'/g,"&#39;")}')">+ Adicionar tópico</button>
          </div>
        </div>`;
    }).join('');

    document.getElementById('gestao-content').innerHTML = `
      <div class="gestao-tabs">${tabs}</div>
      <div class="gestao-body">${sections}</div>`;
  }

  function _gestaoTopicRow(disc, ano, topic, idx, total) {
    const rel = Cartografias.getTopicRelevance(disc, ano, topic);
    const sd = escHtml(disc).replace(/'/g,"&#39;");
    const sa = escHtml(ano).replace(/'/g,"&#39;");
    const st = escHtml(topic).replace(/'/g,"&#39;");
    const badge = (v, cls) => v ? `<span class="gestao-rel-mini rel-${cls}">${v}</span>` : '';
    const per = Cartografias.getPeriodo(disc, ano, topic);
    const badges = badge(rel.FUVEST,'fuvest') + badge(rel.VUNESP,'vunesp') + badge(rel.FGV,'fgv') + badge(rel.ENEM,'enem')
      + (per ? `<span class="gestao-rel-mini rel-periodo gestao-rel-wide">${escHtml(per)}</span>` : '');
    const canUp   = idx > 0;
    const canDown = idx < total - 1;
    const upBtn   = canUp
      ? `<button class="gestao-btn-ord" title="Mover para cima"  onclick="App.gestaoMoveUp('${sd}','${sa}','${st}')">↑</button>`
      : `<button class="gestao-btn-ord" disabled>↑</button>`;
    const downBtn = canDown
      ? `<button class="gestao-btn-ord" title="Mover para baixo" onclick="App.gestaoMoveDown('${sd}','${sa}','${st}')">↓</button>`
      : `<button class="gestao-btn-ord" disabled>↓</button>`;
    return `<div class="gestao-topic-row" data-topic="${escHtml(topic)}">
      <div class="gestao-ord-btns">${upBtn}${downBtn}</div>
      <span class="gestao-topic-name">${escHtml(topic)}</span>
      <div class="gestao-topic-rel">${badges}</div>
      <div class="gestao-topic-btns">
        <button class="gestao-btn gestao-btn-edit" title="Editar" onclick="App.gestaoStartEdit(this,'${sd}','${sa}','${st}')">✎</button>
        <button class="gestao-btn gestao-btn-del"  title="Excluir" onclick="App.gestaoDelete('${sd}','${sa}','${st}')">✕</button>
      </div>
    </div>`;
  }

  function gestaoSelectSubj(subj) {
    _gestaoSubj = subj;
    renderGestaoCarto();
  }

  function gestaoStartEdit(btn, disc, ano, topic) {
    const rel    = Cartografias.getTopicRelevance(disc, ano, topic);
    const curPer = Cartografias.getPeriodo(disc, ano, topic);
    const row = btn.closest('.gestao-topic-row');
    const sd = escHtml(disc).replace(/'/g,"&#39;");
    const sa = escHtml(ano).replace(/'/g,"&#39;");
    const st = escHtml(topic).replace(/'/g,"&#39;");

    const sel = (id, pairs, cur) => {
      const opts = [['','—'], ...pairs].map(([v, lbl]) =>
        `<option value="${v}" ${(cur ?? '') === v ? 'selected' : ''}>${lbl}</option>`
      ).join('');
      return `<select class="gestao-rel-select ${id}">${opts}</select>`;
    };

    row.innerHTML = `
      <div class="gestao-edit-form">
        <div class="gestao-edit-row1">
          <input class="gestao-edit-input" value="${escHtml(topic)}"
            onkeydown="if(event.key==='Enter')App.gestaoSaveEdit(this.closest('.gestao-topic-row'),'${sd}','${sa}','${st}');if(event.key==='Escape')App.renderGestaoCarto()">
          <button class="gestao-btn gestao-btn-save"
            onclick="App.gestaoSaveEdit(this.closest('.gestao-topic-row'),'${sd}','${sa}','${st}')">✓ Salvar</button>
          <button class="gestao-btn gestao-btn-cancel" onclick="App.renderGestaoCarto()">✕</button>
        </div>
        <div class="gestao-edit-row2">
          <span class="gestao-rel-group">
            <span class="gestao-rel-label-sm" style="color:#4F46E5">FUVEST</span>
            ${sel('gsel-fuvest',[['A','A — Nas duas fases'],['B','B — Só 2ª fase'],['C','C — Só 1ª fase']], rel.FUVEST)}
          </span>
          <span class="gestao-rel-group">
            <span class="gestao-rel-label-sm" style="color:#DC2626">VUNESP</span>
            ${sel('gsel-vunesp',[['D','D — Frequente'],['E','E — Muito freq.']], rel.VUNESP)}
          </span>
          <span class="gestao-rel-group">
            <span class="gestao-rel-label-sm" style="color:#EA580C">FGV</span>
            ${sel('gsel-fgv',[['F','F — Frequente'],['G','G — Muito freq.']], rel.FGV)}
          </span>
          <span class="gestao-rel-group">
            <span class="gestao-rel-label-sm" style="color:#16A34A">ENEM</span>
            ${sel('gsel-enem',[['H','H — Frequente'],['I','I — Muito freq.']], rel.ENEM)}
          </span>
          <span class="gestao-rel-group">
            <span class="gestao-rel-label-sm" style="color:#0F766E">Período</span>
            ${sel('gsel-periodo', Cartografias.PERIODO_OPTIONS.map(p => [p, p]), curPer)}
          </span>
        </div>
      </div>`;
    row.querySelector('input').focus();
    row.querySelector('input').select();
  }

  function gestaoSaveEdit(row, disc, ano, oldTopic) {
    const newName = row.querySelector('.gestao-edit-input').value.trim();
    if (!newName) { toast('Nome não pode estar vazio.', 'error'); return; }
    const rel = {
      FUVEST: row.querySelector('.gsel-fuvest')?.value || null,
      VUNESP: row.querySelector('.gsel-vunesp')?.value || null,
      FGV:    row.querySelector('.gsel-fgv')?.value    || null,
      ENEM:   row.querySelector('.gsel-enem')?.value   || null,
    };
    const periodo = row.querySelector('.gsel-periodo')?.value || null;
    // Rename if name changed
    if (newName !== oldTopic && !Cartografias.renameTopic(disc, ano, oldTopic, newName)) {
      toast('Tópico já existe ou nome inválido.', 'error'); return;
    }
    Cartografias.setTopicRelevance(disc, ano, newName, rel);
    Cartografias.setPeriodo(disc, ano, newName, periodo);
    renderGestaoCarto();
    toast('Tópico atualizado.', 'success');
  }

  function gestaoMoveUp(disc, ano, topic) {
    const topics = Cartografias.getAll()[disc]?.anos[ano];
    if (!topics) return;
    const idx = topics.indexOf(topic);
    if (idx <= 0) return;
    Cartografias.moveTopic(disc, ano, idx, idx - 1);
    renderGestaoCarto();
  }

  function gestaoMoveDown(disc, ano, topic) {
    const topics = Cartografias.getAll()[disc]?.anos[ano];
    if (!topics) return;
    const idx = topics.indexOf(topic);
    if (idx === -1 || idx >= topics.length - 1) return;
    Cartografias.moveTopic(disc, ano, idx, idx + 1);
    renderGestaoCarto();
  }

  function gestaoDelete(disc, ano, topic) {
    if (!confirm(`Excluir "${topic}" de ${disc} — ${ano}?\nO progresso salvo também será removido.`)) return;
    Cartografias.deleteTopic(disc, ano, topic);
    renderGestaoCarto();
    toast('Tópico excluído.', 'success');
  }

  function gestaoShowAdd(ano) {
    const safeAno = ano.replace(/\s/g, '-');
    const container = document.getElementById(`gadd-${safeAno}`);
    if (!container) return;
    const topics = Cartografias.getAll()[_gestaoSubj]?.anos[ano] || [];
    const sa = escHtml(ano).replace(/'/g,"&#39;");
    const posOpts = [
      `<option value="${topics.length}" selected>No final</option>`,
      `<option value="0">No início</option>`,
      ...topics.map((t, i) => `<option value="${i + 1}">Depois de: ${escHtml(t)}</option>`)
    ].join('');
    container.innerHTML = `
      <div class="gestao-add-form">
        <input class="gestao-edit-input" id="ginput-${safeAno}" placeholder="Nome do novo tópico"
          onkeydown="if(event.key==='Enter')App.gestaoConfirmAdd('${sa}');if(event.key==='Escape')App.renderGestaoCarto()">
        <select class="gestao-pos-select" id="gpos-${safeAno}">${posOpts}</select>
        <button class="gestao-btn gestao-btn-save" onclick="App.gestaoConfirmAdd('${sa}')">Adicionar</button>
        <button class="gestao-btn gestao-btn-cancel" onclick="App.renderGestaoCarto()">Cancelar</button>
      </div>`;
    document.getElementById(`ginput-${safeAno}`)?.focus();
  }

  function gestaoConfirmAdd(ano) {
    const safeAno = ano.replace(/\s/g, '-');
    const input = document.getElementById(`ginput-${safeAno}`);
    const posEl = document.getElementById(`gpos-${safeAno}`);
    if (!input) return;
    const name = input.value.trim();
    if (!name) { toast('Nome não pode estar vazio.', 'error'); return; }
    const position = posEl ? parseInt(posEl.value) : undefined;
    if (!Cartografias.addTopic(_gestaoSubj, ano, name, position)) {
      toast('Tópico já existe nesta seção.', 'error'); return;
    }
    renderGestaoCarto();
    toast(`"${name}" adicionado.`, 'success');
  }

  /* ── Utilities ── */
  function scoreClass(n) {
    if (n >= 80) return 'score-excellent'; if (n >= 65) return 'score-good';
    if (n >= 50) return 'score-average';   return 'score-poor';
  }
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return {
    init, navigate, renderPage,
    viewSimulado, editSimulado, deleteSimulado,
    deleteEvent, showAddEventModal,
    openModal, closeModal, saveGoals,
    showCartografiaModal, toggleTopic, setCartoFilter,
    renderGestaoCarto,
    gestaoSelectSubj, gestaoStartEdit, gestaoSaveEdit, gestaoDelete,
    gestaoMoveUp, gestaoMoveDown,
    gestaoShowAdd, gestaoConfirmAdd,
    vestibularNew, vestibularEdit, vestibularDelete, vestibularSave,
    vestibularToggleInscricao,
    vestibularAddDate, vestibularRemoveDate,
    updateSimRow, updateErrRow,
    schedSetView, schedNavigate, schedNavigateMonth,
    schedAddModal, schedEdit, schedDelete, schedToggleDone, schedSave, schedLoadTopics,
    renderDashboardEstudos
  };
})();

document.addEventListener('DOMContentLoaded', async () => {
  // Pull cloud data first — if cloud is newer it updates localStorage before App renders
  await CloudSync.pull();
  App.init();
});
