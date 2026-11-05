#!/usr/bin/env node
// 조건을 넣으면 패턴마다 방식을 점수 순으로 줄 세운다. 카탈로그(src/scripts/core.js)와 같은 계산이다
// 쓰는 법:
//   node recommend.mjs --sel platform=mobile,skill=first,device=personal,content=photo [--action once|none] [--patterns loading,empty]
//   node recommend.mjs --sel ... --design-md [--picks loading=skeleton,delete=undo]   # DESIGN.md 초안을 찍는다
//   node recommend.mjs --sel ... --design-md --system seed   # 바탕으로 쓸 디자인 시스템을 DESIGN.md에 적는다
//   node recommend.mjs --sel ... --design-md --rules design-rules.json   # 서비스 규칙(시스템 값·역할과 토큰·정한 것) 위에서 쓴다
//   node recommend.mjs --list    # 조건 축, 패턴 id, 디자인 시스템 id 목록
// --system이나 --rules가 있으면 layout 값마다 출처(시스템 / 규격 / 스킬 권장)를 달고, 「역할과 토큰」「시스템에 맡긴 것」을 더한다
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paramsFor, PARAM } from './params.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const read = f => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
const axesData = read('axes.json');
const elementsData = read('elements.json');
const ANTI = read('anti-defaults.json').items;
const SYSD = read('systems.json');
const SYS = Object.fromEntries(SYSD.systems.map(s => [s.id, s]));
const sysName = id => (SYS[id].name.includes(SYS[id].maker) ? SYS[id].name : `${SYS[id].maker} ${SYS[id].name}`);
// 디자인 시스템이 하는 말: opt가 있으면 그 방식에 대한 말, 없으면 패턴 전체
const guide = (id, opt = null) => (SYSD.guidance[id] || []).filter(g => (g.opt || null) === opt);
const refsText = g => Object.keys(g.refs).map(b => SYS[b].short).join(', ');

const AXES = axesData.axes;
const VISIBLE = AXES.filter(a => !a.hidden);
const axisByKey = Object.fromEntries(AXES.map(a => [a.key, a]));
axisByKey.action = axesData.action;
const findOpt = (k, id) => axisByKey[k]?.options.find(o => o.id === id);
const label = (k, id) => findOpt(k, id)?.label ?? id;
const SCORE = { 제약: 100, 관례: 3, 예시: 1 };

// 숨긴 축(예전 도메인 축)은 점수에 넣지 않는다
const PATTERNS = elementsData.elements.map(p => ({
  ...p,
  options: p.options.map(o => ({ ...o, fits: (o.fits || []).filter(f => !axisByKey[f[0]]?.hidden), avoid: (o.avoid || []).filter(f => !axisByKey[f[0]]?.hidden) })),
}));
PATTERNS.forEach(p => { p.action = p.options.some(o => [...o.fits, ...o.avoid].some(f => f[0] === 'action')); });

const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const kv = s => Object.fromEntries((s || '').split(',').filter(Boolean).map(x => x.split('=')));

if (args.includes('--list')) {
  for (const a of [...VISIBLE, axesData.action]) console.log(`${a.key} (${a.name}): ${a.options.map(o => `${o.id}=${o.label}`).join(', ')}`);
  console.log('\n패턴:');
  for (const g of elementsData.groups) console.log(`  ${g}: ${PATTERNS.filter(p => p.group === g).map(p => `${p.id}=${p.name}`).join(', ')}`);
  console.log('\n디자인 시스템:');
  for (const s of SYSD.systems) console.log(`  ${s.id}=${sysName(s.id)} (${s.region}) — ${s.refFor}${s.ai.length ? ` · AI 연결: ${s.ai.join(', ')}` : ''}`);
  process.exit(0);
}

const sel = kv(arg('--sel'));
for (const a of VISIBLE) {
  if (!findOpt(a.key, sel[a.key])) { console.error(`--sel 에 ${a.key}가 없거나 틀렸다. 고를 수 있는 값: ${a.options.map(o => o.id).join(', ')}`); process.exit(1); }
}
// 작업의 무게는 저장·삭제·주문 같은 「동작」에 걸린다. 화면을 여는 로딩, 목록처럼 동작이 아닌 화면은 --action none으로 빼고 계산한다
// 사용자가 고르지 않았으면 채우지 않는다(none). 기본값으로 「두 번 되면 안 되는 작업」을 넣으면 고른 것처럼 보인다
const action = arg('--action') || 'none';
if (action !== 'none' && !findOpt('action', action)) { console.error(`--action 은 ${axesData.action.options.map(o => o.id).join(', ')}, none 중 하나`); process.exit(1); }
const ctx = { ...sel, action: action === 'none' ? undefined : action };
const actionLabel = action === 'none' ? '고르지 않음' : label('action', action);
const wanted = arg('--patterns') ? arg('--patterns').split(',') : null;
const reason = f => `${label(f[0], f[1])}${f[3] ? `: ${f[3]}` : ''}${f[4] ? ` (${f[4]})` : ''}`;

