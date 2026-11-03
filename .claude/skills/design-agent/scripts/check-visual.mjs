#!/usr/bin/env node
// 만든 화면의 색·글자·여백을 재고 기준과 견줘 말해 준다. 「어디가 어떻다, 이렇게 고친다」까지
// 쓰는 법: node check-visual.mjs page.html            (같은 폴더의 <link> CSS도 읽는다)
//          node check-visual.mjs page.html --json     (숫자만)
//          node check-visual.mjs page.html --run-scripts  (화면을 자바스크립트로 그리면. 페이지 스크립트를 실행하니 내가 만든 파일에만 쓴다)
// 브라우저에서 띄운 앱은 visual-audit.js 내용을 그 페이지에서 실행하고 visualAudit(document, window) 결과를 --from-json 파일로 넣는다
// 한계: 그라데이션·사진 위 글자 대비는 못 잰다. 레이아웃 계산이 없어 겹침·잘림은 스크린샷으로 본다
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const file = args.find((a, i) => !a.startsWith('--') && !['--from-json'].includes(args[i - 1]));

// 재는 함수와 판단 함수는 visual-audit.js 하나에 있다(브라우저와 같은 코드)
const AUDIT = readFileSync(join(HERE, 'visual-audit.js'), 'utf8');
let r, judged;
if (val('--from-json')) {
  r = JSON.parse(readFileSync(val('--from-json'), 'utf8'));
  const ctx = {};
  vm.runInNewContext(`${AUDIT}\nthis.visualJudge = visualJudge;`, ctx);
  judged = ctx.visualJudge(r);
} else {
  if (!file) { console.error('검사할 HTML 파일을 넣어 주세요. 예: node check-visual.mjs page.html'); process.exit(1); }
  let html = readFileSync(file, 'utf8');
  // 같은 폴더의 <link rel=stylesheet>를 <style>로 끼워 넣는다(외부 주소는 건너뛴다)
  html = html.replace(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi, tag => {
    const href = (tag.match(/href=["']([^"']+)["']/) || [])[1];
    if (!href || /^(https?:)?\/\//.test(href)) return tag;
    // 「/_astro/a.css」처럼 사이트 맨 위 기준 경로는 하위 페이지(dist/plan/index.html)에서 위 폴더로 올라가며 찾는다
    const tries = [];
    for (let d = dirname(file), i = 0; i < (href.startsWith('/') ? 5 : 1); i++, d = dirname(d)) tries.push(resolve(d, href.replace(/^\//, '')));
    const p = tries.find(existsSync);
    return p ? `<style>${readFileSync(p, 'utf8')}</style>` : tag;
  });
  // jsdom은 CSS 변수(var())를 풀지 못한다. 선언을 모아 값으로 바꿔 넣는다(가장 나중 선언, 기본값 지원)
  const vars = {};
  for (const m of html.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)[;}]/g)) vars[m[1]] = m[2].trim();
  const sub = (s, depth = 0) => (depth > 8 ? s : s.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, n, fb) => sub(vars[n] ?? (fb || '').trim(), depth + 1)));
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, a, css) => `<style${a}>${sub(css)}</style>`).replace(/style="([^"]*)"/g, (_, s) => `style="${sub(s)}"`);
  const dom = new JSDOM(html, { runScripts: flag('--run-scripts') ? 'dangerously' : 'outside-only', pretendToBeVisual: true });
  dom.window.__jsdom = true;
  // 스크립트가 그린 화면은 그릴 시간을 조금 준다(타이머로 스켈레톤을 걷는 화면 등)
  if (flag('--run-scripts')) await new Promise(res => setTimeout(res, Number(val('--wait') || 2500)));
  dom.window.eval(AUDIT);
  r = JSON.parse(dom.window.eval('JSON.stringify(visualAudit(document, window))'));
  judged = JSON.parse(dom.window.eval(`JSON.stringify(visualJudge(${JSON.stringify(r)}))`));
}
if (flag('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0); }
if (!r.textCount) {
  console.log('글자를 하나도 찾지 못했다. 화면을 자바스크립트로 그리는 페이지라면 --run-scripts를 붙이거나(내가 만든 파일만), 브라우저에서 visual-audit.js로 잰다');
  process.exit(2);
}

const LABEL = { 꼭: '꼭 고칠 것', 권장: '고치기 권함', 확인: '확인', 좋음: '좋음', 정보: '재 본 값' };
console.log(`색·글자·여백 진단${file ? `: ${file}` : ''}`);
for (const sec of ['색', '글자', '여백·모양']) {
  console.log(`\n[${sec}]`);
  for (const f of judged.filter(x => x.sec === sec)) console.log(`- ${LABEL[f.level]}: ${f.text}`);
}
process.exit(judged.some(f => f.level === '꼭') ? 1 : 0);
