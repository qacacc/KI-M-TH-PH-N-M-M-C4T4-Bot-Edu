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
});