// 패턴 페이지 동작: 고른 패턴을 기억하고 방식 카드를 그린다. 조건을 골라 추천받는 일은 /plan/(plan.js)에서 한다
import { PATTERNS, findOpt, comboText, patternById, axisLabel, typicalSel, SYSTEMS, GUIDANCE } from './core.js';
import { esc, ctxOf, fragHTML } from './draw.js';
import { promptHTML, markClamped } from './prompt.js';
import './renders.js';

function scrollDetailIntoView(sel) {
  const head = document.querySelector(`${sel} .detail-head`);
  if (head && head.getBoundingClientRect().top < 0 && head.scrollIntoView) head.scrollIntoView({ block: 'start' });
}

const PATTERN_KEY = 'design-axes-pattern';
let currentPattern = PATTERNS[0].id;
try {
  const saved = localStorage.getItem(PATTERN_KEY);
  if (PATTERNS.some(p => p.id === saved)) currentPattern = saved;
} catch (e) { /* 저장소를 못 쓰면 첫 패턴부터 */ }
/* 패턴 주소(/elements/loading/)로 들어오면 기억해 둔 패턴보다 주소가 먼저다 */
const BASE = (document.body.dataset.base || '/').replace(/\/?$/, '/');
const SITE_TITLE = 'UI 패턴 카탈로그';
const elementUrl = id => `${BASE}elements/${id}/`;
/* 개발 서버에서만 refs-private 갤러리로 가는 링크를 단다. 빌드에는 없다 */
const REFS = document.body.dataset.refs;
// 갤러리 판정(review.json)에서 패턴별·방식별 실제 화면 수를 센다. 나쁜 예는 세지 않는다
let refsCount = null;
const refsN = (el, opt) => (refsCount ? refsCount[opt ? `${el}/${opt}` : el] || 0 : 0);
const refsLink = pat => (refsN(pat.id) ? `<a class="to-refs" href="${REFS}#${pat.id}">실제 화면 ${refsN(pat.id)}장 ›</a>` : '');
const refsOf = (pat, o) => (refsN(pat.id, o.id) ? `<a class="refs-n" href="${REFS}#${pat.id}">실제 화면 ${refsN(pat.id, o.id)}장</a>` : '');
if (REFS) {
  // 앱 화면(Lazyweb)과 국내 웹 섹션(찐망고) 판정을 함께 센다. 한쪽이 없어도 다른 쪽은 센다
  const read = p => fetch(`${REFS}${p}`).then(r => (r.ok ? r.json() : null)).catch(() => null);
  Promise.all([read('lazyweb/review.json'), read('jjinmango/review.json')]).then(([lw, jj]) => {
    const n = {};
    [...Object.values(lw?.images || {}), ...Object.values(jj?.items || {})].forEach(v => (v.els || []).forEach(el => {
      if ((v.bad || {})[el]) return;
      n[el] = (n[el] || 0) + 1;
      const m = (v.method || {})[el];
      if (m) n[`${el}/${m}`] = (n[`${el}/${m}`] || 0) + 1;
    }));
    refsCount = n;
    renderComponents();
  });
}

/* 방식마다 AI에게 붙여 넣을 문장. giting.kr 메뉴판의 「문장 복사」에서 가져온 생각에, 우리 조건과 이유를 더했다 */
const reasonsOf = fs => fs.map(f => `${axisLabel(f[0], f[1])}${f[3] ? `(${f[3]})` : ''}`).join(', ');
// 마지막 글자에 받침이 있으면 「은」, 없으면 「는」
const topicOf = w => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? '은' : '는'; };
function promptOf(pat, o) {
  const lines = [`${pat.name}(${pat.en})${topicOf(pat.name)} 「${o.name}」(${o.en}) 방식으로 만들어 줘. ${o.desc}.`];
  if (o.fits.length) lines.push(`쓰는 곳: ${reasonsOf(o.fits)}.`);
  if (o.avoid.length) lines.push(`피하는 곳: ${reasonsOf(o.avoid)}.`);
  return lines.join('\n');
}
const promptBox = (pat, o) => promptHTML(promptOf(pat, o), esc);
const linksOf = (pat, o) => refsOf(pat, o);
const enName = o => `<small class="en">${esc(o.en)}</small>`;
/* 디자인 시스템들이 하는 말. 방식에 대한 말은 그 카드에, 패턴 전체에 대한 말은 머리 아래 짧게.
   이름은 짧게(당근, KRDS…), 이름마다 그 시스템의 문서로 잇는다. 주소를 모르면 /systems/의 그 시스템 카드로 */
