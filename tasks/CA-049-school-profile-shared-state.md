# CA-049 - School profile shared state

## Muc tieu duy nhat
Dung chung ho so truong local giua School page va sidebar footer de footer hien dung ten/initial/truong sau khi nguoi dung luu ho so.

## Duoc phep lam
- Tach school profile storage sang module dung chung.
- Sidebar footer doc profile da luu thay vi hardcode "Sinh vien".
- School page dung module chung de save/clear.
- Phat event local khi profile thay doi.
- Cap nhat task docs.

## Khong duoc lam
- Khong them SSO/API that.
- Khong luu token/cookie/mat khau.
- Khong doi payload Tauri command.
- Khong doi flow chat/file.
- Khong them dependency.

## File duoc phep sua
- src/schoolProfile.ts
- src/App.tsx
- src/pages/SchoolPage.tsx
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Profile van luu bang `localStorage` key `ca-school-profile-v1`.
- Account footer van mo Truong & tai khoan.
- Settings van mo duoc tu footer.
- npm run check:all pass.

## Tieu chi hoan thanh
- Luu ten hien thi trong School page thi footer doi ten ngay.
- Xoa profile thi footer quay ve mac dinh.
- Footer hien truong/mode gon, khong lo token hay credential.
- npm run check:all pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Ho so truong dung module chung; footer hien profile da luu va cap nhat ngay khi save/clear.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


