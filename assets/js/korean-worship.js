// korean-worship.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log('🎯 korean-worship.js 로드됨!');

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

// Firebase 초기화
console.log('🔥 Firebase 초기화 시작...');
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase 앱 초기화 완료');

const analytics = getAnalytics(app);
console.log('✅ Analytics 초기화 완료');

const db = getFirestore(app);
console.log('✅ Firestore 초기화 완료');

// 전역 변수
let currentSubCategory = 'weekly'; // 현재 선택된 subCategory (worship-tabs)
let currentDetailCategory = null; // 현재 선택된 detailCategory (sub-menu)
let currentPage = 1;
const itemsPerPage = 9;
let totalPages = 1;
let allVideos = [];
const videosCache = {}; // { subCategory: [...] } — 탭별 캐시
let currentVideoIndex = -1;

// ⭐ subCategory별 detailCategory 설정 (DB에서 로드)
let DETAIL_CATEGORIES = {
    weekly: [],
    scripture: [],
    topic: [],
    column: []
};

/**
 * DB에서 detailCategory 로드
 */
async function loadDetailCategories() {
    try {
        console.log('📂 detailCategories 로드 시작...');

        const categoriesRef = collection(db, 'detailCategories');
        const q = query(
            categoriesRef,
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);

        // 초기화
        DETAIL_CATEGORIES = {
            weekly: [],
            scripture: [],
            topic: [],
            column: []
        };

        const categoriesWithOrder = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            categoriesWithOrder.push(data);
        });

        // orderNumber로 정렬 후 카테고리별로 분류
        categoriesWithOrder.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

        categoriesWithOrder.forEach((data) => {
            const subCategory = data.subCategory;
            if (DETAIL_CATEGORIES.hasOwnProperty(subCategory)) {
                DETAIL_CATEGORIES[subCategory].push(data.categoryName);
            }
        });

        console.log('✅ detailCategories 로드 완료:', DETAIL_CATEGORIES);

    } catch (error) {
        console.error('❌ detailCategories 로드 오류:', error);
        console.error('오류 상세:', error.message);

        // 오류 발생 시 빈 배열로 초기화
        DETAIL_CATEGORIES = {
            weekly: [],
            scripture: [],
            topic: [],
            column: []
        };
    }
}

/**
 * YouTube URL을 임베드 URL로 변환
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return '';

    // youtu.be 짧은 URL
    let match = url.match(/youtu\.be\/([^?&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // 일반 watch URL
    match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // 라이브 URL
    match = url.match(/youtube\.com\/live\/([^?&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // 커뮤니티 게시물 URL
    match = url.match(/youtube\.com\/post\/([^?&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Shorts URL
    match = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }

    // 이미 embed URL인 경우
    if (url.includes('youtube.com/embed/')) {
        return url;
    }

    return url;
}

/**
 * 날짜 데이터를 문자열로 변환 (datePrecision에 따라 표시)
 */
function formatDate(dateData, datePrecision) {
    if (!dateData) return '';

    // Timestamp 형식
    if (dateData.toDate) {
        const date = dateData.toDate();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // precision이 없으면 'day'로 간주 (기존 데이터)
        const precision = datePrecision || 'day';

        if (precision === 'year') {
            return year + '년';
        } else if (precision === 'month') {
            return year + '년 ' + month + '월';
        } else {  // 'day'
            return year + '년 ' + month + '월 ' + day + '일';
        }
    }

    // 문자열인 경우
    if (typeof dateData === 'string') {
        return dateData;
    }

    // Date 객체인 경우
    if (dateData instanceof Date) {
        return dateData.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\. /g, '.').replace(/\.$/, '');
    }

    return '';
}

/**
 * Firestore에서 영상 데이터 가져오기
 * 주일 예배 카테고리에서 subCategory와 detailCategory로 필터링
 */
