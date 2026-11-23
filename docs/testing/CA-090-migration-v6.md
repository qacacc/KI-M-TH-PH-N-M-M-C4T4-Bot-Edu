# CA-090 — Kiểm thử migration SQLite v6

## Phạm vi và phân loại

- `CONFIRMED`: `open_db` chạy migration theo `PRAGMA user_version`; v6 thêm `student_notes`, v4 thêm `class_date` và `connector_schedule_weeks` (`src-tauri/src/db.rs`).
- `CONFIRMED`: bản ghi lịch cũ chỉ có `weekday` và `fetched_at`; ngày tải không chứng minh ngày học. Migration giữ `class_date = ''` khi không có ngày từ nguồn xác minh; ngày đã lưu được giữ nguyên.
- `UNKNOWN`: ngày học thật của bản ghi lịch cũ và contract Portal; không tự suy ngày từ `fetched_at`.
- `PLANNED`: kiểm thử cài đè trên ứng dụng native với bản sao dữ liệu đã ẩn thông tin cá nhân và kiểm tra lịch UI; CA-090 chưa nghiệm thu toàn bộ.

## Tác động và bất biến

Entry point: `open_db` / `open_db_schema_only` → `ensure_db_schema` → migration v1–v6 → schema repair. Đọc/ghi: SQLite trong managed root. Phụ thuộc: `db.rs`, connector cache và trang lịch; không đổi HTTP/IPC contract. Giữ `DATA-001/002/005`: lỗi không biến thành lịch rỗng thành công, cache cũ không bị xóa, thay schema theo version. Rủi ro hồi quy là gán sai ngày, mất chat/schedule, chạy repair lặp và khóa DB khi mở đồng thời. `class_date` trống ở bản ghi cũ là *ngày chưa xác định*, không được hiển thị như buổi học đúng ngày.

## Phân hoạch lớp tương đương (EP)

| Biến/điều kiện | Hợp lệ | Tag | Không hợp lệ/chưa xác minh | Tag |
|---|---|---|---|---|
| Schema DB | DB cũ có bảng nền và `user_version` 1–5; DB v6 đủ bảng | V1 | DB v6 thiếu bảng/cột cần repair; DB hỏng không được báo thành công | X1 |
| Ngày học cũ | `class_date` có sẵn từ nguồn xác minh | V2 | Không có `class_date`, chỉ có `fetched_at`/`weekday` hoặc timestamp sai định dạng | X2 |
| Khóa ghi chú | ID sau trim dài ít nhất 1 ký tự | V3 | `NULL`, chuỗi rỗng hoặc chỉ khoảng trắng | X3 |
| Mở DB | Mở lại và hai kết nối trên cùng file temp | V4 | Lỗi lock thực sự phải trả lỗi, không xóa cache | X4 |

## Giá trị biên (BVA)

| Đầu vào | min- | min | min+ | nominal | max- | max | max+ | Tag và kỳ vọng |
|---|---|---|---|---|---|---|---|---|
| Độ dài ID ghi chú sau trim | `NULL`/0 | 1 | 2 | 8 | N/A | N/A | N/A | B1–B3: 0/NULL bị từ chối; 1 và 2 được nhận. Không áp đặt max khi schema không khai báo. |
| Ngày học của bản ghi cũ | thiếu cột | `''` | ngày đã lưu | N/A | N/A | N/A | N/A | B4–B6: thêm cột với giá trị chưa biết; không tự điền; giữ nguyên ngày có sẵn. |
| Phiên bản schema hợp lệ | 0 (DB mới) | 1 | 2 | 3 | 5 | 6 | >6 | B7–B9: kiểm fixture v1→v6 và v6 thiếu bảng. DB tương lai `>6` chưa có fixture, không tuyên bố tương thích. |

## Test case (ít nhất 10)

| TC | Điều kiện | Kết quả mong đợi | Tag | Bằng chứng tự động |
|---|---|---|---|---|
| 01 | File DB temp v1 có chat và lịch | Lên v6, giữ bản ghi | V1, B7 | `test_bva02_and_dt2_rule2_temp_db_fixture_upgrades_v1_to_v6_on_disk` |
| 02 | DB cũ có chat và khóa ngoại | Dữ liệu chat còn, FK bật | V1 | `test_migration_preserves_existing_chat_data_and_enables_foreign_keys` |
| 03 | DB v6 thiếu bảng connector/notes | Tạo bảng thiếu, không xóa lịch cũ | X1 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 04 | Bảng lịch cũ thiếu cột `class_date` | Thêm cột, ngày cũ để trống | X2, B4–B5 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 05 | `fetched_at` khác tuần học | Không suy ra ngày từ ngày tải | X2 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 06 | `fetched_at` sai định dạng | Không gán ngày fallback | X2 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 07 | Bản ghi có `class_date` đã lưu | Giữ đúng giá trị khi chạy lại schema | V2, B6 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 08 | Chạy `ensure_db_schema` lặp | Không đổi ngày đã lưu/chưa biết; schema đủ | V4 | `test_connector_schema_repairs_missing_tables_even_when_version_is_current` |
| 09 | Mở hai kết nối đến file DB temp | Cả hai đọc được `user_version = 6` | V4 | `test_bva02_and_dt2_rule2_temp_db_fixture_upgrades_v1_to_v6_on_disk` |
| 10 | ID ghi chú `NULL` hoặc chỉ khoảng trắng | SQLite từ chối | X3, B1 | `test_migrate_to_v6_directly_creates_student_notes_and_rejects_null_or_blank_primary_key` |
| 11 | ID ghi chú dài 1 hoặc 2 ký tự | SQLite nhận và có đúng 2 bản ghi | V3, B2–B3 | `test_migrate_to_v6_directly_creates_student_notes_and_rejects_null_or_blank_primary_key` |
| 12 | Gọi trực tiếp migration v6 | Chính migration tạo bảng notes, version 6 | V1 | `test_migrate_to_v6_directly_creates_student_notes_and_rejects_null_or_blank_primary_key` |

Postman: **N/A** cho migration SQLite nội bộ; collection HTTP local không thể chứng minh dữ liệu DB cũ được giữ. Kiểm thử phù hợp là Rust unit/integration trên DB temp và native upgrade smoke. Không dùng token hoặc dữ liệu sinh viên thật trong fixture.

## Lệnh và cổng nghiệm thu

- `cargo test --manifest-path src-tauri/Cargo.toml db::tests` — chạy các case trên.
- `npm run check:all` — kiểm tra hồi quy toàn cục; `check:postman` trong lệnh này chỉ kiểm tĩnh, không gửi HTTP.
- `rg -n 'infer_legacy_class_date|backfill_empty_schedule_class_dates' src-tauri/src/db.rs` — kỳ vọng không có kết quả (exit 1).
- Manual native cài đè, lịch UI và contract Portal vẫn `UNKNOWN`; không chuyển CA-090 sang `Done` chỉ nhờ các test tự động.
