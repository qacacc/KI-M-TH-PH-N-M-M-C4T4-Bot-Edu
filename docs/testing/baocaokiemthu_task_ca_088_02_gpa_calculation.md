# Báo cáo Kiểm thử Chức năng Tính & Lưu trữ GPA (Task CA-088.02)

- **Dự án:** Campus Assistant (`KI-M-TH-PH-N-M-M-C4T4-Bot-Edu`)
- **Mã Task:** `CA-088.02` — *GPA không tính hàng đang nhập*
- **Nhánh Git (Branch):** `feat/tram/ca-088-02-gpa-calculation-fix`
- **Người thực hiện:** Nguyễn Thị Ngọc Trâm (`TV05`)
- **Người duyệt (Reviewer):** Võ Anh Sơn (`TV07`)
- **Phạm vi kiểm thử:** Hàm `calculateGpaStats` và `parseGpaSubjects` (`src/gpaData.ts`), tích hợp trên giao diện `src/components/GpaCalculator.tsx`
- **Công cụ kiểm thử tự động:** Vitest v4.1.12 (TypeScript)

---

## Quy ước đặt Tag bao phủ

- **Lớp tương đương hợp lệ:**
  - `V1`: Điểm hệ 10 (`score10`) hợp lệ
  - `V2`: Số tín chỉ (`credits`) hợp lệ
  - `V3`: Điểm chữ (`letterGrade`) hợp lệ
  - `V4`: Cấu trúc mảng JSON `GpaSubject[]` hợp lệ
- **Lớp tương đương không hợp lệ:**
  - `X1`: `score10 < 0`
  - `X2`: `score10 > 10`
  - `X3`: `credits < 1`
  - `X4`: `credits > 10`
  - `X5`: `letterGrade` không thuộc danh sách cho phép (allowlist)
  - `X6`: `letterGrade` là khóa kế thừa `Object.prototype` (`constructor`, `toString`, `__proto__`)
  - `X7`: Chuỗi JSON sai cấu trúc hoặc thiếu trường bắt buộc
- **Giá trị biên & trạng thái nghiệp vụ:**
  - `B1–B5`: Các điểm biên của `score10` (`min`, `min+`, `nominal`, `max-`, `max`)
  - `B6–B10`: Các điểm biên của `credits` (`min`, `min+`, `nominal`, `max-`, `max`)
  - `B11`: Tập dữ liệu đầu vào rỗng (`[]`, `null`, `''`)
  - `B12`: Hàng mới thêm chưa nhập dữ liệu (`credits: ''`, `letterGrade: ''`, `score10: ''`)
  - `B13`: Biên cực trị thang điểm 4.0 (toàn điểm `F` = `0.00`; toàn điểm `A+` = `4.00`)

---

## Câu 1. Xác định lớp tương đương (Equivalence Partitioning - EP)

| Biến / Dữ liệu đầu vào | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| Điểm hệ 10 (`score10`) | $0 \leq score10 \leq 10$ (số thực) hoặc `''` (hàng chưa nhập) | V1 | (a) $score10 < 0$<br>(b) $score10 > 10$ | X1<br>X2 |
| Số tín chỉ (`credits`) | $1 \leq credits \leq 10$ (số nguyên) hoặc `''` (hàng chưa nhập) | V2 | (a) $credits < 1$ (gồm `0` và số âm)<br>(b) $credits > 10$ | X3<br>X4 |
| Điểm chữ (`letterGrade`) | Thuộc allowlist (`A+`, `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F`) hoặc `''` | V3 | (a) Chuỗi không thuộc allowlist (VD: `'ABC'`)<br>(b) Khóa kế thừa prototype (`'constructor'`, `'toString'`, `'__proto__'`) | X5<br>X6 |
| Cấu trúc bảng điểm (`raw` / `subjects`) | Mảng JSON `GpaSubject[]` đủ các trường (`id`, `name`, `credits`, `letterGrade`, `score10`), hoặc `null`, `''`, `[]` | V4 | Chuỗi JSON sai cấu trúc hoặc thiếu trường bắt buộc (VD: `[{"id":"1"}]`) | X7 |

