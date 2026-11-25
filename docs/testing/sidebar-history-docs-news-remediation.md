# Kiểm thử avatar rail, lịch sử, tài liệu và thông báo

## Truth check

- `CONFIRMED`: Lịch sử chat là local opt-in; nếu chưa bật thì trang phải hiện nút bật. Lỗi đọc/ghi trước đây chỉ ghi console nên trông như thao tác không phản hồi.
- `CONFIRMED`: Trang Tài liệu trường mở URL LMS; không có connector đồng bộ LMS thực trong UI này.
- `CONFIRMED`: Trang Thông báo mở trang tin công khai; không có feed thông báo được đồng bộ vào app.
- `CONFIRMED`: Ở sidebar thu gọn, avatar initials và tooltip cùng nằm trong phần tử grid, có thể làm chữ UT lệch vị trí.
- `UNKNOWN` (blocking với sync thật): API/contract LMS và feed thông báo của trường chưa được xác minh. Không giả dữ liệu hay tự suy đoán endpoint.

## Sửa đổi

- Tách initials UT khỏi tooltip, căn giữa bằng grid; tooltip hiện khi hover/focus avatar.
- History hiển thị lỗi an toàn và nút thử lại cho thao tác tải/bật lịch sử cũng như CRUD phiên; không tự bật lưu trữ khi người dùng chưa chọn.
- Khi mở LMS/trang tin, hiện thông báo thành công hoặc lỗi rõ ràng, đồng thời nói rõ dữ liệu chưa được đồng bộ vào ứng dụng.

## Test cases

| ID | Thao tác | Kết quả mong đợi |
|---|---|---|
| NAV-01 | Thu gọn sidebar | Initials UT căn giữa avatar; tooltip không làm xô chữ |
| HIS-01 | Mở lịch sử khi chưa bật | Hiện giải thích và nút bật; không tự lưu hội thoại |
| HIS-02 | Bật lịch sử | Lưu tùy chọn và tải danh sách local; lỗi hiện cảnh báo và thử lại |
| HIS-03 | Lỗi thao tác phiên | Hiện thông báo dễ hiểu, dữ liệu không bị báo thành công giả |
| DOC-01 | Bấm mở LMS | Mở URL trường hoặc báo lỗi; không báo đã đồng bộ tài liệu |
| NEWS-01 | Bấm website tin trường | Mở URL hoặc báo lỗi; không báo feed đã đồng bộ |

- BVA: Không áp dụng; thay đổi không nhận miền đầu vào số.
- Postman: Không áp dụng cho các thao tác UI mở URL; không có endpoint feed/API LMS đã xác minh. Postman tĩnh không được xem là HTTP live.
- Live verification: Chưa kiểm thử mở URL bằng trình duyệt bên ngoài trong lượt này. Connector lịch/điểm, LMS sync và feed thông báo còn `PLANNED` đến khi có contract/fixture đã xác minh.
