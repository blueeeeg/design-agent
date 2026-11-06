# 디자인 시스템 조사 (2026-10-29)

서브에이전트 셋이 공개 문서를 읽고 우리 말로 요약했다. 문장은 옮기지 않았고 기준마다 출처 URL이 있다. 원문 대조가 덜 된 숫자는 각 문서에 「미확인」으로 표시돼 있다.

- `korea.md`: 당근 SEED, 정부 KRDS, 원티드 Montage, 토스 TDS(앱인토스 공개분). 배민·카카오·네이버·라인·쿠팡 등은 공개 문서를 못 찾았거나 읽지 못했다
- `global-platform.md`: Material 3, Apple HIG, Fluent 2, Ant Design. 플랫폼에 따라 갈리는 기준 위주
- `global-patterns.md`: Shopify Polaris, IBM Carbon, Atlassian, GitHub Primer, GOV.UK. 빈 화면·오류·삭제·폼 검증 같은 「패턴」 문서 위주

## 여러 시스템이 같은 말을 하는 것 (카탈로그 근거로 강하게 쓸 수 있다)

- **1초 안에 끝나면 로딩 표시를 하지 않는다**: SEED, KRDS, Primer, Ant(delay)
- **로딩은 기다리는 시간으로 고른다**: 1초 미만 없음 → 1~4초 스피너·스켈레톤 → 길면 진행 바와 안내 → 10초~1분 넘으면 뒤에서 처리·취소(SEED, Primer). 스켈레톤은 틀이 정해진 목록·카드에만, 정적인 것·버튼·모달에는 안 쓴다(Carbon, Montage, SEED)
- **토스트는 가벼운 성공 확인용**: 오류·중요 메시지에는 쓰지 않고, 중요한 것은 자동으로 사라지면 안 된다(Shopify, Carbon, Atlassian, Fluent, KRDS). 행동(되돌리기)이 붙으면 스낵바(KRDS, SEED, Montage, Material)
- **스낵바는 한 번에 하나, 행동은 하나**: Material, SEED, KRDS. 표시 시간은 약 4초(SEED, Montage)
- **되돌릴 수 있으면 묻지 말고 되돌리기, 되돌릴 수 없고 드문 일만 확인창**: Apple, SEED, Carbon. 확인창 버튼은 동작 이름으로, 3개 이내, 위험 버튼만 빨간색(Apple, Fluent, SEED)
- **스위치는 즉시 적용, 저장 후 적용이면 체크박스**: SEED, KRDS
- **모달 안에 폼·탭 같은 무거운 것을 넣지 않는다. 여러 단계면 전체 화면**: KRDS, Apple, Material
- **바텀시트는 모바일, 태블릿·큰 화면은 가운데 창**: Apple(iPad), Montage(모바일 선택기). 바텀시트에는 보이는 닫기 버튼(KRDS)
- **하단 탭바는 3~5개, 큰 화면은 레일·사이드바**: Material, Apple, 토스
- **최소 터치 영역 44~48**: Apple 44pt, Material 48dp, Fluent 44/48, KRDS 44px. 데스크톱 마우스는 더 작아도 된다(Apple macOS 28pt)
- **무한 스크롤을 쓰면 페이지 번호를 같이 두지 않는다. 페이지 번호는 검색 결과·게시판**: KRDS, SEED, Montage, Ant
- **채우기 전 버튼 잠금은 낮게 본다**: GOV.UK(대비가 낮고 헷갈림), Primer(저장 버튼을 잠그거나 숨기지 않음), Carbon(짧은 폼만 허용). 국내 문서는 금지도 권장도 하지 않는다(Montage는 조건부 비활성 예시를 보임)

## 시스템마다 갈리는 것 (한쪽으로 단정하지 않고 둘 다 적는다)

- **입력 확인 시점**: 제출할 때(GOV.UK, Primer 기본) vs 칸을 벗어날 때(Carbon). SEED는 기본은 제출 때, 오입력 위험이 큰 칸은 벗어날 때로 섞는다
- **토스트 자체**: Primer는 접근성 때문에 github.com에서 쓰지 않는다. 다른 곳은 가벼운 확인에 쓴다
- **목록이 길 때 모바일**: Montage는 무한 스크롤·더보기를 권하고, KRDS는 무한 스크롤의 키보드 문제를 짚는다

## 우리 조건 축과의 관계

- 플랫폼 축은 근거가 풍부하다(시트, 탭바, 토스트 위치, 터치 영역)
- 작업 종류 축(되돌릴 수 없는 작업)은 삭제·확인창 근거가 풍부하다
- **익숙함(처음/가끔/매일)과 공용 기기 축을 직접 쓰는 문서는 없다.** GOV.UK의 「한 질문 한 화면」(일반 시민용), KRDS 접근성 기준이 가장 가깝다. 이 축에 붙이는 것은 우리 해석이니 강도를 「관례」로 둔다
- 기다리는 시간(1초, 4초, 10초)은 지금 조건 축에 없다. 로딩 패턴의 상황(case)이나 새 축으로 둘 수 있다

## 카탈로그에 없는 후보

- 알림 층을 한눈에: 토스트 / 스낵바 / 페이지 배너 / 본문 안 안내(콜아웃) / 알림 대화상자 (SEED, KRDS, Shopify, Carbon)
- 오류 요약(폼 위에 오류 목록과 이동): GOV.UK, Primer
- 저장 방식(바로 저장 vs 버튼으로 저장): Primer
- 제출 전 답 확인 화면: GOV.UK
- 행 옆 가벼운 확인(누른 자리 옆 말풍선): Ant Popconfirm
- 반복 노출 제어(「일주일 동안 보지 않기」): Montage

## 이용 조건 요약

- 코드: SEED Apache-2.0, Montage MIT, Fluent·Ant MIT, Carbon Apache-2.0
- 글: GOV.UK는 OGL v3.0. 나머지는 문서 글의 조건을 따로 확인하지 못했다. 그래서 글은 우리 말로 요약하고 링크만 단다
- 토스 TDS Figma UI Kit은 앱인토스 밖 사용·복제·재배포 금지. 근거 링크 말고는 쓰지 않는다
- AI 연결: SEED는 llms.txt와 MCP(`@seed-design/mcp`), Ant는 llms.txt·MCP·에이전트 안내, 토스(앱인토스)는 llms.txt·MCP·Claude 플러그인, Carbon은 MCP, Primer는 MCP(`@primer/mcp`), Atlassian은 llms.txt·MCP(얼리 액세스), Polaris는 Shopify Dev MCP로 읽힌다(2026-11-06 다시 확인). Montage는 비공개 MCP뿐이다
