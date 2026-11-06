# UI 패턴 카탈로그

AI로 화면을 만들 때 누구든 보기 좋은 결과를 얻게 돕는 자료다. 로딩, 삭제, 장바구니처럼 상황마다 고르는 UI 패턴에서 실제 서비스가 어떤 방식을 쓰는지 화면으로 보여주고, 서비스 조건(플랫폼, 쓰는 빈도, 기기, 콘텐츠, 작업의 무게)에 맞는 방식을 고르게 한다.

## 폴더

- `CLAUDE.md` — AI 작업 지침 / `HANDOFF.md` — 지금 상태와 다음 할 일 / `LEARNED.md` — 실제 화면과 리뷰에서 배운 관점 / `DESIGN.md` — 이 사이트 자체의 디자인 기준(design-agent 스킬로 만듦)
- `.claude/skills/design-agent/` — 조건을 묻고 패턴마다 방식을 추천해 DESIGN.md를 쓰거나 화면을 만드는 스킬. `SKILL.md`, `scripts/recommend.mjs`(추천·DESIGN.md), `scripts/component.mjs`(컴포넌트 이름 찾기), `scripts/check-screen.mjs`(만든 화면의 흔한 실수 검사. 자바스크립트로 그리는 화면은 `--run-scripts`. `scripts/fixtures/`에 나쁜 예·좋은 예와 검사별 시험 화면), `scripts/check-visual.mjs`·`scripts/visual-audit.js`(색·글자·여백을 재고 기준과 견줘 리뷰), `scripts/compare-pages.mjs`(여러 화면이나 고치기 전·후의 색·버튼·모서리·제목 크기를 견줘 어긋난 값 찾기), `scripts/serve-audit.mjs`(브라우저에 띄운 페이지에서 visual-audit.js를 불러 쓰게 이 PC에서만 내주는 서버), `references/visual-basics.md`(색·글자·여백 기준과 브랜드 색 제안법), `references/failures.md`(「밤티 같다」를 고칠 수 있게 나눈 실패 이름 아홉 가지. 검사 결과에 이 이름이 붙는다), `examples/`(잘 만든 예시 화면 셋: 모바일 쇼핑 목록, 데스크톱 관리자 표, 태블릿 공용 키오스크. 만들 때 구조와 수준을 따르고, 다 만든 뒤 옆에 놓고 견준다), `scripts/params.mjs`(조건에서 기본값을 계산한다. recommend.mjs와 검사가 같이 쓴다), `references/design-rules.example.json`(사내 시스템·브랜드가 정한 것을 적는 틀. 리뷰할 서비스 저장소에 `design-rules.json`으로 두고 검사에 `--rules`로 넣으면 정한 주제는 관례로 지적하지 않는다), `evals/`(평가 사례 5개: 말로 답하거나 DESIGN.md를 쓰는 셋, 화면을 만드는 둘. 결과는 `.claude/skills/design-agent-workspace/`에 두고 올리지 않는다)
- `.claude/skills/research-check/` — 예전에 조사한 출처가 그 뒤 바뀌었는지 다시 보고, 새로 쓸 만한 스킬·레퍼런스를 찾아 고칠 거리를 고르게 하는 스킬. 「조사한 거 업데이트」라고 하거나 `/research-check`로 부른다. 기준 목록은 `research/README.md`
- `tools/` — 페이지 검사 스크립트, giting.kr 메뉴판 받기(`fetch-giting.mjs`)
- `public/giting/ui-menu/` — 컴포넌트 사전이 띄우는 giting.kr 데모(MIT)
- `screens/` — 실제 서비스 화면. 서비스마다 폴더 하나, 이름 규칙은 `SHOTLIST.md`
- `data/` — 규칙 데이터. 사이트와 design-agent 스킬·검사기가 같이 읽는다
  - `elements.json` — UI 패턴 28개와 방식(파일 이름은 예전 이름 그대로), 방식마다 영어 이름·쓰는 곳·피하는 곳·giting.kr 메뉴판 링크
  - `axes.json` — 조건 축(플랫폼, 쓰는 빈도, 기기, 콘텐츠, 작업의 무게). 화면에는 축마다 질문(question)과 선택지 예시(sub)를 보인다
  - `services.json` — 기억에 기반한 서비스 관찰. 실제 화면과 대조하기 전이라 페이지에서 쓰지 않는다
  - `samples.json` — 예시 그림에 채우는 샘플 내용
  - `anti-defaults.json` — DESIGN.md 「쓰지 말 것」 목록
  - `systems.json` — 국내외 디자인 시스템 14곳과, 그 문서들이 패턴마다 하는 말(우리 말 요약과 원문 링크)·숫자 기준
  - `giting/` — giting.kr 메뉴판 데이터 원본 10묶음과 MIT 라이선스(`node tools/fetch-giting.mjs`로 다시 받는다). 컴포넌트 사전이 ui·app·landing 세 묶음을 쓴다
- `src/` — 보여주는 페이지(Astro)
  - `pages/` — 첫 화면, 패턴별 페이지(`/elements/loading/` 등), 내 서비스에 맞추기 `/plan/`(조건을 고르면 패턴별 추천과 DESIGN.md), 컴포넌트 사전 `/components/`, 디자인 시스템 `/systems/`, 에이전트용 규칙 요약 `/llms.txt`
  - `components/` — `Catalog.astro` 패턴 페이지 틀, `TopNav.astro` 위쪽 메뉴, `Prompt.astro` AI에게 시킬 문장 상자(컴포넌트 사전용)
  - `scripts/` — `core.js` 조건 합치기·추천 점수, `draw.js` 그림 도구, `renders.js` 방식별 예시 그림, `catalog.js` 패턴 페이지 동작, `plan.js` 내 서비스에 맞추기, `prompt.js` AI에게 시킬 문장 상자(두 줄 접기·복사, 패턴 페이지와 컴포넌트 사전이 같이 쓴다)
  - `styles/catalog.css`
- `research/` — 조사 정리. `README.md`는 살펴본 것 전체의 목록(언제, 어디에 정리했나, 가져온 것과 남은 것). `madia-uxui.md`는 현직 디자이너 실무 영상 131편 정리(우리 말로 요약, 자막 원문은 두지 않는다). `design-systems/`는 국내외 디자인 시스템 14곳의 사용 기준 정리. `ai-design-posts.md`는 AI로 화면을 만들고 고칠 때의 불만·해법을 국내외 공개 글 약 130개에서 모은 것(2026-11-03, 링크와 요약만)
- `refs-private/` — 개인 참고용 외부 이미지(Lazyweb 앱 화면, 찐망고 국내 웹 섹션). 공개하지 않는다. 개발 서버에서만 `/refs/`로 열리고 빌드에는 들어가지 않는다

## 실행

```
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/에 정적 페이지
npm run check    # 빌드한 페이지를 모든 조건 조합으로 그려 오류를 센다. 오류나 모순이 있으면 실패로 끝난다
```
- `SHOTLIST.md` — 서비스별로 찍을 화면 목록
- `NOTICE.md` — 화면 이미지 권리 고지
- `SOURCES.md` — 실제 화면을 어디서 얻고 어디로 링크하는지
