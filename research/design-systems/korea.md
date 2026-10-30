# 국내 디자인 시스템 조사 (확인일 2026-10-29)

읽은 곳: 원티드 Montage, 당근 SEED, 정부 KRDS, 토스 TDS(앱인토스). 나머지는 「공개 문서 없음」 또는 「확인 못 함」.
한계: WebFetch가 문서를 요약해 돌려준 것이라 숫자는 원문 재확인을 권한다. 페이지 안에 AI에게 하는 지시 같은 문구는 없었다.

## 시스템별 정리

### 1. 당근 SEED Design — 사용 기준이 가장 풍부 (AI 연결도 가장 좋음)
- 만든 곳: 당근(daangn). 주소: https://seed-design.io , 코드 https://github.com/daangn/seed-design
- 구조: Get Started / Foundations / Components(약 50개) / Patterns(Loading, Safe Area 2개뿐) / Design Guidelines / React Library 등. 컴포넌트마다 Anatomy·Properties·Guidelines와 「언제 쓰나/쓰지 않나」가 있다.
- 이용 조건: GitHub에 Apache-2.0 표시. 문서 글·아이콘·폰트를 따로 정한 내용은 못 찾았고 NOTICE 파일이 있으나 내용은 못 봤다. 링크는 문제없어 보이나 명시 없음.
- AI 연결: 가장 좋다. https://seed-design.io/llms.txt (섹션별 llms.txt와 llms-full.txt, 컴포넌트별 `/llms/components/{이름}.txt`). npm에 `@seed-design/mcp`, `@seed-design/docs-mcp`, `@seed-design/figma`, `@seed-design/react`, `@seed-design/cli` 있음. AI Integration 문서 URL은 404라 내용은 못 읽었다.
- 특징: 컴포넌트마다 기계가 읽는 텍스트가 있어 fits/avoid 근거를 그대로 뽑기 쉽다.

### 2. 정부 KRDS — 사용 기준 풍부, 접근성 중심
- 만든 곳: 행정안전부·한국지능정보사회진흥원(제작 플립커뮤니케이션즈·에스앤씨랩, 출처: designcompass.org). 주소: https://www.krds.go.kr
- 구조: 스타일 / 컴포넌트 / 패턴 / 서비스 공통. 컴포넌트 목록 페이지에 55개(상단 표기는 37건이라 불일치). 모바일 묶음에 바텀시트·토스트·스낵바·수량 토글·탭바·스플래시가 있다. 목록: https://www.krds.go.kr/html/site/component/component_summary.html . 패턴 목록 URL은 404라 확인 못 함(검색 자료는 패턴 16종이라 하나 미확인).
- 이용 조건: 못 찾음. 이용 안내 페이지(추정 URL)는 404였고 검색에도 없다. 공공누리 유형 등은 사이트에서 직접 확인 필요.
- AI 연결: 공식은 못 찾음. 비공식 MCP/플러그인이 있다고만 검색에 나옴.
- 특징: 「쓰지 말아야 할 때」를 대체 컴포넌트와 함께 적는 문서가 많고, 키보드·스크린리더 기준이 상세하다. 모든 컴포넌트가 아니라 일부만 이 정도로 상세하다.

### 3. 원티드 Montage — 구성은 좋고 사용 기준은 중간
- 만든 곳: Wanted Lab. 주소: https://montage.wanted.co.kr/docs/getting-started
- 구조: Getting started / Foundations / Components(54개, 7분류: Actions 5, Contents 11, Feedback 6, Loading 2, Navigations 9, Presentation 6, Selection and input 15) / Utilities. 「패턴」 문서 없음. 컴포넌트 문서 경로는 `/docs/components/{분류}/{이름}/design` 꼴. 플랫폼별 코드는 GitHub(montage-web, montage-ios, montage-android).
- 이용 조건: MIT(상업 이용 가능, 저작권 표시 유지). 원티드 로고·브랜드 자산은 별도 가이드, 사칭 금지. 문서 인용·링크 허용 여부는 명시 없음(사용 시 출처 표기 권장). 출처: .../docs/getting-started/terms-of-use
- AI 연결: llms.txt 404. MCP 못 찾음. Figma 커뮤니티 파일 「Wanted Figma UI Kit」 있음.
- 특징: 컴포넌트마다 「사용 기준」이 있으나 컴포넌트 간 비교는 적다. 대신 숫자(높이, 너비, 시간, 여백)가 구체적이다.

