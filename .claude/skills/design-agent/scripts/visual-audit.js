// 화면의 색·글자·여백을 재는 함수. 같은 코드를 두 곳에서 쓴다
// 1) node: check-visual.mjs가 jsdom 문서에 넣어 부른다(정적 HTML)
// 2) 브라우저: 띄운 페이지에서 이 파일 내용을 실행한 뒤 visualAudit(document, window)를 부른다(실제 계산된 스타일이라 더 정확하다)
// visualAudit는 숫자만 돌려주고, visualJudge가 기준과 견줘 문장을 만든다. 브라우저에서는 visualReport(document, window)가 짧은 리뷰 글을 바로 돌려준다
function visualAudit(doc, win, depth = 0) {
  const raw = el => win.getComputedStyle(el);
  // jsdom은 「color: inherit」·「font: inherit」를 풀지 못하고 기본값(링크 파랑, 버튼 13.33px)을 준다. jsdom에서만 부모 값으로 바로잡는다
  const UA = { color: ['rgb(0, 0, 238)', 'rgb(85, 26, 139)', 'buttontext', 'fieldtext', 'rgb(0, 0, 0)'], fontSize: ['13.3333px', '13.333333px', '13.33px'] };
  const fixed = new WeakMap();
  const cs = el => {
    if (!win.__jsdom) return raw(el);
    if (fixed.has(el)) return fixed.get(el);
    const s = raw(el), parent = el.parentElement;
    const out = Object.create(null);
    for (const k of ['color', 'opacity', 'textDecorationLine', 'textDecoration', 'textDecorationColor', 'outlineStyle', 'outlineColor', 'outlineWidth', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontWeight', 'fontFamily', 'display', 'visibility', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor', 'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'borderTopLeftRadius', 'borderRadius', 'boxShadow', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap']) out[k] = s[k];
    const control = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    if (control && parent) {
      const ps = cs(parent);
      if (UA.color.includes(out.color) && ps.color !== out.color) out.color = ps.color;
      if (UA.fontSize.includes(out.fontSize)) { out.fontSize = ps.fontSize; out.fontFamily = ps.fontFamily; }
    }
    if ((!out.borderTopLeftRadius || out.borderTopLeftRadius === '0' || out.borderTopLeftRadius === '0px') && out.borderRadius) out.borderTopLeftRadius = out.borderRadius.split(/\s+/)[0];
    fixed.set(el, out);
    return out;
  };
  const visible = el => !el.closest('[hidden], [aria-hidden="true"], template, script, style, noscript') && cs(el).display !== 'none' && cs(el).visibility !== 'hidden';

  // ---- 색 계산 ----
  const parse = str => {
    if (!str) return null;
    str = String(str).trim().toLowerCase();
    if (str === 'transparent' || str === 'none' || str.startsWith('var(')) return null;
    let m = str.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
      let h = m[1];
      if (h.length <= 4) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h.slice(0, 6), 16);
      return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
    }
    m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4] };
    m = str.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (m) {
      const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
      const f = n => { const k = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
      return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a: m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4] };
    }
    // 요즘 브라우저는 color-mix 등을 「color(srgb r g b / a)」로 돌려준다(0~1 값)
    m = str.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
    if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4] };
    // Tailwind 4·shadcn은 oklch로 색을 적고, 브라우저도 그대로 돌려준다. 못 읽으면 대비를 하나도 못 잰다
    m = str.match(/^ok(lch|lab)\(\s*([\d.]+%?|none)\s+(-?[\d.]+%?|none)\s+(-?[\d.]+(?:deg)?%?|none)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      const num = (v, pctOf) => v === 'none' ? 0 : v.endsWith('%') ? parseFloat(v) / 100 * pctOf : parseFloat(v);
      const L = num(m[2], 1);
      let A, B;
      if (m[1] === 'lch') { const C = num(m[3], 0.4), h = num(m[4], 1) * Math.PI / 180; A = C * Math.cos(h); B = C * Math.sin(h); }
      else { A = num(m[3], 0.4); B = num(m[4], 0.4); }
      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, mm = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
      const g = v => { v = Math.min(1, Math.max(0, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055); };
      return { r: g(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s), g: g(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s), b: g(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s), a: m[5] == null ? 1 : m[5].endsWith('%') ? parseFloat(m[5]) / 100 : +m[5] };
    }
    // Tailwind 4 빌드에 따라 lab()으로도 나온다(2026-11-02 pogomate.com). CIE Lab(D50) → XYZ → D65 → sRGB
    m = str.match(/^(lab|lch)\(\s*([\d.]+%?|none)\s+(-?[\d.]+%?|none)\s+(-?[\d.]+(?:deg)?%?|none)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      const num = (v, pctOf) => v === 'none' ? 0 : v.endsWith('%') ? parseFloat(v) / 100 * pctOf : parseFloat(v);
      const L = num(m[2], 100);
      let A, B;
      if (m[1] === 'lch') { const C = num(m[3], 150), h = num(m[4], 1) * Math.PI / 180; A = C * Math.cos(h); B = C * Math.sin(h); }
      else { A = num(m[3], 125); B = num(m[4], 125); }
      const k = 24389 / 27, e = 216 / 24389, fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
      const X = 0.96422 * (fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k), Y = L > k * e ? fy ** 3 : L / k, Z = 0.82521 * (fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k);
      const x = 0.9554734527 * X - 0.0230985369 * Y + 0.0632593087 * Z, y = -0.028369707 * X + 1.009995458 * Y + 0.021041399 * Z, z = 0.0123140017 * X - 0.0205076964 * Y + 1.3303659366 * Z;
      const g = v => { v = Math.min(1, Math.max(0, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055); };
      return { r: g(3.2409699419 * x - 1.5373831776 * y - 0.4986107603 * z), g: g(-0.9692436363 * x + 1.8759675015 * y + 0.0415550574 * z), b: g(0.0556300797 * x - 0.2039769589 * y + 1.0569715142 * z), a: m[5] == null ? 1 : m[5].endsWith('%') ? parseFloat(m[5]) / 100 : +m[5] };
    }
    const named = { white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], gray: [128, 128, 128], grey: [128, 128, 128] };
    if (named[str]) return { r: named[str][0], g: named[str][1], b: named[str][2], a: 1 };
    // 그 밖의 형식(color(display-p3), color-mix 등)은 브라우저에게 sRGB로 바꿔 달라고 한다. jsdom에는 canvas가 없어 못 읽은 채로 둔다
    if (!win.__jsdom && doc.createElement) {
      try {
        const cv = (parse.cv ||= doc.createElement('canvas')), ctx = (parse.ctx ||= cv.getContext('2d', { willReadFrequently: true }));
        cv.width = cv.height = 1;
        ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = str;
        if (ctx.fillStyle === '#000000' && !/^(#000|black|rgb\(0, 0, 0\))/.test(str)) return null;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      } catch (e) { return null; }
    }
    return null;
  };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const lum = c => { const t = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * t(c.r) + 0.7152 * t(c.g) + 0.0722 * t(c.b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hsl = c => {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: h * 60, s, l };
  };
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  // 글자 뒤 실제 바탕: 위로 올라가며 불투명해질 때까지 겹친다. 그라데이션·그림 바탕은 모른다고 표시한다
  const backgroundOf = el => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = cs(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { unknown: true };
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const px = (v, el) => {
    if (!v) return null;
    const m = String(v).match(/^(-?[\d.]+)(px|rem|em|pt)?$/);
    if (!m) return null;
    const n = +m[1];
    if (m[2] === 'rem') return n * 16;
    if (m[2] === 'em') return n * (el && el.parentElement ? px(cs(el.parentElement).fontSize, el.parentElement) || 16 : 16);
    if (m[2] === 'pt') return n * 4 / 3;
    return n;
  };

  // ---- 글자 덩어리마다 재기 ----
  const textEls = [...doc.body.querySelectorAll('*')].filter(e => visible(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0));
  // 겹친 opacity는 글자 색을 옅게 만든다. 조상까지 곱한다
  const opacityOf = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const v = parseFloat(cs(e).opacity); if (!isNaN(v)) o *= v; } return o; };
  const texts = textEls.map(el => {
    const s = cs(el);
    // 읽지 못한 색(oklch 등)은 검정으로 치지 않고 대비를 「모름」으로 둔다. 검정으로 치면 없는 문제를 지어낸다
    const fg0 = parse(s.color);
    const fg = fg0 ? { ...fg0, a: fg0.a * opacityOf(el) } : null;
    const bg = backgroundOf(el);
    const size = px(s.fontSize, el) || 16;
    const weight = /bold/.test(s.fontWeight) ? 700 : Number(s.fontWeight) || 400;
    const ratio = bg.unknown || !fg ? null : contrast(blend(fg, bg), bg);
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const full = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ');
    const sample = full.slice(0, 24);
    const disabled = !!el.closest('[disabled], [aria-disabled="true"]');
    // 글자 수는 자르지 않은 전체 길이로 센다(본문 크기·주 글자색을 글자 수로 정한다)
    return { el, disabled, chars: full.replace(/\s+/g, '').length || 1, fg: fg ? hex(blend(fg, bg.unknown ? { r: 255, g: 255, b: 255, a: 1 } : bg)) : '?', bg: bg.unknown ? null : hex(bg), size: Math.round(size * 10) / 10, weight, ratio: ratio && Math.round(ratio * 100) / 100, need: large ? 3 : 4.5, sample, tag: el.tagName.toLowerCase(), family: (s.fontFamily || '').split(',')[0].replace(/["']/g, '').trim() };
  });

  // ---- 쓰인 색 모으기(글자·바탕·테두리) ----
  const uses = {};
  const note = (c, kind) => { if (!c || c.a === 0) return; const k = hex(c); (uses[k] ||= { hex: k, text: 0, bg: 0, border: 0 })[kind]++; };
  [...doc.body.querySelectorAll('*')].filter(visible).forEach(el => {
    const s = cs(el);
    if (textEls.includes(el)) note(parse(s.color), 'text');
    note(parse(s.backgroundColor), 'bg');
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') note(parse(s.borderTopColor), 'border');
  });
  const colors = Object.values(uses).map(u => { const h = hsl(parse(u.hex)); return { ...u, total: u.text + u.bg + u.border, h: Math.round(h.h), s: Math.round(h.s * 100) / 100, l: Math.round(h.l * 100) / 100 }; }).sort((a, b) => b.total - a.total);
  // 채도가 있는 색은 색상환 30도 단위로 묶어 「몇 가지 색 기운을 썼나」를 센다
  // 아주 어둡거나 밝은 색(남색에 가까운 검정, 거의 흰색)은 채도 숫자가 커도 눈에는 무채색이라 뺀다
  const isChroma = c => c.s >= 0.3 && c.l >= 0.2 && c.l <= 0.85;
  const chroma = colors.filter(isChroma);
  const hueGroups = {};
  chroma.forEach(c => { const g = Math.round(c.h / 30) % 12; (hueGroups[g] ||= { hue: g * 30, uses: 0, colors: [] }); hueGroups[g].uses += c.total; hueGroups[g].colors.push(c.hex); });

  // ---- 글자 크기·굵기 ----
  const sizes = {}, charsBySize = {};
  texts.forEach(t => { sizes[t.size] = (sizes[t.size] || 0) + 1; charsBySize[t.size] = (charsBySize[t.size] || 0) + t.chars; });
  // 본문은 「글자 수가 가장 많은 크기」. 덩어리 수로 세면 키패드 숫자·버튼이 본문으로 잡힌다
  const bodySize = +Object.entries(charsBySize).sort((a, b) => b[1] - a[1])[0]?.[0] || 16;
  const families = {};
  texts.forEach(t => { if (t.family) families[t.family] = (families[t.family] || 0) + 1; });

  // ---- 여백·모서리·그림자 ----
  const spacing = {}, radii = {}, shadows = {};
  [...doc.body.querySelectorAll('*')].filter(visible).forEach(el => {
    const s = cs(el);
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'].forEach(k => { const v = px(s[k], el); if (v && v > 0) spacing[v] = (spacing[v] || 0) + 1; });
    const r = px(s.borderTopLeftRadius, el); if (r && r > 0 && r < 999) radii[r] = (radii[r] || 0) + 1;
    if (s.boxShadow && s.boxShadow !== 'none') shadows[s.boxShadow] = (shadows[s.boxShadow] || 0) + 1;
  });
  const pageBg = backgroundOf(doc.body);

  // ---- 주 글자색: 글자 수가 가장 많은 색 ----
  const textChars = {};
  texts.forEach(t => { textChars[t.fg] = (textChars[t.fg] || 0) + t.chars; });
  const allChars = texts.reduce((n, t) => n + t.chars, 0) || 1;
  const textColors = Object.entries(textChars).map(([hex, chars]) => ({ hex, chars, share: Math.round(chars / allChars * 100) })).sort((a, b) => b.chars - a.chars);

  // ---- 선택 상태가 보이나: 고른 것과 옆의 안 고른 것의 바탕·테두리 차이(WCAG 2.2 1.4.11 3:1) ----
  const SEL = '[aria-pressed="true"], [aria-selected="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"]), [data-state="active"], [data-state="checked"], [data-state="on"]';
  const weakSelected = [];
  [...doc.body.querySelectorAll(SEL)].filter(visible).forEach(el => {
    const sib = [...(el.parentElement?.children || [])].find(x => x !== el && x.tagName === el.tagName && !x.matches(SEL) && visible(x));
    if (!sib) return;
    const a = backgroundOf(el), b = backgroundOf(sib);
    if (a.unknown || b.unknown) return;
    // 고른 표시를 안쪽 요소(알약 span, 날짜 동그라미)에 칠하는 경우가 많다. 안쪽 세 겹까지 처음 나오는 바탕을 본다
    const fillOf = (e, under) => { for (const x of [...e.querySelectorAll('*')].slice(0, 6)) { const c = parse(cs(x).backgroundColor); if (c && c.a > 0.05) return blend(c, under); } return under; };
    const bgRatio = Math.max(contrast(a, b), contrast(fillOf(el, a), fillOf(sib, b)));
    // 탭은 아래 테두리, 세로 메뉴는 왼쪽 테두리로 고른 것을 표시하기도 한다. 세 쪽 중 가장 뚜렷한 쪽을 본다
    const edge = (e, side, under) => { const s = cs(e); if (!(parseFloat(s[`border${side}Width`]) > 0) || s[`border${side}Style`] === 'none') return under; const c = parse(s[`border${side}Color`]); return c ? blend(c, under) : under; };
    const bw = Math.max(...['Top', 'Bottom', 'Left'].map(side => contrast(edge(el, side, a), edge(sib, side, b))));
    // 바탕·테두리 말고도 막대(그림자)·밑줄·외곽선으로 표시하는 경우가 많다. 그 표시의 색이 바탕과 3:1이면 보이는 것으로 친다
    const marks = [];
    const sh = cs(el).boxShadow, shs = cs(sib).boxShadow;
    if (sh && sh !== 'none' && sh !== shs) { const m = sh.match(/(?:rgba?|oklch|oklab)\([^)]*\)|#[0-9a-f]{3,8}/i); const c = m && parse(m[0]); if (c) marks.push(contrast(blend(c, a), a)); }
    const dl = cs(el).textDecorationLine || cs(el).textDecoration || '';
    if (/underline/.test(dl) && !/underline/.test(cs(sib).textDecorationLine || cs(sib).textDecoration || '')) { const c = parse(cs(el).textDecorationColor) || parse(cs(el).color); if (c) marks.push(contrast(blend(c, a), a)); }
    if (cs(el).outlineStyle && cs(el).outlineStyle !== 'none' && parseFloat(cs(el).outlineWidth) > 0) { const c = parse(cs(el).outlineColor); if (c) marks.push(contrast(blend(c, a), a)); }
    const best = Math.max(bgRatio, bw, ...marks);
    if (best < 3) weakSelected.push({ sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20), ratio: Math.round(best * 100) / 100, tag: el.tagName.toLowerCase() });
  });

  // ---- 문장 안 링크가 링크로 보이나: 밑줄이 없고 주변 글자와 색 차이가 3:1 미만 ----
  const hiddenLinks = [];
  [...doc.body.querySelectorAll('p a[href], li a[href], span a[href], td a[href]')].filter(visible).forEach(a => {
    const p = a.parentElement;
    const inSentence = [...p.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!inSentence) return;
    const deco = (cs(a).textDecorationLine || cs(a).textDecoration || '');
    if (/underline/.test(deco)) return;
    const ca = parse(cs(a).color), cp = parse(cs(p).color);
    if (!ca || !cp) return;
    const r = contrast(ca, cp);
    if (r < 3) hiddenLinks.push({ sample: (a.textContent || '').trim().slice(0, 20), ratio: Math.round(r * 100) / 100 });
  });

  // ---- iframe: 같은 출처면 안까지 재고, 못 들어가면(다른 출처·sandbox) 주소를 알린다 ----
  // 입력칸은 테두리나 바탕이 주변과 3:1은 나야 칸으로 보인다(WCAG 2.2 1.4.11). shadcn 기본 테두리는 1.2:1 안팎이라 잘 걸린다
  const weakInputs = [];
  [...doc.body.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]), select, textarea')].filter(visible).forEach(el => {
    if (el.disabled) return;
    const outside = backgroundOf(el.parentElement || el), inside = backgroundOf(el);
    if (outside.unknown || inside.unknown) return;
    const s = cs(el);
    const sides = ['Top', 'Bottom', 'Left'].filter(side => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none').map(side => parse(s[`border${side}Color`])).filter(Boolean);
    const best = Math.max(contrast(inside, outside), ...sides.map(c => contrast(blend(c, outside), outside)));
    if (best < 3) weakInputs.push({ sample: el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.id || el.tagName.toLowerCase(), ratio: Math.round(best * 100) / 100 });
  });
  const frames = [], skippedFrames = [];
  if (depth < 1) [...doc.querySelectorAll('iframe')].forEach(f => {
    let d = null;
    try { d = f.contentDocument; } catch (e) { d = null; }
    if (d && d.body && f.contentWindow) {
      try { const sub = visualAudit(d, f.contentWindow, depth + 1); frames.push({ src: f.getAttribute('src') || '', lowContrast: sub.lowContrast, textCount: sub.textCount }); } catch (e) { skippedFrames.push(f.getAttribute('src') || '(src 없음)'); }
    } else skippedFrames.push(f.getAttribute('src') || '(src 없음)');
  });

  return {
    textCount: texts.length,
    // 꺼진 컨트롤은 대비 기준에서 빠진다(WCAG 2.2 1.4.3 예외)
    lowContrast: texts.filter(t => !t.disabled && t.ratio != null && t.ratio < t.need).map(({ el, ...t }) => t),
    unknownBg: texts.filter(t => t.ratio == null).length,
    colors: colors.map(c => ({ ...c, chroma: isChroma(c) })),
    hueGroups: Object.values(hueGroups).sort((a, b) => b.uses - a.uses),
    pureGrays: colors.filter(c => c.s === 0 && c.l > 0.15 && c.l < 0.9).map(c => c.hex),
    pageBg: pageBg.unknown ? null : hex(pageBg),
    sizes: Object.entries(sizes).map(([s, n]) => ({ size: +s, n })).sort((a, b) => b.size - a.size),
    bodySize,
    maxSize: Math.max(...texts.map(t => t.size), 0),
    smallText: texts.filter(t => t.size < 12).length,
    bold: texts.filter(t => t.weight >= 600).length,
    families,
    spacing: Object.entries(spacing).map(([v, n]) => ({ v: +v, n })).sort((a, b) => b.n - a.n),
    radii: Object.entries(radii).map(([v, n]) => ({ v: +v, n })).sort((a, b) => b.n - a.n),
    shadows: Object.keys(shadows).length,
    textColors,
    weakSelected,
    hiddenLinks,
    weakInputs,
    frames,
    skippedFrames,
  };
}

// ---------- 기준과 견줘 문장으로 ----------
// 돌려주는 것: [{ sec: '색'|'글자'|'여백·모양', level: '꼭'|'권장'|'확인'|'좋음'|'정보', text }]
function visualJudge(r) {
  const out = [];
  const say = (sec, level, text) => out.push({ sec, level, text });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const HUE = h => ['빨강', '주황', '노랑', '연두', '초록', '초록', '청록', '하늘', '파랑', '남보라', '보라', '분홍'][Math.round(h / 30) % 12];
  const bgMain = r.colors.filter(c => c.bg).sort((a, b) => b.bg - a.bg)[0];
  const textMain = (r.textColors || [])[0];
  const accents = r.hueGroups;
  say('색', '정보', `바탕 ${r.pageBg || bgMain?.hex || '?'} · 주 글자색 ${textMain ? `${textMain.hex}(글자의 ${textMain.share}%)` : '?'} · 색 기운 ${accents.length}가지(${accents.slice(0, 5).map(g => `${HUE(g.hue)} ${g.colors[0]}`).join(', ') || '없음'})`);
  if (r.lowContrast.length) {
    const worst = r.lowContrast.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3).map(t => `「${t.sample}」 ${t.fg}/${t.bg} ${t.ratio}:1`).join(', ');
    say('색', '꼭', `글자 대비가 모자란 곳 ${r.lowContrast.length}군데(본문 4.5:1, 큰 글자 3:1 · WCAG 2.2 1.4.3). 낮은 곳: ${worst}. 글자를 진하게 하거나 바탕을 바꾼다`);
  } else say('색', '좋음', `잴 수 있는 글자 ${r.textCount - r.unknownBg}개 모두 대비 기준을 넘는다`);
  (r.frames || []).forEach(f => { if (f.lowContrast.length) say('색', '꼭', `iframe(${f.src}) 안 글자 대비가 모자란 곳 ${f.lowContrast.length}군데. 낮은 곳: ${f.lowContrast.slice(0, 2).map(t => `「${t.sample}」 ${t.ratio}:1`).join(', ')}`); });
  if ((r.skippedFrames || []).length) say('색', '확인', `안을 재지 못한 iframe ${r.skippedFrames.length}개(다른 출처나 sandbox). 그 주소를 직접 연다: ${r.skippedFrames.slice(0, 3).join(', ')}${r.skippedFrames.length > 3 ? ' …' : ''}`);
  if (r.unknownBg) say('색', '확인', `그라데이션·그림 위 글자 ${r.unknownBg}개는 대비를 재지 못했다. 스크린샷으로 본다`);
  if ((r.weakSelected || []).length) say('색', '꼭', `고른 것과 안 고른 것의 차이가 약하다 ${r.weakSelected.length}군데(3:1 미만 · WCAG 2.2 1.4.11): ${r.weakSelected.slice(0, 3).map(w => `「${w.sample}」 ${w.ratio}:1`).join(', ')}. 고른 것은 바탕을 진하게 하거나 굵은 테두리·표시를 더한다`);
  if ((r.weakInputs || []).length) say('색', '꼭', `입력칸 테두리가 주변과 잘 안 갈린다 ${r.weakInputs.length}군데(3:1 미만 · WCAG 2.2 1.4.11): ${r.weakInputs.slice(0, 3).map(w => `「${w.sample}」 ${w.ratio}:1`).join(', ')}. 테두리 색을 진하게(흰 바탕이면 #8a8f98 안팎)`);
  if ((r.hiddenLinks || []).length) say('색', '권장', `문장 안 링크가 링크로 안 보인다 ${r.hiddenLinks.length}군데(밑줄 없고 주변 글자와 3:1 미만): ${r.hiddenLinks.slice(0, 3).map(l => `「${l.sample}」`).join(', ')}. 밑줄을 단다`);
  const loud = accents.filter(g => g.uses >= 3);
  if (loud.length > 3) say('색', '권장', `눈에 띄게 쓴 색 기운이 ${loud.length}가지다(${loud.map(g => HUE(g.hue)).join('·')}). 브랜드 강조 1가지 + 상태색(빨강·초록·노랑)만 남기고 나머지는 회색 단계로`);
  const accentChars = (r.textColors || []).filter(t => { const c = r.colors.find(x => x.hex === t.hex); return c && c.chroma; }).reduce((n, t) => n + t.chars, 0);
  const allChars = (r.textColors || []).reduce((n, t) => n + t.chars, 0);
  if (pct(accentChars, allChars) > 20) say('색', '권장', `글자의 ${pct(accentChars, allChars)}%가 색 글자다. 강조색은 누를 곳과 꼭 볼 숫자에만, 보조 글은 회색으로`);
  if (r.pureGrays.length) say('색', '확인', `색 기운이 없는 순수 회색 ${r.pureGrays.slice(0, 4).join(', ')}. 바탕·브랜드 색 쪽으로 아주 조금 기운을 넣는다(흔한 AI 기본값)`);
  if (r.colors.length > 24) say('색', '확인', `서로 다른 색 값이 ${r.colors.length}개다. 비슷한 회색·파랑을 역할 변수 몇 개로 묶는다`);
  const scale = r.sizes.map(s => s.size);
  say('글자', '정보', `크기 ${scale.length}단계(${scale.slice(0, 8).join('·')}px), 본문 ${r.bodySize}px(글자 수 기준), 가장 큰 글자 ${r.maxSize}px, 서체 ${Object.keys(r.families).slice(0, 3).join(', ') || '?'}`);
  const ratio = r.maxSize / r.bodySize;
  if (ratio < 1.6) say('글자', '권장', `가장 큰 글자가 본문의 ${ratio.toFixed(1)}배뿐이다. 페이지 제목을 본문의 1.8~2배로 키운다`);
  else say('글자', '좋음', `제목이 본문의 ${ratio.toFixed(1)}배라 위계가 보인다`);
  if (scale.length > 7) say('글자', '권장', `크기가 ${scale.length}가지로 많다. 제목·소제목·본문·보조 4~6단계로 줄인다(15와 16처럼 비슷한 값은 하나로)`);
  if (r.bodySize < 14) say('글자', '권장', `본문이 ${r.bodySize}px로 작다. 화면 본문은 보통 14~16px(모바일 입력칸은 16px 이상)`);
  if (r.smallText) say('글자', '확인', `12px보다 작은 글자 ${r.smallText}개. 꼭 필요한 정보면 키운다`);
  if (pct(r.bold, r.textCount) > 40) say('글자', '권장', `글자 덩어리의 ${pct(r.bold, r.textCount)}%가 굵다. 굵기는 제목과 핵심 숫자에만`);
  if (Object.keys(r.families).length > 2) say('글자', '권장', `서체가 ${Object.keys(r.families).length}가지다. 본문 1가지(+숫자·코드용 1가지)로`);
  const sp = r.spacing.filter(s => s.v >= 2);
  const off = sp.filter(s => s.v % 4 !== 0).reduce((n, s) => n + s.n, 0), all = sp.reduce((n, s) => n + s.n, 0);
  say('여백·모양', '정보', `여백 값 ${sp.length}가지(많이 쓴 값 ${sp.slice(0, 6).map(s => s.v).join('·')}px), 모서리 ${r.radii.length}가지(${r.radii.slice(0, 4).map(x => x.v).join('·')}px), 그림자 ${r.shadows}가지`);
  if (pct(off, all) > 25) say('여백·모양', '권장', `여백의 ${pct(off, all)}%가 4의 배수가 아니다. 4·8·12·16·24·32 단계 안에서만 쓴다`);
  if (sp.length > 14) say('여백·모양', '확인', `여백 값이 ${sp.length}가지로 흩어져 있다. 단계 6~8개로 줄인다`);
  if (r.radii.length > 4) say('여백·모양', '권장', `모서리 둥글기가 ${r.radii.length}가지다. 두세 단계로 맞춘다`);
  if (r.shadows > 4) say('여백·모양', '권장', `그림자가 ${r.shadows}가지다. 떠 있는 층과 카드 두 단계로`);
  return out;
}

// 브라우저용: 짧은 리뷰 글을 바로 돌려준다. 도구 출력이 잘리지 않게 max 글자씩 쪽을 나눈다(page=1부터)
function visualReport(doc, win, page = 1, max = 900) {
  const r = visualAudit(doc || document, win || window);
  const order = ['꼭', '권장', '확인', '좋음', '정보'];
  const lines = visualJudge(r).sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level)).map(f => `[${f.level === '정보' ? '값' : f.level}·${f.sec}] ${f.text}`);
  const pages = [[]];
  let len = 0;
  for (const l of lines) { if (len + l.length > max && pages[pages.length - 1].length) { pages.push([]); len = 0; } pages[pages.length - 1].push(l); len += l.length + 1; }
  const n = Math.min(Math.max(1, page), pages.length);
  return pages[n - 1].join('\n') + (pages.length > 1 ? `\n(${n}/${pages.length}쪽${n < pages.length ? `, 다음: visualReport(document, window, ${n + 1})` : ''})` : '');
}
if (typeof module !== 'undefined') module.exports = { visualAudit, visualJudge, visualReport };
