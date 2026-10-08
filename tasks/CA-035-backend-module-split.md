# CA-035 - Tach backend modules khong doi command

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Tach `src-tauri/src/lib.rs` thanh cac module noi bo nho hon ma khong doi Tauri command, payload frontend hoac hanh vi runtime.

## Ly do

`lib.rs` dang gom DB, path, documents, diagnostics, updates, theme assets va tests. Can chia ranh gioi de de bao tri truoc khi them connector/security logic lon hon.

## Duoc phep lam

- Tao module Rust noi bo.
- Move code co hoc sang module.
- Giu command registration va command names.
- Di chuyen tests gan module neu phu hop.

## Khong duoc lam

- Khong doi command name.
- Khong doi payload.
- Khong doi schema SQLite.
- Khong doi path behavior.
- Khong them connector truong.
- Khong them dependency.
- Khong sua frontend tru khi compiler bat buoc va duoc bao truoc.

## File duoc phep sua

- `src-tauri/src/lib.rs`
- `src-tauri/src/db.rs`
- `src-tauri/src/paths.rs`
- `src-tauri/src/documents.rs`
- `src-tauri/src/diagnostics.rs`
- `src-tauri/src/updates.rs`
- `src-tauri/src/theme_assets.rs`
- `src-tauri/src/models.rs`
- `BACKEND_GUIDELINES.md` neu can cap nhat module map
- `ARCHITECTURE.md`
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `BACKEND_GUIDELINES.md`
- `SECURITY_NOTES.md`
- `DATA_CONTRACTS.md`
- `tasks/CA-035-backend-module-split.md`

## Hanh vi phai giu

- Frontend khong can doi.
- Tat ca Rust tests hien co van pass.
- Path guard va log policy khong doi.
- DB seed idempotent khong doi.

## Tieu chi hoan thanh

- `lib.rs` nho hon va chi dieu phoi command/run.
- Module map ro trong `ARCHITECTURE.md`.
- `npm run check:all` pass.

## Da lam

- Tach DTO/model Rust sang `src-tauri/src/models.rs`.
- Tach load JSON local sang `src-tauri/src/data.rs`.
- Tach luu/xoa background theme asset sang `src-tauri/src/theme_assets.rs`.
- Tach root/path guard/storage path helper sang `src-tauri/src/paths.rs`.
- Tach SQLite schema/settings/action log/seed sang `src-tauri/src/db.rs`.
- Tach storage summary/health report/diagnostic export sang `src-tauri/src/diagnostics.rs`.
- Tach update manifest/version compare sang `src-tauri/src/updates.rs`.
- Tach document/campus data/open/copy file sang `src-tauri/src/documents.rs`.
- Giu nguyen Tauri command name va payload frontend.
- `npm run check:all` da pass sau khi tach.

## Ghi chu con lai ngoai scope

- Test hien van nam trong `lib.rs` de giu scope refactor nho; co the tach test theo module trong task rieng sau.
- `init_app` van o `lib.rs` vi day la bootstrap/orchestration command.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Tach backend thanh models, data, db, paths, diagnostics, updates, documents, theme_assets; command/payload giu nguyen.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


