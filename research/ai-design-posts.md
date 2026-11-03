# AI로 화면을 만들고 고칠 때의 불만과 해법 (공개 글 조사)

2026-11-03 조사. 사람들이 AI로 화면을 만들거나 고칠 때 어디서 막히는지, 어떻게 풀었다고 하는지 모으고, design-agent 스킬이 무엇을 이미 잡고 무엇을 놓치는지 맞춰 봤다.

## 범위와 한계

- 국내 글 40개: GeekNews, brunch, 요즘IT, maily, PyTorchKR 포럼, tilnote, 개인·업체 블로그, Anthropic 한국어 글
- 해외 글 34개: Hacker News 스레드, Reddit r/ClaudeAI(미러 사이트에 남은 3개), Figma·Cursor 포럼, 개인·회사 블로그
- Threads: 로그인 없이 검색되는 결과 약 60개(검색어 「AI 디자인」「클로드 디자인」「바이브코딩」「UI디자인」)와 그중 3개 글의 본문·댓글
- reddit.com과 X는 직접 열리지 않았다. Threads는 로그인하지 않으면 검색어마다 15~20개만 보이고, 여러 낱말 검색은 결과가 없을 때가 많다
- 효과 주장은 거의 다 쓴 사람의 체감이다. 잰 수치가 있는 것은 Atlassian의 DESIGN.md 실험, Show HN 사이트 1,590개 검사 정도다
- 강좌·외주·자기 도구 홍보가 섞인 글이 많다. 아래 링크 목록에 [홍보]로 표시했다
- 글쓴이 이름은 본문에 적지 않는다. 링크와 우리 말 요약만 둔다

## 결론

- 가장 많은 불만은 「다 비슷하다」(국내 19개, 해외 24개 글). 사람들이 꼽는 원인은 색·글꼴보다 「판단 기준이 없다」는 쪽이다. 조건을 묻고 상황마다 방식을 고르게 하는 이 프로젝트의 방향과 맞는다
- DESIGN.md·토큰이 가장 많이 쓰이는 해법이고 체감 효과도 가장 많이 보고됐다. 그런데 레이아웃 반복(같은 뼈대, 가운데 정렬, 카드 한 줄)은 못 막는다는 반론이 따로 나왔다
- 금지 목록은 다음 기본값으로 옮겨 갈 뿐이라는 지적이 해외에서 여러 번 나왔다(「2세대 슬롭」)
- 화면을 고칠 때와 화면이 여러 장일 때의 문제(흔들림, 고치지 않은 곳이 바뀜)를 다루는 도구는 글에서 보지 못했다
- 「디자인 스킬을 깔아도 나아진 게 없다」는 글이 국내외에 다 있다. 스킬 소개보다 쓰기 전·후를 숫자로 보여 주는 예가 필요하다

## 많이 나온 문제

