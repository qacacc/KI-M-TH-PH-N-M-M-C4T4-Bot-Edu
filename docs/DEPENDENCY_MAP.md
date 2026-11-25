# DEPENDENCY MAP - CAMPUS ASSISTANT LOCAL

**CURRENT:** `src/pages/NotesPage.tsx` → `src/tauriApi.ts` Tauri IPC → các command ở `src-tauri/src/lib.rs` → SQLite `student_notes` v6 trong `src-tauri/src/db.rs`. Import dùng transaction; giao diện xác nhận trước khi xóa. Postman không áp dụng cho IPC. Ngày của lịch cũ vẫn chưa xác minh.

**CONFIRMED (source/tests):** CA-098.01 Tauri startup calls best-effort `api::start()`; missing/invalid token or thread/runtime/bind failure leaves desktop running. Startup log ignores stderr errors. Two instances contend for `127.0.0.1:47821`; first listener stays active and second continues desktop-only. Bearer middleware protects routes; query validation precedes data/connector services; token comparison uses `subtle::ConstantTimeEq`. Postman local Collection uses HTTP loopback with Environment `BASE_URL`/secret `API_TOKEN`, checked by `tools/check-local-postman.cjs`.

**UNKNOWN:** UTH upstream API/auth/schema; the local collection is not evidence for it. Manual Windows/Postman HTTP smoke is not verified by automated tests.

**CONFIRMED (scripts):** CA-080 collection JSON + scripts -> `tools/sync-postman.cjs` -> YAML mirrors; `tools/check-postman.cjs` runs synthetic checks and drift checks; `npm run check:all` includes `check:postman`. No new React/Rust/SQLite runtime dependency is introduced by these scripts. **PLANNED:** Verified UTH contract remains a prerequisite for CA-081.

CA-083 (2026-10-09): mọi entry UTH auth/sync/đọc lịch -> ensure_uth_contract_verified -> Err trước IO. academicDataErrorMessage -> chat/useAcademicCache trả thông báo an toàn. Prototype command giữ tên/payload để tương thích nhưng không ghi DB. Dependencies HTTP/parser UTH đã gỡ; portal browser và SQLite/cache management không đổi.

