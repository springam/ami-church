// admin-book-add.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { checkAdminSession } from './admin-auth.js';

console.log('📝 admin-book-add.js 로드됨');

const firebaseConfig = {
    apiKey: "AIzaSyDovIYMknqYQeSpveyEfugar-yQ1PUeL9A",
    authDomain: "ami-church.firebaseapp.com",
    projectId: "ami-church",
    storageBucket: "ami-church.firebasestorage.app",
    messagingSenderId: "858840781541",
    appId: "1:858840781541:web:4c76fac2dd5ed376cd7a0c"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let isEditMode = false;
let editBookId = null;
let existingCoverImageUrl = null;

function getUrlParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

/**
 * 수정 모드: 기존 도서 데이터 로드
 */
async function loadBookData(bookId) {
    try {
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (!bookSnap.exists()) {
            alert('도서를 찾을 수 없습니다.');
            window.location.href = 'admin-books.html';
            return;
        }

        const bookData = bookSnap.data();
        document.getElementById('bookTitle').value = bookData.title || '';
        document.getElementById('bookDescription').value = bookData.description || '';

        if (bookData.coverImageUrl) {
            existingCoverImageUrl = bookData.coverImageUrl;
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            previewImg.src = bookData.coverImageUrl;
            preview.style.display = 'block';
        }

        document.getElementById('pageTitle').textContent = '도서 수정하기';
        document.getElementById('submitBtn').textContent = '수정하기';

    } catch (error) {
        console.error('❌ 도서 데이터 로드 오류:', error);
        alert('도서 데이터를 불러오는데 실패했습니다.');
        window.location.href = 'admin-books.html';
    }
}

/**
 * 이미지 파일을 Firebase Storage에 업로드
 */
async function uploadCoverImage(file) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const storageRef = ref(storage, `book-covers/${timestamp}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const progressDiv = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        progressDiv.style.display = 'block';

        uploadTask.on('state_changed',
            (snapshot) => {
                const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                console.log(`📤 업로드 상태: ${snapshot.state}, ${snapshot.bytesTransferred}/${snapshot.totalBytes} (${percent}%)`);
                progressBar.style.width = percent + '%';
                progressText.textContent = `업로드 중... ${percent}%`;
            },
            (error) => {
                console.error('❌ 업로드 오류 코드:', error.code, '메시지:', error.message);
                progressDiv.style.display = 'none';
                reject(error);
            },
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                progressDiv.style.display = 'none';
                resolve(downloadUrl);
            }
        );
    });
}

/**
 * 다음 orderNumber 계산 (가장 큰 값 + 1)
 */
async function getNextOrderNumber() {
    try {
        const booksRef = collection(db, 'books');
        const q = query(booksRef, orderBy('orderNumber', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return 1;
        const maxOrder = snapshot.docs[0].data().orderNumber || 0;
        return maxOrder + 1;
    } catch {
        return Date.now();
    }
}

/**
 * 폼 제출 처리
 */
async function handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const description = document.getElementById('bookDescription').value.trim();
    const coverFile = document.getElementById('coverImageFile').files[0];

    if (!title) {
        alert('제목을 입력하세요.');
        document.getElementById('bookTitle').focus();
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

    try {
        let coverImageUrl = existingCoverImageUrl || '';

        // 새 이미지 파일이 선택된 경우 업로드
        if (coverFile) {
            coverImageUrl = await uploadCoverImage(coverFile);
        }

        const bookData = {
            title,
            description,
            coverImageUrl,
            status: 'active'
        };

        if (isEditMode) {
            const bookRef = doc(db, 'books', editBookId);
            await updateDoc(bookRef, bookData);
            alert('도서가 수정되었습니다.');
        } else {
            bookData.orderNumber = await getNextOrderNumber();
            await addDoc(collection(db, 'books'), bookData);
            alert('도서가 추가되었습니다.');
        }

        window.location.href = 'admin-books.html';

    } catch (error) {
        console.error('❌ 저장 오류:', error);
        alert('저장에 실패했습니다: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? '수정하기' : '추가하기';
    }
}

/**
 * 이미지 미리보기
 */
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        previewImg.src = ev.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

/**
 * 초기화
 */
async function init() {
    checkAdminSession();

    const bookId = getUrlParameter('id');
    if (bookId) {
        isEditMode = true;
        editBookId = bookId;
        await loadBookData(bookId);
    }

    document.getElementById('bookForm').addEventListener('submit', handleSubmit);
    document.getElementById('coverImageFile').addEventListener('change', handleImagePreview);

    // 취소 버튼
    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('cancelModal').style.display = 'flex';
    });
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('cancelModal').style.display = 'none';
    });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
        window.location.href = 'admin-books.html';
    });
}

init();
