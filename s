[1mdiff --cc docs/planning/PROJECT_TASKS.md[m
[1mindex f48d57c,24aaf5d..0000000[m
[1m--- a/docs/planning/PROJECT_TASKS.md[m
[1m+++ b/docs/planning/PROJECT_TASKS.md[m
[36m@@@ -1,18 -1,14 +1,30 @@@[m
  # Project Tasks[m
  [m
[32m++<<<<<<< HEAD[m
[32m +## CA-093.01 - Tìm kiếm công khai phân biệt lỗi và không thấy (2026-10-25)[m
[32m +[m
[32m +- Status: In Progress; runtime và test tự động đã có, chưa manual native/PR review.[m
[32m +- CURRENT: `search_public_school_info` trả `status` success/partial/no_match/error, `failedUrls`, `timedOut`; hạn chót tổng 20s, tối đa 2 lần retry mỗi URL, crawl chạy qua `spawn_blocking`. UI báo "Mất kết nối tới nguồn tài liệu" và nút Thử lại khi lỗi.[m
[32m +- Evidence: `cargo test public_search` PASS 11/11; `tests/search.test.ts` PASS 5/5; `npm run check:all` FAIL chỉ ở bước cuối `npm audit` (3 advisory vite/@vitest/mocker có sẵn, package.json/lock không đổi, đã PENDING trong CA-084); các bước trước PASS: 84 Vitest, layout, Postman, build, cargo check, 49 Rust.[m
[32m +- Giới hạn: manual ngắt mạng trong app desktop chưa chạy; redirect/content-type/cancel/cache vẫn PLANNED trong CA-093.[m
[32m +[m
[32m +## CA-090.01 - SQLite migration và reset an toàn (2026-10-19)[m
[32m +[m
[32m +- Status: In Progress; triển khai native migration/reset đã có evidence, chưa review/merge Jira.[m
[32m +- CURRENT: `init_app` không còn xóa lịch sử chat; SQLite bật foreign key và test migration giữ message cũ; ErrorBoundary chỉ reload; Settings reset có allowlist và confirm.[m
[32m +- Evidence: `npm run check:all` PASS (67 Vitest, 43 Rust, build/layout/Postman/npm audit); manual native/UI chưa chạy.[m
[32m +- Giới hạn: CA-090.02 backup round-trip và xóa DB/assets không thuộc phần CA-090.01 này.[m
[32m++=======[m
[32m+ ## CA-098.01 - REST API project + Postman (2026-10-17)[m
[32m+ [m
[32m+ - Status: In Progress; branch `feat/khiem/ca-098-01-rest-design`.[m
[32m+ - **PLANNED:** loopback API requires `CAMPUS_ASSISTANT_LOCAL_API_TOKEN`; all Postman calls use HTTP Bearer auth. Missing/invalid token returns 401; configuration is not committed.[m
[32m+ - **CONFIRMED (source/tests):** UTH contract gate returns 503 for schedule/exams; profile remains not connected (404). Local response is not UTH fixture evidence. Startup failure leaves desktop running, including the second-instance bind-conflict path; startup log failure is best-effort.[m
[32m+ - **UNKNOWN:** Manual Windows launch/Postman HTTP smoke has not been run. Full `npm run check:all` fails at npm audit advisories after code/test/build stages pass; task remains In Progress.[m
[32m+ - Design/how-to: [REST API contract](../testing/REST_API_DESIGN.md); [Postman README](../../postman/README.md).[m
[32m+ - **CONFIRMED (verification):** `cargo test --manifest-path src-tauri/Cargo.toml api::tests` passed 15 tests; `npm run check:postman` passed 9 checks; `npm run check:all` passed code/test/build/Rust stages but failed at npm audit (2 moderate, 1 high advisories).[m
[32m+ - **UNKNOWN:** Manual Postman local HTTP call and Windows launch not performed; do not mark task Done.[m
[32m++>>>>>>> origin/develop[m
  [m
  ## CA-080 - Setup Postman local (2026-10-10)[m
  [m
