// ╔══════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO                                            ║
// ╚══════════════════════════════════════════════════════════╝
const CONFIG = {
  // Arquivos gerados pelo Power Automate, neste mesmo repositório.
  // Experiência: nota final de cada curso  -> [ { "CURSO": "...", "NOTA": 100 }, ... ]
  // Gincana: pontos por atividade          -> [ { "CURSO": "...", "BRINQUEDOS": 10, "ALIMENTOS": 20, ... }, ... ]
  EXPERIENCIA_URL: './dados_experiencia.json',
  GINCANA_URL: './dados_gincana.json',

  // Logo do Movimento Soberana (versão branca, para o fundo escuro)
  LOGO_URL: './LOGOTIPO.png',

  // De quanto em quanto tempo o site confere se os dados mudaram (1 minuto)
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
// ║  ATIVIDADES DA GINCANA (colunas da aba Detalhes)         ║
// ║  "match" diz qual coluna do dados_gincana.json alimenta  ║
// ║  cada atividade (sem acentos, em maiúsculas).            ║
// ╚══════════════════════════════════════════════════════════╝
const ACTIVITIES = [
  { label: 'Brinquedos',       match: /BRINQUEDO/ },
  { label: 'Alimentos',        match: /ALIMENTO|CESTA/ },
  { label: 'Doação de Sangue', match: /SANGUE/ },
  { label: 'Vídeo',            match: /VIDEO/ },
  { label: 'Caminhada',        match: /CAMINHADA/ },
  { label: 'Desfile',          match: /DESFILE/ },
  { label: 'Soberana Dance',   match: /DANCE/ },
];

// ╔══════════════════════════════════════════════════════════╗
// ║  DADOS DAS EQUIPES                                       ║
// ╚══════════════════════════════════════════════════════════╝
const TEAMS = {
  'ODONTOLOGIA':          { color:'#00276f', emoji:'🦷' },
  'FARMÁCIA':             { color:'#328ac4', emoji:'💊' },
  'ENFERMAGEM':           { color:'#013f33', emoji:'🏥' },
  'PSICOLOGIA':           { color:'#540b55', emoji:'🧠' },
  'MEDICINA VETERINÁRIA': { color:'#4b331e', emoji:'🐾' },
  'BIOMEDICINA':          { color:'#4a9b9f', emoji:'🔬' },
  'ESTÉTICA E COSMÉTICA': { color:'#6c0c0a', emoji:'✨' },
  'GESTÃO HOSPITALAR':    { color:'#474747', emoji:'🏨' },
};
const UNKNOWN_TEAM = { color:'#6366f1', emoji:'🎓' };

// Cursos que não participam mais: são ignorados mesmo se aparecerem nos arquivos de dados
const HIDDEN_COURSES = ['TERAPIA OCUPACIONAL'];

// Versões claras das cores (para o texto sobre o fundo escuro)
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
function lightColor(c) { return COLORS_ON_DARK[c] || c; }

// ╔══════════════════════════════════════════════════════════╗
// ║  LOGO                                                    ║
// ╚══════════════════════════════════════════════════════════╝
(function initLogo() {
  const img = document.getElementById('logo');
  const ph = document.getElementById('logoPh');
  img.onload = () => { img.classList.add('show'); ph.classList.add('hide'); };
  img.onerror = () => { img.classList.remove('show'); ph.classList.remove('hide'); };
  img.src = CONFIG.LOGO_URL;
})();

// ╔══════════════════════════════════════════════════════════╗
// ║  LEITURA DOS ARQUIVOS DE DADOS                           ║
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

// Remove acentos e padroniza para comparar nomes de curso e de coluna
function normName(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}
const TEAM_BY_NORM = {};
Object.keys(TEAMS).forEach(k => { TEAM_BY_NORM[normName(k)] = k; });
const HIDDEN_NORM = new Set(HIDDEN_COURSES.map(normName));

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

// Coluna que guarda o nome do curso
function findNameKey(row) {
  const keys = Object.keys(row);
  return keys.find(k => NAME_KEY.test(k) && typeof row[k] === 'string')
      || keys.find(k => typeof row[k] === 'string' && toNumber(row[k]) === null);
}

// Linha do dados_experiencia.json -> { name, score }
function readExperienciaRow(row) {
  if (!row || typeof row !== 'object') return null;
  const nameKey = findNameKey(row);
  if (!nameKey) return null;
  const name = String(row[nameKey]).trim();
  if (!name) return null;

  const keys = Object.keys(row).filter(k => k !== nameKey);
  const scoreKey = keys.find(k => SCORE_KEY.test(k) && toNumber(row[k]) !== null)
                || keys.find(k => toNumber(row[k]) !== null);
  return { name, score: scoreKey ? toNumber(row[scoreKey]) : 0 };
}

// Linha do dados_gincana.json -> { name, acts: [pontos de cada atividade] }
function readGincanaRow(row) {
  if (!row || typeof row !== 'object') return null;
  const nameKey = findNameKey(row);
  if (!nameKey) return null;
  const name = String(row[nameKey]).trim();
  if (!name) return null;

  const keys = Object.keys(row).filter(k => k !== nameKey);
  const acts = ACTIVITIES.map(a => {
    const key = keys.find(k => a.match.test(normName(k)));
    return key ? (toNumber(row[key]) || 0) : 0;
  });
  return { name, acts };
}

const round2 = v => Math.round(v * 100) / 100;

function processData(expRaw, ginRaw) {
  const byCourse = new Map();
  const entry = name => {
    const norm = normName(name);
    if (!byCourse.has(norm)) {
      const curso = TEAM_BY_NORM[norm] || name.toUpperCase();
      byCourse.set(norm, { curso, ...(TEAMS[curso] || UNKNOWN_TEAM), acts: ACTIVITIES.map(() => 0), exp: 0 });
    }
    return byCourse.get(norm);
  };

  // Os valores dos arquivos já são finais: nada é somado entre linhas.
  // Se o mesmo curso aparecer mais de uma vez num arquivo, vale a última linha.
  const visible = r => r && !HIDDEN_NORM.has(normName(r.name));
  for (const row of findRows(ginRaw)) {
    const r = readGincanaRow(row);
    if (visible(r)) entry(r.name).acts = r.acts;
  }
  for (const row of findRows(expRaw)) {
    const r = readExperienciaRow(row);
    if (visible(r)) entry(r.name).exp = r.score;
  }

  const teams = [...byCourse.values()];
  // Total do curso = pontos de todas as atividades + Experiência
  teams.forEach(t => { t.total = round2(t.acts.reduce((s, v) => s + v, 0) + t.exp); });
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
// ║  ABA 1 — RANKING (posição + total de cada curso)         ║
// ╚══════════════════════════════════════════════════════════╝
let lastData = null;
let prevTotals = {};

function renderRanking(data) {
  const pane = document.getElementById('pane0');
  let html = '<div class="section-title">Ranking</div>';

  if (!data.teams.length) {
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

// ╔══════════════════════════════════════════════════════════╗
// ║  ABA 2 — DETALHES (pontos por atividade, sem posições)   ║
// ╚══════════════════════════════════════════════════════════╝
function renderDetalhes(data) {
  const pane = document.getElementById('pane1');
  let html = '<div class="section-title">Detalhes</div>';

  if (!data.teams.length) {
    html += '<div class="msg">Ainda não há pontuações registradas.</div>';
  } else {
    html += '<div class="tbl-wrap"><table class="score-table"><thead><tr><th>Curso</th>';
    ACTIVITIES.forEach(a => { html += '<th>' + esc(a.label) + '</th>'; });
    html += '<th>Experiência</th><th>Total</th></tr></thead><tbody>';

    // Mesma ordem do ranking (maior total primeiro), mas sem mostrar a posição
    data.teams.forEach(t => {
      const lc = lightColor(t.color);
      html += '<tr class="team-row" style="--row-color:' + t.color + ';background:' + t.color + '25;color:' + lc + '">';
      html += '<td>' + t.emoji + ' ' + esc(t.curso) + '</td>';
      t.acts.forEach(v => { html += '<td>' + fmt(v) + '</td>'; });
      html += '<td>' + fmt(t.exp) + '</td>';
      html += '<td class="cell-total">' + fmt(t.total) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }

  pane.innerHTML = html;
}

function render(data) {
  renderRanking(data);
  renderDetalhes(data);
}

function renderError() {
  const msg = '<div class="msg">Não foi possível carregar a pontuação. Nova tentativa em instantes.</div>';
  document.getElementById('pane0').innerHTML = msg;
  document.getElementById('pane1').innerHTML = msg;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ABAS                                                    ║
// ╚══════════════════════════════════════════════════════════╝
let currentTab = 0;

function switchTab(n, auto = false) {
  currentTab = n;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('on', i === n));
  document.querySelectorAll('.pane').forEach((p, i) => p.classList.toggle('on', i === n));
  window.scrollTo(0, 0);
  // Troca manual durante o Modo TV: recomeça o ciclo a partir da aba escolhida
  if (!auto && tvOn) { tvRun++; tvLoop(tvRun); }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  MODO TV — alterna as abas e rola quando não cabe na tela ║
// ╚══════════════════════════════════════════════════════════╝
let tvOn = false;
let tvRun = 0;

function tvWait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Rola devagar até a posição "to".
// el = null rola a página na vertical; el = elemento rola esse elemento na horizontal.
function tvScrollTo(to, id, el = null) {
  const get = () => el ? el.scrollLeft : window.scrollY;
  const set = v => { if (el) el.scrollLeft = v; else window.scrollTo(0, v); };
  return new Promise(res => {
    const from = get();
    const dist = Math.abs(to - from);
    if (dist < 2) return res();
    const dur = dist / CONFIG.TV_SCROLL_SPEED * 1000;
    const t0 = performance.now();
    function step(now) {
      if (id !== tvRun) return res();
      const p = Math.min((now - t0) / dur, 1);
      const eased = 0.5 - Math.cos(p * Math.PI) / 2;
      set(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step); else res();
    }
    requestAnimationFrame(step);
  });
}

async function tvLoop(id) {
  while (id === tvRun) {
    window.scrollTo(0, 0);
    // Tabela da aba Detalhes: pode ser mais larga que a tela
    const wrap = document.querySelectorAll('.pane')[currentTab].querySelector('.tbl-wrap');
    if (wrap) wrap.scrollLeft = 0;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const maxX = wrap ? wrap.scrollWidth - wrap.clientWidth : 0;

    if (maxX > 8 || maxY > 8) {
      await tvWait(CONFIG.TV_DWELL_TOP_SCROLL);                  if (id !== tvRun) return;
      // Para o lado: mostra as colunas que não cabem e volta
      if (maxX > 8) {
        await tvScrollTo(maxX, id, wrap);                        if (id !== tvRun) return;
        await tvWait(CONFIG.TV_DWELL_BOTTOM);                    if (id !== tvRun) return;
        await tvScrollTo(0, id, wrap);                           if (id !== tvRun) return;
      }
      // Para baixo: mostra as linhas que não cabem e volta
      if (maxY > 8) {
        if (maxX > 8) { await tvWait(CONFIG.TV_DWELL_END);       if (id !== tvRun) return; }
        await tvScrollTo(maxY, id);                              if (id !== tvRun) return;
        await tvWait(CONFIG.TV_DWELL_BOTTOM);                    if (id !== tvRun) return;
        await tvScrollTo(0, id);                                 if (id !== tvRun) return;
      }
      await tvWait(CONFIG.TV_DWELL_END);                         if (id !== tvRun) return;
    } else {
      await tvWait(CONFIG.TV_DWELL_STATIC);                      if (id !== tvRun) return;
    }

    // Passa para a outra aba
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
// ║  FETCH & REFRESH                                          ║
// ╚══════════════════════════════════════════════════════════╝
// Devolve o JSON do arquivo, ou null se não der para ler
async function fetchJson(baseUrl) {
  try {
    // O parâmetro ?t= evita que o navegador devolva uma versão antiga
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
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
    return raw;
  } catch (err) {
    console.error('Erro ao buscar ' + baseUrl + ':', err);
    return null;
  }
}

async function fetchData() {
  const [exp, gin] = await Promise.all([fetchJson(CONFIG.EXPERIENCIA_URL), fetchJson(CONFIG.GINCANA_URL)]);
  if (exp === null && gin === null) return null;
  // Falha passageira em um dos arquivos: mantém o que já está na tela
  if (lastData && (exp === null || gin === null)) return null;
  // Primeira carga com um arquivo faltando: mostra o que existe
  return processData(exp || [], gin || []);
}

let lastSignature = null;

async function refresh() {
  const data = await fetchData();
  if (!data) { if (!lastData) renderError(); return; }
  // Só redesenha a tela quando algum valor (ou curso) mudou
  const signature = JSON.stringify(data.teams.map(t => [t.curso, t.acts, t.exp]));
  if (signature === lastSignature) return;
  lastSignature = signature;
  lastData = data;
  render(data);
}

// Carga inicial
refresh();

// Confere os arquivos periodicamente: quando o Power Automate grava
// pontos novos, as duas abas se atualizam sozinhas, sem recarregar a página
setInterval(refresh, CONFIG.POLL_INTERVAL);

// Recarrega a página inteira a cada 10 min (nos minutos :00, :10, :20...),
// como um Ctrl+F5: ignora o cache e busca a página e os dados de novo.
function scheduleNextRefresh() {
  const now = new Date();
  const elapsed = (now.getMinutes() % 10) * 60 + now.getSeconds();
  const msUntilNext = (10 * 60 - elapsed) * 1000 + 2000;
  setTimeout(reloadPage, msUntilNext);
}

async function reloadPage() {
  try {
    // Só recarrega se o site responder; sem internet, a tela atual continua
    const res = await fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      // O parâmetro "r" muda a cada vez, então o navegador não usa a página do cache.
      // Se o Modo TV estiver ligado, ele continua ligado depois de recarregar.
      const params = new URLSearchParams(location.search);
      params.set('r', Date.now());
      params.set('tv', tvOn ? '1' : '0');
      location.replace(location.pathname + '?' + params.toString());
      return;
    }
  } catch (e) {}
  scheduleNextRefresh();
}
scheduleNextRefresh();

// O Modo TV já começa ligado. Para abrir com ele desligado, use ?tv=0 no endereço.
if (new URLSearchParams(location.search).get('tv') !== '0') toggleTV(true);
