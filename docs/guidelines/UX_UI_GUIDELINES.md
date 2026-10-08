# UX/UI Guidelines

File nay danh cho cac task UI. AI phai doc truoc khi sua `src/App.tsx`, `src/pages/*`, `src/components/*` hoac `src/styles.css`.

## Huong UX hien tai

- App la desktop productivity tool, khong phai landing page.
- Man hinh chinh uu tien chat-first.
- Sidebar trai la hover rail: mac dinh gon, hover/focus moi bung day du.
- Panel phu co the resize/collapse.
- Tab Giao dien la noi tuy bien nang cao, khong mo customize panel ben phai song song.
- UI phai nhe, it shadow, dung border/surface ro rang.
- Khong dung card cha long card con neu khong can.
- Khong de text tran, ep cot hoac xuong tung ky tu.

## He thong layout

### Titlebar

- Custom titlebar nam tren cung.
- Khong de content chui duoi titlebar.
- Nut minimize/maximize/close phai chi nam trong titlebar.

### Sidebar

- Mac dinh hien icon rail gon.
- Hover/focus hien label, section va footer.
- Khong lam sidebar chiem grid column chinh khi da la fixed overlay.
- Khong them nut lon day dac trong rail collapsed.
- Active state can ro nhung khong phinh nut qua lon.

### Content

- Chat co composer gan day man hinh.
- Page ngoai chat phai dung duoc vung giua rong, khong bi gom thanh card nho neu du lieu can bang.
- Page bang du lieu can co filter, sort/empty state va width du de doc.

### Utility/customize panel

- Panel phu khong duoc lam vo content chinh.
- Khi task khong lien quan panel phu, khong sua resize/collapse behavior.
- Tab Appearance khong mo customize panel ben phai song song.

## Theme va Appearance Studio

Hanh vi phai giu:

- Draft chi doi UI that khi bam `Ap dung`.
- `Hoan tac` quay lai draft gan nhat tu settings dang ap dung.
- `Khoi phuc` dua ve mac dinh.
- Khong gui anh nen, font, mau ra server.
- Khong luu raw chat.

Tinh nang hien co:

- Light/dark.
- Accent.
- Background/panel/text/muted color.
- Font choices.
- Density.
- Background image local.
- Fit/focus/position.
- Blur/opacity/overlay/accent tint.
- Panel opacity.
- Skin presets.
- Preview rieng.

Khong nen lam trong task UI nho:

- Doi co che luu background.
- Doi data preset.
- Doi Tauri command.
- Refactor App.tsx lon.
- Them dependency UI moi.

## Typography

- Khong scale font theo viewport width.
- Font size trong panel/card phai vua voi mat do thong tin.
- Button text phai ngan, khong de wrap xau.
- Heading trong page khong qua lon so voi noi dung.

## Color va background

- Khong tao palette mot mau duy nhat.
- Phai giu contrast doc duoc voi anh nen.
- Khi co background image, panel phai co opacity/overlay du de doc.
- Khong dung input color native tho trong UI chinh neu dang co custom control.

## Motion va performance

- Khong dung animation nang tren toan app.
- Resize panel phai throttled/nhanh.
- Theme draft khong apply live vao root neu gay lag.
- Scroll chat dung `auto`, khong smooth-scroll mac dinh.

## Responsive checklist

Moi task UI can kiem tra toi thieu:

- Breakpoint 1500px: panel phu remap dung.
- Breakpoint 1180px: layout khong tran.
- Titlebar + Sidebar rail + Main content + Utility + Customize.
- Desktop rong: 1600px+.
- Desktop vua: 1200-1500px.
- Desktop hep: duoi 1180px.
- Sidebar collapsed/hover.
- Dark/light.
- Font scale va density.
- Background image co opacity/overlay.

## Quy chuẩn Sử dụng Màu sắc & Biểu tượng (GitHub Primer Standard)

### 1. Quy chuẩn Biểu tượng Icons
- **Đơn sắc đồng bộ (Monochrome Lucide Icons)**: 100% các biểu tượng trong hệ thống bắt buộc sử dụng Lucide SVG icons đơn sắc (`Sliders`, `Shield`, `Code2`, `Wrench`, `Database`, `Activity`, `CheckCircle2`, `AlertTriangle`).
- **Tuyệt đối KHÔNG sử dụng Emoji màu sắc**: Không sử dụng emoji màu (`🌐`, `💾`, `🛡️`, `🔄`, `💻`, `🛠️`) làm biểu tượng tiêu đề hay danh mục.
- **Màu sắc stroke**: Kích thước 14px–18px, màu nét stroke ăn theo token hệ thống (`var(--text)`, `var(--muted)`, `var(--accent)`).

### 2. Quy chuẩn Màu Xanh Lá (Success / Local-First Banner)
- **Học hỏi GitHub Primer Callout**: Không dùng mảng khối màu xanh lá đậm gây chói mắt.
- **Nền Banner**: Sử dụng màu nền trong suốt nhạt **6% Opacity** (`rgba(34, 197, 94, 0.06)`).
- **Đường viền**: Viền mảnh 35% Opacity (`border: 1px solid rgba(34, 197, 94, 0.35)`).
- **Màu chữ & Icon**: Xanh lá tương phản cao (`#16a34a` trong Light mode, `#22c55e` trong Dark mode).

### 3. Quy chuẩn Màu Đỏ (Danger Zone & Danger Buttons)
- **Học hỏi GitHub Primer Danger Zone**: Không đè nguyên khối màu đỏ/hồng gắt lên thẻ card cha.
- **Khung Danger Card**: Nền panel sạch sẽ đè 5% đỏ nhạt (`color-mix(in srgb, var(--panel-strong) 95%, transparent)`), viền đỏ mảnh 35% (`border: 1px solid rgba(220, 38, 38, 0.35)`).
- **Nút bấm Nguy hiểm (Danger Action Button)**:
  - *Trạng thái thường*: Nền panel/trắng sạch, viền đỏ mảnh (`#dc2626`) và chữ đỏ (`#dc2626`).
  - *Trạng thái Hover*: Phủ đỏ rực nguyên khối (`background: #dc2626`, `color: #ffffff`) kết hợp bóng đổ phát sáng (`box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3)`).

## Cac task UI nen tach rieng

- Preview da man hinh trong Appearance.
- Tooltip cho sidebar collapsed.
- Theme preset co ten rieng/export/import.
- Background image app-managed.
- Visual regression Playwright.
- CSS cleanup sau khi co test UI.
