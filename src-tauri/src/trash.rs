use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::db::{log_action, open_db};
use crate::paths::{ensure_child_path, ensure_directories, resolve_roots, Roots};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashItemRecord {
    pub trash_id: String,
    pub original_relative_path: String,
    pub trash_storage_name: String,
    pub original_file_name: String,
    pub deleted_at: String,
    pub size_bytes: u64,
}

pub(crate) fn ensure_trash_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS trash_items (
            trash_id TEXT PRIMARY KEY,
            original_relative_path TEXT NOT NULL,
            trash_storage_name TEXT NOT NULL,
            original_file_name TEXT NOT NULL,
            deleted_at TEXT NOT NULL,
            size_bytes INTEGER NOT NULL
        );
        "#,
    )
    .map_err(|e| format!("Không tạo được bảng trash_items: {}", e))?;
    Ok(())
}

fn resolve_trash_dir(roots: &Roots) -> PathBuf {
    roots.app_local_data.join("trash").join("files")
}

pub(crate) fn move_file_to_trash_for_roots(
    roots: &Roots,
    relative_path: &str,
) -> Result<TrashItemRecord, String> {
    ensure_directories(roots)?;

    // Path Guard Validation
    let source_path = roots.workspace.join(relative_path);
    ensure_child_path(&roots.workspace, &source_path)?;

    if !source_path.exists() {
        return Err("File không tồn tại.".to_string());
    }
    if !source_path.is_file() {
        return Err("Chỉ hỗ trợ di chuyển tệp đơn vào thùng rác.".to_string());
    }

    let trash_dir = resolve_trash_dir(roots);
    fs::create_dir_all(&trash_dir)
        .map_err(|_| "Không tạo được thư mục thùng rác local.".to_string())?;

    let file_name = source_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Tên file không hợp lệ.".to_string())?
        .to_string();

    let metadata =
        fs::metadata(&source_path).map_err(|_| "Không đọc được thông tin tệp.".to_string())?;
    let size_bytes = metadata.len();

    let now_ts = Utc::now().timestamp_millis();
    let trash_id = format!("trash-{}-{}", now_ts, uuid_simple());
    let trash_target_path = trash_dir.join(&trash_id);

    // 1. Physically move file to trash storage
    fs::rename(&source_path, &trash_target_path)
        .map_err(|e| format!("Không di chuyển được tệp vào thùng rác: {}", e))?;

    // 2. Record metadata in SQLite
    let conn = open_db(roots)?;
    ensure_trash_schema(&conn)?;

    let record = TrashItemRecord {
        trash_id: trash_id.clone(),
        original_relative_path: relative_path.to_string(),
        trash_storage_name: trash_id.clone(),
        original_file_name: file_name,
        deleted_at: Utc::now().to_rfc3339(),
        size_bytes,
    };

    let insert_res = conn.execute(
        "INSERT INTO trash_items (trash_id, original_relative_path, trash_storage_name, original_file_name, deleted_at, size_bytes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            record.trash_id,
            record.original_relative_path,
            record.trash_storage_name,
            record.original_file_name,
            record.deleted_at,
            record.size_bytes as i64
        ],
    );

    if let Err(err) = insert_res {
        // Compensating Rollback: Attempt to move file back if metadata insert fails
        let rollback_res = fs::rename(&trash_target_path, &source_path);
        if let Err(rollback_err) = rollback_res {
            // Nếu hoàn tác cũng thất bại, đánh dấu recovery_required để không mất vết file
            let _ = conn.execute(
                "INSERT INTO trash_items (trash_id, original_relative_path, trash_storage_name, original_file_name, deleted_at, size_bytes)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    format!("recovery_required-{}", record.trash_id),
                    record.original_relative_path,
                    record.trash_storage_name,
                    record.original_file_name,
                    record.deleted_at,
                    record.size_bytes as i64
                ],
            );
            return Err(format!(
                "Lỗi nghiêm trọng: Không thể hoàn tác di chuyển tệp. Tệp được đánh dấu recovery_required: {} (Lỗi rollback: {})",
                err, rollback_err
            ));
        }
        return Err(format!(
            "Lỗi ghi metadata thùng rác, đã hoàn tác di chuyển tệp: {}",
            err
        ));
    }

    let _ = log_action(&conn, "MOVE_TO_TRASH", Some(&trash_id), "SUCCESS", None);

    Ok(record)
}

