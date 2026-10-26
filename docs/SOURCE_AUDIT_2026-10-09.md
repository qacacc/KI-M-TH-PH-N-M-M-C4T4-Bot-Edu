# Audit tổng thể source - 2026-10-09

- Baseline: `f5c00558b73da85ac44117a54ade7015de45998a`, source version 1.0.1.
- Phạm vi: inventory 64 file TS/TSX/Rust/CSS trong src và src-tauri/src (30 TS, 16 TSX, 17 Rust, 1 CSS), cấu hình build/desktop, tools, task và docs; đọc sâu các boundary/lifecycle/persistence/nguồn dữ liệu.
- Đây là audit tĩnh và automated local, không chứng minh mọi dòng code/mọi nhánh runtime đã chạy. Không phải pentest hoặc nghiệm thu production.
- Không sửa runtime, schema, collection Postman; không nhập token, không gọi portal/API trường, không sử dụng browser/computer use.
- User staged Postman được giữ nguyên. Không xem request trong collection là contract verified.
- CONFIRMED = source/lệnh có evidence; ASSUMED = hậu quả/race cần test runtime riêng; UNKNOWN = native/API/visual chưa xác minh; PLANNED = task chưa triển khai.
- P1: nguy cơ mất/sai dữ liệu hoặc capability/nguồn tin không đúng; P2: cải thiện độ bền/maintainability/kiểm thử. Chưa có exploit P0 được tái hiện trong audit này; điều đó không chứng minh không tồn tại P0.

## Kết luận

Core local đã có implementation và green baseline, nhưng chưa đủ để coi dự án hoàn thiện. Connector UTH vẫn QUARANTINED; thông báo/tài liệu/bảng điểm chưa lấy từ trường. Cài đặt còn dữ liệu public giả; lịch sử/GPA/thùng rác/backup có lỗi hoặc rủi ro dữ liệu. Roadmap hiện có nhiều claim COMPLETED không khớp task/source.

Ưu tiên sửa correctness/data safety trước refactor. Không nối AI/BYOK, game, reward hoặc mini pet vào đợt ổn định này.

## Impact analysis cho lần audit và lập task

| Mục | Phạm vi |
| --- | --- |
| Feature tác động | Governance / task planning; không đổi feature runtime |
| Entry point | docs/SOURCE_AUDIT_2026-10-09.md, TASK_INDEX và README pending |
| CURRENT -> TARGET | Source hiện tại -> báo cáo có evidence và Proposed specs; không triển khai fix |
| State trước/sau | Không Active -> vẫn không Active; 13 spec Proposed mới |
| Dữ liệu đọc | Source, config, docs, tests, task metadata |
| Dữ liệu ghi | Báo cáo/spec/index/docs; không DB/user storage |
| Dependency | CA-080/081 giữ scope contract/connector, CA-084 dùng ID reserved release, CA-085 vẫn Frozen |
| Invariants | DATA/SEC/UI/FILE không đổi; DOC ghi giới hạn chính xác |
| Regression | Link/count/docs có thể lệch; kiểm validator và git diff |
| Minimal plan | Audit -> Proposed task -> đồng bộ registry -> check; không sửa logic |
| Verification | check:all, fmt check, strict Clippy, targeted Node probes, task/link/status validator |
| Giới hạn | Native/UI/manual/API/security runtime không chạy lại; không claim fix triệt để |

## Coverage theo miền

