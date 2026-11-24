# CA-106 — Kiểm thử backend sổ ghi chú học tập (PR #32)

## Phạm vi và sự thật

- **CONFIRMED (source):** SQLite `student_notes` có migration v6; Rust có hàm đọc/lọc (`src-tauri/src/db.rs:715`), lưu (`:775`), xóa (`:865`) và nhập bản sao lưu (`:876`), được đăng ký thành Tauri commands (`src-tauri/src/lib.rs:155,195`). Model nằm ở `src-tauri/src/models.rs:241`.
- **PLANNED:** giao diện ghi chú, confirm trước xóa/ghi đè, tích hợp Backup/Restore ở UI và E2E native. PR này chỉ là *backend part 1*, không coi CA-106 đã Done.
- **UNKNOWN:** kết quả thao tác người dùng thật trên Windows; chưa có nguồn Portal cho liên kết môn học. Không gán ghi chú local là dữ liệu trường.
- **Postman:** các hàm ở đây là Tauri IPC và SQLite nội bộ, **không có route HTTP**. `npm run check:postman` chỉ kiểm collection REST local, không kiểm CRUD ghi chú. Không thêm request Postman giả.

## Phân tích tác động

Entry: `list_student_notes`, `save_student_note`, `delete_student_note`, `import_student_notes_backup` → `open_db` → `student_notes`. Đọc/ghi: SQLite trong managed root; không ghi WebView, cookies hay GPA. Rủi ro: mất ghi chú khi import/rollback, ID rỗng, Unicode, giới hạn nội dung, lọc sai, schema repair đụng lịch. Bất biến: DATA-001/002/005, UI-002 (confirm ở UI tương lai), DOC-001. Ngày lịch cũ không được suy từ `fetched_at`.

## Lớp tương đương (EP)

| Đầu vào | Hợp lệ | Tag | Không hợp lệ | Tag |
| --- | --- | --- | --- | --- |
| ID ghi chú | ID không rỗng, hoặc bỏ trống khi tạo mới | V1 | ID chỉ khoảng trắng ở lệnh xóa/backup | X1 |
| Tiêu đề | 1–100 ký tự Unicode sau trim | V2 | 0 hoặc >100 ký tự | X2 |
| Nội dung | 0–10.000 ký tự Unicode | V3 | >10.000 ký tự | X3 |
| Lọc/tìm kiếm | không lọc hoặc subject ID khớp | V4 | bộ lọc không khớp trả `[]`, không phải lỗi | X4 |
| Import backup | tối đa 2.000 bản ghi, ID duy nhất | V5 | >2.000, ID trùng hoặc bản ghi sai cấu trúc | X5 |
| Lịch cũ | `class_date` thật được giữ; thiếu ngày giữ `''` | V6 | lấy ngày tải làm ngày học | X6 |

## Biên (BVA)

| Biến | min- | min | min+ | nominal | max- | max | max+ | Tag |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Ký tự tiêu đề | 0 | 1 | 2 | 50 | 99 | 100 | 101 | B1–B7 |
| Ký tự nội dung | N/A | 0 | 1 | 5000 | 9999 | 10000 | 10001 | B8–B13 |
| Số ghi chú backup | N/A | 0 | 1 | 1000 | 1999 | 2000 | 2001 | B14–B19 |

## Test case (không tự nhận PASS khi thiếu test)

| TC | Tình huống | Kỳ vọng | Tag | Evidence |
| --- | --- | --- | --- | --- |
| 01 | Tiêu đề toàn khoảng trắng | Từ chối | X2,B1 | Rust unit test |
| 02 | Tiêu đề 1 ký tự | Chấp nhận | V2,B2 | Rust unit test |
| 03 | Tiêu đề 100 ký tự Unicode | Chấp nhận, giữ đủ ký tự | V2,B6 | Rust unit test |
| 04 | Tiêu đề 101 ký tự | Từ chối | X2,B7 | Rust unit test |
| 05 | Nội dung rỗng | Chấp nhận | V3,B8 | Rust unit test |
| 06 | Nội dung 10.000 ký tự | Chấp nhận | V3,B12 | Rust unit test |
| 07 | Nội dung 10.001 ký tự | Từ chối | X3,B13 | Rust unit test |
| 08 | Lọc subject `ST101` | Chỉ ghi chú khớp | V4 | Rust unit test |
| 09 | Xóa ID đã có rồi xóa lại | `true`, sau đó `false` | V1 | Rust unit test; UI confirm chưa có |
| 10 | Backup rồi import, Unicode/subject | Giữ nguyên dữ liệu | V5 | Rust unit test |
| 11 | Backup 2.000 rồi 2.001 bản ghi | 2.000 chấp nhận; 2.001 từ chối, dữ liệu cũ giữ nguyên | V5,X5,B18,B19 | Rust unit test |
| 12 | Migration lịch thiếu ngày thật | Giữ `class_date=''` | V6,X6 | Rust migration test |
| 13 | Backup hai ID trùng | Từ chối trước transaction, dữ liệu cũ giữ nguyên | X5 | Rust unit test |

## Gate và giới hạn

**CONFIRMED (targeted, 2026-11-24):** `cargo test --manifest-path src-tauri/Cargo.toml db::tests` với target cache riêng: 7 passed, 0 failed. `git diff --check`: exit 0. `rg -n 'infer_legacy_class_date|backfill_empty_schedule_class_dates' src-tauri/src/db.rs`: không có match. `npm run check:all` cần chạy lại sau khi ghép `main` mới nhất; chưa ghi PASS.

Native UI, confirm xóa, lỗi quota và Postman live không thuộc kết quả xác minh của PR này. Dữ liệu ghi chú local không thay thế kết quả Portal; task tổng CA-106 vẫn chưa Done.