function score(p) {
  const scored = p.options.map((o, i) => {
    const hits = o.fits.filter(f => ctx[f[0]] === f[1]);
    const misses = o.avoid.filter(f => ctx[f[0]] === f[1]);
    return { o, i, hits, misses, score: hits.reduce((s, f) => s + SCORE[f[2]], 0) - misses.reduce((s, f) => s + SCORE[f[2]], 0) };
  });
  // 상황이 나뉜 패턴은 대표 상황(main)의 방식을 앞에 둔다. 사이트(core.js scorePattern)와 같은 규칙
  const main = p.cases && (p.cases.find(c => c.main) || p.cases[0]);
  const inMain = s => !main || main.options.includes(s.o.id);
  const ranked = scored.slice().sort((a, b) => inMain(b) - inMain(a) || b.score - a.score || a.i - b.i);
  return { ranked, neutral: scored.every(s => s.score === 0) };
}

const list = wanted ? wanted.map(id => PATTERNS.find(p => p.id === id) || (console.error(`없는 패턴 id: ${id}`), process.exit(1))) : PATTERNS;
const picks = kv(arg('--picks'));
const system = arg('--system');
if (system && !SYS[system]) { console.error(`없는 디자인 시스템 id: ${system}. --list로 확인`); process.exit(1); }
// 서비스 규칙 파일(그 서비스 저장소의 design-rules.json). 형식은 references/design-rules.example.json
const rulesPath = arg('--rules');
let RULES = null;
if (rulesPath) {
  try { RULES = JSON.parse(readFileSync(resolve(rulesPath), 'utf8')); }
  catch (e) { console.error(`--rules 파일을 못 읽었다: ${rulesPath} (${e.message}). 값을 짐작해 채우지 않는다`); process.exit(1); }
}
const onSystem = !!(system || RULES);
// 역할과 토큰: 화면이 쓰는 역할마다 시스템의 토큰 이름을 하나씩 잇는다
const ROLES = {
  accent: '주 버튼·강조', onAccent: '강조 위 글자', text: '본문 글자', textSub: '보조 글자',
  bg: '바탕', surface: '카드·띄운 층 바탕', border: '구분선', inputBorder: '입력칸 테두리', focus: '포커스 표시',
  danger: '위험·오류', success: '성공', warning: '경고',
  font: '서체', radiusControl: '버튼·입력칸 모서리', radiusCard: '카드 모서리', shadowFloat: '띄운 층 그림자',
};
const TOPICS = { accent: '강조색 쓰는 범위', palette: '색 팔레트', font: '서체', typescale: '글자 크기 단계', weight: '굵기', spacing: '여백 단계', radius: '모서리', shadow: '그림자', decor: '장식', copy: '글투', pattern: '패턴 방식' };
if (RULES) {
  for (const k of Object.keys(RULES.roles || {})) if (!ROLES[k]) console.error(`roles에 모르는 역할: ${k}. 쓸 수 있는 것: ${Object.keys(ROLES).join(', ')}`);
  for (const k of Object.keys(RULES.values || {})) if (!PARAM[k]) console.error(`values에 모르는 값: ${k}. 쓸 수 있는 것: ${Object.keys(PARAM).join(', ')}`);
}

if (!args.includes('--design-md')) {
  console.log(`조건: ${VISIBLE.map(a => label(a.key, sel[a.key])).join(' · ')} · 작업의 무게 ${actionLabel}\n`);
  for (const p of list) {
    const { ranked, neutral } = score(p);
    console.log(`## ${p.name} (${p.id}) — ${p.q}${p.action ? ` [작업의 무게에 따라 갈림]` : ''}`);
    ranked.forEach((s, k) => {
      const mark = k === 0 ? (neutral ? '기본' : '추천') : '    ';
      console.log(`  ${mark} ${s.o.name} (${s.o.id}, ${s.o.en}) 점수 ${s.score} — ${s.o.desc}`);
      s.hits.forEach(f => console.log(`         + ${f[2]} ${reason(f)}`));
      s.misses.forEach(f => console.log(`         - ${f[2]} ${reason(f)}`));
      for (const g of guide(p.id, s.o.id)) console.log(`         디자인 시스템: ${g.text} (${refsText(g)})`);
      if (s.o.giting) console.log(`         데모: https://giting.kr/menu/${s.o.giting}`);
    });
    if (neutral) console.log('  (이 조건과 직접 걸리는 근거가 없어 가장 흔한 방식을 첫째로 둔다)');
    for (const g of guide(p.id)) console.log(`  디자인 시스템 공통: ${g.text} (${refsText(g)})`);
    // 한 패턴 안에서 상황마다 답이 갈리면(cases) 상황별 방식을 같이 보인다. 상황을 묻고 상황마다 하나씩 고르게 한다
    (p.cases || []).forEach(c => console.log(`  상황 「${c.name}」(${c.q}): ${c.options.map(id => p.options.find(o => o.id === id).name).join(' / ')}`));
    console.log(`  카탈로그: /elements/${p.id}/\n`);
  }
  process.exit(0);
}

