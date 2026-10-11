mod connectors;
mod api;
mod data;
mod db;
mod diagnostics;
mod documents;
mod models;
mod paths;
mod public_search;
mod theme_assets;
pub(crate) mod trash;
mod updates;

use data::*;
use db::*;
use models::*;
use paths::*;

#[tauri::command]
fn list_action_logs(limit: Option<i64>) -> Result<Vec<ActionLogEntry>, String> {
    let roots = resolve_roots()?;
    list_action_logs_for_roots(&roots, limit)
}

#[tauri::command]
fn init_app() -> Result<BootstrapState, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let subjects = Vec::new();
    let documents = load_documents()?;
    let announcements = Vec::new();
    let schedule_items = Vec::new();
    let exams = Vec::new();
    let conn = open_db(&roots)?;
    seed_sample_documents(&conn, &roots, &documents)?;
    clear_chat_history(&conn)?;

    Ok(BootstrapState {
        paths: AppPaths {
            app_local_data: roots.app_local_data.display().to_string(),
            database: roots.db_path.display().to_string(),
            managed_workspace: roots.workspace.display().to_string(),
            sample_documents: roots.sample_documents.display().to_string(),
            downloads: roots.downloads.display().to_string(),
        },
        status: DashboardStatus {
            app_local: "Đang hoạt động".to_string(),
            database: "Đã kết nối".to_string(),
            document_source: "Dữ liệu mẫu local".to_string(),
            sample_document_count: documents.len(),
            announcement_count: announcements.len(),
            schedule_item_count: schedule_items.len(),
            exam_count: exams.len(),
            active_session: "Đang hoạt động".to_string(),
        },
        subjects,
        documents,
        announcements,
        schedule_items,
        exams,
        messages: Vec::new(),
        theme: get_setting(&conn, "theme", "dark"),
        accent_color: get_setting(&conn, "accentColor", "#6d5dfc"),
    })
}

#[tauri::command]
fn save_chat_message(session_id: String, role: String, content: String) -> Result<i64, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::save_chat_message(&conn, &session_id, &role, &content)
}

#[tauri::command]
fn list_chat_sessions() -> Result<Vec<ChatSessionRecord>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::list_chat_sessions(&conn)
}

#[tauri::command]
fn create_chat_session(title: String) -> Result<ChatSessionRecord, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::create_chat_session(&conn, &title)
}

#[tauri::command]
fn rename_chat_session(id: String, new_title: String) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::rename_chat_session(&conn, &id, &new_title)
}

#[tauri::command]
fn toggle_pin_chat_session(id: String, pinned: bool) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::toggle_pin_chat_session(&conn, &id, pinned)
}

#[tauri::command]
fn toggle_archive_chat_session(id: String, archived: bool) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::toggle_archive_chat_session(&conn, &id, archived)
}

#[tauri::command]
fn delete_chat_session(id: String) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let mut conn = open_db(&roots)?;
    db::delete_chat_session(&mut conn, &id)
}

#[tauri::command]
fn clear_all_chat_sessions() -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let mut conn = open_db(&roots)?;
    db::clear_all_chat_sessions(&mut conn)
}

#[tauri::command]
fn get_session_messages(session_id: String) -> Result<Vec<ChatMessageRecord>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::get_session_messages(&conn, &session_id)
}

#[tauri::command]
fn get_setting_cmd(key: String, fallback: String) -> Result<String, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    Ok(db::get_setting(&conn, &key, &fallback))
}