async function fetchVideos(subCategory, detailCategory = null) {
    try {
        console.log('=== 데이터 가져오기 시작 ===');

        // 캐시가 없으면 DB에서 조회
        if (!videosCache[subCategory]) {
            const videosRef = collection(db, 'video');
            const q = query(
                videosRef,
                where('category', '==', 'sunday'),
                where('subCategory', '==', subCategory),
                where('status', '==', 'active')
            );
            const querySnapshot = await getDocs(q);
            const videos = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                videos.push({
                    id: doc.id,
                    title: data.title || '제목 없음',
                    date: formatDate(data.date, data.datePrecision),
                    dateObj: data.date,
                    datePrecision: data.datePrecision,
                    category: data.category,
                    subCategory: data.subCategory || '',
                    detailCategory: data.detailCategory || '',
                    preacher: data.preacher || '',
                    description: data.description || '',
                    thumbnail: data.thumbnail || 'assets/images/thumbnails/default-thumbnail.jpg',
                    videoUrl: data.videoUrl || '',
                    pdfUrl: data.pdfUrl || '',
                    pdfFileName: data.pdfFileName || '',
                    type: data.type || 'video',
                    orderNumber: data.orderNumber || 999999
                });
            });

            // ⭐ orderNumber 기준 정렬 (이번주 설교·목회자 칼럼은 내림차순)
            videos.sort((a, b) => {
                if (a.orderNumber !== b.orderNumber) {
                    if (subCategory === 'weekly' || subCategory === 'column') {
                        return b.orderNumber - a.orderNumber;
                    }
                    return a.orderNumber - b.orderNumber;
                }
                const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(0);
                const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(0);
                return dateB - dateA;
            });

            videosCache[subCategory] = videos;
        }

        // 캐시에서 detailCategory 필터링
        const cached = videosCache[subCategory];
        const result = detailCategory ? cached.filter(v => v.detailCategory === detailCategory) : cached;

        console.log('최종 변환된 비디오 개수:', result.length);
        console.log('=== 데이터 가져오기 완료 ===\n');

        return result;

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        return [];
    }
}

/**
 * 비디오 리스트 렌더링
 */