// ---------- DESIGN.md 초안 (카탈로그 「AI용 디자인 규칙 만들기」와 같은 틀) ----------
const { params, paramSrc, picked } = paramsFor(sel); // 근거 문서(있으면)는 DESIGN.md에 주석으로 붙인다
const srcNote = p => (paramSrc[p] ? `   # ${paramSrc[p]}` : '');
// 시스템 위에서 쓸 때 값마다 출처를 단다. 판단 순서: 규격 > 시스템(서비스가 정한 값) > 스킬 권장
// 규격은 조건의 「제약」 값이다. 시스템 값이 규격보다 작으면 규격을 따르고 그렇다고 적는다
const floorOf = (p, finalTarget) => {
  const cons = Object.values(picked).map(o => o.params?.[p]).filter(e => e && e.s === '제약');
  let top = cons.length ? cons.reduce((x, y) => (y.v > x.v ? y : x)) : null;
  if (p === 'rowHeight' && finalTarget && (!top || finalTarget > top.v)) top = { v: finalTarget, src: '최소 누를 곳 크기보다 작게 두지 않는다' };
  return top;
};
const layoutLine = (key, p, chosen) => {
  if (!onSystem) return `  ${key}: ${params[p]}px${srcNote(p)}`;
  const sv = RULES?.values?.[p];
  if (sv && typeof sv.v === 'number') {
    const floor = floorOf(p, p === 'rowHeight' ? chosen.targetMin : null);
    const from = [sv.token, sv.src].filter(Boolean).join(' · ');
    if (floor && sv.v < floor.v) return { v: floor.v, line: `  ${key}: ${floor.v}px   # 규격: ${floor.src}. 시스템 값 ${sv.v}px(${from})는 이보다 작아 규격을 따른다` };
    return { v: sv.v, line: `  ${key}: ${sv.v}px   # 시스템: ${from || '서비스 규칙 파일'}` };
  }
  const why = RULES ? '시스템에 없음' : '시스템 값 모름';
  return { v: params[p], line: `  ${key}: ${params[p]}px   # 스킬 권장(${why})${paramSrc[p] ? ` · ${paramSrc[p]}` : ''}` };
};
const layoutLines = (() => {
  if (!onSystem) return [['target-min', 'targetMin'], ['font-base', 'fontBase'], ['row-height', 'rowHeight'], ['spacing', 'space']].map(([k, p]) => layoutLine(k, p));
  const chosen = {};
  return [['target-min', 'targetMin'], ['font-base', 'fontBase'], ['row-height', 'rowHeight'], ['spacing', 'space']].map(([k, p]) => {
    const r = layoutLine(k, p, chosen); chosen[p] = r.v; return r.line;
  });
})();
const decided = RULES?.decided || {};
const decidedPattern = id => (picks[id] ? null : decided[`pattern.${id}`]);
const roleLines = onSystem ? Object.entries(ROLES).map(([k, name]) => `- ${name}: ${RULES?.roles?.[k] || '(채울 곳: 시스템의 토큰 이름)'}`) : [];
const hasRoles = RULES?.roles && Object.keys(RULES.roles).length > 0;
const brandLine = !onSystem ? 'brand: {}   # 색·서체·로고는 브랜드에서 채운다'
  : hasRoles ? 'brand: tokens   # 시스템 토큰을 쓴다. 아래 「역할과 토큰」' : 'brand: {}   # 시스템 토큰 이름을 아래 「역할과 토큰」에 채운다';
