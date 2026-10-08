# DEPENDENCY MAP - CAMPUS ASSISTANT LOCAL

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


CampusDataPages.tsx (Schedule, Exams, Documents, Files, Storage, Health Tabs)
   │
   ├──> tauriApi.ts (getConnectorSyncStatus, listTrashItems, moveFileToTrash)
   └──> SQLite / Sample JSON Loaders


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
