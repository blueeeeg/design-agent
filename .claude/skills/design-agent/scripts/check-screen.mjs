#!/usr/bin/env node
// 만든 화면(HTML 파일)에서 흔한 실수를 찾는다. 사람이 볼 것을 줄이는 1차 검사이고, 다 잡지는 못한다
// 쓰는 법: node check-screen.mjs page.html --sel platform=mobile,skill=first,device=shared,content=photo --action once
//          --rules design-rules.json  (그 서비스에서 정한 것. 정한 주제는 빼고, 안 정한 취향 항목은 끝에 「정한 건지 확인」으로)
//          --house                    (규칙 파일은 없지만 사내 시스템·브랜드 규칙이 있는 서비스)
//          --run-scripts              (화면을 자바스크립트로 그리면. 스크립트를 돌린 뒤의 화면을 본다. 페이지 스크립트를 실행하니 내가 만든 파일에만. 밖으로 보내는 요청은 막는다)
//          --wait 2500                (--run-scripts에서 그릴 시간, ms)
// 한계: <style> 안 CSS만 읽는다(<link> 파일은 안 읽는다). 레이아웃 계산이 없어 크기는 CSS에 적힌 값으로만 본다
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { paramsFor } from './params.mjs';

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && !['--sel', '--action', '--rules', '--wait'].includes(args[i - 1]));
const arg = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
if (!file) { console.error('검사할 HTML 파일을 넣어 주세요. 예: node check-screen.mjs page.html --sel platform=mobile,skill=first'); process.exit(1); }
const sel = Object.fromEntries((arg('--sel') || '').split(',').filter(Boolean).map(kv => kv.split('=')));
const action = arg('--action') || 'none';
const rules = arg('--rules') ? JSON.parse(readFileSync(arg('--rules'), 'utf8')) : args.includes('--house') ? {} : null;
if (rules && args.includes('--house')) rules.house = true;

const raw = readFileSync(file, 'utf8');
// 스크립트로 그리는 화면은 정적 HTML이 뼈대뿐이라 검사할 것이 거의 없다(2026-11-06 효과 비교에서 스킬이 만든 화면 둘이 정적 글자 8~9자)
const runScripts = args.includes('--run-scripts');
let html = raw;
const scriptErrors = [];
if (runScripts) {
  // 페이지가 밖으로 요청을 보내지 못하게 막는다(XHR·fetch·WebSocket). <script src>와 외부 파일은 jsdom 기본값대로 받지 않는다
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) scriptErrors.push(e.message.split('\n')[0].slice(0, 120)); });
  const d = new JSDOM(raw, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) { w.XMLHttpRequest = undefined; w.fetch = undefined; w.WebSocket = undefined; w.EventSource = undefined; } });
  const wait = Number(arg('--wait') || 2500);
  await new Promise(res => setTimeout(res, Number.isFinite(wait) && wait >= 0 ? wait : 2500));
  html = d.serialize();
  d.window.close();
}
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

