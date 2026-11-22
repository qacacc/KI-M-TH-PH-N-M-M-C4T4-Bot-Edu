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
- **Windows Executable**: `src-tauri/icons/icon.ico` được sinh từ master `src-tauri/icons/app-icon.png` bằng `npx tauri icon`; cấu hình Tauri tiếp tục tham chiếu `icons/icon.ico`.
- **Bảo toàn Invariants**: Không đổi layout, không đổi theme system, không đổi Tauri command.

## Duoc phep lam

- Tạo `src/assets/logo.png`.
- Tạo `src-tauri/icons/app-icon.png` và sinh `src-tauri/icons/icon.ico` từ logo UTH.
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
- Không sửa Postman/API; icon desktop không tạo HTTP contract.

## Evidence commands

```powershell
rg -n "brand-logo-img|titlebar-logo-img|appLogo" src/App.tsx src/styles.css
npm run check:all
npx tauri icon src-tauri/icons/app-icon.png --output <thu_muc_tam>
```

## File duoc phep sua

- `tasks/chua-xong/CA-069-unified-app-logo-system.md` [NEW]
- `src/assets/logo.png` [NEW]
- `src-tauri/icons/app-icon.png` [NEW]
- `src-tauri/icons/icon.ico`
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
- Windows taskbar/executable dùng đúng logo UTH, không còn icon chữ CA.
- `npm run check:all` pass.

## Kiểm thử tương đương, biên và Postman

- Postman: `N/A` — thay đổi tài nguyên icon desktop, không có endpoint HTTP.
- Lớp hợp lệ: PNG vuông RGBA có alpha và nội dung logo UTH; ICO chứa các kích cỡ Windows do Tauri sinh.
- Lớp không hợp lệ: PNG không đọc được/không vuông/thiếu alpha; ICO chỉ có ảnh placeholder 32×32.
- BVA kích thước hiển thị: 16, 22, 24, 32, 48, 256 px; kiểm tra cạnh và nền trong suốt ở từng frame.
- Test cases: (1) master 1024×1024; (2) alpha có vùng trong suốt; (3) mark không bị crop; (4) tỷ lệ không méo; (5) ICO đọc được; (6) ICO có nhiều kích cỡ; (7) Tauri config trỏ `icons/icon.ico`; (8) desktop build thành công; (9) app khởi động sau build; (10) taskbar hiển thị UTH thay CA — mục 10 cần kiểm tra trực quan trên Windows.

## Evidence hiện tại — 2026-11-23

- `CONFIRMED`: `src/assets/logo.png` là 663×402 RGBA, alpha range 0..255.
- `CONFIRMED`: master 1024×1024 được tạo; logo 1004×609, nền trong suốt; `npx tauri icon` tạo ICO có 16, 24, 32, 48, 64, 256 px.
- `CONFIRMED`: `npm run build` PASS; `npm run dev:desktop` biên dịch lại Rust/Tauri sau `cargo clean -p campus-assistant-local` và chạy app.
- `CONFIRMED`: icon resource trích trực tiếp từ `src-tauri/target/debug/campus-assistant-local.exe` hiển thị mark UTH; kích thước resource Windows trích xuất là 32×32.
- `UNKNOWN`: taskbar visual trên desktop chưa được chụp xác nhận; Windows có thể lưu cache icon cũ.
- `npm run check:all`: Vitest 116/116 và layout pass; dừng tại `check:postman` do secret/PII guard (`tools/postman-guards.cjs:33`, `tools/check-postman.cjs:18`). Không sửa Postman theo phạm vi đã duyệt.
