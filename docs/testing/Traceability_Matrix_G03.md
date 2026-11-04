# Traceability Matrix — G03 (CA-088.01 / CA-088.02)

> Trạng thái: **PLANNED**. Chỉ ghi `PASS` sau khi có evidence thực tế.

## 1. Requirement → Test Case

| ID | Requirement ngắn | Task | Test Case | Kỹ thuật |
| --- | --- | --- | --- | --- |
| REQ-GPA-001 | Lưu và phục hồi dữ liệu v2 thành công | CA-088.01 | TC-G03-01 | EP, State |
| REQ-GPA-002 | Tự động migrate dữ liệu từ v1 sang v2 | CA-088.01 | TC-G03-02 | State, Data |
| REQ-GPA-003 | Phát hiện và cảnh báo Corrupt Data (không ghi đè) | CA-088.01 | TC-G03-03 | Negative, State |
| REQ-GPA-004 | Xử lý lỗi Quota (Bộ nhớ đầy/bị chặn) | CA-088.01 | TC-G03-04 | Negative |
| REQ-GPA-005 | Draft (điểm nháp) không làm đổi/tụt GPA tổng | CA-088.02 | TC-G03-05 | EP |
| REQ-GPA-006 | Tính đúng điểm F khi nhập 2.0 | CA-088.02 | TC-G03-06 | EP, BVA |
| REQ-GPA-007 | Trả về `null` thay vì `0.00` khi bảng điểm trống | CA-088.02 | TC-G03-07 | BVA |
| REQ-GPA-008 | Chặn điểm và tín chỉ nằm ngoài miền cho phép | CA-088.02 | TC-G03-08 | BVA |
| REQ-GPA-009 | Bắt lỗi JSON sai cấu trúc hoặc thiếu trường | CA-088.02 | TC-G03-09 | Negative |
| REQ-GPA-010 | Bắt lỗi injection (constructor, `__proto__`) vào điểm chữ | CA-088.02 | TC-G03-10 | Security |

## 2. Test Case → Evidence

| Test Case | Automated evidence | Manual evidence |
| --- | --- | --- |
| TC-G03-01 | `npm run test -- --run src/gpaData.test.ts` | F5 trình duyệt và thấy dữ liệu giữ nguyên |
| TC-G03-02 | `npm run test -- --run src/gpaData.test.ts` | Gán fake v1 data và kiểm tra UI tự migrate sang v2 |
| TC-G03-03 | `npm run test -- --run src/gpaData.test.ts` | Tiêm chuỗi rác vào Storage, kiểm tra hiển thị box đỏ cảnh báo |
| TC-G03-04 | N/A | Chặn ghi Storage trong devtools, kiểm tra báo lỗi UI khi lưu |
| TC-G03-05 | `npm run test -- --run src/components/GpaCalculator.test.tsx` | Nhập môn mới không bấm lưu, số GPA không được đổi |
| TC-G03-06 | `npm run test -- --run src/components/GpaCalculator.test.tsx` | Nhập tín chỉ và điểm 2.0, bấm lưu, thấy GPA giảm mạnh |
| TC-G03-07 | `npm run test -- --run src/gpaData.test.ts` | Bấm Xóa tất cả, hiển thị --/4.0 thay vì 0.00 |
| TC-G03-08 | `npm run test -- --run src/gpaData.test.ts` | Nhập -0.1 hoặc 11 (tín chỉ), ứng dụng từ chối lưu |
| TC-G03-09 | `npm run test -- --run src/gpaData.test.ts` | Hàm parse văng lỗi |
| TC-G03-10 | `npm run test -- --run src/gpaData.test.ts` | Hàm parse văng lỗi |

## 3. Tổng quan

| Nhóm | Số requirement | Test Case |
| --- | ---: | --- |
| Persistence & Migration (CA-088.01) | 4 | TC-G03-01–TC-G03-04 |
| GPA Validation & Logic (CA-088.02) | 6 | TC-G03-05–TC-G03-10 |
| **Tổng** | **10** | **TC-G03-01–TC-G03-10** |

## 4. Quy tắc

- Không ghi `PASS` nếu chưa có output (vitest run) hoặc evidence manual rõ ràng.
- Bất kỳ failure nào phải gắn với Defect ID để fix.
- Giao diện phải ghi chú rõ đây là điểm "Nhập tay" để tránh nhầm lẫn với API UTH.