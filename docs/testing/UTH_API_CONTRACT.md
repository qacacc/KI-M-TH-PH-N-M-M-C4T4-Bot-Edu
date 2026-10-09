# UTH API Contract - UNKNOWN, CA-080

Ngày setup: 2026-10-10. Chưa gửi HTTP tới trường, chưa thu credentials và chưa có response fixture trường thật. Collection là probe có guard, không phải contract đã xác minh.

| Miền | Candidate kế thừa collection | Auth/mapping/schema | Trạng thái |
| --- | --- | --- | --- |
| Profile | GET /api/v1/user/getSummaryProfile | Bearer chưa verified; field/envelope UNKNOWN | UNKNOWN |
| Schedule | GET /api/v1/lichhoc/thang?date={{SCHEDULE_DATE}} | Ngữ nghĩa date, tháng/học kỳ/timezone UNKNOWN | UNKNOWN |
| Exams | GET /api/v1/lichthi/all | Endpoint/phạm vi account/học kỳ UNKNOWN | UNKNOWN |
| Announcements | Chưa có endpoint | UNKNOWN | UNKNOWN |
| Documents / LMS assignments | Chưa có endpoint | UNKNOWN; không suy từ portal lịch học | UNKNOWN |
| Grades / GPA | Chưa có endpoint | Quy đổi điểm/thang điểm UNKNOWN | UNKNOWN |

## Điều kiện nâng một miền thành VERIFIED

- Người dùng cho phép kiểm thử tài khoản; method/host/path/query/auth khớp request thật của portal.
- Ghi thời điểm/version, HTTP status, Content-Type, response envelope và business success/error. Không đưa secret/PII vào evidence.
- Xác minh field/type/nullability, danh sách rỗng hợp lệ, pagination, account/semester scope, timezone/date range.
- Fixture success/empty/error đã loại PII được review; trường lỗi synthetic phải ghi synthetic, không giả là response thật.
- Test parser/schema có output PASS trên fixtures. Postman transport-only PASS không đủ.
- Chốt session lifecycle/consent và native secret ownership trước triển khai connector; không truyền JWT về React.

## Evidence local hiện có

- `npm run check:postman`: guard và response tests chạy bằng Node VM với payload synthetic, không gọi API.
- `npm run check:all`: chạy cả gate Postman offline cùng baseline app. Không kiểm login/native/portal hoặc UI Postman.
- JSON và hai YAML mirror đồng bộ; không xóa bản Copy, không đổi workspace/cloud IDs.
- Guard mặc định chặn khi thiếu consent/live/review/Vault; host chỉ portal.ut.edu.vn, query route đọc cố định. Tắt redirect/cookie jar trong JSON settings.

## Mẫu evidence (chưa điền)

```text
Domain:
Status: UNKNOWN / VERIFIED
Observed at:
Method / URL / query (không secret):
Auth mechanism (không giá trị token/cookie):
HTTP / Content-Type:
Envelope / required fields / types:
Business success / error / empty:
Account / semester scope / pagination:
Timezone / effective dates:
Sanitized fixture path / review:
Test command / result:
Known gaps:
```