// 안에 넣은 스크립트가 화면을 그리는데 --run-scripts 없이 돌렸으면 알린다. 뼈대만 보고 「걸린 것 없음」이라고 하면 통과로 읽힌다
const inlineJs = [...doc.querySelectorAll('script:not([src])')].reduce((n, s) => n + s.textContent.length, 0);
const bodyShown = doc.body.cloneNode(true); bodyShown.querySelectorAll('script, style, template, noscript').forEach(x => x.remove());
// 대략의 기준이다: 정적 글자가 80자를 넘는 껍데기(머리·바닥 글만 정적)는 놓친다
const thin = inlineJs > 1500 && text(bodyShown).replace(/\s/g, '').length < 80;
const drawnByJs = !runScripts && thin;
// 스크립트를 돌렸는데도 그려진 것이 거의 없으면(오류로 멈춤 등) 통과로 읽히지 않게 한다
const notDrawn = runScripts && (thin || scriptErrors.length > 0);
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
const TOPIC = { '사진 목록에 스피너': 'pattern.loading', '굵은 글자가 너무 많음': 'weight', '보라·파랑 그라데이션': 'palette', 'Inter 한 가지 서체': 'font', '이모지 제목 표시': 'decor', '과장 문구': 'copy', '「A가 아니라 B」 문장': 'copy', '대시(—) 남발': 'copy', '말투가 섞임': 'copy' };
// 실패 이름(references/failures.md, visual-audit.js FAILS)
const FAIL = { '확대 막기': 'hard', '이름 없는 버튼': 'confusing', '기호만 있는 버튼': 'confusing', '처음 쓰는 사람에게 아이콘만 있는 버튼': 'confusing', '두 번 눌림 방지 없음': 'accident', '오류를 토스트로만 알림': 'accident', '위험 버튼에 첫 초점': 'accident', '사진 목록에 스피너': 'mismatch', '빈 화면 없음': 'missing', '같은 목록 안 항목 구조가 다름': 'uneven', '경계가 없는 띄운 층': 'confusing', '굵은 글자가 너무 많음': 'flat', '상태를 색만으로 표시': 'confusing', '보라·파랑 그라데이션': 'generic', 'Inter 한 가지 서체': 'generic', '이모지 제목 표시': 'generic', 'hover로만 보이는 것': 'confusing', '과장 문구': 'generic', '「A가 아니라 B」 문장': 'generic', '근거를 밝히지 않은 큰 숫자': 'generic', '대시(—) 남발': 'generic', '누를 곳이 작음': 'hard', '번호가 두 번 붙음': 'confusing', '브라우저 기본 확인창': 'confusing', '대화상자 버튼이 「확인·예」': 'confusing', '「정말 ~하시겠어요?」 제목': 'confusing', '입력이 맞을 때까지 제출 잠금': 'confusing', '저절로 움직이는데 멈춤 없음': 'hard', '끌기로만 하는 동작': 'hard', '키보드로 못 누르는 곳': 'hard', '꺼진 이유가 title에만 있음': 'confusing', '말투가 섞임': 'confusing' };
const add = (level, rule, why, els = []) => found.push({ level, rule, why, at: els.slice(0, 3).map(where), fail: FAIL[rule], ...(TOPIC[rule] && { topic: TOPIC[rule] }) });

if (badViewport) add('꼭', '확대 막기', `viewport에 「${viewport.trim()}」. user-scalable=no와 maximum-scale=1을 지운다(WCAG 2.2 1.4.4)`, [doc.querySelector('meta[name="viewport"]')]);


