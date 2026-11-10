#!/usr/bin/env node
// 브랜드 색 하나에서 색 단계(50~900)와 회색 단계를 만들고, 화면 역할(주 버튼, 누를 때, 고른 항목 바탕, 테두리 등)마다 어느 단계를 쓸지 대비를 재서 정한다
// 쓰는 법: node palette.mjs --brand "#1d5fd1"            (hex, rgb(), oklch() 하나)
//          node palette.mjs --brand "#1d5fd1" --json     (숫자만)
//          node palette.mjs --brand "#e8590c" --name orange   (변수 이름 앞부분. 없으면 brand)
// 생각은 jakub.kr의 better-colors(github.com/jakubkrehel/skills, MIT)에서 얻었다(2026-11-10):
//   색은 즉석에서 만들지 않고 단계에서 고른다. 한 단계 안에서 색상은 OKLCH로 15도 안에 두고 밝기만 고르게 바꾼다. 상태색이 강조색과 15도 안이면 떼어 놓는다
//   기본 단계 값(밝기·채도 비율)은 이 저장소에서 정한 출발점이다. 정답이 아니니 화면에서 보고 고친다
const args = process.argv.slice(2);
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const input = val('--brand');
if (!input) { console.error('브랜드 색을 넣어 주세요. 예: node palette.mjs --brand "#1d5fd1"'); process.exit(1); }
const name = (val('--name') || 'brand').replace(/[^\w-]/g, '');

// ---- 색 바꾸기(sRGB ↔ OKLab ↔ OKLCH) ----
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function rgbToOklch({ r, g, b }) {
  const [R, G, B] = [r, g, b].map(v => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), H: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}
// 화면에 낼 수 있는 색(sRGB 안)인지와 값을 함께 돌려준다
function oklchToRgb({ L, C, H }) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const inGamut = lr.every(v => v >= -1e-4 && v <= 1 + 1e-4);
  const [r, g, bl] = lr.map(v => Math.round(Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, v))))) * 255));
  return { r, g, b: bl, inGamut };
}
// 채도를 줄여 화면에 낼 수 있는 색으로(색상·밝기는 그대로)
function fit({ L, C, H }) {
  if (oklchToRgb({ L, C, H }).inGamut) return { L, C, H };
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (oklchToRgb({ L, C: mid, H }).inGamut) lo = mid; else hi = mid; }
  return { L, C: lo, H };
}
const hex = ({ r, g, b }) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
function parse(str) {
  str = String(str).trim().toLowerCase();
  let m = str.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) { let h = m[1]; if (h.length === 3) h = [...h].map(c => c + c).join(''); const n = parseInt(h, 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 }; }
  m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  m = str.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (m) { const L = m[2] ? +m[1] / 100 : +m[1]; const c = oklchToRgb(fit({ L, C: +m[3], H: +m[4] })); return { r: c.r, g: c.g, b: c.b }; }
  return null;
}
const lum = ({ r, g, b }) => { const [R, G, B] = [r, g, b].map(v => lin(v / 255)); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
const contrast = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
const r2 = n => Math.round(n * 100) / 100;

const brandRgb = parse(input);
if (!brandRgb) { console.error(`「${input}」을 읽지 못했다. #1d5fd1, rgb(29 95 209), oklch(0.52 0.18 260) 꼴로 넣는다`); process.exit(1); }
const brand = rgbToOklch(brandRgb);
const WHITE = { r: 255, g: 255, b: 255 }, INK = { r: 17, g: 17, b: 17 };

// ---- 단계 만들기 ----
// 밝은 쪽은 밝기 0.03~0.06 간격으로 촘촘히(바탕·고른 항목에 쓴다), 어두운 쪽은 0.08 간격
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const LS = [0.975, 0.945, 0.895, 0.825, 0.735, 0.645, 0.555, 0.47, 0.39, 0.31];
const CS = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.82, 0.7]; // 브랜드 채도에 곱하는 비율
const gray = brand.C < 0.03; // 브랜드가 거의 무채색이면 채도를 억지로 키우지 않는다
const ramp = STEPS.map((step, i) => {
  const c = fit({ L: LS[i], C: brand.C * CS[i], H: brand.H });
  const rgb = oklchToRgb(c);
  return { step, hex: hex(rgb), rgb, L: r2(c.L), onWhite: r2(contrast(rgb, WHITE)) };
});
// 브랜드 색 자체는 밝기가 가장 가까운 단계에 그대로 넣는다(브랜드 값이 바뀌지 않게)
const anchor = ramp.reduce((best, s) => (Math.abs(s.L - brand.L) < Math.abs(best.L - brand.L) ? s : best), ramp[0]);
Object.assign(anchor, { hex: hex(brandRgb), rgb: brandRgb, L: r2(brand.L), onWhite: r2(contrast(brandRgb, WHITE)), brand: true });
// 회색 단계: 브랜드 색상 쪽으로 아주 조금 기운을 넣는다(순수 회색보다 덜 밋밋하다. visual-basics.md 「회색에 기운」)
const NL = [0.985, 0.965, 0.925, 0.87, 0.72, 0.6, 0.5, 0.41, 0.32, 0.22];
const neutral = STEPS.map((step, i) => { const rgb = oklchToRgb(fit({ L: NL[i], C: gray ? 0 : Math.min(0.012, brand.C * 0.08), H: brand.H })); return { step, hex: hex(rgb), rgb, onWhite: r2(contrast(rgb, WHITE)) }; });

