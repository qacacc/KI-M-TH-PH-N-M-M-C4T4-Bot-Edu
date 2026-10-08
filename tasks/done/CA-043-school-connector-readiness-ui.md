# CA-043 - School connector readiness UI

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Lam Settings/Privacy hien ro trang thai connector truong that: chua bat SSO/API, da co threat model/design, va can consent/vault/mock portal truoc khi code.

## Duoc phep lam

- Them section thong tin trong Settings.
- Cap nhat Privacy copy.
- Khong them backend/runtime connector.

## Khong duoc lam

- Khong code dang nhap truong.
- Khong goi API/cong thong tin truong that.
- Khong luu token/cookie.
- Khong them dependency.

## File duoc phep sua

- `src/pages/SettingsPage.tsx`
- `src/pages/PrivacyPage.tsx`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`

## Hanh vi phai giu

- App van local-first.
- School account session van Off.
- Secure vault van chua active.

## Tieu chi hoan thanh

- Settings co section connector readiness ro rang.
- Privacy noi ro chua co SSO/API/token trong runtime.
- `npm run check:all` pass.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Settings/Privacy hien ro connector truong chua active va cac gate bao mat truoc khi code SSO/API.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


