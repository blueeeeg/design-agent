// 내 서비스에 맞추기: 조건을 한 번 고르면 패턴마다 추천 방식을 한 목록으로 보여 주고, 다 고르면 AI용 디자인 규칙(DESIGN.md)을 만든다
import { ACTION_AXIS, ANTI_DEFAULTS, PATTERNS, GROUP_ORDER, state, SAMPLE_BY_CONTENT, PARAM_META, findOpt, VISIBLE_AXES, resolve, describeFrom, scorePattern, reasonText, STRENGTH_LABEL, STRENGTH_HINT } from './core.js';
import { esc } from './draw.js';

const BASE = (document.body.dataset.base || '/').replace(/\/?$/, '/');
// 카탈로그 페이지와 같은 이름으로 기억한다. 고른 조건만 쓰고, 고르지 않은 조건은 비워 둔다
const SEL_KEY = 'design-axes-selection', CHOSEN_KEY = 'design-axes-chosen', ACTION_KEY = 'design-axes-action';
const sel = {};
try {
  const saved = JSON.parse(localStorage.getItem(SEL_KEY) || '{}');
  const chosen = JSON.parse(localStorage.getItem(CHOSEN_KEY) || '[]');
  VISIBLE_AXES.forEach(a => { if (chosen.includes(a.key) && a.options.some(o => o.id === saved[a.key])) sel[a.key] = saved[a.key]; });
  const act = localStorage.getItem(ACTION_KEY);
  if (ACTION_AXIS.options.some(o => o.id === act)) state.actionKind = act;
} catch (e) { /* 저장소를 못 쓰면 아무것도 안 고른 채로 */ }
const save = () => {
  try {
    localStorage.setItem(SEL_KEY, JSON.stringify(sel));
    localStorage.setItem(CHOSEN_KEY, JSON.stringify(Object.keys(sel)));
    if (state.actionKind) localStorage.setItem(ACTION_KEY, state.actionKind); else localStorage.removeItem(ACTION_KEY);
  } catch (e) { /* 기억 못 해도 동작은 같다 */ }
};
const allPicked = () => VISIBLE_AXES.every(a => sel[a.key]);
const pickedText = () => VISIBLE_AXES.filter(a => sel[a.key]).map(a => findOpt(a.key, sel[a.key]).label).join(' · ');

// 조건 이름 대신 질문으로 묻고, 선택지마다 예시를, 축마다 무엇이 바뀌는지를 함께 보인다.
// 축마다 선택지가 2~3개라 다 펼친다. 작업의 무게는 고르지 않아도 된다
function renderAxes() {
  const seg = (a, current, optional) => `
    <div class="axsel">
      <div class="ax-q"><span><b id="lbl-${a.key}">${esc(a.question)}</b>${optional ? ' <span class="ax-opt">선택</span>' : ''}</span><span class="ax-ch">바뀌는 것: ${esc(a.changes)}</span>${optional ? '<span class="ax-ch">저장·주문·삭제 같은 동작이 없으면 건너뛰세요</span>' : ''}</div>
      <div class="seg" id="seg-${a.key}" role="group" aria-labelledby="lbl-${a.key}">${a.options.map(o => `<button type="button" data-axis="${a.key}" data-opt="${o.id}" aria-pressed="${current === o.id}"><span class="seg-l">${esc(o.label)}</span><span class="seg-s">${esc(o.sub)}</span></button>`).join('')}</div>
    </div>`;
  document.getElementById('axes').innerHTML = VISIBLE_AXES.map(a => seg(a, sel[a.key])).join('')
    + seg(ACTION_AXIS, state.actionKind, true);
  // 줄마다 되풀이하던 안내는 여기서 한 번만 한다
  const n = Object.keys(sel).length, all = VISIBLE_AXES.length;
  const byAction = state.actionKind ? 0 : PATTERNS.filter(p => p.action).length;
  document.getElementById('pick-status').textContent = [
    n ? `질문 ${all}개 중 ${n}개에 답했습니다.` : '아직 답한 질문이 없어 패턴마다 가장 흔한 방식을 보여 줍니다.',
    byAction ? `마지막 질문(${ACTION_AXIS.question})에 답하면 ${byAction}개 패턴의 추천이 달라질 수 있습니다.` : '',
  ].filter(Boolean).join(' ');
}