const sysLink = (id, url) => `<a href="${esc(url || `${BASE}systems/#sys-${id}`)}"${url ? ' target="_blank" rel="noopener"' : ''}>${esc(SYSTEMS[id].short)}</a>`;
const refsLine = refs => Object.entries(refs).map(([id, url]) => sysLink(id, url)).join(' · ');
const guideOf = (pat, opt) => (GUIDANCE[pat.id] || []).filter(g => (g.opt || null) === (opt || null));
function guidanceOf(pat) {
  const g = guideOf(pat, null);
  if (!g.length) return '';
  return `<div class="ds-common"><span class="fl">디자인 시스템 공통</span><ul>${g.map(x => `<li>${esc(x.text)} <span class="by">${refsLine(x.refs)}</span></li>`).join('')}</ul></div>`;
}
const cardGuide = (pat, o) => guideOf(pat, o.id).map(x => `<p class="ds-line kv"><span class="fl">디자인 시스템</span><span>${esc(x.text)} <span class="by">${refsLine(x.refs)}</span></span></p>`).join('');
if (PATTERNS.some(p => p.id === document.body.dataset.element)) currentPattern = document.body.dataset.element;

function renderComponents() {
  const groups = [...new Set(PATTERNS.map(p => p.group))];
  // 목록은 패턴 이름만. 「상태 알리기」 같은 묶음 이름은 쓰는 사람이 알 필요가 없어 묶음 사이 여백으로만 나눈다
  document.getElementById('comp-index').innerHTML = groups.map((g, gi) => `${gi ? '<i class="nav-gap" aria-hidden="true"></i>' : ''}${PATTERNS.filter(p => p.group === g).map(p => `
    <button type="button" data-pattern="${p.id}" aria-current="${p.id === currentPattern}"><span>${esc(p.name)}</span></button>`).join('')}`).join('');

  const idx = PATTERNS.findIndex(p => p.id === currentPattern);
  const pat = PATTERNS[idx];
  renderCatalog(pat, idx);
}

