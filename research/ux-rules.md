# UX 규칙을 어떻게 잡나 — 공통 틀과 회사·디자인 시스템

확인: 2026-11-11. 서브에이전트 둘이 공개 문서를 읽었다. 하나는 공통 틀(NN/g, GOV.UK, KRDS, Baymard, WCAG·APG, ISO 9241-110)을, 하나는 회사·디자인 시스템(Apple, Material, Carbon, Polaris, Atlassian, Fluent, Primer, 토스, 당근, 린트·AI 규칙)을 봤다. 문장은 옮기지 않고 생각만 적는다.

표시: 따로 적지 않은 것은 원문을 열어 확인했다. 「간접」은 검색 요약이나 기사로만 봤다. 「추론」은 이어 붙인 해석이다.

## 왜 봤나

design-agent에 화면 값(색·글자·여백) 말고 UX 확인 목록을 넣으려 했다. 계기는 직접 만든 내부 도구 화면 비교(2026-11-11)에서 확인 창이 위험 버튼에 첫 초점을 두고 열리는 것을 스킬도 사람 리뷰도 못 본 일이다. 넣기 전에 다른 곳은 규칙을 어떤 모양으로 쓰고, 어떻게 등급을 매기고, 어떻게 지키게 하는지 봤다.

## 규칙 하나가 가진 칸

- **규칙 문장**: 명령형 한 문장. Baymard 「Use …」, KRDS 「~해야 한다」, WCAG는 시험할 수 있는 문장
- **수준**: 규칙에 고정으로 붙는다
  - KRDS 서비스 패턴: 필수(못 지키면 과업이 실패하고 사용자가 스스로 못 푼다) · 권장(어려워지지만 실패하지는 않는다) · 우수(불편하다). 위 수준을 지켰다고 아래 수준이 저절로 채워지지 않는다. https://www.krds.go.kr/html/site/utility/utility_07.html
  - WCAG A/AA/AAA, Built for Shopify는 must, 앱인토스는 반드시·권장·지양, Vercel은 Never/Prefer
  - Apple·Carbon은 등급 없이 명령문만 쓴다. NN/g 휴리스틱과 KRDS 디자인 원칙도 등급 없는 원칙형이다
- **언제 쓰고 언제 안 쓰나**: GOV.UK Design System의 고정 제목(When to use / When not to use / How it works / Research), Primer·Carbon도 같은 갈래
- **근거**: GOV.UK 「Why it's important」와 「Research」, KRDS 「이 원칙이 중요한 이유」, Baymard Research Findings
- **점검 방법**: KRDS 세부 준수 기준의 「점검 화면/요소 · 점검 절차/방법 · 미준수 사례」
- **좋은 예와 나쁜 예**: 실제 화면이나 실제 문장 한 쌍(Atlassian, KRDS, Baymard)
- **예외**: Apple은 사용자가 일부러 고른 동작의 확인에는 빨간 파괴 스타일을 쓰지 않는다. Primer는 되돌리기 쉽거나 자주 하는 동작에는 확인 창을 띄우지 않는다(확인 피로)

## 발견(리뷰 결과) 하나에 적는 칸과 심각도

- 칸: 어긴 규칙, 어디서(화면·요소), 무슨 문제, 판정, 심각도, 권고. 평가지 머리에는 평가자·날짜·과업·사용자군·기기(NN/g)
- **규칙 수준과 발견 심각도를 따로 둔다.** 수준은 규칙에 고정, 심각도는 그 화면에서 얼마나 아픈지를 매번 매긴다
  - NN/g 0~4(문제 아님 · 겉모양 · 작음 · 큼 · 재앙=출시 전 반드시). 기준은 빈도, 넘기 어려움, 계속 겪나, 시장 영향. 한 사람 점수는 믿지 않고 따로 매긴 세 사람의 평균을 쓴다. 평가자는 3~5명, 각자 따로 두 번 훑는다. https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/
  - Baymard: 심각도 3단계(잠깐 끊김 · 멈춰서 풀어야 함 · 과업 포기) × 빈도 5단계로 중요도를 정해 둔다. 사이트마다 지킴·어김을 높음·낮음으로 다시 매긴다. https://baymard.com/research/methodology
  - GOV.UK 서비스 평가: Green(통과) · Amber(치명적이지 않음, 대개 3개월 안에 고침) · Red(다음 단계로 못 감). https://www.gov.uk/service-manual/service-assessments/how-service-assessments-work
  - KRDS 자체 검증: 준수 · 미준수 · 해당 없음. 점수는 없다. https://www.krds.go.kr/html/site/outline/outline_04.html
  - Carbon-Monitor(AI PR 리뷰): blocking · major · minor · nit. MCP로 확인되지 않은 지적은 버린다. https://github.com/carbon-design-system/Carbon-Monitor
