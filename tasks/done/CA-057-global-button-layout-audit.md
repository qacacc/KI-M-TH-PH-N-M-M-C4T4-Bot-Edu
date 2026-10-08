# CA-057 - Global Button & Spacing Layout Audit

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Kiểm tra và chuẩn hóa hệ thống `<button>` cùng parent spacing layout trên toàn bộ ứng dụng, khắc phục triệt để các lỗi: button bị cắt mép dưới, icon/text không căn giữa, button cao/thấp bất thường, tràn card/box, parent còn đường kẻ/spacing thừa, và button primary/secondary/danger nhìn không cùng hệ.

## Duoc phep lam

- Rà soát toàn bộ `<button>` trong source code.
- Chuẩn hóa CSS base cho `button` trong `src/styles.css`.
- Chuẩn hóa các class button hệ thống:
  - `settings-btn-primary`
  - `settings-btn-secondary`
  - `settings-btn-danger`
  - `school-mode-btn`
  - `school-accordion-header`
  - `.segmented-control button`
  - `.composer-chip`
  - `.sidebar-item` / `.titlebar-nav-btn`
  - Icon-only buttons
- Sửa spacing parent container nếu làm button bị cắt hoặc có đường kẻ/spacing thừa mồ côi.
- Thêm quy tắc kiểm tra static contract vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi logic chức năng của nút.
- Không đổi Tauri command/payload.
- Không thêm dependency mới.
- Không refactor `App.tsx`.
- Không sửa giao diện ngoài phạm vi button/spacing liên quan.
- Không đổi màu/theme lớn.

## File duoc phep sua

- `tasks/done/CA-057-global-button-layout-audit.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/pages/SchoolPage.tsx` (nếu parent layout gây lỗi button)
- `src/pages/AppearancePage.tsx` (nếu button/picker bị lỗi)
- `src/pages/SettingsPage.tsx` (nếu button setting bị lỗi)
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Mọi button có text/icon căn giữa dọc và không bị cắt mép dưới.
- Hệ thống button Primary / Secondary / Danger có kích thước, padding, border-radius và font-size cùng hệ chuẩn xác.
- Không còn đường kẻ/box trống bất thường sau button.
- Button disabled vẫn hiển thị rõ ràng trạng thái disabled.
- Danger button nằm riêng biệt, không lẫn với primary button.
- static layout regression check (`npm run test:layout`) và `npm run check:all` PASS 100%.

## Ket qua hoan thanh

- Them runtime button contract override cuoi `src/styles.css` de thang cac dinh nghia button cu bi trung cascade.
- Chuan hoa base `button`: `inline-flex`, center icon/text, `gap: 8px`, `line-height: 1.4`, `box-sizing: border-box`.
- Chuan hoa `settings-btn-primary`, `settings-btn-secondary`, `settings-btn-danger`: `min-height: 38px`, padding, border radius, font size va disabled state dong bo.
- Chuan hoa cac nhom button hay loi: `school-mode-btn`, `school-accordion-header`, `.segmented-control button`, `.composer-chip`, composer actions, titlebar/sidebar/send button.
- Them static contract vao `tools/layout-regression-check.cjs` de bat regression button alignment/min-height.
- `npm run check:all` pass: 50 Vitest, layout check, Vite build, Cargo check, 34 Rust tests, npm audit 0 vulnerabilities.

## Chua lam trong task nay

- Chua click GUI desktop bang tay tren tat ca trang.
- Chua them Playwright/screenshot visual test vi task khong them dependency.
- Khong doi logic nut, Tauri command/payload, schema hoac dependency.
