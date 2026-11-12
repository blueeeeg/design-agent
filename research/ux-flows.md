# 화면을 오가는 흐름의 UX — 로그인, 결제, 뒤로 가기, 새로 고침

확인: 2026-11-11. 서브에이전트 하나가 공개 자료를 읽었다. 사용자가 「로그인을 마친 뒤 뒤로 가기를 하면 로그인 화면이 다시 보이나 같은 것도 UX 아닌가」라고 물어 시작했다. 한 화면이 아니라 화면 사이의 동작이라 지금 검사(HTML 한 장)로는 못 잡고, 실제 브라우저에서 눌러 보거나 코드에서 봐야 한다. 문장은 옮기지 않고 생각만 적는다. 표시가 없는 것은 원문을 열어 확인했고, 「간접」은 검색 요약·2차 자료, 「우리 판단」은 출처가 직접 말하지 않은 것이다.

수준: 꼭(과업을 못 끝내거나, 되돌릴 수 없는 피해·개인정보 피해를 사용자가 피할 수 없다) · 권장(힘들지만 끝낼 수 있다) · 확인(서비스마다 답이 다르다).

## 브라우저로 재는 요령

- jsdom으로는 기록(history), 뒤로·앞으로 캐시(bfcache), 스크롤을 못 잰다. 실제 브라우저가 필요하다
- `history.length`는 그 탭의 앞선 기록까지 세고 50에서 멈춘다. 값보다 누르기 전후 차이를 본다
- 페이지가 열리기 전에 넣는 스크립트로 `history.pushState`·`replaceState`·`addEventListener`를 감싸 호출을 기록하면 더 정확하다
- 부작용 없이 보는 법: 요청을 막거나 느리게(DevTools 요청 차단, Offline), 잘못된 토큰으로 열기, PG 창의 「취소」(승인 전)

## 1. 로그인·로그아웃

- **L1 (권장)** 로그인을 마치면 로그인 화면을 기록에 남기지 않아 뒤로 가기로 다시 나오지 않는다(`replace`). 로그인 모달은 해당 없음. 함정: 아래 L2의 이동을 `push`로 하면 뒤로 → 로그인 → 다시 앞으로가 되풀이되어 갇힌다. 근거: DfE 디자인 기록(끝난 단계로 돌아오면 「이미 끝났다」 화면), MDN replaceState. 로그인에 그대로 적은 1차 출처는 없다(우리 판단)
- **L2 (권장)** 이미 로그인한 사람이 로그인 주소를 열면 가려던 곳이나 홈으로 보낸다. 계정 전환·다시 인증 화면은 예외. 1차 출처 없음(간접: Next.js 미들웨어 예제)
- **L3 (권장, 다시 찾을 길이 없는 초대·한 번 쓰는 링크면 꼭)** 로그인을 마치면 하려던 곳으로 돌려보낸다. 돌아갈 주소는 같은 사이트 경로만 받는다. 로그인 없이 보는 법: 로그아웃 상태로 보호된 주소를 열어 로그인 주소에 `returnTo`·`next`·`redirect`가 실렸는지 본다. 근거: KRDS 로그인 완료(권장), Baymard(34%가 가려던 곳으로 보내지 않음), OWASP 열린 리다이렉트
- **L4 (꼭)** 로그인을 요구할 때 하던 일(담은 것, 쓰던 글, 고른 옵션)을 잃지 않는다. 로그인을 모달로 받거나 비회원 상태를 저장했다 합친다. 로그인 없이 보는 법: 비회원으로 담거나 글을 쓰고 로그인 버튼 → 뒤로·닫기 → 그대로인지. 근거: KRDS 로그인(모달, 「로그인 안 함」), Baymard, WCAG 2.2.5
- **L5 (꼭)** 로그아웃한 뒤 뒤로 가기로 개인 화면이 다시 보이지 않는다. 쿠키 삭제, 개인 화면 `Cache-Control: no-store`, `pageshow`의 `persisted`면 세션 다시 확인, `Clear-Site-Data`, SPA는 메모리·쿼리 캐시 비우기. 근거: web.dev bfcache(돌아온 페이지는 헤더를 다시 보지 않는다), Chrome bfcache와 no-store(인증 상태가 바뀌면 버린다), OWASP 세션 관리
- **L6 (알림·연장은 꼭, 입력 지키기는 권장)** 로그인 시간이 끝나기 전에 알리고 연장하게 하며, 끝나도 다시 로그인한 뒤 입력을 이어 쓰게 한다. 근거: KRDS 세션 만료(필수, 최소 20초 전, 연장·로그아웃 둘 다, 연장 10회 이상), DWP·Home Office(2분 전, Home Office는 간접), WCAG 2.2.1·2.2.5
- **L7 (권장)** 소셜·간편 로그인은 끝나면 시작한 화면으로 돌아오고, 취소하면 시작 화면에서 알린다. 팝업이 막히면 이동 방식으로 잇는다(간접)
- **L8 (권장)** 로그인은 꼭 필요한 순간에만, 얻는 것을 말하고 「로그인 안 함」을 둔다. 근거: KRDS 로그인, 앱인토스 블로그(진입하자마자 로그인 요청 완료율 49.6%, 로그인 직후 알림 동의를 잇지 않는다, 2026-10-15)

