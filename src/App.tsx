import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Circle,
  ClipboardList,
  Database,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  Image,
  ListChecks,
  Moon,
  Palette,
  Plus,
  Send,
  Shield,
  Sparkles,
  Sun,
  Trash,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Search,
  Activity,
  Settings,
  GraduationCap,
  History,
  Minus,
  Square,
  X,
} from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { accentOptions } from "./appearanceOptions";
import { AnnouncementTable, DocumentTable, ExamTable, ScheduleTable } from "./components/DataTables";
import { StatusLine } from "./components/StatusLine";
import {
  createFindDocumentsState,
  detectIntent,
  extractSemester,
  findSubjectInText,
  parseConfirmationIntent,
  parseDocumentActionIntent,
  parseFlowControlIntent,
  parseSlashCommand,
} from "./engine";
import { useAppearanceDraft } from "./hooks/useAppearanceDraft";
import { useLayoutState } from "./hooks/useLayoutState";
import { useAppBootstrap } from "./hooks/useAppBootstrap";
import { useChatSession, welcomeMessage } from "./hooks/useChatSession";
import { AppearancePage } from "./pages/AppearancePage";
import { AnnouncementsPage, ExamsPage, SchedulePage, GpaPage } from "./pages/CampusDataPages";
import { FilesPage } from "./pages/FilesPage";
import { HealthPage } from "./pages/HealthPage";
import { LogsPage } from "./pages/LogsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ReleasePage } from "./pages/ReleasePage";
import { StoragePage } from "./pages/StoragePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SchoolPage } from "./pages/SchoolPage";
import { handleSchoolChatQuery } from "./schoolConnector/chatSchoolIntegration";
import {
  getSchoolProfileInitials,
  getSchoolProfileSubtitle,
  getSchoolProfileTitle,
  getSchoolOption,
  readSchoolProfile,
  SCHOOL_PROFILE_UPDATED_EVENT,
  type SchoolProfile,
} from "./schoolProfile";
import {
  checkForUpdate,
  clearActionLogs,
  copyDocument,
  exportDiagnosticReport,
  getHealthReport,
  getStorageSummary,
  listActionLogs,
  openDocument,
  openDownloadsFolder,
  saveSetting,
  saveThemeBackground,
  searchPublicSchoolInfo,
  deleteThemeBackground,
} from "./tauriApi";
import { ChatHistoryPage } from "./pages/ChatHistoryPage";
import appLogo from "./assets/logo.png";
import { ACADEMIC_CONNECTION_REQUIRED, academicDataErrorMessage, loadAcademicSchedule, loadAcademicExams } from "./academicData";
import type {
  ActionLogEntry,
  BootstrapState,
  ChatMessage,
  ChatSession,
  ConversationState,
  DiagnosticExportResult,
  DocumentRecord,
  HealthReport,
  PublicSearchResponse,
  StorageSummary,
  UpdateCheckResult,
  UserMessageSource,
  View,
} from "./types";
import { formatBytes } from "./utils/format";

const appVersion = "1.0.1";
const defaultStartViews: View[] = ["chat", "schedule", "files", "school", "appearance"];

function readDefaultStartView(): View {
  const stored = localStorage.getItem("ca-settings-default-view") as View | null;
  return stored && defaultStartViews.includes(stored) ? stored : "chat";
}

function readBooleanSetting(key: string, fallback: boolean) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored !== "false";
}

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


