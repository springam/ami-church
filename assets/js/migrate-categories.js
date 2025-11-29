// migrate-categories.js
// 초기 카테고리 데이터를 Firebase에 마이그레이션하는 스크립트
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

// 초기 카테고리 데이터
const initialCategories = [
    // 성서강해 설교 (scripture) - 수정 불가
    { subCategory: 'scripture', categoryName: '요나서', orderNumber: 1, isEditable: false },
    { subCategory: 'scripture', categoryName: '마태복음 5장', orderNumber: 2, isEditable: false },
    { subCategory: 'scripture', categoryName: '마태복음 13장', orderNumber: 3, isEditable: false },
    { subCategory: 'scripture', categoryName: '누가복음', orderNumber: 4, isEditable: false },
    { subCategory: 'scripture', categoryName: '요한복음', orderNumber: 5, isEditable: false },
    { subCategory: 'scripture', categoryName: '사도행전', orderNumber: 6, isEditable: false },
    { subCategory: 'scripture', categoryName: '로마서', orderNumber: 7, isEditable: false },
    { subCategory: 'scripture', categoryName: '고린도 전서', orderNumber: 8, isEditable: false },
    { subCategory: 'scripture', categoryName: '야고보서', orderNumber: 9, isEditable: false },
    { subCategory: 'scripture', categoryName: '요한계시록', orderNumber: 10, isEditable: false },
    { subCategory: 'scripture', categoryName: '기타', orderNumber: 11, isEditable: false },

    // 주제별 설교 (topic) - 수정 불가
    { subCategory: 'topic', categoryName: '기독론', orderNumber: 1, isEditable: false },
    { subCategory: 'topic', categoryName: '전도론', orderNumber: 2, isEditable: false },
    { subCategory: 'topic', categoryName: '주기도문', orderNumber: 3, isEditable: false },
    { subCategory: 'topic', categoryName: '파라독스', orderNumber: 4, isEditable: false },
    { subCategory: 'topic', categoryName: '아리랑족속', orderNumber: 5, isEditable: false },
    { subCategory: 'topic', categoryName: '저주와 복', orderNumber: 6, isEditable: false },
    { subCategory: 'topic', categoryName: '엘로힘', orderNumber: 7, isEditable: false },
    { subCategory: 'topic', categoryName: '바울', orderNumber: 8, isEditable: false },
    { subCategory: 'topic', categoryName: '하나님을 아는 자식', orderNumber: 9, isEditable: false },
    { subCategory: 'topic', categoryName: '천사학', orderNumber: 10, isEditable: false },
    { subCategory: 'topic', categoryName: '이스라엘', orderNumber: 11, isEditable: false },
    { subCategory: 'topic', categoryName: '은혜', orderNumber: 12, isEditable: false },
    { subCategory: 'topic', categoryName: '일본', orderNumber: 13, isEditable: false },
    { subCategory: 'topic', categoryName: '빌립보서', orderNumber: 14, isEditable: false },
    { subCategory: 'topic', categoryName: '남은자', orderNumber: 15, isEditable: false },
    { subCategory: 'topic', categoryName: '두짐승', orderNumber: 16, isEditable: false },
    { subCategory: 'topic', categoryName: '기타', orderNumber: 17, isEditable: false }
];

// 마이그레이션 실행
async function migrateCategories() {
    console.log('🚀 카테고리 마이그레이션 시작...');

    try {
        const now = Timestamp.now();
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        // 기존 카테고리 확인
        const categoriesRef = collection(db, 'detailCategories');

        for (const category of initialCategories) {
            try {
                // 중복 체크
                const q = query(
                    categoriesRef,
                    where('subCategory', '==', category.subCategory),
                    where('categoryName', '==', category.categoryName)
                );

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // 이미 존재하는 카테고리
                    skipCount++;
                    console.log(`⏭️  ${category.subCategory} - ${category.categoryName} (이미 존재)`);
                    continue;
                }

                // 새로운 카테고리 추가
                await addDoc(categoriesRef, {
                    ...category,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now
                });
                successCount++;
                console.log(`✅ ${category.subCategory} - ${category.categoryName} 추가 완료`);

            } catch (error) {
                failCount++;
                console.error(`❌ ${category.subCategory} - ${category.categoryName} 추가 실패:`, error);
                console.error('   오류 상세:', error.message);
            }
        }

        console.log('\n📊 마이그레이션 완료!');
        console.log(`   추가: ${successCount}개`);
        console.log(`   건너뜀: ${skipCount}개`);
        console.log(`   실패: ${failCount}개`);

    } catch (error) {
        console.error('❌ 마이그레이션 오류:', error);
        console.error('오류 상세:', error.message);
    }
}

/**
 * 모든 카테고리를 수정 가능하게 변경
 */
async function unlockAllCategories() {
    console.log('🔓 카테고리 수정 가능 모드로 변경 시작...');

    try {
        const categoriesRef = collection(db, 'detailCategories');
        const q = query(categoriesRef, where('isActive', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('⚠️ 변경할 카테고리가 없습니다.');
            alert('변경할 카테고리가 없습니다. 먼저 마이그레이션을 실행하세요.');
            return;
        }

        const batch = writeBatch(db);
        let updateCount = 0;

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();

            // isEditable이 false인 것만 변경
            if (data.isEditable === false) {
                const docRef = doc(db, 'detailCategories', docSnapshot.id);
                batch.update(docRef, {
                    isEditable: true,
                    updatedAt: Timestamp.now()
                });
                updateCount++;
                console.log(`✅ ${data.subCategory} - ${data.categoryName} → 수정 가능으로 변경`);
            }
        });

        if (updateCount === 0) {
            console.log('ℹ️ 모든 카테고리가 이미 수정 가능 상태입니다.');
            alert('모든 카테고리가 이미 수정 가능 상태입니다.');
            return;
        }

        await batch.commit();

        console.log(`\n📊 변경 완료!`);
        console.log(`   변경된 카테고리: ${updateCount}개`);
        console.log(`   총 카테고리: ${querySnapshot.size}개`);

        alert(`${updateCount}개의 카테고리가 수정 가능하게 변경되었습니다!`);

    } catch (error) {
        console.error('❌ 변경 오류:', error);
        console.error('오류 상세:', error.message);
        alert('변경 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    }
}

// 버튼 클릭 이벤트
document.getElementById('migrateBtn')?.addEventListener('click', async () => {
    if (confirm('카테고리 데이터를 Firebase에 추가하시겠습니까?')) {
        await migrateCategories();
        alert('마이그레이션이 완료되었습니다. 콘솔을 확인하세요.');
    }
});

document.getElementById('unlockBtn')?.addEventListener('click', async () => {
    if (confirm('모든 카테고리를 수정/삭제 가능하게 변경하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        await unlockAllCategories();
    }
});

console.log('✅ 마이그레이션 스크립트 로드 완료');
