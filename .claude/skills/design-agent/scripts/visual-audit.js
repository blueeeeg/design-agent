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
    for (const k of ['color', 'opacity', 'textDecorationLine', 'textDecoration', 'textDecorationColor', 'outlineStyle', 'outlineColor', 'outlineWidth', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontWeight', 'fontFamily', 'display', 'visibility', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor', 'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'borderRightWidth', 'borderRightStyle', 'borderRightColor', 'borderTopLeftRadius', 'borderRadius', 'boxShadow', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap', 'lineHeight', 'textAlign', 'fontStyle', 'letterSpacing', 'textTransform', 'backdropFilter', 'webkitBackdropFilter', 'height', 'width', 'overflow', 'overflowX', 'textOverflow', 'position', 'backgroundClip', 'webkitBackgroundClip', 'webkitTextFillColor']) out[k] = s[k];
    // jsdom은 text-align을 물려주지 않는다(빈 값). 부모 값을 쓴다
    if (!out.textAlign && parent) out.textAlign = cs(parent).textAlign;
    const control = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    // jsdom은 기본 링크색(:link, 명시도 0,1,1)을 작성자의 「a { color }」(0,0,1)보다 앞세운다. 실제 브라우저는 작성자 CSS가 이긴다
    // href를 뺀 복사본의 색이 부모와 다르면 작성자 규칙이 있는 것이니 그 색을 쓴다
    let authored = false;
    if (el.tagName === 'A' && el.hasAttribute('href') && UA.color.slice(0, 2).includes(out.color) && parent) {
      const c = el.cloneNode(false); c.removeAttribute('href'); parent.insertBefore(c, el);
      const v = raw(c).color; c.remove();
      if (v !== raw(parent).color) { out.color = v; authored = true; }
    }
    if (control && parent) {
      const ps = cs(parent);
      if (!authored && UA.color.includes(out.color) && ps.color !== out.color) out.color = ps.color;
      if (UA.fontSize.includes(out.fontSize)) { out.fontSize = ps.fontSize; out.fontFamily = ps.fontFamily; }
    }
    if ((!out.borderTopLeftRadius || out.borderTopLeftRadius === '0' || out.borderTopLeftRadius === '0px') && out.borderRadius) out.borderTopLeftRadius = out.borderRadius.split(/\s+/)[0];
    fixed.set(el, out);
    return out;
  };
  // display:none은 물려받지 않는다. 자기만 보면 닫힌 메뉴(조상이 display:none) 안 글자도 재게 된다(2026-11-06 발견)
  // 브라우저는 checkVisibility()가 조상까지 본다. jsdom은 조상을 따라 올라가며 한 번 본 값을 둔다
  const noneMemo = new WeakMap();
  const displayNone = el => {
    if (!el || el.nodeType !== 1) return false;
    if (noneMemo.has(el)) return noneMemo.get(el);
    const v = cs(el).display === 'none' || displayNone(el.parentElement);
    noneMemo.set(el, v);
    return v;
  };
  const visible = el => !el.closest('[hidden], [aria-hidden="true"], template, script, style, noscript') && cs(el).visibility !== 'hidden' && (!win.__jsdom && typeof el.checkVisibility === 'function' ? el.checkVisibility() : !displayNone(el));

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
  // 그라데이션만 있는 바탕(그림 url은 없음)이면 색 단계를 모두 꺼낸다. 글자가 어느 단계 위에 놓일지 모르니 가장 낮은 대비로 판정한다
  // ko-design-md(MIT)가 그라데이션 위 글자를 그라데이션 색 전부로 판정하는 데서 생각을 얻었다(2026-11-06)
  const GRAD_COLOR = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b|\b(?:white|black|transparent|red|blue|green|gray|grey)\b/gi;
  const gradStops = img => {
    if (!img || !/gradient\(/i.test(img) || /url\(/i.test(img)) return null;
    const stops = (img.match(GRAD_COLOR) || []).map(c => (/^transparent$/i.test(c) ? { r: 0, g: 0, b: 0, a: 0 } : parse(c)));
    return stops.length >= 2 && stops.every(Boolean) ? stops : null;
  };
  // 글자 뒤 그라데이션 색 단계마다 실제 바탕(아래 바탕과 사이의 반투명 층까지 겹친 것). 못 풀면 null
  const gradBgOf = el => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = cs(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') {
        const stops = gradStops(s.backgroundImage);
        if (!stops) return null;
        let under = e.parentElement ? backgroundOf(e.parentElement) : { r: 255, g: 255, b: 255, a: 1 };
        if (under.unknown) return null;
        const own = parse(s.backgroundColor);
        if (own && own.a > 0) under = blend(own, under);
        return stops.map(c => { let b = blend(c, under); for (let i = layers.length - 1; i >= 0; i--) b = blend(layers[i], b); return b; });
      }
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) layers.push(c);
    }
    return null;
  };
  // 그라데이션 글자(background-clip: text): 글자 색이 그라데이션이다. 글자 자신이나 세 겹 위 조상까지 본다
  const gradTextOf = el => {
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 3; e = e.parentElement, i++) {
      const s = cs(e);
      // jsdom은 background-clip을 못 읽는다. 글자색이 투명한데 자기 바탕이 그라데이션이면 그라데이션 글자다
      const isClear = v => { const t = String(v || '').trim(); if (!t) return false; const c = parse(t); return c ? c.a === 0 : /^transparent$/i.test(t); };
      const clear = isClear(s.webkitTextFillColor) || isClear(s.color);
      if (!/text/.test(`${s.backgroundClip || ''} ${s.webkitBackgroundClip || ''}`) && !(i === 0 && clear)) continue;
      const stops = gradStops(s.backgroundImage);
      if (!stops) return null;
      // 그라데이션 글자를 그라데이션 바탕 위에 올린 경우도 있다. 아래 바탕도 색 단계마다 본다
      const u = e.parentElement ? backgroundOf(e.parentElement) : { r: 255, g: 255, b: 255, a: 1 };
      const unders = u.unknown ? (e.parentElement && gradBgOf(e.parentElement)) : [u];
      return unders ? { stops, unders } : null;
    }
    return null;
  };
  const px = (v, el) => {
    if (!v) return null;
    // Tailwind 4 rounded-full은 3.35544e+07px처럼 지수로 나온다
    const m = String(v).match(/^(-?[\d.]+(?:e[+-]?\d+)?)(px|rem|em|pt)?$/i);
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
    let ratio = bg.unknown || !fg ? null : contrast(blend(fg, bg), bg);
    // 그라데이션 글자이거나 그라데이션 바탕 위 글자면 색 단계마다 재서 가장 낮은 값을 쓴다
    let grad = null;
    const gt = gradTextOf(el);
    if (gt) {
      const worst = gt.stops.flatMap(c => gt.unders.map(u => { const f = blend({ ...c, a: c.a * opacityOf(el) }, u); return { f, u, r: contrast(f, u) }; })).sort((a, b) => a.r - b.r)[0];
      ratio = worst.r; grad = { fg: hex(worst.f), bg: hex(worst.u), kind: '글자' };
    } else if (bg.unknown && fg) {
      const stops = gradBgOf(el);
      if (stops) {
        const worst = stops.map(b => ({ b, r: contrast(blend(fg, b), b) })).sort((a, b) => a.r - b.r)[0];
        ratio = worst.r; grad = { fg: hex(blend(fg, worst.b)), bg: hex(worst.b), kind: '바탕' };
      }
    }
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const full = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ');
    const sample = full.slice(0, 24);
    const disabled = !!el.closest('[disabled], [aria-disabled="true"]');
    // 한글 조판을 볼 값: 행간(글자 크기의 몇 배, normal은 null), 정렬, 이탤릭, 자간(글자 크기의 몇 배), 대문자
    const lhRaw = String(s.lineHeight || 'normal');
    const lh = /px$/.test(lhRaw) ? parseFloat(lhRaw) / size : /%$/.test(lhRaw) ? parseFloat(lhRaw) / 100 : /^[\d.]+$/.test(lhRaw) ? +lhRaw : null;
    const ls = /px$/.test(s.letterSpacing || '') ? parseFloat(s.letterSpacing) / size : /em$/.test(s.letterSpacing || '') ? parseFloat(s.letterSpacing) : 0;
    const hangul = (full.match(/[가-힣]/g) || []).length;
    const nearHangul = hangul > 0 || /[가-힣]/.test(el.parentElement?.textContent || '');
    // 글자 수는 자르지 않은 전체 길이로 센다(본문 크기·주 글자색을 글자 수로 정한다)
    return { el, grad, disabled, hangul, nearHangul, lh: lh && Math.round(lh * 100) / 100, align: s.textAlign || '', italic: /italic|oblique/.test(s.fontStyle || ''), ls: Math.round(ls * 1000) / 1000, upper: s.textTransform === 'uppercase' || (/^[A-Z0-9\s&·/-]{4,}$/.test(full) && /[A-Z]{3}/.test(full)), chars: full.replace(/\s+/g, '').length || 1, fg: fg ? hex(blend(fg, bg.unknown ? { r: 255, g: 255, b: 255, a: 1 } : bg)) : '?', bg: bg.unknown ? null : hex(bg), size: Math.round(size * 10) / 10, weight, ratio: ratio && Math.round(ratio * 100) / 100, need: large ? 3 : 4.5, sample, tag: el.tagName.toLowerCase(), family: (s.fontFamily || '').split(',')[0].replace(/["']/g, '').trim(), ...(grad && { fg: grad.fg, bg: grad.bg }) };
  });

  // ---- 쓰인 색 모으기(글자·바탕·테두리) ----
  const uses = {};
  const note = (c, kind) => { if (!c || c.a === 0) return; const k = hex(c); (uses[k] ||= { hex: k, text: 0, bg: 0, border: 0 })[kind]++; };
  const allVisible = [...doc.body.querySelectorAll('*')].filter(visible);
  const textSet = new Set(textEls);
  allVisible.forEach(el => {
    const s = cs(el);
    if (textSet.has(el)) note(parse(s.color), 'text');
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
  // 고정폭 글자(코드, 영어 이름 같은 보조 라벨)는 본문이 아니다. 고르기 화면에서 이것이 글자 수로 본문을 이겨 「본문 12px」로 잘못 잡혔다(2026-11-06 카탈로그 /plan/)
  const monoFam = f => /mono|courier|consolas|menlo|monaco|fira code|source code/i.test(f || '');
  texts.forEach(t => { sizes[t.size] = (sizes[t.size] || 0) + 1; if (!monoFam(t.family)) charsBySize[t.size] = (charsBySize[t.size] || 0) + t.chars; });
  // 본문은 「글자 수가 가장 많은 크기」. 덩어리 수로 세면 키패드 숫자·버튼이 본문으로 잡힌다
  const bodySize = +Object.entries(charsBySize).sort((a, b) => b[1] - a[1])[0]?.[0] || +Object.keys(sizes)[0] || 16;
  const families = {};
  texts.forEach(t => { if (t.family) families[t.family] = (families[t.family] || 0) + 1; });

  // ---- 여백·모서리·그림자 ----
  const spacing = {}, radii = {}, shadows = {};
  allVisible.forEach(el => {
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

  // ---- 한글 조판: 문단 행간 1.5 미만(WCAG 2.2 1.4.8), 긴 글 가운데 정렬, 한글 옆 이탤릭(한글 서체에는 이탤릭이 없어 기울인 가짜가 된다) ----
  const live = texts.filter(t => !t.disabled);
  const paras = live.filter(t => t.hangul >= 40 && t.size <= 22);
  const tightLines = paras.filter(t => t.lh == null || t.lh < 1.5).map(t => ({ sample: t.sample, lh: t.lh ?? 'normal' }));
  const centeredLong = live.filter(t => t.chars >= 80 && t.align === 'center').map(t => ({ sample: t.sample, chars: t.chars }));
  // 한글 자체를 기울인 것(권장)과 한글 문장 안의 영문 이탤릭(확인. 국내 글에서 「AI 티」로 꼽혔지만 책 제목처럼 쓰는 경우도 있다)을 나눈다
  const italicKo = live.filter(t => t.italic && t.hangul > 0).map(t => ({ sample: t.sample }));
  const italicNear = live.filter(t => t.italic && !t.hangul && t.nearHangul).map(t => ({ sample: t.sample }));
  // 자간을 벌린 작은 대문자 소제목(eyebrow): AI가 제목 위에 습관처럼 붙인다고 많이 꼽힌다(2026-11-03 조사)
  const eyebrows = live.filter(t => t.upper && t.ls >= 0.05 && t.size <= 14).map(t => ({ sample: t.sample }));

  // ---- 카드 모양: 카드 안 카드, 둥근 카드 한쪽의 두꺼운 색 띠, 글래스모피즘 ----
  const BLOCK = /^(DIV|SECTION|ARTICLE|ASIDE|LI|FIGURE|HEADER|FOOTER|MAIN|NAV|FORM|FIELDSET|DETAILS)$/;
  const radiusOf = el => px(cs(el).borderTopLeftRadius, el) || 0;
  // 카드는 둥근 모서리에 네 면 테두리나 그림자가 있는 상자. 바탕만 칠한 칸은 섹션 바탕·미리보기 자리인 경우가 많아 카드로 세지 않는다
  const isCard = el => {
    if (!BLOCK.test(el.tagName) || radiusOf(el) < 4) return false;
    const s = cs(el);
    const bordered = ['Top', 'Right', 'Bottom', 'Left'].every(side => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none');
    const shadow = s.boxShadow && s.boxShadow !== 'none' && !/inset/.test(s.boxShadow);
    return bordered || shadow;
  };
  const filledOwn = el => { const c = parse(cs(el).backgroundColor); if (!c || c.a <= 0.05 || !el.parentElement) return false; const u = backgroundOf(el.parentElement); return !u.unknown && contrast(blend(c, u), u) > 1.04; };
  const cards = allVisible.filter(isCard);
  const cardSet = new Set(cards);
  const floating = el => !!el.closest('dialog, [role="dialog"], [role="alertdialog"], [popover]') || cs(el).position === 'fixed';
  // 고르기 묶음(세그먼트·탭·라디오 묶음)은 카드가 아니라 컴포넌트다
  const control = el => el.matches('[role="radiogroup"], [role="group"], [role="tablist"], [role="toolbar"]') || !!el.querySelector('input[type="radio"], input[type="checkbox"], [role="radio"], [role="tab"]');
  // 카드와 안쪽 상자 사이에 색을 칠한 칸(예시 그림 자리)이 있으면 그림 속 상자로 보고 세지 않는다
  const nestedCards = cards.filter(el => {
    if (control(el)) return false;
    for (let p = el.parentElement; p && p !== doc.body; p = p.parentElement) { if (cardSet.has(p)) return !floating(p); if (filledOwn(p)) return false; }
    return false;
  }).map(el => ({ sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20) }));
  const sideStripes = allVisible.filter(el => {
    if (el.matches(SEL) || el.tagName === 'BLOCKQUOTE' || radiusOf(el) < 4) return false;
    const s = cs(el), w = side => (s[`border${side}Style`] !== 'none' && parseFloat(s[`border${side}Width`])) || 0;
    const side = w('Left') >= w('Right') ? 'Left' : 'Right', thick = w(side);
    const inset = (s.boxShadow || '').match(/inset\s+(-?\d+)px\s+0(?:px)?\s+0/);
    if (!(thick >= 3 && w('Top') <= 1) && !(inset && Math.abs(+inset[1]) >= 3)) return false;
    const c = thick >= 3 ? parse(s[`border${side}Color`]) : parse((s.boxShadow.match(/(?:rgba?|oklch|oklab|lab|lch)\([^)]*\)|#[0-9a-f]{3,8}/i) || [])[0]);
    return c && hsl(c).s >= 0.3;
  }).map(el => ({ sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20) }));
  const glass = allVisible.filter(el => /blur\(/.test(cs(el).backdropFilter || cs(el).webkitBackdropFilter || '')).map(el => ({ sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20) }));
  // 레이아웃을 계산하는 브라우저인가(jsdom은 크기가 0이라 크기·위치로 재는 검사는 브라우저에서만 한다)
  const layout = !win.__jsdom && typeof doc.documentElement.getBoundingClientRect === 'function';
  const layout0 = el => (layout ? el.getBoundingClientRect().width : 0);
  const sampleOf = el => (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 20);

  // ---- 카드 안쪽 여백이 쪽마다 다름: 왼쪽과 오른쪽이 다르거나, 위·아래와 옆이 크게 다르다(Stageshow의 uneven padding에서 생각을 얻었다, 2026-11-04) ----
  // 한쪽 여백이 0이면 그림을 끝까지 붙인 카드라 일부러 그런 것으로 보고 넘긴다
  const unevenPads = cards.filter(el => !control(el)).map(el => {
    const s = cs(el), p = ['Top', 'Right', 'Bottom', 'Left'].map(k => px(s[`padding${k}`], el) || 0);
    if (p.some(v => v === 0)) return null;
    const [t, r, b, l] = p, side = Math.max(l, r), vert = Math.min(t, b);
    const odd = Math.abs(l - r) >= 4 || (Math.abs(side - vert) >= 12 && Math.max(side, vert) > Math.min(side, vert) * 1.6);
    return odd ? { sample: sampleOf(el), pad: p.join('/') } : null;
  }).filter(Boolean);

  // ---- 아이콘: 채운 아이콘과 선 아이콘이 같은 크기에 섞임, 아이콘 자리의 이모지, AI 기능에 반짝이 ----
  const SHAPES = 'path, circle, rect, line, polyline, polygon, ellipse';
  const svgProp = (shape, svg, prop) => {
    if (!win.__jsdom) { const v = cs(shape)[prop]; if (v) return /none|transparent|rgba\([^)]*,\s*0\)/.test(v) ? 'none' : v; }
    for (let e = shape; e && e !== svg.parentElement; e = e.parentElement) { const v = e.getAttribute(prop); if (v) return v; }
    return prop === 'fill' ? 'black' : 'none';
  };
  const iconKinds = {};
  allVisible.filter(e => e.tagName.toLowerCase() === 'svg').forEach(svg => {
    const w = layout0(svg) || px(svg.getAttribute('width'), svg) || px(cs(svg).width, svg);
    if (!w || w > 32) return;
    const shapes = [...svg.querySelectorAll(SHAPES)];
    if (!shapes.length) return;
    const outline = shapes.every(sh => svgProp(sh, svg, 'fill') === 'none');
    const filled = shapes.every(sh => svgProp(sh, svg, 'fill') !== 'none' && svgProp(sh, svg, 'stroke') === 'none');
    if (!outline && !filled) return;
    const k = Math.round(w / 4) * 4;
    (iconKinds[k] ||= { size: k, outline: 0, filled: 0 })[outline ? 'outline' : 'filled']++;
  });
  const mixedIcons = Object.values(iconKinds).filter(g => g.outline >= 2 && g.filled >= 2);
  // 이모지는 메시지·반응 같은 내용이지 아이콘이 아니다. 버튼·링크·목록·탭·라벨 글이 이모지로 시작하면 아이콘 자리로 본다(제목은 check-screen.mjs가 본다)
  const EMOJI = /^\s*(?:(?![©®™])\p{Extended_Pictographic})/u;
  const emojiIcons = textEls.filter(el => !/^H[1-6]$/.test(el.tagName) && el.closest('button, a, li, label, nav, [role="tab"], [role="button"], th, dt') && EMOJI.test([...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''))).map(el => ({ sample: sampleOf(el) }));
  // AI 기능을 반짝이·마술봉으로 표시하는 것(흔한 AI 기본값. 제품이 원래 쓰는 아이콘이면 그대로 둔다)
  const sparkles = allVisible.filter(e => (e.tagName.toLowerCase() === 'svg' && /\bsparkles?\b|\bwand\b|auto-?awesome/i.test(`${e.getAttribute('class') || ''} ${e.getAttribute('data-lucide') || ''} ${e.getAttribute('data-icon') || ''}`)) || (textSet.has(e) && /✨|🪄/.test(e.textContent || ''))).map(e => ({ sample: sampleOf(e.closest('button, a, h1, h2, h3, span, div') || e) || '(아이콘)' }));
  // 모바일·태블릿 입력칸 글자: iOS Safari는 16px 미만 입력칸을 누르면 화면을 확대한다(조건이 있을 때만 판단)
  const smallInputs = [...doc.body.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]), select, textarea')].filter(visible).map(el => ({ sample: el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.tagName.toLowerCase(), size: Math.round((px(cs(el).fontSize, el) || 16) * 10) / 10 })).filter(x => x.size < 16);

  // ---- Anthropic frontend-design 스킬(Apache 2.0)이 꼽은 AI 기본값 중 잴 수 있는 것(생각만 가져왔다, 2026-11-06) ----
  // 카드 세트: 위계와 상관없이 카드마다 같은 모서리·같은 옅은 회색 그림자
  const softShadow = v => { if (!v || v === 'none' || /inset/.test(v)) return false; const m = v.match(/(?:rgba?|oklch|oklab|lab|lch)\([^)]*\)|#[0-9a-f]{3,8}/i); const c = m && parse(m[0]); return !!c && c.a <= 0.2 && hsl(c).s < 0.15 && hsl(c).l < 0.3; };
  let cardKit = null;
  const kitCards = cards.filter(el => !control(el) && !floating(el));
  if (kitCards.length >= 4) {
    const shapes = {};
    kitCards.forEach(el => { const k = `${Math.round(radiusOf(el))}|${cs(el).boxShadow || 'none'}`; shapes[k] = (shapes[k] || 0) + 1; });
    const [k, n] = Object.entries(shapes).sort((a, b) => b[1] - a[1])[0];
    const [rad, shadow] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)];
    if (n >= kitCards.length * 0.8 && softShadow(shadow)) cardKit = { n, of: kitCards.length, radius: +rad };
  }
  // 작은 라벨에만 고정폭 서체(코드·키 입력 안은 뺀다). 숫자만 있는 칸(개수·가격)은 자리를 맞추려는 흔한 선택이라 글자가 있는 라벨만 센다
  const MONO = /mono|courier|consolas|menlo|monaco|fira code|source code/i;
  const monoLabels = live.filter(t => MONO.test(t.family) && t.size <= 13 && t.chars <= 24 && /[A-Za-z가-힣]{2}/.test(t.sample) && !t.el.closest('pre, code, kbd, samp, var, textarea, [role="code"], [class*="code" i], [class*="syntax" i], [class*="terminal" i]')).map(t => ({ sample: t.sample }));
  // 링크·버튼 글 끝에 붙인 화살표(→). 글자로 붙인 것만 본다
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const arrowEnds = textEls.filter(el => el.closest('a[href], button, [role="button"]') && /[→⟶➔➜]$/.test(ownText(el))).map(el => ({ sample: sampleOf(el.closest('a[href], button, [role="button"]')) }));
  // 제목에서 한 단어만 색·기울임·굵기·서체를 바꿈. 숫자 배지·바탕 있는 칩·링크는 뺀다
  const weightOf = s => (/bold/.test(s.fontWeight) ? 700 : Number(s.fontWeight) || 400);
  const accentWords = allVisible.filter(e => /^H[1-3]$/.test(e.tagName)).map(h => {
    const full = (h.textContent || '').trim().replace(/\s+/g, ' ');
    if (full.length < 6) return null;
    const hs = cs(h), c0 = parse(hs.color);
    const kid = [...h.querySelectorAll('em, i, strong, b, mark, span')].find(k => {
      const t = (k.textContent || '').trim();
      if (!t || !/[A-Za-z가-힣]/.test(t) || t.length > full.length * 0.5 || k.closest('a') || k.querySelector('svg, img')) return false;
      const s = cs(k), c1 = parse(s.color), bgc = parse(s.backgroundColor);
      if ((bgc && bgc.a > 0.05 && !/mark/i.test(k.tagName)) || parseFloat(s.borderTopWidth) > 0) return false;
      const colorDiff = !!(c1 && c0 && (contrast(c1, c0) > 1.5 || Math.abs(hsl(c1).s - hsl(c0).s) > 0.3));
      const italic = /italic|oblique/.test(s.fontStyle || '') && !/italic|oblique/.test(hs.fontStyle || '');
      const heavier = Math.abs(weightOf(s) - weightOf(hs)) >= 200;
      const clip = /text/.test(s.backgroundClip || s.webkitBackgroundClip || '');
      const fam = (s.fontFamily || '') !== (hs.fontFamily || '');
      // 한글 제목 안 영문만 기울인 것은 「한글 옆 영문 이탤릭」이 이미 센다
      if (italic && !colorDiff && !heavier && !clip && !/[가-힣]/.test(t) && /[가-힣]/.test(full)) return false;
      return colorDiff || italic || heavier || clip || fam || /mark/i.test(k.tagName);
    });
    return kid ? { sample: full.slice(0, 24), word: kid.textContent.trim().slice(0, 12) } : null;
  }).filter(Boolean);
  // 01 / 02 / 03 번호 표시. 순서 목록·표·달력·고르는 칸 안은 뺀다(내용이 정말 순서인지는 눈으로)
  const numMarks = live.filter(t => /^0[1-9][.)]?$/.test(ownText(t.el)) && !t.el.closest('ol, table, time, button, select, option, [role="grid"], [role="option"], [role="listbox"]')).map(t => ({ sample: t.sample }));
  // 움직임: 섹션마다 들어오는 효과(fade-up 등), 카드마다 hover로 뜨는 효과, 움직임 줄이기 설정 대응
  const rules = [];
  let reducedMotion = false, unreadableCss = 0;
  // 선택자 목록을 쉼표로 나눈다. :is(a, b)·[x="a,b"] 안의 쉼표는 나누지 않는다
  const splitSel = sel => { const out = []; let cur = '', d = 0; for (const ch of sel) { if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--; else if (ch === ',' && d === 0) { out.push(cur); cur = ''; continue; } cur += ch; } out.push(cur); return out.map(x => x.trim()).filter(Boolean); };
  const walk = (list, parent) => {
    for (const r of list) {
      if (rules.length > 5000) return;
      // @keyframes 안 단계(from·to)는 선택자가 아니다. 중첩 안에 있으면 부모 선택자의 규칙으로 잘못 잡힌다
      if (r.type === 7 || r.type === 8 || /Keyframe/.test(r.constructor?.name || '')) continue;
      const cond = r.conditionText || r.media?.mediaText || '';
      if (/prefers-reduced-motion/.test(cond)) reducedMotion = true;
      if (r.selectorText) {
        // 부모가 목록(.a, .b)이면 부모마다 잇는다(.a:hover, .b:hover)
        const sel = parent ? splitSel(r.selectorText).flatMap(x => splitSel(parent).map(pp => (x.includes('&') ? x.replace(/&/g, pp) : `${pp} ${x}`))).join(', ') : r.selectorText;
        rules.push({ sel, css: r.style?.cssText || '' });
        if (r.cssRules?.length) walk(r.cssRules, sel);
      } else if (r.cssRules) walk(r.cssRules, parent);
      else if (parent && r.style) rules.push({ sel: parent, css: r.style.cssText || '' }); // 중첩 @media 안 선언(Tailwind 4)
    }
  };
  for (const sh of [...(doc.styleSheets || [])]) { try { walk(sh.cssRules || [], ''); } catch (e) { unreadableCss++; } }
  const REVEAL = /\b(fade-?(in-?)?up|fadeInUp|fade-?in-?(left|right)|reveal|aos-(init|animate)|animate__\w+|wow|scroll-?reveal|slide-?(in-?)?up)\b/i;
  const entering0 = allVisible.filter(el => BLOCK.test(el.tagName) && (el.hasAttribute('data-aos') || el.hasAttribute('data-sal') || el.hasAttribute('data-animate') || REVEAL.test(el.getAttribute('class') || '') || (/fade|reveal|slide|rise/i.test(cs(el).animationName || '') && cs(el).animationIterationCount !== 'infinite') || (el.style && parseFloat(el.style.opacity) === 0 && /translate/.test(el.style.transform || ''))));
  // 움직이는 덩어리 안의 움직이는 덩어리는 한 번만 센다(섹션과 그 안 카드가 같이 떠오르는 경우)
  const enterSet = new Set(entering0);
  const entering = entering0.filter(el => { for (let p = el.parentElement; p && p !== doc.body; p = p.parentElement) if (enterSet.has(p)) return false; return true; }).map(el => ({ sample: sampleOf(el) || `<${el.tagName.toLowerCase()}>` }));
  // 큰 사이트는 hover 규칙이 수백 개라 같은 것은 한 번만, 300개까지만 맞춰 본다
  const hoverBases = [...new Set(rules.filter(r => /:hover/.test(r.sel) && /transform|translate|scale|box-shadow/.test(r.css)).flatMap(r => splitSel(r.sel).filter(x => /:hover/.test(x)).map(x => x.replace(/:hover/g, '').trim())).filter(Boolean))].slice(0, 300);
  const hoverCards = hoverBases.length ? kitCards.filter(el => hoverBases.some(sel => { try { return el.matches(sel); } catch (e) { return false; } })) : [];
  const hoverAll = kitCards.length >= 4 && hoverCards.length >= kitCards.length * 0.8 ? { n: hoverCards.length, clickable: hoverCards.filter(el => el.matches('a[href], button, [role="button"], [onclick]') || el.querySelector('a[href], button')).length } : null;
  const motionUsed = entering.length > 0 || rules.some(r => /animation(-name)?\s*:\s*(?!none)[\w-]/.test(r.css) && !/spin|pulse|shimmer|skeleton/i.test(r.css + r.sel));
  const noReducedMotion = motionUsed && !reducedMotion && !unreadableCss;

  // ---- 제목 위 여백이 아래 여백보다 커야 제목이 아래 내용에 붙어 보인다(Impeccable(Apache 2.0)의 바닥 기준에서 생각을 얻었다, 2026-11-06) ----
  // 브라우저는 실제 간격을, jsdom은 margin을 견준다(위아래로 쌓이면 겹치는 margin은 큰 쪽, grid 안이면 더한다)
  const sibOf = (el, dir) => { for (let x = el && el[dir]; x; x = x[dir]) if (visible(x)) return x; return null; };
  const marginPx = (el, k) => { const v = String(cs(el)[k] || ''); return Math.max(0, /\dem$/.test(v) ? parseFloat(v) * (px(cs(el).fontSize, el) || 16) : px(v, el) || 0); };
  const headingGaps = [], headingSeen = {};
  allVisible.filter(e => /^H[2-4]$/.test(e.tagName) && !e.closest('hgroup, header, nav, dialog, [role="dialog"], table, button, a')).slice(0, 300).forEach(h => {
    const prev = sibOf(h, 'previousElementSibling'), next = sibOf(h, 'nextElementSibling');
    if (!prev || !next || /^H[1-6]$/.test(prev.tagName) || /^H[1-6]$/.test(next.tagName)) return;
    // 제목 바로 위 짧은 라벨(소제목 위 작은 글, 배지)은 제목과 한 묶음이라 견주지 않는다
    if ((prev.textContent || '').trim().length <= 30 && !prev.querySelector('img, svg, video, canvas')) return;
    let above, below;
    if (layout) {
      const a = prev.getBoundingClientRect(), b = h.getBoundingClientRect(), c = next.getBoundingClientRect();
      if (!b.height || a.bottom > b.top + 1 || c.top < b.bottom - 1) return; // 옆으로 놓였다
      above = b.top - a.bottom; below = c.top - b.bottom;
    } else {
      const ps = h.parentElement && cs(h.parentElement);
      if (ps && /flex/.test(ps.display)) return; // jsdom은 flex 방향을 몰라 견주지 않는다
      const grid = ps && /grid/.test(ps.display);
      above = grid ? marginPx(prev, 'marginBottom') + marginPx(h, 'marginTop') : Math.max(marginPx(prev, 'marginBottom'), marginPx(h, 'marginTop'));
      below = grid ? marginPx(h, 'marginBottom') + marginPx(next, 'marginTop') : Math.max(marginPx(h, 'marginBottom'), marginPx(next, 'marginTop'));
    }
    const tag = h.tagName.toLowerCase();
    headingSeen[tag] = (headingSeen[tag] || 0) + 1;
    if (below >= 8 && above <= below) headingGaps.push({ tag, sample: sampleOf(h), above: Math.round(above), below: Math.round(below) });
  });

  // ---- ai-design-check(MIT)·Hallmark(MIT)가 AI 기본값으로 꼽은 모양(생각만 가져왔다, 2026-11-06) ----
  // 크기는 브라우저면 실제 상자, jsdom이면 CSS에 적힌 px만 안다
  const boxSize = el => { if (layout) { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; } const s = cs(el); return { w: px(s.width, el) || 0, h: px(s.height, el) || 0 }; };
  const isPill = el => { const r = radiusOf(el), { h } = boxSize(el); return h > 0 ? r >= h / 2 - 1 : r >= 100; };
  // 제목마다 앞에 붙인 색 네모(동그라미) 아이콘 상자: 28~72px 정사각형, 옅은 색 바탕, 안에 아이콘만
  // svg 안 <title>·<desc>(접근성 이름)는 화면 글자가 아니라 뺀다
  const visText = el => [...el.childNodes].map(n => (n.nodeType === 3 ? n.textContent : n.nodeType === 1 && n.tagName.toLowerCase() !== 'svg' ? visText(n) : '')).join('');
  const iconBox = el => {
    if (!el || /[A-Za-z0-9가-힣]/.test(visText(el))) return false;
    if (!el.querySelector('svg, img, i, [class*="icon" i]') && !EMOJI.test(el.textContent || '')) return false;
    const { w, h } = boxSize(el);
    return w >= 28 && w <= 72 && Math.abs(w - h) <= 2 && filledOwn(el);
  };
  const iconHeads = allVisible.filter(e => /^H[2-4]$/.test(e.tagName)).filter(h => {
    const p = sibOf(h, 'previousElementSibling');
    return iconBox(p || (h.parentElement && sibOf(h.parentElement, 'previousElementSibling')));
  }).map(h => ({ sample: sampleOf(h) }));
  // 큰 제목 바로 위 알약 배지(「✨ 새 기능」 같은 것)
  const pillBadges = allVisible.filter(e => /^H[12]$/.test(e.tagName)).map(h => {
    const p = sibOf(h, 'previousElementSibling');
    if (!p) return null;
    const t = (p.textContent || '').trim().replace(/\s+/g, ' ');
    if (!t || t.length > 40 || p.querySelector('h1, h2, h3, p, ul, ol, img, input')) return null;
    const s = cs(p), bordered = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none';
    return (filledOwn(p) || bordered) && isPill(p) ? { sample: t.slice(0, 24) } : null;
  }).filter(Boolean);
  // 채운 주 버튼이 모두 알약 모양(끝이 완전히 둥근 것). 동그란 아이콘 버튼은 글자가 없어 뺀다
  const filledBtns = allVisible.filter(e => e.matches('button, [role="button"], input[type="submit"], a[class*="btn" i], a[class*="button" i]') && !e.closest('[disabled], [aria-disabled="true"]') && /[A-Za-z가-힣]/.test(e.textContent || e.value || '')).filter(e => { const c = parse(cs(e).backgroundColor); return c && c.a > 0.5 && hsl(c).s >= 0.3; });
  const pillN = filledBtns.filter(isPill).length;
  const pillButtons = filledBtns.length >= 2 && pillN >= filledBtns.length * 0.8 ? { n: pillN, of: filledBtns.length } : null;

  // ---- 넘침·잘림: 레이아웃을 계산하는 브라우저에서만(jsdom은 크기가 0) ----
  let overflowX = 0;
  const wide = [], clipped = [], targets = [], tightInset = [], nearAligned = [], fatRows = [], inventedMarks = [];
  let ellipsis = 0;
  if (layout) {
    const vw = doc.documentElement.clientWidth || win.innerWidth;
    overflowX = Math.max(0, doc.documentElement.scrollWidth - vw);
    // 넘친 것 중 부모는 안 넘친 「처음 넘친 것」만 적는다(가로 스크롤 영역 안은 세지 않는다)
    if (overflowX > 1) allVisible.forEach(el => {
      const r = el.getBoundingClientRect(), p = el.parentElement?.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && p && p.right <= vw + 1 && wide.length < 5) wide.push({ tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').split(/\s+/)[0] || '', sample: (el.textContent || '').trim().slice(0, 20), over: Math.round(r.right - vw) });
    });
    // 화면 읽기 프로그램용으로 1px에 숨긴 글자(sr-only)는 일부러 자른 것이라 뺀다(2026-11-05 예시 화면에서 오탐)
    // 큰 페이지에서 같은 요소를 여러 번 재지 않게 한 번 잰 값을 둔다
    const memo = (fn, m = new WeakMap()) => el => { if (!m.has(el)) m.set(el, fn(el)); return m.get(el); };
    const srOnly = memo(el => { const s = cs(el), r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2 || (s.clip && s.clip !== 'auto') || (s.clipPath && s.clipPath !== 'none'); });
    textEls.forEach(el => {
      const s = cs(el);
      if (!/hidden|clip/.test(`${s.overflow} ${s.overflowX}`) || el.scrollWidth <= el.clientWidth + 1 || srOnly(el)) return;
      if (s.textOverflow === 'ellipsis') ellipsis++; else clipped.push({ sample: (el.textContent || '').trim().slice(0, 20) });
    });

    // 누를 곳의 실제 크기. 문장 안 링크는 WCAG 2.5.8 예외라 뺀다
    allVisible.filter(e => e.matches('button, a[href], [role="button"], [role="tab"], [role="link"], select, input:not([type=hidden]):not([type=checkbox]):not([type=radio])') && !e.closest('[disabled], [aria-disabled="true"]')).forEach(e => {
      if (e.matches('a[href]') && e.parentElement && [...e.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
      if (e.parentElement && e.parentElement.closest('button, a[href], [role="button"]')) return;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      // ::before·::after를 밖으로 넓혀 누를 영역을 키우는 방법(inset: -4px 0)도 있다. 그만큼 더한다(2026-11-05 예시 화면에서 오탐)
      let w = r.width, h = r.height;
      for (const ps of ['::before', '::after']) {
        const s = win.getComputedStyle(e, ps);
        if (!s || s.content === 'none' || s.content === 'normal' || s.position !== 'absolute') continue;
        const out = v => Math.max(0, -(parseFloat(v) || 0));
        w = Math.max(w, r.width + out(s.left) + out(s.right)); h = Math.max(h, r.height + out(s.top) + out(s.bottom));
      }
      targets.push({ sample: sampleOf(e) || e.tagName.toLowerCase(), w: Math.round(w), h: Math.round(h) });
    });

    // 상자 관계(Stageshow의 tight inset·near aligned·fat row에서 생각을 얻었다, 2026-11-04)
    const ownTextRect = memo(el => {
      const nodes = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
      if (!nodes.length) return null;
      const rg = doc.createRange(); rg.setStartBefore(nodes[0]); rg.setEndAfter(nodes[nodes.length - 1]);
      const r = rg.getBoundingClientRect();
      return r.width > 0 ? r : null;
    });
    // self: 상자 자신이 글을 가진 경우(<li>첫째 행</li>)도 넣는다
    const textsIn = (box, self) => (self && textSet.has(box) ? [box] : []).concat([...box.querySelectorAll('*')].filter(el => textSet.has(el)));
    // 글자가 상자(카드, 칠한 칸, 버튼) 끝에 8px 안쪽으로 붙음. 작은 배지·칩(높이 32 미만, 폭 64 미만)은 뺀다
    // 바탕도 테두리도 없는 버튼(링크 모양·탭)은 상자로 보지 않는다
    const boxedButton = p => p.matches('button, [role="button"]') && (filledOwn(p) || parseFloat(cs(p).borderLeftWidth) > 0);
    const boxOf = el => { for (let p = el, i = 0; p && p !== doc.body && i < 5; p = p.parentElement, i++) if (cardSet.has(p) || boxedButton(p) || filledOwn(p)) return p; return null; };
    textEls.slice(0, 3000).forEach(el => {
      const box = boxOf(el), t = ownTextRect(el);
      if (!box || !t) return;
      const b = box.getBoundingClientRect(), s = cs(box);
      if (b.width < 64 || b.height < 32 || /hidden|clip/.test(`${cs(el).overflow}`)) return;
      const left = t.left - b.left - (parseFloat(s.borderLeftWidth) || 0), right = b.right - (parseFloat(s.borderRightWidth) || 0) - t.right;
      const gap = Math.min(left, right);
      if (gap >= -1 && gap < 8 && tightInset.length < 30) tightInset.push({ sample: sampleOf(el), gap: Math.round(gap * 10) / 10 });
    });
    // 카드 안에서 글 시작선이 1~3px 차이로 어긋남. 맞추거나 일부러 들여 쓴다
    // 부모가 가운데로 모으면(flex·grid의 align-items·justify-items center) 왼쪽 끝이 글 길이에 따라 달라 견주지 않는다
    const centeredByParent = el => { const ps = el.parentElement && cs(el.parentElement); return !!ps && /flex|grid/.test(ps.display) && (ps.alignItems === 'center' && /column/.test(ps.flexDirection || '') || ps.justifyItems === 'center'); };
    cards.slice(0, 200).forEach(card => {
      // 오른쪽 정렬(숫자 칸)은 오른쪽 끝을, 나머지는 왼쪽 끝을 견준다. 정렬이 다른 글끼리는 견주지 않는다(2026-11-05 예시 화면에서 오탐)
      const side = el => (/right|end/.test(cs(el).textAlign) ? 'right' : 'left');
      const inCard = textsIn(card);
      if (inCard.length > 40) return;
      const lefts = inCard.filter(el => !/center|justify/.test(cs(el).textAlign) && !/^inline/.test(cs(el).display) && !centeredByParent(el) && !srOnly(el)).map(el => ({ el, r: ownTextRect(el), side: side(el) })).filter(x => x.r);
      for (let i = 0; i < lefts.length; i++) for (let j = i + 1; j < lefts.length; j++) {
        if (lefts[i].side !== lefts[j].side) continue;
        const d = Math.abs(lefts[i].r[lefts[i].side] - lefts[j].r[lefts[j].side]);
        if (d > 0.5 && d <= 3) { nearAligned.push({ sample: `${sampleOf(lefts[i].el)} / ${sampleOf(lefts[j].el)}`, d: Math.round(d * 10) / 10 }); return; }
      }
    });
    // 한 줄짜리 행이 글자의 세 배보다 높고, 같은 목록에서 둘 넘게 그렇다(사진·그림이 있는 행은 뺀다)
    allVisible.filter(e => e.matches('ul, ol, [role="list"], tbody')).forEach(list => {
      const rows = [...list.children].slice(0, 60).filter(visible);
      if (rows.length < 3) return;
      // 그림·아바타·스위치·입력칸처럼 글 아닌 것이 행 높이를 정하는 행은 뺀다
      const visual = row => row.querySelector('img, video, canvas, picture, input, select, textarea, [role="switch"], [role="img"]') || [...row.querySelectorAll('svg')].slice(0, 3).some(v => v.getBoundingClientRect().height > 24) || [...row.querySelectorAll('*')].slice(0, 30).some(x => { const xs = cs(x); return (xs.backgroundImage && xs.backgroundImage !== 'none') || (!textSet.has(x) && filledOwn(x) && x.getBoundingClientRect().height > 24); });
      const fat = rows.filter(row => {
        if (visual(row)) return false;
        const ts = textsIn(row, true).map(el => ({ el, r: ownTextRect(el) })).filter(x => x.r);
        if (!ts.length) return false;
        const fs = px(cs(ts[0].el).fontSize, ts[0].el) || 16, lineH = fs * 1.6;
        const top = Math.min(...ts.map(x => x.r.top)), bottom = Math.max(...ts.map(x => x.r.bottom));
        return bottom - top < lineH * 1.3 && row.getBoundingClientRect().height > lineH * 3;
      });
      if (fat.length >= 2 && fat.length * 2 >= rows.length) fatRows.push({ sample: sampleOf(fat[0]), h: Math.round(fat[0].getBoundingClientRect().height), n: fat.length, of: rows.length });
    });
    // 지어낸 로고: 머리글·내비 근처의 색 네모 안 글자 한두 개(동그라미는 아바타일 수 있어 뺀다)
    allVisible.forEach(e => {
      if (e.childElementCount > 1 || (e.textContent || '').trim().length > 2 || !e.closest('header, nav, [class*="logo" i], [class*="brand" i]')) return;
      const own = (e.textContent || '').trim();
      if (!/^[A-Za-z가-힣]{1,2}$/.test(own)) return;
      const r = e.getBoundingClientRect();
      if (r.width < 20 || r.width > 48 || Math.abs(r.width - r.height) > 2 || radiusOf(e) >= r.width / 2 - 1) return;
      const c = parse(cs(e).backgroundColor);
      if (c && c.a > 0.5 && hsl(c).s >= 0.3) inventedMarks.push({ sample: own });
    });
  }

  // ---- 2세대 기본값: 보라를 막으면 옮겨 가는 곳(크림 바탕 + 테라코타, 아주 어두운 바탕 + 네온 하나), 자주 고르는 서체 ----
  const bgC = pageBg.unknown ? null : hsl(pageBg);
  const loudGroups = Object.values(hueGroups).filter(g => g.uses >= 3);
  // 한 묶음(색상환 30도)에 옅은 베이지와 진한 주황이 같이 들 수 있어 묶음 안 색을 다 본다
  const anyIn = (g, ok) => g.colors.some(h => ok(hsl(parse(h))));
  const aiDefaults = [];
  if (bgC && bgC.h >= 25 && bgC.h <= 60 && bgC.s >= 0.25 && bgC.l >= 0.88 && bgC.l < 0.985 && loudGroups.some(g => anyIn(g, c => (c.h <= 35 || c.h >= 350) && c.s >= 0.4 && c.l >= 0.3 && c.l <= 0.6))) aiDefaults.push('크림 바탕 + 테라코타·주황 강조');
  if (bgC && bgC.l < 0.12 && loudGroups.length === 1 && anyIn(loudGroups[0], c => c.s >= 0.7 && c.l >= 0.5)) aiDefaults.push('아주 어두운 바탕 + 네온 강조 한 가지');
  const aiFonts = Object.keys(families).filter(f => /^(Inter|Space Grotesk|Geist|Instrument Serif)$/i.test(f));

  // ---- 화면끼리 견줄 값: 여러 페이지를 재서 visualCompare로 어긋난 곳을 찾는다 ----
  const solid = el => { const u = backgroundOf(el); return u.unknown ? { r: 255, g: 255, b: 255, a: 1 } : u; };
  const buttons = {};
  allVisible.filter(e => e.matches('button, [role="button"], input[type="submit"], input[type="button"], a[class*="btn" i], a[class*="button" i]') && !e.closest('[disabled], [aria-disabled="true"]')).forEach(e => {
    const s = cs(e), c = parse(s.backgroundColor);
    const fill = c && c.a > 0.05 ? blend(c, solid(e.parentElement || e)) : null;
    const h = layout ? Math.round(e.getBoundingClientRect().height) : px(s.height, e);
    const k = [fill && hsl(fill).s >= 0.3 ? hex(fill) : fill ? 'gray' : 'none', Math.round(radiusOf(e)), h ? Math.round(h) : '?', Math.round(px(s.fontSize, e) || 16)].join('|');
    buttons[k] = (buttons[k] || 0) + 1;
  });
  const headings = {};
  ['h1', 'h2', 'h3'].forEach(tag => { const v = [...new Set(allVisible.filter(e => e.tagName.toLowerCase() === tag).map(e => `${Math.round(px(cs(e).fontSize, e) || 0)}/${/bold/.test(cs(e).fontWeight) ? 700 : Number(cs(e).fontWeight) || 400}`))]; if (v.length) headings[tag] = v; });
  const linkColors = {};
  allVisible.filter(e => e.matches('p a[href], li a[href]')).forEach(e => { const c = parse(cs(e).color); if (c) linkColors[hex(c)] = (linkColors[hex(c)] || 0) + 1; });
  const sig = {
    url: (doc.location && doc.location.pathname) || '', title: (doc.title || '').slice(0, 40),
    pageBg: pageBg.unknown ? null : hex(pageBg), bodySize, families: Object.keys(families).slice(0, 4), headings, buttons,
    link: Object.entries(linkColors).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    radii: Object.entries(radii).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v]) => +v),
    shadows: Object.entries(shadows).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([v]) => v),
    colors: chroma.slice(0, 12).map(c => ({ hex: c.hex, n: c.total })),
  };

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
    lowContrast: texts.filter(t => !t.disabled && !t.grad && t.ratio != null && t.ratio < t.need).map(({ el, ...t }) => t),
    // 그라데이션은 글자가 실제로 놓인 자리보다 넓을 수 있어(가장 낮은 단계로 쟀다) 따로 둔다
    gradLow: texts.filter(t => !t.disabled && t.grad && t.ratio != null && t.ratio < t.need).map(({ el, ...t }) => t),
    gradCount: texts.filter(t => t.grad).length,
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
    paraCount: paras.length,
    tightLines,
    centeredLong,
    italicKo,
    italicNear,
    eyebrows,
    cardCount: cards.length,
    nestedCards,
    sideStripes,
    glass,
    layout,
    overflowX,
    wide,
    clipped,
    ellipsis,
    targets,
    tightInset,
    nearAligned,
    fatRows,
    inventedMarks,
    unevenPads,
    mixedIcons,
    emojiIcons,
    sparkles,
    smallInputs,
    cardKit,
    monoLabels,
    arrowEnds,
    accentWords,
    numMarks,
    entering,
    hoverAll,
    noReducedMotion,
    headingGaps,
    headingSeen,
    iconHeads,
    pillBadges,
    pillButtons,
    aiDefaults,
    aiFonts,
    sig,
    frames,
    skippedFrames,
  };
}

