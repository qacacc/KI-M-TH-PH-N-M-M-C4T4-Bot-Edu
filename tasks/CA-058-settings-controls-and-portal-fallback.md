# CA-058 - Settings Controls & Portal Fallback

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-28

## Muc tieu duy nhat

Sửa các nút/control có bằng chứng chưa hoạt động hoặc gây hiểu nhầm trong Settings/School, đồng thời tránh lỗi WebView UTH trắng bằng cách đổi action chính sang mở portal bằng trình duyệt ngoài ổn định.

## Duoc phep lam

- Đổi action chính `Mở cổng trường UTH` trong `SchoolPage.tsx` sang mở portal UTH bằng trình duyệt mặc định.
- Đưa WebView UTH vào mục Nâng cao và ghi rõ là thử nghiệm.
- Khóa lựa chọn ngôn ngữ Settings ở `Tiếng Việt` vì app chưa có i18n thật.
- Cho nút Auto-focus Chat cập nhật state runtime đang chạy, không chỉ lưu localStorage.
- Cho nút Đăng xuất phiên trường trong Settings dùng session thật nếu có; nếu không có thì disabled/hiển thị rõ.
- Cập nhật task docs sau khi sửa.

## Khong duoc lam

- Không code SSO thật.
- Không trích cookie/token từ WebView.
- Không lưu token/cookie.
- Không thêm API trường mới.
- Không đổi schema SQLite.
- Không thêm dependency.
- Không refactor layout lớn ngoài các control nêu trên.

## File duoc phep sua

- `tasks/CA-058-settings-controls-and-portal-fallback.md`
- `tasks/TASK_INDEX.md`
- `PROJECT_TASKS.md`
- `src/pages/SchoolPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/App.tsx`

## Tieu chi hoan thanh

- Nút chính mở portal UTH không còn tạo WebView trắng.
- WebView UTH chỉ còn trong Nâng cao/Thử nghiệm.
- Language Settings không còn cho chọn English giả.
- Auto-focus Chat toggle có tác dụng ngay trong runtime.
- Logout session trường trong Settings không còn là nút giả.
- `npm run check:all` pass.

## Ket qua hoan thanh

- `SchoolPage.tsx`: nút chính `Mở portal UTH trên trình duyệt` dùng `openExternalUrl`, không còn mở WebView trắng.
- `SchoolPage.tsx`: WebView UTH được chuyển xuống Accordion Nâng cao với nhãn `Thử nghiệm WebView UTH`.
- `SettingsPage.tsx`: Language bị khóa ở `Tiếng Việt (đang hỗ trợ)`, không còn chọn English giả.
- `SettingsPage.tsx` + `App.tsx`: Auto-focus Chat toggle cập nhật state runtime ngay qua `onAutoFocusChatChange`.
- `SettingsPage.tsx`: nút đăng xuất phiên trường dùng session thật nếu có; khi chưa có session thì disabled và ghi rõ `Chưa có phiên trường`.
- `npm run check:all` pass: 50 Vitest, layout check, Vite build, Cargo check, 34 Rust tests, npm audit 0 vulnerabilities.

## Chua lam trong task nay

- Chưa code SSO/cookie extraction thật.
- Chưa sửa WebView UTH để đảm bảo mọi máy đều tải được portal; hiện WebView chỉ còn là thử nghiệm.
- Chưa click GUI desktop thủ công; đã xác minh bằng test/build/static checks.
