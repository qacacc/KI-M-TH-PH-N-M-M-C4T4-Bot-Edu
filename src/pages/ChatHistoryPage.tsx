import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  History,
  Plus,
  Search,
  Trash,
  MoreVertical,
  Pin,
  PinOff,
  Archive,
  RotateCcw,
  Edit2,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  ArchiveRestore,
} from "lucide-react";

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
};

type DeleteModalState = {
  type: "single" | "all";
  sessionId?: string;
  sessionTitle?: string;
} | null;

type Props = {
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onNavigateToSettings?: () => void;
};

export const ChatHistoryPage: React.FC<Props> = ({ onSelectSession, onNewChat }) => {
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  
  // Modal State & Error handling
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>("");

  // Refs cho Accessibility (Focus Trap & Focus Restoration)
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  // BẪY TIÊU ĐIỂM (FOCUS TRAP) & PHÍM ESC CHO MODAL XÓA
  useEffect(() => {
    if (!deleteModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím Esc đóng modal
      if (e.key === "Escape") {
        closeDeleteModal();
        return;
      }

      // 2. Bẫy phím Tab và Shift+Tab bên trong modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Tự động focus vào nút đầu tiên khi mở modal
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [deleteModal]);

  const loadState = async () => {
    setLoading(true);
    try {
      const enabledVal = await invoke<string>("get_setting_cmd", {
        key: "chatHistoryEnabled",
        fallback: "false",
      });
      const isEnabled = enabledVal === "true";
      setHistoryEnabled(isEnabled);

      if (isEnabled) {
        const list = await invoke<ChatSession[]>("list_chat_sessions");
        setSessions(list || []);
      }
    } catch (err) {
      console.error("Lỗi đọc lịch sử trò chuyện:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableHistory = async () => {
    try {
      await invoke("save_setting_cmd", { key: "chatHistoryEnabled", value: "true" });
      setHistoryEnabled(true);
      const list = await invoke<ChatSession[]>("list_chat_sessions");
      setSessions(list || []);
    } catch (err) {
      console.error("Lỗi bật lưu lịch sử:", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSess = await invoke<ChatSession>("create_chat_session", { title: "Cuộc trò chuyện mới" });
      onSelectSession(newSess);
    } catch (err) {
      console.error("Lỗi tạo phiên mới:", err);
    }
  };

  const handleRename = async (id: string) => {
    const trimmed = renameValue.trim().slice(0, 100);
    if (!trimmed) return;
    try {
      await invoke("rename_chat_session", { id, newTitle: trimmed });
      setRenamingId(null);
      setRenameValue("");
      loadState();
    } catch (err) {
      console.error("Lỗi đổi tên phiên:", err);
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await invoke("toggle_pin_chat_session", { id, pinned: !currentPinned });
      setActiveMenuId(null);
      loadState();
    } catch (err) {
      console.error("Lỗi ghim phiên:", err);
    }
  };

  // CA-087.03: Khôi phục / Lưu trữ phiên chat
  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await invoke("toggle_archive_chat_session", { id, archived: !currentArchived });
      setActiveMenuId(null);
      loadState();
    } catch (err) {
      console.error("Lỗi chuyển trạng thái lưu trữ:", err);
    }
  };

  // Mở modal xóa và ghi nhớ nút bấm kích hoạt
  const openDeleteModal = (modalState: DeleteModalState, e: React.MouseEvent<HTMLElement>) => {
    lastFocusedElementRef.current = e.currentTarget;
    setDeleteModal(modalState);
    setDeleteError("");
    setActiveMenuId(null);
  };

  // Đóng modal và TRẢ TIÊU ĐIỂM về nút gọi ban đầu
  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteError("");
    setIsDeleting(false);
    setTimeout(() => {
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    }, 0);
  };

  // Xử lý Xóa phiên chat (Nếu lỗi backend thì giữ nguyên Modal & báo lỗi)
  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      if (deleteModal.type === "single" && deleteModal.sessionId) {
        await invoke("delete_chat_session", { id: deleteModal.sessionId });
      } else if (deleteModal.type === "all") {
        await invoke("clear_all_chat_sessions");
      }
      closeDeleteModal();
      loadState();
    } catch (err: unknown) {
      console.error("Lỗi từ backend khi xóa phiên:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : (err as Error)?.message || "Backend từ chối thao tác xóa. Vui lòng thử lại sau.";
      // CA-087.03: Hiển thị lỗi, GIỮ NGUYÊN modal
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Phân loại danh sách theo Tab Active / Archived
  const activeSessions = sessions.filter(
    (s) => !s.archived && s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const archivedSessions = sessions.filter(
    (s) => s.archived && s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedSessions = activeTab === "active" ? activeSessions : archivedSessions;

  const now = new Date();
  const isToday = (dateStr: string) => new Date(dateStr).toDateString() === now.toDateString();
  const isThisWeek = (dateStr: string) => {
    const diffDays = Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return diffDays >= 1 && diffDays <= 7;
  };

  const pinnedGroup = displayedSessions.filter((s) => s.pinned);
  const todayGroup = displayedSessions.filter((s) => !s.pinned && isToday(s.updatedAt));
  const weekGroup = displayedSessions.filter((s) => !s.pinned && !isToday(s.updatedAt) && isThisWeek(s.updatedAt));
  const olderGroup = displayedSessions.filter(
    (s) => !s.pinned && !isToday(s.updatedAt) && !isThisWeek(s.updatedAt)
  );

  if (loading) {
    return (
      <div className="chat-history-container">
        <div className="history-loading">Đang tải lịch sử trò chuyện local...</div>
      </div>
    );
  }

  if (!historyEnabled) {
    return (
      <div className="chat-history-container">
        <div className="history-empty-state">
          <div className="empty-icon-wrapper">
            <History size={36} />
          </div>
          <h2>Chưa bật lưu lịch sử local</h2>
          <p>
            Lịch sử trò chuyện chỉ được lưu trên thiết bị của bạn khi bạn chủ động bật. Ứng dụng
            Campus Assistant ưu tiên bảo mật local-first và không lưu nhật ký hội thoại raw.
          </p>
          <button className="settings-btn-primary enable-history-btn" onClick={handleEnableHistory}>
            <ShieldCheck size={18} />
            Bật lưu lịch sử
          </button>
        </div>
      </div>
    );
  }

  const renderSessionCard = (session: ChatSession) => {
    const isEditing = renamingId === session.id;

    return (
      <div key={session.id} className="history-session-card">
        <div className="card-main" onClick={() => !isEditing && onSelectSession(session)}>
          <div className="card-header-row">
            {isEditing ? (
              <div className="rename-input-box" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={renameValue}
                  maxLength={100}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(session.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  autoFocus
                />
                <button className="icon-save-btn" onClick={() => handleRename(session.id)}>
                  <Check size={15} />
                </button>
                <button className="icon-cancel-btn" onClick={() => setRenamingId(null)}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <strong className="session-card-title">{session.title}</strong>
            )}

            <button
              className="menu-trigger-btn"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(activeMenuId === session.id ? null : session.id);
              }}
              aria-label="Tùy chọn phiên"
            >
              <MoreVertical size={16} />
            </button>

            {activeMenuId === session.id && (
              <div className="card-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setRenamingId(session.id);
                    setRenameValue(session.title);
                    setActiveMenuId(null);
                  }}
                >
                  <Edit2 size={14} />
                  Đổi tên
                </button>

                {!session.archived && (
                  <button onClick={() => handleTogglePin(session.id, session.pinned)}>
                    {session.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {session.pinned ? "Bỏ ghim" : "Ghim đoạn chat"}
                  </button>
                )}

                {/* NÚT UNARCHIVE / ARCHIVE */}
                <button onClick={() => handleToggleArchive(session.id, session.archived)}>
                  {session.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  {session.archived ? "Khôi phục chat" : "Lưu trữ"}
                </button>

                <button
                  className="danger-menu-item"
                  onClick={(e) =>
                    openDeleteModal(
                      { type: "single", sessionId: session.id, sessionTitle: session.title },
                      e
                    )
                  }
                >
                  <Trash size={14} />
                  Xóa
                </button>
              </div>
            )}
          </div>

          <div className="card-footer-row">
            <span className="card-time">{formatTime(session.updatedAt)}</span>
            {session.archived ? (
              <span className="nav-badge archived-badge" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                Đã lưu trữ
              </span>
            ) : (
              <span className="nav-badge local-badge">Local</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-history-container">
      <header className="history-page-header">
        <div className="header-left">
          <h2>Lịch sử trò chuyện</h2>
          <span className="subtitle">Quản lý các đoạn hội thoại local trên thiết bị này</span>
        </div>
        <div className="header-actions">
          <button className="settings-btn-primary" onClick={handleCreateSession}>
            <Plus size={16} />
            Cuộc trò chuyện mới
          </button>

          <div className="history-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="settings-btn-danger"
            onClick={(e) =>
              openDeleteModal(
                { type: "all", sessionTitle: "toàn bộ lịch sử trò chuyện" },
                e
              )
            }
          >
            <Trash size={16} />
            Xóa toàn bộ...
          </button>
        </div>
      </header>

      {/* THANH CHUYỂN TAB CÁC PHIÊN CHAT (ACTIVE / ARCHIVED) */}
      <div className="history-tab-bar" style={{ display: "flex", gap: "8px", margin: "16px 0 20px 0", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
        <button
          className={activeTab === "active" ? "history-tab-btn active" : "history-tab-btn"}
          onClick={() => setActiveTab("active")}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "active" ? "var(--accent)" : "transparent",
            color: activeTab === "active" ? "#fff" : "var(--muted)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <History size={14} />
          Cuộc trò chuyện ({sessions.filter((s) => !s.archived).length})
        </button>

        <button
          className={activeTab === "archived" ? "history-tab-btn active" : "history-tab-btn"}
          onClick={() => setActiveTab("archived")}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "archived" ? "var(--accent)" : "transparent",
            color: activeTab === "archived" ? "#fff" : "var(--muted)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Archive size={14} />
          Đã lưu trữ ({sessions.filter((s) => s.archived).length})
        </button>
      </div>

      {/* DANH SÁCH THEO NHÓM THỜI GIAN */}
      <div className="history-groups-list">
        {pinnedGroup.length > 0 && (
          <section className="history-group-section">
            <h3>Đã ghim</h3>
            <div className="history-cards-grid">{pinnedGroup.map(renderSessionCard)}</div>
          </section>
        )}

        {todayGroup.length > 0 && (
          <section className="history-group-section">
            <h3>Hôm nay</h3>
            <div className="history-cards-grid">{todayGroup.map(renderSessionCard)}</div>
          </section>
        )}

        {weekGroup.length > 0 && (
          <section className="history-group-section">
            <h3>Tuần này</h3>
            <div className="history-cards-grid">{weekGroup.map(renderSessionCard)}</div>
          </section>
        )}

        {olderGroup.length > 0 && (
          <section className="history-group-section">
            <h3>Cũ hơn</h3>
            <div className="history-cards-grid">{olderGroup.map(renderSessionCard)}</div>
          </section>
        )}

        {displayedSessions.length === 0 && (
          <div className="no-sessions-found" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
            {activeTab === "archived"
              ? "Không có cuộc trò chuyện nào trong mục Lưu trữ."
              : "Không tìm thấy phiên trò chuyện nào phù hợp."}
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN XÓA (FOCUS TRAP & BẮT LỖI BACKEND) */}
      {deleteModal && (
        <div className="history-modal-overlay" onClick={closeDeleteModal}>
          <div
            ref={modalRef}
            className="history-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            tabIndex={-1}
          >
            <h3 id="delete-modal-title" className="history-modal-title">
              {deleteModal.type === "single" ? "Xóa đoạn chat?" : "Xóa toàn bộ lịch sử?"}
            </h3>

            <p className="history-modal-desc">
              {deleteModal.type === "single"
                ? "Đoạn chat này sẽ bị xóa khỏi lịch sử local trên thiết bị này."
                : "Tất cả đoạn chat đã lưu local sẽ bị xóa khỏi thiết bị này."}
            </p>

            {deleteModal.type === "single" && deleteModal.sessionTitle && (
              <p className="history-modal-target">
                <strong>"{deleteModal.sessionTitle}"</strong>
              </p>
            )}

            <p className="history-modal-subtext">Hành động này không thể hoàn tác.</p>

            {/* HIỂN THỊ THÔNG BÁO LỖI TỪ BACKEND NẾU TỪ CHỐI XÓA */}
            {deleteError && (
              <div
                className="history-modal-error"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: "12px 0",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "color-mix(in srgb, #ef4444 15%, transparent)",
                  color: "#ef4444",
                  fontSize: "13px",
                  border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="history-modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="modal-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};