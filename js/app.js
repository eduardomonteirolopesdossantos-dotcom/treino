const App = (() => {
  let editingId = null;
  let _cartoSubj = '';
  let _cartoFilters = { year: '', fuvest: '', vunesp: '', fgv: '', enem: '', status: '' };
  let _editingVestIdx = null;

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
    else if (page === 'gestao')        renderGestaoCarto();
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

    // School calendar banner
    const today = new Date(); today.setHours(0,0,0,0);
    const cal = Storage.getSchoolCalendar();
    const nextSim = cal.find(s => new Date(s.date + 'T00:00:00') > today);
    const calBanner = nextSim ? (() => {
      const d = new Date(nextSim.date + 'T00:00:00');
      const days = Math.round((d - today) / 86400000);
      return `<div class="school-cal"><h4>📅 Próximo simulado da Escola Mobile</h4>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:20px;font-weight:700;color:#6D28D9">${nextSim.code}</div>
          <div>
            <div style="font-size:14px;font-weight:600">${nextSim.name}</div>
            <div style="font-size:12px;color:#7C3AED">${new Date(nextSim.date + 'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'long'})} · <strong>${days} dias</strong></div>
          </div>
        </div></div>`;
    })() : '';

    el.innerHTML = `
      ${calBanner}
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
    _cartoFilters = { year: '', fuvest: '', vunesp: '', fgv: '', enem: '', status: '' };

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
      </div>
      <div id="carto-topics"></div>`);

    _renderCartoTopics();
  }

  function _renderCartoTopics() {
    const subj = _cartoSubj;
    const { year, fuvest, vunesp, fgv, enem, status } = _cartoFilters;
    const d = Cartografias.getAll()[subj]; if (!d) return;
    const SC = { pending: '#D1D5DB', studying: '#F59E0B', done: '#10B981' };
    const SL = { pending: '○', studying: '◑', done: '●' };

    const html = Object.entries(d.anos)
      .filter(([ano]) => !year || ano === year)
      .map(([ano, allTopics]) => {
        // Filter each topic individually by its own vestibular classification
        const visibleTopics = allTopics.filter(topic => {
          const rel = Cartografias.getTopicRelevance(subj, ano, topic);
          if (fuvest && rel.FUVEST !== fuvest) return false;
          if (vunesp && rel.VUNESP !== vunesp) return false;
          if (fgv    && rel.FGV    !== fgv)    return false;
          if (enem   && rel.ENEM   !== enem)   return false;
          if (status && Cartografias.getStatus(subj, ano, topic) !== status) return false;
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
  function renderCronograma() {
    const el    = document.getElementById('cronograma-content');
    const today = new Date(); today.setHours(0,0,0,0);
    const all   = Storage.getEvents();
    const upcoming = all.filter(e => new Date(e.date + 'T00:00:00') >= today);
    const past     = all.filter(e => new Date(e.date + 'T00:00:00') <  today).reverse();

    // School calendar banner
    const cal = Storage.getSchoolCalendar();
    const sims = Storage.getSimulados();
    const calRows = cal.map(s => {
      const d = new Date(s.date + 'T00:00:00');
      const done = sims.some(sim => sim.date === s.date || sim.name.includes(s.code));
      const isToday = d.getTime() === today.getTime();
      const isPast  = d < today && !isToday;
      const daysLeft = Math.round((d - today) / 86400000);
      let badge = '';
      if (isToday)       badge = '<span class="cal-today">HOJE</span>';
      else if (!isPast && daysLeft <= 30) badge = `<span class="cal-next">${daysLeft}d</span>`;
      return `<div class="cal-row">
        <span class="cal-code">${s.code}</span>
        <span class="cal-date">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span>
        <span class="cal-name">${escHtml(s.name)}</span>
        ${done ? '<span class="cal-done">✓ realizado</span>' : badge}
      </div>`;
    }).join('');

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

    el.innerHTML = `
      <div class="school-cal" style="margin-bottom:22px">
        <h4>📋 Calendário Escola Mobile — Simulados 2026</h4>
        ${calRows}
      </div>
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
          <div class="vest-row"><span class="vest-row-label">Datas</span><span class="vest-row-val">${escHtml(v.datas)}</span></div>
          <div class="vest-row"><span class="vest-row-label">Cálculo</span><span class="vest-row-val">${escHtml(v.peso)}</span></div>
        </div>
      </div>`).join('');

    el.innerHTML = `
      <div class="card" style="margin-bottom:22px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border:none">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:8px;color:#fff">📌 Dica da Escola Mobile</h3>
        <p style="font-size:14px;opacity:.9">Pesquise o edital de cada vestibular que Bia pretende fazer. Os editais do ENEM e FUVEST saem em <strong>julho/agosto</strong>. Verifique datas, formatos e leituras obrigatórias com a Coordenação.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn btn-primary" onclick="App.vestibularNew()">+ Novo Vestibular</button>
      </div>
      <div class="vest-grid">${cards}</div>`;
  }

  /* ── Vestibulares CRUD ── */
  function _vestibularForm(v) {
    const field = (id, label, type, val, ph) => {
      const ctrl = type === 'textarea'
        ? `<textarea class="form-control" id="vf-${id}" rows="2" placeholder="${ph}">${escHtml(val || '')}</textarea>`
        : type === 'color'
          ? `<input type="color" class="form-control vf-color" id="vf-${id}" value="${val || '#4F46E5'}">`
          : `<input type="text" class="form-control" id="vf-${id}" value="${escHtml(val || '')}" placeholder="${ph}">`;
      return `<div class="form-group"><label class="form-label">${label}</label>${ctrl}</div>`;
    };
    return `
      <div style="display:grid;grid-template-columns:1fr 72px 100px;gap:12px">
        ${field('nome',     'Nome *',  'text',     v?.nome,  'Ex: FUVEST')}
        ${field('icon',     'Ícone',   'text',     v?.icon,  '🎓')}
        ${field('cor',      'Cor',     'color',    v?.cor,   '')}
      </div>
      ${field('descricao', 'Descrição',   'text',     v?.descricao, 'Ex: Universidade de São Paulo (USP)')}
      ${field('formato',   'Formato',     'textarea', v?.formato,   'Ex: 2 fases: 1ª Múltipla escolha + 2ª Dissertativa')}
      ${field('datas',     'Datas',       'text',     v?.datas,     'Ex: Jan/Fev (edital a partir de jul/ago)')}
      ${field('peso',      'Cálculo / Peso', 'textarea', v?.peso,  'Ex: 60% FUVEST + 40% ENEM')}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="App.vestibularSave()">💾 Salvar</button>
      </div>`;
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

  function vestibularSave() {
    const nome = document.getElementById('vf-nome')?.value.trim();
    if (!nome) { toast('O nome é obrigatório.', 'error'); return; }
    const v = {
      nome,
      icon:      document.getElementById('vf-icon')?.value.trim()      || '🎓',
      cor:       document.getElementById('vf-cor')?.value              || '#4F46E5',
      descricao: document.getElementById('vf-descricao')?.value.trim() || '',
      formato:   document.getElementById('vf-formato')?.value.trim()   || '',
      datas:     document.getElementById('vf-datas')?.value.trim()     || '',
      peso:      document.getElementById('vf-peso')?.value.trim()      || '',
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
    const badges = badge(rel.FUVEST,'fuvest') + badge(rel.VUNESP,'vunesp') + badge(rel.FGV,'fgv') + badge(rel.ENEM,'enem');
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
    const rel = Cartografias.getTopicRelevance(disc, ano, topic);
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
    // Rename if name changed
    if (newName !== oldTopic && !Cartografias.renameTopic(disc, ano, oldTopic, newName)) {
      toast('Tópico já existe ou nome inválido.', 'error'); return;
    }
    Cartografias.setTopicRelevance(disc, ano, newName, rel);
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
    updateSimRow, updateErrRow
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
