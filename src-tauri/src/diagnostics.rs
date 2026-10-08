use chrono::Utc;
use std::fs;

use crate::data::{load_announcements, load_documents, load_exams, load_schedule};
use crate::db::{
    action_log_count, list_action_logs_for_roots, log_action, open_db, open_db_schema_only,
};
use crate::models::{DiagnosticExportResult, HealthCheckItem, HealthReport, StorageSummary};
use crate::paths::{directory_stats, ensure_child_path, ensure_directories, resolve_roots, Roots};

#[tauri::command]
pub(crate) fn get_storage_summary() -> Result<StorageSummary, String> {
    let roots = resolve_roots()?;
    get_storage_summary_for_roots(&roots)
}

pub(crate) fn get_storage_summary_for_roots(roots: &Roots) -> Result<StorageSummary, String> {
    ensure_directories(roots)?;
    let conn = open_db_schema_only(roots)?;
    let (sample_document_count, sample_document_bytes) = directory_stats(&roots.sample_documents)?;
    let (download_file_count, download_bytes) = directory_stats(&roots.downloads)?;

    Ok(StorageSummary {
        sample_document_count,
        sample_document_bytes,
        download_file_count,
        download_bytes,
        action_log_count: action_log_count(&conn)?,
        app_local_data: roots.app_local_data.display().to_string(),
        managed_workspace: roots.workspace.display().to_string(),
        downloads: roots.downloads.display().to_string(),
    })
}

fn health_item(id: &str, label: &str, status: &str, detail: String) -> HealthCheckItem {
    HealthCheckItem {
        id: id.to_string(),
        label: label.to_string(),
        status: status.to_string(),
        detail,
    }
}

#[tauri::command]
pub(crate) fn get_health_report() -> Result<HealthReport, String> {
    let roots = resolve_roots()?;
    get_health_report_for_roots(&roots)
}

pub(crate) fn get_health_report_for_roots(roots: &Roots) -> Result<HealthReport, String> {
    ensure_directories(roots)?;
    let conn = open_db_schema_only(roots)?;
    let documents = load_documents()?;
    let announcements = load_announcements()?;
    let schedule = load_schedule()?;
    let exams = load_exams()?;
    let (sample_file_count, sample_bytes) = directory_stats(&roots.sample_documents)?;
    let (download_file_count, download_bytes) = directory_stats(&roots.downloads)?;
    let log_count = action_log_count(&conn)?;

    let mut items = vec![
        health_item(
            "app-local-data",
            "AppLocalData",
            if roots.app_local_data.exists() {
                "PASS"
            } else {
                "FAIL"
            },
            roots.app_local_data.display().to_string(),
        ),
        health_item(
            "database",
            "SQLite",
            "PASS",
            format!("Đã kết nối. Action log: {}.", log_count),
        ),
        health_item(
            "sample-documents",
            "File mẫu",
            if sample_file_count >= documents.len() {
                "PASS"
            } else {
                "WARN"
            },
            format!(
                "{} file trên đĩa, {} bytes.",
                sample_file_count, sample_bytes
            ),
        ),
        health_item(
            "downloads",
            "Downloads",
            "PASS",
            format!("{} file, {} bytes.", download_file_count, download_bytes),
        ),
        health_item(
            "local-json",
            "Nguồn JSON local",
            "PASS",
            format!(
                "{} tài liệu, {} thông báo, {} lịch học, {} lịch thi.",
                documents.len(),
                announcements.len(),
                schedule.len(),
                exams.len()
            ),
        ),
    ];

    let update_detail = match option_env!("CAMPUS_ASSISTANT_UPDATE_MANIFEST_URL") {
        Some(url) if url.starts_with("https://") => format!("Đã cấu hình HTTPS: {}.", url),
        Some(_) => "Nguồn cập nhật không dùng HTTPS.".to_string(),
        None => "Chưa cấu hình nguồn cập nhật. App không tự gọi mạng.".to_string(),
    };
    let update_status = match option_env!("CAMPUS_ASSISTANT_UPDATE_MANIFEST_URL") {
        Some(url) if url.starts_with("https://") => "PASS",
        Some(_) => "FAIL",
        None => "WARN",
    };
    items.push(health_item(
        "update",
        "Cập nhật",
        update_status,
        update_detail,
    ));

    Ok(HealthReport {
        generated_at: Utc::now().to_rfc3339(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        items,
    })
}

pub(crate) fn diagnostic_file_name(timestamp: &str) -> String {
    let safe_timestamp = timestamp.replace([':', '.'], "-");
    format!("campus-assistant-diagnostic-{}.json", safe_timestamp)
}

#[tauri::command]
pub(crate) fn export_diagnostic_report() -> Result<DiagnosticExportResult, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let report = get_health_report_for_roots(&roots)?;
    let storage = get_storage_summary_for_roots(&roots)?;
    let logs = list_action_logs_for_roots(&roots, Some(50))?;
    let generated_at = Utc::now().to_rfc3339();
    let file_name = diagnostic_file_name(&generated_at);
    let destination = roots.downloads.join(&file_name);
    ensure_child_path(&roots.downloads, &destination)?;

    let payload = serde_json::json!({
        "kind": "campus-assistant-diagnostic",
        "version": env!("CARGO_PKG_VERSION"),
        "generatedAt": generated_at,
        "privacy": {
            "containsChatContent": false,
            "containsDocumentContent": false,
            "containsTokensOrSecrets": false,
            "containsRawCredentials": false
        },
        "health": report,
        "storage": {
            "sampleDocumentCount": storage.sample_document_count,
            "sampleDocumentBytes": storage.sample_document_bytes,
            "downloadFileCount": storage.download_file_count,
            "downloadBytes": storage.download_bytes,
            "actionLogCount": storage.action_log_count
        },
        "recentActionLogs": logs
    });
    let content = serde_json::to_string_pretty(&payload)
        .map_err(|_| "Không tạo được nội dung báo cáo chẩn đoán.".to_string())?;
    fs::write(&destination, content)
        .map_err(|_| "Không ghi được file báo cáo chẩn đoán.".to_string())?;
    log_action(&conn, "EXPORT_DIAGNOSTIC_REPORT", None, "SUCCESS", None)?;

    Ok(DiagnosticExportResult {
        file_name: file_name.clone(),
        relative_path: format!("downloads/{}", file_name),
        message: "Đã xuất báo cáo chẩn đoán vào downloads của CampusAssistant.".to_string(),
    })
}