## 2. 가입·본인 확인

- **J1 (꼭)** 본인 확인이 실패하거나 취소돼도 앞서 적은 정보는 남긴다(비밀번호 칸은 예외). 근거: WCAG 2.2 3.3.7, Baymard(간접)
- **J2 (권장)** 인증번호 칸은 `type="text"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, 붙여넣기·띄어쓰기 허용. 정적 검사로 셀 수 있다. 근거: web.dev SMS OTP 폼(type=number는 앞자리 0이 빠질 수 있다), GOV.UK 전화번호 확인, KRDS 로그인(붙여넣기 허용, 필수)
- **J3 (권장)** 번호가 안 왔을 때의 길(다시 받기, 번호 고치기)과 유효 시간. 근거: GOV.UK 전화번호·이메일 확인(15분, 「받지 못했나요?」)
- **J4 (권장)** 인증 단계에서 뒤로 가면 앞 단계 값이 보이고, 마친 뒤 뒤로 가면 다시 열지 않고 「이미 확인됨」이나 다음 단계로. 근거: GOV.UK 질문 페이지, DfE, Baymard

## 3. 결제·주문·제출

- **P1 (꼭)** 제출을 처리한 뒤 결과 페이지로 다시 이동시켜(Post/Redirect/Get, SPA는 처리 후 `replace`) 새로 고침·뒤로 가기가 같은 요청을 다시 보내지 않는다. 사람이 보는 법: 완료 화면에서 새로 고침 → 「양식 다시 제출」 창이 뜨면 위반. 근거: GOV.UK 질문 페이지(한 번만 일어나는 일은 뒤로 가기가 되풀이하지 않고 안내를 보인다), PRG(간접)
- **P2 (꼭)** 요청 중에 다시 눌러도 한 번만 처리한다. 요청 중에만 버튼을 막고 진행을 보이며, 서버는 멱등 키로. 미리 비활성으로 두지는 않는다. 부작용 없이 보는 법: 요청을 응답 없이 붙잡은 채 두 번 눌러 요청 수를 센다. 근거: Vercel, GOV.UK 버튼(두 번 보내는 실수가 실제로 있었다)
- **P3 (꼭)** 결제를 마친 뒤 뒤로 가면 결제 화면을 다시 열지 않고 완료·주문 내역이나 「이미 결제됨」으로. 근거: GOV.UK 질문 페이지, DfE, Baymard
- **P4 (꼭)** 결제가 실패하거나 취소되면 주문서로 돌아오고 담은 상품·배송지·쿠폰은 남긴다. 카드 정보는 카드가 거절됐을 때만 지운다. 근거: Baymard(간접, 34%가 오류 뒤 카드 정보를 지운다), WCAG 3.3.7
- **P5 (권장)** 완료 화면은 접수 번호와 다음에 일어날 일을 보이고, 새로 고침·즐겨찾기로 다시 열어도 같다. 근거: GOV.UK 완료 페이지(즐겨찾기를 영수증처럼 쓴다), KRDS 신청 완료(필수: 바로 메인으로 보내지 않는다)
- **P6 (꼭, 취소·수정이 안 되는 제출)** 확인 화면을 두고 「변경」으로 고친 뒤 확인 화면으로 바로 돌아온다. 근거: GOV.UK 답 확인, KRDS 신청(필수)

## 4. 여러 단계 폼

- **F1 (꼭)** 이전 단계로 가면(브라우저 뒤로든 화면의 「이전」이든) 적은 값이 남는다. 근거: GOV.UK 질문 페이지, Baymard, WCAG 3.3.7, Smashing
- **F2 (권장)** 새 화면으로 느끼는 단계마다 기록을 한 칸씩 쌓아 브라우저 뒤로와 화면의 「이전」이 같은 곳으로 간다. 근거: Baymard, Android 내비게이션 원칙, GOV.UK 뒤로 링크, NN/g 사용자 통제
- **F3 (권장)** 나가면 잃는 입력이 있을 때만 떠나기 전에 묻고, 저장됐거나 아무것도 안 적었으면 묻지 않는다. 제출 뒤에는 `beforeunload`를 뗀다. 근거: MDN beforeunload, 호주 정부 디자인 시스템 「떠나기 전 경고」, Primer 저장, 앱인토스 화면 이벤트
- **F4 (권장)** 길거나 나눠 쓰는 신청서는 임시 저장과 마지막 저장 시각, 다시 열면 이어 쓰기. 자동·직접 저장을 한 폼에 섞지 않는다. 근거: KRDS 신청(권장), MOJ 블로그, Primer
- **F5 (꼭, KRDS 필수)** 앞 단계의 답을 바꿔 뒤 단계가 달라지면 알린다. 근거: KRDS 신청서 작성, GOV.UK 답 확인

## 5. 목록·검색·필터

- **S1 (권장, 조건 유지는 KRDS 필수)** 검색어·필터·정렬·페이지·탭을 주소에 담아 새로 고침·공유·뒤로 가기 뒤에도 같다. 근거: Vercel(URL에 상태), KRDS 검색(필수), Baymard
- **S2 (권장)** 상세에서 뒤로 오면 같은 조건과 누른 항목 근처의 스크롤로 돌아온다. 근거: Baymard(13%가 맨 위로 보낸다), Vercel, MDN scrollRestoration, Chrome 블로그
- **S3 (권장)** 무한 스크롤·「더 보기」도 뒤로 오면 불러온 만큼과 위치를 지킨다. 근거: Baymard, NN/g 무한 스크롤
- **S4 (확인)** 필터를 바꿀 때마다 기록에 쌓을지. Baymard는 쌓으라, Smashing은 작은 변화는 쌓지 말라. 입력 중 자동 검색은 `replace`
- **S5 (꼭, KRDS 필수)** 결과 화면의 검색칸에 검색어를 남기고, 결과가 없으면 분명히 말하고 고칠 길을 준다

## 6. 모바일 웹 오버레이

- **O1 (권장)** 페이지처럼 보이는 시트·모달·드로어가 열려 있을 때 뒤로 가기는 그것만 닫는다. 작은 팝오버·툴팁·드롭다운은 기록을 쌓지 않는다. 근거: NN/g 실수로 닫히는 오버레이(2022-09-18), NN/g 사용자 통제, Baymard(37%가 틀렸다), MDN CloseWatcher
- **O2 (권장, 우리 판단)** X로 닫으면 열 때 쌓은 기록도 정리해 다음 뒤로 가기가 한 번에 앞 페이지로 간다
- **O3 (권장)** 오버레이를 겹치지 않고, 겹쳤으면 뒤로 가기 한 번에 맨 위 하나만 닫는다. 근거: NN/g, Apple HIG 모달
- **O4 (권장)** 오버레이 안에 입력이 있으면 닫을 때 잃을 것을 묻는다. 근거: Apple HIG 모달, Smashing, 앱인토스
- **O5 (확인)** 오버레이 상태(퀵뷰 등)를 주소로 열게 할지. 열었다면 닫으면 아래 페이지로
- **O6 (꼭)** 뒤로 가기를 막거나, 다른 것(혜택·알림 동의·광고 시트, 방문한 적 없는 페이지)을 끼워 넣지 않는다. 입력·결제 중 잃을 것을 묻는 창은 괜찮다. 근거: Google 검색 「뒤로 가기 가로채기」 스팸 정책(2026-04-13 발표, 2026-06-15 적용, 광고·라이브러리 탓이어도 사이트 책임), 앱인토스 다크패턴 방지, NN/g

## 7. 알림·링크로 들어오기

- **D1 (권장)** 링크로 상세에 바로 들어와도 화면 안의 「뒤로」는 서비스의 목록이나 홈으로 간다. 앱 안 기록이 있으면 `history.back()`, 없으면 상위 화면으로. 근거: Android 내비게이션 원칙(딥링크도 가상 기록), 당근 Stackflow history-sync(대체 화면). 웹에 적은 1차 출처는 없다
- **D2 (권장)** 알림을 누르면 그 항목에 바로 닿고, 로그인이 필요하면 로그인 뒤 그 항목으로
- **D3 (권장)** 만료됐거나 이미 쓴 링크는 이유를 말하고 다음 길(새 링크, 내역, 문의)을 준다. 근거: GOV.UK 이메일 확인·404 페이지

## 8. 여러 탭·창

- **T1 (권장)** 한 탭에서 로그아웃하면 다른 탭도 늦어도 다음 동작 때 반영하고, 그 탭의 입력은 다시 로그인한 뒤 이어 쓴다. 근거: MDN BroadcastChannel, OWASP
- **T2 (확인, 함께 고치는 데이터가 있을 때)** 나중 저장이 앞 저장을 말없이 덮지 않게 알리고 내 입력을 남긴 채 고르게 한다. 근거: MediaWiki 편집 충돌
- **T3 (권장)** 화면 이동은 `<a href>`로(새 탭 열기). 검사 「링크가 아닌 이동」. 근거: Vercel

## 9. 오프라인·느린 네트워크

- **N1 (꼭)** 보내기·저장에 실패하면 적은 내용을 지우지 않고, 무엇이 저장되지 않았는지 말하고, 다시 시도할 길을 준다. 낙관적 업데이트는 되돌리고 알린다. 근거: Primer 저장, Vercel, web.dev 오프라인 UX
- **N2 (확인)** 연결이 끊기면 알리고, 끊긴 동안 할 수 있는 것과 연결되면 보낼 것을 보인다

## 10. 새로 고침

- **R1 (권장)** 탭·필터·정렬·페이지처럼 「보고 있는 상태」는 새로 고침해도 남는다
- **R2 (꼭)** 새로 고침이 결제·전송·토글을 되풀이하지 않는다(P1)
- **R3 (권장, 우리 판단)** 한 번만 보일 안내(저장됐어요, 방금 지운 것의 되돌리기)는 새로 고침 뒤 다시 나오지 않는다

## 우리 9갈래에 나누면

- 길과 뒤로 가기: L1, L2, L3, J4, P3, F2, S1~S4, O1~O3, O5, D1, D2, T3, R1
- 사고 위험: L5, P1·R2, P2, P6, T2
- 누른 뒤: N1, N2, P5, D3, R3
- 적기: L4, L6의 입력 지키기, J1~J3, P4, F1, F3~F5, O4
- 끼어들지 않기: L8, F3의 「입력이 없으면 묻지 않기」
- 속이지 않기: O6
- 누구나: L6(WCAG 2.2.1·2.2.5), F1·J1(WCAG 3.3.7), J2, P2(손 떨림으로 두 번 누름)
- 할 일이 보이나: S5
- 말: D3, J3

AI가 만든 화면에서 값어치가 큰 것: O1·O2(시트를 뒤로 가기로 닫기. 상태값으로만 만들어 페이지를 나가 버리기 쉽다), S1·R1(필터를 `useState`에만 둔다), S2·S3, P1·P2, F1·J1·P4·N1(입력을 잃지 않기), L3·L4, D1(`router.back()`만 쓰면 빈 화면이나 사이트 밖), L5. 다음은 O6, T3.

## 출처 (모두 2026-11-11)

- KRDS: 로그인 개요 https://www.krds.go.kr/html/site/service/service_03_01.html , 로그인 완료 https://www.krds.go.kr/html/site/service/service_03_06.html , 세션 만료 https://www.krds.go.kr/html/site/service/service_03_07.html , 신청 개요 https://www.krds.go.kr/html/site/service/service_04_01.html , 신청서 작성 https://www.krds.go.kr/html/site/service/service_04_05.html , 신청 완료 https://www.krds.go.kr/html/site/service/service_04_07.html , 검색 https://www.krds.go.kr/html/site/service/service_02_01.html
- GOV.UK: 뒤로 링크 https://design-system.service.gov.uk/components/back-link/ , 질문 페이지 https://design-system.service.gov.uk/patterns/question-pages/ , 답 확인 https://design-system.service.gov.uk/patterns/check-answers/ , 완료 페이지 https://design-system.service.gov.uk/patterns/confirmation-pages/ , 버튼 https://design-system.service.gov.uk/components/button/ , 전화번호 확인 https://design-system.service.gov.uk/patterns/confirm-a-phone-number/ , 이메일 확인 https://design-system.service.gov.uk/patterns/confirm-an-email-address/ , 404 https://design-system.service.gov.uk/patterns/page-not-found-pages/
- 영국·호주 정부 기타: DfE 끝난 뒤 뒤로 가기 https://design-histories.education.gov.uk/dfe-identity-account/returning-after-completion-using-back-button (2022-09-07), DWP 세션 만료 https://design-system.dwp.gov.uk/patterns/manage-a-session-timeout , MOJ 나중에 이어 쓰기 https://mojdigital.blog.gov.uk/2023/10/26/balancing-security-and-usability-to-add-save-for-later-to-moj-forms/ , 호주 떠나기 전 경고 https://design-system.agriculture.gov.au/patterns/warn-before-leaving , Home Office 시간 만료(간접) https://design.homeoffice.gov.uk/design-system/patterns/help-users-to/manage-service-timing-out
- NN/g: 실수로 닫히는 오버레이 https://www.nngroup.com/articles/accidental-overlay-dismissal/ , 사용자 통제 https://www.nngroup.com/articles/user-control-and-freedom/ , 무한 스크롤 https://www.nngroup.com/articles/infinite-scrolling-tips/ , 로그인 벽(간접) https://www.nngroup.com/articles/login-walls/
- Baymard: 뒤로 가기 기대 https://baymard.com/blog/back-button-expectations , 로그인 흐름 https://baymard.com/blog/account-sign-in-flows , 같은 자리로 돌아오기 https://baymard.com/research-articles/return-same-place , 카드 정보 유지·거절(간접) https://baymard.com/blog/preserve-card-details-on-error
- Smashing 뒤로 가기 UX https://www.smashingmagazine.com/2022/08/designing-better-back-button-ux/
- 웹 문서: web.dev bfcache https://web.dev/articles/bfcache , Chrome bfcache와 no-store https://developer.chrome.com/docs/web-platform/bfcache-ccns , 스크롤 복원 https://developer.chrome.com/blog/history-api-scroll-restoration , SMS OTP https://web.dev/articles/sms-otp-form , 오프라인 UX https://web.dev/articles/offline-ux-design-guidelines , MDN scrollRestoration https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration , replaceState https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState , beforeunload https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event , CloseWatcher https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher , BroadcastChannel https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API , Vercel https://vercel.com/design/guidelines , Primer 저장 https://primer.style/product/ui-patterns/saving/
- 플랫폼: Android 내비게이션 원칙 https://developer.android.com/guide/navigation/principles , Apple HIG 모달(JSON판) https://developer.apple.com/tutorials/data/design/human-interface-guidelines/modality.json
- 보안·접근성: OWASP 세션 관리 https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html , OWASP 리다이렉트 https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html , WCAG 다시 인증 https://www.w3.org/WAI/WCAG22/Understanding/re-authenticating.html , WCAG 반복 입력 https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- 국내: 앱인토스 소비자 UX 가이드 https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.html , 화면 이벤트 https://developers-apps-in-toss.toss.im/documentation/common/screen/event , 로그인·알림 시점 블로그 https://toss.im/apps-in-toss/blog/mini-app-login-notification-timing (2026-10-15), 당근 Stackflow 소개 https://yozm.wishket.com/magazine/detail/2395/ , history-sync https://12809f49-stackflow-docs.karrot.workers.dev/docs/advanced/history-sync
- 기타: Google 뒤로 가기 가로채기 https://developers.google.com/search/blog/2026/04/back-button-hijacking , MediaWiki 편집 충돌 https://www.mediawiki.org/wiki/Help:Edit_conflict , Post/Redirect/Get(간접) https://en.wikipedia.org/wiki/Post/Redirect/Get

## 못 연 곳

Apple HIG Navigation, web.dev 스크롤 복원 원문(404, Chrome 블로그판으로 대신), 앱인토스 뒤로 가기 문서(404), KRDS 「방문」「정책 정보 확인」, GOV.UK 뒤로 가기 전용 지침(없음), Baymard 카드 정보 글 원문, NN/g 로그인 벽, Material 3 바텀시트, 토스·배민 기술블로그의 뒤로 가기 글(찾지 못함). L1·L2는 1차 출처를 찾지 못했다.