#[tauri::command]
fn save_setting_cmd(key: String, value: String) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    db::set_setting(&conn, &key, &value)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    api::start();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_app,
            db::save_setting,
            documents::list_documents,
            documents::open_document,
            documents::copy_document,
            updates::check_for_update,
            list_action_logs,
            documents::list_announcements,
            documents::list_schedule,
            documents::list_exams,
            diagnostics::get_storage_summary,
            db::clear_action_logs,
            paths::open_downloads_folder,
            paths::open_external_url,
            diagnostics::get_health_report,
            diagnostics::export_diagnostic_report,
            public_search::search_public_school_info,
            theme_assets::save_theme_background,
            theme_assets::delete_theme_background,
            connectors::connector_engine::sync_embedded_school_data,
            connectors::connector_engine::open_uth_login_window,
            connectors::connector_engine::receive_uth_jwt,
            connectors::connector_engine::sync_uth_after_login,
            connectors::connector_engine::list_connector_schedules,
            connectors::connector_engine::list_connector_exams,
            connectors::connector_engine::get_connector_sync_status,
            connectors::connector_engine::disconnect_uth_connector,
            connectors::connector_engine::disconnect_connector,
            connectors::connector_engine::delete_connector_data_cmd,
            trash::move_file_to_trash,
            trash::list_trash_items,
            trash::restore_trash_item,
            trash::empty_trash_bin,
            save_chat_message,
            list_chat_sessions,
            create_chat_session,
            rename_chat_session,
            toggle_pin_chat_session,
            toggle_archive_chat_session,
            delete_chat_session,
            clear_all_chat_sessions,
            get_session_messages,
            get_setting_cmd,
            save_setting_cmd
        ])
        .run(tauri::generate_context!())
        .expect("Không khởi động được Campus Assistant Local");
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use rusqlite::params;
    use std::fs;
    use std::path::{Path, PathBuf};

    #[cfg(windows)]
    fn create_dir_symlink(target: &Path, link: &Path) -> std::io::Result<()> {
        std::os::windows::fs::symlink_dir(target, link)
    }

    #[cfg(unix)]
    fn create_dir_symlink(target: &Path, link: &Path) -> std::io::Result<()> {
        std::os::unix::fs::symlink(target, link)
    }

    fn unique_test_root(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "campus-assistant-{}-{}",
            name,
            Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ))
    }

    fn test_roots(name: &str) -> (PathBuf, Roots) {
        let root = unique_test_root(name);
        let app_base = root.join("app-local-data");
        let documents_base = root.join("documents");
        let roots = roots_from_bases(app_base, documents_base);
        (root, roots)
    }

    #[test]
    fn safe_relative_path_accepts_sample_documents() {
        assert!(ensure_safe_relative_path(
            "sample-documents/network-programming/slide.txt",
            "sample-documents"
        )
        .is_ok());
    }

    #[test]
    fn safe_relative_path_rejects_parent_traversal() {
        assert!(
            ensure_safe_relative_path("sample-documents/../secret.txt", "sample-documents")
                .is_err()
        );
    }

    #[test]
    fn safe_relative_path_rejects_absolute_path() {
        assert!(ensure_safe_relative_path(r"C:\Users\PC\secret.txt", "sample-documents").is_err());
    }

    #[test]
    fn safe_relative_path_rejects_common_traversal_inputs() {
        for path in [
            "../outside.txt",
            "folder/../../outside.txt",
            r"..\outside.txt",
            r"C:\outside.txt",
            r"\\server\share\file.txt",
        ] {
            assert!(
                ensure_safe_relative_path(path, "sample-documents").is_err(),
                "expected path to be rejected: {}",
                path
            );
        }
    }

    #[test]
    fn open_and_copy_reject_missing_seeded_file_without_success_log() {
        let (root, roots) = test_roots("missing-file-action");
        let document_id = "doc-001".to_string();

        assert!(documents::open_document_for_roots(&roots, document_id.clone()).is_err());
        assert!(documents::copy_document_for_roots(&roots, document_id).is_err());

        let conn = open_db_schema_only(&roots).unwrap();
        let success_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM action_logs WHERE result = 'SUCCESS'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(success_count, 0);
        drop(conn);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn ensure_child_path_rejects_existing_file_outside_base() {
        let (root, roots) = test_roots("outside-existing-file");
        ensure_directories(&roots).unwrap();

        let outside_file = root.join("outside.txt");
        fs::write(&outside_file, b"outside").unwrap();

        assert!(ensure_child_path(&roots.sample_documents, &outside_file).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn ensure_child_path_rejects_nonexistent_file_outside_base() {
        let (root, roots) = test_roots("outside-missing-file");
        ensure_directories(&roots).unwrap();

        let outside_dir = root.join("outside");
        let outside_file = outside_dir.join("missing.txt");
        fs::create_dir_all(&outside_dir).unwrap();

        assert!(ensure_child_path(&roots.sample_documents, &outside_file).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn ensure_child_path_rejects_symlink_escape_when_supported() {
        let (root, roots) = test_roots("symlink-escape");
        ensure_directories(&roots).unwrap();

        let outside = root.join("outside");
        let outside_file = outside.join("secret.txt");
        fs::create_dir_all(&outside).unwrap();
        fs::write(&outside_file, b"secret").unwrap();

        let link = roots.sample_documents.join("linked-outside");
        if let Err(err) = create_dir_symlink(&outside, &link) {
            eprintln!(
                "SKIP symlink security test: environment cannot create directory symlink: {}",
                err
            );
            fs::remove_dir_all(root).unwrap();
            return;
        }

        let escaped = link.join("secret.txt");
        assert!(ensure_child_path(&roots.sample_documents, &escaped).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn open_db_default_records_are_idempotent_and_do_not_overwrite_settings() {
        let (root, roots) = test_roots("db-idempotent");
        ensure_directories(&roots).unwrap();

        let conn = open_db(&roots).unwrap();
        set_setting(&conn, "theme", "light").unwrap();
        drop(conn);

        let conn = open_db(&roots).unwrap();
        drop(conn);
        let conn = open_db(&roots).unwrap();

        let default_session_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM chat_sessions WHERE id = 'default'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(default_session_count, 1);

        for key in ["theme", "accentColor"] {
            let setting_count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM settings WHERE key = ?1",
                    params![key],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(setting_count, 1, "setting bị nhân bản: {}", key);
        }

        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('settings', 'chat_sessions', 'chat_messages', 'action_logs')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(table_count, 4);
        assert_eq!(get_setting(&conn, "theme", "dark"), "light");
        assert_eq!(action_log_count(&conn).unwrap(), 0);

        drop(conn);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn version_compare_detects_newer_manifest() {
        use std::cmp::Ordering;

        assert_eq!(updates::compare_versions("0.1.0", "0.2.0"), Ordering::Less);
        assert_eq!(updates::compare_versions("0.2.0", "0.2.0"), Ordering::Equal);
        assert_eq!(
            updates::compare_versions("0.3.0", "0.2.9"),
            Ordering::Greater
        );
    }

    #[test]
    fn local_sample_sources_are_loadable() {
        assert!(!load_announcements().unwrap().is_empty());
        assert!(!load_schedule().unwrap().is_empty());
        assert!(!load_exams().unwrap().is_empty());
    }

    #[test]
    fn schedule_and_exam_filters_keep_semester_scope() {
        assert!(documents::list_schedule(Some(1))
            .unwrap()
            .iter()
            .all(|item| item.semester == 1));
        assert!(documents::list_exams(Some(1))
            .unwrap()
            .iter()
            .all(|item| item.semester == 1));
    }

    #[test]
    fn directory_stats_counts_nested_files() {
        let root = std::env::temp_dir().join(format!(
            "campus-assistant-stats-test-{}",
            Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        let nested = root.join("nested");
        fs::create_dir_all(&nested).unwrap();
        fs::write(root.join("a.txt"), b"abc").unwrap();
        fs::write(nested.join("b.txt"), b"12345").unwrap();

        let stats = directory_stats(&root).unwrap();
        assert_eq!(stats, (2, 8));

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn directory_stats_skips_directory_symlink_when_supported() {
        let root = unique_test_root("stats-symlink");
        let stats_root = root.join("stats");
        let outside = root.join("outside");
        fs::create_dir_all(&stats_root).unwrap();
        fs::create_dir_all(&outside).unwrap();
        fs::write(stats_root.join("a.txt"), b"abc").unwrap();
        fs::write(outside.join("secret.txt"), b"12345").unwrap();

        let link = stats_root.join("linked-outside");
        if let Err(err) = create_dir_symlink(&outside, &link) {
            eprintln!(
                "SKIP symlink stats test: environment cannot create directory symlink: {}",
                err
            );
            fs::remove_dir_all(root).unwrap();
            return;
        }

        let stats = directory_stats(&stats_root).unwrap();
        assert_eq!(stats, (1, 3));

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn health_report_contains_core_checks() {
        let (root, roots) = test_roots("health-report");
        let report = diagnostics::get_health_report_for_roots(&roots).unwrap();
        let ids = report
            .items
            .iter()
            .map(|item| item.id.as_str())
            .collect::<Vec<_>>();
        assert!(ids.contains(&"database"));
        assert!(ids.contains(&"sample-documents"));
        assert!(ids.contains(&"local-json"));
        assert!(ids.contains(&"update"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn diagnostic_file_name_removes_path_unsafe_timestamp_chars() {
        let name = diagnostics::diagnostic_file_name("2026-07-19T10:30:00.123+07:00");
        assert!(name.starts_with("campus-assistant-diagnostic-"));
        assert!(name.ends_with(".json"));
        assert!(!name.contains(':'));
        assert!(!name.contains(".."));
    }

    #[test]
    fn test_is_valid_image_formats() {
        assert!(theme_assets::is_valid_image(
            &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            "png"
        ));
        assert!(!theme_assets::is_valid_image(&[0x89, 0x50, 0x4E], "png"));
        assert!(theme_assets::is_valid_image(
            &[0xFF, 0xD8, 0xFF, 0xE0],
            "jpg"
        ));
        assert!(theme_assets::is_valid_image(
            &[0xFF, 0xD8, 0xFF, 0xE1],
            "jpeg"
        ));
        let webp_data = b"RIFF\x0c\x00\x00\x00WEBPVP8 ";
        assert!(theme_assets::is_valid_image(webp_data, "webp"));
        assert!(!theme_assets::is_valid_image(
            b"RIFF\x0c\x00\x00\x00NONEVP8 ",
            "webp"
        ));
    }
}
