// 「우리가 정한 기준을 싹 다 돌리나」를 보는 두 가지(2026-11-10)
// 1. 기준 세기: visual-audit.js의 판단 문장(say)과 check-screen.mjs의 규칙(FAIL)마다, 그것을 거는 시험 화면이 하나 이상 있나
// 2. aria-hidden 변형: 시험 화면의 아이콘·이모지에 aria-hidden을 붙여도 모양 검사 결과가 같나
//    (aria-hidden 이모지를 「안 보이는 것」으로 쳐서 통째로 놓친 일이 있었다)
import { readFileSync } from 'node:fs';

// visualJudge 안 say(구역, 단계, `문장`)의 문장을 글 조각으로 나눠, ${…} 자리는 아무 글이나 맞게 한 정규식을 만든다
export function visualCriteria(src) {
  const body = src.slice(src.indexOf('function visualJudge'), src.indexOf('function visualHouse'));
  const skipStr = (s, i, q) => { for (i++; i < s.length; i++) { if (s[i] === '\\') { i++; continue; } if (s[i] === q) return i; } return i; };
  function tpl(s, i) {
    const parts = ['']; i++;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { parts[parts.length - 1] += s[i + 1]; i++; continue; }
      if (c === '`') return [i, parts];
      if (c === '$' && s[i + 1] === '{') { i = expr(s, i + 2); parts.push(''); continue; }
      parts[parts.length - 1] += c;
    }
    return [i, parts];
  }
  // 정규식 글자(/…/)는 앞 글자가 연산자·여는 괄호일 때로 본다. 안의 { } 를 괄호로 세지 않는다
  const skipRegex = (s, i) => { let cls = false; for (i++; i < s.length; i++) { const c = s[i]; if (c === '\\') { i++; continue; } if (c === '[') cls = true; else if (c === ']') cls = false; else if (c === '/' && !cls) return i; } return i; };
  const regexStart = (s, i) => { let j = i - 1; while (j >= 0 && /\s/.test(s[j])) j--; return j < 0 || /[(,=:[!&|?{};+\-*%<>~^]/.test(s[j]); };
  function expr(s, i) {
    let d = 1;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === "'" || c === '"') { i = skipStr(s, i, c); continue; }
      if (c === '/' && s[i + 1] !== '/' && s[i + 1] !== '*' && regexStart(s, i)) { i = skipRegex(s, i); continue; }
      if (c === '`') { i = tpl(s, i)[0]; continue; }
      if (c === '{') d++;
      else if (c === '}' && --d === 0) return i;
    }
    return i;
  }
  const out = [], re = /say\(\s*'([^']+)'\s*,\s*([^,]+?)\s*,\s*`/g; let m;
  while ((m = re.exec(body))) {
    const [end, parts] = tpl(body, re.lastIndex - 1);
    re.lastIndex = end;
    const lits = parts.map(p => p.trim()).filter(Boolean);
    const label = (lits.find(p => p.length >= 6) || lits.sort((a, b) => b.length - a.length)[0] || '').slice(0, 36);
    out.push({ sec: m[1], label, rx: new RegExp(parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]*?')) });
  }
  return out;
}

// check-screen.mjs의 규칙 이름(FAIL 표의 열쇠)
export function screenRules(src) {
  const m = src.match(/const FAIL = \{([^}]*)\}/);
  return m ? [...m[1].matchAll(/'([^']+)'\s*:/g)].map(x => x[1]) : [];
}

// 아이콘·이모지·기호 한 글자짜리 span/i, svg, 빈 alt img에 aria-hidden을 붙인다. 화면 모양은 그대로다
export function ariaHideDecor(html) {
  const add = tag => tag.includes('aria-hidden') ? tag : tag.replace(/^<(\w+)/, '<$1 aria-hidden="true"');
  return html
    .replace(/<svg\b[^>]*>/g, add)
    .replace(/<img\b[^>]*\balt=""[^>]*>/g, add)
    .replace(/(<(span|i)\b[^>]*>)(\s*(?:\p{Extended_Pictographic}️?|[→⟶➔➜✕✖×‹›⋯…☰])\s*)(<\/\2>)/gu, (_, open, t, inner, close) => add(open) + inner + close);
}

// 출력에서 화면 읽기 프로그램을 보는 줄(aria-hidden이면 달라지는 게 맞는 줄)과 파일 이름 줄을 뺀다
const AT_LINES = /기호 하나만 있는 버튼|기호만 있는 버튼|클래스\(on, active 등\)로만|이름 없는 버튼|아이콘만 있는 버튼|해당하는 실패:|^(검사|색·글자·여백 진단):/;
export const visualLines = out => out.split('\n').filter(l => !AT_LINES.test(l)).join('\n');

export const readSrc = p => readFileSync(p, 'utf8');
