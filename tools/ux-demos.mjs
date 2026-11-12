// UX 기준 페이지(/ux/)의 데모 public/ux/{slug}-bad.html, -good.html을 만든다. 실행: node tools/ux-demos.mjs
// 같은 쌍은 같은 틀(BASE_CSS·BASE_JS·page)을 쓰고 규칙에 걸린 곳만 다르다. 데모를 고칠 때는 여기를 고친다(npm run check가 파일과 이 출력이 다르면 실패한다)
// 한 데모 안의 글은 한 말투로 둔다(글-2). 확인 창 질문(「~할까요?」)이 있는 데모와 입력 묶음부터 새로 더한 묶음(2026-11-11)의 데모는 해요체, 앞 묶음에서 질문이 없는 데모는 합니다체. 글-2 나쁜 예만 일부러 섞는다
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'ux');

// 꺼진 버튼은 button[disabled]로 꾸민다. check-screen 「두 번 눌림 방지 없음」은 CSS에 상태 선택자(콜론 disabled)가 있으면 누른 뒤 잠금으로 보아, 공통 틀에 두면 모든 데모가 잠근 것으로 읽힌다(사고-5)
const BASE_CSS = `
/* 공통 틀: 한 쌍(나쁜 예·좋은 예)은 이 틀과 내용이 같고 규칙에 걸린 곳만 다르다. 데모 속 서비스와 이름은 지어낸 것이다 */
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; color: #14212b; background: #fff; }
.app { min-height: 100vh; display: flex; flex-direction: column; }
.has-cap .app { padding-bottom: 52px; }
.bar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid #d8e0e5; font-weight: 600; }
.bar small { font-weight: 400; color: #5a6974; }
.bar .sp { flex: 1; }
.main { flex: 1; padding: 12px 16px 16px; display: grid; gap: 8px; align-content: start; }
button { font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid #b9c4cc; background: #fff; color: #14212b; cursor: pointer; }
button.primary { background: #0e6b6b; border-color: #0e6b6b; color: #fff; }
button.danger { background: #b83a26; border-color: #b83a26; color: #fff; }
button[disabled] { color: #6b7780; background: #f1f4f6; border-color: #d8e0e5; cursor: not-allowed; }
button.reset { font-size: 12px; font-weight: 400; padding: 4px 8px; color: #5a6974; }
:focus { outline: 3px solid #2563eb; outline-offset: 2px; }
.row { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; border: 1px solid #e3e8ec; border-radius: 8px; }
.row .name { flex: 1; min-width: 0; }
.muted { color: #5a6974; font-size: 13px; }
.result { margin: 0; font-size: 13px; }
.result:empty { display: none; }
label { display: grid; gap: 4px; font-size: 13px; color: #5a6974; }
input[type="text"] { font: inherit; color: #14212b; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; }
.cap { position: fixed; left: 0; right: 0; bottom: 0; display: grid; gap: 2px; padding: 6px 12px; background: #14212b; color: #fff; font-size: 12px; z-index: 20; }
.cap span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cap b { color: #ffd479; font-weight: 600; }
.scrim { position: fixed; inset: 0; background: rgba(8, 14, 18, .35); z-index: 9; }
dialog { position: fixed; inset: 0; margin: auto; height: fit-content; width: min(320px, calc(100% - 32px)); padding: 16px; border: 1px solid #b9c4cc; border-radius: 10px; box-shadow: 0 8px 24px rgba(20, 33, 43, .2); color: #14212b; background: #fff; z-index: 10; }
dialog h2 { margin: 0 0 4px; font-size: 15px; }
dialog p { margin: 0 0 12px; }
.acts { display: flex; justify-content: flex-end; gap: 8px; }
[hidden] { display: none !important; }
`;

// 아래 검은 줄: 위 줄은 남는 기록(창이 열릴 때 초점, 또는 Tab으로 지나온 곳), 아래 줄은 「지금 초점」.
// 두 데모를 번갈아 눌러도 견줄 수 있게, 초점이 데모 밖으로 나가면 지금 초점은 마지막 값을 두고 「멈춤」만 붙인다
// 대화상자 열고 닫기: trap: 창 안에서 Tab이 돈다, restore: 닫으면 연 자리로, esc: Esc로 닫힌다
const BASE_JS = `
// 내용 높이를 부모(UX 기준 페이지)에 알린다. 틀이 100vh라 문서 높이 대신 고정 위치가 아닌 내용의 아래 끝을 잰다. 부모는 한 쌍을 같은 높이로 맞춘다
function uxContentHeight() {
  // 틀(.app)이 100vh라 최소 높이를 잠깐 풀고 틀의 아래 끝을 잰다. 틀 밖에 둔 것(상태 바꿔 보기 줄 등)도 본다. 부모 iframe 테두리 2px를 더한다
  var m = 0, app = document.querySelector('.app'), prev = app ? app.style.minHeight : '';
  if (app) app.style.minHeight = '0';
  [].forEach.call(document.body.children, function (e) {
    if (e.matches('script, style, dialog') || getComputedStyle(e).position === 'fixed') return;
    m = Math.max(m, e.getBoundingClientRect().bottom + scrollY);
  });
  if (app) app.style.minHeight = prev;
  return Math.ceil(m + 2);
}
function uxSendHeight() { parent.postMessage({ uxDemoHeight: Math.max(uxContentHeight(), 220) }, '*'); }
addEventListener('load', uxSendHeight);
// 내용 칸(.main)이 여럿이고 하나가 숨겨져 있어도(길-12의 탭) 늘어난 것을 놓치지 않게 모두 지켜본다
if (window.ResizeObserver) { var uxRo = new ResizeObserver(uxSendHeight); [].forEach.call(document.querySelectorAll('.main'), function (m) { uxRo.observe(m); }); uxRo.observe(document.body); }
var capB = document.querySelector('.cap .now'), capOpen = document.querySelector('.cap .at-open'), capTrail = document.querySelector('.cap .trail');
var lastNow = '없음', trail = [];
var scrim = document.querySelector('.scrim');
var openDlg = null;
// 받침에 따라 조사를 고른다(을/를, 으로/로)
function jong(w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 ? c % 28 : 0; }
function eul(w) { return '‘' + w + '’' + (jong(w) ? '을' : '를'); }
function ro(w) { var j = jong(w); return '‘' + w + '’' + (j && j !== 8 ? '으로' : '로'); }
function nameOf(el) { return el.getAttribute('data-name') || el.getAttribute('aria-label') || el.textContent.trim().replace(/\\s+/g, ' ') || '이름 없는 버튼'; }
function showFocus() {
  if (!capB) return;
  var a = document.activeElement;
  if (!document.hasFocus()) { capB.textContent = lastNow + ' (데모 밖으로 나가 멈춤)'; return; }
  if (!a || a === document.body || a === document.documentElement) lastNow = '없음 (문서 맨 앞으로 떨어짐)';
  else lastNow = '「' + nameOf(a) + '」' + (a.closest('dialog') ? ' · 창 안' : openDlg ? ' · 창 뒤 가려진 곳' : '');
  capB.textContent = lastNow;
}
document.addEventListener('focusin', function (e) {
  if (capTrail) { trail.push(nameOf(e.target)); trail = trail.slice(-4); capTrail.textContent = trail.join(' → '); }
  showFocus();
});
document.addEventListener('focusout', function () { setTimeout(showFocus, 0); });
function focusables(d) { return Array.prototype.filter.call(d.querySelectorAll('button, input, [href]'), function (e) { return !e.disabled; }); }
function openDialog(d, opener, o) {
  o = o || {};
  d._opener = opener; d._o = o;
  d.show();
  if (scrim) scrim.hidden = false;
  openDlg = d;
  var f = d.querySelector('[autofocus]') || focusables(d)[0];
  if (f) f.focus();
  showFocus();
  if (capOpen) capOpen.textContent = lastNow.replace(' · 창 안', '');
}
function closeDialog(d, focusTo) {
  d.close();
  if (scrim) scrim.hidden = true;
  openDlg = null;
  var t = focusTo !== undefined ? focusTo : (d._o.restore !== false ? d._opener : null);
  if (t && document.contains(t)) t.focus();
  else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  setTimeout(showFocus, 0);
}
document.addEventListener('keydown', function (e) {
  if (!openDlg) return;
  var o = openDlg._o;
  if (e.key === 'Escape') { e.preventDefault(); if (o.esc !== false) closeDialog(openDlg); return; }
  if (e.key === 'Tab' && o.trap !== false) {
    var f = focusables(openDlg), first = f[0], last = f[f.length - 1];
    if (!openDlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
Array.prototype.forEach.call(document.querySelectorAll('.reset'), function (b) { b.addEventListener('click', function () { location.reload(); }); });
`;

// cap: 'dialog'(창이 열릴 때 초점 + 지금 초점), 'trail'(Tab으로 지나온 곳 + 지금 초점)
const CAP = {
  dialog: '<span>창이 열릴 때 초점: <b class="at-open">아직 창을 열지 않음</b></span>',
  trail: '<span>지나온 초점: <b class="trail">아직 없음</b></span>',
};
// capHtml: 초점 대신 다른 것을 알리는 아래 검은 줄(입력-2의 자판, 길-2의 읽는 말). viewport: 누구나-5 나쁜 예처럼 화면 설정 자체가 규칙인 데모
function page({ title, cap, capHtml, viewport = 'width=device-width, initial-scale=1', style = '', body, script = '' }) {
  const capLine = cap ? `${CAP[cap]}<span>지금 초점: <b class="now">없음</b></span>` : capHtml;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${viewport}">
<title>${title}</title>
<style>${BASE_CSS}${style}</style>
</head>
<body${capLine ? ' class="has-cap"' : ''}>
${body.trim()}
${capLine ? `<div class="cap" aria-hidden="true">${capLine}</div>\n` : ''}<script>${BASE_JS}${script}</script>
</body>
</html>
`;
}
const bar = (t, small = '') => `<div class="bar">${t}${small ? ` <small>${small}</small>` : ''}<span class="sp"></span><button type="button" class="reset">처음으로</button></div>`;
const demos = {};
const pair = (slug, title, make) => { demos[`${slug}-bad`] = make(true, `${title} · 이렇게 하면 안 된다`); demos[`${slug}-good`] = make(false, `${title} · 이렇게 한다`); };

// ---------- 사고-1: 위험한 확인 창의 첫 초점 ----------
pair('accident-1', '사고-1 위험한 확인 창의 첫 초점', (bad, title) => page({
  title, cap: 'dialog',
  body: `
<div class="app">
  ${bar('내 파일', '3개')}
  <div class="main" id="list">
    ${['회의록 11월.pdf', '예산 초안.xlsx', '발표 자료.key'].map(f => `<div class="row"><span class="name">${f}</span><button type="button" class="del" data-file="${f}" data-name="${f} 지우기">지우기</button></div>`).join('\n    ')}
    <p class="muted empty" hidden>파일이 없어요.</p>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">‘<span id="fname"></span>’ 파일을 지울까요?</h2>
  <p>지우면 되돌릴 수 없어요.</p>
  <div class="acts"><button type="button" id="no"${bad ? '' : ' autofocus'}>취소</button><button type="button" id="yes" class="danger"${bad ? ' autofocus' : ''}>파일 지우기</button></div>
</dialog>`,
  script: `
var dlg = document.getElementById('dlg'), cur = null;
document.getElementById('list').addEventListener('click', function (e) {
  var b = e.target.closest('.del'); if (!b) return;
  cur = b; document.getElementById('fname').textContent = b.dataset.file;
  openDialog(dlg, b);
});
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg); });
document.getElementById('yes').addEventListener('click', function () {
  var row = cur.closest('.row'), next = row.nextElementSibling && row.nextElementSibling.querySelector('.del');
  row.remove();
  document.querySelector('.result').textContent = '‘' + cur.dataset.file + '’ 파일을 지웠어요.';
  if (!document.querySelector('.del')) document.querySelector('.empty').hidden = false;
  closeDialog(dlg, next || document.querySelector('.del') || document.querySelector('.reset'));
});`,
}));

// ---------- 사고-2: 무엇이 사라지는지 말한다 ----------
pair('accident-2', '사고-2 확인 창이 무엇이 사라지는지 말하나', (bad, title) => page({
  title,
  body: `
<div class="app">
  ${bar('프로젝트 폴더', '2개')}
  <div class="main" id="list">
    <div class="row"><span class="name">2026 하반기 <span class="muted">· 파일 12개</span></span><button type="button" class="del">지우기</button></div>
    <div class="row"><span class="name">2026 상반기 <span class="muted">· 파일 30개</span></span><button type="button" disabled>지우기</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  ${bad ? '<h2 id="dlg-t">정말 삭제하시겠어요?</h2>\n  <p></p>' : '<h2 id="dlg-t">‘2026 하반기’ 폴더를 지울까요?</h2>\n  <p>안의 파일 12개도 함께 지워져요. 지운 뒤에는 되돌릴 수 없어요.</p>'}
  <div class="acts"><button type="button" id="no" autofocus>취소</button><button type="button" id="yes" class="danger">${bad ? '확인' : '폴더 지우기'}</button></div>
</dialog>`,
  script: `
// 이 창을 보려는 데모라 창이 열린 채로 시작한다. 화면 파일에는 닫아 두고 스크립트로 연다(들어오자마자 뜨는 창은 방해-1의 나쁜 예라서)
var dlg = document.getElementById('dlg'); dlg.show(); scrim.hidden = false; dlg._o = {}; openDlg = dlg;
document.querySelector('.del').addEventListener('click', function (e) { openDialog(dlg, e.currentTarget); });
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg, document.querySelector('.del')); });
document.getElementById('yes').addEventListener('click', function () {
  document.querySelector('.del').closest('.row').remove();
  document.querySelector('.result').textContent = '‘2026 하반기’ 폴더와 안의 파일 12개를 지웠어요.';
  closeDialog(dlg, document.querySelector('.reset'));
});`,
}));

// ---------- 사고-3: 가장 강조된 버튼 ----------
pair('accident-3', '사고-3 가장 강조된 버튼', (bad, title) => page({
  title,
  style: `.form { display: grid; gap: 12px; } .foot { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; }`,
  body: `
<div class="app">
  ${bar('프로젝트 설정')}
  <div class="main">
    <div class="form">
      <label>프로젝트 이름<input type="text" value="하반기 사용자 조사"></label>
      <label>설명<input type="text" value="11월 인터뷰 8건 정리"></label>
    </div>
    <div class="foot"><button type="button" id="del"${bad ? ' class="danger"' : ''}>프로젝트 지우기</button><button type="button" id="save"${bad ? '' : ' class="primary"'}>저장</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">‘하반기 사용자 조사’ 프로젝트를 지울까요?</h2>
  <p>안의 메모와 파일이 모두 지워지고 되돌릴 수 없어요.</p>
  <div class="acts"><button type="button" id="no" autofocus>취소</button><button type="button" id="yes" class="danger">프로젝트 지우기</button></div>
</dialog>`,
  script: `
var dlg = document.getElementById('dlg'), st = document.querySelector('.result');
document.getElementById('del').addEventListener('click', function (e) { openDialog(dlg, e.currentTarget); });
document.getElementById('save').addEventListener('click', function () { st.textContent = '저장했어요.'; });
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg); });
document.getElementById('yes').addEventListener('click', function () { st.textContent = '프로젝트를 지웠어요.'; closeDialog(dlg, document.querySelector('.reset')); });`,
}));

// ---------- 사고-4: 자주 하는 동작에는 되돌리기 ----------
const BOOKS = ['느린 산책', '바다의 지도', '작은 정원 일기', '겨울 도서관', '열두 달 요리 노트'];
pair('accident-4', '사고-4 자주 하는 동작에 확인 창 대신 되돌리기', (bad, title) => page({
  title,
  style: `.undo { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; border-radius: 8px; background: #14212b; color: #fff; } .undo .sp { flex: 1; } .undo button { background: transparent; color: #ffd479; border-color: #5a6974; }`,
  body: `
<div class="app">
  ${bar('읽을 책', '수요 독서 모임')}
  <div class="main" id="list">
    ${BOOKS.map(b => `<div class="row" data-book="${b}"><span class="name">${b}</span><button type="button" class="out">목록에서 빼기</button></div>`).join('\n    ')}
    <p class="muted empty" hidden>읽을 책이 없어요.</p>
    <div class="undo" hidden><span class="msg" role="status"></span><span class="sp"></span>${bad ? '' : '<button type="button" id="undo">되돌리기</button>'}</div>
  </div>
</div>
<div class="scrim" hidden></div>
${bad ? `<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t"><span id="bname"></span> 읽을 책에서 뺄까요?</h2>
  <p>빼도 나중에 다시 넣을 수 있어요.</p>
  <div class="acts"><button type="button" id="no" autofocus>취소</button><button type="button" id="yes" class="primary">빼기</button></div>
</dialog>` : ''}`,
  script: `
var list = document.getElementById('list'), undo = document.querySelector('.undo'), last = null;
function take(row) {
  last = { row: row, next: row.nextElementSibling };
  row.remove();
  undo.querySelector('.msg').textContent = eul(row.dataset.book) + ' 뺐어요.';
  undo.hidden = false;
  document.querySelector('.empty').hidden = !!list.querySelector('.row');
}
${bad ? `var dlg = document.getElementById('dlg'), cur = null;
list.addEventListener('click', function (e) { var b = e.target.closest('.out'); if (!b) return; cur = b.closest('.row'); document.getElementById('bname').textContent = eul(cur.dataset.book); openDialog(dlg, b); });
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg); });
document.getElementById('yes').addEventListener('click', function () { var n = cur.nextElementSibling; take(cur); closeDialog(dlg, (n && n.querySelector('.out')) || list.querySelector('.out')); });` : `list.addEventListener('click', function (e) { var b = e.target.closest('.out'); if (!b) return; var row = b.closest('.row'), n = row.nextElementSibling; take(row); var t = (n && n.querySelector('.out')) || list.querySelector('.out'); if (t) t.focus(); });
document.getElementById('undo').addEventListener('click', function () {
  if (!last) return;
  list.insertBefore(last.row, last.next && last.next.parentNode === list ? last.next : list.querySelector('.empty'));
  undo.querySelector('.msg').textContent = eul(last.row.dataset.book) + ' 되돌렸어요.';
  document.querySelector('.empty').hidden = true;
  last.row.querySelector('.out').focus(); last = null;
});`}`,
}));

// ---------- 누구나-1(예전 키보드-1): 모든 기능을 키보드로 ----------
const STAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>';
pair('everyone-1', '누구나-1 모든 기능을 키보드로', (bad, title) => page({
  title, cap: 'trail',
  style: `.open { text-align: left; border: 0; padding: 4px 0; background: none; cursor: pointer; } .icon { display: inline-grid; place-items: center; padding: 6px; color: #5a6974; } .icon[aria-pressed="true"], .icon.on { color: #9a6a00; } .icon.on svg, .icon[aria-pressed="true"] svg { fill: currentColor; } .viewer { padding: 8px 12px; border-radius: 8px; background: #f3f6f7; font-size: 13px; }`,
  body: `
<div class="app">
  ${bar('공유 문서함', '3개')}
  <div class="main" id="list">
    ${['회의록 11월', '예산 초안', '발표 자료'].map(f => bad
      ? `<div class="row"><div class="name open" onclick="openFile(this)">${f}</div><button type="button" class="icon">${STAR}</button></div>`
      : `<div class="row"><button type="button" class="name open" onclick="openFile(this)">${f}</button><button type="button" class="icon" aria-label="${f} 즐겨찾기" aria-pressed="false">${STAR}</button></div>`).join('\n    ')}
    <p class="viewer" role="status">열린 문서: 없음</p>
  </div>
</div>`,
  script: `
function openFile(el) { document.querySelector('.viewer').textContent = '열린 문서: ' + el.textContent.trim(); }
document.getElementById('list').addEventListener('click', function (e) {
  var b = e.target.closest('.icon'); if (!b) return;
  ${bad ? "b.classList.toggle('on');" : "b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));"}
});`,
}));

// ---------- 누구나-2(예전 키보드-2): 창 안에서 초점이 돌고, 닫으면 제자리로 ----------
const PROJ = ['회의 준비', '사용자 인터뷰', '디자인 검토'];
pair('everyone-2', '누구나-2 대화상자 안의 초점과 닫은 뒤 초점', (bad, title) => page({
  title, cap: 'dialog',
  body: `
<div class="app">
  ${bar('프로젝트', '3개')}
  <dialog id="dlg" aria-labelledby="dlg-t">
    <h2 id="dlg-t">‘<span id="pname"></span>’ 프로젝트를 지울까요?</h2>
    <p>지우면 되돌릴 수 없어요.</p>
    <div class="acts"><button type="button" id="no" autofocus>취소</button><button type="button" id="yes" class="danger">지우기</button></div>
  </dialog>
  <div class="main" id="list">
    ${PROJ.map(p => `<div class="row" data-p="${p}"><span class="name">${p}</span><button type="button" class="del" data-name="${p} 지우기">지우기</button></div>`).join('\n    ')}
    <p class="muted empty" hidden>프로젝트가 없어요.</p>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>`,
  script: `
var dlg = document.getElementById('dlg'), cur = null, OPT = ${bad ? '{ trap: false }' : '{}'};
document.getElementById('list').addEventListener('click', function (e) {
  var b = e.target.closest('.del'); if (!b) return;
  cur = b.closest('.row'); document.getElementById('pname').textContent = cur.dataset.p;
  openDialog(dlg, b, OPT);
});
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg); });
document.getElementById('yes').addEventListener('click', function () {
  var n = cur.nextElementSibling && cur.nextElementSibling.querySelector('.del'), p = cur.previousElementSibling && cur.previousElementSibling.querySelector('.del');
  cur.remove();
  document.querySelector('.result').textContent = '‘' + cur.dataset.p + '’ 프로젝트를 지웠어요.';
  if (!document.querySelector('.del')) document.querySelector('.empty').hidden = false;
  ${bad ? 'closeDialog(dlg, null);' : "closeDialog(dlg, n || p || document.querySelector('.reset'));"}
});`,
}));

