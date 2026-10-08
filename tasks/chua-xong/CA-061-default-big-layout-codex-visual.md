# CA-061 - Default Big Layout & Codex-like Visual System

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Cải thiện layout mặc định của Campus Assistant theo hướng gọn, hiện đại, dễ đọc, giống tinh thần Codex-like: màu trung tính (Neutral Gray), màu nhấn mặc định Blue Accent (`#3b82f6`), box nhẹ, chữ rõ, spacing đều, ít shadow, không dùng màu tím chói làm mặc định.

Task này chỉ sửa **giao diện mặc định**. Không đụng hệ thống người dùng tự chọn màu, background, preset hoặc theme cá nhân trong Appearance Studio.

## Duoc phep lam

- Cập nhật design tokens mặc định trong `:root` và `:root[data-theme="light"]` trong `src/styles.css`.
- Cập nhật fallback màu nhấn mặc định khi chưa có cài đặt cá nhân từ `#6d5dfc` thành `#3b82f6` trong `useAppearanceDraft.ts` và `App.tsx`.
- Refine layout cho App Shell, Sidebar, Titlebar, Chat Layout, Settings Page (1-column 760px), Cards, Buttons, Tables.
- Bổ sung static layout assertion vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không xóa tính năng tùy biến giao diện.
- Không đổi logic chat.
- Không đổi SSO/API trường.
- Không đổi Tauri command/payload.
- Không thêm dependency.
- Không refactor lớn App.tsx.
- Không sửa theo cảm tính nếu chưa có token/layout rule rõ.
- Không báo DONE nếu chưa có screenshot/manual visual check.

## Design Tokens mac dinh

### Dark Default
- `--bg: #181818`
- `--surface: #1f1f1f`
- `--panel: #242424`
- `--panel-soft: #2a2a2a`
- `--panel-hover: #303030`
- `--border: #333333`
- `--text: #f5f5f5`
- `--muted: #a3a3a3`
- `--muted-2: #737373`
- `--accent: #3b82f6`
- `--accent-hover: #60a5fa`
- `--accent-contrast: #ffffff`

### Light Default
- `--bg: #f7f7f8`
- `--surface: #ffffff`
- `--panel: #ffffff`
- `--panel-soft: #f3f4f6`
- `--panel-hover: #eef0f3`
- `--border: #e5e7eb`
- `--text: #111827`
- `--muted: #6b7280`
- `--muted-2: #9ca3af`
- `--accent: #3b82f6`
- `--accent-hover: #2563eb`
- `--accent-contrast: #ffffff`

## File duoc phep sua

- `tasks/chua-xong/CA-061-default-big-layout-codex-visual.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/hooks/useAppearanceDraft.ts`
- `src/App.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/SchoolPage.tsx`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Default UI nhìn đồng bộ hơn, bớt tím, bớt shadow.
- Settings, sidebar, chat dùng cùng hệ token neutral gray + blue accent.
- Không làm mất hệ thống tùy biến của người dùng.
- Không có nút trống/mất chữ/mất icon.
- `npm run check:all` pass.
- Báo cáo có file:line và ghi rõ AUTOMATED, STATIC SOURCE CHECK, MANUAL VISUAL CHECK.
