# CA-037 - Codex-style Settings page

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Chinh lai trang Cai dat theo huong Settings cua Codex: danh muc ben trai trong page, noi dung ben phai, control gon, ro nhom, trung thuc ve local-first/security/dev status.

## Ly do

Settings hien co dung tab ngang va card lon, cam giac nang va chua giong workflow desktop chat app. Can gop cac cau hinh chung, du lieu local, bao mat, cap nhat, dev va nang cao vao mot noi de doc/de thao tac hon.

## Duoc phep lam

- Sua `SettingsPage` markup/state noi bo.
- Sua CSS rieng cho `.settings-*`.
- Dung handler/backend hien co da truyen tu App.
- Cap nhat task index/docs neu can.

## Khong duoc lam

- Khong them Tauri command.
- Khong them dependency.
- Khong doi sidebar/app shell.
- Khong doi storage/token/vault backend.
- Khong code connector truong.
- Khong refactor App.tsx ngoai phan bat buoc.

## File duoc phep sua

- `src/pages/SettingsPage.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md` neu can

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `README.md`
- `SECURITY_NOTES.md`
- `tasks/CA-037-codex-style-settings.md`

## Hanh vi phai giu

- Khong doi command/payload Tauri.
- Khong xoa log hoac localStorage neu user chua confirm.
- Nut xoa action log van dung confirm hien co.
- Nut reset layout/appearance van dung handler hien co.
- Dev mode chi luu localStorage flag.
- Khong hien sai rang token/vault truong da active.

## Tieu chi hoan thanh

- Settings co navigation noi bo kieu sidebar.
- Cac nhom: Chung, Du lieu local, Bao mat, Cap nhat, Dev, Nang cao.
- Khong dung card cha nang/bo cuc tab ngang cu.
- Khong co thong tin security gia nhu `DPAPI Active` khi chua co connector.
- `npm run check:all` pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Chinh Settings thanh layout 2 cot, section ro, control gon va security status trung thuc.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


