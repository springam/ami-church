# AMI Church - CSS 스타일 가이드

## 📚 목차
1. [CSS 파일 구조](#css-파일-구조)
2. [CSS 로드 순서](#css-로드-순서)
3. [네이밍 규칙](#네이밍-규칙)
4. [CSS 변수 사용법](#css-변수-사용법)
5. [반응형 작업 가이드](#반응형-작업-가이드)
6. [체크리스트](#체크리스트)

---

## 📁 CSS 파일 구조

```
assets/css/
├── 1-base/
│   ├── variables.css      # ⭐ CSS 변수 (색상, 폰트, 간격)
│   └── reset.css          # ⭐ 글로벌 리셋
│
├── common-new.css         # ⭐ 공통 스타일 (Header, Footer)
│
└── pages/
    ├── home.css
    ├── greeting.css
    ├── intro.css
    ├── schedule.css
    └── location.css
```

---

## 🔢 CSS 로드 순서

**⚠️ 매우 중요! 이 순서를 반드시 지켜야 합니다.**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <!-- 1️⃣ CSS 변수 (제일 먼저!) -->
    <link rel="stylesheet" href="assets/css/1-base/variables.css">
    
    <!-- 2️⃣ 글로벌 리셋 -->
    <link rel="stylesheet" href="assets/css/1-base/reset.css">
    
    <!-- 3️⃣ 공통 스타일 (Header, Footer) -->
    <link rel="stylesheet" href="assets/css/common-new.css">
    
    <!-- 4️⃣ 페이지별 CSS (마지막!) -->
    <link rel="stylesheet" href="assets/css/pages/greeting.css">
    
    <!-- Pretendard 폰트 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
</head>
```

### ❌ 잘못된 예시
```html
<!-- 나쁨: 순서가 뒤바뀜 -->
<link rel="stylesheet" href="assets/css/pages/greeting.css">
<link rel="stylesheet" href="assets/css/1-base/variables.css">
<link rel="stylesheet" href="assets/css/common-new.css">

<!-- 나쁨: 중복 로드 -->
<link rel="stylesheet" href="assets/css/common-new.css">
<link rel="stylesheet" href="assets/css/common-new.css">
```

---

## 🏷️ 네이밍 규칙 (BEM 방식)

### Block Element Modifier (BEM)

```
.block__element--modifier
```

### 예시

```css
/* ✅ 좋은 예시 - 명확한 네임스페이스 */

/* Block */
.greeting { }
.greeting__content { }
.greeting__quote { }
.greeting__text { }
.greeting__image { }
.greeting__signature { }

/* Element with Modifier */
.greeting__quote--blue { }
.greeting__text--large { }

/* Schedule 페이지 */
.schedule { }
.schedule__section { }
.schedule__title { }
.schedule__cards { }
.schedule__card { }
.schedule__card--blue { }
.schedule__card--teal { }

/* Ministry (섬기는 사람들) */
.ministry { }
.ministry__section { }
.ministry__category { }
.ministry__content { }
.ministry__row { }
.ministry__label { }
.ministry__names { }
```

### ❌ 나쁜 예시 (충돌 위험)

```css
/* 나쁨: 너무 일반적인 이름 */
.content { }
.section { }
.title { }
.card { }

/* 나쁨: 카멜케이스 혼용 */
.greetingContent { }
.ScheduleCard { }

/* 나쁨: 네임스페이스 없음 */
.quote { }
.text { }
.image { }
```

---

## 🎨 CSS 변수 사용법

### 색상

```css
/* ✅ 좋은 예시 */
.greeting__quote {
    color: var(--color-primary);        /* #182B8C */
    background: var(--color-bg-blue-light);
}

.schedule__card--blue {
    background-color: var(--color-primary);
    color: var(--color-white);
}

/* ❌ 나쁜 예시 */
.greeting__quote {
    color: #182B8C;  /* 하드코딩 금지! */
}
```

### 자주 사용하는 색상

| 변수명 | 색상 | 용도 |
|--------|------|------|
| `--color-primary` | #182B8C | 메인 브랜드 색상 |
| `--color-secondary-1` | #0094BE | 서브 색상 1 |
| `--color-secondary-2` | #00A895 | 서브 색상 2 |
| `--color-white` | #FFFFFF | 흰색 |
| `--color-black` | #000000 | 검은색 |
| `--color-text-primary` | #000000 | 기본 텍스트 |
| `--color-text-secondary` | #666666 | 보조 텍스트 |

### 폰트 크기

```css
/* ✅ 좋은 예시 */
.greeting__quote {
    font-size: var(--font-size-h3);      /* 32px */
    font-weight: var(--font-weight-bold); /* 700 */
    line-height: var(--line-height-tight); /* 1.2 */
}

.greeting__text {
    font-size: var(--font-size-body-lg);  /* 20px */
    line-height: var(--line-height-loose); /* 1.8 */
}
```

### 간격 (Spacing)

```css
/* ✅ 좋은 예시 */
.greeting__content {
    padding: var(--spacing-2xl) var(--spacing-xl);
    margin-bottom: var(--spacing-3xl);
    gap: var(--spacing-md);
}

/* 8px 단위 시스템 */
--spacing-xs: 8px;
--spacing-sm: 16px;
--spacing-md: 24px;
--spacing-lg: 32px;
--spacing-xl: 40px;
--spacing-2xl: 60px;
--spacing-3xl: 80px;
```

### Border Radius

```css
.schedule__card {
    border-radius: var(--radius-xl);  /* 20px */
}

.button {
    border-radius: var(--radius-md);  /* 8px */
}
```

### Transition

```css
.greeting__image {
    transition: all var(--transition-base);  /* 0.3s ease */
}

.button:hover {
    transition: transform var(--transition-fast);  /* 0.15s ease */
}
```

---

## 📱 반응형 작업 가이드

### 브레이크포인트

```css
/* Mobile First 접근 */

/* 기본 (모바일) */
.greeting__quote {
    font-size: var(--font-size-h3-mobile);  /* 20px */
    padding: var(--spacing-md);
}

/* 데스크톱 (768px 이상) */
@media (min-width: 768px) {
    .greeting__quote {
        font-size: var(--font-size-h3);  /* 32px */
        padding: var(--spacing-2xl);
    }
}
```

### 공통 패턴

```css
/* 컨테이너 */
.greeting__content {
    max-width: var(--container-max-width);  /* 1260px */
    margin: 0 auto;
    padding: 0 var(--container-padding-mobile);  /* 20px */
}

@media (min-width: 768px) {
    .greeting__content {
        padding: 0 var(--container-padding);  /* 40px */
    }
}
```

---

## ✅ 체크리스트

새 페이지 CSS 작성 시 체크:

### 1. 파일 생성
- [ ] `assets/css/pages/` 폴더에 생성
- [ ] 파일명: `{페이지명}.css` (예: `greeting.css`)

### 2. CSS 구조
- [ ] 파일 상단에 주석으로 페이지명 명시
- [ ] BEM 방식 네이밍 적용
- [ ] CSS 변수만 사용 (하드코딩 금지)
- [ ] 글로벌 리셋 금지 (`* { margin: 0; }` 등)

### 3. HTML 로드 순서
- [ ] variables.css 먼저
- [ ] reset.css 두 번째
- [ ] common-new.css 세 번째
- [ ] 페이지 CSS 마지막

### 4. 반응형
- [ ] Mobile First 접근
- [ ] 브레이크포인트 768px 사용
- [ ] 변수 활용 (font-size-mobile 등)

### 5. 테스트
- [ ] 다른 페이지에 영향 없는지 확인
- [ ] 모바일/데스크톱 모두 확인
- [ ] 콘솔에 CSS 오류 없는지 확인

---

## 💡 자주 하는 실수

### 1. CSS 중복 로드
```html
❌ 나쁨:
<link rel="stylesheet" href="assets/css/common-new.css">
<link rel="stylesheet" href="assets/css/common-new.css">

✅ 좋음:
<link rel="stylesheet" href="assets/css/common-new.css">
```

### 2. 네임스페이스 없는 클래스
```css
❌ 나쁨:
.content { }
.section { }

✅ 좋음:
.greeting__content { }
.schedule__section { }
```

### 3. 하드코딩된 값
```css
❌ 나쁨:
.quote {
    color: #182B8C;
    font-size: 32px;
    margin-bottom: 60px;
}

✅ 좋음:
.greeting__quote {
    color: var(--color-primary);
    font-size: var(--font-size-h3);
    margin-bottom: var(--spacing-2xl);
}
```

### 4. 글로벌 리셋 중복
```css
❌ 나쁨: greeting.css에 작성
* {
    margin: 0;
    padding: 0;
}

✅ 좋음: reset.css에만 있음 (추가 작성 금지)
```

---

## 🚀 다음 단계

이제 기반이 완성되었으니:

1. ✅ **기존 페이지 하나 선택** (greeting.html 추천)
2. **리팩토링 실습** (이 가이드 따라하기)
3. **다른 페이지에 적용**

궁금한 점이 있으면 언제든 질문하세요! 🙂