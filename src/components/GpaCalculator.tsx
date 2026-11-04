import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator, RotateCcw, Save } from "lucide-react";
import { 
  GPA_LEGACY_STORAGE_KEY, 
  parseGpaSubjects, 
  calculateGpaStats,
  loadGpaSubjects,
  saveGpaSubjects
} from "../gpaData";

export interface GpaSubject {
  id: string;
  name: string;
  credits: number | "";
  letterGrade: string;
  score10: number | "";
}

export function GpaCalculator() {
  const [notice, setNotice] = useState("");
  const [draftSubjects, setDraftSubjects] = useState<GpaSubject[]>([]);
  const [savedSubjects, setSavedSubjects] = useState<GpaSubject[]>([]);
  
  const [corruptWarning, setCorruptWarning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const { data, isCorrupted } = loadGpaSubjects();
    if (isCorrupted) {
      setCorruptWarning(true);
    } else if (data) {
      setDraftSubjects(data);
      setSavedSubjects(data); 
    }
    setIsLoaded(true);
  }, []);

  function addSubject() {
    const nextItem: GpaSubject = {
      id: crypto.randomUUID(), name: "", credits: "", letterGrade: "", score10: "",
    };
    setDraftSubjects([...draftSubjects, nextItem]);
  }

  function removeSubject(id: string) {
    if (!window.confirm("Xóa môn học này khỏi bản nháp?")) return;
    setDraftSubjects(draftSubjects.filter((s) => s.id !== id));
  }

  function handleClearAll() {
    if (window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ bảng điểm nháp và đã lưu? Hành động này không thể hoàn tác.")) {
      setDraftSubjects([]);
      setSavedSubjects([]);
      saveGpaSubjects([]);
      setCorruptWarning(false);
      setNotice("Đã làm sạch bảng điểm.");
    }
  }
  function handleSave() {
    for (const sub of draftSubjects) {
      if (sub.credits !== "") {
        const c = Number(sub.credits);
        if (isNaN(c) || c < 1 || c > 10) {
          setNotice(`Lỗi: Tín chỉ môn "${sub.name || 'Trống'}" phải từ 1-10.`);
          return;
        }
      }
      if (sub.score10 !== "") {
        const s = Number(sub.score10);
        if (isNaN(s) || s < 0 || s > 10) {
          setNotice(`Lỗi: Điểm hệ 10 môn "${sub.name || 'Trống'}" phải từ 0-10.`);
          return;
        }
      }
    }

    const isSaved = saveGpaSubjects(draftSubjects);
    if (isSaved) {
      setSavedSubjects([...draftSubjects]); 
      setNotice("Đã lưu bảng điểm thành công!");
      setTimeout(() => setNotice(""), 3500); 
    } else {
      setNotice("Không lưu được điểm (bộ nhớ đầy hoặc bị chặn). Dữ liệu chỉ giữ nháp.");
    }
  }

  function updateSubject(id: string, fields: Partial<GpaSubject>) {
    setDraftSubjects(
      draftSubjects.map((s) => (s.id !== id ? s : { ...s, ...fields }))
    );
  }

  function resetToDefault() {
    if (!window.confirm("Phục hồi dữ liệu cũ? Sẽ ghi đè bảng hiện tại.")) return;
    try {
      const legacy = parseGpaSubjects(localStorage.getItem(GPA_LEGACY_STORAGE_KEY));
      setDraftSubjects(legacy);
      setSavedSubjects(legacy);
      setNotice("Đã phục hồi dữ liệu cũ.");
      setCorruptWarning(false);
    } catch {
      setNotice("Không đọc được dữ liệu cũ.");
    }
  }
  const { totalCredits, gpaScale4, gpaScale10, numGpa4 } = calculateGpaStats(savedSubjects);

  function getClassification(gpa4: number): { text: string; color: string } {
    if (gpa4 >= 3.6) return { text: "Xuất sắc", color: "#22c55e" };
    if (gpa4 >= 3.2) return { text: "Giỏi", color: "#3b82f6" };
    if (gpa4 >= 2.5) return { text: "Khá", color: "#eab308" };
    if (gpa4 >= 2.0) return { text: "Trung bình", color: "#f97316" };
    return { text: "Yếu / Cảnh báo ⚠️", color: "#ef4444" };
  }

  const classification = totalCredits ? getClassification(numGpa4) : { text: "Chưa có kết quả", color: "var(--muted)" };

  function getLetterGradeFrom10(score: number | ""): string {
    if (score === "") return "";
    if (score >= 9.0) return "A+";
    if (score >= 8.5) return "A";
    if (score >= 8.0) return "B+";
    if (score >= 7.0) return "B";
    if (score >= 6.5) return "C+";
    if (score >= 5.5) return "C";
    if (score >= 5.0) return "D+";
    if (score >= 4.0) return "D";
    return "F";
  }

  return (
    <div className="gpa-calculator" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {notice && !corruptWarning && <p role="alert" className="warning-box">{notice}</p>}
      
      {corruptWarning && (
        <div className="warning-box" style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #f87171" }}>
          Dữ liệu bảng điểm đã lưu bị hỏng. Hệ thống tạm ngưng tính điểm để bảo vệ dữ liệu gốc.
          <br /><br />
          <button onClick={handleClearAll} style={{ padding: "6px 12px", background: "#ef4444", color: "white", borderRadius: "4px", border: "none" }}>
            Xóa dữ liệu hỏng & Bắt đầu lại
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Tổng tín chỉ (Đã lưu)</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)", marginTop: "4px" }}>
            {totalCredits} <span style={{ fontSize: "14px", fontWeight: 400 }}>Tín chỉ</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>GPA (Nhập tay / Thang 4.0)</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
            {gpaScale4 !== null ? gpaScale4 : "--"} <span style={{ fontSize: "14px", color: "var(--muted)" }}>/ 4.00</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>CPA (Nhập tay / Thang 10)</span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
            {gpaScale10 !== null ? gpaScale10 : "--"} <span style={{ fontSize: "14px", color: "var(--muted)" }}>/ 10.0</span>
          </div>
        </div>

        <div style={{ padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Xếp loại Học lực Local</span>
          <div style={{ fontSize: "20px", fontWeight: 700, color: classification.color, marginTop: "4px" }}>
            {classification.text}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
        <div className="gpa-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calculator size={16} /> Bảng điểm Nháp
          </h4>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="settings-btn-secondary" onClick={resetToDefault} style={{ fontSize: "12px" }}>
              <RotateCcw size={13} /> Phục hồi cũ
            </button>
            <button className="settings-btn-secondary" onClick={handleClearAll} style={{ fontSize: "12px", color: "#ef4444" }}>
              <Trash2 size={13} /> Xóa tất cả
            </button>
            <button className="settings-btn-primary" onClick={addSubject} style={{ fontSize: "12px", background: "#3b82f6", borderColor: "#3b82f6" }}>
              <Plus size={14} /> Thêm môn
            </button>
            <button className="settings-btn-primary" onClick={handleSave} style={{ fontSize: "12px", background: "#10b981", borderColor: "#10b981" }}>
              <Save size={14} /> Lưu điểm
            </button>
          </div>
        </div>

        <div className="gpa-table-scroll"><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
              <th style={{ padding: "8px", width: "40%" }}>Tên môn học</th>
              <th style={{ padding: "8px", width: "15%" }}>Tín chỉ</th>
              <th style={{ padding: "8px", width: "15%" }}>Thang 10</th>
              <th style={{ padding: "8px", width: "20%" }}>Điểm chữ</th>
              <th style={{ padding: "8px", width: "10%", textAlign: "center" }}>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {draftSubjects.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "var(--muted)" }}>
                  Chưa có môn học nháp. Bấm "Thêm môn" để bắt đầu.
                </td>
              </tr>
            ) : draftSubjects.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: "1px solid color-mix(in srgb, var(--border) 40%, transparent)" }}>
                <td style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={sub.name}
                    placeholder="Nhập tên môn..."
                    onChange={(e) => updateSubject(sub.id, { name: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    value={sub.credits}
                    placeholder="TC"
                    onChange={(e) => updateSubject(sub.id, { credits: e.target.value === "" ? "" : Number(e.target.value) })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number" step={0.1}
                    value={sub.score10}
                    placeholder="Trống"
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = val === "" ? "" : Number(val);
                      updateSubject(sub.id, { score10: numVal, letterGrade: getLetterGradeFrom10(numVal) });
                    }}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={sub.letterGrade}
                    placeholder="Tự động"
                    readOnly
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                  />
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>
                  <button className="settings-btn-secondary" onClick={() => removeSubject(sub.id)} style={{ padding: "6px", color: "#ef4444" }}>
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