// ---------- 누구나-3(예전 키보드-3): 꺼진 이유가 마우스 올림 설명에만 ----------
pair('everyone-3', '누구나-3 꺼진 버튼의 이유', (bad, title) => page({
  title,
  style: `.doc { display: grid; gap: 4px; padding: 12px; border: 1px solid #e3e8ec; border-radius: 8px; } .acts2 { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }`,
  body: `
<div class="app">
  ${bar('분기 보고서')}
  <div class="main">
    <div class="doc">
      <b>3분기 사용자 조사 보고서</b>
      <span class="muted">12쪽 · 2026-10-02 고침</span>
      <div class="acts2">
        <button type="button" id="copy">링크 복사</button>
        ${bad ? '<span title="보기 권한만 있어 내보낼 수 없습니다. 관리자에게 편집 권한을 요청하세요."><button type="button" disabled>PDF로 내보내기</button></span>' : '<button type="button" disabled aria-describedby="why">PDF로 내보내기</button>'}
      </div>
      ${bad ? '' : '<p id="why" class="muted">보기 권한만 있어 내보낼 수 없습니다. 관리자에게 편집 권한을 요청하면 내보낼 수 있습니다.</p>'}
    </div>
    <p class="result" role="status"></p>
  </div>
</div>`,
  script: `
document.getElementById('copy').addEventListener('click', function () { document.querySelector('.result').textContent = '링크를 복사했습니다.'; });`,
}));

// ---------- 누구나-4(예전 키보드-4): Esc와 버튼 순서를 서비스 안에서 하나로 ----------
pair('everyone-4', '누구나-4 확인 창의 Esc와 버튼 순서', (bad, title) => page({
  title, cap: 'dialog',
  style: `.opens { display: flex; flex-wrap: wrap; gap: 8px; }`,
  body: `
<div class="app">
  ${bar('수요 독서 모임')}
  <div class="main">
    <p class="muted">모임 설정</p>
    <div class="opens"><button type="button" id="o1" data-name="모임 나가기(창 열기)">모임 나가기</button><button type="button" id="o2" data-name="내 글 지우기(창 열기)">내 글 지우기</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="d1" aria-labelledby="t1">
  <h2 id="t1">‘수요 독서 모임’에서 나갈까요?</h2>
  <p>다시 들어오려면 초대를 받아야 해요.</p>
  <div class="acts"><button type="button" class="no" autofocus>취소</button><button type="button" class="yes danger">모임 나가기</button></div>
</dialog>
<dialog id="d2" aria-labelledby="t2">
  <h2 id="t2">‘6월 모임 후기’ 글을 지울까요?</h2>
  <p>지운 글은 되돌릴 수 없어요.</p>
  <div class="acts">${bad ? '<button type="button" class="yes danger">글 지우기</button><button type="button" class="no" autofocus>취소</button>' : '<button type="button" class="no" autofocus>취소</button><button type="button" class="yes danger">글 지우기</button>'}</div>
</dialog>`,
  script: `
var st = document.querySelector('.result');
[['o1', 'd1', {}, '모임에서 나갔어요.'], ['o2', 'd2', ${bad ? '{ esc: false }' : '{}'}, '글을 지웠어요.']].forEach(function (x) {
  var d = document.getElementById(x[1]);
  document.getElementById(x[0]).addEventListener('click', function (e) { openDialog(d, e.currentTarget, x[2]); });
  d.querySelector('.no').addEventListener('click', function () { closeDialog(d); });
  d.querySelector('.yes').addEventListener('click', function () { st.textContent = x[3]; closeDialog(d); });
});`,
}));

// ---------- 할 일-1: 첫 화면에 지금 상태 ----------
const FILES = ['인터뷰 01.m4a', '인터뷰 02.m4a', '인터뷰 03.m4a', '인터뷰 04.m4a', '인터뷰 05.m4a', '인터뷰 06.m4a', '메모 정리.docx', '사진 모음.zip', '인터뷰 07.mov', '인터뷰 08.mov'];
const FAILED = new Set(['인터뷰 07.mov', '인터뷰 08.mov']);
pair('visible-1', '할 일-1 첫 화면에 지금 상태', (bad, title) => page({
  title,
  style: `.state { padding: 10px 12px; border-radius: 8px; background: #fbefdf; border: 1px solid #e9c48f; display: grid; gap: 6px; justify-items: start; } .state.ok { background: #e1f0ef; border-color: #9cc9c6; } .fail { color: #9a4a06; font-size: 13px; } .ok-t { color: #5a6974; font-size: 13px; }`,
  body: `
<div class="app">
  ${bar('자료 올리기', '11월 인터뷰')}
  <div class="main" id="main">
    ${bad ? '' : '__STATE__'}
    ${FILES.map(f => `<div class="row" data-f="${f}"><span class="name">${f}</span>${FAILED.has(f) ? '<span class="fail">올리지 못함</span>' : '<span class="ok-t">올림</span>'}</div>`).join('\n    ')}
    ${bad ? '__STATE__' : ''}
  </div>
</div>`.replace('__STATE__', `<div class="state" id="state"><span id="state-t"><b>10개 중 2개를 올리지 못했습니다.</b> 영상 파일이 20MB를 넘습니다. 줄인 파일로 다시 올리면 됩니다.</span><button type="button" id="retry">다시 올리기</button></div>`),
  script: `
document.getElementById('retry').addEventListener('click', function (e) {
  document.querySelectorAll('.fail').forEach(function (x) { x.className = 'ok-t'; x.textContent = '올림'; });
  var s = document.getElementById('state'); s.className = 'state ok';
  document.getElementById('state-t').innerHTML = '<b>10개를 모두 올렸습니다.</b>';
  e.currentTarget.remove();
});`,
}));

// ---------- 할 일-2: 핵심 요약은 앞에 한 번 ----------
const PROJECTS = [['회의 준비', true, false], ['사용자 인터뷰', true, true], ['디자인 검토', false, false], ['예산 정리', false, false], ['채용 공고', false, false], ['연말 행사', false, false]];
pair('visible-2', '할 일-2 핵심 요약의 자리', (bad, title) => page({
  title,
  style: `.sum { padding: 8px 12px; border-radius: 8px; background: #f3f6f7; font-size: 13px; } .tag { font-size: 12px; padding: 0 8px; border-radius: 999px; border: 1px solid #b9c4cc; color: #5a6974; white-space: nowrap; } .tag.on { border-color: #0e6b6b; color: #0e6b6b; } .due { font-size: 12px; color: #9a4a06; white-space: nowrap; }`,
  body: `
<div class="app">
  ${bar('프로젝트')}
  <div class="main">
    ${bad ? '' : '__SUM__'}
    ${PROJECTS.map(([n, on, due]) => `<div class="row"><span class="name">${n}</span>${due ? '<span class="due">이번 주 마감</span>' : ''}${on ? '<span class="tag on">진행 중</span>' : bad ? '<span class="tag">진행 중 아님</span>' : ''}</div>`).join('\n    ')}
    ${bad ? '__SUM__' : ''}
  </div>
</div>`.replace('__SUM__', '<p class="sum"><b>모두 6개</b> · 진행 중 2개 · 이번 주 마감 1개</p>'),
}));

// ---------- 할 일-3: 상태에 따라 강조가 바뀐다 ----------
pair('visible-3', '할 일-3 상태에 따른 강조', (bad, title) => page({
  title,
  style: `.demo-ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 6px 12px; background: #f3f6f7; border-bottom: 1px dashed #b9c4cc; font-size: 12px; color: #5a6974; } .demo-ctl button { font-size: 12px; padding: 2px 10px; } .demo-ctl button[aria-pressed="true"] { background: #14212b; border-color: #14212b; color: #fff; }
.card { display: grid; gap: 8px; padding: 12px; border: 1px solid #e3e8ec; border-radius: 8px; } .why { padding: 8px 10px; border-radius: 6px; background: #fbefdf; color: #14212b; } .why.plain { padding: 0; background: none; color: #5a6974; font-size: 13px; } .prog { height: 6px; border-radius: 3px; background: #e3e8ec; overflow: hidden; } .prog i { display: block; height: 100%; width: 66%; background: #0e6b6b; } .acts3 { display: flex; flex-wrap: wrap; gap: 8px; }`,
  body: `
<div class="demo-ctl" role="group" aria-label="상태 바꿔 보기">상태 바꿔 보기 <button type="button" data-s="run" aria-pressed="false">진행 중</button><button type="button" data-s="stuck" aria-pressed="true">막힘</button><button type="button" data-s="done" aria-pressed="false">끝남</button></div>
<div class="app" style="min-height:0">
  ${bar('월간 보고서 만들기')}
  <div class="main"><div class="card" id="card"></div><p class="result" role="status"></p></div>
</div>`,
  script: `
var BAD = ${bad}, S = {
  run: { t: '11월 보고서를 만드는 중입니다. 3단계 중 2단계입니다.', prog: true, act: '멈추기', strong: false },
  stuck: { t: '11월 보고서를 만들다 멈췄습니다.', why: '원본 표 ‘11월 매출’을 읽을 권한이 없습니다. 표 주인에게 권한을 요청하면 이어서 만듭니다.', act: '권한 요청하기', strong: true },
  done: { t: '11월 보고서를 다 만들었습니다. 12쪽입니다.', act: '보고서 내려받기', strong: true }
};
function draw(k) {
  var s = S[k], card = document.getElementById('card');
  var main = s.strong && !BAD ? 'primary' : '';
  card.innerHTML = '<b>' + s.t + '</b>'
    + (s.why ? '<p class="why' + (BAD ? ' plain' : '') + '">' + s.why + '</p>' : '')
    + (s.prog ? '<div class="prog"><i></i></div>' : '')
    + '<div class="acts3"><button type="button" class="' + main + '" data-act="' + s.act + '">' + s.act + '</button><button type="button" class="' + (BAD ? 'primary' : '') + '" data-act="새 보고서 만들기">새 보고서 만들기</button></div>';
  document.querySelectorAll('.demo-ctl button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.s === k)); });
  document.querySelector('.result').textContent = '';
}
document.querySelector('.demo-ctl').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) draw(b.dataset.s); });
document.getElementById('card').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) document.querySelector('.result').textContent = '「' + b.dataset.act + '」을 눌렀습니다.'; });
draw('stuck');`,
}));

// ---------- 누른 뒤-1: 결과를 작업한 자리에서 ----------
const POSTS = ['6월 모임 후기', '7월 책 고르기', '발표 순서 정하기', '장소 바꾸는 일'];
pair('after-1', '누른 뒤-1 결과를 작업한 자리에서 알리기', (bad, title) => page({
  title,
  style: `.note { padding: 6px 12px; border-radius: 8px; background: #e1f0ef; font-size: 13px; }`,
  body: `
<div class="app">
  ${bar('모임 글', '글 <span id="n1">4</span> · 보관함 <span id="n2">0</span>')}
  <div class="main" id="list">
    ${POSTS.map(p => `<div class="row" data-p="${p}"><span class="name">${p}</span><button type="button" class="arc">보관함으로</button></div>`).join('\n    ')}
    <p class="muted empty" hidden>글이 없습니다.</p>
  </div>
</div>`,
  script: `
var list = document.getElementById('list');
list.addEventListener('click', function (e) {
  var b = e.target.closest('.arc'); if (!b) return;
  var row = b.closest('.row'), n = row.nextElementSibling;
  ${bad ? 'row.remove();' : `list.querySelectorAll('.note').forEach(function (x) { x.remove(); });
  var note = document.createElement('p'); note.className = 'note'; note.setAttribute('role', 'status');
  note.textContent = eul(row.dataset.p) + ' 보관함으로 옮겼습니다. 보관함 ' + (+document.getElementById('n2').textContent + 1) + '개';
  row.replaceWith(note);`}
  document.getElementById('n1').textContent = list.querySelectorAll('.row').length;
  document.getElementById('n2').textContent = +document.getElementById('n2').textContent + 1;
  document.querySelector('.empty').hidden = !!list.querySelector('.row');
  var t = (n && n.querySelector && n.querySelector('.arc')) || list.querySelector('.arc'); if (t) t.focus();
});`,
}));

// ---------- 누른 뒤-2: 실패하면 그 자리에 이유, 입력은 그대로 ----------
const LONG = '수요일 저녁 일곱 시 동네 책방 독서 모임';
pair('after-2', '누른 뒤-2 실패한 자리와 입력', (bad, title) => page({
  title,
  style: `form { display: grid; gap: 8px; } .err { margin: 0; color: #b83a26; font-size: 13px; } input[aria-invalid="true"] { border-color: #b83a26; } .ok { margin: 0; color: #0e6b6b; font-size: 13px; }
.toast { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); padding: 8px 14px; border-radius: 8px; background: #14212b; color: #fff; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,.2); white-space: nowrap; }`,
  body: `
<div class="app">
  ${bar('모임 설정')}
  <div class="main">
    <form id="f" novalidate>
      <label for="name">모임 이름</label>
      <input type="text" id="name" value="${LONG}"${bad ? '' : ' aria-describedby="err"'}>
      ${bad ? '' : '<p class="err" id="err" hidden></p>'}
      <div><button type="submit" class="primary">저장</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>
${bad ? '<div class="toast" role="status" hidden>저장에 실패했습니다.</div>' : ''}`,
  script: `
// 데모 틀(sandbox)은 폼 제출을 막아 submit 이벤트가 오지 않는다. 저장 버튼 누름(칸에서 Enter로 누른 것 포함)을 받는다
var f = document.getElementById('f'), inp = document.getElementById('name'), ok = document.querySelector('.ok');
f.querySelector('button[type="submit"]').addEventListener('click', function (e) {
  e.preventDefault(); ok.textContent = '';
  var v = inp.value.trim();
  if (v && v.length <= 20) { ${bad ? '' : "inp.removeAttribute('aria-invalid'); document.getElementById('err').hidden = true; "}ok.textContent = ro(v) + ' 저장했습니다.'; return; }
  ${bad ? `var t = document.querySelector('.toast'); t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, 2500);` : `var err = document.getElementById('err');
  err.textContent = v ? '이름은 20자까지 쓸 수 있습니다. 지금 ' + v.length + '자입니다. 줄인 뒤 다시 저장하면 됩니다.' : '모임 이름을 써야 저장할 수 있습니다.';
  err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus();`}
});`,
}));

// ---------- 글-1: 버튼 이름은 하는 일을 ----------
pair('words-1', '글-1 하는 일을 말하는 버튼 이름', (bad, title) => page({
  title,
  body: `
<div class="app">
  ${bar('발표 예약')}
  <div class="main">
    <div class="row"><span class="name">6월 12일 발표 <span class="muted">· ‘느린 산책’ 3장</span></span><button type="button" id="open">예약 취소</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">6월 12일 발표 예약을 취소할까요?</h2>
  <p>취소하면 이 자리를 다른 회원이 예약할 수 있어요.</p>
  <div class="acts"><button type="button" id="no" autofocus>${bad ? '취소' : '닫기'}</button><button type="button" id="yes" class="primary">${bad ? '확인' : '예약 취소'}</button></div>
</dialog>`,
  script: `
// 이 창을 보려는 데모라 창이 열린 채로 시작한다. 화면 파일에는 닫아 두고 스크립트로 연다(들어오자마자 뜨는 창은 방해-1의 나쁜 예라서)
var dlg = document.getElementById('dlg'), st = document.querySelector('.result'); dlg.show(); scrim.hidden = false; dlg._o = {}; openDlg = dlg;
document.getElementById('open').addEventListener('click', function (e) { st.textContent = ''; openDialog(dlg, e.currentTarget); });
document.getElementById('no').addEventListener('click', function () { st.textContent = '창을 닫았어요. 예약은 그대로예요.'; closeDialog(dlg, document.getElementById('open')); });
document.getElementById('yes').addEventListener('click', function () { st.textContent = '6월 12일 발표 예약을 취소했어요.'; closeDialog(dlg, document.querySelector('.reset')); });`,
}));

// ---------- 글-2: 한 화면 안의 말투 ----------
const W2 = bad => bad
  ? ['모임 소식을 어떻게 받을지 고를 수 있어요.', '새 글이 올라오면 바로 알려 드립니다.', '매주 월요일 아침에 지난주 글을 모아 보낸다.', '모임 하루 전에 알려 드려요.', '알림을 모두 끄면 모임 일정만 메일로 받는다.', '바꾼 설정은 바로 저장됩니다.']
  : ['모임 소식을 어떻게 받을지 고를 수 있습니다.', '새 글이 올라오면 바로 알려 드립니다.', '매주 월요일 아침에 지난주 글을 모아 보내 드립니다.', '모임 하루 전에 알려 드립니다.', '알림을 모두 끄면 모임 일정만 메일로 받습니다.', '바꾼 설정은 바로 저장됩니다.'];
pair('words-2', '글-2 한 화면 안의 말투', (bad, title) => page({
  title,
  style: `.opt { display: grid; grid-template-columns: auto 1fr; gap: 0 10px; align-items: start; padding: 6px 0; border-top: 1px solid #e3e8ec; } .opt input { margin-top: 4px; } .opt label { color: #14212b; font-size: 14px; display: block; } .opt p { grid-column: 2; margin: 0; }`,
  body: (() => { const s = W2(bad); return `
<div class="app">
  ${bar('알림 설정')}
  <div class="main">
    <p>${s[0]}</p>
    <div class="opt"><input type="checkbox" id="c1" checked><label for="c1">새 글 알림</label><p class="muted">${s[1]}</p></div>
    <div class="opt"><input type="checkbox" id="c2" checked><label for="c2">주간 요약</label><p class="muted">${s[2]}</p></div>
    <div class="opt"><input type="checkbox" id="c3"><label for="c3">일정 알림</label><p class="muted">${s[3]}</p></div>
    <p class="muted">${s[4]} ${s[5]}</p>
  </div>
</div>`; })(),
}));

// ========== 2026-11-11 더한 묶음과 규칙(누른 뒤-3·4, 입력, 길, 누구나-5~9, 끼어들지 않기, 속이지 않기, 글-3) ==========
// 글은 해요체 하나. 가격·가게·사람 이름은 지어낸 것이다
// 데모 조작 줄(점선): 데모를 되돌리거나 흉내 내는 버튼. 데모 속 화면의 일부가 아니다
const CTL_CSS = `.demo-ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 6px 12px; background: #f3f6f7; border-bottom: 1px dashed #b9c4cc; font-size: 12px; color: #5a6974; } .demo-ctl button { font-size: 12px; padding: 2px 10px; } .demo-ctl b { color: #14212b; }`;
const ctl = inner => `<div class="demo-ctl" role="group" aria-label="데모 조작">${inner}</div>`;
const FORM_CSS = `form { display: grid; gap: 10px; } .field { display: grid; gap: 4px; } .field > label { font-size: 13px; color: #14212b; font-weight: 600; } input[type="tel"], input[type="email"], input[type="text"] { font: inherit; color: #14212b; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; } input::placeholder { color: #8a979f; } .hint { margin: 0; font-size: 12px; color: #5a6974; } .err { margin: 0; color: #b83a26; font-size: 13px; } input[aria-invalid="true"] { border-color: #b83a26; } .ok { margin: 0; color: #0e6b6b; font-size: 13px; } .ok:empty, .err:empty { display: none; } .need { font-weight: 400; font-size: 12px; color: #5a6974; }`;
const SHEET_CSS = `.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: grid; gap: 8px; padding: 14px 16px 16px; border-top: 1px solid #b9c4cc; border-radius: 12px 12px 0 0; background: #fff; box-shadow: 0 -6px 18px rgba(20, 33, 43, .15); } .sheet h2 { margin: 0; font-size: 15px; } .sheet p { margin: 0; } .sheet .acts { justify-content: flex-start; flex-wrap: wrap; }`;
const won = n => `${n.toLocaleString('ko-KR')}원`;
const BREADS = [['소금빵', 3200, '버터를 넣고 돌돌 말아 겉에 소금을 뿌려 구웠어요.'], ['우유 식빵', 4800, '우유로만 반죽해 결이 부드러워요.'], ['무화과 깜빠뉴', 6500, '말린 무화과를 듬뿍 넣었어요.']];

// ---------- 누른 뒤-3: 점수의 뜻과 바뀐 이유 ----------
pair('after-3', '누른 뒤-3 점수의 뜻과 바뀐 이유', (bad, title) => page({
  title,
  style: `.score { display: grid; gap: 8px; padding: 12px; border: 1px solid #e3e8ec; border-radius: 8px; } .big { font-size: 28px; font-weight: 700; line-height: 1.2; } .big small { font-size: 14px; font-weight: 400; color: #5a6974; } .grade { justify-self: start; padding: 0 10px; border-radius: 999px; background: #fbefdf; font-weight: 600; } .bands { display: grid; grid-template-columns: 50fr 30fr 20fr; gap: 2px; font-size: 12px; color: #5a6974; } .bands span { border-top: 6px solid #e3e8ec; padding-top: 2px; } .bands .here { border-top-color: #9a6a00; color: #14212b; font-weight: 600; } .why { margin: 0; }`,
  body: `
<div class="app">
  ${bar('우리집 가계부', '11월')}
  <div class="main">
    <div class="score">
      <span class="muted">이번 달 지출 점수</span>
      ${bad ? `<span class="big">62</span>
      <span class="grade">C 등급</span>` : `<span class="big">62점 <small>100점 중</small></span>
      <div class="bands"><span>0~49 아껴야 함</span><span class="here">50~79 보통 · 지금</span><span>80~100 잘함</span></div>
      <p class="why">지난달 74점보다 <b>12점 내렸어요.</b> 외식비가 지난달보다 8만 원 늘어난 것이 가장 컸어요.</p>
      <p class="why muted">외식비 예산을 정해 두면 다음 달 점수에 반영돼요.</p>`}
    </div>
  </div>
</div>`,
}));