// 패턴마다 추천 한 줄. 근거가 없으면 솔직히 「가장 흔한 방식」이라고 적는다.
// 「상태 알리기」 같은 묶음 이름은 쓰는 사람이 알 필요가 없어 한 목록으로 둔다(순서는 묶음 순서 그대로)
function renderList() {
  const ordered = GROUP_ORDER.flatMap(g => PATTERNS.filter(p => p.group === g));
  document.getElementById('plan-list').innerHTML = ordered.map(p => {
    const res = scorePattern(p, sel);
    const b = res.best;
    // 조건을 하나도 안 골랐으면 이유를 줄마다 적지 않는다(위 안내가 말한다)
    const why = res.neutral ? (Object.keys(sel).length ? '근거 없음, 가장 흔한 방식' : '') : b.hits.map(reasonText).join(' / ');
    const next = res.scored.filter(s => s !== b).sort((x, y) => y.score - x.score)[0];
    return `<li class="plan-row" data-pattern="${p.id}">
      <a class="plan-pat" href="${BASE}elements/${p.id}/">${esc(p.name)}</a>
      <div class="plan-pick"><span class="plan-name"><b>${esc(b.o.name)}</b> <small class="en">${esc(b.o.en)}</small></span>${why ? `<span class="plan-why">${esc(why)}</span>` : ''}${next && !res.neutral && next.score > 0 ? `<span class="plan-alt">다음 후보: ${esc(next.o.name)}</span>` : ''}</div>
    </li>`;
  }).join('');
}

// AI용 디자인 규칙: 네 조건을 다 골라야 만든다. 덜 골랐으면 빠진 조건을 알린다
function renderRules() {
  const missing = VISIBLE_AXES.filter(a => !sel[a.key]);
  document.getElementById('rules-wait').hidden = !missing.length;
  document.getElementById('rules-body').hidden = !!missing.length;
  if (missing.length) {
    document.getElementById('rules-wait').textContent = `규칙 파일을 만들려면 ${missing.map(a => `「${a.question}」`).join(', ')}에도 답해 주세요.`;
    return;
  }
  const r = resolve({ ...sel, domain: SAMPLE_BY_CONTENT[sel.content] });
  const numeric = Object.entries(PARAM_META).map(([p, m]) => {
    const x = r.params[p];
    const notes = x.overridden.map(o => `${o.opt.label}만 보면 ${o.e.v}px`).join('<br>');
    return `<div class="tile"><span class="k">${m.k}</span><span class="v">${x.value}px</span><span class="src">${esc(describeFrom(x.from))}</span>${notes ? `<span class="note">${notes}</span>` : ''}</div>`;
  });
  const text = [
    `<div class="tile"><span class="k">내비게이션</span><span class="v txt">${esc(r.nav)}</span><span class="src">${esc(r.picked.platform.label)}에서 흔한 방식</span></div>`,
    `<div class="tile"><span class="k">확인 단계</span><span class="v txt">${r.confirms.length ? r.confirms.map(esc).join('<br>') : '따로 두지 않음'}</span><span class="src">${esc(r.picked.skill.label)}에 맞춤</span></div>`,
  ];
  document.getElementById('tiles').innerHTML = numeric.concat(text).join('');
  document.getElementById('rules').innerHTML = [
    { s: '제약' }, { s: '관례' }, { s: '예시' },
  ].map(col => `<section><h3><span class="badge b-${col.s}">${STRENGTH_LABEL[col.s]}</span><small>${STRENGTH_HINT[col.s]}</small></h3><ul>
    ${r.rules[col.s].map(x => `<li>${esc(x.t)}<span class="meta">${esc(x.opt)}${x.src ? ' · ' + esc(x.src) : ''}</span></li>`).join('') || '<li class="meta">없음</li>'}
  </ul></section>`).concat(`<section><h3><span class="badge b-금지">쓰지 말 것</span><small>AI가 아무 이유 없이 넣는 흔한 버릇. 브랜드가 정했으면 그쪽을 따른다</small></h3><ul>${ANTI_DEFAULTS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`).join('');
  document.getElementById('md').textContent = buildMarkdown(r);
}

