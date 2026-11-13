// ╔══════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO                                            ║
// ╚══════════════════════════════════════════════════════════╝
const CONFIG = {
  // Onde está o JSON gerado pelo Power Automate.
  // Padrão: o dados.json deste mesmo repositório.
  // Também aceita uma URL da API do GitHub
  // (https://api.github.com/repos/<dono>/<repo>/contents/dados.json),
  // desde que o repositório seja público.
  DATA_URL: './dados.json',

  // Logo do Movimento Soberana (branca = fundo escuro, preta = fundo claro)
  LOGO_URL: './LOGOTIPO.png',
  LOGO_URL_LIGHT: './LOGOTIPO_dark.png',

  // De quanto em quanto tempo o site confere se o dados.json mudou (1 minuto)
  POLL_INTERVAL: 60 * 1000,

  // Duração da animação dos números em ms
  NUMBER_ANIM_DURATION: 1200,

  // ── MODO TV ──
  TV_SCROLL_SPEED: 45,
  TV_DWELL_TOP_SCROLL: 3000,
  TV_DWELL_STATIC: 10000,
  TV_DWELL_BOTTOM: 2500,
  TV_DWELL_END: 1500,
};

// ╔══════════════════════════════════════════════════════════╗
// ║  DADOS DAS EQUIPES                                       ║
// ╚══════════════════════════════════════════════════════════╝
const TEAMS = {
  'ODONTOLOGIA':          { color:'#00276f', emoji:'🦷' },
  'FARMÁCIA':             { color:'#328ac4', emoji:'💊' },
  'ENFERMAGEM':           { color:'#013f33', emoji:'🏥' },
  'PSICOLOGIA':           { color:'#540b55', emoji:'🧠' },
  'TERAPIA OCUPACIONAL':  { color:'#aa402f', emoji:'🤲' },
  'MEDICINA VETERINÁRIA': { color:'#4b331e', emoji:'🐾' },
  'BIOMEDICINA':          { color:'#4a9b9f', emoji:'🔬' },
  'ESTÉTICA E COSMÉTICA': { color:'#6c0c0a', emoji:'✨' },
  'GESTÃO HOSPITALAR':    { color:'#474747', emoji:'🏨' },
};
const UNKNOWN_TEAM = { color:'#6366f1', emoji:'🎓' };

// Versões claras das cores (para fundo escuro)
const COLORS_ON_DARK = {
  '#00276f': '#4d7abf',
  '#013f33': '#2eb89a',
  '#328ac4': '#5eaee0',
  '#540b55': '#b44db5',
  '#aa402f': '#e07060',
  '#4b331e': '#c49070',
  '#4a9b9f': '#6ec4c8',
  '#6c0c0a': '#d45450',
  '#474747': '#a0a0a0',
  '#6366f1': '#a5b4fc',
};
// Versões escuras das cores (para fundo claro)
const COLORS_ON_LIGHT = {
  '#00276f': '#00276f',
  '#013f33': '#013f33',
  '#328ac4': '#1a6fa0',
  '#540b55': '#540b55',
  '#aa402f': '#8a3020',
  '#4b331e': '#4b331e',
  '#4a9b9f': '#2e7578',
  '#6c0c0a': '#6c0c0a',
  '#474747': '#333333',
  '#6366f1': '#4338ca',
};
function isDark() { return document.documentElement.getAttribute('data-theme') !== 'light'; }
function lightColor(c) { return (isDark() ? COLORS_ON_DARK[c] : COLORS_ON_LIGHT[c]) || c; }

// ╔══════════════════════════════════════════════════════════╗
// ║  TEMA CLARO / ESCURO                                     ║
// ╚══════════════════════════════════════════════════════════╝
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeBtn');
  btn.textContent = theme === 'light' ? '☀️' : '🌙';
  // Troca a logo conforme o tema
  const img = document.getElementById('logo');
  if (img) img.src = theme === 'light' ? CONFIG.LOGO_URL_LIGHT : CONFIG.LOGO_URL;
  try { localStorage.setItem('soberana-theme', theme); } catch(e) {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  // Re-renderiza para atualizar as cores inline (sem buscar os dados de novo)
  if (lastData) render(lastData);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  LOGO                                                    ║
// ╚══════════════════════════════════════════════════════════╝
(function initLogo() {
  const img = document.getElementById('logo');
  const ph = document.getElementById('logoPh');
  img.onload = () => { img.classList.add('show'); ph.classList.add('hide'); };
  img.onerror = () => { img.classList.remove('show'); ph.classList.remove('hide'); };
})();

// Aplica tema salvo ou padrão escuro (também define a logo)
(function initTheme() {
  let saved = 'dark';
  try { saved = localStorage.getItem('soberana-theme') || 'dark'; } catch(e) {}
  applyTheme(saved);
})();

// ╔══════════════════════════════════════════════════════════╗
// ║  LEITURA DO dados.json                                   ║
// ║  Formato esperado: uma lista com curso e nota, ex.:      ║
// ║  [ { "CURSO": "ODONTOLOGIA", "NOTA": 867.5 }, ... ]      ║
// ║  Os nomes das colunas podem variar (ver regras abaixo).  ║
// ╚══════════════════════════════════════════════════════════╝
const NAME_KEY  = /curso|workshop|equipe|time|nome/i;
const SCORE_KEY = /nota|pontua|pontos|total|score|valor/i;

// Aceita número ou texto ("50.0000", "1.234,5", "12,5")
function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let s = v.trim();
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Remove acentos e padroniza para comparar nomes de curso
function normName(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}
const TEAM_BY_NORM = {};
Object.keys(TEAMS).forEach(k => { TEAM_BY_NORM[normName(k)] = k; });

// Encontra a lista de linhas dentro do JSON, seja qual for o "envelope"
function findRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const arrays = Object.values(raw).filter(Array.isArray);
    if (arrays.length) return arrays.find(a => a.length) || arrays[0];
    // Objeto simples do tipo { "ODONTOLOGIA": 867.5, ... }
    return Object.entries(raw).map(([k, v]) => ({ CURSO: k, NOTA: v }));
  }
  return [];
}

