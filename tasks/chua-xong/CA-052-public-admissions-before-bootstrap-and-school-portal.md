# CA-052 - Public admissions before bootstrap va school portal link

## Muc tieu duy nhat
Cho cau hoi tuyen sinh cong khai chay duoc ngay ca khi bootstrap chua xong, va doi nut xac thuc truong sang mo cong truong chinh thuc thay vi chi hien gate.

## Duoc phep lam
- Xu ly `PUBLIC_ADMISSIONS_INFO` truoc guard `!bootstrap`.
- Cho `/admissions` chay truoc bootstrap.
- Them portal URL cho UTH.
- Nut xac thuc mo portal chinh thuc bang trinh duyet/WebView ngoai, khong doc token.
- Them test cho cau "2008 thi chung nao nhap hoc".
- Cap nhat task docs.

## Khong duoc lam
- Khong nhung form dang nhap vao app.
- Khong thu tai khoan/mat khau/token/cookie.
- Khong parse HTML portal truong.
- Khong them dependency.
- Khong doi flow file/tai lieu.

## File duoc phep sua
- src/App.tsx
- src/engine.test.ts
- src/pages/SchoolPage.tsx
- src/schoolProfile.ts
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Neu app chua bootstrap va cau khong phai public admissions, van bao chua khoi tao.
- Cau public admissions tra loi local khong can dang nhap.
- Portal truong chi duoc mo ngoai, app khong nhan credential.
- npm run check:all pass.

## Tieu chi hoan thanh
- "2008 thi chừng nào nhập học" tra loi duoc khi bootstrap null.
- `/admissions` chay duoc khi bootstrap null.
- UTH co nut mo `https://portal.ut.edu.vn/`.
- npm run check:all pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Public admissions chay truoc bootstrap; UTH mo portal chinh thuc ngoai app khong thu credential.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: `npm run check:all` da pass sau thay doi lien quan.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


