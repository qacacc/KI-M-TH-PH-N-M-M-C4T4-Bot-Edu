# Hợp đồng REST API cục bộ cho Postman (CA-098.01)

## 1. Mục đích và trạng thái

Tài liệu này mô tả REST API HTTP của **Campus Assistant Local** để kiểm thử bằng Postman trên cùng máy. Postman gửi HTTP đến `127.0.0.1:47821`; API không dùng Tauri IPC làm transport cho request của collection.

- **CONFIRMED trước task:** Axum loopback đã có các route `GET /api/v1/profile`, `GET /api/v1/schedule`, `GET /api/v1/exams` và envelope JSON chung. Xem `src-tauri/src/api.rs`.
- **CONFIRMED trước task:** Connector UTH đang bị khóa bởi `CONTRACT_UNVERIFIED`; lịch học/lịch thi không trả dữ liệu giả. Xem `src-tauri/src/connectors/connector_engine.rs`.
- **CONFIRMED (source hiện tại):** Mọi route HTTP dùng Bearer middleware; token lấy từ `CAMPUS_ASSISTANT_LOCAL_API_TOKEN`. Token thiếu/sai chỉ tắt REST API, không chặn Tauri desktop startup. Query sai kiểu được chuẩn hóa thành envelope `400 VALIDATION_ERROR`; lỗi nội bộ dùng message tổng quát.
- **UNKNOWN:** Schema và cơ chế xác thực của API portal UTH. Spec local không xác nhận hay thay thế contract đó.

## 2. Workspace, Collection, Environment

- **Workspace** là không gian của project/nhóm trên Postman. Dùng workspace nội bộ của project; chỉ mời thành viên cần cộng tác.
- **Collection** là nhóm request có tổ chức và script kiểm tra response. Dùng `postman/Campus_Assistant_Local_REST_API.postman_collection.json`.
- **Environment** là bộ biến cấu hình có thể đổi theo môi trường. Dùng `postman/Campus_Assistant_Local_REST_API.postman_environment.json`; `BASE_URL` là loopback, `API_TOKEN` và `STUDENT_CODE` là secret để trống trong template.

Không nhập token hoặc MSSV vào Collection, shared value, Git, ảnh chụp, log hay chat. Chỉ nhập vào local/secret value của Environment trong Postman Desktop; không export hoặc sync giá trị bí mật.

## 3. Khởi chạy service an toàn

API chỉ bind `127.0.0.1`, không bind `0.0.0.0`. Tạo token ngẫu nhiên tối thiểu 32 ký tự cho phiên làm việc, đặt token vào process environment trước khi mở app. Ví dụ PowerShell trong cùng cửa sổ sẽ chạy dev:

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

Biến môi trường được tiến trình desktop kế thừa. Sao chép token từ terminal vào local secret value của Postman; không chụp ảnh hoặc gửi token. Giữ shell mở khi app chạy; sau khi dừng app, đóng shell để hủy biến môi trường và lịch sử hiển thị. Khi chưa cấu hình hoặc token không đạt độ dài 32–256 ký tự ASCII, REST server không mở port; app desktop vẫn khởi chạy. Nếu mở hai app cùng lúc, instance đầu tiên giữ `127.0.0.1:47821`; instance thứ hai vẫn mở desktop nhưng REST API của nó không bind được port. Postman tiếp tục gọi instance đang giữ port và phải dùng token của instance đó. Không đặt token vào `.cmd`, `package.json`, cấu hình đã commit hoặc tham số dòng lệnh.

Trong Postman Desktop:

1. Chọn workspace project.
2. Chọn **Import** và nhập collection JSON cùng environment JSON ở trên.
3. Chọn Environment `Campus Assistant Local REST API`.
4. Đặt local secret value `API_TOKEN` bằng token của cùng tiến trình; không điền Shared value.
5. Gửi `Health`; request phải đi qua HTTP `http://127.0.0.1:47821/api/v1/health` và nhận JSON `200`.
6. Thử `Auth - missing token` để xác nhận server trả `401`, sau đó gửi Profile/Schedule/Exams với Bearer hợp lệ.

Nếu Postman không gọi được, kiểm tra desktop app còn chạy, biến token được đặt ở process khởi chạy app đó và `BASE_URL` đúng. Không mở cổng firewall/router và không đổi bind host để khắc phục.

## 4. Xác thực và định dạng chung

Tất cả route yêu cầu header:

```http
Authorization: Bearer {{API_TOKEN}}
Accept: application/json
```

Thiếu hoặc sai token: HTTP `401 Unauthorized`, kèm `WWW-Authenticate: Bearer` và envelope lỗi. So sánh token dùng `subtle::ConstantTimeEq` trên buffer đệm cố định 256 byte, đồng thời so độ dài bằng primitive constant-time. Token không được ghi vào log/response và chỉ nằm trong bộ nhớ của REST server trong vòng đời tiến trình.

Response thành công:

```json
{
  "success": true,
  "data": [],
  "source": "uth-cache",
  "syncedAt": null,
  "error": null
}
```

