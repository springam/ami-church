// Home 페이지 전용 기능
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

(function() {
    'use strict';

    // Firebase 설정
    const firebaseConfig = {
        apiKey: "AIzaSyDovIYMknqYQeSpveyEfugar-yQ1PUeL9A",
        authDomain: "ami-church.firebaseapp.com",
        projectId: "ami-church",
        storageBucket: "ami-church.firebasestorage.app",
        messagingSenderId: "858840781541",
        appId: "1:858840781541:web:4c76fac2dd5ed376cd7a0c",
        measurementId: "G-ZKNQHKK26V"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

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
    // 라이브 방송 URL 전환 기능
    // ==========================================

    const DEFAULT_PLAYLIST_URL = "https://www.youtube.com/embed?listType=playlist&list=PLgX4703ro_nUfPOx5DgD2qBZu9LyozTmj";

    /**
     * 라이브 방송 시간인지 체크
     */
    function checkLiveStatus(liveConfig) {
        if (!liveConfig || !liveConfig.isLiveActive) {
            return false;
        }

        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const { dayOfWeek, startTime, endTime } = liveConfig.liveSchedule;

        const isLiveDay = currentDay === dayOfWeek;
        const isLiveTime = currentTime >= startTime && currentTime < endTime;

        return isLiveDay && isLiveTime;
    }

    /**
     * iframe URL 업데이트
     */
    function updateIframeSrc(url) {
        const iframe = document.querySelector('.media-section iframe');
        if (iframe && iframe.src !== url) {
            console.log('🔄 iframe URL 변경:', url);
            iframe.src = url;
        }
    }

    /**
     * 라이브 설정 로드 및 URL 전환
     */
    async function checkAndUpdateLiveUrl() {
        try {
            const liveRef = doc(db, 'settings', 'liveConfig');
            const liveSnap = await getDoc(liveRef);

            if (liveSnap.exists()) {
                const liveConfig = liveSnap.data();
                const isLive = checkLiveStatus(liveConfig);

                if (isLive && liveConfig.liveUrl) {
                    console.log('🔴 라이브 방송 중 - URL 전환:', liveConfig.liveUrl);
                    updateIframeSrc(liveConfig.liveUrl);
                } else {
                    console.log('📺 일반 플레이리스트 표시');
                    updateIframeSrc(DEFAULT_PLAYLIST_URL);
                }
            } else {
                console.log('⚠️ 라이브 설정 없음 - 기본 URL 사용');
                updateIframeSrc(DEFAULT_PLAYLIST_URL);
            }
        } catch (error) {
            console.error('❌ 라이브 설정 로드 오류:', error);
            updateIframeSrc(DEFAULT_PLAYLIST_URL);
        }
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

            // 라이브 URL 체크
            checkAndUpdateLiveUrl();

            // 1분마다 라이브 상태 체크
            setInterval(checkAndUpdateLiveUrl, 60000);
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