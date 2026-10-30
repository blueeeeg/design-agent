#!/usr/bin/env node
// 조건을 넣으면 패턴마다 방식을 점수 순으로 줄 세운다. 카탈로그(src/scripts/core.js)와 같은 계산이다
// 쓰는 법:
//   node recommend.mjs --sel platform=mobile,skill=first,device=personal,content=photo [--action once|none] [--patterns loading,empty]
//   node recommend.mjs --sel ... --design-md [--picks loading=skeleton,delete=undo]   # DESIGN.md 초안을 찍는다
//   node recommend.mjs --sel ... --design-md --system seed   # 바탕으로 쓸 디자인 시스템을 DESIGN.md에 적는다
//   node recommend.mjs --list    # 조건 축, 패턴 id, 디자인 시스템 id 목록
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const PARAM = { targetMin: ['최소 터치·클릭 영역', 24], fontBase: ['기본 글자 크기', 14], rowHeight: ['목록 행 높이', 44], space: ['여백 단계', 8] };
const CONV_ORDER = ['skill', 'device', 'content', 'platform'];

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
  const ranked = scored.slice().sort((a, b) => b.score - a.score || a.i - b.i);
  return { ranked, neutral: scored.every(s => s.score === 0) };
}

const list = wanted ? wanted.map(id => PATTERNS.find(p => p.id === id) || (console.error(`없는 패턴 id: ${id}`), process.exit(1))) : PATTERNS;
const picks = kv(arg('--picks'));
const system = arg('--system');
if (system && !SYS[system]) { console.error(`없는 디자인 시스템 id: ${system}. --list로 확인`); process.exit(1); }

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
    console.log(`  카탈로그: /elements/${p.id}/\n`);
  }
  process.exit(0);
}

// ---------- DESIGN.md 초안 (카탈로그 「AI용 디자인 규칙 만들기」와 같은 틀) ----------
const picked = Object.fromEntries(VISIBLE.map(a => [a.key, findOpt(a.key, sel[a.key])]));
const params = {};
for (const p of Object.keys(PARAM)) {
  const cons = VISIBLE.map(a => picked[a.key].params?.[p]).filter(e => e && e.s === '제약');
  let floor = cons.length ? Math.max(...cons.map(e => e.v)) : PARAM[p][1];
  if (p === 'rowHeight' && params.targetMin > floor) floor = params.targetMin;
  const conv = CONV_ORDER.map(k => picked[k].params?.[p]).find(e => e && e.s === '관례');
  params[p] = Math.max(floor, conv ? conv.v : floor);
}
const rules = { 제약: [], 관례: [], 예시: [] };
const seen = new Set();
VISIBLE.forEach(a => (picked[a.key].rules || []).forEach(r => { if (!seen.has(r.t)) { seen.add(r.t); rules[r.s].push(r); } }));
const line = r => `- ${r.t}${r.src ? ` (${r.src})` : ''}`;
const comp = list.map(p => {
  const { ranked, neutral } = score(p);
  const chosen = picks[p.id] ? ranked.find(s => s.o.id === picks[p.id]) : ranked[0];
  if (!chosen) { console.error(`${p.id}에 없는 방식: ${picks[p.id]}`); process.exit(1); }
  const why = picks[p.id] && chosen !== ranked[0] ? `사용자가 골랐다(추천은 ${ranked[0].o.name})`
    : neutral ? '조건과 직접 걸리는 근거 없음, 가장 흔한 방식' : chosen.hits.map(reason).join(' / ');
  return `- ${p.name}${p.action && action !== 'none' ? ` (${actionLabel} 기준)` : ''}: ${chosen.o.name} — ${why}`;
});
console.log([
  '---',
  'context:',
  ...VISIBLE.map(a => `  ${a.key}: ${sel[a.key]}   # ${picked[a.key].label}`),
  `  action: ${action}   # ${actionLabel}`,
  'layout:',
  `  target-min: ${params.targetMin}px`,
  `  font-base: ${params.fontBase}px`,
  `  row-height: ${params.rowHeight}px`,
  `  spacing: ${params.space}px`,
  'brand: {}   # 색·서체·로고는 브랜드에서 채운다',
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
  '## 쓰지 말 것', ...ANTI.map(t => `- ${t}`), '',
  '## 원칙',
  '<!-- 데이터에서 나오지 않는 판단. 대화에서 정한 것을 사람이 채운다 -->',
].join('\n'));