1. 결과물이 다 비슷하다: 가운데 큰 제목 → 기능 카드 3~4개 → 후기 → 푸터. 빵집도 SaaS 대시보드처럼 나온다. 원인으로 학습 데이터 평균, v0·Lovable·Cursor가 모두 shadcn 기본값으로 모이는 것이 꼽혔다
2. 화면이 늘수록, 세션이 바뀔수록 모양이 흔들린다: 결제 페이지만 파랑이 다르다, 모서리가 8px에서 6px로, 상태 색이 화면마다 다르다(국내 9, 해외 8)
3. 하나를 고치면 다른 데가 바뀐다, 시키지 않은 것을 바꾼다: 링크 하나 고치랬더니 레이아웃까지 다시 썼다, 한 섹션 스타일이 페이지 전체로 번졌다(국내 5, 해외 7)
4. 디자인 시스템·컴포넌트·수치 지시를 무시한다: 있는 컴포넌트를 import하지 않고 다시 그린다, 240px 사이드바가 280px로, 토큰 대신 색을 박는다(국내 6, 해외 7)
5. 「예쁘게」「프리미엄」 같은 형용사가 평균으로 끝난다: 프리미엄은 검정+골드, 부드러운은 파스텔(국내 7)
6. 무엇을 강조할지 모른다: 모든 정보를 카드로 감싸 위계가 흐려진다, 버튼 3개가 주목을 다툰다(국내 5)
7. 금지하면 다음 기본값으로 옮겨 간다: 보라를 막으면 크림 배경·세리프·테라코타, Inter를 막으면 Space Grotesk(해외 6)
8. 지어낸 문구·숫자: 「10,000% ROI」, 모든 제목 아래 뻔한 설명, 「A가 아니라 B」 문장, 구현 메모가 화면에 찍힘(국내 3, 해외 6)
9. 상태 화면이 빠진다: 빈 화면·로딩·오류·폼 검증이 없다. 요청하지 않으면 안 만든다(국내 2, 해외 5)
10. 대비·접근성이 낮다: 다크 모드에 회색 본문, 글래스 카드 위 글자(국내 2, 해외 5)
11. 모바일 깨짐·넘침·겹침(국내 2, 해외 4)
12. 한글 조판(국내에만): 한글 명조 옆 영문 이탤릭, 본문 가운데 정렬, 영문 기준으로 좁은 행간·자간. 행간 기준을 물으면 맞게 답하면서 결과에는 반영하지 않는다
13. 멈춘 화면으로는 동작 문제를 못 찾는다: 꺼진 버튼에 이유가 없음, 폼이 말없이 입력을 거부함, 지운 결과가 가려짐은 눌러 봐야 보인다(Threads에 정리된 2026년 연구)
14. 디자인 스킬을 써도 나아지지 않는다, 기계적이다(Threads, r/ClaudeAI, GeekNews 댓글)
15. 그 밖에: 비용·사용량 한도, Figma와 코드 연결이 어긋남, 저작권(유명 사이트 DESIGN.md를 통째로 써도 되나, 상업 사용 금지 폰트)

## 사람들이 쓰는 해법

- DESIGN.md 같은 기준 파일(가장 많음). 레이아웃 반복은 남고, 코드에 이미 디자인 시스템이 있으면 충돌한다는 반론이 있다. Atlassian 실험에서는 단발 시안에는 좋았지만 실제 제품 작업에서는 MCP보다 비싸고 느렸다
- 판단 기준과 맥락을 준다: 쓰는 사람, 목적, 정보 우선순위, 하지 말 것
- 디자인 스킬(frontend-design, Impeccable, taste-skill, ui-ux-pro-max, interface-design, StyleSeed 등): 평이 엇갈린다
- 레퍼런스·스크린샷을 준다, 이미 있는 스타일 이름을 댄다(macOS HIG, Qt 등)
- 금지 목록과 구체 수치: 방향 없이 금지만 하면 다른 기본값으로 옮겨 간다
- 작게 나눠 고친다: 바뀔 곳만 지시, 「다른 요소에 적용하지 마」, 고칠 때마다 git 커밋
- 컴포넌트 라이브러리·토큰을 기준으로 삼고 재사용을 강제한다
- 화면을 찍어 비교하는 루프(Playwright MCP), 검출기·린터(`npx impeccable detect`, `design.md lint`)
- 상태 화면을 처음부터 요구한다
- 마지막은 사람이 다듬는다. AI 결과를 버릴 시안으로 본다

## 「AI가 만든 티」로 꼽힌 모양

- 색: 보라~파랑 그라데이션, 인디고 포인트, 어두운 바탕에 네온 하나, 오로라 광채, 순수 회색 본문. 2세대로 크림·베이지 바탕에 테라코타·녹슨 주황
- 글꼴: Inter, Space Grotesk, Geist, Instrument Serif, 서체 하나로 평평한 위계, 지나치게 큰 히어로 제목, 제목 속 한 단어만 이탤릭, 자간 벌린 대문자 소제목(eyebrow), 제목 위 알약 배지
- 레이아웃: 가운데 히어로 → 로고 줄 → 기능 카드 3개, 큰 숫자 줄, 01/02/03 번호, 모두 가운데 정렬
- 카드: 카드 안 카드, 둥근 카드 한쪽의 두꺼운 색 띠(「가장 알아보기 쉬운 표시」라는 평), 같은 모서리·그림자 반복, 목적 없는 글래스모피즘, 지나치게 둥근 모서리
- 아이콘·이모지: 제목 위 아이콘 타일, 내비게이션의 이모지
- 움직임: 똑같은 fade-up, 튀는 이징, 숫자 카운트업, 깜박이는 상태 점
- 문구: 대시(—) 남발, 과장(혁신적인, seamless), 「A가 아니라 B」, 지어낸 수치

