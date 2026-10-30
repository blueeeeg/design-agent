// 빌드한 페이지를 jsdom으로 열어 검사한다. 실행: npm run build && npm run check
// 1) 패턴 페이지: 모든 패턴을 그리고, 카드가 자기 「피하는 곳」 조건으로 그려지지 않았는지
// 2) 내 서비스에 맞추기: 모든 조건 조합과 작업 종류로 추천 목록과 규칙 파일을 그려 오류가 없는지
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

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
// 오류나 모순이 있으면 실패로 끝낸다. 배포 전에 막을 수 있게(giting.kr slop_check의 종료 코드 방식)
if (errors.length || contradictions.length) process.exit(1);
})();
