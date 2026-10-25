use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Subject {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) aliases: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DocumentRecord {
    pub(crate) id: String,
    pub(crate) subject_id: String,
    pub(crate) semester: i64,
    pub(crate) name: String,
    #[serde(rename = "type")]
    pub(crate) doc_type: String,
    pub(crate) size_bytes: i64,
    pub(crate) source: String,
    pub(crate) local_path: String,
    pub(crate) updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AnnouncementRecord {
    pub(crate) id: String,
    pub(crate) title: String,
    pub(crate) category: String,
    pub(crate) priority: String,
    pub(crate) published_at: String,
    pub(crate) source: String,
    pub(crate) summary: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ScheduleRecord {
    pub(crate) id: String,
    pub(crate) subject_id: String,
    pub(crate) subject_name: String,
    pub(crate) semester: i64,
    pub(crate) weekday: i64,
    pub(crate) start_time: String,
    pub(crate) end_time: String,
    pub(crate) room: String,
    pub(crate) lecturer: String,
    pub(crate) note: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExamRecord {
    pub(crate) id: String,
    pub(crate) subject_id: String,
    pub(crate) subject_name: String,
    pub(crate) semester: i64,
    pub(crate) exam_date: String,
    pub(crate) start_time: String,
    pub(crate) duration_minutes: i64,
    pub(crate) room: String,
    pub(crate) format: String,
    pub(crate) note: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppPaths {
    pub(crate) app_local_data: String,
    pub(crate) database: String,
    pub(crate) managed_workspace: String,
    pub(crate) sample_documents: String,
    pub(crate) downloads: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DashboardStatus {
    pub(crate) app_local: String,
    pub(crate) database: String,
    pub(crate) document_source: String,
    pub(crate) sample_document_count: usize,
    pub(crate) announcement_count: usize,
    pub(crate) schedule_item_count: usize,
    pub(crate) exam_count: usize,
    pub(crate) active_session: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChatMessage {
    pub(crate) id: i64,
    pub(crate) role: String,
    pub(crate) content: String,
    pub(crate) created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BootstrapState {
    pub(crate) paths: AppPaths,
    pub(crate) status: DashboardStatus,
    pub(crate) subjects: Vec<Subject>,
    pub(crate) documents: Vec<DocumentRecord>,
    pub(crate) announcements: Vec<AnnouncementRecord>,
    pub(crate) schedule_items: Vec<ScheduleRecord>,
    pub(crate) exams: Vec<ExamRecord>,
    pub(crate) messages: Vec<ChatMessage>,
    pub(crate) theme: String,
    pub(crate) accent_color: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FileActionResult {
    pub(crate) action: String,
    pub(crate) document_id: String,
    pub(crate) result: String,
    pub(crate) message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ActionLogEntry {
    pub(crate) id: i64,
    pub(crate) action: String,
    pub(crate) document_id: Option<String>,
    pub(crate) result: String,
    pub(crate) error_code: Option<String>,
    pub(crate) created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct StorageSummary {
    pub(crate) sample_document_count: usize,
    pub(crate) sample_document_bytes: u64,
    pub(crate) download_file_count: usize,
    pub(crate) download_bytes: u64,
    pub(crate) action_log_count: i64,
    pub(crate) app_local_data: String,
    pub(crate) managed_workspace: String,
    pub(crate) downloads: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HealthCheckItem {
    pub(crate) id: String,
    pub(crate) label: String,
    pub(crate) status: String,
    pub(crate) detail: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HealthReport {
    pub(crate) generated_at: String,
    pub(crate) version: String,
    pub(crate) items: Vec<HealthCheckItem>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnosticExportResult {
    pub(crate) file_name: String,
    pub(crate) relative_path: String,
    pub(crate) message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateManifest {
    pub(crate) version: String,
    pub(crate) required: Option<bool>,
    pub(crate) message: Option<String>,
    pub(crate) download_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateCheckResult {
    pub(crate) configured: bool,
    pub(crate) current_version: String,
    pub(crate) latest_version: Option<String>,
    pub(crate) update_available: bool,
    pub(crate) required: bool,
    pub(crate) message: String,
    pub(crate) download_url: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PublicSearchResult {
    pub(crate) title: String,
    pub(crate) snippet: String,
    pub(crate) source_url: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PublicSearchResponse {
    pub(crate) school_id: String,
    pub(crate) school_name: String,
    pub(crate) query: String,
    pub(crate) searched_urls: Vec<String>,
    pub(crate) results: Vec<PublicSearchResult>,
    pub(crate) message: String,
    // CA-093.01: "success" | "partial" | "no_match" | "error" — Error != Empty (DATA-001)
    pub(crate) status: String,
    // URL gốc của các nguồn tải lỗi sau khi đã thử lại, giữ nguyên để truy vết
    pub(crate) failed_urls: Vec<String>,
    pub(crate) timed_out: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChatSessionRecord {
    pub(crate) id: String,
    pub(crate) title: String,
    pub(crate) created_at: String,
    pub(crate) updated_at: String,
    pub(crate) pinned: bool,
    pub(crate) archived: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChatMessageRecord {
    pub(crate) id: i64,
    pub(crate) session_id: String,
    pub(crate) role: String,
    pub(crate) content: String,
    pub(crate) created_at: String,
}
