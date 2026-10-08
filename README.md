# Campus Assistant Local

Ung dung desktop local ho tro sinh vien tra cuu tai lieu, thong bao, lich hoc va lich thi mau bang chatbox, chay nhe va khong phu thuoc AI.

## Pham vi v1.0.1

- Tauri + React + TypeScript.
- SQLite local cho settings, session metadata, action log va chat history opt-in.
- JSON local cho mon hoc, tai lieu, thong bao, lich hoc va lich thi mau.
- Bon intent local: `FIND_DOCUMENTS`, `FIND_ANNOUNCEMENTS`, `FIND_SCHEDULE`, `FIND_EXAMS`.
- Dark mode, light mode va accent color.
- Custom titlebar, sidebar hover rail, chatbox trung tam, utility panel, customize panel va privacy page.
- Mo file hoac copy file mau sang `Documents/CampusAssistant/downloads` sau khi xac nhan.
- Lich su chat local la opt-in: mac dinh khong luu raw chat; chi luu khi nguoi dung bat trong trang Lich su tro chuyen.
- Co tab Nhat ky hien thi action log metadata an toan.
- Co lenh nhanh trong chat: `/help`, `/documents`, `/announcements`, `/schedule`, `/exams`, `/files`, `/logs`, `/privacy`, `/clear`.
- Trang File mau hien danh sach metadata tai lieu mau local, khong mo/copy truc tiep.
- Trang Thong bao, Lich hoc, Lich thi, File mau va Nhat ky co tim kiem, loc, sap xep hoac thong ke nhanh tren metadata.
- Chat co starter cards de bat dau nhanh cac tac vu v1.0.1.
- Tab Bo nho thong ke workspace local, mo thu muc downloads va xoa action log metadata co xac nhan.
- Tab Kiem tra tao health report local cho SQLite, file mau, downloads, JSON va cau hinh update.
- Tab Kiem tra co the xuat bao cao chan doan JSON vao downloads cua CampusAssistant.
- Tab Phat hanh gom checklist release local-first cho ban 1.0.1.
- Refactor UI theo huong chat-first voi split-view co the resize/collapse cac panel phu.
- Sidebar trai mac dinh gon nhu rail, hover/focus moi hien day du menu.
- Tab Giao dien cho nguoi dung tuy bien accent, mau nen, panel, mau chu, font, density, opacity panel, skin preset, anh nen local, fit/focus/overlay nen.
- Tab Giao dien dung draft/apply/discard/reset de tranh doi giao dien live lien tuc gay lag.
- Rust health test dung temp root rieng, khong dung truc tiep AppLocalData that cua nguoi dung.

## Khong co trong v1.0.1

- Khong Ollama, OpenAI API, API AI, RAG, embedding, vector database.
- Chua co connector truong production-ready.
- Chua co SSO/session/vault truong production-ready.
- Chua lay API truong that end-to-end; WebView/portal va public admissions search hien o muc experimental/partial.
- Khong Zalo Guide.
- Khong file manager toan he thong.
- Khong xoa, doi ten, di chuyen file.
- Khong chon thu muc tuy y.

## Vung du lieu

Du lieu noi bo:

```text
AppLocalData/
├── database/
├── settings/
├── sessions/
└── logs/
```

Vung tai lieu do ung dung quan ly:

```text
Documents/CampusAssistant/
├── sample-documents/
├── managed-files/
└── downloads/
```

Moi duong dan deu phai duoc chuan hoa va kiem tra nam trong allowlist truoc khi doc, mo hoac sao chep.

## Lenh phat trien

```bash
npm install
npm run dev:web
npm run dev:desktop
npm run dev:app
npm run test
npm run build
npm run check:rust
npm run test:rust
npm run check
npm run check:all
npm run build:installer
npm run build:release
npm run build:dev-launcher
```

`cargo check` phai chay trong `src-tauri`, hoac dung `npm run check:rust` tu thu muc goc du an.
Xem day du tai `DEV_COMMANDS.md`.

## Quy trinh task cho AI

Tu sau v1.0.1, moi thay doi nen di qua task rieng trong `tasks/`.

## Trang thai release freeze 2026-08-02

- Core local app, chat intent rule-based, file safety, action log, chat history opt-in, appearance/theme va cac trang local da co test/build pass.
- Public school/admissions search chi la `CURRENT / LIMITED`, khong duoc xem la connector truong production-ready.
- UTH WebView/portal la experimental/partial; app khong thu mat khau va khong luu token/cookie persistent vault.
- Reward/Minigame dang dong bang trong `CA-064`, chi kich hoat khi user yeu cau ro.

