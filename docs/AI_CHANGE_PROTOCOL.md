# AI CHANGE PROTOCOL - QUY TRÌNH THAY ĐỔI DÀNH CHO AI AGENT

Tài liệu này quy định quy trình 6 bước **BẮT BUỘC** mà AI Agent phải tuân thủ nghiêm ngặt trước, trong và sau khi thực hiện bất kỳ công việc (Task) nào trên codebase của dự án.

---

## 🛑 PHASE 0 — TRUTH CHECK & PHÂN TÍCH TÁC ĐỘNG (IMPACT ANALYSIS)

Trước khi viết hoặc sửa bất kỳ dòng code nào, AI **PHẢI** đọc các tài liệu hệ thống và báo cáo ngắn gọn cho User theo đúng 12 mục sau:

1. **Phân loại thông tin (Truth Classification)**:
   - `CONFIRMED`: Sự thật đã có bằng chứng trong runtime source code hiện tại.
   - `ASSUMED`: Thông tin suy đoán nhưng chưa có fixture xác minh.
   - `UNKNOWN`: Thông tin chưa rõ.
   - `PLANNED`: Chức năng mục tiêu chưa xây dựng.
2. **Feature bị tác động**: Tên Feature tương ứng trong `docs/FEATURE_CATALOG.md`.
3. **Entry Point**: Điểm đầu vào của thay đổi (Component React, Tauri IPC Command, hay Service Rust).
4. **Luồng hiện tại (`CURRENT`) & Luồng mục tiêu (`TARGET`)**: Mô tả từng bước (xem `docs/FLOW_MAP.md`).
5. **State trước & sau**: Trạng thái hệ thống (xem `docs/STATE_MACHINES.md`).
6. **Dữ liệu ĐỌC**: Nguồn dữ liệu được đọc (SQLite, LocalStorage, WebView, hay JSON Fixtures).
7. **Dữ liệu GHI**: Nơi dữ liệu sẽ được ghi (SQLite, Managed Workspace, hay LocalStorage).
8. **Module phụ thuộc**: Danh sách module liên quan (xem `docs/DEPENDENCY_MAP.md`).
9. **Invariant phải giữ**: Các bất biến không được phá vỡ (xem `docs/INVARIANTS.md`).
10. **Nguy cơ Regression**: Các chức năng khác có rủi ro bị ảnh hưởng.
11. **File dự kiến sửa**: Danh sách file chính xác sẽ chỉnh sửa.
12. **Test phải chạy**: Danh sách bộ test tự động bắt buộc phải vượt qua (xem `docs/REGRESSION_MATRIX.md`).
13. **Evidence Commands**: Với mỗi tiêu chí Done quan trọng, AI phải định nghĩa trước lệnh chứng minh lỗi đang tồn tại và lệnh chứng minh lỗi đã hết. Ví dụ: `rg -n "\.settings-toggle\s*\{" src/styles.css` phải có expected count rõ ràng.

---

## ⚠️ CÁC ĐIỀU KIỆN DỪNG LẬP TỨC (STOP CONDITIONS)

AI Agent **BẮT BUỘC PHẢI DỪNG LẠI VÀ BÁO CHO USER**, không được tự ý xử lý nếu gặp một trong các trường hợp sau:

1. **Phân định Mâu thuẫn (Source vs Docs)**:
   - **Với Runtime Implementation Task (Task sửa/viết code)**: Nguồn mã nguồn (`Source`) và tài liệu (`Docs`) mâu thuẫn -> **STOP trước khi sửa code**.
   - **Với Documentation Reconciliation Task (Task làm sạch/audit tài liệu)**: Ghi nhận mâu thuẫn và cập nhật Docs theo bằng chứng thực tế (`Source Evidence`). **Không tự ý sửa runtime code để ép khớp với Docs**.
2. **Thông tin chưa rõ (`UNKNOWN`)**:
   - Nếu `UNKNOWN` **ảnh hưởng** đến correctness, security, data contract hoặc kiến trúc cốt lõi -> **STOP**.
   - Nếu `UNKNOWN` **không ảnh hưởng** đến correctness hay security -> Ghi nhận vào báo cáo và tiếp tục.
3. **Vi phạm Bất biến (`Invariant Violation`)**:
   - Dừng lập tức nếu Task tạo mới hoặc làm trầm trọng thêm một vi phạm Invariant hiện có.
   - Ngoại lệ: Task được giao với mục tiêu rõ ràng là sửa vi phạm đó (Remediation Task).
