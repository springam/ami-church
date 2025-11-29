// admin-add.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp, query, where, orderBy, limit, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
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
const storage = getStorage(app); // ⭐ Storage 추가

let isEditMode = false;
let editVideoId = null;
let currentContentType = 'video'; // ⭐ 현재 콘텐츠 타입 (video/pdf)

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
            scripture: [],
            topic: [],
            column: []
        }
    },
    aba: {
        name: 'ABA',
        subCategories: {
            aba: 'ABA'
        },
        detailCategories: {
            aba: [
                '1학기 하늘의 조직',
                '2학기 인간론',
                '3학기 창조론',
                '4학기 종말론',
                '5학기 구원론',
                '6학기 에베소서',
                '7학기 이슬람',
                '8학기 이스라엘 절기',
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
                '제15기 여자의 후손',
                '제16기',
                '제19기 산상수훈',
                '제21기 이세상과 저세상',
                '제23기 선지서 17권 개관'
            ],
            avck: [
                '제1기',
                '제2기',
                '제3기',
                '제4기',
                '제7기',
                '제8기',
                '제9기',
                '제11기',
                '제12기',
                '제13기'
            ]
        }
    }
};

/**
 * DB에서 detailCategories 로드
 */
async function loadDetailCategoriesForForm() {
    try {
        console.log('📂 폼용 detailCategories 로드 시작...');

        const categoriesRef = collection(db, 'detailCategories');
        const q = query(
            categoriesRef,
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);

        // 초기화
        categoryData.sunday.detailCategories = {
            weekly: [],
            scripture: [],
            topic: [],
            column: []
        };

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const subCategory = data.subCategory;

            if (categoryData.sunday.detailCategories.hasOwnProperty(subCategory)) {
                categoryData.sunday.detailCategories[subCategory].push(data.categoryName);
            }
        });

        // 정렬 (orderNumber 순)
        Object.keys(categoryData.sunday.detailCategories).forEach(subCat => {
            categoryData.sunday.detailCategories[subCat].sort();
        });

        console.log('✅ 폼용 detailCategories 로드 완료:', categoryData.sunday.detailCategories);

    } catch (error) {
        console.error('❌ detailCategories 로드 오류:', error);
    }
}

/**
 * ⭐ 콘텐츠 타입에 따라 UI 전환
 */
function switchContentType(type) {
    currentContentType = type;
    
    const videoUrlRow = document.getElementById('videoUrlRow');
    const pdfUploadRow = document.getElementById('pdfUploadRow');
    const videoUrl = document.getElementById('videoUrl');
    const pdfFile = document.getElementById('pdfFile');
    
    if (type === 'pdf') {
        // PDF 모드
        videoUrlRow.style.display = 'none';
        pdfUploadRow.style.display = 'flex';
        if (videoUrl) videoUrl.removeAttribute('required');
        if (videoUrl) videoUrl.value = '';
    } else {
        // 동영상 모드
        videoUrlRow.style.display = 'flex';
        pdfUploadRow.style.display = 'none';
        if (pdfFile) pdfFile.value = '';
        const pdfFileName = document.getElementById('pdfFileName');
        if (pdfFileName) pdfFileName.textContent = '';
    }
    
    console.log('📌 콘텐츠 타입 전환:', type);
}

/**
 * ⭐ PDF 파일 업로드
 */
