# Security Notes

## File Scope

- Chi doc file trong `Documents/CampusAssistant/sample-documents`.
- Chi copy file sang `Documents/CampusAssistant/downloads`.
- Khong nhan path tuyet doi tu nguoi dung.
- Khong chap nhan `..` de thoat khoi vung quan ly.
- Moi path phai resolve ve duong dan tuyet doi va kiem tra prefix allowlist.
- Path guard phai canonicalize de chan file/thu muc nam ngoai base, ke ca truong hop di qua symlink.
- Test bao mat phai dung temp root rieng, khong dung AppLocalData that cua nguoi dung.

## Logging

Khong log:

- Raw message neu chua can.
- Noi dung tai lieu.
- Token, mat khau, cookie, secret.
- Path tuyet doi nhay cam.

Chi log metadata can thiet:

- action.
- documentId.
- result.
- timestamp.
- errorCode than thien neu co loi.

## UI va IPC

- Frontend chi goi command Tauri duoc allowlist.
- Rust command phai validate input.
- Loi tra ve UI khong hien stack trace.
- Khong inject HTML chua escape.

## Local Campus Data v0.5

- Thong bao, lich hoc va lich thi hien tai chi doc tu JSON local dong goi trong app.
- Khong dang nhap tai khoan truong.
- Khong lay cookie, token, mat khau hoac session cua nguoi dung.
- Khong gui noi dung chat hoac du lieu mau ra may chu ngoai.
- Khi them connector truong that sau nay, can co tai lieu threat model va permission rieng truoc khi code.

## Storage Maintenance v0.6

- Bo nho chi thong ke `AppLocalData` va `Documents/CampusAssistant`.
- Nut mo downloads chi mo `Documents/CampusAssistant/downloads`.
- Xoa action log chi xoa metadata trong SQLite, khong xoa file tai lieu hoac downloads.
- Thao tac xoa log phai co confirm o UI.

## Health Report v0.7

- Health report chi kiem tra SQLite, JSON dong goi va cac thu muc trong vung CampusAssistant.
- Khong goi mang de kiem tra update; chi doc cau hinh manifest URL neu co trong build.
- Khong doc noi dung file tai lieu, chi dem file va tong dung luong.

## Diagnostic Export v1.0.1

- Bao cao chan doan chi ghi vao `Documents/CampusAssistant/downloads`.
- Payload khong chua noi dung chat, noi dung tai lieu, token, cookie, mat khau, secret hoac raw credential.
- Payload chi gom health report, thong ke dung luong va toi da 50 action log metadata.
- Ten file duoc tao tu timestamp va loai bo ky tu khong an toan cho path.

## Release 1.0.1 Boundary

- Ban 1.0.1 la desktop local-first, chua tich hop API truong that.
- Khong co OAuth, cookie capture, token storage, password storage hoac session proxy.
- Moi du lieu ca nhan tu he thong truong se can threat model, permission scope va user-consent flow rieng truoc khi code.

## School Connector Draft

- Threat model chinh thuc nam tai `CONNECTOR_THREAT_MODEL.md`.
- Design spec chinh thuc nam tai `CONNECTOR_DESIGN.md`.
- Truoc khi code connector that, bat buoc co consent UI, revoke/delete flow, vault local va mock portal test.
- Connector khong duoc proxy credential/token/cookie qua server nha phat trien.
- Diagnostic/log cua connector chi duoc ghi metadata da redact.

## Appearance Studio v1.0.1

- Anh nen chi dung data URL trong draft/preview truoc khi apply; khi bam `Ap dung`, app luu vao `AppLocalData/themes/current` qua Tauri command.
- Khong upload anh nen, font hoac mau giao dien ra may chu ngoai.
- Khong dung path truc tiep tu nguoi dung de doc file sau khi chon anh.
- Reset giao dien chi xoa cau hinh UI local, khong xoa data/log/file.