4. **Yêu cầu ngoài phạm vi**:
   - Yêu cầu đụng chạm đến API bên ngoài chưa có Fixture xác minh contract.
   - Yêu cầu sửa các file ngoài phạm vi Task được duyệt.
   - Cần thay đổi DB Schema nhưng Task chưa có kế hoạch Migration.
5. **Baseline Test bị lỗi**:
   - Bộ test nền (`Baseline Tests`) bị lỗi trước khi Task bắt đầu.
6. **Evidence mâu thuẫn với báo cáo**:
   - Báo cáo claim đã xóa/sửa nhưng lệnh kiểm source vẫn cho kết quả ngược lại.
   - Task vẫn còn trong `Active task` hoặc file task vẫn ghi `Status: In Progress` nhưng AI định báo `DONE`.
   - `npm run check:all` PASS nhưng không có lệnh source/static/manual tương ứng cho claim UI/UX quan trọng.

---

## QUY TRÌNH 5 GIAO ĐOẠN THỰC THI (5-PHASE EXECUTION)

### PHASE 1 — Hiểu Hệ thống & Phân tích Tác động
- Đọc các tài liệu quản trị trong `docs/`.
- Phân loại rõ ràng `CURRENT` vs `TARGET`.
- KHÔNG sửa code trong giai đoạn này.

### PHASE 2 — Lập Kế hoạch Nhỏ nhất (Minimal Plan)
- Đưa ra phương án thay đổi nhỏ nhất có thể để hoàn thành yêu cầu.
- KHÔNG tự ý thêm feature ngoài scope.
- KHÔNG tự ý refactor các phần mã nguồn không liên quan.
- KHÔNG đổi API Contract nếu không được yêu cầu.

### PHASE 3 — Triển khai (Implementation)
- Chỉ tiến hành sửa code sau khi kế hoạch đã được User xác nhận.
- Đảm bảo tuân thủ nghiêm ngặt các Invariant.

### PHASE 4 — Xác minh (Verification)
- Chạy lệnh kiểm tra tổng thể: `npm run check:all`.
- Đảm bảo tất cả bộ test tự động runtime phát hiện được đều **PASS 100%**, 0 failed, 0 skip ngoài dự kiến.
- Đối chiếu `docs/REGRESSION_MATRIX.md` để xác nhận các module phụ thuộc không bị hư hại.
- Chạy lại toàn bộ **Evidence Commands** đã định nghĩa ở Phase 0/2.
- Với mỗi claim quan trọng, báo cáo phải có:
  - `CONFIRMED` / `ASSUMED` / `UNKNOWN` / `PLANNED`.
  - `file:line` chính xác.
  - Lệnh kiểm chứng.
  - Kết quả rút gọn.
- Với UI/UX, bắt buộc phân loại phạm vi kiểm chứng:
  - `AUTOMATED`: test/build/check đã chạy.
  - `STATIC SOURCE CHECK`: đã kiểm source/CSS bằng lệnh.
  - `MANUAL VISUAL CHECK`: đã mở app và nhìn/click thật.
  - Nếu chưa có manual check thì **KHÔNG ĐƯỢC** dùng các từ như “triệt để”, “100% UI”, “không bao giờ xuất hiện lại”.

### PHASE 5 — Cập nhật Tài liệu (Documentation Sync)
- Nếu luồng thay đổi -> Cập nhật `docs/FLOW_MAP.md`.
- Nếu trạng thái thay đổi -> Cập nhật `docs/STATE_MACHINES.md`.
- Nếu phụ thuộc thay đổi -> Cập nhật `docs/DEPENDENCY_MAP.md`.
- Nếu feature thay đổi -> Cập nhật `docs/FEATURE_CATALOG.md`.
- Nếu task hoàn thành -> Cập nhật file task sang `Status: Done`, chuyển task khỏi `Active task` trong `tasks/TASK_INDEX.md`, thêm vào bảng `Done`, và cập nhật `PROJECT_TASKS.md` bằng đúng bằng chứng source/runtime.
- **KHÔNG ĐƯỢC kết thúc task nếu code đã đổi nhưng tài liệu kiến trúc chưa được cập nhật đồng bộ.**
- **KHÔNG ĐƯỢC báo DONE nếu task governance chưa khớp source**: `tasks/TASK_INDEX.md`, file task, và `PROJECT_TASKS.md` phải đồng bộ.
