# Đối chiếu clone: lối tắt và bảng tìm nhanh

**Trạng thái:** Đang xác minh. Đây là task giao diện/điều hướng độc lập; không thay đổi lịch, GPA, Portal/Courses, SQLite, REST hoặc dữ liệu của nhóm.

## Phân tích tác động

1. `CONFIRMED` (source trước thay đổi): `.starter-grid strong/small` dùng `white-space: nowrap` và `text-overflow: ellipsis`; nhãn dài bị cắt. Clone có quy tắc xuống dòng và cột co giãn. `UNKNOWN`: chưa đo bằng ảnh native ở nhiều DPI.
2. Feature: lối tắt chat và bảng tìm nhanh; entry point là `src/App.tsx` và `src/styles.css`.
3. `CURRENT` trước thay đổi: thẻ chào đứng trước 8 ô có viền, thứ tự khác clone; `TARGET`: ẩn thẻ chào chỉ khi đang hiện lối tắt, lưới 4×2 có đường phân cách và route trung thực với app gốc.
4. State trước/sau: giữ nguyên mảng `messages` và dữ liệu chat; sáu nút trang đổi `view` trực tiếp, hai nút lệnh vẫn đi qua `submitText`. Không xóa `welcomeMessage` khỏi state/DB.
5. Dữ liệu đọc/ghi: không có dữ liệu mới và không ghi storage/DB.
6. Phụ thuộc: `App.tsx` gắn class và điều hướng vào các view đã có, `styles.css` render; không đổi `engine.ts` hay `tauriApi.ts`.
7. Bất biến: `UI-001` không gợi ý capability chưa có; `DOC-001` chỉ báo mức kiểm chứng thực tế.
8. Hồi quy cần canh: nút không vượt container, focus/hover còn dùng được, palette không ép chữ dọc; route Lịch thi không bị gắn nhãn Ghi chú, GPA không claim điểm Portal thật.
9. File thay đổi: `src/App.tsx`, `src/styles.css`, `src/navigationLayout.test.js`, tài liệu này và `docs/REGRESSION_MATRIX.md`/`docs/FEATURE_CATALOG.md`/`docs/FLOW_MAP.md`/`docs/STATE_MACHINES.md`.
10. Kiểm chứng: `npx vitest run src/navigationLayout.test.js`, `npm run test:layout`, `npm run build`, `npm run check:postman` (gate độc lập), `cargo check`, `cargo test`, `npm audit`.
11. Evidence trước: `rg -n 'text-overflow: ellipsis|white-space: nowrap' src/styles.css` thấy cặp quy tắc trong `.starter-grid`; sau: test static xác nhận rule cuối `clip`/`normal` và 4/2/1 cột.

## EP và BVA phù hợp UI

| Biến | Lớp hợp lệ | Biên/giới hạn | Kết quả mong đợi |
| --- | --- | --- | --- |
| Bề rộng viewport | `>900px`, `601..900px`, `<=600px` | 901/900, 601/600, 599 px | 4/2/1 cột |
| Độ dài nhãn | ngắn, dài nhiều dòng | 1 dòng/2 dòng trở lên | không cắt nội dung |
| Kiểu lối tắt | nổi bật, thường | 2 ô đầu/6 ô còn lại | tất cả chỉ có đường phân cách; hai ô đầu có icon màu nhấn |
| Kết quả palette | nhãn ngắn, nhãn dài | chữ vượt chiều rộng ô | chữ xuống dòng, icon không co |

Không dùng dãy `tinChi/gpa/monNo/hocKy` của bài BVA mẫu vì màn này không nhận các biến đó.

## Test case

| ID | Điều kiện | Kỳ vọng | Mức kiểm tra |
| --- | --- | --- | --- |
| N01 | 2 lối tắt đầu | Có class nổi bật | Vitest static |
| N02 | 8 lối tắt | Đúng thứ tự 4×2, hai lệnh chat và sáu route có thật | Vitest static; visual pending |
| N03 | Viewport 901 px | 4 cột | Vitest static; visual pending |
| N04 | Viewport 900 px | 2 cột | Vitest static; visual pending |
| N05 | Viewport 601 px | 2 cột | Vitest static; visual pending |
| N06 | Viewport 600 px | 1 cột | Vitest static; visual pending |
| N07 | Viewport 599 px | 1 cột, không tràn ngang | Vitest static; visual pending |
| N08 | Nhãn dài | Xuống dòng, không ellipsis | Vitest static; visual pending |
| N09 | Ô thường/nổi bật | Không có box; hai icon đầu có màu nhấn | Vitest static; visual pending |
| N10 | Kết quả Ctrl+K dài | Icon cố định, phần chữ co và xuống dòng | Vitest static; visual pending |
| N11 | Chưa có hội thoại | Thẻ chào không chiếm dòng phía trên lưới; vẫn giữ trong state | Vitest static; visual pending |
| N12 | Lối tắt lịch thi/GPA/tài liệu | Không gắn nhãn Ghi chú, điểm Portal hoặc Course đã sync khi backend chưa có | Vitest static; visual pending |

`src/navigationLayout.test.js` kiểm các quy tắc nguồn, không chứng minh pixel thực tế; native visual smoke còn `UNKNOWN`. Postman Runner **không áp dụng** vì task chỉ đổi CSS/JSX và không gọi HTTP. `npm run check:postman` là kiểm tra hồi quy collection REST độc lập, không được ghi là chứng cứ cho bố cục.

**Bằng chứng sau thay đổi JSX:** `npx vitest run src/navigationLayout.test.js` 11/11 PASS; `npx vitest run` 142/142 PASS; `npm run test:layout` PASS; `npm run build` PASS; `npm run check:postman` PASS 10 kiểm tra tĩnh, 0 HTTP; `npm audit` 0 vulnerabilities; `git diff --check` PASS. `cargo check --manifest-path src-tauri/Cargo.toml` và `cargo test --manifest-path src-tauri/Cargo.toml` đạt 70/70 ở commit trước; JSX không đổi Rust. `npm run check:all` chưa chạy nguyên lệnh vì bước `free-dev-port` sẽ dừng Vite của clone đang dùng cổng 5173. Ảnh user cung cấp xác nhận sai khác trước sửa, chưa phải manual visual sau sửa; không coi task đã nghiệm thu hoàn toàn.
