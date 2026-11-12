# 조사 목록

「이거 찾아봐」「파악해봐」로 살펴본 것을 한곳에 모은다. 항목마다 언제 어떻게 봤는지, 정리가 어디 있는지, 가져온 것과 남은 것을 적는다. 자세한 내용은 정리 파일에 두고 여기에는 한 덩어리만 적는다.

새로 조사하면 이 목록에 한 항목을 더한다. 형식:

- **이름** — 주소 · 확인한 날짜 · 어떻게 봤나(직접, 서브에이전트, 원문 / 소개 글)
  - 정리: 파일 위치
  - 가져온 것: 이 저장소에 반영한 것
  - 남은 것: 아직 안 한 것(없으면 줄을 뺀다)
  - 다시 볼 곳: 바뀐 것을 확인할 주소(커밋 기록, 릴리스, 블로그 목록) · 마지막 확인 날짜

다시 보기와 새로 찾기는 `.claude/skills/research-check/`의 순서대로 한다. 고칠 거리는 사용자가 고른 것만 반영한다.

생각만 가져오고 문장·이미지는 옮기지 않는다. 남의 이미지는 `refs-private/`에만 둔다(`CLAUDE.md` 원칙). 회사 안 자료는 이름과 주소를 적지 않는다.

## 같은 목적의 도구·스킬

- **Anthropic frontend-design 스킬** — https://github.com/anthropics/skills (`skills/frontend-design`, Apache 2.0) · 2026-11-06 · 원문 SKILL.md를 읽음. 2026-11-03 조사에서는 이름과 평만 봤다
  - 정리: `LEARNED.md` 2026-11-06, `.claude/skills/design-agent/references/failures.md` 근거 줄
  - 가져온 것: 「흔한 기본값」 검사 8개(카드 세트, 제목 한 단어 강조, 01·02·03 번호, 작은 고정폭 라벨, 글 끝 화살표, 섹션마다 등장 움직임, 모든 카드 hover, 움직임 줄이기 대응 없음), 만들기 전 계획을 쓰고 거르기, 눈에 띄는 것은 한 곳, 버튼·오류 문구 점검
  - 넣지 않은 것: 「검정 대신 #111」(Material은 어두운 바탕으로 #121212를 권한다), 가운뎃점 메타 글(한국어에서 흔한 표기)
  - 다시 볼 곳: 그 경로의 커밋 기록 · 2026-11-06
- **Claude Design** (Anthropic Labs) — https://www.anthropic.com/news/claude-design-anthropic-labs · 2026-11-06 · 공식 글 세 개(출시 2026-04-17, 업데이트 2026-06-17, 옮기기 안내)
  - 내용: 코드와 디자인 파일에서 디자인 시스템을 읽어 만들고, 결과를 시스템에 맞춰 스스로 검사한다. Claude Code `/design-sync`·`/design`. 따로 있던 사이트는 2026-12-14에 닫힌다
  - 우리와 다른 곳: 상황별 패턴 방식 고르기, 흔한 AI 기본값 거르기, 조건별 기준은 공식 글에 없다
  - 남은 것: Claude Design이 만든 화면에 우리 검사를 돌려 「시스템은 지켰는데 쓰기 어려운 곳」 찾기
  - 다시 볼 곳: https://claude.com/blog, https://support.claude.com/en/articles/12138966-release-notes · 2026-11-06
