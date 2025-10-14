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
 * Firestore에서 영상 데이터 가져오기
 */
async function fetchVideos(category) {
    try {
        console.log('=== 데이터 가져오기 시작 ===');
        console.log('1. 카테고리:', category);
        console.log('2. Firestore DB 연결 상태:', db ? 'OK' : 'FAIL');
        
        const videosRef = collection(db, 'video');
        console.log('3. 컬렉션 참조 생성:', videosRef ? 'OK' : 'FAIL');
        
        // 임시: orderBy 제거하고 where만 사용 (인덱스 불필요)
        const q = query(
            videosRef,
            where('category', '==', category)
            // orderBy('date', 'desc')  // 임시로 주석 처리
        );
        console.log('4. 쿼리 생성 완료 (임시: orderBy 제거됨)');

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
                dateObj: data.date, // 정렬용 원본 날짜 저장
                category: data.category,
                preacher: data.preacher || '',
                description: data.description || '',
                thumbnail: data.thumbnail || 'assets/images/thumbnails/default-thumbnail.jpg',
                videoUrl: data.videoUrl || ''
            });
        });

        // 클라이언트 측에서 날짜 역순으로 정렬
        videos.sort((a, b) => {
            const dateA = a.dateObj?.toDate ? a.dateObj.toDate() : new Date(a.dateObj);
            const dateB = b.dateObj?.toDate ? b.dateObj.toDate() : new Date(b.dateObj);
            return dateB - dateA; // 최신순 정렬
        });
        
        console.log('7. 최종 변환된 비디오 개수:', videos.length);
        console.log('8. 변환된 비디오 목록 (날짜 역순 정렬됨):', videos);
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
 * 비디오 카드 렌더링
 */
function renderVideos(videos, page = 1) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('videoGrid 요소를 찾을 수 없습니다');
        return;
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVideos = videos.slice(startIndex, endIndex);

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
        return `
            <div class="video-card ${isFeatured ? 'featured' : ''}" onclick='playVideo(${JSON.stringify(video).replace(/'/g, "&apos;")})'>
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" onerror="this.src='assets/images/thumbnails/default-thumbnail.png'">
                <div class="video-content">
                    <div class="video-title">${video.title}</div>
                    <div class="video-info">
                        ${video.preacher ? `<div class="video-preacher">${video.preacher}</div>` : '<div></div>'}
                        <div class="video-date">${video.date}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
    renderVideos(allVideos, currentPage);
    renderPagination(allVideos.length, currentPage);
    
    const worshipContainer = document.querySelector('.worship-container');
    if (worshipContainer) {
        worshipContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * 비디오 모달 열기
 */
window.playVideo = function(video) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalIframe');
    const title = document.getElementById('modalTitle');
    const preacher = document.getElementById('modalPreacher');
    const date = document.getElementById('modalDate');
    const description = document.getElementById('modalDescription');

    if (!modal) {
        console.error('videoModal을 찾을 수 없습니다');
        return;
    }

    title.textContent = video.title;
    preacher.textContent = video.preacher ? `설교자: ${video.preacher}` : '';
    date.textContent = video.date;
    description.textContent = video.description || '설교 내용이 등록되지 않았습니다.';
    
    const embedUrl = getYouTubeEmbedUrl(video.videoUrl);
    iframe.src = embedUrl;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * 비디오 모달 닫기
 */
window.closeVideoModal = function() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalIframe');
    
    if (!modal) return;
    
    iframe.src = '';
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * 카테고리 변경
 */
async function changeCategory(category) {
    if (currentCategory === category) return;

    currentCategory = category;
    currentPage = 1;

    document.querySelectorAll('.worship-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = '<div class="loading">콘텐츠를 불러오는 중...</div>';
    }
    
    const pagination = document.getElementById('pagination');
    if (pagination) {
        pagination.innerHTML = '';
    }

    allVideos = await fetchVideos(category);
    renderVideos(allVideos, currentPage);
    renderPagination(allVideos.length, currentPage);
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

    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'videoModal') {
                closeVideoModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });

    console.log('📥 초기 데이터 로드 시작...');
    allVideos = await fetchVideos(currentCategory);
    console.log('📦 로드된 비디오:', allVideos);
    
    renderVideos(allVideos, currentPage);
    renderPagination(allVideos.length, currentPage);
    
    console.log('✅ 초기화 완료!');
}