// ---- 역할마다 단계 고르기(대비를 재서) ----
const at = (list, step) => list.find(s => s.step === step);
const firstFrom = (list, from, ok) => list.filter(s => s.step >= from).find(ok);
// 주 버튼 바탕: 흰 글자가 4.5:1 넘는 단계 중 브랜드에 가장 가까운 것. 브랜드가 밝아 흰 글자가 안 되면 검은 글자를 쓰는 길도 보인다
const darkEnough = ramp.filter(s => s.onWhite >= 4.5);
const accent = darkEnough.length ? darkEnough.reduce((b, s) => (Math.abs(s.step - anchor.step) < Math.abs(b.step - anchor.step) ? s : b)) : ramp[ramp.length - 1];
const inkOnBrand = r2(contrast(INK, brandRgb));
const idx = ramp.indexOf(accent);
const hover = ramp[Math.min(idx + 1, ramp.length - 1)], pressed = ramp[Math.min(idx + 2, ramp.length - 1)];
const accentText = firstFrom(ramp, 500, s => s.onWhite >= 4.5) || ramp[ramp.length - 1];
const focus = firstFrom(ramp, 400, s => s.onWhite >= 3) || accent;
const selectedBg = at(ramp, 50), selectedLine = firstFrom(ramp, 300, s => s.onWhite >= 3) || accent;
const text = at(neutral, 900), textSub = firstFrom(neutral, 500, s => s.onWhite >= 4.5) || at(neutral, 700);
const border = at(neutral, 200), inputBorder = firstFrom(neutral, 400, s => s.onWhite >= 3) || at(neutral, 500);
const surfaceAlt = at(neutral, 50);
// 다크 모드에서 글자로 쓸 단계: 어두운 바탕(회색 900) 위 4.5:1
const darkBg = at(neutral, 900);
const accentTextDark = [...ramp].reverse().find(s => s.step <= 400 && contrast(s.rgb, darkBg.rgb) >= 4.5) || at(ramp, 200);

// ---- 상태색: 강조색과 색상이 15도 안이면 헷갈린다 ----
const STATUS = { danger: { H: 27, L: 0.55, C: 0.2, ko: '위험(빨강)' }, success: { H: 150, L: 0.52, C: 0.14, ko: '성공(초록)' }, warning: { H: 70, L: 0.62, C: 0.15, ko: '주의(주황·노랑)' } };
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
const status = Object.fromEntries(Object.entries(STATUS).map(([k, s]) => {
  const near = !gray && hueGap(s.H, brand.H) < 15;
  // 강조색과 가까우면 15도 넘게 떼어 놓는다(빨강 브랜드의 위험색은 더 붉게, 초록 브랜드의 성공색은 더 푸르게)
  const H = near ? (s.H + (((s.H - brand.H + 540) % 360) - 180 >= 0 ? 1 : -1) * (15 - hueGap(s.H, brand.H) + 5) + 360) % 360 : s.H;
  let c = fit({ L: s.L, C: s.C, H });
  while (contrast(oklchToRgb(c), WHITE) < 4.5 && c.L > 0.3) c = fit({ L: c.L - 0.02, C: s.C, H });
  const rgb = oklchToRgb(c);
  return [k, { hex: hex(rgb), onWhite: r2(contrast(rgb, WHITE)), hue: Math.round(H), moved: near, ko: s.ko }];
}));

