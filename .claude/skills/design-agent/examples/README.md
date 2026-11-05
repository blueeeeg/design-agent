# 잘 만든 예시

실패 이름(`references/failures.md`)과 검사 스크립트는 틀린 것을 잡는다. 빠진 것은 못 잡는다. 검사를 다 통과해도 화면이 비어 보이거나, 밋밋하거나, 어디서 본 듯할 수 있다. 그래서 손으로 만든 화면 세 개를 기준으로 둔다.

- 만들 때: 구조와 수준을 따라 할 출발점. 브랜드와 내용은 따라 하지 않는다
- 다 만든 뒤: 내 화면을 옆에 놓고 「이것보다 비었나, 밋밋한가, 흔한가」를 묻는 기준

생각은 Stageshow의 gold example(https://benji.org/stageshow)에서 얻었다. 그쪽 화면이나 글은 가져오지 않았다(2026-11-04).

세 화면 모두 파일 하나(`index.html`)이고 밖으로 나가는 요청이 없다. 웹 글꼴·CDN·외부 이미지 없이 한글이 들어간 시스템 서체를 쓰고, 상품 그림은 인라인 SVG로 그렸다. 가게·도서관·회사·상품·회원증 번호는 모두 지어낸 것이다.

## 쓰는 법

1. 만들 화면의 조건과 가장 가까운 예시를 고른다. 플랫폼과 쓰는 빈도가 같은 것이 먼저다
2. 그 예시의 **구조와 수준**을 따른다
   - 구조: 머리·본문·주요 버튼 자리, 상태 화면(비었을 때·불러올 때·실패했을 때)을 몇 개 두었나
   - 수준: 글자 크기 단계, 굵게 쓴 곳, 강조색을 쓴 곳, 회색 단계, 여백 단계, 모서리·그림자 수
3. **브랜드와 내용은 바꾼다.** 색, 서체, 이름, 문구, 데이터, 그림은 내 서비스 것으로 채운다. 예시의 초록·파랑은 그 예시의 브랜드일 뿐이다
4. 다 만들면 예시를 옆에 띄워 놓고 견준다. 내 화면이 더 비었거나(상태 화면이 없다, 정보가 적다), 더 밋밋하거나(제목과 본문 크기 차이가 작다), 더 흔하면(근거 없는 기본값) 고친다

**이름만 바꾼 복사본은 다 된 것이 아니다.** 예시를 거의 그대로 옮기고 가게 이름과 상품만 바꿨다면, 내 서비스의 조건으로 `recommend.mjs`를 다시 돌려 방식을 맞게 골랐는지, 내 데이터에 맞는 상태 화면을 만들었는지부터 다시 본다.

## 1. shop-list: 쇼핑 앱 카테고리 상품 목록

`shop-list/index.html` · 모바일 390px · 가상의 생활용품 가게 「모래알 상점」의 「머그·컵」 분류

**조건**: platform=mobile, skill=occasional, device=personal, content=photo, action=none(찜은 light)

**기본값**(`--design-md`): target-min 44px, font-base 16px, row-height 48px, spacing 16px

**고른 방식**(`recommend.mjs --action none --patterns loading,empty,filter,nav,category,more,noImage`)
- 불러오는 동안: 스켈레톤. 상품 칸과 같은 자리·크기로 그린다. 머리와 분류 칩은 바로 둔다
- 비어 있을 때: 조건 보여 주고 풀기. 상황 「찾기·거르기 결과가 없을 때」의 추천이다. 조건마다 「풀면 상품 6개」를 붙이고, 「조건 모두 풀고 21개 보기」 버튼을 둔다
- 거르기: 칩 필터
- 카테고리 이동: 가로 칩
- 화면 사이 이동: 하단 탭바(5개, 아이콘과 이름)
- 목록이 길 때: 무한 스크롤. 끝에서 다음 묶음 자리를 스켈레톤 두 칸으로 먼저 잡는다
- 사진이 없을 때: 빈 자리 표시. 같은 크기 칸에 아이콘과 「사진 준비 중」
- 찜: 바로 반영(불러오는 동안 › 「내가 바꾼 것이 저장되는 동안」)

한 페이지에 상태 세 개를 위아래로 둔다. 상품이 있을 때, 검색 결과 없음, 불러오는 동안. 상태 사이 회색 띠는 예시를 읽는 사람을 위한 표시라 실제 앱에는 없다.

**무엇을 배울 것**
- 글자 단계 30 / 18 / 16 / 14 / 12. 페이지 제목은 본문의 약 2배이고, 굵게는 제목·가격·할인율에만 쓴다. 상품 이름은 16px 보통 굵기
- 강조색(청록 하나)은 고른 칩, 지금 탭, 할인율, 주요 버튼에만 쓴다. 회색 글자는 초록 쪽으로 아주 조금 기운 세 단계(진하게·보통·흐리게)
- 상품 칸은 테두리·그림자 없이 사진 자리 + 글로만 나눈다. 사진 비율 1:1 하나. 품절은 「품절」 글자 딱지와 흐린 그림, 다시 들어오는 날짜로 알린다(색만으로 알리지 않는다)
- 빈 화면은 「왜 없는지(걸린 조건) → 조건마다 풀면 몇 개인지 → 한 번에 푸는 버튼 → 다른 길」 순서다. 「0개」만 두지 않는다
- 스켈레톤은 실제 칸과 같은 모양(정사각 사진 + 글 줄 3개)이라, 다 불러와도 화면이 튀지 않는다. 움직임 줄이기 설정이면 깜빡임을 끈다

## 2. admin-table: 사내 관리 화면 재고 표

`admin-table/index.html` · 데스크톱 1280px · 가상의 문구 회사 「다락 문구」 관리 화면

**조건**: platform=desktop, skill=daily, device=personal, content=numbers. 작업의 무게는 둘로 갈린다. 숨기기·재고 수 고치기는 light, 영구 삭제는 irreversible

**기본값**(`--design-md`): target-min 24px, font-base 14px, row-height 32px, spacing 12px

**고른 방식**
- `--action none --patterns filter,nav,search,more,statusMark,time,empty,loading`
  - 거르기: 옆 패널. 고르면 바로 표에 반영
  - 화면 사이 이동: 위쪽 메뉴. 왼쪽 사이드바와 점수가 같았는데(둘 다 3), 왼쪽은 필터 패널이 쓰니 메뉴는 위로 올렸다
  - 찾기: 펼친 검색창. 「/」를 누르면 검색창으로 간다
  - 목록이 길 때: 페이지 번호
  - 상태 표시: 점 + 글자. 점은 꾸밈(aria-hidden)이고 뜻은 글자가 전한다
  - 시간 표기: 경과 + 시각(「2일 전 · 11-02」, 마우스를 올리면 전체 시각)
  - 비어 있을 때: 문구 한 줄. 찾기·필터 결과가 없으면 표 안 한 줄에 사실과 「검색어와 필터 풀기」
  - 불러오는 동안: 스켈레톤이 추천이지만 이 예시에는 그리지 않았다. 표를 쓰는 화면이면 행 높이 32px에 맞춘 회색 줄로 더한다
- `--action light --patterns delete,busy,done,popover`
  - 지울 때: 지우고 되돌리기. 이 화면에서는 「숨기기」가 이것이다. 묻지 않고 바로 숨기고, 스낵바에서 되돌린다
  - 끝났다고 알릴 때: 토스트가 1등(6), 되돌리기 스낵바가 2등(3)이다. 되돌리기 버튼이 붙는 알림이라 스낵바를 썼다(디자인 시스템 줄 「되돌리기 같은 행동이 붙으면 스낵바」)
  - 재고 수 고치기: 그 자리에서 고친다. 숫자를 누르면 칸이 입력칸으로 바뀌고 Enter로 저장, Esc로 취소. 저장하면 상태(판매 중·재고 부족·품절)가 바로 다시 계산된다
- `--action irreversible --patterns delete,confirmForm,busy`
  - 지울 때: 먼저 묻는다. 확인 단계 모양은 대화상자이고, 지울 상품 이름을 나열하고 「판매만 멈추려면 숨기기」로 다른 길을 알린다. 처음 포커스는 「취소」에 둔다
  - 버튼을 누른 뒤: 「삭제하는 중…」으로 바꾸고 잠근다(disabled, aria-busy)

**무엇을 배울 것**
- 글자 단계 28 / 18 / 16 / 14 / 12. 본문 14px, 행 높이 32px. 굵게는 페이지 제목, 상태별 개수, 표 머리, 재고가 모자란 숫자에만
- 숫자 열은 모두 오른쪽 정렬, 고정폭 숫자(tabular-nums), 천 단위 쉼표. 단위는 칸마다 쓰지 않고 열 제목에 「(개)」「(원)」로 쓴다
- 상자는 표를 감싼 것 하나뿐이다. 그 안의 도구 줄·표 머리·행·쪽 번호는 선으로만 나눈다(상자 남발 피하기)
- 고른 행은 체크박스 + 옅은 강조색 바탕, 고르면 도구 줄이 「3개 선택됨 · 한꺼번에 할 일」 줄로 바뀐다. 가벼운 일(숨기기)과 되돌릴 수 없는 일(영구 삭제)을 같은 줄에 두되, 위험한 쪽만 빨간 글자로 가른다
- 색은 강조 파랑 하나 + 위험 빨강 하나. 상태 점의 초록·노랑·회색은 꾸밈이라 글자 색은 모두 기본 글자색이다

## 3. kiosk-booking: 도서관 스터디룸 예약 키오스크

`kiosk-booking/index.html` · 태블릿 가로 1280×800 · 가상의 「새솔 도서관」 로비 공용 키오스크

**조건**: platform=tablet, skill=first, device=shared, content=text, 예약은 action=once(두 번 되면 안 된다)

**기본값**(`--design-md`): target-min 48px, font-base 18px, row-height 64px, spacing 24px

**고른 방식**
- `--action none --patterns nav,steps,single,validate,onboarding,statusMark`
  - 화면 사이 이동: 한 화면 + 처음으로. 머리 오른쪽에 「처음으로」를 늘 둔다
  - 하나 고르기: 큰 버튼(방 4개, 시작 시각 8개)
  - 입력 확인 시점: 제출할 때 모아서. 「다음」을 잠그지 않고, 누르면 무엇이 빠졌는지 그 자리에 쓴다
  - 처음 안내: 그 자리 안내 문구(「번호는 회원증 뒷면 바코드 아래에 있어요」)
  - 상태 표시: 칩(「지금 비어 있음」「오후 3시부터 비어요」「오늘 예약 마감」)
- `--action once --patterns busy,done,confirmForm,cta,error,steps,qty`
  - 여러 단계 흐름: 단계 표시줄과 한 화면에 한 질문이 같은 점수라 둘 다 쓴다. 위에 4단계를 보여 주고, 화면마다 질문 하나
  - 확인 단계 모양: 대화상자와 확인 화면이 같은 점수. 단계 흐름의 마지막이라 확인 화면(4단계)으로 했다. 줄마다 「바꾸기」로 그 단계로 돌아간다
  - 주요 버튼 자리: 오른쪽 패널 아래
  - 버튼을 누른 뒤: 문구를 바꾸고 잠근다. 「예약하기」를 누르는 즉시 disabled + aria-busy + 「예약하는 중…」, 스크립트 안에서도 두 번째 누름을 무시한다
  - 끝났다고 알릴 때: 완료 화면. 방·시간·예약 번호를 크게 보이고, 20초 뒤 처음 화면으로 돌아간다
  - 실패했을 때: 전체 화면 + 다시 시도(「다른 시간 고르기」, 「처음으로」). 입력 오류는 그 칸 아래 문구로 남긴다
  - 수량: − + 버튼(이용 시간 1~3시간, 끝값에서 그 버튼을 잠근다)
- 불러오는 동안은 쓰지 않았다. 이 흐름에는 기다릴 일이 예약 한 번뿐이고, 그것은 「버튼을 누른 뒤」로 처리한다

화면 아래 「예시 넘겨 보기」 줄로 각 단계·오류·완료·실패를 바로 볼 수 있다(실제 키오스크에는 없다). 주소 끝에 `#step3-error`, `#done`처럼 붙여도 된다.

**무엇을 배울 것**
- 글자 단계 36 / 28 / 22 / 18 / 16. 본문이 18px라 페이지 제목 36px로 2배다. 누를 곳은 모두 48px 넘게(숫자판 72px, 주요 버튼 72px)
- 오류는 사라지지 않는다. 칸 테두리를 빨갛게 하고 아래에 「무엇이 틀렸고(지금 6자리), 어디서 확인하는지(회원증 뒷면)」를 쓰고, 8자리를 채우면 그때 지운다
- 여럿이 쓰는 기기라 앞사람 흔적을 지운다. 회원증 번호는 확인 화면에서 뒤 4자리를 가리고, 예약이 끝나면 바로 지우고, 1분 동안 손대지 않으면 처음으로 돌아간다. 이것을 화면에 글로도 알린다
- 오른쪽 패널은 단계마다 역할이 있다. 1~3단계는 지금까지 고른 것, 4단계는 왼쪽 확인 목록과 겹치지 않게 「예약 전에 알아 두세요」로 바뀐다. 버튼 아래 한 줄은 다음에 무슨 일이 일어나는지 알린다
- 고른 칸은 테두리 2px 강조색 + 옅은 바탕 + 체크 표시, 마감된 칸은 「마감」 글자와 꺼진 모양. 색만으로 구분하지 않는다

## 검사

저장소 맨 위에서 돌렸다(2026-11-04).

```
node .claude/skills/design-agent/scripts/check-screen.mjs .claude/skills/design-agent/examples/shop-list/index.html --sel platform=mobile,skill=occasional,device=personal,content=photo --action none
node .claude/skills/design-agent/scripts/check-visual.mjs .claude/skills/design-agent/examples/shop-list/index.html --run-scripts --sel platform=mobile,skill=occasional,device=personal,content=photo

node .claude/skills/design-agent/scripts/check-screen.mjs .claude/skills/design-agent/examples/admin-table/index.html --sel platform=desktop,skill=daily,device=personal,content=numbers --action light
node .claude/skills/design-agent/scripts/check-screen.mjs .claude/skills/design-agent/examples/admin-table/index.html --sel platform=desktop,skill=daily,device=personal,content=numbers --action irreversible
node .claude/skills/design-agent/scripts/check-visual.mjs .claude/skills/design-agent/examples/admin-table/index.html --run-scripts --sel platform=desktop,skill=daily,device=personal,content=numbers

node .claude/skills/design-agent/scripts/check-screen.mjs .claude/skills/design-agent/examples/kiosk-booking/index.html --sel platform=tablet,skill=first,device=shared,content=text --action once
node .claude/skills/design-agent/scripts/check-visual.mjs .claude/skills/design-agent/examples/kiosk-booking/index.html --run-scripts --sel platform=tablet,skill=first,device=shared,content=text
```

**결과**
- shop-list: check-screen 「걸린 것 없음」. check-visual은 대비 모두 통과, 크기 5단계(30·18·16·14·12px), 제목이 본문의 2.1배, 여백 8가지, 모서리 2가지(8·4px), 그림자 0가지
- admin-table: check-screen 「걸린 것 없음」(light, irreversible 둘 다). check-visual은 대비 모두 통과, 크기 5단계(28·18·16·14·12px), 제목이 본문의 2.0배, 여백 7가지, 모서리 2가지(4·8px), 그림자 1가지
- kiosk-booking: check-screen 「걸린 것 없음」. check-visual은 대비 모두 통과, 크기 4단계(36·22·18·16px), 제목이 본문의 2.0배, 여백 9가지, 모서리 2가지(12·16px), 그림자 0가지

세 화면 모두 「꼭 고칠 것」「고치기 권함」「확인」 줄이 하나도 남지 않았다.

**한 번에 하나만 보이는 상태도 따로 쟀다.** 검사는 숨긴 것을 재지 않는다. 키오스크는 단계마다, 관리 화면은 삭제 대화상자를 연 상태와 결과 없음 상태를 복사본으로 만들어 같은 두 검사를 돌렸고, 모두 걸린 것이 없다. 이 과정에서 실제로 고친 것: 고른 시간 칸의 「비어 있음」 글자 대비(1.04:1), 숫자판 때문에 굵은 글자가 45%가 된 것, 예약이 끝난 뒤 회원증 번호가 숨은 칸에 남던 것.

**브라우저에서 잰 것**: jsdom은 레이아웃을 계산하지 않으니 `visual-audit.js`를 Chrome에서 한 번 더 돌렸다(390px, 1280px). 가로 넘침, 24px보다 작은 누를 곳, 상자 끝에 붙은 글자를 찾아 고쳤다. 그때 남은 세 줄은 검사의 오탐이라 2026-11-05에 검사를 고쳤다. 지금은 세 화면 모두 실제 Chrome에서도 걸린 것이 없다(조건을 `window.__designCond`로 넣고 잼)
- 화면 읽기 프로그램에만 들리게 1px로 잘라 둔 글(sr-only)을 「잘린 글자」로 셌다 → 1px로 숨긴 글은 뺀다
- 오른쪽 정렬한 숫자 열을 「시작선이 어긋남」으로 셌다 → 오른쪽 정렬 글은 오른쪽 끝을 견준다
- 36px 칩에 `::before`로 위아래 4px씩 누를 영역을 넓힌 것을 「44px보다 작은 누를 곳」으로 셌다 → 가상 요소로 넓힌 만큼 더한다

## 검사가 못 보는 것

검사를 통과했다고 잘 만든 화면은 아니다. 이 예시들을 만들면서 검사 말고 눈으로 고친 것:
- 표의 고정 열 폭이 많아 상품 이름 열이 40px로 줄었다(스크린샷으로만 보인다)
- 「예약 마감」 칩이 다른 곳의 클래스 이름과 겹쳐 커다란 타원이 됐다
- 완료 화면에서 머리의 「처음으로」와 카드 안 「처음으로」가 두 번 나왔다(같은 내용이 두 곳에)
- 실패 화면에 첫 화면으로 가는 길이 없었다(공용 기기에서 막다른 길)
- 한글 낱말 중간에서 줄이 바뀌었다(`word-break: keep-all`)

내 화면도 검사 뒤에 원래 크기 스크린샷을 찍고, 상태마다 눌러 보고, 이 예시 옆에 놓고 본다.