| Miền | CURRENT từ source | Kết luận / tracking |
| --- | --- | --- |
| App shell/bootstrap/navigation | React/Tauri, preview fallback, StrictMode | Lifecycle có rủi ro bootstrap bị bỏ; CA-086 |
| Intent/composer | Rule-based, NEEDS_SUBJECT, entry submit thống nhất | Không AI thật; test IME, reentrancy và async cần CA-087/096 |
| Chat history | SQLite opt-in, Rust privacy guard, rename/pin/archive/delete | Có implementation nhưng session/atomicity/error/accessibility chưa đủ; CA-087 |
| Lịch học/thi | Cache read bị gate CONTRACT_UNVERIFIED; không mẫu trên trang chính | Chưa sync thật; CA-080/081. ICS sai timezone; CA-092 |
| Thông báo/tài liệu | Trang chính mở nguồn website/LMS, mẫu tách tab | Chưa ingest dữ liệu trường; contract từng miền vẫn UNKNOWN, CA-080 coverage |
| GPA | Nhập tay v2, thang quy đổi tham khảo | Không bảng điểm trường; lỗi recovery/draft/average, CA-088 |
| School/profile/session | Profile tự khai; browser mở portal không tạo session app | Settings public mock/capability wording khác SchoolPage; CA-089 |
| Public search | Native crawl allowlist và xếp snippet | All failure biến no-match, budget/parser/redirect cần CA-093 |
| File/trash | Managed workspace, canonical guard cho file actions, native metadata | Physical/DB recovery và mock fallback chưa an toàn; CA-091 |
| Theme/layout/preset | Draft/apply/undo, auto token removal, resize local | Hai preset stores, silent save, shared current asset; CA-090/095/096 |
| Settings/backup/reset/privacy | Config allowlist backup, confirm ở nhiều destructive actions | Keys lệch/partial reset/error-boundary clear thiếu confirm; CA-090 |
| Diagnostics/logs/health | Metadata report và managed directory stats | Không health của connector thật; chưa test disk-failure UI, CA-084/096 |
| Release/update | Manifest tùy cấu hình; installer lịch sử | Checklist PASS tĩnh và sample-required không đúng current; CA-084 |
| Desktop security | Remote auth gate, capability main only | CSP null/broad create quyền/legacy bridge cần hardening; CA-094 |
| Docs/task/tooling | check:all green, nhiều static string assertions | Roadmap/tracking bị lệch, fmt/Clippy fail; CA-097/096 |
| Game/reward/mini pet | Frozen, không có runtime core được kích hoạt | Giữ CA-064 và CA-085 trong hoan-lam |

## Findings: dữ liệu và lifecycle

### A01 - P1 - Bootstrap không an toàn với StrictMode
- CONFIRMED source: `src/main.tsx:55` bật StrictMode; `src/App.tsx:378` ref chặn effect setup lần sau; cleanup `src/App.tsx:463` đặt isCancelled true và promise kiểm cờ.
- Trace tĩnh: setup1 -> cleanup1 -> setup2 return vì ref=true -> promise1 bị loại. Runtime React mount/deferred chưa được test trực tiếp trong audit; cần reproducer CA-086, không bỏ StrictMode để che.
- `src/App.tsx:371` drop effect dependency không có bootstrap dù reader dùng tại dòng322. Init lỗi tạo bootstrap fallback với đường dẫn giả; cần state degraded/retry riêng.
- Tracking: CA-086.

### A02 - P1 - Phiên chat có thể lệch khi load/create/async
- CONFIRMED: `src/App.tsx:573` đổi active ID trước await load; catch dòng587 thay welcome; `src/App.tsx:1140` create lỗi set default; sidebar new-chat dòng1397 không khóa theo isBusy.
- ASSUMED hậu quả concurrent: response A có thể đè B; callback giữ session cũ, thao tác khi chuyển phiên có thể lưu khác phiên UI. Cần deferred tests, không coi race đã chạy E2E.
- Tracking: CA-087.

### A03 - P1 - Append lịch sử không atomic/thiếu validation
- CONFIRMED: `src-tauri/src/db.rs:320` insert rồi update timestamp không transaction; không kiểm role/session/affected rows; session ID dòng387 dùng timestamp_millis; FK khai báo dòng91 nhưng source không bật foreign_keys.
- ASSUMED: lỗi update/retry có thể để message nửa thành công/nhân đôi; concurrent ID có thể collision; khả năng orphan cần test cấu hình SQLite thực. Không sửa schema hoặc bật FK trước migration fixture.
- Tracking: CA-087.

### A04 - P1 - Cleanup lịch sử tự động và lỗi CRUD bị che
- HISTORICAL BASELINE (2026-10-09, đã được remediation bởi CA-090.01 ngày 2026-10-19): `src-tauri/src/lib.rs:37` từng gọi clear_chat_history; `src-tauri/src/db.rs:208` từng DELETE toàn bộ messages nếu marker chatHistoryClearedV2 chưa true, không consent ở UI. Đây là cleanup một lần theo marker, không phải xóa mỗi lần mở app.
- CURRENT: `init_app` không còn gọi cleanup lịch sử; helper xóa toàn bộ lịch sử đã được loại bỏ. Migration SQLite giữ dữ liệu cũ và bật foreign keys; reset UI chỉ xóa các key cấu hình được allowlist. Phần CRUD/error handling bên dưới vẫn là finding độc lập.
- `src/pages/ChatHistoryPage.tsx:77` lỗi load chỉ console; CRUD catch tương tự; delete finally dòng164 đóng modal kể cả lỗi; chưa báo App active session đã bị xóa. Archive filter dòng184 không có UI restore.
- Dialog dòng384 có aria-modal nhưng chưa focus trap/restore; card-main dòng241 là click div không keyboard. Composer App.tsx:644 chưa guard IME composing.
- Tracking: CA-087. Không đổi CA-066/067 lịch sử thành Done chỉ nhờ audit.

