/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GPA_STORAGE_KEY } from "../gpaData";
import { GpaCalculator } from "./GpaCalculator";

describe("GpaCalculator UI Integration Tests (CA-088.02)", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("thêm hàng Pending không làm tụt GPA", () => {
    localStorage.setItem(
      GPA_STORAGE_KEY,
      JSON.stringify([
        { id: "existing", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 },
      ]),
    );

    render(<GpaCalculator />);
    expect(screen.getByText("3.70")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));

    expect(screen.getByText("3.70")).toBeTruthy();
    expect(screen.getAllByPlaceholderText("Nhập tên môn...")).toHaveLength(2);
  });

  it("nhập điểm F thật sự được tính vào GPA", () => {
    render(<GpaCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));

    const scoreInput = screen.getAllByRole("spinbutton")[1];
    fireEvent.change(scoreInput, { target: { value: "2" } });

    expect((screen.getByPlaceholderText("Tự động") as HTMLInputElement).value).toBe("F");
    expect(screen.getAllByText("0.00")).toHaveLength(2);
  });
});
