#!/usr/bin/env node
// 조건(--sel)에서 기본값(최소 누를 곳, 기본 글자 크기, 행 높이, 여백 단계)을 계산한다. recommend.mjs DESIGN.md·검사 스크립트와 같은 값이다(core.js resolve와 같은 계산)
// 쓰는 법: node params.mjs --sel platform=tablet,skill=first,device=shared,content=text
//          브라우저에서 잴 때는 출력 끝의 window.__designCond = … 줄을 visualReport 전에 붙인다
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const axesData = JSON.parse(readFileSync(join(ROOT, 'data', 'axes.json'), 'utf8'));
const VISIBLE = axesData.axes.filter(a => !a.hidden);
export const PARAM = { targetMin: ['최소 터치·클릭 영역', 24], fontBase: ['기본 글자 크기', 14], rowHeight: ['목록 행 높이', 44], space: ['여백 단계', 8] };
const CONV_ORDER = ['skill', 'device', 'content', 'platform'];
const findOpt = (k, id) => VISIBLE.find(a => a.key === k)?.options.find(o => o.id === id);

// sel에 없는 축은 건너뛴다(검사는 아는 조건만 넣어도 된다). 돌려주는 것: { params: {targetMin, …}, paramSrc: {targetMin: '근거', …}, picked }
export function paramsFor(sel) {
  // 틀린 조건을 조용히 넘기면 흔한 기준으로 잰 것을 조건대로 잰 것으로 읽는다. 알려 준다
  for (const [k, v] of Object.entries(sel)) if (!findOpt(k, v)) console.error(`조건 ${k}=${v}를 모른다. 고를 수 있는 것: ${VISIBLE.map(a => `${a.key}(${a.options.map(o => o.id).join('|')})`).join(', ')}`);
  const picked = Object.fromEntries(VISIBLE.map(a => [a.key, findOpt(a.key, sel[a.key])]).filter(([, o]) => o));
  const params = {}, paramSrc = {};
  for (const p of Object.keys(PARAM)) {
    const cons = Object.values(picked).map(o => o.params?.[p]).filter(e => e && e.s === '제약');
    const top = cons.length ? cons.reduce((x, y) => (y.v > x.v ? y : x)) : null;
    let floor = top ? top.v : 0; // 바닥은 제약만. 기본값은 제약도 관례도 없을 때만(core.js resolve와 같다)
    let floorSrc = top ? top.src : '';
    if (p === 'rowHeight' && params.targetMin > floor) { floor = params.targetMin; floorSrc = `최소 터치 영역 · ${paramSrc.targetMin}`; }
    const conv = CONV_ORDER.map(k => picked[k]?.params?.[p]).find(e => e && e.s === '관례');
    params[p] = conv ? Math.max(floor, conv.v) : (floor || PARAM[p][1]);
    paramSrc[p] = (conv && conv.v === params[p] ? conv.src : floor === params[p] ? floorSrc : '') || '';
  }
  return { params, paramSrc, picked };
}

// 검사(visualJudge)에 넘길 조건: 기본값과 근거, 고른 조건 id
// 본문 기준(bodyMin)은 관례 값만 쓴다. 모바일 16px은 입력칸 확대를 막는 제약이라 본문이 아니라 입력칸(inputMin)에 건다
export function condFor(sel) {
  const { params, paramSrc, picked } = paramsFor(sel);
  const conv = CONV_ORDER.map(k => picked[k]?.params?.fontBase).find(e => e && e.s === '관례');
  const input = ['mobile', 'tablet'].includes(sel.platform) ? 16 : null;
  return { ...sel, ...params, src: paramSrc, bodyMin: conv ? conv.v : 14, bodySrc: conv ? conv.src : '흔한 하한', inputMin: input };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--sel');
  const sel = Object.fromEntries((i >= 0 ? args[i + 1] : '').split(',').filter(Boolean).map(kv => kv.split('=')));
  const { params, paramSrc } = paramsFor(sel);
  for (const p of Object.keys(PARAM)) console.log(`${PARAM[p][0]}: ${params[p]}px${paramSrc[p] ? ` (${paramSrc[p]})` : ''}`);
  console.log(`\nwindow.__designCond = ${JSON.stringify(condFor(sel))};`);
}
