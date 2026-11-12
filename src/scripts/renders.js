// 방식마다 예시 그림을 그리는 함수. 키는 data/elements.json의 요소 id → 방식 id
import { AXES, ACTION_AXIS, ANTI_DEFAULTS, DOMAIN_UI, DOMAIN_TEXT, NOTIFY_TEXT, HINT_TEXT, GROUP_ORDER, PATTERNS, state, DEFAULT_SELECTION, SAMPLE_BY_CONTENT, PARAM_META, CONVENTION_ORDER, axisByKey, findOpt, isValidSel, VISIBLE_AXES, resolve, describeFrom, comboText, AXIS_ORDER, axesOf, patternById, SCORE, axisLabel, scorePattern, reasonText, CATALOG_BASE, typicalSel } from './core.js';
import { ICONS, icon, esc, STATUS_CLASS, hueOf, FRAG_W, BTN_PX, PLAIN_WORDS, FRAG_CHROME, ctxOf, fragHTML, ctaPlace, ctaSize, actionArea, kvLines, btnStyle, rowsHTML, statusItems, titleBar, styledValue, statusChip, cartOf, confirmBox } from './draw.js';

/* 가벼운 메뉴 안 내용. 프로필 메뉴처럼 세로 목록, 항목 앞 아이콘, 묶음 사이 선(LEARNED.md 4절) */
const POP_ITEMS = [['user', '내 정보'], ['bell', '알림 설정'], ['gear', '설정'], ['list', '도움말']];
const popMenu = x => `<div class="pop-head"><b>김하늘</b><span class="m-sub">haneul@example.com</span></div>${POP_ITEMS.map(([i, t]) => `<span class="pop-item" style="min-height:${Math.max(x.t, 36)}px">${icon(i)}<span>${t}</span></span>`).join('')}<span class="pop-sep"></span><span class="pop-item muted" style="min-height:${Math.max(x.t, 36)}px">로그아웃</span>`;

/* 동의 항목 한 줄: 체크, [필수]·[선택], 「보기」. 미리 체크해 두지 않는다(UX 기준 속임-1) */
const agreeRow = (x, label, on = false, view = true) => `<div class="m-kv" style="align-items:center;min-height:${Math.max(x.t, 36)}px"><span class="cbox-row"><i class="m-check ${on ? 'on' : ''}"></i><span>${label}</span></span>${view ? '<span class="more-link">보기</span>' : ''}</div>`;
/* 운영체제·브라우저가 띄우는 창. 앱 화면과 다르게 가운데 작은 창으로 그린다 */
const systemDialog = (x, title, body, no, yes) => `<div class="m-overlay fr-ov" style="align-items:center;padding:24px"><div class="m-dialog fr-dialog" style="width:84%;border-radius:14px;text-align:center;gap:10px"><b>${title}</b><span class="m-sub">${body}</span><div class="m-actions" style="grid-template-columns:1fr 1fr"><span class="m-btn ghost block" style="${btnStyle(x, 'sm')}">${no}</span><span class="m-btn ghost block" style="${btnStyle(x, 'sm')};font-weight:700">${yes}</span></div></div></div>`;
const star = on => `<span style="color:${on ? 'var(--warn)' : 'var(--line)'}">${icon('star').replace('fill="none"', on ? 'fill="currentColor"' : 'fill="none"')}</span>`;
const stars = (n, size = 28) => `<div style="display:flex;gap:6px;justify-content:center;font-size:${size}px">${[0, 1, 2, 3, 4].map(i => star(i < n)).join('')}</div>`;
/* 신청 뒤 진행 상태 그림에 쓰는 샘플. 업종에 치우치지 않게 환불 신청으로 둔다 */
const TRACK_STEPS = ['접수', '검토', '완료'];

