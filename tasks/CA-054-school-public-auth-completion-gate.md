# CA-054 - School public/auth completion gate

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22

## Muc tieu duy nhat

Dinh nghia moc hoan thanh bat buoc cho cac task lien quan truong: public search, xac thuc qua cong truong, vault cookie/token local va connector API ca nhan.

## Ly do

Nguoi dung khong muon AI bao cao som khi moi co UI hoac placeholder. Chuc nang truong chi duoc bao xong khi chay duoc end-to-end, co fallback, co test va khong vi pham local-first.

## Duoc phep lam

- Ghi ro definition of done cho Public Mode.
- Ghi ro definition of done cho Student Auth Mode.
- Ghi ro definition of done cho Local Session Vault.
- Ghi ro dieu kien moi user test.
- Cap nhat guideline/task index neu can.

## Khong duoc lam

- Khong code SSO/WebView trong task nay.
- Khong luu cookie/token that trong task nay.
- Khong them dependency.
- Khong sua UI runtime.

## File duoc phep sua

- `AI_PROJECT_RULES.md`
- `BACKEND_GUIDELINES.md`
- `tasks/_TEMPLATE.md`
- `tasks/TASK_INDEX.md`
- `tasks/CA-054-school-public-auth-completion-gate.md`

## Hanh vi phai giu

- App van local-first.
- Mac dinh khong thu password/token/cookie.
- Neu task sau cho phep vault, chi luu local ma hoa va co consent/xoa phien.

## Tieu chi hoan thanh

- Moi task moi co muc "Moc duoc phep bao xong va moi user test".
- Backend guideline noi ro cookie/token chi duoc luu khi task vault da duyet.
- Connector truong co 4 moc: Public, Auth, Vault, Data.

## Moc duoc phep bao xong va moi user test

Task nay chi duoc bao xong khi:

- Template task co rule khong duoc moi user test neu moi co placeholder.
- AI rules co gate truoc giai doan bao cao.
- Backend guideline co gate rieng cho connector truong.
- Task index ghi CA-054 trong Done.

## Cach test

Doc lai 4 file tren va doi chieu dieu kien hoan thanh. Khong can build vi task chi sua tai lieu.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them moc chi duoc bao xong/moi user test khi public/auth/vault/data flow dat end-to-end va co test/fallback.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: doc lai guideline/task template/task index; task chi sua tai lieu nen khong can build.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


