// Home 페이지 전용 기능
// Firebase는 라이브 방송 URL 전환 기능에만 사용되므로 현재 비활성화
// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
// import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

(function() {
    'use strict';

    // Firebase 설정 (사용 안 함)
    // const firebaseConfig = {
    //     apiKey: "AIzaSyDovIYMknqYQeSpveyEfugar-yQ1PUeL9A",
    //     authDomain: "ami-church.firebaseapp.com",
    //     projectId: "ami-church",
    //     storageBucket: "ami-church.firebasestorage.app",
    //     messagingSenderId: "858840781541",
    //     appId: "1:858840781541:web:4c76fac2dd5ed376cd7a0c",
    //     measurementId: "G-ZKNQHKK26V"
    // };
    //
    // const app = initializeApp(firebaseConfig);
    // const db = getFirestore(app);

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

    // ==========================================
    // 라이브 방송 URL 전환 기능 (사용 안 함)
    // ==========================================
    //
    // 현재 index.html의 iframe src가 라이브 방송 임베드 주소로 하드코딩되어 있음
    // 필요시 admin-live.js와 함께 다시 활성화 가능
    //
    // const DEFAULT_PLAYLIST_URL = "https://www.youtube.com/embed?listType=playlist&list=PLgX4703ro_nUfPOx5DgD2qBZu9LyozTmj";
    //
    // function checkLiveStatus(liveConfig) { ... }
    // function updateIframeSrc(url) { ... }
    // async function checkAndUpdateLiveUrl() { ... }

    // 초기화 타이밍 처리
    let initialized = false;

    function tryInit() {
        if (initialized) return;

        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            console.log('✅ Hero section 발견 - 초기화 실행');
            initialized = true;
            initHeroSlider();

            // 라이브 URL 체크 (비활성화)
            // checkAndUpdateLiveUrl();
            // setInterval(checkAndUpdateLiveUrl, 60000);
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