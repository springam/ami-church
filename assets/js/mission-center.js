// 선교 센터 페이지 전용 기능
(function() {
    'use strict';

    /* ========================================
       1. 페이지 설정 - 각 메뉴와 HTML 파일 매핑
       ======================================== */
    const pageFiles = {
        'center-intro': 'pages/center-intro.html',
        'center-people': 'pages/center-people.html'
    };

    /* ========================================
       2. 외부 HTML 파일 로드 함수
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
                    <p>로컬 서버 환경에서 실행해주세요.</p>
                </div>
            `;
        }
    }

    /* ========================================
       3. 컨텐츠 로드 및 화면 전환 함수
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
       4. 메뉴 활성화 상태 관리 함수
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
       5. 초기화 함수
       ======================================== */
    function initMissionCenter() {
        console.log('🚀 mission-center 초기화 시작');
        
        // 초기 페이지 로드
        const hash = window.location.hash.substring(1) || 'center-intro';
        const initialPage = pageFiles[hash] ? hash : 'center-intro';
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
            const hash = window.location.hash.substring(1) || 'center-intro';
            const page = pageFiles[hash] ? hash : 'center-intro';
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
            initMissionCenter();
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