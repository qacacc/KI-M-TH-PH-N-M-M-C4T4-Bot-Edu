# CA-060 - Fix Settings Tab Active Blank State

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Sửa triệt để lỗi giao diện (Visual Bug): Tab Cài đặt active (`.settings-tab.active`) bị chuyển thành ô trống màu trắng viền tím trong Light Mode khi di chuột hoặc focus.

## Ly do

Quy tắc toàn cục `button:hover:not(:disabled)` trong `src/styles.css` đè `background` thành `var(--panel-strong)` (`#ffffff` trong Light Mode), trong khi `color` của tab active vẫn giữ `#ffffff`. Hậu quả là text "Chung" và icon `<Sliders />` bị chìm màu trắng trên nền trắng.

## Duoc phep lam

- Sửa `src/styles.css` bổ sung selector `.settings-tab.active:hover` và `.settings-tab.active:focus-visible` ép `background: var(--accent) !important` và `color: var(--accent-contrast, #ffffff) !important`.
- Rà soát các lớp nút active khác (`.segmented-control button.active`, `.school-mode-btn.active`, `.settings-btn-primary`, `.settings-toggle.active`).
- Thêm static regression check vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không refactor `App.tsx` hoặc `SettingsPage.tsx` ngoài phạm vi layout/CSS liên quan.
- Không đổi Tauri command/payload.
- Không thêm dependency mới.
- Không sửa UI theo cảm tính nếu chưa xác định selector gây lỗi.

## File duoc phep sua

- `tasks/chua-xong/CA-060-fix-settings-tab-active-blank-state.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/pages/SettingsPage.tsx`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Tab Settings active hiển thị rõ ràng icon + text trắng tương phản 100% trên nền accent tím ở cả Light Mode và Dark Mode.
- Di chuột hover hoặc focus vào tab active không làm biến đổi background thành trắng hay mất chữ.
- Static regression check bắt được quy tắc `.settings-tab.active:hover`.
- `npm run check:all` PASS 100%.