- **Stageshow** — https://benji.org/stageshow · 소스 https://github.com/benjitaylor/skills `stageshow/`(그 폴더 LICENSE가 MIT) · 2026-11-04 소개 글과 소스, 2026-11-06 다시 봄
  - 정리: `LEARNED.md` 2026-11-04, `HANDOFF.md` 14번
  - 가져온 것: 실패 이름 아홉 가지(`references/failures.md`), 잘 만든 예시(`examples/`), 다른 눈 리뷰, 「확인 못 한 것」, 상자 관계·아이콘 검사
  - 바뀐 것: 1.1.0(2026-11-04) 크기를 정하지 않은 글자 찾기(기본 글자 크기를 살짝 바꿔 따라 변하는 글자), 포커스 링이 이웃 글자를 덮는지, 실패하면 종료 코드 1. 1.1.1(2026-11-05) 스크롤바 흔들림 수정
  - 남은 것: 한 프레임 튐 같은 움직임, 목록 아래 빈 공간, 예시 더 늘리기
  - 다시 볼 곳: 저장소 `stageshow/` 커밋 기록 · 2026-11-06
- **Impeccable** — https://github.com/pbakaus/impeccable (Apache 2.0), https://impeccable.style · 2026-10-26 이름만, 2026-11-06 원문(SKILL, craft-floor)을 읽음
  - 내용: 페이지 목적 넷(설득·조작·읽기·경험)으로 과감함을 정하고, 바닥 기준과 거부 목록을 둔다. 거부 목록 상당수가 우리 「흔한 기본값」과 겹친다
  - 우리에게 없는 것: 브라우저 기본으로 남은 포커스 링·글자 선택색, 1px 테두리 + 넓고 옅은 그림자 카드, 이유 없는 모달
  - 가져온 것: 제목 위 여백이 아래 여백보다 커야 함(검사, 2026-11-06)
  - 다시 볼 곳: 저장소 릴리스(마지막 skill-v4.8.0, 2026-10-26)와 커밋 · 2026-11-06
- **Taste Skill** — https://github.com/Leonxlnx/taste-skill (MIT, 포크가 많고 이것이 원본) · 2026-11-06 원문과 CHANGELOG를 읽음
  - 내용: 회사 웹사이트·랜딩 전용. 업종(가게·상품·서비스·소프트웨어)이 사진·효과·서체를 정하고, 팔레트·첫 화면을 무작위로 뽑아 기록해 겹치지 않게 한다. 앱 안 패턴은 다루지 않는다
  - 다시 볼 곳: `CHANGELOG.md`(2.5.0, 2026-11-05) · 2026-11-06
- **Hallmark** — https://github.com/Nutlope/hallmark (MIT), usehallmark.com · 2026-10-26 이름, 2026-11-06 ROADMAP을 읽음
  - 바뀐 것: 테마 50개(2026-10-27). ROADMAP에 새 AI 기본값(크림 바탕만, 알약 버튼, 거의 검정 + 형광 하나, 가는 선 신문 모양), 다시 만들 때 링크·입력칸이 빠지면 실패
  - 가져온 것: 알약 버튼 검사(2026-11-06). 링크·입력칸 수 견주기는 미룸
  - 다시 볼 곳: 커밋 기록, `ROADMAP.md` · 2026-11-06
- **StyleSeed** — https://github.com/bitjaru/styleseed (MIT) · 2026-10-26 이름, 2026-11-06 원문
  - 바뀐 것(2026-11-05 PR): 「항상·절대」 규칙에 적용 범위를 붙이고 그런 말투를 검사로 막음, 막는 규칙 위반은 점수와 따로 실패, 여러 화면 견주기, 결정 사례에 근거 등급
  - 가져온 것: 단정 문장에 적용 범위 붙이기(`visual-basics.md`, `design-rules.json` `guide.always.where`, 2026-11-06)
  - 다시 볼 곳: 닫힌 PR 목록 · 2026-11-06
- **ko-design-md** — https://github.com/CaesiumY/ko-design-md (MIT) · 2026-11-06
  - 바뀐 것(2026-10-30~11-02): 브랜드가 실제로 쓴 역할 이름만 남김, 그라데이션 위 글자 대비를 그라데이션 색 전부로 판정
  - 가져온 것: 그라데이션 글자·바탕 위 글자를 색 단계마다 재기(2026-11-06)
  - 다시 볼 곳: 커밋 기록 · 2026-11-06
