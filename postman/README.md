# Postman local REST API của Campus Assistant

## Collection REST API local chuẩn

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
**CONFIRMED (source):** nguồn chuẩn là `postman/Campus_Assistant_Local_REST_API.postman_collection.json` cùng environment `postman/Campus_Assistant_Local_REST_API.postman_environment.json`. Rust bind REST HTTP loopback tại `http://127.0.0.1:47821`, yêu cầu Bearer token process-local; API không dùng Tauri IPC làm transport. Khi token chưa được cấu hình, desktop vẫn chạy nhưng REST listener không mở. Đây là API local, không phải API UTH.

**CONFIRMED (local workflow):** import hai JSON trên vào Postman Desktop, chọn environment local và gửi `Health` trước. Nhập token vào local secret value `API_TOKEN`; dùng local/secret value cho cả `STUDENT_CODE`, không nhập secret vào shared value, export, Git hoặc chat. Các route dữ liệu có thể trả lỗi khi profile/cache/UTH contract chưa sẵn sàng; không diễn giải lỗi đó thành dữ liệu rỗng hay dữ liệu thật. Kiểm tra tĩnh không thay cho manual HTTP smoke test.

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

## Đồng bộ và kiểm tra

- **CONFIRMED (scripts):** sửa method, URL, biến và test script trong JSON canonical.
- **CONFIRMED (scripts + regression tests):** `npm run sync:postman` sinh/cập nhật URL, method, header, auth, body và test scripts trong mirror YAML local; không gửi HTTP và không tự xóa file. Mirror thừa khiến check báo drift.
- **CONFIRMED (scripts + regression tests):** `npm run check:postman` kiểm tra collection/environment, bí mật/PII, URL hiệu lực loopback và mirror thiếu/lệch/thừa.
- **UNKNOWN:** các collection UTH hoặc bản Copy ngoài thư mục mirror local không được đồng bộ hay xem là contract UTH đã xác minh.

**CONFIRMED (guard tests):** checker từ chối secret ở cặp Environment `key`/`value`, Bearer token dạng rõ, MSSV 8–12 chữ số, email, và trường nhạy cảm không rỗng/placeholder. Chỉ commit template không chứa secret; không commit response thật, HAR, token, mật khẩu hoặc PII.

## Giới hạn dữ liệu UTH

**UNKNOWN:** collection local không xác nhận endpoint, method, auth hoặc schema của portal UTH; cần fixture/evidence riêng trước khi triển khai connector. Không tự đăng nhập, thu cookie, đồng bộ SQLite hoặc dùng Postman cloud runner với tài khoản thật.
