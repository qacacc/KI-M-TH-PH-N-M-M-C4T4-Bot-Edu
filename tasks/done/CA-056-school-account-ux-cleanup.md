# CA-056 - School Account UX Cleanup & Polish

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Tái cấu trúc UX/UI trang **Trường & Tài khoản Sinh viên** (`SchoolPage.tsx`) thành 3 khối rõ ràng, sắp xếp nút thao tác chuẩn (Primary / Secondary / Danger), ẩn các thao tác Dev / Danger vào mục Nâng cao (Collapsible Accordion), có confirm dialog cho hành động nguy hiểm/đăng xuất, và cập nhật wording trung thực theo chuẩn `CURRENT` vs `TARGET`.

## Ly do

Trang Trường & Tài khoản trước đây hiển thị quá nhiều nút kỹ thuật / nguy hiểm (Developer Mode, Xóa dữ liệu SQLite, Đăng xuất, Xóa hồ sơ) chung hàng với các nút chính, khiến người dùng dễ bị ngợp và ấn nhầm. Đồng thời một số câu khẳng định wording chưa phản ánh đúng thực tế hệ thống.

## Duoc phep lam

- Chia `SchoolPage.tsx` thành 3 khối chính:
  - Khối 1: Hồ sơ Local (Tên, Trường, MSSV, Chế độ Tân sinh viên/Đang học, Nút Lưu hồ sơ Secondary).
  - Khối 2: Kết nối Cổng trường (4 Status Badges trung thực, Dòng giải thích ngắn không lưu mật khẩu, Nút duy nhất "Mở cổng trường UTH" Primary).
  - Khối 3: Thống kê Dữ liệu Local (Lịch học cache, Lịch thi cache, Nguồn dữ liệu, Lần đồng bộ cuối).
- Tạo mục Nâng cao (Collapsible Accordion) chứa:
  - Thử nghiệm Prototype Sync.
  - Nút Đăng xuất phiên Portal (bắt buộc có confirm dialog `window.confirm`).
  - Vùng nguy hiểm (Danger Zone) tách riêng ở dưới cùng chứa các nút Xóa (`Xóa toàn bộ dữ liệu Connector khỏi SQLite`, `Xóa hồ sơ tự khai local`, cả hai bắt buộc có confirm dialog).
- Wording bắt buộc:
  - `Cổng UTH: Có thể mở`
  - `Đồng bộ UTH: Thử nghiệm`
  - `Lưu token/cookie: Chưa bật`
  - `Xác thực: Qua website trường`
  - `Bạn đăng nhập trực tiếp trên website trường. App không nhận mật khẩu.`
- Với trường không phải UTH:
  - Không hard-code trạng thái UTH.
  - Nút connector chính phải disabled hoặc ghi rõ connector trường đó chưa hỗ trợ.
  - Có thể đặt link mở portal ngoài trong mục Nâng cao, nhưng không được claim WebView connector đã sẵn sàng.
- Hiển thị state an toàn:
  - Nếu chưa có cache lịch học/lịch thi: hiển thị "0 buổi học" / "0 môn thi", không để trống.
  - Nếu sync status chưa có: hiển thị "Chưa đồng bộ".
- Bổ sung CSS responsive cho 3 khối xếp dọc trên màn hình nhỏ và Danger zone nằm cuối cùng trong `src/styles.css`.

## Khong duoc lam (Strict Constraints)

- Không code SSO thật.
- Không trích cookie/token từ WebView.
- Không lưu token/cookie.
- Không thêm API trường mới.
- Không đổi Tauri command/payload.
- Không đổi schema SQLite.
- Không thêm dependency mới.

## File duoc phep sua

- `tasks/done/CA-056-school-account-ux-cleanup.md`
- `PROJECT_TASKS.md`
- `tasks/TASK_INDEX.md`
- `src/pages/SchoolPage.tsx`
- `src/styles.css`
- `implementation_plan.md`
- `walkthrough.md`

## Tieu chi hoan thanh

- Giao diện `SchoolPage.tsx` được chia thành 3 khối rõ ràng + 1 khối Accordion Nâng cao.
- Bấm "Mở cổng trường UTH" -> Mở cổng chính thức/WebView theo flow hiện có; không xuất hiện form mật khẩu trong app.
- Nếu chọn trường khác UTH, nút connector chính không được mở nhầm UTH và phải hiển thị chưa hỗ trợ.
- Nút bấm được phân cấp rõ: Primary (Mở cổng trường UTH), Secondary (Lưu hồ sơ), Danger (Xóa dữ liệu có confirm nằm trong Accordion).
- Wording hiển thị 100% trung thực theo thực tế hệ thống.
- Responsive hiển thị 3 khối xếp dọc mượt mà trên màn hình nhỏ.
- `npm run check:all` PASS 100%.

## Ket qua hoan thanh

- `SchoolPage.tsx` da co 3 khoi chinh: Ho so Local, Ket noi Cong truong, Du lieu Hoc tap Local.
- Khối Ket noi chỉ còn một action primary chính.
- Nếu chọn UTH, nút primary mở WebView UTH hiện có.
- Nếu chọn trường khác, nút primary disabled và ghi rõ connector trường đó chưa hỗ trợ, không mở nhầm UTH.
- Link mở portal ngoài được hạ xuống mục Nâng cao.
- Prototype sync, đăng xuất và các nút xóa nằm trong Accordion Nâng cao / Vùng Nguy Hiểm.
- Đăng xuất, xóa connector data và xóa hồ sơ local đều có `window.confirm`.
- Wording giữ đúng CURRENT: không code SSO thật, không trích/lưu token/cookie, xác thực qua website trường.
- `src/styles.css` bổ sung trạng thái muted và disabled cho connector chưa hỗ trợ.
- `npm run check:all` pass: 50 Vitest, layout check, Vite build, Cargo check, 34 Rust tests, npm audit 0 vulnerabilities.

## Chua lam trong task nay

- Chua code SSO/API/cookie extraction thật.
- Chua thêm API trường mới.
- Chua đổi Tauri command/payload/schema/dependency.
- Chua kiểm thử click GUI thủ công trong app desktop; đã kiểm thử tự động và build.
