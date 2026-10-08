# CA-067 - Chat History Delete Modal Polish

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Cải thiện popup xác nhận xóa lịch sử trò chuyện để phù hợp với giao diện Campus Assistant hiện tại, hỗ trợ đúng light/dark theme, không dùng hardcode dark glassmorphism.

## Quy tac an toan & Kien truc

- **Token**: Dùng `var(--text)`, `var(--muted)`, `var(--panel)`, `var(--border)`. Không dùng `var(--fg)` đơn độc.
- **Overlay**: Light mode dùng `rgba(17, 24, 39, 0.28)` blur 2px; Dark mode dùng `rgba(0, 0, 0, 0.42)`. Không pha từ `var(--bg)`.
- **Nội dung modal mới**:
  - Single: *"Xóa đoạn chat?"* | *"Đoạn chat này sẽ bị xóa khỏi lịch sử local trên thiết bị này."* | *"Hành động này không thể hoàn tác."*
  - All: *"Xóa toàn bộ lịch sử?"* | *"Tất cả đoạn chat đã lưu local sẽ bị xóa khỏi thiết bị này."* | *"Hành động này không thể hoàn tác."*
- **Accessibility**: Thêm `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, lắng nghe `Escape`, click overlay đóng modal, `autoFocus` nút Hủy.
- **Giữ nguyên logic xóa**: Không đổi logic xóa session, không đổi Tauri command, không đổi SQLite schema.
- **Static check**: Kiểm tra không còn `#1a1a1a`, `#ff2a4b`, `rgba(0, 0, 0, 0.65)` trong modal CSS.

## Duoc phep lam

- Sửa `src/pages/ChatHistoryPage.tsx`.
- Sửa `src/styles.css`.
- Cập nhật `tools/layout-regression-check.cjs`.
- Cập nhật `tasks/TASK_INDEX.md` và `PROJECT_TASKS.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi logic xóa session.
- Không đổi Tauri command.
- Không đổi SQLite schema.
- Không sửa sidebar hay Appearance/background system.
- Không thêm dependency.
- Không quay lại `window.confirm`.

## Evidence commands

```powershell
rg -n "history-modal-overlay|delete-modal-title|modal-btn-delete" src/pages/ChatHistoryPage.tsx src/styles.css
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-067-chat-history-delete-modal-polish.md` [NEW]
- `src/pages/ChatHistoryPage.tsx`
- `src/styles.css`
- `tools/layout-regression-check.cjs`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Modal nhìn hợp trong light mode và dark mode.
- Không còn câu "Truy cập cài đặt...".
- Không hardcode màu dark toàn phần.
- Dùng `var(--text)`, `var(--muted)`, `var(--panel)`, `var(--border)`.
- Escape, overlay click, autoFocus nút Hủy hoạt động tốt.
- `npm run check:all` pass.