GPA CURRENT (PR #26 remediation): `CampusDataPages.GpaPage` → `GpaCalculator` → `gpaData` → localStorage v2/v1. `openExternalUrl` chỉ mở Portal trong trình duyệt; không có phụ thuộc IPC bảng điểm. `calculatePortalGpaStats` chỉ là hàm thuần được test bằng dữ liệu tổng hợp, không phải nguồn runtime. CA-080/081/088 là điều kiện cho dữ liệu chính thức.

**CONFIRMED (migration v6 source/tests):** `open_db`/`open_db_schema_only` → `ensure_db_schema` → SQLite `connector_schedules`/`connector_schedule_weeks`/`connector_transcripts`/`student_notes`. `class_date` trống của lịch cũ là ngày chưa xác định; không phụ thuộc `fetched_at` để suy lịch. Test DB temp: `cargo test --manifest-path src-tauri/Cargo.toml db::tests`. Portal contract và native upgrade vẫn `UNKNOWN`; Postman N/A cho migration nội bộ.

Tài liệu bản đồ phụ thuộc giữa các module, component, API, capability và file cấu hình trong hệ thống. 

> ⚠️ **LƯU Ý:** Để xem danh sách các bộ test tự động và kịch bản kiểm thử bắt buộc tương ứng với từng file, hãy xem duy nhất tại **[`docs/REGRESSION_MATRIX.md`](REGRESSION_MATRIX.md)**.

---

## 1. Module & Call Architecture

```
SchoolPage.tsx (School Selector & Connector UI)
   │
   ├──> schoolProfile.ts (readSchoolProfile / saveSchoolProfile)
   └──> tauriApi.ts
           │
           ├──> openUthLoginWindow ────> Rust: connector_engine.rs (WebView Window)
           ├──> syncUthAfterLogin ─────> Rust: uth.rs (fetch_uth_schedule / fetch_uth_exams)
           │                                 │
           │                                 ▼
           │                           SyncService (sync_schedules_transaction)
           │                                 │
           │                                 ▼
           │                           SQLite: connector_schedules / connector_exams
           │
           └──> getConnectorSyncStatus -> SQLite: connector_sync_status


CampusDataPages.tsx / App.tsx (Schedule, Exams)
   │
   ├──> academicData.ts -> tauriApi.ts -> SQLite cache đúng account/source
   └──> useAcademicCache.ts -> schoolProfile / academicEvents (reload, cleanup)

GpaCalculator.tsx -> gpaData.ts -> LocalStorage manual_v2 (hàng chưa chấm để trống; parser chỉ nhận grade là own key trong allowlist; F/0 thật vẫn tính)
`FilesPage.tsx` -> LMS UTH commands trong `tauriApi.ts` -> `connectors/lms.rs` -> SQLite `lms_courses`/`lms_documents` -> sự kiện `lms-snapshot-updated` -> nhóm học liệu theo môn. WebView `lms-login` chỉ được cấp command `receive_lms_snapshot`; tải file bị giới hạn `courses.ut.edu.vn` và managed Downloads. Các LMS trường khác hiện chỉ mở website ngoài.


AppearancePage.tsx (Theme Presets & Custom Styling)
   │
   ├──> useAppearanceDraft.ts (Draft State Management)
   ├──> presetStore.ts (Predefined Presets)
   └──> tauriApi.ts (saveThemeBackground / deleteThemeBackground)
           │
           ▼
        Rust: paths.rs (AppLocalData/themes) + CSS Variables on :root


Chatbox Engine (App.tsx + engine.ts)
   │
   ├──> engine.ts (detectIntent, normalizeVietnamese, stripPiiFromPublicQuery)
   ├──> chatSchoolIntegration.ts (handleSchoolChatQuery)
   ├──> publicSearchMessage.ts (formatPublicSearchResponse, shouldOfferPublicSearchRetry - CA-093.01)
   └──> public_search.rs (searchPublicSchoolInfo)
```

---

## 2. Component Modification Impact Radii

Khi chỉnh sửa một module trong cột bên trái, các module thuộc cùng hàng có nguy cơ bị tác động và cần được kiểm thử hồi quy:

| Module / File bị chỉnh sửa | Các Component / Service bị ảnh hưởng trực tiếp |
|---|---|
| `src-tauri/src/db.rs` | `SchoolPage`, `CampusDataPages`, `HealthReport`, Application Startup |
| `src-tauri/src/paths.rs` | Open File, Copy File, Theme Backgrounds, Trash System |
| `src-tauri/src/trash.rs` | Files Tab, Trash Tab, Physical Managed Filesystem |
| `src-tauri/src/connectors/sync_service.rs` | `SchedulePage`, `ExamsPage`, `SchoolPage`, SQLite Cache Integrity |
| `src-tauri/src/connectors/uth.rs` | UTH Connector Modal, `SchedulePage`, `ExamsPage` |
| `src-tauri/src/public_search.rs` | Chat Admissions Queries, Outbound Web Scraper, `src/publicSearchMessage.ts` (contract `status`/`failedUrls`/`timedOut`) |
| `src-tauri/capabilities/default.json` | Tauri Window IPC Permissions, Main vs Remote WebView Isolation |
| `src-tauri/src/lib.rs` | Tauri Command Registry, Health Diagnostics, App Lifecycle |
| `src/tauriApi.ts` | Toàn bộ Frontend UI (Mọi lệnh IPC giữa React và Rust) |
| `src/types.ts` | Type Coverage trên toàn bộ mã nguồn React Frontend |
| `src/engine.ts` | Chatbox, Intent Router, Slash Command Parsing |
| `src/schoolProfile.ts` | `SchoolPage`, Admissions Scraper Header, Local Storage Profile |
| `src/hooks/useAppearanceDraft.ts` | `AppearancePage`, Theme Presets, Undo/Restore State |
| `src/App.tsx` | App Layout, Sidebar Navigation, Chat Handler, Global Modals |
