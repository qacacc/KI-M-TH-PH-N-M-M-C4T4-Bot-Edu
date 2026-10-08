# FLOW MAP - CAMPUS ASSISTANT LOCAL

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
7. React gọi syncUthAfterLogin(studentCode, displayName, "") [Truyền JWT rỗng ""]
8. Rust Backend nhận jwt_token = ""
9. Rust Backend phát hiện token rỗng -> Trả về lỗi AUTH_REQUIRED
10. UI hiển thị cảnh báo "Yêu cầu đăng nhập trên cửa sổ Portal UTH trước khi đồng bộ"
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
- **`Transaction Side-Effect Gap`**: Hàm `write_schedules_transaction` và `write_exams_transaction` hiện tại đều gọi `sync_data_transaction` vốn xóa cả `connector_schedules` và `connector_exams` trước khi ghi, dẫn đến rủi ro xóa nhầm cache cũ của domain chưa lỗi.

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
