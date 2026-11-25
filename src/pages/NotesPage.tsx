import { useEffect, useMemo, useState } from "react";
import { Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { deleteStudentNote, importStudentNotesBackup, listStudentNotes, saveStudentNote } from "../tauriApi";
import type { StudentNoteRecord } from "../types";

export function NotesPage() {
  const [notes, setNotes] = useState<StudentNoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [draftSubjectName, setDraftSubjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function reload(selectId?: string | null) {
    setLoading(true);
    try {
      const list = await listStudentNotes();
      setNotes(list);
      setError("");
      const nextId = selectId !== undefined ? selectId : activeId ?? list[0]?.id ?? null;
      setActiveId(nextId);
      const selected = list.find((note) => note.id === nextId);
      if (selected) {
        setDraftTitle(selected.title);
        setDraftContent(selected.content);
        setDraftSubjectId(selected.subjectId ?? "");
        setDraftSubjectName(selected.subjectName ?? "");
      } else if (!nextId) {
        setDraftTitle(""); setDraftContent(""); setDraftSubjectId(""); setDraftSubjectName("");
      }
    } catch (cause) {
      setError(`Không tải được ghi chú SQLite: ${String(cause)}`);
    } finally { setLoading(false); }
  }

  useEffect(() => { void reload(); }, []);

  const subjects = useMemo(() => {
    const values = new Map<string, string>();
    notes.forEach((note) => { if (note.subjectId) values.set(note.subjectId, note.subjectName || note.subjectId); });
    return [...values.entries()];
  }, [notes]);
  const visibleNotes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("vi");
    return notes.filter((note) => (subjectFilter === "all" || note.subjectId === subjectFilter)
      && (!query || `${note.title} ${note.content} ${note.subjectName ?? ""} ${note.subjectId ?? ""}`.toLocaleLowerCase("vi").includes(query)));
  }, [notes, searchQuery, subjectFilter]);
  const active = notes.find((note) => note.id === activeId);

  async function createNote() {
    setError(""); setNotice("");
    try {
      const created = await saveStudentNote({ title: "Ghi chú mới", content: "" });
      await reload(created.id);
      setNotice("Đã tạo ghi chú trong SQLite.");
    } catch (cause) { setError(`Không tạo được ghi chú: ${String(cause)}`); }
  }

  async function saveNote() {
    if (!activeId) return;
    setError(""); setNotice("");
    try {
      const saved = await saveStudentNote({ id: activeId, title: draftTitle, content: draftContent, subjectId: draftSubjectId.trim() || null, subjectName: draftSubjectName.trim() || null });
      setNotes((current) => current.map((note) => note.id === saved.id ? saved : note));
      setDraftTitle(saved.title); setNotice("Đã lưu ghi chú.");
    } catch (cause) { setError(`Không lưu được ghi chú: ${String(cause)}`); }
  }

  async function removeNote(id: string) {
    if (!window.confirm("Xóa ghi chú này khỏi SQLite trên thiết bị?")) return;
    setError(""); setNotice("");
    try {
      const remaining = notes.filter((note) => note.id !== id);
      await deleteStudentNote(id);
      setNotes(remaining);
      const next = remaining[0] ?? null;
      setActiveId(next?.id ?? null);
      setDraftTitle(next?.title ?? ""); setDraftContent(next?.content ?? "");
      setDraftSubjectId(next?.subjectId ?? ""); setDraftSubjectName(next?.subjectName ?? "");
      setNotice("Đã xóa ghi chú.");
    } catch (cause) { setError(`Không xóa được ghi chú: ${String(cause)}`); }
  }

  function exportNotes() {
    const payload = { format: "campus-assistant-notes-backup", schemaVersion: 1, exportedAt: new Date().toISOString(), notes };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `campus-notes-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    setNotice(`Đã sao lưu ${notes.length} ghi chú.`);
  }

  async function importNotes(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setError(""); setNotice("");
    try {
      const payload: unknown = JSON.parse(await file.text());
      if (!payload || typeof payload !== "object" || (payload as { format?: string }).format !== "campus-assistant-notes-backup" || !Array.isArray((payload as { notes?: unknown }).notes)) throw new Error("Tệp sao lưu không đúng định dạng.");
      const count = await importStudentNotesBackup((payload as { notes: StudentNoteRecord[] }).notes);
      await reload(); setNotice(`Đã khôi phục ${count} ghi chú.`);
    } catch (cause) { setError(`Khôi phục thất bại: ${String(cause)}`); }
  }

  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Sổ ghi chú học tập</h2><p>Ghi chú được lưu local trong SQLite và có thể gắn với môn học.</p></div>
      <div className="button-row">
        <button className="settings-btn-secondary" type="button" onClick={exportNotes} disabled={!notes.length}><Download size={15} />Sao lưu</button>
        <label className="settings-btn-secondary"> <Upload size={15} />Khôi phục<input type="file" accept=".json,application/json" onChange={(event) => void importNotes(event)} hidden /></label>
        <button className="settings-btn-primary" type="button" onClick={() => void createNote()}><Plus size={15} />Tạo ghi chú</button>
      </div>
    </div>
    <div className="filter-bar">
      <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tiêu đề, nội dung hoặc môn học..." aria-label="Tìm ghi chú" />
      <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} aria-label="Lọc theo môn"><option value="all">Tất cả môn</option>{subjects.map(([id, name]) => <option key={id} value={id}>{id} — {name}</option>)}</select>
      <button type="button" onClick={() => { setSearchQuery(""); setSubjectFilter("all"); }} aria-label="Xóa bộ lọc"><RotateCcw size={16} /></button>
    </div>
    {error && <p role="alert" className="warning-box">{error}</p>}{notice && <p role="status" className="note-save-status">{notice}</p>}
    <div className="study-notes-layout">
      <aside className="study-notes-list" aria-label="Danh sách ghi chú">
        {loading ? <p role="status">Đang tải SQLite…</p> : visibleNotes.length === 0 ? <p className="empty-state">{notes.length ? "Không có kết quả phù hợp." : "Chưa có ghi chú. Tạo ghi chú đầu tiên."}</p> : visibleNotes.map((note) => <button type="button" className={`study-note-item${note.id === activeId ? " selected" : ""}`} key={note.id} onClick={() => { setActiveId(note.id); setDraftTitle(note.title); setDraftContent(note.content); setDraftSubjectId(note.subjectId ?? ""); setDraftSubjectName(note.subjectName ?? ""); }}><strong>{note.title || "Chưa đặt tiêu đề"}</strong><span>{note.subjectName || note.updatedAt.slice(0, 10)}</span><small>{note.content.trim().slice(0, 90) || "Chưa có nội dung"}</small></button>)}
      </aside>
      {active ? <section className="study-note-editor" aria-label="Chỉnh sửa ghi chú">
        <div className="study-note-editor-actions"><span>Cập nhật {new Date(active.updatedAt).toLocaleString("vi-VN")}</span><div className="button-row"><button type="button" className="settings-btn-primary" onClick={() => void saveNote()}><Save size={15} />Lưu</button><button type="button" className="settings-btn-secondary" onClick={() => void removeNote(active.id)}><Trash2 size={15} />Xóa</button></div></div>
        <input aria-label="Tiêu đề" maxLength={100} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Tiêu đề ghi chú" />
        <div className="study-note-subject-fields"><input aria-label="Mã môn" value={draftSubjectId} onChange={(event) => setDraftSubjectId(event.target.value)} placeholder="Mã môn (tùy chọn)" /><input aria-label="Tên môn" value={draftSubjectName} onChange={(event) => setDraftSubjectName(event.target.value)} placeholder="Tên môn (tùy chọn)" /></div>
        <textarea aria-label="Nội dung" maxLength={10000} rows={12} value={draftContent} onChange={(event) => setDraftContent(event.target.value)} placeholder="Nội dung ghi chú (tối đa 10.000 ký tự)" />
      </section> : <p className="empty-state study-note-placeholder">Chọn ghi chú để chỉnh sửa.</p>}
    </div>
  </div>;
}
