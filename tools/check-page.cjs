// 빌드한 페이지를 jsdom으로 열어 검사한다. 실행: npm run build && npm run check
// 1) 패턴 페이지: 모든 패턴을 그리고, 카드가 자기 「피하는 곳」 조건으로 그려지지 않았는지
// 2) 내 서비스에 맞추기: 모든 조건 조합과 작업 종류로 추천 목록과 규칙 파일을 그려 오류가 없는지
// 3) UX 기준: 스킬 문서 ux-basics.md와 데모 public/ux/가 생성기(tools/ux-doc.mjs, tools/ux-demos.mjs) 출력과 같은지, 규칙마다 카드와 데모 한 쌍이 있는지,
//    자동 검사가 있는 규칙은 나쁜 예 데모가 그 검사에 걸리고 좋은 예는 안 걸리는지(check-screen.mjs, visualChecks는 check-visual.mjs), 좋은 예가 다른 「꼭」「권장」 검사에도 안 걸리는지,
//    글-2 나쁜 예 말고는 어느 데모도 말투가 섞이지 않았는지, 바뀐 묶음의 예전 주소가 새 주소로 보내는지
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { spawnSync } = require('child_process');

const DIST = path.dirname(process.argv[2]);
const AXES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'axes.json'), 'utf8'));
const optsOf = key => (AXES.axes.find(a => a.key === key) || AXES.action).options.map(o => o.id);
const errors = [];

// jsdom은 모듈 스크립트(import)를 돌리지 못한다. 페이지가 여럿이라 빌드가 공통 코드를 따로 떼어 내니,
// 페이지 스크립트를 rolldown(Vite가 쓰는 묶음 도구)으로 한 파일로 묶어 일반 스크립트로 body 끝에 넣는다
async function open(file, url) {
  const { rolldown } = await import('rolldown');
  const srcs = [];
  let html = fs.readFileSync(file, 'utf8').replace(/<script type="module" src="([^"]+)"><\/script>/g, (m, src) => { srcs.push(src); return ''; });
  const scripts = [];
  for (const src of srcs) {
    const bundle = await rolldown({ input: path.join(DIST, src), logLevel: 'silent' });
    const { output } = await bundle.generate({ format: 'iife' });
    scripts.push(`<script>${output[0].code.replace(/<\/script/gi, '<\\/script')}</script>`);
  }
  html = html.replace('</body>', () => `${scripts.join('')}</body>`);
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Could not load link|stylesheet/.test(e.message)) errors.push(`${url}: ${e.message}`); });
  const dom = new JSDOM(html, { url, runScripts: 'dangerously', virtualConsole: vc, pretendToBeVisual: true });
  if (errors.length) { console.log('처음 열 때 오류', errors.slice(0, 5)); process.exit(1); }
  return dom.window;
}

