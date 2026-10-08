# CA-044 - Ho so truong local

## Muc tieu duy nhat
Them man hinh de nguoi dung chon truong, khai bao ho so sinh vien local va thay ro trang thai dang nhap cong truong.

## Duoc phep lam
- Them page Truong & tai khoan.
- Luu ho so truong bang localStorage cua WebView.
- Them link tu sidebar va Settings.
- Hien trang thai Public mode, Student mode va SSO chua bat.
- Cap nhat tai lieu task/data contract lien quan.

## Khong duoc lam
- Khong mo WebView SSO that.
- Khong goi API truong that.
- Khong luu token, cookie, mat khau hoac credential.
- Khong them dependency.
- Khong doi Tauri command/payload hien co.
- Khong refactor App.tsx ngoai phan navigation/page render bat buoc.

## File duoc phep sua
- src/App.tsx
- src/pages/SchoolPage.tsx
- src/pages/SettingsPage.tsx
- src/pages/PrivacyPage.tsx
- src/styles.css
- DATA_CONTRACTS.md
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- App van local-first.
- Flow mo/copy file van can xac nhan.
- Draft giao dien chi ap dung khi bam Ap dung.
- Khong log raw chat hoac credential.
- npm run check:all phai pass.

## Tieu chi hoan thanh
- Sidebar co muc Truong & tai khoan.
- Settings co nut mo ho so truong.
- Nguoi dung chon duoc UTH hoac Truong khac.
- Luu/xoa ho so chi trong localStorage.
- Nut dang nhap cong truong khong thu credential, chi bao gate chua san sang.
- Privacy/Data contracts noi ro profile truong local khong phai token.
- npm run check:all pass.

## Khong chac thi lam gi?
Dung lai va bao van de. Khong tu mo rong sang SSO/API that.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them man Truong & tai khoan, chon UTH/truong khac, luu localStorage va login gate khong thu credential.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


