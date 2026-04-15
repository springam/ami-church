// ami-books.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

function renderBooks(books) {
    const bookList = document.getElementById('bookList');
    if (!bookList) return;

    if (books.length === 0) {
        bookList.innerHTML = '<p class="books-empty">등록된 도서가 없습니다.</p>';
        return;
    }

    bookList.innerHTML = books.map(book => `
        <div class="book-item">
            <div class="book-cover">
                ${book.coverImageUrl
                    ? `<img src="${book.coverImageUrl}" alt="${book.title}">`
                    : `<div class="book-cover-placeholder"></div>`
                }
            </div>
            <div class="book-info">
                <h3 class="book-title">/ ${book.title} /</h3>
                <div class="book-description">${(book.description || '').replace(/\n/g, '<br>')}</div>
            </div>
        </div>
    `).join('');
}

export async function initAmiBooks() {
    console.log('📚 AMI도서 초기화 시작');

    const bookList = document.getElementById('bookList');
    if (!bookList) return;

    try {
        const booksRef = collection(db, 'books');
        const q = query(
            booksRef,
            where('status', '==', 'active'),
            orderBy('orderNumber', 'asc')
        );

        const snapshot = await getDocs(q);
        const books = [];
        snapshot.forEach(doc => {
            books.push({ id: doc.id, ...doc.data() });
        });

        console.log(`✅ 도서 ${books.length}권 로드 완료`);
        renderBooks(books);

    } catch (error) {
        console.error('❌ 도서 로드 오류:', error);
        bookList.innerHTML = '<p class="books-empty">도서 목록을 불러오는데 실패했습니다.</p>';
    }
}
