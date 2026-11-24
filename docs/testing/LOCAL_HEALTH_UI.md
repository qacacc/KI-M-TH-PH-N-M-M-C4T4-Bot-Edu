# Kiểm tra màn Health local — đối chiếu clone

**Trạng thái:** Đang xác minh. Phạm vi này chỉ thay đổi UI kiểm tra local; không triển khai Portal/Courses, GPA, ghi chú, migration, REST API hoặc installer thuộc kế hoạch nhóm.

## Phân loại và tác động

- `CONFIRMED` trước thay đổi: `src/App.tsx` tự gọi `getHealthReport` khi mở Health; `src/pages/HealthPage.tsx` hiển thị `0 Pass` ngay cả khi chưa có báo cáo.
- `CONFIRMED` backend: `src-tauri/src/diagnostics.rs` kiểm tra thư mục, mở SQLite và có thể tạo thư mục/schema qua `ensure_directories`/`open_db_schema_only`; kiểm số lượng file, JSON local, URL cập nhật. Không kiểm phiên Portal/Courses hay GPA.
- `PLANNED` cho thay đổi này: chỉ gọi kiểm tra khi bấm nút ở Health; phân biệt chưa chạy, đang chạy, lỗi, kết quả cũ và kết quả mới.
- `UNKNOWN`: chưa có native visual smoke cho UI mới. Không dùng câu “SQLite chỉ đọc” của clone vì backend có thể ghi schema.
- Dữ liệu đọc: `HealthReport` từ IPC; dữ liệu ghi mới: không có. Backend hiện hữu có thể tạo thư mục/schema khi gọi.
- Rủi ro hồi quy: trang Release vẫn cần báo cáo tự động; lỗi không được biến thành `0 Pass` hoặc xóa báo cáo cũ.
- Invariant: `DATA-001`, `UI-001`, `DOC-001`; không đổi API/DB/contract.

## EP — Lớp tương đương

| Đầu vào | Hợp lệ | Không hợp lệ/giới hạn |
| --- | --- | --- |
| Runtime | D1: desktop có IPC | X1: trình duyệt không có IPC → nút bị khóa |
| Báo cáo | D2: báo cáo có 0..n items | X2: `null` → chưa chạy, không hiện 0 Pass |
| Trạng thái chạy | D3: idle | X3: đang chạy → chặn bấm lặp/xuất |
| Kết quả lệnh | D4: thành công | X4: lỗi → cảnh báo, giữ báo cáo cũ |
| Item status | D5: PASS/WARN/FAIL | X5: trạng thái khác không thuộc contract UI hiện tại |

## BVA — Biên có ý nghĩa

| Biến | min | min+ | ngoài miền/điều kiện biên |
| --- | --- | --- | --- |
| Số item | 0 | 1 | 2 item để kiểm đếm lặp |
| Số lần bấm khi idle | 0 | 1 | đang chạy: bấm lặp phải bị khóa |
| Báo cáo cũ | 0 (null) | 1 | lỗi khi có báo cáo cũ phải giữ bản cũ |

Không áp dụng dãy `tinChi/gpa/monNo/hocKy` của bài BVA mẫu: chúng không phải đầu vào của màn Health.

## Test case

| ID | Đầu vào | Kỳ vọng | Tự động |
| --- | --- | --- | --- |
| H01 | Trình duyệt, không báo cáo | Chặn kiểm tra/xuất, không hiện 0 Pass | `HealthPage.test.tsx` |
| H02 | Desktop, 0 báo cáo, chưa bấm | Không tự gọi IPC | `HealthPage.test.tsx` |
| H03 | Desktop, bấm 1 lần | Gọi callback đúng 1 lần | `HealthPage.test.tsx` |
| H04 | Đang kiểm tra | Khóa nút chạy và xuất | `HealthPage.test.tsx` |
| H05 | 1 báo cáo, 3 status | Đếm PASS/WARN/FAIL đúng | `HealthPage.test.tsx` |
| H06 | 1 báo cáo | Cho phép xuất | `HealthPage.test.tsx` |
| H07 | Lỗi, không báo cáo | Báo lỗi, không hiện số giả | `HealthPage.test.tsx` |
| H08 | Lỗi, có báo cáo cũ | Cảnh báo và giữ bảng cũ | `HealthPage.test.tsx` |
| H09 | Báo cáo 0 item | Ba số đếm đều bằng 0, không có row | `HealthPage.test.tsx` |
| H10 | Báo cáo 2 item cùng status | Đếm là 2, không gộp | `HealthPage.test.tsx` |

## Postman và kiểm chứng

Health UI dùng Tauri IPC, không phát sinh HTTP; Postman Runner **không áp dụng cho các test H01–H10**. `npm run check:postman` vẫn là gate hồi quy cho REST collection hiện có, không chứng minh UI. Native visual smoke và báo cáo HTTP live chưa được chạy trong tài liệu này.

Lệnh kiểm: `npx vitest run src/pages/HealthPage.test.tsx`; `npm run check:all`; `rg -n 'view !== "release"|isCheckingHealth|healthError' src/App.tsx`.

**Bằng chứng tự động trong worktree đối chiếu:** Vitest targeted 8/8 PASS; toàn bộ Vitest 139/139 PASS; `npm run test:layout` PASS; `npm run check:postman` PASS (10 kiểm tra tĩnh, 0 HTTP); `npm run build` PASS; `cargo check` PASS; `cargo test` 70/70 PASS; `npm audit` 0 vulnerabilities; `git diff --check` PASS. `npm run check:all` chưa chạy nguyên lệnh vì `npm run test` gọi `free-dev-port` có thể dừng clone đang chạy ở cổng 5173. Native visual smoke chưa chạy. Không coi đây là nghiệm thu hoàn tất.
