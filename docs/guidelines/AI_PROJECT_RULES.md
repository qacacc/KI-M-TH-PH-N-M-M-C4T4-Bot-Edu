# AI Project Rules

File nay la hop dong lam viec bat buoc cho moi AI/coding agent khi sua Campus Assistant Local.

## Nguyen tac chinh

1. Moi lan lam viec chi co mot task active.
2. Task active phai nam trong `tasks/CA-XXX-*.md`.
3. Khong sua code khi chua doc task active va cac file bat buoc.
4. Khong mo rong scope vi "tien the".
5. Khong them dependency neu task khong cho phep.
6. Khong doi Tauri command, payload IPC, schema SQLite hoac data contract neu task khong cho phep.
7. Khong ghi raw chat, credential, token, cookie, password, secret hoac noi dung file vao log.
8. Khong chay test nao dung AppLocalData/SQLite that cua nguoi dung.
9. Neu source khac task hoac can sua file ngoai danh sach, dung lai va bao nguoi dung.
10. Sau khi sua phai chay command test duoc task yeu cau, mac dinh la `npm run check:all`.
11. Chi duoc bao "xong, moi user test" khi dat day du muc "Moc duoc phep bao xong va moi user test" trong task active.

## File bat buoc doc truoc moi task

- `AI_PROJECT_RULES.md`
- `tasks/CA-XXX-*.md`
- `README.md`
- `ARCHITECTURE.md`
- `SECURITY_NOTES.md`
- File guideline lien quan:
  - UI task: `UX_UI_GUIDELINES.md`
  - Backend/Rust task: `BACKEND_GUIDELINES.md`
  - Performance task: `OPTIMIZATION_TARGETS.md`

## Giai doan 1 - Chua sua code

AI phai bao truoc:

1. Muc tieu hieu duoc.
2. Nhung phan ngoai scope.
3. File du kien sua.
4. Hanh vi phai giu.
5. Rui ro hoac mau thuan phat hien.
6. Cach kiem thu.

Chi trien khai sau khi nguoi dung duyet.

## Giai doan 2 - Trien khai

- Chi sua trong file duoc duyet.
- Khong refactor phan khong lien quan.
- Khong tu sua loi ngoai scope.
- Khong thay doi command/payload neu task khong cho phep.
- Neu can doi hanh vi hoac sua file ngoai danh sach, dung lai.
- Chay test theo task, mac dinh `npm run check:all`.

## Giai doan 3 - Bao cao

Chi duoc vao giai doan bao cao nghiem thu khi:

- Luong chinh da chay end-to-end.
- Luong loi/fallback da co UI/response ro rang.
- Khong con control gia hoac placeholder trong pham vi task.
- Test bat buoc da pass.
- Task file da cap nhat neu task co thay doi trang thai/hanh vi.

Bao cao dung mau:

1. File da sua.
2. Moi thay doi phuc vu tieu chi nao.
3. Co thay doi ngoai scope khong.
4. Hanh vi cu nao da giu.
5. Test da chay va ket qua.
6. Phan chua hoan thanh.
7. Rui ro con lai.
8. Cach rollback.

## Dieu kien dung lai ngay

- Can doc/ghi file ngoai vung workspace.
- Can goi mang hoac API ngoai khi task khong cho phep.
- Can them dependency.
- Can luu credential/token/cookie/session ma task active khong co threat model, consent, vault local va cach xoa phien.
- Can sua schema SQLite hoac Tauri command ngoai scope.
- Test fail vi ly do khong nam trong task.
- Phat hien task mau thuan voi security notes.

## Git va rollback

Thu muc hien tai co the khong phai Git repo hop le. Neu chua co Git:

- Khong duoc gia dinh co rollback bang commit.
- Truoc task lon nen tao baseline ZIP hoac khoi phuc Git repo hop le.
- Moi bao cao phai neu ro file da sua de rollback bang tay neu can.
