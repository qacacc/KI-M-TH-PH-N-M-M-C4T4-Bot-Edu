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
    const invalidRaw = JSON.stringify([{ id: '1' }]); // Thiếu name, credits...
    expect(() => parseGpaSubjects(invalidRaw)).toThrow("Dữ liệu điểm đã lưu không hợp lệ.");
  });

  it('ném lỗi khi dữ liệu JSON chứa giá trị ngoài giới hạn (VD: tín chỉ âm)', () => {
    const invalidRaw = JSON.stringify([{ id: '1', name: 'Hack', credits: -5, letterGrade: 'A', score10: 9 }]);
    expect(() => parseGpaSubjects(invalidRaw)).toThrow();
  });
});