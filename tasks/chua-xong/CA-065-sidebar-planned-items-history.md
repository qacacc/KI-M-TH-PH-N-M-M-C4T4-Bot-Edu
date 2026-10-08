# CA-065 - Sidebar Planned Items & History Entry

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Cải thiện sidebar bằng cách thêm các mục điều hướng “định hướng tương lai” (Lịch sử trò chuyện, Minigame, Phần thưởng) nhưng KHÔNG triển khai chức năng thật, KHÔNG lưu raw chat, KHÔNG thêm SQLite schema, KHÔNG kích hoạt task frozen CA-064.

## Duoc phep lam

- Thêm Section `Gần đây` chứa entry `Lịch sử trò chuyện` (badge `Local`) vào Sidebar ngay dưới `Phiên hiện tại`.
- Thêm Section `Khám phá` chứa entry `Minigame` và `Phần thưởng` (badge `Sắp có`) vào Sidebar ngay dưới `Tra cứu`.
- Bọc toàn bộ text trong `span.nav-label` và badge trong `span.nav-badge`.
- Thêm xử lý click: hiển thị thông báo hệ thống/toast an toàn (không tạo route/page mới, không lưu raw chat, không fake game/reward engine).
- Thêm quy tắc CSS ẩn 100% `nav-label` và `nav-badge` ở trạng thái rail collapsed 54px.
- Thêm static regression assertion kiểm tra cả `src/App.tsx` và `src/styles.css` vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi route hiện có hay tạo route/page mới.
- Không sửa chat logic hay bật lưu raw chat log.
- Không thêm Reward schema hay SQLite table.
- Không làm Minigame/Reward engine thật.
- Không chuyển CA-064 từ Frozen sang Active (giữ nguyên CA-064 Status: Frozen / Activation-only).
- Không thêm Mascot hay dependency.
- Không sửa backend/Tauri command.
- Không đổi Appearance/background system.
- Không báo DONE nếu chưa có manual visual check.

## Evidence commands

```powershell
rg -n "History|Gamepad2|Gift|nav-badge|Khám phá|Gần đây" src/App.tsx src/styles.css
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-065-sidebar-planned-items-history.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/App.tsx`
- `src/styles.css`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Có section `Gần đây` với `Lịch sử trò chuyện`.
- Có section `Khám phá` với `Minigame` và `Phần thưởng`.
- Minigame/Phần thưởng thể hiện rõ là chưa có chức năng thật (`Sắp có`).
- Collapsed sidebar 54px không bị chữ/badge đè dọc.
- Không có thay đổi backend/schema.
- Static check cả `src/App.tsx` và `src/styles.css` pass.
- `npm run check:all` pass.
- Không báo Done nếu chưa có manual visual check.
