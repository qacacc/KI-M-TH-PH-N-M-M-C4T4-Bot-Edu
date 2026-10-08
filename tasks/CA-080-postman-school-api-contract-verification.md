# CA-080 - Xác minh hợp đồng API trường bằng Postman

- Status: Proposed
- Priority: P0
- Created: 2026-10-08
- Type: API contract verification
- Dependencies: CA-036, CA-054; kế thừa gate bảo mật, không mở lại task đã Done.

## Mục tiêu

Xác minh request và response thật trước khi sửa connector Rust. Postman là công cụ kiểm thử HTTP API trường, không phải thành phần runtime hoặc cầu nối Tauri IPC.

## Truth check

- CONFIRMED: `Campus_Assistant_API.postman_collection.json:37` có request Profile; dòng 68 có Schedule với ngày cố định; dòng 106 có Exams `/api/v1/lichthi/all`.
- CONFIRMED: collection có 3 request, chưa có test script; có hai bản YAML cùng nội dung request trong `postman/collections/`.
- CONFIRMED: `src-tauri/src/connectors/uth.rs:190` dùng endpoint lịch học cho lịch thi, khác collection.
- UNKNOWN: tính hợp lệ của endpoint, method, cơ chế Bearer, tham số ngày, response envelope và kiểu dữ liệu tại trường. Có request trong source không chứng minh API hoạt động.
- UNKNOWN: API thông báo, tài liệu, bảng điểm và cơ chế truy cập LMS. Chưa được tự tạo endpoint.

## Phạm vi

- Xác định collection chuẩn và cách đồng bộ JSON/YAML; xử lý bản Copy chỉ sau khi xác minh không có nội dung riêng, giữ bằng chứng rollback.
- Đổi ngày cố định thành `SCHEDULE_DATE`; đặt `BASE_URL` theo host trường đã xác minh.
- Token chỉ dùng trong vùng bí mật cục bộ được xác minh không export/sync; không ghi vào collection, Git, log hoặc screenshot. Nếu chưa xác minh cách lưu bí mật của công cụ, dừng bước nhập token.
- User đăng nhập trực tiếp trên portal chính thức và chủ động cho phép kiểm thử tài khoản của mình. Không yêu cầu gửi mật khẩu/token trong chat; không mở quyền IPC chung cho remote WebView.
- Ghi method, URL, query, cơ chế xác thực, status, Content-Type, schema và trường bắt buộc cho từng request đã kiểm chứng.
- Thêm test response JSON, business error, kiểu dữ liệu, thiếu field; phân biệt `200 + HTML login`, unauthorized, expired session và danh sách rỗng hợp lệ.
- Tạo fixture đã loại PII và secret, giữ cấu trúc/kiểu dữ liệu phục vụ parser. Fixture lỗi có thể tổng hợp nhưng phải ghi rõ nguồn synthetic.
- Lập bảng coverage: Profile, Schedule, Exams, Announcements, Documents, Grades; từng miền có trạng thái Verified hoặc Unknown và evidence. Các miền Unknown vẫn chưa hỗ trợ.

## File dự kiến cho triển khai

- `Campus_Assistant_API.postman_collection.json`
- `postman/collections/` và `.postman/resources.yaml` nếu cần đồng bộ collection chuẩn.
- `docs/testing/UTH_API_CONTRACT.md` (mới).
- `src-tauri/tests/fixtures/uth/` (mới, JSON đã loại dữ liệu cá nhân).
- Task này, `tasks/TASK_INDEX.md`, `docs/planning/PROJECT_TASKS.md`.

## Không thuộc phạm vi

- Không sửa runtime React/Rust, tạo server HTTP nội bộ hay thay đổi SQLite.
- Không coi request thành công trong Postman là xác nhận WebView/login/SQLite/UI đã hoạt động end-to-end.
- Không tự suy ra lịch thi từ lịch học nếu chưa có bằng chứng nghiệp vụ.

## Tiêu chí Done

- [ ] Có một nguồn collection chuẩn; giải thích rõ quan hệ JSON/YAML và bản Copy.
- [ ] Ngày request tham số hóa; không có secret thật trong file được commit/export.
- [ ] Profile/Schedule có evidence request thật và fixture đã loại PII, hoặc task giữ chưa hoàn thành nếu không xác minh được.
- [ ] Lịch thi được xác minh bằng endpoint riêng hoặc bằng cấu trúc lịch học có marker được chứng minh; nếu Unknown, ghi blocked, không báo Done toàn bộ.
- [ ] Có test cho response thành công, rỗng hợp lệ và lỗi; kết quả chạy thực tế được ghi lại, không chỉ đếm script.
- [ ] Các miền dữ liệu chưa xác minh được ghi Unknown, không mô tả là runtime đã hỗ trợ.
- [ ] Governance đồng bộ; chạy `npm run check:all` trước khi chuyển Done theo quy tắc Task Index.

## Evidence commands

```powershell
Get-Content -Raw Campus_Assistant_API.postman_collection.json | ConvertFrom-Json
rg -n 'SCHEDULE_DATE|"event"|"listen"|getSummaryProfile|lichhoc|lichthi' Campus_Assistant_API.postman_collection.json
rg -n 'CONFIRMED|UNKNOWN|fixture|Content-Type' docs/testing/UTH_API_CONTRACT.md
npm run check:all
```

Kết quả mong đợi: JSON hợp lệ, ngày là biến, test script tồn tại và đã chạy; contract có nguồn evidence và giới hạn. Lệnh `rg` chỉ chứng minh nội dung file, không xác minh API ngoài hệ thống. Chạy collection trong Postman và ghi status/test count/thời điểm với dữ liệu đã loại PII; không yêu cầu CLI mới nếu chưa có.

## Trạng thái hiện tại

PLANNED. Chỉ lập task; chưa gửi request trường, chưa tạo fixture và chưa sửa collection.
