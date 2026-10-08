# DATA FLOW & PROVENANCE - CAMPUS ASSISTANT LOCAL

Tài liệu quy định luồng dữ liệu, phân định nguồn gốc (Data Provenance) và Ranh giới Bảo mật (Security Trust Boundary).

---

## 1. Data Provenance & Freshness Model

Mỗi bản ghi dữ liệu hiển thị trên ứng dụng bắt buộc phải mang đúng thuộc tính Nguồn gốc (`DataOrigin`) và Độ tươi (`DataFreshness`):

```typescript
type DataOrigin =
  | "sample-json"          // CURRENT: Dữ liệu JSON mẫu đính kèm trong app
  | "prototype-fixture"    // CURRENT: Dữ liệu mô phỏng cho luồng test
  | "uth-portal"           // CURRENT (Experimental): Dữ liệu từ UTH Portal
  | "uth-lms";             // PLANNED / RESERVED: Dữ liệu từ UTH LMS (courses.ut.edu.vn - Chưa triển khai)

type DataFreshness =
  | "live"                 // Vừa được đồng bộ trực tiếp từ server
  | "cache"                // Đang đọc từ SQLite Local Cache
  | "stale";               // Quá hạn chưa đồng bộ lại
```

### Quy tắc hiển thị UI:
- **`CONFIRMED`**: KHÔNG ĐƯỢC gán nhãn `Dữ liệu thật` cho các bản ghi có origin là `sample-json` hoặc `prototype-fixture`.
- **`CURRENT`**: Dữ liệu hiển thị từ SQLite Cache ghi rõ: `uth-portal · local-cache (Offline)`.

### Định nghĩa `sample`
- **`sample-json`** là dữ liệu mẫu đóng gói cùng ứng dụng để kiểm thử UI/flow khi chưa có dữ liệu trường thật hoặc connector cache.
- **`sample-json` không phải dữ liệu cá nhân của user** và không được dùng để khẳng định lịch học/lịch thi/thông báo thật của sinh viên.
- Khi đã có connector cache hợp lệ, UI lịch học/lịch thi phải ưu tiên cache connector trước sample.
- Nếu connector/cache lỗi, UI phải phân biệt `Error` với `Empty`; không được xóa cache tốt chỉ vì lần đồng bộ mới lỗi.

---

## 2. Security Trust Boundary

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UNTRUSTED REMOTE                                │
│   UTH Portal WebView (portal.ut.edu.vn, courses.ut.edu.vn)             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Network / Auth Session
                                   ▼
═════════════════════════ TRUST BOUNDARY ═════════════════════════════════
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│                       LESS-TRUSTED LOCAL                               │
│   React UI                                                             │
│   - Presentation & Layout                                              │
│   - User Intent Parsing                                                │
│   - LocalStorage (Non-secret Preferences Only)                         │
│   * NEVER owns passwords, session tokens, or security authority        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Tauri IPC Boundary
                                   ▼
┌──────────────────────────────────┴─────────────────────────────────────┐
│                        TRUSTED NATIVE                                  │
│   Rust Backend                                                         │
│   ├─ IPC Parameter & Path Validation         [CURRENT]                 │
│   ├─ Filesystem Bounds Enforcement           [CURRENT]                 │
│   ├─ Transactional SQLite Storage            [CURRENT]                 │
│   └─ Outbound PII Enforcement                [CURRENT: Public Search]  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LAYER                                  │
│   ├─ SQLite Local DB (Unencrypted at app layer; OS disk-level protection)│
│   └─ Local Filesystem (AppLocalData, Managed Workspace)                │
└────────────────────────────────────────────────────────────────────────┘
```

### Trust Boundary Analysis (`CURRENT` vs `TARGET`):
1. **Database Encryption**:
   - **`CURRENT`**: SQLite database (`campus-assistant.db`) là SQLite Local DB chuẩn (`rusqlite`), **chưa mã hóa ở tầng ứng dụng** (unencrypted at application layer). Hệ thống dựa vào cơ chế bảo mật đĩa của hệ điều hành (như BitLocker).
   - **`TARGET`**: Tích hợp SQLCipher hoặc mã hóa SQLite ở tầng backend nếu cần lưu credential bảo mật cao.

2. **Mật khẩu & Credentials**:
   - **`CURRENT`**: `SchoolPage.tsx` truyền parameter `jwtToken` (hiện tại truyền `""`), backend `connector_engine.rs` nhận `jwt_token: String`.
   - **`TARGET`**: Secret hoàn toàn ở lại WebView / Rust Backend. React Frontend không nhận hay gửi bất kỳ JWT / Session Cookie nào qua IPC.

3. **Public Search PII Protection**:
   - **`CURRENT`**: Hàm `stripPiiFromPublicQuery` tồn tại ở `engine.ts`; backend `public_search.rs` cũng ép buộc `sanitize_query` để loại numeric student ID và email trước khi tạo HTTP request công khai.
   - **`TARGET`**: Mở rộng sanitizer thành policy tập trung dùng chung cho mọi connector outbound, không chỉ public search.
