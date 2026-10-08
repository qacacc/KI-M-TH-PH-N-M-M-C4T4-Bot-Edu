# ROADMAP - CAMPUS ASSISTANT LOCAL

Tài liệu định hướng phát triển dự án theo mô hình phụ thuộc (Dependency-based Roadmap). Một cột mốc phía sau chỉ được bắt đầu khi cột mốc phụ thuộc phía trước đã vượt qua **MILESTONE EXIT GATE (Pass 100% Tests & Invariants)**.

> ĐỐI CHIẾU 2026-10-09: các milestone/checkbox/mã CA bên dưới là roadmap lịch sử chưa reconciliation, không phải trạng thái CURRENT đã xác minh. M1-M3 COMPLETED và fixture/E2E claims không khớp UTH CONTRACT_UNVERIFIED. Ưu tiên [audit source](SOURCE_AUDIT_2026-10-09.md) và [Task Index](../tasks/TASK_INDEX.md); CA-097 sẽ đối chiếu toàn bộ ID/gate. Không dùng checkbox cũ để tự bật connector hoặc báo Done.

```
M0 — SYSTEM TRUTH & GREEN BASELINE
│
├─ CA-055 Governance / Docs Truth & Reconciliation
├─ CA-056 Green Build Baseline (npm run check:all PASS)
└─ CA-057 Current-vs-Target Architecture & UI Clean-up (Remove un-backed fake DPAPI claim)
        │
        ▼
M1 — CORE DATA INTEGRITY [COMPLETED]
│
├─ CA-058 [x] Academic Data Source Arbitration
├─ CA-059 [x] Chat Intent Routing & Shadowing Cleanup
├─ CA-060 [x] Partial Sync Transaction Fail-Safe
├─ CA-061 [x] Data Provenance & Outbound Backend PII Enforcement
└─ CA-062 [x] Physical Trash End-to-End UI Integration
        │
        ▼
M2 — DATA & CONNECTOR FOUNDATION [COMPLETED]
│
├─ CA-063 [x] DB Schema Migration Infrastructure & Backup Key Alignment
├─ CA-063A Backup Bundle Schema Versioning
├─ CA-063B Settings Backup Integration Contract
├─ CA-064 Local Document Ingestion Engine & Extraction Pipeline
└─ CA-065  Canonical Academic Model Contracts v2
        │
        ▼
M3 — UTH CONTRACT DISCOVERY & SESSION BOUNDARY HARDENING [COMPLETED]
│
├─ CA-068 [x] WebView Capabilities Isolation
├─ CA-069 [x] Session Token Boundary Hardening (Rust-Only Session Storage)
├─ CA-070 [x] UTH Response Fixture Contracts & Verification
└─ CA-071 [x] End-to-End Connector Sync Automated Testser (No Mock Fallback Data)
        │
        ▼
M4 — UTH AUTH SECURITY
│
├─ CA-069 WebView Capability Isolation (capabilities/default.json)
├─ CA-070 Automatic Session Extraction from WebView
└─ CA-071 Backend Identity Verification Bridge
        │
        ▼
M5 — UTH PORTAL E2E
│
├─ CA-072 Schedule E2E Sync Verification
├─ CA-073 Exam Endpoint Verification
└─ CA-074 Offline / Partial / Restart E2E Verification
        │
        ▼
M6 — UTH LMS (courses.ut.edu.vn)
│
├─ CA-075 LMS Contract Discovery & Fixtures
├─ CA-076 LMS Authentication Bridge
└─ CA-077 Managed Lecture File & Document Sync
        │
        ▼
M7 — MULTI-SCHOOL FOUNDATION
│
├─ CA-078 School Manifest Schema v2
├─ CA-079 Connector Adapter Interface
├─ CA-080 HCMUT (Bách Khoa) Contract Discovery
└─ CA-081 HCMUS (KHTN) Contract Discovery
        │
        ▼
M7 — RELEASE HARDENING (v1.1.0)
│
├─ CA-082 Persistent Session Decision (OPTION A: Session-only vs OPTION B: OS Secure Vault)
├─ CA-083 Production Installer & Auto-Upgrade Migration
└─ CA-084 Release Audit & Security Checklist
```