function readRow(row) {
  if (!row || typeof row !== 'object') return null;
  const keys = Object.keys(row);

  let nameKey = keys.find(k => NAME_KEY.test(k) && typeof row[k] === 'string');
  if (!nameKey) nameKey = keys.find(k => typeof row[k] === 'string' && toNumber(row[k]) === null);
  if (!nameKey) return null;

  let scoreKey = keys.find(k => k !== nameKey && SCORE_KEY.test(k) && toNumber(row[k]) !== null);
  if (!scoreKey) scoreKey = keys.find(k => k !== nameKey && toNumber(row[k]) !== null);

  const name = String(row[nameKey]).trim();
  if (!name) return null;
  return { name, score: scoreKey ? toNumber(row[scoreKey]) : 0 };
}

function processData(raw) {
  const byCourse = new Map();
  for (const row of findRows(raw)) {
    const r = readRow(row);
    if (!r) continue;
    const norm = normName(r.name);
    const curso = TEAM_BY_NORM[norm] || r.name.toUpperCase();
    // A nota do dados.json já é a nota final: nada é somado.
    // Se o mesmo curso aparecer mais de uma vez, vale a última linha.
    byCourse.set(norm, { curso, total: r.score, ...(TEAMS[curso] || UNKNOWN_TEAM) });
  }

  const teams = [...byCourse.values()];
  teams.forEach(t => { t.total = Math.round(t.total * 100) / 100; });
  teams.sort((a, b) => b.total - a.total || a.curso.localeCompare(b.curso, 'pt-BR'));
  // Cursos empatados ficam na mesma posição
  teams.forEach((t, i) => { t.rank = i > 0 && teams[i - 1].total === t.total ? teams[i - 1].rank : i + 1; });

  const maxTotal = teams.length ? Math.max(...teams.map(t => t.total)) : 0;
  return { teams, maxTotal };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ANIMAÇÃO DE NÚMEROS                                     ║
// ╚══════════════════════════════════════════════════════════╝
const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function animateNumber(el, target, duration = CONFIG.NUMBER_ANIM_DURATION) {
  if (!el) return;
  const start = parseFloat(el.dataset.val || '0');
  el.dataset.val = target;
  if (Math.abs(start - target) < 0.005) { el.textContent = fmt(target); return; }
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = p < 1 ? fmt(Math.round(start + (target - start) * eased)) : fmt(target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RENDERIZAÇÃO — classificação                            ║
// ╚══════════════════════════════════════════════════════════╝
let lastData = null;
let prevTotals = {};

function render(data) {
  const pane = document.getElementById('content');
  const n = data.teams.length;
  let html = '';

  html += '<div class="section-title">Classificação</div>';
  if (!n) {
    html += '<div class="msg">Ainda não há pontuações registradas.</div>';
  } else {
    html += '<ol class="rank-list">';
    data.teams.forEach((t, idx) => {
      const lc = lightColor(t.color);
      const prev = prevTotals[t.curso] || 0;
      const pct = v => (data.maxTotal > 0 ? Math.max(0, v) / data.maxTotal * 100 : 0).toFixed(1);
      html += '<li class="rank-row' + (t.rank <= 3 ? ' top' + t.rank : '') + '" style="--row-color:' + t.color + ';background:' + t.color + '25;color:' + lc + '">';
      html += '<span class="rank-pos">' + t.rank + '°</span>';
      html += '<span class="rank-name">' + t.emoji + ' ' + esc(t.curso) + '</span>';
      html += '<div class="rank-bar-wrap"><div class="rank-bar" data-anim="bar' + idx + '" data-pct="' + pct(t.total) + '" style="width:' + pct(prev) + '%;background:' + lc + '"></div></div>';
      html += '<span class="rank-val" data-anim="val' + idx + '" data-val="' + prev + '">' + fmt(prev) + '</span>';
      html += '</li>';
    });
    html += '</ol>';
  }

  pane.innerHTML = html;
  pane.classList.add('on');
  void pane.offsetWidth;

  requestAnimationFrame(() => {
    data.teams.forEach((t, idx) => {
      animateNumber(pane.querySelector('[data-anim="val' + idx + '"]'), t.total);
      const bar = pane.querySelector('[data-anim="bar' + idx + '"]');
      if (bar) bar.style.width = bar.dataset.pct + '%';
    });
  });

  prevTotals = {};
  data.teams.forEach(t => { prevTotals[t.curso] = t.total; });
}

function renderError() {
  const pane = document.getElementById('content');
  pane.innerHTML = '<div class="msg">Não foi possível carregar a pontuação. Nova tentativa na próxima atualização.</div>';
  pane.classList.add('on');
}

// ╔══════════════════════════════════════════════════════════╗
// ║  MODO TV — rolagem lenta quando a lista não cabe na tela ║
// ╚══════════════════════════════════════════════════════════╝
let tvOn = false;
let tvRun = 0;

function tvWait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function tvScrollTo(to, id) {
  return new Promise(res => {
    const from = window.scrollY;
    const dist = Math.abs(to - from);
    if (dist < 2) return res();
    const dur = dist / CONFIG.TV_SCROLL_SPEED * 1000;
    const t0 = performance.now();
    function step(now) {
      if (id !== tvRun) return res();
      const p = Math.min((now - t0) / dur, 1);
      const eased = 0.5 - Math.cos(p * Math.PI) / 2;
      window.scrollTo(0, from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step); else res();
    }
    requestAnimationFrame(step);
  });
}

async function tvLoop(id) {
  while (id === tvRun) {
    window.scrollTo(0, 0);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll > 8) {
      await tvWait(CONFIG.TV_DWELL_TOP_SCROLL);                  if (id !== tvRun) return;
      await tvScrollTo(document.documentElement.scrollHeight - window.innerHeight, id); if (id !== tvRun) return;
      await tvWait(CONFIG.TV_DWELL_BOTTOM);                      if (id !== tvRun) return;
      await tvScrollTo(0, id);                                   if (id !== tvRun) return;
      await tvWait(CONFIG.TV_DWELL_END);                         if (id !== tvRun) return;
    } else {
      await tvWait(CONFIG.TV_DWELL_STATIC);                      if (id !== tvRun) return;
    }
  }
}

function toggleTV(force) {
  tvOn = typeof force === 'boolean' ? force : !tvOn;
  tvRun++;
  const btn = document.getElementById('tvBtn');
  btn.classList.toggle('on', tvOn);
  btn.textContent = tvOn ? '📺 Modo TV: ligado' : '📺 Modo TV';
  if (tvOn) tvLoop(tvRun);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  TIMER — Sincronizado com múltiplos de 10 min no relógio  ║
// ╚══════════════════════════════════════════════════════════╝
function updateTimer() {
  const now = new Date();
  const elapsed = (now.getMinutes() % 10) * 60 + now.getSeconds();
  const remaining = Math.max(0, 10 * 60 - elapsed);
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;

  const el = document.getElementById('timer');
  el.textContent = (remMin < 10 ? '0' : '') + remMin + ':' + (remSec < 10 ? '0' : '') + remSec;

  if (remMin >= 3) el.style.color = '#22C55E';
  else if (remMin >= 1) el.style.color = '#FBBF24';
  else el.style.color = '#EF4444';
}
setInterval(updateTimer, 1000);
updateTimer();

// ╔══════════════════════════════════════════════════════════╗
// ║  FETCH & REFRESH                                          ║
// ╚══════════════════════════════════════════════════════════╝
async function fetchData() {
  try {
    // O parâmetro ?t= evita que o navegador/CDN devolva uma versão antiga
    const url = CONFIG.DATA_URL + (CONFIG.DATA_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let raw = await res.json();

    // Resposta da API do GitHub: o arquivo vem em base64 dentro de "content"
    if (raw && typeof raw.content === 'string' && raw.encoding === 'base64') {
      const bin = atob(raw.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      raw = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    }
    return processData(raw);
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    return null;
  }
}

let lastSignature = null;

async function refresh() {
  const data = await fetchData();
  if (!data) { if (!lastData) renderError(); return; }
  // Só redesenha a tela quando alguma nota (ou curso) mudou
  const signature = JSON.stringify(data.teams.map(t => [t.curso, t.total]));
  if (signature === lastSignature) return;
  lastSignature = signature;
  lastData = data;
  render(data);
}

// Carga inicial
refresh();

// Confere o dados.json periodicamente: quando o Power Automate grava
// notas novas, a classificação se atualiza sozinha, sem recarregar a página
setInterval(refresh, CONFIG.POLL_INTERVAL);

// Agenda o reload no próximo múltiplo de 10 min do relógio
function scheduleNextRefresh() {
  const now = new Date();
  const elapsed = (now.getMinutes() % 10) * 60 + now.getSeconds();
  const msUntilNext = (10 * 60 - elapsed) * 1000 + 2000;
  setTimeout(() => location.reload(), msUntilNext);
}
scheduleNextRefresh();

// ?tv=1 liga o Modo TV automaticamente
if (new URLSearchParams(location.search).get('tv') === '1') toggleTV(true);