## 스킬과 맞춰 본 결과

이미 잡던 것
- 판단 기준 주기: 조건 5개를 묻고 패턴마다 방식을 고르는 흐름
- 보라 그라데이션, 이모지 제목, Inter 한 가지, 굵은 글자 남발, 낮은 대비, 입력칸 테두리, 색만으로 상태, 확대 막기
- 상태 화면(로딩·빈 화면·오류): 패턴으로 묻는다
- 「글보다 보여 주기」: 카탈로그 그림과 giting 데모

2026-11-03에 더한 것(`visual-audit.js`, `check-screen.mjs`, `compare-pages.mjs`, SKILL.md 6·7단계)
- 화면끼리 견주기: 바탕, 본문 크기, 서체, 제목 크기, 주 버튼, 링크 색, 모서리, 비슷하지만 다른 색
- 고치기 전·후 견주기: 고치라고 하지 않은 값이 바뀌었나
- 한글 조판: 문단 행간 1.5 미만(WCAG 2.2 1.4.8), 80자 넘는 글 가운데 정렬, 한글 옆 이탤릭
- 카드 안 카드, 둥근 카드 한쪽 색 띠, 글래스모피즘, 자간 벌린 대문자 소제목
- 2세대 기본값(크림+테라코타, 어두운 바탕+네온 하나), AI가 자주 고르는 서체
- 브라우저에서 가로 넘침, 칸 밖으로 잘린 글자, 말줄임 수
- AI 글투: 과장 문구, 「A가 아니라 B」, 근거 없는 큰 숫자, 대시 남발
- 리뷰에 「눌러 보기」 단계: 빈 칸 제출, 꺼진 버튼의 이유, 결과 없음, 뒤로 가기. 되돌릴 수 없는 버튼은 누르지 않는다
- 「쓰지 말 것」 목록만으로 고치지 않는다(금지하면 옮겨 간다)

남은 것
- 랜딩 뼈대 반복: 패턴 카탈로그에 랜딩 구성 패턴이 없다
- 움직임(fade-up, 카운트업)은 재지 않는다
- 하드코딩된 값과 토큰 사용 여부는 소스를 읽어야 한다
- 스킬을 쓰기 전·후를 숫자로 보여 주는 공개 예시

## 링크

