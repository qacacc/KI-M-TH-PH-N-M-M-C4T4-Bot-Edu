# CA-080 - Xác minh hợp đồng API trường bằng Postman

- Status: In Progress
- Priority: P0
- Created: 2026-10-08
- Type: API contract verification
- Dependencies: CA-036, CA-054; kế thừa gate bảo mật, không mở lại task đã Done.

## Mục tiêu

Xác minh request và response thật trước khi sửa connector Rust. Postman là công cụ kiểm thử HTTP API trường, không phải thành phần runtime hoặc cầu nối Tauri IPC.

## Truth check

Audit 2026-10-09: các tham chiếu parser uth.rs dưới đây là baseline trước CA-083, không còn parser runtime hiện tại. Source hiện gate CONTRACT_UNVERIFIED. Request/collection chưa được chạy hoặc xác minh trong audit; không coi collection là contract. Coverage Announcements/Documents/Grades/LMS vẫn UNKNOWN, không lấy mock thay dữ liệu thật.

- CONFIRMED (setup 2026-10-10): JSON chuẩn có 3 probe GET, Schedule dùng SCHEDULE_DATE, guard/test scripts cấp collection. Ba YAML mirror tự sinh giữ nguyên workspace IDs; Copy 2 là bản import mới trong Desktop, không thay thế dữ liệu cũ.
- CONFIRMED: token chỉ là tham chiếu Local Vault; template không secret, live/consent/request-reviewed mặc định false. JSON tắt redirect/cookie jar; settings thực tế trên Postman chưa manual verified.
- CONFIRMED: uth.rs hiện trả CONTRACT_UNVERIFIED; tham chiếu parser dòng190 là lịch sử trước CA-083, không còn mapping runtime.
- UNKNOWN: tính hợp lệ của endpoint, method, cơ chế Bearer, tham số ngày, response envelope và kiểu dữ liệu tại trường. Có request trong source không chứng minh API hoạt động.
- UNKNOWN: API thông báo, tài liệu, bảng điểm và cơ chế truy cập LMS. Chưa được tự tạo endpoint.

## Phạm vi

- Xác định collection chuẩn và cách đồng bộ JSON/YAML; xử lý bản Copy chỉ sau khi xác minh không có nội dung riêng, giữ bằng chứng rollback.
- Đổi ngày cố định thành `SCHEDULE_DATE`; đặt `BASE_URL` theo host trường đã xác minh.
- Token chỉ dùng trong vùng bí mật cục bộ được xác minh không export/sync; không ghi vào collection, Git, log hoặc screenshot. Nếu chưa xác minh cách lưu bí mật của công cụ, dừng bước nhập token.
- User đăng nhập trực tiếp trên portal chính thức và chủ động cho phép kiểm thử tài khoản của mình. Không yêu cầu gửi mật khẩu/token trong chat; không mở quyền IPC chung cho remote WebView.
- Ghi method, URL, query, cơ chế xác thực, status, Content-Type, schema và trường bắt buộc cho từng request đã kiểm chứng.
- Thêm test response JSON, business error, kiểu dữ liệu, thiếu field; phân biệt `200 + HTML login`, unauthorized, expired session và danh sách rỗng hợp lệ.
- Tạo fixture đã loại PII và secret, giữ cấu trúc/kiểu dữ liệu phục vụ parser. Fixture lỗi có thể tổng hợp nhưng phải ghi rõ nguồn synthetic.
- Lập bảng coverage: Profile, Schedule, Exams, Announcements, Documents, Grades; từng miền có trạng thái Verified hoặc Unknown và evidence. Các miền Unknown vẫn chưa hỗ trợ.

## File dự kiến cho triển khai

- `Campus_Assistant_API.postman_collection.json`
- `postman/collections/` và `.postman/resources.yaml` nếu cần đồng bộ collection chuẩn.
- `docs/testing/UTH_API_CONTRACT.md` (mới).
- `src-tauri/tests/fixtures/uth/` (mới, JSON đã loại dữ liệu cá nhân).
- `postman/scripts/`, `postman/README.md`, environment template không secret.
- `tools/sync-postman.cjs`, `tools/check-postman.cjs`, `package.json` (offline gate), `.gitignore`.
- Task này, `tasks/TASK_INDEX.md`, `docs/planning/PROJECT_TASKS.md`.

## Không thuộc phạm vi

- Không sửa runtime React/Rust, tạo server HTTP nội bộ hay thay đổi SQLite.
- Không coi request thành công trong Postman là xác nhận WebView/login/SQLite/UI đã hoạt động end-to-end.
- Không tự suy ra lịch thi từ lịch học nếu chưa có bằng chứng nghiệp vụ.