// ---------- 누른 뒤-4: 결제가 실패한 뒤 ----------
const FLOWERS = [['프리지아 한 단', 18000], ['유칼립투스 한 단', 14000]];
pair('after-4', '누른 뒤-4 결제가 실패한 뒤', (bad, title) => page({
  title,
  style: `${FORM_CSS} .sum { display: flex; justify-content: space-between; font-weight: 600; } fieldset { border: 1px solid #e3e8ec; border-radius: 8px; padding: 8px 12px; margin: 0; display: grid; gap: 4px; } legend { font-size: 13px; font-weight: 600; padding: 0 4px; } .opt { display: flex; gap: 8px; align-items: center; color: #14212b; font-size: 14px; } .pay-err { margin: 0; padding: 8px 10px; border-radius: 6px; background: #fbe9e5; border: 1px solid #e3a597; color: #14212b; }
.toast { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); padding: 8px 14px; border-radius: 8px; background: #14212b; color: #fff; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,.2); white-space: nowrap; }`,
  body: `
<div class="app">
  ${bar('동네 꽃집', '주문서')}
  <div class="main" id="main">
    ${FLOWERS.map(([n, p]) => `<div class="row"><span class="name">${n}</span><span>${won(p)}</span></div>`).join('\n    ')}
    <p class="muted">받는 곳: 꽃길로 12, 2층</p>
    ${bad ? '' : '<p class="pay-err" id="pay-err" role="alert" hidden></p>'}
    <fieldset id="method" tabindex="-1"><legend>결제 수단</legend>
      <label class="opt"><input type="radio" name="m" value="card" checked> 카드(끝자리 1234)</label>
      <label class="opt"><input type="radio" name="m" value="bank"> 계좌 이체</label>
    </fieldset>
    <div class="sum"><span>결제할 금액</span><span>32,000원</span></div>
    <div><button type="button" id="pay" class="primary">32,000원 결제하기</button></div>
    <p class="ok" role="status"></p>
  </div>
</div>
${bad ? '<div class="toast" role="status" hidden>결제에 실패했어요.</div>' : ''}`,
  script: `
var pay = document.getElementById('pay'), ok = document.querySelector('.ok');
pay.addEventListener('click', function () {
  // 누른 뒤에만 잠근다(두 번 결제 막기). 결과가 오면 푼다
  pay.disabled = true; pay.setAttribute('aria-busy', 'true'); ok.textContent = '';
  setTimeout(function () {
    pay.disabled = false; pay.removeAttribute('aria-busy');
    if (document.querySelector('input[name="m"]:checked').value === 'bank') { ${bad ? '' : "document.getElementById('pay-err').hidden = true; "}ok.textContent = '주문했어요. 이체할 계좌를 문자로 보냈어요.'; return; }
    ${bad ? `var t = document.querySelector('.toast'); t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, 2500);
    document.getElementById('main').innerHTML = '<p class="muted">처음 화면으로 돌아왔어요. 오늘 들어온 꽃을 둘러보세요.</p>';` : `var e = document.getElementById('pay-err');
    e.textContent = '카드 한도를 넘어 결제하지 못했어요. 담은 꽃과 받는 곳은 그대로예요. 다른 결제 수단을 고르고 다시 결제해 주세요.';
    e.hidden = false; document.getElementById('method').focus();`}
  }, 600);
});`,
}));

// ---------- 입력-1: 보이는 레이블 ----------
const JOIN = [['nm', '이름', 'text', '김하늘', ''], ['tel', '휴대폰 번호', 'tel', '', '010-1234-5678'], ['mail', '이메일', 'email', '', 'name@example.com']];
pair('input-1', '입력-1 보이는 레이블', (bad, title) => page({
  title, style: FORM_CSS,
  body: `
<div class="app">
  ${bar('모임 가입 신청')}
  <div class="main">
    <form novalidate>
      ${JOIN.map(([id, l, t, v, ex]) => bad
        ? `<input type="${t}" id="${id}" placeholder="${l}"${v ? ` value="${v}"` : ''}>`
        : `<div class="field"><label for="${id}">${l}</label><input type="${t}" id="${id}"${v ? ` value="${v}"` : ''}${ex ? ` aria-describedby="${id}-h"` : ''}>${ex ? `<p class="hint" id="${id}-h">예: ${ex}</p>` : ''}</div>`).join('\n      ')}
      <div><button type="button" class="primary" id="go">가입 신청</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>`,
  script: `
document.getElementById('go').addEventListener('click', function () { document.querySelector('.ok').textContent = '신청 내용을 받았어요.'; });`,
}));

// ---------- 입력-2: 입력 종류와 자동 채우기 ----------
const ADDR = [['nm', '받는 사람', 'text', '', 'name'], ['tel', '휴대폰 번호', 'tel', '', 'tel'], ['mail', '이메일', 'email', '', 'email'], ['zip', '우편번호', 'text', 'numeric', 'postal-code']];
pair('input-2', '입력-2 입력 종류와 자동 채우기', (bad, title) => page({
  title, style: FORM_CSS,
  capHtml: '<span>휴대폰에서 열릴 자판: <b class="kb">칸을 눌러 보세요</b></span><span>자동 채우기: <b class="ac">-</b></span>',
  body: `
<div class="app">
  ${bar('배송지 추가')}
  <div class="main">
    <form novalidate>
      ${ADDR.map(([id, l, t, im, ac]) => `<div class="field"><label for="${id}">${l}</label><input type="${bad ? 'text' : t}" id="${id}"${!bad && im ? ` inputmode="${im}"` : ''}${bad ? '' : ` autocomplete="${ac}"`}></div>`).join('\n      ')}
      <div><button type="button" class="primary" id="go">배송지 저장</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>`,
  script: `
var KB = { tel: '숫자 자판(전화)', email: '@가 있는 자판', numeric: '숫자 자판' }, AC = { name: '이름', tel: '전화번호', email: '이메일', 'postal-code': '우편번호' };
document.addEventListener('focusin', function (e) {
  var t = e.target; if (!t.matches('input')) return;
  document.querySelector('.cap .kb').textContent = KB[t.getAttribute('inputmode')] || KB[t.type] || '글자 자판';
  var ac = t.getAttribute('autocomplete');
  document.querySelector('.cap .ac').textContent = ac ? AC[ac] + ' (autocomplete="' + ac + '")' : '정하지 않음(브라우저가 짐작)';
});
document.getElementById('go').addEventListener('click', function () { document.querySelector('.ok').textContent = '배송지를 저장했어요.'; });`,
}));

// ---------- 입력-3: 붙여넣기 ----------
pair('input-3', '입력-3 붙여넣기', (bad, title) => page({
  title,
  style: `${FORM_CSS} .mail { display: grid; gap: 4px; padding: 10px 12px; border-radius: 8px; background: #f3f6f7; } .code { font-family: ui-monospace, Menlo, monospace; font-size: 16px; letter-spacing: .04em; user-select: all; } .code-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }`,
  body: `
<div class="app">
  ${bar('수요 독서 모임', '초대받은 모임')}
  <div class="main">
    <div class="mail"><span class="muted">메일로 받은 초대 코드</span><div class="code-row"><span class="code" id="code">MOIM-7F3K-92QD</span><button type="button" id="copy">코드 복사</button></div></div>
    <form novalidate>
      <div class="field"><label for="inv">초대 코드</label><input type="text" id="inv" autocomplete="off" aria-describedby="inv-e"${bad ? ' onpaste="blockPaste(event); return false"' : ''}><p class="err" id="inv-e"></p></div>
      <div><button type="button" class="primary" id="join">모임 들어가기</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>`,
  script: `
var inv = document.getElementById('inv'), err = document.getElementById('inv-e'), ok = document.querySelector('.ok');
${bad ? `function blockPaste(e) { e.preventDefault(); err.textContent = '보안을 위해 붙여넣기는 할 수 없어요. 코드를 직접 입력해 주세요.'; }` : ''}
document.getElementById('copy').addEventListener('click', function () {
  var r = document.createRange(); r.selectNodeContents(document.getElementById('code'));
  var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  var done = false; try { done = document.execCommand('copy'); } catch (x) {}
  ok.textContent = done ? '코드를 복사했어요. 아래 칸에 붙여넣어 보세요.' : '코드를 골라 두었어요. 복사(⌘C·Ctrl+C)한 뒤 아래 칸에 붙여넣어 보세요.';
});
document.getElementById('join').addEventListener('click', function () {
  ok.textContent = '';
  if (inv.value.trim().toUpperCase() === 'MOIM-7F3K-92QD') { err.textContent = ''; inv.removeAttribute('aria-invalid'); ok.textContent = '‘수요 독서 모임’에 들어왔어요.'; return; }
  err.textContent = inv.value.trim() ? '코드가 맞지 않아요. 메일의 코드와 한 글자씩 견줘 보세요.' : '초대 코드를 넣어 주세요.';
  inv.setAttribute('aria-invalid', 'true'); inv.focus();
});`,
}));

// ---------- 입력-4: 제출 버튼을 미리 끄지 않기 ----------
pair('input-4', '입력-4 제출 버튼을 미리 끄지 않기', (bad, title) => page({
  title, style: FORM_CSS,
  body: `
<div class="app">
  ${bar('11월 동네 걷기', '신청')}
  <div class="main">
    <form id="f" novalidate>
      <div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="김하늘" aria-describedby="nm-e"><p class="err" id="nm-e"></p></div>
      <div class="field"><label for="ph">휴대폰 번호</label><input type="tel" id="ph" autocomplete="tel" value="010-1234-567" aria-describedby="ph-e"><p class="err" id="ph-e"></p></div>
      <div><button type="submit" class="primary" id="go"${bad ? ' disabled' : ''}>신청하기</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>`,
  script: `
// 데모 틀(sandbox)은 폼 제출을 막아 submit 이벤트가 오지 않는다. 버튼 누름을 받는다
var nm = document.getElementById('nm'), ph = document.getElementById('ph'), go = document.getElementById('go'), ok = document.querySelector('.ok');
function digits() { return ph.value.replace(/\\D/g, ''); }
function check() { return nm.value.trim() && /^01\\d{9}$/.test(digits()); }
${bad ? `function sync() { var valid = check(); go.disabled = !valid; }
nm.addEventListener('input', sync); ph.addEventListener('input', sync);` : `function say(inp, msg) { document.getElementById(inp.id + '-e').textContent = msg; if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }`}
go.addEventListener('click', function (e) {
  e.preventDefault(); ok.textContent = '';
  ${bad ? '' : `var n = 11 - digits().length;
  say(nm, nm.value.trim() ? '' : '이름을 써 주세요.');
  say(ph, /^01\\d{9}$/.test(digits()) ? '' : n > 0 && n < 11 ? '휴대폰 번호가 ' + n + '자리 모자라요. 010으로 시작하는 11자리를 써 주세요.' : '010으로 시작하는 11자리 휴대폰 번호를 써 주세요.');
  var first = document.querySelector('[aria-invalid="true"]'); if (first) { first.focus(); return; }`}
  if (check()) ok.textContent = '신청했어요. 11월 23일에 만나요.';
});`,
}));

// ---------- 입력-5: 꼭 써야 하는 칸과 비워도 되는 칸 ----------
const APPLY = [['nm', '이름', 'text', true], ['ph', '휴대폰 번호', 'tel', true], ['org', '회사·단체 이름', 'text', false], ['msg', '하고 싶은 말', 'text', false]];
pair('input-5', '입력-5 필수와 선택 표시', (bad, title) => page({
  title, style: FORM_CSS,
  body: `
<div class="app">
  ${bar('동네 책 나눔', '참가 신청')}
  <div class="main">
    <form novalidate>
      ${APPLY.map(([id, l, t, need]) => `<div class="field"><label for="${id}">${l}${bad ? '' : ` <span class="need">${need ? '[필수]' : '[선택]'}</span>`}</label><input type="${t}" id="${id}"${need ? ` aria-describedby="${id}-e"` : ''}>${need ? `<p class="err" id="${id}-e"></p>` : ''}</div>`).join('\n      ')}
      <div><button type="button" class="primary" id="go">신청하기</button></div>
      <p class="ok" role="status"></p>
    </form>
  </div>
</div>`,
  script: `
document.getElementById('go').addEventListener('click', function () {
  var ok = document.querySelector('.ok'), first = null; ok.textContent = '';
  [['nm', '이름을 써 주세요.'], ['ph', '휴대폰 번호를 써 주세요.']].forEach(function (x) {
    var inp = document.getElementById(x[0]), empty = !inp.value.trim();
    document.getElementById(x[0] + '-e').textContent = empty ? x[1] : '';
    if (empty) { inp.setAttribute('aria-invalid', 'true'); first = first || inp; } else inp.removeAttribute('aria-invalid');
  });
  if (first) first.focus(); else ok.textContent = '신청했어요.';
});`,
}));

// ---------- 길-1: 이동은 진짜 링크로 ----------
const NOTICES = [['n1', '12월 모임 장소가 바뀌어요'], ['n2', '연말 책 나눔 신청을 받아요'], ['n3', '11월 모임 사진을 올렸어요']];
pair('way-1', '길-1 이동은 진짜 링크로', (bad, title) => page({
  title,
  style: `.list { display: grid; gap: 4px; } .item { display: block; width: 100%; text-align: left; padding: 8px 12px; border: 1px solid #e3e8ec; border-radius: 8px; background: #fff; color: #0e5a8a; text-decoration: underline; font: inherit; cursor: pointer; } .reader { margin: 0; padding: 8px 12px; border-radius: 8px; background: #f3f6f7; font-size: 13px; }`,
  body: `
<div class="app">
  ${bar('모임 공지', '3개')}
  <div class="main">
    <div class="list">
      ${NOTICES.map(([id, t]) => bad ? `<button type="button" class="item" onclick="location.href='#${id}'">${t}</button>` : `<a class="item" href="#${id}">${t}</a>`).join('\n      ')}
    </div>
    <p class="reader" role="status" id="reader">연 글: 없음</p>
  </div>
</div>`,
  script: `
var T = ${JSON.stringify(Object.fromEntries(NOTICES))};
function show() { var k = location.hash.slice(1); document.getElementById('reader').textContent = T[k] ? '연 글: ' + T[k] + ' (주소 끝 #' + k + ')' : '연 글: 없음'; }
addEventListener('hashchange', show); show();`,
}));

// ---------- 길-2: 지금 있는 곳 표시 ----------
const MENU = [['home', '홈', '새 글 3개, 다가오는 모임 1개가 있어요.'], ['meet', '모임', '수요 독서 모임, 동네 걷기 모임에 들어가 있어요.'], ['plan', '일정', '11월 23일 동네 걷기, 12월 6일 책 나눔이 잡혀 있어요.'], ['set', '설정', '알림은 모임 하루 전에만 받고 있어요.']];
pair('way-2', '길-2 지금 있는 곳 표시', (bad, title) => page({
  title,
  capHtml: '<span>화면 읽기 프로그램이 읽는 말(대략): <b class="sr">Tab으로 메뉴를 지나 보세요</b></span>',
  style: `.tabs { display: flex; gap: 4px; padding: 0 12px; border-bottom: 1px solid #d8e0e5; } .tabs a { padding: 8px 10px; color: #5a6974; text-decoration: none; border-bottom: 3px solid transparent; margin-bottom: -1px; } .tabs a.on { color: #0e6b6b; } .tabs a[aria-current="page"] { color: #14212b; font-weight: 700; border-bottom-color: #0e6b6b; }`,
  body: `
<div class="app">
  ${bar('우리 모임')}
  <nav class="tabs" aria-label="메뉴">${MENU.map(([id, n], i) => `<a href="#${id}" data-id="${id}"${i ? '' : bad ? ' class="on"' : ' aria-current="page"'}>${n}</a>`).join('')}</nav>
  <div class="main"><p id="body">${MENU[0][2]}</p></div>
</div>`,
  script: `
var BODY = ${JSON.stringify(Object.fromEntries(MENU.map(([id, , t]) => [id, t])))};
function go(k) {
  if (!BODY[k]) k = 'home';
  document.querySelectorAll('.tabs a').forEach(function (a) { var on = a.dataset.id === k; ${bad ? "a.classList.toggle('on', on);" : "if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');"} });
  document.getElementById('body').textContent = BODY[k];
}
addEventListener('hashchange', function () { go(location.hash.slice(1)); }); go(location.hash.slice(1));
document.addEventListener('focusin', function (e) {
  var a = e.target.closest('.tabs a'); if (!a) return;
  document.querySelector('.cap .sr').textContent = '「' + a.textContent + ', 링크' + (a.getAttribute('aria-current') === 'page' ? ', 현재 페이지' : '') + '」';
});`,
}));

// ---------- 길-3: 페이지 제목 ----------
const TABS3 = [['후기', '6월 모임 후기', '6월에는 ‘느린 산책’을 읽고 이야기를 나눴어요.'], ['설정', '알림 설정', '알림은 모임 하루 전에만 받고 있어요.'], ['일정', '일정', '11월 23일 동네 걷기, 12월 6일 책 나눔이 잡혀 있어요.']];
pair('way-3', '길-3 화면마다 뜻 있는 페이지 제목', (bad, title) => page({
  title,
  style: `.chrome { display: flex; gap: 2px; padding: 6px 8px 0; background: #e3e8ec; } .chrome button { flex: 1; min-width: 0; text-align: left; font-size: 12px; padding: 6px 8px; border: 0; border-radius: 6px 6px 0 0; background: #cfd8de; color: #14212b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .chrome button[aria-selected="true"] { background: #fff; } .pg h2 { margin: 0 0 4px; font-size: 16px; } .pg p { margin: 0; }`,
  body: `
<div class="chrome" role="tablist" aria-label="브라우저 탭(흉내)">${TABS3.map(([k, h], i) => `<button type="button" role="tab" aria-selected="${!i}" data-k="${k}">${bad ? '우리 모임' : `${h} – 우리 모임`}</button>`).join('')}</div>
<div class="app" style="min-height:0">
  ${bar('우리 모임')}
  <div class="main pg"><h2 id="h"></h2><p id="t"></p></div>
</div>`,
  script: `
var P = ${JSON.stringify(Object.fromEntries(TABS3.map(([k, h, t]) => [k, [h, t]])))};
function show(k) {
  document.getElementById('h').textContent = P[k][0]; document.getElementById('t').textContent = P[k][1];
  document.querySelectorAll('.chrome button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.k === k)); });
}
document.querySelector('.chrome').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(b.dataset.k); });
show('후기');`,
}));

// ---------- 길-4: 나갈 길 ----------
pair('way-4', '길-4 막다른 화면 없이 나갈 길', (bad, title) => page({
  title,
  style: `${CTL_CSS} .app { position: relative; } .card { display: grid; gap: 6px; padding: 12px; border: 1px solid #e3e8ec; border-radius: 8px; justify-items: start; } .done { position: absolute; inset: 0; z-index: 5; display: grid; align-content: center; justify-items: center; gap: 8px; padding: 24px 16px; text-align: center; background: #fff; } .done h2 { margin: 0; font-size: 18px; } .done p { margin: 0; } .x { position: absolute; top: 8px; right: 8px; } .acts4 { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }`,
  body: `
${ctl('데모 조작 <button type="button" class="reset">처음으로</button>')}
<div class="app" style="min-height:0">
  <div class="bar">동네 걷기 모임</div>
  <div class="main">
    <div class="card"><b>11월 동네 걷기</b><span class="muted">11월 23일 오전 10시 · 동네 공원 정문</span><button type="button" class="primary" id="apply">신청하기</button></div>
    <p class="result" role="status"></p>
  </div>
  <div class="done" id="done" hidden>
    ${bad ? '' : '<button type="button" class="x" id="x" aria-label="닫기">✕</button>'}
    <h2 id="done-t" tabindex="-1">신청을 받았어요</h2>
    <p>11월 23일 오전 10시, 동네 공원 정문에서 만나요.</p>
    ${bad ? '' : '<div class="acts4"><button type="button" class="primary" id="mine">내 신청 보기</button><button type="button" id="close">닫기</button></div>'}
  </div>
</div>`,
  script: `
var done = document.getElementById('done'), apply = document.getElementById('apply'), res = document.querySelector('.result');
apply.addEventListener('click', function () { done.hidden = false; document.getElementById('done-t').focus(); });
${bad ? '' : `function back(msg) { done.hidden = true; apply.textContent = '신청함'; apply.disabled = true; res.textContent = msg; document.querySelector('.card b').setAttribute('tabindex', '-1'); document.querySelector('.card b').focus(); }
document.getElementById('x').addEventListener('click', function () { back('11월 동네 걷기에 신청했어요.'); });
document.getElementById('close').addEventListener('click', function () { back('11월 동네 걷기에 신청했어요.'); });
document.getElementById('mine').addEventListener('click', function () { back('내 신청: 11월 동네 걷기 1건이에요.'); });`}`,
}));

// ---------- 누구나-5: 화면 확대 ----------
pair('everyone-5', '누구나-5 화면 확대', (bad, title) => page({
  title,
  viewport: bad ? 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' : undefined,
  style: `${CTL_CSS} .zoomed .app { zoom: 2; } .rcpt { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid #e3e8ec; border-radius: 8px; font-size: 13px; } .rcpt .line { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 8px; } .fine { font-size: 12px; color: #5a6974; margin: 0; }`,
  body: `
${ctl('<button type="button" id="pinch" aria-pressed="false">두 손가락으로 벌리기(흉내)</button><span id="zmsg" role="status"></span>')}
<div class="app" style="min-height:0">
  ${bar('동네 약국', '복약 안내')}
  <div class="main">
    <div class="rcpt">
      <div class="line"><b>감기약(3일분)</b><span>하루 3번, 밥 먹고 30분 뒤</span></div>
      <div class="line"><b>위장약(3일분)</b><span>하루 3번, 밥 먹기 30분 전</span></div>
    </div>
    <p class="fine">졸릴 수 있어요. 약을 먹은 뒤에는 운전을 피해 주세요. 다른 약과 함께 먹어야 하면 약사에게 물어봐 주세요.</p>
  </div>
</div>`,
  script: `
document.getElementById('pinch').addEventListener('click', function (e) {
  var on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  ${bad ? `document.getElementById('zmsg').textContent = on ? '확대를 막아 두어 그대로예요.' : '';` : `document.body.classList.toggle('zoomed', on); document.getElementById('zmsg').textContent = on ? '두 배로 키웠어요.' : '';`}
});`,
}));

// ---------- 누구나-6: 움직임 줄이기와 멈춤 ----------
const SLIDES = [['11월 책 나눔', '읽은 책을 가져와 바꿔 읽어요. 12월 6일까지 신청을 받아요.'], ['동네 걷기', '11월 23일 오전 10시에 공원 정문에서 출발해요.'], ['새 모임 열기', '모임을 열면 첫 달 공간 대여료를 함께 내 드려요.']];
pair('everyone-6', '누구나-6 움직임 줄이기와 멈춤', (bad, title) => page({
  title,
  style: `.banner { display: grid; padding: 14px 16px; min-height: 96px; border-radius: 10px; background: #e1f0ef; overflow: hidden; } .slide { display: grid; gap: 4px; } .slide.on { animation: slide-in .5s ease-out; } @keyframes slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } } .slide b { font-size: 16px; } .ctrl { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5a6974; }${bad ? '' : '\n@media (prefers-reduced-motion: reduce) { .slide.on { animation: none; } }'}`,
  body: `
<div class="app">
  ${bar('우리 동네 모임')}
  <div class="main">
    <div class="banner" aria-label="모임 소식">
      ${SLIDES.map(([t, d], i) => `<div class="slide${i ? '' : ' on'}"${i ? ' hidden' : ''}><b>${t}</b><span>${d}</span></div>`).join('\n      ')}
    </div>
    <div class="ctrl"><span id="pos">1 / 3</span>${bad ? '' : '<button type="button" id="pause">멈춤</button>'}</div>
    <p class="muted">이번 주 새 글 3개</p>
  </div>
</div>`,
  script: `
var slides = document.querySelectorAll('.slide'), cur = 0, timer = null;
function nextSlide() {
  slides[cur].hidden = true; slides[cur].classList.remove('on');
  cur = (cur + 1) % slides.length;
  slides[cur].hidden = false; slides[cur].classList.add('on');
  document.getElementById('pos').textContent = (cur + 1) + ' / ' + slides.length;
}
function start() { timer = setInterval(nextSlide, 3000); }
${bad ? 'start();' : `var pause = document.getElementById('pause');
function setPlaying(on) { if (on) start(); else { clearInterval(timer); timer = null; } pause.textContent = on ? '멈춤' : '다시 넘기기'; }
pause.addEventListener('click', function () { setPlaying(!timer); });
// 움직임 줄이기를 켠 사람에게는 저절로 넘기지 않는다
setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches);`}`,
}));

