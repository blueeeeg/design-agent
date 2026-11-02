// 화면과 무관한 계산: 데이터 읽기, 조건 합치기, 추천 점수
import axesData from '../../data/axes.json';
import elementsData from '../../data/elements.json';
import samplesData from '../../data/samples.json';
import antiData from '../../data/anti-defaults.json';
import systemsData from '../../data/systems.json';

export const AXES = axesData.axes;
export const ACTION_AXIS = axesData.action;
export const ANTI_DEFAULTS = antiData.items;
/* 디자인 시스템과, 그 문서들이 패턴마다 하는 말 */
export const SYSTEMS = Object.fromEntries(systemsData.systems.map(s => [s.id, s]));
export const GUIDANCE = systemsData.guidance;
export const DOMAIN_UI = samplesData.ui;
export const DOMAIN_TEXT = samplesData.text;
export const NOTIFY_TEXT = samplesData.notify;
export const HINT_TEXT = samplesData.hint;
export const GROUP_ORDER = elementsData.groups;
export const PATTERNS = elementsData.elements;

/* 작업 종류(action)는 고른 화면에서 바뀐다. 점수 계산이 지금 값을 읽도록 한곳에 둔다 */
// 사용자가 고르기 전에는 비워 둔다(null). 비어 있으면 작업 종류 근거는 점수에 들어가지 않는다
export const state = { actionKind: null };

export const DEFAULT_SELECTION = { platform: 'tablet', skill: 'first', device: 'shared', content: 'photo', domain: 'fnb' };
/* 축을 직접 고르면 예시에 채울 내용은 콘텐츠 형태를 따른다 */
export const SAMPLE_BY_CONTENT = { photo: 'fnb', numbers: 'admin', text: 'media' };

export const PARAM_META = {
  targetMin: { k: '최소 터치·클릭 영역', fallback: 24 },
  fontBase: { k: '기본 글자 크기', fallback: 14 },
  rowHeight: { k: '목록 행 높이', fallback: 44 },
  // 화면 바깥 여백과 묶음 사이 간격. 처음 쓰는 사람은 넓게, 표·숫자 중심은 촘촘하게
  space: { k: '여백 단계', fallback: 8 },
};
export const CONVENTION_ORDER = ['skill', 'device', 'content', 'platform'];
/* 논리 px. 테두리(베젤) 두께를 포함한 크기라 화면 안쪽은 데스크톱 1280×800, 모바일 390×844, 태블릿 1280×800 */

export const axisByKey = Object.fromEntries(AXES.map(a => [a.key, a]));
export const findOpt = (key, id) => axisByKey[key].options.find(o => o.id === id);
export const isValidSel = s => s && AXES.every(a => findOpt(a.key, s[a.key]));

export const VISIBLE_AXES = AXES.filter(a => !a.hidden);

export function resolve(sel) {
  const picked = Object.fromEntries(AXES.map(a => [a.key, findOpt(a.key, sel[a.key])]));
  const params = {};
  const conflicts = [];

  ['targetMin', 'fontBase', 'rowHeight', 'space'].forEach(p => {
    const constraints = VISIBLE_AXES
      .map(a => ({ axis: a, opt: picked[a.key], e: picked[a.key].params?.[p] }))
      .filter(x => x.e && x.e.s === '제약');
    // 바닥은 제약(규격)만 만든다. 기본값(fallback)은 제약도 관례도 없을 때만 쓴다. 바닥으로 쓰면 관례(예: 매일 쓰는 표 행 32)가 늘 기본값에 덮인다
    let floor = constraints.length ? Math.max(...constraints.map(x => x.e.v)) : 0;
    let floorFrom = constraints.find(x => x.e.v === floor);
    // 행 전체가 눌리는 영역이므로 행 높이는 최소 터치 영역 아래로 내려가지 않는다
    if (p === 'rowHeight' && params.targetMin.value > floor) {
      floor = params.targetMin.value;
      floorFrom = params.targetMin.from;
    }
    const convs = CONVENTION_ORDER
      .map(k => ({ axis: axisByKey[k], opt: picked[k], e: picked[k].params?.[p] }))
      .filter(x => x.e && x.e.s === '관례');
    const preferred = convs[0];
    const value = preferred ? Math.max(floor, preferred.e.v) : (floor || PARAM_META[p].fallback);
    const from = preferred && preferred.e.v >= floor ? preferred : floorFrom;
    const overridden = convs.slice(1).filter(c => c.e.v !== value && c.e.v >= floor);

    convs.filter(c => c.e.v < floor).forEach(c => conflicts.push({
      param: PARAM_META[p].k, wanted: c.e.v, got: floor, loser: c, winner: floorFrom,
    }));
    params[p] = { value, from, overridden };
  });

  const confirms = [picked.skill.confirm].filter(Boolean);
  const nav = picked.platform.nav;

  const rules = { 제약: [], 관례: [], 예시: [] };
  const seen = new Set();
  VISIBLE_AXES.forEach(a => (picked[a.key].rules || []).forEach(r => {
    if (seen.has(r.t)) return;
    seen.add(r.t);
    rules[r.s].push({ ...r, axis: a.name, opt: picked[a.key].label });
  }));

  return { picked, params, conflicts, confirms, nav, rules };
}

