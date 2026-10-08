# FEATURE CATALOG - CAMPUS ASSISTANT LOCAL

Tài liệu quản lý danh mục tính năng toàn bộ ứng dụng, ghi nhận đúng sự thật hiện tại (`CURRENT`) và mục tiêu (`TARGET`), kèm bằng chứng kiểm thử (`Evidence`), khe hở kỹ thuật (`Known Gaps`) và mã task theo dõi (`Tracking Task`).

---

## FEATURE: SCHOOL_SYNC_UTH
- **Status**: Experimental
- **Owner**: School Connector Engine
- **Evidence**:
  - Source: `src/pages/SchoolPage.tsx`, `src-tauri/src/connectors/uth.rs`, `src-tauri/src/connectors/connector_engine.rs`
  - Last Verified: 2026-07-28
  - Verification Artifact: Vitest / Cargo test output
  - Verification Scope: AUTOMATED (E2E Auth Bridge: NOT VERIFIED)
- **Known Gaps & Tracking**:
  - `Automatic Session Extraction`: **`NOT_IMPLEMENTED`** | Tracking Task: **`CA-070`**
  - `IPC Contract JWT Parameter`: React vẫn truyền parameter `jwtToken` (hiện truyền `""`) | Tracking Task: **`CA-070`**
  - `Exam Source Derivation`: Lịch thi hiện lọc từ monthly schedule endpoint | Tracking Task: **`CA-073`**
  - `Transaction Cache Deletion`: Fail-safe chưa giữ cache cũ khi đồng bộ 1 phần bị lỗi | Tracking Task: **`CA-060`**

---

## FEATURE: ACADEMIC_SCHEDULE_AND_EXAMS
- **Status**: Implemented
- **Owner**: Academic Data Manager
- **Evidence**:
  - Source: `src/pages/CampusDataPages.tsx`, `src-tauri/src/lib.rs`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (Source Arbitration rule ENFORCED: SQLite connector cache takes precedence over sample JSON)

---

## FEATURE: PHYSICAL_TRASH
- **Status**: Implemented
- **Owner**: Local File Service (`trash.rs`)
- **Evidence**:
  - Source: `src-tauri/src/trash.rs`, `src/pages/FilesPage.tsx`
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED (`cargo test trash::tests` PASS) + STATIC UI SOURCE CHECK
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (UI truyền `document.localPath` vào `moveFileToTrash`, có confirm trước khi move/empty)

---

## FEATURE: FILE_MANAGEMENT_AND_TRASH
- **Status**: Implemented
- **Owner**: Storage & File Service
- **Evidence**:
  - Source: `src-tauri/src/trash.rs`, `src/tauriApi.ts`, `src/pages/FilesPage.tsx`
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED + STATIC UI SOURCE CHECK
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (FilesPage gọi `moveFileToTrash(document.localPath)`, `restoreTrashItem`, `emptyTrashBin`)

---

## FEATURE: THEME_AND_APPEARANCE
- **Status**: Implemented
- **Owner**: Theme Service
- **Evidence**:
  - Source: `src/pages/AppearancePage.tsx`, `src/hooks/useAppearanceDraft.ts`
  - Storage Keys: `campus-assistant-appearance` (Active Theme), `campus-assistant-custom-presets` (Presets)
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED + MANUAL E2E
- **Known Gaps & Tracking**:
  - Legacy storage key references cleanup | Decision: **`DEFERRED`**

---

## FEATURE: CHAT_INTENT_ENGINE
- **Status**: Implemented / Rule-based
- **Owner**: Engine Module (`engine.ts`)
- **Evidence**:
  - Source: `src/engine.ts`, `src/App.tsx`
  - Last Verified: 2026-08-02
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (`submitUserMessage` là entry thống nhất cho nút Gửi/Enter/chip/starter/command suggestion; `NEEDS_SUBJECT` prevents fallback to `subjects[0]`; unknown/random chat does not get forced into business intent)
  - AI chat tổng quát / BYOK model provider: **`PLANNED / DEFERRED`**

---

## FEATURE: CHAT_HISTORY_LOCAL
- **Status**: Implemented / Opt-in
- **Owner**: Chat History (`ChatHistoryPage.tsx`, Rust DB)
- **Evidence**:
  - Source: `src/pages/ChatHistoryPage.tsx`, `src/App.tsx`, `src-tauri/src/db.rs`, `src-tauri/src/lib.rs`
  - Last Verified: 2026-08-02
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - Archive backend/state exists (`archived = true`) and main list filters archived sessions.
  - Archive management UI / restore archived session UI: **`NOT_IMPLEMENTED`**
  - Persistence error visibility: **`IMPLEMENTED`** (`warning-box` in UI, safe console warning, no raw chat in error log)

