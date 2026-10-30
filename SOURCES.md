# 실제 화면 출처

카탈로그에 싣는 이미지는 직접 찍은 것만 쓴다. 다른 레퍼런스 사이트의 이미지는 가져오지 않고 링크만 건다. 그 사이트들이 모으고 분류한 자료라서, 원래 회사의 권리에 더해 그 사이트의 이용 조건도 걸린다.

## 직접 찍기

- **웹**: 로그인 없이 보이는 화면만 브라우저로 찍는다
- **안드로이드 앱**: 에뮬레이터(`Catalog_Pixel7_Play`)에서 찍는다. Play 스토어 로그인이 있어야 앱을 설치할 수 있다
- **아이폰 앱**: macOS iPhone 미러링 창을 캡처한다. 화면 이동은 사람이 한다
- 개인 정보는 찍지 않거나 가린다. 자세한 기준은 `SHOTLIST.md`

## 링크로 거는 곳

패턴마다 「더 많은 실제 예시」로 연결한다. 2026-10-27에 확인한 내용이다.

**한국 앱**

- UIBOWL — https://uibowl.io
  - 토스, 배민, 당근, 쿠팡이츠, 카카오톡 등 한국 앱 화면이 많다
  - 컴포넌트 필터(로딩, 빈 화면, 에러·실패, 완료·성공, 토스트·스낵바)와 패턴 필터(장바구니, 취소하기)가 있다
  - 앱·필터마다 URL이 있다. 예: `https://uibowl.io/name/토스`
  - 전체 열람은 유료 멤버십. 무단 사용을 경고한다. 개인 Figma로 가져가려면 공식 Figma 내보내기를 쓴다

**한국 웹사이트 (섹션 단위)**

- 찐망고 레퍼런스 — https://ref.jjinmango.kr (2026-10-29 확인, 베타)
  - 국내 웹사이트 444곳의 섹션 2,240개를 32개 분류(헤더, 메인 비주얼, 검색, 로그인 유도, 자주 묻는 질문, 푸터 등)로 모았다. 앱 화면은 없다
  - 섹션마다 원본 사이트 링크와 확인 날짜가 있다
  - 고지: 캡처 저작권은 각 사이트에 있고, 교육·개인 참고용이며, 공유할 때는 출처를 함께 적는다. 이미지는 가져오지 않고 링크만 건다

**상태 화면 (로딩, 빈 화면, 에러)**

- Lazyweb — https://www.lazyweb.com
  - 공개 페이지: `/inspiration/empty-state`, `/inspiration/loading-state`, `/inspiration/error-state`
  - 둘러보기 무료. 권리는 원저작자에게 있고 이메일로 삭제 요청을 받는다(`/copyright`)
  - MCP와 OpenAPI가 있다
- Nicelydone — https://nicelydone.club
  - 공개 페이지: `/examples/screens/empty-state` 등. 웹 SaaS 위주
  - MCP가 있다(유료 플랜)

**흐름 영상 (삭제, 취소, 장바구니)**

- Page Flows — https://pageflows.com
  - iOS·Android·웹 녹화. 유료. 한국 앱은 없다

## 가져와 쓰는 곳

- giting.kr 메뉴판 — https://github.com/hanmariyang/giting-skills (MIT, 2026-10-29 확인)
  - 컴포넌트 이름(한·영), 쉬운 말 별칭, 한 줄 설명, 헷갈리는 짝, AI에게 시키는 문장, ui-menu 데모를 컴포넌트 사전 `/components/`에 그대로 쓴다
  - 라이선스 원문은 `data/giting/LICENSE`, 고지는 `NOTICE.md`와 페이지 아래에 둔다. 다시 받기: `node tools/fetch-giting.mjs`

## AI에 연결하기

이미지를 쌓아두지 않고 AI가 직접 찾아보게 하는 방법이다.

- Lazyweb MCP, Nicelydone MCP, Refero MCP — 계정을 연결하면 AI가 화면을 만들 때 실제 앱 예시를 검색한다

## 쓰지 않는 것

- uxbakery 한국 앱 스크린샷 팩 — 비상업용 라이선스라 공개 프로젝트에 쓸 수 없다
- Dribbble, Behance, Collect UI — 실제 앱이 아니라 컨셉 작업이 대부분이다
- UI Garage, Pttrns — 운영이 끝났다
