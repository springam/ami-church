// AVS/AVCK 카테고리를 DB에 추가하는 스크립트
// 브라우저 콘솔에서 실행하세요

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

// AVS 카테고리
const avsCategories = [
    '제15기 여자의 후손',
    '제16기',
    '제19기 산상수훈',
    '제21기 이세상과 저세상',
    '제23기 선지서 17권 개관'
];

// AVCK 카테고리
const avckCategories = [
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
];

async function initAVSCategories() {
    try {
        console.log('🚀 AVS/AVCK 카테고리 초기화 시작...');

        // AVS 카테고리 추가
        console.log('📝 AVS 카테고리 추가 중...');
        for (let i = 0; i < avsCategories.length; i++) {
            const categoryName = avsCategories[i];

            // 중복 체크
            const q = query(
                collection(db, 'detailCategories'),
                where('subCategory', '==', 'avs'),
                where('categoryName', '==', categoryName)
            );
            const existingDocs = await getDocs(q);

            if (existingDocs.empty) {
                const docData = {
                    subCategory: 'avs',
                    categoryName: categoryName,
                    orderNumber: i + 1,
                    isActive: true,
                    isEditable: true,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                };

                await addDoc(collection(db, 'detailCategories'), docData);
                console.log(`✅ AVS 추가: ${categoryName}`);
            } else {
                console.log(`⏭️ AVS 이미 존재: ${categoryName}`);
            }
        }

        // AVCK 카테고리 추가
        console.log('📝 AVCK 카테고리 추가 중...');
        for (let i = 0; i < avckCategories.length; i++) {
            const categoryName = avckCategories[i];

            // 중복 체크
            const q = query(
                collection(db, 'detailCategories'),
                where('subCategory', '==', 'avck'),
                where('categoryName', '==', categoryName)
            );
            const existingDocs = await getDocs(q);

            if (existingDocs.empty) {
                const docData = {
                    subCategory: 'avck',
                    categoryName: categoryName,
                    orderNumber: i + 1,
                    isActive: true,
                    isEditable: true,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                };

                await addDoc(collection(db, 'detailCategories'), docData);
                console.log(`✅ AVCK 추가: ${categoryName}`);
            } else {
                console.log(`⏭️ AVCK 이미 존재: ${categoryName}`);
            }
        }

        console.log('🎉 AVS/AVCK 카테고리 초기화 완료!');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    }
}

// 실행
initAVSCategories();
