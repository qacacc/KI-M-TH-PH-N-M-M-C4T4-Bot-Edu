# CA-059 - Sửa lỗi button/control bị trống, cắt nội dung và không hiển thị nhãn

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Kiểm tra và khắc phục triệt để toàn bộ các nút/control trong ứng dụng bị hiển thị trống, mất icon/text, bị cắt mép, hoặc chỉ còn ô viền tím không có nội dung.

## Ly do

Lỗi nút chỉ hiển thị viền tím trống không có icon/text thường phát sinh do:
- Class `.settings-quick-btn` hoặc `.settings-toggle` bị định nghĩa trùng lặp với `color: var(--text)` hoặc thiếu child `<span>`;
- CSS base `button` với `display: inline-flex` đè mất `display: grid` của `.codex-option-card` / `.school-option-card`;
- Nút icon-only thiếu `aria-label` làm thiết bị trợ năng hoặc layout check không nhận dạng được nhãn;
- Phân bố flex/grid bị co hẹp min-width khiến text bị ép mất.

## Duoc phep lam

- Sửa `src/styles.css` loại bỏ toàn bộ định nghĩa CSS trùng lặp của `.settings-quick-btn`, `.settings-toggle`.
- Ép kiểu `display: grid !important` cho `.codex-option-card` và `.school-option-card`.
- Chuẩn hóa kích thước cố định, text/icon visibility, và `aria-label` cho tất cả icon-only buttons trong `App.tsx`, `AppearancePage.tsx`, `SettingsPage.tsx`, `SchoolPage.tsx`.
- Thêm kiểm tra static contract vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không refactor `App.tsx` lớn ngoài việc bổ sung `aria-label`.
- Không đổi flow đăng nhập trường.
- Không đổi Tauri command/payload.
- Không thêm dependency mới.
- Không sửa UI theo cảm tính nếu chưa xác định selector gây lỗi.

## File duoc phep sua

- `tasks/done/CA-059-control-visibility-and-a11y-audit.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/App.tsx`
- `src/pages/AppearancePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/SchoolPage.tsx`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Không còn ô button/control trống chỉ có viền.
- Không còn text/icon bị cắt mép.
- Trạng thái disabled vẫn hiển thị rõ ràng nội dung, giảm opacity hợp lý (~0.48).
- Tất cả icon-only buttons có icon rõ ràng và `aria-label`.
- `npm run check:all` PASS 100%.
