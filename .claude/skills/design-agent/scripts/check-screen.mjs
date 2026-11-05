#!/usr/bin/env node
// 만든 화면(HTML 파일)에서 흔한 실수를 찾는다. 사람이 볼 것을 줄이는 1차 검사이고, 다 잡지는 못한다
// 쓰는 법: node check-screen.mjs page.html --sel platform=mobile,skill=first,device=shared,content=photo --action once
//          --rules design-rules.json  (그 서비스에서 정한 것. 정한 주제는 빼고, 안 정한 취향 항목은 끝에 「정한 건지 확인」으로)
//          --house                    (규칙 파일은 없지만 사내 시스템·브랜드 규칙이 있는 서비스)
// 한계: <style> 안 CSS만 읽는다(<link> 파일은 안 읽는다). 레이아웃 계산이 없어 크기는 CSS에 적힌 값으로만 본다
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { paramsFor } from './params.mjs';

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && !['--sel', '--action', '--rules'].includes(args[i - 1]));
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
if (!file) { console.error('검사할 HTML 파일을 넣어 주세요. 예: node check-screen.mjs page.html --sel platform=mobile,skill=first'); process.exit(1); }
const sel = Object.fromEntries((arg('--sel') || '').split(',').filter(Boolean).map(kv => kv.split('=')));
const action = arg('--action') || 'none';
const rules = arg('--rules') ? JSON.parse(readFileSync(arg('--rules'), 'utf8')) : args.includes('--house') ? {} : null;
if (rules && args.includes('--house')) rules.house = true;

const html = readFileSync(file, 'utf8');
const { document: doc, getComputedStyle } = new JSDOM(html).window;
const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
const scripts = [...doc.querySelectorAll('script')].map(s => s.textContent).join('\n');
const text = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
const visible = el => !el.closest('[hidden], [aria-hidden="true"], template');
const where = el => {
  const id = el.id ? `#${el.id}` : '';
  const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
  return `<${el.tagName.toLowerCase()}${id}${cls}>`;
};

// 확대 막기: 글자가 작아 보이는 사람이 손가락으로 키울 수 없다 — WCAG 2.2 1.4.4. 빈 껍데기 index.html에도 있으니 먼저 본다
const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
const badViewport = /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0*)?(\s|,|$)/i.test(viewport);
// React·Vue 앱의 index.html은 빈 <div id="root">뿐이다. 여기에 「걸린 것 없음」이라고 하면 통과로 읽힌다(2026-11-02 실제 서비스 시험)
if (!text(doc.body) && doc.querySelector('script[src], script[type="module"]')) {
  console.log(`검사: ${file}\n화면이 JS로 그려지는 빈 껍데기라 검사할 것이 없다(통과가 아니다). 띄운 페이지를 브라우저에서 재거나(SKILL.md 7단계) 화면을 그리는 소스를 읽는다`);
  if (badViewport) console.log(`- [꼭 고칠 것] 확대 막기: viewport에 「${viewport.trim()}」. user-scalable=no와 maximum-scale=1을 지운다(WCAG 2.2 1.4.4)`);
  process.exit(badViewport ? 1 : 2);
}

const found = [];
// 세기: 꼭 = 꼭 고칠 것(규격·사고), 권장 = 고치기를 권함, 확인 = 사람이 한 번 볼 것
// 서비스가 일부러 정했을 수 있는 항목(visual-audit.js HOUSE_TOPICS와 같은 주제 이름)
const TOPIC = { '사진 목록에 스피너': 'pattern.loading', '굵은 글자가 너무 많음': 'weight', '보라·파랑 그라데이션': 'palette', 'Inter 한 가지 서체': 'font', '이모지 제목 표시': 'decor', '과장 문구': 'copy', '「A가 아니라 B」 문장': 'copy', '대시(—) 남발': 'copy' };
// 실패 이름(references/failures.md, visual-audit.js FAILS)
const FAIL = { '확대 막기': 'hard', '이름 없는 버튼': 'confusing', '처음 쓰는 사람에게 아이콘만 있는 버튼': 'confusing', '두 번 눌림 방지 없음': 'accident', '오류를 토스트로만 알림': 'accident', '사진 목록에 스피너': 'mismatch', '빈 화면 없음': 'missing', '같은 목록 안 항목 구조가 다름': 'uneven', '경계가 없는 띄운 층': 'confusing', '굵은 글자가 너무 많음': 'flat', '상태를 색만으로 표시': 'confusing', '보라·파랑 그라데이션': 'generic', 'Inter 한 가지 서체': 'generic', '이모지 제목 표시': 'generic', 'hover로만 보이는 것': 'confusing', '과장 문구': 'generic', '「A가 아니라 B」 문장': 'generic', '근거를 밝히지 않은 큰 숫자': 'generic', '대시(—) 남발': 'generic', '누를 곳이 작음': 'hard' };
const add = (level, rule, why, els = []) => found.push({ level, rule, why, at: els.slice(0, 3).map(where), fail: FAIL[rule], ...(TOPIC[rule] && { topic: TOPIC[rule] }) });

