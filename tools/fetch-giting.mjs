// giting.kr 메뉴판 데이터를 받는다. 출처: https://github.com/hanmariyang/giting-skills (MIT, Copyright (c) 2026 Giting (hanmariyang))
// 실행: node tools/fetch-giting.mjs
// - data/giting/{묶음}.json : 메뉴판 데이터 원본 그대로
// - data/giting/LICENSE     : MIT 원문(고지를 함께 둬야 쓸 수 있다)
// - public/giting/ui-menu/{id}.html : ui-menu 데모. 컴포넌트 사전 페이지가 작은 창으로 띄운다
import { mkdir, writeFile } from 'node:fs/promises';
import { repaint } from './giting-palette.mjs';

const RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/HEAD';
const MENUS = ['ui-menu', 'app-menu', 'landing-menu', 'carousel-menu', 'css-menu', 'type-menu', 'font-menu', 'thumb-menu', 'codelazy', 'motion-menu'];

const get = async path => {
  const r = await fetch(`${RAW}/${path}`);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.text();
};

await mkdir('data/giting', { recursive: true });
await mkdir('public/giting/ui-menu', { recursive: true });
await writeFile('data/giting/LICENSE', await get('LICENSE'));
for (const m of MENUS) {
  const text = await get(`plugins/${m}/menu.json`);
  JSON.parse(text); // 깨진 파일을 저장하지 않게
  await writeFile(`data/giting/${m}.json`, text);
  console.log(m, JSON.parse(text).items.length);
}

const ui = JSON.parse(await get('plugins/ui-menu/menu.json'));
let ok = 0;
const missing = [];
for (const it of ui.items) {
  try {
    // 사이트 색으로 바꿔 저장한다(tools/giting-palette.mjs)
    await writeFile(`public/giting/ui-menu/${it.id}.html`, repaint(await get(`plugins/ui-menu/components/${it.id}.html`)));
    ok++;
  } catch { missing.push(it.id); }
}
console.log('ui-menu 데모', ok, '/ 데모 없음', missing.length, missing.join(' '));
