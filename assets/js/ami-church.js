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
        { year: '1999', date: '10.10', content: '한빛교회 창립예배' },
        { year: '2000', date: '08.25', content: '조준호 선교 기념관 기공예배' },
        { year: '2001', date: '10.28', content: '조준호 선교 기념관(AMI CENTER OPEN) 개관' },
        { year: '2004', date: '10.10', content: '한빛교회 창립 5주년 기념 예배<br>(안착자) 권사 : 김자의, 문경자, 박귀경, 신만의' },
        { year: '2005', date: '09', content: 'AMI교회로 교회명 변경' },
        { year: '', date: '11.13', content: 'AMI교회 당회순수 기념 예배<br>(안착자) 장로 : 김동우, 이봉국, 이임남<br>권사 : 김성애, 정애선' },
        { year: '2006', date: '11.19', content: '(안착자) 권사 : 이미란, 조영숙<br>안수집사 : 박관식' },
        { year: '2007', date: '10.08', content: '(안착자) 권사 : 김성자, 안욱의, 이은숙, 이홍포, 정경포<br>안수집사 : 김국철, 김은일, 김종태, 이경숙, 이명탁, 이영기, 전태산' },
        { year: '2009', date: '10.11', content: '(안착자) 장로 : 김종태, 이영기<br>권사 : 김순연, 김혜주, 소복녀, 조영숙, 오진자, 유금자, 정회주, 조숙진<br>안수집사 : 김문탁, 김정녀, 이영진' },
        { year: '2010', date: '10.10', content: '(안착자) 권사 : 김소라, 손영나, 유미순, 이종옥, 임혜경<br>재임명 권사 : 계의포, 남명자<br>안수집사 : 계순화, 이석봉, 임승주, 황포<br>재임명 안수집사 : 이문규' },
        { year: '2011', date: '10.16', content: '(안착자) 장로 : 김성남<br>권사 : 강정포, 박현숙<br>재임명 권사 : 김혜숙<br>안수집사 : 김대만' },
        { year: '2012', date: '10.07', content: '(안착자) 명예장로 : 박경식, 이영진<br>장로 : 김국철, 김대만, 김정녀, 김종욱, 이영숙, 이명탁, 이문규, 정승숙<br>권사 : 김은정, 박미라, 박선의, 양기순, 이은숙, 전영숙, 한은미<br>재임명 권사 : 김은정, 이경자<br>안수집사 : 이광렬, 정숙경, 임춘식' },
        { year: '2013', date: '10.20', content: '(안착자) 장로 : 김순의, 이용길<br>권사 : 김명포, 임민섭, 정의포<br>재임명 권사 : 김선의, 김순의, 이재의, 이태리<br>안수집사 : 박병철, 박종포, 최상필, 최성일, 표선경, 허성흥' },
        { year: '2014', date: '10.12', content: '(안착자) 권사 : 한은경, 한진환<br>재임명 권사 : 박영포, 임승순' },
        { year: '2016', date: '10.02', content: '(안착자) 권사 : 강정화, 김명주, 김혜신, 남은숙, 이지현, 지미경<br>재임명 권사 : 김종림, 백덕선, 성기의, 이경포, 박은경<br>안수집사 : 김효린, 김재기, 이성욱, 전유근, 최병수<br>재임명 안수집사 : 이문규, 이동헌, 이승엽' },
        { year: '2018', date: '04.15', content: '(안착자) 장로 : 김명도, 김재기, 박병철, 허성흥<br>재임명 장로 : 정진호<br>권사 : 김경숙, 김정숙, 김정연, 김명섭, 박수진, 서현숙, 서혜란, 송민숙<br>이영숙, 이정민, 이진연, 전숙, 조선미, 최덕순, 최영미, 최영임<br>재임명 권사 : 김석범, 강건의, 전금호, 박순숙<br>안수집사 : 공영호, 김덕종, 박흥순, 이은자<br>안수집사 : 공상눈, 김승선, 최승호<br>재임명 안수집사 : 홍성눈' },
        { year: '2021', date: '10.10', content: '(안착자) 안수집사 : 이현붕 정명포 장동화<br>권사 : 박순임, 박해숙, 서원님, 서정민, 이정순, 이경포, 이영숙, 이현옥, 이문옥<br>한남숙, 정선섭, 정명숙' },
        { year: '2022', date: '10.09', content: '(안착자) 장로 : 성영선, 황포' },
        { year: '2023', date: '10.22', content: '(안착자) 장로 : 양순식, 이소선, 이민탁, 전임남<br>안수 집사 : 고광탁, 권혜우, 김혜우, 유상섭, 유은일, 윤영태, 이용선, 이종호' },
        { year: '', date: '11.05', content: '(안착자) 명예장로 : 최갑순' }
    ];

    /**
     * 타임라인 HTML 생성 함수
     */
    function createTimeline(data) {
        return data.map((item) => `
            <div class="timeline-item">
                <div class="timeline-year">${item.year}</div>
                <div class="timeline-line">
                    <div class="timeline-dot"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-date">${item.date}</div>
                    <div class="timeline-text">${item.content}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 타임라인 초기화 함수
     */
    function initTimeline() {
        const timelineContainer = document.getElementById('timeline');
        if (timelineContainer) {
            timelineContainer.innerHTML = createTimeline(timelineData);
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
       5. 메뉴 활성화 상태 관리 함수
       ======================================== */
    function setActiveMenu(page) {
        document.querySelectorAll('.lnb a, .footer-section a').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
            link.classList.add('active');
        });
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
        
        // LNB 메뉴 클릭 이벤트
        document.querySelectorAll('.lnb a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                loadContent(page);
                setActiveMenu(page);
                window.location.hash = page;
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