export default function App() {
  const [input, setInput] = useState("");
  const [view, setView] = useState<View>(() => readDefaultStartView());
  const [settingsBackView, setSettingsBackView] = useState<View>(() => readDefaultStartView());
  const [autoFocusChatEnabled, setAutoFocusChatEnabled] = useState(() => readBooleanSetting("ca-settings-autofocus", true));
  const [composerShortcutsEnabled, setComposerShortcutsEnabled] = useState(() => readBooleanSetting("ca-settings-bottom-panel", true));
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => readSchoolProfile());
  const [conversation, setConversation] = useState<ConversationState | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

  // --- Hook: Chat session (tin nhắn, lưu lịch sử, phửn) ---
  const {
    messages,
    historyPersistenceWarning,
    appendMessage,
    appendAssistant,
    resetToWelcome,
    startNewChat: startNewChatSession,
    handleSelectSession: handleSelectSessionInternal,
  } = useChatSession();

  // --- Hook: Bootstrap lifecycle (khởi động native layer) ---
  const onBootstrapSuccess = useCallback(
    (state: BootstrapState) => {
      hydrateSavedAppearance(state.theme, state.accentColor);
      resetToWelcome();
      if (autoFocusChatEnabled && view === "chat") {
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      window.setTimeout(() => {
        void Promise.allSettled([listActionLogs(100), getStorageSummary()]).then(
          ([logsResult, storageResult]) => {
            if (logsResult.status === "fulfilled") setActionLogs(logsResult.value);
            if (storageResult.status === "fulfilled") setStorageSummary(storageResult.value);
          },
        );
      }, 220);
      window.setTimeout(() => {
        void checkForUpdate()
          .then((info) => setUpdateInfo(info))
          .catch(() =>
            setUpdateInfo({
              configured: true,
              currentVersion: appVersion,
              latestVersion: null,
              updateAvailable: false,
              required: false,
              message: "Không kiểm tra được phiên bản mới.",
              downloadUrl: null,
            }),
          );
      }, 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { bootstrap, bootstrapSlow, bootstrapError, retryBootstrap } =
    useAppBootstrap(onBootstrapSuccess);

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    return localStorage.getItem("campus-assistant-sidebar-expanded") === "true";
  });
  const toggleSidebarExpanded = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem("campus-assistant-sidebar-expanded", String(next));
      return next;
    });
  };

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState("");

  const commandPaletteItems = useMemo(() => {
    const list = [
      { id: "chat", title: "Trò chuyện với trợ lý AI", detail: "Nhập câu hỏi, tra cứu môn học, tài liệu local", icon: Sparkles, action: () => { setView("chat"); setCommandPaletteOpen(false); setTimeout(() => inputRef.current?.focus(), 50); } },
      { id: "announcements", title: "Tra cứu Thông báo nhà trường", detail: "Xem thông báo từ phòng đào tạo, khoa", icon: Bell, action: () => { setView("announcements"); setCommandPaletteOpen(false); } },
      { id: "schedule", title: "Lịch học & Thời khóa biểu", detail: "Xem lịch học theo tuần và phòng học", icon: CalendarDays, action: () => { setView("schedule"); setCommandPaletteOpen(false); } },
      { id: "exams", title: "Lịch thi & Địa điểm thi", detail: "Tra cứu ngày thi, môn thi và phòng thi", icon: ClipboardList, action: () => { setView("exams"); setCommandPaletteOpen(false); } },
      { id: "files", title: "File mẫu & Biểu mẫu", detail: "Duyệt danh sách file PDF, DOCX local", icon: FolderOpen, action: () => { setView("files"); setCommandPaletteOpen(false); } },
      { id: "school", title: "Trường & tài khoản", detail: "Chọn trường, hồ sơ sinh viên local, cổng xác thực", icon: GraduationCap, action: () => { setView("school"); setCommandPaletteOpen(false); } },
      { id: "admissions", title: "Tuyển sinh công khai", detail: "Hỏi khối 2008 nhập học năm nào, không cần đăng nhập", icon: BookOpen, action: () => { setView("chat"); setCommandPaletteOpen(false); void submitText("khối 2008 thì năm nào nhập học", "command-palette"); } },
      { id: "appearance", title: "Giao diện & Chủ đề", detail: "Tùy biến màu sắc, ảnh nền, blur, preset", icon: Palette, action: () => { setView("appearance"); setCommandPaletteOpen(false); } },
      { id: "settings", title: "Cài đặt Hệ thống", detail: "Cấu hình chung, dữ liệu local, bảo mật vault, dev mode", icon: Settings, action: () => { openSettings(); setCommandPaletteOpen(false); } },
      { id: "storage", title: "Bộ nhớ & Dữ liệu Local", detail: "Quản lý CSDL SQLite local và bộ nhớ đệm", icon: Database, action: () => { setView("storage"); setCommandPaletteOpen(false); } },
      { id: "health", title: "Kiểm tra Hệ thống", detail: "Chạy chẩn đoán sức khỏe bộ nhớ & file", icon: Check, action: () => { setView("health"); void refreshHealthReport(); setCommandPaletteOpen(false); } },
      { id: "privacy", title: "Cam kết Quyền riêng tư", detail: "Xem thông tin bảo mật 100% Local-First", icon: Shield, action: () => { setView("privacy"); setCommandPaletteOpen(false); } },
    ];
    if (!commandSearchQuery.trim()) return list;
    const q = commandSearchQuery.toLowerCase();
    return list.filter(item => item.title.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q));
  }, [commandSearchQuery]); // view không ảnh hưởng nội dung list

  useEffect(() => {
    const refreshSchoolProfile = () => setSchoolProfile(readSchoolProfile());
    window.addEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refreshSchoolProfile);
    window.addEventListener("storage", refreshSchoolProfile);
    return () => {
      window.removeEventListener(SCHOOL_PROFILE_UPDATED_EVENT, refreshSchoolProfile);
      window.removeEventListener("storage", refreshSchoolProfile);
    };
  }, []);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const openConfirmModal = (message: string, title = "Xác nhận"): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        type: "confirm",
        onConfirm: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const openAlertModal = (message: string, title = "Thông báo"): Promise<void> => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        type: "alert",
        onConfirm: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
        onCancel: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
      });
    });
  };

  const { layoutWidths, startColumnResize, resetColumnWidth } = useLayoutState();
  const {
    appearance,
    draftTheme,
    draftAccentColor,
    draftAppearance,
    appearanceDraftIsValid,
    hasAppearanceChanges,
    hydrateSavedAppearance,
    updateTheme,
    updateAccent,
    updateAppearance,
    resetAppearance,
    discardAppearanceChanges,
    applyAppearanceChanges,
    applyAppearanceImmediately,
  } = useAppearanceDraft(Boolean(bootstrap));

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDraggingFile(true);
      }
    }

    function handleDragLeave(e: DragEvent) {
      e.preventDefault();
      // Nhận diện khi trỏ chuột thực sự rời khỏi màn hình app
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDraggingFile(false);
      }
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      setIsDraggingFile(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === "string" && bootstrap) {
          try {
            const finalBg = reader.result;
            const match = finalBg.match(/^data:image\/(\w+);base64,/);
            const ext = match ? match[1] : "png";
            const base64Data = finalBg.substring(finalBg.indexOf(",") + 1);
            
            const relativePath = await saveThemeBackground("current", ext, base64Data);
            const absolutePath = bootstrap.paths.appLocalData + "/" + relativePath;
            const fileSrc = convertFileSrc(absolutePath);

            applyAppearanceImmediately({
              backgroundImage: fileSrc,
              backgroundFit: "cover",
              backgroundPosition: "center",
              backgroundOpacity: 0.28,
              backgroundBlur: 2,
              overlayType: "dark",
              overlayIntensity: 0.42,
              panelOpacity: 0.78,
              panelBlur: 10,
            });
            void saveSetting("theme", draftTheme).catch(() => undefined);
            void saveSetting("accentColor", draftAccentColor).catch(() => undefined);
          } catch (err) {
            console.error("Lỗi lưu ảnh thả vào app:", err);
          }
        }
      };
      reader.readAsDataURL(file);
    }

    function handleGlobalKeyDown(e: GlobalEventHandlersEventMap["keydown"]) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarExpanded();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [bootstrap, draftTheme, draftAccentColor, applyAppearanceImmediately, toggleSidebarExpanded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length, conversation?.step]);

  useEffect(() => {
    if (!bootstrap || healthReport || (view !== "health" && view !== "release")) return;
    let isCancelled = false;
    void getHealthReport()
      .then((report) => {
        if (!isCancelled) setHealthReport(report);
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [bootstrap, healthReport, view]);

  const documentStats = useMemo(() => {
    const docs = bootstrap?.documents ?? [];
    return {
      total: docs.length,
      semesterOne: docs.filter((doc) => doc.semester === 1).length,
      totalBytes: docs.reduce((sum, doc) => sum + doc.sizeBytes, 0),
    };
  }, [bootstrap]);
  const storageUsedBytes =
    (storageSummary?.sampleDocumentBytes ?? documentStats.totalBytes) + (storageSummary?.downloadBytes ?? 0);
  const storageTotalLabel = formatBytes(storageUsedBytes);
  const sidebarOverlayWidth = layoutWidths.sidebar === 0 ? 260 : Math.max(220, layoutWidths.sidebar);
  const customizeWidth = view === "appearance" ? 0 : layoutWidths.customize;
  const appLayoutStyle = {
    "--sidebar-width": "0px",
    "--sidebar-overlay-width": `${sidebarOverlayWidth}px`,
    "--utility-width": `${layoutWidths.utility}px`,
    "--customize-width": `${customizeWidth}px`,
  } as CSSProperties;

  const commandSuggestions = [
    { command: "/documents", label: "Tài liệu", detail: "FIND_DOCUMENTS", icon: <BookOpen size={15} /> },
    { command: "/announcements", label: "Thông báo", detail: "FIND_ANNOUNCEMENTS", icon: <Bell size={15} /> },
    { command: "/schedule", label: "Lịch học", detail: "FIND_SCHEDULE", icon: <CalendarDays size={15} /> },
    { command: "/exams", label: "Lịch thi", detail: "FIND_EXAMS", icon: <ClipboardList size={15} /> },
    { command: "/files", label: "File mẫu", detail: "Workspace", icon: <FolderOpen size={15} /> },
    { command: "/storage", label: "Bộ nhớ", detail: "Local storage", icon: <Database size={15} /> },
    { command: "/health", label: "Kiểm tra", detail: "Health report", icon: <Check size={15} /> },
    { command: "/release", label: "Phát hành", detail: "Release 1.0.1", icon: <BadgeCheck size={15} /> },
    { command: "/appearance", label: "Giao diện", detail: "Theme studio", icon: <Palette size={15} /> },
    { command: "/admissions", label: "Tuyển sinh", detail: "Public info", icon: <GraduationCap size={15} /> },
    { command: "/logs", label: "Nhật ký", detail: "Metadata", icon: <ListChecks size={15} /> },
    { command: "/privacy", label: "Quyền riêng tư", detail: "Local-first", icon: <Shield size={15} /> },
    { command: "/help", label: "Danh sách lệnh", detail: "Command", icon: <HelpCircle size={15} /> },
    { command: "/clear", label: "Xóa phiên hiển thị", detail: "Session", icon: <Sparkles size={15} /> },
  ];
  const commandQuery = input.trim().toLowerCase();
  const visibleCommandSuggestions = commandQuery.startsWith("/")
    ? commandSuggestions.filter((item) => item.command.startsWith(commandQuery) || item.label.toLowerCase().includes(commandQuery.slice(1)))
    : [];

  function openSettings() {
    setSettingsBackView((current) => (view === "settings" ? current : view));
    setView("settings");
  }

  function closeSettings() {
    setView(settingsBackView === "settings" ? "chat" : settingsBackView);
  }

  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [commandQuery]);

  function handleHistoryClick() {
    setView("history");
  }

  async function handleSelectSession(session: ChatSession) {
    await handleSelectSessionInternal(session, () => setView("chat"));
  }

  function buildSubjectClarificationMessage() {
    const subjectNames = (bootstrap?.subjects ?? []).map((subject) => subject.name).slice(0, 6);
    if (subjectNames.length === 0) {
      return "Bạn muốn tìm tài liệu môn nào? Hiện app chưa nạp được danh sách môn local.";
    }
    return `Bạn muốn tìm tài liệu môn nào? Các môn hiện có: ${subjectNames.join(", ")}.`;
  }

  function canRouteBeforeBootstrap(value: string) {
    if (!value.startsWith("/")) return false;
    const action = parseSlashCommand(value);
    return action === "help" || action === "clear" || action === "privacy";
  }

  async function submitUserMessage(rawValue: string, source: UserMessageSource) {
    const value = rawValue.trim();
    if (!value || isBusy) return;
    setInput("");
    setError(null);
    appendMessage({ id: newId(), role: "user", content: value });

    setIsBusy(true);
    try {
      if (!bootstrap && !canRouteBeforeBootstrap(value)) {
        appendAssistant("Ứng dụng đang khởi tạo dữ liệu local. Bạn thử lại sau vài giây hoặc dùng /help để xem lệnh hiện có.");
        return;
      }
      await handleUserInput(value);
    } catch (err) {
      const safeMessage = String(err ?? "Không rõ lỗi");
      setError(safeMessage);
      appendAssistant(`Có lỗi khi xử lý yêu cầu từ ${source}. Bạn thử lại sau vài giây.`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitUserMessage(input, "composer");
  }

  async function submitText(rawValue: string, source: UserMessageSource = "shortcut") {
    await submitUserMessage(rawValue, source);
  }

  async function submitCommandSuggestion(command: string) {
    await submitUserMessage(command, "command-suggestion");
  }

  async function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitText(input);
      return;
    }

    if (visibleCommandSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedCommandIndex((index) => (index + 1) % visibleCommandSuggestions.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedCommandIndex((index) => (index - 1 + visibleCommandSuggestions.length) % visibleCommandSuggestions.length);
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const selected = visibleCommandSuggestions[selectedCommandIndex];
      if (selected) setInput(selected.command);
    }
  }

  async function handleUserInput(value: string) {
    const trimmed = value.trim();
    if (trimmed.startsWith("/")) {
      if (trimmed === "/") {
        appendAssistant("Vui lòng nhập lệnh hợp lệ (ví dụ: /help, /schedule, /documents) hoặc gõ câu hỏi bình thường.");
        return;
      }
      const commandAction = parseSlashCommand(value);
      if (commandAction !== "unknown") {
        await handleSlashCommand(commandAction);
        return;
      }
      await handleSlashCommand(value);
      return;
    }

    if (conversation?.flow === "FIND_DOCUMENTS" && conversation.step === "WAITING_FOR_FILE_CONFIRMATION") {
      const confirmation = parseConfirmationIntent(value);
      if (confirmation === "confirm") {
        await confirmFileAction();
        return;
      }
      if (confirmation === "cancel") {
        cancelFileAction();
        return;
      }
      appendAssistant("Bạn muốn xác nhận hay hủy thao tác file? Hãy nhập: xác nhận hoặc hủy.");
      return;
    }

    if (conversation?.flow === "FIND_DOCUMENTS" && conversation.step === "WAITING_FOR_SUBJECT") {
      if (parseFlowControlIntent(value) === "cancel") {
        cancelConversation();
        return;
      }

      const subject = findSubjectInText(value, bootstrap?.subjects ?? []);
      if (!subject) {
        appendAssistant(buildSubjectClarificationMessage());
        return;
      }

      const semester = extractSemester(value) ?? conversation.data.semester;
      const nextState: ConversationState = {
        flow: "FIND_DOCUMENTS",
        step: semester ? "SHOWING_DOCUMENTS" : "WAITING_FOR_SEMESTER",
        data: {
          subjectId: subject.id,
          subjectName: subject.name,
          semester,
        },
      };
      setConversation(nextState);
      if (!semester) {
        appendAssistant(`Tui nhận diện môn ${subject.name}. Bạn muốn tìm tài liệu học kỳ nào?`);
        return;
      }
      await showDocuments(subject.id, subject.name, semester);
      return;
    }

    if (conversation?.flow === "FIND_DOCUMENTS" && conversation.step === "SHOWING_DOCUMENTS") {
      const control = parseFlowControlIntent(value);
      if (control === "cancel") {
        cancelConversation();
        return;
      }
      if (control === "back") {
        returnToSemesterSelection(conversation);
        return;
      }

      const documentAction = parseDocumentActionIntent(value);
      if (documentAction) {
        const docs = getConversationDocuments(conversation);
        const selectedDocument = docs[documentAction.ordinal - 1];
        if (!selectedDocument) {
          appendAssistant(`Không có file số ${documentAction.ordinal} trong danh sách hiện tại.`);
          return;
        }
        requestFileAction(selectedDocument, documentAction.action);
        return;
      }
    }

    if (conversation?.flow === "FIND_DOCUMENTS" && conversation.step === "WAITING_FOR_SEMESTER") {
      if (parseFlowControlIntent(value) === "cancel") {
        cancelConversation();
        return;
      }

      const semester = extractSemester(value);
      if (!semester) {
        appendAssistant("Bạn muốn tìm tài liệu học kỳ nào? Ví dụ: học kỳ 1.");
        return;
      }
      const nextState: ConversationState = {
        ...conversation,
        step: "SHOWING_DOCUMENTS",
        data: { ...conversation.data, semester },
      };
      if (!nextState.data.subjectId || !nextState.data.subjectName) {
        setConversation({ flow: "FIND_DOCUMENTS", step: "WAITING_FOR_SUBJECT", data: { subjectId: null, subjectName: null, semester } });
        appendAssistant(buildSubjectClarificationMessage());
        return;
      }
      setConversation(nextState);
      await showDocuments(nextState.data.subjectId, nextState.data.subjectName, semester);
      return;
    }

    const intent = detectIntent(value, bootstrap?.subjects ?? []);
    switch (intent.intent) {
      case "FIND_DOCUMENTS": {
        const state = createFindDocumentsState(intent);
        setConversation(state);
        if (!intent.semester) {
          appendAssistant(`Tui nhận diện môn ${intent.subjectName}. Bạn muốn tìm tài liệu học kỳ nào?`);
          return;
        }
        await showDocuments(intent.subjectId, intent.subjectName, intent.semester);
        return;
      }
      case "NEEDS_SUBJECT":
        if (!bootstrap?.subjects.length) {
          setConversation(null);
          setView("files");
          appendAssistant("Chưa có danh sách môn và tài liệu từ tài khoản trường. Mở hệ thống học tập trong trang Tài liệu để tra cứu nguồn chính thức.");
          return;
        }
        setConversation({
          flow: "FIND_DOCUMENTS",
          step: "WAITING_FOR_SUBJECT",
          data: { subjectId: null, subjectName: null, semester: intent.semester },
        });
        appendAssistant(buildSubjectClarificationMessage());
        return;
      case "FIND_ANNOUNCEMENTS":
        await showAnnouncements();
        return;
      case "FIND_SCHEDULE":
        await showSchedule(intent.semester ?? undefined);
        return;
      case "FIND_EXAMS":
        await showExams(intent.semester ?? undefined);
        return;
      case "PUBLIC_ADMISSIONS_INFO":
        await runPublicSchoolSearch(value);
        return;
      default: {
        const schoolRes = handleSchoolChatQuery(value);
        if (schoolRes.isSchoolQuery) {
          appendAssistant(schoolRes.answerMarkdown);
          return;
        }
        appendAssistant("Mình hỗ trợ dữ liệu local hiện có: tài liệu, thông báo, lịch học, lịch thi, tuyển sinh công khai, file, bộ nhớ, kiểm tra và quyền riêng tư.");
      }
    }
  }

  async function handleSlashCommand(value: string) {
    const action = value.startsWith("/") ? parseSlashCommand(value) : value;
    switch (action) {
      case "help":
        appendAssistant(
          [
            "Các lệnh đang hỗ trợ:",
            "/documents - tìm tài liệu lập trình mạng.",
            "/announcements - xem thông báo mẫu local.",
            "/schedule - xem lịch học mẫu local.",
            "/exams - xem lịch thi mẫu local.",
            "/files - mở trang file mẫu.",
            "/storage - xem bộ nhớ local.",
            "/health - kiểm tra app local.",
            "/release - checklist phát hành.",
            "/appearance - tùy biến giao diện.",
            "/admissions - hỏi thông tin tuyển sinh công khai, ví dụ khối 2008 nhập học năm nào.",
            "/logs - xem action log metadata.",
            "/privacy - xem cam kết local-first.",
            "/clear - xóa nội dung chat đang hiển thị.",
          ].join("\n"),
        );
        return;
      case "documents":
        await handleUserInput("tìm tài liệu lập trình mạng");
        return;
      case "announcements":
        await showAnnouncements();
        return;
      case "schedule":
        await showSchedule();
        return;
      case "exams":
        await showExams();
        return;
      case "files":
        setView("files");
        appendAssistant("Đã mở trang File mẫu.");
        return;
      case "storage":
        setView("storage");
        appendAssistant("Đã mở trang Bộ nhớ.");
        return;
      case "health":
        setView("health");
        await refreshHealthReport();
        appendAssistant("Đã mở trang Kiểm tra.");
        return;
      case "release":
        setView("release");
        appendAssistant("Đã mở checklist Phát hành.");
        return;
      case "appearance":
        setView("appearance");
        appendAssistant("Đã mở trang Giao diện.");
        return;
      case "admissions":
        appendAssistant(
          [
            `Bạn đang chọn ${getSchoolOption(schoolProfile).shortName}.`,
            "Hãy nhập từ khóa hoặc câu hỏi, ví dụ: \"2008 chừng nào nhập học\".",
            "Bot sẽ tìm trên các trang công khai đã cấu hình của trường và trả về đoạn trích kèm nguồn.",
            "Không cần đăng nhập và không nhận mật khẩu/token/cookie.",
          ].join("\n"),
        );
        return;
      case "logs":
        setView("logs");
        await listActionLogs(100).then(setActionLogs);
        appendAssistant("Đã mở trang Nhật ký.");
        return;
      case "gpa":
        setView("gpa");
        appendAssistant("Đã mở Công cụ Tính điểm GPA / CPA tích lũy Local.");
        return;
      case "school":
        setView("school");
        appendAssistant("Đã mở trang Trường & Tài khoản sinh viên.");
        return;
      case "clear":
        startNewChat();
        return;
      default:
        appendAssistant("Lệnh này chưa được hỗ trợ trong bản local-first.");
    }
  }

  function formatPublicSearchResponse(response: PublicSearchResponse) {
    if (response.results.length === 0) {
      return [
        response.message,
        "",
        "Nguồn đã kiểm tra:",
        ...response.searchedUrls.map((url) => `- ${url}`),
        "",
        "Bot không tự suy luận ngày nhập học nếu trang công khai không có dữ liệu khớp.",
      ].join("\n");
    }

    const lines = [
      response.message,
      "",
      ...response.results.slice(0, 4).flatMap((result, index) => [
        `${index + 1}. ${result.title}`,
        result.snippet,
        `Nguồn: ${result.sourceUrl}`,
        "",
      ]),
      "Kết quả này lấy từ trang công khai, không dùng dữ liệu đăng nhập cá nhân.",
    ];
    return lines.join("\n").trim();
  }

  async function runPublicSchoolSearch(query: string) {
    const school = getSchoolOption(schoolProfile);
    if (!school.portalUrl && schoolProfile.schoolId !== "uth") {
      appendAssistant("Trường này chưa có nguồn công khai được cấu hình. Hãy chọn UTH hoặc thêm manifest trường trước.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await searchPublicSchoolInfo(schoolProfile.schoolId, query);
      appendAssistant(formatPublicSearchResponse(response));
    } catch (err) {
      appendAssistant(
        [
          `Không tra cứu được nguồn công khai của ${school.shortName}.`,
          String(err),
          "App không yêu cầu đăng nhập và không thu mật khẩu/token/cookie cho luồng này.",
        ].join("\n"),
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function showDocuments(_subjectId: string, subjectName: string, _semester: number) {
    setConversation(null);
    setView("files");
    appendAssistant(`Chưa có tài liệu môn ${subjectName} được đồng bộ từ tài khoản trường. Mở hệ thống học tập trong trang Tài liệu để xem nguồn chính thức. Tài liệu mẫu nằm ở tab minh họa riêng.`);
  }

  async function showAnnouncements() {
    setIsBusy(true);
    try {
      setView("announcements");
      appendAssistant("Chưa có thông báo trường được đồng bộ. Bạn có thể mở website chính thức trong trang Thông báo.");
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function showSchedule(semester?: number) {
    setIsBusy(true);
    try {
      const scheduleItems = await loadAcademicSchedule(readSchoolProfile());
      setView("schedule");
      appendAssistant(scheduleItems.length ? `Có ${scheduleItems.length} buổi học trong cache tài khoản trường.${semester ? " Cache chưa có thông tin học kỳ để lọc." : ""}` : ACADEMIC_CONNECTION_REQUIRED, { scheduleItems });
    } catch (err) {
      setError(academicDataErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function showExams(semester?: number) {
    setIsBusy(true);
    try {
      const examItems = await loadAcademicExams(readSchoolProfile());
      setView("exams");
      appendAssistant(examItems.length ? `Có ${examItems.length} lịch thi trong cache UTH thử nghiệm; hãy đối chiếu cổng trường.${semester ? " Cache chưa có thông tin học kỳ để lọc." : ""}` : ACADEMIC_CONNECTION_REQUIRED, { examItems });
    } catch (err) {
      setError(academicDataErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  function requestFileAction(document: DocumentRecord, action: "open" | "copy") {
    const actionText = action === "copy" ? "copy" : "mở";
    setConversation((current) => ({
      flow: "FIND_DOCUMENTS",
      step: "WAITING_FOR_FILE_CONFIRMATION",
      data: {
        subjectId: current?.data.subjectId ?? document.subjectId,
        subjectName: current?.data.subjectName ?? "Lập trình mạng",
        semester: current?.data.semester ?? document.semester,
        documentIds: current?.data.documentIds,
        documentId: document.id,
        fileAction: action,
      },
    }));
    appendAssistant(`Bạn xác nhận ${actionText} file "${document.name}"?`);
  }

  async function confirmFileAction() {
    if (!conversation?.data.documentId || !conversation.data.fileAction) return;
    setIsBusy(true);
    try {
      const result =
        conversation.data.fileAction === "copy"
          ? await copyDocument(conversation.data.documentId)
          : await openDocument(conversation.data.documentId);
      appendAssistant(result.message);
      setConversation({ ...conversation, step: "COMPLETED" });
      setActionLogs(await listActionLogs(100));
      setStorageSummary(await getStorageSummary());
    } catch (err) {
      setError(String(err));
      appendAssistant(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  function cancelConversation() {
    setConversation(null);
    appendAssistant("Đã hủy luồng hiện tại.");
  }

  function returnToSemesterSelection(state: ConversationState) {
    setConversation({
      ...state,
      step: "WAITING_FOR_SEMESTER",
      data: { ...state.data, semester: null, documentId: undefined, fileAction: undefined },
    });
    appendAssistant(`Bạn muốn tìm tài liệu ${state.data.subjectName} học kỳ nào?`);
  }

  function getConversationDocuments(state: ConversationState) {
    const ids = state.data.documentIds ?? [];
    return (bootstrap?.documents ?? []).filter((doc) => ids.includes(doc.id));
  }

  function getDocumentById(documentId?: string) {
    return (bootstrap?.documents ?? []).find((doc) => doc.id === documentId);
  }

  function cancelFileAction() {
    if (!conversation) return;
    appendAssistant("Đã hủy thao tác file. Không có file nào được mở hoặc copy.");
    setConversation({ ...conversation, step: "SHOWING_DOCUMENTS" });
  }

  function handleBackgroundImageDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateAppearance({
          backgroundImage: reader.result,
          backgroundFit: "cover",
          backgroundPosition: "center",
          backgroundOpacity: 0.28,
          backgroundDarkOverlay: draftTheme === "dark" ? 0.55 : 0,
          backgroundLightOverlay: draftTheme === "light" ? 0.48 : 0,
        });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleApplyAppearanceChanges() {
    if (!appearanceDraftIsValid) {
      setError("Mã màu phải đúng dạng #RRGGBB trước khi áp dụng.");
      return;
    }
    setIsBusy(true);
    try {
      let finalBg = draftAppearance.backgroundImage;
      if (finalBg && finalBg.startsWith("data:image/")) {
        if (!bootstrap) {
          setError("Ứng dụng chưa khởi tạo xong. Bạn thử lại sau vài giây.");
          return;
        }
        const match = finalBg.match(/^data:image\/(\w+);base64,/);
        const ext = match ? match[1] : "png";
        const base64Data = finalBg.substring(finalBg.indexOf(",") + 1);
        const relativePath = await saveThemeBackground("current", ext, base64Data);
        const absolutePath = bootstrap.paths.appLocalData + "/" + relativePath;
        finalBg = convertFileSrc(absolutePath);
      } else if (!finalBg && appearance.backgroundImage) {
        await deleteThemeBackground("current");
      }
      const finalAppearance = { ...draftAppearance, backgroundImage: finalBg };
      updateAppearance({ backgroundImage: finalBg });
      applyAppearanceChanges(finalAppearance);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function startNewChat() {
    setView("chat");
    setInput("");
    setConversation(null);
    await startNewChatSession(inputRef);
  }

  async function refreshStorageSummary() {
    try {
      setStorageSummary(await getStorageSummary());
      setActionLogs(await listActionLogs(100));
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleClearActionLogs() {
    const confirmed = window.confirm("Xóa toàn bộ action log metadata local? Nội dung chat và file mẫu không bị xóa.");
    if (!confirmed) return;
    setIsBusy(true);
    try {
      const removed = await clearActionLogs();
      setActionLogs([]);
      await refreshStorageSummary();
      appendAssistant(`Đã xóa ${removed} action log metadata local.`);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleOpenDownloadsFolder() {
    setIsBusy(true);
    try {
      await openDownloadsFolder();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshHealthReport() {
    try {
      setHealthReport(await getHealthReport());
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleExportDiagnosticReport() {
    setIsBusy(true);
    try {
      const result: DiagnosticExportResult = await exportDiagnosticReport();
      appendAssistant(`${result.message}\nFile: ${result.relativePath}`);
      await refreshHealthReport();
      await refreshStorageSummary();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCheckUpdate() {
    setIsBusy(true);
    try {
      const res = await checkForUpdate();
      setUpdateInfo(res);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsBusy(false);
    }
  }

  function conversationStatusText() {
    if (!conversation) return "Sẵn sàng nhận yêu cầu";
    const pendingDocument = getDocumentById(conversation.data.documentId);
    const pendingAction = conversation.data.fileAction === "copy" ? "copy" : "mở";
    switch (conversation.step) {
      case "WAITING_FOR_SEMESTER":
        return `Đang chờ học kỳ cho ${conversation.data.subjectName}`;
      case "SHOWING_DOCUMENTS":
        return `Đang xem tài liệu ${conversation.data.subjectName}, học kỳ ${conversation.data.semester}`;
      case "WAITING_FOR_FILE_CONFIRMATION":
        return `Chờ xác nhận ${pendingAction} ${pendingDocument?.name ?? "file đã chọn"}`;
      case "COMPLETED":
        return "Thao tác đã hoàn tất";
      default:
        return "Đang xử lý luồng tài liệu";
    }
  }

  function sidebarSessionStatus() {
    if (!conversation) return "Sẵn sàng";
    switch (conversation.step) {
      case "WAITING_FOR_SEMESTER":
        return "Chờ học kỳ";
      case "SHOWING_DOCUMENTS":
        return "Đang xem tài liệu";
      case "WAITING_FOR_FILE_CONFIRMATION":
        return "Chờ xác nhận";
      case "COMPLETED":
        return "Hoàn tất";
      default:
        return "Đang xử lý";
    }
  }

  function viewTitle() {
    switch (view) {
      case "chat":
        return "Trò chuyện với trợ lý";
      case "announcements":
        return "Thông báo";
      case "schedule":
        return "Lịch học";
      case "exams":
        return "Lịch thi";
      case "files":
        return "File mẫu";
      case "storage":
        return "Bộ nhớ";
      case "health":
        return "Kiểm tra";
      case "release":
        return "Phát hành";
      case "appearance":
        return "Giao diện";
      case "logs":
        return "Nhật ký";
      case "school":
        return "Trường & tài khoản";
      case "gpa":
        return "Tính điểm GPA / CPA Local";
      case "privacy":
        return "Quyền riêng tư";
      case "settings":
        return "Cài đặt";
      default:
        return "Campus Assistant Local";
    }
  }

  function desktopWindow() {
    return "__TAURI_INTERNALS__" in window ? getCurrentWindow() : null;
  }

  return (
    <>
    <header className={view === "settings" ? "desktop-titlebar settings-titlebar" : "desktop-titlebar workspace-titlebar"} data-tauri-drag-region>
      <div className="titlebar-nav-controls">
        <button
          className={sidebarExpanded && view !== "settings" ? "titlebar-nav-btn active" : "titlebar-nav-btn"}
          onClick={toggleSidebarExpanded}
          disabled={view === "settings"}
          title={view === "settings" ? "Sidebar không hiển thị trong Cài đặt" : sidebarExpanded ? "Thu gọn Sidebar (Ctrl+B)" : "Mở rộng Sidebar (Ctrl+B)"}
          aria-label="Sidebar"
        >
          <PanelLeft size={15} />
        </button>
        <button
          className="titlebar-nav-btn"
          onClick={closeSettings}
          disabled={view !== "settings"}
          title={view === "settings" ? "Quay lại workspace" : "Không có trang trước"}
          aria-label="Quay lại"
        >
          <ChevronLeft size={16} />
        </button>
        <button className="titlebar-nav-btn" disabled title="Chưa có lịch sử tiến tới" aria-label="Tiến tới">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="titlebar-brand" data-tauri-drag-region>
        <img src={appLogo} alt="Logo" className="titlebar-logo-img" />
        <strong>Campus Assistant · {viewTitle()}</strong>
      </div>

      {view !== "settings" && (
        <>
          <div className="titlebar-center-search" onClick={() => setCommandPaletteOpen(true)}>
            <Search size={12} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span className="search-placeholder">Campus Assistant · Tìm nhanh tài liệu, lịch học, thông báo... (Ctrl+K)</span>
          </div>

          <div className="titlebar-actions">
            <button
              className={view === "appearance" ? "titlebar-btn active" : "titlebar-btn"}
              onClick={() => setView("appearance")}
              title="Tùy biến Giao diện & Chủ đề"
              aria-label="Tùy biến Giao diện"
            >
              <Palette size={14} />
            </button>
            <button
              className={view === "health" ? "titlebar-btn active" : "titlebar-btn"}
              onClick={() => { setView("health"); void refreshHealthReport(); }}
              title="Kiểm tra hệ thống local"
              aria-label="Kiểm tra hệ thống"
            >
              <Activity size={14} />
            </button>
            <button
              className={view === "privacy" ? "titlebar-btn active" : "titlebar-btn"}
              onClick={() => setView("privacy")}
              title="Cam kết bảo mật Local-First"
              aria-label="Quyền riêng tư & Bảo mật"
            >
              <Shield size={14} />
            </button>
          </div>
        </>
      )}

      <div className="titlebar-controls">
        <button aria-label="Thu nhỏ" title="Thu nhỏ" disabled={!desktopWindow()} onClick={() => void desktopWindow()?.minimize().catch(() => setError("Không thu nhỏ được cửa sổ."))}><Minus size={15} /></button>
        <button aria-label="Phóng to hoặc khôi phục" title="Phóng to hoặc khôi phục" disabled={!desktopWindow()} onClick={() => void desktopWindow()?.toggleMaximize().catch(() => setError("Không đổi được kích thước cửa sổ."))}><Square size={13} /></button>
        <button aria-label="Đóng" title="Đóng" disabled={!desktopWindow()} onClick={() => void desktopWindow()?.close().catch(() => setError("Không đóng được cửa sổ."))}><X size={16} /></button>
      </div>
    </header>
    <main className={view === "settings" ? "app-shell settings-mode" : "app-shell"} style={appLayoutStyle}>
      {view !== "settings" && (
      <aside className={sidebarExpanded ? "sidebar expanded" : "sidebar"}>
        <div className="brand">
          <div className="brand-icon logo-brand">
            <img src={appLogo} alt="Campus Assistant Logo" className="brand-logo-img" />
            {!sidebarExpanded && <span className="sidebar-tooltip">Campus Assistant</span>}
          </div>
          <div className="brand-text">
            <strong>Campus Assistant</strong>
            <span>Local · {appVersion}</span>
          </div>
          <button
            className="sidebar-pin-btn"
            onClick={(e) => {
              toggleSidebarExpanded();
              e.currentTarget.blur();
            }}
            title={sidebarExpanded ? "Thu gọn thanh bên (Ctrl+B)" : "Ghim mở rộng thanh bên (Ctrl+B)"}
            aria-label={sidebarExpanded ? "Thu gọn thanh bên" : "Ghim thanh bên"}
          >
            {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {!sidebarExpanded && <span className="sidebar-tooltip">Ghim mở rộng (Ctrl+B)</span>}
          </button>
        </div>

        <div className="status-pill">
          <Circle size={10} fill="#22c55e" />
          Ứng dụng local
        </div>

        <button className="new-chat-button" onClick={startNewChat}>
          <Plus size={17} />
          <span>Cuộc trò chuyện mới</span>
          {!sidebarExpanded && <span className="sidebar-tooltip">Cuộc trò chuyện mới</span>}
        </button>

        <div className="sidebar-section">
          <h2>Phiên hiện tại</h2>
          <button className={view === "chat" ? "session-button active" : "session-button"} onClick={() => setView("chat")}>
            <Sparkles size={16} />
            <span>
              <strong>Trợ lý tài liệu</strong>
              <small>{sidebarSessionStatus()}</small>
            </span>
            {!sidebarExpanded && <span className="sidebar-tooltip">Phiên làm việc hiện tại</span>}
          </button>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <h2>Gần đây</h2>
            <nav className="nav-groups" aria-label="Gần đây">
              <button className={view === "history" ? "active" : ""} onClick={handleHistoryClick}>
                <History size={17} />
                <span className="nav-label">Xem tất cả lịch sử</span>
                <span className="nav-badge local-badge">Local</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Xem tất cả lịch sử</span>}
              </button>
            </nav>
          </div>

          <div className="sidebar-section">
            <h2>Học tập</h2>
            <nav className="nav-groups" aria-label="Học tập">
              <button className={view === "announcements" ? "active" : ""} onClick={() => setView("announcements")}>
                <Bell size={17} />
                <span className="nav-label">Thông báo</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Thông báo</span>}
              </button>
              <button className={view === "schedule" ? "active" : ""} onClick={() => setView("schedule")}>
                <CalendarDays size={17} />
                <span className="nav-label">Lịch học</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Lịch học</span>}
              </button>
              <button className={view === "exams" ? "active" : ""} onClick={() => setView("exams")}>
                <ClipboardList size={17} />
                <span className="nav-label">Lịch thi</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Lịch thi</span>}
              </button>
              <button className={view === "files" ? "active" : ""} onClick={() => setView("files")}>
                <FolderOpen size={17} />
                <span className="nav-label">Tài liệu</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Tài liệu</span>}
              </button>
              <button className={view === "gpa" ? "active" : ""} onClick={() => setView("gpa")}>
                <GraduationCap size={17} />
                <span className="nav-label">GPA / CPA</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">GPA / CPA</span>}
              </button>
            </nav>
          </div>

          <div className="sidebar-section">
            <h2>Kết nối</h2>
            <nav className="nav-groups" aria-label="Kết nối">
              <button className={view === "school" ? "active" : ""} onClick={() => setView("school")}>
                <GraduationCap size={17} />
                <span className="nav-label">Trường & tài khoản</span>
                {!sidebarExpanded && <span className="sidebar-tooltip">Trường & tài khoản</span>}
              </button>
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className={view === "school" ? "account-footer-button active" : "account-footer-button"} onClick={() => setView("school")}>
            <span className="avatar">
              {getSchoolProfileInitials(schoolProfile)}
              {!sidebarExpanded && <span className="sidebar-tooltip">{getSchoolProfileTitle(schoolProfile)}</span>}
            </span>
            <span className="account-footer-text">
              <strong>{getSchoolProfileTitle(schoolProfile)}</strong>
              <span>{getSchoolProfileSubtitle(schoolProfile)}</span>
            </span>
          </button>
          <button className="sidebar-footer-settings" onClick={openSettings} aria-label="Cài đặt" title="Cài đặt">
            <Settings size={17} />
            {!sidebarExpanded && <span className="sidebar-tooltip">Cài đặt</span>}
          </button>
        </div>
      </aside>
      )}

      {view !== "settings" && (
      <div
        className="resize-handle resize-handle-sidebar"
        role="separator"
        aria-label="Kéo để đổi độ rộng sidebar"
        onPointerDown={(event) => startColumnResize("sidebar", event)}
        onDoubleClick={toggleSidebarExpanded}
      />
      )}

      <section className="content">
        {!bootstrap && (
          <div className="bootstrap-status" role={bootstrapError ? "alert" : "status"}>
            {bootstrapError ? (
              <>
                <span>{"__TAURI_INTERNALS__" in window
                  ? "Không khởi tạo được dữ liệu local. Dữ liệu đã lưu được giữ nguyên."
                  : "Bản xem trước trình duyệt chưa kết nối backend desktop."}
                </span>
                <button type="button" onClick={retryBootstrap}>Thử lại</button>
              </>
            ) : bootstrapSlow ? (
              <>
                <span className="bootstrap-spinner" aria-hidden="true" />
                <span>Native layer đang khởi động, vui lòng chờ thêm...</span>
              </>
            ) : (
              <span>Đang khởi tạo dữ liệu local...</span>
            )}
          </div>
        )}

        {updateInfo?.updateAvailable && (
          <section className={updateInfo.required ? "update-banner required" : "update-banner"}>
            <div>
              <strong>{updateInfo.required ? "Bắt buộc cập nhật" : "Có phiên bản mới"}</strong>
              <span>Bản hiện tại {updateInfo.currentVersion}; bản mới {updateInfo.latestVersion}. {updateInfo.message}</span>
            </div>
            {updateInfo.downloadUrl && (
              <button onClick={() => window.open(updateInfo.downloadUrl ?? "", "_blank", "noopener,noreferrer")}>Tải bản mới</button>
            )}
          </section>
        )}

        {view !== "settings" && (
        <header className="topbar">
          <div>
            <h1><Sparkles size={24} />{viewTitle()}</h1>
            <p>Trợ lý xử lý bằng lệnh, từ khóa và dữ liệu cục bộ — không gửi hội thoại đến dịch vụ AI.</p>
          </div>
        </header>
        )}

        {view === "chat" && (
          <>
            <div className="chat-panel" aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="bubble">
                    <p>{message.content}</p>
                    {message.documents && <DocumentTable documents={message.documents} onAction={requestFileAction} />}
                    {message.announcements && <AnnouncementTable announcements={message.announcements} compact />}
                    {message.scheduleItems && <ScheduleTable scheduleItems={message.scheduleItems} compact />}
                    {message.examItems && <ExamTable examItems={message.examItems} compact />}
                  </div>
                </article>
              ))}

              {messages.length === 1 && !conversation && (
                <div className="starter-grid">
                  <button onClick={() => void submitText("tìm tài liệu", "starter")} disabled={isBusy}><BookOpen size={18} /><span><strong>Tìm tài liệu</strong><small>Hệ thống học tập của trường</small></span></button>
                  <button onClick={() => setView("files")} disabled={isBusy}><FolderOpen size={18} /><span><strong>Tài liệu</strong><small>Tài liệu trường và tệp minh họa</small></span></button>
                  <button onClick={() => void submitText("xem thông báo", "starter")} disabled={isBusy}><Bell size={18} /><span><strong>Xem thông báo</strong><small>Website trường</small></span></button>
                  <button onClick={() => void submitText("xem lịch học", "starter")} disabled={isBusy}><CalendarDays size={18} /><span><strong>Xem lịch học</strong><small>Cache tài khoản trường</small></span></button>
                  <button onClick={() => void submitText("xem lịch thi", "starter")} disabled={isBusy}><ClipboardList size={18} /><span><strong>Xem lịch thi</strong><small>Cache tài khoản trường</small></span></button>
                  <button onClick={() => setView("logs")} disabled={!bootstrap || isBusy}><ListChecks size={18} /><span><strong>Kiểm tra nhật ký</strong><small>Chỉ metadata an toàn</small></span></button>
                  <button onClick={() => setView("health")} disabled={!bootstrap || isBusy}><Check size={18} /><span><strong>Kiểm tra app</strong><small>Báo cáo local</small></span></button>
                  <button onClick={() => void submitText("/help", "starter")} disabled={isBusy}><HelpCircle size={18} /><span><strong>Xem lệnh nhanh</strong><small>Danh sách command v1.0</small></span></button>
                </div>
              )}

              {conversation?.step === "WAITING_FOR_FILE_CONFIRMATION" && (
                <article className="message assistant">
                  <div className="bubble confirmation">
                    <p>Chọn xác nhận hoặc nhập xác nhận/hủy trong chat.</p>
                    <div className="button-row">
                      <button className="primary" onClick={() => void confirmFileAction()} disabled={isBusy}><Check size={16} />Xác nhận</button>
                      <button onClick={cancelFileAction} disabled={isBusy}>Hủy</button>
                    </div>
                  </div>
                </article>
              )}
              <div ref={bottomRef} />
            </div>

            <form className="composer" onSubmit={handleSubmit}>
              <div className="composer-context">
                <span>{conversationStatusText()}</span>
                {conversation?.step === "WAITING_FOR_SEMESTER" && <button type="button" onClick={cancelConversation} disabled={isBusy}>Hủy</button>}
                {conversation?.step === "SHOWING_DOCUMENTS" && (
                  <>
                    <button type="button" onClick={() => returnToSemesterSelection(conversation)} disabled={isBusy}>Quay lại</button>
                    <button type="button" onClick={cancelConversation} disabled={isBusy}>Hủy</button>
                  </>
                )}
                {conversation?.step === "WAITING_FOR_FILE_CONFIRMATION" && (
                  <>
                    <button type="button" className="primary" onClick={() => void confirmFileAction()} disabled={isBusy}>Xác nhận</button>
                    <button type="button" onClick={cancelFileAction} disabled={isBusy}>Hủy</button>
                  </>
                )}
              </div>

              {visibleCommandSuggestions.length > 0 && (
                <div className="command-suggestions">
                  {visibleCommandSuggestions.map((item, index) => (
                    <button
                      key={item.command}
                      className={index === selectedCommandIndex ? "selected" : ""}
                      type="button"
                      onMouseEnter={() => setSelectedCommandIndex(index)}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => void submitCommandSuggestion(item.command)}
                      disabled={isBusy}
                    >
                      {item.icon}
                      <span><strong>{item.label}</strong><small>{item.command} · {item.detail}</small></span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => void handleComposerKeyDown(event)}
                placeholder="Nhập yêu cầu, ví dụ: tìm tài liệu lập trình mạng"
                rows={3}
              />

              <div className="composer-toolbar">
                <div className="composer-actions">
                  {composerShortcutsEnabled && !conversation && (
                    <>
                      <button type="button" onClick={() => void submitText("tìm tài liệu lập trình mạng", "shortcut")} disabled={isBusy}><BookOpen size={15} />Tìm tài liệu</button>
                      <button type="button" onClick={() => void submitText("xem thông báo", "shortcut")} disabled={isBusy}><Bell size={15} />Thông báo</button>
                      <button type="button" onClick={() => void submitText("xem lịch học", "shortcut")} disabled={isBusy}><CalendarDays size={15} />Lịch học</button>
                      <button type="button" onClick={() => void submitText("xem lịch thi", "shortcut")} disabled={isBusy}><ClipboardList size={15} />Lịch thi</button>
                      <button type="button" onClick={() => void submitText("/help", "shortcut")} disabled={isBusy}><HelpCircle size={15} />/help</button>
                    </>
                  )}
                  {composerShortcutsEnabled && conversation?.step === "WAITING_FOR_SEMESTER" && (
                    <>
                      <button type="button" onClick={() => void submitText("học kỳ 1", "shortcut")} disabled={isBusy}><FileText size={15} />Học kỳ 1</button>
                      <button type="button" onClick={() => void submitText("hủy", "shortcut")} disabled={isBusy}>Hủy</button>
                    </>
                  )}
                  {composerShortcutsEnabled && conversation?.step === "SHOWING_DOCUMENTS" && (
                    <>
                      <button type="button" onClick={() => void submitText("mở 1", "shortcut")} disabled={isBusy}>Mở 1</button>
                      <button type="button" onClick={() => void submitText("copy 1", "shortcut")} disabled={isBusy}>Copy 1</button>
                      <button type="button" onClick={() => void submitText("quay lại", "shortcut")} disabled={isBusy}>Quay lại</button>
                    </>
                  )}
                  {composerShortcutsEnabled && conversation?.step === "WAITING_FOR_FILE_CONFIRMATION" && (
                    <>
                      <button type="button" onClick={() => void submitText("xác nhận", "shortcut")} disabled={isBusy}>Xác nhận</button>
                      <button type="button" onClick={() => void submitText("hủy", "shortcut")} disabled={isBusy}>Hủy</button>
                    </>
                  )}
                  {composerShortcutsEnabled && conversation?.step === "COMPLETED" && <button type="button" onClick={startNewChat} disabled={!bootstrap || isBusy}><Plus size={15} />Chat mới</button>}
                </div>
                <button className="send-button" type="submit" disabled={isBusy || input.trim().length === 0} aria-label="Gửi tin nhắn">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}

        {view === "files" && <FilesPage bootstrap={bootstrap} />}
        {view === "announcements" && <AnnouncementsPage />}
        {view === "schedule" && <SchedulePage />}
        {view === "exams" && <ExamsPage />}
        {view === "gpa" && <GpaPage />}
        {view === "storage" && (
          <StoragePage
            summary={storageSummary}
            onRefresh={() => void refreshStorageSummary()}
            onClearLogs={() => void handleClearActionLogs()}
            onOpenDownloads={() => void handleOpenDownloadsFolder()}
            isBusy={isBusy}
          />
        )}
        {view === "health" && (
          <HealthPage
            appVersion={appVersion}
            report={healthReport}
            onRefresh={() => void refreshHealthReport()}
            onExport={() => void handleExportDiagnosticReport()}
            isBusy={isBusy}
          />
        )}
        {view === "release" && (
          <ReleasePage
            appVersion={appVersion}
            bootstrap={bootstrap}
            healthReport={healthReport}
            storageSummary={storageSummary}
            actionLogCount={actionLogs.length}
          />
        )}
        {view === "appearance" && (
          <AppearancePage
            appearance={draftAppearance}
            accentColor={draftAccentColor}
            theme={draftTheme}
            hasChanges={hasAppearanceChanges}
            canApply={appearanceDraftIsValid}
            onAppearanceChange={updateAppearance}
            onAccentChange={updateAccent}
            onThemeChange={updateTheme}
            onApply={handleApplyAppearanceChanges}
            onDiscard={discardAppearanceChanges}
            onReset={resetAppearance}
          />
        )}
        {view === "logs" && <LogsPage logs={actionLogs} onRefresh={() => void listActionLogs(100).then(setActionLogs)} />}
        {view === "school" && <SchoolPage />}
        {view === "privacy" && <PrivacyPage />}
        {view === "history" && (
          <ChatHistoryPage
            onSelectSession={handleSelectSession}
            onNewChat={startNewChat}
            onNavigateToSettings={() => setView("settings")}
          />
        )}
        {view === "settings" && (
          <SettingsPage
            storageSummary={storageSummary}
            healthReport={healthReport}
            isBusy={isBusy}
            onRefreshStorage={() => void refreshStorageSummary()}
            onClearActionLogs={() => void handleClearActionLogs()}
            onOpenDownloads={() => void handleOpenDownloadsFolder()}
            onCheckUpdate={() => void handleCheckUpdate()}
            onExportDiagnostics={() => void handleExportDiagnosticReport()}
            onResetAppearance={resetAppearance}
              onResetLayout={() => {
                resetColumnWidth("sidebar");
                resetColumnWidth("utility");
                resetColumnWidth("customize");
              }}
              onNavigateToAppearance={() => setView("appearance")}
              onNavigateToView={(v) => setView(v as View)}
              onAutoFocusChatChange={setAutoFocusChatEnabled}
              openGlassConfirm={openConfirmModal}
            openGlassAlert={openAlertModal}
          />
        )}
        {error && <div className="error-box">Lỗi: {error}</div>}
        {historyPersistenceWarning && <div className="warning-box">Lưu ý: {historyPersistenceWarning}</div>}
      </section>

      {view !== "settings" && (
      <div
        className="resize-handle resize-handle-utility"
        role="separator"
        aria-label="Kéo để đổi độ rộng panel vận hành"
        onPointerDown={(event) => startColumnResize("utility", event)}
        onDoubleClick={() => resetColumnWidth("utility")}
      />
      )}

      {view !== "settings" && (
      <aside className={layoutWidths.utility === 0 ? "utility-panel collapsed" : "utility-panel"} aria-label="Trạng thái và thao tác nhanh">
        <section className="panel-card storage-widget">
          <h2>Bộ nhớ & Dung lượng</h2>
          <div className="storage-visual">
            <div className="storage-ring">
              <strong>{storageTotalLabel}</strong>
              <span>Đang quản lý</span>
            </div>
            <div className="storage-legend">
              <span><i style={{ background: "#60a5fa" }} />Tài liệu {formatBytes(storageSummary?.sampleDocumentBytes ?? documentStats.totalBytes)}</span>
              <span><i style={{ background: "#34d399" }} />Downloads {formatBytes(storageSummary?.downloadBytes ?? 0)}</span>
              <span><i style={{ background: "#f59e0b" }} />Log {storageSummary?.actionLogCount ?? actionLogs.length}</span>
            </div>
          </div>
          <button className="full-width-button" onClick={() => setView("storage")}>Quản lý dung lượng</button>
        </section>

        <section className="panel-card quick-actions-card">
          <h2>Thao tác nhanh</h2>
          <div className="quick-action-grid">
            <button onClick={() => void handleClearActionLogs()} disabled={isBusy}><Trash size={15} />Xóa log</button>
            <button onClick={() => void handleOpenDownloadsFolder()} disabled={isBusy}><FolderOpen size={15} />Downloads</button>
            <button onClick={() => setView("files")}><FileText size={15} />File mẫu</button>
            <button onClick={() => setView("health")}><Check size={15} />Kiểm tra</button>
            <button className="wide" onClick={() => void handleExportDiagnosticReport()} disabled={isBusy}><Download size={15} />Xuất báo cáo an toàn</button>
          </div>
        </section>

        <section className="panel-card compact-status">
          <h2>Trạng thái thật</h2>
          <StatusLine icon={<Sparkles size={15} />} label="Local" value={bootstrap?.status.appLocal ?? "Khởi tạo"} />
          <StatusLine icon={<Database size={15} />} label="SQLite" value={bootstrap?.status.database ?? "Chưa kết nối"} />
          <StatusLine icon={<BookOpen size={15} />} label="Tài liệu" value={String(bootstrap?.status.sampleDocumentCount ?? 0)} />
          <StatusLine icon={<Bell size={15} />} label="Thông báo" value={String(bootstrap?.status.announcementCount ?? 0)} />
          <StatusLine icon={<CalendarDays size={15} />} label="Lịch học" value={String(bootstrap?.status.scheduleItemCount ?? 0)} />
          <StatusLine icon={<ClipboardList size={15} />} label="Lịch thi" value={String(bootstrap?.status.examCount ?? 0)} />
          <StatusLine icon={<HelpCircle size={15} />} label="Phiên" value={sidebarSessionStatus()} />
        </section>

        <section className="panel-card compact-status">
          <h2>Cập nhật</h2>
          <p>{updateInfo?.message ?? "Đang kiểm tra cấu hình cập nhật..."}</p>
          <p>Phiên bản hiện tại: {updateInfo?.currentVersion ?? appVersion}</p>
        </section>
      </aside>
      )}

      {view !== "settings" && (
      <div
        className={view === "appearance" ? "resize-handle resize-handle-customize hidden" : "resize-handle resize-handle-customize"}
        role="separator"
        aria-label="Kéo để đổi độ rộng panel tùy biến"
        onPointerDown={(event) => startColumnResize("customize", event)}
        onDoubleClick={() => resetColumnWidth("customize")}
      />
      )}

      {view !== "settings" && (
      <aside className={customizeWidth === 0 ? "customize-panel collapsed" : "customize-panel"} aria-label="Tùy biến giao diện">
        <section className="customize-header">
          <div><Sparkles size={18} /><h2>Tùy biến nhanh</h2></div>
          <button aria-label="Mở trang giao diện đầy đủ" onClick={() => setView("appearance")}><Palette size={16} /></button>
        </section>

        <section className="customize-section">
          <h3>Chủ đề</h3>
          <div className="theme-switcher" aria-label="Chọn chủ đề">
            <button onClick={() => updateTheme("light")} className={draftTheme === "light" ? "selected" : ""}><Sun size={15} />Sáng</button>
            <button onClick={() => updateTheme("dark")} className={draftTheme === "dark" ? "selected" : ""}><Moon size={15} />Tối</button>
          </div>
        </section>

        <section className="customize-section">
          <h3>Hình nền</h3>
          <div className="background-presets">
            <button
              onClick={() =>
                updateAppearance({
                  backgroundImage: "",
                  backgroundColor: draftTheme === "dark" ? "#0b0f17" : "#f6f7fb",
                  panelColor: draftTheme === "dark" ? "#111827" : "#ffffff",
                  panelOpacity: draftTheme === "dark" ? 0.86 : 0.9,
                  backgroundOpacity: 0,
                  backgroundBlur: 0,
                  accentTint: draftTheme === "dark" ? 0.08 : 0.03,
                })
              }
            >
              <span className="preset solid" />Màu trơn
            </button>
            <button
              onClick={() =>
                updateAppearance({
                  backgroundImage: "",
                  backgroundColor: draftTheme === "dark" ? "#081120" : "#edf2f7",
                  panelColor: draftTheme === "dark" ? "#101827" : "#ffffff",
                  panelOpacity: draftTheme === "dark" ? 0.82 : 0.9,
                  backgroundOpacity: 0,
                  backgroundBlur: 0,
                  accentTint: 0.14,
                })
              }
            >
              <span className="preset gradient" />Gradient
            </button>
            <button
              onClick={() =>
                updateAppearance({
                  backgroundImage: "",
                  backgroundColor: draftTheme === "dark" ? "#121729" : "#eef6ff",
                  panelColor: draftTheme === "dark" ? "#151a2d" : "#ffffff",
                  panelOpacity: draftTheme === "dark" ? 0.78 : 0.88,
                  backgroundOpacity: 0,
                  backgroundBlur: 0,
                  accentTint: 0.1,
                })
              }
            >
              <span className="preset abstract" />Abstract
            </button>
          </div>
          <input ref={backgroundInputRef} className="hidden-file-input" type="file" accept="image/*" onChange={handleBackgroundImageDraft} style={{ display: 'none' }} />
          <button className="file-pick-button" onClick={() => backgroundInputRef.current?.click()}><Image size={15} />Chọn ảnh nền</button>
          <label className="quick-field slider-field">
            <span>Độ hiển thị ảnh nền <b>{Math.round(draftAppearance.backgroundOpacity * 100)}%</b></span>
            <input type="range" min="0" max="0.45" step="0.01" value={draftAppearance.backgroundOpacity} onChange={(event) => updateAppearance({ backgroundOpacity: Number(event.target.value) })} disabled={!draftAppearance.backgroundImage} />
          </label>
        </section>

        <section className="customize-section">
          <h3>Hiển thị trang</h3>
          <div className="segmented-control" style={{ display: 'flex', width: '100%', padding: '2px' }}>
            {[
              { value: "expressive" as const, label: "Nổi bật" },
              { value: "balanced" as const, label: "Cân bằng" },
              { value: "focus" as const, label: "Tập trung" }
            ].map(opt => (
              <button
                key={opt.value}
                style={{ flex: 1, padding: '6px 4px', fontSize: '11px' }}
                className={draftAppearance.pageMode === opt.value ? "selected" : ""}
                onClick={() => updateAppearance({ pageMode: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="customize-section">
          <h3>Màu nhấn</h3>
          <div className="accent-list">
            {accentOptions.map((color) => (
              <button key={color} aria-label={`Chọn màu ${color}`} className={color === draftAccentColor ? "accent selected" : "accent"} style={{ background: color }} onClick={() => updateAccent(color)} />
            ))}
          </div>
          <label className="hex-field">
            <span>Mã màu</span>
            <input value={draftAccentColor} maxLength={7} spellCheck={false} onChange={(event) => updateAccent(event.target.value)} />
          </label>
        </section>

        <section className="customize-section compact-note">
          <h3>Nâng cao</h3>
          <p>Màu chi tiết, font, mật độ, fit ảnh, vị trí ảnh và overlay nằm trong tab Giao diện đầy đủ.</p>
          <button onClick={() => setView("appearance")}><Palette size={15} />Mở Giao diện</button>
        </section>

        <div className="customize-actions">
          <button className="primary" onClick={handleApplyAppearanceChanges} disabled={!hasAppearanceChanges || !appearanceDraftIsValid}><Check size={15} />Áp dụng</button>
          <button onClick={discardAppearanceChanges} disabled={!hasAppearanceChanges}>Hoàn tác</button>
          <button onClick={resetAppearance}>Khôi phục</button>
        </div>
      </aside>
      )}
    </main>

    {isDraggingFile && (
      <div className="global-drag-overlay">
        <div className="global-drag-content">
          <span className="global-drag-icon">🖼️</span>
          <h2>Thả ảnh vào đây để đổi hình nền</h2>
          <p>Hỗ trợ ảnh định dạng PNG, JPG, WebP...</p>
        </div>
      </div>
    )}

    {/* COMMAND PALETTE QUICK SEARCH MODAL */}
    {commandPaletteOpen && (
      <div className="glass-modal-backdrop" onClick={() => setCommandPaletteOpen(false)}>
        <div className="command-palette-card" onClick={(e) => e.stopPropagation()}>
          <div className="command-palette-input-wrap">
            <Search size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <input
              type="text"
              className="command-palette-input"
              placeholder="Gõ tên trang, tính năng hoặc câu hỏi... (VD: Lịch học, Giao diện)"
              value={commandSearchQuery}
              onChange={(e) => setCommandSearchQuery(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setCommandPaletteOpen(false);
                else if (e.key === "Enter" && commandPaletteItems.length > 0) {
                  commandPaletteItems[0].action();
                }
              }}
            />
          </div>

          <div className="command-palette-list">
            {commandPaletteItems.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                Không tìm thấy kết quả phù hợp cho "{commandSearchQuery}".
              </div>
            ) : (
              commandPaletteItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className="command-palette-item"
                    onClick={item.action}
                  >
                    <div className="command-palette-item-icon">
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}

    {/* CUSTOM GLASS CONFIRM / ALERT MODAL */}
    {modalConfig.isOpen && (
      <div className="glass-modal-backdrop" onClick={modalConfig.onCancel}>
        <div className="glass-modal-card" onClick={(e) => e.stopPropagation()}>
          <h3 className="glass-modal-title">{modalConfig.title}</h3>
          <p className="glass-modal-msg">{modalConfig.message}</p>
          <div className="glass-modal-actions">
            {modalConfig.type === "confirm" && (
              <button className="glass-modal-btn cancel" onClick={modalConfig.onCancel}>
                Hủy bỏ
              </button>
            )}
            <button className="glass-modal-btn primary" onClick={modalConfig.onConfirm}>
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