async function uploadPDFFile(file) {
    return new Promise((resolve, reject) => {
        // 파일명 생성 (타임스탬프 + 원본 파일명)
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `pdfs/${fileName}`);
        
        // 업로드 시작
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // 진행 상황 표시
        const progressDiv = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressDiv) progressDiv.style.display = 'block';
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // 진행률 계산
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (progressBar) progressBar.style.width = progress + '%';
                if (progressText) progressText.textContent = `업로드 중... ${Math.round(progress)}%`;
                console.log('업로드 진행:', progress + '%');
            },
            (error) => {
                // 에러 처리
                console.error('❌ 업로드 오류:', error);
                if (progressDiv) progressDiv.style.display = 'none';
                reject(error);
            },
            async () => {
                // 업로드 완료
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    if (progressText) progressText.textContent = '✅ 업로드 완료!';
                    
                    setTimeout(() => {
                        if (progressDiv) progressDiv.style.display = 'none';
                    }, 2000);
                    
                    console.log('✅ 업로드 완료:', downloadURL);
                    resolve({
                        url: downloadURL,
                        fileName: file.name
                    });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

/**
 * URL에서 파라미터 가져오기
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 날짜 선택 옵션 초기화
 */
function initializeDateSelects() {
    const yearSelect = document.getElementById('dateYear');
    const monthSelect = document.getElementById('dateMonth');
    const daySelect = document.getElementById('dateDay');

    if (!yearSelect || !monthSelect || !daySelect) return;

    // 년도: 2020년부터 현재 +1년까지
    const currentYear = new Date().getFullYear();
    for (let year = 1999; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '년';
        yearSelect.appendChild(option);
    }

    // 월: 1~12월
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '월';
        monthSelect.appendChild(option);
    }

    // 일: 1~31일
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day + '일';
        daySelect.appendChild(option);
    }

    // 기본값: 오늘 날짜
    const today = new Date();
    yearSelect.value = today.getFullYear();
    monthSelect.value = today.getMonth() + 1;
    daySelect.value = today.getDate();
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
        console.log('🔥 콘텐츠 데이터 로드:', videoId);
        
        const videoRef = doc(db, 'video', videoId);
        const videoSnap = await getDoc(videoRef);
        
        if (!videoSnap.exists()) {
            alert('콘텐츠를 찾을 수 없습니다.');
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        const videoData = videoSnap.data();
        console.log('✅ 데이터 로드 완료:', videoData);

        // 기본 정보 입력
        document.getElementById('videoTitle').value = videoData.title || '';
        document.getElementById('videoDescription').value = videoData.description || '';
        document.getElementById('videoUrl').value = videoData.videoUrl || '';

        // 날짜 복원
        if (videoData.date) {
            const date = videoData.date.toDate ? videoData.date.toDate() : new Date(videoData.date);
            document.getElementById('dateYear').value = date.getFullYear();
            document.getElementById('dateMonth').value = date.getMonth() + 1;
            document.getElementById('dateDay').value = date.getDate();
        }
        
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
 * ⭐ 폼 제출 처리 (PDF 지원 추가)
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('videoTitle').value.trim();
    const category = document.getElementById('category1').value;
    const subCategory = document.getElementById('category2').value;
    const detailCategory = document.getElementById('category3').value;
    const description = document.getElementById('videoDescription').value.trim();

    const dateYear = document.getElementById('dateYear').value;
    const dateMonth = document.getElementById('dateMonth').value;
    const dateDay = document.getElementById('dateDay').value;

    if (!title) {
        alert('제목을 입력하세요.');
        document.getElementById('videoTitle').focus();
        return;
    }

    if (!category) {
        alert('카테고리를 선택하세요.');
        document.getElementById('category1').focus();
        return;
    }

    if (!dateYear || !dateMonth || !dateDay) {
        alert('날짜를 선택하세요.');
        return;
    }
    
    // URL 검증
    const videoUrl = document.getElementById('videoUrl').value.trim();

    if (!videoUrl) {
        alert('URL을 입력하세요.');
        document.getElementById('videoUrl').focus();
        return;
    }

    // 목회자 칼럼은 일반 URL, 그 외는 YouTube URL 검증
    if (subCategory !== 'column' && !isValidYouTubeUrl(videoUrl)) {
        alert('올바른 YouTube URL을 입력하세요.\n예: https://www.youtube.com/watch?v=VIDEO_ID');
        document.getElementById('videoUrl').focus();
        return;
    }
    
    try {
        // 선택한 날짜를 Timestamp로 변환
        const selectedDate = new Date(
            parseInt(dateYear),
            parseInt(dateMonth) - 1, // JavaScript 월은 0부터 시작
            parseInt(dateDay)
        );
        const dateTimestamp = Timestamp.fromDate(selectedDate);

        // 공통 데이터 구성
        const videoData = {
            type: 'video',
            title: title,
            category: category,
            description: description,
            status: 'active',
            date: dateTimestamp,
            videoUrl: videoUrl
        };

        // subCategory가 있는 경우에만 추가
        if (subCategory) {
            videoData.subCategory = subCategory;
        }

        // detailCategory가 있는 경우에만 추가
        if (detailCategory) {
            videoData.detailCategory = detailCategory;
        }

        // 썸네일 추가 (수정 모드가 아닐 때만)
        if (!isEditMode) {
            videoData.thumbnail = getRandomThumbnail();
        }
        
        if (isEditMode) {
            // 수정 모드
            const videoRef = doc(db, 'video', editVideoId);
            await updateDoc(videoRef, videoData);
            alert('콘텐츠가 수정되었습니다.');
        } else {
            // 추가 모드 - orderNumber 자동 할당
            console.log('➕ 콘텐츠 추가');
            
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

            videoData.orderNumber = maxOrderNumber + 1;

            await addDoc(collection(db, 'video'), videoData);
            console.log('✅ 추가 완료, orderNumber:', videoData.orderNumber);
            alert('콘텐츠가 추가되었습니다.');
        }
        
        window.location.href = 'admin-dashboard.html';
        
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
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,        // 일반 동영상
        /^https?:\/\/youtu\.be\/[\w-]+/,                             // 짧은 URL
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,          // 임베드 URL
        /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]+/,           // 라이브 URL
        /^https?:\/\/(www\.)?youtube\.com\/post\/[\w-]+/,           // 커뮤니티 게시물
        /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/          // Shorts
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

    // ⭐ DB에서 카테고리 로드
    await loadDetailCategoriesForForm();

    // ⭐ 날짜 선택 옵션 초기화
    initializeDateSelects();

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
    
    // ⭐ PDF 파일 선택 시 파일명 표시
    const pdfFile = document.getElementById('pdfFile');
    if (pdfFile) {
        pdfFile.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || '';
            const pdfFileName = document.getElementById('pdfFileName');
            if (pdfFileName) {
                pdfFileName.textContent = fileName ? `선택된 파일: ${fileName}` : '';
            }
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

    // ⭐ 카테고리 관리 버튼 이벤트
    const categoryManageBtn = document.getElementById('categoryManageBtn');
    if (categoryManageBtn) {
        categoryManageBtn.addEventListener('click', openCategoryModal);
    }
});

