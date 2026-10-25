# INVARIANTS - CAMPUS ASSISTANT LOCAL

Tài liệu này chứa các **Bất biến Hệ thống (System Invariants)**. Đây là những quy tắc cốt lõi **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ VỠ** trong bất kỳ trường hợp nào, kể cả khi refactor hay tối ưu hóa mã nguồn.

---

## 1. Security & Authentication Invariants (`SEC`)
- **`SEC-001`**: Mật khẩu đăng nhập của sinh viên KHÔNG BAO GIỜ đi qua hay xử lý phía React Frontend.
- **`SEC-002`**: Session Tokens, JWT, Cookies và Secret Credentials KHÔNG ĐƯỢC LƯU VÀO `localStorage`.
- **`SEC-003`**: Remote WebView (`uth-login`) KHÔNG ĐƯỢC CẤP quyền Tauri IPC chung (Capability Isolation).
- **`SEC-004`**: Backend Rust bắt buộc tái kiểm tra và sanitize thông tin PII nhạy cảm ở ranh giới native IPC trước khi tạo request ra internet.
- **`SEC-005`**: Session Tokens, JWT, Cookies không được truyền qua React Frontend hoặc payload IPC do frontend điều khiển.

---

## 2. Data Integrity & Persistence Invariants (`DATA`)
- **`DATA-001`**: Lỗi kết nối / HTTP Error KHÔNG ĐƯỢC coi là dữ liệu rỗng (`Error != Empty`).
- **`DATA-002`**: Khi đồng bộ thất bại, KHÔNG ĐƯỢC XÓA dữ liệu SQLite cache cũ đang có (Preserve Last-Known-Good).
- **`DATA-003`**: Mỗi miền dữ liệu lâu dài (Persistent Domain) chỉ có MỘT Authoritative Owner duy nhất.
- **`DATA-004`**: Dữ liệu MOCK hoặc Sample Fixture KHÔNG BAO GIỜ được hiển thị gán nhãn là *"Dữ liệu Portal Thật"*.
- **`DATA-005`**: Mọi thay đổi DB Schema bắt buộc phải có script Migration (`PRAGMA user_version`).

---

## 3. AI Agent Governance Invariants (`AI`)
- **`AI-001`**: Nếu gặp thông tin chưa rõ thuộc loại `UNKNOWN` ảnh hưởng đến correctness/security/design -> AI PHẢI DỪNG và báo User (`STOP CONDITION`).
- **`AI-002`**: AI KHÔNG ĐƯỢC tự phát minh ra API Contract của máy chủ bên ngoài khi chưa có Fixture được xác minh.
- **`AI-003`**: AI KHÔNG ĐƯỢC tự ý mở rộng phạm vi task hoặc refactor code ngoài scope được duyệt.
- **`AI-004`**: AI KHÔNG ĐƯỢC báo `DONE` nếu chưa có bằng chứng kiểm thử thực tế (Evidence).
- **`AI-005`**: AI KHÔNG ĐƯỢC mô tả kiến trúc mục tiêu (`TARGET`) như thể đã hoàn thành (`CURRENT`) trong tài liệu.
- **`AI-006`**: AI KHÔNG ĐƯỢC báo hoàn thành nếu claim quan trọng không có `file:line`, lệnh kiểm chứng, và kết quả lệnh rút gọn.
- **`AI-007`**: AI KHÔNG ĐƯỢC báo `DONE` nếu task vẫn nằm trong `Active task`, file task vẫn ghi `Status: In Progress`, hoặc báo cáo mâu thuẫn với source hiện tại.
- **`AI-008`**: `npm run check:all` PASS chỉ là điều kiện cần, KHÔNG phải bằng chứng đủ cho UI/UX claim. Claim về UI phải phân biệt rõ `AUTOMATED`, `STATIC SOURCE CHECK`, và `MANUAL VISUAL CHECK`.

---

## 4. UI & User Experience Invariants (`UI`)
- **`UI-001`**: UI KHÔNG ĐƯỢC tuyên bố hoặc hiển thị trạng thái tính năng (ví dụ *"Windows DPAPI Active"*) mà Backend chưa triển khai thực tế.
- **`UI-002`**: Mọi thao tác có tính phá hủy dữ liệu (xóa file, xóa DB, ngắt kết nối) bắt buộc phải qua bước Confirm.
- **`UI-003`**: Trạng thái dữ liệu Offline / Cache phải luôn được hiển thị rõ ràng trên giao diện.

---

