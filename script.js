// ╔══════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO — ALTERE AQUI PARA CONECTAR AO SHAREPOINT ║
// ╚══════════════════════════════════════════════════════════╝
const CONFIG = {
  // URL do JSON com os dados (gerado pelo Power Automate)
  DATA_URL: 'https://api.github.com/repos/Sober-ux-ui/Pontuacao/contents/dados.json',

  // Logo do Movimento Soberana (branca = fundo escuro, preta = fundo claro)
  LOGO_URL: './LOGOTIPO.png',
  LOGO_URL_LIGHT: './LOGOTIPO_dark.png',

  // Intervalo de atualização em milissegundos (10 minutos)
  REFRESH_INTERVAL: 10 * 60 * 1000,

  // Duração das animações em ms
  ANIM_DURATION: 1500,
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
  'ODONTOLOGIA':          { pk:'ODO',  color:'#00276f', emoji:'🦷' },
  'FARMÁCIA':             { pk:'FARM', color:'#328ac4', emoji:'💊' },
  'ENFERMAGEM':           { pk:'ENF',  color:'#013f33', emoji:'🏥' },
  'PSICOLOGIA':           { pk:'PSI',  color:'#540b55', emoji:'🧠' },
  'TERAPIA OCUPACIONAL':  { pk:'TO',   color:'#aa402f', emoji:'🤲' },
  'MEDICINA VETERINÁRIA': { pk:'MEDV', color:'#4b331e', emoji:'🐾' },
  'BIOMEDICINA':          { pk:'BIO',  color:'#4a9b9f', emoji:'🔬' },
  'ESTÉTICA E COSMÉTICA': { pk:'EST',  color:'#6c0c0a', emoji:'✨' },
  'GESTÃO HOSPITALAR':    { pk:'GH',   color:'#474747', emoji:'🏨' },
};

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
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  // Re-renderiza para atualizar as cores inline
  refresh();
}

// Aplica tema salvo ou padrão escuro
(function initTheme() {
  let saved = 'dark';
  try { saved = localStorage.getItem('soberana-theme') || 'dark'; } catch(e) {}
  applyTheme(saved);
})();

const ACTIVITIES = [
  'CESTA BÁSICA','BRINQUEDOS','DOAÇÃO DE SANGUE','CAMINHADA',
  'BÔNUS PESSOA REGISTRADA','DESFILE DE SCRUB','SOBERANA DANCE',
  'CURTIDAS','COMENTÁRIOS','COMPARTILHAMENTOS','BÔNUS VÍDEO'
];
const ACT_SHORT = ['Cesta','Brinquedos','Doação de Sangue','Caminhada','Bônus Caminhada','Desfile','Soberana Dance','Curtida','Comentário','Compartilhamento','Bônus do Vídeo'];
const CRITERIA = ['Experiência geral','Criatividade e inovação','Conhecimento técnico','Organização e envolvimento'];
const CRIT_SHORT = ['Experiência','Criatividade','Conhecimento','Organização'];