if (badViewport) add('꼭', '확대 막기', `viewport에 「${viewport.trim()}」. user-scalable=no와 maximum-scale=1을 지운다(WCAG 2.2 1.4.4)`, [doc.querySelector('meta[name="viewport"]')]);


// 1. 이름 없는 버튼: 글자도 aria-label도 없으면 스크린리더가 읽을 게 없다. 처음 쓰는 사람에게는 아이콘만 있는 버튼도 피한다
const buttons = [...doc.querySelectorAll('button, [role="button"], a[href]')].filter(visible);
const nameless = buttons.filter(b => !text(b) && !b.getAttribute('aria-label') && !b.getAttribute('title') && !b.querySelector('img[alt]:not([alt=""])'));
if (nameless.length) add('꼭', '이름 없는 버튼', '글자·aria-label이 없어 무엇을 하는 버튼인지 알 수 없다 (WCAG 2.2 · 4.1.2)', nameless);
const iconOnly = buttons.filter(b => !text(b) && (b.getAttribute('aria-label') || b.getAttribute('title')));
if (iconOnly.length && sel.skill === 'first') add('권장', '처음 쓰는 사람에게 아이콘만 있는 버튼', '아이콘만으로는 뜻을 모른다. 글자 라벨을 같이 둔다', iconOnly);