- 공통 기준은 셋이다: 과업을 못 끝내나, 얼마나 자주·많이 겪나, 되돌릴 수 있나(WCAG 3.3.4는 법적·금전·데이터 작업에만 더 센 요구를 건다)

## 지킬 만큼 짧게 하는 법

- 원칙은 3~8개(Fluent 4, Microsoft 포용 3, Atlassian 보이스 6, 토스 라이팅 8, KRDS 7)
- 토스는 4개로 시작해 잘 안 지켜지는 원칙을 빼고 새 원칙을 더해 왔다. 원칙은 방향을 잡고, 맞고 틀림은 가이드라인이 판정한다는 구분을 둔다. https://toss.tech/article/8-writing-principles-of-toss (2022-11-15)
- 규칙을 쓰이는 곳에 넣는다: 컴포넌트 문서, 린트 규칙, 컴포넌트 기본값(Primer ConfirmationDialog는 danger면 처음 초점이 저절로 취소)
- 판단이 필요한 규칙과 기계로 셀 수 있는 규칙을 나눈다. 당근 SEED의 Doctor 스킬은 수치 기준이 없거나 실행 중 데이터에 기대는 항목을 위반이 아니라 「알 수 없음」으로 보고한다. https://seed-design.io/llms/ai-integration/skill/doctor.txt
- 긴 목록은 섹션으로 묶는다(Primer 디자이너 체크리스트 29개를 8섹션, Vercel 약 130개를 8섹션)

## 이번 확인 목록 항목마다 누가 말하나

1. **위험한 확인 창의 첫 초점과 버튼 순서**
   - 첫 초점은 가장 덜 파괴적인 동작에: WAI-ARIA APG 모달 대화상자, Carbon 모달 접근성, Primer ConfirmationDialog. NN/g 확인 창 글은 기본값을 「예」로 두지 말라고 한다. Apple은 기본 버튼을 아예 두지 않는 편을 권한다
   - 순서는 갈린다: Carbon·Apple은 취소가 앞(왼쪽), 확정이 뒤(오른쪽). Material 3도 닫는 버튼을 확정 버튼 오른쪽에 두지 말라고 한다(간접). GOV.UK는 주 동작을 먼저 왼쪽에 둔다
   - 토스(앱인토스)는 왼쪽 버튼 이름을 「취소」가 아니라 「닫기」로 쓴다. 하던 일이 취소된다고 오해하지 않게
2. **가장 눈에 띄는 버튼이 위험한 동작**
   - GOV.UK: 경고 버튼은 되돌리기 어려운 동작의 마지막 확인에만, 첫 동작은 일반 버튼으로. 빨강에만 기대지 말고 글로 결과를 말한다. 주 버튼은 한 페이지에 하나
   - 확인 창 안에서는 확정 버튼을 빨갛게 강조하는 곳이 많다(Carbon, Primer, Shopify, SEED). 강조와 기본 초점은 다르다: 눈에 띄어도 Enter는 안전한 쪽에
   - 「화면에서 가장 강조된 버튼이 위험하면 안 된다」를 그대로 쓴 출처는 없다(추론)
3. **무엇이 사라지는지 밝히기**: NN/g 확인 창(이름과 결과를 밝혀라, 「정말 하시겠어요?」로는 부족), KRDS 모달(기능·결과·위험을 반드시 설명), Primer·Shopify(되돌릴 수 없다는 사실을 작은 글씨에 묻지 마라), Atlassian(되돌릴 수 있는지 밝혀라), Fluent(결과가 큰 정보부터). 양(몇 개)까지 밝히라는 곳은 없다
4. **키보드: 탭 순서, 닫은 뒤 초점 복귀, Esc**: WCAG 2.1.1·2.1.2·2.4.3·2.4.7·2.4.11, APG(안에서 돌고 Esc로 닫고 연 요소로 돌아간다. 연 요소가 사라졌으면 흐름에 맞는 곳으로), Carbon·Primer(항목을 지운 뒤에는 이웃 항목으로 초점), KRDS 모달
   - Esc는 갈린다: Primer·Carbon은 닫힌다. Fluent의 alert 대화상자와 KRDS 승인형 모달은 닫히지 않는다