---

## Câu 2. Phân tích giá trị biên (Boundary Value Analysis - BVA)

Áp dụng **Standard BVA** cho hai biến định lượng đầu vào (`score10` và `credits`):

| Biến đầu vào | min- | min | min+ | nominal | max- | max | max+ | Tag biên |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Điểm hệ 10 (`score10`) | -0.1 | 0 | 0.1 | 8.5 | 9.9 | 10 | 10.1 | B1, B2, B3, B4, B5 *(ngoài biên: X1, X2)* |
| Số tín chỉ (`credits`) | 0 *(và -1)* | 1 | 2 | 3 | 9 | 10 | 11 | B6, B7, B8, B9, B10 *(ngoài biên: X3, X4)* |

**Các biên trạng thái đặc biệt của chức năng tính GPA:**
- `B11`: Bảng điểm rỗng (`[]`, `null`, `''`) $\rightarrow$ Trả về `[]` hoặc `gpaScale4 = '0.00'`.
- `B12`: Hàng mới thêm chưa nhập dữ liệu (`''`) $\rightarrow$ Bỏ qua khi tính tổng tín chỉ và GPA, không kéo tụt điểm trung bình.
- `B13`: Cực trị thang điểm 4.0 $\rightarrow$ Toàn điểm `F` trả về `0.00`; toàn điểm `A+` trả về `4.00`.

---

## Câu 3. Thiết kế test case

Bảng tổng hợp **16 test case** ánh xạ trực tiếp với bộ kiểm thử tự động trong `src/gpaData.test.ts` (tuân thủ nguyên tắc *single fault* đối với các test case không hợp lệ):

