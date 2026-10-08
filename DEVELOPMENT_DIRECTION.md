# Development Direction

## Nguyen tac

- Lam tung doan nho cua cung mot vertical slice, khong dung UI rong.
- Moi chuc nang tren UI phai noi duoc toi du lieu that hoac du lieu mau co kiem soat.
- Khong gui du lieu ca nhan ra may chu ben ngoai.
- Khong log token, mat khau, cookie, secret, noi dung tai lieu hoac raw message neu chua can.
- Khong thao tac file ngoai vung allowlist.

## Huong phat trien

### v0.1

Chung minh xong luong `FIND_DOCUMENTS` tu chat UI den file action va action log.

### v0.2

- Them state machine tong quat cho nhieu flow.
- Them fuzzy matching bang Fuse.js.
- Them cache/temp/trash co ban.
- Them Zalo setup guide dang tai lieu tuong tac.

### v0.3

- Mo rong intent local ngoai tai lieu.
- Them thong bao, lich hoc va lich thi bang JSON local.
- Dashboard hien du lieu that cua cac nguon mau.

### v0.5

- Hoan thanh multi-flow local: tai lieu, thong bao, lich hoc, lich thi.
- Co tab va bang metadata cho tung nguon du lieu.
- Chua them connector truong that de tranh xu ly du lieu nhay cam khi chua co security model rieng.

### v1.0

- Release local-first: tai lieu, thong bao, lich hoc, lich thi, bo nho, health report, diagnostic export va release checklist.
- Dong goi NSIS/MSI voi version `1.0.1`.
- Chua connector truong that, chua dang nhap tai khoan truong, chua API AI.

### v1.0.1

- Cai thien UX/UI theo huong chat-first va local desktop app.
- Dung custom titlebar thay native decoration.
- Sidebar trai la hover rail: mac dinh gon, khi hover/focus moi hien day du label.
- Panel phu co resize/collapse, nhung tab Giao dien khong mo customize panel song song.
- Appearance Studio co draft/apply/discard/reset, presets, background image, fit/focus/overlay, panel opacity, font, density va color tokens.
- Giam shadow nang, tranh doi theme live lien tuc gay lag.
- Them test cho layout, appearance, DB temp root, path traversal, symlink va DB idempotent.

### Sau v1.0

- Connector truong that theo co che nguoi dung tu cau hinh, chi sau khi co threat model rieng.
- Dang nhap/xac minh tai khoan truong, token/cookie/session storage va API truong that phai co security review rieng truoc khi code.
- Zalo bot/guide production phai co privacy model rieng.
- Backup/restore co canh bao secret.
- Theme preset export/import, background image app-managed, ZIP package, Playwright visual checks va hardening bo sung.