File bat buoc doc truoc khi AI sua code:

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `SECURITY_NOTES.md`
- Task active trong `tasks/CA-XXX-*.md`

File theo loai task:

- UI/UX: `UX_UI_GUIDELINES.md`
- Backend/Rust/SQLite/file system: `BACKEND_GUIDELINES.md`
- Performance/refactor: `OPTIMIZATION_TARGETS.md`

Task index nam tai:

```text
tasks/TASK_INDEX.md
```

Quy tac lam viec:

- Moi lan chi co mot task active.
- AI phai tom tat muc tieu, ngoai scope, file du kien sua va cach test truoc khi sua code.
- Neu can sua file ngoai task, phai dung lai xin duyet.
- Sau khi sua phai chay `npm run check:all`.

## Lenh trong chat

```text
/help       Xem danh sach lenh.
/documents  Bat dau luong tim tai lieu mau.
/announcements Xem thong bao mau local.
/schedule   Xem lich hoc mau local.
/exams      Xem lich thi mau local.
/files      Mo trang file mau.
/storage    Mo thong ke bo nho local.
/health     Kiem tra suc khoe app local.
/release    Xem checklist phat hanh 1.0.1.
/appearance Tuy bien giao dien local.
/logs       Mo tab nhat ky metadata.
/privacy    Mo trang quyen rieng tu.
/clear      Xoa noi dung chat dang hien thi trong phien hien tai.
```

Trong luong `FIND_DOCUMENTS`, khi bot hoi hoc ky co the nhap `hoc ky 1`, `hk 1` hoac chi `1`. Khi danh sach file da hien thi, co the nhap `mo 1`, `mo file 1`, `copy 2` hoac `sao chep file 2`. Nhap `quay lai` de chon lai hoc ky, hoac `huy` de thoat luong hien tai. Khi bot cho xac nhan file, co the nhap `xac nhan`, `dong y`, `ok` de thuc hien, hoac `huy`, `khong`, `cancel` de huy thao tac file.

Composer ho tro `Enter` de gui tin va `Shift+Enter` de xuong dong.
Go `/` trong composer de hien danh sach lenh nhanh. Dung `ArrowUp`/`ArrowDown` de chon lenh, `Enter` de chay lenh dang chon va `Escape` de dong goi y.
Composer hien trang thai flow hien tai va cac nut theo ngu canh nhu `Huy`, `Quay lai`, `Xac nhan`.
Dung `Ctrl+K` de quay ve chat va focus vao composer.
Composer actions tu doi theo state, vi du dang xem danh sach se hien `Mo 1`, `Copy 1`, `Quay lai`.

Khi phat trien desktop, uu tien dung:

```powershell
npm run dev:desktop
```

Lenh nay tu dong giai phong port `5173` truoc khi chay Tauri dev. Neu chay truc tiep `npm run tauri dev`, Tauri config cung se tu dong goi `npm run free:dev-port` truoc khi mo Vite.

## Dev launcher

Trong luc phat trien, dung file:

```text
CampusAssistantLocal-Dev.exe
```

File nay chay `npm run dev:tauri`, giup sua React/CSS thay doi truc tiep trong app qua Vite HMR. Khong can go cai dat va cai lai installer sau moi lan sua UI.

Khong mo `http://127.0.0.1:5173` bang trinh duyet de test app, vi cac Tauri command nhu `invoke` chi hoat dong trong cua so desktop Tauri.

## Kiem tra cap nhat

App ho tro check version qua manifest JSON HTTPS. Mac dinh chua cau hinh URL thi app khong tu goi mang.

Build voi URL manifest:

```powershell
$env:CAMPUS_ASSISTANT_UPDATE_MANIFEST_URL="https://example.com/campus-assistant/update.json"
npm run tauri build
```

Manifest mau:

```json
{
  "version": "1.1.0",
  "required": true,
  "message": "Co ban cap nhat bao mat. Vui long tai ban moi.",
  "downloadUrl": "https://example.com/campus-assistant/CampusAssistantLocal-1.1.0.exe"
}
```

Khi `version` trong manifest lon hon version hien tai, app cu se hien banner yeu cau cap nhat va nut tai ban moi. App chi doc manifest, khong gui hoi thoai, tai lieu, token hay du lieu ca nhan.
