// 컴포넌트 로드 시스템
(function() {
    'use strict';

    console.log('🔧 components.js 로드됨');

    // 컴포넌트 로드 함수
    async function loadComponent(elementId, componentPath) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Element with id "${elementId}" not found`);
            return;
        }

        try {
            console.log(`📥 로딩 중: ${componentPath}`);
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentPath}: ${response.status}`);
            }
            const html = await response.text();
            element.innerHTML = html;
            console.log(`✅ 로드 완료: ${componentPath}`);
        } catch (error) {
            console.error(`❌ Error loading component ${componentPath}:`, error);
        }
    }

    // 모든 컴포넌트 로드
    async function loadAllComponents() {
        console.log('🚀 컴포넌트 로딩 시작...');
        
        const components = [
            { id: 'header-placeholder', path: 'components/header.html' },
            { id: 'search-overlay-placeholder', path: 'components/search-overlay.html' },
            { id: 'mobile-menu-overlay-placeholder', path: 'components/mobile-menu-overlay.html' },
            { id: 'footer-placeholder', path: 'components/footer.html' }
        ];

        // 모든 컴포넌트 동시 로드
        await Promise.all(
            components.map(comp => loadComponent(comp.id, comp.path))
        );

        console.log('✅ 모든 컴포넌트 로드 완료');

        // 컴포넌트 로드 완료 이벤트 발생
        const event = new Event('componentsLoaded');
        document.dispatchEvent(event);
        console.log('📢 componentsLoaded 이벤트 발생');
    }

    // DOM 로드 완료 시 컴포넌트 로드
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOMContentLoaded (components.js)');
            loadAllComponents();
        });
    } else {
        console.log('✅ 페이지 이미 로드됨 (components.js)');
        loadAllComponents();
    }
})();