- **ui-ux-pro-max-skill** — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT) · 2026-11-02 원문, 2026-11-06 다시 봄(오른쪽→왼쪽 언어 등급, Apple 스타일 추가. 반영할 것 없음)
  - 정리: `LEARNED.md` 3절
  - 다시 볼 곳: 커밋 기록 · 2026-11-06
- **giting.kr 메뉴판** — https://github.com/hanmariyang/giting-skills (MIT) · 2026-10-28~29 데이터를 받음, 2026-11-06 다시 봄
  - 가져온 것: 컴포넌트 사전 235개(`/components/`), 패턴 방식마다 데모 링크. 고지는 `NOTICE.md`
  - 바뀐 것: flow-menu(2026-10-30, 결제·가입·예약 등을 화면 다섯 장 흐름으로), hangul-wrap 0.2.0(글자 200%·확대 200%에서 버튼이 잘리나), motion-menu(2026-11-04)
  - 다시 볼 곳: 커밋 기록 · 2026-11-06
- **jakub.kr** (Jakub Krehel) — https://jakub.kr, 스킬 https://github.com/jakubkrehel/skills (MIT) · 2026-11-10 · 서브에이전트가 글 8편과 SKILL.md 9개를 읽음
  - 정리: `jakub-kr.md`
  - 가져온 것(2026-11-10): 검사 11개(겹친 모서리, 묶음 사이 여백, 숫자 자리, 얇은 굵기, hover 미디어 쿼리, transition all, 매일 쓰는 화면의 움직임 길이, 브라우저 확인창·대화상자 버튼 문구·「정말」 제목, 제출 잠금, 멈춤 없는 자동 넘김, 끌기로만), `palette.mjs`(브랜드 색 단계·역할별 색), `references/try-pages.md`(상태 바꿔 보기·방식 끼워 보기·극단 상황 나란히·틀렸다고 증명해 보기), 리뷰 쓰는 법(싼 고치기부터, 원인 하나는 한 줄, 잰 것·계산한 것·짐작한 것), 리뷰 전에 그 서비스 문서 읽기
  - 넣지 않은 것: 영문 조판(자간 음수, 한 줄 60~75자, 곡선 따옴표), 취향 값(세 겹 그림자, 사진 외곽선), 서로 어긋나는 값(등장 움직임 길이, 아이콘 선 굵기), `disable-model-invocation`(말로 부르는 스킬이 안 돈다)
  - 다시 볼 곳: 저장소 커밋 기록, https://jakub.kr/writing/notes · 2026-11-10
- **DESIGN.md 규격** — https://github.com/google-labs-code/design.md (Apache 2.0) · 2026-11-06: main은 2026-10-16 뒤로 그대로, 움직임·말투 섹션 PR이 열려 있다(합쳐지면 우리 DESIGN.md 출력을 맞춘다)
  - 다시 볼 곳: 릴리스, PR · 2026-11-06
