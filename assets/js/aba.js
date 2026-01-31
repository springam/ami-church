// aba.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log('🎯 aba.js 로드됨!');

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
const CATEGORY = 'aba'; // 고정된 category
const SUBCATEGORY = 'aba'; // 고정된 subCategory
let currentDetailCategory = null; // 현재 선택된 detailCategory
let currentPage = 1;
const itemsPerPage = 9;
let totalPages = 1;
let allVideos = [];
let currentVideoIndex = -1;

// ABA detail-categories (DB에서 로드)
let DETAIL_CATEGORIES = [];

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
 * Firestore에서 detail-categories 로드
 */
async function loadDetailCategories() {
    try {
        const categoriesRef = collection(db, 'detailCategories');
        const querySnapshot = await getDocs(categoriesRef);

        // 초기화
        const categories = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.isActive) return; // 비활성 카테고리 제외

            const subCategory = data.subCategory;
            const categoryName = data.categoryName;

            // ABA 카테고리만 처리
            if (subCategory === 'aba') {
                categories.push({
                    name: categoryName,
                    orderNumber: data.orderNumber || 999999
                });
            }
        });

        // orderNumber로 정렬
        categories.sort((a, b) => a.orderNumber - b.orderNumber);
        DETAIL_CATEGORIES = categories.map(c => c.name);
    } catch (error) {
        console.error('❌ Detail Categories 로드 실패:', error);
        DETAIL_CATEGORIES = [];
    }
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
 */
async function fetchVideos(detailCategory = null) {
    try {
        const videosRef = collection(db, 'video');

        // category만 필터링
        let q = query(
            videosRef,
            where('category', '==', CATEGORY)
        );

        const querySnapshot = await getDocs(q);
        const videos = [];
        let filteredCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // 클라이언트 측 필터링
            if (data.subCategory !== SUBCATEGORY) {
                return;
            }
            if (data.status !== 'active') {
                return;
            }
            if (detailCategory && data.detailCategory !== detailCategory) {
                filteredCount++;
                return;
            }

            videos.push({
                id: doc.id,
                title: data.title || '제목 없음',
                date: formatDate(data.date, data.datePrecision),
                dateObj: data.date,
                datePrecision: data.datePrecision,
                category: data.category,
                subCategory: data.subCategory || '',
                detailCategory: data.detailCategory || '',
                description: data.description || '',
                thumbnail: data.thumbnail || 'assets/images/thumbnails/default-thumbnail.jpg',
                videoUrl: data.videoUrl || '',
                type: data.type || 'video',
                orderNumber: data.orderNumber || 999999
            });
        });

        // orderNumber 기준 정렬, 없으면 날짜 역순
        videos.sort((a, b) => {
            if (a.orderNumber !== b.orderNumber) {
                return a.orderNumber - b.orderNumber;
            }

            // 날짜 비교 (Timestamp)
            const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(0);
            const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(0);
            return dateB - dateA;
        });

        return videos;

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        return [];
    }
}

/**
 * 비디오 리스트 렌더링
 */
