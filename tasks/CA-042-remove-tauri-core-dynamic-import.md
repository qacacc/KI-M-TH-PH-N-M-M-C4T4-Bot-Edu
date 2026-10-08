# CA-042 - Remove Tauri core dynamic import warning

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Xoa warning Vite `INEFFECTIVE_DYNAMIC_IMPORT` bang cach doi `convertFileSrc` tu dynamic import sang static import.

## Ly do

Build hien pass nhung co warning vi `@tauri-apps/api/core` vua duoc import dong trong `App.tsx`, vua duoc import tinh boi cac module Tauri khac. Warning nay khong lam hong app, nhung lam log build nhieu va de che mat warning that sau nay.

## Duoc phep lam

- Sua import trong `src/App.tsx`.
- Thay hai dynamic import `@tauri-apps/api/core` bang static import.
- Cap nhat task/docs neu can.

## Khong duoc lam

- Khong doi Tauri command.
- Khong doi flow background image.
- Khong doi UI.
- Khong them dependency.

## File duoc phep sua

- `src/App.tsx`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## Hanh vi phai giu

- Background image van duoc convert sang asset URL bang `convertFileSrc`.
- Draft/apply appearance khong doi.
- Drag/drop background khong doi.

## Tieu chi hoan thanh

- `npm run build` khong con warning `INEFFECTIVE_DYNAMIC_IMPORT`.
- `npm run check:all` pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Doi `convertFileSrc` sang static import de build log sach warning dynamic import.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