// ---------- 기준과 견줘 문장으로 ----------
// cond: 서비스 조건에서 나온 기준(params.mjs condFor. 브라우저는 window.__designCond). 없으면 조건과 상관없는 흔한 기준을 쓴다
// 돌려주는 것: [{ sec: '색'|'글자'|'여백·모양', level: '꼭'|'권장'|'확인'|'좋음'|'정보', text, fail?, topic? }]
function visualJudge(r, cond) {
  const out = [];
  // fail은 references/failures.md의 실패 이름(FAILS), topic이 있는 것은 브랜드·사내 시스템이 일부러 정했을 수 있는 것이다(visualHouse 참고)
  const say = (sec, level, text, fail, topic) => out.push({ sec, level, text, ...(fail && { fail }), ...(topic && { topic }) });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const HUE = h => ['빨강', '주황', '노랑', '연두', '초록', '초록', '청록', '하늘', '파랑', '남보라', '보라', '분홍'][Math.round(h / 30) % 12];
  const bgMain = r.colors.filter(c => c.bg).sort((a, b) => b.bg - a.bg)[0];
  const textMain = (r.textColors || [])[0];
  const accents = r.hueGroups;
  say('색', '정보', `바탕 ${r.pageBg || bgMain?.hex || '?'} · 주 글자색 ${textMain ? `${textMain.hex}(글자의 ${textMain.share}%)` : '?'} · 색 기운 ${accents.length}가지(${accents.slice(0, 5).map(g => `${HUE(g.hue)} ${g.colors[0]}`).join(', ') || '없음'})`);
  if (r.lowContrast.length) {
    const worst = r.lowContrast.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3).map(t => `「${t.sample}」 ${t.fg}/${t.bg} ${t.ratio}:1`).join(', ');
    say('색', '꼭', `글자 대비가 모자란 곳 ${r.lowContrast.length}군데(본문 4.5:1, 큰 글자 3:1 · WCAG 2.2 1.4.3). 낮은 곳: ${worst}. 글자를 진하게 하거나 바탕을 바꾼다`, 'hard');
  } else if (!(r.gradLow || []).length) say('색', '좋음', `잴 수 있는 글자 ${r.textCount - r.unknownBg}개 모두 대비 기준을 넘는다${r.gradCount ? `(그라데이션 위 ${r.gradCount}개는 가장 옅은 색 단계로 쟀다)` : ''}`);
  (r.frames || []).forEach(f => { if (f.lowContrast.length) say('색', '꼭', `iframe(${f.src}) 안 글자 대비가 모자란 곳 ${f.lowContrast.length}군데. 낮은 곳: ${f.lowContrast.slice(0, 2).map(t => `「${t.sample}」 ${t.ratio}:1`).join(', ')}`, 'hard'); });
  if ((r.skippedFrames || []).length) say('색', '확인', `안을 재지 못한 iframe ${r.skippedFrames.length}개(다른 출처나 sandbox). 그 주소를 직접 연다: ${r.skippedFrames.slice(0, 3).join(', ')}${r.skippedFrames.length > 3 ? ' …' : ''}`);
  if ((r.gradLow || []).length) say('색', '권장', `그라데이션${r.gradLow.some(t => t.grad.kind === '글자') ? ' 글자나 그라데이션' : ''} 위 글자 중 가장 옅은 색 단계에서 대비가 모자란 곳 ${r.gradLow.length}군데: ${r.gradLow.slice(0, 3).map(t => `「${t.sample}」 ${t.fg}/${t.bg} ${t.ratio}:1`).join(', ')}. 글자가 실제로 놓인 자리를 스크린샷으로 보고, 모자라면 그라데이션 폭을 줄이거나 글자를 단색으로(WCAG 2.2 1.4.3)`, 'hard');
  if (r.unknownBg) say('색', '확인', `그라데이션·그림 위 글자 ${r.unknownBg}개는 대비를 재지 못했다. 스크린샷으로 본다`);
  if ((r.weakSelected || []).length) say('색', '꼭', `고른 것과 안 고른 것의 차이가 약하다 ${r.weakSelected.length}군데(3:1 미만 · WCAG 2.2 1.4.11): ${r.weakSelected.slice(0, 3).map(w => `「${w.sample}」 ${w.ratio}:1`).join(', ')}. 고른 것은 바탕을 진하게 하거나 굵은 테두리·표시를 더한다`, 'confusing');
  if ((r.weakInputs || []).length) say('색', '꼭', `입력칸 테두리가 주변과 잘 안 갈린다 ${r.weakInputs.length}군데(3:1 미만 · WCAG 2.2 1.4.11): ${r.weakInputs.slice(0, 3).map(w => `「${w.sample}」 ${w.ratio}:1`).join(', ')}. 테두리 색을 진하게(흰 바탕이면 #8a8f98 안팎)`, 'confusing');
  if ((r.hiddenLinks || []).length) say('색', '권장', `문장 안 링크가 링크로 안 보인다 ${r.hiddenLinks.length}군데(밑줄 없고 주변 글자와 3:1 미만): ${r.hiddenLinks.slice(0, 3).map(l => `「${l.sample}」`).join(', ')}. 밑줄을 단다`, 'confusing');
  const loud = accents.filter(g => g.uses >= 3);
  if (loud.length > 3) say('색', '권장', `눈에 띄게 쓴 색 기운이 ${loud.length}가지다(${loud.map(g => HUE(g.hue)).join('·')}). 브랜드 강조 1가지 + 상태색(빨강·초록·노랑)만 남기고 나머지는 회색 단계로`, 'flat', 'accent');
  const accentChars = (r.textColors || []).filter(t => { const c = r.colors.find(x => x.hex === t.hex); return c && c.chroma; }).reduce((n, t) => n + t.chars, 0);
  const allChars = (r.textColors || []).reduce((n, t) => n + t.chars, 0);
  if (pct(accentChars, allChars) > 20) say('색', '권장', `글자의 ${pct(accentChars, allChars)}%가 색 글자다. 강조색은 누를 곳과 꼭 볼 숫자에만, 보조 글은 회색으로`, 'flat', 'accent');
  if (r.pureGrays.length) say('색', '확인', `색 기운이 없는 순수 회색 ${r.pureGrays.slice(0, 4).join(', ')}. 바탕·브랜드 색 쪽으로 아주 조금 기운을 넣는다(흔한 AI 기본값)`, 'generic', 'palette');
  if (r.colors.length > 24) say('색', '확인', `서로 다른 색 값이 ${r.colors.length}개다. 비슷한 회색·파랑을 역할 변수 몇 개로 묶는다`, 'uneven', 'palette');
  const scale = r.sizes.map(s => s.size);
  say('글자', '정보', `크기 ${scale.length}단계(${scale.slice(0, 8).join('·')}px), 본문 ${r.bodySize}px(글자 수 기준), 가장 큰 글자 ${r.maxSize}px, 서체 ${Object.keys(r.families).slice(0, 3).join(', ') || '?'}`);
  const ratio = r.maxSize / r.bodySize;
  if (ratio < 1.6) say('글자', '권장', `가장 큰 글자가 본문의 ${ratio.toFixed(1)}배뿐이다. 페이지 제목을 본문의 1.8~2배로 키운다`, 'flat', 'typescale');
  else say('글자', '좋음', `제목이 본문의 ${ratio.toFixed(1)}배라 위계가 보인다`);
  if (scale.length > 7) say('글자', '권장', `크기가 ${scale.length}가지로 많다. 제목·소제목·본문·보조 4~6단계로 줄인다(15와 16처럼 비슷한 값은 하나로)`, 'uneven', 'typescale');
  // 조건이 있으면 그 조건의 본문 기준(여럿이 쓰는 기기 18px, 매일 쓰는 데스크톱 14px 등), 없으면 흔한 하한 14px
  const bodyMin = cond?.bodyMin || 14;
  if (cond) say('글자', '정보', `조건 기준: 본문 ${bodyMin}px 이상${cond.bodySrc ? `(${cond.bodySrc})` : ''}, 누를 곳 ${cond.targetMin}px 이상${cond.src?.targetMin ? `(${cond.src.targetMin})` : ''}`);
  if (r.bodySize < bodyMin) say('글자', '권장', `본문이 ${r.bodySize}px로 작다. ${cond ? `이 조건의 본문은 ${bodyMin}px 이상${cond.bodySrc ? `(${cond.bodySrc})` : ''}` : '화면 본문은 보통 14~16px'}`, 'hard', 'typescale');
  const smallMin = bodyMin >= 18 ? 14 : 12, smallN = (r.sizes || []).filter(s => s.size < smallMin).reduce((n, s) => n + s.n, 0);
  if (smallN) say('글자', '확인', `${smallMin}px보다 작은 글자 ${smallN}개. 꼭 필요한 정보면 키운다`, 'hard');
  if (cond && cond.inputMin && (r.smallInputs || []).length) say('글자', '권장', `입력칸 글자가 ${cond.inputMin}px보다 작다 ${r.smallInputs.length}곳: ${r.smallInputs.slice(0, 3).map(x => `「${x.sample}」 ${x.size}px`).join(', ')}. iOS Safari는 16px 미만 입력칸을 누르면 화면을 확대한다`, 'hard');
  if (pct(r.bold, r.textCount) > 40) say('글자', '권장', `글자 덩어리의 ${pct(r.bold, r.textCount)}%가 굵다. 굵기는 제목과 핵심 숫자에만`, 'flat', 'weight');
  if (Object.keys(r.families).length > 2) say('글자', '권장', `서체가 ${Object.keys(r.families).length}가지다. 본문 1가지(+숫자·코드용 1가지)로`, 'uneven', 'font');
  const sp = r.spacing.filter(s => s.v >= 2);
  const off = sp.filter(s => s.v % 4 !== 0).reduce((n, s) => n + s.n, 0), all = sp.reduce((n, s) => n + s.n, 0);
  say('여백·모양', '정보', `여백 값 ${sp.length}가지(많이 쓴 값 ${sp.slice(0, 6).map(s => s.v).join('·')}px), 모서리 ${r.radii.length}가지(${r.radii.slice(0, 4).map(x => x.v).join('·')}px), 그림자 ${r.shadows}가지`);
  if (pct(off, all) > 25) say('여백·모양', '권장', `여백의 ${pct(off, all)}%가 4의 배수가 아니다. 4·8·12·16·24·32 단계 안에서만 쓴다`, 'uneven', 'spacing');
  if (sp.length > 14) say('여백·모양', '확인', `여백 값이 ${sp.length}가지로 흩어져 있다. 단계 6~8개로 줄인다`, 'uneven', 'spacing');
  if (r.radii.length > 4) say('여백·모양', '권장', `모서리 둥글기가 ${r.radii.length}가지다. 두세 단계로 맞춘다`, 'uneven', 'radius');
  if (r.shadows > 4) say('여백·모양', '권장', `그림자가 ${r.shadows}가지다. 떠 있는 층과 카드 두 단계로`, 'uneven', 'shadow');
  const list = (a, n = 3) => a.slice(0, n).map(x => `「${x.sample}」`).join(', ');
  // 한글 조판(국내 글에서만 나온 문제, 2026-11-03 조사)
  if ((r.tightLines || []).length) say('글자', '권장', `한글 문단 ${r.paraCount}개 중 ${r.tightLines.length}개가 행간 1.5 미만이다(normal 포함 · WCAG 2.2 1.4.8): ${list(r.tightLines)}. 한글 본문은 line-height 1.5~1.7`, 'hard');
  if ((r.centeredLong || []).length) say('글자', '권장', `80자 넘는 글 ${r.centeredLong.length}개가 가운데 정렬이다: ${list(r.centeredLong)}. 줄 시작이 들쭉날쭉해 읽기 어렵다. 긴 글은 왼쪽 정렬로`, 'hard');
  if ((r.italicKo || []).length) say('글자', '권장', `기울인 한글 ${r.italicKo.length}개: ${list(r.italicKo)}. 한글 서체에는 이탤릭이 없어 억지로 기울인 글자가 된다. 강조는 굵기나 색으로`, 'hard');
  if ((r.italicNear || []).length) say('글자', '확인', `한글 문장 안의 영문 이탤릭 ${r.italicNear.length}개: ${list(r.italicNear)}. 한글은 바로 서 있어 영문만 기울면 따로 논다(국내 글에서 AI 티로 꼽혔다). 책·작품 이름이 아니면 바로 세운다`, 'generic', 'decor');
  if ((r.eyebrows || []).length >= 2) say('글자', '확인', `자간을 벌린 작은 대문자 소제목 ${r.eyebrows.length}개: ${list(r.eyebrows)}. AI 기본값으로 많이 꼽히는 모양이다. 의도한 게 아니면 일반 소제목으로`, 'generic', 'decor');
  if ((r.aiFonts || []).length) say('글자', '확인', `AI가 자주 고르는 서체 ${r.aiFonts.join(', ')}. 고른 이유가 있으면 그대로 둔다. 한글이 들어가면 한글 서체를 함께 정한다`, 'generic', 'font');
  // 카드 모양
  if ((r.nestedCards || []).length) say('여백·모양', '권장', `카드 안에 또 카드 ${r.nestedCards.length}군데: ${list(r.nestedCards)}. 바깥 테두리 하나만 두고 안쪽은 여백과 선으로 나눈다`, 'boxed', 'decor');
  if ((r.sideStripes || []).length) say('여백·모양', '확인', `둥근 카드 한쪽에 두꺼운 색 띠 ${r.sideStripes.length}개: ${list(r.sideStripes)}. 「AI가 만든 티」로 가장 많이 꼽히는 모양이다. 상태를 알리려는 거면 글자나 아이콘으로`, 'generic', 'decor');
  if ((r.glass || []).length) say('여백·모양', '확인', `반투명 흐림(글래스) ${r.glass.length}개: ${list(r.glass)}. 뒤에 무엇이 오느냐에 따라 글자 대비가 바뀌고 이 검사는 흐림을 계산하지 못한다. 목적이 없으면 불투명한 면으로`, 'generic', 'decor');
  // 넘침·잘림(브라우저에서만)
  if (r.overflowX > 1) say('여백·모양', '꼭', `페이지가 가로로 ${r.overflowX}px 넘친다(WCAG 2.2 1.4.10). 넘친 것: ${(r.wide || []).map(w => `<${w.tag}${w.cls ? '.' + w.cls : ''}> ${w.over}px`).join(', ') || '?'}`, 'hard');
  if ((r.clipped || []).length) say('여백·모양', '권장', `칸 밖으로 나가 잘린 글자 ${r.clipped.length}개(말줄임 표시 없음): ${list(r.clipped)}. 칸을 늘리거나 줄바꿈을 허용한다`, 'hard');
  if (r.ellipsis >= 10) say('여백·모양', '확인', `말줄임(…)으로 잘린 글자 ${r.ellipsis}개. 다 볼 방법(펼치기, 목록 보기)이 있는지 본다`, 'hard');
  // 누를 곳 크기(브라우저에서만): 24px 미만은 WCAG 2.2 2.5.8(AA, 간격 예외가 있다), 조건의 최소보다 작은 것은 따로
  const targets = r.targets || [], minT = cond?.targetMin || 24;
  const under24 = targets.filter(t => Math.min(t.w, t.h) < 24), underMin = minT > 24 ? targets.filter(t => Math.min(t.w, t.h) >= 24 && Math.min(t.w, t.h) < minT) : [];
  const tlist = a => a.slice(0, 3).map(t => `「${t.sample}」 ${t.w}×${t.h}`).join(', ');
  if (under24.length) say('여백·모양', '권장', `24px보다 작은 누를 곳 ${under24.length}개: ${tlist(under24)}(WCAG 2.2 2.5.8. 이웃과 24px 넘게 떨어져 있으면 예외). 누를 영역을 키운다`, 'hard');
  if (underMin.length) say('여백·모양', '권장', `이 조건의 최소 ${minT}px보다 작은 누를 곳 ${underMin.length}개: ${tlist(underMin)}${cond?.src?.targetMin ? `(${cond.src.targetMin})` : ''}`, 'hard');
  // 상자 관계(브라우저에서만)
  if ((r.tightInset || []).length) say('여백·모양', '권장', `글자가 상자 끝에 8px 안쪽으로 붙은 곳 ${r.tightInset.length}군데: ${r.tightInset.slice(0, 3).map(t => `「${t.sample}」 ${t.gap}px`).join(', ')}. 카드·칸은 12px, 버튼은 좌우 12px 이상 띄운다`, 'boxed');
  if ((r.nearAligned || []).length) say('여백·모양', '확인', `같은 카드 안 글 시작선이 1~3px 어긋난 곳 ${r.nearAligned.length}군데: ${r.nearAligned.slice(0, 2).map(t => `「${t.sample}」 ${t.d}px`).join(', ')}. 실수로 보인다. 맞추거나 들여쓰기면 아이콘 폭만큼 확실히`, 'uneven');
  const fatRows = (r.fatRows || []).filter(t => t.h > (cond?.rowHeight || 0) + 8);
  if (fatRows.length) say('여백·모양', '확인', `한 줄짜리 행이 글자보다 훨씬 높은 목록 ${fatRows.length}개: ${fatRows.slice(0, 2).map(t => `「${t.sample}」 ${t.h}px(${t.of}행 중 ${t.n}행)`).join(', ')}. 행 안에 공기를 넣지 말고 안쪽 여백(12px, 촘촘하면 8px)으로`, 'flat', 'spacing');
  if ((r.unevenPads || []).length) say('여백·모양', '확인', `안쪽 여백이 쪽마다 다른 카드 ${r.unevenPads.length}개: ${r.unevenPads.slice(0, 3).map(t => `「${t.sample}」 위/오른/아래/왼 ${t.pad}px`).join(', ')}. 카드는 네 쪽을 같게(위아래만 조금 줄이는 정도)`, 'uneven', 'spacing');
  // 아이콘
  if ((r.mixedIcons || []).length) say('여백·모양', '확인', `같은 크기 아이콘에 채운 것과 선만 있는 것이 섞였다: ${r.mixedIcons.map(g => `${g.size}px 채움 ${g.filled}·선 ${g.outline}`).join(', ')}. 한 세트·한 굵기로`, 'uneven', 'decor');
  if ((r.emojiIcons || []).length) say('글자', '확인', `아이콘 자리에 이모지 ${r.emojiIcons.length}개: ${list(r.emojiIcons)}. 이모지는 메시지·반응 같은 내용에만, 아이콘은 한 세트로`, 'generic', 'decor');
  if ((r.sparkles || []).length) say('여백·모양', '확인', `AI 기능에 반짝이·마술봉 표시 ${r.sparkles.length}개: ${list(r.sparkles)}. 흔한 AI 기본값이다. 그 기능이 무엇을 하는지 보여 주는 말이나 아이콘으로`, 'generic', 'decor');
  if ((r.inventedMarks || []).length) say('여백·모양', '확인', `색 네모 안 글자 한두 개로 만든 로고 ${r.inventedMarks.length}개: ${list(r.inventedMarks)}. AI가 지어내는 로고 모양이다. 실제 로고나 글자 로고로`, 'generic', 'decor');
  // frontend-design(Anthropic)이 꼽은 기본값(2026-11-06)
  if (r.cardKit) say('여백·모양', '확인', `카드 ${r.cardKit.of}개 중 ${r.cardKit.n}개가 같은 모서리 ${r.cardKit.radius}px에 같은 옅은 그림자다. 흔한 SaaS 카드 세트 모양이다. 중요한 덩어리만 크기·바탕으로 다르게 하고, 나머지는 선이나 여백으로 나눈다`, 'generic', 'shadow');
  if ((r.accentWords || []).length) say('글자', '확인', `제목에서 한 단어만 색·기울임·굵기를 바꾼 곳 ${r.accentWords.length}개: ${r.accentWords.slice(0, 3).map(a => `「${a.sample}」(${a.word})`).join(', ')}. AI가 만든 첫 화면에 흔한 모양이다. 브랜드에서 정한 강조 방식이면 그대로 두고, 아니면 제목은 한 모양으로 두고 강조할 말을 문장 앞에 둔다`, 'generic', 'decor');
  if ((r.numMarks || []).length >= 3) say('글자', '확인', `01·02·03 같은 번호 ${r.numMarks.length}개: ${list(r.numMarks)}. 단계·연표처럼 순서가 있는 내용이 아니면 번호를 뺀다`, 'generic', 'decor');
  if ((r.monoLabels || []).length >= 3) say('글자', '확인', `작은 라벨에만 고정폭 서체 ${r.monoLabels.length}개: ${list(r.monoLabels)}. 흔한 AI 기본값이다. 숫자 자리를 맞추려면 본문 서체에 tabular-nums`, 'generic', 'font');
  if ((r.arrowEnds || []).length >= 2) say('글자', '확인', `링크·버튼 글 끝에 붙인 화살표 ${r.arrowEnds.length}개: ${list(r.arrowEnds)}. 버튼은 무엇이 일어나는지 말로 충분하다. 다른 사이트로 나가는 링크에만 표시한다`, 'generic', 'copy');
  if ((r.entering || []).length >= 3) say('여백·모양', '확인', `들어올 때 움직이는 덩어리 ${r.entering.length}개(fade-up 같은 등장 효과): ${list(r.entering)}. 섹션마다 움직이면 AI 기본값으로 읽힌다. 움직임은 첫 화면 한 번이나 사용자가 누른 뒤 바뀐 곳에만`, 'generic', 'decor');
  if (r.hoverAll) say('여백·모양', '확인', `카드 ${r.hoverAll.n}개 모두 마우스를 올리면 뜨거나 그림자가 커진다${r.hoverAll.clickable < r.hoverAll.n ? `(그중 ${r.hoverAll.n - r.hoverAll.clickable}개는 누를 곳이 없다)` : ''}. 눌리는 카드에만 준다`, r.hoverAll.clickable < r.hoverAll.n ? 'confusing' : 'generic', 'decor');
  if (r.noReducedMotion) say('여백·모양', '확인', '움직임이 있는데 움직임 줄이기 설정(prefers-reduced-motion)을 따르는 CSS가 없다. 그 설정을 켠 사람에게는 등장·반복 움직임을 끈다(WCAG 2.2 2.3.3)', 'hard');
  // 제목 여백(Impeccable), AI 기본값 모양(ai-design-check·Hallmark) — 2026-11-06
  // 같은 단계 제목(h2끼리)은 한 스타일이라 단계마다 센다. 그 단계의 절반 넘게, 두 곳 이상이면 알린다
  const seen = r.headingSeen || {};
  const hg = (r.headingGaps || []).filter(t => { const n = (r.headingGaps || []).filter(x => x.tag === t.tag).length; return n >= 2 && n * 2 >= (seen[t.tag] || 0); });
  if (hg.length) say('여백·모양', '권장', `제목 위 여백이 아래 여백보다 크지 않은 곳 ${hg.length}군데(${[...new Set(hg.map(t => t.tag))].map(tag => `${tag} ${seen[tag]}개 중 ${hg.filter(t => t.tag === tag).length}개`).join(', ')}): ${hg.slice(0, 3).map(t => `「${t.sample}」 위 ${t.above}/아래 ${t.below}px`).join(', ')}. 제목이 앞 내용과 뒤 내용 사이에 떠서 어느 쪽 제목인지 흐려진다. 위 여백을 아래의 1.5~2배로(예: 위 32, 아래 12)`, 'flat', 'spacing');
  if ((r.iconHeads || []).length >= 3) say('여백·모양', '확인', `제목마다 앞에 색 네모(동그라미) 아이콘 상자 ${r.iconHeads.length}개: ${list(r.iconHeads)}. AI가 기능 소개 카드에 습관처럼 붙이는 모양이다. 아이콘이 항목을 구별해 주지 않으면 빼고 제목만으로`, 'generic', 'decor');
  if ((r.pillBadges || []).length) say('여백·모양', '확인', `큰 제목 바로 위 알약 배지 ${r.pillBadges.length}개: ${list(r.pillBadges)}. AI가 만든 첫 화면에 흔한 모양이다. 정말 알릴 새 소식이면 제목 아래 문장이나 배너로`, 'generic', 'decor');
  if (r.pillButtons) say('여백·모양', '확인', `색을 채운 버튼 ${r.pillButtons.of}개 중 ${r.pillButtons.n}개가 알약 모양(끝이 완전히 둥금)이다. AI 기본값으로 꼽히는 모양이다. 브랜드에서 정한 모양이면 그대로 두고, 아니면 입력칸·카드 모서리와 맞춘다`, 'generic', 'radius');
  if (r.layout === false) say('여백·모양', '정보', '넘침·잘림, 누를 곳 크기, 상자 끝에 붙은 글자, 어긋난 시작선, 높은 행, 글자 로고는 브라우저에서 잴 때만 본다');
  if ((r.aiDefaults || []).length) say('색', '확인', `${r.aiDefaults.join(', ')}. 보라 그라데이션을 막으면 AI가 다음으로 고르는 조합이다(2026-11-03 조사)${r.aiDefaults.some(x => /크림/.test(x)) ? '. 크림 바탕은 AI 페이지에서 훨씬 자주 나온다(ai-design-check 2026-10-28 측정: AI 40%, 사람 3%)' : ''}. 브랜드에서 정한 색이면 그대로 둔다`, 'generic', 'palette');
  return out;
}

