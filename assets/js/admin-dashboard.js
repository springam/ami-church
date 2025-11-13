// admin-dashboard.js - 새로운 디자인
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { checkAdminSession, logout } from './admin-auth.js';

console.log('📊 admin-dashboard.js 로드됨');

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 전역 변수
let allVideos = [];
let filteredVideos = [];
let currentPage = 1;
const itemsPerPage = 10;
let videoToDelete = null; // 삭제할 비디오 ID

/**
 * Timestamp를 날짜 문자열로 변환
 */
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    if (timestamp.toDate) {
        const date = timestamp.toDate();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    }
    
    return '';
}

/**
 * 카테고리 이름 변환 - category + subCategory + detailCategory 조합
 */
function getCategoryName(video) {
    const categoryNames = {
        'sunday': '주일예배',
        'aba': 'ABA',
        'avs': 'AVS/AVCK'
    };
    
    const subCategoryNames = {
        'weekly': '이번주설교',
        'scripture': '성서강해설교',
        'topic': '주제별설교',
        'column': '목회자칼럼',
        'avs': 'AVS',
        'avck': 'AVCK'
    };
    
    let result = categoryNames[video.category] || video.category;
    
    if (video.subCategory) {
        result += ' > ' + (subCategoryNames[video.subCategory] || video.subCategory);
    }
    
    if (video.detailCategory) {
        result += ' > ' + video.detailCategory;
    }
    
    return result;
}

/**
 * YouTube URL 축약
 */
function shortenUrl(url) {
    if (!url) return '';
    if (url.length <= 30) return url;
    return url.substring(0, 27) + '...';
}

/**
 * Firestore에서 동영상 목록 가져오기
 */
