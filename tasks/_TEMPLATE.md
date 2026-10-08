# CA-XXX - Ten task

## Trang thai

- Status: Draft | Ready | In Progress | Blocked | Done
- Owner: AI + User review
- Created: YYYY-MM-DD

## Muc tieu duy nhat

Mo ta mot ket qua duy nhat can dat.

## Ly do

Vi sao task nay can lam, lien quan loi/UX/backend nao.

## Duoc phep lam

- ...

## Khong duoc lam

- Khong mo rong scope.
- Khong them dependency neu khong ghi ro.
- Khong doi Tauri command neu khong ghi ro.
- Khong sua file ngoai danh sach neu chua xin duyet.

## File duoc phep sua

- ...

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `README.md`
- `ARCHITECTURE.md`
- `SECURITY_NOTES.md`
- ...

## Hanh vi phai giu

- ...

## Tieu chi hoan thanh

- ...
- `npm run check:all` pass.

## Moc duoc phep bao xong va moi user test

AI chi duoc bao "xong, hay test" khi tat ca dieu kien sau da dat:

- Luong chinh chay end-to-end tu UI -> state -> backend/data -> phan hoi nguoi dung.
- Luong loi/fallback co thong bao than thien, khong crash, khong stack trace.
- Khong co control gia: moi nut/input duoc them phai co hanh vi that hoac bi disable kem ly do ro.
- Du lieu nhay cam, neu task cho phep dung, chi duoc luu local theo dung threat model cua task.
- Log khong chua raw chat, password, token, cookie, secret hoac noi dung file.
- Test tu dong trong task pass, mac dinh la `npm run check:all`.
- Task file va task index da cap nhat trang thai.

Neu moi xong mot phan hoac con placeholder, AI phai bao "chua hoan thanh", khong duoc yeu cau user test nhu ban xong.

## Cach test

```powershell
npm run check:all
```

## Khong chac thi lam gi?

Dung lai va bao van de. Khong tu mo rong scope.

## Bao cao nghiem thu bat buoc

1. File da sua.
2. Moi thay doi phuc vu tieu chi nao.
3. Co thay doi ngoai scope khong.
4. Hanh vi cu nao da giu.
5. Test da chay va ket qua.
6. Phan chua hoan thanh.
7. Rui ro con lai.
8. Cach rollback.
