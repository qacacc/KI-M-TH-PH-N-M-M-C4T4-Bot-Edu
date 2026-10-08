# CA-051 - Send button bootstrap consistency

## Muc tieu duy nhat
Sua nut Gui de hoat dong nhat quan voi phim Enter khi app chua bootstrap xong.

## Duoc phep lam
- Bo dieu kien `!bootstrap` khoi disabled cua nut Gui.
- Giu `submitText` la duong xu ly duy nhat cho Enter va click Gui.
- Cap nhat task docs.

## Khong duoc lam
- Khong doi logic xu ly intent.
- Khong doi shortcut buttons.
- Khong doi bootstrap/init.
- Khong them dependency.

## File duoc phep sua
- src/App.tsx
- PROJECT_TASKS.md
- tasks/TASK_INDEX.md

## Hanh vi phai giu
- Enter van gui nhu cu.
- Click Gui phai gui khi co input va khong busy.
- Neu bootstrap chua xong, bot van tra thong bao chua khoi tao.
- npm run check:all pass.

## Tieu chi hoan thanh
- Nut Gui khong bi disabled chi vi `bootstrap` null.
- `npm run check:all` pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Nut Gui gui duoc nhu phim Enter ke ca khi bootstrap chua xong, bot tra thong bao chua khoi tao.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: `npm run check:all` da pass sau thay doi lien quan.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


