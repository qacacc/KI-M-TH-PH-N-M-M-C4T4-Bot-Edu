# Khắc phục UI theo ảnh đối chiếu bản clone

## Phạm vi và sự thật hiện tại

- `CONFIRMED`: shortcut chat tô icon nổi bật khác màu; GPA và Trường & tài khoản dùng chung icon tốt nghiệp; hồ sơ có ô tên, MSSV và nút lưu riêng.
- `CONFIRMED`: chọn trường/chế độ hiện được lưu local; các chỉnh sửa này tiếp tục dùng `saveSchoolProfile`.
- `CONFIRMED`: connector UTH hiện từ chối sync với `CONTRACT_UNVERIFIED`; chưa có API/fixture đã xác minh để lấy lịch, điểm và danh sách Courses.
- `UNKNOWN` (blocking với live sync): API contract, auth/session và fixture Portal/Courses thật. Không được bỏ gate hoặc sinh dữ liệu giả.

## Thay đổi

- Đồng màu icon các shortcut theo token `--muted`; giữ kích thước cột icon cố định để căn hàng.
- Dùng icon Building2 cho Trường & tài khoản, tránh trùng GraduationCap với GPA.
- Bỏ trường nhập tên hiển thị, MSSV và nút Lưu hồ sơ. Chọn chế độ tài khoản lưu ngay; chọn trường cũng lưu ngay.
- Không thay đổi hay tuyên bố đã sửa live sync Portal/Courses. Nút/empty state phải tiếp tục phản ánh connector chưa sẵn sàng.

## Kiểm thử

| ID | Loại | Đầu vào/Thao tác | Kết quả mong đợi |
|---|---|---|---|
| UI-01 | Regression | Mở chat starter | Tất cả shortcut dùng cùng màu icon |
| UI-02 | Regression | Xem sidebar GPA và Trường & tài khoản | Icon khác nhau, cột điều hướng không đổi |
| UI-03 | Functional | Chọn từng chế độ tài khoản | Profile lưu local ngay; không cần nút lưu |
| UI-04 | Functional | Đổi trường | Lựa chọn được lưu local ngay |
| UI-05 | Contract guard | Thử lấy dữ liệu UTH khi chưa xác minh contract | Không trả dữ liệu giả; giữ nguyên cache và báo chưa sẵn sàng |

- BVA: không áp dụng cho thay đổi UI này; không có miền số/giá trị biên.
- Postman: không có request live hợp lệ khi API contract chưa xác minh. `check:postman` chỉ kiểm tra cấu trúc/secret guard local, không phải HTTP live.
- Xác minh tự động dự kiến: `npm run check:all`; kết quả cuối phải được ghi theo lần chạy thực tế.

## Tiêu chí chấp nhận

UI-01..UI-04 phải pass. UI-05 chỉ được đổi thành live sync sau khi có contract/fixture đã ẩn PII, auth design được duyệt và test endpoint thật; cho tới lúc đó trạng thái vẫn `PLANNED`.
