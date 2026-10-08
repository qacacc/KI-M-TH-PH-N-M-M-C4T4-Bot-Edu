# CA-072 - Chat Persistence Error Visibility

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Không để lỗi lưu lịch sử chat bị nuốt im lặng ở frontend.

## Current issue

`appendMessage()` đang gọi `save_chat_message` rồi `.catch(() => {})`, khiến lỗi persistence thật không có tín hiệu debug/runtime nào.

## Target behavior

- Khi Rust privacy guard từ chối lưu do `chatHistoryEnabled=false`, không hiển thị lỗi cho user vì đây là hành vi bình thường.
- Khi command lưu chat lỗi thật, app ghi warning an toàn vào console và cập nhật trạng thái lỗi nhẹ trong UI.
- Không lưu raw chat vào log lỗi.
- Không thay đổi backend command/schema.

## Duoc phep lam

- Sửa `src/App.tsx`.
- Thêm test frontend nếu đã có harness phù hợp.
- Cập nhật static/layout check nếu cần.
- Cập nhật task/governance docs.

## Khong duoc lam

- Không bật chat history mặc định.
- Không ghi raw message vào log lỗi.
- Không đổi Tauri command.
- Không đổi SQLite schema.
- Không thêm dependency.

## Evidence commands

```powershell
rg -n "save_chat_message|catch\\(\\(\\) => \\{\\}\\)|setHistoryPersistenceWarning" src/App.tsx
npm run check:all
```

## Tieu chi hoan thanh

- Không còn `.catch(() => {})` cho `save_chat_message`.
- Lỗi bình thường do history disabled không hiện cảnh báo user.
- Lỗi thật được báo warning không chứa raw message.
- `npm run check:all` pass.

## Ket qua thuc hien

- Thay `.catch(() => {})` quanh `save_chat_message` bang handler co phan loai loi.
- Privacy guard disabled khong hien canh bao cho user.
- Loi persistence that hien `warning-box` nhe trong UI va console warning khong ghi raw chat.
- Them static guard de chan dua `.catch(() => {})` tro lai.

## Evidence

- `rg -n "save_chat_message|catch\\(\\(\\) => \\{\\}\\)|setHistoryPersistenceWarning|warning-box" src/App.tsx src/styles.css tools/layout-regression-check.cjs`: khong con empty catch, co warning state/UI.
- `npm run test`: 6 files / 51 tests pass.
- `npm run test:layout`: pass.
- `npm run build`: pass.
- `npm run check:rust`: pass.
- `npm run test:rust`: 35 tests pass.
- `npm audit`: 0 vulnerabilities.
- `npm run check:all`: pass.
