# Architecture

## Tong quan

Campus Assistant Local la ung dung desktop local-first.

- Frontend: React + TypeScript + Vite.
- Desktop shell: Tauri 2.
- Backend: Rust command trong `src-tauri/src/lib.rs`.
- Database: SQLite local.
- Data mau: JSON dong goi trong `src-tauri/data`.
- UI icons: `lucide-react`.
- Test: Vitest cho TypeScript, Cargo test cho Rust.

Khong co AI API, RAG, embedding, server ngoai, connector truong that hoac Zalo production trong ban `1.0.1`.

## Source map

```text
src/
├─ App.tsx
├─ appearanceOptions.ts
├─ engine.ts
├─ tauriApi.ts
├─ types.ts
├─ styles.css
├─ components/
├─ hooks/
├─ pages/
└─ utils/

src-tauri/
├─ src/lib.rs
├─ src/models.rs
├─ src/data.rs
├─ src/db.rs
├─ src/paths.rs
├─ src/diagnostics.rs
├─ src/updates.rs
├─ src/documents.rs
├─ src/theme_assets.rs
├─ src/main.rs
├─ data/
├─ capabilities/
├─ Cargo.toml
└─ Cargo.lock
```

Artifact khong tinh la source:

- `node_modules/`
- `dist/`
- `src-tauri/target/`
- `CampusAssistantLocal-Dev.exe`
- `CampusAssistantLocal-Dev.pdb`
- `dev-launcher.log`

## Frontend boundaries

### `src/App.tsx`

Vai tro hien tai:

- Bootstrap app.
- Dieu phoi view.
- Dieu phoi chat flow.
- Goi Tauri API.
- Noi cac page/hook/shared component.
- Quan ly titlebar, sidebar, content, utility panel va customize panel.

Huong cai thien:

- Khong them logic moi lon vao `App.tsx` neu co the tach hook/component/page.
- Tach chat flow ra module rieng khi co task rieng.
- Khong refactor App.tsx trong task UI nho neu khong bat buoc.

### `src/engine.ts`

Logic thuan:

- Normalize tieng Viet.
- Detect intent local.
- Parse slash command.
- Parse confirmation/back/cancel.
- Parse file action.
- Tao minimal conversation state.

Quy tac:

- Moi thay doi intent phai co Vitest.
- Khong goi Tauri, DOM, storage hoac network trong file nay.

### `src/tauriApi.ts`

Bridge IPC:

- Gom wrapper cho command Tauri.
- La noi duy nhat frontend goi `invoke`.

Quy tac:

- Neu doi command name/payload phai cap nhat `types.ts`, Rust command, test va task phai cho phep.
- Khong xu ly business logic lon tai day.

### `src/types.ts`

Data contract frontend.

Quy tac:

- Neu doi type co lien quan Rust payload/JSON/SQLite, phai cap nhat `DATA_CONTRACTS.md`.

### `src/hooks`

- `useLayoutState.ts`: width/collapse panel, localStorage.
- `useAppearanceDraft.ts`: theme draft/apply/discard/reset, color guard, appearance storage.

Quy tac:

- Hook phai co unit test khi them logic.
- Khong goi Tauri command trong hook neu khong co task ro rang.

### `src/pages`

Moi page chi nen render mot domain:

- Appearance
- Announcements/Schedule/Exams
- Files
- Health
- Logs
- Privacy
- Release
- Storage

Quy tac:

- Page khong nen biet chi tiet DB/path/backend.
- Data dua vao page qua props hoac function handler tu App.

### `src/styles.css`

CSS hien la file lon nhat ve UI.

Quy tac:

- Task UI phai ghi ro selector/khu vuc duoc sua.
- Khong sua toan cuc `button`, `.content`, `.app-shell`, `.sidebar` neu task khong cho phep.
- Sau khi sua layout phai kiem tra desktop width lon, medium va nho.

## Backend boundaries

### `src-tauri/src/lib.rs`

Vai tro hien tai:

- Bootstrap `init_app`.
- Dang ky Tauri commands trong `run`.
- Giu test backend tong hop hien co.

Module backend:

- `models.rs`: DTO/record/response type cho command va JSON contract.
- `data.rs`: load JSON local dong goi bang `include_str!`.
- `db.rs`: SQLite schema, settings, action log, seed tai lieu mau.
- `paths.rs`: root, directory, path guard, storage stats va mo downloads.
- `diagnostics.rs`: storage summary, health report, diagnostic export.
- `updates.rs`: update manifest va version compare.
- `documents.rs`: list data mau, open/copy document an toan.
- `theme_assets.rs`: validate/luu/xoa anh nen theme app-managed.
- Tauri command registration.
- Rust tests.

Huong cai thien sau nay:

```text
src-tauri/src/
├─ lib.rs
├─ db.rs
├─ paths.rs
├─ documents.rs
├─ diagnostics.rs
├─ updates.rs
├─ theme_assets.rs
└─ models.rs
```

Quy tac:

- Tach module chi duoc lam khi co task rieng.
- Ten Tauri command va payload frontend phai giu nguyen tru khi task cho phep doi.
- Test backend phai dung temp root.

## Data boundaries

`src-tauri/data/*.json` la data mau local:

- `subjects.json`
- `documents.json`
- `announcements.json`
- `schedule.json`
- `exams.json`

Quy tac:

- Khong goi portal truong that trong ban 1.0.1.
- Moi data that cua user phai co threat model rieng.

## Security boundaries

- File action chi trong `Documents/CampusAssistant`.
- Path phai canonicalize va check base.
- Log chi metadata.
- Diagnostic export khong chua raw chat/file content/credential.
- Update check chi doc manifest neu duoc cau hinh, khong gui du lieu user.

## Testing baseline

Mac dinh dung:

```powershell
npm run check:all
```

Lenh nay gom:

- Vitest.
- TypeScript build.
- Vite build.
- Cargo check.
- Cargo test.
- npm audit.