`data` là object hoặc array theo endpoint; array rỗng chỉ có nghĩa là không có bản ghi khi nguồn đã sẵn sàng và trả thành công. `source` xác định provenance; không coi `sample-local` là dữ liệu portal thật. `syncedAt` hiện có thể `null`. Query không parse được, ví dụ `semester=fall`, cũng trả envelope này với `400 VALIDATION_ERROR`.

Response lỗi:

```json
{
  "success": false,
  "data": null,
  "source": null,
  "syncedAt": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thông tin request không hợp lệ."
  }
}
```

Không trả stack trace, token, cookie hoặc raw response portal trong `message`.

## 5. Endpoint cốt lõi

| Endpoint | Method | Query | Thành công | Các lỗi dự kiến |
| --- | --- | --- | --- | --- |
| `/api/v1/profile` | GET | Không | `200`, `data` là hồ sơ đã xác minh | `401`, `404 PROFILE_NOT_CONNECTED`, `500` |
| `/api/v1/schedule` | GET | `studentCode` bắt buộc | `200`, `data` là mảng lịch học | `400 VALIDATION_ERROR` khi thiếu/sai kiểu query, `401`, `500`, `503 CONNECTOR_UNAVAILABLE` |
| `/api/v1/exams` | GET | `studentCode` bắt buộc | `200`, `data` là mảng lịch thi | `400 VALIDATION_ERROR` khi thiếu/sai kiểu query, `401`, `500`, `503 CONNECTOR_UNAVAILABLE` |

Ví dụ:

```http
GET {{BASE_URL}}/api/v1/profile
GET {{BASE_URL}}/api/v1/schedule?studentCode={{STUDENT_CODE}}
GET {{BASE_URL}}/api/v1/exams?studentCode={{STUDENT_CODE}}
```

MSSV là PII; chỉ dùng tài khoản/dữ liệu được phép và local secret value. Các trường JSON tương ứng với kiểu Rust camelCase:

- Profile: `schoolId`, `schoolName`, `studentCode`, `displayName`, `isAuthenticated`, `updatedAt`.
- Schedule: `id`, `studentCode`, `subjectCode`, `subjectName`, `weekday`, `startTime`, `endTime`, `room`, `lecturer`, `source`.
- Exam: `id`, `studentCode`, `subjectCode`, `subjectName`, `examDate`, `startTime`, `durationMinutes`, `room`, `format`, `source`.

Các trường này mô tả kiểu dữ liệu nội bộ hiện có; chúng **không chứng minh** dữ liệu UTH đã được đồng bộ/xác minh. Các model nội bộ không bảo đảm format ngày/giờ hay nullability ngoài kiểu đã ghi trong source.

## 6. Status code và giới hạn CURRENT

- `200 OK`: response thành công theo envelope. Health hiện là endpoint có thể xác nhận `200` độc lập; `profile` chưa có success path dữ liệu xác minh. Schedule/Exams có success branch ở REST handler, nhưng connector gate hiện chặn đọc trước DB.
- `400 Bad Request`: thiếu tham số bắt buộc hoặc query sai kiểu; response luôn dùng code `VALIDATION_ERROR` và JSON envelope.
- `401 Unauthorized`: thiếu hoặc sai Bearer token sau thay đổi CA-098.01.
- `404 Not Found`: Profile hiện chưa có hồ sơ xác minh (`PROFILE_NOT_CONNECTED`).
- `500 Internal Server Error`: lỗi đọc dữ liệu local khác với gate contract chưa xác minh được ánh xạ sang mã lỗi tổng quát `LOCAL_DATA_READ_FAILED`; lỗi serialize dùng `INTERNAL_ERROR`. Response dùng envelope lỗi và message tổng quát, không công khai chi tiết nội bộ. Hiện connector UTH trả gate 503 trước khi đọc cache, nên chưa có đường chạy thực tế tới lỗi đọc này.
- `503 Service Unavailable`: Schedule/Exams/Sync khi UTH contract hoặc connector cache chưa sẵn sàng. Đây là trạng thái hiện tại cần giữ; không ép thành `500` và không trả `200 []` thay cho lỗi.

`POST /api/v1/sync` tồn tại để thể hiện thao tác có side effect, nhưng hiện trả `503 SYNC_NOT_READY`; nó không thuộc ba endpoint đọc cốt lõi và không được dùng như cách né gate UTH. Không có `POST` tạo/cập nhật hồ sơ, lịch học hoặc lịch thi trong contract hiện tại.

## 7. Kịch bản Postman

Collection có các request kiểm tra Health, thiếu token (`401`), Profile chưa kết nối (`404`), Schedule/Exams thiếu MSSV (`400`) hoặc connector chưa sẵn sàng (`503`), cùng các request hiện có về dữ liệu local/validation/sync gate. Rust tests bao phủ thêm query sai kiểu, lỗi nội bộ, thiếu token, constant-time comparison và port collision giữa hai instance. Request phải chạy qua Postman HTTP; các bài test Rust không thay thế xác nhận Postman.

Không chạy profile/schedule/exams bằng collection upstream UTH. Không gọi portal ngoài, không dùng cookie/token trường. Việc service local trả HTTP thành công không nâng trạng thái contract UTH từ UNKNOWN lên VERIFIED.