### A05 - P1 - GPA phục hồi/điểm chưa nhập
- CONFIRMED: `src/components/GpaCalculator.tsx:34` cờ storageFailed không cập nhật; recovery dòng75 chỉ setSubjects; row mới dòng46 default F/0/tín chỉ1 được reduce dòng83 tính ngay.
- `src/gpaData.ts:7` missing trả []; recovery có thể thay bảng bằng [] khi không có v1. Targeted Node đã chứng minh parse(null) = [].
- Tracking: CA-088; không tự áp thang điểm trường chưa verified.

### A06 - P1 - Public mock vẫn trình bày như tải từ trường
- CONFIRMED: `src/schoolConnector/schoolVault.ts:19` MOCK_PUBLIC_DOCS; getter dòng200 trả bảng cứng. `src/pages/SettingsPage.tsx:91` dùng getter, dòng414 nói tự động tải công khai, render ngày/summary không gắn sample.
- Backend public search thật là luồng khác; không được gom cả hai thành dữ liệu thật hoặc gom cả project thành UI giả.
- Auto-sync dòng486 chỉ update config; `rg autoSync src` chỉ thấy type/default/settings, không scheduler.
- Metadata session frontend không phải secret vault; logout settings dòng144 chỉ revoke local metadata. `src/schoolProfile.ts:132` cleanup dựa theo danh tính cụ thể không phù hợp policy tổng quát.
- Tracking: CA-089; danh tính cụ thể không được chép vào report/fixture mới.

### A07 - P1 - Backup bỏ active keys và không đủ fault handling
- CONFIRMED: `src/utils/backupRestore.ts:12` allowlist appearance key cũ và GPA v1; active keys là `src/hooks/useAppearanceDraft.ts:40`, `src/gpaData.ts:3`. Layout/preset keys cũng không có.
- Targeted Node: có active appearance + GPA v2 trong storage nhưng exported data keys = []; storage getItem throw ở snapshot dòng84 văng exception trước try.
- Import chỉ kiểm bundle shape/value string, chưa validate schema từng miền; rollback write có thể throw, chưa atomic với quota. UI thành công không hydrate state hoặc reload.
- Tracking: CA-090. Backup config không được tự mở rộng raw chat/PII/secret.

### A08 - P1 - Reset mô tả xóa toàn bộ nhưng chỉ clear localStorage
- CONFIRMED: `src/pages/SettingsPage.tsx:209` reset clear localStorage dòng215; không xóa SQLite/history/cache/assets; reset draft không đồng bộ toàn state đang giữ.
- `src/main.tsx:38` ErrorBoundary clear localStorage không confirm, làm mất GPA/profile/preset thay vì reload an toàn.
- Tracking: CA-090. Cần tách reset config / delete data; không implement xóa rộng trước user duyệt phạm vi.

### A09 - P1 - Thùng rác có khoảng trống recovery
- CONFIRMED: `src-tauri/src/trash.rs:77` rename file trước open_db/schema dòng81-82. Các failure DB open/schema sau move nằm ngoài insert compensation, có thể để file không metadata.
- Restore dòng215 move trước DELETE metadata; failure/restart chưa journal. Trash schema dòng20 không theo user_version. Path source từ metadata trash_storage_name chưa ensure_child_path của trash root.
- `src/pages/FilesPage.tsx:35`, dòng109/129 catch chuyển sang localStorage list/restore/empty; frontend có thể ẩn dữ liệu thật khi native thất bại. `src/utils/trashBin.ts:42` restore chỉ xóa entry, không restore file.
- Empty partial native dòng230 trả count, UI nói đã dọn sạch; chưa số thất bại.
- Tracking: CA-091; DB/IO failure và symlink exploitation chưa chạy riêng, giữ nhãn static/risk, không claim mất file thật đã xảy ra.