function renderVideos(videos, page = 1) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('❌ videoGrid 요소를 찾을 수 없음!');
        return;
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVideos = videos.slice(startIndex, endIndex);

    if (pageVideos.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎥</div>
                <div class="empty-state-text">아직 등록된 영상이 없습니다.</div>
            </div>
        `;
        totalPages = 1;
        renderPagination();
        return;
    }

    const cardsHTML = pageVideos.map(video => `
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
    `).join('');

    videoGrid.innerHTML = cardsHTML;

    totalPages = Math.ceil(videos.length / itemsPerPage);
    renderPagination();
}

/**
 * 서브메뉴 렌더링
 */
function renderSubMenu() {
    const subMenu = document.getElementById('subMenu');
    const subMenuItems = document.getElementById('subMenuItems');

    if (!subMenu || !subMenuItems) return;

    // 서브메뉴 표시 및 항목 생성
    subMenu.style.display = 'block';

    // "전체" 버튼 생성
    const allButton = document.createElement('div');
    allButton.className = `sub-menu-item ${!currentDetailCategory ? 'active' : ''}`;
    allButton.textContent = '전체';
    allButton.addEventListener('click', () => changeDetailCategoryABA(null));

    // 카테고리 버튼들 생성
    const categoryButtons = DETAIL_CATEGORIES.map(category => {
        const button = document.createElement('div');
        button.className = `sub-menu-item ${currentDetailCategory === category ? 'active' : ''}`;
        button.textContent = category;
        button.addEventListener('click', () => changeDetailCategoryABA(category));
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

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
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
                    이전 영상
                </div>
                <div class="video-nav-title">${prevVideo ? prevVideo.title : '이전 영상이 없습니다.'}</div>
            </div>

            <div class="video-nav-card next ${!nextVideo ? 'disabled' : ''}"
                 ${nextVideo ? `onclick='playVideo(${JSON.stringify(nextVideo).replace(/'/g, "&apos;")})'` : ''}>
                <div class="video-nav-label">
                    다음 영상
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 12H3 M9 18l6-6-6-6"/>
                    </svg>
                </div>
                <div class="video-nav-title">${nextVideo ? nextVideo.title : '다음 영상이 없습니다.'}</div>
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

    detailView.style.display = '';
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
 * detailCategory 변경
 */
async function changeDetailCategoryABA(detailCategory) {
    currentDetailCategory = detailCategory;
    currentPage = 1;

    // 서브메뉴 활성화 상태 변경
    document.querySelectorAll('.sub-menu-item').forEach(item => {
        item.classList.remove('active');

        // null인 경우 "전체" 버튼 활성화
        if (detailCategory === null && item.textContent.trim() === '전체') {
            item.classList.add('active');
        }
        // 특정 카테고리인 경우 해당 버튼 활성화
        else if (detailCategory !== null && item.textContent.trim() === detailCategory) {
            item.classList.add('active');
        }
    });

    // 로딩 표시
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }

    // 데이터 로드
    allVideos = await fetchVideos(detailCategory);
    renderVideos(allVideos, currentPage);
}

/**
 * 초기화
 */
export async function initABA() {
    // ⭐ 전역 변수 초기화 (다른 페이지에서 남은 데이터 제거)
    currentDetailCategory = null;
    currentPage = 1;
    allVideos = [];
    currentVideoIndex = -1;

    // ⭐ 화면 초기화 (이전 페이지 HTML 제거)
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
    }

    // 브라우저 뒤로가기/앞으로가기 이벤트 처리
    window.addEventListener('popstate', (event) => {
        // 상세 뷰가 열려있으면 목록으로 돌아가기
        const detailView = document.getElementById('videoDetailView');
        if (detailView && detailView.classList.contains('active')) {
            backToList();
        }
    });

    // detail-categories 로드
    await loadDetailCategories();

    // 초기 데이터 로드
    allVideos = await fetchVideos();
    renderVideos(allVideos, currentPage);

    renderSubMenu();

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

/**
 * 아바 성격 학교 팝업 열기
 */
window.openABASchoolPopups = function() {
    const popup = document.getElementById('abaSchoolPopup');

    if (popup) {
        popup.classList.add('active');
        // body 스크롤 방지
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 아바 성격 학교 팝업 닫기
 */
window.closeABASchoolPopup = function() {
    const popup = document.getElementById('abaSchoolPopup');

    if (popup) {
        popup.classList.remove('active');
        // body 스크롤 복구
        document.body.style.overflow = '';
    }
}

/**
 * 팝업 외부 클릭 시 닫기
 */
window.addEventListener('click', function(event) {
    const popup = document.getElementById('abaSchoolPopup');

    if (event.target === popup) {
        closeABASchoolPopup();
    }
});