### 4. 토스 TDS (앱인토스 공개분) — 쓸 수 있는 것이 적고 조건이 엄격
- 주소: https://developers-apps-in-toss.toss.im/design/components , 컴포넌트 문서 https://tossmini-docs.toss.im/tds-mobile/
- 구조: 앱인토스에서 자주 쓰는 11개(Badge, Border, BottomCTA, Button, Asset, ListRow, ListHeader, Navigation, Paragraph, Tab, Top)만 공개. UX 가이드(https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.md)는 다크패턴 방지·UX 라이팅·그래픽·해상도 중심이고 로딩·빈 화면·토스트·입력 검증 기준은 없다고 확인.
- 이용 조건: Figma UI Kit은 앱인토스 앱 개발·디자인·프로토타입에만 허용. 다른 서비스 사용, 상업적 활용, 복사·수정, 재배포 금지. 권리는 Viva Republica. 우리 카탈로그 용도로는 이미지·자료를 가져올 수 없다. (출처: .../design/prepare/figma-ui-license)
- AI 연결: llms.txt 있음(https://developers-apps-in-toss.toss.im/llms.txt, 마크다운 문서 제공).
- 특징: 컴포넌트 세부 기준은 tossmini-docs 쪽에 있으나 이번에 읽지 않았다(미확인).

### 5. 공개 문서 없음 / 확인 못 함
- 배달의민족: 공식 디자인 시스템 문서 못 찾음(제3자 정리본만 있음). 공개 문서 없음으로 처리.
- 카카오·카카오뱅크·카카오페이: design.kakao.com이 있다는 정도만 검색에 나옴. 직접 읽지 못했다. 확인 못 함.
- 네이버, 라인, 쿠팡, 무신사, 29CM, 오늘의집, 야놀자: 공식 사용 기준 문서를 못 찾음(무신사는 제3자 정리본만 확인). 확인 못 함 / 공개 문서 없음.

## 사용 기준 (패턴 id/방식 id 기준 요약 — 시스템, URL)

### loading / busy
- [loading] 1초 안에 끝나면 로딩 표시를 하지 않는다(깜빡임이 더 불편). — SEED https://seed-design.io/llms/patterns/loading.txt , KRDS 스피너 https://www.krds.go.kr/html/site/component/component_07_02.html (둘 다 같은 취지). 축: action 가벼운 작업
- [loading/skeleton] 목록·카드처럼 반복 구조이고 레이아웃이 고정된 화면, 약 1~10초 대기일 때. 구조를 미리 보여준다. — SEED skeleton https://seed-design.io/llms/components/skeleton.txt . 축: content 사진/표·숫자
- [loading/spinner] 짧은 대기(1~4초), 공간이 좁을 때, 저장·재요청 같은 「행동」으로 생기는 로딩. 스켈레톤과 같이 쓰지 않는다. — SEED 같은 문서. 축: action
- [loading/progress] 설치·업로드·다운로드처럼 시작과 끝이 있는 과정, 10초 이상. 예상 시간을 주고, 1분 이상이면 백그라운드 처리와 취소를 고려. 진행률을 계산할 수 있을 때만 정량형 스피너. — SEED 로딩 패턴, KRDS 스피너
- [loading] 정적인 것(카테고리, 고정 아이콘)에는 스켈레톤을 쓰지 않는다. — Montage https://montage.wanted.co.kr/docs/components/loading/skeleton/design
- [loading] 스피너는 화면당 1개(파일 업로드 항목 같은 작은 부분 제외). 전체 로딩은 중앙에 크게, 부분 갱신은 그 요소 안에 작게. — KRDS
- [loading] 로딩 단계별: 시작 즉시 알림 / 길어지면 안내 문구 / 간단한 로딩은 완료 문구 불필요 / 실패 시 원인+재시도. — SEED 로딩 패턴
- [busy/inline] 폼 제출은 제출 버튼 안에 스피너를 둘 수 있다. — KRDS 스피너. 
- [busy] 데이터를 보내는 버튼은 두 번째 누름을 무시하도록 구현한다. — KRDS 버튼 https://www.krds.go.kr/html/site/component/component_05_02.html . 축: action 두 번 되면 안 되는 작업, skill 처음
- [busy] 버튼 로딩 상태는 간단한 로딩(파일 업로드)에 쓰고, 로딩 중 이탈하면 중단된다. — Montage 버튼

### empty / error
- [empty] 처음 쓰거나 검색·필터 결과가 없을 때 쓴다. 내용 없음 + 다음 행동 안내. 그림은 아이콘 위주, 버튼은 선택. — SEED result-section https://seed-design.io/llms/components/result-section.txt , Montage fallback view https://montage.wanted.co.kr/docs/components/feedback/fallback-view/design
- [error/full] 실패 화면 버튼은 상황별로: 입력 오류면 뒤로, 임시 레이어면 닫기, 못 돌아가면 홈, 같은 작업을 바로 다시 할 수 있으면 다시 시도. — SEED result-section
- [error/full] 설명은 2줄 이하, 제목에 행동 유도 문구를 넣지 않는다. 작은 영역에서는 제목을 생략(Compact). — Montage fallback view
- [error/inline] 폼 필드에 묶인 오류·성공·경고는 토스트·모달이 아니라 필드 옆 문구로. — KRDS 토스트·모달·스낵바 페이지
- [error/dialog] 오류·권한 없음도 Fallback view로 다룬다(Montage는 데이터 로드 실패, 접근 권한 없음을 포함). — Montage
- [error] 느낌표 아이콘을 오류가 아닌 곳에, 로딩 애니메이션을 기다릴 필요 없는 곳에 쓰지 않는다. 불가능하다고 말하기보다 할 수 있는 행동을 알려준다. — 토스 UX 가이드

### done / notify
- [done/toast] 사용자가 한 일의 결과를 짧게, 한 줄로, 자동으로 사라지게. 되돌리기 같은 행동이 필요하면 토스트가 아니라 스낵바. — KRDS https://www.krds.go.kr/html/site/component/component_12_05.html , Montage 토스트(액션을 주지 않는다) https://montage.wanted.co.kr/docs/components/feedback/toast/design
- [done/undo] 되돌리기·재시도 같은 작은 후속 행동은 스낵바. 텍스트 버튼 1개, 라벨은 한두 단어로 구체적으로. 추가·삭제는 되돌리기 후보. — SEED snackbar https://seed-design.io/llms/components/snackbar.txt , KRDS 스낵바
- [done/undo] 되돌릴 수 없는 일이나 꼭 확인해야 하는 정보에는 스낵바를 쓰지 않는다. — Montage 스낵바 https://montage.wanted.co.kr/docs/components/feedback/snackbar/design , SEED
- [done] 스낵바는 한 번에 하나, 나머지는 대기열. 한 화면에 쌓거나 겹치지 않는다. — SEED, KRDS
- [done/toast] 긴급·중요 메시지, 한 줄을 넘는 설명에는 토스트를 쓰지 않는다(긴급 공지나 모달로). — KRDS
- [notify/banner] 페이지 전체 상태·제재·만료 임박은 맨 위 띠(Page Banner). 한 화면에 하나만. 경고·오류 배너는 닫을 수 없게. 닫을 수 있는 건 한 번만 알려도 되는 정보이고, 닫은 뒤 반복해 뜨지 않게. — SEED https://seed-design.io/llms/components/page-banner.txt
- [notify/banner] 본문 중간 국소 안내는 Callout, 전체 페이지 안내는 Page Banner로 나눈다. — SEED
- [notify/modal] 모달은 「최후의 수단」. 더 덜 방해하는 것이 있는지 먼저 본다. 사용자 행동 없이 자동으로 띄우는 것은 세션 만료·긴급 정보 정도. — KRDS https://www.krds.go.kr/html/site/component/component_04_05.html
- [notify/modal] 진입 시 바텀시트, 뒤로 가기 때 끼어들기, 거절 선택지 없음, 모호한 CTA를 다크패턴으로 보고 검수에서 반려. — 토스 UX 가이드(앱인토스 입점 기준)
- [notify/modal] 일정 기간 띄우는 팝업에는 「일주일 동안 보지 않기」 같은 옵션을 권한다. — Montage 팝업 https://montage.wanted.co.kr/docs/components/presentation/popup/design

### delete / confirmForm / popover
- [delete/confirm, confirmForm/dialog] 되돌릴 수 없는 일(삭제, 초기화, 작성 내용 손실)은 Alert Dialog로 확인받고 해당 버튼만 빨간 톤(Critical). 취소 버튼에는 적용하지 않는다. 바깥 영역을 눌러도 닫히지 않는다. — SEED https://seed-design.io/llms/components/alert-dialog.txt . 축: action 되돌릴 수 없는 작업
- [confirmForm] 대화상자 버튼은 닫기·확인 2개 이하, 3개 이상이면 메뉴 시트. 버튼 라벨이 길면 세로 배열. — SEED alert-dialog
- [confirmForm] 「취소」는 진행 중 작업이 취소된다고 오해하므로 다이얼로그 왼쪽 버튼은 「닫기」로 통일. — 토스 UX 가이드
- [confirmForm/dialog] 시스템 확인·경고처럼 응답이 필수면 Alert Dialog, 사용자가 작업·입력하며 언제든 닫을 수 있으면 Dialog. — SEED dialog https://seed-design.io/llms/components/dialog.txt
- [confirmForm/dialog] 모달 안에 탭·아코디언·입력폼처럼 상호작용이 많은 것을 넣지 않는다. 다단계·복잡 과정은 별도 화면. 확정·취소 버튼은 푸터에. — KRDS 모달
- [confirmForm/sheet] 바텀시트는 현재 화면 맥락을 유지하며 추가 정보·선택지를 줄 때. 내용이 화면 높이 90% 초과면 별도 페이지, 결제처럼 실수로 닫히면 안 되는 작업은 핸들을 없애고 닫기 버튼. — SEED https://seed-design.io/llms/components/bottom-sheet.txt , KRDS 바텀시트 https://www.krds.go.kr/html/site/component/component_12_03.html
- [popover/sheet] 항상 보여야 하는 정보, 긴 여정의 한 단계, 시트 위에 시트 쌓기에는 바텀시트를 쓰지 않는다. 닫기(X)를 눈에 보이게 둔다(스와이프로 닫는 줄 모를 수 있음). — KRDS 바텀시트
- [popover/sheet] 모바일에서 날짜·시간 선택기와 메뉴를 호출할 때 바텀시트. 시트 안에서 모달을 또 띄우지 않는다. 편집 영역이 넓거나 깊이가 생기면 전체 모달. — Montage https://montage.wanted.co.kr/docs/components/presentation/bottom-sheet/design
- [popover/sheet] 현재 작업과 관련된 선택지 목록은 메뉴 시트. 삭제·신고·나가기는 Critical 톤. 3개 이상이면 그룹 구분(최대 3그룹). — SEED https://seed-design.io/llms/components/menu-sheet.txt

### 입력·선택
- [validate] 기본은 제출 시 한꺼번에. 필드가 많거나 금융·보안처럼 오입력 위험이 큰 필드는 칸을 벗어날 때(blur). 필수·글자 수는 입력 중, 서버 규칙은 제출 시 섞어 쓴다. 오류 문구는 행동을 알려주는 짧은 말. 오류가 있으면 도움말은 숨긴다. — SEED field https://seed-design.io/llms/components/field.txt . 축: skill, action
- [validate/lock] 제출 버튼 비활성 조건: SEED는 기준 없음, Montage는 입력이 유효하지 않으면 비활성, 유효하면 활성인 조건부 버튼 예시를 보임. KRDS는 금지·권장 모두 명시하지 않음. 즉 「잠금을 써도 된다」는 근거는 약하고 「쓰지 말라」는 근거도 없음. — Montage 버튼 https://montage.wanted.co.kr/docs/components/actions/button/design
- [validate] 필수는 *, 선택은 「선택」 글자. 필드의 2/3 이상이 필수이면 「선택」만 표시. 한 폼에서 두 방식을 섞지 않는다. — SEED field
- [validate] 전화번호 등 형식이 정해진 입력은 칸을 나누지 말고 한 곳에 받으며 형식을 자동 적용. 입력창이 하나면 언더라인, 여럿이면 아웃라인형. — SEED https://seed-design.io/llms/components/text-input.txt
- [toggle/switch] 즉시 적용되는 설정에는 스위치, 저장·제출 후 적용되거나 동의·계층 선택이면 체크박스(다른 옵션이 여럿이면 라디오). 스위치는 켜짐/꺼짐 기본 상태가 있어야 한다. — SEED https://seed-design.io/llms/components/switch.txt , KRDS https://www.krds.go.kr/html/site/component/component_06_07.html (두 곳이 일치)
- [qty/stepper] 장바구니·상품 상세·주문서에서 사용. 경계값에 닿으면 해당 버튼을 비활성화해 바로 알림. 줄여서 0이 되는 것이 삭제를 뜻하면 − 버튼이 삭제 버튼으로 바뀐다. — SEED https://seed-design.io/llms/components/quantity-picker.txt
- [qty/stepper vs input] 선택 범위가 좁고(기본값 포함 11단계 이내) 자주 고르는 값이 있으면 토글, 범위가 넓으면(나이처럼) 텍스트 입력. — KRDS https://www.krds.go.kr/html/site/component/component_12_04.html . 축: skill, platform 모바일
- [cta] 한 화면에 최상위 강조 버튼은 하나. 같은 화면에서 Solid와 Outline을 섞지 않는다. 삭제·초기화 같은 되돌릴 수 없는 동작은 Critical. — SEED action-button https://seed-design.io/llms/components/action-button.txt , KRDS 버튼
- [cta] 주요 행동과 보조 행동의 비중이 크게 다르거나 라벨이 길면 세로, 비슷하면 가로(주요 액션은 오른쪽). — Montage 버튼

### more / onboarding / 기타
- [more/pages] 특정 페이지로 바로 가거나 위치를 알아야 할 때, 검색 결과·게시판. 전체가 화면 3~4개 분량 이하(SEED) 또는 목록 높이가 뷰포트 2배 이하·20개 이내(KRDS)면 나누지 않는다. — SEED https://seed-design.io/llms/components/pagination.txt , KRDS https://www.krds.go.kr/html/site/component/component_03_06.html . 축: platform 데스크톱
- [more/infinite, more/button] 모바일(반응형 제외)에서는 무한 스크롤 또는 더 보기 버튼을 권한다. — Montage 페이지네이션 https://montage.wanted.co.kr/docs/components/navigations/pagination/design . 무한 스크롤을 쓰면 페이지네이션은 쓰지 않는다(키보드 사용자 문제). — KRDS
- [onboarding/coach] 새 기능 소개나 복잡한 다단계 과업을 알릴 때. 사용자가 요청하지 않았는데 페이지 로딩 직후 자동 실행하지 않는다. 한 화면에 동시에 여러 개 금지, 떠 있는 동안 다른 알림·배너 금지, 대상 요소를 가리지 않는다. — KRDS 코치마크 https://www.krds.go.kr/html/site/component/component_08_04.html
- [noImage/placeholder] 이미지가 없거나 못 불러올 때 영역의 성격을 전하는 대체 이미지(Content Placeholder, 서비스·카테고리별 12종). — SEED https://seed-design.io/llms/components/content-placeholder.txt
- [statusMark, time, nav 등]: 이번에 읽은 문서에서 사용 기준을 못 찾음.

## 숫자 기준

- 로딩 표시 기준 대기 시간: 1초 미만 없음 / 1~4초 스피너·스켈레톤 / 4~10초 스켈레톤·진행 바+안내 / 10초 이상 정량형+예상 시간 / 1분 이상 백그라운드·취소 고려 — SEED 로딩 패턴
- 스낵바 표시 시간: SEED 약 4초(터치로 멈춤), Montage 기본 4초, 길거나 행동 필요시 16초 — SEED, Montage
- 토스트 표시 시간: KRDS 안내 2~3초, 경고·실패 3~4초. Montage는 시간 명시 없음. 최대 2줄, 높이 54px, 최대 너비 420px — KRDS, Montage
- 터치 영역: KRDS 버튼 44×44px 이상(마우스 17×17px 이상). SEED 스위치는 크기 16이어도 터치 높이 24 확보, 바텀시트 닫기 버튼 40×40, Help Bubble 닫기 38×38. — 우리 platform 모바일 기준에 쓸 만함
- 페이지네이션: KRDS 숫자 링크 11개 이내(모바일 7개), SEED 9슬롯(480px 미만 7슬롯), Montage 모바일 웹 7페이지, 20페이지 이상이면 처음·끝 이동 — 같은 문서들
- 바텀시트: 최대 높이 90%, 스냅 90/50/10%, 최대 너비 480px(SEED). Montage는 Web 상단 40px 아래까지, 앱 상단 10px 아래까지
- 코치마크: 한 페이지 4개 이하, 전체 15단계 이내 — KRDS
- 수량: 11단계 이내(KRDS)
- 하단 탭바 탭 개수: 최소 2개, 최대 5개 — 토스 UX 가이드(앱인토스 미니앱 기준)
- 스켈레톤 애니메이션: Pulse, 투명도 50~100%, 주기 2초 — Montage
- 명도 대비 3:1 이상(스피너, 입력 필드 경계) — KRDS
- 메뉴 시트: 그룹 최대 3개, 아이템 3개 이상이면 그룹 구분 — SEED
- 텍스트 영역 최소 높이: 자동 크기 3줄 95px, 고정 2줄 70px — SEED

## 우리 카탈로그에 없는 패턴·방식 후보
- 「메시지 길이·긴급도로 고르는 알림 층」: 토스트 / 스낵바 / 페이지 배너 / 콜아웃 / 알림 대화상자의 구분 기준이 문서마다 뚜렷하다. done·notify·error에 흩어진 것을 한 번에 비교하는 표 필요. 특히 notify에 「콜아웃(본문 중간 국소 안내)」 방식이 없다.
- 대화상자 두 종류: 「알림형(응답 필수)」과 「작업형(닫고 돌아갈 수 있음)」(SEED). confirmForm/dialog 안에서 나눌 수 있다.
- 파괴적 동작의 시각 처리(빨간 톤은 그 버튼에만)와 메뉴 시트의 위험 항목 표시. delete의 부속 규칙.
- 「일주일 동안 보지 않기」 같은 반복 노출 제어(onboarding·notify의 avoid 근거).
- 되돌리기 시간(약 4초)이 done/undo의 숫자 근거가 된다.
- 로딩의 「1초 미만엔 표시 안 함」 규칙, 로딩 대기 시간별 방식 사다리: 이미 loading에 조건 축(작업 시간)이 없으면 추가 후보.
- 정적 콘텐츠에 스켈레톤 금지, 이미지 대체 자리표시(noImage/placeholder 보강).
- 다크패턴 방지 항목(진입 시 시트, 거절 선택지 없음 등): notify/modal의 avoid 근거로 쓸 수 있다(토스 기준은 해당 입점 정책이라 일반 규칙으로 옮길 때는 「관례」 정도).

## 가져올 것 / 안 가져올 것 의견
- 가져올 것(강도 「제약=출처 있는 기준」): SEED와 KRDS의 「쓰지 않을 때」. 둘이 일치하는 것(스위치 vs 체크박스, 스피너 1초 미만, 스낵바 한 번에 하나, 모달 안에 폼 넣지 않기, 무한 스크롤에서 페이지네이션 금지)은 근거가 두 곳이라 강하게 쓴다.
- 가져올 것(숫자): 로딩 대기 시간 사다리(SEED), 터치 44px(KRDS), 스낵바 4초. 출처 URL을 같이 단다.
- 약하게 쓸 것(관례): 버튼 비활성(lock)은 어느 문서도 명확히 금지하거나 권하지 않았다. 「문서가 막지 않는다」 정도만 적고 근거로 삼지 않는다. Montage와 KRDS가 모바일에서는 더보기·무한 스크롤을 권하고 페이지 번호는 검색·게시판에 둔다는 점은 more의 platform·content 축과 연결된다.
- 가져오지 않을 것: 이미지·Figma 파일·아이콘·문구 통째. 토스 UI Kit은 다른 용도 사용과 복제가 금지라 링크·요약 근거 외에는 쓰지 않는다. KRDS는 이용 조건을 못 확인했으므로 링크와 15단어 이내 인용만. SEED(Apache-2.0)·Montage(MIT)는 코드·토큰 라이선스일 뿐 문서 글과 이미지의 권리는 따로 확인되지 않았으므로 우리 말로 요약하고 URL만 단다.
- 우리가 만든 사용 기준은 각 문서가 「자기 서비스 맥락」(당근=지역 커뮤니티 모바일, KRDS=공공 웹·접근성, Montage=채용 웹)이라는 점을 감안해 platform·skill 축과 맞춰 읽는다. 매장 주문처럼 공용 기기·태블릿 맥락의 기준은 읽은 문서 어디에도 없었다.
- 다음에 더 볼 것: 토스 tossmini-docs의 컴포넌트별 문서(미확인), KRDS 이용 조건 페이지, 카카오 design.kakao.com.
