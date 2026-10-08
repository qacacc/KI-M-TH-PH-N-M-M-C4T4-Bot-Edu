# RUNTIME FLOW OVERVIEW - CAMPUS ASSISTANT LOCAL

## CA-083 - CURRENT từ 2026-10-09 (thay thế mô tả UTH trước đó)

- UTH auth/sync và đọc cache lịch/thi bị native gate CONTRACT_UNVERIFIED trước WebView/token/network/DB. Không có parser HTTP/default nghiệp vụ được dùng; command prototype trả SAMPLE_SYNC_DISABLED.
- Cache cũ giữ trong SQLite nhưng không được đưa vào lịch chính thức, vì có thể chứa giá trị parser tự điền. Chat và page báo chung lỗi an toàn qua academicDataErrorMessage, không biến lỗi thành empty.
- Mở website trường bằng browser vẫn có, không tự nối session. Để đọc dữ liệu tài khoản thật phải hoàn thành CA-080/081 và security E2E; không có công tắc bỏ qua verification.
- Tab tài liệu mẫu opt-in và fixtures test vẫn tồn tại, không phải dữ liệu trường. Không claim dự án/connector hoàn thành.

Tài liệu này mô tả hành vi **CURRENT** đã được xác minh từ source hiện tại. Tính năng `TARGET`, `PLANNED`, `FROZEN` hoặc `NOT_IMPLEMENTED` không được mô tả như runtime đang hoạt động.

Mỗi flow chưa đủ bằng chứng phải ghi nhãn `ASSUMED`, `UNKNOWN`, `PARTIAL`, `PLANNED` hoặc `FROZEN`.

---

## FLOW: CHAT_INTENT_ROUTING

- **Status**: `CURRENT / RULE_BASED`
- **Entry point**: `src/App.tsx`, `src/engine.ts`
- **Frontend**:
  - Nút Gửi, Enter, command suggestion, starter card, composer shortcut và command palette action có gửi chat đều đi qua `submitUserMessage()`.
  - `submitUserMessage()` append user message, chạy bootstrap guard, rồi route vào `handleUserInput()`.
  - Slash command xử lý trước.
  - Active conversation state xử lý trước structured intent mới.
  - `detectIntent()` nhận diện các intent local.
  - Nếu user muốn tìm tài liệu nhưng thiếu môn, engine trả `NEEDS_SUBJECT`.
- **Known guard**:
  - Không có đường command suggestion im lặng khi bootstrap chưa sẵn sàng.
  - Không fallback sang `subjects[0]`.
  - Bot phải hỏi user nêu/chọn môn trước khi truy vấn.
- **Not implemented**:
  - AI chat tổng quát.
  - BYOK model provider.

---

## FLOW: FIND_DOCUMENTS

- **Status**: `CURRENT / PARTIAL`
- **Entry point**: `src/App.tsx`, `src/engine.ts`, `src-tauri/src/documents.rs`
- **State**:
  - `WAITING_FOR_SUBJECT`
  - `WAITING_FOR_SEMESTER`
  - `SHOWING_DOCUMENTS`
  - `WAITING_FOR_FILE_CONFIRMATION`
  - `COMPLETED`
- **Data read**:
  - Trang Tài liệu mở mặc định vùng tài liệu trường chưa đồng bộ; JSON/local document metadata chỉ trong tab mẫu do user chủ động chọn (CA-082).
- **File action**:
  - Mở/copy file chỉ sau xác nhận.
  - Rust kiểm tra managed roots và path traversal.

---

## FLOW: CHAT_MESSAGE_PERSISTENCE

- **Status**: `CURRENT / OPT_IN`
- **Entry point**: `src/App.tsx`, `src/pages/ChatHistoryPage.tsx`, `src-tauri/src/db.rs`
- **Frontend**:
  - React gọi `save_chat_message` cho user/assistant message.
- **Backend**:
  - Rust đọc setting `chatHistoryEnabled`.
  - `false` -> không ghi SQLite.
  - `true` -> ghi `chat_messages`.
- **Privacy guard**:
  - Rust là enforcement boundary cuối cùng.
  - Không backfill tin nhắn trước khi user bật history.
- **Known gap**:
  - Archive flag có, main list filter archived.
  - Chưa có archive management page / restore archived UI.

---

## FLOW: PUBLIC_ADMISSIONS_SEARCH

- **Status**: `CURRENT / LIMITED`
- **Entry point**: `src/App.tsx`, `src-tauri/src/public_search.rs`
- **Data source**:
  - Trang công khai trong allowlist trường.
- **Privacy guard**:
  - Frontend có PII strip helper.
  - Rust cũng sanitize numeric student ID/email trước outbound request.
- **Known gap**:
  - Nguồn công khai còn giới hạn theo allowlist hiện có.

---

## FLOW: ACADEMIC_SCHEDULE_EXAMS

- **Status**: `CURRENT / CACHE_ONLY / CONNECTOR_EXPERIMENTAL` (CA-082, 2026-10-08)
- **Entry point**: `src/App.tsx`, `src/pages/CampusDataPages.tsx`, `src/academicData.ts`, `src/hooks/useAcademicCache.ts`.
- **Data read**: Chỉ đọc SQLite khi chọn UTH và có MSSV; lọc đúng MSSV và source `uth-portal`. Không dùng sample/prototype khi rỗng hoặc lỗi.
- **UI provenance**: Cache thử nghiệm, có thể cũ; không coi nhập MSSV là xác thực. Loading/error/empty được tách riêng; đổi hồ sơ bỏ kết quả account cũ.
- **Known gap**: Parser/auth API thật chưa verified (CA-080/081); cache đúng source chưa chứng minh dữ liệu trường chính xác. Thông báo chưa có connector; GPA chỉ là ước tính từ dữ liệu nhập tay, mặc định trống.

---

## FLOW: SCHOOL_PORTAL_CONNECTION

- **Status**: `PARTIAL / EXPERIMENTAL`
- **Entry point**: `src/pages/SchoolPage.tsx`, `src-tauri/src/connectors/connector_engine.rs`
- **Current**:
  - Mở được portal trường/UTH bằng browser hoặc WebView thử nghiệm.
  - App không nhận mật khẩu trong React.
  - Mở browser có await/error feedback; đăng nhập browser ngoài không tự nối session vào app. Không còn hứa đồng bộ tự động chỉ bằng nhập MSSV.
- **Not ready**:
  - SSO production.
  - Automatic cookie/session extraction.
  - Backend-owned persistent encrypted vault.
  - Schedule/exam sync E2E từ session thật.

---

## FLOW: SIDEBAR_CORE_NAVIGATION

- **Status**: `CURRENT`
- **Entry point**: `src/App.tsx`
- **Current sections**:
  - `Gần đây`: Xem tất cả lịch sử.
  - `Học tập`: Thông báo, Lịch học, Lịch thi, Tài liệu, GPA / CPA.
  - `Kết nối`: Trường & tài khoản.
- **Frozen extension**:
  - `CA-064` Reward & Minigame là `Frozen / Activation-only`.
  - Sidebar mặc định không hiển thị Minigame/Phần thưởng.
