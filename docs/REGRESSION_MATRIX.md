# REGRESSION MATRIX - CAMPUS ASSISTANT LOCAL

## CA-083 - Xác minh 2026-10-09

- check:all PASS: 62 Vitest, 39 Rust, layout/TypeScript/Vite/cargo check pass, audit 0.
- 2 Rust test mới: fetch/gate không trả hồ sơ auth hay dữ liệu mẫu; sync/prototype/cache commands từ chối contract chưa verified. Source kiểm tra gate trước token/WebView/resolve_roots/DB; không đổi sync_service/schema/cache cũ.
- 1 Vitest mới: thông báo contract riêng, không lộ lỗi nội bộ; chat/page chung helper.
- rg default giờ/thời lượng, prototype loader và unwrap_or_default lịch thi trong uth/engine: 0 kết quả, exit 1 expected.
- Playwright local ca083-check.js PASS 1280/1000: sync disabled, portal button enabled, thông báo rõ, không tràn trang; screenshot 1000 đã xem. Native auth/window/cache IO E2E chưa chạy; không claim kết nối thật.

Ma trận kiểm thử hồi quy quy định duy nhất danh sách các bộ test tự động và kiểm tra thủ công bắt buộc phải chạy tương ứng với từng file hoặc module khi có thay đổi.

---

## CA-082: bằng chứng 2026-10-08

- npm run check:all PASS: 61 Vitest, 37 Rust, layout/TypeScript/Vite pass, audit 0.
- academicData.test.ts: 5 test đúng nguồn/account, empty/error không sample; gpaData.test.ts: 3 test empty/validate/bảo toàn; tauriApi.test.ts: 2 test portal awaited/error.
- Playwright local ca082-check.js và ca082-interactions.js PASS: lịch/thi/GPA/tài liệu/trường, light/dark, 1280/1000, sidebar mở/thu, không tràn trang. Screenshot đã xem trực tiếp, output/playwright không commit.
- Manual native desktop/window controls/portal login/sync thật CHƯA CHẠY. Installer chưa build lại cho source mới.

## Comprehensive Regression Matrix

| File / Module được chỉnh sửa | Executive Contract | Test Status | Executable Command / Test | Manual / E2E Verification |
|---|---|---|---|---|
| `src-tauri/src/db.rs` | DB Initialization & Storage | **`CONFIRMED`** | `cargo test tests::open_db` | Startup app, check DB WAL file |
| `src-tauri/src/db.rs` | DB Schema Version Migration | **`CONFIRMED`** | `cargo test db::tests` | PRAGMA user_version schema migration |
| `src-tauri/src/paths.rs` | Managed Roots & Path Guard | **`CONFIRMED`** | `cargo test paths::tests` | Open file, theme background upload |
| `src-tauri/src/trash.rs` | Physical Trash & Restore | **`CONFIRMED`** | `cargo test trash::tests` | Move to trash, restore, empty trash |
| `src-tauri/src/connectors/sync_service.rs` | Partial Sync Fail-Safe | **`CONFIRMED`** | `cargo test connectors::sync_service` | Schedule & Exam cache retention on error |
| `src-tauri/src/connectors/uth.rs` | UTH Current Parser | **`EXPERIMENTAL`** | `cargo test connectors::uth` | UTH Login WebView, Developer Sync modal |
| `src-tauri/src/connectors/uth.rs` | Verified Portal Fixture Parser| **`PLANNED`** | Tracking Task: `CA-067 + CA-068` | Check fixtures with PII redaction |
| `src-tauri/src/public_search.rs` | Outbound Native PII Sanitizer | **`CONFIRMED`** | `cargo test public_search` | Admissions search in chatbox |
| `src-tauri/capabilities/default.json` + `src-tauri/src/connectors/connector_engine.rs` | Remote WebView Capability Isolation | **`STATIC / PARTIAL`** | `npm run check:all` | Login window uses `uth-login` external WebView + navigation allowlist; still needs manual IPC isolation verification |
| `src-tauri/src/lib.rs` | Command Registry & Health | **`CONFIRMED`** | `cargo test tests::health_report` | Tauri desktop command invoke |
| `src-tauri/Cargo.toml` | Cargo Build & Dependencies | **`CONFIRMED`** | `cargo check` | Cargo compilation & crate audit |
| `src/tauriApi.ts` | React ↔ Rust Payload Contract | **`STATIC / PARTIAL`** | `npm run test` | All IPC frontend calls (Needs IPC contract test) |
| `src/types.ts` | TypeScript Type Coverage | **`CONFIRMED`** | `npx tsc --noEmit` | Typecheck across UI & Engine |
| `src/engine.ts` | Intent Router & Slash Commands| **`CONFIRMED`** | `npm run test -- engine.test.ts` | Chat commands, Admissions, Intent parsing |
| `src/schoolProfile.ts` | Profile Sanitization | **`CONFIRMED`** | `npm run test -- schoolProfile.test.ts` | School dropdown, Profile persistence |
| `src/pages/SchoolPage.tsx` | Connector Modal State | **`CONFIRMED`** | `npm run test` | School select, Developer sync modal |
| `src/pages/CampusDataPages.tsx` | Academic Source Arbitration | **`CONFIRMED`** | `npm run check:all` | Schedule, Exams, Documents, Files tab |
| `src/pages/AppearancePage.tsx` | Theme Preset & Custom Color | **`CONFIRMED`** | `npm run test -- useAppearanceDraft.test.ts` | Apply theme, background image upload |
| `src/hooks/useAppearanceDraft.ts` | Appearance Draft State | **`CONFIRMED`** | `npm run test -- useAppearanceDraft.test.ts` | Undo/Restore theme draft |
| `src/pages/SettingsPage.tsx` | Vault / DPAPI Disclosure | **`CONFIRMED`** | `npm run check:all` | UI must say DPAPI is planned/session-only, not active |
| `src/pages/SettingsPage.tsx` | Backup Import / Data Clear | **`KNOWN_GAP`** | Tracking Task: `CA-063B` | Backup import from clipboard, key mismatch fix |
| `src/utils/backupRestore.ts` | Backup Utility Algorithm | **`CONFIRMED`** | `npm run test -- backupRestore.test.ts` | Export JSON, Import valid/invalid JSON |
| `src/utils/calendarExporter.ts` | Calendar `.ics` Generator | **`CONFIRMED`** | `npm run test -- calendarExporter.test.ts` | Export `.ics` from Schedule & Exam pages |
| `src/components/GpaCalculator.tsx` | Local GPA/CPA Calculator | **`CONFIRMED`** | `npm run check:all` | Change grade inputs, verify GPA result |
| `src/App.tsx` | App Navigation Routing Integration | **`CONFIRMED`** | `npm run check:all` | Global layout, Sidebar navigation E2E |
| `package.json` | Project Dependencies | **`CONFIRMED`** | `npm run check:all` | Vite build, Vitest run, TypeCheck |

---

## Canonical Pre-Commit Command Gate

Trước khi hoàn tất bất kỳ task nào, AI bắt buộc phải chạy lệnh kiểm tra tổng thể dự án và xác nhận **PASS 100%**:

```bash
npm run check:all
```
