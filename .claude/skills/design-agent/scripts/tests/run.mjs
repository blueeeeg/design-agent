#!/usr/bin/env node
// design-agent 스크립트 검사. 저장소 맨 위에서:
//   npm run test:skill                 모든 검사
//   npm run test:skill -- screen-bad   이름에 이 글이 든 검사만
//   npm run test:skill -- --update     지금 출력을 기준(snapshots/)으로 저장. 차이를 보고 의도한 변경일 때만
// 검사 목록과 기대는 cases.json. 검사용 화면은 scripts/fixtures/, 예시는 examples/
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { visualCriteria, screenRules, ariaHideDecor, visualLines, readSrc } from './coverage.mjs';
import { execFile } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = dirname(HERE);
const SKILL = dirname(SCRIPTS);
const ROOT = process.cwd();
const SNAP = join(HERE, 'snapshots');

const args = process.argv.slice(2);
const update = args.includes('--update');
const filter = args.filter(a => !a.startsWith('--'));
const { cases, coverage: covCfg = {} } = JSON.parse(readFileSync(join(HERE, 'cases.json'), 'utf8'));
const chosen = cases.filter(c => !filter.length || filter.some(f => c.name.includes(f)));
if (!chosen.length) { console.error(`「${filter.join(' ')}」이 이름에 든 검사가 없다`); process.exit(1); }
if (!existsSync(join(ROOT, 'data'))) { console.error('저장소 맨 위에서 돌린다(data/가 필요하다)'); process.exit(1); }

// 스킬 폴더 기준 경로를 저장소 기준으로 바꾼다. 출력에 경로가 찍혀 기준과 같아야 하므로 늘 같은 모양으로 넘긴다
const fix = a => (/^(scripts|examples|references)\//.test(a) ? relative(ROOT, join(SKILL, a)) : a);

const runOne = c => new Promise(res => {
  const [script, ...rest] = c.run;
  execFile(process.execPath, [join(SCRIPTS, script), ...rest.map(fix)], { cwd: ROOT, encoding: 'utf8', timeout: 60000 }, (err, stdout, stderr) => {
    const code = err ? (typeof err.code === 'number' ? err.code : -1) : 0;
    res({ c, code, out: (stdout + (stderr ? `\n[stderr]\n${stderr}` : '')).trimEnd() + '\n' });
  });
});

// 한 번에 몇 개씩 돌린다(jsdom이 무겁다)
async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

// 줄 단위 차이(LCS). 출력은 수십 줄이라 충분하다
function diff(a, b) {
  const A = a.split('\n'), B = b.split('\n');
  const L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const lines = []; let i = 0, j = 0;
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { i++; j++; }
    else if (i < A.length && (j >= B.length || L[i + 1][j] >= L[i][j + 1])) lines.push(`    - ${A[i++]}`);
    else lines.push(`    + ${B[j++]}`);
  }
  return lines;
}

const t0 = Date.now();
const results = await pool(chosen, 4, runOne);
mkdirSync(SNAP, { recursive: true });
let failed = 0, changed = 0;

for (const { c, code, out } of results) {
  const problems = [];
  if (c.exit !== undefined && code !== c.exit) problems.push(`끝 코드 ${code} (기대 ${c.exit})`);
  for (const s of c.has || []) if (!out.includes(s)) problems.push(`있어야 하는데 없다: 「${s}」`);
  for (const s of c.not || []) if (out.includes(s)) problems.push(`없어야 하는데 있다: 「${s}」`);

  const file = join(SNAP, `${c.name}.txt`);
  const saved = `$ ${c.run.join(' ')}\n[exit ${code}]\n${out}`;
  const prev = existsSync(file) ? readFileSync(file, 'utf8') : null;
  let snapNote = '';
  if (update) { if (prev !== saved) { writeFileSync(file, saved); snapNote = prev === null ? ' (기준 새로 저장)' : ' (기준 갱신)'; } }
  else if (prev === null) problems.push('기준 출력(snapshots/)이 없다. 새 검사면 출력을 보고 npm run test:skill -- --update');
  else if (prev !== saved) { changed++; problems.push('출력이 기준과 다르다:', ...diff(prev, saved)); }

  if (problems.length) {
    failed++;
    console.log(`✗ ${c.name}${snapNote}${c.why ? ` — ${c.why}` : ''}`);
    for (const p of problems) console.log(p.startsWith('    ') ? p : `  ${p}`);
  } else console.log(`✓ ${c.name}${snapNote}`);
}

// cases.json에서 지운 검사의 기준 파일은 --update 때 지운다
if (update && !filter.length) {
  const names = new Set(cases.map(c => `${c.name}.txt`));
  for (const f of readdirSync(SNAP)) if (!names.has(f)) { unlinkSync(join(SNAP, f)); console.log(`- 지움: snapshots/${f}`); }
}

