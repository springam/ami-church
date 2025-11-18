// admin-dashboard.js - 모달 기반으로 변경
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
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
let videoToDelete = null;

// ⭐ 드래그 앤 드롭 관련 변수
let isOrderMode = false;
let sortableInstance = null;
let originalOrder = [];

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
 * 카테고리 이름 변환
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
        const q = query(videosRef, orderBy('orderNumber', 'asc'));
        const querySnapshot = await getDocs(q);
        
        allVideos = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            allVideos.push({
                id: docSnapshot.id,
                ...data,
                status: data.status || 'inactive',
                orderNumber: data.orderNumber || 999999
            });
        });
        
        allVideos.sort((a, b) => {
            if (a.orderNumber !== b.orderNumber) {
                return a.orderNumber - b.orderNumber;
            }
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(0);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
            return dateB - dateA;
        });
        
        console.log('✅ 동영상 로드 완료:', allVideos.length, '개');
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ 동영상 로드 오류:', error);
        showEmptyState('동영상 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 필터 적용
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subCategory = document.getElementById('subCategoryFilter').value;
    
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
 * ⭐ 테이블 렌더링
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
    
    tbody.innerHTML = pageVideos.map((video, index) => `
        <tr data-video-id="${video.id}" ${isOrderMode ? 'class="draggable"' : ''}>
            <td class="order-column">
                ${isOrderMode ? `
                    <div class="drag-handle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </div>
                ` : `${startIndex + index + 1}`}
            </td>
            <td class="video-title-cell">${video.title || '제목 없음'}</td>
            <td>${getCategoryName(video)}</td>
            <td class="video-url-cell" title="${video.videoUrl || ''}">${shortenUrl(video.videoUrl)}</td>
            <td>${formatDate(video.date)}</td>
            <td>
                <select class="status-select" data-video-id="${video.id}" ${isOrderMode ? 'disabled' : ''}>
                    <option value="inactive" ${video.status === 'inactive' ? 'selected' : ''}>비활성</option>
                    <option value="active" ${video.status === 'active' ? 'selected' : ''}>활성</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="icon-btn edit-btn" onclick="editVideo('${video.id}')" ${isOrderMode ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M2.5 21.5003L8.04927 19.366C8.40421 19.2295 8.58168 19.1612 8.74772 19.0721C8.8952 18.9929 9.0358 18.9015 9.16804 18.7989C9.31692 18.6834 9.45137 18.5489 9.72028 18.28L21 7.0003C22.1046 5.89574 22.1046 4.10487 21 3.0003C19.8955 1.89573 18.1046 1.89573 17 3.0003L5.72028 14.28C5.45138 14.5489 5.31692 14.6834 5.20139 14.8323C5.09877 14.9645 5.0074 15.1051 4.92823 15.2526C4.83911 15.4186 4.77085 15.5961 4.63433 15.951L2.5 21.5003ZM2.5 21.5003L4.55812 16.1493C4.7054 15.7663 4.77903 15.5749 4.90534 15.4872C5.01572 15.4105 5.1523 15.3816 5.2843 15.4068C5.43533 15.4356 5.58038 15.5807 5.87048 15.8708L8.12957 18.1299C8.41967 18.4199 8.56472 18.565 8.59356 18.716C8.61877 18.848 8.58979 18.9846 8.51314 19.095C8.42545 19.2213 8.23399 19.2949 7.85107 19.4422L2.5 21.5003Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteVideo('${video.id}')" ${isOrderMode ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7 1H13M1 4H19M17 4L16.2987 14.5193C16.1935 16.0975 16.1409 16.8867 15.8 17.485C15.4999 18.0118 15.0472 18.4353 14.5017 18.6997C13.882 19 13.0911 19 11.5093 19H8.49065C6.90891 19 6.11803 19 5.49834 18.6997C4.95276 18.4353 4.50009 18.0118 4.19998 17.485C3.85911 16.8867 3.8065 16.0975 3.70129 14.5193L3 4M8 8.5V13.5M12 8.5V13.5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    if (!isOrderMode) {
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', handleStatusChange);
        });
    }
    
    if (isOrderMode) {
        initSortable();
    }
}

/**
 * ⭐ Sortable.js 초기화
 */
function initSortable() {
    const tbody = document.getElementById('videoTableBody');
    
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    sortableInstance = new Sortable(tbody, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
            console.log('✅ 드래그 완료:', evt.oldIndex, '→', evt.newIndex);
        }
    });
}

/**
 * ⭐ 순서 변경 모드 토글
 */
function toggleOrderMode() {
    isOrderMode = !isOrderMode;
    
    const orderModeBtn = document.getElementById('orderModeBtn');
    const orderModeNotice = document.getElementById('orderModeNotice');
    
    if (isOrderMode) {
        orderModeBtn.classList.add('active');
        orderModeNotice.style.display = 'flex';
        originalOrder = filteredVideos.map(v => v.id);
        console.log('🔄 순서 변경 모드 활성화');
    } else {
        orderModeBtn.classList.remove('active');
        orderModeNotice.style.display = 'none';
        
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }
        
        console.log('✅ 순서 변경 모드 비활성화');
    }
    
    renderTable();
    renderPagination();
}

/**
 * ⭐ 취소 버튼 클릭 - 모달 표시
 */
function showCancelOrderModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * ⭐ 취소 모달 숨김
 */
function hideCancelOrderModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * ⭐ 취소 확인
 */
function confirmCancelOrder() {
    hideCancelOrderModal();
    toggleOrderMode();
    renderTable();
}

/**
 * ⭐ 완료 버튼 클릭 - 저장 모달 표시
 */
function showSaveOrderModal() {
    const modal = document.getElementById('saveOrderModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * ⭐ 저장 모달 숨김
 */
function hideSaveOrderModal() {
    const modal = document.getElementById('saveOrderModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * ⭐ 순서 변경 저장
 */
async function saveOrder() {
    try {
        console.log('💾 순서 변경 저장 시작...');
        
        const tbody = document.getElementById('videoTableBody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const newOrder = rows.map(row => row.dataset.videoId);
        
        console.log('📋 새로운 순서:', newOrder);
        
        const batch = writeBatch(db);
        
        newOrder.forEach((videoId, index) => {
            const videoRef = doc(db, 'video', videoId);
            const startIndex = (currentPage - 1) * itemsPerPage;
            batch.update(videoRef, { 
                orderNumber: startIndex + index + 1 
            });
        });
        
        await batch.commit();
        
        console.log('✅ 순서 변경 저장 완료');
        
        hideSaveOrderModal();
        toggleOrderMode();
        await fetchVideos();
        
        alert('순서가 저장되었습니다.');
        
    } catch (error) {
        console.error('❌ 순서 저장 오류:', error);
        hideSaveOrderModal();
        alert('순서 저장에 실패했습니다.');
    }
}

/**
 * 빈 상태 표시
 */
function showEmptyState(message) {
    const tbody = document.getElementById('videoTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
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
        <button class="pagination-btn pagination-arrow" onclick="changePage(1)" ${currentPage === 1 || isOrderMode ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L8 8L12 12M8 4L4 8L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <button class="pagination-btn pagination-arrow" onclick="changePage(${currentPage - 1})" ${currentPage === 1 || isOrderMode ? 'disabled' : ''}>
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
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})" ${isOrderMode ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }
    
    html += `
        <button class="pagination-btn pagination-arrow" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages || isOrderMode ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
        <button class="pagination-btn pagination-arrow" onclick="changePage(${totalPages})" ${currentPage === totalPages || isOrderMode ? 'disabled' : ''}>
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
    if (page < 1 || page > totalPages || isOrderMode) return;
    
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
    const newStatus = e.target.value;
    
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
        e.target.value = e.target.value === 'active' ? 'inactive' : 'active';
    }
}