---

## FEATURE: PUBLIC_ADMISSIONS_SEARCH
- **Status**: Implemented
- **Owner**: Public Search Scraper (`public_search.rs`)
- **Evidence**:
  - Source: `src-tauri/src/public_search.rs`, `src/App.tsx`
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED (`cargo test public_search` PASS)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (Outbound native PII enforcement: Rust filters numeric student IDs and emails before public HTTP request)

---

## FEATURE: QUICK_SEARCH_MODAL
- **Status**: Removed
- **Owner**: UI Components
- **Evidence**:
  - Removed: `src/components/QuickSearchModal.tsx`
  - Last Verified: 2026-07-28
  - Verification Scope: STATIC (`rg QuickSearchModal` returned no source references before deletion)
- **Known Gaps & Tracking**:
  - None | Decision: **`REMOVED_AS_DEAD_CODE`**

---

## FEATURE: GPA_CALCULATOR
- **Status**: Implemented
- **Owner**: Academic Utility Components
- **Evidence**:
  - Source: `src/components/GpaCalculator.tsx`, `src/App.tsx`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - Persistence to SQLite for custom semester grades | Decision: **`DEFERRED`**

---

## FEATURE: BACKUP_RESTORE
- **Status**: Core Utility IMPLEMENTED | Settings Integration: PARTIAL
- **Owner**: Data Utility Modules
- **Evidence**:
  - Source: `src/utils/backupRestore.ts`, `src/pages/SettingsPage.tsx`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`npm run test -- backupRestore.test.ts`)
- **Known Gaps & Tracking**:
  - `Settings Key Mismatch`: Settings Clipboard import dùng `CampusAssistantLocal` khác với backup key `campus-assistant-backup` | Tracking Task: **`CA-063B`**
  - `Schema Versioning`: Chống xung đột schema giữa các phiên bản backup | Tracking Task: **`CA-063A`**

---

## FEATURE: DOCUMENT_SEARCH
- **Status**: Implemented
- **Owner**: Engine & File Service
- **Evidence**:
  - Source: `src/engine.ts`, `src/App.tsx`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`**

---

## FEATURE: DOCUMENT_OPEN_COPY
- **Status**: Implemented
- **Owner**: File Action Service
- **Evidence**:
  - Source: `src-tauri/src/documents.rs`, `src-tauri/src/paths.rs`, `src/tauriApi.ts`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED
- **Known Gaps & Tracking**:
  - Managed roots enforcement verified | Status: **`STABLE`**

---

## FEATURE: CALENDAR_EXPORT
- **Status**: Implemented
- **Owner**: Export Utility Modules
- **Evidence**:
  - Source: `src/utils/calendarExporter.ts`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`npm run test -- calendarExporter.test.ts`)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`**

---

## FEATURE: APP_NAVIGATION
- **Status**: Implemented
- **Owner**: Layout Engine (`useLayoutState.ts`)
- **Evidence**:
  - Source: `src/hooks/useLayoutState.ts`, `src/App.tsx`
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`**

---

## FEATURE: SETTINGS
- **Status**: Implemented with planned vault disclosure
- **Owner**: Settings View (`SettingsPage.tsx`)
- **Evidence**:
  - Source: `src/pages/SettingsPage.tsx`
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`** (`SettingsPage.tsx` hiện ghi rõ `Local Storage (DPAPI: Planned)`, không claim DPAPI Active)

---

## FEATURE: STORAGE_HEALTH
- **Status**: Implemented
- **Owner**: Diagnostic Service
- **Evidence**:
  - Source: `src-tauri/src/lib.rs` (`get_health_report`)
  - Last Verified: 2026-07-27
  - Verification Scope: AUTOMATED (`cargo test tests::health_report_contains_core_checks`)
- **Known Gaps & Tracking**:
  - None | Status: **`STABLE`**

---

## FEATURE: UPDATE_RELEASE
- **Status**: Manifest check implemented | Auto install planned
- **Owner**: Release Engineering
- **Evidence**:
  - Source: `src-tauri/src/updates.rs` (`check_for_update`)
  - Last Verified: 2026-07-28
  - Verification Scope: AUTOMATED (`version_compare_detects_newer_manifest`)
- **Known Gaps & Tracking**:
  - Auto-update download/install, update server & signing keys | Tracking Task: **`CA-084`**
