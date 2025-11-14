// admin-add.js
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let isEditMode = false;
let editVideoId = null;

// 카테고리 계층 구조 정의
const categoryData = {
    sunday: {
        name: '주일 예배',
        subCategories: {
            weekly: '이번주 설교',
            scripture: '성서강해 설교',
            topic: '주제별 설교',
            column: '목회자 칼럼'
        },
        detailCategories: {
            weekly: [],
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
            column: []
        }
    },
    aba: {
        name: 'ABA',
        subCategories: {},
        detailCategories: {
            '': [
                '1학기 하늘의 조직', '2학기 인간론', '3학기 창조론', '4학기 종말론', 
                '5학기 구원론', '6학기 에베소서', '7학기 이슬람', '8학기 이스라엘 절기', 
                '9학기 기독론'
            ]
        }
    },
    avs: {
        name: 'AVS/AVCK',
        subCategories: {
            avs: 'AVS',
            avck: 'AVCK'
        },
        detailCategories: {
            avs: [
                '제15기 여자의 후손', '제19기 산상수훈', '제21기 이세상과 저세상', 
                '제23기 선지서 17권 개관'
            ],
            avck: [
                '제 1기', '제 2기', '제 3기', '제 4기', '제 7기', '제 8기', 
                '제 9기', '제 11기', '제 12기', '제 13기'
            ]
        }
    }
};

/**
 * URL에서 파라미터 가져오기
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 두 번째 카테고리(subCategory) 업데이트
 */
function updateSubCategory(mainCategory) {
    const category2 = document.getElementById('category2');
    const category3 = document.getElementById('category3');
    
    // 초기화
    category2.innerHTML = '<option value="">선택하세요</option>';
    category3.innerHTML = '<option value="">선택하세요</option>';
    category3.disabled = true;
    
    if (!mainCategory || !categoryData[mainCategory]) {
        category2.disabled = true;
        return;
    }
    
    const subCategories = categoryData[mainCategory].subCategories;
    
    // ABA의 경우 subCategory가 없고 바로 detailCategory로 이동
    if (Object.keys(subCategories).length === 0) {
        category2.disabled = true;
        updateDetailCategory(mainCategory, '');
        return;
    }
    
    // subCategory 옵션 추가
    Object.entries(subCategories).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        category2.appendChild(option);
    });
    
    category2.disabled = false;
}

/**
 * 세 번째 카테고리(detailCategory) 업데이트
 */
function updateDetailCategory(mainCategory, subCategory) {
    const category3 = document.getElementById('category3');
    
    // 초기화
    category3.innerHTML = '<option value="">선택하세요</option>';
    
    if (!mainCategory || !categoryData[mainCategory]) {
        category3.disabled = true;
        return;
    }
    
    const detailCategories = categoryData[mainCategory].detailCategories;
    
    // detailCategory가 없는 경우 (이번주 설교, 목회자 칼럼)
    if (!detailCategories || !detailCategories[subCategory] || detailCategories[subCategory].length === 0) {
        category3.disabled = true;
        return;
    }
    
    // detailCategory 옵션 추가
    detailCategories[subCategory].forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        category3.appendChild(option);
    });
    
    category3.disabled = false;
}

/**
 * 수정 모드: 기존 동영상 데이터 로드
 */
