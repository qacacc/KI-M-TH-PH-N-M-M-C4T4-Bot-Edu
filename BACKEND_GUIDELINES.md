# Backend Guidelines

File nay danh cho cac task Rust/Tauri/SQLite/file system.

## Nguyen tac backend

- Local-first.
- Khong proxy credential.
- Khong goi API truong that trong ban 1.0.1.
- Khong luu token, cookie, password, secret neu task active khong cho phep ro.
- Neu task SSO/Vault cho phep luu session, chi duoc luu cookie/token local da ma hoa, co consent, co nut xoa phien va khong gui ve server nha phat trien.
- Khong ghi raw chat hoac noi dung file vao log.
- Khong test bang AppLocalData/SQLite that cua nguoi dung.

## Tauri command hien co

- `init_app`
- `save_setting`
- `list_documents`
- `list_announcements`
- `list_schedule`
- `list_exams`
- `open_document`
- `copy_document`
- `check_for_update`
- `list_action_logs`
- `get_storage_summary`
- `clear_action_logs`
- `open_downloads_folder`
- `get_health_report`
- `export_diagnostic_report`
- `save_theme_background`
- `delete_theme_background`

## Module map hien tai

- `src-tauri/src/lib.rs`: bootstrap `init_app`, dang ky command, test tong hop.
- `src-tauri/src/models.rs`: DTO va payload type.
- `src-tauri/src/data.rs`: load JSON local dong goi trong app.
- `src-tauri/src/db.rs`: schema, default records, settings, action log.
- `src-tauri/src/paths.rs`: root directories, safe relative path, canonical child guard, downloads folder.
- `src-tauri/src/diagnostics.rs`: storage summary, health report, diagnostic export.
- `src-tauri/src/updates.rs`: manifest update check va version compare.
- `src-tauri/src/documents.rs`: list campus data mau, open/copy document.
- `src-tauri/src/theme_assets.rs`: validate, luu va xoa background image app-managed.

Quy tac:

- Khong doi ten command neu task khong cho phep.
- Khong doi shape payload neu task khong cho phep.
- Moi command moi phai co wrapper trong `src/tauriApi.ts` va type trong `src/types.ts` neu can.

## SQLite

Dang dung cho:

- Settings.
- Session metadata.
- Action log metadata.

Quy tac:

- Schema change phai co task rieng.
- Default seed phai idempotent.
- Setting user da doi khong bi ghi de.
- Health/report command khong nen tao du lieu phu neu khong can.
- Test DB phai dung temp root.

## File system

Vung du lieu noi bo:

```text
AppLocalData/
├─ database/
├─ settings/
├─ sessions/
└─ logs/
```

Vung user co the thay:

```text
Documents/CampusAssistant/
├─ sample-documents/
├─ managed-files/
└─ downloads/
```

Quy tac:

- Path user input phai la relative path an toan.
- Phai canonicalize va check nam trong base.
- Phai chan `..`, absolute path, UNC path va symlink escape.
- Open/copy file phai co confirm tu frontend truoc.
- Khong xoa/doi ten/di chuyen file neu task khong cho phep.

## Logging va diagnostic

Action log chi luu:

- action
- documentId neu can
- result
- errorCode/error message than thien
- timestamp

Diagnostic export khong duoc chua:

- raw chat
- noi dung file
- token
- cookie
- password
- secret
- path tuyet doi nhay cam neu khong can

## Update check

- App chi doc manifest neu build co URL.
- Khong gui du lieu user khi check update.
- Hien tai chua auto download/install.

## Backend toi uu nen lam

1. Tach `lib.rs` thanh module nho sau khi co task rieng.
2. Giu public Tauri command stable khi tach module.
3. Them test cho moi path/file behavior moi.
4. Tach pure function de test duoc khong can Tauri runtime.
5. Khong toi uu theo cam tinh neu chua co dau hieu do duoc.

## Backend khong duoc lam neu chua co threat model

- Connector truong that.
- Dang nhap portal truong.
- Luu token/cookie/session.
- Zalo production bot.
- Dong bo cloud.
- Backup/restore chua secret.

## Moc hoan thanh cho connector truong

Mot connector truong chi duoc bao "xong, moi user test" khi dat du cac muc lien quan:

- Public mode: chon truong -> hoi tu khoa -> tim tren nguon cong khai allowlist -> tra snippet/URL nguon hoac thong bao khong thay.
- Auth mode: chon truong -> bam dang nhap cong truong -> mo dung URL chinh thuc -> user tu dang nhap tren site truong -> app nhan trang thai thanh cong ma khong nhan mat khau.
- Vault mode: cookie/token neu co chi luu local da ma hoa, co consent truoc khi luu, co nut xoa phien, khong log gia tri nhay cam.
- Data mode: API ca nhan chi goi sau khi co session hop le, loi het phien phai yeu cau dang nhap lai.
- Test: co test pure function/command cho allowlist URL, redact log, vault metadata, expired session va fallback public.