// 1. 이름 없는 버튼: 글자도 aria-label도 없으면 스크린리더가 읽을 게 없다. 처음 쓰는 사람에게는 아이콘만 있는 버튼도 피한다
const buttons = [...doc.querySelectorAll('button, [role="button"], a[href]')].filter(visible);
const nameless = buttons.filter(b => !text(b) && !b.getAttribute('aria-label') && !b.getAttribute('title') && !b.querySelector('img[alt]:not([alt=""])'));
if (nameless.length) add('꼭', '이름 없는 버튼', '글자·aria-label이 없어 무엇을 하는 버튼인지 알 수 없다 (WCAG 2.2 · 4.1.2)', nameless);
const symbolOnly = buttons.filter(b => /^[✕✖×xX+＋\-−–‹›<>«»⋯…☰≡⌄⌃^∨∧↑↓←→⟵⟶·•?!*]$/.test(text(b)) && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.getAttribute('title'));
if (symbolOnly.length) add('권장', '기호만 있는 버튼', '「✕」「‹」「⋯」는 화면 읽기 프로그램이 기호 이름(곱하기, 작다)으로 읽는다. aria-label에 하는 일을 적는다(예: 「돼지국밥 빼기」) (WCAG 2.2 · 2.4.6)', symbolOnly);
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
// 결제·주문처럼 무거운 작업이나 공용 기기에서 놓치면 사고(사고 위험), 가벼운 입력 오류면 무엇이 틀렸는지 모르는 것(헷갈림)
const heavyErr = sel.device === 'shared' || action === 'once' || action === 'irreversible';
if (errToasts.length) { add(heavyErr ? '꼭' : '권장', '오류를 토스트로만 알림', '금방 사라져 놓친다. 입력 오류는 그 칸 아래에, 결제 실패는 남는 문구나 대화상자로', errToasts); if (!heavyErr) found[found.length - 1].fail = 'confusing'; }

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
// <ol>은 브라우저가 번호를 붙인다. 글에도 「1」「1.」을 넣으면 「1. 1 고르기」가 된다(2026-11-06 효과 비교에서 단계 표시줄 두 번)
// CSS로 번호를 끄지 않았는지는 <style> 글로 본다(jsdom은 기본 번호 값을 주지 않는다)
const olOff = sel => new RegExp(`(^|[},\\s])${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(>\\s*li\\s*)?[^{]*\\{[^}]*list-style(-type)?\\s*:\\s*none`).test(css);
const doubleNum = [...doc.querySelectorAll('ol')].filter(ol => visible(ol)).filter(ol => {
  const items = [...ol.children].filter(li => li.tagName === 'LI');
  if (items.length < 2 || !items.every(li => /^\s*\d+\s*[.)]?(\s|$)/.test(li.textContent))) return false;
  const names = ['ol', ...(ol.id ? [`#${ol.id}`] : []), ...[...ol.classList].map(c => `.${c}`), ...[...ol.classList].map(c => `ol.${c}`)];
  return !names.some(olOff) && !/list-style(-type)?\s*:\s*none/.test(ol.getAttribute('style') || '');
});
if (doubleNum.length) add('권장', '번호가 두 번 붙음', '<ol>이 번호를 붙이는데 글에도 번호가 있어 「1. 1 고르기」처럼 보인다. 글의 번호를 지우거나 CSS로 list-style: none', doubleNum);

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
if (/linear-gradient\([^)]*(#(?:[6-9a-f][0-9a-f])[0-4][0-9a-f]{3}|purple|violet|indigo|#7c3aed|#8b5cf6|#6366f1)/i.test(css)) add('확인', '보라·파랑 그라데이션', '흔히 AI 티로 꼽히지만 사람이 만든 사이트에도 많아 이것만으로 AI 화면이라 할 수 없다(ai-design-check 2026-10-28 측정: AI 페이지 0%, 사람 사이트 24%). 브랜드 색이 정한 게 아니고 다른 기본값과 같이 나오면 뺀다');
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

// 10-2. 대화상자 문구·제출·저절로 움직이는 것·끌기(jakub.kr 스킬 모음 better-writing·better-accessibility(MIT)에서 생각을 얻었다, 2026-11-10)
// 브라우저 기본 확인창은 버튼 이름을 「확인·취소」에서 바꿀 수 없고 서비스 화면 밖 모양이다
if (/(^|[^.\w])confirm\s*\(|window\.confirm\s*\(/.test(scripts)) add('권장', '브라우저 기본 확인창', 'confirm()은 버튼이 「확인·취소」로 고정돼 무엇을 하는지 말하지 못한다. 되돌릴 수 있으면 확인창 대신 되돌리기, 아니면 「주문 취소」처럼 하는 일을 적은 버튼의 대화상자로(recommend.mjs 「지울 때」·「확인 단계」)');
// 버튼이 둘 넘는 대화상자에서 「확인·예」는 무엇을 하는지 말하지 않는다. 버튼 하나뿐인 알림의 「확인」은 괜찮다
const dialogs = [...doc.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"], [class*="modal" i]')].filter(d => !d.parentElement?.closest('dialog, [role="dialog"], [role="alertdialog"], [class*="modal" i]'));
const vagueDlg = dialogs.filter(d => { const bs = [...d.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')]; return bs.length >= 2 && bs.some(b => /^(확인|예|네|아니(오|요)|ok|yes|no)$/i.test(text(b) || b.value || '')); });
if (vagueDlg.length) add('권장', '대화상자 버튼이 「확인·예」', '버튼만 읽어도 무슨 일이 일어나는지 알게 「삭제」「주문 취소」처럼 하는 일을 적는다. 닫는 쪽은 「취소」「그대로 두기」', vagueDlg);
const sureDlg = dialogs.filter(d => /정말\s?[^?.!]{0,30}(하시겠|할까|인가|이에요|입니까|나요)|are you sure/i.test(text(d)));
if (sureDlg.length) add('확인', '「정말 ~하시겠어요?」 제목', '무엇을 하는지(무엇을 지우는지) 제목에 적는다. 예: 「‘3분기 보고서’를 지울까요?」. 되돌릴 수 없으면 그 사실을 한 줄로', sureDlg);
// 지우기 확인창이 위험 버튼에 첫 초점을 두고 열린다. showModal()은 autofocus가 없으면 안의 첫 초점 자리로 간다
// 그래서 위험 버튼이 앞에 있으면 열리자마자 Enter·Space 한 번에 지워진다(2026-11-11 직접 만든 내부 도구 화면 비교)
// 스크립트로 .focus()를 옮기는 것은 보지 않는다(autofocus만 본다)
const btnName = b => `${text(b) || b.value || ''} ${b.getAttribute('aria-label') || ''}`.trim();
const isCancel = b => /^(취소|닫기|아니(요|오)|그대로 두기|cancel|close|no|keep)$/i.test(text(b) || b.value || b.getAttribute('aria-label') || '');
const isDanger = b => b.matches('button, [role="button"], input[type="submit"], input[type="button"]') && !isCancel(b) && (/danger|destructive|delete|warn/i.test(b.getAttribute('class') || '') || /삭제|지우기|종료|탈퇴|해지|비우기|초기화|\b(delete|remove|discard|reset)\b/i.test(btnName(b)));
const FOCUSABLE = 'button, [href], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const dangerFirst = [...doc.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"]')].filter(d => !d.parentElement?.closest('dialog, [role="dialog"], [role="alertdialog"]')).flatMap(d => {
  const bs = [...d.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')];
  if (!bs.some(isDanger) || !bs.some(isCancel) || d.hasAttribute('autofocus')) return [];
  const first = d.querySelector('[autofocus]') || [...d.querySelectorAll(FOCUSABLE)].find(e => { const h = e.closest('[hidden]'); return !e.disabled && (!h || h === d || !d.contains(h)); });
  return first && isDanger(first) ? [first] : [];
});
if (dangerFirst.length) add('꼭', '위험 버튼에 첫 초점', `대화상자의 ${dangerFirst.slice(0, 3).map(b => `「${text(b) || b.value || b.getAttribute('aria-label')}」`).join(', ')} 버튼에 첫 초점이 간다. 창이 열리자마자 Enter나 Space를 누르면 바로 지운다. 첫 초점을 취소에 둔다(autofocus). 위험 버튼은 취소 다음 자리에`, dangerFirst);
// 입력이 다 맞을 때까지 제출 버튼을 잠그면 무엇이 틀렸는지 모른다. 누를 때 검사하고 첫 오류 칸으로 옮긴다
// HTML에 처음부터 박힌 disabled(--run-scripts 전 원본)나 「disabled = !valid」 같은 코드를 본다
const rawDoc = runScripts ? new JSDOM(raw).window.document : doc;
const lockedSubmit = [...rawDoc.querySelectorAll('form')].filter(f => f.querySelector('input:not([type="hidden"]), textarea, select')).flatMap(f => [...f.querySelectorAll('button[type="submit"][disabled], input[type="submit"][disabled], button:not([type])[disabled]')]);
if (lockedSubmit.length || /\.disabled\s*=\s*!\s*[\w.$]*(valid|ok|filled|complete|ready|can\w*)/i.test(scripts)) add('권장', '입력이 맞을 때까지 제출 잠금', '잠긴 버튼은 왜 못 누르는지 알려 주지 않는다. 버튼은 열어 두고, 누르면 검사해서 틀린 칸 아래에 고칠 말을 쓰고 첫 오류 칸으로 옮긴다. 결제처럼 두 번 눌림을 막는 잠금은 누른 뒤에 건다', lockedSubmit);
// 5초 넘게 저절로 움직이는 것(자동 넘김 배너, 소리 없는 반복 영상)에는 멈춤이 있어야 한다 — WCAG 2.2 2.2.2
const pauseBtn = buttons.some(b => /멈춤|일시\s?정지|정지|pause|stop/i.test(`${text(b)} ${b.getAttribute('aria-label') || ''} ${b.getAttribute('title') || ''}`));
const autoVideo = [...doc.querySelectorAll('video[autoplay]')].filter(v => visible(v) && !v.hasAttribute('controls'));
const autoSlide = [...doc.querySelectorAll('[data-autoplay], [data-bs-ride="carousel"], [data-ride="carousel"], [class*="autoplay" i]')].filter(visible);
// 타이머 하나만으로는 판단하지 않는다(처리 중 표시 뒤 다음 단계로 넘기는 setTimeout도 많다). setInterval 가까이에 슬라이드·배너 말이 있을 때만
const slideTimer = /setInterval\s*\([^]{0,300}(slide|carousel|banner|swiper|배너|슬라이드)/i.test(scripts) || /autoplay\s*:\s*(true|\{)/i.test(scripts);
if ((autoVideo.length || autoSlide.length || slideTimer) && !pauseBtn) add('권장', '저절로 움직이는데 멈춤 없음', '자동 넘김 배너·반복 영상이 5초 넘게 움직이면 멈추는 버튼이 있어야 한다(WCAG 2.2 2.2.2). 읽는 도중 넘어가면 놓친다. 멈춤 버튼을 두거나 자동 넘김을 뺀다', [...autoVideo, ...autoSlide]);
// 끌어서만 하는 동작(순서 바꾸기, 옮기기)에는 한 번 눌러서 하는 다른 길이 있어야 한다 — WCAG 2.2 2.5.7
const dragEls = [...doc.querySelectorAll('[draggable="true"], [class*="sortable" i], [class*="draggable" i], [data-sortable]')].filter(visible);
const dragJs = /addEventListener\(\s*['"](dragstart|drop)['"]|ondragstart|Sortable\.create|new Sortable\b|useSortable|useDrag\b|DndContext/.test(scripts);
const moveBtn = buttons.some(b => /위로|아래로|올리기|내리기|이동|옮기기|순서|\b(move|up|down)\b/i.test(`${text(b)} ${b.getAttribute('aria-label') || ''}`));
if ((dragEls.length || dragJs) && !moveBtn) add('권장', '끌기로만 하는 동작', '끌기가 어려운 사람(떨림, 한 손가락, 스위치 기기)은 못 한다(WCAG 2.2 2.5.7). 「위로·아래로」 버튼이나 옮길 곳을 고르는 메뉴를 같이 둔다', dragEls);

// 10-3. 키보드와 말투(references/ux-basics.md 키보드-1·키보드-3·말-2, 2026-11-11)
const short = (s, n = 16) => (s.length > n ? `${s.slice(0, n)}…` : s);
// 키보드-1: 클릭은 받는데 키보드로 갈 수도 누를 수도 없는 곳(div·span·li·td·img에 onclick)
// HTML 속성(onclick, @click, v-on:click, x-on:click)만 본다. 스크립트에서 addEventListener로 붙인 클릭은 이 정적 검사에 안 보인다
// 안에 버튼·링크가 있으면(이벤트 위임) 키보드는 그 버튼으로 누르니 넘긴다. 버튼·링크 안의 span도 넘긴다
const CLICK_ATTR = /^(onclick|@click|(v|x)-on:click)(\.|$)/i;
const NATIVE = 'a[href], button, input, select, textarea, summary, label, option, details, dialog, area[href], video[controls], audio[controls], body, html';
const ROLE_OK = /^(button|link|checkbox|radio|tab|menuitem|menuitemcheckbox|menuitemradio|switch|option|treeitem)$/;
const clickOnly = [...doc.body.querySelectorAll('*')].filter(e => visible(e) && [...e.attributes].some(a => CLICK_ATTR.test(a.name))
  && !e.matches(NATIVE) && !e.parentElement?.closest('a[href], button, summary, label')
  && !ROLE_OK.test((e.getAttribute('role') || '').trim().split(/\s+/)[0])
  && !/^\s*\d+\s*$/.test(e.getAttribute('tabindex') || '')
  && !e.querySelector(FOCUSABLE));
if (clickOnly.length) add('꼭', '키보드로 못 누르는 곳', `${clickOnly.length}곳(${clickOnly.slice(0, 3).map(e => `「${short(text(e)) || e.getAttribute('alt') || e.tagName.toLowerCase()}」`).join(', ')})이 클릭은 받지만 키보드로는 갈 수도 누를 수도 없다. button 요소로 바꾼다. 못 바꾸면 role="button"과 tabindex="0"을 달고 Enter·Space에도 같은 일을 하게 한다 (WCAG 2.2 · 2.1.1)`, clickOnly);
// 키보드-3: 꺼진 버튼의 이유가 title(마우스 올림 설명)에만 있다. 꺼진 버튼은 초점을 받지 않아 키보드로도, 터치로도 그 설명을 못 본다
// 꺼진 버튼은 마우스 이벤트도 안 받아 title을 감싼 span에 다는 일이 많다. 바로 위 span·div의 title도 본다
// title 없이 꺼진 것은 여기서 보지 않는다(제출 잠금은 「입력이 맞을 때까지 제출 잠금」)
const DISABLED = 'button[disabled], input[disabled], select[disabled], textarea[disabled], [aria-disabled="true"]';
const describedShown = e => (e.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).some(id => { const t = doc.getElementById(id); return t && visible(t) && text(t) && !/sr-only|visually-hidden|screen-reader/i.test(t.getAttribute('class') || ''); });
const tipOf = e => (e.getAttribute('title') || '').trim() || (e.parentElement?.matches('span, div') ? (e.parentElement.getAttribute('title') || '').trim() : '');
const titleOnly = [...doc.querySelectorAll(DISABLED)].filter(e => visible(e) && tipOf(e) && !describedShown(e));
if (titleOnly.length) add('권장', '꺼진 이유가 title에만 있음', `꺼진 ${titleOnly.slice(0, 3).map(e => `「${short(text(e) || e.value || e.getAttribute('aria-label') || e.tagName.toLowerCase())}」`).join(', ')}의 이유가 마우스를 올려야 보이는 설명(title 「${short(tipOf(titleOnly[0]), 24)}」)에만 있다. 키보드·터치로는 볼 수 없다. 이유를 버튼 옆 글로 두고 aria-describedby로 잇는다`, titleOnly);
// 말-2: 한 화면에 해요체·합니다체·한다체가 섞임. 끝맺음이 있는 문장만 센다(라벨·제목은 끝맺음이 없어 세지 않는다)
// 한다체는 마침표로 끝나는 동사 끝(받침 ㄴ·ㅆ + 다: 한다·보낸다·했다·있다, 는다, 없다)만 센다. 「좋다.」「책이다.」 같은 형용사·이다는 세지 않는다
// 「필요」「중요」로 끝나는 라벨은 해요체로 치지 않는다
// 「」 안에 든 예시 글은 끝이 「」라 세지 않는다. 코드·입력값·숨긴 글은 뺀다
// 쓰는 사람의 말일 수 있는 곳(자주 묻는 질문의 summary·dt, 버튼·탭·라벨)도 뺀다. 「배송은 얼마나 걸리나요」 질문에 합니다체 답을 다는 것은 섞인 게 아니다
const talk = doc.body.cloneNode(true);
talk.querySelectorAll('script, style, template, noscript, code, pre, kbd, samp, textarea, [hidden], [aria-hidden="true"], summary, dt, button, [role="button"], [role="tab"], label, legend, option').forEach(e => e.remove());
const INLINE = new Set(['A', 'ABBR', 'B', 'BDI', 'BDO', 'CITE', 'DATA', 'DFN', 'EM', 'I', 'MARK', 'Q', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TIME', 'U', 'WBR', 'LABEL']);
talk.querySelectorAll('*').forEach(e => { if (!INLINE.has(e.tagName)) { e.before('\n'); e.append('\n'); } });
const SPEECH = [['해요체', /(?:(?<![필중개수주])요|죠)[.!?…~]*$/], ['합니다체', /(?:니다|니까)[.!?…]*$/], ['한다체', { test: x => { const m = x.match(/([가-힣])다\.$/); if (!m) return false; const j = (m[1].charCodeAt(0) - 0xac00) % 28; return j === 4 || j === 20 || /(는|없)다\.$/.test(x); } }]];
const speech = SPEECH.map(([name]) => ({ name, n: 0, ex: '' }));
for (const line of (talk.textContent || '').split('\n')) for (const s of line.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/)) {
  if (!/[가-힣]/.test(s) || s.replace(/\s/g, '').length < 6) continue;
  const k = SPEECH.findIndex(([, re]) => re.test(s));
  if (k >= 0) { speech[k].n++; speech[k].ex ||= s.length > 16 ? `…${s.slice(-16)}` : s; }
}
const mixed = speech.filter(x => x.n >= 2);
if (mixed.length >= 2) add('확인', '말투가 섞임', `${mixed.map(x => `${x.name} ${x.n}문장(「${x.ex}」)`).join(', ')}이 한 화면에 섞였다. 한 화면은 한 말투로 두고, 오류는 같은 말투로 더 짧게 쓴다. 서비스가 정한 말투가 있으면 그쪽에 맞춘다`);

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
if (drawnByJs) console.log('화면을 자바스크립트로 그리는 파일로 보인다. 지금은 뼈대만 봤다. --run-scripts를 붙여 다시 돌린다(내가 만든 파일만)');
if (notDrawn) console.log(`스크립트를 돌렸지만 ${thin ? '그려진 것이 거의 없다' : '오류가 났다'}. 검사 결과를 통과로 보지 않는다. 브라우저에서 띄워 본다${scriptErrors.length ? `\n  스크립트 오류: ${scriptErrors.slice(0, 3).join(' / ')}` : ''}`);
if (ctx.failSummary(house.main)) console.log(`${ctx.failSummary(house.main)} (이름 뜻과 고치는 순서: references/failures.md)`);
if (!house.main.length && !drawnByJs && !notDrawn) console.log(`${house.ask.length ? '규격·동작에서 ' : ''}걸린 것 없음. 이 검사가 못 보는 것(실제 크기, 대비, 흐름)은 스크린샷으로 확인한다`);
for (const f of house.main) console.log(`- [${f.level === '꼭' ? '꼭 고칠 것' : f.level === '권장' ? '고치기 권함' : '확인'} · ${ctx.FAILS[f.fail]}] ${line(f)}`);
if (house.ask.length) {
  console.log('\n정한 건지 확인(서비스에서 일부러 정한 거면 그대로 두고, 아니면 고친다. 답은 design-rules.json에 적는다)');
  for (const f of house.ask) console.log(`- [${ctx.houseName(f.topic)} · ${ctx.FAILS[f.fail]}] ${line(f)}`);
}
if (house.skipped.length) console.log(`\n정해 둬서 뺀 것: ${house.skipped.join(', ')}`);
process.exit(house.main.some(f => f.level === '꼭') ? 1 : 0);
