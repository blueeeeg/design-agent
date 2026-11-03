#!/usr/bin/env node
// 여러 화면(또는 고치기 전·후)의 색·글자·버튼·모서리를 견주어 어긋난 값을 알려 준다
// 쓰는 법: node compare-pages.mjs home.html list.html pay.html        (HTML 파일은 check-visual.mjs로 잰다)
//          node compare-pages.mjs before.html after.html              (두 개면 전·후에 달라진 값)
//          node compare-pages.mjs home.json pay.json                  (브라우저에서 받은 JSON.stringify(visualAudit(document, window).sig))
//          node compare-pages.mjs collected.json                      (브라우저 sessionStorage의 __visualSigs를 그대로 저장한 것)
//          --labels 홈,목록,결제  (이름을 정한다. 없으면 파일 이름)
// 브라우저에서는 이 스크립트 없이 visualCollect("홈") … visualCompare()로 같은 결과를 본다
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const li = args.indexOf('--labels');
const labels = li >= 0 ? args[li + 1].split(',') : [];
const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--labels');
if (!files.length) { console.error('견줄 화면 파일을 두 개 이상 넣어 주세요. 예: node compare-pages.mjs home.html pay.html'); process.exit(1); }

const list = [];
for (const f of files) {
  if (extname(f) === '.json') {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    if (Array.isArray(j)) list.push(...j);
    else list.push({ label: basename(f, '.json'), sig: j.sig || j });
  } else {
    // check-visual.mjs --json은 글자가 없으면 2로 끝나도 JSON을 낸다. 오류 코드와 상관없이 출력을 읽는다
    let out;
    try { out = execFileSync(process.execPath, [join(HERE, 'check-visual.mjs'), f, '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { out = e.stdout; }
    let sig = null;
    try { sig = JSON.parse(out).sig; } catch (e) { sig = null; }
    if (!sig) { console.error(`${f}: 재지 못해 빼고 견준다(파일이 없거나 HTML이 아니다)`); continue; }
    list.push({ label: basename(f, extname(f)), sig });
  }
}
labels.forEach((l, i) => { if (list[i]) list[i].label = l; });

const ctx = {};
vm.runInNewContext(`${readFileSync(join(HERE, 'visual-audit.js'), 'utf8')}\nthis.visualCompare = visualCompare;`, ctx);
const text = ctx.visualCompare(list);
console.log(text);
process.exit(/: 없음\./.test(text) ? 0 : 1);
