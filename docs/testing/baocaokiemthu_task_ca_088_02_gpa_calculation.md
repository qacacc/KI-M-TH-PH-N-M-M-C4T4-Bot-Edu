# CA-088.02 — Kiểm thử GPA nhập tay và ranh giới Portal

## Thực tế, phạm vi, tác động

- **CONFIRMED:** `GpaPage` chỉ tạo `GpaCalculator` với URL mở Portal (`src/pages/CampusDataPages.tsx:71,96`); không có IPC truyền bảng điểm Portal. Giá trị `verified: true` trong unit test là dữ liệu tổng hợp (`src/gpaData.test.ts:214`), không phải bằng chứng trường.
- **CONFIRMED:** điểm nhập tay nằm trong `ca_gpa_calculator_manual_v2` trên thiết bị (`src/gpaData.ts:3,96`). Dữ liệu cũ `v1` chỉ được phục hồi sau xác nhận và ghi thành công (`src/components/GpaCalculator.tsx:118,143`); bản hỏng không bị ghi đè lúc tải (`src/gpaData.ts:96`).
- **PLANNED:** đồng bộ điểm Portal, xác minh nguồn và GPA học kỳ/tích lũy chính thức. Phụ thuộc CA-080/081 và contract trường; CA-088 trong `tasks/TASK_INDEX.md` chưa Done.
- **UNKNOWN:** thang quy đổi chính thức, fixture bảng điểm và kết quả Postman/native live. Không dùng phép quy đổi tham khảo cho GPA chính thức.
- **Tác động:** chỉ UI và logic GPA local, tài liệu. Không đổi SQLite, WebView/session, API hay Postman collection.

## Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
| --- | --- | --- | --- | --- |
| `credits` | `""` (nháp) hoặc số nguyên 1–10 | V1 | 0, 11, 2.5, chuỗi/sai kiểu | X1 |
| `score10` | `""` (nháp) hoặc số hữu hạn 0–10 | V2 | -0.1, 10.1, NaN/sai kiểu | X2 |
| `letterGrade` | `""` hoặc khóa trong bảng quy đổi tham khảo | V3 | `constructor`, `__proto__`, mã lạ | X3 |
| Dữ liệu lưu | JSON mảng đầy đủ trường, ID duy nhất | V4 | JSON lỗi, thiếu trường, trùng ID | X4 |
| Phục hồi v1 | Người dùng xác nhận và ghi v2 thành công | V5 | hủy hoặc bộ nhớ từ chối ghi | X5 |
| Nguồn Portal | Chỉ hiển thị trạng thái chưa kết nối | V6 | Gắn nhãn điểm giả lập là điểm chính thức | X6 |

## Giá trị biên (BVA)

| Biến | min- | min | min+ | nominal | max- | max | max+ | Tag |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `credits` nguyên | 0 | 1 | 2 | 3 | 9 | 10 | 11 | B1–B7 |
| `score10` | -0.1 | 0 | 0.1 | 5 | 9.9 | 10 | 10.1 | B8–B14 |

Biên riêng: `credits=2.5` (X1), hàng chưa nhập (`""`, V1/V2), danh sách rỗng (không có GPA thực), lỗi ghi storage (X5). Miền điểm hệ 10 chỉ là miền nhập ước tính, không phải contract Portal.

## Test case và kết quả mong đợi

| TC | Đầu vào/tình huống | Mong đợi | Tag | Bằng chứng tự động |
| --- | --- | --- | --- | --- |
| 01 | `credits=1`, điểm 0 | Chấp nhận, tính F | V1,V2,B2,B9 | `gpaData.test.ts` |
| 02 | `credits=10`, điểm 10 | Chấp nhận, tính điểm cao nhất | V1,V2,B6,B13 | `gpaData.test.ts` |
| 03 | `credits=0` hoặc 11 | Từ chối | X1,B1,B7 | `gpaData.test.ts` |
| 04 | `credits=2.5` | Từ chối, không tự làm tròn | X1 | `gpaData.test.ts`, `GpaCalculator.test.tsx` |
| 05 | `score10=-0.1` hoặc 10.1 | Từ chối, không kẹp về 0/10 | X2,B8,B14 | `gpaData.test.ts`, `GpaCalculator.test.tsx` |
| 06 | Hàng nháp, chưa nhập đủ | Không ảnh hưởng GPA | V1,V2 | `gpaData.test.ts`, `GpaCalculator.test.tsx` |
| 07 | Bảng điểm trống | UI hiển thị `--`, không báo điểm chính thức 0.00 | V6 | `GpaCalculator.test.tsx` |
| 08 | JSON v2 sai cấu trúc | Cảnh báo; không tự ghi đè | X4 | `gpaData.test.ts`, `GpaCalculator.test.tsx` |
| 09 | v1 có dữ liệu, hủy phục hồi | v2 không đổi | X5 | `GpaCalculator.test.tsx` |
| 10 | v1 có dữ liệu, xác nhận | Chỉ ghi v2 sau xác nhận | V5 | `GpaCalculator.test.tsx` |
| 11 | Storage từ chối xóa dữ liệu hỏng | Dữ liệu hỏng vẫn giữ, cảnh báo còn | X5 | `GpaCalculator.test.tsx` |
| 12 | Không có nguồn Portal xác thực | Không có nút nạp, không tuyên bố GPA chính thức | V6,X6 | `GpaCalculator.test.tsx`; static `rg` |

## Kiểm chứng và giới hạn

- **CONFIRMED (2026-11-24, worktree PR #26 sau khi tích hợp `main`):** `npm run check:all` exit 0: Vitest, layout, Postman tĩnh 10/10, build, `cargo check`, Rust 70/70, audit 0. `npx vitest run src/gpaData.test.ts src/components/GpaCalculator.test.tsx`: 33/33 PASS. `git diff --check`: exit 0.
- Chạy `git diff --check` và kiểm static `rg -n 'GPA chính thức|Nạp vào bảng ước tính|portalGrades' src/components/GpaCalculator.tsx src/pages/CampusDataPages.tsx` trước khi push.
- **Postman:** GPA nhập tay không có HTTP endpoint; `check:postman` chỉ bảo vệ collection REST local, không kiểm GPA hay chứng minh API trường. Không dựng request giả để lấy điểm Portal.
- **Manual visual/native:** chưa xác nhận; cần chạy app Windows, kiểm nhập điểm, F5, hủy/xác nhận khôi phục, storage bị chặn và mở Portal trước nghiệm thu.
- **Exit:** Chỉ báo phần GPA local đã qua test tự động khi các lệnh pass. CA-088/Portal vẫn chưa Done nếu thiếu fixture/IPC/E2E.
