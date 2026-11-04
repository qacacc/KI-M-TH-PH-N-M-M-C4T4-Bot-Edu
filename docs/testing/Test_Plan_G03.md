# Test Plan — G03 (CA-088.01 / CA-088.02)

> Trạng thái: **PLANNED** · Phạm vi: Frontend, Local Storage (Persistence), GPA Calculation, Data Migration.

## 1. Mục tiêu

- Xác định phạm vi, phương pháp và điều kiện kiểm thử cho luồng nhập tay GPA và phục hồi dữ liệu.
- Đảm bảo các yêu cầu được truy vết qua [Traceability_Matrix_G03.md](./Traceability_Matrix_G03.md).
- Phân biệt rõ điểm do người dùng "nhập tay" và điểm "trường thật" (UTH Contract - Blocked).

## 2. Phạm vi

| Khu vực | Nội dung |
| --- | --- |
| Frontend | UI GpaCalculator, form nhập điểm, trạng thái (draft/saved), hiển thị GPA/CPA |
| Storage | Lưu/nạp mảng JSON từ `localStorage`, tự động migrate từ v1 sang v2 |
| Calculation | Tính tổng tín chỉ, hệ 4 (GPA), hệ 10 (CPA) dựa trên Grade Conversion |
| Validation | Chặn input sai (chữ, ngoài biên), chặn injection (constructor), lỗi corrupt data |
| Provenance | Nhập tay local (Không liên quan đến data trường thật) |

**Ngoài phạm vi:** Bảng điểm UTH API thật, Sync API, chứng thực (Auth), và server-side database.

## 3. Kỹ thuật kiểm thử

- **EP:** Tín chỉ (1-10), điểm (0-10), điểm rỗng (draft), input sai kiểu/cấu trúc JSON.
- **BVA:** Điểm biên (0, 10, -0.1, 10.1), tín chỉ biên (0, 1, 10, 11).
- **State Transition:** Thêm nháp -> Lưu điểm -> F5 -> Load lại bảng điểm.
- **Negative/Security:** Cố tình phá schema lưu trữ, prototype injection (`constructor`), báo lỗi Quota (bộ nhớ đầy).

## 4. Entry / Exit criteria

### Entry

- Source file (`gpaData.ts`, `GpaCalculator.tsx`) sẵn sàng.
- Trình duyệt test ở chế độ ẩn danh (để cô lập storage) hoặc dùng mock trong Unit Test.
- Các module logic/tính toán (calculateGpaStats, parseGpaSubjects) có output mong đợi rõ ràng.

### Exit

- `TC-G03-01` đến `TC-G03-10` được cập nhật kết quả trong ma trận truy vết.
- Test UI và Unit test bắt buộc PASS hoặc có Defect ID.
- Không đánh dấu đây là bảng điểm chính thức từ trường UTH.

## 5. Lệnh kiểm thử

```powershell
npm run test
npm run test:layout
npm run check:all