# CA-033 - Background image app-managed storage

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Chuyen background image tu WebView data URL/localStorage sang file app-managed trong workspace cua app, giu privacy va giam localStorage nang.

## Ly do

Hien Appearance co the luu anh nen dang data URL. Cach nay tien cho MVP nhung khong tot neu anh lon, co the lam WebView storage nang va kho debug.

## Duoc phep lam

- Dung command backend hien co `save_theme_background` va `delete_theme_background` neu phu hop.
- Dieu chinh frontend de luu reference/path an toan thay vi data URL dai.
- Cap nhat type/settings neu can.
- Them test cho sanitize/load/save settings neu doi shape.

## Khong duoc lam

- Khong them cloud sync.
- Khong doc file tuy y ngoai file user da chon.
- Khong luu path tuyet doi nhay cam vao log.
- Khong doi preset ngoai phan can thiet.
- Khong doi file action document.
- Khong them dependency.

## File duoc phep sua

- `src/hooks/useAppearanceDraft.ts`
- `src/hooks/useAppearanceDraft.test.ts`
- `src/pages/AppearancePage.tsx`
- `src/tauriApi.ts`
- `src/types.ts`
- `src/styles.css` neu can
- `src-tauri/src/lib.rs` neu can mo rong command hien co
- `DATA_CONTRACTS.md`
- `SECURITY_NOTES.md`
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `BACKEND_GUIDELINES.md`
- `SECURITY_NOTES.md`
- `DATA_CONTRACTS.md`
- `tasks/done/CA-033-background-managed-storage.md`

## Hanh vi phai giu

- Draft/apply/discard/reset van dung.
- Khong upload anh.
- Anh nen van hien trong preview va app sau khi apply.
- Reset giao dien khong xoa data tai lieu/log.

## Tieu chi hoan thanh

- Background image duoc luu vao vung app-managed.
- Settings khong con can chua data URL dai.
- File anh cu co the xoa qua delete command khi reset/remove.
- `npm run check:all` pass.

## Ket qua

- Khi user chon anh trong Appearance, data URL chi nam trong draft de preview.
- Khi bam `Ap dung`, app cat phan base64 thuan, goi `save_theme_background`, nhan relative path va doi sang `asset://` bang Tauri `convertFileSrc`.
- Khi apply trang thai khong co background image, app goi `delete_theme_background("current")` de xoa file nen managed hien tai.
- `applyAppearanceChanges` nhan appearance override de tranh React apply nham draft cu.
- Khong doi Tauri command, khong them dependency, khong upload anh.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Khi apply, anh nen duoc luu vao AppLocalData/themes/current va settings khong can giu data URL dai.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


