// korean-worship.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
let currentCategory = 'weekly';
let currentPage = 1;
const itemsPerPage = 9;
let totalPages = 1;
let allVideos = [];
let currentVideoIndex = -1;
let currentSubCategory = null; // ⭐ 현재 선택된 서브카테고리

// ⭐ 카테고리별 서브카테고리 설정 (나중에 쉽게 변경 가능)
const SUB_CATEGORIES = {
    scripture: ['옵기서', '요나서', '마태복음 5장', '마태복음 13장', '마태복음 16장', '누가복음', '요한복음', '사도행전', '로마서', '로마서 9장~11장', '고린도전서', '빌립보서', '빌레몬서', '야고보서'],
    topic: ['옵기서', '요나서', '마태복음 5장', '마태복음 13장', '마태복음 16장', '누가복음', '요한복음', '사도행전', '로마서', '로마서 9장~11장', '고린도전서', '빌립보서', '빌레몬서', '야고보서'],
    column: ['23년', '24년', '25년'],
    weekly: [] // 이번주 설교는 서브메뉴 없음
};

/**
 * YouTube URL을 임베드 URL로 변환
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    
    let match = url.match(/youtu\.be\/([^?]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    if (url.includes('youtube.com/embed/')) {
        return url;
    }
    
    return url;
}

/**
 * Firestore Timestamp를 날짜 문자열로 변환
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).replace(/\. /g, '.').replace(/\.$/, '');
    }
    
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    
    if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).replace(/\. /g, '.').replace(/\.$/, '');
    }
    
    return '';
}

/**
 * Firestore에서 목회자 컬럼 데이터 가져오기
 */
async function fetchColumns() {
    try {
        console.log('=== 목회자 컬럼 데이터 가져오기 시작 ===');
        
        const columnsRef = collection(db, 'column');
        const querySnapshot = await getDocs(columnsRef);
        
        console.log('컬럼 문서 개수:', querySnapshot.size);
        
        const columns = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            columns.push({
                id: doc.id,
                title: data.title || '제목 없음',
                date: formatDate(data.date),
                dateObj: data.date,
                year: data.year ? data.year.toString() : '',
                category: data.category || '',
                downloadUrl: data.downloadUrl || ''
            });
        });

        // 날짜 역순 정렬
        columns.sort((a, b) => {
            const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(a.dateObj);
            const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(b.dateObj);
            return dateB - dateA;
        });
        
        console.log('로드된 컬럼:', columns);
        console.log('=== 목회자 컬럼 데이터 가져오기 완료 ===\n');
        
        return columns;
        
    } catch (error) {
        console.error('❌ 컬럼 데이터 오류:', error);
        return [];
    }
}

/**
 * Firestore에서 영상 데이터 가져오기
 */
async function fetchVideos(category) {
    try {
        console.log('=== 데이터 가져오기 시작 ===');
        console.log('1. 카테고리:', category);
        console.log('2. Firestore DB 연결 상태:', db ? 'OK' : 'FAIL');
        
        const videosRef = collection(db, 'video');
        console.log('3. 컬렉션 참조 생성:', videosRef ? 'OK' : 'FAIL');
        
        const q = query(
            videosRef,
            where('category', '==', category)
        );
        console.log('4. 쿼리 생성 완료');

        const querySnapshot = await getDocs(q);
        console.log('5. 쿼리 실행 완료 - 문서 개수:', querySnapshot.size);
        
        const videos = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('6. 문서 데이터:', {
                id: doc.id,
                title: data.title,
                category: data.category,
                date: data.date
            });
            
            videos.push({
                id: doc.id,
                title: data.title || '제목 없음',
                date: formatDate(data.date),
                dateObj: data.date,
                category: data.category,
                preacher: data.preacher || '',
                description: data.description || '',
                subCategory: data.subCategory || '', // ⭐ subCategory 추가
                thumbnail: data.thumbnail || 'assets/images/thumbnails/default-thumbnail.jpg',
                videoUrl: data.videoUrl || ''
            });
        });

        videos.sort((a, b) => {
            const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(a.dateObj);
            const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(b.dateObj);
            return dateB - dateA;
        });
        
        console.log('7. 최종 변환된 비디오 개수:', videos.length);
        console.log('8. 변환된 비디오 목록:', videos);
        console.log('=== 데이터 가져오기 완료 ===\n');
        
        return videos;
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
        console.error('오류 상세:', error.message);
        console.error('오류 코드:', error.code);
        return [];
    }
}

