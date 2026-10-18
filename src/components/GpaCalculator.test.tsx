import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GpaCalculator } from './GpaCalculator';

describe('GpaCalculator UI Integration Tests (CA-088.02)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('thêm hàng Pending không làm tụt GPA', () => {
    render(<GpaCalculator />);
    
    // Giả lập thao tác người dùng: Bấm nút "Thêm môn học"
    const addBtn = screen.getByText('Thêm môn học');
    fireEvent.click(addBtn);

    // Xác nhận ô nhập tên môn đã xuất hiện (hàng mới đã render)
    expect(screen.getByPlaceholderText('Nhập tên môn...')).toBeDefined();
    
    // Xác nhận hệ thống KHÔNG tính GPA cho hàng trống (GPA vẫn ở 0.00)
    const gpaElements = screen.getAllByText('0.00');
    expect(gpaElements.length).toBeGreaterThan(0);
  });

  it('nhập điểm F thật sự sẽ làm thay đổi hệ thống', () => {
    render(<GpaCalculator />);
    
    // Giả lập thao tác người dùng
    fireEvent.click(screen.getByText('Thêm môn học'));

    // Người dùng nhập Tín chỉ = 3
    const creditInput = screen.getByPlaceholderText('TC');
    fireEvent.change(creditInput, { target: { value: '3' } });

    // Người dùng nhập Điểm 10 = 2 (Tương đương điểm F)
    const scoreInput = screen.getByPlaceholderText('Trống');
    fireEvent.change(scoreInput, { target: { value: '2' } });

    // Cột Điểm Chữ (read-only) phải tự động hiển thị giá trị 'F'
    const letterInput = screen.getByPlaceholderText('Tự động') as HTMLInputElement;
    expect(letterInput.value).toBe('F');
  });
});