// ---------- 실패 이름 ----------
// 「밤티 같다」를 고칠 수 있는 말로 나눈 것(references/failures.md). 고치는 순서도 이 순서다
const FAILS = { accident: '사고 위험', hard: '읽기·누르기 어려움', confusing: '헷갈림', missing: '빠진 상태', mismatch: '조건에 안 맞음', flat: '위계 없음', boxed: '상자 남발', uneven: '제각각', generic: '흔한 기본값' };
// 「해당하는 실패: 위계 없음 2 · 흔한 기본값 3」. 걸린 게 없으면 빈 문자열
function failSummary(findings) {
  const n = {};
  for (const f of findings) if (f.fail) n[f.fail] = (n[f.fail] || 0) + 1;
  const keys = Object.keys(FAILS).filter(k => n[k]);
  return keys.length ? `해당하는 실패: ${keys.map(k => `${FAILS[k]} ${n[k]}`).join(' · ')}` : '';
}
// 고칠 것이 없으면 그렇다고 말한다. 빈 결과를 채우려고 사소한 것을 지어내지 않게 한다(unslop(CC BY 4.0)의 「괜찮으면 괜찮다고 말한다」에서 생각을 얻었다, 2026-11-06)
function cleanNote(main, ask = []) {
  return main.some(f => ['꼭', '권장', '확인'].includes(f.level)) || ask.length ? '' : '검사로 잡힌 고칠 것 없음. 억지로 고칠 곳을 찾지 않는다. 검사가 못 보는 것(가져갈 것이 맨 앞인가, 390px 폭, 눌렀을 때)만 스크린샷과 눌러 보기로 확인한다';
}

