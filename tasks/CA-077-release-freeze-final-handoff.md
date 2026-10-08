# CA-077 - Release Freeze and Final Handoff

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Chốt dự án Campus Assistant Local trong ngày 2026-08-02 ở trạng thái release freeze: không thêm tính năng mới, chỉ cập nhật trạng thái CURRENT, chạy kiểm tra tổng và build installer phát hành.

## Duoc phep lam

- Cập nhật `CURRENT_STATE.txt`.
- Cập nhật `README.md` nếu cần để phản ánh trạng thái release hiện tại.
- Cập nhật `PROJECT_TASKS.md`.
- Cập nhật `tasks/TASK_INDEX.md`.
- Chạy `npm run check:all`.
- Chạy `npm run build:installer`.
- Nếu build all-target bị lỗi MSI/WiX hoặc file lock trên Windows, được phép build riêng NSIS bằng `npm run tauri build -- --bundles nsis` và ghi rõ bằng chứng.

## Khong duoc lam

- Không thêm tính năng mới.
- Không sửa logic chat/intent.
- Không sửa Tauri command/payload.
- Không đổi SQLite schema.
- Không đổi background/theme engine.
- Không kích hoạt CA-064 Reward/Minigame.
- Không claim school connector production-ready.

## Hanh vi phai giu

- Local-first.
- Chat history opt-in.
- Public admissions search chỉ là CURRENT / LIMITED.
- UTH WebView/connector vẫn là experimental/partial.
- Reward/Minigame vẫn Frozen.

## Evidence commands

```powershell
npm run check:all
npm run build:installer
npm run tauri build -- --bundles nsis
```

## Tieu chi hoan thanh

- `npm run check:all` pass.
- Installer NSIS được build ra và có đường dẫn rõ ràng.
- `CURRENT_STATE.txt` phản ánh đúng trạng thái cuối.
- `TASK_INDEX.md` không còn active task.
- Không mô tả TARGET/PLANNED như CURRENT.

## Evidence result

- `npm run check:all`: PASS, gồm 51 Vitest, layout regression, TypeScript/Vite build, 35 Rust tests và `npm audit` 0 vulnerabilities.
- `npm run build:installer`: không dùng được làm gate cuối vì nhánh MSI/WiX và target mặc định gặp lỗi Windows file lock / `light.exe`.
- Fallback release command: `CARGO_TARGET_DIR="C:\Users\PC\Downloads\bot game\.release-target" npm run tauri build -- --bundles nsis`.
- Result: PASS, tạo installer tại `C:\Users\PC\Downloads\bot game\.release-target\release\bundle\nsis\Campus Assistant Local_1.0.1_x64-setup.exe`.
- Manual visual check: chưa chạy lại trong turn này; các task UI cũ còn `In Progress` vì thiếu manual visual không được claim Done.
