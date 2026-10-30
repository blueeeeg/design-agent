// 에이전트가 읽는 규칙 요약. data/*.json에서 만든다. 빌드하면 dist/llms.txt
import axesData from '../../data/axes.json';
import elementsData from '../../data/elements.json';
import antiData from '../../data/anti-defaults.json';
import systemsData from '../../data/systems.json';

type Rule = [string, string, string, string?, string?];

const axes = [...axesData.axes.filter(a => !a.hidden), axesData.action];
const label = (axis: string, opt: string) => axes.find(a => a.key === axis)?.options.find(o => o.id === opt)?.label ?? opt;
// 숨은 domain 축 항목은 점수에 들어가지 않으니 뺀다
const live = (rs: Rule[] = []) => rs.filter(r => r[0] !== 'domain');
const sys = Object.fromEntries(systemsData.systems.map(s => [s.id, s.short]));
type Guide = { text: string; opt: string | null; refs: Record<string, string | null> };
const guidance = systemsData.guidance as Record<string, Guide[]>;
const guideLine = (g: Guide) => `${g.text} (${Object.keys(g.refs).map(b => sys[b]).join(', ')})`;
const line = (r: Rule) => `${label(r[0], r[1])} [${r[2]}]${r[3] ? ` ${r[3]}` : ''}${r[4] ? ` (출처: ${r[4]})` : ''}`;

export function GET() {
  const out = [
    '# UI 패턴 카탈로그',
    '',
    '> 로딩, 삭제, 장바구니처럼 상황마다 고르는 UI 패턴의 방식과, 서비스 조건에 따라 어느 방식을 고르는지 정리한 규칙이다. 강도는 제약(출처가 있는 기준, 100점) > 관례(3점) > 예시(1점). 쓰는 곳에 맞으면 더하고 피하는 곳에 걸리면 뺀다.',
    '',
    '## 조건 축',
    ...axes.map(a => `- ${a.name}: ${a.options.map(o => `${o.label}(${o.id})`).join(', ')}`),
    '',
    '## 쓰지 말 것',
    ...antiData.items.map(t => `- ${t}`),
    '',
    '## 패턴과 방식',
    ...elementsData.elements.flatMap(el => [
      '',
      `### ${el.name} (${el.en}) — ${el.q}`,
      ...el.options.flatMap(o => [
        `- ${o.name} (${o.en}): ${o.desc}${o.giting ? ` · 이름·데모 https://giting.kr/menu/${o.giting}` : ''}`,
        ...live(o.fits as Rule[]).map(r => `  - 쓰는 곳: ${line(r)}`),
        ...live(o.avoid as Rule[]).map(r => `  - 피하는 곳: ${line(r)}`),
        ...(guidance[el.id] || []).filter(g => g.opt === o.id).map(g => `  - 디자인 시스템: ${guideLine(g)}`),
      ]),
      ...(guidance[el.id] || []).filter(g => !g.opt).map(g => `- 디자인 시스템 공통: ${guideLine(g)}`),
    ]),
    '',
  ];
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
