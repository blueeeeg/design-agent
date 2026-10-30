#!/usr/bin/env node
// 컴포넌트 사전 찾기. 이름(한·영)·쉬운 말·설명에서 찾는다. 데이터: data/giting/ (giting.kr 메뉴판, MIT, Copyright (c) 2026 Giting (hanmariyang))
// 쓰는 법: node component.mjs 바텀시트        node component.mjs "아래에서 올라오는"
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const MENUS = { 'ui-menu': '웹 컴포넌트', 'app-menu': '앱 컴포넌트', 'landing-menu': '랜딩 섹션' };
const q = process.argv.slice(2).join(' ').toLowerCase().replace(/\s+/g, '');
if (!q) { console.error('찾을 말을 넣어 주세요. 예: node component.mjs 바텀시트'); process.exit(1); }

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
const hits = [];
for (const [menu, title] of Object.entries(MENUS)) {
  const d = JSON.parse(readFileSync(join(ROOT, 'data', 'giting', `${menu}.json`), 'utf8'));
  for (const it of d.items) {
    const name = typeof it.name === 'string' ? { ko: it.name, en: '' } : it.name;
    // 이름이 맞으면 앞에, 설명에만 있으면 뒤에
    const rank = [name.ko, name.en, it.id].some(s => norm(s).includes(q)) ? 0
      : (it.aliases || []).some(s => norm(s).includes(q)) ? 1
      : norm(`${it.oneliner} ${it.vs}`).includes(q) ? 2 : -1;
    if (rank >= 0) hits.push({ rank, menu, title, it, name });
  }
}
hits.sort((a, b) => a.rank - b.rank);
if (!hits.length) { console.log('찾은 컴포넌트가 없습니다. 다른 말로 찾아 보세요(영어 이름이나 쉬운 말).'); process.exit(0); }
for (const { menu, title, it, name } of hits.slice(0, 8)) {
  console.log(`## ${name.ko}${name.en ? ` (${name.en})` : ''} — ${title}`);
  if (it.aliases?.length) console.log(`  쉬운 말: ${it.aliases.map(a => `「${a}」`).join(' ')}`);
  if (it.oneliner) console.log(`  설명: ${it.oneliner}`);
  if (it.vs) console.log(`  헷갈리면: ${it.vs}`);
  if (it.ask) console.log(`  AI에게: ${it.ask}`);
  console.log(`  보기: https://giting.kr/menu/${menu}/${it.id}${menu === 'ui-menu' ? `  · 데모 파일 public/giting/ui-menu/${it.id}.html` : ''}\n`);
}
if (hits.length > 8) console.log(`(그 밖에 ${hits.length - 8}개 더)`);