// ==========================================
// 카테고리 관리 기능
// ==========================================

let currentModalSubCategory = 'scripture'; // 모달에서 선택된 서브카테고리 (기본값: 성서강해 설교)
let categories = []; // 현재 로드된 카테고리 목록
let sortable = null; // Sortable.js 인스턴스

/**
 * 카테고리 관리 모달 열기
 */
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('show');

        // 첫 번째 탭 활성화 (성서강해 설교)
        const firstTab = document.querySelector('.category-tab[data-subcategory="scripture"]');
        if (firstTab) {
            switchCategoryTab('scripture');
            firstTab.classList.add('active');
        }
    }
}

/**
 * 카테고리 관리 모달 닫기
 */
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * 카테고리 탭 전환
 */
async function switchCategoryTab(subCategory) {
    currentModalSubCategory = subCategory;

    // 탭 활성화 상태 변경
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.subcategory === subCategory) {
            tab.classList.add('active');
        }
    });

    // 카테고리 목록 로드
    await loadCategories(subCategory);
}

/**
 * DB에서 카테고리 목록 로드
 */
async function loadCategories(subCategory) {
    try {
        console.log('📂 카테고리 로드:', subCategory);

        const categoriesRef = collection(db, 'detailCategories');
        const q = query(
            categoriesRef,
            where('subCategory', '==', subCategory),
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);
        categories = [];

        querySnapshot.forEach((doc) => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // 클라이언트 측 정렬
        categories.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

        console.log('✅ 카테고리 로드 완료:', categories.length, '개');
        console.log('📋 로드된 카테고리:', categories);

        renderCategories();

    } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
        console.error('오류 상세:', error.message);
        categories = [];
        renderCategories();
    }
}

/**
 * 카테고리 목록 렌더링
 */
