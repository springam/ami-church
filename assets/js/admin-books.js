// admin-books.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { checkAdminSession } from './admin-auth.js';

console.log('📚 admin-books.js 로드됨');

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

let pendingDeleteId = null;
let pendingDeleteImageUrl = null;

function renderTable(books) {
    const wrap = document.getElementById('bookTableWrap');

    if (books.length === 0) {
        wrap.innerHTML = '<p class="books-empty-msg">등록된 도서가 없습니다.</p>';
        return;
    }

    const rows = books.map(book => `
        <tr>
            <td>
                ${book.coverImageUrl
                    ? `<img src="${book.coverImageUrl}" class="book-cover-thumb" alt="${book.title}">`
                    : `<div class="book-cover-empty"></div>`
                }
            </td>
            <td>${book.title}</td>
            <td style="max-width: 320px; color: #666; white-space: pre-wrap;">${(book.description || '').substring(0, 80)}${book.description && book.description.length > 80 ? '…' : ''}</td>
            <td>
                <button class="book-action-btn btn-edit" onclick="editBook('${book.id}')">수정</button>
                <button class="book-action-btn btn-delete" onclick="confirmDelete('${book.id}', '${(book.coverImageUrl || '').replace(/'/g, "\\'")}')">삭제</button>
            </td>
        </tr>
    `).join('');

    wrap.innerHTML = `
        <table class="book-table">
            <thead>
                <tr>
                    <th style="width: 70px;">표지</th>
                    <th>제목</th>
                    <th>설명</th>
                    <th style="width: 140px;">관리</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

async function loadBooks() {
    try {
        const booksRef = collection(db, 'books');
        const q = query(booksRef, orderBy('orderNumber', 'asc'));
        const snapshot = await getDocs(q);
        const books = [];
        snapshot.forEach(d => books.push({ id: d.id, ...d.data() }));
        renderTable(books);
    } catch (error) {
        console.error('❌ 도서 로드 오류:', error);
        document.getElementById('bookTableWrap').innerHTML = '<p class="books-empty-msg">도서 목록을 불러오는데 실패했습니다.</p>';
    }
}

window.editBook = function(bookId) {
    window.location.href = `admin-book-add.html?id=${bookId}`;
};

window.confirmDelete = function(bookId, imageUrl) {
    pendingDeleteId = bookId;
    pendingDeleteImageUrl = imageUrl;
    document.getElementById('deleteModal').style.display = 'flex';
};

async function deleteBook() {
    if (!pendingDeleteId) return;

    try {
        // Storage 이미지 삭제 (있는 경우)
        if (pendingDeleteImageUrl) {
            try {
                const imageRef = ref(storage, pendingDeleteImageUrl);
                await deleteObject(imageRef);
            } catch (e) {
                // 이미지 삭제 실패는 무시 (이미 없을 수도 있음)
                console.warn('이미지 삭제 실패 (무시):', e);
            }
        }

        await deleteDoc(doc(db, 'books', pendingDeleteId));
        document.getElementById('deleteModal').style.display = 'none';
        pendingDeleteId = null;
        pendingDeleteImageUrl = null;
        await loadBooks();

    } catch (error) {
        console.error('❌ 삭제 오류:', error);
        alert('삭제에 실패했습니다: ' + error.message);
    }
}

function init() {
    checkAdminSession();
    loadBooks();

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteBook);
    document.getElementById('deleteModalClose').addEventListener('click', () => {
        document.getElementById('deleteModal').style.display = 'none';
        pendingDeleteId = null;
        pendingDeleteImageUrl = null;
    });
}

init();