pub(crate) fn list_trash_items_for_roots(roots: &Roots) -> Result<Vec<TrashItemRecord>, String> {
    ensure_directories(roots)?;
    let conn = open_db(roots)?;
    ensure_trash_schema(&conn)?;

    let mut stmt = conn
        .prepare(
            "SELECT trash_id, original_relative_path, trash_storage_name, original_file_name, deleted_at, size_bytes
             FROM trash_items
             ORDER BY deleted_at DESC",
        )
        .map_err(|e| format!("Lỗi truy vấn thùng rác: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let size_i64: i64 = row.get(5)?;
            Ok(TrashItemRecord {
                trash_id: row.get(0)?,
                original_relative_path: row.get(1)?,
                trash_storage_name: row.get(2)?,
                original_file_name: row.get(3)?,
                deleted_at: row.get(4)?,
                size_bytes: size_i64 as u64,
            })
        })
        .map_err(|e| format!("Lỗi đọc mục thùng rác: {}", e))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

pub(crate) fn restore_trash_item_for_roots(
    roots: &Roots,
    trash_id: &str,
) -> Result<String, String> {
    ensure_directories(roots)?;
    let conn = open_db(roots)?;
    ensure_trash_schema(&conn)?;

    let item: TrashItemRecord = conn
        .query_row(
            "SELECT trash_id, original_relative_path, trash_storage_name, original_file_name, deleted_at, size_bytes
             FROM trash_items WHERE trash_id = ?1",
            params![trash_id],
            |row| {
                let size_i64: i64 = row.get(5)?;
                Ok(TrashItemRecord {
                    trash_id: row.get(0)?,
                    original_relative_path: row.get(1)?,
                    trash_storage_name: row.get(2)?,
                    original_file_name: row.get(3)?,
                    deleted_at: row.get(4)?,
                    size_bytes: size_i64 as u64,
                })
            },
        )
        .map_err(|_| "Không tìm thấy mục trong thùng rác.".to_string())?;

    let trash_file_path = resolve_trash_dir(roots).join(&item.trash_storage_name);
    if !trash_file_path.exists() {
        return Err("File lưu trữ tạm trong thùng rác không còn tồn tại.".to_string());
    }

    let mut target_path = roots.workspace.join(&item.original_relative_path);
    ensure_child_path(&roots.workspace, &target_path)?;

    // COLLISION HANDLING: Đổi tên nếu file gốc đã tồn tại (không ghi đè âm thầm)
    if target_path.exists() {
        target_path = generate_non_colliding_path(&target_path);
    }

    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|_| "Không tạo được thư mục khôi phục.".to_string())?;
    }

    // Move file back
    fs::rename(&trash_file_path, &target_path)
        .map_err(|e| format!("Lỗi di chuyển file khi khôi phục: {}", e))?;

    // Delete SQLite record
    conn.execute(
        "DELETE FROM trash_items WHERE trash_id = ?1",
        params![trash_id],
    )
    .map_err(|e| format!("Lỗi xóa metadata thùng rác: {}", e))?;

    let _ = log_action(&conn, "RESTORE_FROM_TRASH", Some(trash_id), "SUCCESS", None);

    Ok(target_path.display().to_string())
}

pub(crate) fn empty_trash_bin_for_roots(roots: &Roots) -> Result<usize, String> {
    ensure_directories(roots)?;
    let conn = open_db(roots)?;
    ensure_trash_schema(&conn)?;

    let items = list_trash_items_for_roots(roots)?;
    let trash_dir = resolve_trash_dir(roots);
    let mut deleted_count = 0usize;

    for item in items {
        let file_path = trash_dir.join(&item.trash_storage_name);
        let mut file_removed = true;
        if file_path.exists() {
            if let Err(e) = fs::remove_file(&file_path) {
                eprintln!("Không xóa được file rác {}: {}", item.trash_id, e);
                file_removed = false;
            }
        }

        // Chỉ xóa metadata nếu file vật lý đã được dọn dẹp (hoặc không còn tồn tại)
        if file_removed
            && conn
                .execute(
                    "DELETE FROM trash_items WHERE trash_id = ?1",
                    params![item.trash_id],
                )
                .is_ok()
        {
            deleted_count += 1;
        }
    }

    let _ = log_action(&conn, "EMPTY_TRASH", None, "SUCCESS", None);

    Ok(deleted_count)
}

