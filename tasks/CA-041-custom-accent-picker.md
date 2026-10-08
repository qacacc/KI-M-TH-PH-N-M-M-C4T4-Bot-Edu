# CA-041 - Custom accent picker

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Them nut `+` vao hang mau nhan trong trang Giao dien. Khi bam se mo picker rieng cho phep keo slider RGB, xem truoc mau va chi cap nhat accent draft khi bam Xac nhan.

## Duoc phep lam

- Them state picker trong `AppearancePage`.
- Them helper hex/RGB cuc bo.
- Them nut `+`, popover picker, nut Xac nhan/Huy.
- Them CSS cho picker.
- Cap nhat task docs.

## Khong duoc lam

- Khong them dependency.
- Khong doi backend.
- Khong doi Tauri command.
- Khong doi logic apply/discard/reset tong.
- Khong luu theme ngay khi keo slider.

## File duoc phep sua

- `src/pages/AppearancePage.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## Hanh vi phai giu

- Chon mau preset van doi accent draft nhu cu.
- Draft van chi luu that khi bam Apply cua trang Giao dien.
- Huy trong picker khong doi accent draft.
- `npm run check:all` pass.

## Ket qua

- Hang mau nhan co nut `+`.
- Bam `+` mo popover chinh mau rieng.
- Co preview mau, input HEX va slider R/G/B.
- Keo slider chi doi mau nhap trong popover, chua doi accent draft.
- Bam `Xac nhan` moi cap nhat accent draft.
- Bam `Huy` dong picker va khong doi accent.
- `npm run check:all` pass ngay 2026-07-22.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them nut + cho hang mau nhan, picker RGB/HEX co Huy/Xac nhan.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


