// 스킬 문서 references/ux-basics.md를 data/ux.json에서 쓴다. 규칙은 data/ux.json 한 곳에서 고친다
// 실행: node tools/ux-doc.mjs  (npm run check가 문서가 이 출력과 다르면 실패한다)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = join(ROOT, 'data', 'ux.json');
export const DOC = join(ROOT, '.claude', 'skills', 'design-agent', 'references', 'ux-basics.md');

const sourceText = s => `${s.name}${s.note ? `(${s.note})` : ''}`;

// 근거 줄: 앞 글 + 출처 목록 + 뒤 글. 출처도 앞뒤 글도 없으면 줄을 뺀다
export function basisLine(r) {
  const list = (r.sources || []).map(sourceText).join(', ');
  if (!list && !r.sourcesBefore) return null;
  // 우리 규칙(ours)이라는 말은 글에 따로 적지 않고 여기서 붙인다. 페이지는 같은 값을 「우리 규칙」 표시로 보인다
  return `${r.ours ? '우리 규칙이다. ' : ''}${r.sourcesBefore ? `${r.sourcesBefore} ` : ''}${list}${r.sourcesAfter ? `. ${r.sourcesAfter}` : ''}`;
}

export const checkLine = r => (r.check ?? `없음${r.checkNote ? `. ${r.checkNote}` : ''}`);

export function render(ux) {
  const { doc } = ux;
  const out = [`# ${doc.title}`, '', `<!-- data/ux.json에서 만든다. 고칠 때는 data/ux.json을 고치고 node tools/ux-doc.mjs를 돌린다 -->`, ''];
  for (const p of doc.intro) out.push(p, '');
  out.push('## 읽는 법', '');
  for (const b of doc.read) {
    out.push(b.text, '');
    if (b.items) {
      const items = b.items === 'levels' ? ux.levels.map(l => `${l.id}: ${l.desc}`) : b.items;
      out.push(...items.map(i => `- ${i}`), '');
    }
  }
  for (const g of ux.groups) {
    out.push(`## ${g.name}`, '', `${g.desc} 실패 이름은 「${g.fail}」.`, '');
    for (const r of ux.rules.filter(x => x.group === g.id)) {
      out.push(`- **${r.id} (${r.level}) ${r.rule}.**`);
      if (r.detail) out.push(`  - ${r.detail}`);
      if (r.except) out.push(`  - 예외: ${r.except}`);
      out.push(`  - 눈으로: ${r.see}`);
      out.push(`  - 검사: ${checkLine(r)}`);
      const basis = basisLine(r);
      if (basis) out.push(`  - 근거: ${basis}`);
    }
    out.push('');
  }
  out.push('## 리뷰에 쓰는 법', '', ...doc.review.map(i => `- ${i}`));
  return `${out.join('\n')}\n`;
}

export const expected = () => render(JSON.parse(readFileSync(DATA, 'utf8')));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(DOC, expected());
  console.log(`썼다: ${DOC.slice(ROOT.length + 1)}`);
}
