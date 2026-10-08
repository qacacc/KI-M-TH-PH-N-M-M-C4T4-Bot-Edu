# CA-075 - Unified Runtime Flow and Chatbox Stability

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Chuẩn hóa luồng gửi chat để nút Gửi, phím Enter, command suggestion, starter card và composer shortcuts đi qua cùng một pipeline xử lý. Mục tiêu là giảm lỗi lệch hành vi giữa các cách nhập, đặc biệt lỗi kiểu Enter chạy nhưng nút/chip không chạy hoặc bị disable im lặng.

## Current issue

- `handleSubmit`, `submitText`, `submitCommandSuggestion` đang có đường xử lý riêng.
- Command suggestion đang `return` im lặng khi `bootstrap` chưa sẵn sàng.
- Một số nút chat bị disable vì `!bootstrap`, trong khi user cần nhận feedback rõ "đang khởi tạo" thay vì không có phản hồi.

## Duoc phep lam

- Sửa `src/App.tsx` để tạo một pipeline submit thống nhất.
- Sửa `tools/layout-regression-check.cjs` để thêm static guard chống tách lại submit flow.
- Cập nhật `docs/FLOW_MAP.md` và `docs/RUNTIME_FLOW_OVERVIEW.md`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam

- Không thêm AI/BYOK.
- Không đổi intent contract trong `src/engine.ts`.
- Không đổi Tauri command/payload.
- Không đổi SQLite schema.
- Không sửa file action backend.
- Không triển khai Minigame/Reward.
- Không thay đổi hệ thống background/theme draft.

## Hanh vi phai giu

- Chat history vẫn do Rust enforce `chatHistoryEnabled`.
- Privacy-disabled history không hiện warning.
- Lỗi persistence thật vẫn hiện warning nhẹ.
- `NEEDS_SUBJECT` vẫn hỏi môn, không fallback `subjects[0]`.
- Public admissions search vẫn giữ PII stripping và nguồn công khai.
- Slash commands hiện có vẫn hoạt động.

## Evidence commands

```powershell
rg -n "submitUserMessage|canRouteBeforeBootstrap|submitCommandSuggestion|onSubmit=\\{handleSubmit\\}|disabled=\\{!bootstrap \\|\\| isBusy\\}" src\App.tsx
node tools\layout-regression-check.cjs
npm run check:all
```

## Evidence result

- `rg -n "submitUserMessage|canRouteBeforeBootstrap|Ứng dụng đang khởi tạo dữ liệu local" src\App.tsx`: xác nhận `submitUserMessage`, `canRouteBeforeBootstrap` và feedback bootstrap nằm trong `src/App.tsx`.
- `rg -n "if \(!bootstrap\) return;" src\App.tsx`: không còn silent return trong command suggestion path.
- `node tools\layout-regression-check.cjs`: pass.
- `npm run check:all`: pass, gồm 51 Vitest, layout regression, TypeScript/Vite build, 35 Rust tests và `npm audit` 0 vulnerabilities.

## Tieu chi hoan thanh

- `App.tsx` có một hàm `submitUserMessage` làm entry chính cho mọi chat submit.
- `submitText` và `submitCommandSuggestion` chỉ là wrapper gọi `submitUserMessage`.
- Nút Gửi và Enter đều gọi cùng pipeline.
- Command suggestion không còn return im lặng khi bootstrap chưa xong.
- Các nút/chip chat không bị disable chỉ vì `!bootstrap`; nếu chưa bootstrap thì pipeline trả feedback rõ.
- Static regression check bảo vệ unified submit flow.
- `npm run check:all` pass.