const roles = {
  accent: { hex: accent.hex, step: accent.step, note: `주 버튼 바탕. 흰 글자 ${accent.onWhite}:1` },
  accentHover: { hex: hover.hex, step: hover.step, note: '마우스를 올렸을 때(한 단계 진하게)' },
  accentPressed: { hex: pressed.hex, step: pressed.step, note: '누르는 동안(두 단계 진하게)' },
  onAccent: { hex: '#ffffff', note: '주 버튼 글자' },
  accentText: { hex: accentText.hex, step: accentText.step, note: `흰 바탕 위 링크·강조 글자 ${accentText.onWhite}:1` },
  focus: { hex: focus.hex, step: focus.step, note: `포커스 링. 흰 바탕과 ${focus.onWhite}:1(3:1 이상)` },
  selectedBg: { hex: selectedBg.hex, step: 50, note: '고른 항목·현재 메뉴 바탕. 바탕색만으로 구분하지 말고 글자 굵기나 표시를 같이' },
  selectedLine: { hex: selectedLine.hex, step: selectedLine.step, note: `고른 항목 테두리·밑줄. 흰 바탕과 ${selectedLine.onWhite}:1` },
  text: { hex: text.hex, note: `본문 글자 ${text.onWhite}:1` },
  textSub: { hex: textSub.hex, note: `보조 글자 ${textSub.onWhite}:1` },
  bg: { hex: '#ffffff', note: '바탕' },
  surface: { hex: surfaceAlt.hex, note: '구분이 필요한 면(표 머리, 옆 메뉴)' },
  border: { hex: border.hex, note: '나누는 선(장식). 대비 기준 없음' },
  inputBorder: { hex: inputBorder.hex, note: `입력칸 테두리 ${inputBorder.onWhite}:1(3:1 이상, WCAG 1.4.11)` },
  danger: { hex: status.danger.hex, note: `${status.danger.onWhite}:1${status.danger.moved ? `, 강조색과 가까워 색상을 ${status.danger.hue}도로 옮김` : ''}` },
  success: { hex: status.success.hex, note: `${status.success.onWhite}:1${status.success.moved ? `, 강조색과 가까워 색상을 ${status.success.hue}도로 옮김` : ''}` },
  warning: { hex: status.warning.hex, note: `${status.warning.onWhite}:1${status.warning.moved ? `, 강조색과 가까워 색상을 ${status.warning.hue}도로 옮김` : ''}. 글자로 쓰면 진한 쪽, 바탕으로 쓰면 옅게 하고 글자는 본문색` },
};

if (args.includes('--json')) {
  console.log(JSON.stringify({ brand: { input, hex: hex(brandRgb), oklch: { L: r2(brand.L), C: Math.round(brand.C * 1000) / 1000, H: Math.round(brand.H) } }, ramp: ramp.map(({ rgb, ...s }) => s), neutral: neutral.map(({ rgb, ...s }) => s), roles, accentTextDark: accentTextDark.hex }, null, 2));
  process.exit(0);
}

const out = [];
out.push(`브랜드 색 ${hex(brandRgb)} · OKLCH 밝기 ${r2(brand.L)}, 채도 ${Math.round(brand.C * 1000) / 1000}, 색상 ${Math.round(brand.H)}도${gray ? ' (거의 무채색이라 회색 단계로 만든다)' : ''}`);
if (anchor.step !== accent.step) out.push(`브랜드 색에 흰 글자는 ${anchor.onWhite}:1이라 본문 크기 버튼 글자로 모자란다(4.5:1). 주 버튼은 ${accent.step} 단계(${accent.hex})를 쓰고, 브랜드 색 그대로는 큰 글자·로고·그림에. 검은 글자를 올리면 ${inkOnBrand}:1`);
out.push('\n[브랜드 단계] 화면의 브랜드 쪽 색은 모두 이 안에서 고른다. 비슷한 색을 즉석에서 만들지 않는다. 흰색과 대비는 흰 바탕 위 글자로 쓸 때도, 이 색 위에 흰 글자를 올릴 때도 같은 값이다');
for (const s of ramp) out.push(`- ${name}-${s.step}: ${s.hex}${s.brand ? ' ← 브랜드' : ''} · 흰색과 대비 ${s.onWhite}:1`);
out.push('\n[회색 단계] 브랜드 쪽으로 아주 조금 기운을 넣었다');
for (const s of neutral) out.push(`- gray-${s.step}: ${s.hex} · 흰색과 대비 ${s.onWhite}:1`);
out.push('\n[역할마다 쓸 색] 컴포넌트는 단계 이름이 아니라 역할 이름을 쓴다(DESIGN.md brand에 이 이름으로 적는다)');
for (const [k, v] of Object.entries(roles)) out.push(`- ${k}: ${v.hex}${v.step ? ` (${name}-${v.step})` : ''} · ${v.note}`);
out.push(`- 다크 모드 링크·강조 글자: ${accentTextDark.hex} (${name}-${accentTextDark.step}) · 어두운 바탕(${darkBg.hex}) 위 4.5:1 이상. 다크 모드는 같은 단계에서 밝은 쪽을 쓴다`);
const moved = Object.values(status).filter(s => s.moved);
if (moved.length) out.push(`\n강조색과 색상이 15도 안이라 헷갈리는 상태색: ${moved.map(s => s.ko).join(', ')}. 색상을 옮겼다. 그래도 색만으로 뜻을 전하지 않는다(글자·아이콘을 같이, WCAG 2.2 1.4.1)`);
out.push('\n[CSS 변수] 단계는 색 이름으로, 컴포넌트가 쓰는 변수는 역할 이름으로');
out.push(':root {');
for (const s of ramp) out.push(`  --${name}-${s.step}: ${s.hex};`);
for (const s of neutral) out.push(`  --gray-${s.step}: ${s.hex};`);
const kebab = k => k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
for (const [k, v] of Object.entries(roles)) out.push(`  --color-${kebab(k)}: ${v.step ? `var(--${name}-${v.step})` : v.hex};`);
out.push('}');
out.push('\n값은 출발점이다. 화면에 넣은 뒤 check-visual.mjs로 대비를 다시 재고 스크린샷으로 본다');
console.log(out.join('\n'));