async function loadVideoData(videoId) {
    try {
        console.log('🔥 동영상 데이터 로드:', videoId);
        
        const videoRef = doc(db, 'video', videoId);
        const videoSnap = await getDoc(videoRef);
        
        if (!videoSnap.exists()) {
            alert('동영상을 찾을 수 없습니다.');
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        const videoData = videoSnap.data();
        console.log('✅ 데이터 로드 완료:', videoData);
        
        // 기본 정보 입력
        document.getElementById('videoTitle').value = videoData.title || '';
        document.getElementById('videoUrl').value = videoData.videoUrl || '';
        document.getElementById('videoDescription').value = videoData.description || '';
        
        // 카테고리 복원
        const category1 = document.getElementById('category1');
        const category2 = document.getElementById('category2');
        const category3 = document.getElementById('category3');
        
        if (videoData.category) {
            category1.value = videoData.category;
            updateSubCategory(videoData.category);
            
            // subCategory가 있는 경우
            if (videoData.subCategory) {
                // subCategory 옵션이 로드될 때까지 대기
                setTimeout(() => {
                    category2.value = videoData.subCategory;
                    updateDetailCategory(videoData.category, videoData.subCategory);
                    
                    // detailCategory가 있는 경우
                    if (videoData.detailCategory) {
                        setTimeout(() => {
                            category3.value = videoData.detailCategory;
                        }, 100);
                    }
                }, 100);
            } else {
                // ABA의 경우 (subCategory 없이 바로 detailCategory)
                setTimeout(() => {
                    if (videoData.detailCategory) {
                        category3.value = videoData.detailCategory;
                    }
                }, 100);
            }
        }
        
        document.getElementById('pageTitle').textContent = '동영상 수정하기';
        document.getElementById('submitBtn').textContent = '수정하기';
        
    } catch (error) {
        console.error('❌ 데이터 로드 오류:', error);
        alert('동영상 데이터를 불러오는데 실패했습니다.');
        window.location.href = 'admin-dashboard.html';
    }
}

/**
 * 랜덤 썸네일 선택
 */
function getRandomThumbnail() {
    const thumbnails = [
        'assets/images/thumbnails/videoCard-gray.png',
        'assets/images/thumbnails/videoCard-green.png',
        'assets/images/thumbnails/videoCard-orange.png',
        'assets/images/thumbnails/videoCard-purple.png'
    ];
    
    const randomIndex = Math.floor(Math.random() * thumbnails.length);
    return thumbnails[randomIndex];
}

/**
 * 폼 제출 처리
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('videoTitle').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const category = document.getElementById('category1').value;
    const subCategory = document.getElementById('category2').value;
    const detailCategory = document.getElementById('category3').value;
    const description = document.getElementById('videoDescription').value.trim();
    
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
    
    if (!isValidYouTubeUrl(videoUrl)) {
        alert('올바른 YouTube URL을 입력하세요.\n예: https://www.youtube.com/watch?v=VIDEO_ID');
        document.getElementById('videoUrl').focus();
        return;
    }
    
    // 동영상 데이터 구성
    const videoData = {
        title: title,
        videoUrl: videoUrl,
        category: category,
        description: description,
        status: 'active', // 기본값은 활성
        thumbnail: getRandomThumbnail() // ⭐ 랜덤 썸네일 추가
    };
    
    // subCategory가 있는 경우에만 추가
    if (subCategory) {
        videoData.subCategory = subCategory;
    }
    
    // detailCategory가 있는 경우에만 추가
    if (detailCategory) {
        videoData.detailCategory = detailCategory;
    }
    
    try {
        if (isEditMode) {
            // 수정 모드
            const videoRef = doc(db, 'video', editVideoId);
            delete videoData.thumbnail;
            await updateDoc(videoRef, videoData);
            alert('동영상이 수정되었습니다.');
        } else {
            // ⭐ 추가 모드 - orderNumber 자동 할당
            console.log('➕ 동영상 추가');
            
            // 같은 카테고리의 마지막 orderNumber 찾기
            const videosRef = collection(db, 'video');
            const q = query(videosRef, 
                where('category', '==', category),
                where('subCategory', '==', subCategory || ''),
                orderBy('orderNumber', 'desc'),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            let maxOrderNumber = 0;
            
            if (!querySnapshot.empty) {
                const lastVideo = querySnapshot.docs[0].data();
                maxOrderNumber = lastVideo.orderNumber || 0;
            }
            
            // 새 orderNumber 할당
            videoData.orderNumber = maxOrderNumber + 1;
            videoData.date = Timestamp.now();
            
            await addDoc(collection(db, 'video'), videoData);
            console.log('✅ 추가 완료, orderNumber:', videoData.orderNumber);
            alert('동영상이 추가되었습니다.');
        }
        
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
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]+/  // YouTube 라이브 URL
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
 * 취소 버튼 - 모달 표시
 */
function handleCancel() {
    showCancelModal();
}

/**
 * 페이지 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM 로드 완료 (추가/수정 페이지)');
    
    const adminUser = checkAdminSession();
    if (!adminUser) {
        console.log('⏸️ 세션 없음 - 초기화 중단');
        return;
    }
    
    console.log('👤 로그인 사용자:', adminUser.name);
    
    // 카테고리 이벤트 리스너 등록
    const category1 = document.getElementById('category1');
    const category2 = document.getElementById('category2');
    
    if (category1) {
        category1.addEventListener('change', (e) => {
            updateSubCategory(e.target.value);
        });
    }
    
    if (category2) {
        category2.addEventListener('change', (e) => {
            const mainCategory = document.getElementById('category1').value;
            updateDetailCategory(mainCategory, e.target.value);
        });
    }
    
    // 수정 모드 체크
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
    
    // 모달 이벤트 리스너
    const modal = document.getElementById('cancelModal');
    const modalClose = modal?.querySelector('#modalClose');
    const confirmCancelBtn = modal?.querySelector('#confirmCancelBtn');
    
    // X 버튼 클릭
    if (modalClose) {
        modalClose.addEventListener('click', hideCancelModal);
    }
    
    // 오버레이 클릭
    const overlay = modal?.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', hideCancelModal);
    }
    
    // 확인 버튼 - 목록으로 이동
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            window.location.href = 'admin-dashboard.html';
        });
    }
});