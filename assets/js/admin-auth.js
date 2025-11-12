// admin-auth.js - 관리자 로그인 인증
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log('🔐 admin-auth.js 로드됨');

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

/**
 * 세션 저장 - 혼합 방식
 */
function saveAdminSession(adminData, rememberMe) {
    const sessionData = {
        ...adminData,
        expiresAt: Date.now() + (30 * 60 * 1000) // 30분
    };
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('adminUser', JSON.stringify(sessionData));
    
    console.log('✅ 세션 저장 완료:', rememberMe ? 'localStorage' : 'sessionStorage');
}

/**
 * 세션 확인 (로그인 필요 페이지에서 사용)
 */
export function checkAdminSession() {
    console.log('🔍 세션 체크 시작...');
    
    // localStorage 먼저 확인
    let sessionStr = localStorage.getItem('adminUser');
    let storage = 'localStorage';
    
    // sessionStorage 확인
    if (!sessionStr) {
        sessionStr = sessionStorage.getItem('adminUser');
        storage = 'sessionStorage';
    }
    
    console.log('📦 세션 데이터:', sessionStr ? '있음' : '없음', `(${storage})`);
    
    if (!sessionStr) {
        console.log('❌ 세션 없음 - 로그인 페이지로 이동');
        // 무한 루프 방지: 이미 로그인 페이지면 리다이렉트 안함
        if (!window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
        return null;
    }
    
    try {
        const session = JSON.parse(sessionStr);
        console.log('📋 세션 정보:', session);
        
        // 세션 만료 확인
        if (!session.expiresAt || Date.now() > session.expiresAt) {
            console.log('⏰ 세션 만료 - 로그인 페이지로 이동');
            if (storage === 'localStorage') {
                localStorage.removeItem('adminUser');
            } else {
                sessionStorage.removeItem('adminUser');
            }
            // 무한 루프 방지
            if (!window.location.pathname.includes('admin-login.html')) {
                window.location.href = 'admin-login.html';
            }
            return null;
        }
        
        console.log('✅ 유효한 세션:', session.name);
        return session;
        
    } catch (error) {
        console.error('❌ 세션 파싱 오류:', error);
        // 잘못된 세션 데이터 삭제
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminUser');
        // 무한 루프 방지
        if (!window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
        return null;
    }
}

/**
 * 로그아웃
 */
export function logout() {
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminUser');
    console.log('✅ 로그아웃 완료');
    window.location.href = 'admin-login.html';
}

/**
 * 로그인 처리
 */
async function handleLogin(email, password, rememberMe) {
    try {
        console.log('🔍 로그인 시도:', email);
        
        // Firestore에서 admin 컬렉션 조회
        const adminRef = collection(db, 'admin');
        const q = query(adminRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('등록되지 않은 이메일입니다.');
        }
        
        // 첫 번째 문서 가져오기
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();
        
        console.log('📄 관리자 정보 확인:', adminData.name);
        
        // 비밀번호 확인 (평문 비교)
        if (adminData.password !== password) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
        
        console.log('✅ 로그인 성공!');
        
        // 세션 저장 (비밀번호 제외)
        const sessionData = {
            id: adminDoc.id,
            name: adminData.name,
            email: adminData.email
        };
        
        saveAdminSession(sessionData, rememberMe);
        
        // 대시보드로 이동
        window.location.href = 'admin-dashboard.html';
        
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        throw error;
    }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 3000);
    }
}

/**
 * 비밀번호 찾기 (이메일로 전송)
 */
async function handleForgotPassword() {
    const email = prompt('등록된 이메일 주소를 입력하세요:');
    
    if (!email) return;
    
    try {
        // Firestore에서 이메일 확인
        const adminRef = collection(db, 'admin');
        const q = query(adminRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('등록되지 않은 이메일입니다.');
        }
        
        // TODO: 실제로는 이메일 발송 로직을 구현해야 합니다
        // 현재는 알림만 표시
        alert(`${email}로 비밀번호 재설정 링크를 발송했습니다.\n\n(개발 중: 실제 이메일 발송 기능은 추후 구현 예정)`);
        
    } catch (error) {
        alert(error.message);
    }
}

/**
 * 페이지 로드 시 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM 로드 완료 (로그인 페이지)');
    
    // 로그인 페이지인 경우에만 세션 체크
    if (window.location.pathname.includes('admin-login.html')) {
        // 이미 로그인되어 있으면 대시보드로 이동
        const existingSession = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
        
        if (existingSession) {
            try {
                const session = JSON.parse(existingSession);
                console.log('📋 기존 세션:', session);
                console.log('⏰ 만료 시간:', new Date(session.expiresAt));
                console.log('🕐 현재 시간:', new Date());
                
                if (session.expiresAt && Date.now() < session.expiresAt) {
                    console.log('✅ 기존 세션 유효 - 대시보드로 이동');
                    window.location.href = 'admin-dashboard.html';
                    return;
                } else {
                    console.log('⏰ 세션 만료 - 로그인 필요');
                    localStorage.removeItem('adminUser');
                    sessionStorage.removeItem('adminUser');
                }
            } catch (error) {
                console.error('❌ 세션 파싱 오류:', error);
                // 파싱 오류 시 세션 삭제
                localStorage.removeItem('adminUser');
                sessionStorage.removeItem('adminUser');
            }
        } else {
            console.log('📭 세션 없음 - 로그인 필요');
        }
    }
    
    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                await handleLogin(email, password, rememberMe);
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    // 비밀번호 찾기
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }
});