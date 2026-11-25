# CA-106 - Sổ ghi chú học tập local

- Status: In Progress (Implementation & Automated Verification Complete)
- Priority: P1
- Mục tiêu: thay mục Lịch thi theo yêu cầu sản phẩm bằng sổ ghi chú cá nhân lưu bền vững trên thiết bị.
- Dependencies: không phụ thuộc Portal; backup/reset scope đã được đồng bộ với CA-090.

## Phạm vi

- Ghi chú tự do, tiêu đề, nội dung, môn học tùy chọn, ngày tạo/cập nhật; không giả lập lịch thi từ Portal.
- Tạo/sửa/xóa, tìm kiếm/lọc, trạng thái trống/lỗi; hỏi xác nhận trước xóa.
- Lưu qua native SQLite với migration có version (`user_version = 6`), backup/restore và reset scope rõ ràng.

## Tiêu chí nghiệm thu

- [x] CRUD lưu qua restart; không lưu ghi chú vào localStorage.
- [x] Mọi input được validate (BVA-03: `title` 1..100 ký tự; BVA-04: `content` 0..10.000 ký tự); lỗi DB hiển thị, không báo lưu thành công giả.
- [x] Xóa có confirm; backup/restore giữ nguyên Unicode và liên kết môn học.
- [x] Migration trên DB fixture cũ; test không dùng AppLocalData người dùng.
- [x] `npm run check:all` pass (74 Vitest, 64 Rust tests) và sẵn sàng cho manual visual check trên desktop.

## Evidence triển khai (2026-11-24)

- `src-tauri/src/models.rs:256-266`: Khai báo struct `StudentNoteRecord`.
- `src-tauri/src/db.rs:155-181` & `src-tauri/src/db.rs:753-978`: Triển khai `migrate_to_v6` tạo bảng `student_notes` và các hàm `list_student_notes_in_db`, `save_student_note_in_db`, `delete_student_note_in_db`, `import_student_notes_backup_in_db`.
- `src-tauri/src/lib.rs:155-265`: Đăng ký 4 Tauri commands (`list_student_notes`, `save_student_note`, `delete_student_note`, `import_student_notes_backup`).
- `src/types.ts:201-209`, `src/tauriApi.ts:384-422`, `src/tauriApi.test.ts:32-85`: Kết nối IPC và bổ sung unit tests Vitest cho luồng ghi chú.
- `src/pages/CampusDataPages.tsx:123-320`, `src/App.tsx:136`, `src/pages/SettingsPage.tsx:317`: Nâng cấp `NotesPage` lưu trực tiếp vào SQLite local, hỗ trợ tìm kiếm, lọc theo môn học, nhập mã/tên môn tùy chọn, xác nhận trước khi xóa và sao lưu/khôi phục tệp JSON.
- Automated (`npm run check:all`): **PASS** (74 Vitest tests, 64 Rust tests, layout regression PASS, build PASS, audit 0).
