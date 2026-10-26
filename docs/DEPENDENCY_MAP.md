# DEPENDENCY MAP - CAMPUS ASSISTANT LOCAL

CA-098.01: Tauri startup -> best-effort `api::start()` reads `CAMPUS_ASSISTANT_LOCAL_API_TOKEN`; missing/invalid token or thread/runtime/bind failure leaves the desktop app running. Startup log writes ignore stderr errors and cannot panic the desktop process. Two instances contend for loopback `127.0.0.1:47821`; the first listener stays active and the second continues desktop-only with a generic port-conflict message. With a valid token, Bearer middleware protects routes -> query validation -> existing Rust data/connector services -> SQLite or generic error envelope. Token comparison uses `subtle::ConstantTimeEq`. Postman local Collection -> HTTP loopback using Environment `BASE_URL`/local secret `API_TOKEN` -> `tools/check-local-postman.cjs`; Collection UTH remains a separate upstream contract probe.

CA-080 setup (2026-10-10): collection JSON + postman/scripts -> tools/sync-postman.cjs -> JSON events/YAML mirrors; tools/check-postman.cjs -> Node VM synthetic và drift check; npm check:all -> check:postman. Postman Local Vault chỉ dùng trong Desktop được user cấp quyền, không có dependency runtime React/Rust/SQLite mới. Contract verified vẫn là dependency bắt buộc của CA-081.

CA-083 (2026-10-09): mọi entry UTH auth/sync/đọc lịch -> ensure_uth_contract_verified -> Err trước IO. academicDataErrorMessage -> chat/useAcademicCache trả thông báo an toàn. Prototype command giữ tên/payload để tương thích nhưng không ghi DB. Dependencies HTTP/parser UTH đã gỡ; portal browser và SQLite/cache management không đổi.

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

GpaCalculator.tsx -> gpaData.ts -> LocalStorage manual_v2 (trống mặc định)
FilesPage.tsx -> tài liệu trường chưa đồng bộ / tab mẫu opt-in / file service


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
| `src-tauri/src/public_search.rs` | Chat Admissions Queries, Outbound Web Scraper |
| `src-tauri/capabilities/default.json` | Tauri Window IPC Permissions, Main vs Remote WebView Isolation |
| `src-tauri/src/lib.rs` | Tauri Command Registry, Health Diagnostics, App Lifecycle |
| `src/tauriApi.ts` | Toàn bộ Frontend UI (Mọi lệnh IPC giữa React và Rust) |
| `src/types.ts` | Type Coverage trên toàn bộ mã nguồn React Frontend |
| `src/engine.ts` | Chatbox, Intent Router, Slash Command Parsing |
| `src/schoolProfile.ts` | `SchoolPage`, Admissions Scraper Header, Local Storage Profile |
| `src/hooks/useAppearanceDraft.ts` | `AppearancePage`, Theme Presets, Undo/Restore State |
| `src/App.tsx` | App Layout, Sidebar Navigation, Chat Handler, Global Modals |
