# CA-063 - Sidebar UI Desktop Polish

## Trang thai

- Status: In Progress
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Cải thiện sidebar hiện tại của Campus Assistant Local cho gọn, cân đối, hiện đại hơn nhưng không đổi logic navigation, không thêm chức năng mới, không đổi route, không đổi dữ liệu.

## Bang chung can sua

- Sidebar đang quá trống ở giữa.
- Các mục Tra cứu bị dàn thưa, cảm giác thiếu nhịp.
- Nút “Ghim thanh bên” nằm lạc giữa khoảng trống, không hợp lý.
- Footer sinh viên hơi to và chiếm nhiều chiều ngang.
- Active card “Trợ lý tài liệu” hơi nặng so với các nav item khác.
- Tổng thể cần giống một navigation sidebar desktop local-first: gọn, rõ nhóm, ít decoration.
- Manual visual check của user cho thấy sidebar collapsed vẫn vỡ: nhãn `Cuộc trò chuyện mới`, `Thông báo`, `Lịch học`, `Lịch thi`, `File mẫu` bị ép dọc trong rail 54px.

## Duoc phep lam

- Tái cấu trúc JSX Sidebar trong `src/App.tsx`: di chuyển nút ghim/thu gọn lên Header `.brand` hoặc `.sidebar-footer`, xóa nút `sidebar-toggle-btn` ở giữa.
- Chuẩn hóa CSS Sidebar trong `src/styles.css`:
  - Header căn gọn, nút pin icon 28x28px.
  - Nút "Cuộc trò chuyện mới" cao 36-38px.
  - Card "Trợ lý tài liệu" nhẹ hơn: border nhẹ, nền hơi sáng hơn sidebar, text phụ "Sẵn sàng" 11px muted.
  - Nhóm "Tra cứu": `gap: 4px`, item height 34-36px, icon + text căn trái đồng đều.
  - Footer account: gọn hơn (52-58px), gear settings đặt rõ bên phải.
- Bổ sung static layout assertion vào `tools/layout-regression-check.cjs`.
- Cập nhật `PROJECT_TASKS.md` và `tasks/TASK_INDEX.md`.

## Khong duoc lam (Strict Constraints)

- Không đổi route/view.
- Không thêm Reward/Minigame/Mascot.
- Không sửa chat logic.
- Không sửa backend/Tauri command.
- Không đổi localStorage schema.
- Không thêm dependency.
- Không đổi Appearance/background system.
- Không báo DONE nếu chưa có manual visual check.

## Evidence commands

```powershell
rg -n "sidebar-pin-btn|nav-groups|session-button|sidebar-footer|new-chat-button|nav-label|SIDEBAR COLLAPSED LABEL GUARD" src/App.tsx src/styles.css tools/layout-regression-check.cjs
npm run check:all
```

## File duoc phep sua

- `tasks/chua-xong/CA-063-sidebar-ui-desktop-polish.md` [NEW]
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/styles.css`
- `src/App.tsx`
- `tools/layout-regression-check.cjs`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Sidebar nhìn gọn hơn, ít khoảng trống vô nghĩa.
- “Ghim thanh bên” không còn nằm lạc giữa sidebar.
- Header, action, current session, nav, footer có nhịp spacing rõ.
- Expanded/collapsed đều không vỡ layout.
- Không còn chữ bị cắt hoặc item quá to.
- Khi collapsed, các nav item chỉ hiển thị icon 36px; nhãn text và footer settings không bị ép thành chữ dọc.
- `npm run check:all` pass 100%.
- Có manual visual check mới sau sửa.
