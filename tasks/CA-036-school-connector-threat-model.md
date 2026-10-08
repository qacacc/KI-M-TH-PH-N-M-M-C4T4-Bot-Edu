# CA-036 - Threat model connector truong

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Viet threat model va design spec cho connector truong that truoc khi code bat ky dang nhap/API truong nao.

## Ly do

Connector truong that lien quan credential, cookie, token, lich hoc, lich thi, thong tin ca nhan va co the vi pham dieu khoan neu lam sai. Can chot privacy/security/user-consent truoc.

## Duoc phep lam

- Phan tich threat model.
- Dinh nghia user consent flow.
- Dinh nghia storage policy cho credential/token neu bat buoc.
- Dinh nghia cach khong gui du lieu ve server cua dev.
- Dinh nghia connector interface o muc tai lieu.
- De xuat cach test bang mock portal.

## Khong duoc lam

- Khong code connector.
- Khong scrape portal truong that.
- Khong tim/call API that.
- Khong luu credential.
- Khong them dependency.
- Khong sua app runtime.

## File duoc phep sua

- `CONNECTOR_THREAT_MODEL.md`
- `CONNECTOR_DESIGN.md`
- `SECURITY_NOTES.md`
- `DATA_CONTRACTS.md` neu can them draft contract
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `BACKEND_GUIDELINES.md`
- `SECURITY_NOTES.md`
- `DATA_CONTRACTS.md`
- `tasks/CA-036-school-connector-threat-model.md`

## Hanh vi phai giu

- Source app khong doi.
- Khong co request that toi truong.
- Khong co credential/token/cookie nao duoc tao hoac luu.

## Tieu chi hoan thanh

- Co threat model ro.
- Co permission/user-consent model.
- Co data retention/logging policy.
- Co connector interface de sau nay code theo.
- Co acceptance criteria truoc khi trien khai connector.

## Ket qua

- Tao `CONNECTOR_THREAT_MODEL.md` de chot asset, trust boundary, threat, consent, token va logging policy.
- Tao `CONNECTOR_DESIGN.md` de chot connector interface, normalized data, mock portal test va rollout gate.
- Cap nhat `SECURITY_NOTES.md` va `DATA_CONTRACTS.md` bang ranh gioi connector truong that.
- Khong code connector, khong goi API truong, khong tao/lui credential/token/cookie.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Them threat model, connector design, consent/token/logging policy truoc khi code SSO/API truong.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


