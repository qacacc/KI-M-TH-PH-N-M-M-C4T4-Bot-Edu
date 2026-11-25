import { useEffect, useMemo, useState } from "react";
import { Trash2, RotateCcw, FileText, FolderOpen, AlertCircle, Download, RefreshCw, ChevronDown, BookOpen, Search } from "lucide-react";
import type { BootstrapState, LmsCourseRecord, LmsDocumentRecord } from "../types";
import { formatBytes } from "../utils/format";
import { emptyTrashBin as emptyTrashBinLocal, getTrashItems as getTrashItemsLocal, restoreFromTrash as restoreFromTrashLocal, type TrashItem } from "../utils/trashBin";
import { downloadLmsDocument, emptyTrashBin, listenLmsSnapshotUpdated, listLmsCourses, listLmsDocuments, listTrashItems, moveFileToTrash, openLmsDocument, openLmsWindow, rescanLmsCourses, restoreTrashItem } from "../tauriApi";
import { openExternalUrl } from "../tauriApi";
import { getSchoolOption, readSchoolProfile } from "../schoolProfile";

export function FilesPage({ bootstrap }: { bootstrap: BootstrapState | null }) {
  const [activeTab, setActiveTab] = useState<"school" | "samples" | "trash">("school");
  const school = getSchoolOption(readSchoolProfile());
  const [query, setQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<"all" | "1">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"name" | "sizeDesc" | "sizeAsc" | "type">("name");
  const [notice, setNotice] = useState<string | null>(null);
  
  // Trash bin state
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [lmsCourses, setLmsCourses] = useState<LmsCourseRecord[]>([]);
  const [lmsDocuments, setLmsDocuments] = useState<LmsDocumentRecord[]>([]);
  const [lmsLoading, setLmsLoading] = useState(false);
  const [lmsQuery, setLmsQuery] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(() => new Set());

  const refreshLms = () => {
    setLmsLoading(true);
    Promise.all([listLmsCourses(), listLmsDocuments()])
      .then(([courses, docs]) => {
        setLmsCourses(courses);
        setLmsDocuments(docs);
      })
      .catch((error: unknown) => {
        setNotice(`Không tải được cache học liệu local: ${String(error)}`);
      })
      .finally(() => setLmsLoading(false));
  };

  const refreshTrashItems = () => {
    listTrashItems()
      .then((records) => {
        setTrashItems(
          records.map((r) => ({
            id: r.trash_id,
            name: r.original_file_name,
            path: r.original_relative_path,
            sizeBytes: r.size_bytes,
            deletedAt: r.deleted_at,
            fileType: "file",
          }))
        );
      })
      .catch(() => {
        setTrashItems(getTrashItemsLocal());
      });
  };

  useEffect(() => {
    refreshTrashItems();
    refreshLms();
    let unlisten: (() => void) | undefined;
    void listenLmsSnapshotUpdated(() => refreshLms())
      .then((stop) => { unlisten = stop; })
      .catch(() => undefined);
    return () => unlisten?.();
  }, []);

  function handleMoveToTrash(relPath: string, name: string) {
    if (!window.confirm(`Chuyển tệp "${name}" vào Thùng rác Local?`)) {
      return;
    }
    setNotice(null);
    moveFileToTrash(relPath)
      .then(() => {
        setNotice(`✅ Đã chuyển tệp "${name}" vào Thùng rác Local.`);
        refreshTrashItems();
      })
      .catch((err) => {
        setNotice(`⚠️ ${String(err)}`);
      });
  }

  const documents = bootstrap?.documents ?? [];
  const documentTypes = useMemo(() => Array.from(new Set(documents.map((document) => document.type))), [documents]);
  
  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents
      .filter((document) => {
        const matchesQuery =
          !normalizedQuery ||
          document.name.toLowerCase().includes(normalizedQuery) ||
          document.type.toLowerCase().includes(normalizedQuery) ||
          document.source.toLowerCase().includes(normalizedQuery);
        const matchesSemester = semesterFilter === "all" || document.semester === Number(semesterFilter);
        const matchesType = typeFilter === "all" || document.type === typeFilter;
        return matchesQuery && matchesSemester && matchesType;
      })
      .sort((left, right) => {
        if (sortMode === "sizeDesc") return right.sizeBytes - left.sizeBytes;
        if (sortMode === "sizeAsc") return left.sizeBytes - right.sizeBytes;
        if (sortMode === "type") return left.type.localeCompare(right.type, "vi") || left.name.localeCompare(right.name, "vi");
        return left.name.localeCompare(right.name, "vi");
      });
  }, [documents, query, semesterFilter, typeFilter, sortMode]);

  const filteredSizeBytes = useMemo(
    () => filteredDocuments.reduce((total, document) => total + document.sizeBytes, 0),
    [filteredDocuments],
  );

  const filteredLmsGroups = useMemo(() => {
    const normalizedQuery = lmsQuery.trim().toLocaleLowerCase("vi");
    const knownCourseIds = new Set(lmsCourses.map((course) => course.id));
    const courses = [
      ...lmsCourses,
      ...lmsDocuments.filter((doc) => !knownCourseIds.has(doc.courseId)).map((doc) => ({ id: doc.courseId, name: doc.courseName, updatedAt: doc.updatedAt })),
    ];
    const uniqueCourses = Array.from(new Map(courses.map((course) => [course.id, course])).values());
    return uniqueCourses.flatMap((course) => {
      const courseDocs = lmsDocuments.filter((doc) => doc.courseId === course.id);
      const courseMatches = course.name.toLocaleLowerCase("vi").includes(normalizedQuery);
      const matchingDocs = !normalizedQuery || courseMatches ? courseDocs : courseDocs.filter((doc) => doc.name.toLocaleLowerCase("vi").includes(normalizedQuery));
      if (normalizedQuery && !courseMatches && matchingDocs.length === 0) return [];
      return [{ ...course, documents: matchingDocs }];
    });
  }, [lmsCourses, lmsDocuments, lmsQuery]);

  const trashSizeBytes = useMemo(
    () => trashItems.reduce((total, item) => total + item.sizeBytes, 0),
    [trashItems]
  );

  function handleRestoreTrashItem(id: string) {
    setNotice(null);
    restoreTrashItem(id)
      .then((restoredPath) => {
        setNotice(`✅ Đã khôi phục tệp thành công vào: ${restoredPath}`);
        refreshTrashItems();
      })
      .catch((err) => {
        const updated = restoreFromTrashLocal(id);
        setTrashItems(updated);
        setNotice(`⚠️ ${String(err)}`);
      });
  }

  function handleEmptyTrash() {
    if (!window.confirm("Dọn sạch toàn bộ Thùng rác Local? Các tệp sẽ bị xóa vĩnh viễn.")) {
      return;
    }
    setNotice(null);
    emptyTrashBin()
      .then((count) => {
        setNotice(`✅ Đã dọn sạch ${count} tệp khỏi thùng rác local.`);
        refreshTrashItems();
      })
      .catch(() => {
        emptyTrashBinLocal();
        setTrashItems([]);
      });
  }

  return (
    <div className="page-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2>Tài liệu</h2>
        {/* TABS NỔI */}
        <div className="segmented-control">
          <button className={activeTab === "school" ? "selected" : ""} onClick={() => setActiveTab("school")}><FolderOpen size={14} />Tài liệu trường</button>
          <button
            className={activeTab === "samples" ? "selected" : ""}
            onClick={() => setActiveTab("samples")}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <FolderOpen size={14} /> Tài liệu Mẫu ({documents.length})
          </button>
          <button
            className={activeTab === "trash" ? "selected" : ""}
            onClick={() => {
              refreshTrashItems();
              setActiveTab("trash");
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <Trash2 size={14} /> Thùng Rác Local ({trashItems.length})
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" }}>
          {notice}
        </div>
      )}

      {activeTab === "school" && <>
        <div className="page-card-header compact">
          <div>
            <h2>Môn học &amp; học liệu</h2>
            <p>{school.id === "uth" ? "Mở LMS UTH để quét môn và tệp được phép truy cập; tải từng tệp về thư mục Downloads của ứng dụng." : `Mở LMS ${school.shortName}; quét/tải trong ứng dụng hiện chỉ hỗ trợ UTH.`}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="settings-btn-secondary" onClick={() => {
              setNotice(null);
              void rescanLmsCourses().then(() => setNotice("Đã yêu cầu quét lại danh sách môn và học liệu LMS.")).catch((error: unknown) => setNotice(`Không quét lại được LMS: ${String(error)}`));
            }} disabled={lmsLoading || school.id !== "uth"}><RefreshCw size={15} />Làm mới</button>
            <button className="settings-btn-primary" disabled={!school.lmsPortalUrl} onClick={() => {
              if (school.id !== "uth" || !("__TAURI_INTERNALS__" in window)) {
                if (school.lmsPortalUrl) void openExternalUrl(school.lmsPortalUrl).then(() => setNotice(`Đã mở LMS ${school.shortName}; dữ liệu chưa được đồng bộ vào ứng dụng.`)).catch(() => setNotice("Không mở được LMS. Hãy kiểm tra trình duyệt mặc định rồi thử lại."));
                return;
              }
              void openLmsWindow().then(() => setNotice("Cửa sổ LMS đã mở. Đăng nhập để quét môn và tài liệu.")).catch((error: unknown) => setNotice(`Không mở được LMS: ${String(error)}`));
            }}><FolderOpen size={15} />Mở LMS {school.id === "uth" ? "& quét học liệu" : school.shortName}</button>
          </div>
        </div>

        <div className="metric-strip" aria-label="Thống kê học liệu LMS">
          <div><strong>{lmsCourses.length}</strong><span>Môn học đã quét</span></div>
          <div><strong>{lmsDocuments.length}</strong><span>Tệp tìm thấy</span></div>
          <div><strong>{formatBytes(lmsDocuments.reduce((total, item) => total + (item.status === "downloaded" ? item.sizeBytes : 0), 0))}</strong><span>Đã tải local</span></div>
        </div>

        <label className="lms-search">
          <Search size={16} aria-hidden="true" />
          <input value={lmsQuery} onChange={(event) => setLmsQuery(event.target.value)} placeholder="Tìm môn học hoặc tài liệu..." aria-label="Tìm học liệu LMS" />
          {lmsQuery && <button type="button" onClick={() => setLmsQuery("")} aria-label="Xóa nội dung tìm kiếm"><RotateCcw size={14} /></button>}
        </label>

        {lmsLoading && <p role="status">Đang đọc cache học liệu local…</p>}
        {!lmsLoading && lmsCourses.length === 0 && lmsDocuments.length === 0 && <p className="empty-state">Chưa có dữ liệu LMS local. Mở LMS UTH, đăng nhập và chờ quét hoàn tất.</p>}
        {lmsCourses.length > 0 && filteredLmsGroups.every((group) => group.documents.length === 0) && <p className="empty-state">Chưa tìm thấy tệp khớp hoặc các môn chưa có học liệu được hỗ trợ.</p>}

        {filteredLmsGroups.length > 0 && <div className="lms-course-list" aria-label="Học liệu theo môn học">
          {filteredLmsGroups.map((course) => {
            const expanded = expandedCourses.has(course.id);
            const panelId = `lms-course-${course.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
            return <details className="lms-course-group" key={course.id} open={expanded} onToggle={(event) => {
              const isOpen = event.currentTarget.open;
              setExpandedCourses((current) => {
                if (current.has(course.id) === isOpen) return current;
                const next = new Set(current);
                if (isOpen) next.add(course.id); else next.delete(course.id);
                return next;
              });
            }}>
              <summary className="lms-course-toggle">
                <span className="lms-course-icon"><BookOpen size={17} /></span>
                <span className="lms-course-title">{course.name}</span>
                <span className="lms-course-count">{course.documents.length} tài liệu</span>
                <ChevronDown className="lms-course-chevron" size={18} />
              </summary>
              <div className="lms-course-documents" id={panelId}>
                {course.documents.length === 0 ? <p className="lms-course-empty">Chưa có tài liệu được quét trong môn này.</p> : course.documents.map((item) => <article className="lms-document-row" key={item.id}>
                  <span className="lms-document-icon"><FileText size={16} /></span>
                  <span className="lms-document-name">{item.name}</span>
                  <span className={`lms-document-status status-${item.status}`}>{item.status === "downloaded" ? formatBytes(item.sizeBytes) : item.status === "downloading" ? "Đang tải…" : item.status === "error" ? "Tải lỗi" : "Có trên LMS"}</span>
                  {item.status === "downloaded" ? <button className="settings-btn-secondary" onClick={() => { void openLmsDocument(item.id).catch((error: unknown) => setNotice(`Không mở được tệp: ${String(error)}`)); }} title={item.localPath ?? ""}><FileText size={14} />Mở</button> : <button className="settings-btn-secondary" disabled={item.status === "downloading" || !item.sourcePath} onClick={() => {
                    void downloadLmsDocument(item.id).then(() => setNotice(`Đang tải “${item.name}” vào Downloads của ứng dụng.`)).catch((error: unknown) => setNotice(`Không tải được tệp LMS: ${String(error)}`));
                  }}><Download size={14} />Tải</button>}
                </article>)}
              </div>
            </details>;
          })}
        </div>}
      </>}
      {activeTab === "samples" && <p>Tài liệu minh họa của ứng dụng, không phải tài liệu đã lấy từ tài khoản trường.</p>}
      
      {activeTab === "samples" && <dl className="path-list" style={{ marginBottom: "18px" }}>
        <dt>Managed Workspace</dt>
        <dd>{bootstrap?.paths.managedWorkspace ?? "Đang khởi tạo"}</dd>
        <dt>Sample Documents</dt>
        <dd>{bootstrap?.paths.sampleDocuments ?? "Đang khởi tạo"}</dd>
        <dt>Downloads</dt>
        <dd>{bootstrap?.paths.downloads ?? "Đang khởi tạo"}</dd>
      </dl>}

      {/* TAB 1: TÀI LIỆU MẪU */}
      {activeTab === "samples" && (
        <>
          <div className="page-card-header compact">
            <div>
              <h2>Tài liệu mẫu local</h2>
              <p>{filteredDocuments.length}/{documents.length} file từ JSON local. Trang này xem metadata và chỉ cho phép thao tác thùng rác trong workspace quản lý.</p>
            </div>
          </div>
          
          <div className="metric-strip" aria-label="Thống kê tài liệu đang hiển thị">
            <div>
              <strong>{filteredDocuments.length}</strong>
              <span>File hiển thị</span>
            </div>
            <div>
              <strong>{documentTypes.length}</strong>
              <span>Loại tài liệu</span>
            </div>
            <div>
              <strong>{formatBytes(filteredSizeBytes)}</strong>
              <span>Dung lượng lọc</span>
            </div>
          </div>
          
          <div className="filter-bar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, loại hoặc nguồn..." />
            <div className="segmented-control" aria-label="Lọc học kỳ">
              <button className={semesterFilter === "all" ? "selected" : ""} onClick={() => setSemesterFilter("all")}>Tất cả</button>
              <button className={semesterFilter === "1" ? "selected" : ""} onClick={() => setSemesterFilter("1")}>Học kỳ 1</button>
            </div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">Tất cả loại</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
              <option value="name">Tên A-Z</option>
              <option value="type">Loại A-Z</option>
              <option value="sizeDesc">Dung lượng giảm</option>
              <option value="sizeAsc">Dung lượng tăng</option>
            </select>
            <button onClick={() => { setQuery(""); setSemesterFilter("all"); setTypeFilter("all"); setSortMode("name"); }}>Reset</button>
          </div>

          {filteredDocuments.length === 0 ? (
            <p className="empty-state">Không có tài liệu nào khớp bộ lọc hiện tại.</p>
          ) : (
            <div className="file-table">
              <div className="file-table-header" style={{ gridTemplateColumns: "40px 1fr 80px 120px 100px 120px 100px" }}>
                <span>Số</span>
                <span>Tên file</span>
                <span>Học kỳ</span>
                <span>Loại</span>
                <span>Kích thước</span>
                <span>Nguồn</span>
                <span style={{ textAlign: "center" }}>Hành động</span>
              </div>
              {filteredDocuments.map((document, index) => (
                <div className="file-table-row" key={document.id} style={{ gridTemplateColumns: "40px 1fr 80px 120px 100px 120px 100px" }}>
                  <span className="document-index">{index + 1}</span>
                  <span>{document.name}</span>
                  <span>{document.semester}</span>
                  <span>{document.type}</span>
                  <span>{formatBytes(document.sizeBytes)}</span>
                  <span>{document.source}</span>
                  <span style={{ textAlign: "center" }}>
                    <button
                      className="settings-btn-secondary"
                      onClick={() => handleMoveToTrash(document.localPath, document.name)}
                      style={{ padding: "4px 8px", fontSize: "11px", gap: "4px", color: "#ef4444" }}
                      title="Chuyển tệp vào Thùng rác Local"
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: THÙNG RÁC LOCAL */}
      {activeTab === "trash" && (
        <>
          <div className="page-card-header compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Thùng rác Local (Trash Bin)</h2>
              <p>Quản lý các tệp tài liệu local đã xóa tạm thời. Bạn có thể khôi phục hoặc xóa vĩnh viễn.</p>
            </div>
            {trashItems.length > 0 && (
              <button className="settings-btn-secondary" onClick={handleEmptyTrash} style={{ color: "#ef4444", fontSize: "12px", gap: "6px" }}>
                <Trash2 size={14} /> Dọn sạch Thùng rác
              </button>
            )}
          </div>

          <div className="metric-strip" aria-label="Thống kê thùng rác">
            <div>
              <strong>{trashItems.length}</strong>
              <span>Tệp trong thùng rác</span>
            </div>
            <div>
              <strong>{formatBytes(trashSizeBytes)}</strong>
              <span>Dung lượng chiếm dụng</span>
            </div>
          </div>

          {trashItems.length === 0 ? (
            <div className="empty-state" style={{ textAlign: "center", padding: "30px 10px" }}>
              <CheckCircle2 size={24} style={{ color: "#22c55e", marginBottom: "8px" }} />
              <p style={{ margin: 0 }}>Thùng rác local đang trống. Chưa có tệp nào bị xóa tạm thời.</p>
            </div>
          ) : (
            <div className="file-table">
              <div className="file-table-header" style={{ gridTemplateColumns: "40px 1fr 120px 140px 100px" }}>
                <span>STT</span>
                <span>Tên file</span>
                <span>Kích thước</span>
                <span>Thời điểm xóa</span>
                <span style={{ textAlign: "center" }}>Hành động</span>
              </div>
              {trashItems.map((item, index) => (
                <div className="file-table-row" key={item.id} style={{ gridTemplateColumns: "40px 1fr 120px 140px 100px" }}>
                  <span className="document-index">{index + 1}</span>
                  <span>{item.name}</span>
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(item.deletedAt).toLocaleString("vi-VN")}
                  </span>
                  <span style={{ textAlign: "center" }}>
                    <button
                      className="settings-btn-secondary"
                      onClick={() => handleRestoreTrashItem(item.id)}
                      style={{ padding: "4px 8px", fontSize: "12px", gap: "4px" }}
                      title="Khôi phục tệp về danh sách chính"
                    >
                      <RotateCcw size={13} /> Phục hồi
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CheckCircle2({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
