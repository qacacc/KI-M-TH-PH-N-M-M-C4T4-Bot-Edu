# CA-081 - Sửa parser UTH và tính toàn vẹn đồng bộ

- Status: Proposed
- Priority: P0
- Created: 2026-10-08
- Type: Remediation
- Dependencies: CA-080 cung cấp contract/fixture đã xác minh cho miền được sửa.

## Mục tiêu

Đọc đúng dữ liệu tài khoản sinh viên, không tự điền giờ/thứ/độ dài bài thi như dữ liệu trường; giữ cache khi lỗi và phản ánh đúng trạng thái từng miền.

## Truth check

- CONFIRMED: `src-tauri/src/connectors/uth.rs:78` đặt `is_authenticated = true` trong parser Profile; hàm chưa kiểm tra đầy đủ field định danh bắt buộc.
- CONFIRMED: `uth.rs:113` đổi response Schedule không đúng cấu trúc thành danh sách rỗng.
- CONFIRMED: `uth.rs:143`, `157`, `267` có giá trị mặc định giờ, thứ và thời lượng thi.
- CONFIRMED: `uth.rs:199-209` đổi lỗi request/đọc/parse lịch thi thành `Ok(vec![])`.
- CONFIRMED: `src-tauri/src/connectors/connector_engine.rs:236` dùng `unwrap_or_default()` với kết quả lịch thi.
- CONFIRMED: `src-tauri/src/connectors/sync_service.rs:29` chỉ thay cache lịch thi khi danh sách mới không rỗng; dòng 97 ghi trạng thái `ok`. Chưa phân biệt rỗng hợp lệ với lỗi miền trong đường xử lý này.
- UNKNOWN: field API thật, ý nghĩa tiết học, timezone và marker thi; phải dùng evidence CA-080 trước khi sửa mapping.
- PLANNED: parser có validation và sync phân biệt Success(data), Success(empty), Error.

## Phạm vi tối thiểu

- Parse và validate từng miền theo fixture verified; Profile thiếu định danh hợp lệ phải báo lỗi, không công nhận đã xác thực.
- Phân biệt HTTP/auth/schema/business error với danh sách rỗng hợp lệ; không nuốt lỗi.
- Không gán giờ, thứ, ngày hoặc thời lượng giả. Trường thiếu được biểu diễn Unknown nếu model cho phép; nếu bắt buộc thì trả lỗi validation an toàn.
- Xác minh và chuyển đổi số tiết sang giờ chỉ khi có bảng quy đổi chính thức; không coi số tiết là giờ.
- Kết quả mỗi miền mang dữ liệu hoặc lỗi rõ ràng. Sync lỗi giữ last-known-good; sync thành công rỗng xử lý cache trong phạm vi đã tải, không giữ bản ghi cũ vô thời hạn.
- Xác định phạm vi snapshot (tháng/học kỳ/toàn bộ) trước khi xóa bản ghi; không dùng lịch tháng hiện tại để thay dữ liệu toàn năm.
- Status partial/error khi một miền lỗi; UI hiển thị cache/stale và thời điểm cập nhật, không báo toàn bộ thành công.
- JWT tiếp tục thuộc backend; không thêm secret vào React/localStorage/log.
- Sửa tài liệu CURRENT đang mâu thuẫn với source, đặc biệt trạng thái DATA-001 trong `docs/INVARIANTS.md` và luồng connector trong `docs/FLOW_MAP.md`.

## File dự kiến cho triển khai

- `src-tauri/src/connectors/uth.rs`, `connector_engine.rs`, `sync_service.rs`, `models.rs`.
- `src/tauriApi.ts`, `src/types.ts`, `src/pages/SchoolPage.tsx` nếu payload trạng thái thay đổi; xác định chính xác trong Phase 0.
- Fixture/test theo CA-080; `docs/architecture/DATA_CONTRACTS.md`, `docs/FLOW_MAP.md`, `docs/INVARIANTS.md` và tài liệu state/dependency/feature thực sự liên quan.
- Task này, `tasks/TASK_INDEX.md`, `docs/planning/PROJECT_TASKS.md`.

Nếu cần thay schema, phải trình kế hoạch migration trước khi triển khai. Không mở rộng sang Grades/Documents/Announcements khi chưa có contract riêng.

## Tiêu chí Done

- [ ] Parser dùng fixture verified; không còn tự tạo giá trị nghiệp vụ thiếu từ API.
- [ ] Profile lỗi/thiếu định danh không được coi là xác thực thành công.
- [ ] Auth/HTTP/JSON/schema error khác empty hợp lệ.
- [ ] Lỗi một miền giữ cache tốt, status partial/error; miền thành công cập nhật độc lập.
- [ ] Empty hợp lệ làm sạch dữ liệu cũ đúng phạm vi snapshot, không xóa ngoài phạm vi.
- [ ] Có test bằng fixture cho thành công, rỗng, sai schema, thiếu field, expired auth và partial sync; test transaction rollback/cache preservation.
- [ ] Kiểm thử end-to-end Postman -> parser -> SQLite -> UI bằng tài khoản được phép; nếu chưa chạy phải giữ task chưa hoàn thành.
- [ ] `npm run check:all` pass và docs/governance đồng bộ bằng evidence.

## Evidence commands

```powershell
rg -n 'unwrap_or_default|return Ok\(vec!\[\]\)|is_authenticated|07:00|09:30' src-tauri/src/connectors/uth.rs src-tauri/src/connectors/connector_engine.rs
cargo test --manifest-path src-tauri/Cargo.toml connectors
npm run check:all
```

Đối chiếu từng kết quả `rg` với đường xử lý cụ thể; sự tồn tại chuỗi trong fixture/test không tự coi là vi phạm. Test phải chứng minh semantics Error/Empty/cache, không chỉ kiểm tra chuỗi source.

## Trạng thái hiện tại

PLANNED. Chưa sửa runtime, chưa có fixture verified từ CA-080. Các vấn đề nêu trên là phát hiện source, chưa phải lỗi đã khắc phục.
