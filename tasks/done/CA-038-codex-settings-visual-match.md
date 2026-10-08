# CA-038 - Match Codex Settings visual structure

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Chinh trang Cai dat giong cau truc Codex Settings hon: mot cot noi dung trung tam, section xep doc, option cards, grouped setting rows va toggle ben phai.

## Ly do

Anh tham chieu Codex Settings khong dung sidebar con trong trang. Ban CA-037 da gon hon nhung van khac reference vi co navigation ben trai. Task nay bo navigation con va dua Settings ve dang stacked content.

## Duoc phep lam

- Sua markup `SettingsPage`.
- Sua CSS rieng cho `.settings-*`.
- Giu handler/backend hien co.
- Cap nhat task docs.

## Khong duoc lam

- Khong doi Tauri command.
- Khong them dependency.
- Khong code connector truong.
- Khong doi sidebar app shell.
- Khong refactor App.tsx.

## File duoc phep sua

- `src/pages/SettingsPage.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `README.md`
- `SECURITY_NOTES.md`
- `tasks/done/CA-038-codex-settings-visual-match.md`

## Hanh vi phai giu

- Khong xoa du lieu neu user chua confirm.
- Khong hien sai rang token/vault truong da active.
- Dev mode chi luu localStorage flag.
- Reset layout/appearance dung handler hien co.
- `npm run check:all` pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Chinh Settings thanh mot cot trung tam, section stacked, option cards va grouped rows nhu anh Codex.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


