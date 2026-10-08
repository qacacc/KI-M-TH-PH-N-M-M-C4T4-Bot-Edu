# CA-066 - Chat History MVP

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Triển khai MVP Lịch sử trò chuyện local-first theo **Hướng B (Full Local History Sau Opt-in)**. Mặc định chưa bật lưu lịch sử, hiển thị Empty State an toàn. Khi người dùng bật opt-in, bắt đầu lưu tin nhắn từ thời điểm bật trở đi vào SQLite local.

## Quy tac an toan & Kien truc

- **Mặc định (`chatHistoryEnabled = false`)**: Không ghi `chat_messages` hay `chat_sessions`. Trang Lịch sử trò chuyện hiển thị Empty State *"Chưa bật lưu lịch sử local"* kèm nút *"Bật lưu lịch sử"*.
- **Backend Guard**: Hàm Rust tự kiểm tra setting `chatHistoryEnabled`, nếu `false` tự động ngắt ghi ngay ở backend.
- **Policy Không Backfill**: Bật history giữa chừng chỉ lưu tin nhắn mới từ thời điểm bật, không backfill tin nhắn cũ từ React state.
- **Bảo tồn Default Session**: `clear_all_chat_sessions()` xóa `chat_messages` và các session cũ, nhưng luôn tái tạo/bảo toàn session `default` ('Trò chuyện chính').
- **Migration v2 có Transaction**: Kiểm tra `PRAGMA table_info(chat_sessions)` và bọc `ALTER TABLE` + `PRAGMA user_version = 2` trong `conn.transaction()`.
- **Sanitize Title**: Nút Đổi tên giới hạn tối đa 100 ký tự.
- **Confirm**: Mọi thao tác Xóa (1 phiên hay xóa tất cả) bắt buộc có `window.confirm`.
- **Không vi phạm Invariants**: Không lưu token/cookie/mật khẩu, không gửi request ra server, không đụng CA-064 hay Minigame/Reward.

## Duoc phep lam

- Tạo component `src/pages/ChatHistoryPage.tsx`.
- Thêm SQLite migration v2 có transaction trong `src-tauri/src/db.rs`.
- Đăng ký các Tauri command quản lý history metadata & messages trong `src-tauri/src/lib.rs`.
- Cập nhật view navigation trong `src/App.tsx` khi nhấp vào entry `Lịch sử trò chuyện`.
- Thêm CSS cho `ChatHistoryPage` trong `src/styles.css`.
- Bổ sung static assertions trong `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không bật lưu raw chat mặc định khi user chưa opt-in.
- Không backfill tin nhắn cũ trước thời điểm opt-in.
- Không gửi dữ liệu lịch sử ra bất kỳ server nào.
- Không lưu token, cookie, mật khẩu.
- Không làm share online hay export Markdown.
- Không làm AI summary hay mã hóa nâng cao.
- Không kích hoạt CA-064 hay Minigame/Reward.
- Không sửa Appearance/background system.
- Không báo DONE nếu chưa có manual visual check.

## Evidence commands

```powershell
rg -n "ChatHistoryPage|chatHistoryEnabled|clear_all_chat_sessions|migrate_to_v2" src/ src-tauri/
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-066-chat-history-mvp.md` [NEW]
- `src/pages/ChatHistoryPage.tsx` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/App.tsx`
- `src/styles.css`
- `src-tauri/src/db.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/models.rs`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Có task file CA-066.
- Sidebar mở được trang Lịch sử trò chuyện.
- Empty state đúng khi chưa bật lưu lịch sử.
- Bật lưu lịch sử hoạt động local.
- Backend tự chặn ghi khi disabled.
- Migration v2 bọc trong transaction không nuốt lỗi.
- Tạo session mới, Đổi tên (max 100 ký tự), Ghim/Bỏ ghim, Lưu trữ hoạt động.
- Xóa một phiên và Xóa tất cả đều có `window.confirm` và xóa sạch `chat_messages` liên quan.
- `clear_all` bảo toàn session `default`.
- Không lưu token/cookie/mật khẩu, không gửi server request.
- Rust DB unit tests pass 100%.
- `npm run check:all` pass.
- Không báo Done nếu chưa có manual visual check.
