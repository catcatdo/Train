# Train

열차시간표 및 4인 기타차고 일정 캘린더 UI입니다.

## GitHub Pages 배포 방법

1. 이 저장소를 GitHub에 푸시합니다.
2. GitHub 저장소로 이동합니다.
3. **Settings → Pages**로 이동합니다.
4. **Build and deployment**에서:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (또는 현재 사용하는 브랜치)
   - **Folder**: `/ (root)`
5. **Save**를 누르면 잠시 후 Pages URL이 생성됩니다.

> 참고: `index.html`이 저장소 루트에 있어야 Pages가 정상적으로 열립니다.

## 로컬 미리보기

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000/` 또는 `http://localhost:8000/index.html`로 접속합니다.
