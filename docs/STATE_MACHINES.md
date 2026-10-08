# STATE MACHINES - CAMPUS ASSISTANT LOCAL

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
