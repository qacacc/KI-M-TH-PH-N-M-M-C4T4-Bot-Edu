# CA-055 - Full function audit, docs cleanup, dead file cleanup

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Kiem tra baseline chuc nang hien tai, them regression cho cau chat random ngoai du lieu, dong bo docs voi source that va xoa file artifact/dead code khong duoc tham chieu.

## Duoc phep lam

- Chay `npm run check:all` truoc va sau thay doi.
- Them test intent/fallback cho cau hoi random ngoai du lieu.
- Cap nhat docs trong `docs/`, `PROJECT_TASKS.md`, `tasks/TASK_INDEX.md`.
- Xoa artifact/log/debug file khong duoc source tham chieu.
- Xoa component dead code neu da xac minh khong import.
- Sua loi chuc nang nho co bang chung trong qua trinh audit neu khong doi contract backend/frontend.

## Khong duoc lam

- Khong doi UX/UI runtime ngoai pham vi cleanup.
- Khong them dependency.
- Khong doi schema SQLite.
- Khong code SSO/cookie vault moi trong task nay.
- Khong xoa `node_modules`, `src-tauri/target`, `dist` hoac installer bundle trong task nay.

## File duoc phep sua

- `src/engine.test.ts`
- `src/pages/FilesPage.tsx`
- `src/schoolConnector/chatSchoolIntegration.ts`
- `docs/FEATURE_CATALOG.md`
- `docs/FLOW_MAP.md`
- `docs/DATA_FLOW.md`
- `docs/INVARIANTS.md`
- `docs/REGRESSION_MATRIX.md`
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `tasks/CA-055-full-function-audit-doc-cleanup.md`
- Artifact/dead files duoc xac minh bang `rg`

## Hanh vi phai giu

- Chat unknown khong duoc suy doan intent.
- Local-first invariant khong doi.
- Public search va connector truong khong duoc truyen secret qua React.
- `npm run check:all` phai pass.

## Tieu chi hoan thanh

- Baseline check ban dau pass.
- Co test cho mot cau chat random khong co trong du lieu va ket qua la `UNKNOWN`.
- Docs khong con noi `Intent Shadowing` la bug hien tai.
- Docs khong con noi UI thung rac chua gan nut neu source da gan.
- Docs khong con chi vao file da xoa.
- Artifact/dead files duoc xoa co bang chung khong tham chieu.
- `npm run check:all` pass sau cung.

## Moc duoc phep bao xong va moi user test

- Phai co bang chung file da xoa khong duoc `rg` tham chieu.
- Phai co `npm run check:all` pass sau cleanup.
- Phai bao ro phan nao chi la kiem tra tu dong, phan nao chua test bang GUI desktop.

## Ket qua hoan thanh

### File da sua

- `src/engine.test.ts`: them regression cho cau chat random ngoai du lieu phai ra `UNKNOWN`.
- `src/pages/FilesPage.tsx`: sua nut xoa dung `document.localPath`, them confirm cho move-to-trash va empty-trash.
- `src/schoolConnector/chatSchoolIntegration.ts`: sua wording phien truong thanh metadata local, khong claim token/cookie vault that.
- `docs/FEATURE_CATALOG.md`: cap nhat physical trash, file management, public search, settings, update release va QuickSearch removed.
- `docs/FLOW_MAP.md`: cap nhat chat routing va file trash flow theo source hien tai.
- `docs/DATA_FLOW.md`: cap nhat public search PII sanitizer native.
- `docs/REGRESSION_MATRIX.md`: bo QuickSearch unwired, sua Settings DPAPI disclosure va WebView capability status.
- `PROJECT_TASKS.md`: cap nhat lich su da lam/chua lam, bo overclaim 100% va token vault ma hoa.
- `tasks/TASK_INDEX.md`: them CA-055 vao Done.

### File da xoa

- `powershell.exe`
- `CampusAssistantLocal-Dev.pdb`
- `dev-launcher.log`
- `clippy-strict.log`
- `src/components/QuickSearchModal.tsx`

### Kiem tra

- Baseline ban dau: `npm run check:all` pass.
- Sau cleanup: `npm run check:all` pass.
- Ket qua sau cung: 50 Vitest pass, layout check pass, Vite build pass, 34 Rust tests pass, npm audit 0 vulnerabilities.

### Chua test GUI desktop

- Chua mo app desktop bang tay de click toan bo UI.
- Da kiem tra bang automated test, static source check va build.

### Rollback

- Thu muc hien tai khong phai Git repository hop le, nen rollback khong co `git checkout`.
- Neu can rollback task nay, phuc hoi cac file trong danh sach "File da sua" tu backup/ZIP gan nhat va chay lai `npm run check:all`.