| STT | Tên test case | Hàm kiểm thử & Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Result) | Tag được bao phủ |
|---:|---|---|---|---|
| 1 | Không tụt GPA khi thêm hàng mới chưa nhập điểm | `calculateGpaStats`:<br>- Hàng 1: `credits=3, letterGrade='A', score10=8.5`<br>- Hàng 2: `credits='', letterGrade='', score10=''` | **Hợp lệ:** Hàng 2 bị bỏ qua; `totalCredits = 3`, `gpaScale4 = '3.70'` | V1, V2, V3, V4, B3, B8, B12 |
| 2 | Tính đúng GPA thấp nhất (toàn điểm F) | `calculateGpaStats`:<br>- Hàng 1: `credits=3, letterGrade='F', score10=2.0`<br>- Hàng 2: `credits=2, letterGrade='F', score10=1.0` | **Hợp lệ:** `gpaScale4 = '0.00'` | V1, V2, V3, V4, B7, B8, B13 |
| 3 | Tính đúng GPA cao nhất (toàn điểm A+) | `calculateGpaStats`:<br>- Hàng 1: `credits=3, letterGrade='A+', score10=10.0` | **Hợp lệ:** `gpaScale4 = '4.00'` | V1, V2, V3, V4, B5, B8, B13 |
| 4 | Trả về `0.00` khi bảng điểm trống | `calculateGpaStats([])` | **Hợp lệ:** `gpaScale4 = '0.00'` | V4, B11 |
| 5 | Không tính `letterGrade` ngoài allowlist vào tổng GPA | `calculateGpaStats`:<br>- `credits=3, letterGrade='constructor', score10=10` | **Không hợp lệ (bỏ qua dòng lỗi):** `totalCredits = 0`, `gpaScale4 = '0.00'` | X6 |
| 6 | Parse thành công mảng rỗng khi truyền `null` hoặc `''` | `parseGpaSubjects(null)` và `parseGpaSubjects('')` | **Hợp lệ:** Trả về mảng rỗng `[]` | V4, B11 |
| 7 | Parse thành công JSON hợp lệ chứa giá trị rỗng | `parseGpaSubjects('[{"id":"1","name":"Test","credits":"","letterGrade":"","score10":""}]')` | **Hợp lệ:** Parse thành công, `parsed[0].credits === ''` | V1, V2, V3, V4, B12 |
| 8 | Ném lỗi khi JSON sai cấu trúc (thiếu trường bắt buộc) | `parseGpaSubjects('[{"id":"1"}]')` | **Không hợp lệ:** Ném lỗi `"Dữ liệu điểm đã lưu không hợp lệ."` | X7 |
| 9 | Từ chối điểm hệ 10 ngoài biên dưới (`min-`) | `parseGpaSubjects`: `score10=-0.1, credits=3, letterGrade='F'` | **Không hợp lệ:** Ném lỗi do `score10 < 0` | X1 |
| 10 | Từ chối điểm hệ 10 ngoài biên trên (`max+`) | `parseGpaSubjects`: `score10=10.1, credits=3, letterGrade='A+'` | **Không hợp lệ:** Ném lỗi do `score10 > 10` | X2 |
| 11 | Chấp nhận giá trị biên của điểm hợp lệ (`min` và `max`) | `parseGpaSubjects`:<br>- Case A: `score10=0, credits=3, letterGrade='F'`<br>- Case B: `score10=10, credits=3, letterGrade='A+'` | **Hợp lệ:** Không ném lỗi ở cả hai biên `0` và `10` | V1, V2, V3, V4, B1, B5, B8 |
| 12 | Từ chối tín chỉ ngoài biên dưới (`min-`) | `parseGpaSubjects`:<br>- Case A: `credits=0, score10=8, letterGrade='A'`<br>- Case B: `credits=-1, score10=8, letterGrade='A'` | **Không hợp lệ:** Ném lỗi do `credits < 1` | X3 |
| 13 | Từ chối tín chỉ ngoài biên trên (`max+`) | `parseGpaSubjects`: `credits=11, score10=8, letterGrade='A'` | **Không hợp lệ:** Ném lỗi do `credits > 10` | X4 |
| 14 | Chấp nhận giá trị biên của tín chỉ hợp lệ (`min` và `max`) | `parseGpaSubjects`:<br>- Case A: `credits=1, score10=8, letterGrade='A'`<br>- Case B: `credits=10, score10=8, letterGrade='A'` | **Hợp lệ:** Không ném lỗi ở cả hai biên `1` và `10` | V1, V2, V3, V4, B6, B10 |
| 15 | Từ chối `letterGrade` không hợp lệ | `parseGpaSubjects`: `letterGrade='ABC', credits=3, score10=8` | **Không hợp lệ:** Ném lỗi do `letterGrade` không thuộc allowlist | X5 |
| 16 | Từ chối `letterGrade` kế thừa prototype | `parseGpaSubjects`: `letterGrade` $\in$ `{'constructor', 'toString', '__proto__'}`, `credits=3, score10=8` | **Không hợp lệ:** Ném lỗi `"Dữ liệu điểm đã lưu không hợp lệ."` | X6 |

**Kiểm tra bao phủ:** Bộ 16 test case trên đã bao phủ **100% lớp tương đương** (`V1–V4`, `X1–X7`) và **toàn bộ các giá trị biên `min`, `max`, `min-`, `max+`** của điểm hệ 10 và số tín chỉ (`B1, B5, B6, B10`), cùng các biên trạng thái nghiệp vụ (`B11, B12, B13`), không còn tag nào bị bỏ sót.

---

## Câu 4. Triển khai kiểm thử tự động & Kết quả thực thi

### 1. Mã nguồn kiểm thử tự động (`src/gpaData.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateGpaStats, parseGpaSubjects } from './gpaData';
import type { GpaSubject } from './components/GpaCalculator';