async function fetchVideos() {
    try {
        console.log('📥 동영상 목록 로드 시작...');
        
        const videosRef = collection(db, 'video');
        const q = query(videosRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allVideos = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            allVideos.push({
                id: docSnapshot.id,
                ...data,
                status: data.status || 'inactive' // status 필드 사용
            });
        });
        
        console.log('✅ 동영상 로드 완료:', allVideos.length, '개');
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ 동영상 로드 오류:', error);
        showEmptyState('동영상 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 필터 적용 (검색 + 카테고리)
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subCategory = document.getElementById('categoryFilter').value;
    
    filteredVideos = allVideos.filter(video => {
        const matchesSearch = !searchTerm || video.title.toLowerCase().includes(searchTerm);
        const matchesCategory = !subCategory || video.subCategory === subCategory;
        return matchesSearch && matchesCategory;
    });
    
    console.log('🔍 필터링 결과:', filteredVideos.length, '개');
    
    currentPage = 1;
    renderTable();
    renderPagination();
}

/**
 * 테이블 렌더링
 */
function renderTable() {
    const tbody = document.getElementById('videoTableBody');
    
    if (filteredVideos.length === 0) {
        showEmptyState('등록된 동영상이 없습니다.');
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageVideos = filteredVideos.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageVideos.map(video => `
        <tr data-video-id="${video.id}">
            <td class="video-title-cell">${video.title || '제목 없음'}</td>
            <td>${getCategoryName(video)}</td>
            <td class="video-url-cell" title="${video.videoUrl || ''}">${shortenUrl(video.videoUrl)}</td>
            <td>${formatDate(video.date)}</td>
            <td>
                <select class="status-select" data-video-id="${video.id}">
                    <option value="inactive" ${video.status === 'inactive' ? 'selected' : ''}>비활성</option>
                    <option value="active" ${video.status === 'active' ? 'selected' : ''}>활성</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn edit-btn" onclick="editVideo('${video.id}')">
                        <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteVideo('${video.id}')">
                        <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', handleStatusChange);
    });
}

/**
 * 빈 상태 표시
 */
function showEmptyState(message) {
    const tbody = document.getElementById('videoTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                <div class="empty-state-icon">📹</div>
                <div class="empty-state-text">${message}</div>
            </td>
        </tr>
    `;
    
    document.getElementById('pagination').innerHTML = '';
}

/**
 * 페이지네이션 렌더링
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `
        <button class="pagination-btn pagination-arrow" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L8 8L12 12M8 4L4 8L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <button class="pagination-btn pagination-arrow" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    html += `
        <button class="pagination-btn pagination-arrow" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <button class="pagination-btn pagination-arrow" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L8 8L4 12M8 4L12 8L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    
    pagination.innerHTML = html;
}

/**
 * 페이지 변경
 */
window.changePage = function(page) {
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    renderPagination();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * 상태 변경
 */
async function handleStatusChange(e) {
    const videoId = e.target.dataset.videoId;
    const newStatus = e.target.value; // 'active' 또는 'inactive'
    
    try {
        const videoRef = doc(db, 'video', videoId);
        await updateDoc(videoRef, { status: newStatus });
        
        console.log('✅ 상태 변경 완료:', videoId, newStatus);
        
        const video = allVideos.find(v => v.id === videoId);
        if (video) {
            video.status = newStatus;
        }
        
    } catch (error) {
        console.error('❌ 상태 변경 오류:', error);
        alert('상태 변경에 실패했습니다.');
        // 원래 값으로 복원
        e.target.value = e.target.value === 'active' ? 'inactive' : 'active';
    }
}

/**
 * 동영상 수정
 */
window.editVideo = function(videoId) {
    window.location.href = `admin-add.html?edit=${videoId}`;
};

/**
 * 삭제 모달 표시
 */
function showDeleteModal(videoId) {
    videoToDelete = videoId;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ 삭제 모달 표시:', videoId);
    }
}

/**
 * 삭제 모달 숨김
 */
function hideDeleteModal() {
    videoToDelete = null;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ 삭제 모달 숨김');
    }
}

/**
 * 동영상 삭제 버튼 클릭
 */
window.deleteVideo = function(videoId) {
    console.log('🗑️ 삭제 버튼 클릭:', videoId);
    showDeleteModal(videoId);
};

/**
 * 실제 삭제 처리
 */
async function confirmDelete() {
    if (!videoToDelete) return;
    
    const video = allVideos.find(v => v.id === videoToDelete);
    
    if (!video) {
        alert('동영상을 찾을 수 없습니다.');
        hideDeleteModal();
        return;
    }
    
    try {
        console.log('🗑️ 삭제 처리 시작:', videoToDelete);
        const videoRef = doc(db, 'video', videoToDelete);
        await deleteDoc(videoRef);
        
        console.log('✅ 동영상 삭제 완료');
        alert('동영상이 삭제되었습니다.');
        
        hideDeleteModal();
        await fetchVideos();
        
    } catch (error) {
        console.error('❌ 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
        hideDeleteModal();
    }
}

/**
 * 페이지 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM 로드 완료 (대시보드)');
    
    // 세션 확인
    const adminUser = checkAdminSession();
    if (!adminUser) {
        console.log('⏸️ 세션 없음 - 초기화 중단');
        return;
    }
    
    console.log('👤 로그인 사용자:', adminUser.name);
    
    // ✅ 삭제 모달 이벤트 리스너
    const deleteModal = document.getElementById('deleteModal');
    
    if (deleteModal) {
        console.log('✅ 삭제 모달 찾음');
        
        // X 버튼
        const modalClose = deleteModal.querySelector('#modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                console.log('✅ X 버튼 클릭');
                hideDeleteModal();
            });
        }
        
        // 오버레이
        const overlay = deleteModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                console.log('✅ 오버레이 클릭');
                hideDeleteModal();
            });
        }
        
        // 취소 버튼
        const cancelBtn = deleteModal.querySelector('#cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('✅ 취소 버튼 클릭');
                hideDeleteModal();
            });
        }
        
        // 삭제 버튼
        const confirmDeleteBtn = deleteModal.querySelector('#confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                console.log('✅ 삭제 확인 버튼 클릭');
                confirmDelete();
            });
        }
    } else {
        console.error('❌ 삭제 모달을 찾을 수 없음');
    }
    
    // 검색 입력
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // 검색 버튼
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    // 카테고리 필터
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // 동영상 목록 로드
    await fetchVideos();
});