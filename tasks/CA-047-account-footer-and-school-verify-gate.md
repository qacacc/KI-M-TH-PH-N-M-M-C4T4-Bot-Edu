# CA-047 - Account footer va school verify gate

## Muc tieu duy nhat
Dat Settings vao vi tri hop ly hon o footer sidebar, gan ho so sinh vien vao cum avatar va lam ro xac thuc sinh vien phai qua cong truong/SSO chu khong qua email.

## Duoc phep lam
- Doi footer sidebar thanh account row mo trang Truong & tai khoan.
- Them nut Settings canh account row.
- Bo section Settings rieng trong sidebar scroll.
- Doi copy trong School page: email chi la thong tin phu, xac thuc qua cong truong.
- Cap nhat task docs.

## Khong duoc lam
- Khong code SSO/WebView/API that.
- Khong thu password/token/cookie.
- Khong doi logic chat/file.
- Khong them dependency.

## File duoc phep sua
- src/App.tsx
- src/pages/SchoolPage.tsx
- src/styles.css
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Settings van mo duoc.
- Truong & tai khoan van mo duoc tu sidebar.
- Sidebar collapsed/hover van hoat dong.
- npm run check:all pass.

## Tieu chi hoan thanh
- Sidebar khong con section Settings troi rieng.
- Account footer click vao mo Truong & tai khoan.
- Nut Settings nam o footer.
- School page noi ro email khong dung de xac thuc.
- Nut xac thuc cong truong chi hien gate an toan.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Settings nam canh account footer; account mo ho so truong; email khong dung de xac thuc sinh vien.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


