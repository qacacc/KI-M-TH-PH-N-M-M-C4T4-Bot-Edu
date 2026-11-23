# Báo cáo Kiểm thử Chức năng Tính, Phục hồi & Tích hợp Bảng điểm GPA (Task CA-088 / CA-088.02)

> **Trạng thái nghiệm thu (`DOC-001`):**
> * **Hợp nhất PR #9, #16, #26 trên nhánh `feat/tram/ca-088-02-gpa-calculation-fix`:** **`CONFIRMED`** *(Automated Unit & UI Integration Tests — 30/30 tests PASS)*
> * **Phê duyệt Pull Request (#26) & Đóng nhánh chồng lấn (#9, #16):** **`PLANNED`** *(Chờ reviewer duyệt PR #26; PR #9 và PR #16 được đóng sau khi hợp nhất)*

- **Dự án:** Campus Assistant Local (`KI-M-TH-PH-N-M-M-C4T4-Bot-Edu`)
- **Mã Task:** `CA-088` / `CA-088.02` — *Quy tắc tín chỉ nguyên 1–10, xác nhận phục hồi dữ liệu cũ v1→v2 và tích hợp luồng bảng điểm Portal*
- **Nhánh Git (Branch):** `feat/tram/ca-088-02-gpa-calculation-fix` (Hợp nhất nội dung từ PR #9, #16, #26)
- **Người thực hiện:** Nguyễn Thị Ngọc Trâm (`TV05`)
- **Quy chuẩn áp dụng:** `docs/INVARIANTS.md` (`DOC-001`, `AI-006`, `AI-008`, `DATA-001`)

---

## 1. Phạm vi Hợp nhất & Quy tắc Nghiệp vụ Được Kiểm chứng (`CONFIRMED`)

1. **Ràng buộc số tín chỉ nguyên `[1..10]` đồng bộ UI và Logic (`src/gpaData.ts`, `src/components/GpaCalculator.tsx` — `CONFIRMED`):**
   - Ô nhập tín chỉ trên UI (`step={1}`, `min={1}`, `max={10}`) chỉ chấp nhận số nguyên trong đoạn $[1, 10]$; từ chối số thập phân (ví dụ `2.5`) và giá trị ngoài biên (`0`, `11`) kèm thông báo `role="alert"`.
   - `parseGpaSubjects` và `calculateGpaStats` kiểm tra `Number.isInteger(credits) && credits >= 1 && credits <= 10` và bỏ qua các hàng chưa nhập hoàn chỉnh (`credits === ""`, `letterGrade === ""` hoặc `score10 === ""`).
2. **Sửa luồng phục hồi dữ liệu cũ `v1` $\rightarrow$ `v2` có xác nhận (`src/gpaData.ts`, `src/components/GpaCalculator.tsx` — `CONFIRMED`):**
   - Khắc phục lỗi tự động ghi dữ liệu từ `ca_gpa_calculator_data_v1` sang `ca_gpa_calculator_manual_v2` lúc khởi tạo ở PR #9/#16: hàm `loadGpaSubjects()` chỉ đọc trạng thái và bật cờ `hasLegacyV1 = true` mà không tự ý ghi đè khóa `v2`.
   - Việc chuyển dữ liệu từ `v1` sang `v2` chỉ thực hiện khi người dùng chủ động nhấn nút xác nhận và đồng ý trong hộp thoại `window.confirm`.
3. **Bảo vệ dữ liệu hỏng (`Corrupt Data` — hợp nhất từ PR #9/#16 — `CONFIRMED`):**
   - Khi `ca_gpa_calculator_manual_v2` chứa JSON lỗi hoặc sai lược đồ, hệ thống bật `corruptWarning`, tạm ngưng tự động ghi đè `localStorage` để bảo toàn dữ liệu gốc và cung cấp nút cho phép người dùng chủ động đặt lại.
4. **Tích hợp luồng GPA chính thức từ Portal (`src/gpaData.ts`, `src/components/GpaCalculator.tsx`, `src/pages/CampusDataPages.tsx` — `CONFIRMED`):**
   - Bổ sung `calculatePortalGpaStats` tách bạch điểm chính thức từ Portal (`source: "uth-portal"`, `verified: true`) với bảng điểm ước tính nhập tay; không tự sinh GPA giả khi chưa đồng bộ bảng điểm Portal (`DATA-001`) và hỗ trợ nạp môn đã xác minh từ Portal sang bảng ước tính.

---

## 2. Thiết kế Kịch bản Kiểm thử Hộp đen (EP & Standard BVA)

### 2.1. Phân hoạch lớp tương đương (EP)

| Biến / Điều kiện | Lớp hợp lệ (Valid) | Lớp không hợp lệ (Invalid) |
|---|---|---|
| **ID môn học (`id`)** | **V1:** Chuỗi không rỗng, duy nhất trong danh sách | **X1:** Thiếu `id`, `id` rỗng hoặc trùng `id` giữa 2 hàng |
| **Tên môn học (`name`)** | **V2:** Kiểu `string` (cho phép rỗng khi mới thêm hàng) | **X2:** Thiếu trường `name` hoặc sai kiểu dữ liệu |
| **Số tín chỉ (`credits`)** | **V3:** Số nguyên `1 <= credits <= 10` hoặc `""` | **X3:** Thiếu trường, `<= 0`, `> 10`, số thập phân (`2.5`) hoặc chuỗi |
| **Điểm thang 10 (`score10`)** | **V4:** Số thực `0.0 <= score10 <= 10.0` hoặc `""` | **X4:** Thiếu trường, `< 0`, `> 10`, `NaN`/`Infinity` hoặc chuỗi |
| **Điểm chữ (`letterGrade`)** | **V5:** Thuộc `GRADE_CONVERSION` hoặc `""` | **X5:** Thiếu trường hoặc giá trị ngoài allowlist (`"constructor"`) |
| **Di chuyển dữ liệu `v1` $\rightarrow$ `v2`** | **V6:** Người dùng bấm nút phục hồi và xác nhận `OK` | **X6:** Mới tải trang (chưa xác nhận) hoặc bấm `Cancel` |
| **Nguồn dữ liệu Portal** | **V7:** Bản ghi `source: "uth-portal"` và `verified: true` | **X7:** Danh sách rỗng hoặc bản ghi `verified: false` |

### 2.2. Phân tích giá trị biên chuẩn (Standard BVA)

| Biến đầu vào | `min-` | `min` | `min+` | `nominal` | `max-` | `max` | `max+` | Tag biên |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **`score10`** | `-0.1` *(X4)* | `0` *(B1)* | `0.1` *(B2)* | `5.0` *(B3)* | `9.9` *(B4)* | `10` *(B5)* | `10.1` *(X4)* | `B1`..`B5`, `X4` |
| **`credits`** | `0` *(X3)* | `1` *(B6)* | `2` *(B7)* | `3` *(B8)* | `9` *(B9)* | `10` *(B10)* | `11` *(X3)* | `B6`..`B10`, `X3` |

- **Biên trạng thái đặc biệt:**
  - `B11`: Danh sách rỗng (`[]`, `null`, `""`) $\rightarrow$ `parseGpaSubjects` trả về `[]`, `calculateGpaStats` trả về `gpaScale4 = "0.00"`.
  - `B12`: Hàng mới thêm chưa nhập dữ liệu (`credits: "", letterGrade: "", score10: ""`) $\rightarrow$ Bỏ qua khi tính tổng tín chỉ và GPA.
  - `B13`: Cực trị thang 4.0 $\rightarrow$ Toàn điểm `F` trả về `"0.00"`; toàn điểm `A+` trả về `"4.00"`.

---

## 3. Ma trận Truy vết & Kết quả Thực thi Kiểm thử Tự động (`CONFIRMED`)

### 3.1. Bộ Unit Test Logic (`src/gpaData.test.ts` — 24/24 PASS)

| STT | Tên Test Case trong `src/gpaData.test.ts` | Hàm kiểm thử | Tag bao phủ | Kết quả & Phân loại (`DOC-001`) |
|---:|---|---|---|---|
| 1 | `không tụt GPA khi thêm hàng mới chưa nhập điểm` | `calculateGpaStats` | `V1..V5, B8, B12` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 2 | `tính đúng GPA thấp nhất (toàn điểm F)` | `calculateGpaStats` | `V1..V5, B7, B8, B13` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 3 | `tính đúng GPA cao nhất (toàn điểm A+)` | `calculateGpaStats` | `V1..V5, B5, B8, B13` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 4 | `trả về 0.00 khi bảng điểm trống` | `calculateGpaStats` | `B11` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 5 | `không tính grade không thuộc allowlist vào tổng GPA` | `calculateGpaStats` | `X5` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 6 | `tính đúng GPA tại các mốc biên BVA hợp lệ của score10 (0, 0.1, 5.0, 9.9, 10)` | `calculateGpaStats` | `B1, B2, B3, B4, B5, B6` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 7 | `tính đúng GPA tại các mốc biên BVA hợp lệ của credits (1, 2, 3, 9, 10)` | `calculateGpaStats` | `B6, B7, B8, B9, B10` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 8 | `bỏ qua môn học có tín chỉ thập phân hoặc ngoài biên [1..10] khi tính GPA` | `calculateGpaStats` | `X3` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 9 | `parse thành công mảng rỗng khi truyền null hoặc chuỗi rỗng` | `parseGpaSubjects` | `B11` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 10 | `parse thành công dữ liệu JSON hợp lệ có chứa giá trị rỗng` | `parseGpaSubjects` | `V1..V5, B12` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 11 | `chấp nhận các giá trị biên BVA hợp lệ của score10 (0, 0.1, 9.9, 10) và credits (1, 2, 9, 10)` | `parseGpaSubjects` | `B1, B2, B4, B5, B6, B7, B9, B10` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 12 | `từ chối score10 ngoài biên (-0.1 và 10.1)` | `parseGpaSubjects` | `X4` (`min-`, `max+`) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 13 | `từ chối credits ngoài biên (0 và 11) hoặc dạng số thập phân (2.5)` | `parseGpaSubjects` | `X3` (`min-`, `max+`, decimal) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 14 | `từ chối danh sách có hai môn học trùng ID` | `parseGpaSubjects` | `X1` (Duplicate ID) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 15 | `ném lỗi độc lập khi thiếu trường bắt buộc id` | `parseGpaSubjects` | `X1` (Single fault) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 16 | `ném lỗi độc lập khi thiếu trường bắt buộc name` | `parseGpaSubjects` | `X2` (Single fault) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 17 | `ném lỗi độc lập khi thiếu trường bắt buộc credits` | `parseGpaSubjects` | `X3` (Single fault) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 18 | `ném lỗi độc lập khi thiếu trường bắt buộc letterGrade` | `parseGpaSubjects` | `X5` (Single fault) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 19 | `ném lỗi độc lập khi thiếu trường bắt buộc score10` | `parseGpaSubjects` | `X4` (Single fault) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 20 | `ném lỗi khi dữ liệu không phải mảng hoặc sai kiểu dữ liệu` | `parseGpaSubjects` | `X1, X3` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 21 | `lưu và nạp dữ liệu v2 thành công mà không báo lỗi hỏng` | `saveGpaSubjects`, `loadGpaSubjects` | `V1..V5` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 22 | `KHÔNG tự động ghi dữ liệu v1 sang v2 lúc tải khi chưa có xác nhận` | `loadGpaSubjects` | `X6` | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 23 | `bắt lỗi và bật cờ isCorrupted khi dữ liệu v2 bị hỏng` | `loadGpaSubjects` | `X1` (Corrupt JSON) | **PASS** — **`CONFIRMED`** *(Vitest)* |
| 24 | `tính GPA chính thức từ bảng điểm Portal đã xác minh và bỏ qua bản ghi chưa xác minh` | `calculatePortalGpaStats` | `V7, X7` | **PASS** — **`CONFIRMED`** *(Vitest)* |

### 3.2. Bộ UI Integration Test (`src/components/GpaCalculator.test.tsx` — 6/6 PASS — `AUTOMATED`)

| STT | Tên Test Case trong `src/components/GpaCalculator.test.tsx` | Tag bao phủ | Kết quả & Phân loại (`DOC-001` / `AI-008`) |
|---:|---|---|---|
| 1 | `thêm hàng Pending không làm tụt GPA` | `B12` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 2 | `nhập điểm F thật sự được tính vào GPA` | `V3, V4, V5` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 3 | `chặn tín chỉ thập phân hoặc ngoài khoảng nguyên 1-10 trên UI` | `X3` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 4 | `không tự ghi v1 sang v2 lúc tải và chỉ phục hồi khi người dùng xác nhận` | `V6, X6` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 5 | `bảo vệ dữ liệu v2 bị hỏng và cho phép đặt lại an toàn` | `Corrupt Data` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 6 | `tính đúng GPA chính thức từ bảng điểm Portal và cho phép nạp sang bảng ước tính` | `V7` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |

---

## 4. Lệnh Kiểm chứng & Bằng chứng Thực thi (`AI-006`)

- **Lệnh thực thi:** `npx vitest run src/gpaData.test.ts src/components/GpaCalculator.test.tsx` và `npm run check:all`
- **Kết quả kiểm thử GPA hợp nhất (`CONFIRMED`):**
  - `src/gpaData.test.ts`: **24 passed (24)**
  - `src/components/GpaCalculator.test.tsx`: **6 passed (6)**
- **Kết quả kiểm thử toàn cục (`CONFIRMED` — `npm run check:all`):**
  - `vitest run`: **14 test files passed (14) | 128 tests passed (128)**
  - `test:layout`, `check:postman`, `tsc && vite build`, `cargo check`, `cargo test` (61 passed), `npm audit` (0 vulnerabilities): **PASS 100%**.