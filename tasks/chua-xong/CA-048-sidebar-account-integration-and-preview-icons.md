# CA-048 - Account integration va preview icon cleanup

## Muc tieu duy nhat
Hoan tat viec tich hop ho so truong vao footer account, bo muc Truong khoi sidebar nav va lam sach preview giao dien khoi icon/nen/hieu ung khong phu hop.

## Duoc phep lam
- Xoa button Truong trong nhom Tra cuu cua sidebar.
- Giu account footer la noi mo Truong & tai khoan.
- Thay emoji trong Appearance preview bang lucide icon.
- Giam shadow/glow trong preview.
- Chi dung overlay/blur preview khi co anh nen.
- Cap nhat task docs.

## Khong duoc lam
- Khong xoa view Truong & tai khoan.
- Khong doi flow xac thuc truong.
- Khong doi logic chat/file.
- Khong them dependency.

## File duoc phep sua
- src/App.tsx
- src/pages/AppearancePage.tsx
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Account footer van mo Truong & tai khoan.
- Settings van mo duoc tu footer.
- Appearance draft van chi ap dung khi bam Ap dung.
- npm run check:all pass.

## Tieu chi hoan thanh
- Sidebar khong con muc Truong trong Tra cuu.
- Preview khong con emoji icon sai ngu canh.
- Preview nen/overlay khong bi phu xam khi khong co anh nen.
- npm run check:all pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Bo Truong khoi nav trai, preview dung lucide icon va giam overlay/blur khi khong co anh nen.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


