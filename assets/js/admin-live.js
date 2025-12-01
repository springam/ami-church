// admin-live.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { checkAdminSession } from './admin-auth.js';

console.log('📝 admin-live.js 로드됨');

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

const LIVE_CONFIG_DOC_ID = 'liveConfig'; // 고정 문서 ID

/**
 * 라이브 설정 로드
 */
async function loadLiveConfig() {
    try {
        console.log('📂 라이브 설정 로드 시작...');

        const liveRef = doc(db, 'settings', LIVE_CONFIG_DOC_ID);
        const liveSnap = await getDoc(liveRef);

        if (liveSnap.exists()) {
            const data = liveSnap.data();
            console.log('✅ 라이브 설정 로드 완료:', data);

            // 폼에 데이터 채우기
            document.getElementById('isLiveActive').checked = data.isLiveActive || false;
            document.getElementById('liveUrl').value = data.liveUrl || '';
            document.getElementById('dayOfWeek').value = data.liveSchedule?.dayOfWeek || 0;
            document.getElementById('startTime').value = data.liveSchedule?.startTime || '10:45';
            document.getElementById('endTime').value = data.liveSchedule?.endTime || '13:00';

            updateToggleLabel();
            updateLiveStatus();
        } else {
            console.log('⚠️ 라이브 설정이 없습니다. 기본값 사용');
            // 기본값 설정 (이미 HTML에 설정됨)
            updateToggleLabel();
            updateLiveStatus();
        }

    } catch (error) {
        console.error('❌ 라이브 설정 로드 오류:', error);
        alert('라이브 설정을 불러오는데 실패했습니다.');
    }
}

/**
 * 토글 라벨 업데이트
 */
function updateToggleLabel() {
    const isActive = document.getElementById('isLiveActive').checked;
    const label = document.getElementById('toggleLabel');
    label.textContent = isActive ? '활성화' : '비활성화';
    label.style.color = isActive ? '#4CAF50' : '#999';
}

/**
 * 현재 라이브 상태 확인 및 표시
 */
function updateLiveStatus() {
    const isActive = document.getElementById('isLiveActive').checked;
    const dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const statusDiv = document.getElementById('liveStatus');

    if (!isActive) {
        statusDiv.innerHTML = '<span class="status-text status-inactive">라이브 기능 비활성화</span>';
        return;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isLiveDay = currentDay === dayOfWeek;
    const isLiveTime = currentTime >= startTime && currentTime < endTime;

    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    if (isLiveDay && isLiveTime) {
        statusDiv.innerHTML = `
            <span class="status-text status-live">🔴 현재 라이브 방송 중</span>
            <small>${dayNames[dayOfWeek]} ${startTime} ~ ${endTime}</small>
        `;
    } else {
        statusDiv.innerHTML = `
            <span class="status-text status-scheduled">다음 방송: ${dayNames[dayOfWeek]} ${startTime} ~ ${endTime}</span>
        `;
    }
}

/**
 * 폼 제출 처리
 */
async function handleSubmit(e) {
    e.preventDefault();

    const isLiveActive = document.getElementById('isLiveActive').checked;
    const liveUrl = document.getElementById('liveUrl').value.trim();
    const dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    // 유효성 검사
    if (isLiveActive && !liveUrl) {
        alert('라이브 URL을 입력하세요.');
        document.getElementById('liveUrl').focus();
        return;
    }

    if (isLiveActive && liveUrl && !isValidYouTubeUrl(liveUrl)) {
        alert('올바른 YouTube URL을 입력하세요.\n예: https://www.youtube.com/embed/VIDEO_ID');
        document.getElementById('liveUrl').focus();
        return;
    }

    if (!startTime || !endTime) {
        alert('시작 시간과 종료 시간을 입력하세요.');
        return;
    }

    if (startTime >= endTime) {
        alert('종료 시간은 시작 시간보다 늦어야 합니다.');
        return;
    }

    try {
        const liveConfig = {
            isLiveActive: isLiveActive,
            liveUrl: liveUrl,
            liveSchedule: {
                dayOfWeek: dayOfWeek,
                startTime: startTime,
                endTime: endTime
            },
            updatedAt: Timestamp.now()
        };

        const liveRef = doc(db, 'settings', LIVE_CONFIG_DOC_ID);
        await setDoc(liveRef, liveConfig, { merge: true });

        console.log('✅ 라이브 설정 저장 완료:', liveConfig);
        alert('라이브 설정이 저장되었습니다.');

        updateLiveStatus();

    } catch (error) {
        console.error('❌ 저장 오류:', error);
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * YouTube URL 유효성 검사
 */
function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]+/
    ];

    return patterns.some(pattern => pattern.test(url));
}

/**
 * 취소 모달 표시
 */
function showCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * 취소 모달 숨김
 */
function hideCancelModal() {
    const modal = document.getElementById('cancelModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * 페이지 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM 로드 완료 (라이브 설정 페이지)');

    const adminUser = checkAdminSession();
    if (!adminUser) {
        console.log('⏸️ 세션 없음 - 초기화 중단');
        return;
    }

    console.log('👤 로그인 사용자:', adminUser.name);

    // 라이브 설정 로드
    await loadLiveConfig();

    // 토글 스위치 이벤트
    const isLiveActive = document.getElementById('isLiveActive');
    if (isLiveActive) {
        isLiveActive.addEventListener('change', () => {
            updateToggleLabel();
            updateLiveStatus();
        });
    }

    // 폼 필드 변경 시 상태 업데이트
    ['dayOfWeek', 'startTime', 'endTime'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateLiveStatus);
        }
    });

    // 폼 제출 이벤트
    const form = document.getElementById('liveForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // 취소 버튼
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', showCancelModal);
    }

    // 모달 이벤트 리스너
    const modal = document.getElementById('cancelModal');
    const modalClose = modal?.querySelector('#modalClose');
    const modalCancel = modal?.querySelector('#modalCancel');
    const confirmCancelBtn = modal?.querySelector('#confirmCancelBtn');

    if (modalClose) {
        modalClose.addEventListener('click', hideCancelModal);
    }

    if (modalCancel) {
        modalCancel.addEventListener('click', hideCancelModal);
    }

    const overlay = modal?.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', hideCancelModal);
    }

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            window.location.href = 'admin-dashboard.html';
        });
    }

    // 1분마다 상태 업데이트
    setInterval(updateLiveStatus, 60000);
});