// ---------- 서비스에서 정한 것 ----------
// 브랜드·사내 시스템이 일부러 정했을 수 있는 주제. 규칙이 있는 서비스에서 이것을 「고칠 것」으로 말하면 브랜드를 흔한 관례로 깎는다
const HOUSE_TOPICS = { accent: '강조색 쓰는 범위', palette: '색 팔레트', font: '서체', typescale: '글자 크기 단계', weight: '굵기', spacing: '여백 단계', radius: '모서리', shadow: '그림자', decor: '장식(카드 띠·글래스·대문자 소제목·카드 안 카드·이모지 제목)', copy: '글투', pattern: '패턴 방식' };
// rules: design-rules.json 내용({ decided: { font: '…', 'pattern.loading': '…' } }) 또는 { house: true }. 없으면 그대로 돌려준다
// 돌려주는 것: { main: 그대로 말할 것, ask: 정한 건지 물을 것, skipped: 정해 둬서 뺀 주제 이름 }
function visualHouse(findings, rules) {
  if (!rules || !(rules.house || rules.decided)) return { main: findings, ask: [], skipped: [] };
  const keys = Object.keys(rules.decided || {});
  const main = [], ask = [], skipped = new Set();
  for (const f of findings) {
    if (!f.topic) main.push(f);
    else if (keys.some(k => f.topic === k || f.topic.startsWith(k + '.'))) skipped.add(HOUSE_TOPICS[f.topic.split('.')[0]] || f.topic);
    else ask.push(f);
  }
  return { main, ask, skipped: [...skipped] };
}
const houseName = topic => `${HOUSE_TOPICS[topic.split('.')[0]] || topic}${topic.includes('.') ? `(${topic.split('.')[1]})` : ''}`;

