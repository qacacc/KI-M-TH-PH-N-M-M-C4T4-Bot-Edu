# CA-031 - Preview da man hinh trong Appearance

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Them cac che do preview `Tro chuyen`, `Lich hoc`, `Bang du lieu` va `Kiem tra` trong trang Giao dien de user xem theme tren nhieu man hinh truoc khi bam Ap dung.

## Ly do

Preview hien tai chua du dai dien cho cac page khac nhau. User can thay theme anh huong chat, bang du lieu va trang health ra sao truoc khi luu.

## Duoc phep lam

- Them state chon loai preview trong `AppearancePage`.
- Them component/markup preview nam trong `AppearancePage`.
- Them CSS responsive rieng cho preview.
- Them test lien quan neu co helper moi.

## Khong duoc lam

- Khong sua he thong luu anh nen.
- Khong sua preset hien tai.
- Khong sua sidebar.
- Khong doi Tauri command.
- Khong refactor `App.tsx` ngoai phan bat buoc.
- Khong them dependency.

## File duoc phep sua

- `src/pages/AppearancePage.tsx`
- `src/styles.css`
- `src/types.ts` neu that su can
- File test tuong ung neu them helper
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `README.md`
- `SECURITY_NOTES.md`
- `tasks/done/CA-031-theme-preview.md`

## Hanh vi phai giu

- Draft chi ap dung khi bam `Ap dung`.
- `Hoan tac` va `Khoi phuc` van hoat dong.
- Khong luu raw chat.
- Khong doi du lieu preset hien tai.
- Khong doi background storage.

## Tieu chi hoan thanh

- Chuyen duoc 4 loai preview.
- Preview phan anh ban nhap, khong ghi setting that.
- Khong tran chu o cac kich thuoc cua so pho bien.
- `npm run check:all` pass.

## Khong chac thi lam gi?

Dung lai va bao van de. Khong tu mo rong scope.

## Ket qua

- `AppearancePage` da co preview tabs cho `Tro chuyen`, `Lich hoc`, `Bang du lieu` va `Kiem tra`.
- Preview dung draft hien tai, khong ghi setting that khi user chua bam `Ap dung`.
- `Hoan tac`, `Khoi phuc` va preset hien tai tiep tuc giu hanh vi cu.
- Khong thay doi Tauri command, background storage hoac sidebar.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Appearance co preview chat, lich hoc, bang du lieu va kiem tra dung draft truoc khi ap dung.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


