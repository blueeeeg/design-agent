// 예시 그림을 그리는 도구: 아이콘, 조건별 크기, 자주 쓰는 조각
import { AXES, ACTION_AXIS, ANTI_DEFAULTS, DOMAIN_UI, DOMAIN_TEXT, NOTIFY_TEXT, HINT_TEXT, GROUP_ORDER, PATTERNS, state, DEFAULT_SELECTION, SAMPLE_BY_CONTENT, PARAM_META, CONVENTION_ORDER, axisByKey, findOpt, isValidSel, VISIBLE_AXES, resolve, describeFrom, comboText, AXIS_ORDER, axesOf, patternById, SCORE, axisLabel, scorePattern, reasonText, CATALOG_BASE, typicalSel } from './core.js';

export const ICONS = {
  home: '<path d="M3 10.5 10 4l7 6.5V17H3z"/>',
  grid: '<rect x="3" y="3" width="6" height="6"/><rect x="11" y="3" width="6" height="6"/><rect x="3" y="11" width="6" height="6"/><rect x="11" y="11" width="6" height="6"/>',
  receipt: '<path d="M5 2.5h10v15l-2.5-1.5L10 17.5 7.5 16 5 17.5z"/><path d="M7.5 7h5M7.5 10h5"/>',
  list: '<path d="M4 5h12M4 10h12M4 15h12"/>',
  bell: '<path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 1.5h-13z"/><path d="M8.5 17.5h3"/>',
  cart: '<path d="M2.5 3.5h2l2 10h9l1.5-7H6"/><circle cx="8" cy="16.5" r="1"/><circle cx="14.5" cy="16.5" r="1"/>',
  user: '<circle cx="10" cy="7" r="3.5"/><path d="M3.5 17.5a6.5 6.5 0 0 1 13 0"/>',
  send: '<path d="M3 10 17 3l-4 14-3-6z"/>',
  chart: '<path d="M3 17V3M3 17h14M7 13V9M11 13V6M15 13v-3"/>',
  gear: '<circle cx="10" cy="10" r="3"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>',
  bookmark: '<path d="M5.5 2.5h9v15L10 14l-4.5 3.5z"/>',
  star: '<path d="m10 2.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z"/>',
  search: '<circle cx="9" cy="9" r="5.5"/><path d="m13 13 4 4"/>',
  alert: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6v5M10 13.5v.5"/>',
  check: '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
  refresh: '<path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.5h-3.5"/>',
  down: '<path d="m5 8 5 5 5-5"/>',
  arrowdown: '<path d="M10 3.5v12M5 11l5 5 5-5"/>',
  trash: '<path d="M4 5.5h12M8 5.5V3.5h4v2M5.5 5.5l.8 11h7.4l.8-11"/>',
  filter: '<path d="M3 4.5h14l-5.5 6.5v5l-3 1.5v-6.5z"/>',
  photo: '<rect x="3" y="4" width="14" height="12" rx="2"/><circle cx="8" cy="8.5" r="1.5"/><path d="m3.5 14 4-4 3 3 2-2 4 4"/>',
};
export const icon = name => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICONS[name]}</svg>`;

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const STATUS_CLASS = { 품절: 'off', 접수: 'new', '조리 중': 'busy', 완료: 'done', 취소: 'cancel' };
export const hueOf = (it, i) => it.hue ?? (190 + i * 47) % 360;

/* 플랫폼마다 논리 폭이 달라야 축소했을 때 버튼·글자 크기 차이가 보인다 */
export const FRAG_W = { desktop: 560, tablet: 480, mobile: 360 };
export const BTN_PX = { sm: 32, md: 40, lg: 52, xl: 64 };
export const PLAIN_WORDS = { 접수: '받았어요', '조리 중': '만드는 중', 완료: '나왔어요', 취소: '취소됨', 품절: '다 팔렸어요' };
/* 틀은 플랫폼마다 모양을 바꾸지 않는다. 비교할 것은 방식이라 틀은 폭과 이름표만 다르다 */
export const FRAG_CHROME = Object.fromEntries(['desktop', 'tablet', 'mobile'].map(id => [id, `<div class="fr-chrome">${findOpt('platform', id).label} · 폭 ${FRAG_W[id]}</div>`]));

export function ctxOf(sel) {
  const r = resolve(sel);
  const P = r.picked;
  return {
    sel, D: DOMAIN_UI[P.domain.id], T: DOMAIN_TEXT[P.domain.id], dom: P.domain.id, plat: P.platform.id, fw: FRAG_W[P.platform.id],
    f: r.params.fontBase.value, t: r.params.targetMin.value, h: r.params.rowHeight.value, s: r.params.space.value,
    guest: P.skill.id === 'first', expert: P.skill.id === 'daily', shared: P.device.id === 'shared', numbers: P.content.id === 'numbers',
  };
}
export const fragHTML = (inner, x) => `<div class="fit-wrap"><div class="fit-box" data-w="${x.fw}"><div class="frag frag-${x.plat}" style="--f:${x.f}px;--t:${x.t}px;--h:${x.h}px;--s:${x.s}px;width:${x.fw}px">${FRAG_CHROME[x.plat]}${inner}</div></div></div>`;

/* 버튼이 들어가는 그림은 지금 조합의 「주요 버튼 자리」 추천을 따른다 */
export const ctaPlace = x => scorePattern(patternById('cta'), x.sel).best.o.id;
// 매일 쓰는 표·숫자 화면(대시보드)은 버튼도 줄인다. 최소 터치 영역은 btnStyle이 지킨다
export const ctaSize = x => (x.guest ? 'xl' : x.plat === 'desktop' ? 'sm' : x.expert && x.numbers ? 'md' : 'lg');
export function actionArea(x, makeBtn) {
  const body = `<b class="m-ptitle">${esc(x.D.btnTitle)}</b>${kvLines(x.D.btnCtx)}`;
  const place = ctaPlace(x);
  if (place === 'bottom') return `<div class="fr-pad fr-stack">${body}</div><div class="m-bottomcta">${makeBtn(true)}</div><div class="fr-home"><i></i></div>`;
  if (place === 'panel') return `<div class="fr-row"><div class="fr-main">${rowsHTML(x, 3)}</div><div class="m-panel fr-panel side">${body}<div style="height:12px"></div>${makeBtn(true)}</div></div>`;
  return `<div class="fr-pad fr-stack">${body}</div><div class="fr-foot"><span class="m-btn ghost" style="${btnStyle(x, ctaSize(x))}">취소</span>${makeBtn(false)}</div>`;
}
export const kvLines = lines => lines.map(([a, b]) => `<div class="m-kv"><span class="m-sub">${esc(a)}</span><span class="num">${esc(b)}</span></div>`).join('');
export const btnStyle = (x, size) => `min-height:${Math.max(x.t, BTN_PX[size])}px`;
export const rowsHTML = (x, n = 3, skip = -1) => x.D.items.slice(0, n).map((it, i) => (i === skip ? '' : `<div class="m-kv fr-line"><span>${esc(it.n)}</span><span class="num">${esc(it.v)}</span></div>`)).join('');
export const statusItems = x => (x.D.items.some(it => it.status && it.status !== '품절') ? x.D : DOMAIN_UI.admin).items;
export const titleBar = (x, right = '') => `<div class="m-kv" style="align-items:center"><b class="m-title" style="font-size:1.2em">${esc(x.D.title)}</b><span class="fr-tools">${right}</span></div>`;

export function styledValue(it, style) {
  if (style === 'signed' && it.dir) return `<span class="m-dir ${it.dir}">${it.dir === 'in' ? '입금' : '출금'}</span><b class="${it.dir === 'in' ? 'm-in' : ''}">${esc(it.v)}</b>`;
  if (style === 'price' && it.was) return `<span class="m-off">${esc(it.off)}</span><b>${esc(it.v)}</b><s>${esc(it.was)}</s>`;
  return `<b>${esc(it.v)}</b>`;
}
export function statusChip(it, plain) {
  if (!it.status) return '';
  return `<span class="m-st s-${STATUS_CLASS[it.status]}">${esc(plain ? PLAIN_WORDS[it.status] : it.status)}</span>`;
}

export const cartOf = x => x.D.cart || DOMAIN_UI.fnb.cart;

export function confirmBox(x, container) {
  const k = x.D.confirm;
  const dialog = `<div class="m-dialog fr-dialog ${container}"><b class="m-dtitle">${esc(k.title)}</b><div class="m-dlines">${kvLines(k.lines)}${k.total ? `<div class="m-kv m-total"><span>${esc(k.total[0])}</span><b class="num">${esc(k.total[1])}</b></div>` : ''}</div>
    ${k.note ? `<p class="m-note">${esc(k.note)}</p>` : ''}<div class="m-actions"><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">${esc(k.cancel)}</span><span class="m-btn block ${k.danger ? 'danger' : ''}" style="${btnStyle(x, 'md')}">${esc(k.ok)}</span></div></div>`;
  return `<div class="fr-confirm" style="height:${container === 'sheet' ? 380 : 340}px"><div class="fr-pad">${rowsHTML(x, 6)}</div><div class="m-overlay fr-ov ${container === 'sheet' ? 'sheet' : ''}">${dialog}</div></div>`;
}
