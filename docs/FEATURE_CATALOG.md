# FEATURE CATALOG - CAMPUS ASSISTANT LOCAL

Tài liệu quản lý danh mục tính năng toàn bộ ứng dụng, ghi nhận đúng sự thật hiện tại (`CURRENT`) và mục tiêu (`TARGET`), kèm bằng chứng kiểm thử (`Evidence`), khe hở kỹ thuật (`Known Gaps`) và mã task theo dõi (`Tracking Task`).

## Audit override - 2026-10-09

Các nhãn None/STABLE/E2E lịch sử bên dưới không vượt [audit source hiện tại](SOURCE_AUDIT_2026-10-09.md). Không có nghiệm thu native/API/visual mới trong audit.

| Feature | Known gap CURRENT / tracking |
| --- | --- |
| APP_BOOTSTRAP | Lifecycle StrictMode/degraded cần CA-086 |
| CHAT_HISTORY_LOCAL | Session/atomic append/CRUD error/archive accessibility cần CA-087 |
| GPA_CALCULATOR | Recovery, draft F0 và persistence cần CA-088 |
| SCHOOL_SETTINGS | Public mock/capability wording không đúng nguồn, CA-089 |
| BACKUP_RESET | Active keys bị bỏ, reset phạm vi sai/fault handling, CA-090 |
| PHYSICAL_TRASH / FILE_MANAGEMENT_AND_TRASH | Recovery và localStorage fallback sai owner, CA-091; không STABLE toàn diện |
| CALENDAR_EXPORT | Timezone và recurrence chưa đúng, CA-092 |
| PUBLIC_ADMISSIONS_SEARCH | Error thành empty/budget/parser cần CA-093; không STABLE toàn diện |
| DESKTOP_SECURITY | CSP/capabilities/legacy gated bridge/managed assets cần CA-094; không exploit confirmed |
| THEME_AND_APPEARANCE | Silent save/two preset stores/shared asset cần CA-095 |
| CORE_MAINTAINABILITY | Format/clippy fail và test helper/static gaps, CA-096 |
| GOVERNANCE | Roadmap/duplicate ID/old evidence reconciliation, CA-097 |
| RELEASE | Checklist static/samples-required/installer mới, CA-084 |

Đây là tracking PLANNED, không phải các fix đã triển khai. CA-080/081 vẫn Proposed; UTH auth/sync/read vẫn quarantined. CA-064/085 vẫn Frozen.

---

## FEATURE: SCHOOL_SYNC_UTH
- **Status**: Disabled / Contract unverified (CA-083, 2026-10-09)
- **Owner**: School Connector Engine
- **Evidence**:
  - Source: `src/pages/SchoolPage.tsx`, `src-tauri/src/connectors/uth.rs`, `src-tauri/src/connectors/connector_engine.rs`
  - Last Verified: 2026-07-28
  - Verification Artifact: Vitest / Cargo test output
  - Verification Scope: AUTOMATED (E2E Auth Bridge: NOT VERIFIED)
- **Known Gaps & Tracking**:
  - CA-083: tất cả auth/sync entry native đã gate; parser HTTP suy đoán bị gỡ, command nạp mẫu ngừng ghi. Những gaps baseline bên dưới là việc cần giải quyết khi triển khai connector verified, không phải đường đang được bật.
  - Auth bridge có implementation thử nghiệm nhưng chưa E2E verified; browser ngoài không truyền session vào app | CA-080.
  - Legacy IPC nhận JWT vẫn tồn tại, không coi mọi entry đã backend-owned | CA-080/081.
  - Lịch thi derive từ lịch tháng; parser còn default nghiệp vụ và nuốt lỗi thành empty | CA-081.
  - Sync chưa phân biệt đầy đủ lỗi miền và empty hợp lệ | CA-081.

---

## FEATURE: ACADEMIC_SCHEDULE_AND_EXAMS
- **Status**: UI implemented / UTH data quarantined (CA-083)
- **Owner**: Academic Data Manager
- **Evidence**:
  - Source: `src/pages/CampusDataPages.tsx`, `src/academicData.ts`, `src/hooks/useAcademicCache.ts`, `src-tauri/src/lib.rs`
  - Last Verified: 2026-10-08 (CA-082)
  - Verification Scope: AUTOMATED (`npm run check:all` PASS)
- **Known Gaps & Tracking**:
  - Native đọc cache UTH bị gate vì dữ liệu cũ chưa verified; UI/chat thông báo an toàn, không fallback mẫu. CA-080/081 cần contract/fixture thật trước bật dữ liệu; không phải STABLE end-to-end.
  - Thông báo/tài liệu trường chưa đồng bộ; tab tài liệu mẫu tách riêng. GPA nhập tay trống mặc định, quy đổi tham khảo, không phải bảng điểm trường đã xác thực.

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