function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    if (categories.length === 0) {
        categoryList.innerHTML = '';
        return;
    }

    categoryList.innerHTML = categories.map((category, index) => {
        const isEditable = category.isEditable !== false; // 기본값 true

        return `
            <div class="category-item ${!isEditable ? 'non-editable' : ''}" data-id="${category.id}">
                <div class="category-drag-handle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 5h2M9 12h2M9 19h2M15 5h2M15 12h2M15 19h2" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <span class="category-order">${index + 1}</span>
                <span class="category-name">${category.categoryName}</span>
                <div class="category-actions">
                    ${isEditable ? `
                        <button class="category-action-btn edit-btn" onclick="editCategory('${category.id}')" title="수정">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M2.5 21.5003L8.04927 19.366C8.40421 19.2295 8.58168 19.1612 8.74772 19.0721C8.8952 18.9929 9.0358 18.9015 9.16804 18.7989C9.31692 18.6834 9.45137 18.5489 9.72028 18.28L21 7.0003C22.1046 5.89574 22.1046 4.10487 21 3.0003C19.8955 1.89573 18.1046 1.89573 17 3.0003L5.72028 14.28C5.45138 14.5489 5.31692 14.6834 5.20139 14.8323C5.09877 14.9645 5.0074 15.1051 4.92823 15.2526C4.83911 15.4186 4.77085 15.5961 4.63433 15.951L2.5 21.5003ZM2.5 21.5003L4.55812 16.1493C4.7054 15.7663 4.77903 15.5749 4.90534 15.4872C5.01572 15.4105 5.1523 15.3816 5.2843 15.4068C5.43533 15.4356 5.58038 15.5807 5.87048 15.8708L8.12957 18.1299C8.41967 18.4199 8.56472 18.565 8.59356 18.716C8.61877 18.848 8.58979 18.9846 8.51314 19.095C8.42545 19.2213 8.23399 19.2949 7.85107 19.4422L2.5 21.5003Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="category-action-btn delete-btn" onclick="deleteCategory('${category.id}')" title="삭제">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 1H13M1 4H19M17 4L16.2987 14.5193C16.1935 16.0975 16.1409 16.8867 15.8 17.485C15.4999 18.0118 15.0472 18.4353 14.5017 18.6997C13.882 19 13.0911 19 11.5093 19H8.49065C6.90891 19 6.11803 19 5.49834 18.6997C4.95276 18.4353 4.50009 18.0118 4.19998 17.485C3.85911 16.8867 3.8065 16.0975 3.70129 14.5193L3 4M8 8.5V13.5M12 8.5V13.5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    ` : `
                        <span class="category-locked-badge">고정</span>
                    `}
                </div>
            </div>
        `;
    }).join('');

    // Sortable.js 초기화
    initializeSortable();
}

/**
 * Sortable.js 초기화 (드래그 앤 드롭)
 */
function initializeSortable() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    // 기존 sortable 제거
    if (sortable) {
        sortable.destroy();
    }

    // Sortable.js CDN 로드 확인
    if (typeof Sortable === 'undefined') {
        console.warn('⚠️ Sortable.js 라이브러리가 로드되지 않았습니다.');
        loadSortableLibrary();
        return;
    }

    sortable = Sortable.create(categoryList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.category-drag-handle',
        filter: '.non-editable',
        onEnd: async function(evt) {
            // 순서 변경 저장
            await saveCategoryOrder();
        }
    });
}

/**
 * Sortable.js 라이브러리 동적 로드
 */
function loadSortableLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
    script.onload = () => {
        console.log('✅ Sortable.js 로드 완료');
        initializeSortable();
    };
    document.head.appendChild(script);
}

/**
 * 카테고리 추가
 */