5. **마우스 올림 설명(title·툴팁)에만 있는 정보**: WCAG 1.4.13, NN/g 툴팁 글(과업에 필요한 정보는 화면에), Primer 툴팁·디자이너 체크리스트, Vercel(툴팁은 마지막 수단)
6. **첫 화면에 지금 상태와 다음 할 일**: NN/g 1번 휴리스틱(시스템 상태 보이기), KRDS 신청 패턴 [필수] 처리 절차와 현재 상태 제공, Built for Shopify 4.2.3(첫 화면에 잘 돌고 있는지), 앱인토스(들어오면 본 목적 화면 먼저). 「다음 할 일」까지 한 문장으로 묶은 규칙은 없다(추론)
7. **상태에 따라 강조가 바뀌나**: 직접 다룬 출처는 찾지 못했다. 가까운 것은 Built for Shopify 4.2.5(가장 그럴듯한 버튼을 강조), Carbon(잠시 막힌 것은 비활성으로 보이고 풀 방법을 알린다)
8. **핵심 요약을 어디에**: 「가장 중요한 것을 앞에」(Fluent, Microsoft 글쓰기 Top 10, 토스 「핵심 메시지 집중」), KRDS 신청 [권장] 핵심 정보 요약. 화면 안 위치까지 정한 것은 GOV.UK 오류 요약(본문 맨 위)뿐
9. **같은 상태 글의 반복**: 토스 「화면 속 잡초 제거」, Shopify(같은 내용을 한 페이지에 두 번 보이지 않는다), Atlassian·Fluent(본문에서 제목을 되풀이하지 않는다)
10. **누른 뒤 알림**: NN/g(동작이 받아들여졌는지 보여라), Carbon(작업한 영역에 바로), Primer(페이지가 그대로면 인라인 메시지, 접근성 때문에 토스트는 피한다), GOV.UK 완료 페이지(끝났다는 것, 다음에 무슨 일이), WCAG 4.1.3
11. **그 자리에서 오류 고치기**: NN/g 오류 메시지 글, GOV.UK(필드 옆, 입력값 보존), Carbon(모달을 닫지 않고 인라인), Built for Shopify 4.2.4(계속 보이게, 사라지는 토스트 금지), WCAG 3.3.1·3.3.3
12. **한 화면 안의 말투**: Shopify(보이스는 같게, 한 동작에 한 단어), 토스(해요체 필수), NN/g 일관성 글. 보이스(늘 같음)와 톤(상황에 따라 바뀜)을 나눈다(Atlassian, Shopify)
13. **동작 이름으로 된 버튼**: 가장 널리 일치한다. Apple, Carbon, Shopify, Primer, Atlassian, Fluent, 토스, GOV.UK, KRDS 모두 「삭제」「보내기」처럼 동작 이름을 쓰고 「예/아니요」「확인」을 피한다. Apple은 알리기만 하는 경고창에서 「확인」을 허용한다

## 지키게 하는 방법

- 사람 검수와 번호 붙은 요구사항: Built for Shopify(must, 거절 사유 예시, 자동 검사와 사람 검수), 앱인토스(어기면 검수 불통과)
- 린트: eslint-plugin-jsx-a11y(no-autofocus, mouse-events-have-key-events 등), Atlassian eslint-plugin-design-system(약 87개, `no-…`·`use-…` 이름), eslint-plugin-primer-react(a11y 규칙 7개)
- Figma 「Check designs」 린터는 하드코딩 값만 보고 UX 동작은 보지 않는다(간접)
- AI 에이전트용: Vercel Web Interface Guidelines(에이전트 스킬·AGENTS.md로 넣는다), Carbon MCP `code_audit`, SEED llms.txt·MCP·Doctor 스킬, DESIGN.md(시각 토큰 위주, alpha)

## 이 저장소에 가져올 것

- UX 확인 항목에도 KRDS 식 수준 정의를 붙인다. 스킬의 「꼭 / 권장 / 확인」이 거의 같은 틀이다: 꼭 = 과업이 실패하거나 되돌릴 수 없는 사고, 권장 = 어려워지지만 끝낼 수는 있다
- 항목마다 「규칙 한 문장 · 언제 안 쓰나(예외) · 눈으로 보는 법 · 근거」를 둔다
- 출처가 갈리는 것(버튼 순서, Esc로 닫기, 확인 창의 빨강)은 한쪽을 정답으로 두지 않고 「서비스 안에서 하나로」를 규칙으로 삼는다
- 출처가 없는 항목(상태에 따른 강조, 반복 문구)은 우리 규칙이라고 밝히고, 가까운 원칙을 근거로 단다
- 검사로 셀 수 없는 항목은 SEED처럼 「알 수 없음·눈으로」로 남기고 위반이라고 하지 않는다

## 못 연 곳

- ISO 9241-110 원문(iso.org 403). 원칙 이름은 위키백과로 봤다
- GOV.UK 글쓰기 규칙 「Use the right tone」(404)
- KRDS 체크리스트 HWP 원문, 기본 패턴 「확인」「오류」「사용자 피드백」(메뉴 링크가 `#`)
- Material 3 다이얼로그 원문(스크립트로 그려 본문을 못 읽음)
- 예전 Polaris 콘텐츠 페이지(shopify.dev로 넘어가 사라짐), Atlassian 파괴 동작 글(404)
- Baymard 가이드라인 본문(유료)
- 우아한형제들·카카오·네이버의 공개 UX 규칙 문서(찾지 못함)
