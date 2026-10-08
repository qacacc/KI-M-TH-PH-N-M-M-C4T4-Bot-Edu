# CA-040 - Settings controls real behavior

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Sua trang Settings de cac control khong gay hieu nham: Back nam dung vi tri, Work mode chi co mot lua chon active, Language khong con la nut gia, va cac setting co the ap dung thi phai duoc App doc that.

## Duoc phep lam

- Sua titlebar Back alignment.
- Sua SettingsPage control text/state.
- Cho App doc default screen va auto-focus chat tu localStorage.
- Cap nhat task docs.

## Khong duoc lam

- Khong them i18n day du.
- Khong doi Tauri command.
- Khong them dependency.
- Khong doi backend.
- Khong code connector truong.
- Khong sua chat/file/security flow ngoai scope.

## File duoc phep sua

- `src/App.tsx`
- `src/pages/SettingsPage.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## Hanh vi phai giu

- Settings van la page rieng co Back.
- Cac nut Storage/Health/Logs/Appearance van dieu huong duoc.
- Cac hanh dong nguy hiem van can confirm.
- `npm run check:all` pass.

## Ket qua

- Nut Back tren titlebar nam cung cum trai, khong con bi day ra giua.
- Work mode chi con mot lua chon active: Local assistant hoac For coding.
- Language khong con la toggle gia; ban hien tai ghi ro chi ho tro Tieng Viet.
- Default screen duoc App doc khi khoi dong.
- Auto-focus chat va Bottom panel doi live trong App, khong chi luu localStorage.
- Local data khong hien `0` gia khi storage chua load xong.
- `npm run check:all` pass ngay 2026-07-22.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Sua Back alignment, bo language gia, noi default screen/auto-focus/bottom panel vao App that.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


