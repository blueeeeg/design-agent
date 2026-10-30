// AI에게 시킬 문장 상자: 두 줄만 보이고 「전체 보기」로 펼친다. 패턴 페이지(catalog.js)와 컴포넌트 사전이 같이 쓴다.
// 상자 모양은 src/components/Prompt.astro와 같게 둔다

export function promptHTML(text, esc) {
  return `<div class="prompt"><div class="prompt-head"><span class="fl">AI에게 시킬 문장</span><span class="prompt-acts"><button type="button" class="prompt-more" aria-expanded="false">전체 보기</button><button type="button" class="copy-mini" data-copy="${esc(text)}">복사</button></span></div><p class="prompt-text">${esc(text)}</p></div>`;
}

// 두 줄 안에 다 들어가는 문장은 펼칠 것이 없으니 「전체 보기」를 숨긴다
export function markClamped(root = document) {
  root.querySelectorAll('.prompt:not(.open)').forEach(box => {
    const t = box.querySelector('.prompt-text');
    box.querySelector('.prompt-more').hidden = t.scrollHeight <= t.clientHeight + 1;
  });
}

document.addEventListener('click', e => {
  const more = e.target.closest('.prompt-more');
  if (more) {
    const box = more.closest('.prompt');
    const open = box.classList.toggle('open');
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? '접기' : '전체 보기';
    return;
  }
  const cp = e.target.closest('.copy-mini[data-copy]');
  if (!cp) return;
  const done = t => { cp.textContent = t; setTimeout(() => { cp.textContent = '복사'; }, 2000); };
  try { navigator.clipboard.writeText(cp.dataset.copy).then(() => done('복사됨'), () => done('복사하지 못했어요')); } catch (err) { done('복사하지 못했어요'); }
});

let lastW = 0;
window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; markClamped(); } });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => markClamped());