const rules = { 제약: [], 관례: [], 예시: [] };
const seen = new Set();
VISIBLE.forEach(a => (picked[a.key].rules || []).forEach(r => { if (!seen.has(r.t)) { seen.add(r.t); rules[r.s].push(r); } }));
const line = r => `- ${r.t}${r.src ? ` (${r.src})` : ''}`;
const comp = list.map(p => {
  const { ranked, neutral } = score(p);
  const chosen = picks[p.id] ? ranked.find(s => s.o.id === picks[p.id]) : ranked[0];
  if (!chosen) { console.error(`${p.id}에 없는 방식: ${picks[p.id]}`); process.exit(1); }
  if (decidedPattern(p.id)) return `- ${p.name}: 서비스가 정함 — ${decidedPattern(p.id)} (조건으로 본 추천은 ${ranked[0].o.name})`;
  const why = picks[p.id] && chosen !== ranked[0] ? `사용자가 골랐다(추천은 ${ranked[0].o.name})`
    : neutral ? '조건과 직접 걸리는 근거 없음, 가장 흔한 방식' : chosen.hits.map(reason).join(' / ');
  return `- ${p.name}${p.action && action !== 'none' ? ` (${actionLabel} 기준)` : ''}: ${chosen.o.name} — ${why}`;
});
console.log([
  '---',
  'context:',
  ...VISIBLE.map(a => `  ${a.key}: ${sel[a.key]}   # ${picked[a.key].label}`),
  `  action: ${action}   # ${actionLabel}`,
  onSystem ? 'layout:   # 값마다 출처: 규격 > 시스템 > 스킬 권장. 「스킬 권장」은 시스템에 같은 값이 있으면 그 값으로 바꾼다' : 'layout:',
  ...layoutLines,
  brandLine,
  '---',
  '',
  `# ${VISIBLE.map(a => picked[a.key].label).join(' · ')}`,
  '',
  '## 화면 구조',
  `- 내비게이션: ${picked.platform.nav}`,
  ...(picked.skill.confirm ? [`- 확인 단계: ${picked.skill.confirm}`] : []),
  '',
  // 화면(plan.js)과 같은 말: 제약 → 꼭 지킬 것, 관례 → 보통 이렇게, 예시 → 참고
  '## 꼭 지킬 것 — 규격·접근성 기준이 있다', ...rules['제약'].map(line), '',
  '## 보통 이렇게 — 흔히 이렇게 한다. 이유가 있으면 바꿔도 된다', ...rules['관례'].map(line), '',
  '## 참고', ...rules['예시'].map(line), '',
  ...(onSystem ? [
    '## 시스템에 맡긴 것 — 여기 다시 적지 않는다',
    `- 컴포넌트 모양과 상태, 색·글자·모서리·그림자 값은 시스템${system ? `(${sysName(system)})` : ''} 것을 쓴다. 이 파일에 값을 옮겨 적지 않는다. 두 곳에 적으면 한쪽만 낡는다`,
    '- 시스템에 있는 컴포넌트를 새로 그리지 않는다. 없는 것만 시스템 토큰으로 만들고, 새로 만들었다고 알린다',
    ...(RULES?.system ? [`- 시스템 위치: ${RULES.system}`] : []),
    ...Object.entries(decided).filter(([k]) => !k.startsWith('pattern.')).map(([k, v]) => `- 서비스가 정한 ${TOPICS[k] || k}: ${v}`),
    '',
    '## 역할과 토큰 — 화면은 이 토큰 이름만 쓴다',
    '<!-- 표에 없는 색·값을 새로 만들지 않는다. 필요하면 여기 먼저 더하고 알린다. 시스템을 못 읽었으면 비슷한 값으로 채우지 않고 비워 둔다 -->',
    ...roleLines, '',
  ] : []),
  '## 패턴별 방식', ...comp, '',
  '## 디자인 시스템 기준',
  ...list.flatMap(p => {
    const { ranked } = score(p);
    const chosen = picks[p.id] || ranked[0].o.id;
    const name = p.options.find(o => o.id === chosen).name;
    return [...guide(p.id).map(g => `- ${p.name}: ${g.text} (${refsText(g)})`), ...guide(p.id, chosen).map(g => `- ${p.name} › ${name}: ${g.text} (${refsText(g)})`)];
  }),
  '',
  ...(system ? ['## 바탕 디자인 시스템', `- ${sysName(system)}: ${SYS[system].url}`, `- ${SYS[system].focus}`, ...(SYS[system].ai.length ? [`- AI 연결: ${SYS[system].ai.join(', ')}`] : []), `- 이용 조건: ${SYS[system].license}`, '- 위 패턴별 방식을 이 시스템의 컴포넌트로 만든다. 이름이 다르면 컴포넌트 사전에서 같은 것을 찾는다', ''] : []),
  '## 쓰지 말 것', ...(RULES ? ['<!-- 서비스가 정한 것과 겹치는 줄은 서비스 쪽을 따른다 -->'] : []), ...ANTI.map(t => `- ${t}`), '',
  '## 원칙',
  '<!-- 데이터에서 나오지 않는 판단. 대화에서 정한 것을 사람이 채운다 -->',
].join('\n'));