// ---------- 화면끼리 견주기 ----------
// list: [{ label, sig }]. sig는 visualAudit(...).sig. 두 개면 「전·후」, 여럿이면 「화면끼리」 어긋난 값을 문장으로 돌려준다
// 화면마다 모양이 흔들리는 것(결제 페이지만 파랑이 다름, 모서리 8px→6px)이 AI로 만든 화면의 큰 불만이다(2026-11-03 조사)
function visualCompare(list) {
  if (!list) { try { list = JSON.parse(sessionStorage.getItem('__visualSigs') || '[]'); } catch (e) { list = []; } }
  if (list.length < 2) return '견줄 화면이 두 개 이상 있어야 한다. 화면마다 visualCollect("이름")을 부른다';
  const out = [], labels = list.map(x => x.label);
  const join = vals => list.map((x, i) => `${x.label} ${vals[i]}`).join(' · ');
  const same = (name, pick, fmt = v => v) => { const vals = list.map(x => pick(x.sig)); const keys = vals.map(v => JSON.stringify(v)); if (new Set(keys).size > 1) out.push(`${name}: ${join(vals.map(v => v == null ? '없음' : fmt(v)))}`); };
  same('바탕', s => s.pageBg);
  same('본문 크기', s => s.bodySize, v => `${v}px`);
  same('서체', s => s.families, v => v.join(', ') || '?');
  same('문장 안 링크 색', s => s.link);
  ['h1', 'h2', 'h3'].forEach(tag => { if (list.some(x => x.sig.headings && x.sig.headings[tag])) same(`${tag} 크기/굵기`, s => (s.headings && s.headings[tag]) || null, v => v.join(', ')); });
  // 채운 버튼: 화면마다 가장 많이 쓴 채운 버튼(색|모서리|높이|글자)
  const primary = s => Object.entries(s.buttons || {}).filter(([k]) => !/^(none|gray)\|/.test(k)).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  same('주 버튼(색|모서리|높이|글자)', primary);
  // 모서리: 어느 화면에만 있는 값
  const allR = [...new Set(list.flatMap(x => x.sig.radii || []))];
  const onlySome = allR.filter(v => list.filter(x => (x.sig.radii || []).includes(v)).length < list.length);
  if (onlySome.length) out.push(`모서리 값이 화면마다 다르다: ${onlySome.map(v => `${v}px(${list.filter(x => (x.sig.radii || []).includes(v)).map(x => x.label).join(', ')})`).join(' · ')}`);
  // 비슷하지만 다른 색: 색상 8도, 채도 0.12, 밝기 0.06 안쪽인데 값이 다른 색이 서로 다른 화면에 있다
  const hsl = h => { const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return { h: 0, s: 0, l }; const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); const hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: hh * 60, s, l }; };
  const where = {};
  list.forEach(x => (x.sig.colors || []).forEach(c => { (where[c.hex] ||= new Set()).add(x.label); }));
  const hexes = Object.keys(where), near = [];
  for (let i = 0; i < hexes.length; i++) for (let j = i + 1; j < hexes.length; j++) {
    const a = hsl(hexes[i]), b = hsl(hexes[j]), dh = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
    const pa = [...where[hexes[i]]], pb = [...where[hexes[j]]];
    if (dh <= 8 && Math.abs(a.s - b.s) <= 0.12 && Math.abs(a.l - b.l) <= 0.06 && (pa.some(p => !pb.includes(p)) || pb.some(p => !pa.includes(p)))) near.push(`${hexes[i]}(${pa.join(', ')}) ↔ ${hexes[j]}(${pb.join(', ')})`);
  }
  if (near.length) out.push(`비슷하지만 다른 색: ${near.slice(0, 4).join(' · ')}. 하나로 맞춘다`);
  const head = list.length === 2 ? `전·후(${labels.join(' → ')})에 달라진 값` : `화면 ${list.length}개(${labels.join(', ')})에서 어긋난 값(제각각)`;
  return out.length ? `${head}\n- ${out.join('\n- ')}` : `${head}: 없음. 견준 값(바탕, 본문 크기, 서체, 제목, 주 버튼, 링크 색, 모서리, 비슷한 색)이 모두 같다`;
}

