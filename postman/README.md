# Postman UTH - CA-080

## REST API của project - local loopback

`Campus_Assistant_Local_REST_API.postman_collection.json` là collection kiểm thử REST API HTTP do Rust của project phục vụ tại `http://127.0.0.1:47821`. Mọi request yêu cầu Bearer token từ `CAMPUS_ASSISTANT_LOCAL_API_TOKEN`; API không dùng Tauri IPC làm transport. Khi token chưa được cấu hình, app desktop vẫn mở nhưng REST server không mở port.

Tạo token phiên bằng PowerShell rồi chạy desktop app trong cùng tiến trình shell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$token = [Convert]::ToBase64String($bytes)
$env:CAMPUS_ASSISTANT_LOCAL_API_TOKEN = $token
Write-Host "Nhập giá trị này vào local secret API_TOKEN trong Postman: $token"
$token = $null
$bytes = $null
$rng.Dispose()
npm.cmd run dev:desktop
```

Import `Campus_Assistant_Local_REST_API.postman_collection.json` và `Campus_Assistant_Local_REST_API.postman_environment.json` vào workspace project. Chọn environment tương ứng, nhập token vào **local secret value** `API_TOKEN`, rồi gửi request `Health` trước. Dùng local/secret value cho cả `STUDENT_CODE`; không nhập secret vào shared value, export, Git hoặc chat. Collection này kiểm thử API của project; collection UTH bên dưới chỉ dùng kiểm chứng upstream và không thay thế REST API local. Hướng dẫn hợp đồng đầy đủ ở [REST_API_DESIGN.md](../docs/testing/REST_API_DESIGN.md).

Các endpoint lịch học, lịch thi và đồng bộ sẽ trả lỗi có mã rõ ràng khi UTH contract/cache chưa sẵn sàng. Đây là hành vi đúng, không phải dữ liệu rỗng giả.

## CURRENT và giới hạn

- CONFIRMED: Collection nộp cho REST API của project là `postman/Campus_Assistant_Local_REST_API.postman_collection.json`; environment template chỉ có biến secret để trống.
- Lịch sử: collection UTH cũ từng nằm ở root nhưng không còn là nguồn chuẩn hiện tại; các probe UTH chỉ được giữ như tài liệu tham chiếu khi có contract thật.
- UNKNOWN: API portal UTH vẫn chưa có contract verified. Bearer token của REST loopback là secret local do user cấu hình, không phải token UTH.
- Không tự đăng nhập, không thu cookie trình duyệt, không tự sync SQLite. Postman không phải runtime của Campus Assistant.
- Transport test PASS không chứng minh JSON là hồ sơ/lịch hợp lệ. HTTP 200 có thể là business error. [] chỉ được coi empty hợp lệ sau khi biết envelope/contract.

## Cách sử dụng an toàn

1. Dùng Postman Desktop hỗ trợ Local Vault và `pm.execution.skipRequest`; import JSON chuẩn cùng `postman/UTH.local-template.postman_environment.json`, chọn environment vừa import.
2. Đăng nhập trực tiếp trên portal của trường. Đối chiếu method, host/path/query và auth của request do chính portal thực hiện trên tài khoản được phép. Không đoán Bearer nếu portal không dùng Bearer; báo contract khác và sửa collection sau review.
3. Chỉ sau khi xác minh cơ chế auth, tạo secret **Local Vault** tên `uth-portal-token`, giới hạn allowed domain `portal.ut.edu.vn`. Bật quyền script đọc vault cho collection này, giữ masking. Không dùng Shared Vault/cloud, không nhập token vào collection/environment/globals, không gửi token hoặc mật khẩu vào chat.
4. Trong environment local, đặt `ACCOUNT_CONSENT=true`, `LIVE_REQUESTS_ENABLED=true`; chỉ bật `PROFILE_REQUEST_REVIEWED` / `SCHEDULE_REQUEST_REVIEWED` / `EXAMS_REQUEST_REVIEWED` cho request đã đối chiếu. Những cờ này là xác nhận cho phép probe, **không phải chứng nhận response schema**.
5. Khi thử lịch học, nhập `SCHEDULE_DATE` dạng YYYY-MM-DD theo ngày cần kiểm thử. Không tự dùng ngày/học kỳ giả định.
6. Gửi từng request thủ công, không chạy cloud monitor/CLI/Newman cho tài khoản thật. JSON có `followRedirects=false`, `disableCookies=true`; kiểm tra Request Settings thực tế trước Send, timeout 15000 ms, TLS verification bật. Không bật redirect hoặc cookie jar để né lỗi xác thực. Nếu trường dùng cookie thì dừng thiết kế Bearer và ghi UNKNOWN cần contract riêng.
7. Đọc Test Results: 401/403 = chưa xác thực/không đủ quyền; 3xx = redirect cần điều tra; HTML dù HTTP 200 không phải dữ liệu. Không xuất log/request headers/raw response tài khoản.
8. Kết thúc: tắt `LIVE_REQUESTS_ENABLED`, khóa/xóa secret khi không dùng. Response riêng chỉ giữ trong `postman/private/` (Git ignore); không lưu Example với PII lên collection cloud. Dữ liệu loại PII cần kiểm thủ công cả field lồng nhau/token/URL/ID trước đưa vào fixture.

Không chia sẻ file export vault, HAR hoặc Postman Console chứa phiên thật. Nếu Postman yêu cầu sync/export secret để chạy, dừng thay vì chấp nhận.

## JSON / YAML và bản Copy

- JSON là nguồn chuẩn duy nhất cho method/path/query. Sửa JSON khi có evidence contract; script chung ở `postman/scripts/`.
- Collection local của project nằm tại `postman/Campus_Assistant_Local_REST_API.postman_collection.json`; không dùng nó để suy ra contract UTH.
- Ba thư mục YAML là **mirror tự sinh**, không chỉnh riêng. Giữ bản Copy cũ để không phá workspace; bản Copy 2 được Postman Desktop tạo khi import an toàn, không thay thế/xóa collection cũ.
- `npm run sync:postman` đồng bộ JSON event scripts/header/settings và YAML. `npm run check:postman` kiểm drift và chạy mock sandbox offline.
- Nếu collection UTH chuẩn `Campus_Assistant_API.postman_collection.json` chưa tồn tại, `sync:postman` sẽ SKIP an toàn thay vì tự tạo endpoint hoặc báo lỗi `ENOENT`.
- CONFIRMED 2026-10-10: Postman Desktop import thành công collection JSON và environment template; chọn environment mặc định khóa, mở Scripts kiểm tra guard trước request. Bản import là `Campus Assistant Local - UTH Portal APIs Copy 2`.
- YAML dùng collection scripts `http:beforeRequest` / `http:afterResponse`, request `auth: noauth` và settings redirect/cookie false, đối chiếu file do Desktop sinh. Chưa chạy request thật hoặc xác minh sandbox/Vault bằng live test.
- Không commit environment cá nhân, response thật, credentials. File template có cờ false và không chứa token.

Kho Git hiện dùng: https://github.com/qacacc/bot-edu.git, nhánh `main`. Environment YAML do Desktop sinh nằm trong `postman/environments/` và được Git ignore; nhập lại từ JSON template khi đổi máy.

## Evidence cần ghi trước khi viết connector

Điền `docs/testing/UTH_API_CONTRACT.md`: request đã kiểm, thời điểm, status, Content-Type, envelope, field/type/nullability, định danh account/semester scope, timezone và business error; chỉ dùng fixture đã loại PII. Chưa có evidence thì miền vẫn UNKNOWN, không gỡ gate Rust CA-083.

## Tài liệu chính thức

- [Postman Local Vault và cú pháp vault reference](https://learning.postman.com/docs/use/postman-vault/use-vault-secrets/)
- [Quyền script và pm.vault](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-vault/)
- [Chặn request bằng skipRequest](https://learning.postman.com/v11/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-execution)
- [Postman Native Git và format validation](https://learning.postman.com/docs/use/native-git/setup)