/* 근거의 세기. 데이터는 제약·관례·예시로 적고, 화면과 DESIGN.md에는 쓰는 사람의 말로 보인다 */
export const STRENGTH_LABEL = { 제약: '꼭 지킬 것', 관례: '보통 이렇게', 예시: '참고' };
export const STRENGTH_HINT = { 제약: '규격·접근성 기준이 있다', 관례: '흔히 이렇게 한다. 이유가 있으면 바꿔도 된다', 예시: '참고만' };
export const describeFrom = f => {
  if (!f) return '정해진 기준이 없어 흔한 값';
  // 관례 값도 근거 문서가 있으면 함께 적는다(예: 매일 쓴다에서 흔한 값 · IBM Carbon 표 행 sm 32px)
  return f.e.s === '제약' ? `${f.opt.label} 기준${f.e.src ? ' · ' + f.e.src : ''}` : `${f.opt.label}에서 흔한 값${f.e.src ? ' · ' + f.e.src : ''}`;
};
export const comboText = sel => VISIBLE_AXES.map(a => findOpt(a.key, sel[a.key]).label).join(' · ');

axisByKey.action = ACTION_AXIS;
PATTERNS.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
/* 샘플 내용(도메인)은 고르는 축이 아니므로 추천 점수에서 뺀다 */
PATTERNS.forEach(p => p.options.forEach(o => {
  o.fits = (o.fits || []).filter(f => !axisByKey[f[0]].hidden);
  o.avoid = (o.avoid || []).filter(f => !axisByKey[f[0]].hidden);
}));
/* 작업 종류 조건이 걸린 패턴에서만 작업 종류를 고르게 한다 */
PATTERNS.forEach(p => { p.action = p.options.some(o => o.fits.concat(o.avoid).some(f => f[0] === 'action')); });

/* 패턴을 바꾸는 조건을 축 순서대로 */
export const AXIS_ORDER = ['platform', 'skill', 'device', 'content', 'action'];
export const axesOf = pat => {
  const used = new Set(pat.options.flatMap(o => o.fits.concat(o.avoid)).map(f => f[0]));
  return AXIS_ORDER.filter(k => used.has(k));
};

export const patternById = id => PATTERNS.find(p => p.id === id);

export const SCORE = { 제약: 100, 관례: 3, 예시: 1 };
export const axisLabel = (axis, opt) => findOpt(axis, opt).label;

export function scorePattern(pat, sel) {
  const ctx = { action: state.actionKind, ...sel };
  const scored = pat.options.map((o, i) => {
    const hits = (o.fits || []).filter(f => ctx[f[0]] === f[1]);
    const misses = (o.avoid || []).filter(f => ctx[f[0]] === f[1]);
    const score = hits.reduce((s, f) => s + SCORE[f[2]], 0) - misses.reduce((s, f) => s + SCORE[f[2]], 0);
    return { o, i, hits, misses, score };
  });
  // 상황이 나뉜 패턴은 대표 상황(main)의 방식 안에서 고른다. 다른 상황에만 쓰는 방식이 패턴 전체 추천으로 올라오지 않게
  const main = pat.cases && (pat.cases.find(c => c.main) || pat.cases[0]);
  const best = scored.filter(s => !main || main.options.includes(s.o.id)).sort((a, b) => b.score - a.score || a.i - b.i)[0];
  return { scored, best, neutral: scored.every(s => s.score === 0) };
}

export const reasonText = f => `${axisLabel(f[0], f[1])}${f[3] ? ': ' + f[3] : ''}${f[4] ? ` (${f[4]})` : ''}`;

/* 카탈로그에서는 방식마다 가장 어울리는 환경에서 그린다 */
export const CATALOG_BASE = { platform: 'mobile', skill: 'occasional', device: 'personal', content: 'photo' };
export function typicalSel(pat, o) {
  const sel = { ...CATALOG_BASE };
  const seen = new Set();
  o.fits.forEach(f => { if (!seen.has(f[0])) { seen.add(f[0]); sel[f[0]] = f[1]; } });
  // 기본 조건이 이 방식의 「피하는 곳」에 걸리면 그 축은 피하지 않는 첫 선택지로 바꾼다
  o.avoid.forEach(f => {
    if (sel[f[0]] !== f[1]) return;
    const ok = axisByKey[f[0]].options.find(a => !o.avoid.some(v => v[0] === f[0] && v[1] === a.id));
    if (ok) sel[f[0]] = ok.id;
  });
  sel.domain = SAMPLE_BY_CONTENT[sel.content];
  return { sel, caption: `${comboText(sel)}${sel.action ? ` · ${findOpt('action', sel.action).label}` : ''} 기준` };
}