// ---------- 누구나-7: 소리 나는 자동 재생 ----------
pair('everyone-7', '누구나-7 소리 나는 자동 재생', (bad, title) => page({
  title,
  style: `.player { position: relative; border-radius: 10px; overflow: hidden; background: #14212b; } .player video { display: block; width: 100%; height: 140px; background: #14212b; } .over { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 8px; color: #fff; text-align: center; } .over button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.6); color: #fff; } .rec { margin: 0; }`,
  body: `
<div class="app">
  ${bar('오늘의 반찬', '두부조림')}
  <div class="main">
    <div class="player">
      <video ${bad ? 'autoplay loop playsinline' : 'muted playsinline'} aria-label="두부조림 만드는 영상"></video>
      <div class="over"><span id="st">${bad ? '재생 중 · 소리 켜짐' : '재생 전'}</span><button type="button" id="btn">${bad ? '소리 끄기' : '영상 재생'}</button></div>
    </div>
    <p class="rec">두부를 1cm 두께로 썰어 앞뒤로 노릇하게 구워요. 간장 3, 물 6, 고춧가루 1을 섞어 부어 졸여요.</p>
  </div>
</div>`,
  script: `
// 데모라 실제 영상과 소리는 없다. 상태 글만 바꾼다
var st = document.getElementById('st'), btn = document.getElementById('btn');
btn.addEventListener('click', function () {
  ${bad ? `var on = btn.textContent === '소리 켜기'; st.textContent = on ? '재생 중 · 소리 켜짐' : '재생 중 · 소리 꺼짐'; btn.textContent = on ? '소리 끄기' : '소리 켜기';` : `var play = btn.textContent === '영상 재생'; st.textContent = play ? '재생 중 · 소리 켜짐' : '멈춤'; btn.textContent = play ? '멈춤' : '영상 재생';`}
});`,
}));

// ---------- 누구나-8: 시간 제한 ----------
pair('everyone-8', '누구나-8 시간 제한 알리고 늘리기', (bad, title) => page({
  title,
  style: `${CTL_CSS} .hold { margin: 0; } .acts3 { display: flex; flex-wrap: wrap; gap: 8px; }`,
  body: `
${ctl('<button type="button" id="ff">10초 보내기</button>')}
<div class="app" style="min-height:0">
  ${bar('동네 음악회', '좌석 고르기')}
  <div class="main">
    <div class="row" id="seat"><span class="name">A열 3번, A열 4번</span><span>2장 · 40,000원</span></div>
    <p class="hold" id="hold">좌석을 30초 동안 잡아 뒀어요. 시간이 지나면 좌석이 다른 분께 넘어가요.</p>
    <p class="muted">남은 시간 <b id="left">0:30</b></p>
    <div class="acts3"><button type="button" class="primary" id="next">2장 결제로 넘어가기</button>${bad ? '' : '<button type="button" id="more">시간 늘리기</button>'}</div>
    <p class="result" role="status"></p>
  </div>
</div>
${bad ? '' : `<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">좌석을 더 잡아 둘까요?</h2>
  <p>20초 뒤에 잡아 둔 좌석이 풀려요.</p>
  <div class="acts"><button type="button" id="no">그만 고르기</button><button type="button" id="yes" class="primary" autofocus>30초 늘리기</button></div>
</dialog>`}`,
  script: `
// 데모가 화면에 보일 때부터 센다(아래로 내려와 보기 전에 끝나지 않게)
var left = 30, warned = false, ended = false, t = null, res = document.querySelector('.result'), next = document.getElementById('next');
function draw() { var l = Math.max(left, 0); document.getElementById('left').textContent = Math.floor(l / 60) + ':' + String(l % 60).padStart(2, '0'); }
function tick(n) {
  if (ended) return;
  left -= n; draw();
  ${bad ? '' : `if (left <= 20 && left > 0 && !warned) { warned = true; openDialog(document.getElementById('dlg'), document.getElementById('more')); }`}
  if (left <= 0) {
    ended = true; clearInterval(t);${bad ? '' : ' if (openDlg) closeDialog(openDlg, next);'}
    document.getElementById('seat').remove(); next.disabled = true;
    document.getElementById('hold').textContent = '시간이 지나 좌석이 풀렸어요. 처음부터 다시 골라 주세요.';
  }
}
function begin() { if (!t && !ended) t = setInterval(function () { tick(1); }, 1000); }
if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) begin(); }).observe(document.querySelector('.main'));
else begin();
document.getElementById('ff').addEventListener('click', function () { begin(); tick(10); });
next.addEventListener('click', function () { if (ended) return; ended = true; clearInterval(t); res.textContent = '결제 화면으로 넘어갔어요.'; });
${bad ? '' : `function extend() { left += 30; warned = false; draw(); res.textContent = '30초 늘렸어요.'; }
document.getElementById('more').addEventListener('click', extend);
document.getElementById('yes').addEventListener('click', function () { extend(); closeDialog(document.getElementById('dlg')); });
document.getElementById('no').addEventListener('click', function () { closeDialog(document.getElementById('dlg')); });`}`,
}));

// ---------- 누구나-9: 색만으로 전하지 않기 ----------
const ORDERS = [['주문 1102', '프리지아 한 단', 'ship', '배송 중'], ['주문 1098', '유칼립투스 한 단', 'done', '배송 완료'], ['주문 1095', '작은 화분', 'cancel', '주문 취소']];
pair('everyone-9', '누구나-9 색만으로 전하지 않기', (bad, title) => page({
  title,
  style: `${CTL_CSS} .gray .app { filter: grayscale(1); } .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex: none; } .st { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; white-space: nowrap; } .ship { background: #d89a00; } .done { background: #2f8f5b; } .cancel { background: #c8432b; } .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: #5a6974; } .legend span { display: inline-flex; align-items: center; gap: 4px; }`,
  body: `
${ctl('<button type="button" id="gray" aria-pressed="false">흑백으로 보기</button>')}
<div class="app" style="min-height:0">
  ${bar('주문 내역', '3건')}
  <div class="main">
    ${ORDERS.map(([no, item, k, label]) => `<div class="row"><span class="name">${item} <span class="muted">· ${no}</span></span>${bad ? `<span class="status-dot ${k}"></span>` : `<span class="st"><i class="status-dot ${k}" aria-hidden="true"></i>${label}</span>`}</div>`).join('\n    ')}
    ${bad ? `<div class="legend">${ORDERS.map(([, , k, label]) => `<span><i class="status-dot ${k}"></i>${label}</span>`).join('')}</div>` : ''}
  </div>
</div>`,
  script: `
document.getElementById('gray').addEventListener('click', function (e) { var on = document.body.classList.toggle('gray'); e.currentTarget.setAttribute('aria-pressed', String(on)); });`,
}));

// ---------- 방해-1: 들어오자마자 뜨는 창 ----------
pair('interrupt-1', '방해-1 들어오자마자 뜨는 창', (bad, title) => page({
  title,
  style: `.ask { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; padding: 8px 12px; border-radius: 8px; background: #e1f0ef; font-size: 13px; }`,
  body: `
<div class="app">
  ${bar('동네 빵집', '오늘 나온 빵')}
  <div class="main" id="list">
    ${BREADS.map(([n, p]) => `<div class="row" data-n="${n}"><span class="name">${n} <span class="muted">· ${won(p)}</span></span><button type="button" class="put" data-name="${n} 담기">담기</button></div>`).join('\n    ')}
    <p class="result" role="status"></p>
  </div>
</div>
${bad ? `<div class="scrim"></div>
<dialog id="dlg" open aria-labelledby="dlg-t">
  <h2 id="dlg-t">앱 알림을 켜 둘까요?</h2>
  <p>알림을 켜면 첫 주문 2,000원 할인 쿠폰을 드려요.</p>
  <div class="acts"><button type="button" id="no">닫기</button><button type="button" id="yes" class="primary" autofocus>알림 켜기</button></div>
</dialog>` : ''}`,
  script: `
var list = document.getElementById('list'), res = document.querySelector('.result'), asked = false;
list.addEventListener('click', function (e) {
  var b = e.target.closest('.put'); if (!b) return;
  res.textContent = eul(b.closest('.row').dataset.n) + ' 담았어요.';
  ${bad ? '' : `// 알림은 쓸모 있는 순간(빵을 담은 뒤)에 그 자리에서 한 번만 묻는다
  if (asked) return; asked = true;
  var p = document.createElement('p'); p.className = 'ask';
  p.innerHTML = '<span>빵이 새로 나오면 알려 드릴까요?</span><button type="button">알림 받기</button>';
  res.after(p);
  p.querySelector('button').addEventListener('click', function () { p.textContent = '새 빵이 나오면 알려 드릴게요.'; });`}
});
${bad ? `var dlg = document.getElementById('dlg'); dlg._o = {}; openDlg = dlg;
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg, list.querySelector('.put')); });
document.getElementById('yes').addEventListener('click', function () { res.textContent = '알림을 켰어요.'; closeDialog(dlg, list.querySelector('.put')); });` : ''}`,
}));

// ---------- 방해-2: 거절한 것을 다시 묻기 ----------
const SHELF = [['식빵', '우유 식빵, 통밀 식빵이 있어요.'], ['과자', '버터 쿠키, 마들렌이 있어요.'], ['케이크', '당근 케이크가 있어요.']];
pair('interrupt-2', '방해-2 거절한 것을 다시 묻기', (bad, title) => page({
  title,
  style: `${CTL_CSS}${SHEET_CSS} .tabs2 { display: flex; gap: 4px; } .tabs2 button[aria-pressed="true"] { background: #14212b; border-color: #14212b; color: #fff; }`,
  body: `
${ctl('같은 창이 뜬 횟수: <b id="cnt">0번</b>')}
<div class="app" style="min-height:0">
  ${bar('동네 빵집')}
  <div class="main">
    <div class="tabs2" role="group" aria-label="빵 종류">${SHELF.map(([t], i) => `<button type="button" aria-pressed="${!i}">${t}</button>`).join('')}</div>
    <p id="shelf">${SHELF[0][1]}</p>
  </div>
</div>
<div class="sheet" id="sheet" role="dialog" aria-labelledby="sh-t" hidden>
  <h2 id="sh-t">앱으로 보면 더 편해요</h2>
  <p>앱에서는 주문 알림을 바로 받을 수 있어요.</p>
  <div class="acts"><button type="button" class="primary" id="app">앱 열기</button>${bad ? '' : '<button type="button" id="week">7일간 보지 않기</button>'}<button type="button" id="close">닫기</button></div>
</div>`,
  script: `
var S = ${JSON.stringify(Object.fromEntries(SHELF))}, sheet = document.getElementById('sheet'), n = 0, refused = false, from = null;
function ask(opener) { ${bad ? '' : 'if (refused) return; '}from = opener; sheet.hidden = false; n++; document.getElementById('cnt').textContent = n + '번'; document.getElementById('app').focus(); }
function close() { sheet.hidden = true; ${bad ? '' : 'refused = true; '}if (from) from.focus(); }
document.querySelector('.tabs2').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('.tabs2 button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  document.getElementById('shelf').textContent = S[b.textContent];
  ask(b);
});
document.getElementById('close').addEventListener('click', close);
document.getElementById('app').addEventListener('click', function () { document.getElementById('shelf').textContent = '앱 열기를 눌렀어요.'; close(); });
${bad ? '' : "document.getElementById('week').addEventListener('click', close);"}`,
}));

// ---------- 방해-3: 뒤로 가기를 붙잡는 창 ----------
pair('interrupt-3', '방해-3 뒤로 가기를 붙잡는 창', (bad, title) => page({
  title,
  style: `${SHEET_CSS} .back { padding: 2px 10px; font-size: 18px; line-height: 1; } .detail { display: grid; gap: 6px; justify-items: start; } .detail p { margin: 0; }`,
  body: `
<div class="app">
  <div class="bar"><button type="button" class="back" id="back" aria-label="뒤로">‹</button><span id="ttl">소금빵</span><span class="sp"></span><button type="button" class="reset">처음으로</button></div>
  <div class="main">
    <div id="list" hidden>
      ${BREADS.map(([n, p]) => `<div class="row" data-n="${n}"><span class="name">${n} <span class="muted">· ${won(p)}</span></span><button type="button" class="see" data-name="${n} 보기">보기</button></div>`).join('\n      ')}
    </div>
    <div id="detail" class="detail"><b id="dn">소금빵</b><span class="muted" id="dp">3,200원</span><p id="dd">${BREADS[0][2]}</p><button type="button" class="primary" id="put">담기</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
${bad ? `<div class="sheet" id="sheet" role="dialog" aria-labelledby="sh-t" hidden>
  <h2 id="sh-t">지금 나가면 쿠폰이 사라져요</h2>
  <p>오늘만 드리는 1,000원 할인 쿠폰을 받고 더 둘러볼까요?</p>
  <div class="acts"><button type="button" id="stay">쿠폰 받고 더 보기</button><button type="button" id="leave">나가기</button></div>
</div>` : ''}`,
  script: `
var B = ${JSON.stringify(BREADS)}, list = document.getElementById('list'), detail = document.getElementById('detail'), back = document.getElementById('back'), res = document.querySelector('.result');
function showList() { detail.hidden = true; list.hidden = false; back.hidden = true; document.getElementById('ttl').textContent = '오늘 나온 빵'; res.textContent = ''; list.querySelector('.see').focus(); }
function showDetail(i) { var b = B[i]; document.getElementById('dn').textContent = b[0]; document.getElementById('dp').textContent = b[1].toLocaleString('ko-KR') + '원'; document.getElementById('dd').textContent = b[2]; document.getElementById('ttl').textContent = b[0]; list.hidden = true; detail.hidden = false; back.hidden = false; res.textContent = ''; back.focus(); }
list.addEventListener('click', function (e) { var b = e.target.closest('.see'); if (b) showDetail([].indexOf.call(list.querySelectorAll('.see'), b)); });
document.getElementById('put').addEventListener('click', function () { res.textContent = eul(document.getElementById('dn').textContent) + ' 담았어요.'; });
${bad ? `var sheet = document.getElementById('sheet');
back.addEventListener('click', function () { sheet.hidden = false; document.getElementById('stay').focus(); });
document.getElementById('stay').addEventListener('click', function () { sheet.hidden = true; res.textContent = '쿠폰을 받았어요.'; back.focus(); });
document.getElementById('leave').addEventListener('click', function () { sheet.hidden = true; showList(); });` : 'back.addEventListener(\'click\', showList);'}`,
}));

// ---------- 방해-4: 쌓인 알림·배너 ----------
const NEWS = ['쿠폰이 도착했어요.', '11월 꽃 시장이 열려요. 모든 꽃을 10% 할인해요.', '앱에서 주문하면 더 빨라요.', '이 사이트는 쿠키를 써요.'];
pair('interrupt-4', '방해-4 쌓인 알림·배너', (bad, title) => page({
  title,
  style: `.strip { margin: 0; padding: 6px 12px; font-size: 12px; display: flex; gap: 8px; align-items: center; } .strip span { flex: 1; } .strip button { font-size: 12px; padding: 2px 8px; } .cookie { background: #14212b; color: #fff; } .cookie button { background: transparent; color: #fff; border-color: #5a6974; } .appb { background: #e1f0ef; } .event { background: #fbefdf; } .fix { display: grid; gap: 6px; justify-items: start; margin: 0; padding: 10px 12px; border-radius: 8px; border: 1px solid #e9c48f; background: #fbefdf; } .pop { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); padding: 8px 14px; border-radius: 8px; background: #14212b; color: #fff; font-size: 13px; white-space: nowrap; } .inbox { display: grid; gap: 4px; margin: 0; padding: 8px 12px 8px 28px; border-radius: 8px; background: #f3f6f7; font-size: 13px; }`,
  body: bad ? `
<div class="app">
  <p class="strip cookie"><span>${NEWS[3]}</span><button type="button" class="x">닫기</button></p>
  <p class="strip appb"><span>${NEWS[2]}</span><button type="button" class="x">앱 받기</button></p>
  ${bar('동네 꽃집', '주문 1102')}
  <p class="strip event"><span>${NEWS[1]}</span><button type="button" class="x">닫기</button></p>
  <div class="main">
    <div class="row"><span class="name">프리지아 한 단</span><span>18,000원</span></div>
    <p class="muted">받는 곳에 동·호수가 없어 배송을 시작하지 못했어요.</p>
    <div><button type="button" id="fix">받는 곳 고치기</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="pop" role="status">${NEWS[0]}</div>` : `
<div class="app">
  ${bar('동네 꽃집', '주문 1102')}
  <div class="main">
    <div class="fix" role="alert"><b>받는 곳에 동·호수가 없어 배송을 시작하지 못했어요.</b><button type="button" class="primary" id="fix">받는 곳 고치기</button></div>
    <div class="row"><span class="name">프리지아 한 단</span><span>18,000원</span></div>
    <div><button type="button" id="inbox-b" aria-expanded="false" aria-controls="inbox">알림 ${NEWS.length}개 보기</button></div>
    <ul class="inbox" id="inbox" hidden>${NEWS.map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="result" role="status"></p>
  </div>
</div>`,
  script: `
document.getElementById('fix').addEventListener('click', function () { document.querySelector('.result').textContent = '받는 곳을 고치는 화면으로 가요.'; });
${bad ? `document.querySelectorAll('.strip .x').forEach(function (b) { b.addEventListener('click', function () { b.closest('.strip').remove(); }); });
setTimeout(function () { var p = document.querySelector('.pop'); if (p) p.remove(); }, 4000);` : `document.getElementById('inbox-b').addEventListener('click', function (e) { var box = document.getElementById('inbox'); box.hidden = !box.hidden; e.currentTarget.setAttribute('aria-expanded', String(!box.hidden)); });`}`,
}));

// ---------- 속임-1: 미리 골라 둔 동의와 추가 상품 ----------
pair('honest-1', '속임-1 미리 골라 둔 동의와 추가 상품', (bad, title) => page({
  title,
  style: `${FORM_CSS} label.chk { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: start; padding: 6px 0; border-top: 1px solid #e3e8ec; color: #14212b; font-size: 14px; } .chk input { margin-top: 4px; } .tag { font-size: 12px; color: #5a6974; } .sum { display: flex; justify-content: space-between; font-weight: 600; }`,
  body: `
<div class="app">
  ${bar('동네 꽃집', '주문서')}
  <div class="main">
    <div class="row"><span class="name">프리지아 한 단</span><span>18,000원</span></div>
    <label class="chk"><input type="checkbox" id="care"${bad ? ' checked' : ''}><span><span class="tag">[선택]</span> 시들면 다시 보내 드리는 보장</span><span>+2,900원</span></label>
    <label class="chk"><input type="checkbox" id="mkt"${bad ? ' checked' : ''}><span><span class="tag">[선택]</span> 할인 소식 문자 받기(마케팅 수신 동의)</span><span></span></label>
    <label class="chk"><input type="checkbox" id="agree" aria-describedby="agree-e"><span><span class="tag">[필수]</span> 주문 내용을 확인했고 결제에 동의해요</span><span></span></label>
    <p class="err" id="agree-e"></p>
    <div class="sum"><span>결제할 금액</span><span id="total">${won(bad ? 20900 : 18000)}</span></div>
    <div><button type="button" class="primary" id="pay">결제하기</button></div>
    <p class="ok" role="status"></p>
  </div>
</div>`,
  script: `
var care = document.getElementById('care'), mkt = document.getElementById('mkt'), agree = document.getElementById('agree'), ok = document.querySelector('.ok'), err = document.getElementById('agree-e');
function total() { return 18000 + (care.checked ? 2900 : 0); }
function draw() { document.getElementById('total').textContent = total().toLocaleString('ko-KR') + '원'; }
care.addEventListener('change', draw);
document.getElementById('pay').addEventListener('click', function () {
  ok.textContent = '';
  if (!agree.checked) { err.textContent = '주문 내용 확인에 동의해야 결제할 수 있어요.'; agree.focus(); return; }
  err.textContent = '';
  // 누른 뒤에만 잠근다(두 번 결제 막기)
  var pay = this; pay.disabled = true; pay.setAttribute('aria-busy', 'true');
  setTimeout(function () {
    pay.disabled = false; pay.removeAttribute('aria-busy');
    ok.textContent = total().toLocaleString('ko-KR') + '원을 결제했어요.' + (care.checked ? ' 시들면 다시 보내 드리는 보장이 들어 있어요.' : '') + (mkt.checked ? ' 할인 소식 문자도 받게 돼요.' : '');
  }, 500);
});`,
}));

// ---------- 속임-2: 흐리게 만든 거절 ----------
pair('honest-2', '속임-2 흐리게 만든 거절', (bad, title) => page({
  title,
  style: `.meter { height: 8px; border-radius: 4px; background: #e3e8ec; overflow: hidden; } .meter i { display: block; height: 100%; width: 96%; background: #b83a26; } .use { margin: 0; } .faint { display: block; margin: 14px auto 0; padding: 0; border: 0; background: none; font-size: 11px; color: #a3aeb6; } .wide { width: 100%; padding: 10px 12px; font-size: 15px; }`,
  body: `
<div class="app">
  ${bar('사진 보관함')}
  <div class="main">
    <p class="use">저장 공간을 거의 다 썼어요. 5GB 중 4.8GB를 쓰고 있어요.</p>
    <div class="meter"><i></i></div>
    <div><button type="button" class="primary" id="up">사진 올리기</button></div>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">저장 공간을 늘릴까요?</h2>
  <p>월 2,900원에 100GB를 쓸 수 있어요. 늘리지 않아도 남은 공간에 사진 12장을 올릴 수 있어요.</p>
  ${bad ? '<button type="button" class="primary wide" id="yes">월 2,900원으로 늘리기</button><button type="button" class="faint" id="no" autofocus>늘리지 않고 올리기</button>' : '<div class="acts"><button type="button" id="no" autofocus>늘리지 않고 올리기</button><button type="button" class="primary" id="yes">월 2,900원으로 늘리기</button></div>'}
</dialog>`,
  script: `
var dlg = document.getElementById('dlg'), res = document.querySelector('.result');
document.getElementById('up').addEventListener('click', function (e) { res.textContent = ''; openDialog(dlg, e.currentTarget); });
document.getElementById('yes').addEventListener('click', function () { res.textContent = '100GB로 늘렸어요. 매달 11일에 2,900원이 결제돼요.'; closeDialog(dlg); });
document.getElementById('no').addEventListener('click', function () { res.textContent = '사진 12장을 올렸어요.'; closeDialog(dlg); });`,
}));

