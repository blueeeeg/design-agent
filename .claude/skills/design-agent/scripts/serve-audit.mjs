#!/usr/bin/env node
// 브라우저에 띄운 페이지(어느 주소든)에서 visual-audit.js를 불러 쓰게 이 파일 하나만 내주는 작은 서버. 이 PC(127.0.0.1)에서만 열린다
// 쓰는 법: node serve-audit.mjs   → 페이지에서
//   const t = await (await fetch('http://127.0.0.1:4412/visual-audit.js')).text(); (0, eval)(t); visualReport(document, window)
// 페이지가 CSP로 eval·fetch를 막으면 안 된다. 그때는 visual-audit.js 내용을 그대로 붙여 실행한다
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = join(dirname(fileURLToPath(import.meta.url)), 'visual-audit.js');
const PORT = Number(process.env.PORT || 4412);
createServer((req, res) => {
  // 다른 주소의 페이지가 이 PC로 요청할 수 있게 허락한다(Chrome의 사설망 접근 확인 포함)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url.split('?')[0] !== '/visual-audit.js') { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(readFileSync(FILE));
}).listen(PORT, '127.0.0.1', () => console.log(`visual-audit.js: http://127.0.0.1:${PORT}/visual-audit.js`));