function buildMarkdown(r) {
  const p = r.picked;
  const line = x => `- ${x.t}${x.src ? ` (${x.src})` : ''}`;
  return [
    '---',
    '# 필드 이름은 DESIGN.md 규격과 맞추기 전 임시',
    'context:',
    ...VISIBLE_AXES.map(a => `  ${a.key}: ${p[a.key].id}   # ${p[a.key].label}`),
    ...(state.actionKind ? [`  action: ${state.actionKind}   # ${findOpt('action', state.actionKind).label}`] : []),
    'layout:',
    `  target-min: ${r.params.targetMin.value}px`,
    `  font-base: ${r.params.fontBase.value}px`,
    `  row-height: ${r.params.rowHeight.value}px`,
    `  spacing: ${r.params.space.value}px`,
    'brand: {}   # 색·서체·로고는 브랜드에서 채운다',
    '---',
    '',
    `# ${pickedText()}`,
    '',
    '## 화면 구조',
    `- 내비게이션: ${r.nav}`,
    ...r.confirms.map(c => `- 확인 단계: ${c}`),
    '',
    `## ${STRENGTH_LABEL['제약']} — ${STRENGTH_HINT['제약']}`, ...r.rules['제약'].map(line), '',
    `## ${STRENGTH_LABEL['관례']} — ${STRENGTH_HINT['관례']}`, ...r.rules['관례'].map(line), '',
    `## ${STRENGTH_LABEL['예시']}`, ...r.rules['예시'].map(line), '',
    '## 패턴별 방식',
    ...PATTERNS.map(pat => {
      const res = scorePattern(pat, sel);
      const why = res.neutral ? '고른 조건과 직접 걸리는 근거 없음, 가장 흔한 방식' : res.best.hits.map(reasonText).join(' / ');
      const kind = pat.action && state.actionKind ? ` (${findOpt('action', state.actionKind).label} 기준)` : '';
      return `- ${pat.name}${kind}: ${res.best.o.name} — ${why}`;
    }),
    '',
    '## 쓰지 말 것', ...ANTI_DEFAULTS.map(t => `- ${t}`), '',
    '## 원칙',
    '<!-- 데이터에서 나오지 않는 판단. 사람이 채운다 -->',
  ].join('\n');
}

function render() {
  save();
  renderAxes();
  renderList();
  renderRules();
}

document.getElementById('axes').addEventListener('click', e => {
  const b = e.target.closest('button[data-opt]');
  if (!b) return;
  const { axis, opt } = b.dataset;
  // 고른 것을 다시 누르면 고르지 않은 것으로 돌린다
  if (axis === 'action') state.actionKind = state.actionKind === opt ? null : opt;
  else if (sel[axis] === opt) delete sel[axis];
  else sel[axis] = opt;
  render();
  document.querySelector(`#axes button[data-axis="${axis}"][data-opt="${opt}"]`)?.focus();
});
document.getElementById('clear-pick').addEventListener('click', () => {
  VISIBLE_AXES.forEach(a => { delete sel[a.key]; });
  state.actionKind = null;
  render();
});
document.getElementById('copy').addEventListener('click', e => {
  const btn = e.currentTarget;
  const text = document.getElementById('md').textContent;
  const selectFallback = () => {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('md'));
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(range);
    btn.textContent = '선택됨, ⌘C로 복사';
  };
  try { navigator.clipboard.writeText(text).then(() => { btn.textContent = '복사됨'; }, selectFallback); } catch (err) { selectFallback(); }
  setTimeout(() => { btn.textContent = '복사'; }, 2200);
});

render();
