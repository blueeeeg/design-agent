# 해외 디자인 시스템 조사 A (Material 3 / Apple HIG / Fluent 2 / Ant Design)

확인일 2026-10-29. 「(미확인)」은 문서 본문에서 못 읽고 일반 지식으로 적은 것이라 인용 전에 다시 봐야 한다.
m3.material.io는 스크립트로 그려져 본문을 못 읽었다. Material 항목은 material-components-android 문서(GitHub)와 developer.android.com에서 가져왔다.

## 시스템별 요약

### Google Material Design 3
- 만든 곳: Google. 주소: https://m3.material.io
- 구조: 파운데이션 / 스타일 / 컴포넌트 / 패턴(adaptive layout 포함). 컴포넌트 수는 못 셌다
- 이용 조건: 문서·Figma 키트 조건은 못 찾음(미확인). material-web은 「유지보수 모드, 새 관리자 대기」라고 README에 있다(https://github.com/material-components/material-web). 라이선스 문구는 README에 없었다
- AI 연결: 공식 MCP·llms.txt 못 찾음
- 특징: 창 크기 등급(compact/medium/expanded)으로 내비게이션·시트를 바꾸는 「적응형」 기준이 가장 체계적

### Apple Human Interface Guidelines
- 만든 곳: Apple. 주소: https://developer.apple.com/design/human-interface-guidelines
- 구조: 플랫폼별 + 컴포넌트별 문서. 한 컴포넌트 안에 「iOS/iPadOS/macOS/visionOS」 절이 따로 있다. 이 조사의 본문은 같은 주소의 JSON(`developer.apple.com/tutorials/data/design/human-interface-guidelines/{이름}.json`)에서 읽었다
- 이용 조건: 못 찾음. 문서는 링크·요약만 한다
- AI 연결: 못 찾음
- 특징: 「토스트」 컴포넌트가 없다. 알림 대화상자는 드물게, 일반 동작은 되돌릴 수 있게 하라고 한다

### Microsoft Fluent 2
- 만든 곳: Microsoft. 주소: https://fluent2.microsoft.design
- 구조: Foundations(색·타이포·레이아웃·접근성) / 컴포넌트(플랫폼별 web·iOS·Android·Windows 문서) / 디자인 도구
- 이용 조건: 코드(fluentui 저장소)는 MIT. 폰트·아이콘은 별도 자산 라이선스(https://github.com/microsoft/fluentui)
- AI 연결: 공식은 못 찾음. 커뮤니티 MCP 서버는 있으나 Microsoft 것이 아니다
- 특징: 플랫폼별로 컴포넌트 문서가 갈린다. 터치 기준을 플랫폼 표로 못 박았다

### Ant Design
- 만든 곳: Ant Group(저작권 표기 Ant UED). 주소: https://ant.design
- 구조: 디자인 가치/사양 + 컴포넌트 73개 + ProComponents 6개. 분류: 일반·레이아웃·내비게이션·데이터 입력(18)·데이터 표시(21)·피드백(11)·기타. 「패턴」 문서는 따로 없음
- 이용 조건: 코드 MIT(https://github.com/ant-design/ant-design). 문서 글·아이콘 조건은 못 찾음
- AI 연결: https://ant.design/llms.txt 있음(문서·컴포넌트 마크다운 링크 목록). MCP는 못 찾음
- 특징: 데스크톱 관리자 화면 기준. 모바일 기준은 약하고 컴포넌트 사용 설명은 짧다

## 사용 기준

플랫폼 축(데스크톱/태블릿/모바일)에 걸리는 것을 먼저 적는다.

- [confirmForm/sheet, popover/sheet — 축: platform=모바일] 모달 시트는 모바일에서 인라인 메뉴·간단한 대화상자 대신 선택지를 보이는 방식이고 스크림 위에 뜨며 바깥 탭·아래로 끌면 닫힌다 — Material, https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
- [popover/layer 또는 sheet — 축: platform] 시트의 최대 너비 기본값이 640dp다. 큰 화면용 규칙은 문서에 없다. 즉 큰 화면에서는 가운데 대화상자로 바꾸라는 근거는 못 찾았다 — Material, 같은 주소
- [popover/sheet — 축: platform=태블릿] iPad는 시트에 폼/페이지 방식을 권한다. 기본 크기로 가운데에 놓고 뒤를 어둡게 한다. 즉 iPad에서는 「아래 시트」가 아니라 「가운데 창」이다 — Apple, https://developer.apple.com/design/human-interface-guidelines/sheets
- [popover/sheet, loading — 축: platform=모바일] iPhone 시트는 medium(절반 높이) 정지점으로 단계적으로 보이게 하고, 전체 높이가 필요한 작성 화면은 쓰지 않는다. 크기 조절되는 시트에는 손잡이를 둔다 — Apple, 같은 주소
- [confirmForm/screen — 축: action=되돌릴 수 없는 작업이 아니라 「여러 단계」] 여러 단계·긴 작업은 시트 대신 전체 화면(iOS 전체 화면 모달, macOS 별도 창, Material 전체 화면 대화상자)으로 — Apple sheets, Material Dialog.md
- [confirmForm/dialog — 축: action] 대화상자는 모달이고 일부러 방해하므로 드물게 쓴다. 상세 위치: https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md
- [error/dialog, delete/confirm — 축: action=되돌릴 수 없는 작업] 알림은 흔하고 되돌릴 수 있는 동작에는 쓰지 않는다(메일 삭제도 예). 드물고 되돌릴 수 없는 파괴 동작에만 쓴다 — Apple, https://developer.apple.com/design/human-interface-guidelines/alerts
- [delete/undo vs confirm — 축: action] 위와 같은 뜻으로, 되돌릴 수 있으면 undo, 되돌릴 수 없고 드물면 confirm. Apple은 「앱 시작 때 알림 금지」도 적었다 — Apple alerts
- [confirmForm/dialog] 파괴 동작이 있으면 취소 버튼을 꼭 두고, 취소를 기본 버튼으로 하지 않는다. 버튼은 최대 3개, 라벨은 1~2단어 동사(「삭제」), 「예/아니오」 피함 — Apple alerts, Fluent https://fluent2.microsoft.design/components/web/react/core/dialog/usage (Fluent도 3개 이내, 2단어 이내, 중첩 금지)
- [confirmForm/sheet — 축: platform=모바일] 사용자가 시작한 동작에 대한 선택(초안 버리기·저장)은 알림이 아니라 액션 시트. 파괴 버튼은 맨 위, 취소는 맨 아래, 스크롤되게 하지 않는다 — Apple, https://developer.apple.com/design/human-interface-guidelines/action-sheets
- [done/toast, error/toast — 축: action=가벼운] 토스트는 「꼭 필요하지 않은 유용한 정보」용: 완료 확인·진행 상황·시스템 소식. 중요한 메시지나 반드시 해야 할 일에는 쓰지 않고 모달·필드 오류·메시지 띠를 쓴다 — Fluent, https://fluent2.microsoft.design/components/web/react/core/toast/usage
- [done/undo — 축: platform=모바일] 스낵바는 방금 한 일에 대한 짧은 피드백이고 사용자 입력 없이 사라진다. 동시에 1개, 새 것이 이전 것을 대체. 동작은 1개(되돌리기·재시도). 문서상 Toast보다 스낵바를 먼저 쓴다 — Material, Snackbar.md (https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md)
- [done/toast — 축: platform] 스낵바는 작은 화면에서 한두 줄(48~64dp 높이), 중·대형 화면에서는 가로로 늘어난다(검색 결과 요약, 원문 직접 확인 못 함) — Material, https://m3.material.io/components/snackbar
- [error/toast, notify/banner — 축: platform=데스크톱] 데스크톱·웹은 모서리(우상단·우하단)에 토스트를 쌓는다. 최대 4개, 간격 16px. 모바일은 아래 스낵바 — Fluent toast, Ant notification https://ant.design/components/notification (기본 우상단, 4.5초, 3개부터 겹침)
- [done/toast — 축: platform=데스크톱] Ant message는 가볍게 방해하지 않는 성공·경고·오류 알림. 위쪽 가운데, 3초 — Ant, https://ant.design/components/message
- [nav/tabbar — 축: platform=모바일] 하단 탭바(Material은 navigation bar)는 작은 기기의 최상위 이동. 3~5개 — Material, BottomNavigation.md; Apple는 「필요한 만큼만, 적을수록 좋다」, 넘치면 「더 보기」로 숨어 찾기 어렵다 — Apple, https://developer.apple.com/design/human-interface-guidelines/tab-bars
- [nav/sidebar — 축: platform=태블릿·데스크톱] 중간 이상 화면은 내비게이션 레일(접힘 3~7개, 펼침은 개수 제한 없고 드로어 대체). 레일을 왜 쓰는지는 「중간 크기 기기, 태블릿·데스크톱」이라고만 설명 — Material, NavigationRail.md
- [nav — 축: platform=태블릿] iPad는 탭바가 위쪽에 있고, 복잡한 앱은 탭바를 사이드바로 바꿀 수 있게 한다. 기본 탭은 5개 이하로 해 iPhone과 이어지게 — Apple tab bars
- [nav — 축: skill] 탭은 비활성/숨김 금지. 내용이 없으면 이유를 설명한다 — Apple tab bars. 탭바는 이동용, 동작은 툴바
- [loading/skeleton, spinner — 축: content] 가능한 한 빨리 무언가를 보인다. 빈 화면은 고장난 것처럼 보인다. 자리표시자 → 내용으로 교체. 시간을 알면 진행 바, 모르면 돌아가는 표시. 기다리는 동안 다른 기능을 쓰게 한다 — Apple, https://developer.apple.com/design/human-interface-guidelines/loading
- [loading/spinner] Ant Spin: 일부분이 비동기 데이터를 기다릴 때. 작은 것은 글자 옆, 기본은 카드, 큰 것은 전체 페이지. delay로 번쩍임을 막는다. 스켈레톤 선택 기준은 문서에 없다 — Ant, https://ant.design/components/spin
- [empty/action, illus — 축: skill=처음 쓴다] 데이터가 없을 때 친절한 안내, 새로 만드는 처음 상황의 안내 — Ant, https://ant.design/components/empty
- [more/pages — 축: platform=데스크톱, content=표·숫자] 전부 불러오면 오래 걸릴 때, 사용자가 페이지를 넘겨 훑게 할 때. 기본 10개, 선택지 10/20/50/100 — Ant, https://ant.design/components/pagination
- [confirmForm/dialog vs popover — 축: platform=데스크톱] 행에서 삭제 같은 가벼운 확인은 누른 자리 옆 말풍선(Popconfirm), 더 주의가 필요하면 가운데 확인창 — Ant, https://ant.design/components/popconfirm
- [popover/layer, steps — 축: platform=데스크톱] 폼 편집·하위 작업이 너무 무겁지만 주 작업 맥락 안에 두고 싶을 때 옆에서 밀려나오는 서랍(기본 378px, 큰 것 736px) — Ant, https://ant.design/components/drawer
- [popover — 축: platform=데스크톱] 반복 입력·결과 관찰(찾기·바꾸기)은 시트 대신 비모달 패널 — Apple sheets. Fluent는 비모달 대화상자를 같은 용도로 둔다
- [notify/badge] 배지는 중요한 정보에만 — Apple tab bars. 알림 강도는 조용함/보통/시간 민감/위급 4단계, 시간 민감은 지금~1시간 안의 일에만, 광고에 쓰지 않는다 — Apple, https://developer.apple.com/design/human-interface-guidelines/managing-notifications
- [busy/block, validate/lock — 축: 두 번 되면 안 되는 작업] 이번 조사에서 근거 못 찾음

## 숫자 기준

- 터치 영역(iOS/iPadOS): 기본 44×44pt, 최소 28×28pt. 컨트롤 사이 여백은 테두리 있는 것 12pt, 없는 것 24pt — Apple, https://developer.apple.com/design/human-interface-guidelines/accessibility
- 클릭 영역(macOS): 기본 28×28pt, 최소 20×20pt. visionOS 기본 60×60pt. 즉 platform=데스크톱은 터치의 절반 크기가 허용된다 — Apple, 같은 주소
- Android: 48×48dp 이상, 간격 8dp 이상 — Google 접근성 도움말, https://support.google.com/accessibility/android/answer/7101858
- Fluent 2: 터치 최소 iOS·웹 44×44, Android 48×48. 간격 단위 4 기준(2·6·10 보조) — https://fluent2.microsoft.design/layout
- Fluent 2 폭 구간(px): small 320–479, medium 480–639, large 640–1023, x-large 1024–1365, xx-large 1366–1919, 1920+ — 같은 주소 (원문 표에 서로 어긋나는 값이 섞여 있었다)
- 글자 기본/최소: iOS 17/11pt, macOS 13/10pt, visionOS 17/12pt. 글자를 200%까지 키울 수 있게 — Apple accessibility
- 글자 대비: 일반 4.5:1, 큰 글자(18.5px 굵게 또는 24px) 3:1, 아이콘 등 3:1 — Fluent accessibility
- 토스트 시간: Fluent 동작 없는 토스트 7초, 진행 토스트는 끝날 때까지. Ant message 3초, notification 4.5초. 마우스가 올라가면 멈춘다 — 위 URL들. Material 스낵바는 Short/Long/Indefinite 세 종류이며 Compose 값 4초/10초는 (미확인)
- 라벨 길이: Fluent 대화상자·토스트 버튼 1~2단어, 토스트 버튼 36자 이하
- Material 창 크기 등급(미확인, developer.android.com 본문에 없었음): compact 600dp 미만, medium 600–839, expanded 840 이상. 하단 바 → 레일 → 레일/드로어로 대응하는 것이 일반적
- 시트 최대 너비 640dp(Material Android 기본값)

## 우리 카탈로그에 없는 패턴·방식 후보

- 패턴: 「알림 강도」(조용함/보통/시간 민감/위급) — notify에 방식이 아니라 한 단계 위 기준으로 넣을 만하다 (Apple)
- 방식: confirmForm에 「액션 시트(사용자가 시작한 선택)」와 「말풍선 확인(Popconfirm)」 구분
- 방식: popover/sheet의 「크기 정지점(절반/전체)」과 「비모달 시트·패널」
- 방식: nav에 「레일(접힌 아이콘 줄)」 — 우리 sidebar와 tabbar 사이. Material·Apple 모두 태블릿에 쓴다
- 방식: busy/loading에 「지연 표시(delay)」 — 짧은 로딩에서 번쩍임 방지 (Ant)
- 방식: more에 「간단 페이지(simple)」 — 이전/다음과 현재 쪽만 (Ant)
- 패턴: 「크기에 따라 바뀜(responsive)」 — 같은 요소가 폭에 따라 형태를 바꾸는 규칙 (Fluent의 위치 바꿈·크기 바꿈·재배치·숨김·재설계)

## 가져올 것 / 안 가져올 것

가져올 것:
- platform 축 근거: iPad 시트=가운데 창, iPhone 시트=아래 시트, 큰 화면은 레일·사이드바. 모바일 하단 3~5개
- 터치 숫자: 모바일 44~48, 데스크톱 28 정도까지 가능. fits/avoid에 숫자로 넣을 수 있다(Apple·Fluent·Google 모두 출처 있음, 강도=제약 후보)
- 파괴 동작 규칙: 되돌릴 수 있으면 알림 금지, 취소 버튼 필수, 버튼 3개 이내
- 토스트·스낵바 구분: 모바일=스낵바(동작 1개, 동시 1개), 데스크톱=모서리 쌓기(최대 4개)

가져오지 않을 것:
- Material의 「토스트 대신 스낵바」는 Android View 라이브러리의 문서이므로 웹에는 「관례」 강도로만
- Ant의 위치·시간 기본값은 라이브러리 설정 기본값이지 디자인 기준이 아니다. 예시 강도
- Apple·Material 페이지의 일반 지식 값(창 크기 등급, 스낵바 초)은 원문 재확인 전까지 근거로 쓰지 않는다

못 찾은 것: 스켈레톤 vs 스피너 선택 기준(Apple은 자리표시자 일반론뿐), 삭제 확인 vs 되돌리기에 대한 Material·Fluent·Ant의 직접 기준, 버튼 잠금 가부, 모바일 Fluent 시트 기준, 네 시스템 모두의 문서 글·이미지 인용 조건, Material·Apple·Fluent의 AI 연결.
