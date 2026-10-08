# CA-063 - Codex Default Runtime Theme & Layout Contract

## Trang thai

- Status: In Progress
- Owner: AI + User manual visual review
- Created: 2026-07-28

## Muc tieu duy nhat

Sửa trực tiếp giao diện mặc định sáng/tối của Campus Assistant theo hướng giống Codex desktop hơn ở runtime cuối cùng: font, màu nền, titlebar, sidebar, content spacing, card, bubble và composer. Task này chỉ chỉnh **mặc định hệ thống**.

## Bang chung loi

- CA-061/CA-062 đã thêm token/rule nhưng cascade CSS cũ vẫn làm visual thực tế lệch.
- Ảnh user gửi cho thấy sidebar/content, border, composer và màu mặc định vẫn không giống Codex.
- Màu legacy default `#6d5dfc` có thể vẫn nằm trong settings cũ, làm app tiếp tục hiện tím dù default mới là xanh.

## Duoc phep lam

- Thêm runtime winner block cuối `src/styles.css` để thắng các block cũ.
- Dùng font stack mặc định kiểu Codex: `Inter`, `Segoe UI`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
- Chuẩn hóa titlebar/sidebar/content/composer/card/bubble/button theo token hiện có.
- Migrate riêng màu nhấn legacy default `#6d5dfc` sang default mới `#3b82f6`.
- Đổi palette `Khôi phục` sang Codex Neutral dark/light thật trong `useAppearanceDraft.ts`.
- Đảm bảo preview Sáng/Tối trong Appearance dùng biến màu cục bộ của bản nháp, không bị runtime app thật đè.
- Bổ sung static regression checks.
- Cập nhật task governance.

## Khong duoc lam

- Không thay đổi cách hoạt động của background image, overlay, preset cá nhân hoặc Appearance Studio.
- Không xóa màu/preset người dùng đã tạo.
- Không sửa logic chat.
- Không sửa SSO/API trường.
- Không đổi Tauri command/payload.
- Không thêm dependency.
- Không báo Done nếu chưa có manual visual check.

## File duoc phep sua

- `tasks/chua-xong/CA-063-codex-default-runtime-theme.md`
- `tasks/chua-xong/CA-062-actual-codex-layout-visual-fix.md`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `src/styles.css`
- `src/hooks/useAppearanceDraft.ts`
- `src/pages/AppearancePage.tsx`
- `tools/layout-regression-check.cjs`

## Evidence commands

```powershell
rg -n "CA-063 CODEX DEFAULT RUNTIME CONTRACT|width: min\(100%, 820px\) !important|background: var\(--bg\) !important|backdrop-filter: none !important|legacyDefaultAccent|normalizeDefaultAccent" src/styles.css src/hooks/useAppearanceDraft.ts
npm run check:all
```

## Tieu chi hoan thanh

- Default font/runtime contract giống hướng Codex hơn.
- Titlebar/sidebar/content không còn dùng visual glass/viền nặng làm mặc định.
- Composer mặc định gọn, border trung tính, focus ring nhẹ.
- Bubble/card/starter cards dùng border/panel trung tính.
- Nút `Khôi phục` không kéo default về Dream Glass/tím.
- Nút preview `Sáng`/`Tối` vẫn đổi được preview sau khi khôi phục.
- Không đụng background/preset custom.
- `npm run check:all` pass.
- Manual visual check vẫn phải do user xác nhận trước khi chuyển Done.