// 2. 결제·송금·주문 버튼을 누른 뒤 두 번 눌리지 않게 막았나
const money = buttons.filter(b => /결제|송금|이체|주문하기|주문 완료|구매|pay|order|checkout|transfer/i.test(text(b)));
// 누른 뒤 잠그는 코드는 스크립트나 상태 CSS에 있다. HTML에 처음부터 박힌 disabled는 누른 뒤 잠금이 아니라 세지 않는다
const guarded = /\.disabled\s*=|setAttribute\(\s*['"](disabled|aria-busy)|toggleAttribute\(\s*['"]disabled|aria-busy/.test(scripts) || /\[aria-busy|:disabled/.test(css);
if (money.length && !guarded && action !== 'light') add('꼭', '두 번 눌림 방지 없음', '결제·주문·송금 버튼을 누른 뒤 잠그는 코드(disabled, aria-busy)가 보이지 않는다. 두 번 결제될 수 있다', money);

// 3. 오류를 사라지는 토스트로만 알림
const toasts = [...doc.querySelectorAll('[class*="toast" i], [class*="snackbar" i]')];
const errToasts = toasts.filter(t => /실패|오류|에러|error|fail/i.test(text(t)));
if (errToasts.length) add(sel.device === 'shared' || action === 'once' || action === 'irreversible' ? '꼭' : '권장', '오류를 토스트로만 알림', '금방 사라져 놓친다. 입력 오류는 그 칸 아래에, 결제 실패는 남는 문구나 대화상자로', errToasts);

// 4. 사진 목록에 스피너
const imgs = doc.querySelectorAll('img, [class*="thumb" i], [class*="photo" i]').length;
const spinners = [...doc.querySelectorAll('[class*="spinner" i], [class*="loader" i], [class*="loading" i] svg, [role="progressbar"]:not([aria-valuenow])')];
if (spinners.length && (sel.content === 'photo' || imgs >= 6)) add('권장', '사진 목록에 스피너', '다 오면 레이아웃이 한꺼번에 튄다. 사진 자리를 미리 잡는 스켈레톤을 쓴다', spinners);

// 5. 목록이 비었을 때 화면
const lists = [...doc.querySelectorAll('ul, ol, [role="list"], tbody')].filter(l => l.children.length >= 2);
if (lists.length && !/없습니다|없어요|비어 있|비었|아직 .*없|empty/i.test(html)) add('확인', '빈 화면 없음', '목록이 비었을 때 보일 문구·다음 행동이 페이지에 없다. 처음·검색 결과 없음·오류를 나눠 쓴다', lists);

// 6. 같은 목록 안 항목 모양이 제각각
const shape = el => [...el.children].map(c => c.tagName).join('>');
const uneven = lists.filter(l => l.children.length >= 3 && new Set([...l.children].map(shape)).size > 1);
if (uneven.length) add('확인', '같은 목록 안 항목 구조가 다름', '같은 종류는 같은 자리에 같은 정보를 둔다(사진·이름·시간 위치)', uneven);

// 7. 띄운 층(모달·시트·팝오버)에 테두리도 그림자도 없음
const layers = [...doc.querySelectorAll('dialog, [role="dialog"], [class*="modal" i], [class*="sheet" i], [class*="popover" i], [class*="dropdown" i]')];
const flat = layers.filter(l => { const s = getComputedStyle(l); return (!s.boxShadow || s.boxShadow === 'none') && (!s.borderTopWidth || s.borderTopWidth === '0px' || s.borderTopStyle === 'none'); });
if (flat.length) add('권장', '경계가 없는 띄운 층', '테두리도 그림자도 없어 뒤 화면과 구분이 안 된다', flat);

// 8. 굵은 글자 비율
const textEls = [...doc.body.querySelectorAll('*')].filter(e => visible(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
const bold = textEls.filter(e => { const w = getComputedStyle(e).fontWeight; return /bold/.test(w) || Number(w) >= 600 || /^(B|STRONG|H\d)$/.test(e.tagName); });
if (textEls.length >= 10 && bold.length / textEls.length > 0.4) add('권장', '굵은 글자가 너무 많음', `글자 덩어리 ${textEls.length}개 중 ${bold.length}개가 굵다. 굵기와 크기로 위계가 서지 않는다`);

// 9. 상태를 색만으로
const marks = [...doc.querySelectorAll('[class*="status" i], [class*="badge" i], [class*="dot" i]')].filter(m => visible(m) && !text(m) && !m.getAttribute('aria-label'));
if (marks.length) add('꼭', '상태를 색만으로 표시', '색을 못 구분하는 사람은 모른다. 글자나 아이콘을 같이 쓴다 (WCAG 2.2 · 1.4.1)', marks);

// 10. AI가 흔히 넣는 기본값
if (/linear-gradient\([^)]*(#(?:[6-9a-f][0-9a-f])[0-4][0-9a-f]{3}|purple|violet|indigo|#7c3aed|#8b5cf6|#6366f1)/i.test(css)) add('권장', '보라·파랑 그라데이션', '근거 없이 넣는 흔한 기본값이다. 브랜드 색이 정한 게 아니면 뺀다');
const fonts = [...css.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map(m => m[1]);
if (fonts.length && fonts.every(f => /^\s*['"]?Inter['"]?\s*(,\s*(sans-serif|system-ui|-apple-system).*)?$/i.test(f))) add('확인', 'Inter 한 가지 서체', '한글은 Inter에 없어 대체 글꼴로 섞인다. 한글 서체를 정한다');
const emojiHeads = [...doc.querySelectorAll('h1, h2, h3, h4')].filter(h => /^\p{Extended_Pictographic}/u.test(text(h)));
if (emojiHeads.length) add('권장', '이모지 제목 표시', '이모지를 섹션 표시로 쓰지 않는다', emojiHeads);
if (/:hover[^{]*\{[^}]*(display\s*:\s*(block|flex)|visibility\s*:\s*visible|opacity\s*:\s*1)/i.test(css) && sel.platform !== 'desktop') add('확인', 'hover로만 보이는 것', '터치 화면에는 hover가 없다. 꼭 필요한 동작을 hover 뒤에 숨기지 않는다');

// 10-1. AI가 흔히 쓰는 문구: 과장, 「A가 아니라 B」 대비, 근거 없어 보이는 큰 숫자, 대시 남발(2026-11-03 조사)
const shown = doc.body.cloneNode(true);
shown.querySelectorAll('script, style, template, [hidden], [aria-hidden="true"]').forEach(e => e.remove());
const copy = (shown.textContent || '').replace(/\s+/g, ' ');
const hits = re => [...new Set([...copy.matchAll(re)].map(m => m[0].replace(/^[.!?]\s*/, '').trim()))].slice(0, 4).map(s => `「${s}」`).join(', ');
// 「완벽한」「원활한」은 평범한 문장에도 나온다. 한 번 나온 것은 넘기고, 두 번 넘게 나올 때만 알린다
const HYPE = /혁신적인?|획기적인?|압도적인?|차원이 다른|완벽한|놀라운|새로운 경험|게임 ?체인저|원활한|강력한|supercharge\w*|seamless\w*|revolutioni[sz]\w*|world-class|cutting-edge|game-?chang\w*|next-gen\w*|effortless\w*|unlock (?:your|the)\b/gi;
if ((copy.match(HYPE) || []).length >= 2) add('확인', '과장 문구', `${hits(HYPE)}. 무엇이 어떻게 좋은지 구체적인 사실로 바꾼다`);
// 짧게 단정하는 「X가 아니라 Y입니다」만 잡는다. 「드롭다운이 아니라 시트로 열린다」 같은 사실 비교는 넘긴다
const FOIL = /(?:^|[.!?] )[^.!?]{0,12}(?:이|가) 아니라 [^.!?\s]{1,12}(?: [^.!?\s]{1,8})?(?:입니다|이에요|예요)[.!]|\bnot (?:just )?an? [\w-]+\. An? [\w-]+\./gi;
if (hits(FOIL)) add('확인', '「A가 아니라 B」 문장', `${hits(FOIL)}. AI 글투로 많이 꼽힌다. 하고 싶은 말을 바로 쓴다`);
// 100%·200%(확대 비율) 같은 평범한 값은 넘기고 1,000% 넘는 값과 「10배 빠른」만 본다
const BIG = /\d{1,3}(?:,\d{3})+\s?%|\d{4,}\s?%|\d{2,}\s?배 (?:빠|늘|많)|\d{2,}x (?:faster|more)/gi;
if (hits(BIG)) add('확인', '근거를 밝히지 않은 큰 숫자', `${hits(BIG)}. 실제 수치가 아니면 빼고, 실제면 출처나 기준을 옆에 적는다`);
const dashes = (copy.match(/—/g) || []).length;
if (dashes >= 3) add('확인', '대시(—) 남발', `화면 글에 「—」가 ${dashes}번 나온다. 문장을 나누거나 쉼표로`);

// 11. 누를 곳 크기(CSS에 적힌 값만)
// 조건의 최소 누를 곳(params.mjs, recommend.mjs DESIGN.md와 같은 값). 플랫폼을 안 주면 모바일 기준 44px
const minTouch = sel.platform ? paramsFor(sel).params.targetMin : 44;
const small = [...css.matchAll(/([^{}]*(?:button|btn|\.icon)[^{}]*)\{[^}]*?(?:^|;|\s)(?:min-)?height\s*:\s*(\d+)px/gi)].filter(m => Number(m[2]) < minTouch);
if (small.length) add('꼭', '누를 곳이 작음', `CSS에 ${small.map(m => `${m[1].trim().slice(0, 30)} ${m[2]}px`).slice(0, 3).join(', ')}. 이 조건의 최소는 ${minTouch}px`);

const order = { 꼭: 0, 권장: 1, 확인: 2 };
found.sort((a, b) => order[a.level] - order[b.level]);
const ctx = {};
vm.runInNewContext(`${readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'visual-audit.js'), 'utf8')}\nthis.visualHouse = visualHouse; this.houseName = houseName; this.failSummary = failSummary; this.FAILS = FAILS;`, ctx);
const house = ctx.visualHouse(found, rules);
const line = f => `${f.rule}: ${f.why}${f.at.length ? `\n    위치: ${f.at.join(', ')}` : ''}`;
console.log(`검사: ${file}${Object.keys(sel).length ? ` · ${Object.entries(sel).map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}${action !== 'none' ? ` · action=${action}` : ''}${rules ? ' · 서비스 규칙 있음' : ''}`);
if (ctx.failSummary(house.main)) console.log(`${ctx.failSummary(house.main)} (이름 뜻과 고치는 순서: references/failures.md)`);
if (!house.main.length) console.log(`${house.ask.length ? '규격·동작에서 ' : ''}걸린 것 없음. 이 검사가 못 보는 것(실제 크기, 대비, 흐름)은 스크린샷으로 확인한다`);
for (const f of house.main) console.log(`- [${f.level === '꼭' ? '꼭 고칠 것' : f.level === '권장' ? '고치기 권함' : '확인'} · ${ctx.FAILS[f.fail]}] ${line(f)}`);
if (house.ask.length) {
  console.log('\n정한 건지 확인(서비스에서 일부러 정한 거면 그대로 두고, 아니면 고친다. 답은 design-rules.json에 적는다)');
  for (const f of house.ask) console.log(`- [${ctx.houseName(f.topic)} · ${ctx.FAILS[f.fail]}] ${line(f)}`);
}
if (house.skipped.length) console.log(`\n정해 둬서 뺀 것: ${house.skipped.join(', ')}`);
process.exit(house.main.some(f => f.level === '꼭') ? 1 : 0);
