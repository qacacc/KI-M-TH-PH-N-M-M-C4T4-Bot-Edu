# CA-069 - Unified App Logo System

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Thiết lập hệ thống logo nhận diện thống nhất cho Campus Assistant Local. Dùng logo chính từ file `logo.png` cho Sidebar Brand, Collapsed Rail và Titlebar App Icon.

## Quy tac an toan & Kien truc

- **Nguồn ảnh**: Sao chép `logo.png` (1024x1024, nền trong suốt) từ root sang `src/assets/logo.png`.
- **Phạm vi áp dụng**: Chỉ thay thế brand icon ở Sidebar và Titlebar. Không đụng đến các icon chức năng khác.
- **CSS Guard**: Áp dụng `object-fit: contain` và `image-rendering: -webkit-optimize-contrast` bảo đảm không méo/crop/blur.
- **Windows Executable**: `src-tauri/icons/icon.ico` giữ nguyên theo `tauri.conf.json`.
- **Bảo toàn Invariants**: Không đổi layout, không đổi theme system, không đổi Tauri command.

## Duoc phep lam

- Tạo `src/assets/logo.png`.
- Sửa `src/App.tsx`.
- Sửa `src/styles.css`.
- Cập nhật `tools/layout-regression-check.cjs`.
- Cập nhật `tasks/TASK_INDEX.md` và `PROJECT_TASKS.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi layout hay thiết kế lại sidebar.
- Không thay các icon chức năng khác.
- Không đụng Appearance/background system.
- Không đổi Tauri command.
- Không thêm dependency.

## Evidence commands

```powershell
rg -n "brand-logo-img|titlebar-logo-img|appLogo" src/App.tsx src/styles.css
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-069-unified-app-logo-system.md` [NEW]
- `src/assets/logo.png` [NEW]
- `src/App.tsx`
- `src/styles.css`
- `tools/layout-regression-check.cjs`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Logo mới xuất hiện trong Sidebar (Expanded & Collapsed rail 54px).
- Logo mới xuất hiện trong Titlebar.
- Logo nhìn rõ ở 16px, 22px, 24px, không bị méo/crop.
- `npm run check:all` pass.
