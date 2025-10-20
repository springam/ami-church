// Home 페이지 전용 기능
(function() {
    'use strict';

    // Hero 슬라이더 변수
    let heroImages, heroTitles, indicators;
    let currentIndex = 0;
    let autoSlide;
    const slideInterval = 4000;

    // Hero 슬라이더 초기화
    function initHeroSlider() {
        heroImages = document.querySelectorAll('.hero-bg');
        heroTitles = document.querySelectorAll('.hero-content h1');
        indicators = document.querySelectorAll('.hero-indicators .indicator');

        if (!heroImages.length || !heroTitles.length || !indicators.length) {
            console.warn('Hero slider elements not found');
            return;
        }

        console.log('✅ Hero 슬라이더 초기화 완료');

        // 인디케이터 클릭 이벤트
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                changeSlide(index);
                resetAutoSlide();
            });
        });

        // 자동 슬라이드 시작
        startAutoSlide();
    }

    // 슬라이드 변경
    function changeSlide(index) {
        heroImages.forEach(img => img.classList.remove('active'));
        heroTitles.forEach(title => title.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        
        heroImages[index].classList.add('active');
        heroTitles[index].classList.add('active');
        indicators[index].classList.add('active');
        
        currentIndex = index;
    }

    // 다음 슬라이드
    function nextSlide() {
        const nextIndex = (currentIndex + 1) % heroImages.length;
        changeSlide(nextIndex);
    }

    // 자동 슬라이드 시작
    function startAutoSlide() {
        autoSlide = setInterval(nextSlide, slideInterval);
    }

    // 자동 슬라이드 재설정
    function resetAutoSlide() {
        clearInterval(autoSlide);
        startAutoSlide();
    }

    // 초기화 타이밍 처리
    let initialized = false;

    function tryInit() {
        if (initialized) return;
        
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            console.log('✅ Hero section 발견 - 초기화 실행');
            initialized = true;
            initHeroSlider();
        } else {
            console.log('⏳ Hero section 대기 중...');
        }
    }

    // 1. DOMContentLoaded 대기
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOMContentLoaded');
            setTimeout(tryInit, 100);
        });
    } else {
        // 2. 이미 로드 완료된 경우
        console.log('✅ 페이지 이미 로드됨');
        setTimeout(tryInit, 100);
    }
})();