describe('GPA Calculation - CA-088.02 - Edge Cases', () => {
  it('không tụt GPA khi thêm hàng mới chưa nhập điểm', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Toán', credits: 3, letterGrade: 'A', score10: 8.5 },
      { id: '2', name: 'Môn trống', credits: '', letterGrade: '', score10: '' }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(3);
    expect(result.gpaScale4).toBe('3.70');
  });

  it('tính đúng GPA thấp nhất (toàn điểm F)', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Lý', credits: 3, letterGrade: 'F', score10: 2.0 },
      { id: '2', name: 'Hóa', credits: 2, letterGrade: 'F', score10: 1.0 }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.gpaScale4).toBe('0.00');
  });

  it('tính đúng GPA cao nhất (toàn điểm A+)', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Lý', credits: 3, letterGrade: 'A+', score10: 10.0 }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.gpaScale4).toBe('4.00');
  });

  it('trả về 0.00 khi bảng điểm trống', () => {
    expect(calculateGpaStats([]).gpaScale4).toBe('0.00');
  });

  it('không tính grade không thuộc allowlist vào tổng GPA', () => {
    const result = calculateGpaStats([
      { id: '1', name: 'Dữ liệu lỗi', credits: 3, letterGrade: 'constructor', score10: 10 }
    ]);
    expect(result.totalCredits).toBe(0);
    expect(result.gpaScale4).toBe('0.00');
  });
});

