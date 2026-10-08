# RUNTIME FLOW OVERVIEW - CAMPUS ASSISTANT LOCAL

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
  - JSON/local document metadata.
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

- **Status**: `CURRENT / CACHE_FIRST_WITH_SAMPLE_FALLBACK`
- **Entry point**: `src/pages/CampusDataPages.tsx`
- **Data read order**:
  - SQLite connector cache nếu có student code và cache hợp lệ.
  - Prop/sample JSON từ bootstrap.
  - Mock/default UI fallback nếu cả hai nguồn trên trống.
- **UI provenance**:
  - Connector cache hiển thị `local-cache`.
  - Sample hiển thị `sample-local`.

---

## FLOW: SCHOOL_PORTAL_CONNECTION

- **Status**: `PARTIAL / EXPERIMENTAL`
- **Entry point**: `src/pages/SchoolPage.tsx`, `src-tauri/src/connectors/connector_engine.rs`
- **Current**:
  - Mở được portal trường/UTH bằng browser hoặc WebView thử nghiệm.
  - App không nhận mật khẩu trong React.
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
