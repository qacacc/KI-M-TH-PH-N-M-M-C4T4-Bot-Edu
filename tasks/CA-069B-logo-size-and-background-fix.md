# CA-069B - Logo Size and Background Fix

## Trang thai

- Status: Done
- Owner: AI + User review
- Completed: 2026-07-28

## Muc tieu duy nhat

Sửa logo app trong sidebar/titlebar để hiển thị to rõ (30px-32px ở expanded, 32px-34px ở collapsed 54px), loại bỏ background vuông tối chìm của `.brand-icon` khi chứa logo, thêm `src/vite-env.d.ts` sửa lỗi import TypeScript PNG.

## Quy tac an toan & Kien truc

- **File mới**: Tạo `src/vite-env.d.ts` chứa `/// <reference types="vite/client" />`.
- **CSS Wrapper**: Dùng `.brand-icon.logo-brand` với `background: transparent; border: none; width: auto; height: auto;`.
- **Kích thước logo**:
  - Expanded (260px): `30px` × `30px`.
  - Collapsed (54px rail): `32px` × `32px` (hoặc `34px` × `34px`).
  - Titlebar: `18px` × `18px`.
  - `object-fit: contain;`
- **Bảo toàn Invariants**: Không đổi layout sidebar, không đổi navigation, không đổi theme system, không đổi Tauri command.

## Duoc phep lam

- Tạo `src/vite-env.d.ts`.
- Sửa `src/App.tsx`.
- Sửa `src/styles.css`.
- Cập nhật `tools/layout-regression-check.cjs`.
- Cập nhật `tasks/TASK_INDEX.md` và `PROJECT_TASKS.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi layout hay thiết kế lại sidebar.
- Không thay các icon chức năng khác.
- Không đụng Appearance/background system.
- Không đổi Tauri command.

## Evidence commands

```powershell
rg -n "logo-brand|brand-logo-img|vite/client" src/App.tsx src/styles.css src/vite-env.d.ts
npm run check:all
```

## File duoc phep sua

- `tasks/CA-069B-logo-size-and-background-fix.md` [NEW]
- `src/vite-env.d.ts` [NEW]
- `src/App.tsx`
- `src/styles.css`
- `tools/layout-regression-check.cjs`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- File `src/vite-env.d.ts` tồn tại, sửa lỗi TypeScript build.
- Logo sidebar collapsed nhìn to rõ ở rail 54px.
- Không còn cảm giác logo bị đặt trong ô vuông nền tối.
- Logo không méo, không crop.
- Light/dark mode đều rõ nét.
- `npm run check:all` pass.
