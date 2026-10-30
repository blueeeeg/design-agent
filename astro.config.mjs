import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

/* refs-private 갤러리를 개발 서버의 /refs/ 에서만 보여준다.
   빌드에는 넣지 않는다. 외부 사이트 이미지라 배포하면 안 된다(CLAUDE.md) */
const REFS = path.resolve('refs-private');
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4' };
const refsDev = {
  name: 'refs-private-dev',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/refs', (req, res, next) => {
        const url = decodeURIComponent(req.url.split('?')[0]);
        const file = path.join(REFS, url.endsWith('/') ? url + 'index.html' : url);
        if (!file.startsWith(REFS + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { next(); return; }
        res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
  },
};

export default defineConfig({
  // 요소 주소를 /elements/loading/ 처럼 폴더로 만든다
  trailingSlash: 'always',
  integrations: [refsDev],
});