### A10 - P1 - ICS sai timezone và tự tạo phạm vi
- CONFIRMED: `src/utils/calendarExporter.ts:42` Date.UTC coi giờ trường là UTC; generate xuất Z. Probe fixture 2026-10-10 08:00 cho DTSTART:20261010T080000Z; nếu Asia/Ho_Chi_Minh, đúng là 01:00Z hoặc 08:00 với TZID.
- `src/utils/calendarExporter.test.ts:64` đang khẳng định 08:00Z, nên green test giữ lỗi. Lịch học dòng104 tự COUNT=15 và tuần hiện tại, không ngày hiệu lực thật.
- Chức năng nguồn học tập đang gate: lỗi serializer đã tái hiện bằng fixture, chưa nói user đang export lịch trường thật sai.
- Tracking: CA-092.

### A11 - P1 - Public search lỗi trở thành không tìm thấy
- CONFIRMED: `src-tauri/src/public_search.rs:432` mọi fetch lỗi continue; cuối hàm vẫn Ok/results-empty với message no-match. Không phân biệt all-failed và no-match thật.
- Crawler tối đa12 trang tuần tự, timeout8s mỗi page dòng388, không query deadline/cancel/cache; search có thể mất nhiều chục giây. Latency thực mạng chưa đo.
- HTML lower/slice và URL string parsing dòng169/339/313 cần structured parser, Unicode/redirect fixtures. Redirect off-allowlist là UNKNOWN tới khi có HTTP repro, không cáo buộc SSRF đã xác minh.
- sanitize_query hiện lọc token numeric/email nhưng query dùng để match local HTML; request fetch URL cố định/candidate, không nối query vào URL. Không có evidence gửi nguyên query/PII tới trường trong flow này.
- Tracking: CA-093.

## Findings: hardening, maintainability và tài liệu

### A12 - P2 - Theme persistence/preset ownership
- CONFIRMED: `src/hooks/useAppearanceDraft.ts:483` saveSetting errors bị bỏ; storage write dòng225 cũng không feedback. `src/pages/AppearancePage.tsx:96` any[] + JSON.parse chưa validate.
- Hai preset key/schema ở AppearancePage dòng155 và presetStore dòng10; UI hiện dùng owner thứ nhất, không tự hợp nhất bằng xóa key.
- `src/App.tsx:1110` mọi ảnh ghi themes/current; preset giữ URL có thể tham chiếu file bị overwrite/xóa. Đây là rủi ro source, cần test hai preset/asset lifecycle.
- Tracking: CA-095/090.

### A13 - Security hardening cần xác minh, không exploit confirmed
- CONFIRMED cấu hình: `src-tauri/tauri.conf.json:29` CSP null; capabilities/default.json main có window/webview create quyền. Auth native CA-083 gate trước IO.
- Legacy guessed JWT poller `src-tauri/src/connectors/connector_engine.rs:27` và frontend wrapper `src/tauriApi.ts:168` còn source nhưng auth entry gate; không mô tả là đang thu token thành công.
- Theme roots chưa canonicalized trong `src-tauri/src/theme_assets.rs:50`; cần symlink/native test. Có regex ID chặn traversal lexical, không đủ chứng minh managed-root an toàn mọi tình huống.
- Tracking: CA-094. Threat model/CSP/native authority/OS vault thực tế UNKNOWN; không tự bật bridge hoặc cấp remote broad IPC.

### A14 - P2 - Core quá tập trung và test chủ yếu helper/static
- CONFIRMED inventory: App.tsx2005 dòng, styles.css6571 dòng; nhiều CA override/!important và raw invoke ngoài wrapper.
- `tools/layout-regression-check.cjs:13` contains chuỗi; tests hiện 9file chủ yếu helpers, chưa suite React component/native E2E. Deferred portal test `src/tauriApi.test.ts:8` dùng mockResolvedValue nên không chứng minh trạng thái trước resolve.
- cargo fmt --check FAIL (db.rs/public_search.rs); strict Clippy FAIL needless_borrow tại connector_engine.rs:145. check:all chưa gồm hai gate này/lint frontend.
- Tracking: CA-096. Không đề xuất rewrite lớn, chỉ extract từng miền + regression trước/sau.

### A15 - P1 - Roadmap và Done evidence không nhất quán
- CONFIRMED: docs/ROADMAP.md ghi M1-M3 COMPLETED/fixture-E2E trong khi UTH gate và CA-080/081 Proposed. Các ID CA đã dùng lại cho mục tiêu khác.
- Catalog PHYSICAL_TRASH/PUBLIC_ADMISSIONS_SEARCH vẫn None/STABLE; mâu thuẫn findings ở trên. CA-060 index historical Done/detail In Progress; CA044..053 thiếu Status; CA063/064 duplicate specs.
- Tracking: CA-097. Audit này đặt cảnh báo precedence; chưa tự đổi trạng thái/renumber task lịch sử hay hoàn tất reconciliation.

