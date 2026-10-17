import { describe, it, expect } from 'vitest';
import { calculateGpaStats, parseGpaSubjects } from './gpaData';
import type { GpaSubject } from './components/GpaCalculator';

describe('GPA Calculation - CA-088.02', () => {
  it('không tụt GPA khi thêm hàng mới chưa nhập điểm', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Toán', credits: 3, letterGrade: 'A', score10: 8.5 },
      { id: '2', name: 'Môn mới', credits: '', letterGrade: '', score10: '' }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(3);
    expect(result.gpaScale4).toBe('3.70');
  });

  it('tính đúng điểm F (0.0) khi sinh viên thực sự trượt', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Toán', credits: 3, letterGrade: 'A', score10: 8.5 },
      { id: '2', name: 'Triết', credits: 2, letterGrade: 'F', score10: 2.0 }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(5);
    // (3.7 * 3 + 0.0 * 2) / 5 = 11.1 / 5 = 2.22
    expect(result.gpaScale4).toBe('2.22');
  });

  it('trả về 0.00 khi bảng điểm trống hoặc chưa nhập điểm môn nào', () => {
    const subjects: GpaSubject[] = [
      { id: '1', name: 'Môn mới 1', credits: '', letterGrade: '', score10: '' },
      { id: '2', name: 'Môn mới 2', credits: 2, letterGrade: '', score10: '' }
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(0);
    expect(result.gpaScale4).toBe('0.00');
  });
  
  it('parseGpaSubjects xử lý đúng dữ liệu JSON chứa giá trị rỗng', () => {
    const raw = JSON.stringify([
       { id: '1', name: 'CS101', credits: '', letterGrade: '', score10: '' }
    ]);
    const parsed = parseGpaSubjects(raw);
    expect(parsed[0].letterGrade).toBe('');
    expect(parsed[0].credits).toBe('');
  });
});