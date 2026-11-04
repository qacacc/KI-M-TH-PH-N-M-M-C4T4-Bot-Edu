# Traceability Matrix — CA-089.01

> Trạng thái: **DONE**. Đã kiểm chứng qua Automated Tests và evidence thực tế.

## 1. Requirement → Test Case

| ID | Requirement ngắn | Task | Test Case | Kỹ thuật |
| --- | --- | --- | --- | --- |
| REQ-SCHOOL-001 | Loại bỏ hoàn toàn MOCK_PUBLIC_DOCS giả mạo | CA-089.01 | TC-021-1 | EP, State |
| REQ-SCHOOL-002 | Vô hiệu hóa và làm rõ trạng thái toggle chưa hỗ trợ | CA-089.01 | TC-021-2 | State |
| REQ-SCHOOL-003 | Luồng mở Portal chuẩn async/await, không tự suy diễn session | CA-089.01 | TC-021-3 | State, Negative |

## 2. Test Case → Evidence

| Test Case | Automated evidence | Manual evidence |
| --- | --- | --- |
| TC-021-1 | `npm run check:all` (PASS) | Kiểm tra trang Cài đặt và Trang trường không còn hiển thị tài liệu tuyển sinh mô phỏng |
| TC-021-2 | `npm run check:all` (PASS) | Các toggle Auto-sync, Scheduler, Vault bị disabled kèm nhãn chưa hỗ trợ |
| TC-021-3 | `npm run check:all` (PASS) | Click mở Portal chờ promise resolve/reject, trạng thái đăng nhập giữ nguyên trung thực |

## 3. Tổng quan

| Nhóm | Số requirement | Test Case | Trạng thái |
| --- | ---: | --- | --- |
| School UI Source Truth (CA-089.01) | 3 | TC-021-1–TC-021-3 | PASS |
| **Tổng** | **3** | **TC-021-1–TC-021-3** | **100% PASS** |

## 4. Quy tắc

- Không ghi `PASS` nếu chưa có output hoặc evidence thực tế.
- Giao diện phản ánh trung thực trạng thái kết nối backend, không dùng sample production làm dữ liệu thật.
- Đồng bộ cập nhật đồng thời code, Test Plan và Traceability Matrix.