## 5. Safety & File System Invariants (`FILE`)
- **`FILE-001`**: Mọi thao tác file chỉ được phép diễn ra trong các thư mục được quản lý (`managed_roots`).
- **`FILE-002`**: Đường dẫn chứa ký tự di chuyển thư mục cha (`../` hoặc `..\`) bắt buộc bị chặn ở tầng Rust.
- **`FILE-003`**: Yêu cầu thao tác file từ Frontend KHÔNG BAO GIỜ được tin tưởng tuyệt đối mà phải qua kiểm tra quyền an toàn tại Native Rust.

---

## 6. Documentation Invariants (`DOC`)
- **`DOC-001`**: Mọi tuyên bố về runtime trong tài liệu bắt buộc phải được phân loại rõ ràng thành: `CONFIRMED`, `ASSUMED`, `UNKNOWN`, hoặc `PLANNED`. Tuyệt đối không mô tả `PLANNED` như `CONFIRMED`.

---

## 7. Current Enforcement Status & Remediation Map

### Audit override - 2026-10-09

[Audit source](SOURCE_AUDIT_2026-10-09.md) phát hiện các giới hạn mà bảng lịch sử bên dưới chưa bao phủ. Không dùng ENFORCED để bỏ qua remediation:

- DATA-001: PARTIAL ngoài connector: public all-fetch-failure thành no-match, history load failure thành welcome; CA-093/087.
- DATA-003: PARTIAL: native trash/localStorage fallback và hai owner preset; CA-091/095.
- DATA-004 / UI-001: PARTIAL: public docs mock trong Settings ghi như tự động tải, auto-sync không scheduler; CA-089.
- DATA-005: PARTIAL: trash schema CREATE ngoài user_version; CA-091.
- UI-002: PARTIAL: ErrorBoundary clear localStorage không confirm, init legacy history cleanup theo marker chưa consent; CA-090/087.
- FILE-001..003: file action canonical guards có evidence test; theme/trash-metadata root hardening còn cần native/symlink tests CA-094/091. Không claim đã có exploit.
- SEC-003/005: CA-083 gate chặn auth runtime. CA-094.01 gỡ `syncUthAfterLogin`/đăng ký `sync_uth_after_login` (React không còn gửi JWT qua IPC) và thu hẹp capability main; `receive_uth_jwt` còn đăng ký nhưng bị gate. Production auth boundary cần CA-080/081. Không bật gate từ bảng này.

Các fix đều PLANNED, không thay runtime trong audit. CA-097 sẽ đồng bộ bảng canonical với source/evidence.

Bảng theo dõi trạng thái thực thi thực tế (`Runtime Status`) của từng Invariant và Task xử lý tương ứng (`Remediation Task`). AI không được coi vi phạm hiện có là cớ để tạo thêm vi phạm mới.

| Invariant | Description | Runtime Status | Remediation Task |
|---|---|---|---|
| **`SEC-001`** | Password never crosses React boundary | **`ENFORCED`** | — |
| **`SEC-002`** | Secret never in localStorage | **`ENFORCED`** | — |
| **`SEC-003`** | Remote WebView Capability Isolation | **`ENFORCED`** | — |
| **`SEC-004`** | Backend IPC Mandatory PII Sanitization | **`ENFORCED`** | — |
| **`SEC-005`** | Secret never passes through React IPC payload | **`ENFORCED`** | — |
| **`DATA-001`** | Error != Empty | **`PARTIAL / QUARANTINED`** | CA-083 gỡ parser UTH suy đoán, entry chưa verified trả lỗi trước IO và không dùng unwrap_or_default lịch thi. Semantics sync/snapshot thật vẫn cần CA-081. |
| **`DATA-002`** | Sync failure preserves last-known-good cache | **`ENFORCED`** | — |
| **`DATA-003`** | Single Authoritative Domain Owner | **`ENFORCED`** | — |
| **`DATA-004`** | Mock never claims real provenance | **`ENFORCED`** | — |
| **`DATA-005`** | Schema changes require version migration | **`ENFORCED`** | — |
| **`AI-001`..`008`**| AI Agent Governance Rules | **`ENFORCED`** | — |
| **`UI-001`** | UI must not claim un-backed backend features | **`ENFORCED`** | — |
| **`UI-002`** | Destructive operation confirmation | **`ENFORCED`** | — |
| **`UI-003`** | Offline/Cache state visibility | **`ENFORCED`** | — |
| **`FILE-001`..`003`**| Managed Roots & Path Traversal Guards | **`ENFORCED`** | — |
| **`DOC-001`** | Current vs Target Distinction | **`ENFORCED`** | — |
