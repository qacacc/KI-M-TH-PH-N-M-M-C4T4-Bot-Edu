import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator, RotateCcw, ExternalLink, Download } from "lucide-react";
import {
  GPA_LEGACY_STORAGE_KEY,
  parseGpaSubjects,
  loadGpaSubjects,
  saveGpaSubjects,
  calculateGpaStats,
  calculatePortalGpaStats,
  getLetterGradeFrom10,
  isValidCredits,
  type PortalGradeRecord,
} from "../gpaData";

export interface GpaSubject {
  id: string;
  name: string;
  credits: number | "";
  letterGrade: string;
  score10: number | "";
}

export interface GpaCalculatorProps {
  portalGrades?: PortalGradeRecord[];
  schoolShortName?: string;
  portalUrl?: string;
  onOpenPortal?: () => void;
}

export function GpaCalculator({
  portalGrades = [],
  schoolShortName = "UTH",
  portalUrl,
  onOpenPortal,
}: GpaCalculatorProps) {
  const [notice, setNotice] = useState("");
  const [initialState] = useState(() => loadGpaSubjects());
  const [corruptWarning, setCorruptWarning] = useState(initialState.isCorrupted);
  const [hasLegacyV1, setHasLegacyV1] = useState(initialState.hasLegacyV1);
  const [subjects, setSubjects] = useState<GpaSubject[]>(initialState.subjects);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty || corruptWarning) return;
    const saved = saveGpaSubjects(subjects);
    if (!saved) {
      setNotice("Không lưu được điểm trên thiết bị. Dữ liệu hiện tại chỉ còn trong phiên này.");
    }
  }, [subjects, isDirty, corruptWarning]);

  function addSubject() {
    const nextItem: GpaSubject = {
      id: crypto.randomUUID(),
      name: "",
      credits: "",
      letterGrade: "",
      score10: "",
    };
    setSubjects((prev) => [...prev, nextItem]);
    setIsDirty(true);
  }

  function removeSubject(id: string) {
    if (!window.confirm("Xóa môn học đã nhập khỏi bảng điểm trên thiết bị?")) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setIsDirty(true);
  }

  function updateSubject(id: string, fields: Partial<GpaSubject>) {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, ...fields };
      }),
    );
    setIsDirty(true);
  }

  function handleCreditsChange(id: string, rawVal: string) {
    if (rawVal === "") {
      setNotice("");
      updateSubject(id, { credits: "" });
      return;
    }
    const parsed = Number(rawVal);
    if (!isValidCredits(parsed)) {
      setNotice("Số tín chỉ phải là số nguyên từ 1 đến 10.");
      return;
    }
    setNotice("");
    updateSubject(id, { credits: parsed });
  }

  function handleScore10Change(id: string, rawVal: string) {
    if (rawVal === "") {
      setNotice("");
      updateSubject(id, { score10: "", letterGrade: "" });
      return;
    }
    const numVal = Math.min(10, Math.max(0, Number(rawVal)));
    if (!Number.isFinite(numVal)) return;
    setNotice("");
    updateSubject(id, { score10: numVal, letterGrade: getLetterGradeFrom10(numVal) });
  }

  function handleResetCorruptedStorage() {
    if (!window.confirm("Xóa dữ liệu bảng điểm bị hỏng và bắt đầu lại với bảng trống?")) return;
    setSubjects([]);
    setCorruptWarning(false);
    setIsDirty(true);
    saveGpaSubjects([]);
    setNotice("Đã làm mới bộ nhớ bảng điểm cục bộ.");
  }

  function recoverLegacyV1() {
    let rawV1: string | null = null;
    try {
      rawV1 = localStorage.getItem(GPA_LEGACY_STORAGE_KEY);
    } catch {
      setNotice("Không đọc được dữ liệu cũ; bảng hiện tại không bị thay đổi.");
      return;
    }

    if (!rawV1 || rawV1.trim() === "") {
      setHasLegacyV1(false);
      setNotice("Không tìm thấy dữ liệu điểm phiên bản cũ (v1) trên thiết bị; bảng hiện tại được giữ nguyên.");
      return;
    }

    if (
      !window.confirm(
        "Phục hồi dữ liệu điểm phiên bản cũ (v1) sang bộ nhớ hiện tại (v2)? Dữ liệu đó có thể chứa điểm mẫu, chưa được xác minh từ trường và sẽ thay thế bảng hiện tại.",
      )
    ) {
      return;
    }

    try {
      const legacySubjects = parseGpaSubjects(rawV1);
      setSubjects(legacySubjects);
      setCorruptWarning(false);
      setHasLegacyV1(false);
      setIsDirty(true);
      saveGpaSubjects(legacySubjects);
      setNotice("Đã phục hồi dữ liệu cũ (v1) chưa xác minh. Hãy kiểm tra từng điểm với bảng điểm trường.");
    } catch {
      setNotice("Không đọc được dữ liệu cũ; bảng hiện tại không bị thay đổi.");
    }
  }

  function importPortalGradesToManual() {
    const validPortal = portalGrades.filter((r) => r.source === "uth-portal" && r.verified && isValidCredits(r.credits));
    if (validPortal.length === 0) return;
    if (
      !window.confirm(
        "Nạp danh sách môn học từ bảng điểm Portal vào bảng ước tính nhập tay? Bảng nhập tay hiện tại sẽ được thay thế để bạn mô phỏng thêm môn mới.",
      )
    ) {
      return;
    }
    const imported: GpaSubject[] = validPortal.map((r) => ({
      id: r.id,
      name: r.subjectName,
      credits: r.credits,
      letterGrade: r.letterGrade,
      score10: r.score10,
    }));
    setSubjects(imported);
    setCorruptWarning(false);
    setIsDirty(true);
    saveGpaSubjects(imported);
    setNotice(`Đã nạp ${imported.length} môn từ bảng điểm Portal vào công cụ ước tính.`);
  }

  const portalStats = calculatePortalGpaStats(portalGrades);
  const { totalCredits, gpaScale4, gpaScale10, numGpa4 } = calculateGpaStats(subjects);

  function getClassification(gpa4: number): { text: string; color: string } {
    if (gpa4 >= 3.6) return { text: "Xuất sắc", color: "#22c55e" };
    if (gpa4 >= 3.2) return { text: "Giỏi", color: "#3b82f6" };
    if (gpa4 >= 2.5) return { text: "Khá", color: "#eab308" };
    if (gpa4 >= 2.0) return { text: "Trung bình", color: "#f97316" };
    return { text: "Yếu / Cảnh báo ⚠️", color: "#ef4444" };
  }

  const classification = totalCredits ? getClassification(numGpa4) : { text: "Chưa có điểm", color: "var(--muted)" };

  return (
    <div className="gpa-calculator" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {corruptWarning && (
        <div role="alert" className="warning-box">
          <p style={{ margin: "0 0 8px 0" }}>
            Không đọc được dữ liệu điểm đã lưu (dữ liệu bị hỏng hoặc sai định dạng). Hệ thống tạm ngưng tự động ghi đè để bảo vệ dữ liệu gốc.
          </p>
          <button className="settings-btn-secondary" onClick={handleResetCorruptedStorage} style={{ fontSize: "12px" }}>
            Xóa dữ liệu hỏng & Bắt đầu lại
          </button>
        </div>
      )}

      {hasLegacyV1 && !corruptWarning && (
        <div
          role="status"
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "13px" }}>
            Phát hiện dữ liệu điểm phiên bản cũ (v1) trên thiết bị. Dữ liệu này chưa được tự động chuyển sang v2 để tránh ghi đè ngoài ý muốn.
          </span>
          <button className="settings-btn-secondary" onClick={recoverLegacyV1} style={{ fontSize: "12px" }}>
            <RotateCcw size={13} /> Xác nhận phục hồi dữ liệu cũ (v1)
          </button>
        </div>
      )}

      {notice && (
        <p role="alert" className="warning-box">
          {notice}
        </p>
      )}

      {/* Khối 1: GPA Chính thức từ Bảng điểm Portal (Tích hợp luồng Portal theo CA-088) */}
      <div style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
              GPA chính thức từ Portal ({schoolShortName})
            </h4>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
              {portalStats.hasVerifiedData
                ? `Đã đồng bộ ${portalStats.subjectCount} môn học (${portalStats.totalCredits} tín chỉ) từ bảng điểm cổng trường.`
                : "Chưa có dữ liệu bảng điểm Portal được xác minh. Hệ thống không tự tạo GPA chính thức giả."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {portalStats.hasVerifiedData ? `${portalStats.gpaScale4} / 4.00` : "-- / 4.00"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                {portalStats.hasVerifiedData ? `Thang 10: ${portalStats.gpaScale10}` : "Chưa đồng bộ Portal"}
              </div>
            </div>
            {portalStats.hasVerifiedData ? (
              <button className="settings-btn-secondary" onClick={importPortalGradesToManual} style={{ fontSize: "12px" }}>
                <Download size={13} /> Nạp vào bảng ước tính
              </button>
            ) : (
              portalUrl &&
              onOpenPortal && (
                <button className="settings-btn-secondary" onClick={onOpenPortal} style={{ fontSize: "12px" }}>
                  <ExternalLink size={13} /> Mở cổng {schoolShortName}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {!subjects.length && (
        <p className="empty-state">Chưa có bảng điểm nhập tay. Thêm môn học và nhập điểm của bạn để ước tính.</p>
      )}

      {/* Khối 2: Thống kê Ước tính GPA / CPA nhập tay */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
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

      {/* Khối 3: Bảng nhập tay chi tiết */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
        <div className="gpa-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Calculator size={16} /> Điểm nhập tay trên thiết bị
          </h4>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="settings-btn-secondary" onClick={recoverLegacyV1} style={{ fontSize: "12px" }}>
              <RotateCcw size={13} /> Phục hồi dữ liệu cũ
            </button>
            <button className="settings-btn-primary" onClick={addSubject} style={{ fontSize: "12px" }}>
              <Plus size={14} /> Thêm môn học
            </button>
          </div>
        </div>

        <div className="gpa-table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                <th style={{ padding: "8px", width: "40%" }}>Tên môn học</th>
                <th style={{ padding: "8px", width: "15%" }}>Tín chỉ (1–10)</th>
                <th style={{ padding: "8px", width: "15%" }}>Thang 10</th>
                <th style={{ padding: "8px", width: "20%" }}>Điểm chữ</th>
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
                      placeholder="Nhập tên môn..."
                      onChange={(e) => updateSubject(sub.id, { name: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "13px" }}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="number"
                      step={1}
                      min={1}
                      max={10}
                      inputMode="numeric"
                      aria-label="Số tín chỉ"
                      value={sub.credits}
                      placeholder="TC"
                      onChange={(e) => handleCreditsChange(sub.id, e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "13px" }}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={10}
                      aria-label="Điểm thang 10"
                      value={sub.score10}
                      placeholder="Trống"
                      onChange={(e) => handleScore10Change(sub.id, e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "13px" }}
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={sub.letterGrade}
                      placeholder="Tự động"
                      readOnly
                      style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "13px" }}
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
          </table>
        </div>
      </div>
    </div>
  );
}