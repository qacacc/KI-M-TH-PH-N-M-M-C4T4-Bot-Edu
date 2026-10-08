# SYSTEM BLUEPRINT - CAMPUS ASSISTANT LOCAL

## CA-083 - Ranh giới dữ liệu UTH hiện tại (2026-10-09)

uth.rs chỉ còn lỗi CONTRACT_UNVERIFIED; không còn request/parser tự điền dữ liệu trường. Connector auth/sync/cache entry bị gate trước IO; fixture chỉ test. SQLite cũ giữ nguyên, không đưa vào lịch chính thức. Phần kiến trúc cache-only CA-082 bên dưới vẫn là nền tảng UI nhưng đọc UTH hiện bị cách ly. Connector thật cần CA-080/081 và security E2E, không có bypass.

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
│   ├─ JSON Fixtures - Test / tab mẫu có chủ ý, không fallback học tập   │
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
  - CA-082: Chat và trang học tập dùng chung `academicData.ts`; chỉ cache đúng MSSV/source `uth-portal`, không gọi sample commands khi cache rỗng/lỗi. Bootstrap không seed môn/lịch/thông báo mẫu. GPA nhập tay dùng storage v2, không tự phục hồi điểm v1.
- **`TARGET`**: Xác minh API/auth và parser thật qua CA-080/081 trước khi coi connector production-ready.

### 4. Storage Security
- **`CURRENT`**: SQLite unencrypted ở application layer; LocalStorage dùng key `campus-assistant-appearance` cho theme settings và `campus-assistant-custom-presets` cho presets.
- **`TARGET`**: Encrypted OS Secure Vault cho credentials nếu lưu persistent session.