## Tiêu chí Done

- [x] Có một nguồn collection chuẩn; giải thích rõ quan hệ JSON/YAML và bản Copy (README + check drift).
- [x] Ngày request tham số hóa; setup chỉ chứa vault reference, template không secret; chưa export account thật.
- [ ] Profile/Schedule có evidence request thật và fixture đã loại PII, hoặc task giữ chưa hoàn thành nếu không xác minh được.
- [ ] Lịch thi được xác minh bằng endpoint riêng hoặc bằng cấu trúc lịch học có marker được chứng minh; nếu Unknown, ghi blocked, không báo Done toàn bộ.
- [ ] Có test cho response thành công, rỗng hợp lệ và lỗi; kết quả chạy thực tế được ghi lại, không chỉ đếm script.
- [ ] Các miền dữ liệu chưa xác minh được ghi Unknown, không mô tả là runtime đã hỗ trợ.
- [ ] Governance đồng bộ; chạy `npm run check:all` trước khi chuyển Done theo quy tắc Task Index.

## Evidence commands

```powershell
Get-Content -Raw Campus_Assistant_API.postman_collection.json | ConvertFrom-Json
rg -n 'SCHEDULE_DATE|"event"|"listen"|getSummaryProfile|lichhoc|lichthi' Campus_Assistant_API.postman_collection.json
rg -n 'CONFIRMED|UNKNOWN|fixture|Content-Type' docs/testing/UTH_API_CONTRACT.md
npm run check:all
```

Kết quả mong đợi: JSON hợp lệ, ngày là biến, test script tồn tại và đã chạy; contract có nguồn evidence và giới hạn. Lệnh `rg` chỉ chứng minh nội dung file, không xác minh API ngoài hệ thống. Chạy collection trong Postman và ghi status/test count/thời điểm với dữ liệu đã loại PII; không yêu cầu CLI mới nếu chưa có.

## Trạng thái hiện tại

CURRENT: setup local đã triển khai; 29 kiểm tra Node VM synthetic PASS qua npm run check:postman. Desktop đã import JSON collection và environment, chọn environment khóa và mở Scripts kiểm tra guard; bản Copy 2 giữ dữ liệu workspace cũ. Chưa gửi request trường, chưa tạo fixture thật, chưa kiểm Vault/live sandbox. Contract/business schema/auth vẫn UNKNOWN; CA-080 giữ In Progress, không mở connector Rust.

Impact scope: đọc collection/scripts/docs; ghi JSON/YAML/template/tools/docs và script npm. Không React/Rust/schema/SQLite/credentials/network trường. Unknown auth/schema là blocking cho live/parser, không blocking việc tạo probe mặc định khóa. Không sửa hoặc commit CA-086 đang dở.

## Verification - setup local 2026-10-10

| Claim / evidence | Lệnh đã chạy | Kết quả |
| --- | --- | --- |
| JSON/date/Vault/settings, collection JSON:14/27/54 | rg -n "vault:|SCHEDULE_DATE|prerequest|followRedirects|disableCookies" Campus_Assistant_API.postman_collection.json | 3 requests + 2 scripts, không token value |
| Guard/transport scripts, postman/scripts/uth-before-request.js:1 và uth-after-response.js:1 | npm run check:postman | PASS 29 Node VM checks, synthetic, không HTTP |
| Một nguồn JSON, 3 mirrors, tools/sync-postman.cjs:1 | npm run sync:postman rồi npm run check:postman | Đồng bộ, không drift; format scripts/settings đối chiếu YAML Desktop |
| Không đưa response/environment cá nhân vào Git, .gitignore | git check-ignore postman/private/raw-response.json postman/personal.postman_environment.json postman/UTH.local-template.postman_environment.json | 2 private paths ignored; template không ignored |
| Baseline ứng dụng + gate Postman | npm run check:all | PASS 65 Vitest/39 Rust/29 Postman/layout/build/cargo check/npm audit0 |
| Whitespace | git diff --check | PASS sau sửa generator blank lines |

Done gate chưa đạt: response thật Profile/Schedule/Exams, business schema/empty/error, fixture đã loại PII và live Desktop test chưa có. Tiêu chí test response chỉ đạt transport synthetic, không tick như API trường verified. User đã yêu cầu cập nhật Git bot-edu trong lượt setup Desktop; commit chỉ scope Postman/docs, không CA-086. Kết quả 65 Vitest bao gồm 3 test CA-086 chưa commit.
