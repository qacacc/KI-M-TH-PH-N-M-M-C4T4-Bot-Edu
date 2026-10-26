# Postman local REST API của Campus Assistant

## Collection REST API local chuẩn

**CONFIRMED (source):** nguồn chuẩn là `Campus_Assistant_Local_REST_API.postman_collection.json` cùng environment `Campus_Assistant_Local_REST_API.postman_environment.json`. Rust bind REST HTTP loopback tại `http://127.0.0.1:47821`, yêu cầu Bearer token process-local; xem `src-tauri/src/api.rs`. Đây là API local, không phải API UTH.

**CONFIRMED (local test workflow):** import hai JSON trên vào Postman Desktop, chọn environment local và gửi `Health` trước. Các route dữ liệu hiện có nhánh lỗi khi profile/cache/UTH contract chưa sẵn sàng; không diễn giải lỗi đó thành dữ liệu rỗng hoặc dữ liệu thật. Kiểm thử tĩnh không thay cho manual HTTP smoke test.

## Đồng bộ và kiểm tra

- **CONFIRMED (scripts):** sửa method, URL, biến và test script trong JSON canonical.
- **CONFIRMED (scripts + regression tests):** `npm run sync:postman` sinh/cập nhật URL, method, header, auth, body và test scripts trong mirror YAML local; không gửi HTTP và không tự xóa file. Mirror thừa khiến check báo drift.
- **CONFIRMED (scripts + regression tests):** `npm run check:postman` kiểm tra collection/environment, bí mật/PII, URL hiệu lực loopback và mirror thiếu/lệch/thừa.
- **UNKNOWN:** các collection UTH hoặc bản Copy ngoài thư mục mirror local không được đồng bộ hay xem là contract UTH đã xác minh.

**CONFIRMED (guard tests):** checker từ chối secret ở cặp Environment `key`/`value`, Bearer token dạng rõ, MSSV 8–12 chữ số, email, và trường nhạy cảm không rỗng/placeholder. Chỉ commit template không chứa secret; không commit response thật, HAR, token, mật khẩu hoặc PII.

## Giới hạn dữ liệu UTH

**UNKNOWN:** collection local không xác nhận endpoint, method, auth hoặc schema của portal UTH; cần fixture/evidence riêng trước khi triển khai connector. Không tự đăng nhập, thu cookie, đồng bộ SQLite hoặc dùng Postman cloud runner với tài khoản thật.
