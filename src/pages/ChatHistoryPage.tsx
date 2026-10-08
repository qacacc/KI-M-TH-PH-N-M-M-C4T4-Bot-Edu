import React, { useState, useEffect } from "react";
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
  Edit2,
  Check,
  X,
  ShieldCheck,
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

export const ChatHistoryPage: React.FC<Props> = ({ onSelectSession, onNewChat, onNavigateToSettings }) => {
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && deleteModal) {
        setDeleteModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await invoke("toggle_archive_chat_session", { id, archived: !currentArchived });
      setActiveMenuId(null);
      loadState();
    } catch (err) {
      console.error("Lỗi lưu trữ phiên:", err);
    }
  };

  const handleDeleteSessionClick = (session: ChatSession) => {
    setDeleteModal({
      type: "single",
      sessionId: session.id,
      sessionTitle: session.title,
    });
    setActiveMenuId(null);
  };

  const handleClearAllClick = () => {
    setDeleteModal({
      type: "all",
      sessionTitle: "toàn bộ lịch sử trò chuyện",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === "single" && deleteModal.sessionId) {
        await invoke("delete_chat_session", { id: deleteModal.sessionId });
      } else if (deleteModal.type === "all") {
        await invoke("clear_all_chat_sessions");
      }
    } catch (err) {
      console.error("Lỗi xóa phiên:", err);
    } finally {
      setDeleteModal(null);
      loadState();
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

  const filtered = sessions.filter(
    (s) => !s.archived && s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 1 && diffDays <= 7;
  };

  const pinnedGroup = filtered.filter((s) => s.pinned);
  const todayGroup = filtered.filter((s) => !s.pinned && isToday(s.updatedAt));
  const weekGroup = filtered.filter((s) => !s.pinned && !isToday(s.updatedAt) && isThisWeek(s.updatedAt));
  const olderGroup = filtered.filter(
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
                <button onClick={() => handleTogglePin(session.id, session.pinned)}>
                  {session.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {session.pinned ? "Bỏ ghim" : "Ghim đoạn chat"}
                </button>
                <button onClick={() => handleToggleArchive(session.id, session.archived)}>
                  <Archive size={14} />
                  Lưu trữ
                </button>
                <button className="danger-menu-item" onClick={() => handleDeleteSessionClick(session)}>
                  <Trash size={14} />
                  Xóa
                </button>
              </div>
            )}
          </div>

          <div className="card-footer-row">
            <span className="card-time">{formatTime(session.updatedAt)}</span>
            <span className="nav-badge local-badge">Local</span>
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
          <button className="settings-btn-danger" onClick={handleClearAllClick}>
            <Trash size={16} />
            Xóa dữ liệu...
          </button>
        </div>
      </header>

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

        {filtered.length === 0 && (
          <div className="no-sessions-found">
            Không tìm thấy phiên trò chuyện nào phù hợp.
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="history-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div
            className="history-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
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
            <div className="history-modal-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteModal(null)} autoFocus>
                Hủy
              </button>
              <button className="modal-btn-delete" onClick={handleConfirmDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
