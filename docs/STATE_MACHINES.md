# STATE MACHINES - CAMPUS ASSISTANT LOCAL

**CONFIRMED (source/tests), CA-098.01:** Local REST API has startup states `API_DISABLED` when `CAMPUS_ASSISTANT_LOCAL_API_TOKEN` is absent/invalid (desktop continues; no port bind), and `API_READY` when a valid 32–256 ASCII token is configured (loopback accepts matching Bearer requests). Startup logging is best-effort; write error does not panic. Request is `UNAUTHORIZED` (401) before route processing or proceeds to route-specific validation/data status. This is separate from UTH login/sync/cache; UTH connector remains `CONTRACT_UNVERIFIED`. **UNKNOWN:** manual desktop/Postman HTTP smoke.

CA-080 setup (2026-10-10): mặc định probe bị khóa; consent/live/request-reviewed + Vault cho phép gửi thủ công trên Postman Desktop. Chỉ là trạng thái công cụ kiểm thử, không transition auth/sync/cache của Campus Assistant. Transport PASS vẫn giữ contract UNKNOWN cho đến khi có evidence/schema/fixture thật. Chưa có request live trong đợt setup.

CA-083 CURRENT (2026-10-09): contract_unverified là error riêng cho UTH; không transition sang authenticated/sync_success/cache_ready. Dữ liệu cache cũ không bị xóa nhưng không được hiển thị như lịch chính thức. Không đồng nhất error với empty, không tự retry thu token. Mở portal browser không đổi state auth của app.

CA-090.01 CURRENT (2026-10-19): migration SQLite giữ dữ liệu cũ; khởi động không có transition xóa lịch sử chat. Reset cấu hình sau confirm chỉ chuyển các key cấu hình về trạng thái mặc định; GPA/chat/profile không bị chuyển sang trạng thái xóa. Manual native/UI verification chưa chạy.

Tài liệu định nghĩa chính thức các máy trạng thái (State Machines) trong ứng dụng. AI không được tự phát minh ra trạng thái mới ngoài danh sách này.

---

## CA-082: Trạng thái dữ liệu học tập (CURRENT, 2026-10-08)

- Loading: đang đọc cache, không giữ bản ghi account trước.
- Error: báo lỗi đọc, không fallback sample và không xóa cache.
- Empty: chưa có nguồn/account hợp lệ, hướng dẫn kết nối.
- Ready: cache thử nghiệm; không chứng nhận auth/parser.
- Đổi profile/cache event đọc lại; kết quả async cũ bị bỏ, listener cleanup khi unmount.

## 1. School Connector Authentication State Machine

Tách biệt hoàn toàn giữa Trạng thái Phiên Đăng nhập (Auth State) và Trạng thái Đồng bộ Dữ liệu (Sync State).

```
               ┌──────────────────────┐
               │     DISCONNECTED     │
               └──────────┬───────────┘
                          │ Event: open_uth_login_window
                          ▼
               ┌──────────────────────┐
               │  LOGIN_WINDOW_OPEN   │
               └────┬────────────┬────┘
  User Cancel/      │            │ Condition: Session verified in Rust
  Window Closed     │            │
         ┌──────────┘            ▼
         │             ┌──────────────────────┐
         │             │    AUTHENTICATED     │
         │             └────┬────────────┬────┘
         │    Session Expired│            │ Explicit Logout
         │           ┌──────┘            └──────┐
         ▼           ▼                          ▼
   ┌──────────────────────┐           ┌──────────────────────┐
   │   SESSION_EXPIRED    │           │     DISCONNECTED     │
   └──────────┬───────────┘           └──────────────────────┘
              │ Event: open_uth_login_window (re-authenticate)
              ▼
   ┌──────────────────────┐
   │  LOGIN_WINDOW_OPEN   │
   └──────────────────────┘
```

---

## 2. School Connector Data Synchronization State Machine