(async () => {
// ---------- 1. 패턴 페이지 ----------
let w = await open(process.argv[2], 'http://localhost/');
let document = w.document;
const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const ids = () => [...document.querySelectorAll('#comp-index button')].map(b => b.dataset.pattern);
console.log('제목', document.title, '| 위쪽 메뉴', [...document.querySelectorAll('.topnav nav a')].map(a => a.textContent).join(' / '), '| 패턴 제목', document.querySelector('.el-head h1')?.textContent);
console.log('[패턴] 조건 스위치 없음', !document.getElementById('mode-toggle'), '| 조건 줄 없음', !document.querySelector('.controls'), '| 목록에 숫자 없음', !document.querySelector('#comp-index button small'));
console.log('  카드', document.querySelectorAll('#comps .ocard').length, '|', document.querySelector('#comps .q')?.textContent);
const contradictions = [];
ids().forEach(id => {
  click(document.querySelector(`#comp-index button[data-pattern="${id}"]`));
  document.querySelectorAll('#comps .ocard').forEach(card => {
    const cap = (card.dataset.combo || '').split(' · ');
    const avoided = [...card.querySelectorAll('.fchip.avoid')];
    avoided.forEach(ch => {
      if (!cap.includes(ch.textContent)) return;
      // 축의 모든 선택지를 피하는 방식(예: 색만)은 피할 조건이 없으니 넘어간다
      const all = optsOf(ch.dataset.axis).every(o => avoided.some(a => a.dataset.axis === ch.dataset.axis && a.dataset.opt === o));
      if (!all) contradictions.push(`${id}/${card.querySelector('.vh').textContent.trim()}: ${ch.textContent}`);
    });
  });
});
console.log('  피하는 조건으로 그린 카드', contradictions.length ? contradictions : '없음');
console.log('  찾기 칸 없음', !document.getElementById('find'), '| 왼쪽 패턴', document.querySelectorAll('#comp-index button[data-pattern]').length);
const patternCount = ids().length;

// ---------- 2. 내 서비스에 맞추기 ----------
w = await open(path.join(DIST, 'plan', 'index.html'), 'http://localhost/plan/');
document = w.document;
const pclick = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const press = (axis, opt) => { const b = document.querySelector(`#seg-${axis} button[data-opt="${opt}"]`); if (b.getAttribute('aria-pressed') !== 'true') pclick(b); };
const rows = () => document.querySelectorAll('.plan-row').length;
const pickOf = id => document.querySelector(`.plan-row[data-pattern="${id}"] .plan-pick b`)?.textContent;
console.log('[맞추기] 처음 눌린 조건', document.querySelectorAll('#axes button[aria-pressed="true"]').length, '| 추천 줄', rows(), '| 규칙', document.getElementById('rules-body').hidden ? '숨김' : '보임', '|', document.getElementById('rules-wait').textContent);
press('platform', 'mobile');
console.log('  모바일만 고름 → 규칙 숨김', document.getElementById('rules-body').hidden, '|', document.getElementById('pick-status').textContent);
let n = 0;
for (const p of optsOf('platform')) for (const k of optsOf('skill')) for (const d of optsOf('device')) for (const c of optsOf('content')) for (const a of optsOf('action')) {
  press('platform', p); press('skill', k); press('device', d); press('content', c); press('action', a);
  if (rows() !== patternCount || document.getElementById('rules-body').hidden || !document.getElementById('md').textContent.includes('## 패턴별 방식')) errors.push(`맞추기 ${p}/${k}/${d}/${c}/${a}: 목록이나 규칙이 비었다`);
  n++;
}
press('platform', 'mobile'); press('skill', 'first'); press('device', 'personal'); press('content', 'photo');
console.log('  모바일·처음·개인·사진 → 불러오는 동안', pickOf('loading'), '| 입력 확인 시점', pickOf('validate'));
pclick(document.getElementById('clear-pick'));
console.log('  다시 고르기 → 눌린 조건', document.querySelectorAll('#axes button[aria-pressed="true"]').length, '| 규칙 숨김', document.getElementById('rules-body').hidden);
console.log('조합', n, '× 패턴', patternCount, '| errors', errors.length ? errors.slice(0, 5) : 'none');

// ---------- 3. UX 기준 ----------
const uxErrors = [];
const { expected, DOC } = await import('./ux-doc.mjs');
const UX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'ux.json'), 'utf8'));
if (fs.readFileSync(DOC, 'utf8') !== expected()) uxErrors.push('ux-basics.md가 data/ux.json에서 만든 것과 다르다. 규칙은 data/ux.json에서 고치고 node tools/ux-doc.mjs를 돌린다');
const { files: demoFiles, OUT: DEMO_DIR } = await import('./ux-demos.mjs');
const want = demoFiles();
const have = fs.readdirSync(DEMO_DIR).filter(f => f.endsWith('.html'));
const stale = [...new Set([...have, ...Object.keys(want)])].filter(f => !have.includes(f) || want[f] !== fs.readFileSync(path.join(DEMO_DIR, f), 'utf8'));
if (stale.length) uxErrors.push(`public/ux/ 데모가 tools/ux-demos.mjs가 쓰는 것과 다르다(${stale.slice(0, 3).join(', ')}${stale.length > 3 ? ` 외 ${stale.length - 3}개` : ''}). 데모는 tools/ux-demos.mjs에서 고치고 node tools/ux-demos.mjs를 돌린다`);
// 묶음마다 페이지가 하나(/ux/accident/ …). 카드는 제 묶음 페이지에만 있고, 모두 합쳐 규칙 수와 같아야 한다. /ux/는 첫 묶음과 같은 카드를 보인다
const uxPage = rel => new JSDOM(fs.readFileSync(path.join(DIST, rel), 'utf8')).window.document;
const frames = [];
let cards = 0;
for (const g of UX.groups) {
  const d = uxPage(path.join('ux', g.id, 'index.html'));
  const ids = [...d.querySelectorAll('.ux-card')].map(c => c.id);
  const want = UX.rules.filter(r => r.group === g.id).map(r => r.slug);
  if (ids.join() !== want.join()) uxErrors.push(`/ux/${g.id}/ 카드 ${ids.join(',')} ≠ ${want.join(',')}`);
  if (d.querySelector('.side nav a[aria-current="true"]')?.getAttribute('href')?.endsWith(`ux/${g.id}/`) !== true) uxErrors.push(`/ux/${g.id}/ 왼쪽 목록 현재 표시`);
  cards += ids.length;
  frames.push(...d.querySelectorAll('iframe'));
}
// 이름이 바뀐 묶음의 예전 주소는 새 주소로 보내는 페이지로 남는다(/ux/keyboard/ → /ux/everyone/)
for (const g of UX.groups) for (const o of g.oldIds || []) {
  const p = path.join(DIST, 'ux', o, 'index.html');
  if (!fs.existsSync(p) || !fs.readFileSync(p, 'utf8').includes(`ux/${g.id}/`)) uxErrors.push(`/ux/${o}/가 /ux/${g.id}/로 보내지 않는다`);
}
if (cards !== UX.rules.length) uxErrors.push(`/ux/ 묶음 페이지 카드 ${cards}개, 규칙 ${UX.rules.length}개`);
const first = [...uxPage(path.join('ux', 'index.html')).querySelectorAll('.ux-card')].map(c => c.id).join();
if (first !== UX.rules.filter(r => r.group === UX.groups[0].id).map(r => r.slug).join()) uxErrors.push('/ux/가 첫 묶음을 열지 않는다');
for (const f of frames) {
  const src = f.getAttribute('src').replace(/^\//, '');
  if (!fs.existsSync(path.join(DIST, src))) uxErrors.push(`데모 파일 없음: ${src}`);
  if (f.getAttribute('sandbox') !== 'allow-scripts' || !f.getAttribute('title')) uxErrors.push(`데모 틀 속성: ${src}`);
}
const CHECK = path.join(__dirname, '..', '.claude', 'skills', 'design-agent', 'scripts', 'check-screen.mjs');
// 걸린 규칙 이름 → 세기(「꼭 고칠 것」「고치기 권함」「확인」)
const hitsOf = file => new Map([...spawnSync(process.execPath, [CHECK, file], { encoding: 'utf8' }).stdout.matchAll(/^- \[([^\]·]+?)(?: · [^\]]+)?\] (.+?): /gm)].map(m => [m[2], m[1].trim()]));
// 색·글자·여백 검사(check-visual.mjs)에만 있는 판단은 visualChecks의 말이 출력에 나오는지로 본다(누구나-6 움직임 줄이기, 누구나-8 시간 제한)
const VISUAL = path.join(path.dirname(CHECK), 'check-visual.mjs');
const visualOf = file => spawnSync(process.execPath, [VISUAL, file], { encoding: 'utf8' }).stdout;
let checked = 0;
for (const r of UX.rules) {
  if (!r.demo) continue;
  const bad = hitsOf(path.join(DIST, 'ux', `${r.slug}-bad.html`)), good = hitsOf(path.join(DIST, 'ux', `${r.slug}-good.html`));
  // 데모 하나 안의 글은 한 말투로(우리 규칙 글-2). 일부러 섞은 글-2 나쁜 예만 뺀다
  if (good.has('말투가 섞임')) uxErrors.push(`${r.id} 좋은 예 데모의 말투가 섞였다`);
  if (bad.has('말투가 섞임') && !r.checks.includes('말투가 섞임')) uxErrors.push(`${r.id} 나쁜 예 데모의 말투가 섞였다(이 규칙과 상관없는 차이)`);
  // 좋은 예는 그 규칙만 지킨 화면이 아니라 따라 해도 되는 화면이다. 「꼭」「권장」 검사에 걸리면 안 된다(goodAllow에 이유를 적은 것만 뺀다)
  for (const [c, lv] of good) if (lv !== '확인' && !(r.goodAllow || {})[c]) uxErrors.push(`${r.id} 좋은 예 데모가 「${c}」(${lv})에 걸린다`);
  for (const c of r.visualChecks || []) {
    if (!visualOf(path.join(DIST, 'ux', `${r.slug}-bad.html`)).includes(c)) uxErrors.push(`${r.id} 나쁜 예 데모가 색·글자·여백 검사 「${c}」에 안 걸린다`);
    if (visualOf(path.join(DIST, 'ux', `${r.slug}-good.html`)).includes(c)) uxErrors.push(`${r.id} 좋은 예 데모가 색·글자·여백 검사 「${c}」에 걸린다`);
  }
  if (!r.checks.length && !(r.visualChecks || []).length) continue;
  for (const c of r.checks) {
    if (!bad.has(c)) uxErrors.push(`${r.id} 나쁜 예 데모가 「${c}」에 안 걸린다`);
    if (good.has(c)) uxErrors.push(`${r.id} 좋은 예 데모가 「${c}」에 걸린다`);
  }
  checked++;
}
console.log('[UX 기준] 스킬 문서', uxErrors.some(e => e.startsWith('ux-basics')) ? '어긋남' : '같음', '| 묶음 페이지', UX.groups.length, '| 카드', cards, '| 데모', frames.length, '| 데모 파일', stale.length ? '어긋남' : '같음', '| 자동 검사로 본 데모 쌍', checked, '| errors', uxErrors.length ? uxErrors : 'none');

// 오류나 모순이 있으면 실패로 끝낸다. 배포 전에 막을 수 있게(giting.kr slop_check의 종료 코드 방식)
if (errors.length || contradictions.length || uxErrors.length) process.exit(1);
})();
