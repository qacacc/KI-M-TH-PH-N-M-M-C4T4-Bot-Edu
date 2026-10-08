# SYSTEM BLUEPRINT - CAMPUS ASSISTANT LOCAL

## Overview
Campus Assistant Local là ứng dụng desktop hỗ trợ sinh viên quản lý lịch học, lịch thi, tài liệu và tra cứu thông tin với triết lý **Local-First** và **Privacy-Preserving**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              React UI                                  │
│                 ┌───────────────────────┴──────────────────────┐        │
│                 │                                              │        │
│             Chatbox UI                                     Pages UI     │
│                 │                             (School, Appearance, Data)│
│                 ▼                                              │        │
│        Local Intent Router                                     │        │
│      (engine.ts: detectIntent)                                 │        │
│                 │                                              │        │
│                 └───────────────────────┬──────────────────────┘        │
└─────────────────────────────────────────┼──────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         tauriApi IPC Bridge                            │
│   (Type-safe wrappers over Tauri IPC; Rejects commands in Web Browser)  │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Rust Native Services                          │
│   ├─ File Service (`paths.rs`, `trash.rs`)                             │
│   ├─ Sync Service (`sync_service.rs`)                                  │
│   ├─ School Connector (`uth.rs`, `connector_engine.rs`)                │
│   └─ Public Search Scraper (`public_search.rs`)                        │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            Storage Layer                               │
│   ├─ SQLite (`campus-assistant.db`) - Connector Schedules & Exams      │
│   ├─ JSON Fixtures (`data/*.json`, `sample-documents`) - Sample Fallback│
│   └─ LocalStorage (`campus-assistant-appearance`) - UI Config Only     │
└────────────────────────────────────────────────────────────────────────┘
```

## Layer Architecture & Runtime Truth (`CURRENT` vs `TARGET`)

### 1. Presentation & Routing Layer
- **`CURRENT`**: 
  - Chatbox truyền query qua `engine.ts` (`detectIntent`).
  - Các trang chức năng như `SchoolPage.tsx`, `AppearancePage.tsx`, `CampusDataPages.tsx` gọi trực tiếp `tauriApi.ts` mà KHÔNG đi qua `engine.ts`.
- **`TARGET`**: Thống nhất Registry View và Navigation State Manager duy nhất.

### 2. tauriApi IPC Bridge Mode
- **`CURRENT`**:
  - Khi chạy trong môi trường Web Browser (không có `window.__TAURI_INTERNALS__`), `tauriApi.ts` **trả về `Promise.reject("Tauri IPC is not available in browser mode")`** cho đa số native IPC command, ngoại trừ các fallback dữ liệu mẫu tĩnh ở tầng UI.
- **`TARGET`**: Mock IPC provider hoàn chỉnh cho Web Preview mode.

### 3. Academic Data Persistence Dual-Store
- **`CURRENT`**:
  - `list_schedule()` & `list_exams()` đọc dữ liệu mẫu từ **JSON Fixtures** (`src-tauri/data/schedule.json`).
  - `list_connector_schedules()` & `list_connector_exams()` đọc dữ liệu từ **SQLite Database** (`campus-assistant.db`).
  - Phía UI (`CampusDataPages.tsx`) gọi connector cache và JSON/sample song song, sau đó ưu tiên SQLite connector cache trước. Nếu connector cache trống, UI mới fallback về prop sample JSON hoặc dữ liệu mẫu local.
- **`TARGET`**: Unified `AcademicDataService` gom logic source arbitration vào một service duy nhất thay vì để page tự quyết định.

### 4. Storage Security
- **`CURRENT`**: SQLite unencrypted ở application layer; LocalStorage dùng key `campus-assistant-appearance` cho theme settings và `campus-assistant-custom-presets` cho presets.
- **`TARGET`**: Encrypted OS Secure Vault cho credentials nếu lưu persistent session.