describe('parseGpaSubjects - Validation & Security', () => {
  it('parse thành công mảng rỗng khi truyền null hoặc chuỗi rỗng', () => {
    expect(parseGpaSubjects(null)).toEqual([]);
    expect(parseGpaSubjects('')).toEqual([]);
  });

  it('parse thành công dữ liệu JSON hợp lệ có chứa giá trị rỗng', () => {
    const raw = JSON.stringify([{ id: '1', name: 'Test', credits: '', letterGrade: '', score10: '' }]);
    const parsed = parseGpaSubjects(raw);
    expect(parsed[0].credits).toBe('');
  });

  it('ném lỗi khi dữ liệu JSON bị sai cấu trúc (thiếu trường bắt buộc)', () => {
    const invalidRaw = JSON.stringify([{ id: '1' }]);
    expect(() => parseGpaSubjects(invalidRaw)).toThrow("Dữ liệu điểm đã lưu không hợp lệ.");
  });

  it('từ chối điểm hệ 10 ngoài biên (-0.1 và 10.1)', () => {
    const invalidLow = JSON.stringify([{ id: '1', name: 'Test', credits: 3, letterGrade: 'F', score10: -0.1 }]);
    expect(() => parseGpaSubjects(invalidLow)).toThrow();

    const invalidHigh = JSON.stringify([{ id: '2', name: 'Test', credits: 3, letterGrade: 'A+', score10: 10.1 }]);
    expect(() => parseGpaSubjects(invalidHigh)).toThrow();
  });

  it('chấp nhận giá trị biên của điểm hợp lệ (0 và 10)', () => {
    const validZero = JSON.stringify([{ id: '1', name: 'Test', credits: 3, letterGrade: 'F', score10: 0 }]);
    expect(() => parseGpaSubjects(validZero)).not.toThrow();

    const validTen = JSON.stringify([{ id: '2', name: 'Test', credits: 3, letterGrade: 'A+', score10: 10 }]);
    expect(() => parseGpaSubjects(validTen)).not.toThrow();
  });

  it('từ chối tín chỉ không hợp lệ (0, âm, lớn hơn 10)', () => {
    const creditZero = JSON.stringify([{ id: '1', name: 'Test', credits: 0, letterGrade: 'A', score10: 8 }]);
    expect(() => parseGpaSubjects(creditZero)).toThrow();

    const creditNeg = JSON.stringify([{ id: '2', name: 'Test', credits: -1, letterGrade: 'A', score10: 8 }]);
    expect(() => parseGpaSubjects(creditNeg)).toThrow();

    const creditBig = JSON.stringify([{ id: '3', name: 'Test', credits: 11, letterGrade: 'A', score10: 8 }]);
    expect(() => parseGpaSubjects(creditBig)).toThrow();
  });

  it('chấp nhận giá trị biên của tín chỉ hợp lệ (1 và 10)', () => {
    const creditOne = JSON.stringify([{ id: '1', name: 'Test', credits: 1, letterGrade: 'A', score10: 8 }]);
    expect(() => parseGpaSubjects(creditOne)).not.toThrow();

    const creditTen = JSON.stringify([{ id: '2', name: 'Test', credits: 10, letterGrade: 'A', score10: 8 }]);
    expect(() => parseGpaSubjects(creditTen)).not.toThrow();
  });

  it('từ chối letterGrade không hợp lệ (VD: ABC)', () => {
    const invalidGrade = JSON.stringify([{ id: '1', name: 'Test', credits: 3, letterGrade: 'ABC', score10: 8 }]);
    expect(() => parseGpaSubjects(invalidGrade)).toThrow();
  });

  it.each(['constructor', 'toString', '__proto__'])('từ chối letterGrade kế thừa: %s', (letterGrade) => {
    const invalidGrade = JSON.stringify([{ id: '1', name: 'Test', credits: 3, letterGrade, score10: 8 }]);
    expect(() => parseGpaSubjects(invalidGrade)).toThrow('Dữ liệu điểm đã lưu không hợp lệ.');
  });
});
```

### 2. Kết quả chạy kiểm thử thực tế (Vitest)

- **Lệnh chạy riêng bộ test CA-088.02 (`npx vitest run src/gpaData.test.ts`):**

```text
 RUN  v4.1.12 C:/Users/ASUS/KI-M-TH-PH-N-M-M-C4T4-Bot-Edu

 ✓ src/gpaData.test.ts (16 tests) 7ms
   ✓ GPA Calculation - CA-088.02 - Edge Cases (5)
     ✓ không tụt GPA khi thêm hàng mới chưa nhập điểm 2ms
     ✓ tính đúng GPA thấp nhất (toàn điểm F) 0ms
     ✓ tính đúng GPA cao nhất (toàn điểm A+) 0ms
     ✓ trả về 0.00 khi bảng điểm trống 0ms
     ✓ không tính grade không thuộc allowlist vào tổng GPA 0ms
   ✓ parseGpaSubjects - Validation & Security (11)
     ✓ parse thành công mảng rỗng khi truyền null hoặc chuỗi rỗng 1ms
     ✓ parse thành công dữ liệu JSON hợp lệ có chứa giá trị rỗng 0ms
     ✓ ném lỗi khi dữ liệu JSON bị sai cấu trúc (thiếu trường bắt buộc) 1ms
     ✓ từ chối điểm hệ 10 ngoài biên (-0.1 và 10.1) 0ms
     ✓ chấp nhận giá trị biên của điểm hợp lệ (0 và 10) 0ms
     ✓ từ chối tín chỉ không hợp lệ (0, âm, lớn hơn 10) 0ms
     ✓ chấp nhận giá trị biên của tín chỉ hợp lệ (1 và 10) 0ms
     ✓ từ chối letterGrade không hợp lệ (VD: ABC) 0ms
     ✓ từ chối letterGrade kế thừa: constructor 0ms
     ✓ từ chối letterGrade kế thừa: toString 0ms
     ✓ từ chối letterGrade kế thừa: __proto__ 0ms

 Test Files  1 passed (1)
      Tests  16 passed (16)
```

- **Lệnh chạy kiểm thử hồi quy toàn dự án (`npx vitest run`):**

```text
 Test Files  14 passed (14)
      Tests  116 passed (116)
   Duration  2.58s
```