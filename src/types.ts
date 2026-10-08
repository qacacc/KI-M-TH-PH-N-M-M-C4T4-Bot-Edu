export type Subject = {
  id: string;
  name: string;
  aliases: string[];
};

export type DocumentRecord = {
  id: string;
  subjectId: string;
  semester: number;
  name: string;
  type: string;
  sizeBytes: number;
  source: string;
  localPath: string;
  updatedAt: string;
};

export type AnnouncementRecord = {
  id: string;
  title: string;
  category: string;
  priority: "normal" | "important" | "urgent";
  publishedAt: string;
  source: string;
  summary: string;
};

export type ScheduleRecord = {
  id: string;
  subjectId: string;
  subjectName: string;
  semester: number;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
  note: string;
};

export type ExamRecord = {
  id: string;
  subjectId: string;
  subjectName: string;
  semester: number;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  room: string;
  format: string;
  note: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  documents?: DocumentRecord[];
  announcements?: AnnouncementRecord[];
  scheduleItems?: ScheduleRecord[];
  examItems?: ExamRecord[];
};

export type ConversationState = {
  flow: "FIND_DOCUMENTS";
  step: "WAITING_FOR_SUBJECT" | "WAITING_FOR_SEMESTER" | "SHOWING_DOCUMENTS" | "WAITING_FOR_FILE_CONFIRMATION" | "COMPLETED";
  data: {
    subjectId: string | null;
    subjectName: string | null;
    semester: number | null;
    documentIds?: string[];
    documentId?: string;
    fileAction?: "open" | "copy";
  };
};

export type BootstrapState = {
  paths: {
    appLocalData: string;
    database: string;
    managedWorkspace: string;
    sampleDocuments: string;
    downloads: string;
  };
  status: {
    appLocal: string;
    database: string;
    documentSource: string;
    sampleDocumentCount: number;
    announcementCount: number;
    scheduleItemCount: number;
    examCount: number;
    activeSession: string;
  };
  subjects: Subject[];
  documents: DocumentRecord[];
  announcements: AnnouncementRecord[];
  scheduleItems: ScheduleRecord[];
  exams: ExamRecord[];
  messages: Array<{
    id: number;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
  }>;
  theme: "dark" | "light";
  accentColor: string;
};

export type FileActionResult = {
  action: string;
  documentId: string;
  result: string;
  message: string;
};

export type ActionLogEntry = {
  id: number;
  action: string;
  documentId: string | null;
  result: string;
  errorCode: string | null;
  createdAt: string;
};

export type StorageSummary = {
  sampleDocumentCount: number;
  sampleDocumentBytes: number;
  downloadFileCount: number;
  downloadBytes: number;
  actionLogCount: number;
  appLocalData: string;
  managedWorkspace: string;
  downloads: string;
};

export type HealthCheckItem = {
  id: string;
  label: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
};

export type HealthReport = {
  generatedAt: string;
  version: string;
  items: HealthCheckItem[];
};

export type DiagnosticExportResult = {
  fileName: string;
  relativePath: string;
  message: string;
};

export type UpdateCheckResult = {
  configured: boolean;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  required: boolean;
  message: string;
  downloadUrl: string | null;
};

export type PublicSearchResult = {
  title: string;
  snippet: string;
  sourceUrl: string;
};

export type PublicSearchResponse = {
  schoolId: string;
  schoolName: string;
  query: string;
  searchedUrls: string[];
  results: PublicSearchResult[];
  message: string;
};
