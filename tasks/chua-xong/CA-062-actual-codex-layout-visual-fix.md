# CA-062 - Fix Actual Codex-like Layout After Visual Review

## Trang thai

- Status: Superseded by CA-063
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Sửa lại layout thực tế sau manual visual check để app nhìn gần Codex hơn: sidebar không đè content, border nhẹ, text rõ, spacing đúng, composer gọn, default theme trung tính.

## Ket luan sau review

Task này bị thay thế bởi `CA-063 - Codex Default Runtime Theme & Layout Contract` vì các rule CA-062 chưa đủ làm runtime winner và vẫn có nguy cơ bị cascade CSS cũ đè. Không báo Done cho CA-062.

## Bang chung loi

- Sidebar đang phủ/đè lên main content khi mở hoặc hover.
- Main content bị nằm dưới sidebar.
- Border đen quá dày trên nhiều box (`#000` / `black`).
- Text trong card/chip bị mờ, opacity kém.
- Composer và card dùng viền tím quá mạnh.
- Default layout chưa đạt cảm giác Codex desktop.

## Duoc phep lam

- Sửa `src/styles.css` tách biệt layout của `.sidebar` và `.content` bằng `--sidebar-current-width` / margin-left để không bao giờ bị đè.
- Loại bỏ toàn bộ border đen chói `#000` / `black`, thay bằng `var(--border)` trung tính.
- Tăng độ tương phản text và độ đọc của cards/chips.
- Thu gọn Composer, dùng border và focus ring nhẹ.
- Thêm static regression check vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không sửa logic chat.
- Không sửa SSO/API trường.
- Không xóa hệ thống tùy biến giao diện.
- Không thêm dependency.
- Không báo DONE nếu chưa có manual visual check mới.

## Evidence commands

```powershell
rg -n "border:.*#000|border:.*black|border: 1px solid #|box-shadow|opacity: 0\.|sidebar|app-shell|main-content|composer" src/styles.css
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-062-actual-codex-layout-visual-fix.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/App.tsx`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Sidebar không còn đè nội dung.
- Không còn đường viền đen dày.
- Text/cards/chips đọc rõ.
- Composer gọn và giống Codex hơn.
- `npm run check:all` pass 100%.
- Có manual visual check mới sau sửa.
