// AMI 교회 페이지 전용 기능
(function() {
    'use strict';

    /* ========================================
       1. 페이지 설정 - 각 메뉴와 HTML 파일 매핑
       ======================================== */
    const pageFiles = {
        greeting: 'pages/greeting.html',
        intro: 'pages/intro.html',
        schedule: 'pages/schedule.html',
        location: 'pages/location.html'
    };

    /* ========================================
       2. 타임라인 데이터 및 생성 함수 (intro.html용)
       ======================================== */

    const timelineData = [
        { year: '2026', date: '03.15', title: "", bold: false, label:"(임직자)", content: '일본 선교사 임명과 파송 : 김미경 선교사, 김효선 간사 ' },
        { year: '2025', date: '10.25', title: "", bold: false, label:"(임직자)", content: '장로 : 서봉남, 안경덕<br>안수집사 : 최세현<br>권사 : 김미영, 김선정, 김진, 서선숙, 손영희, 유보라, 이진이, 정찬숙, 최경영 ' },
        { year: '', date: '04.30', title: "", bold: false, label:"(임직자)", content: '목사 안수 : 김재욱 선교사(중동 AMI 디렉터) ' },
        { year: '2023', date: '11.05', title: "", bold: false, label:"(임직자)", content: '명예장로 : 최갑순' },
        { year: '', date: '10.22', title: "", bold: false, label:"(임직자)", content: '장로 : 양웅식, 이소엽, 이현철, 진일남<br>안수집사 : 고광백, 권병우, 김태우, 유상선, 유중만, 윤영현, 이용석, 한승표' },
        { year: '2022', date: '10.09', title: "", bold: false, label:"(임직자)", content: '장로 : 정영학, 황희' },
        { year: '2021', date: '10.10', title: "", bold: false, label:"(임직자)", content: '안수집사 : 이현철, 정영학, 정정효<br>권사 : 박보라, 박혜숙, 서필란, 서유진, 이경순, 이경희, 이영숙, 이원영, 이재유, 장남숙, 정선심, 정향숙' },
        { year: '2018', date: '04.15', title: "", bold: false, label:"(임직자)", content: '장로 : 김관동, 김재기, 박병록, 최병수<br>재임명 장로 : 정진용<br>권사 : 김경숙, 김경옥, 김향란, 김향심, 박수진, 서복식, 서혜숙, 송인숙, 이영숙, 이정은, 이지연, 정호숙, 조상미, 최덕순, 최장미, 최정원<br>재임명 권사 : 김선옥, 김영기, 박은숙, 이준자<br>안수집사 : 공병호, 김학용, 안경덕, 염근열<br>재임명 안수집사 : 홍성동' },
        { year: '2016', date: '10.02', title: "", bold: false, label:"(임직자)", content: '권사 : 강정화, 김명옥, 김학선, 남춘옥, 이지현, 지미경<br>재임명 권사 : 김송월, 백덕선, 성기향, 이정희, 최윤경<br>안수집사 : 김관동, 김재기, 이상목, 정두원, 최병수<br>재임명 안수집사 : 이동갑, 이동휘, 이소엽' },
        { year: '2014', date: '10.12', title: "", bold: false, label:"(임직자)", content: '권사 : 김은경, 임진정<br>재임명 권사 : 박정희, 임동순' },
        { year: '2013', date: '10.20', title: "", bold: false, label:"(임직자)", content: '장로 : 권순일, 이용관<br>권사 : 원명희, 임현심, 정영희<br>재임명 권사 : 김선희, 김은희, 이재경, 이현미<br>안수집사 : 박병록, 박종걸, 최상원, 최영래, 표성대, 허성술' },
        { year: '2012', date: '10.07', title: "", bold: false, label:"(임직자)", content: '명예장로 : 박관서, 이영재<br>장로 : 김국환, 김대현, 김문태, 이광숙, 이병태, 이윤규, 정승주<br>권사 : 김은정, 박미희, 박선영, 양기선, 이정숙, 전정숙, 한은미<br>재임명 권사 : 김선자, 이희자<br>안수집사 : 이용관, 정호경, 함춘식' },
        { year: '2011', date: '10.16', title: "", bold: false, label:"(임직자)", content: '장로 : 김창남<br>권사 : 강정희, 박문옥<br>재임명 권사 : 김혜숙<br>안수집사 : 김대현' },
        { year: '2010', date: '10.10', title: "", bold: false, label:"(임직자)", content: '권사 : 김소희, 손한나, 윤미순, 이윤옥, 임혜경<br>재임명 권사 : 계정화, 남명자<br>안수집사 : 권순길, 이석원, 정승주, 황희<br>재임명 안수집사 : 이윤규' },
        { year: '2009', date: '10.11', title: "", bold: false, label:"(임직자)", content: '장로 : 김홍제, 이영기<br>권사 : 김순연, 김현주, 소복남, 오경숙, 오진숙, 윤금자, 정회주, 조승진<br>안수집사 : 김문태, 김창남, 이영재' },
        { year: '2007', date: '10.08', title: "", bold: false, label:"(임직자)", content: '권사 : 김성자, 안옥영, 이순정, 이윤희, 정경화<br>안수집사 : 김국환, 권순일, 김홍제, 이광숙, 이병태, 이영기, 전태삼' },
        { year: '2006', date: '11.19', title: "", bold: false, label:"(임직자)", content: "권사 : 이미진, 조영숙<br>안수집사 : 박관서" },
        { year: '2005', date: '11.13', title: 'AMI교회 창립6주년 기념 예배', bold: false, label:"(임직자)", content: '장로 : 김동우, 이제호, 이창남<br>권사 : 김성애, 정혜정' },
        { year: '', date: '09', title: 'AMI교회로 교회명 변경', bold: true, label:"", content: '' },
        { year: '2004', date: '10.10', title: '한빛교회 창립 5주년 기념 예배', bold: false, label:"(임직자)", content: '권사 : 김지정, 문경자, 박자경, 신민영' },
        { year: '2001', date: '10.28', title: '조준철 선교 기념관(AMI CENTER OPEN) 개관', bold: false, label:"", content: '' },
        { year: '2000', date: '08.25', title: '조준철 선교 기념관 기공예배', bold: false, label:"", content: '' },
        { year: '1999', date: '10.10', title: '한빛교회 창립예배', bold: true, label:"", content: '' },
    ];

    /**
     * 타임라인 HTML 생성 함수
     */
    function createTimeline(data) {
        return data.map((item) => {
            let textHTML = '';

            // 첫 번째 영역: title (빈 문자열이 아닐 때만)
            if (item.title && item.title.trim() !== '') {
                const boldClass = item.bold ? ' bold' : '';
                textHTML += `<div class="timeline-main${boldClass}">${item.title}</div>`;
            }

            // 두 번째 영역: label + content (둘 중 하나라도 있을 때)
            const hasLabel = item.label && item.label.trim() !== '';
            const hasContent = item.content && item.content.trim() !== '';

            if (hasLabel || hasContent) {
                textHTML += '<div class="timeline-detail">';

                // label (빈 문자열이 아닐 때만)
                if (hasLabel) {
                    textHTML += `<span class="timeline-label">${item.label}</span>`;
                }

                // content (빈 문자열이 아닐 때만)
                if (hasContent) {
                    textHTML += `<span class="timeline-info">${item.content}</span>`;
                }

                textHTML += '</div>';
            }

            return `
                <div class="timeline-item">
                    <div class="timeline-year">${item.year}</div>
                    <div class="timeline-line">
                        <div class="timeline-dot"></div>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-date">${item.date}</div>
                        <div class="timeline-text">
                            ${textHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 타임라인 초기화 함수
     */
    function initTimeline() {
        const timelineContainer = document.getElementById('timeline');
        if (!timelineContainer) return;

        // 빈 연도 항목의 유효 연도 계산 (앞 항목 연도 상속)
        const THRESHOLD = '2021';
        let currentYear = '';
        const dataWithYear = timelineData.map(item => {
            if (item.year !== '') currentYear = item.year;
            return { ...item, _effectiveYear: currentYear };
        });

        const visibleData = dataWithYear.filter(item => item._effectiveYear >= THRESHOLD);
        const hiddenData  = dataWithYear.filter(item => item._effectiveYear <  THRESHOLD);

        let html = createTimeline(visibleData);

        if (hiddenData.length > 0) {
            html += `
                <div class="timeline-more-wrapper">
                    <button class="timeline-more-btn" id="timelineMoreBtn">
                        <span>더보기</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                </div>
                <div class="timeline-hidden" id="timelineHidden" style="display:none;">
                    ${createTimeline(hiddenData)}
                </div>
            `;
        }

        timelineContainer.innerHTML = html;

        const moreBtn = document.getElementById('timelineMoreBtn');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                const hidden = document.getElementById('timelineHidden');
                const isHidden = hidden.style.display === 'none';
                hidden.style.display = isHidden ? 'block' : 'none';
                moreBtn.classList.toggle('open', isHidden);
                moreBtn.querySelector('span').textContent = isHidden ? '접기' : '더보기';
            });
        }
    }

    /* ========================================
       3. 외부 HTML 파일 로드 함수
       ======================================== */
    async function loadContentFromFile(filename) {
        try {
            const response = await fetch(filename);

            if (!response.ok) {
                throw new Error(`파일을 불러올 수 없습니다: ${filename}`);
            }

            const html = await response.text();
            return html;

        } catch (error) {
            console.error('Error loading content:', error);
            return `
                <div class="error-message">
                    <h3>컨텐츠를 불러올 수 없습니다</h3>
                    <p>${error.message}</p>
                    <p>로컬 서버 환경에서 실행해주세요. (예: Live Server, Python HTTP Server 등)</p>
                </div>
            `;
        }
    }

    /* ========================================
       4. 컨텐츠 로드 및 화면 전환 함수
       ======================================== */
    async function loadContent(page, shouldScroll = true) {
        const contentArea = document.getElementById('contentArea');
        const filename = pageFiles[page];

        if (!filename) {
            contentArea.innerHTML = '<p>페이지를 찾을 수 없습니다.</p>';
            return;
        }

        // 페이드 아웃 효과
        contentArea.classList.add('fade-out');

        setTimeout(async () => {
            contentArea.innerHTML = '<div class="loading">컨텐츠를 불러오는 중...</div>';

            const content = await loadContentFromFile(filename);
            contentArea.innerHTML = content;

            // intro 페이지인 경우 타임라인 초기화
            if (page === 'intro') {
                initTimeline();
            }

            // 페이드 인 효과
            contentArea.classList.remove('fade-out');

            // 메뉴 클릭 시에만 스크롤
            if (shouldScroll) {
                const contentSection = document.querySelector('.content');
                if (contentSection) {
                    contentSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        }, 300);
    }

    /* ========================================
       4.5. 모바일 LNB 드롭다운 초기화
       ======================================== */
    function initMobileLNBDropdown() {
        const lnb = document.querySelector('.lnb');
        if (!lnb) return;

        // 토글 버튼 생성 (모바일에서만)
        if (window.innerWidth <= 768) {
            createLNBToggle();
        }

        // 화면 크기 변경 시 재생성
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                createLNBToggle();
            } else {
                removeLNBToggle();
            }
        });
    }

    // LNB 토글 버튼 생성
    function createLNBToggle() {
        const lnb = document.querySelector('.lnb');
        if (!lnb || lnb.querySelector('.lnb-toggle')) return;

        const activeLink = lnb.querySelector('a.active');
        const activeText = activeLink ? activeLink.textContent : '메뉴';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'lnb-toggle';
        toggleBtn.innerHTML = `
            <span>${activeText}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        `;

        toggleBtn.addEventListener('click', () => {
            lnb.classList.toggle('open');
        });

        lnb.insertBefore(toggleBtn, lnb.firstChild);
    }

    // LNB 토글 버튼 제거
    function removeLNBToggle() {
        const toggle = document.querySelector('.lnb-toggle');
        if (toggle) {
            toggle.remove();
        }
        const lnb = document.querySelector('.lnb');
        if (lnb) {
            lnb.classList.remove('open');
        }
    }

    // 모바일 LNB 닫기
    function closeMobileLNB() {
        const lnb = document.querySelector('.lnb');
        if (lnb) {
            lnb.classList.remove('open');
        }
    }

    /* ========================================
       5. 메뉴 활성화 상태 관리 함수
       ======================================== */
    function setActiveMenu(page) {
        document.querySelectorAll('.lnb a, .footer-section a').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
            link.classList.add('active');
        });

        // 모바일 lnb-toggle 텍스트 업데이트
        const toggle = document.querySelector('.lnb-toggle');
        if (toggle) {
            const activeLink = document.querySelector('.lnb a.active');
            if (activeLink) {
                toggle.querySelector('span').textContent = activeLink.textContent;
            }
        }
    }

    /* ========================================
       6. 초기화 함수
       ======================================== */
    function initAmiChurch() {
        console.log('🚀 ami-church 초기화 시작');

        // 초기 페이지 로드
        const hash = window.location.hash.substring(1) || 'greeting';
        const initialPage = pageFiles[hash] ? hash : 'greeting';
        console.log('📄 초기 페이지:', initialPage);

        loadContent(initialPage, false);
        setActiveMenu(initialPage);

        // 모바일 LNB 드롭다운 초기화
        initMobileLNBDropdown();

        // LNB 메뉴 클릭 이벤트
        document.querySelectorAll('.lnb a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                loadContent(page);
                setActiveMenu(page);
                window.location.hash = page;

                // 모바일에서 드롭다운 닫기
                closeMobileLNB();
            });
        });

        // 푸터 메뉴 클릭 이벤트
        document.querySelectorAll('.footer-section a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                loadContent(page);
                setActiveMenu(page);
                window.location.hash = page;

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });

        // 브라우저 뒤로가기/앞으로가기 지원
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'greeting';
            const page = pageFiles[hash] ? hash : 'greeting';
            loadContent(page);
            setActiveMenu(page);
        });
    }

    // 초기화 타이밍 처리
    let initialized = false;

    function tryInit() {
        if (initialized) return;

        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            console.log('✅ contentArea 발견 - 초기화 실행');
            initialized = true;
            initAmiChurch();
        } else {
            console.log('⏳ contentArea 대기 중...');
        }
    }

    // 1. componentsLoaded 이벤트 대기
    document.addEventListener('componentsLoaded', () => {
        console.log('✅ componentsLoaded 이벤트 발생');
        setTimeout(tryInit, 100);
    });

    // 2. DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOMContentLoaded');
            setTimeout(tryInit, 200);
        });
    } else {
        // 3. 이미 로드 완료된 경우
        console.log('✅ 페이지 이미 로드됨');
        setTimeout(tryInit, 100);
    }
})();
