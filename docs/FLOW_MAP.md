# FLOW MAP - CAMPUS ASSISTANT LOCAL

## CA-103 - Local REST API + Postman

### Runtime Status: `CURRENT / LOCAL LOOPBACK`

```text
1. Desktop app starts Rust; `api::start()` reads `CAMPUS_ASSISTANT_LOCAL_API_TOKEN` as a best-effort service.
2. Missing/invalid token, thread/runtime failure, or port bind failure disables REST only; Tauri desktop startup continues. With two app instances, the first listener owns `127.0.0.1:47821`; the second logs only a generic conflict and continues without a listener.
3. Postman sends HTTP to `/api/v1/*` with `Authorization: Bearer {{API_TOKEN}}`; missing/invalid tokens return `401` before route processing.
4. Query deserialization failures become `400 VALIDATION_ERROR`; internal read/serialization failures use a generic error envelope without raw details.
5. Bearer token bytes are checked with `subtle::ConstantTimeEq`; Schedule/exams/sync do not fabricate data and an unverified UTH contract remains `503 CONNECTOR_UNAVAILABLE`.
```

Startup log output is best-effort: a closed/broken stderr must not panic or prevent the desktop app from continuing. `UNKNOWN`: manual Windows launch under a closed stderr handle remains a manual smoke-test item; the writer failure path is covered by a Rust unit test.

Postman collection của project là `postman/Campus_Assistant_Local_REST_API.postman_collection.json`. Collection UTH là upstream probe riêng, không phải runtime REST API của project.

## CA-080 - Postman setup CURRENT 2026-10-10

Collection local JSON -> `tools/check-local-postman.cjs` kiểm tra route/auth/error contract; collection UTH nếu chưa có nguồn chuẩn thì `sync:postman` SKIP an toàn. Không gửi API trường hoặc live sandbox test. Response HTTP/JSON local không nâng contract UTH lên VERIFIED; business schema UTH vẫn UNKNOWN. Không tạo session app, không gỡ quarantine Rust. Hướng dẫn: [REST API contract](testing/REST_API_DESIGN.md), [postman/README](../postman/README.md), [UTH contract](testing/UTH_API_CONTRACT.md).

## CA-083 - Luồng UTH CURRENT 2026-10-09

Mô tả thử nghiệm bên dưới là lịch sử trước CA-083. Hiện native từ chối open_uth_login_window/receive_uth_jwt/sync_uth_after_login/list_connector_schedules/list_connector_exams trước mọi xử lý bằng CONTRACT_UNVERIFIED. Không mở WebView thu token, không HTTP/mapping đoán, không ghi DB. Prototype command trả SAMPLE_SYNC_DISABLED. Portal browser độc lập vẫn mở; cache cũ giữ nguyên nhưng cách ly khỏi lịch UI. API/auth thật vẫn PLANNED, CA-080/081.

Tài liệu mô tả luồng thực thi end-to-end phân định rõ **Trạng thái Hiện tại (`CURRENT FLOW`)** và **Mục tiêu Khả thi (`TARGET FLOW`)**, kèm danh sách kẽ hở tắc nghẽn (`BLOCKING GAPS`).

---

## FLOW 1: UTH_CONNECT_AND_SYNC

### Runtime Status: `PARTIAL / EXPERIMENTAL`

### CURRENT FLOW (Thực tế Runtime):
```
1. User mở tab "Trường & Tài khoản" (SchoolPage)
2. User chọn trường "UTH"
3. User bấm "Thử nghiệm UTH Connector (Developer Mode)"
4. React gọi handleOpenUthWebView() -> tauriApi -> openUthLoginWindow()
5. Rust Backend mở WebView "uth-login" trỏ tới portal.ut.edu.vn
6. User đăng nhập trên portal UTH
7. Connector thử nghiệm có poller/bridge cố lấy JWT; sự hoạt động trên portal thật chưa E2E verified.
8. Nếu nhận được session, backend thử lấy profile/lịch và ghi cache; parser còn known gaps CA-081.
9. Legacy syncUthAfterLogin còn tồn tại; token rỗng trả AUTH_REQUIRED, không coi là đồng bộ thành công.
10. CA-082: Nút chính mở browser ngoài có phản hồi lỗi; UI nói rõ không tự nối session và MSSV là tự khai.
```

### TARGET FLOW (Mục tiêu Kiến trúc):
```
1. User mở tab "Trường & Tài khoản" và bấm "Kết nối Cổng trường"
2. Rust Backend mở WebView "uth-login" cách ly
3. User đăng nhập trực tiếp trên portal UTH
4. Rust Backend tự động phát hiện phiên đăng nhập (Cookie / Auth Session Extraction)
5. Rust Backend xác minh Profile sinh viên qua API getSummaryProfile
6. Rust Backend fetch Lịch học & Lịch thi
7. SyncService mở Transaction SQLite riêng biệt cho từng domain (Schedule / Exam)
8. Cập nhật SQLite cache & connector_sync_status
9. React nhận sự kiện thành công và reload dữ liệu UI từ SQLite
```

### BLOCKING GAPS & KNOWN SIDE EFFECTS:
- **`Auth Extraction Gap`**: Backend chưa có luồng tự rút Session Cookies từ WebView `uth-login`.
- **`Exam Source Derivation`**: Lịch thi UTH hiện được lọc (derive) từ API `/api/v1/lichhoc/thang` (loại chứa "thi"), chưa phải endpoint lịch thi riêng biệt.
- **`Error/Empty Gap`**: Sync chỉ thay miền có danh sách không rỗng; parser/engine còn đổi lỗi thành empty. Vì vậy có thể giữ cache cũ và báo ok sai, chưa xử lý empty hợp lệ/phạm vi snapshot đầy đủ (CA-081).

---

## FLOW 2: CHAT_INTENT_ROUTING

### Runtime Status: `IMPLEMENTED`

### CURRENT FLOW (Thực tế Runtime):
```
1. User nhập tin nhắn hoặc bấm một control gửi chat:
   - Nút Gửi trong composer
   - Phím Enter trong textarea
   - Command suggestion
   - Starter card
   - Composer shortcut
   - Command palette action có gửi chat
2. App.tsx gọi submitUserMessage(rawValue, source)
3. submitUserMessage:
   - Trim input
   - Chặn submit rỗng hoặc khi isBusy
   - Append user message vào UI
   - Nếu bootstrap chưa sẵn sàng và lệnh không thuộc nhóm an toàn trước bootstrap -> trả feedback "Ứng dụng đang khởi tạo dữ liệu local"
   - Gọi handleUserInput(value)
4. Nếu tin nhắn bắt đầu bằng "/":
   - Nếu là "/" đơn lẻ -> Hướng dẫn lệnh slash hợp lệ.
   - Nếu là Slash Command hợp lệ (/help, /schedule, /documents,...) -> Xử lý trực tiếp.
   - Nếu Slash Command không xác định -> Báo lệnh chưa hỗ trợ.
5. Nếu không phải Slash Command:
   - Bước 4.1: Nếu đang trong conversation flow active, ưu tiên xử lý state hiện tại.
   - Bước 4.2: Phân tích structured intent bằng detectIntent(value, activeSubjects)
     --> NẾU INTENT == "FIND_DOCUMENTS" -> Khởi tạo luồng tìm tài liệu.
     --> NẾU INTENT == "NEEDS_SUBJECT" -> Chuyển state `WAITING_FOR_SUBJECT`, hỏi user nêu/chọn môn; không tự fallback sang môn đầu tiên.
     --> NẾU INTENT == "FIND_ANNOUNCEMENTS" -> Hiển thị Thông báo.
     --> NẾU INTENT == "FIND_SCHEDULE" -> Hiển thị Lịch học.
     --> NẾU INTENT == "FIND_EXAMS" -> Hiển thị Lịch thi.
     --> NẾU INTENT == "PUBLIC_ADMISSIONS_INFO" -> Tra cứu tuyển sinh công khai.
   - Bước 4.3: Nếu structured intent UNKNOWN, mới gọi handleSchoolChatQuery(value) làm school fallback.
   - Bước 4.4: Nếu vẫn không match, trả fallback hỗ trợ dữ liệu local hiện có.
```

### TARGET FLOW (Mục tiêu Kiến trúc):
```
1. Slash Commands
2. Active Conversation Flow State
3. Structured Local Intent (FIND_SCHEDULE, FIND_EXAMS, FIND_DOCUMENTS)
4. Public School Admissions Intent
5. School Context Helper (General school QA)
6. Unknown Fallback
```

### BLOCKING GAPS:
- Chat assistant hiện là rule/keyword local assistant, chưa phải AI chat tổng quát.
- Regression test cho câu random ngoài dữ liệu và case thiếu subject nằm trong `src/engine.test.ts`.
- `submitUserMessage` là entry thống nhất cho các control chat; không tạo đường submit riêng nếu thêm UI mới.

---

## FLOW 5: CHAT_MESSAGE_PERSISTENCE

### Runtime Status: `IMPLEMENTED / OPT-IN`

### CURRENT FLOW (Thực tế Runtime):
```
1. User gửi tin nhắn hoặc app sinh tin nhắn assistant.
2. React append message vào state UI hiện tại.
3. React gọi Tauri command save_chat_message cho message user/assistant.
4. Rust đọc setting chatHistoryEnabled trong SQLite.
5. Nếu chatHistoryEnabled != "true":
   - Rust trả Ok(0), không ghi chat_messages.
   - React coi đây là privacy-disabled bình thường, không hiện warning.
6. Nếu chatHistoryEnabled == "true":
   - Rust ghi chat_messages vào SQLite.
   - Rust cập nhật updated_at của chat_sessions.
7. Nếu command lỗi thật:
   - React hiển thị warning nhẹ trong UI.
   - React ghi console warning an toàn, không ghi raw chat.
```

### Privacy Guard:
- **`CURRENT`**: Rust là enforcement boundary cuối cùng. Frontend không quyết định dữ liệu có được lưu hay không.
- **`CURRENT`**: Không backfill tin nhắn cũ trước thời điểm user bật lưu lịch sử.

### Known Gaps:
- Archive backend/state đã có (`archived = true`) và danh sách chính filter archived sessions.
- Chưa có Archive page / Archive tab / Restore archived session UI.

---

## FLOW 6: SIDEBAR_CORE_NAVIGATION

### Runtime Status: `IMPLEMENTED`

### CURRENT FLOW (Thực tế Runtime):
```
1. Sidebar mặc định hiển thị core navigation:
   - Gần đây: Xem tất cả lịch sử
   - Học tập: Thông báo, Lịch học, Lịch thi, Tài liệu, GPA / CPA
   - Kết nối: Trường & tài khoản
2. Footer hiển thị hồ sơ Sinh viên và nút Cài đặt.
3. Minigame / Phần thưởng không xuất hiện trong sidebar mặc định.
```

### Planned / Frozen:
- `CA-064` giữ trạng thái Frozen / Activation-only cho Reward & Minigame.
- Chỉ đưa `Khám phá`, `Minigame`, `Phần thưởng` vào navigation sau khi user kích hoạt task CA-064 và có runtime thật.

---

## FLOW 3: FILE_TRASH_AND_RESTORE

### Runtime Status: `IMPLEMENTED`

### CURRENT FLOW (Thực tế Runtime):
```
1. Backend Rust (trash.rs) triển khai: move_file_to_trash, restore_trash_item, empty_trash_bin, path guard safety check, SQLite metadata tracking.
2. Frontend (tauriApi.ts) có wrapper IPC: listTrashItems, moveFileToTrash, restoreTrashItem, emptyTrashBin.
3. UI File (FilesPage.tsx) có tab tài liệu mẫu, tab thùng rác, nút xóa, khôi phục và dọn sạch.
4. Nút xóa truyền `document.localPath` vào backend, không truyền `document.id`.
5. Move-to-trash và empty-trash đều yêu cầu xác nhận trước khi chạy thao tác.
```

### TARGET FLOW (Mục tiêu Kiến trúc):
```
User bấm Xóa -> Modal Confirm -> React gọi moveFileToTrash -> Rust di chuyển file vật lý vào .trash & ghi SQLite -> UI Thùng rác cập nhật -> User bấm Khôi phục -> Rust chuyển file về chỗ cũ & xóa SQLite record.
```

---

## FLOW 4: THEME_DRAFT_AND_APPLY

### Runtime Status: `IMPLEMENTED`

### CURRENT FLOW (Thực tế Runtime):
```
1. User đổi theme/màu/ảnh nền trên AppearancePage
2. Hook useAppearanceDraft giữ trạng thái tạm thời trong Draft State
3. UI xem trước hiển thị cục bộ
4. User bấm "Áp dụng" -> Ghi LocalStorage ("campus-assistant-appearance") -> Cập nhật CSS variables trên :root -> Lưu ảnh nền vào AppLocalData/themes/
5. User bấm "Hoàn tác" -> Draft tự hủy, quay về active theme
```
