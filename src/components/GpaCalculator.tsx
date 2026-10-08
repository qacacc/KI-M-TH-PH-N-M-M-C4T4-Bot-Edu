import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator, RotateCcw } from "lucide-react";
import { GPA_STORAGE_KEY, GPA_LEGACY_STORAGE_KEY, parseGpaSubjects } from "../gpaData";

export interface GpaSubject {
  id: string;
  name: string;
  credits: number;
  letterGrade: string; // A+, A, B+, B, C+, C, D+, D, F
  score10: number;
}

const GRADE_CONVERSION: Record<string, { scale4: number; defaultScore10: number }> = {
  "A+": { scale4: 4.0, defaultScore10: 9.5 },
  A: { scale4: 3.7, defaultScore10: 8.5 },
  "B+": { scale4: 3.5, defaultScore10: 8.0 },
  B: { scale4: 3.0, defaultScore10: 7.2 },
  "C+": { scale4: 2.5, defaultScore10: 6.5 },
  C: { scale4: 2.0, defaultScore10: 5.8 },
  "D+": { scale4: 1.5, defaultScore10: 5.0 },
  D: { scale4: 1.0, defaultScore10: 4.2 },
  F: { scale4: 0.0, defaultScore10: 2.0 },
};

export function GpaCalculator() {
  const [notice, setNotice] = useState("");
  const [stored] = useState(() => {
    try {
      return { subjects: parseGpaSubjects(localStorage.getItem(GPA_STORAGE_KEY)), failed: false };
    } catch {
      return { subjects: [] as GpaSubject[], failed: true };
    }
  });
  const storageFailed = stored.failed;
  const [subjects, setSubjects] = useState<GpaSubject[]>(stored.subjects);

  useEffect(() => {
    if (storageFailed) return;
    try {
      localStorage.setItem(GPA_STORAGE_KEY, JSON.stringify(subjects));
    } catch {
      setNotice("Không lưu được điểm trên thiết bị. Dữ liệu hiện tại chỉ còn trong phiên này.");
    }
  }, [subjects, storageFailed]);

  function addSubject() {
    const nextItem: GpaSubject = {
      id: crypto.randomUUID(),
      name: "",
      credits: 1,
      letterGrade: "F",
      score10: 0,
    };
    setSubjects([...subjects, nextItem]);
  }

  function removeSubject(id: string) {
    if (!window.confirm("Xóa môn học đã nhập khỏi bảng điểm trên thiết bị?")) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  }

  function updateSubject(id: string, fields: Partial<GpaSubject>) {
    setSubjects(
      subjects.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...fields };
        return updated;
      })
    );
  }

  function resetToDefault() {
    if (!window.confirm("Phục hồi dữ liệu điểm phiên bản cũ? Dữ liệu đó có thể chứa điểm mẫu, chưa được xác minh từ trường và sẽ thay bảng hiện tại.")) return;
    try {
      setSubjects(parseGpaSubjects(localStorage.getItem(GPA_LEGACY_STORAGE_KEY)));
      setNotice("Đã phục hồi dữ liệu cũ chưa xác minh. Hãy kiểm tra từng điểm với bảng điểm trường.");
    } catch {
      setNotice("Không đọc được dữ liệu cũ; bảng hiện tại không bị thay đổi.");
    }
  }

  // Tính toán chỉ số GPA & CPA
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  
  const weightedScale4 = subjects.reduce((sum, s) => {
    const scale4 = GRADE_CONVERSION[s.letterGrade]?.scale4 ?? 0;
    return sum + scale4 * (s.credits || 0);
  }, 0);

  const weightedScale10 = subjects.reduce((sum, s) => {
    return sum + (s.score10 || 0) * (s.credits || 0);
  }, 0);

  const gpaScale4 = totalCredits > 0 ? (weightedScale4 / totalCredits).toFixed(2) : "0.00";
  const gpaScale10 = totalCredits > 0 ? (weightedScale10 / totalCredits).toFixed(2) : "0.00";

  const numGpa4 = Number(gpaScale4);

  function getClassification(gpa4: number): { text: string; color: string } {
    if (gpa4 >= 3.6) return { text: "Xuất sắc 🌟", color: "#22c55e" };
    if (gpa4 >= 3.2) return { text: "Giỏi 🥇", color: "#3b82f6" };
    if (gpa4 >= 2.5) return { text: "Khá 🥈", color: "#eab308" };
    if (gpa4 >= 2.0) return { text: "Trung bình 🥉", color: "#f97316" };
    return { text: "Yếu / Cảnh báo ⚠️", color: "#ef4444" };
  }

  const classification = totalCredits ? getClassification(numGpa4) : { text: "Chưa có điểm", color: "var(--muted)" };

  return (
    <div className="gpa-calculator" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {(notice || storageFailed) && <p role="alert" className="warning-box">{notice || "Không đọc được dữ liệu điểm đã lưu. Dữ liệu cũ được giữ nguyên; điểm mới chỉ ở trong phiên này."}</p>}
      {!subjects.length && <p className="empty-state">Chưa có bảng điểm. Thêm môn học và nhập điểm của bạn để ước tính.</p>}
      {/* TỔNG QUAN GPA / CPA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Tổng tín chỉ tích lũy</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)", marginTop: "4px" }}>
            {totalCredits} <span style={{ fontSize: "14px", fontWeight: 400 }}>Tín chỉ</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>GPA / CPA (Thang điểm 4.0)</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
            {gpaScale4} <span style={{ fontSize: "14px", color: "var(--muted)" }}>/ 4.00</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Điểm trung bình (Thang điểm 10)</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
            {gpaScale10} <span style={{ fontSize: "14px", color: "var(--muted)" }}>/ 10.0</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Xếp loại Học lực Local</span>
          <div style={{ fontSize: "20px", fontWeight: 700, color: classification.color, marginTop: "4px" }}>
            {classification.text}
          </div>
        </div>
      </div>

      {/* BẢNG MÔN HỌC */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
        <div className="gpa-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calculator size={16} /> Điểm nhập tay trên thiết bị
          </h4>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="settings-btn-secondary" onClick={resetToDefault} style={{ fontSize: "12px" }}>
              <RotateCcw size={13} /> Phục hồi dữ liệu cũ
            </button>
            <button className="settings-btn-primary" onClick={addSubject} style={{ fontSize: "12px" }}>
              <Plus size={14} /> Thêm môn học
            </button>
          </div>
        </div>

        <div className="gpa-table-scroll"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
              <th style={{ padding: "8px", width: "40%" }}>Tên môn học</th>
              <th style={{ padding: "8px", width: "15%" }}>Tín chỉ</th>
              <th style={{ padding: "8px", width: "20%" }}>Điểm chữ</th>
              <th style={{ padding: "8px", width: "15%" }}>Thang 10</th>
              <th style={{ padding: "8px", width: "10%", textAlign: "center" }}>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: "1px solid color-mix(in srgb, var(--border) 40%, transparent)" }}>
                <td style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => updateSubject(sub.id, { name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={sub.credits}
                    onChange={(e) => updateSubject(sub.id, { credits: Math.min(10, Math.max(1, Number(e.target.value))) })}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <select
                    value={sub.letterGrade}
                    onChange={(e) => updateSubject(sub.id, { letterGrade: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {Object.keys(GRADE_CONVERSION).map((g) => (
                      <option key={g} value={g}>
                        {g} ({GRADE_CONVERSION[g].scale4.toFixed(1)} / 4.0)
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={10}
                    value={sub.score10}
                    onChange={(e) => updateSubject(sub.id, { score10: Math.min(10, Math.max(0, Number(e.target.value))) })}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                    }}
                  />
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <button
                    className="settings-btn-secondary"
                    onClick={() => removeSubject(sub.id)}
                    style={{ padding: "6px", color: "#ef4444" }}
                    title="Xóa môn này"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
