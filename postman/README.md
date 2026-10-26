# Postman của Campus Assistant

## Collection REST API local chuẩn

Nguồn chuẩn duy nhất trong repository là `Campus_Assistant_Local_REST_API.postman_collection.json` cùng environment `Campus_Assistant_Local_REST_API.postman_environment.json`. Collection gọi REST HTTP loopback của ứng dụng tại `http://127.0.0.1:47821`; mở ứng dụng desktop trước khi chạy request. Đây là API local, không phải API UTH.

Import hai file JSON trên vào Postman, chọn environment local rồi gửi request `Health` trước. Các route dữ liệu có thể trả lỗi chỉ rõ khi hồ sơ, cache hoặc contract chưa sẵn sàng; không thay các trạng thái này bằng dữ liệu giả.

## Đồng bộ và kiểm tra

- Chỉnh method, URL, biến và test script trong collection JSON chuẩn.
- `npm run sync:postman` tạo/cập nhật các request YAML trong `postman/collections/Campus Assistant Local REST API/` từ JSON, gồm URL, method, header, auth, body và test scripts. Lệnh không gửi HTTP, không tự xóa file; mirror thừa trong thư mục được quản lý sẽ làm check thất bại để người dùng rà soát.
- `npm run check:postman` kiểm tra JSON/environment canonical, secret/PII guard, URL loopback và báo lỗi nếu mirror YAML bị lệch, thiếu hoặc thừa.
- Các collection UTH và bản Copy trong workspace là tài liệu/bản sao riêng. Không ghi đè, đổi workspace ID hoặc xóa chúng khi đồng bộ collection local.

Secret guard chặn token/Bearer, API key, mật khẩu, cookie và dữ liệu nhận dạng phổ biến trong JSON canonical. Trường nhạy cảm chỉ được để trống hoặc dùng placeholder; kiểm tra thêm MSSV dạng 8 chữ số. Chỉ commit environment mẫu không chứa secret; không commit response thật, HAR, token, mật khẩu hoặc dữ liệu cá nhân.

## Giới hạn dữ liệu UTH

Collection local không xác nhận contract của UTH. Endpoint, phương thức, cơ chế xác thực và schema UTH vẫn cần bằng chứng trước khi đưa vào connector. Không tự đăng nhập, thu cookie, đồng bộ SQLite hoặc dùng Postman cloud runner với tài khoản thật.