// ╔══════════════════════════════════════════════════════════╗
// ║  DADOS DE EXEMPLO (substituídos pelo fetch real)         ║
// ╚══════════════════════════════════════════════════════════╝
function getSampleData() {
  return {
    gincana: [
      { CURSO:'ODONTOLOGIA', 'CESTA BÁSICA':1500,'BRINQUEDOS':800,'DOAÇÃO DE SANGUE':600,'CAMINHADA':400,'BÔNUS PESSOA REGISTRADA':300,'DESFILE DE SCRUB':250,'SOBERANA DANCE':200,'CURTIDAS':150,'COMENTÁRIOS':100,'COMPARTILHAMENTOS':80,'BÔNUS VÍDEO':50 },
      { CURSO:'FARMÁCIA', 'CESTA BÁSICA':1200,'BRINQUEDOS':900,'DOAÇÃO DE SANGUE':500,'CAMINHADA':350,'BÔNUS PESSOA REGISTRADA':280,'DESFILE DE SCRUB':300,'SOBERANA DANCE':180,'CURTIDAS':120,'COMENTÁRIOS':90,'COMPARTILHAMENTOS':70,'BÔNUS VÍDEO':40 },
      { CURSO:'ENFERMAGEM', 'CESTA BÁSICA':1800,'BRINQUEDOS':700,'DOAÇÃO DE SANGUE':800,'CAMINHADA':500,'BÔNUS PESSOA REGISTRADA':200,'DESFILE DE SCRUB':350,'SOBERANA DANCE':220,'CURTIDAS':180,'COMENTÁRIOS':130,'COMPARTILHAMENTOS':90,'BÔNUS VÍDEO':60 },
      { CURSO:'PSICOLOGIA', 'CESTA BÁSICA':1100,'BRINQUEDOS':600,'DOAÇÃO DE SANGUE':450,'CAMINHADA':300,'BÔNUS PESSOA REGISTRADA':250,'DESFILE DE SCRUB':200,'SOBERANA DANCE':150,'CURTIDAS':100,'COMENTÁRIOS':80,'COMPARTILHAMENTOS':60,'BÔNUS VÍDEO':30 },
      { CURSO:'TERAPIA OCUPACIONAL', 'CESTA BÁSICA':900,'BRINQUEDOS':500,'DOAÇÃO DE SANGUE':400,'CAMINHADA':280,'BÔNUS PESSOA REGISTRADA':220,'DESFILE DE SCRUB':180,'SOBERANA DANCE':160,'CURTIDAS':90,'COMENTÁRIOS':70,'COMPARTILHAMENTOS':50,'BÔNUS VÍDEO':20 },
      { CURSO:'MEDICINA VETERINÁRIA', 'CESTA BÁSICA':1400,'BRINQUEDOS':850,'DOAÇÃO DE SANGUE':700,'CAMINHADA':420,'BÔNUS PESSOA REGISTRADA':310,'DESFILE DE SCRUB':280,'SOBERANA DANCE':190,'CURTIDAS':140,'COMENTÁRIOS':110,'COMPARTILHAMENTOS':75,'BÔNUS VÍDEO':45 },
      { CURSO:'BIOMEDICINA', 'CESTA BÁSICA':1000,'BRINQUEDOS':550,'DOAÇÃO DE SANGUE':480,'CAMINHADA':320,'BÔNUS PESSOA REGISTRADA':240,'DESFILE DE SCRUB':220,'SOBERANA DANCE':170,'CURTIDAS':110,'COMENTÁRIOS':85,'COMPARTILHAMENTOS':65,'BÔNUS VÍDEO':35 },
      { CURSO:'ESTÉTICA E COSMÉTICA', 'CESTA BÁSICA':800,'BRINQUEDOS':450,'DOAÇÃO DE SANGUE':350,'CAMINHADA':250,'BÔNUS PESSOA REGISTRADA':200,'DESFILE DE SCRUB':160,'SOBERANA DANCE':140,'CURTIDAS':80,'COMENTÁRIOS':60,'COMPARTILHAMENTOS':40,'BÔNUS VÍDEO':25 },
      { CURSO:'GESTÃO HOSPITALAR', 'CESTA BÁSICA':700,'BRINQUEDOS':400,'DOAÇÃO DE SANGUE':300,'CAMINHADA':200,'BÔNUS PESSOA REGISTRADA':180,'DESFILE DE SCRUB':150,'SOBERANA DANCE':120,'CURTIDAS':70,'COMENTÁRIOS':55,'COMPARTILHAMENTOS':35,'BÔNUS VÍDEO':20 },
    ],
    workshop: [
      { WORKSHOP:'ODONTOLOGIA', 'Experiência geral':8, 'Criatividade e inovação':7, 'Conhecimento técnico':9, 'Organização e envolvimento da equipe':8 },
      { WORKSHOP:'FARMÁCIA', 'Experiência geral':7, 'Criatividade e inovação':9, 'Conhecimento técnico':7, 'Organização e envolvimento da equipe':8 },
      { WORKSHOP:'ENFERMAGEM', 'Experiência geral':9, 'Criatividade e inovação':8, 'Conhecimento técnico':9, 'Organização e envolvimento da equipe':9 },
    ]
  };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  LOGO                                                    ║
// ╚══════════════════════════════════════════════════════════╝
(function initLogo() {
  if (!CONFIG.LOGO_URL) return;
  const img = document.getElementById('logo');
  const ph = document.getElementById('logoPh');
  img.onload = () => { img.classList.add('show'); ph.classList.add('hide'); };
  img.onerror = () => { img.classList.remove('show'); ph.classList.remove('hide'); };
  img.src = CONFIG.LOGO_URL;
})();

// ╔══════════════════════════════════════════════════════════╗
// ║  PROCESSAMENTO DE DADOS                                  ║
// ╚══════════════════════════════════════════════════════════╝
function processData(raw) {
  const teams = [];
  for (const g of raw.gincana) {
    const curso = g.CURSO;
    const meta = TEAMS[curso] || { pk:'?', color:'#999', emoji:'❓' };
    const actValues = ACTIVITIES.map(a => g[a] || 0);
    const gincanaTotal = actValues.reduce((s,v) => s+v, 0);

    // Workshop aggregation
    const wsRows = raw.workshop.filter(w => w.WORKSHOP === curso);
    const wsCount = wsRows.length;
    let wsAvg = [0,0,0,0], wsSum = [0,0,0,0], wsTotal = 0, wsSumTotal = 0, wsAvgOfAvg = 0;
    if (wsCount > 0) {
      CRITERIA.forEach((c,i) => {
        wsSum[i] = wsRows.reduce((s,r) => s + (r[c]||0), 0);
        wsAvg[i] = wsSum[i] / wsCount;
      });
      wsTotal = Math.round(wsAvg.reduce((s,v) => s + v, 0) * 100) / 100;
      wsSumTotal = wsSum.reduce((s,v) => s + v, 0);
      wsAvgOfAvg = Math.round(wsAvg.reduce((s,v) => s + v, 0) / 4 * 100) / 100;
    }

    teams.push({
      curso, ...meta, actValues, gincanaTotal,
      wsCount, wsAvg, wsSum, wsTotal: wsCount > 0 ? wsTotal : null,
      wsSumTotal: wsCount > 0 ? wsSumTotal : null,
      wsAvgOfAvg: wsCount > 0 ? wsAvgOfAvg : null,
      total: gincanaTotal + (wsCount > 0 ? wsSumTotal : 0),
    });
  }

  // Rankings por total (gincana + workshop)
  teams.sort((a,b) => b.total - a.total);
  teams.forEach((t,i) => t.rank = i+1);

  // Workshop ranking
  const wsTeams = [...teams].sort((a,b) => (b.wsTotal||0) - (a.wsTotal||0));
  wsTeams.forEach((t,i) => t.wsRank = i+1);

  const maxWsAvg = [0,1,2,3].map(i => Math.max(...teams.map(t => t.wsAvg[i])));
  const maxTotal = Math.max(...teams.map(t => t.total));

  return { teams, wsTeams, maxWsAvg, maxTotal };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ANIMAÇÃO DE NÚMEROS                                     ║
// ╚══════════════════════════════════════════════════════════╝
function animateNumber(el, target, duration = CONFIG.NUMBER_ANIM_DURATION, decimals = 0) {
  if (!el) return;
  const start = parseFloat(el.dataset.val || '0');
  el.dataset.val = target;
  if (Math.abs(start - target) < 0.01) return;
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = start + (target - start) * eased;
    el.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('pt-BR');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const fmt = v => Math.round(v).toLocaleString('pt-BR');
const fmt2 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ╔══════════════════════════════════════════════════════════╗
// ║  RENDERIZAÇÃO — TAB 1: PONTUAÇÃO (tabela Gincana)        ║
// ╚══════════════════════════════════════════════════════════╝
function renderPontuacao(data) {
  const pane = document.getElementById('pane0');
  let html = '';

  // Tabela Gincana com coluna Workshop e Total geral
  html += '<div class="section-title">Gincana <span class="badge">11 atividades + Workshop</span></div>';
  html += '<div class="tbl-wrap"><table class="score-table"><thead><tr><th>Equipe</th>';
  ACT_SHORT.forEach(a => html += '<th>' + a + '</th>');
  html += '<th>Workshop</th><th>TOTAL</th></tr></thead><tbody>';

  data.teams.forEach(t => {
    const lc = lightColor(t.color);
    html += '<tr class="team-row" style="--row-color:' + t.color + ';background:' + t.color + '25;color:' + lc + '">';
    html += '<td><div class="team-cell"><span class="team-dot" style="background:' + t.color + '"></span><span style="color:' + lc + '">' + t.emoji + ' ' + t.curso + '</span></div></td>';
    t.actValues.forEach(v => {
      html += '<td><span class="cell-val" style="color:' + lc + '">' + v.toLocaleString('pt-BR') + '</span></td>';
    });
    // Coluna Workshop (soma bruta = mesmo valor do Detalhamento)
    html += '<td><span class="cell-val" style="color:' + lc + '">' + (t.wsSumTotal !== null ? fmt2(t.wsSumTotal) : '—') + '</span></td>';
    // Total
    html += '<td class="cell-total" style="color:' + lc + '">' + fmt2(t.total) + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  pane.innerHTML = html;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RENDERIZAÇÃO — TAB 2: WORKSHOP (tabela + cards)         ║
// ╚══════════════════════════════════════════════════════════╝
let prevWs = {};

function renderWorkshop(data) {
  const pane = document.getElementById('pane1');
  const isUpdate = Object.keys(prevWs).length > 0;
  let html = '';

  // ── Tabela Workshop ──
  html += '<div class="section-title">Workshop — Detalhamento <span class="badge">4 critérios</span></div>';
  html += '<div class="tbl-wrap"><table class="score-table"><thead><tr><th>Equipe</th>';
  CRIT_SHORT.forEach(c => html += '<th>' + c + '</th>');
  html += '<th>Aval.</th><th>TOTAL</th></tr></thead><tbody>';
  data.wsTeams.forEach(t => {
    const has = t.wsTotal !== null;
    const lc = lightColor(t.color);
    html += '<tr class="team-row" style="--row-color:' + t.color + ';background:' + t.color + '25;color:' + lc + '">';
    html += '<td><div class="team-cell"><span class="team-dot" style="background:' + t.color + '"></span><span style="color:' + lc + '">' + t.emoji + ' ' + t.curso + '</span></div></td>';
    t.wsSum.forEach(v => {
      html += '<td><span class="cell-val" style="color:' + lc + '">' + (has ? fmt2(v) : '—') + '</span></td>';
    });
    html += '<td style="color:' + lc + '">' + (has ? t.wsCount : '—') + '</td>';
    html += '<td class="cell-total" style="color:' + lc + '">' + (has ? fmt2(t.wsSumTotal) : '—') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  // ── Cards Workshop ──
  html += '<div class="table-sep"></div>';
  html += '<div class="section-title">Workshop — Avaliação do público <span class="badge">Detalhes por curso</span></div><div class="ws-grid">';
  data.wsTeams.forEach((t, idx) => {
    const has = t.wsTotal !== null;
    const opac = has ? '1' : '0.4';
    const lc = lightColor(t.color);
    const p = prevWs[t.curso] || { total:0, avg:[0,0,0,0] };
    html += '<div class="ws-card" style="opacity:' + opac + '" data-ws="' + idx + '">';
    html += '<div class="ws-card-bar" style="background:linear-gradient(90deg,transparent,' + t.color + ',transparent)"></div>';
    html += '<div class="ws-header"><div>';
    html += '<div style="display:flex;align-items:center;gap:6px">';
    html += '<span class="ws-rank" style="color:' + lc + '">' + (has ? t.wsRank + '°' : '—') + '</span>';
    html += '<span class="ws-name" style="color:' + lc + '">' + t.emoji + ' ' + t.curso + '</span>';
    html += '</div>';
    html += '<div class="ws-meta">' + t.wsCount + ' avaliação(ões)</div>';
    html += '</div>';
    const cardTotal = has ? t.wsAvgOfAvg : 0;
    html += '<div class="ws-total-val" style="color:' + lc + '" data-anim="wst' + idx + '" data-val="' + p.total + '">' + fmt2(p.total) + '</div>';
    html += '</div>';
    html += '<div class="ws-rows">';
    html += '<div class="ws-row-hdr"><span class="ws-row-label"></span><div class="ws-row-bar-wrap" style="visibility:hidden"></div><span class="ws-avg-hdr" style="color:' + lc + '">Média</span></div>';
    CRIT_SHORT.forEach((c,ci) => {
      html += '<div class="ws-row">';
      html += '<span class="ws-row-label" style="color:' + lc + '">' + c + '</span>';
      html += '<div class="ws-row-bar-wrap"><div class="ws-row-bar" data-anim="wsb' + idx + '_' + ci + '" style="width:' + (p.avg[ci]/25*100).toFixed(0) + '%;background:' + t.color + '"></div></div>';
      html += '<span class="ws-row-val" style="color:' + lc + '" data-anim="wsv' + idx + '_' + ci + '" data-val="' + p.avg[ci] + '">' + p.avg[ci].toFixed(1) + '</span>';
      html += '</div>';
    });
    if (!has) html += '<div class="ws-waiting">Aguardando avaliações</div>';
    html += '</div></div>';
  });
  html += '</div>';

  pane.innerHTML = html;
  void pane.offsetWidth;

  requestAnimationFrame(() => {
    data.wsTeams.forEach((t, idx) => {
      if (t.wsTotal === null) return;
      animateNumber(pane.querySelector('[data-anim="wst' + idx + '"]'), t.wsTotal, CONFIG.NUMBER_ANIM_DURATION, 2);
      t.wsAvg.forEach((v, ci) => {
        animateNumber(pane.querySelector('[data-anim="wsv' + idx + '_' + ci + '"]'), v, CONFIG.NUMBER_ANIM_DURATION, 1);
        pane.querySelector('[data-anim="wsb' + idx + '_' + ci + '"]').style.width = (v/25*100).toFixed(0) + '%';
      });
      if (isUpdate) pane.querySelector('[data-ws="' + idx + '"]').classList.add('flash');
    });
    if (isUpdate) setTimeout(() => pane.querySelectorAll('.flash').forEach(el => el.classList.remove('flash')), 1200);
  });

  data.wsTeams.forEach(t => {
    prevWs[t.curso] = { total: t.wsTotal || 0, avg: [...t.wsAvg] };
  });
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ABAS (agora são 2: Pontuação e Workshop)                ║
// ╚══════════════════════════════════════════════════════════╝
let currentTab = 0;

function switchTab(n, auto = false) {
  currentTab = n;
  document.querySelectorAll('.tab').forEach((t,i) => t.className = i===n ? 'tab on' : 'tab');
  document.querySelectorAll('.pane').forEach((p,i) => p.classList.toggle('on', i===n));
  window.scrollTo(0, 0);
  if (!auto && tvOn) { tvRun++; tvLoop(tvRun); }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  MODO TV — troca de abas + rolagem lenta                 ║
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

    // Alterna entre 2 abas
    switchTab((currentTab + 1) % 2, true);
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
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const elapsed = (min % 10) * 60 + sec;
  const remaining = Math.max(0, 10 * 60 - elapsed);
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;
  const display = (remMin < 10 ? '0' : '') + remMin + ':' + (remSec < 10 ? '0' : '') + remSec;

  const el = document.getElementById('timer');
  el.textContent = display;

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
  let raw;
  if (CONFIG.DATA_URL) {
    try {
      const res = await fetch(CONFIG.DATA_URL, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store'
      });
      const api = await res.json();
      const bin = atob(api.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      raw = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      return null;
    }
  } else {
    raw = getSampleData();
  }
  return processData(raw);
}

async function refresh() {
  const data = await fetchData();
  if (!data) return;
  renderPontuacao(data);
  renderWorkshop(data);
}

// Carga inicial
refresh();

// Agenda o reload no próximo múltiplo de 10 min do relógio
function scheduleNextRefresh() {
  const now = new Date();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const elapsed = (min % 10) * 60 + sec;
  const msUntilNext = (10 * 60 - elapsed) * 1000 + 2000;
  setTimeout(() => location.reload(), msUntilNext);
}
scheduleNextRefresh();

// ?tv=1 liga o Modo TV automaticamente
if (new URLSearchParams(location.search).get('tv') === '1') toggleTV(true);