// ---------- 속임-3: 죄책감을 주는 거절 문구 ----------
pair('honest-3', '속임-3 죄책감을 주는 거절 문구', (bad, title) => page({
  title,
  style: SHEET_CSS,
  body: `
<div class="app">
  ${bar('오늘의 반찬')}
  <div class="main" id="list">
    ${['두부조림', '애호박볶음', '어묵볶음'].map(n => `<div class="row" data-n="${n}"><span class="name">${n}</span><button type="button" class="save" data-name="${n} 저장">저장</button></div>`).join('\n    ')}
    <p class="result" role="status"></p>
  </div>
</div>
<div class="sheet" id="sheet" role="dialog" aria-labelledby="sh-t" hidden>
  <h2 id="sh-t">새 레시피 소식을 메일로 받을까요?</h2>
  <p>매주 금요일에 새 반찬 레시피 세 가지를 보내 드려요.</p>
  <div class="acts"><button type="button" id="no">${bad ? '아니요, 저는 요리에 관심 없어요' : '받지 않기'}</button><button type="button" class="primary" id="yes">메일로 받기</button></div>
</div>`,
  script: `
var sheet = document.getElementById('sheet'), res = document.querySelector('.result'), asked = false, from = null;
function close(msg) { sheet.hidden = true; if (msg) res.textContent = msg; if (from) from.focus(); }
document.getElementById('list').addEventListener('click', function (e) {
  var b = e.target.closest('.save'); if (!b) return;
  res.textContent = eul(b.closest('.row').dataset.n) + ' 저장했어요.';
  if (asked) return; asked = true; from = b; sheet.hidden = false; document.getElementById('no').focus();
});
document.getElementById('yes').addEventListener('click', function () { close('금요일마다 메일로 보내 드릴게요.'); });
document.getElementById('no').addEventListener('click', function () { close(''); });`,
}));

// ---------- 속임-4: 처음 보인 가격이 낼 가격 ----------
const STAYS = [['숲속 오두막', 59000, 15000, 8400], ['바닷가 작은 방', 72000, 12000, 9600]];
pair('honest-4', '속임-4 처음 보인 가격과 낼 가격', (bad, title) => page({
  title,
  style: `.stay { display: grid; gap: 2px; } .price { font-weight: 600; } .bill { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid #e3e8ec; border-radius: 8px; } .bill div { display: flex; justify-content: space-between; } .bill .tot { padding-top: 4px; border-top: 1px solid #e3e8ec; font-weight: 700; } .acts3 { display: flex; flex-wrap: wrap; gap: 8px; }`,
  body: `
<div class="app">
  ${bar('주말 숙소', '11월 22일 1박')}
  <div class="main">
    <div id="list">
      ${STAYS.map(([n, room, clean, fee], i) => `<div class="row"><span class="name stay"><span>${n}</span>${bad ? `<span class="price">1박 ${won(room)}</span>` : `<span class="price">1박 총 ${won(room + clean + fee)}</span><span class="muted">객실 ${won(room)} + 청소비 ${won(clean)} + 수수료 ${won(fee)}</span>`}</span><button type="button" class="book" data-i="${i}" data-name="${n} 예약하기">예약하기</button></div>`).join('\n      ')}
    </div>
    <div id="pay" hidden>
      <div class="bill"><div><span id="b-n"></span><span id="b-room"></span></div><div><span>청소비</span><span id="b-clean"></span></div><div><span>서비스 수수료</span><span id="b-fee"></span></div><div class="tot"><span>결제할 금액</span><span id="b-tot"></span></div></div>
      <div class="acts3" style="margin-top:8px"><button type="button" class="primary" id="go"></button><button type="button" id="back">목록으로</button></div>
    </div>
    <p class="result" role="status"></p>
  </div>
</div>`,
  script: `
var S = ${JSON.stringify(STAYS)}, cur = null, res = document.querySelector('.result');
function w(n) { return n.toLocaleString('ko-KR') + '원'; }
document.getElementById('list').addEventListener('click', function (e) {
  var b = e.target.closest('.book'); if (!b) return;
  cur = S[+b.dataset.i]; var tot = cur[1] + cur[2] + cur[3];
  document.getElementById('b-n').textContent = cur[0] + ' 1박'; document.getElementById('b-room').textContent = w(cur[1]);
  document.getElementById('b-clean').textContent = w(cur[2]); document.getElementById('b-fee').textContent = w(cur[3]); document.getElementById('b-tot').textContent = w(tot);
  document.getElementById('go').textContent = w(tot) + ' 결제하기';
  document.getElementById('list').hidden = true; document.getElementById('pay').hidden = false; res.textContent = ''; document.getElementById('go').focus();
});
document.getElementById('back').addEventListener('click', function () { document.getElementById('pay').hidden = true; document.getElementById('list').hidden = false; document.querySelector('.book').focus(); });
document.getElementById('go').addEventListener('click', function () {
  // 누른 뒤에만 잠근다(두 번 결제 막기)
  var go = this; go.disabled = true; go.setAttribute('aria-busy', 'true');
  setTimeout(function () { go.disabled = false; go.removeAttribute('aria-busy'); res.textContent = cur[0] + ' 1박을 예약했어요.'; }, 500);
});`,
}));

// ---------- 속임-5: 해지를 가입보다 어렵게 ----------
const STEPS = [
  ['정말 떠나실 건가요?', '플러스를 해지하면 모임 사진 보관과 광고 없는 화면을 더 쓸 수 없어요.', '혜택 계속 받기'],
  ['50% 할인을 드릴게요', '3달 동안 월 2,450원에 계속 쓸 수 있어요.', '할인받고 계속 쓰기'],
  ['떠나는 이유를 알려 주세요', '', ''],
  ['마지막 단계예요', '아래 버튼을 눌러야 해지 신청이 끝나요.', ''],
];
pair('honest-5', '속임-5 해지를 가입보다 어렵게', (bad, title) => page({
  title,
  style: `${CTL_CSS} .plan { display: grid; gap: 4px; justify-items: start; padding: 12px; border: 1px solid #e3e8ec; border-radius: 8px; } .plan p, .step p { margin: 0; } .step { display: grid; gap: 8px; justify-items: start; } .step h2 { margin: 0; font-size: 16px; } .acts3 { display: flex; flex-wrap: wrap; gap: 8px; } .why { display: grid; gap: 4px; } .why label { display: flex; gap: 8px; color: #14212b; font-size: 14px; } .err { margin: 0; color: #b83a26; font-size: 13px; } .err:empty { display: none; }`,
  body: `
${ctl('가입할 때 누른 횟수: <b>1번</b> · 해지하며 누른 횟수: <b id="cnt">0번</b>')}
<div class="app" style="min-height:0">
  ${bar('우리 모임', '설정')}
  <div class="main" id="main">
    <div class="plan" id="plan"><b>우리 모임 플러스</b><p class="muted">월 4,900원 · 다음 결제 12월 3일</p><button type="button" id="start">${bad ? '구독 관리' : '구독 해지'}</button></div>
    ${bad ? '<div class="step" id="step" hidden></div>' : ''}
    <p class="result" role="status"></p>
  </div>
</div>
${bad ? '' : `<div class="scrim" hidden></div>
<dialog id="dlg" aria-labelledby="dlg-t">
  <h2 id="dlg-t">구독을 해지할까요?</h2>
  <p>12월 3일까지는 그대로 쓸 수 있고, 그 뒤로는 결제되지 않아요.</p>
  <div class="acts"><button type="button" id="no" autofocus>닫기</button><button type="button" id="yes" class="danger">구독 해지</button></div>
</dialog>`}`,
  script: `
var n = 0, res = document.querySelector('.result'), start = document.getElementById('start');
document.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && !b.closest('.demo-ctl') && !b.classList.contains('reset')) { n++; document.getElementById('cnt').textContent = n + '번'; } }, true);
function finish() { document.getElementById('plan').querySelector('p').textContent = '해지함 · 12월 3일까지 쓸 수 있어요'; start.remove(); res.textContent = '구독을 해지했어요. 12월 3일까지 쓸 수 있어요.'; }
${bad ? `var STEPS = ${JSON.stringify(STEPS)}, step = document.getElementById('step'), i = -1;
function show(k) {
  i = k; var s = STEPS[k];
  if (!s) { step.hidden = true; finish(); return; }
  document.getElementById('plan').hidden = true; step.hidden = false;
  step.innerHTML = '<h2 tabindex="-1">' + s[0] + '</h2>' + (s[1] ? '<p>' + s[1] + '</p>' : '')
    + (k === 2 ? '<div class="why">' + ['값이 비싸요', '잘 안 써요', '다른 이유가 있어요'].map(function (t) { return '<label><input type="radio" name="why"> ' + t + '</label>'; }).join('') + '</div><p class="err"></p>' : '')
    + '<div class="acts3">' + (s[2] ? '<button type="button" class="primary" data-keep>' + s[2] + '</button>' : '') + '<button type="button" data-go>' + (k === 3 ? '해지 신청' : k === 2 ? '다음' : '계속 해지하기') + '</button></div>';
  step.querySelector('h2').focus();
}
start.addEventListener('click', function () { show(0); });
step.addEventListener('click', function (e) {
  if (e.target.closest('[data-keep]')) { step.hidden = true; document.getElementById('plan').hidden = false; res.textContent = '플러스를 계속 써요.'; start.focus(); return; }
  if (!e.target.closest('[data-go]')) return;
  if (i === 2 && !step.querySelector('input:checked')) { step.querySelector('.err').textContent = '이유를 하나 골라 주세요.'; return; }
  show(i + 1);
});` : `var dlg = document.getElementById('dlg');
start.addEventListener('click', function (e) { openDialog(dlg, e.currentTarget); });
document.getElementById('no').addEventListener('click', function () { closeDialog(dlg); });
document.getElementById('yes').addEventListener('click', function () { closeDialog(dlg, document.querySelector('.reset')); finish(); });`}`,
}));

// ---------- 속임-6: 권한은 쓰는 순간에 ----------
const SHOPS = [['해님 빵집', '꽃길동', '300m'], ['달빛 베이커리', '솔밭동', '1.2km'], ['둥근 빵집', '꽃길동', '650m']];
pair('honest-6', '속임-6 권한은 쓰는 순간에', (bad, title) => page({
  title,
  style: `.os { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; width: min(300px, calc(100% - 32px)); display: grid; gap: 8px; padding: 14px; border-radius: 14px; background: #eef1f3; border: 1px solid #b9c4cc; box-shadow: 0 8px 24px rgba(20, 33, 43, .25); text-align: center; } .os small { color: #5a6974; } .os p { margin: 0; font-weight: 600; } .os .acts { justify-content: center; } .why { margin: 0; padding: 8px 12px; border-radius: 8px; background: #e1f0ef; font-size: 13px; } .pick { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; } select { font: inherit; padding: 4px 8px; } .dead { margin: 0; }`,
  body: `
<div class="app">
  ${bar('동네 빵집 찾기')}
  <div class="main">
    <div id="body"${bad ? ' hidden' : ''}>
      <div class="pick"><label for="dong" style="display:inline">동네</label><select id="dong">${['꽃길동', '솔밭동'].map(d => `<option>${d}</option>`).join('')}</select>${bad ? '' : '<button type="button" id="near">내 주변에서 찾기</button>'}</div>
      ${bad ? '' : '<p class="why" id="why" hidden>가까운 빵집을 거리순으로 보려면 지금 있는 곳이 필요해요. 이 화면에서만 써요.</p>'}
      <div id="shops"></div>
    </div>
    <p class="dead" id="dead" hidden>위치 권한이 없어 동네 빵집 찾기를 쓸 수 없어요. 설정에서 위치 권한을 켜 주세요.</p>
    <p class="result" role="status"></p>
  </div>
</div>
<div class="os" id="os" role="alertdialog" aria-labelledby="os-t"${bad ? '' : ' hidden'}>
  <small>기기가 묻는 창(흉내)</small>
  <p id="os-t">‘동네 빵집 찾기’가 이 기기의 위치를 쓰도록 허용할까요?</p>
  <div class="acts"><button type="button" id="deny">허용 안 함</button><button type="button" id="allow">허용</button></div>
</div>`,
  script: `
var SH = ${JSON.stringify(SHOPS)}, os = document.getElementById('os'), res = document.querySelector('.result'), near = false;
function draw() {
  var d = document.getElementById('dong').value;
  var list = near ? SH.slice().sort(function (a, b) { return parseFloat(a[2]) * (/km/.test(a[2]) ? 1000 : 1) - parseFloat(b[2]) * (/km/.test(b[2]) ? 1000 : 1); }) : SH.filter(function (s) { return s[1] === d; });
  document.getElementById('shops').innerHTML = list.map(function (s) { return '<div class="row"><span class="name">' + s[0] + ' <span class="muted">· ' + s[1] + (near ? ' · ' + s[2] : '') + '</span></span></div>'; }).join('');
}
document.getElementById('dong').addEventListener('change', function () { near = false; draw(); });
${bad ? `document.getElementById('allow').addEventListener('click', function () { os.hidden = true; near = true; document.getElementById('body').hidden = false; draw(); document.getElementById('dong').focus(); });
document.getElementById('deny').addEventListener('click', function () { os.hidden = true; document.getElementById('dead').hidden = false; });
document.getElementById('deny').focus();` : `draw();
document.getElementById('near').addEventListener('click', function () { document.getElementById('why').hidden = false; os.hidden = false; document.getElementById('deny').focus(); });
document.getElementById('allow').addEventListener('click', function () { os.hidden = true; near = true; draw(); res.textContent = '가까운 순으로 보여 드려요.'; document.getElementById('near').focus(); });
document.getElementById('deny').addEventListener('click', function () { os.hidden = true; document.getElementById('why').hidden = true; res.textContent = '괜찮아요. 동네를 골라서 볼 수 있어요.'; document.getElementById('dong').focus(); });`}`,
}));

// ---------- 글-3: 숫자·금액·날짜 형식 ----------
const HIST = [['11월 9일', '11월 9일 (일)', '프리지아 한 단', 18000, '18,000원'], ['11월 5일', '2026-11-05', '유칼립투스 한 단', 14000, '₩14000'], ['11월 2일', '11/2', '작은 화분 두 개', 25000, '2.5만 원'], ['10월 28일', '2026.10.28', '꽃병', 9900, '9900원']];
pair('words-3', '글-3 숫자·금액·날짜 형식', (bad, title) => page({
  title,
  style: `.row .d { width: 6.5em; flex: none; color: #5a6974; font-size: 13px; } .sum { margin: 0; font-weight: 600; }`,
  body: `
<div class="app">
  ${bar('주문 내역', '4건')}
  <div class="main">
    ${HIST.map(([d, bd, item, p, bp]) => `<div class="row"><span class="d">${bad ? bd : d}</span><span class="name">${item}</span><span>${bad ? bp : won(p)}</span></div>`).join('\n    ')}
    <p class="sum">합계 ${bad ? '66900원' : won(66900)}</p>
  </div>
</div>`,
}));

// ========== 화면 사이 흐름(2026-11-11, research/ux-flows.md): 흉내 낸 브라우저 ==========
// 주소 줄, 「이 탭의 기록」 띠, 「← 뒤로」「새로 고침」 버튼. 데모 틀(sandbox) 안에서 진짜 history API를 부르면 부모 페이지의 기록이 움직여서
// 기록은 배열(B.stack)로만 흉내 낸다. 화면(B.screens)은 기록 한 칸(entry)과 어떻게 왔는지(how: go·back·reload)를 받아 그린다
// 정적 검사(check-screen)가 보게 첫 화면은 HTML에도 그려 둔다(같은 문자열을 스크립트도 쓴다)
const BROWSER_CSS = `.chrome2 { display: grid; gap: 4px; padding: 6px 8px; background: #e3e8ec; border-bottom: 1px solid #c3ccd2; font-size: 12px; } .chrome2 .nav { display: flex; gap: 6px; align-items: center; } .chrome2 .nav button { font-size: 12px; padding: 2px 8px; } .addr { flex: 1; min-width: 0; padding: 3px 8px; border-radius: 999px; background: #fff; color: #14212b; font-family: ui-monospace, Menlo, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .hist { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; color: #5a6974; } .hist b { font-weight: 400; margin-right: 2px; } .hist span { padding: 0 6px; border: 1px solid #b9c4cc; border-radius: 4px; background: #f3f6f7; color: #14212b; } .hist span.here { background: #14212b; border-color: #14212b; color: #fff; } .hist span.fwd { color: #8a979f; border-style: dashed; }
.scr { margin: 0; font-size: 16px; } .main p { margin: 0; } .acts3 { display: flex; flex-wrap: wrap; gap: 8px; } .bx { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 12; width: min(300px, calc(100% - 32px)); display: grid; gap: 6px; padding: 14px; border-radius: 10px; background: #eef1f3; border: 1px solid #b9c4cc; box-shadow: 0 8px 24px rgba(20, 33, 43, .25); } .bx small { color: #5a6974; } .bx p { margin: 0; } .kv2 { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; font-size: 13px; } .kv2 span { color: #5a6974; }`;
const BROWSER_HTML = `<div class="chrome2" role="group" aria-label="브라우저(흉내)"><div class="nav"><button type="button" id="b-back">← 뒤로</button><button type="button" id="b-reload">새로 고침</button><span class="addr" id="b-addr"></span></div><div class="hist" id="b-hist"></div></div>`;
const BROWSER_JS = `
var B = { stack: [], i: -1, screens: {}, onBack: null, view: document.getElementById('b-view') };
function bDraw(how) {
  var cur = B.stack[B.i];
  document.getElementById('b-addr').textContent = cur.url;
  document.getElementById('b-hist').innerHTML = '<b>이 탭의 기록</b>' + B.stack.map(function (e, k) { return '<span class="' + (k === B.i ? 'here' : k > B.i ? 'fwd' : '') + '">' + e.name + '</span>'; }).join('');
  B.screens[cur.screen](cur, how || 'go');
}
function bEntry(screen, name, url, data) { return { screen: screen, name: name, url: url, data: data || {} }; }
// 새 칸을 쌓는다(replace면 지금 칸을 바꾼다). 뒤로 간 뒤 새로 가면 앞 기록은 버린다
function bGo(screen, name, url, data, replace) { var e = bEntry(screen, name, url, data); if (replace && B.i >= 0) B.stack[B.i] = e; else { B.stack = B.stack.slice(0, B.i + 1); B.stack.push(e); B.i++; } bDraw('go'); }
function bBack() { if (B.i > 0) { B.i--; bDraw('back'); } }
function bStart(entries) { B.stack = entries; B.i = entries.length - 1; bDraw('go'); }
function bView(html) { B.view.innerHTML = html; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
document.getElementById('b-back').addEventListener('click', function () { if (B.onBack && B.onBack() === false) return; bBack(); });
document.getElementById('b-reload').addEventListener('click', function () { bDraw('reload'); });
function onAct(fn) { document.addEventListener('click', function (ev) { var a = ev.target.closest('[data-act]'); if (a) fn(a.dataset.act, a, ev); }); }
`;
// 흉내 브라우저 한 장: 맨 위 데모 조작 줄(있으면), 브라우저 틀, 첫 화면, 덧붙일 것(시트·창)
const flowPage = ({ title, ctlHtml = '', style = '', first, extra = '', script }) => page({
  title,
  style: `${ctlHtml ? CTL_CSS : ''}${BROWSER_CSS}${style}`,
  body: `
${ctlHtml ? ctl(ctlHtml) : ''}
<div class="app" style="min-height:0">
  ${BROWSER_HTML}
  <div class="main" id="b-view">${first}</div>
</div>
${extra}`,
  script: `${BROWSER_JS}${script}`,
});
const J = s => JSON.stringify(s);

// ---------- 사고-5: 새로 고침·뒤로 가기·두 번 누르기로 같은 제출이 다시 일어나지 않게 ----------
const A5_CART = '<h2 class="scr">장바구니</h2><div class="row"><span class="name">프리지아 한 단</span><span>18,000원</span></div><div><button type="button" class="primary" data-act="order">주문서 쓰기</button></div>';
const A5_CHECKOUT = '<h2 class="scr">주문서</h2><p class="muted">받는 곳: 꽃길로 12, 2층 · 카드(끝자리 1234)</p><div><button type="button" class="primary" id="pay" data-act="pay">18,000원 결제하기</button></div>';
pair('accident-5', '사고-5 같은 제출이 다시 일어나지 않게', (bad, title) => flowPage({
  title,
  ctlHtml: '서버가 받은 주문: <b id="cnt">0건</b>',
  first: A5_CHECKOUT,
  extra: bad ? '<div class="bx" id="rs" role="alertdialog" aria-labelledby="rs-t" hidden><small>브라우저가 묻는 창(흉내)</small><b id="rs-t">양식 다시 제출 확인</b><p>이 페이지를 다시 불러오면 입력한 정보가 다시 보내져요.</p><div class="acts"><button type="button" id="rs-no">취소</button><button type="button" id="rs-yes">계속</button></div></div>' : '',
  script: `
var orders = 0;
function count() { document.getElementById('cnt').textContent = orders + '건'; }
function doneHtml(no) { return '<h2 class="scr">주문했어요</h2><p>주문 번호 ' + no + '. 내일 오후에 도착해요.</p>'; }
B.screens.cart = function () { bView(${J(A5_CART)}); };
B.screens.checkout = function () { bView(${J(A5_CHECKOUT)}); };
B.screens.done = function (e, how) {
  ${bad ? `// 결제 요청(POST)의 결과 화면을 그대로 두어, 새로 고침하면 브라우저가 다시 보낼지 묻는다
  if (how === 'reload') { document.getElementById('rs').hidden = false; document.getElementById('rs-no').focus(); return; }` : '// 결과는 주문 주소(/orders/번호)로 옮겨 두어 새로 고침해도 같은 화면만 다시 보인다(Post/Redirect/Get)'}
  bView(doneHtml(e.data.no));
};
onAct(function (act, a) {
  if (act === 'order') bGo('checkout', '주문서', '/checkout');
  if (act !== 'pay') return;
  ${bad ? '' : `// 요청 중에만 잠근다. 미리 꺼 두지 않는다
  if (a.getAttribute('aria-busy')) return;
  a.disabled = true; a.setAttribute('aria-busy', 'true'); a.textContent = '결제하는 중';`}
  setTimeout(function () { orders++; count(); ${bad ? "bGo('done', '완료', '/checkout', { no: 1100 + orders });" : "bGo('done', '완료', '/orders/' + (1100 + orders), { no: 1100 + orders }, true);"} }, 800);
});
${bad ? `document.getElementById('rs-yes').addEventListener('click', function () { document.getElementById('rs').hidden = true; orders++; count(); B.stack[B.i].data.no = 1100 + orders; bView(doneHtml(1100 + orders)); });
document.getElementById('rs-no').addEventListener('click', function () { document.getElementById('rs').hidden = true; });` : ''}
bStart([bEntry('cart', '장바구니', '/cart'), bEntry('checkout', '주문서', '/checkout')]);`,
}));