- **바뀐 게 없는 곳**(2026-11-06): Vercel Web Interface Guidelines(https://github.com/vercel-labs/web-interface-guidelines, 마지막 2026-10-05), uxpatterns.dev(https://github.com/thedaviddias/ux-patterns-for-developers, MCP와 llms.txt가 있다. 라이선스 파일 종류 확인 필요), oh-my-design(사이트 작업뿐), supanova(https://github.com/uxjoseph/supanova-design-skill, 라이선스 표시 없음, 2026-03 뒤로 그대로)
- **다른 팀의 화면 제작 스킬** — 비공개라 이름·주소를 적지 않는다 · 2026-11-05
  - 가져온 것: 디자인 시스템 위에서 만들 때 값마다 출처 달기(`HANDOFF.md` 2026-11-05)

## 디자인 시스템

- **국내외 14곳** — 당근 SEED, KRDS, 원티드 Montage, 토스, Material, Apple, Fluent, Ant, Polaris, Carbon, Atlassian, Primer, GOV.UK(2026-10-29, 서브에이전트 셋이 공개 문서를 읽음), shadcn/ui(나중에 더함) · 2026-11-06 다시 봄
  - 정리: `design-systems/`(요약은 `design-systems/README.md`), 데이터는 `data/systems.json`
  - 가져온 것: 여러 곳이 같은 말을 하는 기준(로딩 1초, 토스트는 가벼운 성공만 등)을 근거로, 카탈로그 `/systems/`
  - 바뀐 것(2026-11-06 점검): Apple HIG에 터치 화면 Mac 지침(2026-10-28, 터치할 때 컨트롤을 키운다. 숫자 없음), Polaris 2.0 정식(2026-10-22). 우리 데이터에 빠진 AI 연결: Ant(MCP·에이전트 안내), Primer(`@primer/mcp`), Atlassian(llms.txt·MCP 얼리 액세스), 토스(MCP·Claude 플러그인), Polaris(Shopify Dev MCP), Montage(비공개 MCP)
  - 다시 볼 곳: 시스템마다 릴리스·새 소식 페이지(SEED·Ant·Carbon·Fluent·Primer·Montage는 GitHub 릴리스, GOV.UK https://design-system.service.gov.uk/community/whats-new/, Apple https://developer.apple.com/design/whats-new/, Polaris https://shopify.dev/changelog, KRDS https://github.com/KRDS-uiux/krds-uiux) · 2026-11-06. Material 블로그와 KRDS 공지는 열리지 않았다

## 실제 화면 레퍼런스

- **UIBOWL, Lazyweb, 찐망고 레퍼런스, Nicelydone, Mobbin, Refero, Page Flows** — 2026-10-26~29 · 2026-11-06 다시 봄
  - 정리: `SOURCES.md`(이용 조건과 링크), 찐망고는 `LEARNED.md` 3절
  - 가져온 것: Lazyweb 285장·찐망고 832장을 개인 참고용으로 받아 판정(`refs-private/`, 공개 안 함)
  - 바뀐 것(2026-11-06 점검): Lazyweb 약관 개정(2026-11-01, 대량 수집·체계적 재배포 금지, 업무 목적 전제), UIBOWL MCP 배너(조건은 Notion이라 못 읽음), Mobbin MCP(유료), 찐망고 446곳·2,154개
  - 다시 볼 곳: https://www.lazyweb.com/terms, https://www.lazyweb.com/copyright, https://uibowl.io, https://mobbin.com/mcp, https://ref.jjinmango.kr, https://doc.refero.design/mcp/getting-started, https://pageflows.com/pricing/ · 2026-11-06

## 사람들의 글과 영상

- **마디아 「UXUI 디자인」 재생목록 131편** — 2026-10-28 · 서브에이전트 여덟이 자막을 끝까지 읽음
  - 정리: `madia-uxui.md`, `LEARNED.md` 5절
- **AI로 화면을 만들고 고칠 때의 불만, 공개 글 약 130개**(국내 40, 해외 34, Threads 약 60) — 2026-11-03
  - 정리: `ai-design-posts.md`
  - 남은 것: 그 파일의 「남은 것」(랜딩 뼈대, 하드코딩 값). `HANDOFF.md` 12번
  - 다시 볼 곳: GeekNews·요즘IT·Threads 검색 · 2026-11-06(GeekNews에 새 글 없음)

## 스킬을 시험해 본 공개 서비스

- **Money Kalkulačka, CareerConnect, R10 Reviewer**(Lovable·Bolt로 만든 오픈소스 앱) — 2026-10-30에 고르고 2026-11-02에 시험
  - 정리: `HANDOFF.md` 2026-11-02
- **pogomate.com** — 2026-11-02 · 메인과 대표 페이지, 데스크톱과 390px
  - 정리: `HANDOFF.md` 2026-11-02. 리뷰에서 나온 오판은 커밋 fd98f37에서 고쳤다

## UX 규칙의 틀

- **UX 규칙을 어떻게 잡나** — NN/g 휴리스틱·심각도, GOV.UK 서비스 기준·Design System, KRDS(필수·권장·우수, 자체 검증), Baymard, WCAG 2.2·WAI-ARIA APG, Apple·Material·Carbon·Polaris·Atlassian·Fluent·Primer, 토스·당근 SEED, 린트와 AI 에이전트용 규칙 · 2026-11-11 · 서브에이전트 둘이 공개 문서를 읽음(Material 3은 검색 요약만)
  - 정리: `research/ux-rules.md`
  - 가져온 것: 확인 창이 위험 버튼에 첫 초점을 두는 검사의 근거(APG, Carbon, Primer, NN/g). 규칙 15개(사고 위험·키보드와 초점·할 일이 보이나·누른 뒤·말)를 KRDS 식 수준(꼭·권장·확인)과 「한 문장 · 예외 · 눈으로 · 검사 · 근거」 칸으로 `data/ux.json`에 두고, 스킬 문서 `references/ux-basics.md`와 사이트 `/ux/`(규칙마다 나쁜 예·좋은 예 데모), `/llms.txt`가 같이 쓴다(2026-11-11). 근거 링크는 `research/ux-rules.md` 「출처 주소」에 적은 주소만 건다
  - 남은 것: 원문 주소가 없는 출처(Primer·Shopify를 묶어 부른 것, 토스 「해요체 필수」, 키보드-4(지금 누구나-4)의 Esc·버튼 순서 출처). KRDS 체크리스트 원문과 기본 패턴 「확인」「오류」 읽기
  - 다시 볼 곳: https://www.krds.go.kr/html/site/outline/outline_05.html (체크리스트), https://primer.style/accessibility/tools-and-resources/checklists/designer-checklist/ · 2026-11-11

- **UX 기준을 어떤 갈래로 모으나** — 해외(NN/g, Laws of UX, A11y Project, Primer, Vercel, Built for Shopify, GOV.UK·Carbon·Apple 패턴, deceptive.design, FTC, W3C COGA)와 국내(KRDS 기본·서비스 패턴, KWCAG 2.2, 고령자 금융앱 지침, 앱인토스, 당근 SEED, 공정위 다크패턴 기준) · 2026-11-11 · 서브에이전트 둘이 공개 자료를 읽음(공정위·KWCAG 신규 항목은 기사로만)
  - 정리: `research/ux-taxonomy.md`
  - 가져온 것: UX 기준을 다섯 묶음에서 아홉 묶음으로(사고 위험, 할 일이 보이나, 누른 뒤, 입력, 길과 뒤로 가기, 누구나(예전 키보드와 초점), 끼어들지 않기, 속이지 않기, 화면 글) 늘리고 규칙 15개를 52개로(2026-11-11, `data/ux.json`). 2026-11-12에 흐름 규칙을 더해 67개. 공정위 다크패턴 기준은 원문을 못 열어 근거에 「간접」으로 단다. 새 패턴 후보 8개 중 6개를 2026-11-12에 패턴으로 만들었다(아래 「새 패턴 여섯의 근거」). 로그인 권유·해지·탈퇴 경로는 UX 기준 방해-5·속임-5가 답 하나를 주니 패턴으로 만들지 않았다
  - 남은 것: 앱인토스 블로그(점수의 뜻)·출시 체크리스트 원문 주소, KRDS 디지털 포용·KWCAG 2.2 원문, KRDS 체크리스트 HWP, 공정위 가이드라인 원문 읽기
  - 다시 볼 곳: https://www.krds.go.kr/html/site/global/global_summary.html , https://www.deceptive.design/types , 공정위 보도자료 목록 · 2026-11-11

- **화면을 오가는 흐름의 UX** — 로그인·로그아웃, 가입·본인 확인, 결제·제출, 여러 단계 폼, 목록·필터, 모바일 오버레이, 링크로 들어오기, 여러 탭, 오프라인, 새로 고침. KRDS 로그인·신청·검색 서비스 패턴, GOV.UK·DfE·DWP, NN/g, Baymard, web.dev·MDN, Android·Apple, OWASP, WCAG, 앱인토스, 당근 Stackflow, Google 검색 「뒤로 가기 가로채기」 · 2026-11-11 · 서브에이전트 하나가 읽음
  - 정리: `research/ux-flows.md`
  - 가져온 것: `data/ux.json`에 흐름 규칙 10개(사고-5·6, 입력-6·7, 길-5~10)와 방해-3의 가로채기(O6). 데모는 `tools/ux-demos.mjs`의 흉내 낸 브라우저(주소 줄·기록 띠·뒤로·새로 고침)로 그린다. 겹치는 누른 뒤-2·4는 「그 자리에 이유」로 좁히고 적은 값 지키기는 입력-6으로 모았다(2026-11-11). 2026-11-12에 15개를 더 넣었다: 사고-7(두 탭 충돌 T2, 확인), 할 일-4(결과 없음 S5), 누른 뒤-5~9(완료 화면 P5, 시간이 지난 링크 D3, 저장 실패 되돌리기 N1, 한 번만 보일 안내 R3, 연결 끊김 N2), 입력-8~12(인증번호 칸 J2, 번호가 안 올 때 J3, 임시 저장 F4, 앞 답이 뒤를 바꿀 때 F5, 확인 화면 「변경」 P6), 길-11·12(뒤로 가기와 「이전」 F2, 다른 탭 로그아웃 T1), 방해-5(로그인 권유 L8). 누구나-8에 L6의 「끝나도 이어 쓰기」를 합쳤다. 인증번호 칸은 검사 「인증번호 칸 설정 빠짐」(`check-screen.mjs`)도 만들었다. S4(필터 기록)는 길-7 본문에 있다
  - 남은 것: 브라우저에서 흐름을 재는 스크립트(기록 수, 주소 쿼리, 스크롤, 재제출), L1·L2의 1차 출처. 넣지 않은 것: L2(로그인한 사람이 로그인 주소를 열 때), L7(소셜 로그인 돌아오기), O2·O3(시트 기록 정리·겹친 오버레이, 길-9 본문에 일부), O4(오버레이 안 입력, 입력-7과 닿음), O5(오버레이를 주소로, 확인), D2(알림으로 들어오기, 길-6·10과 닿음), R1(길-7과 겹침)
  - 다시 볼 곳: https://www.krds.go.kr/html/site/service/service_03_01.html , https://baymard.com/blog/back-button-expectations · 2026-11-11

- **새 패턴 여섯의 근거** — 동의 받기, 권한 요청, 세션 만료 알림, 만족도 요청, 도움말 방식, 신청 뒤 진행 상태 · 2026-11-12 · 직접 원문을 읽음(Apple 문서 둘은 페이지를 스크립트로 그려 검색 요약으로만, 개인정보보호위원회 안내서는 법무법인 소식지로만 = 간접)
  - 읽은 곳: KRDS 기본 패턴 동의 https://www.krds.go.kr/html/site/global/global_03.html (모두 동의는 하나라도 풀면 풀림, [필수]·[선택], 동의 안 함), 도움 https://www.krds.go.kr/html/site/global/global_02.html (쉽고 익숙한 화면은 늘 보이는 도움말, 처음·복잡한 화면은 눌러서 여는 도움말, 자주 묻는 질문은 따로), 사용자 피드백 https://www.krds.go.kr/html/site/global/global_05.html (마친 뒤 아래쪽, 두 가지 평가로 시작, 추가 질문 3개까지, 건너뛰기), 모바일 알림 https://www.krds.go.kr/html/site/global/global_12.html , 서비스 패턴 로그인 https://www.krds.go.kr/html/site/service/service_03_01.html (만료 20초 전, 창에 연장·로그아웃, 하위 쪽 service_03_07), 신청 https://www.krds.go.kr/html/site/service/service_04_01.html · 신청 결과 확인 https://www.krds.go.kr/html/site/service/service_04_08.html (처리 단계 전체와 지금 단계, 내역·이력)
  - 읽은 곳(해외): Android 런타임 권한 요청 https://developer.android.com/training/permissions/requesting (쓰는 순간에, 이유 설명 화면, 두 번 거절하면 다시 묻지 못함, 거절을 존중하고 설정으로 조르지 않기), NN/g 「3 Design Considerations for Effective Mobile-App Permission Requests」(2019-04-28) https://www.nngroup.com/articles/permission-requests/ , Google Play 인앱 리뷰 https://developer.android.com/guide/playcore/in-app-review (앞에 묻지 않기, 버튼에 걸지 않기, 횟수 제한), Apple StoreKit https://developer.apple.com/documentation/storekit/requesting-app-store-reviews (365일에 세 번, 검색 요약), Apple HIG Ratings and reviews https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews (본문을 못 읽음), WCAG 2.2 2.2.1 이해 문서 https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html (공용 단말은 아직 있는지 묻고 20초), 3.2.6 이해 문서 https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html , DWP 세션 만료 https://design-system.dwp.gov.uk/patterns/manage-a-session-timeout (2분 전, 꼭 필요할 때만 끊기), GOV.UK 완료 화면 https://design-system.service.gov.uk/patterns/confirmation-pages/ · 연락처 https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/ · details https://design-system.service.gov.uk/components/details/ , NN/g 도움말 휴리스틱(2020-12-13) https://www.nngroup.com/articles/help-and-documentation/ , Baymard 주문 추적 https://baymard.com/blog/integrate-tracking-info (진행 막대, 사이트 안 배송 기록, 예상 날짜), 개인정보보호위원회 「알기 쉬운 개인정보 처리 동의 안내서」(2022-03, 간접 https://www.shinkim.com/kor/media/newsletter/1747 : 미리 체크 금지, 필요한 때에 필요한 만큼)
  - 가져온 것: `data/elements.json` 패턴 6개·방식 20개(쓰는 곳·피하는 곳 줄에 출처 이름), `data/systems.json` 패턴별 디자인 시스템 말(KRDS·GOV.UK 링크), 스킬 `references/extra-questions.md`(축에 없는 질문 여섯), `references/service-bundles.md`(묶음마다 새 패턴, 「공공·신청 서비스」 묶음)
  - 남은 것: Apple HIG 권한(Privacy)·평가 쪽 본문(스크립트로 그려 못 읽음). 이유 설명 화면을 Apple이 어떻게 보는지 확인하지 못했다. 개인정보보호위원회 안내서 원문. 실제 서비스 화면으로 방식마다 예시 찾기(지금 그림은 지어낸 것)
  - 다시 볼 곳: https://www.krds.go.kr/html/site/global/global_summary.html , https://developer.android.com/training/permissions/requesting · 2026-11-12

## 후보

2026-11-06 새로 찾기에서 나온 것. 원문(README·SKILL)을 읽었다. 「반영」은 같은 날 사용자가 골라 넣은 것, 「미룸」은 `HANDOFF.md` 다음 할 일 15번에 둔 것이다.

- **ai-design-check** — https://github.com/enmerasoftware/ai-design-check (MIT, 2026-10-28) · 규칙 141개 검사. AI 페이지 72개와 사람 사이트 34개를 같은 규칙으로 재서 둘을 가르는 규칙만 강하게 둔다(크림 바탕 AI 40%·사람 3%, 보라 그라데이션 AI 0%·사람 24%). 반영: 보라 그라데이션 「확인」으로 낮춤, 크림 알림에 숫자, 제목 앞 아이콘 상자·알약 배지·알약 버튼 검사
- **unslop** — https://github.com/heydamir/unslop (CC BY 4.0, 2026-10-29) · 고칠 곳 목록 → 방향 → 여백·색·아이콘·문구·글자·배치 순서로 한 겹씩. 괜찮으면 괜찮다고 말한다. 출처 표시 조건이 있다. 반영: 걸린 것이 없으면 「고칠 것 없음」 한 줄
- **Figma Specs와 디자인 시스템 가이드라인 글** — https://www.figma.com/blog/introducing-figma-specs/ (2026-10-15), https://www.figma.com/blog/how-to-put-your-design-system-to-work-with-the-figma-agent/ (2026-10-23) · 에이전트용 규칙을 「늘 지킬 것 / 예외 / 흔한 실수와 대신 할 것 / 비슷한 컴포넌트 고르는 기준」으로 나눈다. 반영: `design-rules.json` `guide`
- **designspec** — https://github.com/Eronred/designspec (MIT, 2026-10-31) · 코드에서 토큰을 뽑고, 지금 있는 위반은 기준선으로 두고 새 위반만 막는다. 미룸
- **dashboard-design-skill** — https://github.com/abdiraimov-otabek/dashboard-design-skill (MIT, 2026-10-20) · 지표 카드 아래 문장 0개, 작은 수의 변화율(1→0을 −100%로 쓰지 않기). 미룸
- **UXKIN** — https://github.com/uxkin/agent (저장소 MIT, 데이터 유료·재게시 금지, 조건 2026-10-07) · 실제 iOS 화면 MCP와 무료 스킬(ui-states 등)
- **unslop-skill** — https://github.com/SalvatoreCampagnese/unslop-skill (MIT, 2026-11-01) · 브랜드 팔레트와 허용 오차로 「누가 고른 색인가」 판정
- **Kill AI Slop** — https://github.com/yetone/kill-ai-slop (Apache 2.0, 2026-07-10) · AI 티 33가지를 한국어 포함 4개 언어로, 고치기 전·후 데모. 미룸
- 보고 뺀 것: 비공식 Mobbin MCP(라이선스 없음, Mobbin 조건과 부딪힘), 회사 160곳 DESIGN.md 모음(실제 회사 모양 흉내), 유료 책 규칙을 옮긴 스킬(권리 불분명), 너무 새거나 라이선스 없는 MCP 둘

## 새로 찾을 곳

- GitHub: anthropics/skills, 「design skill」「ui skill」「DESIGN.md」「design tokens agent」「ai slop」 검색, 별이 빠르게 느는 저장소
- 스킬 목록 사이트: skills.sh, Claude 플러그인 마켓플레이스, awesome-claude-design-skills 같은 모음(원본 찾는 입구로만)
- Anthropic·Claude 공식: anthropic.com/news, claude.com/blog, Claude Code 릴리스 노트
- 다른 AI 디자인 도구의 공식 글: Figma 블로그(Make, Specs, MCP), v0, Lovable, Google Stitch
- 국내 글: GeekNews(news.hada.io), 요즘IT, 브런치, Threads 「AI 디자인」「클로드 디자인」
- 화면 레퍼런스: Lazyweb(MCP), Mobbin, Refero, Page Flows, UIBOWL, UXKIN의 새 기능과 이용 조건

## 점검 기록

- 2026-11-06: 반영한 것 — 사실 고치기(SOURCES, systems.json AI 연결, Apple·Polaris), 새 검사 넷, 숨김 버그, 기준 세기·「고칠 것 없음」·적용 범위·규칙 네 갈래. 자세한 것은 `HANDOFF.md` 2026-11-06(오후)
- 2026-11-06: 목록을 처음 만들고 첫 점검을 했다(기존 도구·스킬 14곳, 디자인 시스템 14곳, 레퍼런스 사이트 7곳, 새로 찾기). 못 연 곳: UIBOWL MCP 안내(Notion), Mobbin 약관(403), Refero 약관 본문, Atlassian 「with AI」, Material 블로그, KRDS 공지
