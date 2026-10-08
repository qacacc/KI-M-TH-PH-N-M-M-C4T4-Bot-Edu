# CA-074 - Runtime Docs Reconciliation

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Đồng bộ tài liệu runtime CURRENT với source hiện tại sau các task core CA-071, CA-072, CA-073.

## Current issue

Một số tài liệu vẫn mô tả runtime cũ hoặc thiếu flow mới:

- `SYSTEM_BLUEPRINT.md` còn nói UI ưu tiên sample JSON trước SQLite connector cache.
- `FLOW_MAP.md` chưa ghi rõ `NEEDS_SUBJECT` / `WAITING_FOR_SUBJECT`.
- `STATE_MACHINES.md` chưa có bước `WAITING_FOR_SUBJECT`.
- `FEATURE_CATALOG.md` chưa phản ánh chat history và trạng thái rule-based của chat intent sau CA-071/CA-072.

## Duoc phep lam

- Sửa tài liệu trong `docs/`.
- Sửa `PROJECT_TASKS.md`.
- Sửa `tasks/TASK_INDEX.md`.
- Thêm file docs runtime nếu cần.

## Khong duoc lam

- Không sửa runtime source.
- Không sửa SQLite schema.
- Không đổi Tauri command/payload.
- Không triển khai AI/BYOK.
- Không triển khai Minigame/Reward.
- Không mô tả TARGET như CURRENT.

## Evidence commands

```powershell
rg -n "WAITING_FOR_SUBJECT|NEEDS_SUBJECT|CHAT_MESSAGE_PERSISTENCE|SIDEBAR_CORE_NAVIGATION|SQLite connector cache trước" docs
npm run check:all
```

## Tieu chi hoan thanh

- Docs ghi đúng `CURRENT` cho chat intent không tự đoán môn.
- Docs ghi đúng Rust là privacy enforcement boundary cho chat history persistence.
- Docs ghi đúng schedule/exam UI ưu tiên connector cache trước sample.
- Docs ghi rõ Minigame/Reward là Frozen/Activation-only, không phải runtime sidebar mặc định.
- `npm run check:all` pass.

## Evidence da chay

```powershell
rg -n "WAITING_FOR_SUBJECT|NEEDS_SUBJECT|CHAT_MESSAGE_PERSISTENCE|SIDEBAR_CORE_NAVIGATION|SQLite connector cache trước" docs
node tools\layout-regression-check.cjs
npm run check:all
```

Ket qua:

- `rg` xác nhận các flow/runtime docs đã có `WAITING_FOR_SUBJECT`, `NEEDS_SUBJECT`, `CHAT_MESSAGE_PERSISTENCE`, `SIDEBAR_CORE_NAVIGATION` và `SQLite connector cache trước`.
- `node tools\layout-regression-check.cjs`: pass.
- `npm run check:all`: pass; 51 Vitest, layout check, Vite build, 35 Rust tests, npm audit 0 vulnerabilities.
