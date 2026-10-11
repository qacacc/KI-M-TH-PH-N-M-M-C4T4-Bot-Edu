# 📚 DANH MỤC & PHÂN LOẠI TÀI LIỆU DỰ ÁN (DOCS DIRECTORY)
## Campus Assistant Local

- [Audit source 2026-10-09](SOURCE_AUDIT_2026-10-09.md): findings, evidence, giới hạn và backlog sửa/clean/release.

Toàn bộ tài liệu kỹ thuật của dự án được phân loại theo 4 nhóm mục tiêu dưới đây để các thành viên dễ dàng tra cứu:

---

### 1. 🏗️ Kiến trúc & Thiết kế Hệ thống (Architecture & System Design)
Tài liệu định nghĩa thiết kế tổng thể, luồng dữ liệu và cách các module tương tác với nhau:

| Tệp tài liệu | Mô tả nội dung |
|---|---|
| [`docs/SYSTEM_BLUEPRINT.md`](SYSTEM_BLUEPRINT.md) | Sơ đồ bản vẽ tổng thể toàn bộ hệ thống |
| [`docs/DATA_FLOW.md`](DATA_FLOW.md) | Luồng di chuyển của dữ liệu giữa Frontend, Backend và SQLite |
| [`docs/RUNTIME_FLOW_OVERVIEW.md`](RUNTIME_FLOW_OVERVIEW.md) | Vòng đời khởi động app, nạp cấu hình và kết nối local |
| [`docs/FLOW_MAP.md`](FLOW_MAP.md) | Bản đồ luồng xử lý của các tính năng người dùng |
| [`docs/STATE_MACHINES.md`](STATE_MACHINES.md) | Máy trạng thái (State machine) cho các tác vụ đồng bộ và auth |
| [`docs/DEPENDENCY_MAP.md`](DEPENDENCY_MAP.md) | Bản đồ phụ thuộc giữa các thư viện và module |
| [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | Kiến trúc chi tiết các lớp ứng dụng |
| [`CONNECTOR_DESIGN.md`](architecture/CONNECTOR_DESIGN.md) | Thiết kế module kết nối cổng trường (School Connector) |

---

### 2. 🛡️ Quy chuẩn Kỹ thuật & Bảo mật (Engineering, Contracts & Security)
Các quy tắc bất biến, hợp đồng dữ liệu và tiêu chuẩn bảo mật bắt buộc tuân thủ:

| Tệp tài liệu | Mô tả nội dung |
|---|---|
| [`docs/INVARIANTS.md`](INVARIANTS.md) | **Các bất biến tuyệt đối:** Không lưu mật khẩu, bảo vệ WebView, cách ly token |
| [`SECURITY_NOTES.md`](guidelines/SECURITY_NOTES.md) | Ghi chú và khuyến nghị bảo mật dữ liệu sinh viên |
| [`CONNECTOR_THREAT_MODEL.md`](guidelines/CONNECTOR_THREAT_MODEL.md) | Mô hình đe dọa và giải pháp phòng thủ cho School Connector |
| [`BACKEND_GUIDELINES.md`](guidelines/BACKEND_GUIDELINES.md) | Quy chuẩn viết mã nguồn Rust Backend |
| [`DATA_CONTRACTS.md`](architecture/DATA_CONTRACTS.md) | Hợp đồng cấu trúc dữ liệu trao đổi giữa Rust IPC và React UI |
| [`UX_UI_GUIDELINES.md`](guidelines/UX_UI_GUIDELINES.md) | Quy chuẩn thiết kế giao diện, phối màu và trải nghiệm người dùng |

---

### 3. 🎯 Kế hoạch Phát triển & Quản lý Nhiệm vụ (Planning & Tasks)
Mục tiêu phát hành, lộ trình tính năng và tiêu chí nghiệm thu:

| Tệp tài liệu | Mô tả nội dung |
|---|---|
| [`docs/ROADMAP.md`](ROADMAP.md) | Lộ trình phát triển tổng thể của dự án |
| [`ROADMAP.md`](../ROADMAP.md) | Kế hoạch các cột mốc phiên bản |
| [`MVP_0.1.md`](planning/MVP_0.1.md) | Mục tiêu và phạm vi của phiên bản phát hành tối thiểu MVP |
| [`DEVELOPMENT_DIRECTION.md`](planning/DEVELOPMENT_DIRECTION.md) | Định hướng phát triển dài hạn |
| [`PROJECT_TASKS.md`](planning/PROJECT_TASKS.md) | Toàn bộ danh sách task và tiến độ |
| [`tasks/TASK_INDEX.md`](../tasks/TASK_INDEX.md) | Danh mục chi tiết các nhiệm vụ kỹ thuật và bugfix |
| [`OPTIMIZATION_TARGETS.md`](planning/OPTIMIZATION_TARGETS.md) | Các chỉ số tối ưu hóa hiệu năng và dung lượng |
| [`ACCEPTANCE_CRITERIA.md`](planning/ACCEPTANCE_CRITERIA.md) | Tiêu chí nghiệm thu chất lượng sản phẩm |

---

### 4. 🔄 Quy trình Làm việc & Quy tắc Đóng góp (Workflow & Governance)
Dành cho lập trình viên và AI Agent khi làm việc trên kho mã nguồn:

| Tệp tài liệu | Mô tả nội dung |
|---|---|
| [**`CONTRIBUTING.md`**](../CONTRIBUTING.md) | **Quy trình làm việc Git/GitHub hàng ngày của nhóm** (Nhánh, Commit, PR, Review) |
| [**`AGENTS.md`**](../AGENTS.md) | **Quy tắc ứng xử và ràng buộc tuyệt đối cho AI Agent** |
| [`docs/AI_CHANGE_PROTOCOL.md`](AI_CHANGE_PROTOCOL.md) | Quy trình 5 bước AI bắt buộc tuân theo khi sửa mã nguồn |
| [`DEV_WORKFLOW.md`](workflows/DEV_WORKFLOW.md) | Quy trình thao tác code & build hàng ngày |
| [`DEV_COMMANDS.md`](workflows/DEV_COMMANDS.md) | Bảng tổng hợp tất cả các lệnh chạy, test và build dự án |
| [`CURRENT_STATE.txt`](planning/CURRENT_STATE.txt) | Tóm tắt hiện trạng phiên bản đang chạy |