국내
- https://news.hada.io/topic?id=35347 — 2026-10-14, 디자인 시스템으로 AI 티 줄이기. 댓글에 「레이아웃 반복은 남는다」
- https://news.hada.io/topic?id=32321 — 2026-08-10, hallmark 소개와 찬반 댓글
- https://news.hada.io/topic?id=28281 — 2026-04-07, StyleSeed [홍보]
- https://news.hada.io/topic?id=28246 — 2026-04-06, Awesome Design.MD. 댓글에 저작권·충돌 지적
- https://news.hada.io/topic?id=27750 — 2026-03-23, Impeccable 소개
- https://news.hada.io/topic?id=27687 — 2026-03-21, GPT-5.4 프론트엔드 가이드
- https://brunch.co.kr/@sarayun/94 — 2026-05-04, 토큰·컴포넌트 하네스 [홍보]
- https://brunch.co.kr/@hailey-kim/20 — 2026-07-19, 디자이너용 바이브코딩 가이드
- https://brunch.co.kr/@hailey-kim/17 — 2026-06-13, 디자이너 도구 파이프라인
- https://brunch.co.kr/@8a0100de7ca0488/18 — 2026-08-13, 사내 UI 프로토타입 스킬 사례
- https://brunch.co.kr/@ghidesigner/535 — 2026-09-10, Stitch와 부분 수정 문제 [홍보]
- https://brunch.co.kr/@design-staff/5 — 2026-04-16, Figma MCP와 Claude Code
- https://brunch.co.kr/@kim-yezi/15 — 2026-06-25, AI 화면이 다 똑같은 이유(shadcn)
- https://brunch.co.kr/@dldydwo815/57 — 2026-08-26, shadcn으로 일관성 잡기 [홍보]
- https://brunch.co.kr/@tb6009/6 — 2026-05-02, 한글 조판과 사용량 한도
- https://brunch.co.kr/@tb6009/4 — 2026-04-21, 디자인 스킬 4종 비교
- https://brunch.co.kr/@@bpd/64 — 2026-08-18, DESIGN.md 만드는 법 [홍보]
- https://brunch.co.kr/@yeoooni/9 — 2026-04-29, 디자이너용 Claude Code
- https://brunch.co.kr/@seorann/1 — 2026-06-12, Figma 없이 UX 개선
- https://yozm.wishket.com/magazine/detail/3751 — 2026-05-13, Claude Design 실사용 후기
- https://tilnote.io/pages/6a9355cface8bd2da70ebf6a — 2026-08-30, 바이브코딩 디자인 가이드
- https://nextplatform.net/vibecoding-ui-design-css-vs-design-md/ — 2026-07-17, CSS와 DESIGN.md 비교 [홍보]
- https://ice-ice-bear.github.io/ko/posts/2026-04-15-vibe-coding-design/ — 2026-04-15, 랜딩에서 AI 티 벗기기
- https://zeli.app/ko/story/49867038 — 2026-09-27, 「슬롭 UI 10가지 징후」 요약과 댓글
- https://discuss.pytorch.kr/t/taste-skill-ai-ui/10516 — 2026-06-05, taste-skill
- https://discuss.pytorch.kr/t/skills-for-design-engineers-ui/11206 — 2026-07-13, 애니메이션 스킬
- https://claude.com/ko/blog/improving-frontend-design-through-skills — 2025-11-12, Anthropic 공식 글

해외
- https://www.adriankrebs.ch/blog/design-slop/ — 2026-04-20, Show HN 사이트 1,590개의 AI 패턴 점수
- https://hn.algolia.com/api/v1/items/47864393 — 위 글의 HN 스레드(대비·접근성 댓글)
- https://hn.algolia.com/api/v1/items/48504912 — 2026-06-12, 슬롭 줄이기 HN 스레드
- https://envs.net/~volpe/blog/posts/reduce-slop.html — 2026-06-12, 이미 있는 스타일(Qt)로 고정하기
- https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c — 2026-07-23, 슬롭 알아보는 법
- https://capitalandcompute.net/blog/fix-ai-slop-design/ — 2026-09-25, 2세대 슬롭 [홍보]
- https://letsdatascience.com/news/anthropics-claude-design-shapes-new-design-aesthetic-aaf43749 — 2026-06-30, Claude Design이 반복해서 내는 미감
- https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice — 2026-06-15, DESIGN.md 실측
- https://forum.figma.com/report-a-problem-6/exported-library-for-make-but-make-does-not-use-my-components-or-tokens-47258 — Figma Make가 라이브러리를 안 씀
- https://forum.cursor.com/t/cursor-keeps-breaking-my-design-elements/47527 — 2025-02-03, 고칠 때 디자인이 망가짐
- https://dev.to/dublecc/designmd-the-cursorrules-for-your-design-system-that-stops-ai-ui-style-drift-1hj4 — 2026-07-25, 스타일 흔들림
- https://blog.janestreet.com/i-design-with-claude-code-more-than-figma-now-index/ — 2026-02-05, Claude Code로 디자인하는 실무
- https://nervegna.substack.com/p/claude-design-just-dropped-heres — 2026-04-18, Claude Design 후기
- https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics — Anthropic 쿡북
- https://impeccable.style/slop — AI 디자인 표시 목록 [도구]

Threads
- https://www.threads.com/@hoodi_ux/post/DfPXdtGGOeb — 디자인 스킬을 적용해도 나아지지 않는다는 글
- https://www.threads.com/@uxui_needesignlab/post/DfOvq1BH73r — 디자인 시스템을 써도 AI 사용성 점검에서 18건이 나왔다. 코드만 봐서 실제 화면은 못 봤다는 한계
- https://www.threads.com/@prodjours/post/DfBwSKMk2Nf — 스크린샷으로는 시각 품질은 잘 보지만 동작 문제는 못 본다는 2026년 연구 정리