/**
 * 동영상 수정
 */
window.editVideo = function(videoId) {
    if (isOrderMode) return;
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
    }
}

/**
 * 동영상 삭제
 */
window.deleteVideo = function(videoId) {
    if (isOrderMode) return;
    showDeleteModal(videoId);
};

/**
 * 삭제 확인
 */
async function confirmDelete() {
    if (!videoToDelete) return;
    
    try {
        const videoRef = doc(db, 'video', videoToDelete);
        await deleteDoc(videoRef);
        
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
    
    const adminUser = checkAdminSession();
    if (!adminUser) {
        return;
    }
    
    // ⭐ 순서 변경 버튼 이벤트
    const orderModeBtn = document.getElementById('orderModeBtn');
    if (orderModeBtn) {
        orderModeBtn.addEventListener('click', toggleOrderMode);
    }
    
    // ⭐ 취소 버튼 클릭 - 모달 표시
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', showCancelOrderModal);
    }
    
    // ⭐ 완료 버튼 클릭 - 저장 모달 표시
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', showSaveOrderModal);
    }
    
    // ⭐ 취소 모달 이벤트
    const cancelOrderModal = document.getElementById('cancelOrderModal');
    if (cancelOrderModal) {
        const modalClose = cancelOrderModal.querySelector('#cancelOrderModalClose');
        const overlay = cancelOrderModal.querySelector('.modal-overlay');
        const cancelBtn = cancelOrderModal.querySelector('#cancelOrderModalCancel');
        const confirmBtn = cancelOrderModal.querySelector('#confirmCancelOrderBtn');
        
        if (modalClose) modalClose.addEventListener('click', hideCancelOrderModal);
        if (overlay) overlay.addEventListener('click', hideCancelOrderModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideCancelOrderModal);
        if (confirmBtn) confirmBtn.addEventListener('click', confirmCancelOrder);
    }
    
    // ⭐ 저장 모달 이벤트
    const saveOrderModal = document.getElementById('saveOrderModal');
    if (saveOrderModal) {
        const modalClose = saveOrderModal.querySelector('#saveOrderModalClose');
        const overlay = saveOrderModal.querySelector('.modal-overlay');
        const cancelBtn = saveOrderModal.querySelector('#saveOrderModalCancel');
        const confirmBtn = saveOrderModal.querySelector('#confirmSaveOrderBtn');
        
        if (modalClose) modalClose.addEventListener('click', hideSaveOrderModal);
        if (overlay) overlay.addEventListener('click', hideSaveOrderModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideSaveOrderModal);
        if (confirmBtn) confirmBtn.addEventListener('click', saveOrder);
    }
    
    // 삭제 모달 이벤트
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        const modalClose = deleteModal.querySelector('#modalClose');
        const overlay = deleteModal.querySelector('.modal-overlay');
        const cancelBtn = deleteModal.querySelector('#cancelBtn');
        const confirmDeleteBtn = deleteModal.querySelector('#confirmDeleteBtn');
        
        if (modalClose) modalClose.addEventListener('click', hideDeleteModal);
        if (overlay) overlay.addEventListener('click', hideDeleteModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideDeleteModal);
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // 검색 이벤트
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const subCategoryFilter = document.getElementById('subCategoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    if (subCategoryFilter) {
        subCategoryFilter.addEventListener('change', applyFilters);
    }
    
    await fetchVideos();
});