async function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const categoryName = input.value.trim();

    if (!categoryName) {
        alert('카테고리 이름을 입력하세요.');
        input.focus();
        return;
    }

    // 중복 체크
    const duplicate = categories.find(cat => cat.categoryName === categoryName);
    if (duplicate) {
        alert('이미 존재하는 카테고리 이름입니다.');
        input.focus();
        return;
    }

    try {
        // orderNumber 계산
        const maxOrder = categories.length > 0
            ? Math.max(...categories.map(c => c.orderNumber || 0))
            : 0;

        const newCategory = {
            subCategory: currentModalSubCategory,
            categoryName: categoryName,
            orderNumber: maxOrder + 1,
            isActive: true,
            isEditable: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'detailCategories'), newCategory);
        console.log('✅ 카테고리 추가 완료:', categoryName);
        console.log('📄 추가된 문서 ID:', docRef.id);
        console.log('📋 추가된 데이터:', newCategory);

        // 입력 필드 초기화
        input.value = '';

        // 목록 새로고침
        await loadCategories(currentModalSubCategory);

    } catch (error) {
        console.error('❌ 카테고리 추가 오류:', error);
        alert('카테고리 추가 중 오류가 발생했습니다.');
    }
}

/**
 * 카테고리 수정
 */
window.editCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newName = prompt('카테고리 이름을 수정하세요:', category.categoryName);

    if (!newName || newName.trim() === '') {
        return;
    }

    const trimmedName = newName.trim();

    // 중복 체크 (자기 자신 제외)
    const duplicate = categories.find(c => c.id !== categoryId && c.categoryName === trimmedName);
    if (duplicate) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return;
    }

    try {
        const categoryRef = doc(db, 'detailCategories', categoryId);
        await updateDoc(categoryRef, {
            categoryName: trimmedName,
            updatedAt: Timestamp.now()
        });

        console.log('✅ 카테고리 수정 완료:', trimmedName);

        // 목록 새로고침
        await loadCategories(currentModalSubCategory);

    } catch (error) {
        console.error('❌ 카테고리 수정 오류:', error);
        alert('카테고리 수정 중 오류가 발생했습니다.');
    }
}

/**
 * 카테고리 삭제
 */
window.deleteCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (!confirm(`"${category.categoryName}" 카테고리를 삭제하시겠습니까?`)) {
        return;
    }

    try {
        const categoryRef = doc(db, 'detailCategories', categoryId);
        await deleteDoc(categoryRef);

        console.log('✅ 카테고리 삭제 완료:', category.categoryName);

        // 목록 새로고침
        await loadCategories(currentModalSubCategory);

    } catch (error) {
        console.error('❌ 카테고리 삭제 오류:', error);
        alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
}

/**
 * 카테고리 순서 저장 (드래그 앤 드롭 후)
 */
async function saveCategoryOrder() {
    try {
        const categoryList = document.getElementById('categoryList');
        const items = categoryList.querySelectorAll('.category-item');

        const batch = writeBatch(db);

        items.forEach((item, index) => {
            const categoryId = item.dataset.id;
            const categoryRef = doc(db, 'detailCategories', categoryId);

            batch.update(categoryRef, {
                orderNumber: index + 1,
                updatedAt: Timestamp.now()
            });
        });

        await batch.commit();
        console.log('✅ 카테고리 순서 저장 완료');

        // 목록 새로고침
        await loadCategories(currentModalSubCategory);

    } catch (error) {
        console.error('❌ 순서 저장 오류:', error);
        alert('순서 저장 중 오류가 발생했습니다.');
    }
}

// 카테고리 관리 모달 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    // 모달 닫기 버튼
    const categoryModalClose = document.getElementById('categoryModalClose');
    if (categoryModalClose) {
        categoryModalClose.addEventListener('click', closeCategoryModal);
    }

    // 완료 버튼
    const closeCategoryModalBtn = document.getElementById('closeCategoryModalBtn');
    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
    }

    // 오버레이 클릭
    const categoryModal = document.getElementById('categoryModal');
    const categoryOverlay = categoryModal?.querySelector('.modal-overlay');
    if (categoryOverlay) {
        categoryOverlay.addEventListener('click', closeCategoryModal);
    }

    // 카테고리 탭 클릭
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const subCategory = tab.dataset.subcategory;
            switchCategoryTab(subCategory);
        });
    });

    // 카테고리 추가 버튼
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addCategory);
    }

    // Enter 키로 추가
    const newCategoryInput = document.getElementById('newCategoryInput');
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCategory();
            }
        });
    }
});