// ---------- 사고-6: 로그아웃한 뒤 뒤로 가기 ----------
const A6_ME = '<h2 class="scr">내 정보</h2><div class="kv2"><span>이름</span><b>김하늘</b><span>휴대폰</span><b>010-0000-1234</b><span>받는 곳</span><b>꽃길로 12, 2층</b></div><div><button type="button" data-act="logout">로그아웃</button></div>';
pair('accident-6', '사고-6 로그아웃한 뒤 뒤로 가기', (bad, title) => flowPage({
  title,
  first: A6_ME,
  script: `
var logged = true;
B.screens.home = function () { bView(logged ? '<h2 class="scr">동네 꽃집</h2><p>오늘 들어온 꽃 4가지가 있어요.</p>' : '<h2 class="scr">동네 꽃집</h2><p>로그아웃했어요.</p><div><button type="button" class="primary" data-act="login">로그인</button></div>'); };
B.screens.me = function (e, how) {
  ${bad ? `// 뒤로 가기는 저장해 둔 화면(bfcache)을 그대로 보인다. 로그인 상태를 다시 보지 않는다
  if (!logged && how !== 'back') { bView('<h2 class="scr">내 정보</h2><p>로그인해야 볼 수 있어요.</p><div><button type="button" class="primary" data-act="login">로그인</button></div>'); return; }` : `// 어떻게 왔든(뒤로 가기 포함) 로그인 상태를 다시 보고, 아니면 개인 정보를 그리지 않는다
  if (!logged) { bView('<h2 class="scr">내 정보</h2><p>로그인해야 볼 수 있어요.</p><div><button type="button" class="primary" data-act="login">로그인</button></div>'); return; }`}
  bView(${J(A6_ME)});
};
onAct(function (act) {
  if (act === 'logout') { logged = false; bGo('home', '홈', '/'); }
  if (act === 'login') { logged = true; bGo('me', '내 정보', '/me'); }
});
bStart([bEntry('home', '홈', '/'), bEntry('me', '내 정보', '/me')]);`,
}));

// ---------- 입력-6: 이전 단계로 가도 적은 값이 남는다 ----------
const I6_STEP1 = v => `<h2 class="scr">1/2 받는 사람</h2><div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="${v.nm || ''}"></div><div class="field"><label for="ph">휴대폰 번호</label><input type="tel" id="ph" autocomplete="tel" value="${v.ph || ''}"></div><div><button type="button" class="primary" data-act="next1">다음</button></div>`;
pair('input-6', '입력-6 이전 단계로 가도 적은 값이 남는다', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  first: I6_STEP1({}),
  script: `
var V = {};
function keep() { document.querySelectorAll('#b-view input').forEach(function (i) { V[i.id] = i.value; }); }
${bad ? '// 단계마다 칸을 새로 그리며 적은 값을 어디에도 두지 않는다\nfunction val(k) { V[k] = \'\'; return \'\'; }' : '// 적은 값을 단계 밖(V)에 두고, 다시 그릴 때 채운다\nfunction val(k) { return esc(V[k] || \'\'); }'}
B.screens.cart = function () { bView('<h2 class="scr">장바구니</h2><p>프리지아 한 단, 18,000원</p><div><button type="button" class="primary" data-act="start">받는 곳 쓰기</button></div>'); };
B.screens.s1 = function () { bView('<h2 class="scr">1/2 받는 사람</h2><div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="' + val('nm') + '"></div><div class="field"><label for="ph">휴대폰 번호</label><input type="tel" id="ph" autocomplete="tel" value="' + val('ph') + '"></div><div><button type="button" class="primary" data-act="next1">다음</button></div>'); };
B.screens.s2 = function () { bView('<h2 class="scr">2/2 받는 곳</h2><div class="field"><label for="ad">주소</label><input type="text" id="ad" autocomplete="street-address" value="' + val('ad') + '"></div><div class="acts3"><button type="button" data-act="prev">이전</button><button type="button" class="primary" data-act="next2">다음</button></div>'); };
B.screens.s3 = function () { bView('<h2 class="scr">적은 내용</h2><div class="kv2"><span>이름</span><b>' + esc(V.nm || '-') + '</b><span>휴대폰</span><b>' + esc(V.ph || '-') + '</b><span>주소</span><b>' + esc(V.ad || '-') + '</b></div>'); };
document.addEventListener('input', keep);
onAct(function (act) {
  if (act === 'start') bGo('s1', '받는 사람', '/order/to');
  if (act === 'next1') bGo('s2', '받는 곳', '/order/address');
  if (act === 'next2') bGo('s3', '적은 내용', '/order/review');
  if (act === 'prev') bBack();
});
bStart([bEntry('cart', '장바구니', '/cart'), bEntry('s1', '받는 사람', '/order/to')]);`,
}));

// ---------- 입력-7: 떠나기 전에 묻는 창은 잃을 것이 있을 때만 ----------
const I7_WRITE = '<h2 class="scr">후기 쓰기</h2><div class="field"><label for="tx">‘프리지아 한 단’ 후기</label><textarea id="tx" rows="3"></textarea></div><div class="acts3"><button type="button" class="primary" data-act="save">저장</button></div><p class="result" role="status" id="st"></p>';
pair('input-7', '입력-7 떠나기 전에 묻는 창', (bad, title) => flowPage({
  title,
  style: `${FORM_CSS} textarea { font: inherit; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; }`,
  first: I7_WRITE,
  extra: '<div class="bx" id="lv" role="alertdialog" aria-labelledby="lv-t" hidden><small>브라우저가 묻는 창(흉내)</small><b id="lv-t">사이트에서 나갈까요?</b><p>변경한 내용이 저장되지 않을 수 있어요.</p><div class="acts"><button type="button" id="lv-no">머무르기</button><button type="button" id="lv-yes">나가기</button></div></div>',
  script: `
var saved = '', text = '';
B.screens.list = function () { bView('<h2 class="scr">내 후기</h2><p>' + (saved ? '‘프리지아 한 단’: ' + esc(saved) : '아직 쓴 후기가 없어요.') + '</p><div><button type="button" data-act="write">후기 쓰기</button></div>'); };
B.screens.write = function () { bView(${J(I7_WRITE)}); document.getElementById('tx').value = text; };
document.addEventListener('input', function (e) { if (e.target.id === 'tx') text = e.target.value; });
${bad ? '// 쓰기 화면이면 늘 묻는다(아무것도 안 썼거나 저장했어도)\nfunction lose() { return true; }' : '// 저장한 것과 다를 때만 묻는다. 비었거나 저장했으면 바로 나간다\nfunction lose() { return text !== saved; }'}
B.onBack = function () {
  if (B.stack[B.i].screen !== 'write' || !lose()) return true;
  document.getElementById('lv').hidden = false; document.getElementById('lv-no').focus(); return false;
};
document.getElementById('lv-no').addEventListener('click', function () { document.getElementById('lv').hidden = true; });
document.getElementById('lv-yes').addEventListener('click', function () { document.getElementById('lv').hidden = true; text = saved; bBack(); });
onAct(function (act) {
  if (act === 'write') bGo('write', '후기 쓰기', '/reviews/new');
  if (act === 'save') { saved = text; document.getElementById('st').textContent = '저장했어요.'; }
});
bStart([bEntry('list', '내 후기', '/reviews'), bEntry('write', '후기 쓰기', '/reviews/new')]);`,
}));

// ---------- 길-5: 끝낸 흐름은 뒤로 가기로 다시 열리지 않는다 ----------
const W5_INTRO = '<h2 class="scr">11월 동네 걷기</h2><p class="muted">11월 23일 오전 10시 · 동네 공원 정문</p><div><button type="button" class="primary" data-act="apply">신청하기</button></div>';
pair('way-5', '길-5 끝낸 흐름을 뒤로 가기로 다시 열지 않기', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  ctlHtml: '받은 신청: <b id="cnt">0건</b>',
  first: W5_INTRO,
  script: `
var n = 0;
B.screens.intro = function () { bView(n ? '<h2 class="scr">11월 동네 걷기</h2><p class="muted">11월 23일 오전 10시 · 동네 공원 정문</p><p>신청했어요.</p><div><button type="button" data-act="mine">내 신청 보기</button></div>' : ${J(W5_INTRO)}); };
B.screens.form = function () {
  ${bad ? '' : `// 이미 끝낸 신청서로 돌아오면 다시 열지 않고 끝났다고 알린다
  if (n) { bView('<h2 class="scr">이미 신청한 모임이에요</h2><div><button type="button" class="primary" data-act="mine">내 신청 보기</button></div>'); return; }`}
  bView('<h2 class="scr">신청서</h2><div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="김하늘"></div><div><button type="button" class="primary" data-act="send">신청 보내기</button></div>');
};
B.screens.done = function () { bView('<h2 class="scr">신청을 받았어요</h2><p>11월 23일 오전 10시, 동네 공원 정문에서 만나요.</p><div><button type="button" data-act="mine">내 신청 보기</button></div>'); };
B.screens.mine = function () { bView('<h2 class="scr">내 신청</h2><p>11월 동네 걷기 ' + n + '건</p>'); };
onAct(function (act) {
  if (act === 'apply') bGo('form', '신청서', '/walk/apply');
  if (act === 'send') { n++; document.getElementById('cnt').textContent = n + '건'; bGo('done', '완료', '/walk/applied'${bad ? '' : ', null, true'}); }
  if (act === 'mine') bGo('mine', '내 신청', '/me/applications');
});
bStart([bEntry('intro', '모임 소개', '/walk')]);`,
}));

// ---------- 길-6: 로그인을 마치면 하려던 곳으로 ----------
const W6_MEET = '<h2 class="scr">수요 독서 모임</h2><p class="muted">매주 수요일 저녁 · 회원 12명</p><div><button type="button" class="primary" data-act="join">참여하기</button></div><p class="result" role="status" id="st"></p>';
pair('way-6', '길-6 로그인을 마치면 하려던 곳으로', (bad, title) => flowPage({
  title,
  first: W6_MEET,
  script: `
var logged = false;
B.screens.list = function () { bView('<h2 class="scr">모임 목록</h2><p>수요 독서 모임, 동네 걷기 모임</p>'); };
B.screens.meet = function (e) { bView(${J(W6_MEET)}); if (e.data.note) document.getElementById('st').textContent = e.data.note; };
B.screens.login = function () { bView('<h2 class="scr">로그인</h2><p class="muted">간편 로그인(흉내)</p><div><button type="button" class="primary" data-act="login">로그인</button></div>'); };
B.screens.home = function () { bView('<h2 class="scr">홈</h2><p>로그인했어요. 새 모임 3개가 있어요.</p>'); };
onAct(function (act) {
  if (act === 'join') { if (logged) { document.getElementById('st').textContent = '수요 독서 모임에 참여했어요.'; return; } bGo('login', '로그인', ${bad ? "'/login'" : "'/login?next=/meet/12'"}); }
  if (act === 'login') { logged = true; ${bad ? "bGo('home', '홈', '/', null, true);" : "// next는 같은 사이트 경로(/로 시작, //는 아님)만 받는다\n    bGo('meet', '모임 상세', '/meet/12', { note: '로그인했어요. 이어서 참여할 수 있어요.' }, true);"} }
});
bStart([bEntry('list', '모임 목록', '/meets'), bEntry('meet', '모임 상세', '/meet/12')]);`,
}));

// ---------- 길-7: 검색어·필터를 주소에 ----------
const SHOPS7 = [['해님 빵집', '꽃길동', 300, '11월 2일'], ['둥근 빵집', '꽃길동', 650, '10월 20일'], ['달빛 베이커리', '솔밭동', 1200, '11월 8일'], ['아침 빵집', '솔밭동', 900, '9월 30일']];
const W7_LIST = f => `<h2 class="scr">빵집</h2><div class="acts3" role="group" aria-label="동네">${['전체', '꽃길동', '솔밭동'].map(d => `<button type="button" data-act="dong" data-v="${d}" aria-pressed="${f.dong === d}">${d}</button>`).join('')}</div><div class="acts3" role="group" aria-label="정렬">${['가까운 순', '새로 연 순'].map(s => `<button type="button" data-act="sort" data-v="${s}" aria-pressed="${f.sort === s}">${s}</button>`).join('')}</div>`;
pair('way-7', '길-7 검색 조건을 주소에', (bad, title) => flowPage({
  title,
  style: '.acts3 button[aria-pressed="true"] { background: #14212b; border-color: #14212b; color: #fff; } .shops { display: grid; gap: 4px; }',
  first: `${W7_LIST({ dong: '전체', sort: '가까운 순' })}<div class="shops" id="shops"></div>`,
  script: `
var S = ${J(SHOPS7)}, D = { dong: '전체', sort: '가까운 순' }, live = D;
// 주소 줄은 브라우저처럼 풀어 쓴 글자로 보인다
function q(f) { return '/shops?dong=' + f.dong + '&sort=' + f.sort; }
function listHtml(f) {
  var top = ${J(W7_LIST({}))};
  var rows = S.filter(function (s) { return f.dong === '전체' || s[1] === f.dong; }).sort(function (a, b) { return f.sort === '가까운 순' ? a[2] - b[2] : (b[3] > a[3] ? 1 : -1); });
  return top + '<div class="shops">' + rows.map(function (s) { return '<div class="row"><span class="name">' + s[0] + ' <span class="muted">· ' + s[1] + ' · ' + (s[2] >= 1000 ? (s[2] / 1000) + 'km' : s[2] + 'm') + '</span></span><button type="button" data-act="open" data-v="' + s[0] + '">보기</button></div>'; }).join('') + '</div>';
}
B.screens.list = function (e) {
  ${bad ? '// 조건을 화면 상태로만 두어, 다시 그리면(뒤로 가기·새로 고침) 처음 값으로 돌아간다\n  live = D;' : '// 조건을 주소(기록 칸)에서 읽는다\n  live = e.data.f || D;'}
  bView(listHtml(live));
  B.view.querySelectorAll('[data-act="dong"], [data-act="sort"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === live[b.dataset.act])); });
};
B.screens.shop = function (e) { bView('<h2 class="scr">' + e.data.name + '</h2><p>오전 8시부터 빵이 나와요.</p>'); };
onAct(function (act, a) {
  if (act === 'dong' || act === 'sort') {
    var f = { dong: live.dong, sort: live.sort }; f[act] = a.dataset.v;
    ${bad ? 'live = f; bView(listHtml(f)); B.view.querySelectorAll(\'[data-act="dong"], [data-act="sort"]\').forEach(function (b) { b.setAttribute(\'aria-pressed\', String(b.dataset.v === f[b.dataset.act])); });' : "// 조건을 바꾸면 주소만 바꾼다(기록을 쌓지 않는 replace. 쌓을지는 서비스가 정한다)\n    bGo('list', '빵집', q(f), { f: f }, true);"}
  }
  if (act === 'open') bGo('shop', a.dataset.v, '/shops/' + a.dataset.v, { name: a.dataset.v });
});
bStart([bEntry('list', '빵집', ${bad ? "'/shops'" : 'q(D)'}, { f: D })]);`,
}));

// ---------- 길-8: 상세에서 돌아오면 같은 자리로 ----------
pair('way-8', '길-8 상세에서 돌아오면 같은 자리로', (bad, title) => flowPage({
  title,
  style: '.scroll { display: grid; gap: 4px; max-height: 190px; overflow: auto; padding-right: 4px; }',
  first: '<h2 class="scr">모임 글</h2><div class="scroll" id="sc"></div>',
  script: `
var POSTS = []; for (var k = 1; k <= 12; k++) POSTS.push(k + '번째 모임 후기');
function listHtml(n) { return '<h2 class="scr">모임 글 <span class="muted">' + n + ' / 12개</span></h2><div class="scroll" id="sc">' + POSTS.slice(0, n).map(function (p, k) { return '<div class="row"><span class="name">' + p + '</span><button type="button" data-act="open" data-v="' + k + '">읽기</button></div>'; }).join('') + (n < 12 ? '<div><button type="button" data-act="more">더 보기</button></div>' : '') + '</div>'; }
B.screens.list = function (e, how) {
  ${bad ? `// 돌아오면 처음 4개, 맨 위부터 다시 그린다
  bView(listHtml(4));` : `// 돌아오면 불러온 만큼 그리고, 보던 자리와 누른 글로 돌아간다
  var d = e.data; bView(listHtml(d.n || 4));
  if (how !== 'go' && d.top != null) { document.getElementById('sc').scrollTop = d.top; var b = B.view.querySelector('[data-v="' + d.at + '"]'); if (b) b.focus({ preventScroll: true }); }`}
};
B.screens.post = function (e) { bView('<h2 class="scr">' + POSTS[e.data.k] + '</h2><p>함께 읽은 책 이야기를 나눴어요.</p>'); };
onAct(function (act, a) {
  var d = B.stack[B.i].data;
  if (act === 'more') { d.n = Math.min((d.n || 4) + 4, 12); var top = document.getElementById('sc').scrollTop; bView(listHtml(d.n)); document.getElementById('sc').scrollTop = top; }
  if (act === 'open') { d.top = document.getElementById('sc').scrollTop; d.at = a.dataset.v; bGo('post', '글', '/posts/' + (+a.dataset.v + 1), { k: +a.dataset.v }); }
});
bStart([bEntry('list', '모임 글', '/posts', { n: 4 })]);`,
}));

// ---------- 길-9: 시트가 열려 있으면 뒤로 가기는 시트만 닫는다 ----------
const W9_MEET = '<h2 class="scr">수요 독서 모임</h2><p class="muted">고른 날짜: <b id="picked">없음</b></p><div><button type="button" class="primary" data-act="open">날짜 고르기</button></div>';
pair('way-9', '길-9 시트와 뒤로 가기', (bad, title) => flowPage({
  title,
  style: `${SHEET_CSS} .sheet .x { position: absolute; top: 8px; right: 8px; } .dates { display: grid; gap: 4px; }`,
  first: W9_MEET,
  extra: `<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" hidden>
  <h2 id="sh-t">날짜 고르기</h2><button type="button" class="x" data-act="x" aria-label="닫기">✕</button>
  <div class="dates">${['11월 19일 수요일', '11월 26일 수요일', '12월 3일 수요일'].map(d => `<button type="button" data-act="pick" data-v="${d}">${d}</button>`).join('')}</div>
</div>`,
  script: `
var picked = '없음', sheet = document.getElementById('sheet'), sheetOpen = false;
function drawSheet(on) { sheetOpen = on; sheet.hidden = !on; if (on) sheet.querySelector('.dates button').focus(); }
B.screens.list = function () { drawSheet(false); bView('<h2 class="scr">모임 목록</h2><p>수요 독서 모임, 동네 걷기 모임</p>'); };
B.screens.meet = function (e) { bView(${J(W9_MEET)}); document.getElementById('picked').textContent = picked; drawSheet(!!e.data.sheet); };
${bad ? `// 시트를 화면 상태로만 연다. 기록이 없어 뒤로 가기가 상세를 떠나 목록으로 간다
function openSheet() { drawSheet(true); }
function closeSheet() { drawSheet(false); }` : `// 시트를 열 때 기록 한 칸을 쌓아 뒤로 가기가 시트만 닫는다. ✕·고르기로 닫으면 그 칸도 걷어 다음 뒤로 가기가 한 번에 목록으로 간다
function openSheet() { bGo('meet', '시트', '/meet/12?sheet=date', { sheet: true }); }
function closeSheet() { if (B.stack[B.i].data.sheet) bBack(); else drawSheet(false); }`}
onAct(function (act, a) {
  if (act === 'open') openSheet();
  if (act === 'x') closeSheet();
  if (act === 'pick') { picked = a.dataset.v; closeSheet(); var p = document.getElementById('picked'); if (p) p.textContent = picked; }
});
bStart([bEntry('list', '모임 목록', '/meets'), bEntry('meet', '모임 상세', '/meet/12')]);`,
}));

// ---------- 길-10: 링크로 바로 들어와도 화면 안 「뒤로」는 서비스 안으로 ----------
const W10_MEET = '<div><button type="button" data-act="up" aria-label="뒤로">‹ 뒤로</button></div><h2 class="scr">수요 독서 모임</h2><p class="muted">매주 수요일 저녁 · 회원 12명</p>';
pair('way-10', '길-10 링크로 들어온 상세의 뒤로', (bad, title) => flowPage({
  title,
  first: W10_MEET,
  script: `
B.screens.search = function () { bView('<p class="muted">검색 사이트(서비스 밖)</p><h2 class="scr">「동네 독서 모임」 검색 결과</h2><p>수요 독서 모임 – 우리 모임</p>'); };
B.screens.meet = function () { bView(${J(W10_MEET)}); };
B.screens.list = function () { bView('<h2 class="scr">모임 목록</h2><p>수요 독서 모임, 동네 걷기 모임</p>'); };
onAct(function (act) {
  if (act !== 'up') return;
  ${bad ? "// 화면 안 「뒤로」가 브라우저 뒤로 가기와 같다. 링크로 들어왔으면 서비스 밖으로 나간다\n  bBack();" : "// 앞 칸이 서비스 안이면 그리로, 아니면(링크·알림으로 바로 들어왔으면) 목록으로 바꿔 넣는다\n  var prev = B.stack[B.i - 1];\n  if (prev && prev.url.charAt(0) === '/') bBack(); else bGo('list', '모임 목록', '/meets', null, true);"}
});
bStart([bEntry('search', '검색 결과', 'search.example/?q=동네 독서 모임'), bEntry('meet', '모임 상세', '/meet/12')]);`,
}));