### A16 - Release readiness không phản ánh runtime
- CONFIRMED: `src/pages/ReleasePage.tsx:24` bắt bootstrap sample lists không rỗng nhưng init hiện Vec::new cho nguồn học tập; dòng49/54/59 PASS tĩnh.
- Installer CA077 là artifact lịch sử, không build mới lần này. Update manifest/config/download verification chỉ source, chưa test installed upgrade/rollback.
- Tracking: CA-084 (ID reserved đúng mục đích release); auto-update engine và ký số chưa tự triển khai.

### A17 - Connector nền cần sửa trước mở gate (không phải lỗi đang live)
- CONFIRMED: `src-tauri/src/connectors/sync_service.rs:21` chỉ delete snapshot khi list nonempty, có thể giữ records đã xóa nếu snapshot empty hợp lệ; delete scopes student không source/semester; PK id toàn bảng có nguy cơ đụng account/source.
- Validators models.rs:60 chỉ kiểm dấu ':'/'-', chưa calendar/time semantic và không gọi trong write. Delete_connector_data dòng248 là nhiều DELETE không transaction; disconnect status bỏ lỗi.
- CA-083 đang gate runtime sync/read, nên không claim production sync đang xảy ra.
- Tracking: CA-081 cập nhật evidence; CA-080 phải xác minh contract/phạm vi trước triển khai.

## Task backlog canonical

13 spec mới đều Proposed, chưa Active; việc lập task không đồng nghĩa fix đã triển khai.

| ID | Ưu tiên | Scope |
| --- | --- | --- |
| [CA-084](../tasks/chua-xong/CA-084-release-audit-security-checklist.md) | P1 | Nghiệm thu và phát hành từ source đã sửa |
| [CA-086](../tasks/chua-xong/CA-086-app-bootstrap-lifecycle.md) | P1 | Sửa lifecycle khởi tạo và trạng thái degraded |
| [CA-087](../tasks/chua-xong/CA-087-chat-session-integrity.md) | P1 | Toàn vẹn phiên chat và lưu lịch sử |
| [CA-088](../tasks/chua-xong/CA-088-gpa-persistence-calculation.md) | P1 | Sửa lưu, phục hồi và tính GPA |
| [CA-089](../tasks/chua-xong/CA-089-school-ui-source-truth.md) | P1 | Nguồn dữ liệu và trạng thái trường trung thực |
| [CA-090](../tasks/chua-xong/CA-090-backup-reset-data-safety.md) | P1 | Sao lưu và reset đúng phạm vi, không mất dữ liệu |
| [CA-091](../tasks/chua-xong/CA-091-trash-recovery-native-owner.md) | P1 | Thùng rác an toàn và một nguồn dữ liệu |
| [CA-092](../tasks/chua-xong/CA-092-calendar-timezone-validity.md) | P1 | Xuất lịch đúng múi giờ và phạm vi học kỳ |
| [CA-093](../tasks/chua-xong/CA-093-public-search-error-budget.md) | P1 | Tìm kiếm công khai: lỗi, thời gian và nguồn tin |
| [CA-094](../tasks/chua-xong/CA-094-desktop-ipc-hardening.md) | P1 | Gia cố desktop IPC và filesystem boundary |
| [CA-095](../tasks/chua-xong/CA-095-appearance-persistence-assets.md) | P2 | Theme: persistence, draft và ownership ảnh nền |
| [CA-096](../tasks/chua-xong/CA-096-incremental-clean-code-tests.md) | P2 | Clean code tăng dần và test hành vi |
| [CA-097](../tasks/chua-xong/CA-097-governance-source-reconciliation.md) | P1 | Đối chiếu roadmap, task và feature với source |

Giữ CA-080 (contract) và CA-081 (parser/sync) riêng. Không tạo hệ CHAT-xx/DATA-xx song song. CA-084 vốn reserved release; CA-085 mini pet vẫn Frozen.

## Thứ tự thực hiện đề xuất (PLANNED)

