// admin-add.js - 동영상 추가/수정
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { checkAdminSession } from './admin-auth.js';

console.log('📝 admin-add.js 로드됨');

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
let isEditMode = false;
let editVideoId = null;

/**
 * URL에서 파라미터 가져오기
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 수정 모드: 기존 동영상 데이터 로드
 */
async function loadVideoData(videoId) {
    try {
        console.log('📥 동영상 데이터 로드:', videoId);
        
        const videoRef = doc(db, 'video', videoId);
        const videoSnap = await getDoc(videoRef);
        
        if (!videoSnap.exists()) {
            alert('동영상을 찾을 수 없습니다.');
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        const videoData = videoSnap.data();
        console.log('✅ 데이터 로드 완료:', videoData);
        
        // 폼에 데이터 채우기
        document.getElementById('videoTitle').value = videoData.title || '';
        document.getElementById('videoUrl').value = videoData.videoUrl || '';
        document.getElementById('category1').value = videoData.category || '';
        document.getElementById('videoDescription').value = videoData.description || '';
        
        // 페이지 제목 및 버튼 텍스트 변경
        document.getElementById('pageTitle').textContent = '동영상 수정하기';
        document.getElementById('submitBtn').textContent = '수정하기';
        
    } catch (error) {
        console.error('❌ 데이터 로드 오류:', error);
        alert('동영상 데이터를 불러오는데 실패했습니다.');
        window.location.href = 'admin-dashboard.html';
    }
}

/**
 * 폼 제출 처리
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    // 폼 데이터 수집
    const title = document.getElementById('videoTitle').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const category = document.getElementById('category1').value;
    const description = document.getElementById('videoDescription').value.trim();
    
    // 유효성 검사
    if (!title) {
        alert('동영상 제목을 입력하세요.');
        document.getElementById('videoTitle').focus();
        return;
    }
    
    if (!videoUrl) {
        alert('YouTube URL을 입력하세요.');
        document.getElementById('videoUrl').focus();
        return;
    }
    
    if (!category) {
        alert('카테고리를 선택하세요.');
        document.getElementById('category1').focus();
        return;
    }
    
    // YouTube URL 유효성 검사
    if (!isValidYouTubeUrl(videoUrl)) {
        alert('올바른 YouTube URL을 입력하세요.\n예: https://www.youtube.com/watch?v=VIDEO_ID');
        document.getElementById('videoUrl').focus();
        return;
    }
    
    // 동영상 데이터 객체
    const videoData = {
        title: title,
        videoUrl: videoUrl,
        category: category,
        description: description,
        status: 'inactive' // 기본값: 비활성
    };
    
    try {
        if (isEditMode) {
            // 수정 모드
            console.log('🔄 동영상 수정:', editVideoId);
            const videoRef = doc(db, 'video', editVideoId);
            await updateDoc(videoRef, videoData);
            console.log('✅ 수정 완료');
            alert('동영상이 수정되었습니다.');
        } else {
            // 추가 모드
            console.log('➕ 동영상 추가');
            videoData.date = Timestamp.now(); // 추가 시에만 날짜 추가
            await addDoc(collection(db, 'video'), videoData);
            console.log('✅ 추가 완료');
            alert('동영상이 추가되었습니다.');
        }
        
        // 목록 페이지로 이동
        window.location.href = 'admin-dashboard.html';
        
    } catch (error) {
        console.error('❌ 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
}

/**
 * YouTube URL 유효성 검사
 */
function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

/**
 * 취소 버튼
 */
function handleCancel() {
    if (confirm('작성중인 내용이 저장되지 않습니다.\n목록으로 돌아가시겠습니까?')) {
        window.location.href = 'admin-dashboard.html';
    }
}

/**
 * 페이지 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM 로드 완료 (추가/수정 페이지)');
    
    // 세션 확인
    const adminUser = checkAdminSession();
    if (!adminUser) {
        console.log('⏸️ 세션 없음 - 초기화 중단');
        return;
    }
    
    console.log('👤 로그인 사용자:', adminUser.name);
    
    // URL 파라미터 확인 (수정 모드인지 확인)
    editVideoId = getUrlParameter('edit');
    if (editVideoId) {
        isEditMode = true;
        console.log('📝 수정 모드:', editVideoId);
        await loadVideoData(editVideoId);
    } else {
        console.log('➕ 추가 모드');
    }
    
    // 폼 제출 이벤트
    const form = document.getElementById('videoForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // 취소 버튼
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
});