// ---------- 사고-7(확인): 나중 저장이 앞 저장을 말없이 덮지 않게 ----------
const A7_FIRST = '11월 모임은 23일 오전 10시, 공원 정문에서 만나요.';
pair('accident-7', '사고-7 같이 고치는 것을 덮어쓰지 않게', (bad, title) => page({
  title,
  style: `${CTL_CSS}${FORM_CSS} textarea { font: inherit; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; } .clash { display: grid; gap: 6px; padding: 10px 12px; border: 1px solid #b83a26; border-radius: 8px; background: #fdf3f1; } .clash p { margin: 0; }`,
  body: `
${ctl('<button type="button" id="other">다른 사람이 먼저 저장(흉내)</button> 저장된 공지: <b id="sv"></b>')}
<div class="app" style="min-height:0">
  ${bar('모임 공지 고치기')}
  <div class="main">
    <div class="field"><label for="tx">공지</label><textarea id="tx" rows="3"></textarea></div>
    <div class="clash" id="clash" role="alert" hidden></div>
    <div class="acts3"><button type="button" class="primary" id="save">저장</button></div>
    <p class="result" role="status" id="st"></p>
  </div>
</div>`,
  script: `
var SV = { text: ${J(A7_FIRST)}, ver: 1, by: '' }, mine = 1, tx = document.getElementById('tx'), st = document.getElementById('st'), clash = document.getElementById('clash');
function drawSv() { document.getElementById('sv').textContent = SV.text + (SV.by ? ' (' + SV.by + ' 님)' : ' (나)'); }
tx.value = SV.text; drawSv();
document.getElementById('other').addEventListener('click', function () { if (SV.by) return; SV = { text: '11월 모임은 23일 오전 10시, 공원 후문에서 만나요. 정문은 공사 중이에요.', ver: 2, by: '바다' }; drawSv(); });
function put() { SV = { text: tx.value, ver: SV.ver + 1, by: '' }; mine = SV.ver; clash.hidden = true; st.textContent = '저장했어요.'; drawSv(); }
document.getElementById('save').addEventListener('click', function () {
  ${bad ? '// 그사이 누가 고쳤는지 보지 않고 덮어쓴다\n  put();' : `// 내가 불러온 판(mine)보다 새 판이 있으면 덮지 않고 알린다. 내 글은 칸에 그대로 둔다
  if (SV.ver > mine) {
    clash.innerHTML = '<p><b>그사이 ' + SV.by + ' 님이 먼저 고쳤어요.</b> 내가 쓴 글은 칸에 그대로 있어요.</p><p class="muted">' + esc(SV.by) + ' 님 글: ' + esc(SV.text) + '</p><div class="acts3"><button type="button" id="take">' + SV.by + ' 님 글 불러와 다시 고치기</button><button type="button" id="over">내 글로 저장</button></div>';
    clash.hidden = false; st.textContent = '';
    document.getElementById('take').addEventListener('click', function () { tx.value = SV.text; mine = SV.ver; clash.hidden = true; tx.focus(); });
    document.getElementById('over').addEventListener('click', put);
    return;
  }
  put();`}
});
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }`,
}));

// ---------- 할 일-4: 검색 결과가 없을 때 ----------
const SHOPS_S = [['해님 빵집', '소금빵 · 식빵', false], ['둥근 빵집', '소금빵 · 크루아상', false], ['달빛 베이커리', '깜빠뉴 · 소금빵', false], ['아침 빵집', '식빵 · 깜빠뉴', true]];
pair('visible-4', '할 일-4 검색 결과가 없을 때', (bad, title) => flowPage({
  title,
  style: `${FORM_CSS} input[type="search"] { font: inherit; color: #14212b; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; flex: 1; min-width: 0; } .srch { display: flex; gap: 6px; } .acts3 button[aria-pressed="true"] { background: #14212b; border-color: #14212b; color: #fff; }`,
  first: '<h2 class="scr">빵집 찾기</h2>',
  script: `
var S = ${J(SHOPS_S)}, F0 = { q: '소금빵', sun: true };
function url(f) { return '/search?q=' + f.q + (f.sun ? '&sun=1' : ''); }
function hits(f) { return S.filter(function (s) { return s[1].indexOf(f.q) >= 0 && (!f.sun || s[2]); }); }
B.screens.home = function () { bView('<h2 class="scr">동네 빵집</h2><p>오늘 연 빵집 4곳이 있어요.</p>'); };
B.screens.res = function (e) {
  var f = e.data.f, rows = hits(f);
  ${bad ? '// 찾은 뒤 칸을 비우고, 결과가 없으면 아무것도 그리지 않는다' : '// 찾은 말을 칸에 남긴다'}
  var h = '<h2 class="scr">빵집 찾기</h2><form class="field" id="sf"><label for="q">빵 이름</label><div class="srch"><input type="search" id="q" value="' + ${bad ? "''" : 'esc(f.q)'} + '"><button type="submit">찾기</button></div></form>'
    + '<div class="acts3"><button type="button" data-act="sun" aria-pressed="' + f.sun + '">일요일에 여는 곳</button></div>';
  if (rows.length) h += rows.map(function (s) { return '<div class="row"><span class="name">' + s[0] + ' <span class="muted">· ' + s[1] + '</span></span></div>'; }).join('');
  ${bad ? '' : `// 왜 없는지(어느 조건 때문인지) 말하고, 그 조건을 푸는 버튼과 다른 검색어를 둔다
  else {
    var wide = hits({ q: f.q, sun: false }).length;
    h += f.sun && wide ? '<p>' + eul(f.q) + ' 파는 빵집 중 일요일에 여는 곳은 없어요.</p><div><button type="button" class="primary" data-act="sun">「일요일에 여는 곳」 빼고 찾기 (' + wide + '곳)</button></div>'
      : '<p>' + eul(f.q) + ' 파는 빵집을 찾지 못했어요. 빵 이름을 짧게 써 보세요. 예: 소금빵, 식빵, 깜빠뉴</p>';
  }`}
  bView(h);
};
document.addEventListener('submit', function (ev) {
  ev.preventDefault();
  var q = document.getElementById('q').value.trim(); if (!q) return;
  var f = { q: q, sun: B.stack[B.i].data.f.sun }; bGo('res', '검색 결과', url(f), { f: f });
});
onAct(function (act) {
  if (act !== 'sun') return;
  var c = B.stack[B.i].data.f, f = { q: c.q, sun: !c.sun }; bGo('res', '검색 결과', url(f), { f: f }, true);
});
bStart([bEntry('home', '홈', '/'), bEntry('res', '검색 결과', url(F0), { f: F0 })]);`,
}));

// ---------- 누른 뒤-5: 완료 화면 ----------
const AF5_FORM = '<h2 class="scr">11월 동네 걷기 신청</h2><div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="김하늘"></div><div><button type="button" class="primary" data-act="send">신청 보내기</button></div>';
pair('after-5', '누른 뒤-5 완료 화면', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  first: AF5_FORM,
  script: `
var no = 0;
B.screens.intro = function () { bView('<h2 class="scr">11월 동네 걷기</h2><p class="muted">11월 23일 오전 10시 · 동네 공원 정문</p>'); };
B.screens.form = function () { bView(${J(AF5_FORM)}); };
B.screens.done = function (e, how) {
  ${bad ? `// 완료를 한 번만 그린다. 다시 열면(새로 고침) 보낸 값이 없어 오류만 보인다
  if (how === 'reload') { bView('<h2 class="scr">잘못된 접근이에요</h2><p>처음부터 다시 해 주세요.</p>'); return; }
  bView('<h2 class="scr">신청했어요</h2>');` : `// 접수 번호가 든 주소로 옮겨 두어, 새로 고침하거나 즐겨찾기로 열어도 같은 내용을 그린다
  bView('<h2 class="scr">신청을 받았어요</h2><div class="kv2"><span>접수 번호</span><b>' + e.data.no + '</b><span>모임</span><b>11월 23일 오전 10시 · 동네 공원 정문</b></div><p>11월 21일까지 모이는 곳 사진을 문자로 보내 드려요. 신청 내용은 「내 신청」에서 언제든 다시 볼 수 있어요.</p>');`}
};
onAct(function (act) {
  if (act !== 'send') return;
  no = 2041; bGo('done', '완료', ${bad ? "'/walk/apply/done', { no: no }, true" : "'/applications/' + no, { no: no }, true"});
});
bStart([bEntry('intro', '모임 소개', '/walk'), bEntry('form', '신청서', '/walk/apply')]);`,
}));

// ---------- 누른 뒤-6: 시간이 지났거나 이미 쓴 링크 ----------
const AF6_MAIL = '<p class="muted">메일함(서비스 밖, 흉내)</p><h2 class="scr">받은 메일</h2><div class="row"><span class="name">[동네 꽃집] 이메일을 확인해 주세요 <span class="muted">· 어제</span></span><button type="button" data-act="old">확인하기</button></div><div class="row"><span class="name">[동네 꽃집] 이메일을 확인해 주세요 <span class="muted">· 오늘 오전, 이미 누름</span></span><button type="button" data-act="used">확인하기</button></div>';
pair('after-6', '누른 뒤-6 시간이 지났거나 이미 쓴 링크', (bad, title) => flowPage({
  title,
  first: AF6_MAIL,
  script: `
B.screens.mail = function () { bView(${J(AF6_MAIL)}); };
B.screens.link = function (e) {
  ${bad ? "// 어떤 이유든 같은 말만 보인다\n  bView('<h2 class=\"scr\">잘못된 요청이에요</h2>');" : `// 왜 안 되는지 말하고, 그 경우에 맞는 다음 길을 둔다
  if (e.data.k === 'old') bView('<h2 class="scr">확인 링크의 시간이 지났어요</h2><p>보낸 지 24시간이 지나 이 링크는 쓸 수 없어요. 새 확인 메일을 받아 다시 눌러 주세요.</p><div><button type="button" class="primary" data-act="resend">새 확인 메일 받기</button></div><p class="result" role="status" id="st"></p>');
  else bView('<h2 class="scr">이미 확인한 이메일이에요</h2><p>오늘 오전에 확인을 마쳤어요. 로그인해서 이어 쓰면 돼요.</p><div><button type="button" class="primary" data-act="login">로그인</button></div>');`}
};
B.screens.login = function () { bView('<h2 class="scr">로그인</h2><p class="muted">간편 로그인(흉내)</p>'); };
onAct(function (act) {
  if (act === 'old' || act === 'used') bGo('link', '확인 링크', '/verify?token=' + (act === 'old' ? 'a81f' : 'c22d'), { k: act });
  if (act === 'resend') document.getElementById('st').textContent = 'name@example.com으로 새 확인 메일을 보냈어요. 24시간 안에 눌러 주세요.';
  if (act === 'login') bGo('login', '로그인', '/login');
});
bStart([bEntry('mail', '메일함', 'mail.example/inbox')]);`,
}));

// ---------- 누른 뒤-7: 먼저 바꿔 보인 것이 저장에 실패하면 ----------
const AF7_ITEMS = ['우유', '달걀', '식빵'];
pair('after-7', '누른 뒤-7 저장에 실패하면 되돌리고 알린다', (bad, title) => flowPage({
  title,
  style: `${FORM_CSS} .acts3 button[aria-pressed="true"] { background: #14212b; border-color: #14212b; color: #fff; }`,
  ctlHtml: '<button type="button" id="net" aria-pressed="false">연결 끊어 보기</button> 서버에 저장된 산 것: <b id="sv">없음</b>',
  first: '<h2 class="scr">장 볼 것</h2>',
  script: `
var IT = ${J(AF7_ITEMS)}, SV = {}, VIEW = {}, off = false;
function drawSv() { var d = IT.filter(function (k) { return SV[k]; }); document.getElementById('sv').textContent = d.length ? d.join(', ') : '없음'; }
function rowHtml(k) { return '<div class="row"><span class="name">' + (VIEW[k] ? '✓ ' + k + ' <span class="muted">샀어요</span>' : k) + '</span><button type="button" data-act="tog" data-v="' + k + '" aria-pressed="' + !!VIEW[k] + '">' + (VIEW[k] ? '샀어요 취소' : '샀어요') + '</button></div><p class="err" id="e-' + k + '"></p>'; }
function draw() { var keep = {}; IT.forEach(function (k) { var e = document.getElementById('e-' + k); keep[k] = e ? e.innerHTML : ''; }); bView('<h2 class="scr">장 볼 것</h2>' + IT.map(rowHtml).join('')); IT.forEach(function (k) { document.getElementById('e-' + k).innerHTML = keep[k]; }); }
// 새로 고침은 서버에 저장된 것만 다시 그린다
B.screens.list = function (e, how) { if (how === 'reload' || how === 'go') { VIEW = Object.assign({}, SV); IT.forEach(function (k) { var x = document.getElementById('e-' + k); if (x) x.innerHTML = ''; }); } draw(); };
document.getElementById('net').addEventListener('click', function () { off = !off; this.setAttribute('aria-pressed', String(off)); this.textContent = off ? '연결 잇기' : '연결 끊어 보기'; });
function send(k, v) {
  // 누르자마자 화면부터 바꾼다(낙관적 업데이트)
  VIEW[k] = v; draw();
  setTimeout(function () {
    if (!off) { SV[k] = v; drawSv(); return; }
    ${bad ? '// 실패를 말없이 넘긴다. 화면은 저장된 척 남는다' : `// 실패하면 화면을 되돌리고, 무엇이 저장되지 않았는지와 다시 할 길을 그 줄 아래에 둔다
    VIEW[k] = !v; draw();
    document.getElementById('e-' + k).innerHTML = eul(k) + ' ' + (v ? '샀다고' : '안 샀다고') + ' 저장하지 못했어요. 연결을 확인하고 <button type="button" data-act="retry" data-v="' + k + '" data-to="' + v + '">다시 저장</button>';`}
  }, 500);
}
onAct(function (act, a) {
  if (act === 'tog') { var e = document.getElementById('e-' + a.dataset.v); if (e) e.innerHTML = ''; send(a.dataset.v, !VIEW[a.dataset.v]); }
  if (act === 'retry') { document.getElementById('e-' + a.dataset.v).innerHTML = ''; send(a.dataset.v, a.dataset.to === 'true'); }
});
bStart([bEntry('list', '장 볼 것', '/list')]);`,
}));

// ---------- 누른 뒤-8: 한 번만 보일 안내 ----------
const AF8_EDIT = '<h2 class="scr">내 정보 고치기</h2><div class="field"><label for="nm">이름</label><input type="text" id="nm" autocomplete="name" value="김하늘"></div><div><button type="button" class="primary" data-act="save">저장</button></div>';
pair('after-8', '누른 뒤-8 한 번만 보일 안내', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  ctlHtml: '「이름을 바꿨어요」가 보인 횟수: <b id="cnt">0번</b>',
  first: AF8_EDIT,
  script: `
var name = '김하늘', seen = 0, flash = '';
function shown() { seen++; document.getElementById('cnt').textContent = seen + '번'; }
B.screens.edit = function () { bView(${J(AF8_EDIT)}); document.getElementById('nm').value = name; };
B.screens.me = function (e) {
  var msg = '';
  ${bad ? "// 안내를 주소(?saved=1)에서 읽는다. 새로 고침할 때마다 다시 나온다\n  if (e.data.saved) msg = '이름을 바꿨어요.';" : "// 안내는 한 번 쓰고 지운다. 주소에 싣지 않는다\n  msg = flash; flash = '';"}
  bView((msg ? '<p class="ok" role="status">' + msg + '</p>' : '') + '<h2 class="scr">내 정보</h2><div class="kv2"><span>이름</span><b>' + esc(name) + '</b></div><div><button type="button" data-act="edit">고치기</button></div>');
  if (msg) shown();
};
onAct(function (act) {
  if (act === 'edit') bGo('edit', '고치기', '/me/edit');
  if (act === 'save') { name = document.getElementById('nm').value.trim() || name; ${bad ? "bGo('me', '내 정보', '/me?saved=1', { saved: true }, true);" : "flash = '이름을 바꿨어요.'; bGo('me', '내 정보', '/me', null, true);"} }
});
bStart([bEntry('me', '내 정보', '/me'), bEntry('edit', '고치기', '/me/edit')]);`,
}));

// ---------- 누른 뒤-9(확인): 연결이 끊겼을 때 ----------
pair('after-9', '누른 뒤-9 연결이 끊겼을 때', (bad, title) => page({
  title,
  style: `${CTL_CSS}${FORM_CSS} .say { display: flex; gap: 6px; align-items: end; } .say .field { flex: 1; } .msgs { display: grid; gap: 4px; } .msgs p { margin: 0; padding: 4px 10px; border-radius: 8px; background: #f3f6f7; } .msgs p.me { justify-self: end; background: #e3f1f1; } .net { margin: 0; padding: 6px 10px; border-radius: 6px; background: #fdf6e3; border: 1px solid #e4c77a; font-size: 13px; } .net:empty { display: none; }`,
  body: `
${ctl('<button type="button" id="net" aria-pressed="false">연결 끊기</button>')}
<div class="app" style="min-height:0">
  ${bar('수요 독서 모임 대화')}
  <div class="main">
    <p class="net" role="status" id="banner"></p>
    <div class="msgs" id="msgs"><p>바다: 이번 주 책 다 읽으셨어요?</p></div>
    <form class="say" id="say"><div class="field"><label for="m">메시지</label><input type="text" id="m" value="거의 다 읽었어요"></div><button type="submit" class="primary">보내기</button></form>
  </div>
</div>`,
  script: `
var off = false, wait = [], msgs = document.getElementById('msgs'), banner = document.getElementById('banner');
function line(t, k) { var p = document.createElement('p'); p.className = 'me'; p.textContent = t + (k ? ' · ' + k : ''); msgs.appendChild(p); return p; }
${bad ? '' : `function tell() { banner.textContent = off ? '연결이 끊겼어요. 지난 대화는 볼 수 있고, 적은 메시지는 연결되면 보내요.' + (wait.length ? ' 보낼 메시지 ' + wait.length + '개.' : '') : ''; }`}
document.getElementById('net').addEventListener('click', function () {
  off = !off; this.setAttribute('aria-pressed', String(off)); this.textContent = off ? '연결 잇기' : '연결 끊기';
  ${bad ? '// 끊겨도 이어져도 화면은 말이 없다. 보내던 것은 「보내는 중」에 멈춘다' : `// 끊기면 바로 알리고, 이어지면 기다리던 것을 보낸 뒤 알린다
  if (!off && wait.length) { var n = wait.length; wait.forEach(function (p) { p.textContent = p.textContent.replace(' · 연결되면 보내요', ''); }); wait = []; banner.textContent = '다시 연결됐어요. 메시지 ' + n + '개를 보냈어요.'; return; }
  tell();`}
});
document.getElementById('say').addEventListener('submit', function (ev) {
  ev.preventDefault();
  var m = document.getElementById('m'), t = m.value.trim(); if (!t) return;
  m.value = '';
  if (!off) { line(t); return; }
  ${bad ? "line(t, '보내는 중…');" : "wait.push(line(t, '연결되면 보내요')); tell();"}
});`,
}));

// ---------- 입력-8: 인증번호 칸 ----------
pair('input-8', '입력-8 인증번호 칸', (bad, title) => page({
  title,
  style: `${CTL_CSS}${FORM_CSS} input[type="number"] { font: inherit; color: #14212b; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; } .sugg { justify-self: start; font-size: 13px; }`,
  body: `
${ctl('문자(흉내): 「[동네 꽃집] 인증번호 012 345」 <button type="button" id="paste">문자 붙여넣기</button>')}
<div class="app" style="min-height:0">
  ${bar('휴대폰 확인')}
  <div class="main">
    <p>010-****-1234로 보낸 인증번호를 넣어 주세요. 3분 동안 쓸 수 있어요.</p>
    <div class="field"><label for="code">인증번호 6자리</label>${bad ? '<input type="number" id="code">' : '<input type="text" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="12">'}</div>
    ${bad ? '' : '<button type="button" class="sugg" id="sugg" hidden>자판 위 제안(흉내): 문자에서 받은 012345</button>'}
    <div class="acts3"><button type="button" class="primary" id="ok">확인</button><button type="button" id="again">번호 다시 받기</button></div>
    <p class="result" role="status" id="st"></p>
  </div>
</div>`,
  script: `
var code = document.getElementById('code'), st = document.getElementById('st');
// 붙여넣기 흉내: 문자에 온 그대로(띄어쓰기 포함) 칸에 넣는다
function put(v) { code.value = v; ${bad ? '' : "code.value = code.value.replace(/[\\s-]/g, '');"} code.focus(); }
document.getElementById('paste').addEventListener('click', function () { put('012 345'); });
${bad ? "// autocomplete=\"one-time-code\"가 없어 자판 위에 번호 제안이 뜨지 않는다" : `// autocomplete="one-time-code"면 휴대폰이 문자로 온 번호를 자판 위에 띄운다(흉내)
var sugg = document.getElementById('sugg');
code.addEventListener('focus', function () { if (!code.value) sugg.hidden = false; });
code.addEventListener('input', function () { code.value = code.value.replace(/[\\s-]/g, ''); sugg.hidden = true; });
sugg.addEventListener('click', function () { put('012345'); sugg.hidden = true; });`}
document.getElementById('again').addEventListener('click', function () { st.textContent = '새 번호를 보냈어요. 3분 동안 쓸 수 있어요.'; });
document.getElementById('ok').addEventListener('click', function () {
  var v = code.value;
  st.textContent = !v ? '칸이 비어 있어요. 문자에 온 6자리를 넣어 주세요.' : v === '012345' ? '확인했어요.' : '번호가 맞지 않아요. 문자에 온 6자리를 다시 봐 주세요.';
});`,
}));

