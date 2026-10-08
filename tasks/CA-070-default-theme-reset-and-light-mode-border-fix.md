# CA-070 - Default Theme Reset and Light Mode Border Fix

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Thêm preset "Campus Default" làm theme mặc định chính thức và sửa bug light mode bị viền đen/nút đen sau khi thay đổi lớn trong Appearance/Theme.

## Quy tac an toan & Kien truc

- **Preset hệ thống**: Thêm `Campus Default` đứng đầu danh sách (`id: "campus-default"`). Tự động điều chỉnh màu theo `themeMode` (Light/Dark).
- **Nút Khôi phục**: Reset về `Campus Default` theo đúng `themeMode` active.
- **Theme switch**: Đổi Sáng/Tối không đè màu tùy chỉnh cá nhân của user.
- **No Data Contract Change**: KHÔNG thêm `borderColor` vào `AppearanceSettings`.
- **CSS Scope**: Không xóa `#000` toàn cục. Chỉ sửa các rule gây viền/nút/card đen trong Light mode.
- **Bảo toàn Invariants**: Chưa bấm **Áp dụng** thì không lưu thật xuống storage/backend.

## Duoc phep lam

- Sửa `src/pages/AppearancePage.tsx`.
- Sửa `src/hooks/useAppearanceDraft.ts`.
- Sửa `src/styles.css`.
- Cập nhật `tools/layout-regression-check.cjs`.
- Cập nhật `tasks/TASK_INDEX.md` và `PROJECT_TASKS.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi logic lưu ảnh nền.
- Không xóa hệ thống preset cá nhân.
- Không đổi Tauri command.
- Không hardcode toàn app sang một màu.
- Không ghi đè lựa chọn người dùng nếu chưa bấm Áp dụng.

## Evidence commands

```powershell
rg -n "campus-default|e5e7eb|Campus Default" src/pages/AppearancePage.tsx src/styles.css
npm run check:all
```

## File duoc phep sua

- `tasks/CA-070-default-theme-reset-and-light-mode-border-fix.md` [NEW]
- `src/pages/AppearancePage.tsx`
- `src/hooks/useAppearanceDraft.ts`
- `src/styles.css`
- `tools/layout-regression-check.cjs`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Có `Campus Default` trong Chủ đề mẫu hệ thống.
- Chọn Light mode không còn viền đen/nút đen.
- Chọn Dark mode vẫn rõ nét.
- Bấm `Khôi phục` reset sạch sẽ về default preset theo đúng mode.
- Đổi preset khác rồi Hoàn tác / Áp dụng vẫn đúng draft behavior.
- `npm run check:all` pass.

## Ket qua thuc hien

- Them `Campus Default` vao dau danh sach preset he thong.
- `Khôi phục` dung `getDefaultAppearanceForTheme(draftTheme)` de reset dung Light/Dark dang chon.
- Doi Light/Dark chi dong bo mau dang o che do auto, khong ghi de mau tuy chinh cua user.
- Them CSS guard cuoi file cho light mode: panel/card dung `--panel`, border dung `--border: #e5e7eb`, secondary button khong bi nen den.
- Them static assertions vao `tools/layout-regression-check.cjs`.

## Evidence

- `npm run test`: 6 files / 50 tests pass.
- `npm run test:layout`: pass.
- `npm run build`: pass.
- `npm run check:rust`: pass.
- `npm run test:rust`: 35 tests pass.
- `npm audit`: 0 vulnerabilities.
- `npm run check:all`: pass.

## Manual visual

- Chua co manual visual check tu user. Source va static regression da pass; neu UI thuc te van con viền/nút đen trong theme sáng, mo task bug moi dua tren anh chup runtime.