function renderVideos(videos, page = 1) {
    console.log('🎨 renderVideos 호출:', videos.length, '개');
    
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('❌ videoGrid 요소를 찾을 수 없음!');
        return;
    }
    
    console.log('✅ videoGrid 요소 찾음:', videoGrid);

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVideos = videos.slice(startIndex, endIndex);
    
    console.log('📄 페이지 비디오:', pageVideos.length, '개 (페이지:', page, ')');

    if (pageVideos.length === 0) {
        console.log('⚠️ 비디오가 없어서 empty-state 표시');
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎥</div>
                <div class="empty-state-text">아직 등록된 설교 영상이 없습니다.</div>
            </div>
        `;
        totalPages = 1;
        renderPagination();
        return;
    }

    console.log('🔨 비디오 카드 HTML 생성 중...');
    const cardsHTML = pageVideos.map(video => {
        console.log('  카드 생성:', video.title);
        console.log('  - thumbnail:', video.thumbnail);
        console.log('  - description:', video.description);
        console.log('  - date:', video.date);
        console.log('  - videoUrl:', video.videoUrl);
        console.log('  - 전체 video 객체:', video);

        // 목회자 칼럼인 경우 새 창으로 URL 열기
        if (currentSubCategory === 'column') {
            return `
            <div class="video-card" style="background-image: url('${video.thumbnail}');" onclick='openColumnUrl("${video.videoUrl}")'>
                <div class="video-content">
                    <h3 class="video-title">${video.title}</h3>
                    ${video.description ? `
                    <div class="video-description-wrapper">
                        <span class="video-description">${video.description}</span>
                    </div>
                    ` : ''}
                    <div class="video-info">
                        <span class="video-date">${video.date}</span>
                    </div>
                </div>
            </div>
        `;
        }

        // 일반 동영상
        return `
        <div class="video-card" style="background-image: url('${video.thumbnail}');" onclick='playVideo(${JSON.stringify(video).replace(/'/g, "&apos;")})'>
            <div class="video-content">
                <h3 class="video-title">${video.title}</h3>
                ${video.description ? `
                <div class="video-description-wrapper">
                    <span class="video-description">${video.description}</span>
                </div>
                ` : ''}
                <div class="video-info">
                    <span class="video-date">${video.date}</span>
                </div>
            </div>
        </div>
    `;
    }).join('');

    console.log('✅ HTML 생성 완료, videoGrid에 삽입');
    console.log('📝 생성된 HTML (처음 200자):', cardsHTML.substring(0, 200));
    videoGrid.innerHTML = cardsHTML;
    console.log('✅ videoGrid.innerHTML 설정 완료');
    console.log('📝 설정 후 videoGrid.innerHTML (처음 200자):', videoGrid.innerHTML.substring(0, 200));

    totalPages = Math.ceil(videos.length / itemsPerPage);
    console.log('📊 총 페이지:', totalPages);
    renderPagination();
}

/**
 * 목회자 칼럼 URL 새 창으로 열기
 */
window.openColumnUrl = function(url) {
    if (!url) {
        alert('URL을 찾을 수 없습니다.');
        return;
    }

    console.log('🔗 URL 열기:', url);

    // URL 프로토콜 확인 및 보정
    let finalUrl = url.trim();

    // http:// 또는 https://로 시작하지 않으면 https:// 추가
    if (!finalUrl.match(/^https?:\/\//i)) {
        finalUrl = 'https://' + finalUrl;
    }

    console.log('🔗 최종 URL:', finalUrl);

    // 새 탭에서 열기
    window.open(finalUrl, '_blank', 'noopener,noreferrer');

    console.log('✅ 새 창으로 URL 열기 완료');
}

/**
 * 서브메뉴 렌더링
 */
function renderSubMenu() {
    const subMenu = document.getElementById('subMenu');
    const subMenuItems = document.getElementById('subMenuItems');

    if (!subMenu || !subMenuItems) return;

    const detailCategories = DETAIL_CATEGORIES[currentSubCategory];

    // detailCategory가 없는 경우 (이번주 설교, 목회자 칼럼)
    if (!detailCategories || detailCategories.length === 0) {
        subMenu.style.display = 'none';
        return;
    }

    // 서브메뉴 표시 및 항목 생성
    subMenu.style.display = 'block';

    // "전체" 버튼 생성
    const allButton = document.createElement('div');
    allButton.className = `sub-menu-item ${!currentDetailCategory ? 'active' : ''}`;
    allButton.textContent = '전체';
    allButton.addEventListener('click', () => changeDetailCategoryKoreanWorship(null));

    // 카테고리 버튼들 생성
    const categoryButtons = detailCategories.map(category => {
        const button = document.createElement('div');
        button.className = `sub-menu-item ${currentDetailCategory === category ? 'active' : ''}`;
        button.textContent = category;
        button.addEventListener('click', () => changeDetailCategoryKoreanWorship(category));
        return button;
    });

    // subMenuItems 초기화 및 버튼 추가
    subMenuItems.innerHTML = '';
    subMenuItems.appendChild(allButton);
    categoryButtons.forEach(button => subMenuItems.appendChild(button));
}

/**
 * 페이지네이션 렌더링
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button class="pagination-btn" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
    `;

    const isMobile = window.innerWidth <= 768;
    const visibleCount = isMobile ? 2 : 4;
    const halfVisible = isMobile ? 1 : 2;

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + visibleCount);

    if (endPage - startPage < visibleCount) {
        startPage = Math.max(1, endPage - visibleCount);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
    }

    paginationHTML += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
        <button class="pagination-btn" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
    `;

    pagination.innerHTML = paginationHTML;
}

/**
 * 페이지 변경
 */
window.changePage = function(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    
    renderVideos(allVideos, currentPage);
    
    const worshipContainer = document.querySelector('.worship-container');
    if (worshipContainer) {
        worshipContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * 비디오 상세 뷰 표시
 */
window.playVideo = function(video) {
    // 현재 비디오의 인덱스 찾기
    currentVideoIndex = allVideos.findIndex(v => v.id === video.id);

    // 히스토리에 상태 추가 (뒤로가기 지원)
    history.pushState({ view: 'detail', videoId: video.id }, '', '');

    // 그리드 뷰와 헤더 모두 숨기기
    const videoGrid = document.getElementById('videoGrid');
    const pagination = document.getElementById('pagination');
    const worshipHeader = document.querySelector('.worship-header');

    if (videoGrid) videoGrid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (worshipHeader) worshipHeader.style.display = 'none';
    
    // 상세 뷰 생성 또는 업데이트
    let detailView = document.getElementById('videoDetailView');
    
    if (!detailView) {
        detailView = document.createElement('div');
        detailView.id = 'videoDetailView';
        detailView.className = 'video-detail-view';
        
        const worshipContainer = document.querySelector('.worship-container');
        worshipContainer.appendChild(detailView);
    }
    
    // 이전/다음 비디오 정보
    const prevVideo = currentVideoIndex > 0 ? allVideos[currentVideoIndex - 1] : null;
    const nextVideo = currentVideoIndex < allVideos.length - 1 ? allVideos[currentVideoIndex + 1] : null;
    
    // 상세 뷰 HTML 생성
    detailView.innerHTML = `
        <div class="video-detail-header">
            <h2 class="video-detail-title">${video.title}</h2>
            <div class="video-detail-meta">
                <span>${video.description || ''}</span>
                <span>${video.date}</span>
            </div>
        </div>
        
        <div class="video-detail-player">
            <iframe 
                class="video-detail-iframe" 
                src="${getYouTubeEmbedUrl(video.videoUrl)}" 
                allowfullscreen
            ></iframe>
        </div>
        
        <div class="video-navigation">
            <div class="video-nav-card prev ${!prevVideo ? 'disabled' : ''}" 
                 ${prevVideo ? `onclick='playVideo(${JSON.stringify(prevVideo).replace(/'/g, "&apos;")})'` : ''}>
                <div class="video-nav-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12H21 M15 18l-6-6 6-6"/>
                    </svg>
                    이전 설교
                </div>
                <div class="video-nav-title">${prevVideo ? prevVideo.title : '이전 설교가 없습니다.'}</div>
            </div>
            
            <div class="video-nav-card next ${!nextVideo ? 'disabled' : ''}" 
                 ${nextVideo ? `onclick='playVideo(${JSON.stringify(nextVideo).replace(/'/g, "&apos;")})'` : ''}>
                <div class="video-nav-label">
                    다음 설교
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 12H3 M9 18l6-6-6-6"/>
                    </svg>
                </div>
                <div class="video-nav-title">${nextVideo ? nextVideo.title : '다음 설교가 없습니다.'}</div>
            </div>
        </div>

        <div class="back-to-list-container">
            <button class="back-to-list" onclick="backToList()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
                </svg>
                목록으로
            </button>
        </div>
    `;
    
    detailView.style.display = '';  // 인라인 스타일 초기화
    detailView.classList.add('active');
    
    // 스크롤 위치 조정
    const worshipContainer = document.querySelector('.worship-container');
    if (worshipContainer) {
        worshipContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * 목록으로 돌아가기
 */
window.backToList = function() {
    const detailView = document.getElementById('videoDetailView');
    const videoGrid = document.getElementById('videoGrid');
    const pagination = document.getElementById('pagination');
    const worshipHeader = document.querySelector('.worship-header');
    
    if (detailView) {
        detailView.classList.remove('active');
    }
    
    // 헤더와 그리드 뷰 다시 표시
    if (videoGrid) videoGrid.style.display = 'grid';
    if (pagination) pagination.style.display = 'flex';
    if (worshipHeader) worshipHeader.style.display = 'block';
    
    // 스크롤 위치 조정
    const worshipContainer = document.querySelector('.worship-container');
    if (worshipContainer) {
        worshipContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * subCategory 변경 (worship-tabs 클릭)
 */
async function changeSubCategory(subCategory) {
    if (currentSubCategory === subCategory) return;

    currentSubCategory = subCategory;
    currentPage = 1;
    currentDetailCategory = null; // detailCategory 초기화

    // 탭 활성화 상태 변경
    document.querySelectorAll('.worship-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === subCategory) {
            tab.classList.add('active');
        }
    });

    // 상세 뷰가 열려있으면 닫기
    backToList();

    // 로딩 표시
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }
    
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
    }

    // 데이터 로드
    allVideos = await fetchVideos(subCategory);
    renderVideos(allVideos, currentPage);
    renderSubMenu();
    
    // ✨ 탭 전환 후 서브메뉴 체크
    setTimeout(() => {
        checkAndApplySubmenuClass();
    }, 50);
}

/**
 * detailCategory 변경 (sub-menu 클릭)
 */
async function changeDetailCategoryKoreanWorship(detailCategory) {
    console.log('🔄 [Korean Worship] changeDetailCategory 호출:', detailCategory);
    console.log('  - 현재 detailCategory:', currentDetailCategory);
    console.log('  - 현재 subCategory:', currentSubCategory);
    console.log('  - 현재 allVideos 개수:', allVideos.length);

    currentDetailCategory = detailCategory;
    currentPage = 1;

    // 서브메뉴 활성화 상태 변경
    document.querySelectorAll('.sub-menu-item').forEach(item => {
        item.classList.remove('active');
    });

    if (detailCategory === null) {
        document.querySelector('.sub-menu-item:first-child')?.classList.add('active');
    } else {
        // 선택된 카테고리에 active 추가
        document.querySelectorAll('.sub-menu-item').forEach(item => {
            if (item.textContent.trim() === detailCategory) {
                item.classList.add('active');
            }
        });
    }

    // 로딩 표시
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }

    // 데이터 로드
    console.log('📂 fetchVideos 호출:', currentSubCategory, detailCategory);
    allVideos = await fetchVideos(currentSubCategory, detailCategory);
    console.log('✅ 로드된 비디오 개수:', allVideos.length);
    renderVideos(allVideos, currentPage);
}

/**
 * 초기화
 */
export async function initKoreanWorship() {
    console.log('🚀 initKoreanWorship() 실행');

    // ⭐ 전역 변수 초기화 (다른 페이지에서 남은 데이터 제거)
    currentSubCategory = 'weekly';
    currentDetailCategory = null;
    currentPage = 1;
    allVideos = [];
    for (const key of Object.keys(videosCache)) delete videosCache[key];
    currentVideoIndex = -1;
    console.log('✅ 전역 변수 초기화 완료');

    // ⭐ 화면 초기화 (이전 페이지 HTML 제거)
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
    }
    console.log('✅ 화면 초기화 완료');

    // ⭐ 1. 먼저 카테고리 로드
    await loadDetailCategories();

    // worship-tabs 이벤트 리스너
    const tabs = document.querySelectorAll('.worship-tab');
    console.log('탭 개수:', tabs.length);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('탭 클릭:', tab.dataset.category);
            changeSubCategory(tab.dataset.category);
        });
    });

    // 브라우저 뒤로가기/앞으로가기 이벤트 처리
    window.addEventListener('popstate', (event) => {
        console.log('popstate 이벤트 발생:', event.state);

        // 상세 뷰가 열려있으면 목록으로 돌아가기
        const detailView = document.getElementById('videoDetailView');
        if (detailView && detailView.classList.contains('active')) {
            backToList();
        }
    });

    console.log('🔥 초기 데이터 로드 시작...');

    // 초기 데이터 로드
    allVideos = await fetchVideos(currentSubCategory);
    renderVideos(allVideos, currentPage);

    console.log('📦 로드된 데이터:', allVideos);

    renderSubMenu();

    console.log('✅ 초기화 완료!');

    // ✨ 서브메뉴 체크 (초기화 완료 직후)
    setTimeout(() => {
        checkAndApplySubmenuClass();
    }, 100);
}

/**
 * 서브메뉴 체크 및 클래스 적용
 */
function checkAndApplySubmenuClass() {
    const worshipTabs = document.querySelector('.worship-tabs');
    
    console.log('🔍 worship-tabs 찾기:', worshipTabs);
    
    if (!worshipTabs) {
        console.log('❌ worship-tabs 없음');
        return;
    }
    
    // ✨ sub-menu는 형제 요소이므로 부모에서 찾기
    const subMenu = document.querySelector('.sub-menu');
    
    // sub-menu가 실제로 표시되는지 확인 (display: none이 아닌지)
    const isSubMenuVisible = subMenu && subMenu.style.display !== 'none';
    
    console.log('🔍 sub-menu 요소:', subMenu);
    console.log('🔍 sub-menu display:', subMenu ? subMenu.style.display : 'null');
    console.log('🔍 서브메뉴 표시 여부:', isSubMenuVisible ? '있음' : '없음');
    
    if (isSubMenuVisible) {
        worshipTabs.classList.add('has-submenu');
        console.log('✅ has-submenu 클래스 추가됨');
    } else {
        worshipTabs.classList.remove('has-submenu');
        console.log('✅ has-submenu 클래스 제거됨');
    }
}