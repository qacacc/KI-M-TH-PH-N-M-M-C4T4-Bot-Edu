# Kiểm thử chức năng học liệu LMS (clone parity)

## Phạm vi và trạng thái

- `CONFIRMED` trong source: WebView desktop chuyên biệt quét metadata Moodle UTH, lưu cache SQLite, hiển thị nhóm theo môn, tải tệp được chọn vào Downloads được quản lý và mở lại tệp đã tải.
- `ASSUMED`: trang Courses tiếp tục giữ cấu trúc URL/DOM Moodle mà script hiện nhận diện. Chưa có fixture HTML ẩn danh từ phiên LMS để xác nhận selectors trên các biến thể trang.
- `UNKNOWN`: kiểm thử đăng nhập/quét/tải trên tài khoản LMS thật và xác minh file tải qua Windows Defender/ứng dụng mặc định.
- Không đồng bộ cookie, password, localStorage/sessionStorage hay Authorization qua React. WebView LMS chỉ được phép gọi `receive_lms_snapshot`.
- Tệp giới hạn theo mã nguồn: payload 1,000,000 byte; tối đa 100 môn, 5,000 tài liệu; đường dẫn 4,096 ký tự; Downloads tổng tối đa 5 GiB.

## Equivalence Partitioning

| Đầu vào | Lớp hợp lệ | Lớp không hợp lệ | Tag |
|---|---|---|---|
| Nguồn snapshot | WebView `lms-login`, HTTPS `courses.ut.edu.vn`, trang danh sách/chi tiết môn | Cửa sổ khác, HTTP, host/path không đúng | V1 / X1 |
| ID môn | 1–16 chữ số ASCII | rỗng, ký tự khác số, dài >16 | V2 / X2 |
| Tên môn/tệp | Có ký tự hiển thị sau sanitize | rỗng hoặc chỉ control/`.`/`..` | V3 / X3 |
| Đường dẫn file | `/pluginfile.php/...` cùng origin LMS | URL ngoài, `/mod/...`, query/hash, traversal hoặc encoded traversal | V4 / X4 |
| Snapshot | JSON đúng schema, có môn; số lượng trong giới hạn | sai schema, không có môn, quá dung lượng/số lượng | V5 / X5 |
| Trạng thái file | available → downloading → downloaded; error có thể retry | mở file chưa tải, tải trùng đang chạy | V6 / X6 |

## Boundary Value Analysis

| Biến | min− | min | min+ | nominal | max− | max | max+ |
|---|---:|---:|---:|---:|---:|---:|---:|
| ID môn (số chữ số) | 0 | 1 | 2 | 8 | 15 | 16 | 17 |
| Payload byte | 0 | 1 | 2 | 512000 | 999999 | 1000000 | 1000001 |
| Số môn | 0 | 1 | 2 | 50 | 99 | 100 | 101 |
| Số tài liệu | 0 | 1 | 2 | 2500 | 4999 | 5000 | 5001 |
| Độ dài đường dẫn | 0 | 1 | 2 | 1024 | 4095 | 4096 | 4097 |
| Tổng dung lượng Downloads | 0 | 1 byte | 2 byte | 2.5 GiB | 5 GiB−1 | 5 GiB | 5 GiB+1 |

## Test cases

| ID | Trường hợp | Expected | Tag |
|---|---|---|---|
| LMS-01 | Snapshot hợp lệ: một môn và một plugin file | Lưu SQLite và phát sự kiện cập nhật | V1,V2,V3,V4,V5 |
| LMS-02 | Snapshot từ cửa sổ không phải `lms-login` | Từ chối; DB không đổi | X1 |
| LMS-03 | ID môn có chữ cái hoặc dài 17 số | Từ chối schema | X2 |
| LMS-04 | Snapshot tham chiếu môn chưa có trong batch | Từ chối | X5 |
| LMS-05 | URL tài liệu trỏ host ngoài | Từ chối | X4 |
| LMS-06 | Path chứa `../`, `%2e%2e`, backslash, query hoặc fragment | Từ chối path | X4 |
| LMS-07 | Tải snapshot mới cho file đã downloaded | Giữ `status`, local path và size cũ | V6 |
| LMS-08 | Yêu cầu tải document ID sai định dạng | Từ chối trước khi truy cập file | X6 |
| LMS-09 | Mở document chưa downloaded | Báo chưa có file local | X6 |
| LMS-10 | Tải hoàn tất trong Downloads managed root, tổng <=5 GiB | Cập nhật downloaded và metadata local | V6 |
| LMS-11 | File ngoài managed root hoặc vượt giới hạn dung lượng | Không đánh dấu downloaded; không giữ file vượt hạn mức | X6 |
| LMS-12 | Mở lại cửa sổ LMS khi cửa sổ đã tồn tại | Tái sử dụng/focus cửa sổ; không tạo phiên trùng | V1 |
| LMS-13 | Quét lại khi chưa mở LMS | Hiện lỗi hướng dẫn mở/đăng nhập trước | X6 |
| LMS-14 | Dùng đường dẫn Portal/LMS ở trường khác UTH | Chỉ mở website ngoài; không chạy connector UTH | X1 |

## Postman

`N/A`: học liệu LMS đi qua Tauri IPC + WebView và SQLite nội bộ, không có HTTP endpoint ứng dụng để kiểm tra bằng Postman. Không dùng health/local REST làm bằng chứng cho đồng bộ LMS. Kiểm thử contract thật cần Windows desktop với phiên LMS đăng nhập; không ghi token/cookie vào collection hoặc log.

## Kênh thông báo (parity UI)

| EP | Expected |
|---|---|
| UTH đã chọn | Hiện kênh Đào tạo, CTSV và trang tin UTH |
| Trường khác có `publicNewsUrl` | Chỉ hiện website trường đang chọn, không gắn kênh UTH |
| Trường khác không có URL | Không hiện kênh/link giả |
| Mở link thành công/lỗi | Báo kết quả; nội dung feed vẫn không được nhận là đã đồng bộ |

| BVA | Expected |
|---|---|
| 0/1/3 kênh sau lọc | Empty/1/3 card tương ứng |
| Bộ lọc không khớp kênh | Danh sách rỗng; không crash |
| URL null / có URL | Nút disabled / mở website trường |

Postman `N/A`: kênh chỉ mở website bằng Tauri; app chưa có endpoint/feed thông báo.

| TC | Trường hợp | Kết quả mong đợi |
|---|---|---|
| NEWS-01 | Chọn UTH, xem tất cả | 3 kênh UTH; ghi rõ nội dung chưa đồng bộ |
| NEWS-02 | Lọc Đào tạo | Chỉ kênh đào tạo |
| NEWS-03 | Lọc CTSV | Chỉ kênh CTSV |
| NEWS-04 | Chọn trường khác có URL | Không hiện link UTH |
| NEWS-05 | Trường chưa có URL | Nút website bị disable |
| NEWS-06 | Tauri mở link bị lỗi | Hiện cảnh báo và giữ trang dùng được |

## Lệnh kiểm chứng

```powershell
npx vitest run src/tauriApi.test.ts
cargo test --manifest-path src-tauri/Cargo.toml connectors::lms::tests
npm run check:all
```

`AUTOMATED`: unit/static/build/check. `MANUAL VISUAL / LIVE LMS`: chưa xác nhận đến khi chạy desktop, đăng nhập LMS, thấy môn/tệp, tải tệp và mở lại file từ Downloads.
