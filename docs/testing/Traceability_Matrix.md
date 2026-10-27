# Traceability Matrix — CA-099.01

> Trạng thái: **PLANNED**. Chỉ ghi `PASS` sau khi có evidence thực tế.

## 1. Requirement → Test Case

| ID | Requirement ngắn | Task | Test Case | Kỹ thuật |
| --- | --- | --- | --- | --- |
| REQ-FE-001 | Bootstrap và hiển thị lỗi IPC | CA-099.01 | TC-001 | EP, State |
| REQ-FE-002 | Intent thiếu môn phải hỏi lại | CA-099.01 | TC-002 | EP |
| REQ-FE-003 | Slash command và back/cancel đúng flow | CA-099.01 | TC-003 | State |
| REQ-DB-001 | Migration không mất dữ liệu | CA-099.01 | TC-004 | State, Data |
| REQ-API-001 | Bearer token thiếu/sai trả 401 | CA-099.01 / CA-098.01 | TC-005 | EP, BVA |
| REQ-API-002 | Query sai trả 400 đúng envelope | CA-099.01 / CA-098.01 | TC-006 | EP |
| REQ-API-003 | UTH chưa verified không trả dữ liệu giả | CA-099.01 / CA-083 | TC-007 | State, Provenance |
| REQ-API-004 | Không lộ token, cookie, stack trace | CA-099.01 / CA-094 | TC-008 | Negative, Security |
| REQ-FILE-001 | Chặn path traversal, chỉ dùng managed root | CA-099.01 / CA-094 | TC-009 | EP, BVA |
| REQ-FLOW-001 | Trash move/restore/empty đúng trạng thái | CA-099.01 / CA-091 | TC-010 | State |

## 2. Test Case → Evidence

| Test Case | Automated evidence | Manual evidence |
| --- | --- | --- |
| TC-001 | `npm run test -- --run src/bootstrapRequest.test.ts` | Bootstrap khi IPC không sẵn sàng |
| TC-002 | `npm run test -- --run src/engine.test.ts` | Gửi câu hỏi thiếu môn |
| TC-003 | `npm run test -- --run src/engine.test.ts` | Thử slash command, back, cancel |
| TC-004 | `cargo test --manifest-path src-tauri/Cargo.toml db::tests` | Restart app và kiểm tra dữ liệu |
| TC-005 | `cargo test --manifest-path src-tauri/Cargo.toml api::tests` | Postman thiếu/sai token |
| TC-006 | `cargo test --manifest-path src-tauri/Cargo.toml api::tests` | Postman query sai/thiếu |
| TC-007 | `cargo test --manifest-path src-tauri/Cargo.toml connectors::connector_engine` | Kiểm tra gate UTH local |
| TC-008 | `cargo test --manifest-path src-tauri/Cargo.toml api::tests` | Kiểm tra response và log |
| TC-009 | `cargo test --manifest-path src-tauri/Cargo.toml paths::tests documents::tests` | Thử open/copy và traversal |
| TC-010 | `cargo test --manifest-path src-tauri/Cargo.toml trash::tests` | Move/restore/empty trash |

## 3. Tổng quan

| Nhóm | Số requirement | Test Case |
| --- | ---: | --- |
| Frontend / Chat | 3 | TC-001–TC-003 |
| SQLite / Data | 1 | TC-004 |
| REST API | 4 | TC-005–TC-008 |
| File / Trash | 2 | TC-009–TC-010 |
| **Tổng** | **10** | **TC-001–TC-010** |

## 4. Quy tắc

- Không ghi `PASS` nếu chưa có output hoặc evidence.
- Failure phải gắn với Defect ID.
- Cập nhật đồng thời Requirement, Task và Test Case khi source thay đổi.
- Local REST pass không đồng nghĩa UTH API đã verified.