// ---- 기준을 싹 다 돌렸나. 이름으로 일부만 돌리거나 --update일 때는 건너뛴다 ----
let extraFail = 0;
if (!filter.length && !update) {
  // 1. 기준 세기: 판단 문장·규칙마다 거는 시험 화면이 있나
  const visOut = results.filter(r => r.c.run[0] === 'check-visual.mjs').map(r => r.out).join('\n');
  const scrOut = results.filter(r => r.c.run[0] === 'check-screen.mjs').map(r => r.out).join('\n');
  const crit = visualCriteria(readSrc(join(SCRIPTS, 'visual-audit.js')));
  const browserOnly = covCfg.browserOnly || [];
  const inBrowser = c => browserOnly.find(b => c.label.includes(b.match));
  const missV = crit.filter(c => !c.rx.test(visOut) && !inBrowser(c));
  const staleB = browserOnly.filter(b => !crit.some(c => c.label.includes(b.match)));
  const rules = screenRules(readSrc(join(SCRIPTS, 'check-screen.mjs')));
  const missS = rules.filter(r => !scrOut.includes(r));
  const nB = crit.filter(inBrowser).length;
  console.log(`\n기준 세기: 색·글자·여백 판단 ${crit.length}개 중 ${crit.length - missV.length - nB}개를 시험 화면이 건다(브라우저에서만 도는 ${nB}개는 cases.json coverage.browserOnly) · 화면 구조 규칙 ${rules.length}개 중 ${rules.length - missS.length}개`);
  for (const c of missV) console.log(`✗ 거는 시험 화면이 없는 판단: [${c.sec}] 「${c.label}」`);
  for (const r of missS) console.log(`✗ 거는 시험 화면이 없는 규칙: 「${r}」`);
  for (const b of staleB) console.log(`✗ coverage.browserOnly의 「${b.match}」에 맞는 판단이 없다(문장이 바뀌었나)`);
  if (missV.length || missS.length || staleB.length) { extraFail++; console.log('  새 기준을 더했으면 그것이 걸리는 시험 화면을 scripts/fixtures/에 두고 cases.json에 넣는다. 브라우저에서만 재는 것이면 coverage.browserOnly에 이유와 함께 적는다'); }

  // 2. aria-hidden 변형: 꾸밈에 aria-hidden을 붙여도 모양 검사 결과가 같아야 한다
  const tmp = mkdtempSync(join(tmpdir(), 'design-agent-variant-'));
  const base = results.filter(r => ['check-visual.mjs', 'check-screen.mjs'].includes(r.c.run[0]) && /\.html$/.test(r.c.run[1] || ''));
  const variants = [];
  base.forEach((r, i) => {
    const html = readFileSync(join(SKILL, r.c.run[1]), 'utf8'), v = ariaHideDecor(html);
    if (v === html) return;
    const dir = join(tmp, String(i)); mkdirSync(dir); const f = join(dir, r.c.run[1].split('/').pop()); writeFileSync(f, v);
    variants.push({ orig: r, c: { name: `${r.c.name} (aria-hidden 변형)`, run: [r.c.run[0], f, ...r.c.run.slice(2)] } });
  });
  // 바꿀 꾸밈이 있는 시험 화면이 하나도 없으면 이 확인은 아무것도 안 본 채 통과한다
  if (!variants.length) { extraFail++; console.log('✗ aria-hidden 변형: 바뀌는 시험 화면이 없다. svg·이모지·기호 span이 있는 시험 화면이 필요하다'); }
  const vres = await pool(variants.map(v => v.c), 4, runOne);
  let same = 0;
  vres.forEach((vr, i) => {
    const a = visualLines(variants[i].orig.out), b = visualLines(vr.out);
    if (a === b) { same++; return; }
    extraFail++;
    console.log(`✗ ${vr.c.name}: 꾸밈에 aria-hidden만 붙였는데 모양 검사 결과가 달라졌다`);
    for (const l of diff(a, b)) console.log(l);
  });
  rmSync(tmp, { recursive: true, force: true });
  console.log(`aria-hidden 변형: 바뀌는 시험 화면 ${variants.length}개 중 ${same}개가 결과 같음`);
}

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${chosen.length}개 중 ${chosen.length - failed}개 통과${extraFail ? ` · 기준 세기·변형에서 ${extraFail}건 실패` : ''} · ${sec}초`);
if (changed) console.log('출력이 바뀐 검사가 있다. 차이를 보고 의도한 변경이면 npm run test:skill -- --update, 아니면 스크립트를 고친다');
process.exit(failed || extraFail ? 1 : 0);
