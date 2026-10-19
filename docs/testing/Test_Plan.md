# Kế hoạch kiểm thử - Campus Assistant Local

- **Mã nhiệm vụ:** CA-099.01
- **Người thực hiện:** Võ Anh Sơn (TV07)
- **Người duyệt:** Nguyễn Hữu Gia Khang (TV01)
- **Ngày bắt đầu dự kiến:** 27/10
- **Phiên bản tài liệu:** 1.0

**Bộ hồ sơ kiểm thử:** Test Plan này, [Traceability Matrix](./Traceability_Matrix.md) và phụ lục chi tiết [TESTING.xlsx](./TESTING.xlsx). Markdown là nguồn truy vết chính; Excel chứa các bước thao tác, dữ liệu vào và kết quả mong đợi chi tiết cho từng test case.

## 1. Mục tiêu

- Xác minh hành vi hiện có của ứng dụng desktop Tauri + React + TypeScript + Rust.
- Kiểm tra các luồng local-first: intent chat, giao diện, backup/restore, SQLite và dữ liệu cache.
- Phân biệt rõ kiểm thử tự động, kiểm tra tĩnh, kiểm thử thủ công và phần chưa thể xác minh.
- Không coi request Postman hoặc dữ liệu mock là bằng chứng API UTH thật đã hoạt động.

## 2. Phạm vi kiểm thử

### 2.1. Trong phạm vi

- **Frontend:** intent chat, slash command, state flow, appearance draft, layout state, GPA và các tiện ích backup/restore.
- **Native/SQLite:** command Tauri, schema/migration, chat history opt-in, transaction đồng bộ và managed file paths.
- **REST local:** health, validation, empty result, error response và các gate khi chưa có account/cache.
- **Postman offline:** static collection/environment và local REST contract; không gửi request tới UTH trong baseline.
- **Regression:** `npm run test`, kiểm tra layout, build TypeScript/Vite, Rust check/test và audit dependency.

### 2.2. Ngoài phạm vi hoặc chưa đủ điều kiện xác minh

- Load/stress test máy chủ UTH.
- Kiểm thử bảo mật hạ tầng mạng.
- API/schema/fixture/auth thật của UTH và live portal verification: **UNKNOWN**.
- Native login, session vault, WebView IPC isolation và đồng bộ UTH end-to-end: **PLANNED / CHƯA VERIFIED**.
- Manual visual test trên desktop thật và installer smoke test: **PLANNED nếu chưa có biên bản riêng**.

## 3. Phân loại bằng chứng

| Nhãn | Ý nghĩa |
| --- | --- |
| `CONFIRMED` | Có source/test/command hiện tại làm bằng chứng trực tiếp. |
| `PARTIAL` | Có implementation hoặc test một phần nhưng chưa đủ coverage/e2e. |
| `UNKNOWN` | Chưa có contract, fixture hoặc verification đáng tin cậy. |
| `PLANNED` | Mục tiêu chưa được triển khai hoặc chưa được chạy. |

## 4. Tiêu chí bắt đầu

- Node.js, dependency local và công cụ Rust/Tauri đã sẵn sàng.
- Source checkout đúng commit cần kiểm thử; branch thực tế phải được ghi trong biên bản, không mặc định là `develop`.
- Test case và ma trận truy vết đã được review.
- Không có thay đổi ngoài phạm vi chưa được ghi nhận trong working tree.
- Với UTH live test, phải có consent, contract/fixture đã sanitize và secret ownership được duyệt trước.

## 5. Tiêu chí kết thúc

Chỉ được báo hoàn tất khi:

- Tất cả test case trong ma trận đã có trạng thái và evidence cụ thể.
- Các test tự động bắt buộc pass bằng đúng command được ghi trong ma trận.
- Không còn lỗi Critical/High chưa được ghi nhận trong phạm vi SQLite/local REST.
- UTH live chưa verified phải được giữ là `UNKNOWN`, không chuyển thành `PASS` bằng mock hoặc cache.
- Manual visual/native/API test phải ghi rõ `PASS`, `FAIL` hoặc `NOT RUN`.
- Người duyệt xác nhận Test Plan và Traceability Matrix.
- Phụ lục `TESTING.xlsx` được kiểm tra cùng phiên bản tài liệu và không chứa token, cookie, mật khẩu hoặc PII thật.

## 6. Rủi ro và giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu | Trạng thái hiện tại |
| --- | --- | --- | --- |
| UTH không có contract/fixture thật | Cao | Chỉ kiểm local gate/mock đã ghi nhãn; không claim API thật | `UNKNOWN` |
| Sync lỗi làm mất cache tốt | Cao | Kiểm tra transaction, partial sync và retention khi lỗi | `PARTIAL` |
| Backup hỏng hoặc vượt giới hạn | Cao | Kiểm JSON syntax, schema, allowlist, prototype pollution và size limit | `CONFIRMED` ở unit test |
| Khác biệt giữa browser preview và Tauri | Trung bình | Tách IPC test khỏi visual/manual desktop test | `PARTIAL` |
| Sai lệch tài liệu và source | Trung bình | Dùng file/line và command evidence trong ma trận | Bắt buộc trước khi kết thúc |

## 7. Môi trường và command chuẩn

- **OS mục tiêu:** Windows 10/11 x64.
- **Công cụ:** Node.js 20+, npm, Vite, Tauri CLI, Cargo/Rust và Postman cho local collection.
- **Command kiểm tra:**
  - `npm run test`
  - `npm run test:layout`
  - `npm run check:postman`
  - `npm run build`
  - `npm run check:rust`
  - `npm run test:rust`
  - `npm run check:all`

`npm run check:all` là evidence tổng hợp bắt buộc sau thay đổi. Kết quả command phải được ghi theo lần chạy thực tế; tài liệu không tự biến kết quả lịch sử thành kết quả hiện tại.

## 8. Quy tắc báo cáo

- Mỗi claim quan trọng phải có file/line hoặc command evidence.
- `PASS` chỉ dùng khi command/manual test đã chạy và có output.
- `NOT RUN` không được mô tả là đã kiểm thử.
- Mock, fixture và cache local phải được ghi rõ nguồn; không giả là response UTH thật.
- Không ghi token, cookie, mật khẩu hoặc PII thật vào evidence.
