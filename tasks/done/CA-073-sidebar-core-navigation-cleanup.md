# CA-073 - Sidebar Core Navigation Cleanup

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Đưa sidebar mặc định về cấu trúc core đang dùng thật, không hiển thị Minigame/Phần thưởng khi các chức năng này vẫn đang Frozen/Activation-only.

## Current issue

Sidebar đang có section `Khám phá` với `Minigame` và `Phần thưởng` dù `CA-064` vẫn Frozen. Điều này làm UI trông như có feature sắp dùng được, dễ gây hiểu nhầm scope.

## Target behavior

Sidebar mặc định:

```text
 Cuộc trò chuyện mới

GẦN ĐÂY
  Xem tất cả lịch sử

HỌC TẬP
  Thông báo
  Lịch học
  Lịch thi
  Tài liệu
  GPA / CPA

KẾT NỐI
  Trường & tài khoản

Footer:
  Sinh viên
  Cài đặt
```

`KHÁM PHÁ`, `Minigame`, `Phần thưởng` chỉ được đưa lại sidebar khi `CA-064` được user kích hoạt rõ ràng.

## Duoc phep lam

- Sửa `src/App.tsx`.
- Sửa CSS sidebar liên quan trong `src/styles.css`.
- Cập nhật static layout guard.
- Cập nhật task/governance docs.

## Khong duoc lam

- Không triển khai Minigame.
- Không triển khai Reward.
- Không đổi SQLite schema.
- Không đổi Tauri command/payload.
- Không đổi logic chat/file/school connector.
- Không tạo route/page mới.
- Không mở `CA-064`.

## Evidence commands

```powershell
rg -n "Khám phá|Minigame|Phần thưởng|handlePlannedFeatureClick|planned-item-placeholder|soon-badge" src/App.tsx src/styles.css
rg -n "Gần đây|Xem tất cả lịch sử|Học tập|GPA / CPA|Kết nối|Trường & tài khoản" src/App.tsx
npm run check:all
```

## Tieu chi hoan thanh

- Sidebar không còn section `Khám phá` mặc định.
- Sidebar không còn item `Minigame` / `Phần thưởng` mặc định.
- Có nhóm `Gần đây`, `Học tập`, `Kết nối` đúng cấu trúc core.
- `CA-064` vẫn ở trạng thái Frozen / Activation-only.
- Collapsed sidebar vẫn ẩn text/badge để không ép chữ dọc.
- `npm run check:all` pass.

## Ket qua thuc hien

- Loại `Khám phá`, `Minigame`, `Phần thưởng` khỏi sidebar runtime mặc định.
- Đổi nhóm `Tra cứu` thành `Học tập`.
- Thêm entry `GPA / CPA` vào nhóm `Học tập`.
- Thêm nhóm `Kết nối` với entry `Trường & tài khoản`.
- Giữ `CA-064` ở trạng thái Frozen / Activation-only.
- Cập nhật static guard để chặn extension placeholder quay lại sidebar core.

## Evidence

- `rg -n "Khám phá|Minigame|Phần thưởng|handlePlannedFeatureClick|planned-item-placeholder|soon-badge|Gamepad2|Gift" src/App.tsx src/styles.css`: không có kết quả.
- `rg -n "Gần đây|Xem tất cả lịch sử|Học tập|GPA / CPA|Kết nối|Trường & tài khoản" src/App.tsx`: xác nhận các entry core tồn tại.
- `rg -n "CA-064|Status: Frozen|Activation-only" tasks/hoan-lam/CA-064-special-reward-minigame-activation.md tasks/TASK_INDEX.md`: xác nhận CA-064 vẫn Frozen / Activation-only.
- `npm run check:all`: pass; 51 Vitest, layout check, build, 35 Rust tests, npm audit 0 vulnerabilities.

## Manual visual

- Chưa chạy manual visual check trên HMR trong phiên này. Source/static/build/runtime tests đã pass.
