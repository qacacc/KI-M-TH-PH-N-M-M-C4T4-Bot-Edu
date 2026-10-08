# AI AGENT RULES & GOVERNANCE - CAMPUS ASSISTANT LOCAL

Mọi AI Agent khi làm việc trên kho mã nguồn này **BẮT BUỘC PHẢI TUÂN THỦ** các quy tắc dưới đây.

## 1. PHÂN BIỆT THỰC TẾ & MỤC TIÊU (CURRENT vs TARGET)
Tất cả phân tích và báo cáo của AI bắt buộc phải phân loại rõ ràng:
- **`CONFIRMED`**: Sự thật đã có bằng chứng trong runtime source code hiện tại.
- **`ASSUMED`**: Thông tin suy đoán nhưng chưa có fixture xác minh.
- **`UNKNOWN`**: 
  - Nếu `UNKNOWN` **không ảnh hưởng** đến correctness/security/design -> Ghi nhận trong báo cáo và tiếp tục.
  - Nếu `UNKNOWN` **ảnh hưởng** đến correctness/security/data contract/design -> **PHẢI DỪNG VÀ BÁO USER**.
- **`PLANNED`**: Chức năng mục tiêu chưa xây dựng. Tuyệt đối không mô tả `PLANNED` như `CONFIRMED`.

## 2. QUY TRÌNH THAY ĐỔI
Trước khi sửa bất kỳ dòng code nào, AI bắt buộc phải tuân theo quy trình tại [AI_CHANGE_PROTOCOL.md](docs/AI_CHANGE_PROTOCOL.md):
- **Phase 0 & 1**: Đọc tài liệu trong `docs/`, thực hiện Truth Check & Lập báo cáo Phân tích Tác động (Impact Analysis).
- **Phase 2**: Đưa ra kế hoạch thay đổi nhỏ nhất (Minimal Plan).
- **Phase 3**: Triển khai chính xác scope sau khi được duyệt.
- **Phase 4**: Chạy xác minh `npm run check:all`.
- **Phase 5**: Cập nhật đồng bộ các tài liệu trong `docs/`.

## 3. BẤT BIẾN TUYỆT ĐỐI (INVARIANTS)
AI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ VỠ** các bất biến (xem chi tiết tại [INVARIANTS.md](docs/INVARIANTS.md)):
- `SEC`: Mật khẩu không đi qua React; token/cookie không nằm trong localStorage; WebView có capability isolation; Backend sanitize PII ở native IPC.
- `DATA`: Sync failure không xóa cache tốt; Error != Empty; Schema change có migration.
- `AI`: UNKNOWN blocking fact => STOP; Không tự phát minh API contract; Không báo DONE nếu thiếu bằng chứng test.
- `UI`: Không fake UI capability; thao tác phá hủy phải confirm.
- `FILE`: Managed roots only; Path traversal bị chặn ở Rust.
- `DOC`: Tuyệt đối không mô tả TARGET/PLANNED là CURRENT.

*Lưu ý về Invariant Violation*: AI sẽ DỪNG nếu task tạo mới hoặc làm nặng thêm một vi phạm invariant hiện có, ngoại trừ các task được giao với mục tiêu rõ ràng là sửa vi phạm đó (Remediation Task).

## 4. NGÔN NGỮ & BÁO CÁO
- Luôn viết comment và giải thích bằng **Tiếng Việt**.
- Không tự ý sử dụng Browser, Computer use hoặc MCP servers bên ngoài trừ khi được yêu cầu cụ thể.
- Giữ response ngắn gọn, chỉ chỉnh sửa đúng vùng code được yêu cầu.