1. CA-086 + CA-090: bootstrap và an toàn recovery/reset; CA-097 đối chiếu governance thực hiện docs riêng.
2. CA-087 + CA-088 + CA-091: lỗi dữ liệu chat/GPA/file; viết failure tests trước sửa.
3. CA-089 + CA-093: bỏ mock capability, cải thiện nguồn công khai; CA-094 hardening trước mở connector.
4. CA-080 -> CA-081: contract thật với consent và fixture loại PII; không bypass gate UNKNOWN. Mở từng miền đã verified, không bật mọi miền đồng loạt.
5. CA-092 + CA-095: calendar chính xác, theme/preset bền vững.
6. CA-096: refactor nhỏ đã có tests, format/lint/behavior gates.
7. CA-084: native/visual/install/upgrade evidence trên commit cuối, phát hành đúng scope.

Các task Proposed phải có impact analysis và được duyệt từng scope triển khai; không tự chạy toàn backlog.

## Evidence đã chạy

| Lệnh | Kết quả |
| --- | --- |
| rg --files src src-tauri/src tools docs tasks | Inventory source/tasks/docs |
| Get-ChildItem source theo extension | 64 file: 30TS,16TSX,17Rust,1CSS |
| rg functions/storage/invoke/catch/mocks/capabilities | Line references như findings; không scan/export secret values |
| npm run check:all | PASS: 62Vitest/9files, layout, tsc/Vite, cargo check,39Rust,audit0 |
| cargo fmt --manifest-path src-tauri/Cargo.toml -- --check | FAIL: formatting db.rs/public_search.rs; không chạy formatter ghi file |
| cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings | FAIL: needless_borrow connector_engine.rs:145 |
| Node TypeScript transpile + VM probes (dưới đây) | Serializer/missing legacy/backup omission/storage throw tái hiện |
| Task/link/status validator, git diff --check | PASS: 68 task, 13 spec mới Proposed, liên kết task mới hợp lệ; không lỗi whitespace |
| git diff --name-only -- src src-tauri tools package.json package-lock.json vite.config.ts | Rỗng: không đổi runtime/config/test tooling |
| git ls-files --stage -- .postman Campus_Assistant_API.postman_collection.json postman | Khớp baseline index trước audit: giữ nguyên staged Postman của user |

Probe đọc source, chạy helper với fixture không PII, không ghi file/user storage:

```powershell
@'
const fs=require("fs"),ts=require("typescript"),vm=require("vm");
function load(file,globals={}){
  const exports={};
  const js=ts.transpileModule(fs.readFileSync(file,"utf8"),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js,{exports,Date,console,...globals}); return exports;
}
const cal=load("src/utils/calendarExporter.ts");
const ics=cal.generateExamIcs([{id:"audit",subjectName:"Fixture",
  examDate:"2026-10-10",startTime:"08:00",durationMinutes:60,room:"Test",format:"Test"}]);
console.log(ics.match(/DTSTART:[^\r\n]+/)[0]);
console.log("GPA missing:",load("src/gpaData.ts").parseGpaSubjects(null));
const store=new Map([["ca_gpa_calculator_manual_v2","[]"],
  ["campus-assistant-appearance",'{"fontScale":1}']]);
const backup=load("src/utils/backupRestore.ts",{localStorage:{
  getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
console.log("Backup keys:",Object.keys(JSON.parse(backup.exportLocalAppDataJSON()).data));
try {
  load("src/utils/backupRestore.ts",{localStorage:{getItem(){throw Error("blocked")}}})
    .importLocalAppDataJSON('{"format":"campus-assistant-backup","schemaVersion":1,"data":{}}');
} catch { console.log("Storage blocked: exception before import try"); }
'@ | node
```

Observed: DTSTART:20261010T080000Z; GPA missing=[]; Backup keys=[]; exception trước import try.

## Chưa xác minh

- Đăng nhập/SSO/token/cookie/API portal/LMS và fixture trường thật; không nhận/gửi credentials.
- Native WebView/capability/CSP/OS filesystem fault injection, DB concurrent/locked disk và installed upgrade.
- Manual visual mới, keyboard/screen reader/dialog behavior trên app thật; ảnh lịch sử không thay evidence mới.
- Toàn bộ Rust dependency advisories/licensing/SBOM/signing; npm audit0 chỉ áp npm dependency.
- Không biết domain parser nào trường thật sử dụng, timezone/học kỳ/date-range contract thực; chỉ nêu assumption giờ Việt Nam cho fixture.
- Postman staged duplicates/secret hygiene cần CA-080, không tự commit hay sửa các collection user.
