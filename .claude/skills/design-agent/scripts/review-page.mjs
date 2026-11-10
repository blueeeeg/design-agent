#!/usr/bin/env node
// 리뷰를 사용자가 볼 HTML 페이지 하나로 만든다(사진은 페이지 안에 넣는다). 2026-11-10
//   node review-page.mjs review.json                 → review.json 옆에 review.html
//   node review-page.mjs review.json --out 보기.html
// review.json 모양은 references/review-page.md. 글 안의 **굵게**, `코드`, (잰 것)·(계산한 것)·(눈으로 본 것) 같은 출처 표시를 알아본다
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, extname, join, basename } from 'node:path';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
if (!file) { console.error('리뷰 파일을 넣어 주세요. 예: node review-page.mjs review.json'); process.exit(1); }
const oi = args.indexOf('--out');
const out = oi >= 0 ? args[oi + 1] : join(dirname(file), basename(file, extname(file)) + '.html');
let R;
try { R = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`리뷰 파일을 못 읽었다: ${file} (${e.message})`); process.exit(1); }
const base = dirname(resolve(file));
// 주소는 http·https만 링크로 건다. 리뷰 글은 남의 사이트에서 옮긴 것이라 javascript: 주소가 섞일 수 있다
const warn = [];
const usedImgs = new Set();
if (R.url && !/^https?:\/\//i.test(R.url)) warn.push(`주소가 http·https가 아니라 링크로 걸지 않았다: ${R.url}`);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 글 꾸밈: 이스케이프한 뒤 **굵게**, `코드`, 출처 표시만 바꾼다
const SRC = /\((잰 것|계산한 것|계산|눈으로 본 것|눈|소스|눌러 본 것|내 판단|짐작)([^()]*)\)/g;
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(SRC, (_, k, rest) => `<span class="src src-${{ '잰 것': 'm', '계산한 것': 'c', '계산': 'c', '소스': 'c', '눈으로 본 것': 'e', '눈': 'e', '눌러 본 것': 'e', '내 판단': 'j', '짐작': 'j' }[k]}">(${k}${rest})</span>`);
// 여러 줄 글: 「- 」로 시작하는 줄은 목록으로, 나머지 줄은 문단으로
const rich = s => {
  const out = []; let ul = [];
  const flush = () => { if (ul.length) { out.push(`<ul class="sub">${ul.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); ul = []; } };
  for (const line of String(s ?? '').split('\n')) { if (/^\s*- /.test(line)) ul.push(line.replace(/^\s*- /, '')); else { flush(); if (line.trim()) out.push(`<span class="para">${inline(line)}</span>`); } }
  flush(); return out.join('');
};
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
const img = (p, alt) => {
  if (!p) return '';
  const f = resolve(base, p);
  usedImgs.add(f);
  if (!existsSync(f) || !MIME[extname(f).toLowerCase()]) { warn.push(`사진을 못 찾았다: ${p}`); return `<div class="noimg">사진 없음: ${esc(p)}</div>`; }
  return `<img src="data:${MIME[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}" alt="${esc(alt)}">`;
};
const list = (items, cls = '') => items?.length ? `<ul${cls ? ` class="${cls}"` : ''}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</ul>` : '';
const LEVEL = { '꼭': '꼭 고칠 것', '권장': '고치기 권함', '확인': '확인' };

// 고친 모습: 고치기 전·후 사진, 바뀐 것, 넣은 CSS·코드. 먼저 고칠 셋 카드와 나머지 고칠 곳(접어서)이 같이 쓴다
const block = (label, code) => code ? `<div class="code"><div class="code-head"><span>${label}</span><button type="button" class="copy">복사</button></div><pre><code>${esc(code)}</code></pre></div>` : '';
const detail = (t, name) => {
  const shots = t.shots && (t.shots.before || t.shots.after) ? `
      <div class="shots" data-show="after">
        <div class="switch" role="group" aria-label="${esc(name)} 사진 보기">
          <button type="button" data-v="before" aria-pressed="false">고치기 전</button>
          <button type="button" data-v="after" aria-pressed="true">고친 뒤</button>
        </div>
        <div class="pair">
          <figure class="before">${img(t.shots.before, `${name} 고치기 전`)}<figcaption>고치기 전</figcaption></figure>
          <figure class="after">${img(t.shots.after, `${name} 고친 뒤`)}<figcaption>고친 뒤</figcaption></figure>
        </div>
      </div>` : '';
  const changes = t.changes?.length ? `<h4>바뀐 것</h4><ol class="changes">${t.changes.map(c => `<li>${c.n != null ? `<span class="n" aria-hidden="true">${esc(c.n)}</span>` : '<span class="n n-none" aria-hidden="true"></span>'}<span>${c.n != null ? `<span class="sr">${esc(c.n)}번. </span>` : ''}${inline(c.text)}</span></li>`).join('')}</ol>` : '';
  const more = t.more?.length ? `<div class="more-shots">${t.more.map(m => `<figure>${img(m.src, m.caption || name)}<figcaption>${inline(m.caption || '')}</figcaption></figure>`).join('')}</div>` : '';
  return `${shots}${more}${changes}${block('넣은 CSS', t.css)}${block('코드', t.code)}${t.note ? `<p class="note">${inline(t.note)}</p>` : ''}`;
};
const hasDetail = t => !!(t.shots || t.more?.length || t.changes?.length || t.css || t.code || t.note);

// 먼저 고칠 셋
const card = (t, i) => `
    <article class="fix" id="fix${i + 1}">
      <h3><span class="num">${i + 1}</span>${inline(t.title)}${t.effort ? ` <span class="effort">${esc(t.effort)}</span>` : ''}</h3>
      ${t.body ? `<div class="body">${rich(t.body)}</div>` : ''}
      ${detail(t, t.title)}
    </article>`;

// 나머지 고칠 곳: 단계 → 실패 이름으로 묶는다
const fixes = R.fixes || [];
const byLevel = ['꼭', '권장', '확인'].map(lv => {
  const items = fixes.filter(f => (f.level || '권장') === lv);
  if (!items.length) return '';
  const groups = [...new Set(items.map(f => f.fail || '그 밖'))];
  return `<section class="level level-${{ '꼭': 'must', '권장': 'should', '확인': 'check' }[lv]}">
      <h3>${LEVEL[lv]} <span class="count">${items.length}</span></h3>
      ${groups.map(g => `<h4>${esc(g)}</h4><ul>${items.filter(f => (f.fail || '그 밖') === g).map(f => `<li>${f.top ? `<a class="totop" href="#fix${f.top}">먼저 고칠 셋 ${esc(f.top)}</a> ` : ''}${f.effort ? `<span class="effort">${esc(f.effort)}</span> ` : ''}${rich(f.text)}${hasDetail(f) ? `<details class="more"><summary>고친 모습 보기</summary>${detail(f, f.text.split('\n')[0].slice(0, 20))}</details>` : ''}</li>`).join('')}</ul>`).join('')}
    </section>`;
}).join('');

const fold = (title, inner, open = false) => inner ? `<details${open ? ' open' : ''}><summary>${title}</summary><div class="fold">${inner}</div></details>` : '';
const patterns = R.patterns?.length ? `<ul class="patterns">${R.patterns.map(p => `<li><strong>${esc(p.name)}</strong><dl><dt>지금</dt><dd>${inline(p.now)}</dd><dt>추천</dt><dd>${inline(p.rec)}</dd><dt>판단</dt><dd>${inline(p.verdict)}</dd></dl></li>`).join('')}</ul>` : '';

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(R.title || '디자인 리뷰')}</title>
<style>
  :root { --bg: #ffffff; --surface: #f6f7f9; --text: #1b1f24; --sub: #57606a; --line: #d0d7de; --strong-line: #8c959f; --accent: #0b57d0; --must: #b42318; --should: #9a5b00; --check: #57606a; --mark: #0b57d0; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0e1116; --surface: #161b22; --text: #e6edf3; --sub: #9da7b3; --line: #30363d; --strong-line: #6e7681; --accent: #6ea8fe; --must: #ff8a80; --should: #f0b45a; --check: #9da7b3; --mark: #6ea8fe; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif; word-break: keep-all; overflow-wrap: anywhere; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 28px; line-height: 1.3; margin: 0 0 8px; }
  h2 { font-size: 20px; margin: 48px 0 16px; }
  h3 { font-size: 18px; margin: 0 0 8px; }
  h4 { font-size: 15px; margin: 16px 0 8px; color: var(--sub); }
  p { margin: 8px 0; }
  a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  code { font: 14px/1.5 ui-monospace, Menlo, monospace; }
  .meta { color: var(--sub); font-size: 15px; }
  .meta ul { padding-left: 20px; margin: 8px 0 0; }
  .fails { margin-top: 16px; font-size: 15px; }
  .fix { border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin: 0 0 24px; }
  .fix h3 { display: flex; gap: 12px; align-items: baseline; }
  .num { flex: none; font-size: 15px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
  .shots { margin: 16px 0; }
  .switch { display: none; gap: 8px; margin-bottom: 12px; }
  .switch button { min-height: 44px; padding: 0 16px; border: 1px solid var(--strong-line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; font-size: 15px; }
  .switch button[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); font-weight: 700; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  figure { margin: 0; }
  figure img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; }
  figcaption { margin-top: 8px; font-size: 14px; color: var(--sub); }
  .noimg { padding: 24px; border-radius: 8px; background: var(--surface); color: var(--sub); font-size: 14px; }
  @media (max-width: 719px) {
    .switch { display: flex; }
    .pair { grid-template-columns: 1fr; }
    .shots[data-show="after"] .before, .shots[data-show="before"] .after { display: none; }
  }
  .more-shots { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin: 16px 0; }
  .changes { list-style: none; padding: 0; margin: 0; }
  .changes li { display: grid; grid-template-columns: 24px 1fr; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  .n { width: 24px; height: 24px; border-radius: 50%; background: var(--mark); color: var(--bg); font-size: 13px; font-weight: 700; line-height: 24px; text-align: center; font-variant-numeric: tabular-nums; }
  .n-none { background: none; border: 1px dashed var(--strong-line); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .code { margin-top: 12px; border-radius: 8px; background: var(--surface); }
  .code-head { display: flex; justify-content: space-between; align-items: center; padding: 4px 4px 0 12px; font-size: 14px; color: var(--sub); }
  .copy { min-height: 44px; min-width: 64px; border: 1px solid var(--strong-line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; font-size: 14px; }
  pre { margin: 0; padding: 12px; overflow-x: auto; }
  .note { color: var(--sub); font-size: 15px; }
  .src { font-size: 13px; color: var(--sub); white-space: nowrap; }
  .level h3 { display: flex; gap: 8px; align-items: baseline; }
  .level-must h3 { color: var(--must); }
  .level-should h3 { color: var(--should); }
  .level-check h3 { color: var(--check); }
  .count { font-size: 15px; font-variant-numeric: tabular-nums; }
  .level ul, .fold ul { padding-left: 20px; margin: 0 0 8px; }
  .level li, .fold li { margin: 8px 0; }
  .level { margin-bottom: 32px; }
  .totop { font-size: 14px; }
  .effort { font-size: 13px; font-weight: 400; color: var(--sub); border: 1px solid var(--line); border-radius: 4px; padding: 0 4px; white-space: nowrap; }
  details { border-top: 1px solid var(--line); }
  details:last-of-type { border-bottom: 1px solid var(--line); }
  summary { min-height: 48px; display: flex; align-items: center; font-weight: 700; cursor: pointer; }
  .fold { padding: 0 0 16px; }
  .para { display: block; }
  .body { margin: 8px 0; }
  ul.sub { margin: 4px 0 0; padding-left: 20px; }
  details.more { border: 0; margin-top: 4px; }
  details.more summary { min-height: 44px; font-weight: 400; color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  .patterns { list-style: none; padding: 0; }
  .patterns > li { padding: 12px 0; border-top: 1px solid var(--line); }
  dl { display: grid; grid-template-columns: 48px 1fr; gap: 4px 12px; margin: 8px 0 0; }
  dt { color: var(--sub); font-size: 14px; }
  dd { margin: 0; }
  @media (max-width: 719px) { .fix { padding: 16px; } }
  @media (hover: hover) { .switch button:hover, .copy:hover { border-color: var(--text); } }
</style>
</head>
<body>
<main>
  <header>
    <h1>${esc(R.title || '디자인 리뷰')}</h1>
    <p class="meta">${[R.url ? (/^https?:\/\//i.test(R.url) ? `<a href="${esc(R.url)}">${esc(R.url)}</a>` : esc(R.url)) : '', esc(R.date || '')].filter(Boolean).join(' · ')}</p>
    ${R.context?.length ? `<div class="meta">${list(R.context)}</div>` : ''}
    ${R.fails?.length ? `<p class="fails">해당하는 실패: ${R.fails.map(esc).join(', ')}</p>` : ''}
  </header>

  ${R.top?.length ? `<h2>먼저 고칠 ${R.top.length === 3 ? '셋' : R.top.length + '가지'}</h2>
  ${R.top.length && R.top.some(t => t.shots) ? `<p class="note">사진은 그 페이지에 고칠 CSS를 잠깐 넣어 찍은 흉내다. 번호 점선은 바뀐 자리를 가리킨다.</p>` : ''}
  ${R.top.map(card).join('')}` : ''}

  ${byLevel ? `<h2>고칠 곳 ${fixes.length}</h2>${byLevel}` : ''}

  <h2>더 보기</h2>
  ${fold('잘한 곳', list(R.good), true)}
  ${fold('패턴 비교', patterns)}
  ${fold('정한 건지 확인', (R.askNote ? `<p class="note">${inline(R.askNote)}</p>` : '') + list(R.ask))}
  ${fold('확인 못 한 것', list(R.unchecked))}
</main>
<script>
  document.querySelectorAll('.shots').forEach(box => box.querySelectorAll('.switch button').forEach(b => b.addEventListener('click', () => {
    box.dataset.show = b.dataset.v;
    box.querySelectorAll('.switch button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  })));
  document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
    const t = b.closest('.code').querySelector('code').textContent;
    try { await navigator.clipboard.writeText(t); b.textContent = '복사했어요'; }
    catch (e) { const r = document.createRange(); r.selectNodeContents(b.closest('.code').querySelector('code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '선택했어요. 복사 단축키로'; }
    setTimeout(() => { b.textContent = '복사'; }, 2000);
  }));
</script>
</body>
</html>
`;
// ---- 고치는 사람 눈으로 확인(2026-11-10 개발자 역할로 읽혀 본 결과). 페이지는 만들고 알림만 낸다 ----
const fixesAll = R.fixes || [], tops = R.top || [];
const txt = t => [t.title, t.body, t.text, t.note, ...(t.changes || []).map(c => c.text)].filter(Boolean).join('\n');
// 1. 폴더에 있는데 어디에도 안 쓴 사진
for (const f of readdirSync(base)) if (MIME[extname(f).toLowerCase()] && !usedImgs.has(resolve(base, f))) warn.push(`연결 안 된 사진: ${f}. 쓰려면 shots나 more에 넣고, 아니면 지운다`);
// 2. 맨 위 「해당하는 실패」에 없는 실패 이름
if (R.fails?.length) for (const g of new Set(fixesAll.map(f => f.fail).filter(Boolean))) if (!R.fails.includes(g)) warn.push(`맨 위 fails에 없는 실패 이름: 「${g}」(고칠 곳에서 씀)`);
// 3. 「A거나 B」로 끝낸 처방: 하나를 고른다
const EITHER = /[가-힣]+(거나|든지)\s+[가-힣「]/;
[...tops.map((t, i) => [`먼저 고칠 셋 ${i + 1}`, t]), ...fixesAll.map((f, i) => [`고칠 곳 ${i + 1}`, f])].forEach(([name, t]) => { const m = txt(t).match(EITHER); if (m) warn.push(`${name}: 「${m[0]}…」 둘 중 하나를 골랐나. 정한 쪽을 쓰고 다른 쪽은 「다른 방법:」으로`); });
// 4. 단계 어긋남: 먼저 고칠 셋인데 고칠 곳에서 「꼭」이 아님 / 「꼭」인데 셋에도 연결에도 없음은 정상이지만, 셋이 「확인」이면 이상하다
tops.forEach((t, i) => { const linked = fixesAll.filter(f => f.top === i + 1); if (linked.length && linked.every(f => f.level === '확인')) warn.push(`먼저 고칠 셋 ${i + 1}이 고칠 곳에서 「확인」이다. 단계를 맞춘다`); if (!linked.length) warn.push(`먼저 고칠 셋 ${i + 1}에 연결된 고칠 곳이 없다(fixes에 top: ${i + 1})`); });
// 5. 사진이 있는데 바뀐 것이 없다
[...tops, ...fixesAll].forEach(t => { if (t.shots && (t.shots.before || t.shots.after) && !t.changes?.length) warn.push(`사진이 있는데 「바뀐 것」이 없다: ${(t.title || t.text || '').split('\n')[0].slice(0, 30)}`); });

// 6. 걸리는 시간이 없다(꼭·권장). 먼저 고칠 셋과 연결된 줄은 셋 쪽에서 본다
[...tops.map((t, i) => [`먼저 고칠 셋 ${i + 1}`, t]), ...fixesAll.filter(f => !f.top && f.level !== '확인').map(f => [`고칠 곳 「${(f.text || '').split('\n')[0].slice(0, 16)}…」`, f])].forEach(([name, t]) => { if (!t.effort) warn.push(`${name}: 걸리는 시간(effort: 10분·1시간·반나절)이 없다`); });
// 7. 서비스 쪽 사람에게 뜻이 없는 우리 도구·문서 이름
const OURS = /\b[\w-]+\.mjs\b|visual-basics\.md|failures\.md|extra-questions\.md|design-rules\.json|SKILL\.md/;
[...tops, ...fixesAll, ...(R.good || []).map(g => ({ text: g })), ...(R.ask || []).map(a => ({ text: a })), ...(R.patterns || []).map(p => ({ text: [p.now, p.rec, p.verdict].join(' ') }))].forEach(t => { const all = txt(t) + '\n' + (t.css || '') + '\n' + (t.code || ''); const m = all.match(OURS); if (m) warn.push(`우리 도구·문서 이름 「${m[0]}」: 받는 사람에게 뜻이 없다. 뜻으로 풀어 쓴다`); });

writeFileSync(out, html);
console.log(`리뷰 페이지: ${out}${warn.length ? `\n넘기기 전에 볼 것 ${warn.length}개(references/visual-basics.md 「고치는 사람이 그대로 움직일 수 있게」)\n${warn.map(w => `- ${w}`).join('\n')}` : ''}`);
process.exit(warn.length ? 2 : 0);
