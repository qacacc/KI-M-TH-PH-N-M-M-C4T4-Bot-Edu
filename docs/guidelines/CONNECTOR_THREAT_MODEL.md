# Connector Threat Model

## Trang thai

- Version: draft 1.0.1
- Pham vi: thiet ke truoc khi code connector truong that.
- Runtime hien tai: chua co SSO, chua co API truong, chua luu token/cookie.

## Muc tieu bao mat

- Ung dung van la local-first: nha phat trien khong nhan credential, token, cookie, lich hoc, diem, hoc phi hoac du lieu ca nhan.
- Moi connector truong phai co consent ro theo tung nhom du lieu.
- Khong luu mat khau. Neu buoc phai giu session, chi luu token/cookie da ma hoa trong vault local va co co che thu hoi.
- Logging va diagnostic chi chua metadata an toan.

## Tai san can bao ve

| Tai san | Do nhay cam | Ghi chu |
| --- | --- | --- |
| Mat khau tai khoan truong | Rat cao | Khong bao gio luu. Chi nhap truc tiep tren portal truong. |
| Cookie/session token/refresh token | Rat cao | Chi luu neu co threat model va vault local. |
| MSSV, ho ten, email truong | Cao | La du lieu dinh danh ca nhan. |
| Lich hoc, lich thi, diem danh | Cao | Co the tiet lo thoi gian/vi tri/hoc tap. |
| Diem, hoc phi, cong no | Rat cao | Chi dong bo khi user cap quyen rieng. |
| Du lieu public cua truong | Thap-vua | Van can ghi ro nguon va thoi diem cap nhat. |
| Action log/diagnostic | Vua | Chi metadata, khong raw HTML/token/path nhay cam. |

## Ranh gioi tin cay

1. May nguoi dung: WebView, SQLite, file workspace, local vault.
2. Portal truong: SSO/OAuth/web login va API/HTML cua truong.
3. Ung dung Campus Assistant: dieu phoi consent, goi connector, normalize data, ghi local.
4. Log/diagnostic: chi doc metadata an toan tu local.
5. Server nha phat trien: khong tham gia trong connector truong that cua mo hinh local-first.

## Moi de doa chinh

| Threat | Anh huong | Giam thieu bat buoc |
| --- | --- | --- |
| Portal gia/URL sai | Mat credential | User chon truong tu manifest da verify, hien domain ro truoc khi dang nhap. |
| Token bi ghi vao SQLite/log | Lo tai khoan | Token chi vao vault, log/diagnostic cam token/cookie/secret. |
| Connector lay qua nhieu du lieu | Vi pham privacy | Consent theo scope: public, schedule, exams, grades, tuition. |
| Session het han/stale token | Dong bo sai/loi ngam | TTL ro, refresh co kiem soat, loi than thien, user revoke duoc. |
| Raw HTML/API response bi luu | Lo PII/token an trong page | Khong cache raw response neu chua co redaction va retention policy. |
| XSS/WebView injection | Token bi doc | Dang nhap trong context co gioi han, khong inject script vao portal truong neu khong duoc audit. |
| Backup/diagnostic gom vault | Lo credential | Export chan doan khong bao gom vault, cookie, token, raw DB secret. |
| Path/report leak | Lo username/path may | Diagnostic uu tien relative path hoac path da redact. |
| Vi pham dieu khoan portal | Khoa tai khoan/rui ro phap ly | Chi dung endpoint duoc phep, rate limit, uu tien API/OAuth chinh thuc. |
| Symlink/path escape khi tai file | Doc/ghi ngoai workspace | Canonicalize va check base nhu file workflow hien tai. |

## Consent model

1. User chon truong va thay domain chinh thuc truoc khi dang nhap.
2. App hien man hinh consent gom:
   - Du lieu public.
   - Lich hoc.
   - Lich thi.
   - Diem/danh gia.
   - Hoc phi/cong no.
3. Moi scope co mo ta: lay tu dau, luu o dau, xoa bang cach nao.
4. Dang nhap chi dien ra tren portal truong, khong qua server nha phat trien.
5. User co the thu hoi token, xoa du lieu da dong bo va xuat/xem diagnostic an toan.

## Token va vault policy

- Khong luu password.
- Uu tien OS vault: Windows Credential Manager/Keychain/Secret Service.
- Neu can fallback SQLite encrypted store, phai co task rieng va review crypto.
- Token/cookie khong duoc xuat hien trong:
  - action log;
  - diagnostic export;
  - crash/error text;
  - telemetry;
  - UI toast.
- Moi token co metadata rieng: schoolId, scopes, createdAt, expiresAt neu biet, lastUsedAt.
- Revoke phai xoa token va dung dong bo ngam.

## Logging va retention

- Log thanh cong/that bai chi ghi action, schoolId, scope, result, errorCode, timestamp.
- Khong ghi raw message, raw HTML, request/response body, cookie, token, password.
- Du lieu dong bo luu local theo contract rieng va co nut xoa.
- Diagnostic connector chi duoc gom health/status da redact.

## Dieu kien truoc khi code connector

- Co connector manifest cho tung truong voi domain/endpoint ro.
- Co mock portal de test auth/sync khong dung tai khoan that.
- Co UI consent/revoke/delete data.
- Co vault implementation duoc test bang temp root.
- Co test khang leak: log/diagnostic khong chua token/cookie/raw PII ngoai contract.
- Co danh gia dieu khoan su dung portal truong.