```
               ┌──────────────────────┐
               │         IDLE         │
               └──────────┬───────────┘
                          │ Event: start_sync / manual_refresh / retry
                          ▼
               ┌──────────────────────┐
               │       SYNCING        │
               └────┬────────────┬────┘
     All Sources    │            │ Partial Source      Fatal Auth/DB
      Success       │            │ Failure                Failure
            ┌───────┘            ├──────────────┐            │
            ▼                    ▼              ▼            ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │      SYNCED      │ │     PARTIAL      │ │      FAILED      │
   └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
              Event: manual_refresh / retry -> SYNCING
```

### Invariant Rules:
- **`Auth State`** và **`Sync State`** hoạt động độc lập: `AuthState = DISCONNECTED` nhưng `SyncState = SYNCED` có nghĩa là người dùng đang sử dụng Lịch học Offline từ SQLite Cache tốt đã đồng bộ trước đó.
- Trạng thái `FAILED` giữ nguyên dữ liệu cache SQLite cũ, không xóa DB.

---

## 3. Document Search Conversation State Machine

```
              ┌────────────────────────┐
              │          IDLE          │
              └───────────┬────────────┘
                          │ Event: intent == NEEDS_SUBJECT
                          ▼
              ┌────────────────────────┐
              │  WAITING_FOR_SUBJECT   │
              └───────────┬────────────┘
                          │ Event: user inputs known subject
                          ▼
              ┌────────────────────────┐
              │  WAITING_FOR_SEMESTER  │
              └───────────┬────────────┘
                          │ Event: user inputs semester (e.g. "học kỳ 1")
                          ▼
              ┌────────────────────────┐
              │   SHOWING_DOCUMENTS    │
              └───────────┬────────────┐
                          │ Event: user selects doc action ("mở 1" / "copy 1")
                          ▼
              ┌────────────────────────┐
              │WAITING_FILE_CONFIRMED  │
              └───────────┬────────────┘
                          │ Event: user confirms ("xác nhận")
                          ▼
              ┌────────────────────────┐
              │       COMPLETED        │
              └────────────────────────┘

              ┌────────────────────────┐
              │          IDLE          │
              └───────────┬────────────┘
                          │ Event: intent == FIND_DOCUMENTS (subject known, semester missing)
                          ▼
              ┌────────────────────────┐
              │  WAITING_FOR_SEMESTER  │
              └───────────┬────────────┘
                          │ Event: user inputs semester (e.g. "học kỳ 1")
                          ▼
              ┌────────────────────────┐
              │   SHOWING_DOCUMENTS    │
              └───────────┬────────────┘
                          │ Event: user selects doc action ("mở 1" / "copy 1")
                          ▼
              ┌────────────────────────┐
              │WAITING_FILE_CONFIRMED  │
              └───────────┬────────────┘
                          │ Event: user confirms ("xác nhận")
                          ▼
              ┌────────────────────────┐
              │       COMPLETED        │
              └────────────────────────┘
```

### Invariant Rule:
- Bot không được tự chọn môn đầu tiên khi user chưa nêu môn. Nếu không xác định được môn, phải vào `WAITING_FOR_SUBJECT`.
- Người dùng có thể gửi từ khóa `"hủy"` (hoặc `"cancel"`) ở bất kỳ trạng thái trung gian nào (`WAITING_FOR_SUBJECT`, `WAITING_FOR_SEMESTER`, `SHOWING_DOCUMENTS`, `WAITING_FILE_CONFIRMED`) để chuyển ngay về trạng thái `IDLE`.

---

## 4. Theme & Appearance Draft State Machine

```
               ┌──────────────────────┐
               │      DRAFT_CLEAN     │
               └──────────┬───────────┘
                          │ Event: user edits theme/color/background
                          ▼
               ┌──────────────────────┐
               │      DRAFT_DIRTY     │
               └────┬────────────┬────┘
      Event: Apply  │            │ Event: Discard / Restore
            ┌───────┘            └───────┐
            ▼                            ▼
   ┌────────────────────────────────────────┐
   │     DRAFT_CLEAN (Active Applied)       │
   └────────────────────────────────────────┘
```