// ---------- 입력-9: 번호가 안 왔을 때와 쓸 수 있는 시간 ----------
pair('input-9', '입력-9 인증번호의 시간과 다시 받기', (bad, title) => page({
  title,
  style: `${CTL_CSS}${FORM_CSS}`,
  body: `
${ctl('문자로 온 번호: <b>012345</b> · 지난 시간: <b id="min">0분</b> <button type="button" id="wait">1분 기다리기(흉내)</button>')}
<div class="app" style="min-height:0">
  ${bar('휴대폰 확인')}
  <div class="main">
    <p>010-****-1234로 인증번호를 보냈어요.${bad ? '' : ' <b id="until">오후 3:12까지(3분)</b> 쓸 수 있어요.'}</p>
    <div class="field"><label for="code">인증번호 6자리</label><input type="text" id="code" inputmode="numeric" autocomplete="one-time-code"></div>
    <div class="acts3"><button type="button" class="primary" id="ok">확인</button></div>
    ${bad ? '' : '<p class="muted">번호가 안 왔나요? <button type="button" id="again">번호 다시 받기</button> <button type="button" id="fix">휴대폰 번호 고치기</button></p>'}
    <p class="result" role="status" id="st"></p>
  </div>
</div>`,
  script: `
var min = 0, sent = 9 * 60 + 12, st = document.getElementById('st');
document.getElementById('wait').addEventListener('click', function () { min++; document.getElementById('min').textContent = min + '분'; });
document.getElementById('ok').addEventListener('click', function () {
  var v = document.getElementById('code').value.replace(/\\s/g, '');
  if (!v) { st.textContent = '칸이 비어 있어요. 문자에 온 6자리를 넣어 주세요.'; return; }
  ${bad ? "// 시간이 지나도 「맞지 않아요」라고만 한다\n  st.textContent = v === '012345' && min < 3 ? '확인했어요.' : '번호가 맞지 않아요.';" : `if (min >= 3) { st.textContent = '3분이 지나 이 번호는 쓸 수 없어요. 「번호 다시 받기」를 눌러 새 번호를 받아 주세요.'; return; }
  st.textContent = v === '012345' ? '확인했어요.' : '번호가 맞지 않아요. 문자에 온 6자리를 다시 봐 주세요.';`}
});
${bad ? '' : `document.getElementById('again').addEventListener('click', function () { min = 0; document.getElementById('min').textContent = '0분'; sent += 4; document.getElementById('until').textContent = '오후 3:' + String(sent % 60).padStart(2, '0') + '까지(3분)'; st.textContent = '새 번호를 보냈어요. 앞서 받은 번호는 이제 쓸 수 없어요.'; });
document.getElementById('fix').addEventListener('click', function () { st.textContent = '휴대폰 번호를 다시 적는 칸으로 가요(데모는 여기까지).'; });`}`,
}));

// ---------- 입력-10: 임시 저장과 이어 쓰기 ----------
const I10_F = [['nm', '모임 이름', 'input'], ['why', '모임 소개', 'textarea'], ['at', '모이는 곳', 'input']];
pair('input-10', '입력-10 임시 저장과 이어 쓰기', (bad, title) => flowPage({
  title,
  style: `${FORM_CSS} textarea { font: inherit; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; }`,
  first: '<h2 class="scr">새 모임 열기 신청</h2>',
  script: `
var F = ${J(I10_F)}, V = {}, DRAFT = null, clock = 14 * 60 + 3;
function hm(t) { return '오후 ' + (Math.floor(t / 60) - 12) + ':' + String(t % 60).padStart(2, '0'); }
B.screens.home = function () { bView('<h2 class="scr">모임</h2><p>새 모임을 열려면 신청서를 써 주세요. 심사에 사흘쯤 걸려요.</p><div><button type="button" class="primary" data-act="write">신청서 쓰기</button></div>'); };
B.screens.form = function () {
  ${bad ? '// 적은 것을 어디에도 두지 않는다. 다시 열면 빈 칸이다\n  V = {};' : '// 저장해 둔 것이 있으면 채우고, 언제 저장한 것인지 말한다\n  V = DRAFT ? Object.assign({}, DRAFT.v) : {};'}
  bView('<h2 class="scr">새 모임 열기 신청</h2>'${bad ? '' : " + (DRAFT ? '<p class=\"ok\" role=\"status\" id=\"saved\">' + hm(DRAFT.t) + '에 저장한 내용으로 이어 써요.</p>' : '<p class=\"result\" role=\"status\" id=\"saved\"></p>')"}
    + F.map(function (f) { return '<div class="field"><label for="' + f[0] + '">' + f[1] + '</label>' + (f[2] === 'textarea' ? '<textarea id="' + f[0] + '" rows="2">' + esc(V[f[0]] || '') + '</textarea>' : '<input type="text" id="' + f[0] + '" value="' + esc(V[f[0]] || '') + '">') + '</div>'; }).join('')
    + '<div class="acts3">${bad ? '' : '<button type="button" data-act="save">임시 저장</button>'}<button type="button" class="primary" data-act="send">신청 보내기</button></div>');
};
B.screens.sent = function () { bView('<h2 class="scr">신청을 받았어요</h2><p>사흘 안에 결과를 알려 드려요.</p>'); };
document.addEventListener('input', function (e) { V[e.target.id] = e.target.value; });
onAct(function (act) {
  if (act === 'write') bGo('form', '신청서', '/meets/new');
  if (act === 'save') { clock += 2; DRAFT = { v: Object.assign({}, V), t: clock }; document.getElementById('saved').className = 'ok'; document.getElementById('saved').textContent = hm(clock) + '에 저장했어요. 이 기기를 닫아도 30일 동안 이어 쓸 수 있어요.'; }
  if (act === 'send') { DRAFT = null; bGo('sent', '완료', '/meets/new/sent', null, true); }
});
bStart([bEntry('home', '모임', '/meets'), bEntry('form', '신청서', '/meets/new')]);`,
}));

// ---------- 입력-11: 앞 답이 바뀌어 뒤가 달라지면 알린다 ----------
pair('input-11', '입력-11 앞 단계 답이 뒤를 바꿀 때', (bad, title) => flowPage({
  title,
  style: `${FORM_CSS} .opt { display: flex; gap: 8px; align-items: center; font-size: 14px; color: #14212b; font-weight: 400; } fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 6px; } legend { font-weight: 600; font-size: 13px; padding: 0; margin-bottom: 4px; } .note { margin: 0; padding: 8px 10px; border-radius: 6px; background: #fdf6e3; border: 1px solid #e4c77a; font-size: 13px; }`,
  first: '<h2 class="scr">적은 내용</h2>',
  script: `
var V = { how: '택배', addr: '꽃길로 12, 2층', shop: '' }, before = '';
B.screens.s1 = function () {
  before = V.how;
  bView('<h2 class="scr">1/2 받는 방법</h2><fieldset><legend>어떻게 받을까요?</legend>' + ['택배', '가게에서 받기'].map(function (h, k) { return '<label class="opt"><input type="radio" name="how" id="h' + k + '" value="' + h + '"' + (V.how === h ? ' checked' : '') + '> ' + h + '</label>'; }).join('') + '</fieldset><div><button type="button" class="primary" data-act="next1">다음</button></div>');
};
B.screens.addr = function () { bView('<h2 class="scr">2/2 받을 주소</h2><div class="field"><label for="ad">주소</label><input type="text" id="ad" autocomplete="street-address" value="' + esc(V.addr) + '"></div><div><button type="button" class="primary" data-act="toRv">다음</button></div>'); };
B.screens.shop = function (e) {
  bView((e.data.note ? '<p class="note" role="status">' + e.data.note + '</p>' : '') + '<h2 class="scr">2/2 받을 가게</h2><div class="acts3" role="group" aria-label="가게">' + ['해님 빵집 본점', '해님 빵집 역 앞'].map(function (s) { return '<button type="button" data-act="shop" data-v="' + s + '">' + s + '</button>'; }).join('') + '</div>');
};
B.screens.rv = function () {
  var place = V.how === '택배' ? ['받을 주소', V.addr] : ['받을 가게', V.shop || V.addr];
  bView('<h2 class="scr">적은 내용</h2><div class="row"><span class="name">받는 방법: <b>' + V.how + '</b></span><button type="button" data-act="chg">변경</button></div><div class="row"><span class="name">' + place[0] + ': <b>' + esc(place[1]) + '</b></span></div><div><button type="button" class="primary" data-act="pay">9,800원 결제하기</button></div><p class="result" role="status" id="st"></p>');
};
onAct(function (act, a) {
  if (act === 'chg') bGo('s1', '받는 방법', '/order/how');
  if (act === 'next1') {
    var c = document.querySelector('input[name="how"]:checked'); V.how = c ? c.value : V.how;
    ${bad ? "// 바뀌었는지 보지 않고 확인 화면으로 돌아간다. 예전 주소가 받을 가게 자리에 그대로 남는다\n    bGo('rv', '적은 내용', '/order/review');" : `// 받는 방법이 바뀌었으면 다시 답할 단계로 데려가 이유를 말한다. 적은 주소는 지우지 않는다
    if (V.how !== before && V.how === '가게에서 받기') bGo('shop', '받을 가게', '/order/shop', { note: '받는 방법을 ‘가게에서 받기’로 바꿔서 받을 가게를 새로 골라야 해요. 적은 주소는 지우지 않고 두었어요.' });
    else if (V.how !== before) bGo('addr', '받을 주소', '/order/address');
    else bGo('rv', '적은 내용', '/order/review');`}
  }
  if (act === 'shop') { V.shop = a.dataset.v; bGo('rv', '적은 내용', '/order/review'); }
  if (act === 'toRv') { V.addr = document.getElementById('ad').value; bGo('rv', '적은 내용', '/order/review'); }
  if (act === 'pay') { if (a.getAttribute('aria-busy')) return; a.disabled = true; a.setAttribute('aria-busy', 'true'); document.getElementById('st').textContent = (V.how === '택배' ? V.addr : (V.shop || V.addr)) + ' 앞으로 주문했어요.'; }
});
bStart([bEntry('s1', '받는 방법', '/order/how'), bEntry('addr', '받을 주소', '/order/address'), bEntry('rv', '적은 내용', '/order/review')]);`,
}));

// ---------- 입력-12: 확인 화면의 「변경」은 고친 뒤 바로 돌아온다 ----------
const I12_STEPS = [['nm', '1/3 예약하는 사람', '이름', '김하늘'], ['day', '2/3 날짜', '날짜', '11월 23일 토요일'], ['ppl', '3/3 인원', '인원', '6명']];
pair('input-12', '입력-12 확인 화면에서 고치기', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  ctlHtml: '「변경」 뒤 확인 화면까지 누른 버튼: <b id="cnt">0번</b>',
  first: '<h2 class="scr">적은 내용</h2>',
  script: `
var S = ${J(I12_STEPS)}, V = {}, fixing = false, n = 0;
S.forEach(function (s) { V[s[0]] = s[3]; });
function tick() { if (fixing) { n++; document.getElementById('cnt').textContent = n + '번'; } }
B.screens.step = function (e) {
  var k = e.data.k, s = S[k];
  bView('<h2 class="scr">' + s[1] + '</h2><div class="field"><label for="v">' + s[2] + '</label><input type="text" id="v" value="' + esc(V[s[0]]) + '"></div><div><button type="button" class="primary" data-act="next" data-k="' + k + '">' + (${bad ? 'false' : 'fixing'} ? '저장하고 확인 화면으로' : '다음') + '</button></div>');
};
B.screens.rv = function () {
  fixing = false;
  bView('<h2 class="scr">적은 내용</h2><p class="muted">보내면 바꿀 수 없어요. 한 번 더 봐 주세요.</p>' + S.map(function (s, k) { return '<div class="row"><span class="name">' + s[2] + ': <b>' + esc(V[s[0]]) + '</b></span><button type="button" data-act="chg" data-k="' + k + '" aria-label="' + s[2] + ' 변경">변경</button></div>'; }).join('') + '<div><button type="button" class="primary" data-act="send">모임방 예약 보내기</button></div><p class="result" role="status" id="st"></p>');
};
onAct(function (act, a) {
  if (act === 'chg') { fixing = true; n = 0; document.getElementById('cnt').textContent = '0번'; bGo('step', '고치기', '/book/step' + (+a.dataset.k + 1), { k: +a.dataset.k }); }
  if (act === 'next') {
    var k = +a.dataset.k; V[S[k][0]] = document.getElementById('v').value; tick();
    ${bad ? "// 고친 단계부터 뒤 단계를 다시 다 지나게 한다\n    if (k < S.length - 1) bGo('step', S[k + 1][2], '/book/step' + (k + 2), { k: k + 1 }); else bGo('rv', '적은 내용', '/book/review');" : "// 고치러 왔으면 바로 확인 화면으로 돌아간다\n    if (fixing || k === S.length - 1) bGo('rv', '적은 내용', '/book/review'); else bGo('step', S[k + 1][2], '/book/step' + (k + 2), { k: k + 1 });"}
  }
  if (act === 'send') { if (a.getAttribute('aria-busy')) return; a.disabled = true; a.setAttribute('aria-busy', 'true'); document.getElementById('st').textContent = '모임방을 예약했어요.'; }
});
bStart([bEntry('step', '예약하는 사람', '/book/step1', { k: 0 }), bEntry('step', '날짜', '/book/step2', { k: 1 }), bEntry('step', '인원', '/book/step3', { k: 2 }), bEntry('rv', '적은 내용', '/book/review')]);`,
}));

// ---------- 길-11: 여러 단계 폼의 뒤로 가기와 「이전」 ----------
const W11_STEPS = [['to', '1/3 받는 사람', '이름', '김하늘'], ['addr', '2/3 받는 곳', '주소', '꽃길로 12, 2층'], ['msg', '3/3 카드 문구', '카드에 쓸 말', '생일 축하해요']];
pair('way-11', '길-11 여러 단계 폼의 뒤로 가기', (bad, title) => flowPage({
  title,
  style: FORM_CSS,
  first: '<h2 class="scr">장바구니</h2>',
  script: `
var S = ${J(W11_STEPS)}, V = {}, step = 0;
S.forEach(function (s) { V[s[0]] = s[3]; });
function stepHtml(k) { var s = S[k]; return '<h2 class="scr">' + s[1] + '</h2><div class="field"><label for="v">' + s[2] + '</label><input type="text" id="v" value="' + esc(V[s[0]]) + '"></div><div class="acts3">' + (k ? '<button type="button" data-act="prev">이전</button>' : '') + '<button type="button" class="primary" data-act="next">' + (k < S.length - 1 ? '다음' : '주문서 보기') + '</button></div>'; }
document.addEventListener('input', function (e) { if (e.target.id === 'v') V[S[step][0]] = e.target.value; });
B.screens.cart = function () { bView('<h2 class="scr">장바구니</h2><p>프리지아 한 단, 18,000원</p><div><button type="button" class="primary" data-act="start">선물 보내기</button></div>'); };
B.screens.done = function () { bView('<h2 class="scr">주문서</h2><div class="kv2"><span>받는 사람</span><b>' + esc(V.to) + '</b><span>받는 곳</span><b>' + esc(V.addr) + '</b><span>카드</span><b>' + esc(V.msg) + '</b></div>'); };
${bad ? `// 단계를 화면 상태(step)로만 바꾼다. 기록은 한 칸이라 브라우저 뒤로 가기는 장바구니로 나간다
B.screens.form = function () { step = 0; bView(stepHtml(0)); };
onAct(function (act) {
  if (act === 'start') bGo('form', '선물 보내기', '/gift');
  if (act === 'next') { if (step < S.length - 1) { step++; bView(stepHtml(step)); } else bGo('done', '주문서', '/gift/review'); }
  if (act === 'prev') { step--; bView(stepHtml(step)); }
});` : `// 단계마다 기록을 한 칸 쌓는다. 화면의 「이전」은 브라우저 뒤로 가기와 같은 일을 한다
B.screens.form = function (e) { step = e.data.k; bView(stepHtml(step)); };
onAct(function (act) {
  if (act === 'start') bGo('form', '받는 사람', '/gift/to', { k: 0 });
  if (act === 'next') { if (step < S.length - 1) bGo('form', S[step + 1][2], '/gift/' + S[step + 1][0], { k: step + 1 }); else bGo('done', '주문서', '/gift/review'); }
  if (act === 'prev') bBack();
});`}
bStart([bEntry('cart', '장바구니', '/cart')]);`,
}));

// ---------- 길-12: 다른 탭에서 로그아웃했을 때 ----------
pair('way-12', '길-12 다른 탭에서 로그아웃했을 때', (bad, title) => page({
  title,
  style: `${FORM_CSS} textarea { font: inherit; padding: 6px 10px; border: 1px solid #7f8d97; border-radius: 6px; width: 100%; } .tabs2 { display: flex; gap: 4px; padding: 6px 8px 0; background: #e3e8ec; border-bottom: 1px solid #c3ccd2; font-size: 12px; } .tabs2 button { font-size: 12px; border-radius: 6px 6px 0 0; border-bottom: 0; background: #d3dadf; } .tabs2 button[aria-pressed="true"] { background: #fff; } .note { margin: 0; padding: 8px 10px; border-radius: 6px; background: #fdf6e3; border: 1px solid #e4c77a; font-size: 13px; } .note:empty { display: none; }`,
  body: `
<div class="app" style="min-height:0">
  <div class="tabs2" role="group" aria-label="브라우저 탭(흉내)"><button type="button" data-t="1" aria-pressed="false">탭 1 · 내 정보</button><button type="button" data-t="2" aria-pressed="true">탭 2 · 후기 쓰기</button></div>
  <div class="main" id="t1" hidden></div>
  <div class="main" id="t2"></div>
</div>`,
  script: `
var logged = true, text = '', news = false;
var t1 = document.getElementById('t1'), t2 = document.getElementById('t2');
function draw1() { t1.innerHTML = logged ? '<h2 class="scr">내 정보</h2><p>김하늘 · 동네 꽃집 회원</p><div><button type="button" id="out">로그아웃</button></div>' : '<h2 class="scr">로그아웃했어요</h2>'; var o = document.getElementById('out'); if (o) o.addEventListener('click', function () { logged = false; ${bad ? '' : '// 탭끼리 알린다(BroadcastChannel 흉내)\n  news = true; '}draw1(); draw2(); }); }
function draw2(msg) {
  ${bad ? '' : `if (!logged) {
    t2.innerHTML = '<p class="note" role="status">다른 탭에서 로그아웃했어요. 쓰던 후기는 그대로 있어요. 다시 로그인하면 이어서 올릴 수 있어요. <button type="button" id="relog">다시 로그인</button></p>' + form();
    bind(); document.getElementById('relog').addEventListener('click', function () { logged = true; draw1(); draw2(); }); return;
  }`}
  t2.innerHTML = form() + (msg ? '<p class="result" role="status">' + msg + '</p>' : '');
  bind();
}
function form() { return '<h2 class="scr">‘프리지아 한 단’ 후기</h2><div class="field"><label for="tx">후기</label><textarea id="tx" rows="3">' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</textarea></div><div><button type="button" class="primary" id="post">올리기</button></div>'; }
function bind() {
  document.getElementById('tx').addEventListener('input', function (e) { text = e.target.value; });
  document.getElementById('post').addEventListener('click', function () {
    ${bad ? `// 로그인이 풀린 줄 모르고 보낸다. 로그인 화면으로 넘어가며 쓰던 글이 사라진다
    if (!logged) { text = ''; t2.innerHTML = '<h2 class="scr">로그인</h2><p>로그인해야 쓸 수 있어요.</p><div><button type="button" class="primary" id="lg">로그인</button></div>'; document.getElementById('lg').addEventListener('click', function () { logged = true; draw1(); draw2(); }); return; }` : 'if (!logged) { draw2(); return; }'}
    if (!text.trim()) { draw2('후기를 적어 주세요.'); return; }
    text = ''; draw2('후기를 올렸어요.');
  });
}
document.querySelectorAll('.tabs2 button').forEach(function (b) { b.addEventListener('click', function () { var t = b.dataset.t; document.querySelectorAll('.tabs2 button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); t1.hidden = t !== '1'; t2.hidden = t !== '2'; }); });
draw1(); draw2();`,
}));

// ---------- 방해-5: 로그인은 필요한 순간에 ----------
const BREADS5 = [['소금빵', 3200], ['우유 식빵', 4800], ['무화과 깜빠뉴', 6500]];
pair('interrupt-5', '방해-5 로그인을 묻는 때', (bad, title) => page({
  title,
  style: SHEET_CSS,
  body: `
<div class="app" style="min-height:0">
  ${bar('해님 빵집')}
  <div class="main" id="main"></div>
</div>
${bad ? '' : `<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" hidden>
  <h2 id="sh-t">로그인하고 찜할까요?</h2>
  <p>로그인하면 찜한 빵을 다른 기기에서도 보고, 새로 구우면 알려 드려요.</p>
  <div class="acts"><button type="button" id="no">로그인 안 함</button><button type="button" class="primary" id="yes">로그인</button></div>
</div>`}`,
  script: `
var B5 = ${J(BREADS5)}, logged = false, liked = {}, from = null, main = document.getElementById('main');
function menu(msg) {
  main.innerHTML = '<p class="muted">오늘 나온 빵</p>' + B5.map(function (b) { return '<div class="row"><span class="name">' + b[0] + ' <span class="muted">· ' + b[1].toLocaleString('ko-KR') + '원</span></span><button type="button" class="like" data-v="' + b[0] + '" aria-pressed="' + !!liked[b[0]] + '">' + (liked[b[0]] ? '찜함' : '찜') + '</button></div>'; }).join('') + '<p class="result" role="status" id="st">' + (msg || '') + '</p>';
}
${bad ? `// 들어오자마자 로그인부터 요구한다. 무엇을 파는지도 볼 수 없다
function wall() { main.innerHTML = '<h2 class="scr">로그인이 필요해요</h2><p>로그인하면 해님 빵집을 쓸 수 있어요.</p><div><button type="button" class="primary" id="login">로그인</button></div>'; document.getElementById('login').addEventListener('click', function () { logged = true; menu(); }); }
wall();
main.addEventListener('click', function (e) { var b = e.target.closest('.like'); if (!b) return; liked[b.dataset.v] = !liked[b.dataset.v]; menu(liked[b.dataset.v] ? b.dataset.v + ' 찜했어요.' : ''); });` : `// 둘러보기는 로그인 없이. 찜처럼 계정이 있으면 좋은 순간에 이유와 함께 묻고, 거절해도 이 기기에 찜해 둔다
var sheet = document.getElementById('sheet'), want = '';
menu();
main.addEventListener('click', function (e) {
  var b = e.target.closest('.like'); if (!b) return;
  if (liked[b.dataset.v]) { liked[b.dataset.v] = false; menu(); return; }
  if (logged || asked) { liked[b.dataset.v] = true; menu(b.dataset.v + ' 찜했어요.'); return; }
  want = b.dataset.v; from = b; sheet.hidden = false; document.getElementById('no').focus();
});
var asked = false;
function done(msg) { sheet.hidden = true; asked = true; liked[want] = true; menu(msg); var t = main.querySelector('[data-v="' + want + '"]'); if (t) t.focus(); }
document.getElementById('no').addEventListener('click', function () { done(want + ' 찜했어요. 이 기기에만 저장해 둘게요.'); });
document.getElementById('yes').addEventListener('click', function () { logged = true; done('로그인했어요. ' + want + ' 찜했어요.'); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { sheet.hidden = true; if (from) from.focus(); } });`}`,
}));

export const files = () => Object.fromEntries(Object.entries(demos).map(([k, v]) => [`${k}.html`, v]));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const out = files();
  for (const f of readdirSync(OUT)) if (f.endsWith('.html') && !(f in out)) unlinkSync(join(OUT, f));
  for (const [f, html] of Object.entries(out)) writeFileSync(join(OUT, f), html);
  console.log(`썼다: public/ux/ ${Object.keys(out).length}개`);
}
