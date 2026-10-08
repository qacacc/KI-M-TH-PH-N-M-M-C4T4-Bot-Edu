# CA-053 - Public school site search

## Muc tieu duy nhat

Thay rule local "nam sinh + 18" bang connector tra cuu tu khoa tren trang cong khai cua truong da chon, bat dau voi UTH.

## Duoc phep lam

- Them Tauri command doc cac URL cong khai allowlist cua truong.
- Them bridge frontend goi command do.
- Doi chat flow tuyen sinh cong khai sang tra cuu public site.
- Cap nhat test lien quan.
- Cap nhat task/tai lieu trang thai.

## Khong duoc lam

- Khong them login SSO that.
- Khong nhan mat khau, token, cookie.
- Khong them dependency moi.
- Khong doi command/payload file action hien co.
- Khong refactor UI ngoai phan can de noi flow.

## File duoc phep sua

- src-tauri/src/models.rs
- src-tauri/src/lib.rs
- src-tauri/src/public_search.rs
- src/types.ts
- src/tauriApi.ts
- src/engine.ts
- src/engine.test.ts
- src/App.tsx
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu

- App van local-first.
- Public search khong can dang nhap.
- SSO/API that van o trang thai chua bat.
- File open/copy va action log khong doi.
- `npm run check:all` phai pass.

## Tieu chi hoan thanh

- Cau "2008 chung nao nhap hoc" goi connector public site.
- Neu tim thay, bot hien snippet va URL nguon.
- Neu khong tim thay, bot noi ro khong co ket qua tren nguon da cau hinh.
- Khong con tra loi bang suy luan nam sinh + 18.
- Test frontend/Rust pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Cau hoi tuyen sinh cong khai goi connector tim tu khoa tren trang cong khai UTH, khong con suy luan nam sinh + 18.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: `npm run check:all` da pass sau thay doi lien quan.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


