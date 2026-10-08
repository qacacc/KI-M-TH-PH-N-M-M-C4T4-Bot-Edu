# CA-076 - Fix Theme Default

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Sửa và hoàn thiện theme mặc định "Campus Default" và cơ chế khôi phục/chuyển đổi giao diện (Light/Dark mode), đảm bảo viền và nút trong Light mode không bị đen, không đè cài đặt tùy chỉnh của người dùng khi chưa bấm Áp dụng.

## Quy tac an toan & Kien truc

- **Theme mặc định**: `Campus Default` đứng đầu danh sách preset hệ thống, tự chuyển giữa Light/Dark tùy theo `themeMode` active.
- **Khôi phục (Reset)**: Reset về `Campus Default` đúng theo mode Light/Dark hiện tại.
- **Tùy chỉnh cá nhân**: Đổi Sáng/Tối không đè màu thủ công nếu user đã chỉnh tay.
- **Data Contract**: Không sửa schema `AppearanceSettings` hay thêm field mới.
- **CSS Bounds**: Không xóa `#000` toàn cục; chỉ sửa selector bị viền/nút/card đen trong Light mode.

## Duoc phep lam

- Sửa `tasks/done/CA-076-fix-theme-default.md` [NEW]
- Sửa `src/pages/AppearancePage.tsx`
- Sửa `src/hooks/useAppearanceDraft.ts`
- Sửa `src/styles.css`
- Sửa `tools/layout-regression-check.cjs`
- Sửa `tasks/TASK_INDEX.md`
- Sửa `PROJECT_TASKS.md`
- Sửa `implementation_plan.md`
- Sửa `walkthrough.md`

## Khong duoc lam (Strict Constraints)

- Không đổi logic lưu ảnh nền.
- Không xóa hệ thống preset cá nhân.
- Không đổi Tauri command.
- Không hardcode toàn app sang một màu.
- Không ghi đè lựa chọn người dùng nếu chưa bấm Áp dụng.

## Evidence commands

```powershell
rg -n "campus-default|e5e7eb|Campus Default" src/pages/AppearancePage.tsx src/styles.css
npm run check:all
```

## Evidence result

- `rg -n "Campus Default|campus-default" src\pages\AppearancePage.tsx`: xác nhận chỉ có một preset `Campus Default`.
- `Get-Content src\hooks\useAppearanceDraft.ts`: xác nhận `applyAppearanceToDocument()` xóa inline `--bg`, `--panel`, `--panel-strong`, `--text`, `--muted` khi `auto... = true`.
- `node tools\layout-regression-check.cjs`: pass.
- `npm run check:all`: pass, gồm 51 Vitest, layout regression, TypeScript/Vite build, 35 Rust tests và `npm audit` 0 vulnerabilities.
- Manual visual check: chưa chạy trực tiếp trên HMR; task được đóng ở mức source/test verified để chốt release freeze theo yêu cầu user.

## Tieu chi hoan thanh

- Co `Campus Default` trong Chu de mau he thong.
- Chon Light mode khong con vien den/nut den.
- Chon Dark mode van ro net.
- Bam `Khoi phục` reset sach se ve default preset theo dung mode.
- Doi preset khac roi Hoan tac / Ap dung van dung draft behavior.
- `npm run check:all` pass.
