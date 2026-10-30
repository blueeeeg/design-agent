# 해외 디자인 시스템 B조 조사 (확인일 2026-10-29)

대상: Shopify Polaris, IBM Carbon, Atlassian, GitHub Primer, GOV.UK. 강도 표기: 제약=출처가 명시한 기준, 관례=여러 시스템이 같은 방향, 예시=한 시스템의 권고.

## 시스템별 요약

### Shopify Polaris
- 만든 곳: Shopify. 주소: https://shopify.dev/docs/api/polaris (옛 polaris.shopify.com/patterns/* 는 301로 여기로 넘어간다. 옛 주소의 패턴 문서는 못 읽음)
- 구조: 웹 컴포넌트 기반. 앱 홈 / Admin·Checkout·고객계정·POS 확장으로 나뉨. 패턴 문서는 「app-home/patterns/compositions/*」(예: empty-state)와 앱 디자인 가이드(https://shopify.dev/docs/apps/design/user-experience/alerts)에 흩어져 있다
- 이용 조건: 못 찾음(읽은 페이지에 라이선스 표기 없음)
- AI 연결: 페이지마다 .md 원문 주소가 있음. llms.txt·MCP는 읽은 범위에서 못 찾음
- 특징: 알림을 배너/인라인/토스트로 표 하나에 정리한 점이 좋다

### IBM Carbon
- 주소: https://carbondesignsystem.com/patterns/ (빈 상태, 로딩, 알림, 폼, 대화상자 등 패턴 문서가 따로 있음)
- 이용 조건: 코드 Apache-2.0(검색 결과 기준). 문서 글·아이콘·폰트 라이선스는 못 찾음
- AI 연결: 공식 Carbon MCP 있음(https://carbondesignsystem.com/developing/carbon-mcp/overview/, 2026-09-28 갱신, 발전 중). 「Carbon Patterns」 문맥은 추가 예정으로 적혀 있다. 엔드포인트와 OAuth는 제3자 목록 기준이라 직접 확인 안 함
- 특징: 패턴 문서가 가장 체계적. 시간 기준은 「잠깐」「몇 분」처럼 초 단위 없음

### Atlassian Design System
- 주소: https://atlassian.design (patterns, foundations/content, components)
- 구조: 토큰/프리미티브/컴포넌트/콘텐츠. 메시지 선택은 https://atlassian.design/patterns/messages/ (내용을 못 읽음)
- 이용 조건: 못 찾음
- AI 연결: MCP 서버·Figma 플러그인이 있다는 요약을 얻었으나 근거 페이지가 불확실해 「미확인」. llms.txt는 못 찾음
- 특징: 깃발(flag)·배너·인라인 메시지·모달을 심각도와 위치로 나눔

### GitHub Primer
- 주소: https://primer.style/product/ui-patterns/ (UI 패턴 10개: 데이터 시각화, 저하된 경험, 빈 상태, 기능 온보딩, 폼, 로딩, 내비게이션, 알림 메시지, 점진적 공개, 저장)
- 이용 조건: 못 찾음(읽은 범위에 없음)
- AI 연결: MCP 서버 문서와 Figma 라이브러리 페이지가 목차에 있음(내용은 못 읽음)
- 특징: 시간 구간별 로딩 기준과 「저장」 패턴이 독보적. 토스트를 권하지 않는다

### GOV.UK Design System
- 주소: https://design-system.service.gov.uk/patterns/ (패턴 30개: 묻기 10, 돕기 12, 페이지 8)
- 이용 조건: 글은 Open Government Licence v3.0(별도 표기 없는 한). 코드·글꼴·왕관 로고는 이 페이지에서 확인 못 함
- AI 연결: 못 찾음
- 특징: 「한 페이지에 질문 하나」, 오류는 제출 때 한꺼번에. 대상이 일반 시민이라 skill=처음에 가장 가깝다

## 사용 기준 (패턴/방식 · 요약 — 시스템, URL · 축 · 강도)

### 불러오는 동안·버튼을 누른 뒤
- [loading/skeleton] 첫 화면 로딩의 레이아웃 흉내. 카드·표·목록 같은 틀 있는 곳에 쓰고, 몇 초만 보이게 한다. 버튼·입력·토스트·모달 자체에는 쓰지 않는다 — Carbon, https://carbondesignsystem.com/patterns/loading-pattern/ · content=표·숫자/사진 · 제약
- [loading/skeleton] 넓은 영역이면 스켈레톤, 알 수 없는 짧은 대기는 스피너. 자리를 바꾸지 말고 레이아웃 흔들림을 피한다 — Primer, https://primer.style/product/ui-patterns/loading/ · 제약
- [loading/spinner] 진행률을 모를 때 가장 무난. 1초 미만이면 아무것도 보이지 않는 편이 낫다(깜빡임이 더 느리게 느껴짐) — Primer, 같은 주소 · 제약
- [loading/progress] 3초 이상이거나 진행을 추정할 수 있을 때. 10초 넘으면 백그라운드로 돌려 다른 일을 하게 한다. 몇 분 걸리면 알림을 더한다 — Primer, Carbon · action=두 번 되면 안 되는/오래 걸리는 작업 · 제약
- [busy/block] 앱 전체가 처리 중이거나 저장·제출로 앱을 잠깐 못 쓸 때만 전체 화면 로딩 — Carbon, 로딩 패턴 · 제약
- [busy/inline] 한 부분만 처리 중이면(예: 사용자 초대) 그 자리에 인라인 로딩 — Carbon, 같은 주소 · 제약
- [busy/label] 제출 뒤에는 주 버튼을 잠가 이중 제출을 막는다. 단 GOV.UK는 이중 클릭 방지를 「사용자가 실제로 두 번 보내는 연구 결과가 있을 때만」 켜고, 서버 쪽도 막으라고 한다 — Carbon forms, GOV.UK button · action=두 번 되면 안 되는 작업 · 제약
- [validate/lock] 채우기 전 버튼 잠금: Carbon은 짧은 폼에서만 허용, 긴 폼은 안 잠근다. Primer는 폼에서 저장 버튼을 잠그거나 숨기지 말라고 하고, GOV.UK는 「대비가 낮고 헷갈린다」며 피하라고 한다 — https://carbondesignsystem.com/patterns/forms-pattern/ · https://primer.style/product/ui-patterns/saving/ · https://design-system.service.gov.uk/components/button/ · skill=처음 쓴다일수록 avoid · 관례(셋이 일치)

### 비어 있을 때
- [empty/action] 다음 행동이 있으면 주 버튼 하나. 막다른 길을 만들지 않는다. 여러 빈 상태가 한 화면에 있으면 주 버튼 경쟁을 피해 3차 버튼 — Carbon, https://carbondesignsystem.com/patterns/empty-states-pattern/ · 관례
- [empty/illus] 그림은 상황과 관련 있을 때만 장식으로. 자리가 좁거나 여러 개가 겹치면 글만. 오류에는 심각한 톤 — Carbon, Primer, https://primer.style/product/ui-patterns/empty-states/ · 관례
- [empty/text] 제목은 짧고 긍정형(「자료를 추가해 시작」). 이유와 할 일을 적는다. 오류 문구는 「문제가 생겼습니다」 같은 막연한 말을 피하고 구체적으로 — Carbon, Primer · 관례
- [empty/*] 빈 상태 세 가지 종류: 처음(데이터 없음)·사용자 동작 결과(검색 결과 없음)·오류(권한·시스템). 필터 결과 없음과 처음 비어 있음은 문구를 다르게 — Carbon, Shopify(https://shopify.dev/docs/api/app-home/patterns/compositions/empty-state.md) · skill=처음 쓴다에는 시작 안내 · 관례
- [empty × onboarding] 주요 기능은 온보딩과 별개로 기본 빈 상태를 항상 둔다(온보딩은 건너뛸 수 있다) — Carbon · skill · 제약

### 실패했을 때·끝났을 때·새 소식
- [error/inline] 오류는 원인 가까이. 입력칸은 포커스가 떠난 뒤 보인다 — Shopify, https://shopify.dev/docs/apps/design/user-experience/alerts · 관례
- [error/toast] 토스트는 성공 확인용. 오류에는 피하고 연결 끊김 같은 지속 오류만 예외 — Shopify · 제약
- [error/inline vs toast] 토스트는 화면 특정 자리에 속하지 않는 시스템 메시지용. 자동으로 사라지는 건 동작이 없는 토스트뿐이고, 긴급·중요 메시지는 자동 소멸 금지 — Carbon, https://carbondesignsystem.com/patterns/notification-pattern/ · Atlassian, https://atlassian.design/components/flag/usage · 제약
- [error/dialog] 즉시 응답이 필요한 중대한 메시지만 모달. 사용자 동작의 결과가 아닌 시스템 알림은 모달 대신 토스트 — Carbon, https://carbondesignsystem.com/patterns/dialog-pattern/ · Atlassian · 제약
- [error/full] 서비스 전체 문제는 전용 페이지(문제 있음·점검·페이지 없음 페이지가 따로 있다) — GOV.UK, https://design-system.service.gov.uk/patterns/ · 예시
- [error 요약] 오류가 3개 이상이면 상단 요약(링크로 각 칸에 이동)에 포커스를 준다. 없으면 첫 오류 칸으로 이동 — Primer, https://primer.style/product/ui-patterns/forms/ · GOV.UK는 항상 요약 + 칸별 문구 · 관례
- [done/toast] 짧은 성공 확인은 토스트. 지연되거나 지속되거나 동작 버튼이 있으면 배너 — Shopify · 제약
- [done/toast 반대] Primer는 github.com에서 토스트를 쓰지 않는다(접근성 문제). 새로고침 없는 변경은 인라인 메시지, 페이지가 바뀌면 배너 — Primer saving · 예시 · skill=처음 쓴다(스크린리더 사용자 포함)에는 토스트 약함
- [done/screen] 한 줄로 이어지는 신청·등록 흐름은 알림 배너 대신 확인 페이지. 성공 배너는 다음 페이지로 가면 지운다 — GOV.UK, https://design-system.service.gov.uk/components/notification-banner/ · 제약
- [done/undo] 위험한 변경은 저장 뒤 되돌릴 방법을 준다 — Primer saving · action=되돌릴 수 있는 작업 · 예시
- [notify/banner] 시스템·전체 화면 안내는 상단 배너. 심각한 것(데이터·기능 손실)만 빨강 배너로. 정보 배너는 항상 닫을 수 있게. 화면당 하나, 자주 쓰지 않는다 — Shopify, Atlassian, GOV.UK · 제약
- [notify/modal] 즉시 조치가 필요한 중대한 경우에만 — Atlassian · 제약
- [notify/조치 알림] 한 번에 조치 하나, 라벨 두 단어 이하, 포커스를 가져가므로 아껴 쓴다 — Carbon · 제약

### 삭제·확인
- [delete/confirm] 파괴적·되돌릴 수 없는 동작은 위험 모달로 결과를 설명하고 확인. 제목과 주 버튼에 「삭제」처럼 동작 이름을 쓰고(「확인」「OK」 금지), 취소는 왼쪽·주 버튼은 오른쪽 — Carbon dialog · action=되돌릴 수 없는 작업 · 제약
- [delete/confirm] 폼에서 저장 오류 시 입력값은 지우지 말고 남긴다. 파괴적 제출은 확인 — Primer saving · 제약
- [confirmForm/dialog vs screen] 모달 안 모달 금지. 내용이 많거나 복잡하면 모달 대신 전체 화면/페이지 — Carbon dialog · 제약
- [delete/undo] 삭제 후 되돌리기 쪽은 이 5개 시스템에서 명시된 기준 못 찾음(Polaris 쪽은 문서를 못 읽음)

### 입력 확인 시점·여러 단계
- [validate/submit] 칸을 벗어날 때 검증하지 말고 계속/제출을 누를 때까지 기다린다(느린 입력자 방해) — GOV.UK, https://design-system.service.gov.uk/patterns/validation/ · skill=처음 쓴다/일반 시민 · 제약(단 문자 수 센기 같은 예외는 연구가 뒷받침될 때)
- [validate/submit→live] 기본은 제출 때, 실패한 뒤에는 인라인으로 바꾼다. 맞는 칸은 바꾸고 벗어난 뒤에만, 이미 틀린 칸은 입력 중에 풀린다 — Primer forms · 관례
- [validate/blur] 칸을 벗어날 때 인라인 검증을 권한다 — Carbon forms · 예시 (GOV.UK와 반대: 시스템마다 갈린다)
- [steps/wizard] 기본은 한 화면에 질문 하나. 묶는 건 연구로 확인됐을 때, 예컨대 반복 업무를 빠르게 하는 내부 전문가용 — GOV.UK, https://design-system.service.gov.uk/patterns/question-pages/ · skill=처음 쓴다↔매일 · 제약
- [steps 진행 표시] 진행 표시줄은 먼저 질문 순서·수를 고친 뒤에 추가한다 — GOV.UK · 예시

### 목록·온보딩
- [more/pages] 한 페이지에 다 담으면 느리고 대부분 앞쪽만 볼 때. 한 페이지 분량이면 숨긴다. 선형 폼에는 쓰지 않는다 — GOV.UK pagination, https://design-system.service.gov.uk/components/pagination/ · Carbon · 제약
- [more/infinite avoid] 무한 스크롤은 키보드 사용자에게 문제 — GOV.UK · 제약. 「더보기 버튼」 기준은 못 찾음
- [onboarding/coach] 새 기능을 바로 쓸 수 있을 때 말풍선(teaching bubble)은 한 번에 하나. 상단 배너는 핵심 기능 변경, 인라인 배너는 설정 등 단계가 있는 화면, 빈 상태는 작업 시작 때 발견되는 기능 — Primer, https://primer.style/product/ui-patterns/feature-onboarding/ · skill · 제약
- [onboarding 한도] 안내는 동시에 2개까지, 닫기 쉽게, 최대 기간·노출 횟수를 정한다 — Primer · 예시
- [onboarding/none] 새 기능 라벨(lifecycle label)처럼 흐름을 끊지 않는 약한 표시도 있다 — Primer · skill=매일에 적합 · 예시

### 저장·상태
- [toggle/switch] 토글·세그먼트·단일 선택은 바로 저장, 텍스트·체크박스 그룹·라디오는 저장 버튼. 한 폼에 둘을 섞지 않는다. 저장 상태는 검증 표시로 오해되지 않게 — Primer saving, https://primer.style/product/ui-patterns/saving/ · 관례
- [popover/modal] 모달은 사용자가 답해야 다음 일이 가능할 때, 비모달은 선택적 작업(찾아 바꾸기 등) — Carbon dialog · 제약

## 숫자 기준
- 로딩 시간: Primer 1초 미만 표시 없음 / 1~3초 비확정 / 3~10초 확정 가능하면 확정 / 10초 초과 확정 + 백그라운드. 이건 skill이 아니라 action(작업 길이)에 걸린다. Carbon은 「몇 초」「몇 분」만 있고 숫자 없음
- 토스트 표시 시간: Shopify·Carbon·Atlassian 모두 초 값 없음. 못 찾음
- 알림 라벨 두 단어 이하(Carbon), 동시 안내 2개 이하(Primer), 대시보드 안내 문구 약 160자(Primer)
- 터치 영역·버튼 높이: GOV.UK 버튼 페이지에 수치 없음. 다른 4개는 이 조사에서 확인 안 함

## 우리 카탈로그에 없는 패턴·방식 후보
- 오류 요약(error summary): 상단에 오류 목록 + 포커스 이동. error 방식 후보 `summary` (GOV.UK, Primer)
- 확인 페이지(confirmation page)와 「제출 전 답 확인(check answers)」: done/screen 및 steps와 가까움. 별도 방식 후보 (GOV.UK)
- 저장 방식(explicit/auto): 「저장」 패턴 신설 후보. 토글은 즉시 저장, 폼은 버튼 저장 (Primer)
- 저하된 경험(degraded experience): 보조 서비스가 죽어도 핵심 기능 유지 (Primer)
- 점진적 공개(progressive disclosure): longText/expand를 넘는 일반 패턴 (Primer)
- 새로고침 없는 변경용 InlineMessage vs 배너: done/error의 방식 후보 `inlineMessage` (Primer)
- 시스템 오류 전용 페이지(점검·문제 있음): error/full의 하위 구분 (GOV.UK)
- 위험 모달 변형(danger): delete/confirm의 하위 구분 (Carbon)
- 빠른 나가기(exit a page quickly): 민감한 화면용 (GOV.UK) — 우리 용도엔 멀다

## 가져올 것 / 안 가져올 것
- 가져올 것(제약으로 올릴 만한 것)
  - Carbon 로딩: 스켈레톤은 틀 있는 컨테이너·데이터 컴포넌트, 몇 초 이내. 버튼·모달에는 안 씀
  - Primer 시간 구간 표: loading/progress의 fits에 「3초 이상 또는 추정 가능」으로
  - 토스트: 오류에는 피한다(Shopify), 자동 소멸은 중요 메시지에 금지(Carbon·Atlassian), 스크린리더 문제(Primer). 이 셋은 skill=처음 쓴다·접근성 조건 가중에 쓰기 좋다
  - validate/lock: 세 시스템이 낮게 본다. avoid 근거로 강하게 쓸 수 있다. 예외는 Carbon의 「짧은 폼」
  - delete/confirm: 동작 이름 버튼, 결과 설명(Carbon). action=되돌릴 수 없는 작업에 걸기
- 갈리는 것은 한쪽으로 단정하지 않고 둘 다 출처와 함께 적는다: validate의 blur(Carbon) vs submit(GOV.UK, Primer 기본)
- 안 가져올 것
  - GOV.UK의 「한 질문 한 화면」: 일반 시민 서비스용이라 매일 쓰는 전문가(skill=매일)에는 그대로 적용하지 않는다. 그 점이 GOV.UK 자신의 예외 조건이기도 하다
  - 그들의 시각 규격(색·글꼴·왕관 로고 등): 이용 조건 미확인 이므로 이미지·아이콘·글꼴은 가져오지 않고 링크만 건다
  - 이 5개에서 우리 skill 축(처음/가끔/매일)을 직접 쓰는 문서는 없다. 가장 가까운 것은 GOV.UK의 「연구 결과가 있을 때」 조건과 Primer 온보딩 노출 한도다. 축과의 연결은 우리의 해석(관례 수준)임을 표시한다

## 못 찾은 것
- Polaris 옛 패턴 문서(삭제 확인, 오류 메시지), Atlassian 메시지 선택 페이지, Primer 알림 중 토스트 문서, 5개 모두의 문서 글·아이콘·폰트 라이선스(GOV.UK 글 OGL 제외), Atlassian의 MCP·llms.txt 근거, 모든 시스템의 토스트 표시 시간
- 페이지 안에 AI에게 하는 지시처럼 보이는 글은 없었다