export const RENDERS = {
  loading: {
    none: x => `<div class="fr-pad fr-stack">${titleBar(x, '<span class="m-sub">고치면 바로 바뀌어요</span>')}${rowsHTML(x, 3)}</div>`,
    skeleton: () => `<div class="fr-pad fr-stack">${[0, 1, 2].map(() => '<div class="sk-row"><span class="sk sk-thumb"></span><div class="sk-lines"><span class="sk" style="width:72%"></span><span class="sk" style="width:38%"></span></div></div>').join('')}</div>`,
    spinner: () => '<div class="fr-pad fr-center" style="min-height:190px"><span class="spin"></span><span class="m-sub">불러오는 중</span></div>',
    progress: x => `<div class="fr-pad fr-stack" style="min-height:190px;justify-content:center"><b>${esc(x.T.making)}</b><div class="pbar"><span style="width:62%"></span></div><span class="m-sub">3단계 중 2단계 · 창을 닫지 마세요</span></div>`,
    optimistic: x => {
          const its = statusItems(x).slice(0, 3);
          return `<div>${its.map((it, i) => `<div class="fr-rowitem ${i === 0 ? 'hl' : ''}" style="min-height:${Math.max(x.t, 48)}px"><div class="m-cell" style="flex:1"><span class="m-name">${esc(it.n)}</span><span class="m-sub">${i === 0 ? '방금 바꿈 · 저장 중' : esc(it.sub)}</span></div>${i === 0 ? '<span class="m-st s-busy">조리 중</span>' : statusChip(it)}</div>`).join('')}</div>`;
        },
    illus: x => `<div class="fr-pad fr-empty" style="min-height:220px"><div class="illus"><i></i><i></i><i></i></div><b>${esc(x.T.making)}</b><span class="m-sub">거의 다 됐어요. 잠깐만 기다려 주세요</span><span class="spin sm"></span></div>`,
  },
  busy: {
    inline: x => actionArea(x, full => `<span class="m-btn ${full ? 'block' : ''}" style="${btnStyle(x, ctaSize(x))};min-width:120px"><span class="spin sm inv"></span></span>`),
    label: x => actionArea(x, full => `<span class="m-btn is-off ${full ? 'block' : ''}" style="${btnStyle(x, ctaSize(x))}">${esc(x.T.doing)}</span>`),
    block: x => `<div class="fr-confirm">${actionArea(x, full => `<span class="m-btn ${full ? 'block' : ''}" style="${btnStyle(x, ctaSize(x))}">${esc(x.D.confirm.ok)}</span>`)}<div class="m-overlay fr-ov"><div class="fr-blockcard"><span class="spin"></span><b>${esc(x.T.progress)}</b><span class="m-sub">화면을 닫지 마세요</span></div></div></div>`,
  },
  empty: {
    action: x => `<div class="fr-pad fr-empty"><span class="big-ico">${icon(x.D.btnIcon)}</span><b>${esc(x.T.empty[0])}</b><span class="m-btn" style="${btnStyle(x, 'md')}">${esc(x.T.empty[1])}</span></div>`,
    illus: x => `<div class="fr-pad fr-empty"><div class="illus"><i></i><i></i><i></i></div><b>${esc(x.T.empty[0])}</b><span class="m-sub">생기면 여기에 모아 둘게요</span></div>`,
    clear: x => `<div class="fr-pad fr-stack"><div class="m-chips" style="flex-wrap:wrap">${x.D.cats.slice(1, 3).map(c => `<span class="m-chip on">${esc(c)} ×</span>`).join('')}</div><div class="fr-empty" style="min-height:150px"><b>조건에 맞는 결과가 없어요</b><span class="m-sub">조건을 하나씩 풀어 보세요</span><span class="m-btn ghost" style="${btnStyle(x, 'md')}">조건 모두 지우기</span></div></div>`,
    text: x => `<div class="fr-pad"><div class="m-kv m-sub fr-line"><span>${esc(x.D.th.name)}</span><span>${esc(x.D.th.value)}</span></div><div class="m-sub" style="text-align:center;padding:22px 0">${esc(x.T.empty[0])}</div></div>`,
  },
  error: {
    inline: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.D.inputText[0])}</span><div class="fr-input err" style="min-height:${Math.max(x.t, 44)}px">${esc(x.D.inputText[1])}</div><span class="err-text">${icon('alert')}40자까지 쓸 수 있어요. 지금 52자예요</span></div>`,
    toast: x => `<div class="fr-confirm" style="height:210px"><div class="fr-pad">${rowsHTML(x)}</div><div class="toast">${esc(x.T.error)}<span class="toast-act">다시 시도</span></div></div>`,
    full: x => `<div class="fr-pad fr-empty" style="min-height:230px"><span class="big-ico err">${icon('alert')}</span><b>${esc(x.T.error)}</b><span class="m-sub">연결을 확인한 뒤 다시 눌러 주세요</span><span class="m-btn" style="${btnStyle(x, 'lg')}">다시 시도</span></div>`,
    dialog: x => `<div class="fr-confirm" style="height:230px"><div class="fr-pad">${rowsHTML(x)}</div><div class="m-overlay fr-ov"><div class="m-dialog fr-dialog"><b>${esc(x.T.error)}</b><span class="m-sub">연결을 확인한 뒤 다시 시도해 주세요</span><div class="m-actions"><span class="m-btn ghost block" style="${btnStyle(x, 'sm')}">닫기</span><span class="m-btn block" style="${btnStyle(x, 'sm')}">다시 시도</span></div></div></div></div>`,
  },
  done: {
    toast: x => `<div class="fr-confirm" style="height:210px"><div class="fr-pad">${rowsHTML(x)}</div><div class="toast">${icon('check')}${esc(x.T.done[0])}</div></div>`,
    inline: x => `<div class="fr-pad fr-stack">${rowsHTML(x, 3)}<div class="fr-tools" style="justify-content:flex-start;align-items:center"><span class="m-btn ghost" style="${btnStyle(x, 'sm')}">${icon('check')}<span>복사했어요</span></span><span class="m-sub">잠시 뒤 「링크 복사」로 돌아가요</span></div></div>`,
    undo: x => `<div class="fr-confirm" style="height:210px"><div class="fr-pad">${rowsHTML(x, 3, 1)}</div><div class="toast">${esc(x.T.removed)}<span class="toast-act">되돌리기</span></div></div>`,
    screen: x => `<div class="fr-pad fr-empty" style="min-height:240px"><span class="done-mark">${icon('check')}</span><b style="font-size:1.2em">${esc(x.T.done[0])}</b><span class="m-sub">${esc(x.T.done[1])}</span><span class="m-btn" style="${btnStyle(x, 'lg')}">확인</span></div>`,
  },
  tracking: {
    steps: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">환불 신청</b><div class="steps">${TRACK_STEPS.map((s, i) => `<span class="${i === 1 ? 'on' : ''}"><i>${i === 0 ? icon('check') : i + 1}</i>${s}</span>`).join('')}</div><div class="hint">${icon('clock')}<span>서류를 검토하고 있어요. 11월 15일까지 결과를 알려 드려요</span></div><div class="m-kv m-sub"><span>접수 번호</span><span class="num">R-20261110-0412</span></div></div>`,
    timeline: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">환불 신청 기록</b><div style="display:grid;gap:12px;border-left:2px solid var(--line);padding-left:14px">${[['11.12 14:20', '담당자가 서류를 검토하고 있어요', true], ['11.11 09:05', '보내 주신 서류를 받았어요'], ['11.10 18:31', '환불을 신청했어요']].map(([t, s, on]) => `<div style="display:grid;gap:2px"><span class="m-sub" style="font-variant-numeric:tabular-nums">${t}</span><span style="${on ? 'font-weight:600' : 'color:var(--muted)'}">${s}</span></div>`).join('')}</div></div>`,
    line: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">환불 신청</b><div class="hint">${icon('bell')}<span><b>서류 검토 중</b> · 11월 15일까지 결과를 알림으로 보내 드려요</span></div>${kvLines([['신청한 날', '11.10'], ['접수 번호', 'R-20261110-0412']])}</div>`,
  },
  notify: {
    badge: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn badge-wrap">${icon('bell')}<i class="count">2</i></span>`)}${rowsHTML(x, 3)}</div>`,
    banner: x => `<div class="notice-bar">${icon('bell')}<span>${esc(NOTIFY_TEXT[x.dom])}</span><b>보기</b></div><div class="fr-pad">${rowsHTML(x, 3)}</div>`,
    modal: x => `<div class="fr-confirm" style="min-height:240px"><div class="fr-pad">${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov"><div class="fr-blockcard">${icon('bell')}<b style="font-size:1.2em">${esc(NOTIFY_TEXT[x.dom])}</b><span class="m-btn" style="${btnStyle(x, 'md')}">확인</span></div></div></div>`,
  },
  session: {
    warn: x => `<div class="fr-confirm" style="min-height:260px"><div class="fr-pad">${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov"><div class="m-dialog fr-dialog"><b>곧 로그아웃돼요</b><b class="num" style="font-size:1.6em">1:58</b><span class="m-sub">계속 쓰려면 연장해 주세요. 쓰던 내용은 그대로 있어요</span><div class="m-actions"><span class="m-btn ghost block" style="${btnStyle(x, 'sm')}">로그아웃</span><span class="m-btn block" style="${btnStyle(x, 'sm')}">연장하기</span></div></div></div></div>`,
    auto: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.D.inputText[0])}</span><div class="fr-input" style="min-height:${Math.max(x.t, 40)}px">${esc(x.D.inputText[1])}<span class="fr-caret"></span></div><span class="m-sub">${icon('clock')} 쓰는 동안은 로그인이 이어져요. 30분 동안 아무것도 안 하면 미리 알려 드려요</span></div>`,
    resume: x => `<div class="fr-pad fr-empty" style="min-height:230px"><span class="big-ico">${icon('user')}</span><b>30분 동안 쓰지 않아 로그아웃했어요</b><span class="m-sub">다시 로그인하면 쓰던 화면으로 돌아가요</span><span class="m-btn" style="${btnStyle(x, 'lg')}">다시 로그인</span></div>`,
  },
  onboarding: {
    none: x => `<div class="fr-pad fr-stack">${titleBar(x)}${rowsHTML(x, 3)}</div>`,
    inline: x => `<div class="fr-pad fr-stack">${titleBar(x)}<div class="hint">${icon('alert')}${esc(HINT_TEXT[x.dom])}</div>${rowsHTML(x, 3)}</div>`,
    coach: x => `<div class="fr-confirm"><div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn">${icon('bell')}</span>`)}${rowsHTML(x, 3)}</div><div class="coach">새 소식은 여기에 모여요<b>알겠어요</b></div></div>`,
    sample: x => `<div class="fr-pad fr-stack">${titleBar(x, '<span class="m-st s-new">예시 데이터</span>')}${rowsHTML(x, 3)}<span class="m-btn block" style="${btnStyle(x, 'md')}">내 것으로 시작하기</span></div>`,
    tour: x => `<div class="fr-pad fr-empty" style="min-height:240px"><span class="big-ico">${icon(x.D.btnIcon)}</span><b style="font-size:1.2em">${esc(HINT_TEXT[x.dom])}</b><div class="dots"><i class="on"></i><i></i><i></i></div><span class="m-btn" style="${btnStyle(x, 'md')}">다음</span></div>`,
    walkthrough: x => `<div class="fr-pad fr-stack" style="min-height:240px"><span class="m-sub">2 / 3</span><b style="font-size:1.2em">홈 화면에 위젯 추가하기</b>${['홈 화면 빈 곳을 길게 누르세요', '왼쪽 위 + 를 누르세요', '목록에서 앱을 고르세요'].map((s, i) => `<div class="walk-row ${i === 1 ? 'on' : ''}"><i>${i + 1}</i><span>${s}</span></div>`).join('')}<span class="m-spacer"></span><span class="m-btn block" style="${btnStyle(x, 'md')}">다 했어요</span></div>`,
  },
  more: {
    pages: x => `<div class="fr-pad">${rowsHTML(x, 4)}<div class="pager">${['‹', '1', '2', '3', '…', '12', '›'].map((p, i) => `<span class="${i === 1 ? 'on' : ''}" style="min-width:${Math.max(x.t, 30)}px;min-height:${Math.max(x.t, 30)}px">${p}</span>`).join('')}</div></div>`,
    button: x => `<div class="fr-pad fr-stack">${rowsHTML(x, 3)}<span class="m-btn ghost block" style="${btnStyle(x, 'md')}">더보기 · 12개 남음</span></div>`,
    infinite: x => `<div class="fr-pad">${rowsHTML(x, 4)}<div class="fr-center" style="padding:12px"><span class="spin sm"></span></div></div>`,
  },
  refresh: {
    pull: x => `<div><div class="pull">${icon('arrowdown')}<span>놓으면 새로고침</span></div><div class="fr-pad" style="padding-top:4px">${rowsHTML(x)}</div></div>`,
    button: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="m-sub">14:32 기준</span><span class="m-icobtn">${icon('refresh')}</span>`)}${rowsHTML(x)}</div>`,
    live: x => {
          const its = x.D.items.slice(0, 3);
          return `<div class="fr-pad fr-stack">${titleBar(x, '<span class="live"><i></i>실시간</span>')}${its.map((it, i) => `<div class="m-kv fr-line ${i === 0 ? 'hl' : ''}"><span>${esc(it.n)}${i === 0 ? ' <span class="m-st s-new">새로 들어옴</span>' : ''}</span><span class="num">${esc(it.v)}</span></div>`).join('')}</div>`;
        },
  },
  category: {
    tabs: x => `<div><div class="ctabs">${x.D.cats.map((c, i) => `<span class="${i === 0 ? 'on' : ''}" style="min-height:${Math.max(x.t, 40)}px">${esc(c)}</span>`).join('')}</div><div class="fr-pad">${rowsHTML(x)}</div></div>`,
    chips: x => `<div class="fr-pad fr-stack"><div class="m-chips">${x.D.cats.concat(x.D.cats).map((c, i) => `<span class="m-chip ${i === 0 ? 'on' : ''}">${esc(c)}</span>`).join('')}</div>${rowsHTML(x)}</div>`,
    rail: x => `<div class="fr-row"><nav class="m-rail" style="width:116px;padding:12px 8px">${x.D.cats.map((c, i) => `<span class="m-rail-item ${i === 0 ? 'on' : ''}" style="padding:0 12px">${esc(c)}</span>`).join('')}</nav><div class="fr-main">${rowsHTML(x)}</div></div>`,
    dropdown: x => `<div class="fr-pad fr-stack"><div class="dd" style="min-height:${Math.max(x.t, 40)}px"><span>${esc(x.D.cats[0])}</span>${icon('down')}</div>${rowsHTML(x)}</div>`,
  },
  filter: {
    chips: x => `<div class="fr-pad fr-stack"><div class="m-chips" style="flex-wrap:wrap">${['할인 중', '무료 배송', '오늘 출발'].map((c, i) => `<span class="m-chip ${i < 2 ? 'on' : ''}">${c}</span>`).join('')}</div><span class="m-sub">24개</span>${rowsHTML(x)}</div>`,
    sheet: x => `<div class="fr-confirm" style="height:300px"><div class="fr-pad">${rowsHTML(x)}</div><div class="m-overlay fr-ov sheet"><div class="m-dialog fr-dialog sheet"><b>거르기</b><span class="m-sub">가격</span><div class="m-chips" style="flex-wrap:wrap">${['3만 원 이하', '3~5만 원', '5만 원 이상'].map((c, i) => `<span class="m-chip ${i === 1 ? 'on' : ''}">${c}</span>`).join('')}</div><span class="m-btn block" style="${btnStyle(x, 'md')}">결과 24개 보기</span></div></div></div>`,
    side: x => `<div class="fr-row"><div class="sidefilter">${x.D.cats.map((c, i) => `<span><i class="m-check ${i === 1 || i === 2 ? 'on' : ''}"></i>${esc(c)}</span>`).join('')}</div><div class="fr-main">${rowsHTML(x)}</div></div>`,
    bar: x => `<div class="fr-pad fr-stack"><div class="fr-tools" style="justify-content:flex-start;flex-wrap:nowrap">${[x.D.cats[0], '전체 기간', '최신순'].map(c => `<span class="dd" style="min-height:${Math.max(x.t, 36)}px;flex:1;min-width:0"><span>${esc(c)}</span>${icon('down')}</span>`).join('')}</div><span class="m-sub">24개</span>${rowsHTML(x, 3)}</div>`,
    none: x => `<div class="fr-pad fr-stack"><div class="ctabs" style="padding:0">${x.D.cats.slice(0, 3).map((c, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(c)}</span>`).join('')}</div>${rowsHTML(x)}</div>`,
  },
  nav: {
    sidebar: x => `<div class="fr-row" style="min-height:260px"><nav class="m-side" style="width:${x.expert ? 64 : 150}px;padding:14px 8px">${x.D.nav.map((n, i) => `<span class="m-nav-item ${i === 0 ? 'on' : ''}" ${x.expert ? 'style="justify-content:center;padding:0"' : ''}>${icon(x.D.navIcons[i])}${x.expert ? '' : `<span>${esc(n)}</span>`}</span>`).join('')}</nav><div class="fr-main">${titleBar(x)}${rowsHTML(x, 3)}</div></div>`,
    tabbar: x => `<div class="fr-col" style="min-height:300px"><div class="fr-pad fr-stack">${titleBar(x)}${rowsHTML(x, 3)}</div><span class="m-spacer"></span><div class="m-tabbar">${x.D.nav.map((n, i) => `<span class="m-tab ${i === 0 ? 'on' : ''}">${icon(x.D.navIcons[i])}${x.expert ? '' : `<span>${esc(n)}</span>`}</span>`).join('')}</div></div>`,
    top: x => `<div class="fr-topnav">${x.D.nav.map((n, i) => `<span class="m-nav-item ${i === 0 ? 'on' : ''}">${esc(n)}</span>`).join('')}</div><div class="fr-pad">${rowsHTML(x, 3)}</div>`,
    single: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="m-btn ghost" style="${btnStyle(x, 'md')}">처음으로</span>`)}${rowsHTML(x, 3)}</div>`,
  },
  search: {
    box: x => `<div class="fr-pad fr-stack">${titleBar(x)}<div class="m-search" style="width:100%;min-height:${Math.max(x.t, 36)}px">${icon('search')}<span class="grow">검색</span>${x.expert ? '<span class="m-kbd">/</span>' : ''}</div>${rowsHTML(x, 3)}</div>`,
    icon: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn">${icon('search')}</span>`)}${rowsHTML(x, 3)}</div>`,
    none: x => `<div class="fr-pad fr-stack">${titleBar(x)}<div class="m-chips" style="flex-wrap:wrap">${x.D.cats.map((c, i) => `<span class="m-chip ${i === 0 ? 'on' : ''}">${esc(c)}</span>`).join('')}</div>${rowsHTML(x, 3)}</div>`,
  },
  popover: {
    layer: x => `<div class="fr-confirm" style="min-height:400px"><div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn" style="border-color:var(--accent);color:var(--accent)">${icon('user')}</span>`)}${rowsHTML(x, 4)}</div><div class="pop">${popMenu(x)}</div></div>`,
    sheet: x => `<div class="fr-confirm" style="min-height:520px"><div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn">${icon('user')}</span>`)}${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov sheet light"><div class="pop sheet-pop">${popMenu(x)}</div></div></div>`,
    screen: x => `<div class="fr-col" style="min-height:300px"><div class="fr-topnav"><span class="m-icobtn">‹</span><b style="margin-left:8px">내 정보</b></div><div class="fr-pad"><div class="pop flat">${popMenu(x)}</div></div></div>`,
    modal: x => `<div class="fr-confirm" style="min-height:440px"><div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn">${icon('user')}</span>`)}${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov"><div class="pop mid-pop">${popMenu(x)}</div></div></div>`,
  },
  single: {
    radio: x => `<div class="fr-pad fr-stack" style="gap:0"><span class="fr-label" style="margin-bottom:6px">${esc(x.D.choice[0])}</span>${x.D.choice[1].map((o, i) => `<div class="radio-row" style="min-height:${Math.max(x.t, 44)}px"><i class="radio ${i === 1 ? 'on' : ''}"></i>${esc(o)}</div>`).join('')}</div>`,
    segment: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.D.choice[0])}</span><div class="segment">${x.D.choice[1].map((o, i) => `<span class="${i === 1 ? 'on' : ''}" style="min-height:${Math.max(x.t, 36)}px">${esc(o)}</span>`).join('')}</div></div>`,
    tiles: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.D.choice[0])}</span><div class="fr-choices">${x.D.choice[1].map((o, i) => `<span class="${i === 1 ? 'on' : ''}" style="min-height:${Math.max(x.t, 60)}px">${esc(o)}</span>`).join('')}</div></div>`,
    dropdown: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.D.choice[0])}</span><div class="dd" style="min-height:${Math.max(x.t, 40)}px"><span>${esc(x.D.choice[1][1])}</span>${icon('down')}</div></div>`,
  },
  qty: {
    stepper: x => {
          const s = Math.max(x.t, 40);
          return `<div class="fr-pad fr-stack">${x.D.items.filter(it => !it.status).slice(0, 2).map((it, i) => `<div class="m-kv" style="align-items:center"><div class="m-cell"><span class="m-name">${esc(it.n)}</span><span class="m-sub">${esc(it.v)}</span></div><span class="fr-stepper"><span style="width:${s}px;height:${s}px">−</span><b>${i + 1}</b><span style="width:${s}px;height:${s}px">+</span></span></div>`).join('')}</div>`;
        },
    input: x => `<div class="fr-pad fr-stack">${x.D.items.slice(0, 2).map((it, i) => `<div class="m-kv" style="align-items:center"><span class="m-name">${esc(it.n)}</span><span class="numbox" style="min-height:${Math.max(x.t, 36)}px">${i ? 12 : 120}<span class="m-sub">개</span></span></div>`).join('')}</div>`,
    select: x => `<div class="fr-pad fr-stack">${x.D.items.slice(0, 2).map((it, i) => `<div class="m-kv" style="align-items:center"><span class="m-name">${esc(it.n)}</span><span class="dd" style="min-height:${Math.max(x.t, 36)}px;width:96px"><span>${i + 1}개</span>${icon('down')}</span></div>`).join('')}</div>`,
  },
  toggle: {
    switch: x => `<div class="fr-pad"><div class="m-kv fr-line" style="align-items:center;min-height:${Math.max(x.t, 48)}px"><span>${esc(x.T.toggle)}</span><i class="switch on"></i></div><div class="m-kv fr-line" style="align-items:center;min-height:${Math.max(x.t, 48)}px"><span>야간 알림</span><i class="switch"></i></div></div>`,
    checkbox: x => `<div class="fr-pad fr-stack"><span class="cbox-row"><i class="m-check on"></i>${esc(x.T.toggle)}</span><span class="cbox-row"><i class="m-check"></i>야간 알림</span><div class="fr-tools"><span class="m-btn" style="${btnStyle(x, 'sm')}">저장</span></div></div>`,
    twobtn: x => `<div class="fr-pad fr-stack"><span class="fr-label">${esc(x.T.toggle)}</span><div class="segment">${['켜기', '끄기'].map((o, i) => `<span class="${i === 0 ? 'on' : ''}" style="min-height:${Math.max(x.t, 52)}px">${o}</span>`).join('')}</div></div>`,
  },
  validate: {
    live: x => `<div class="fr-pad fr-stack"><span class="fr-label">받는 계좌</span><div class="fr-input warn" style="min-height:${Math.max(x.t, 44)}px">123456-01-78<span class="fr-caret"></span></div><span class="warn-text">계좌번호가 4자리 모자라요</span></div>`,
    blur: x => `<div class="fr-pad fr-stack"><span class="fr-label">이메일</span><div class="fr-input err" style="min-height:${Math.max(x.t, 40)}px">hana@example</div><span class="err-text">${icon('alert')}@ 뒤 주소를 끝까지 써 주세요</span><span class="fr-label">연락처</span><div class="fr-input" style="min-height:${Math.max(x.t, 40)}px"><span class="fr-caret"></span></div></div>`,
    submit: x => `<div class="fr-pad fr-stack"><div class="err-box">${icon('alert')}2곳을 고쳐 주세요</div><div class="fr-input err" style="min-height:${Math.max(x.t, 36)}px">hana@example</div><div class="fr-input err" style="min-height:${Math.max(x.t, 36)}px">010-12</div><span class="m-btn" style="${btnStyle(x, 'md')}">보내기</span></div>`,
    lock: x => `<div class="fr-pad fr-stack" style="min-height:240px"><b style="font-size:1.2em">휴대폰 번호를 알려 주세요</b><div class="fr-input" style="min-height:${Math.max(x.t, 44)}px">010-1234<span class="fr-caret"></span></div><span class="m-sub">인증 번호를 문자로 보내요</span><span class="m-spacer"></span><span class="m-btn is-off block" style="${btnStyle(x, 'lg')}">다음</span></div>`,
  },
  upload: {
    drop: x => `<div class="fr-pad fr-stack"><span class="fr-label">파일 올리기</span><div class="dropzone">${icon('upload')}<b>파일을 여기에 끌어 놓거나 눌러서 고르세요</b><span class="m-sub">JPG·PNG·PDF · 10MB까지</span></div></div>`,
    button: x => `<div class="fr-pad fr-stack"><span class="fr-label">파일 올리기</span><span class="m-btn ghost" style="${btnStyle(x, 'md')};align-self:flex-start">${icon('upload')}<span>파일 고르기</span></span><span class="m-sub">JPG·PNG·PDF · 10MB까지</span></div>`,
    result: x => `<div class="fr-pad fr-stack"><div class="hint">${icon('check')}<span><b>파일 3개</b>를 올렸어요 · 사진 2 · PDF 1</span></div><div class="hint warn">${icon('alert')}<span>menu.pdf는 이미 올렸어요. 그래도 더할까요?</span></div><div class="dropzone" style="padding:14px">${icon('upload')}<span class="m-sub">더 올리려면 끌어 놓거나 누르세요</span></div></div>`,
  },
  consent: {
    all: x => `<div class="fr-pad fr-stack" style="gap:4px"><b class="m-ptitle">약관에 동의해 주세요</b>${agreeRow(x, '<b>모두 동의</b>', false, false)}<div class="fr-line" style="padding:0;min-height:0"></div>${agreeRow(x, '[필수] 이용약관')}${agreeRow(x, '[필수] 개인정보 수집·이용')}${agreeRow(x, '[선택] 혜택 알림 받기')}<span class="m-btn block" style="${btnStyle(x, ctaSize(x))};margin-top:10px">동의하고 계속</span></div>`,
    split: x => `<div class="fr-pad fr-stack" style="gap:4px"><b class="m-ptitle">약관에 동의해 주세요</b>${agreeRow(x, '[필수] 이용약관·개인정보 수집에 동의')}<span class="m-sub" style="margin-top:10px">선택 · 동의하지 않아도 가입할 수 있어요</span>${agreeRow(x, '[선택] 혜택 알림 받기')}<span class="m-btn block" style="${btnStyle(x, ctaSize(x))};margin-top:10px">가입하기</span></div>`,
    jit: x => `<div class="fr-confirm" style="min-height:320px"><div class="fr-pad"><div class="m-kv fr-line" style="align-items:center;min-height:${Math.max(x.t, 48)}px"><span>혜택 알림</span><i class="switch on"></i></div><div class="m-kv fr-line" style="align-items:center;min-height:${Math.max(x.t, 48)}px"><span>주문 알림</span><i class="switch on"></i></div></div><div class="m-overlay fr-ov sheet"><div class="m-dialog fr-dialog sheet"><b>혜택 알림을 받으려면 동의가 필요해요</b><span class="m-sub">[선택] 광고성 정보 수신 · 할인과 행사 소식을 보내요. 설정에서 언제든 끌 수 있어요</span><div class="m-actions"><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">받지 않기</span><span class="m-btn block" style="${btnStyle(x, 'md')}">동의하고 받기</span></div></div></div></div>`,
  },
  delete: {
    confirm: x => `<div class="fr-confirm" style="height:230px"><div class="fr-pad">${rowsHTML(x)}</div><div class="m-overlay fr-ov"><div class="m-dialog fr-dialog"><b>지울까요?</b><span class="m-sub">지운 뒤에는 되돌릴 수 없어요</span><div class="m-actions"><span class="m-btn ghost block" style="${btnStyle(x, 'sm')}">취소</span><span class="m-btn danger block" style="${btnStyle(x, 'sm')}">지우기</span></div></div></div></div>`,
    undo: x => `<div class="fr-confirm" style="height:210px"><div class="fr-pad">${rowsHTML(x, 3, 1)}</div><div class="toast">${esc(x.T.removed)}<span class="toast-act">되돌리기</span></div></div>`,
    swipe: x => {
          const its = x.D.items.slice(0, 3);
          return `<div class="fr-pad">${its.map((it, i) => `<div class="swipe-wrap">${i === 1 ? `<span class="swipe-del">${icon('trash')}삭제</span>` : ''}<div class="m-kv fr-line swipe-row ${i === 1 ? 'moved' : ''}"><span>${esc(it.n)}</span><span class="num">${esc(it.v)}</span></div></div>`).join('')}</div>`;
        },
  },
  confirmForm: {
    dialog: x => confirmBox(x, 'dialog'),
    sheet: x => confirmBox(x, 'sheet'),
    screen: x => {
          const k = x.D.confirm;
          return `<div class="fr-pad fr-stack" style="min-height:300px"><b class="m-title" style="font-size:1.3em">${esc(k.title)}</b><div class="m-dlines" style="font-size:1.05em">${kvLines(k.lines)}${k.total ? `<div class="m-kv m-total"><span>${esc(k.total[0])}</span><b class="num">${esc(k.total[1])}</b></div>` : ''}</div><span class="m-spacer"></span><span class="m-btn block ${k.danger ? 'danger' : ''}" style="${btnStyle(x, 'lg')}">${esc(k.ok)}</span><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">${esc(k.cancel)}</span></div>`;
        },
  },
  cta: {
    inline: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">${esc(x.D.btnTitle)}</b>${kvLines(x.D.btnCtx)}</div><div class="fr-foot"><span class="m-btn ghost" style="${btnStyle(x, 'sm')}">취소</span><span class="m-btn" style="${btnStyle(x, 'sm')}">${esc(x.D.confirm.ok)}</span></div>`,
    bottom: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">${esc(x.D.btnTitle)}</b>${kvLines(x.D.btnCtx)}</div><div class="m-bottomcta"><span class="m-btn block" style="${btnStyle(x, 'lg')}">${esc(x.D.confirm.ok)}</span></div><div class="fr-home"><i></i></div>`,
    panel: x => `<div class="m-panel fr-panel"><b class="m-ptitle">${esc(x.D.btnTitle)}</b>${kvLines(x.D.btnCtx)}<div style="height:14px"></div><span class="m-btn block" style="${btnStyle(x, x.guest ? 'xl' : 'lg')}">${esc(x.D.confirm.ok)}</span></div>`,
    barRight: x => {
          // 내용의 마지막 줄(합계·금액)을 바 왼쪽으로 옮긴다
          const [k, v] = x.D.btnCtx.at(-1);
          return `<div class="fr-pad fr-stack"><b class="m-ptitle">${esc(x.D.btnTitle)}</b>${kvLines(x.D.btnCtx.slice(0, -1))}</div><div class="m-bottomcta fr-bar"><div class="fr-bar-info"><span class="m-sub">${esc(k)}</span><b class="num">${esc(v)}</b></div><span class="m-btn" style="${btnStyle(x, ctaSize(x))}">${esc(x.D.confirm.ok)}</span></div><div class="fr-home"><i></i></div>`;
        },
  },
  cartPlace: {
    panel: x => `<div class="fr-row"><div class="fr-main">${rowsHTML(x, 3)}</div><div class="m-panel fr-panel side"><b class="m-ptitle">${esc(cartOf(x).title)}</b>${kvLines(cartOf(x).lines)}<div class="m-kv m-total"><span>합계</span><b class="num">${esc(cartOf(x).total)}</b></div><span class="m-btn block" style="${btnStyle(x, ctaSize(x))}">${esc(cartOf(x).cta)}</span></div></div>`,
    bar: x => `<div class="fr-pad">${rowsHTML(x, 3)}</div><div class="m-bottomcta fr-bar"><div class="fr-bar-info"><span class="m-sub">${cartOf(x).lines.length}개 담음</span><b class="num">${esc(cartOf(x).total)}</b></div><span class="m-btn" style="${btnStyle(x, ctaSize(x))}">${esc(cartOf(x).cta)}</span></div>`,
    icon: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="m-icobtn badge-wrap">${icon('cart')}<i class="count">${cartOf(x).lines.length}</i></span>`)}${rowsHTML(x, 3)}</div>`,
  },
  steps: {
    stepper: x => `<div class="fr-pad fr-stack"><div class="steps">${['정보', '확인', '완료'].map((s, i) => `<span class="${i === 0 ? 'on' : ''}"><i>${i + 1}</i>${s}</span>`).join('')}</div><span class="fr-label">${esc(x.D.inputText[0])}</span><div class="fr-input" style="min-height:${Math.max(x.t, 40)}px">${esc(x.D.inputText[1])}</div><span class="m-btn block" style="${btnStyle(x, ctaSize(x))}">다음</span></div>`,
    onepage: x => `<div class="fr-pad fr-stack">${['이름', '연락처', esc(x.D.inputText[0])].map((l, i) => `<span class="fr-label">${l}</span><div class="fr-input" style="min-height:${Math.max(x.t, 36)}px;border-color:var(--line)">${i === 2 ? esc(x.D.inputText[1]) : ''}</div>`).join('')}<span class="m-btn" style="${btnStyle(x, ctaSize(x))};align-self:flex-end">저장</span></div>`,
    wizard: x => `<div class="fr-pad fr-stack" style="min-height:260px"><span class="m-sub">1 / 3</span><b style="font-size:1.4em;line-height:1.3">${esc(x.D.choice[0])}</b><div class="fr-choices">${x.D.choice[1].map((o, i) => `<span class="${i === 1 ? 'on' : ''}" style="min-height:${Math.max(x.t, 56)}px">${esc(o)}</span>`).join('')}</div></div>`,
  },
  permission: {
    direct: x => `<div class="fr-confirm" style="min-height:280px"><div class="fr-pad fr-stack"><b class="m-ptitle">영수증 올리기</b><span class="m-btn" style="${btnStyle(x, 'md')};align-self:flex-start;outline:2px solid var(--accent);outline-offset:2px">${icon('camera')}<span>사진 찍기</span></span>${rowsHTML(x, 2)}</div>${systemDialog(x, '카메라에 접근하려고 해요', '영수증을 찍어 바로 올리려고 카메라를 써요', '허용 안 함', '허용')}</div>`,
    primer: x => `<div class="fr-pad fr-empty" style="min-height:280px"><span class="big-ico">${icon('bell')}</span><b style="font-size:1.15em">신청 결과가 나오면 알림으로 알려 드려요</b><span class="m-sub">알림을 꺼도 앱 안 알림함에서는 볼 수 있어요</span><div class="m-actions" style="width:100%"><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">나중에</span><span class="m-btn block" style="${btnStyle(x, 'md')}">계속</span></div></div>`,
    settings: x => `<div class="fr-pad fr-stack"><b class="m-ptitle">가까운 곳 찾기</b><div class="hint warn">${icon('pin')}<span>위치 권한이 꺼져 있어 지금 위치로 찾을 수 없어요. <b class="more-link">설정에서 켜기</b></span></div><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">주소를 직접 입력하기</span></div>`,
  },
  survey: {
    inline: x => `<div class="fr-pad fr-stack">${rowsHTML(x, 2)}<div class="fr-stack" style="gap:8px;padding:12px;border:1px solid var(--line);border-radius:10px"><b>이 안내가 도움이 됐나요?</b><div class="fr-tools" style="justify-content:flex-start"><span class="m-btn ghost" style="${btnStyle(x, 'sm')}">도움이 됐어요</span><span class="m-btn ghost" style="${btnStyle(x, 'sm')}">아니요</span></div></div></div>`,
    sheet: x => `<div class="fr-confirm" style="min-height:330px"><div class="fr-pad">${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov sheet"><div class="m-dialog fr-dialog sheet" style="justify-items:center;text-align:center"><b>이용은 어땠나요?</b>${stars(4)}<div class="fr-input" style="width:100%;min-height:${Math.max(x.t, 44)}px;border-color:var(--line);color:var(--muted)">더 하고 싶은 말(선택)</div><div class="m-actions" style="width:100%"><span class="m-btn ghost block" style="${btnStyle(x, 'md')}">다음에</span><span class="m-btn block" style="${btnStyle(x, 'md')}">보내기</span></div></div></div></div>`,
    store: x => `<div class="fr-confirm" style="min-height:280px"><div class="fr-pad">${rowsHTML(x, 4)}</div><div class="m-overlay fr-ov" style="align-items:center;padding:24px"><div class="m-dialog fr-dialog" style="width:84%;border-radius:14px;text-align:center;justify-items:center;gap:10px"><span class="big-ico" style="border-radius:12px">${icon('star')}</span><b>앱 스토어에 별점을 남겨 주세요</b>${stars(0, 26)}<span class="m-btn ghost block" style="${btnStyle(x, 'sm')}">나중에</span></div></div></div>`,
    none: x => `<div class="fr-col" style="min-height:250px"><div class="fr-pad fr-stack">${titleBar(x)}${rowsHTML(x, 3)}</div><span class="m-spacer"></span><div class="fr-pad m-kv m-sub" style="border-top:1px solid var(--line)"><span>버전 2.4.1</span><span class="more-link">의견 보내기</span></div></div>`,
  },
  longText: {
    ellipsis: x => `<div class="fr-pad fr-stack"><b>${esc(x.D.items[0].n)}</b><span class="clamp1">${esc(x.T.long)}</span></div>`,
    expand: x => `<div class="fr-pad fr-stack"><b>${esc(x.D.items[0].n)}</b><span class="clamp2">${esc(x.T.long)}</span><span class="more-link">더보기</span></div>`,
    full: x => `<div class="fr-pad fr-stack"><b>${esc(x.D.items[0].n)}</b><span>${esc(x.T.long)}</span></div>`,
  },
  noImage: {
    placeholder: x => `<div class="fr-pad"><div class="m-grid" style="--cols:2;gap:10px">${x.D.items.slice(0, 2).map((it, i) => `<div class="m-card">${i === 1 ? `<div class="m-photo ph-empty">${icon('photo')}</div>` : `<div class="m-photo" style="--hue:${hueOf(it, i)}"></div>`}<span class="m-name">${esc(it.n)}</span><b>${esc(it.v)}</b></div>`).join('')}</div></div>`,
    initial: x => `<div class="fr-pad">${x.D.items.slice(0, 3).map(it => `<div class="m-kv fr-line" style="align-items:center;justify-content:flex-start;gap:10px"><span class="initial">${esc(it.n.replace('#', '').charAt(0))}</span><span style="flex:1">${esc(it.n)}</span><span class="num">${esc(it.v)}</span></div>`).join('')}</div>`,
    collapse: x => `<div class="fr-pad">${rowsHTML(x)}</div>`,
  },
  statusMark: {
    chip: x => `<div>${statusItems(x).slice(0, 4).map(it => `<div class="fr-rowitem" style="min-height:${Math.max(x.t, 44)}px"><span style="flex:1">${esc(it.n)}</span>${statusChip(it, x.guest)}</div>`).join('')}</div>`,
    dot: x => `<div>${statusItems(x).slice(0, 4).map(it => `<div class="fr-rowitem" style="min-height:${Math.max(x.t, 44)}px"><span style="flex:1">${esc(it.n)}</span><span class="dot-label"><i class="dot d-${STATUS_CLASS[it.status]}"></i>${esc(it.status)}</span></div>`).join('')}</div>`,
    color: x => `<div>${statusItems(x).slice(0, 4).map(it => `<div class="fr-rowitem" style="min-height:${Math.max(x.t, 44)}px"><span style="flex:1">${esc(it.n)}</span><i class="dot d-${STATUS_CLASS[it.status]}"></i></div>`).join('')}</div>`,
  },
  time: {
    relative: x => `<div class="fr-pad">${x.D.items.slice(0, 3).map((it, i) => `<div class="m-kv fr-line"><span>${esc(it.n)}</span><span class="m-sub">${['3분 전', '12분 전', '1시간 전'][i]}</span></div>`).join('')}</div>`,
    absolute: x => `<div class="fr-pad">${x.D.items.slice(0, 3).map((it, i) => `<div class="m-kv fr-line"><span>${esc(it.n)}</span><span class="m-sub num">${['10.26 14:32', '10.26 14:20', '10.26 13:31'][i]}</span></div>`).join('')}</div>`,
    both: x => `<div class="fr-pad">${x.D.items.slice(0, 3).map((it, i) => `<div class="m-kv fr-line"><span>${esc(it.n)}</span><span class="m-sub num">${['3분 전 · 14:32', '15분 전 · 14:20', '1시간 전 · 13:31'][i]}</span></div>`).join('')}</div>`,
  },
  help: {
    text: x => `<div class="fr-pad fr-stack" style="gap:6px"><span class="fr-label">사업자 등록 번호</span><div class="fr-input" style="min-height:${Math.max(x.t, 44)}px">123-45-<span class="fr-caret"></span></div><span class="m-sub">숫자 10자리예요. 사업자 등록증 맨 위에 있어요</span></div>`,
    expand: x => `<div class="fr-pad fr-stack" style="gap:6px"><span class="fr-label">통신판매업 신고 번호</span><div class="fr-input" style="min-height:${Math.max(x.t, 44)}px;border-color:var(--line)"></div><span class="more-link" style="display:flex;gap:4px;align-items:center;min-height:${Math.max(x.t, 32)}px">${icon('help')}이게 뭔가요?</span><div style="padding:12px;border-radius:8px;background:var(--bg);font-size:.92em">온라인으로 물건을 팔 때 구청에 신고하고 받는 번호예요. 아직 없으면 비워 두고 나중에 넣어도 돼요</div></div>`,
    center: x => `<div class="fr-pad fr-stack">${titleBar(x, `<span class="more-link" style="display:flex;gap:4px;align-items:center;min-height:${Math.max(x.t, 32)}px">${icon('help')}도움말</span>`)}${rowsHTML(x, 3)}</div>`,
    chat: x => `<div class="fr-confirm" style="min-height:300px"><div class="fr-pad fr-stack">${titleBar(x)}${rowsHTML(x, 3)}</div><div style="position:absolute;right:16px;bottom:16px;display:grid;gap:8px;justify-items:end"><div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:.88em;box-shadow:0 6px 18px rgba(0,0,0,.12)"><b>상담원 연결까지 약 3분</b><br><span class="m-sub">평일 9시~18시</span></div><span class="m-btn" style="${btnStyle(x, 'md')};border-radius:999px">${icon('chat')}<span>상담하기</span></span></div></div>`,
  },
};

PATTERNS.forEach(p => p.options.forEach(o => {
  o.render = RENDERS[p.id]?.[o.id];
  if (!o.render) throw new Error(`그림 함수가 없다: ${p.id}.${o.id}`);
}));