function renderCatalog(pat, idx) {
  const chip = (f, kind) => `<span class="fchip ${kind}" data-axis="${f[0]}" data-opt="${f[1]}" title="${esc(f[3] || '')}">${esc(axisLabel(f[0], f[1]))}</span>`;
  // 카드마다 그 방식이 맞는 조건으로 그린다. 조건은 「쓰는 곳」이 말하니 머리에 따로 적지 않는다
  const typ = pat.options.map(o => typicalSel(pat, o));
  const actionOf = t => (t.sel.action ? findOpt('action', t.sel.action).label : '');
  const cards = pat.options.map((o, i) => {
    const t = typ[i];
    const x = ctxOf(t.sel);
    const row = (label, fs, kind) => (fs.length ? `<p class="cond kv ${kind}"><span class="fl">${label}</span><span class="cond-list">${fs.map(f => chip(f, kind)).join('<i aria-hidden="true"> · </i>')}</span></p>` : '');
    return `<div class="ocard" data-combo="${esc([comboText(t.sel), actionOf(t)].filter(Boolean).join(' · '))}">
      <div class="slot-frame stage">${fragHTML(o.render(x), x)}</div>
      <div class="vh"><span>${esc(o.name)} ${enName(o)}</span></div>
      <div class="slot-desc"><span class="how">${esc(o.desc)}</span></div>
      <div class="slot-cond">${row('쓰는 곳', o.fits, 'fit')}${row('피하는 곳', o.avoid, 'avoid')}</div>
      <div class="slot-ds">${cardGuide(pat, o)}</div>
      <div class="slot-prompt">${promptBox(pat, o)}</div>
      <div class="slot-links">${linksOf(pat, o)}</div>
    </div>`;
  }).join('');
  const prev = PATTERNS[idx - 1];
  const next = PATTERNS[idx + 1];
  document.getElementById('comps').innerHTML = `
    <div class="detail-head"><header class="el-head"><h1>${esc(pat.name)} <small class="en">${esc(pat.en)}</small></h1>${refsLink(pat)}</header><p class="q">${esc(pat.q)}</p>${guidanceOf(pat)}</div>
    <div class="ogrid ogrid-cat">${cards}</div>
    <div class="detail-nav">
      ${prev ? `<a class="pnav prev" href="${elementUrl(prev.id)}" data-goto="${prev.id}"><span class="pnav-k">이전 패턴</span><span class="pnav-n">‹ ${esc(prev.name)}</span></a>` : '<span></span>'}
      ${next ? `<a class="pnav next" href="${elementUrl(next.id)}" data-goto="${next.id}"><span class="pnav-k">다음 패턴</span><span class="pnav-n">${esc(next.name)} ›</span></a>` : '<span></span>'}
    </div>`;
  fitAll();
  markClamped(document.getElementById('comps'));
}

function showPattern(id, push = true) {
  currentPattern = id;
  try { localStorage.setItem(PATTERN_KEY, id); } catch (e) { /* 기억 못 해도 동작은 같다 */ }
  // 페이지를 다시 불러오지 않고 주소만 바꾼다. 링크로 나눠도 같은 요소가 열린다
  if (push && location.pathname !== elementUrl(id)) history.pushState({ pattern: id }, '', elementUrl(id));
  document.title = `${patternById(id).name} · ${SITE_TITLE}`;
  renderComponents();
  scrollDetailIntoView('#comps');
  const current = document.querySelector(`#comp-index button[data-pattern="${id}"]`);
  if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function fitAll() {
  document.querySelectorAll('.fit-box').forEach(box => {
    const inner = box.firstElementChild;
    const W = Number(box.dataset.w);
    const avail = box.parentElement.clientWidth;
    if (!avail) return;
    const s = Math.min(1, avail / W);
    box.style.width = `${W * s}px`;
    box.style.height = `${inner.offsetHeight * s}px`;
    inner.style.transform = `scale(${s})`;
  });
}

document.getElementById('comps').addEventListener('click', e => {
  const go = e.target.closest('[data-goto]');
  // 링크라 새 탭으로 열 수도 있다. 그냥 누르면 페이지를 다시 불러오지 않고 바꾼다
  if (go && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); showPattern(go.dataset.goto); window.scrollTo?.(0, 0); return; }
});
document.getElementById('comp-index').addEventListener('click', e => {
  const b = e.target.closest('button[data-pattern]');
  if (b) showPattern(b.dataset.pattern);
});

if (window.ResizeObserver) {
  let lastMainWidth = 0;
  // 높이 변화로는 다시 맞추지 않는다. 맞추기가 높이를 바꾸므로 폭이 바뀔 때만 돈다
  new ResizeObserver(entries => {
    const w = entries[0].contentRect.width;
    if (w === lastMainWidth) return;
    lastMainWidth = w;
    fitAll();
  }).observe(document.querySelector('main'));
}
window.addEventListener('popstate', e => {
  const id = e.state?.pattern ?? document.body.dataset.element;
  if (PATTERNS.some(p => p.id === id)) showPattern(id, false);
});

renderComponents();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
