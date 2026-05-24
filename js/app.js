const App = (() => {
  let editingId = null;
  let _cartoSubj = '';
  let _cartoFilters = { year: '', fuvest: '', vunesp: '', fgv: '', enem: '', status: '' };

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

    const scoreInputs = subjects.map(subj => `
      <div class="score-item">
        <div class="score-label">${escHtml(subj)}</div>
        <div class="score-wrap">
          <input type="number" class="score-input" name="score_${escHtml(subj)}" min="0" max="100" placeholder="—" value="${existing?.scores[subj] ?? ''}">
          <span class="score-max">/100</span>
        </div>
      </div>`).join('');

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
            <div class="form-section-title">Notas por Disciplina (0–100)</div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Deixe em branco disciplinas não aplicáveis a este simulado.</p>
            <div class="score-grid">${scoreInputs}</div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Análise de Erros — Metodologia Escola Mobile</div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Após ver o gabarito, classifique o total de erros por causa. Isso orienta o que estudar para o próximo simulado.</p>
            <div class="error-grid">
              <div class="error-item">
                <div class="error-label" style="color:#EF4444">❌ Não sabia</div>
                <input type="number" class="error-input err-naosab" name="err_nao_sabia" min="0" placeholder="0" value="${erros.nao_sabia ?? ''}">
                <div style="font-size:10px;color:var(--text-muted);text-align:center">conteúdo novo</div>
              </div>
              <div class="error-item">
                <div class="error-label" style="color:#F97316">🔁 Não lembrava</div>
                <input type="number" class="error-input err-naolem" name="err_nao_lembrava" min="0" placeholder="0" value="${erros.nao_lembrava ?? ''}">
                <div style="font-size:10px;color:var(--text-muted);text-align:center">revisar cartografia</div>
              </div>
              <div class="error-item">
                <div class="error-label" style="color:#F59E0B">⚠️ Atenção</div>
                <input type="number" class="error-input err-atenc" name="err_atencao" min="0" placeholder="0" value="${erros.atencao ?? ''}">
                <div style="font-size:10px;color:var(--text-muted);text-align:center">erro de distração</div>
              </div>
              <div class="error-item">
                <div class="error-label" style="color:#8B5CF6">🎲 Chute</div>
                <input type="number" class="error-input err-chute" name="err_chute" min="0" placeholder="0" value="${erros.chute ?? ''}">
                <div style="font-size:10px;color:var(--text-muted);text-align:center">sem base</div>
              </div>
              <div class="error-item">
                <div class="error-label" style="color:#06B6D4">🤔 Dúvida</div>
                <input type="number" class="error-input err-duvida" name="err_duvida" min="0" placeholder="0" value="${erros.duvida ?? ''}">
                <div style="font-size:10px;color:var(--text-muted);text-align:center">entre alternativas</div>
              </div>
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
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const scores = {};
    Storage.getSubjects().forEach(subj => {
      const v = fd.get(`score_${subj}`);
      if (v !== '' && v !== null) scores[subj] = Number(v);
    });
    const erros = {
      nao_sabia:    Number(fd.get('err_nao_sabia'))    || 0,
      nao_lembrava: Number(fd.get('err_nao_lembrava')) || 0,
      atencao:      Number(fd.get('err_atencao'))      || 0,
      chute:        Number(fd.get('err_chute'))        || 0,
      duvida:       Number(fd.get('err_duvida'))       || 0,
    };
    const payload = { name: fd.get('name'), date: fd.get('date'), type: fd.get('type'), scores, erros, notes: fd.get('notes') };

    if (editingId) { Storage.updateSimulado(editingId, payload); toast('Simulado atualizado!', 'success'); }
    else           { Storage.addSimulado(payload);               toast('Simulado registrado!', 'success'); }
    editingId = null;
    navigate('simulados');
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

    const cards = list.map(v => `
      <div class="vest-card" style="border-top-color:${v.cor}">
        <div class="vest-header">
          <span class="vest-icon">${v.icon}</span>
          <div>
            <div class="vest-nome" style="color:${v.cor}">${escHtml(v.nome)}</div>
            <div class="vest-desc">${escHtml(v.descricao)}</div>
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
      <div class="vest-grid">${cards}</div>`;
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
        ? topics.map(t => _gestaoTopicRow(_gestaoSubj, ano, t)).join('')
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

  function _gestaoTopicRow(disc, ano, topic) {
    const sd = escHtml(disc).replace(/'/g,"&#39;");
    const sa = escHtml(ano).replace(/'/g,"&#39;");
    const st = escHtml(topic).replace(/'/g,"&#39;");
    return `<div class="gestao-topic-row" data-topic="${escHtml(topic)}">
      <span class="gestao-topic-name">${escHtml(topic)}</span>
      <div class="gestao-topic-btns">
        <button class="gestao-btn gestao-btn-edit" title="Renomear" onclick="App.gestaoStartEdit(this,'${sd}','${sa}','${st}')">✎</button>
        <button class="gestao-btn gestao-btn-del"  title="Excluir"  onclick="App.gestaoDelete('${sd}','${sa}','${st}')">✕</button>
      </div>
    </div>`;
  }

  function gestaoSelectSubj(subj) {
    _gestaoSubj = subj;
    renderGestaoCarto();
  }

  function gestaoStartEdit(btn, disc, ano, topic) {
    const row = btn.closest('.gestao-topic-row');
    row.innerHTML = `
      <input class="gestao-edit-input" value="${escHtml(topic)}" onkeydown="if(event.key==='Enter')App.gestaoSaveEdit(this,'${disc.replace(/'/g,"&#39;")}','${ano.replace(/'/g,"&#39;")}','${topic.replace(/'/g,"&#39;")}');if(event.key==='Escape')App.renderGestaoCarto()">
      <div class="gestao-topic-btns">
        <button class="gestao-btn gestao-btn-save" onclick="App.gestaoSaveEdit(this.closest('.gestao-topic-row').querySelector('input'),'${disc.replace(/'/g,"&#39;")}','${ano.replace(/'/g,"&#39;")}','${topic.replace(/'/g,"&#39;")}')">✓</button>
        <button class="gestao-btn gestao-btn-cancel" onclick="App.renderGestaoCarto()">✕</button>
      </div>`;
    row.querySelector('input').focus();
    row.querySelector('input').select();
  }

  function gestaoSaveEdit(input, disc, ano, oldTopic) {
    const newName = input.value.trim();
    if (!newName) { showToast('Nome não pode estar vazio.', 'error'); return; }
    if (!Cartografias.renameTopic(disc, ano, oldTopic, newName)) {
      showToast('Tópico já existe ou nome inválido.', 'error'); return;
    }
    renderGestaoCarto();
    showToast('Tópico renomeado.', 'success');
  }

  function gestaoDelete(disc, ano, topic) {
    if (!confirm(`Excluir "${topic}" de ${disc} — ${ano}?\nO progresso salvo também será removido.`)) return;
    Cartografias.deleteTopic(disc, ano, topic);
    renderGestaoCarto();
    showToast('Tópico excluído.', 'success');
  }

  function gestaoShowAdd(ano) {
    const safeAno = ano.replace(/\s/g, '-');
    const container = document.getElementById(`gadd-${safeAno}`);
    if (!container) return;
    container.innerHTML = `
      <div class="gestao-add-form">
        <input class="gestao-edit-input" id="ginput-${safeAno}" placeholder="Nome do novo tópico" onkeydown="if(event.key==='Enter')App.gestaoConfirmAdd('${escHtml(ano).replace(/'/g,"&#39;")}');if(event.key==='Escape')App.renderGestaoCarto()">
        <button class="gestao-btn gestao-btn-save" onclick="App.gestaoConfirmAdd('${escHtml(ano).replace(/'/g,"&#39;")}')">Adicionar</button>
        <button class="gestao-btn gestao-btn-cancel" onclick="App.renderGestaoCarto()">Cancelar</button>
      </div>`;
    document.getElementById(`ginput-${safeAno}`)?.focus();
  }

  function gestaoConfirmAdd(ano) {
    const safeAno = ano.replace(/\s/g, '-');
    const input = document.getElementById(`ginput-${safeAno}`);
    if (!input) return;
    const name = input.value.trim();
    if (!name) { showToast('Nome não pode estar vazio.', 'error'); return; }
    if (!Cartografias.addTopic(_gestaoSubj, ano, name)) {
      showToast('Tópico já existe nesta seção.', 'error'); return;
    }
    renderGestaoCarto();
    showToast(`"${name}" adicionado.`, 'success');
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
    gestaoShowAdd, gestaoConfirmAdd
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