---

## Milestone Exit Gates & Acceptance Requirements:

### M0 Exit Gate (System Truth & Baseline)
- [x] Tất cả tài liệu trong `docs/` phân định rõ ràng `CURRENT` vs `TARGET`. Không claim `PLANNED` là `CURRENT`.
- [x] Mọi Known Gap trong Feature Catalog có `Tracking Task: CA-xxx` hoặc `Decision: DEFERRED`.
- [x] Giao diện SettingsPage dọn dẹp nhãn chưa được backend hỗ trợ ("Windows DPAPI: Active").
- [x] Chạy `npm run check:all` đạt trạng thái **PASS 100%**.
- [x] Không có vi phạm Invariant mức P0 mà chưa có tracking task.

### M1 Exit Gate (Core Data Integrity)
- [x] SQLite Cache được ưu tiên hơn JSON sample khi có dữ liệu thật (Source Arbitration).
- [x] Chat Intent Router không bị nuốt intent bởi `handleSchoolChatQuery` (Intent Shadowing Fix).
- [x] Nguyên tắc `Error != Empty` được đảm bảo: Đồng bộ lỗi giữ nguyên cache cũ.
- [x] Backend Rust ép buộc sanitize PII nhạy cảm ở ranh giới native IPC trước outbound request.
- [x] UI hiển thị chính xác DataOrigin/DataFreshness: `sample-json`, `prototype-fixture`, `uth-portal`, `live/cache/stale`; không gắn nhãn REAL sai nguồn (CA-061).
- [x] Giao diện UI File gắn nút xóa và khôi phục Thùng rác E2E.

### M2 Exit Gate (Data & Connector Foundation)
- [x] Script Migration Schema (`PRAGMA user_version`) hoạt động ổn định khi nâng cấp DB.
- [x] Backup Bundle Schema Versioning (`CA-063A`) và Settings Backup Integration (`CA-063B`) được xác minh.
- [x] Connector Account Model phân biệt rõ đa tài khoản/đa trường.
- [x] Canonical Academic Model v2 được định nghĩa, versioned và có contract test cho Schedule/Exam (CA-065).

### M3 Exit Gate (UTH Contract Discovery)
- [x] UTH Auth contract được xác minh qua Fixtures thực tế.
- [x] Session Token Boundary Hardening (Rust-Only Session Storage) được áp dụng.
- [x] Remote WebView Capability Isolation (`default.json`) áp dụng cho cửa sổ main.
- [x] Bộ test tự động E2E Connector Sync thành công. trên Fixtures thực tế mà không dùng dữ liệu mô phỏng tự tạo.

### M4 Exit Gate (UTH Auth Security)
- [ ] Isolation quyền WebView `uth-login` hoàn tất trong `capabilities/default.json`.
- [ ] Secret/Token không bao giờ truyền qua React Frontend hay IPC payload (`SEC-005`).
- [ ] Tiến trình rút Session tự động từ WebView hoạt động ổn định.
- [ ] Rust Backend xác minh thành công identity từ phiên đăng nhập.

### M5 Exit Gate (UTH Portal E2E)
- [ ] Đồng bộ Lịch học E2E thành công với UTH Portal thật.
- [ ] Nguồn Lịch thi UTH được xác minh chính thức.
- [ ] Hệ thống vượt qua các kịch bản thử nghiệm Offline, Partial Sync Failure và Restart app.

### M6 Exit Gate (UTH LMS)
- [ ] Tải bài giảng & slide từ `courses.ut.edu.vn` vào thư mục `CampusAssistant/downloads` an toàn.

### M7 Exit Gate (Multi-School Foundation)
- [ ] Manifest Schema v2 và Connector Adapter Interface đạt trạng thái STABLE.
- [ ] Tài liệu hợp đồng kết nối cho HCMUT (Bách Khoa) và HCMUS (KHTN) được ghi nhận đầy đủ.

### M8 Exit Gate (Release Hardening v1.1.0)
- [ ] Quyết định về Persistent Session (Session-only vs OS Secure Vault) được duyệt và kiểm thử bảo mật.
- [ ] Bộ cài đặt production (Installer) và auto-upgrade migration vượt qua toàn bộ audit checklist.
