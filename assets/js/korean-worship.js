// korean-worship.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
let currentVideoIndex = -1;

// ⭐ subCategory별 detailCategory 설정
const DETAIL_CATEGORIES = {
    weekly: [], // 이번주 설교는 detailCategory 없음
    scripture: [
        '욥기서', '요나서', '마태복음 5장', '마태복음 13장', '마태복음 16장', 
        '누가복음', '요한복음', '사도행전', '로마서', '로마서 9장~11장', 
        '고린도 전서', '빌립보서', '빌레몬서', '야고보서'
    ],
    topic: [
        '여자의 후손', '기독론', '성전', '천사', '기도', '격려', '전도론', 
        '주기도문', '파라독스', '감람산', '아리랑족속', '저주와 복', '엘로힘', 
        '바울', '하나님을 아는 자식', '천사학', '이스라엘', '기타'
    ],
    column: [] // 목회자 칼럼은 detailCategory 없음
};

/**
 * YouTube URL을 임베드 URL로 변환
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    
    // youtu.be 짧은 URL
    let match = url.match(/youtu\.be\/([^?]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // 일반 watch URL
    match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // 라이브 URL
    match = url.match(/youtube\.com\/live\/([^?]+)/);
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
 * Firestore에서 영상 데이터 가져오기
 * 주일 예배 카테고리에서 subCategory와 detailCategory로 필터링
 */
async function fetchVideos(subCategory, detailCategory = null) {
    try {
        console.log('=== 데이터 가져오기 시작 ===');
        console.log('1. subCategory:', subCategory);
        console.log('2. detailCategory:', detailCategory);
        console.log('3. Firestore DB 연결 상태:', db ? 'OK' : 'FAIL');
        
        const videosRef = collection(db, 'video');
        console.log('4. 컬렉션 참조 생성:', videosRef ? 'OK' : 'FAIL');
        
        // ⭐ 단순 쿼리로 변경 - category만 필터링하고 나머지는 클라이언트에서 처리
        let q = query(
            videosRef,
            where('category', '==', 'sunday')
        );
        console.log('5. 쿼리 생성 완료');

        const querySnapshot = await getDocs(q);
        console.log('6. 쿼리 실행 완료 - 문서 개수:', querySnapshot.size);
        
        const videos = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('7. 문서 데이터:', {
                id: doc.id,
                title: data.title,
                category: data.category,
                subCategory: data.subCategory,
                detailCategory: data.detailCategory,
                status: data.status,
                date: data.date
            });

            // ⭐ 클라이언트 측 필터링
            // 1. subCategory 체크
            if (data.subCategory !== subCategory) {
                return;
            }
            
            // 2. status 체크 (active만 표시)
            if (data.status !== 'active') {
                console.log('   ⏭️ 비활성 상태로 스킵:', data.title);
                return;
            }
            
            // 3. detailCategory 체크 (필터가 있는 경우)
            if (detailCategory && data.detailCategory !== detailCategory) {
                return;
            }
            
            // 모든 조건을 만족하면 추가
            videos.push({
                id: doc.id,
                title: data.title || '제목 없음',
                date: formatDate(data.date),
                dateObj: data.date,
                category: data.category,
                subCategory: data.subCategory || '',
                detailCategory: data.detailCategory || '',
                preacher: data.preacher || '',
                description: data.description || '',
                thumbnail: data.thumbnail || 'assets/images/thumbnails/default-thumbnail.jpg',
                videoUrl: data.videoUrl || ''
            });
        });

        // 날짜 역순 정렬
        videos.sort((a, b) => {
            const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(a.dateObj);
            const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(b.dateObj);
            return dateB - dateA;
        });
        
        console.log('8. 최종 변환된 비디오 개수:', videos.length);
        console.log('9. 변환된 비디오 목록:', videos);
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
    
    subMenuItems.innerHTML = `
        <div class="sub-menu-item ${!currentDetailCategory ? 'active' : ''}" onclick="changeDetailCategory(null)">
            전체
        </div>
        ${detailCategories.map(category => `
            <div class="sub-menu-item ${currentDetailCategory === category ? 'active' : ''}" 
                 onclick="changeDetailCategory('${category}')">
                ${category}
            </div>
        `).join('')}
    `;
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
window.changeDetailCategory = async function(detailCategory) {
    if (currentDetailCategory === detailCategory) return;

    currentDetailCategory = detailCategory;
    currentPage = 1;

    // 서브메뉴 활성화 상태 변경
    document.querySelectorAll('.sub-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (detailCategory === null) {
        document.querySelector('.sub-menu-item:first-child')?.classList.add('active');
    }

    // 로딩 표시
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }

    // 데이터 로드
    allVideos = await fetchVideos(currentSubCategory, detailCategory);
    renderVideos(allVideos, currentPage);
}

/**
 * 초기화
 */
export async function initKoreanWorship() {
    console.log('🚀 initKoreanWorship() 실행');
    
    // worship-tabs 이벤트 리스너
    const tabs = document.querySelectorAll('.worship-tab');
    console.log('탭 개수:', tabs.length);
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('탭 클릭:', tab.dataset.category);
            changeSubCategory(tab.dataset.category);
        });
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