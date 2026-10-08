# CA-039 - Settings dedicated page with back

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Mo Settings nhu mot man hinh rieng giong Codex: an sidebar/panel phu, noi dung nam giua va co nut Back de quay lai man hinh truoc.

## Ly do

Codex khi bam Settings se chuyen sang page rieng va co nut quay lai tren thanh tren cung. App hien tai van mo Settings ben trong layout sidebar, khong dung hanh vi tham chieu.

## Duoc phep lam

- Them state luu view truoc Settings.
- Them ham mo/dong Settings.
- An sidebar/utility/customize khi view la Settings.
- Them nut Back tren titlebar khi view la Settings.
- Sua CSS cho `settings-mode`.
- Cap nhat task docs.

## Khong duoc lam

- Khong doi Tauri command.
- Khong them dependency.
- Khong doi backend.
- Khong code connector truong.
- Khong sua logic chat/file/action log.

## File duoc phep sua

- `src/App.tsx`
- `src/pages/SettingsPage.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## Hanh vi phai giu

- Settings rows va controls hien co van hoat dong.
- Back quay lai view truoc khi mo Settings.
- Cac nut trong Settings nhu Storage/Health/Logs van dieu huong duoc.
- Khong xoa du lieu neu user chua confirm.
- `npm run check:all` pass.

## Ket qua

- Settings mo nhu man hinh rieng, khong hien sidebar, utility panel hay customize panel.
- Titlebar hien nut Back khi dang o Settings.
- Back dua nguoi dung ve view truoc khi mo Settings.
- Search/action workspace tren titlebar duoc an khi dang o Settings.
- `npm run check:all` pass ngay 2026-07-22.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Settings mo nhu page rieng, an chrome workspace va co Back ve view truoc.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


