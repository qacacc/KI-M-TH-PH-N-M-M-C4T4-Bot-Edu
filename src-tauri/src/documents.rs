use std::fs;

use crate::data::{load_announcements, load_documents, load_exams, load_schedule};
use crate::db::{log_action, open_db};
use crate::models::{
    AnnouncementRecord, DocumentRecord, ExamRecord, FileActionResult, ScheduleRecord,
};
use crate::paths::{ensure_child_path, ensure_directories, resolve_roots, Roots};

fn find_document(document_id: &str) -> Result<DocumentRecord, String> {
    load_documents()?
        .into_iter()
        .find(|doc| doc.id == document_id)
        .ok_or_else(|| "Không tìm thấy tài liệu.".to_string())
}

#[tauri::command]
pub(crate) fn list_documents(
    subject_id: String,
    semester: i64,
) -> Result<Vec<DocumentRecord>, String> {
    Ok(load_documents()?
        .into_iter()
        .filter(|doc| doc.subject_id == subject_id && doc.semester == semester)
        .collect())
}

#[tauri::command]
pub(crate) fn list_announcements() -> Result<Vec<AnnouncementRecord>, String> {
    let mut items = load_announcements()?;
    items.sort_by(|left, right| right.published_at.cmp(&left.published_at));
    Ok(items)
}

#[tauri::command]
pub(crate) fn list_schedule(semester: Option<i64>) -> Result<Vec<ScheduleRecord>, String> {
    let mut items = load_schedule()?
        .into_iter()
        .filter(|item| semester.is_none_or(|value| item.semester == value))
        .collect::<Vec<_>>();
    items.sort_by(|left, right| {
        left.weekday
            .cmp(&right.weekday)
            .then_with(|| left.start_time.cmp(&right.start_time))
            .then_with(|| left.subject_name.cmp(&right.subject_name))
    });
    Ok(items)
}

#[tauri::command]
pub(crate) fn list_exams(semester: Option<i64>) -> Result<Vec<ExamRecord>, String> {
    let mut items = load_exams()?
        .into_iter()
        .filter(|item| semester.is_none_or(|value| item.semester == value))
        .collect::<Vec<_>>();
    items.sort_by(|left, right| {
        left.exam_date
            .cmp(&right.exam_date)
            .then_with(|| left.start_time.cmp(&right.start_time))
            .then_with(|| left.subject_name.cmp(&right.subject_name))
    });
    Ok(items)
}

#[tauri::command]
pub(crate) fn open_document(document_id: String) -> Result<FileActionResult, String> {
    let roots = resolve_roots()?;
    open_document_for_roots(&roots, document_id)
}

pub(crate) fn open_document_for_roots(
    roots: &Roots,
    document_id: String,
) -> Result<FileActionResult, String> {
    ensure_directories(roots)?;
    let conn = open_db(roots)?;
    let doc = find_document(&document_id)?;
    let source = roots.workspace.join(&doc.local_path);

    if let Err(err) = ensure_child_path(&roots.sample_documents, &source) {
        let _ = log_action(
            &conn,
            "OPEN_DOCUMENT",
            Some(&document_id),
            "BLOCKED",
            Some("PATH_BLOCKED"),
        );
        return Err(err);
    }
    if !source.exists() {
        let _ = log_action(
            &conn,
            "OPEN_DOCUMENT",
            Some(&document_id),
            "FAILED",
            Some("FILE_NOT_FOUND"),
        );
        return Err(
            "File mẫu không tồn tại. Bạn có thể khởi động lại ứng dụng để seed lại dữ liệu."
                .to_string(),
        );
    }

    match opener::open(&source) {
        Ok(_) => {
            log_action(&conn, "OPEN_DOCUMENT", Some(&document_id), "SUCCESS", None)?;
            Ok(FileActionResult {
                action: "OPEN_DOCUMENT".to_string(),
                document_id,
                result: "SUCCESS".to_string(),
                message: "Đã gửi yêu cầu mở file bằng ứng dụng mặc định.".to_string(),
            })
        }
        Err(_) => {
            let _ = log_action(
                &conn,
                "OPEN_DOCUMENT",
                Some(&document_id),
                "FAILED",
                Some("OPEN_FAILED"),
            );
            Err("Không mở được file bằng ứng dụng mặc định.".to_string())
        }
    }
}

#[tauri::command]
pub(crate) fn copy_document(document_id: String) -> Result<FileActionResult, String> {
    let roots = resolve_roots()?;
    copy_document_for_roots(&roots, document_id)
}

pub(crate) fn copy_document_for_roots(
    roots: &Roots,
    document_id: String,
) -> Result<FileActionResult, String> {
    ensure_directories(roots)?;
    let conn = open_db(roots)?;
    let doc = find_document(&document_id)?;
    let source = roots.workspace.join(&doc.local_path);
    let file_name = source
        .file_name()
        .ok_or_else(|| "Tên file không hợp lệ.".to_string())?;
    let destination = roots.downloads.join(file_name);

    if let Err(err) = ensure_child_path(&roots.sample_documents, &source) {
        let _ = log_action(
            &conn,
            "COPY_DOCUMENT",
            Some(&document_id),
            "BLOCKED",
            Some("SOURCE_BLOCKED"),
        );
        return Err(err);
    }
    if let Err(err) = ensure_child_path(&roots.downloads, &destination) {
        let _ = log_action(
            &conn,
            "COPY_DOCUMENT",
            Some(&document_id),
            "BLOCKED",
            Some("DESTINATION_BLOCKED"),
        );
        return Err(err);
    }
    if !source.exists() {
        let _ = log_action(
            &conn,
            "COPY_DOCUMENT",
            Some(&document_id),
            "FAILED",
            Some("FILE_NOT_FOUND"),
        );
        return Err(
            "File mẫu không tồn tại. Bạn có thể khởi động lại ứng dụng để seed lại dữ liệu."
                .to_string(),
        );
    }
    if destination.exists() {
        let _ = log_action(
            &conn,
            "COPY_DOCUMENT",
            Some(&document_id),
            "FAILED",
            Some("FILE_EXISTS"),
        );
        return Err("File đã tồn tại trong downloads. v0.1 không tự ghi đè file.".to_string());
    }

    fs::copy(&source, &destination).map_err(|_| {
        let _ = log_action(
            &conn,
            "COPY_DOCUMENT",
            Some(&document_id),
            "FAILED",
            Some("COPY_FAILED"),
        );
        "Không sao chép được file sang downloads.".to_string()
    })?;
    log_action(&conn, "COPY_DOCUMENT", Some(&document_id), "SUCCESS", None)?;

    Ok(FileActionResult {
        action: "COPY_DOCUMENT".to_string(),
        document_id,
        result: "SUCCESS".to_string(),
        message: "Đã sao chép file sang thư mục downloads của CampusAssistant.".to_string(),
    })
}
