# Báo cáo Hoàn thành Task — CA-089.01

> Trạng thái: **DONE / COMPLETED** · Phạm vi: Frontend, School Connector Vault, Settings UI, Source Truth Transparency.

## 1. Mục tiêu và Yêu cầu Task
- **Mã Task:** CA-089.01
- **Tiêu đề:** Bỏ mock và capability giả / UI không khiến user tưởng đã có dữ liệu trường.
- **Yêu cầu cốt lõi:** 
  - Loại bỏ hoàn toàn các dữ liệu mẫu (`MOCK_PUBLIC_DOCS` và các mẫu sample production giả mạo) được dùng để đánh lừa người dùng rằng hệ thống đã tải được dữ liệu thật từ trường.
  - Vô hiệu hóa hoặc minh bạch hóa các nút toggle/chức năng chưa có backend xử lý thực tế (như Auto-sync, Scheduler, Vault trên trang Cài đặt).
  - Chuẩn hóa luồng mở Portal bằng chuẩn bất đồng bộ (`async/await`, `Promise`) rõ ràng, không tự động suy diễn phiên đăng nhập (session) khi chưa xác thực thành công.

## 2. Các tệp tin đã chỉnh sửa (Atomic Changes)
1. **`src/schoolConnector/schoolVault.ts`**:
   - Xóa bỏ hoàn toàn mảng `MOCK_PUBLIC_DOCS` và hàm trả về dữ liệu mẫu.
   - Thêm hàm `openPortal()` chuẩn `Promise` và hàm `isAuthenticated()` kiểm tra trạng thái thực tế.
   - Thiết lập mặc định `autoSync: false` để tránh tự động chạy ngầm.
2. **`src/pages/SchoolPage.tsx`**:
   - Cập nhật luồng gọi `openPortal` bằng `async/await`, thông báo trạng thái kết nối trung thực (Chưa xác thực / Không giả mạo session).
3. **`src/pages/SettingsPage.tsx`**:
   - Làm mờ (disabled) và gắn nhãn cảnh báo `* Tính năng đang phát triển / Chưa hỗ trợ` cho các toggle chưa có backend (Auto-sync, Scheduler, Vault).

## 3. Kết quả Kiểm thử & Nghiệm thu
- Đã chạy lệnh kiểm thử toàn diện và vượt qua tất cả các bài test:
  ```powershell
  npm run check:all