// 브라우저용: 화면마다 부르면 재 본 값을 이 탭(sessionStorage, 같은 사이트 안)에 모은다. 다 모으면 visualCompare()
function visualCollect(label, doc, win) {
  const w = win || window, sig = visualAudit(doc || document, w).sig;
  let all = [];
  try { all = JSON.parse(w.sessionStorage.getItem('__visualSigs') || '[]'); } catch (e) { all = []; }
  all = all.filter(x => x.label !== (label || sig.url)).concat({ label: label || sig.url, sig });
  try { w.sessionStorage.setItem('__visualSigs', JSON.stringify(all)); } catch (e) { return '이 페이지에서는 모아 둘 수 없다. JSON.stringify(visualAudit(document, window).sig)를 화면마다 받아 compare-pages.mjs로 견준다'; }
  return `모은 화면 ${all.length}개: ${all.map(x => x.label).join(', ')}`;
}
function visualForget(win) { try { (win || window).sessionStorage.removeItem('__visualSigs'); } catch (e) { /* 없음 */ } return '모은 화면을 지웠다'; }

// 브라우저용: 짧은 리뷰 글을 바로 돌려준다. 도구 출력이 잘리지 않게 max 글자씩 쪽을 나눈다(page=1부터)
// 서비스 규칙이 있으면 먼저 window.__designRules = { house: true } 또는 design-rules.json 내용을 넣는다. 쪽을 넘겨도 남아 있다
function visualReport(doc, win, page = 1, max = 900) {
  const w = win || window;
  const r = visualAudit(doc || document, w);
  const order = ['꼭', '권장', '확인', '좋음', '정보'];
  const h = visualHouse(visualJudge(r, w.__designCond), w.__designRules);
  const lines = (failSummary(h.main) ? [failSummary(h.main)] : cleanNote(h.main, h.ask) ? [cleanNote(h.main, h.ask)] : []).concat(h.main.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level)).map(f => `[${f.level === '정보' ? '값' : f.level}·${f.fail ? FAILS[f.fail] : f.sec}] ${f.text}`))
    .concat(h.ask.map(f => `[정한 건지 확인·${houseName(f.topic)}${f.fail ? `·${FAILS[f.fail]}` : ''}] ${f.text}`))
    .concat(h.skipped.length ? [`[정해 둬서 뺌] ${h.skipped.join(', ')}. 정한 값과 맞는지는 아직 재지 않는다`] : []);
  const pages = [[]];
  let len = 0;
  for (const l of lines) { if (len + l.length > max && pages[pages.length - 1].length) { pages.push([]); len = 0; } pages[pages.length - 1].push(l); len += l.length + 1; }
  const n = Math.min(Math.max(1, page), pages.length);
  return pages[n - 1].join('\n') + (pages.length > 1 ? `\n(${n}/${pages.length}쪽${n < pages.length ? `, 다음: visualReport(document, window, ${n + 1})` : ''})` : '');
}
if (typeof module !== 'undefined') module.exports = { visualAudit, visualJudge, visualHouse, visualReport, visualCompare, visualCollect, visualForget, houseName, failSummary, cleanNote, HOUSE_TOPICS, FAILS };
