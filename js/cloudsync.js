// CloudSync — sincronização automática com Cloudflare KV
// Lê todos os localStorage keys que começam com "vestibular_" e
// salva/carrega como um bundle JSON via /api/storage
const CloudSync = (() => {
  const API    = '/api/storage';
  const TS_KEY = '_vest_cloud_ts';
  let   _timer = null;

  /* ── Bundle: captura todos os dados do localStorage ── */
  function _bundle() {
    const obj = { _ts: Date.now() };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vestibular_')) obj[k] = localStorage.getItem(k);
    }
    return obj;
  }

  /* ── Unbundle: restaura dados do cloud para localStorage ── */
  function _unbundle(obj) {
    if (!obj || !obj._ts) return;
    Object.keys(obj).forEach(k => {
      if (k.startsWith('vestibular_')) _origSet(k, obj[k]);
    });
    _origSet(TS_KEY, String(obj._ts));
  }

  /* ── Indicador visual no rodapé ── */
  function _status(s) {
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    const MAP = {
      idle:   ['☁️',  'Dados na nuvem — clique para forçar sincronização'],
      saving: ['🔄', 'Salvando na nuvem…'],
      saved:  ['✅',  'Salvo na nuvem'],
      error:  ['⚠️', 'Erro ao sincronizar — clique para tentar novamente'],
      noconn: ['📴', 'Sem conexão — dados salvos localmente'],
    };
    const [icon, title] = MAP[s] || MAP.idle;
    el.textContent = icon;
    el.title       = title;
  }

  /* ── Push: envia dados locais para o KV ── */
  async function push() {
    _status('saving');
    try {
      const bundle = _bundle();
      const r = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(bundle),
      });
      if (r.ok) {
        const resp = await r.json().catch(() => ({}));
        if (resp.ok === true) {
          _origSet(TS_KEY, String(bundle._ts));
          _status('saved');
          setTimeout(() => _status('idle'), 3000);
        } else {
          // Worker respondeu 200 mas KV não estava configurado
          console.warn('[CloudSync] push: worker sem KV binding', resp);
          _status('error');
        }
      } else {
        _status('error');
      }
    } catch {
      _status(navigator.onLine ? 'error' : 'noconn');
    }
  }

  /* ── Toast: mensagem rápida de feedback ── */
  function _toast(msg, color = '#2563eb') {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: color, color: '#fff', padding: '10px 22px', borderRadius: '8px',
      fontSize: '14px', fontWeight: '500', zIndex: '9999',
      boxShadow: '0 4px 16px rgba(0,0,0,.2)', transition: 'opacity .4s',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3000);
  }

  /* ── Pull: carrega dados do KV (apenas se mais recentes) ── */
  async function pull() {
    try {
      const r = await fetch(API, { cache: 'no-store' });
      if (!r.ok) return false;
      const cloud = await r.json();
      if (!cloud || !cloud._ts) return false;

      const localTs = parseInt(localStorage.getItem(TS_KEY) || '0', 10);
      const hasLocal = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
                            .some(k => k && k.startsWith('vestibular_'));

      // Carrega do cloud se: não tem dados locais OU cloud é mais recente
      if (!hasLocal || cloud._ts > localTs) {
        _unbundle(cloud);
        // Mostra toast DEPOIS que o DOM estiver pronto
        setTimeout(() => _toast('☁️ Dados carregados da nuvem!'), 800);
        return true; // sinaliza que app deve re-renderizar
      }
      // Dados locais são mais recentes — envia para sincronizar o cloud
      if (hasLocal && localTs > cloud._ts) schedulePush();
      return false;
    } catch {
      return false;
    }
  }

  /* ── schedulePush: debounce de 2.5s para não sobrecarregar ── */
  function schedulePush() {
    clearTimeout(_timer);
    _timer = setTimeout(push, 2500);
  }

  /* ── Hook automático: intercepta localStorage.setItem ── */
  const _origSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    _origSet(key, value);
    if (key.startsWith('vestibular_')) schedulePush();
  };

  return { push, pull, schedulePush };
})();
