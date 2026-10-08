# CA-045 - Public admissions info local

## Muc tieu duy nhat
Them kha nang tra loi thong tin tuyen sinh cong khai dang rule local cho cau hoi khong can dang nhap, vi du "khoi 2008 thi nam nao nhap hoc".

## Duoc phep lam
- Them intent `PUBLIC_ADMISSIONS_INFO`.
- Them parser sinh nam/khoi.
- Tra loi nam thi THPT va nam nhap hoc du kien bang rule local.
- Them slash command `/admissions`.
- Cap nhat help, command suggestion va task docs.
- Them test engine.

## Khong duoc lam
- Khong goi website truong/API that.
- Khong them AI/RAG/embedding.
- Khong yeu cau dang nhap.
- Khong luu them du lieu ca nhan.
- Khong refactor chat flow ngoai phan bat buoc.
- Khong them dependency.

## File duoc phep sua
- src/engine.ts
- src/engine.test.ts
- src/App.tsx
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Flow tai lieu/lien quan file khong doi.
- Dang nhap truong that van chua bat.
- Khong gui hoi thoai ra server.
- npm run check:all pass.

## Tieu chi hoan thanh
- "khối 2008 thì năm nào nhập học" duoc nhan intent public admissions.
- Tra loi nam thi THPT va nhap hoc du kien.
- `/admissions` hien huong dan hoi tuyen sinh cong khai.
- Test moi pass trong `npm run check:all`.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them intent va `/admissions` cho cau hoi tuyen sinh cong khai nhu khoi 2008 nhap hoc nam nao.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