fn generate_non_colliding_path(path: &Path) -> PathBuf {
    let parent = path.parent().unwrap_or_else(|| Path::new(""));
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut counter = 1;
    loop {
        let new_name = if ext.is_empty() {
            format!("{} (khôi phục {})", stem, counter)
        } else {
            format!("{} (khôi phục {}).{}", stem, counter, ext)
        };
        let candidate = parent.join(new_name);
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

fn uuid_simple() -> String {
    use std::time::SystemTime;
    let nanos = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(123456);
    format!("{:08x}", nanos)
}

// TAURI COMMANDS
#[tauri::command]
pub fn move_file_to_trash(relative_path: String) -> Result<TrashItemRecord, String> {
    let roots = resolve_roots()?;
    move_file_to_trash_for_roots(&roots, &relative_path)
}

#[tauri::command]
pub fn list_trash_items() -> Result<Vec<TrashItemRecord>, String> {
    let roots = resolve_roots()?;
    list_trash_items_for_roots(&roots)
}

#[tauri::command]
pub fn restore_trash_item(trash_id: String) -> Result<String, String> {
    let roots = resolve_roots()?;
    restore_trash_item_for_roots(&roots, &trash_id)
}

#[tauri::command]
pub fn empty_trash_bin() -> Result<usize, String> {
    let roots = resolve_roots()?;
    empty_trash_bin_for_roots(&roots)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::roots_from_bases;
    use std::fs;

    fn test_roots(name: &str) -> (PathBuf, Roots) {
        let root = std::env::temp_dir().join(format!(
            "campus-assistant-trash-test-{}-{}",
            name,
            Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        let app_base = root.join("app-local-data");
        let documents_base = root.join("documents");
        let roots = roots_from_bases(app_base, documents_base);
        (root, roots)
    }

    #[test]
    fn test_move_file_to_trash_success() {
        let (root, roots) = test_roots("move-success");
        ensure_directories(&roots).unwrap();

        let sample_file = roots
            .workspace
            .join("sample-documents")
            .join("test_doc.txt");
        fs::create_dir_all(sample_file.parent().unwrap()).unwrap();
        fs::write(&sample_file, b"Noidung sample test").unwrap();

        let item = move_file_to_trash_for_roots(&roots, "sample-documents/test_doc.txt").unwrap();
        assert!(!sample_file.exists());
        assert_eq!(item.original_file_name, "test_doc.txt");

        let items = list_trash_items_for_roots(&roots).unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].trash_id, item.trash_id);

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_move_file_outside_workspace_rejected() {
        let (root, roots) = test_roots("move-outside");
        ensure_directories(&roots).unwrap();

        let outside_file = root.join("outside.txt");
        fs::write(&outside_file, b"outside").unwrap();

        assert!(move_file_to_trash_for_roots(&roots, "../outside.txt").is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_restore_trash_item_success() {
        let (root, roots) = test_roots("restore-success");
        ensure_directories(&roots).unwrap();

        let sample_file = roots
            .workspace
            .join("sample-documents")
            .join("restore_me.txt");
        fs::create_dir_all(sample_file.parent().unwrap()).unwrap();
        fs::write(&sample_file, b"test content").unwrap();

        let item = move_file_to_trash_for_roots(&roots, "sample-documents/restore_me.txt").unwrap();
        assert!(!sample_file.exists());

        let restored_path = restore_trash_item_for_roots(&roots, &item.trash_id).unwrap();
        assert!(sample_file.exists());
        assert_eq!(Path::new(&restored_path), sample_file.as_path());

        let items = list_trash_items_for_roots(&roots).unwrap();
        assert!(items.is_empty());

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_restore_collision_handling() {
        let (root, roots) = test_roots("restore-collision");
        ensure_directories(&roots).unwrap();

        let sample_file = roots
            .workspace
            .join("sample-documents")
            .join("collision.txt");
        fs::create_dir_all(sample_file.parent().unwrap()).unwrap();
        fs::write(&sample_file, b"content v1").unwrap();

        let item = move_file_to_trash_for_roots(&roots, "sample-documents/collision.txt").unwrap();
        assert!(!sample_file.exists());

        // Tạo file trùng tên mới
        fs::write(&sample_file, b"content v2").unwrap();

        let restored_path = restore_trash_item_for_roots(&roots, &item.trash_id).unwrap();
        assert!(restored_path.contains("collision (khôi phục 1).txt"));
        assert!(Path::new(&restored_path).exists());
        assert_eq!(fs::read_to_string(&sample_file).unwrap(), "content v2");

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_empty_trash_bin() {
        let (root, roots) = test_roots("empty-trash");
        ensure_directories(&roots).unwrap();

        let f1 = roots.workspace.join("sample-documents").join("f1.txt");
        fs::create_dir_all(f1.parent().unwrap()).unwrap();
        fs::write(&f1, b"f1").unwrap();
        let item = move_file_to_trash_for_roots(&roots, "sample-documents/f1.txt").unwrap();

        let count = empty_trash_bin_for_roots(&roots).unwrap();
        assert_eq!(count, 1);

        let items = list_trash_items_for_roots(&roots).unwrap();
        assert!(items.is_empty());

        let trash_file = resolve_trash_dir(&roots).join(&item.trash_storage_name);
        assert!(!trash_file.exists());

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_empty_trash_partial_failure() {
        let (root, roots) = test_roots("empty-partial-fail");
        ensure_directories(&roots).unwrap();

        let f1 = roots.workspace.join("sample-documents").join("f1.txt");
        fs::create_dir_all(f1.parent().unwrap()).unwrap();
        fs::write(&f1, b"f1").unwrap();
        let item = move_file_to_trash_for_roots(&roots, "sample-documents/f1.txt").unwrap();

        // Xóa file rác trước để giả lập trường hợp file không còn nhưng metadata vẫn còn
        let trash_file = resolve_trash_dir(&roots).join(&item.trash_storage_name);
        let _ = fs::remove_file(&trash_file);

        let count = empty_trash_bin_for_roots(&roots).unwrap();
        assert_eq!(count, 1); // Vẫn dọn sạch metadata an toàn

        let items = list_trash_items_for_roots(&roots).unwrap();
        assert!(items.is_empty());

        fs::remove_dir_all(root).unwrap();
    }
}