/**
 * 목회자 컬럼 리스트 렌더링
 */
function renderColumnList(columns, page = 1) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;

    // ⭐ 연도 필터링
    let filteredColumns = columns;
    if (currentSubCategory) {
        const yearOnly = currentSubCategory.replace('년', '');
        filteredColumns = columns.filter(column => column.year === yearOnly);
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageColumns = filteredColumns.slice(startIndex, endIndex);

    if (pageColumns.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <div class="empty-state-text">아직 등록된 컬럼이 없습니다.</div>
            </div>
        `;
        return;
    }

    // ⭐ 리스트 형식으로 렌더링
    videoGrid.innerHTML = `
        <div class="column-list">
            ${pageColumns.map((column, index) => `
                <div class="column-item ${index === 2 ? 'featured' : ''}">
                    <div class="column-number">${String(startIndex + index + 1).padStart(2, '0')}.</div>
                    <div class="column-title">${column.title}</div>
                    <button class="column-download-btn" onclick="downloadColumn('${column.downloadUrl}', '${column.title}')">
                        다운받기
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                            <path d="M6.66699 10.0003L10.0003 13.3337M10.0003 13.3337L13.3337 10.0003M10.0003 13.3337V6.66699M18.3337 10.0003C18.3337 14.6027 14.6027 18.3337 10.0003 18.3337C5.39795 18.3337 1.66699 14.6027 1.66699 10.0003C1.66699 5.39795 5.39795 1.66699 10.0003 1.66699C14.6027 1.66699 18.3337 5.39795 18.3337 10.0003Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `).join('')}
        </div>
    `;

    // ⭐ 페이지네이션 업데이트
    renderPagination(filteredColumns.length, page);
}

/**
 * 컬럼 다운로드
 */
window.downloadColumn = function(url, title) {
    if (!url) {
        alert('다운로드 URL이 없습니다.');
        return;
    }
    
    // 새 창에서 열기 (다운로드)
    window.open(url, '_blank');
}

/**
 * 비디오 그리드 렌더링
 */
function renderVideos(videos, page = 1) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('videoGrid 요소를 찾을 수 없습니다');
        return;
    }

    // ⭐ 서브카테고리 필터링
    let filteredVideos = videos;
    if (currentSubCategory) {
        filteredVideos = videos.filter(video => video.subCategory === currentSubCategory);
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVideos = filteredVideos.slice(startIndex, endIndex);

    if (pageVideos.length === 0) {
        videoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📹</div>
                <div class="empty-state-text">아직 등록된 영상이 없습니다.</div>
            </div>
        `;
        return;
    }

    videoGrid.innerHTML = pageVideos.map((video, index) => {
        const isFeatured = index === 4 && pageVideos.length > 4;
        const backgroundStyle = video.thumbnail ? `style="background-image: url('${video.thumbnail}');"` : '';
        
        // ⭐ weekly가 아닐 때만 subCategory 표시
        const showSubCategory = currentCategory !== 'weekly' && video.subCategory;
        
        return `
            <div class="video-card ${isFeatured ? 'featured' : ''}" ${backgroundStyle} onclick='playVideo(${JSON.stringify(video).replace(/'/g, "&apos;")})'>
                <div class="video-content">
                    ${showSubCategory ? `<div class="video-subcategory">${video.subCategory}</div>` : ''}
                    <div class="video-title">${video.title}</div>
                    ${video.description ? `
                        <div class="video-description-wrapper">
                            <span class="video-description">${video.description}</span>
                        </div>
                    ` : ''}
                    <div class="video-info">
                        <div class="video-date">${video.date}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // ⭐ 필터링된 결과로 페이지네이션 업데이트
    renderPagination(filteredVideos.length, page);
}

/**
 * 서브메뉴 생성 (weekly 제외한 모든 카테고리)
 */
function renderSubMenu() {
    const subMenu = document.getElementById('subMenu');
    const subMenuItems = document.getElementById('subMenuItems');
    const worshipTabs = document.querySelector('.worship-tabs');
    
    if (!subMenu || !subMenuItems || !worshipTabs) return;
    
    // ⭐ weekly는 서브메뉴 없음
    if (currentCategory === 'weekly') {
        subMenu.style.display = 'none';
        worshipTabs.classList.remove('has-submenu');
        console.log('✅ 서브메뉴 숨김 - has-submenu 제거됨');
        return;
    }
    
    // ⭐ 현재 카테고리의 고정 서브카테고리 목록 가져오기
    const subCategories = SUB_CATEGORIES[currentCategory] || [];
    
    if (subCategories.length === 0) {
        subMenu.style.display = 'none';
        worshipTabs.classList.remove('has-submenu');
        console.log('✅ 서브카테고리 없음 - has-submenu 제거됨');
        return;
    }
    
    // 서브메뉴 표시
    subMenu.style.display = 'block';
    worshipTabs.classList.add('has-submenu');
    console.log('✅ 서브메뉴 표시 - has-submenu 추가됨');
    
    // ⭐ 서브메뉴 아이템 생성 ('전체' 버튼 제거)
    let subMenuHTML = '';
    
    subCategories.forEach(subCategory => {
        subMenuHTML += `
            <div class="sub-menu-item ${currentSubCategory === subCategory ? 'active' : ''}" 
                 onclick="filterBySubCategory('${subCategory}')">
                ${subCategory}
            </div>
        `;
    });
    
    subMenuItems.innerHTML = subMenuHTML;
}

/**
 * 서브카테고리로 필터링
 */
window.filterBySubCategory = function(subCategory) {
    currentSubCategory = subCategory;
    currentPage = 1; // 페이지 초기화
    
    // ⭐ column일 때는 리스트 렌더링
    if (currentCategory === 'column') {
        renderColumnList(allVideos, currentPage);
    } else {
        renderVideos(allVideos, currentPage);
    }
    
    renderSubMenu(); // ⭐ 파라미터 제거
    
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
 * 페이지네이션 렌더링
 */
function renderPagination(totalItems, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    totalPages = Math.ceil(totalItems / itemsPerPage);

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
    
    // ⭐ column일 때는 리스트 렌더링
    if (currentCategory === 'column') {
        renderColumnList(allVideos, currentPage);
    } else {
        renderVideos(allVideos, currentPage);
    }
    
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
    
    // ⭐ 그리드 뷰와 헤더 모두 숨기기
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
    
    // ⭐ 헤더와 그리드 뷰 다시 표시
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
 * 카테고리 변경
 */
async function changeCategory(category) {
    if (currentCategory === category) return;

    currentCategory = category;
    currentPage = 1;
    currentSubCategory = null; // ⭐ 서브카테고리 필터 초기화

    document.querySelectorAll('.worship-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    // 상세 뷰가 열려있으면 닫기
    backToList();

    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }
    
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
    }

    // ⭐ 목회자 컬럼은 다른 데이터 소스 사용
    if (category === 'column') {
        allVideos = await fetchColumns();
        renderColumnList(allVideos, currentPage);
    } else {
        allVideos = await fetchVideos(category);
        renderVideos(allVideos, currentPage);
    }
    
    renderSubMenu(); // ⭐ 파라미터 제거
}

/**
 * 초기화
 */
export async function initKoreanWorship() {
    console.log('🚀 initKoreanWorship() 실행');
    
    const tabs = document.querySelectorAll('.worship-tab');
    console.log('탭 개수:', tabs.length);
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('탭 클릭:', tab.dataset.category);
            changeCategory(tab.dataset.category);
        });
    });

    console.log('🔥 초기 데이터 로드 시작...');
    
    // ⭐ 초기 카테고리에 따라 다른 데이터 로드
    if (currentCategory === 'column') {
        allVideos = await fetchColumns();
        renderColumnList(allVideos, currentPage);
    } else {
        allVideos = await fetchVideos(currentCategory);
        renderVideos(allVideos, currentPage);
    }
    
    console.log('📦 로드된 데이터:', allVideos);
    
    renderSubMenu(); // ⭐ 파라미터 제거
    
    console.log('✅ 초기화 완료!');
}