# Báo cáo Kiểm thử Chức năng Tính & Xác thực Dữ liệu GPA (Task CA-088.02)

> **Trạng thái nghiệm thu (`DOC-001`):**
> * **Subtask `CA-088.02` (Logic tính GPA & Xác thực đầu vào):** **`CONFIRMED`** *(Automated Unit & Integration Tests — 22/22 tests PASS)*
> * **Task cha `CA-088` (Hoàn thiện toàn bộ luồng lưu/phục hồi dữ liệu cũ & UI thủ công trên bản cài đặt):** **`PLANNED`** *(Task cha vẫn giữ trạng thái `Proposed` / `In Progress` cho tới khi hoàn tất luồng phục hồi legacy v1 và duyệt PR #26)*

* **Dự án:** Campus Assistant Local (`KI-M-TH-PH-N-M-M-C4T4-Bot-Edu`)
* **Mã Task:** `CA-088.02` — *GPA không tính hàng đang nhập & xác thực dữ liệu bảng điểm*
* **Nhánh Git (Branch):** `feat/tram/ca-088-02-gpa-calculation-fix`
* **Người thực hiện:** Nguyễn Thị Ngọc Trâm (`TV05`)
* **Quy chuẩn áp dụng:** `docs/INVARIANTS.md` (`DOC-001`, `AI-006`, `AI-008`, `DATA-001`)

---

## 1. Phạm vi & Quy tắc Nghiệp vụ Được Kiểm chứng (`CONFIRMED`)

1. **Bỏ qua hàng chưa hoàn tất (`src/gpaData.ts:45-64` — `CONFIRMED`):** Các môn học mới thêm có `credits === ""`, `letterGrade === ""` hoặc `score10 === ""` không được cộng vào `totalCredits`, không kéo tụt `gpaScale4` hay `gpaScale10`.
2. **Ràng buộc số tín chỉ nguyên `[1..10]` (`src/gpaData.ts:29-31, 49-51` — `CONFIRMED`):** Số tín chỉ hợp lệ khi lưu trữ và tính toán phải là **số nguyên** trong đoạn `[1, 10]` (`Number.isInteger`). Số tín chỉ thập phân (ví dụ `2.5`) hoặc ngoài khoảng (`0`, `11`) đều bị từ chối khi parse và bị loại khi tính GPA.
3. **Tính duy nhất của `id` môn học (`src/gpaData.ts:22, 27, 40` — `CONFIRMED`):** `parseGpaSubjects` kiểm tra `seenIds` để từ chối mảng JSON chứa hai môn học trùng `id`, ngăn lỗi sửa/xóa nhầm hàng trên giao diện React.
4. **Ràng buộc điểm thang 10 và điểm chữ (`src/gpaData.ts:32-37` — `CONFIRMED`):** `score10` hợp lệ thuộc đoạn thực `[0.0, 10.0]` (hoặc `""`); `letterGrade` phải nằm trong allowlist `GRADE_CONVERSION` (`A+`, `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F`) hoặc `""`.

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

### 2.2. Phân tích giá trị biên chuẩn (Standard BVA)

| Biến đầu vào | `min-` | `min` | `min+` | `nominal` | `max-` | `max` | `max+` | Tag biên |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| **`score10`** | `-0.1` *(X4)* | `0` *(B1)* | `0.1` *(B2)* | `5.0` *(B3)* | `9.9` *(B4)* | `10` *(B5)* | `10.1` *(X4)* | `B1`..`B5`, `X4` |
| **`credits`** | `0` *(X3)* | `1` *(B6)* | `2` *(B7)* | `3` *(B8)* | `9` *(B9)* | `10` *(B10)* | `11` *(X3)* | `B6`..`B10`, `X3` |

* **Biên trạng thái đặc biệt:**
  * `B11`: Danh sách rỗng (`[]`, `null`, `""`) $\rightarrow$ `parseGpaSubjects` trả về `[]`, `calculateGpaStats` trả về `gpaScale4 = "0.00"`.
  * `B12`: Hàng mới thêm chưa nhập dữ liệu (`credits: "", letterGrade: "", score10: ""`) $\rightarrow$ Bỏ qua khi tính tổng tín chỉ và GPA.
  * `B13`: Cực trị thang 4.0 $\rightarrow$ Toàn điểm `F` trả về `"0.00"`; toàn điểm `A+` trả về `"4.00"`.

---

## 3. Ma trận Truy vết & Kết quả Thực thi Kiểm thử Tự động (`CONFIRMED`)

### 3.1. Bộ Unit Test Logic (`src/gpaData.test.ts` — 20/20 PASS)

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

### 3.2. Bộ UI Integration Test (`src/components/GpaCalculator.test.tsx` — 2/2 PASS — `AUTOMATED`)

| STT | Tên Test Case trong `src/components/GpaCalculator.test.tsx` | Kết quả & Phân loại (`DOC-001` / `AI-008`) |
|---:|---|---|
| 1 | `thêm hàng Pending không làm tụt GPA` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |
| 2 | `nhập điểm F thật sự được tính vào GPA` | **PASS** — **`CONFIRMED`** *(Automated jsdom test — `AI-008`)* |

---

## 4. Lệnh Kiểm chứng & Bằng chứng Thực thi (`AI-006`)

* **Lệnh thực thi:** `npx vitest run src/gpaData.test.ts src/components/GpaCalculator.test.tsx` và `npm run check:all`
* **Kết quả kiểm thử GPA (`CONFIRMED`):**
  * `src/gpaData.test.ts`: **20 passed (20)**
  * `src/components/GpaCalculator.test.tsx`: **2 passed (2)**
* **Kết quả kiểm thử toàn cục (`CONFIRMED` — `npm run check:all`):**
  * `vitest run`: **14 test files passed (14) | 120 tests passed (120)**
  * `test:layout`, `check:postman`, `tsc && vite build`, `cargo check`, `cargo test` (61 passed), `npm audit` (0 vulnerabilities): **PASS**.
* **Giới hạn phạm vi (`PLANNED`):** Luồng phục hồi bảng điểm legacy (`ca_gpa_calculator_data_v1`) và kiểm thử trực quan thủ công trên ứng dụng desktop đóng gói vẫn thuộc phạm vi mở rộng của task cha `CA-088` (`Proposed`).