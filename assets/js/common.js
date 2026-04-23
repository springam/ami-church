// 공통 기능 (Header/Footer)
(function() {
    'use strict';

    // 컴포넌트 로드 완료 후 실행
    function initializeCommonFeatures() {
        console.log('🚀 공통 기능 초기화 시작');
        
        // 약간의 딜레이를 주어 DOM이 완전히 렌더링되도록
        setTimeout(() => {
            initMobileMenu();
            initSearch();
        }, 100);
    }

    // 모바일 메뉴 초기화
    function initMobileMenu() {
        const mainItems = document.querySelectorAll('.mobile-main-item');
        
        if (!mainItems.length) {
            console.warn('Mobile menu items not found');
            return;
        }

        console.log('✅ 모바일 메뉴 초기화 완료');
        
        mainItems.forEach(item => {
            item.addEventListener('click', () => {
                // 모든 메인 아이템에서 active 제거
                mainItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // 모든 서브메뉴 숨기기
                document.querySelectorAll('.mobile-submenu-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // 선택된 서브메뉴 표시
                const submenuId = 'submenu-' + item.dataset.submenu;
                const submenu = document.getElementById(submenuId);
                if (submenu) {
                    submenu.classList.add('active');
                }
            });
        });
        
        // 서브메뉴 링크 클릭 시 메뉴 닫기
        document.querySelectorAll('.mobile-submenu-list a').forEach(link => {
            link.addEventListener('click', () => {
                toggleMobileMenu();
            });
        });
    }

    // 검색 오버레이 초기화
    function initSearch() {
        // 검색 입력창에서 엔터키 처리
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }

        // 검색 버튼 클릭
        const searchBtn = document.querySelector('.search-submit-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }

        console.log('✅ 검색 기능 초기화 완료');
    }

    // 검색 실행 (TODO: 실제 검색 로직 구현)
    function performSearch() {
        const searchInput = document.querySelector('.search-input');
        const query = searchInput.value.trim();
        
        if (query) {
            console.log('검색:', query);
            // TODO: 실제 검색 기능 구현
            // 예: window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }

    // 초기화 타이밍 처리
    let initialized = false;

    function tryInit() {
        if (initialized) return;
        
        const header = document.querySelector('header');
        if (header) {
            console.log('✅ Header 발견 - 공통 기능 초기화');
            initialized = true;
            initializeCommonFeatures();
        } else {
            console.log('⏳ Header 대기 중...');
        }
    }

    // 1. componentsLoaded 이벤트 리스너
    document.addEventListener('componentsLoaded', () => {
        console.log('✅ componentsLoaded 이벤트 발생 (common.js)');
        setTimeout(tryInit, 50);
    });

    // 2. DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOMContentLoaded (common.js)');
            setTimeout(tryInit, 150);
        });
    } else {
        // 3. 이미 로드 완료된 경우
        console.log('✅ 페이지 이미 로드됨 (common.js)');
        setTimeout(tryInit, 50);
    }
})();

// 화면 크기가 PC로 커질 때 모바일 메뉴 자동 닫기
window.addEventListener('resize', () => {
    if (window.innerWidth > 1030) {
        const overlay = document.querySelector('.mobile-menu-overlay');
        const header = document.querySelector('header');
        const headerLogo = document.querySelector('header .logo img');

        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            header.classList.remove('menu-open');
            document.body.style.overflow = '';
            if (headerLogo) headerLogo.src = 'assets/images/logo/logo-white.png';
        }
    }
});

// 전역 함수들 (HTML onclick에서 사용)
function toggleMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    const header = document.querySelector('header');
    const headerLogo = document.querySelector('header .logo img');
    
    if (!overlay || !header || !headerLogo) return;
    
    overlay.classList.toggle('active');
    header.classList.toggle('menu-open');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    
    // 로고 이미지 변경
    if (header.classList.contains('menu-open')) {
        headerLogo.src = 'assets/images/logo/logo-blue.png';
    } else {
        headerLogo.src = 'assets/images/logo/logo-white.png';
    }
}

function toggleSearch() {
    const overlay = document.querySelector('.search-overlay');
    if (!overlay) return;
    
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    
    if (overlay.classList.contains('active')) {
        setTimeout(() => {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }, 100);
    }
}