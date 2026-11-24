use chrono::Utc;
use rusqlite::{params, Connection};
use std::collections::HashSet;
use std::fs;
use std::sync::{Mutex, OnceLock};
use std::time::Duration as StdDuration;

use crate::models::{
    ActionLogEntry, ChatMessageRecord, ChatSessionRecord, DocumentRecord, StudentNoteRecord,
};
use crate::paths::{ensure_child_path, ensure_directories, ensure_safe_relative_path, Roots};

static SCHEMA_INIT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(crate) fn open_db(roots: &Roots) -> Result<Connection, String> {
    let mut conn =
        Connection::open(&roots.db_path).map_err(|_| "Không mở được SQLite local.".to_string())?;
    let _ = conn.busy_timeout(StdDuration::from_secs(5));
    let _guard = SCHEMA_INIT_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .map_err(|_| "Không khóa được luồng khởi tạo SQLite schema.".to_string())?;
    ensure_db_schema(&mut conn)?;
    ensure_default_records(&conn)?;

    Ok(conn)
}

pub(crate) fn open_db_schema_only(roots: &Roots) -> Result<Connection, String> {
    let mut conn =
        Connection::open(&roots.db_path).map_err(|_| "Không mở được SQLite local.".to_string())?;
    let _ = conn.busy_timeout(StdDuration::from_secs(5));
    let _guard = SCHEMA_INIT_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .map_err(|_| "Không khóa được luồng khởi tạo SQLite schema.".to_string())?;
    ensure_db_schema(&mut conn)?;

    Ok(conn)
}

fn migrate_to_v2(conn: &mut Connection) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction migration v2: {}", e))?;

    let columns: Vec<String> = {
        let mut stmt = tx
            .prepare("PRAGMA table_info(chat_sessions)")
            .map_err(|e| format!("Lỗi check pragma table_info: {}", e))?;
        let rows = stmt
            .query_map([], |row| row.get(1))
            .map_err(|e| format!("Lỗi map table_info: {}", e))?;
        rows.filter_map(Result::ok).collect()
    };

    if !columns.contains(&"pinned".to_string()) {
        tx.execute(
            "ALTER TABLE chat_sessions ADD COLUMN pinned INTEGER DEFAULT 0;",
            [],
        )
        .map_err(|e| format!("Lỗi thêm cột pinned: {}", e))?;
    }
    if !columns.contains(&"archived".to_string()) {
        tx.execute(
            "ALTER TABLE chat_sessions ADD COLUMN archived INTEGER DEFAULT 0;",
            [],
        )
        .map_err(|e| format!("Lỗi thêm cột archived: {}", e))?;
    }

    tx.execute("PRAGMA user_version = 2;", [])
        .map_err(|e| format!("Lỗi cập nhật user_version 2: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction migration v2: {}", e))?;
    Ok(())
}

fn migrate_to_v3(conn: &mut Connection) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction migration v3: {}", e))?;

    tx.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS lms_courses (
            course_id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(course_id)) > 0),
            name TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lms_documents (
            document_id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(document_id)) > 0),
            course_id TEXT NOT NULL,
            name TEXT NOT NULL,
            source_path TEXT NOT NULL,
            local_path TEXT,
            size_bytes INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'available',
            updated_at TEXT NOT NULL,
            UNIQUE(course_id, source_path),
            FOREIGN KEY(course_id) REFERENCES lms_courses(course_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_lms_documents_course ON lms_documents(course_id);
        CREATE INDEX IF NOT EXISTS idx_lms_documents_status ON lms_documents(status);
        PRAGMA user_version = 3;
        "#,
    )
    .map_err(|e| format!("Không khởi tạo/nâng cấp được SQLite schema (v3): {}", e))?;

    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction migration v3: {}", e))?;
    Ok(())
}

fn migrate_to_v4(conn: &mut Connection) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| format!("Lỗi tạo migration v4: {}", e))?;
    tx.execute_batch("CREATE TABLE IF NOT EXISTS connector_schedules (id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0), student_code TEXT NOT NULL, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL, weekday INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT, lecturer TEXT, source TEXT NOT NULL, source_record_id TEXT, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL);")
        .map_err(|e| format!("Lỗi đảm bảo bảng lịch trước migration v4: {}", e))?;
    let columns: Vec<String> = {
        let mut stmt = tx.prepare("PRAGMA table_info(connector_schedules)").map_err(|e| format!("Lỗi kiểm tra schema lịch: {}", e))?;
        let rows = stmt.query_map([], |row| row.get(1)).map_err(|e| format!("Lỗi đọc schema lịch: {}", e))?;
        rows.filter_map(Result::ok).collect()
    };
    if !columns.iter().any(|column| column == "class_date") {
        tx.execute("ALTER TABLE connector_schedules ADD COLUMN class_date TEXT NOT NULL DEFAULT ''", [])
            .map_err(|e| format!("Lỗi thêm ngày học: {}", e))?;
    }
    tx.execute_batch("CREATE INDEX IF NOT EXISTS idx_connector_schedules_date ON connector_schedules(student_code, class_date); CREATE TABLE IF NOT EXISTS connector_schedule_weeks (student_code TEXT NOT NULL, week_start TEXT NOT NULL, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL, PRIMARY KEY(student_code, week_start)); PRAGMA user_version = 4;")
        .map_err(|e| format!("Lỗi cập nhật schema v4: {}", e))?;
    tx.commit().map_err(|e| format!("Lỗi commit migration v4: {}", e))?;
    Ok(())
}

fn migrate_to_v5(conn: &mut Connection) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| format!("Lỗi tạo migration v5: {}", e))?;
    tx.execute_batch("CREATE TABLE IF NOT EXISTS connector_transcripts (student_code TEXT NOT NULL PRIMARY KEY CHECK(length(trim(student_code)) > 0), fetched_at TEXT NOT NULL, payload_json TEXT NOT NULL, source TEXT NOT NULL); PRAGMA user_version = 5;")
        .map_err(|e| format!("Lỗi cập nhật schema bảng điểm v5: {}", e))?;
    tx.commit().map_err(|e| format!("Lỗi commit migration v5: {}", e))?;
    Ok(())
}

fn migrate_to_v6(conn: &mut Connection) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction migration v6: {}", e))?;
    tx.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS student_notes (
            id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            subject_id TEXT,
            subject_name TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_student_notes_updated ON student_notes(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_student_notes_subject ON student_notes(subject_id);
        PRAGMA user_version = 6;
        "#,
    )
    .map_err(|e| format!("Không khởi tạo/nâng cấp được SQLite schema (v6 - student_notes): {}", e))?;
    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction migration v6: {}", e))?;
    Ok(())
}

/// Ngày học trống của cache cũ là dữ liệu chưa xác minh, không phải lỗi schema.
fn is_runtime_schema_complete(conn: &Connection) -> bool {
    let table_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN (
                'connector_schedules',
                'connector_exams',
                'connector_sync_status',
                'connector_schedule_weeks',
                'connector_transcripts',
                'student_notes'
            )",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    if table_count < 6 {
        return false;
    }
    let has_class_date: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('connector_schedules') WHERE name = 'class_date'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    if has_class_date == 0 {
        return false;
    }
    true
}

/// Đảm bảo schema connector và student_notes tồn tại cả khi DB cũ đã ghi user_version nhưng thiếu bảng.
/// Chỉ mở write transaction khi kiểm tra chỉ đọc phát hiện thiếu bảng/cột để tránh tranh chấp khóa khi mở DB đồng thời.
fn ensure_connector_runtime_schema(conn: &mut Connection) -> Result<(), String> {
    if is_runtime_schema_complete(conn) {
        return Ok(());
    }
    let tx = conn.transaction().map_err(|e| format!("Lỗi tạo transaction kiểm tra schema connector: {}", e))?;
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS connector_schedules (id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0), student_code TEXT NOT NULL, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL, weekday INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT, lecturer TEXT, source TEXT NOT NULL, source_record_id TEXT, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL, class_date TEXT NOT NULL DEFAULT '');
         CREATE TABLE IF NOT EXISTS connector_exams (id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0), student_code TEXT NOT NULL, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL, exam_date TEXT NOT NULL, start_time TEXT NOT NULL, duration_minutes INTEGER NOT NULL, room TEXT, format TEXT, source TEXT NOT NULL, source_record_id TEXT, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS connector_sync_status (source_name TEXT NOT NULL, student_code TEXT NOT NULL, status TEXT NOT NULL, last_success_at TEXT, last_attempt_at TEXT NOT NULL, last_error TEXT, schedules_count INTEGER DEFAULT 0, exams_count INTEGER DEFAULT 0, PRIMARY KEY (source_name, student_code));
         CREATE INDEX IF NOT EXISTS idx_connector_schedules_student ON connector_schedules(student_code);
         CREATE INDEX IF NOT EXISTS idx_connector_exams_student ON connector_exams(student_code);",
    ).map_err(|e| format!("Không đảm bảo được bảng lịch/thi/trạng thái connector: {}", e))?;
    let columns: Vec<String> = {
        let mut stmt = tx.prepare("PRAGMA table_info(connector_schedules)").map_err(|e| format!("Lỗi kiểm tra cột lịch connector: {}", e))?;
        let rows = stmt.query_map([], |row| row.get(1)).map_err(|e| format!("Lỗi đọc cột lịch connector: {}", e))?;
        rows.filter_map(Result::ok).collect()
    };
    if !columns.iter().any(|column| column == "class_date") {
        tx.execute("ALTER TABLE connector_schedules ADD COLUMN class_date TEXT NOT NULL DEFAULT ''", [])
            .map_err(|e| format!("Không thể bổ sung ngày lịch connector: {}", e))?;
    }
    tx.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_connector_schedules_date ON connector_schedules(student_code, class_date);
         CREATE TABLE IF NOT EXISTS connector_schedule_weeks (student_code TEXT NOT NULL, week_start TEXT NOT NULL, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL, PRIMARY KEY(student_code, week_start));
         CREATE TABLE IF NOT EXISTS connector_transcripts (student_code TEXT NOT NULL PRIMARY KEY CHECK(length(trim(student_code)) > 0), fetched_at TEXT NOT NULL, payload_json TEXT NOT NULL, source TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS student_notes (id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0), title TEXT NOT NULL, content TEXT NOT NULL, subject_id TEXT, subject_name TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
         CREATE INDEX IF NOT EXISTS idx_student_notes_updated ON student_notes(updated_at DESC);
         CREATE INDEX IF NOT EXISTS idx_student_notes_subject ON student_notes(subject_id);",
    ).map_err(|e| format!("Không đảm bảo được bảng cache connector và student_notes: {}", e))?;
    tx.commit().map_err(|e| format!("Lỗi commit schema connector: {}", e))?;
    Ok(())
}

pub(crate) fn ensure_db_schema(conn: &mut Connection) -> Result<(), String> {
    conn.pragma_update(None, "foreign_keys", true)
        .map_err(|e| format!("Không bật được SQLite foreign key: {}", e))?;

    let user_version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);

    if user_version < 1 {
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT NOT NULL PRIMARY KEY CHECK(length(trim(key)) > 0),
                value TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS action_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                document_id TEXT,
                result TEXT NOT NULL,
                error_code TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS connector_schedules (
                id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
                student_code TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                weekday INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                room TEXT,
                lecturer TEXT,
                source TEXT NOT NULL,
                source_record_id TEXT,
                fetched_at TEXT NOT NULL,
                sync_batch_id TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS connector_exams (
                id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
                student_code TEXT NOT NULL,
                subject_code TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                exam_date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL,
                room TEXT,
                format TEXT,
                source TEXT NOT NULL,
                source_record_id TEXT,
                fetched_at TEXT NOT NULL,
                sync_batch_id TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS connector_sync_status (
                source_name TEXT NOT NULL,
                student_code TEXT NOT NULL,
                status TEXT NOT NULL,
                last_success_at TEXT,
                last_attempt_at TEXT NOT NULL,
                last_error TEXT,
                schedules_count INTEGER DEFAULT 0,
                exams_count INTEGER DEFAULT 0,
                PRIMARY KEY (source_name, student_code)
            );

            CREATE INDEX IF NOT EXISTS idx_connector_schedules_student ON connector_schedules(student_code);
            CREATE INDEX IF NOT EXISTS idx_connector_exams_student ON connector_exams(student_code);
            CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at);

            PRAGMA user_version = 1;
            "#,
        )
        .map_err(|e| format!("Không khởi tạo/nâng cấp được SQLite schema (v1): {}", e))?;
    }

    if user_version < 2 {
        migrate_to_v2(conn)?;
    }

    let current_version: i32 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);
    if current_version < 3 {
        migrate_to_v3(conn)?;
    }
    let current_version: i32 = conn.query_row("PRAGMA user_version", [], |row| row.get(0)).unwrap_or(0);
    if current_version < 4 { migrate_to_v4(conn)?; }
    let current_version: i32 = conn.query_row("PRAGMA user_version", [], |row| row.get(0)).unwrap_or(0);
    if current_version < 5 { migrate_to_v5(conn)?; }
    let current_version: i32 = conn.query_row("PRAGMA user_version", [], |row| row.get(0)).unwrap_or(0);
    if current_version < 6 { migrate_to_v6(conn)?; }
    ensure_connector_runtime_schema(conn)?;

    let _ = conn.pragma_update(None, "journal_mode", "WAL");
    let _ = conn.pragma_update(None, "synchronous", "NORMAL");

    Ok(())
}

fn ensure_default_records(conn: &Connection) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR IGNORE INTO chat_sessions (id, title, created_at, updated_at) VALUES ('default', 'Trò chuyện chính', ?1, ?1)",
        params![now],
    )
    .map_err(|_| "Không tạo được phiên trò chuyện.".to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value, created_at, updated_at) VALUES ('theme', 'dark', ?1, ?1)",
        params![now],
    )
    .map_err(|_| "Không tạo được setting theme.".to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value, created_at, updated_at) VALUES ('accentColor', '#6d5dfc', ?1, ?1)",
        params![now],
    )
    .map_err(|_| "Không tạo được setting accent.".to_string())?;

    Ok(())
}

pub(crate) fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO settings (key, value, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now],
    )
    .map_err(|_| "Không lưu được cài đặt.".to_string())?;
    Ok(())
}

pub(crate) fn get_setting(conn: &Connection, key: &str, fallback: &str) -> String {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .unwrap_or_else(|_| fallback.to_string())
}

pub(crate) fn seed_sample_documents(
    conn: &Connection,
    roots: &Roots,
    documents: &[DocumentRecord],
) -> Result<(), String> {
    let seed_key = format!("sampleDocumentsSeeded-{}", env!("CARGO_PKG_VERSION"));
    if get_setting(conn, &seed_key, "false") == "true" {
        return Ok(());
    }

    for doc in documents {
        ensure_safe_relative_path(&doc.local_path, "sample-documents")?;
        let path = roots.workspace.join(&doc.local_path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|_| "Không tạo được thư mục tài liệu mẫu.".to_string())?;
        }
        ensure_child_path(&roots.sample_documents, &path)?;
        if !path.exists() {
            let content = format!(
                "Campus Assistant Local\n\nTài liệu mẫu: {}\nMôn: {}\nHọc kỳ: {}\nLoại: {}\nNguồn: {}\n\nFile này dùng để kiểm thử v0.1 và không chứa dữ liệu thật.\n",
                doc.name, doc.subject_id, doc.semester, doc.doc_type, doc.source
            );
            fs::write(&path, content)
                .map_err(|_| "Không tạo được file tài liệu mẫu.".to_string())?;
        }
    }
    set_setting(conn, &seed_key, "true")?;
    Ok(())
}

pub(crate) fn log_action(
    conn: &Connection,
    action: &str,
    document_id: Option<&str>,
    result: &str,
    error_code: Option<&str>,
) -> Result<(), String> {
    conn.execute(
        "INSERT INTO action_logs (action, document_id, result, error_code, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![action, document_id, result, error_code, Utc::now().to_rfc3339()],
    )
    .map_err(|_| "Không ghi được action log.".to_string())?;
    Ok(())
}

pub(crate) fn action_log_count(conn: &Connection) -> Result<i64, String> {
    conn.query_row("SELECT COUNT(*) FROM action_logs", [], |row| row.get(0))
        .map_err(|_| "Không đếm được action log.".to_string())
}

pub(crate) fn list_action_logs_for_roots(
    roots: &Roots,
    limit: Option<i64>,
) -> Result<Vec<ActionLogEntry>, String> {
    ensure_directories(roots)?;
    let conn = open_db_schema_only(roots)?;
    let limit = limit.unwrap_or(100).clamp(1, 200);
    let mut stmt = conn
        .prepare(
            "SELECT id, action, document_id, result, error_code, created_at
             FROM action_logs
             ORDER BY id DESC
             LIMIT ?1",
        )
        .map_err(|_| "Không đọc được action log.".to_string())?;
    let rows = stmt
        .query_map(params![limit], |row| {
            Ok(ActionLogEntry {
                id: row.get(0)?,
                action: row.get(1)?,
                document_id: row.get(2)?,
                result: row.get(3)?,
                error_code: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|_| "Không đọc được action log.".to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|_| "Không đọc được action log.".to_string())
}

#[tauri::command]
pub(crate) fn save_setting(key: String, value: String) -> Result<(), String> {
    let roots = crate::paths::resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    set_setting(&conn, &key, &value)
}

#[tauri::command]
pub(crate) fn clear_action_logs() -> Result<i64, String> {
    let roots = crate::paths::resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let removed = conn
        .execute("DELETE FROM action_logs", [])
        .map_err(|_| "Không xóa được action log.".to_string())? as i64;
    Ok(removed)
}

pub(crate) fn save_chat_message(
    conn: &Connection,
    session_id: &str,
    role: &str,
    content: &str,
) -> Result<i64, String> {
    // BACKEND PRIVACY GUARD: Directly blocks writing if chatHistoryEnabled is not "true"
    if get_setting(conn, "chatHistoryEnabled", "false") != "true" {
        return Ok(0);
    }
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![session_id, role, content, now],
    )
    .map_err(|e| format!("Lỗi lưu tin nhắn: {}", e))?;

    let message_id = conn.last_insert_rowid();

    conn.execute(
        "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
        params![now, session_id],
    )
    .map_err(|e| format!("Lỗi cập nhật thời gian phiên trò chuyện: {}", e))?;

    Ok(message_id)
}

pub(crate) fn list_chat_sessions(conn: &Connection) -> Result<Vec<ChatSessionRecord>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, created_at, updated_at, COALESCE(pinned, 0), COALESCE(archived, 0)
             FROM chat_sessions
             ORDER BY pinned DESC, updated_at DESC",
        )
        .map_err(|e| format!("Lỗi tải danh sách phiên trò chuyện: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ChatSessionRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                pinned: row.get::<_, i32>(4)? != 0,
                archived: row.get::<_, i32>(5)? != 0,
            })
        })
        .map_err(|e| format!("Lỗi map danh sách phiên trò chuyện: {}", e))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Lỗi thu thập danh sách phiên: {}", e))
}

pub(crate) fn create_chat_session(
    conn: &Connection,
    title: &str,
) -> Result<ChatSessionRecord, String> {
    // BACKEND PRIVACY GUARD: Blocks creating chat session if chatHistoryEnabled is not "true"
    if get_setting(conn, "chatHistoryEnabled", "false") != "true" {
        return Err("Chưa bật lưu lịch sử trò chuyện local.".to_string());
    }

    let sanitized_title: String = title.trim().chars().take(100).collect();
    let title_to_use = if sanitized_title.is_empty() {
        "Cuộc trò chuyện mới".to_string()
    } else {
        sanitized_title
    };

    let id = format!("session_{}", Utc::now().timestamp_millis());
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO chat_sessions (id, title, created_at, updated_at, pinned, archived) VALUES (?1, ?2, ?3, ?3, 0, 0)",
        params![id, title_to_use, now],
    )
    .map_err(|e| format!("Lỗi tạo phiên trò chuyện mới: {}", e))?;

    Ok(ChatSessionRecord {
        id,
        title: title_to_use,
        created_at: now.clone(),
        updated_at: now,
        pinned: false,
        archived: false,
    })
}

pub(crate) fn rename_chat_session(
    conn: &Connection,
    id: &str,
    new_title: &str,
) -> Result<(), String> {
    let sanitized_title: String = new_title.trim().chars().take(100).collect();
    if sanitized_title.is_empty() {
        return Err("Tiêu đề không được để trống.".to_string());
    }

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE chat_sessions SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![sanitized_title, now, id],
    )
    .map_err(|e| format!("Lỗi đổi tên phiên trò chuyện: {}", e))?;

    Ok(())
}

pub(crate) fn toggle_pin_chat_session(
    conn: &Connection,
    id: &str,
    pinned: bool,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let val = if pinned { 1 } else { 0 };
    conn.execute(
        "UPDATE chat_sessions SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
        params![val, now, id],
    )
    .map_err(|e| format!("Lỗi ghim phiên trò chuyện: {}", e))?;

    Ok(())
}

pub(crate) fn toggle_archive_chat_session(
    conn: &Connection,
    id: &str,
    archived: bool,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let val = if archived { 1 } else { 0 };
    conn.execute(
        "UPDATE chat_sessions SET archived = ?1, updated_at = ?2 WHERE id = ?3",
        params![val, now, id],
    )
    .map_err(|e| format!("Lỗi lưu trữ phiên trò chuyện: {}", e))?;

    Ok(())
}

pub(crate) fn delete_chat_session(conn: &mut Connection, id: &str) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction xóa phiên: {}", e))?;

    tx.execute(
        "DELETE FROM chat_messages WHERE session_id = ?1",
        params![id],
    )
    .map_err(|e| format!("Lỗi xóa tin nhắn thuộc phiên: {}", e))?;

    tx.execute("DELETE FROM chat_sessions WHERE id = ?1", params![id])
        .map_err(|e| format!("Lỗi xóa phiên trò chuyện: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction xóa phiên: {}", e))?;

    Ok(())
}

pub(crate) fn clear_all_chat_sessions(conn: &mut Connection) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction xóa tất cả phiên: {}", e))?;

    tx.execute("DELETE FROM chat_messages", [])
        .map_err(|e| format!("Lỗi xóa tất cả tin nhắn: {}", e))?;

    tx.execute("DELETE FROM chat_sessions WHERE id != 'default'", [])
        .map_err(|e| format!("Lỗi xóa các phiên trò chuyện phụ: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction xóa tất cả phiên: {}", e))?;

    ensure_default_records(conn)?;

    Ok(())
}

pub(crate) fn get_session_messages(
    conn: &Connection,
    session_id: &str,
) -> Result<Vec<ChatMessageRecord>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, role, content, created_at
             FROM chat_messages
             WHERE session_id = ?1
             ORDER BY id ASC",
        )
        .map_err(|e| format!("Lỗi đọc tin nhắn phiên: {}", e))?;

    let rows = stmt
        .query_map(params![session_id], |row| {
            Ok(ChatMessageRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| format!("Lỗi map tin nhắn phiên: {}", e))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Lỗi thu thập tin nhắn phiên: {}", e))
}

pub(crate) const MAX_NOTE_TITLE_CHARS: usize = 100;
pub(crate) const MAX_NOTE_CONTENT_CHARS: usize = 10_000;

pub(crate) fn list_student_notes_in_db(
    conn: &Connection,
    search_query: Option<&str>,
    subject_filter: Option<&str>,
) -> Result<Vec<StudentNoteRecord>, String> {
    let query = search_query.unwrap_or("").trim().to_lowercase();
    let subject = subject_filter.unwrap_or("").trim();

    let mut stmt = conn
        .prepare(
            "SELECT id, title, content, subject_id, subject_name, created_at, updated_at
             FROM student_notes
             ORDER BY updated_at DESC, id DESC",
        )
        .map_err(|e| format!("Lỗi đọc sổ ghi chú học tập: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(StudentNoteRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                subject_id: row.get(3)?,
                subject_name: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Lỗi truy vấn sổ ghi chú học tập: {}", e))?;

    let all_notes = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Lỗi thu thập danh sách ghi chú: {}", e))?;

    let filtered = all_notes
        .into_iter()
        .filter(|note| {
            if !subject.is_empty() && subject != "all" {
                if note.subject_id.as_deref().unwrap_or("") != subject {
                    return false;
                }
            }
            if !query.is_empty() {
                let haystack = format!(
                    "{} {} {}",
                    note.title.to_lowercase(),
                    note.content.to_lowercase(),
                    note.subject_name.as_deref().unwrap_or("").to_lowercase()
                );
                if !haystack.contains(&query) {
                    return false;
                }
            }
            true
        })
        .collect();

    Ok(filtered)
}

pub(crate) fn save_student_note_in_db(
    conn: &Connection,
    id: Option<&str>,
    title: &str,
    content: &str,
    subject_id: Option<&str>,
    subject_name: Option<&str>,
) -> Result<StudentNoteRecord, String> {
    let trimmed_title = title.trim();
    let title_char_count = trimmed_title.chars().count();
    if title_char_count == 0 {
        return Err("Tiêu đề không được để trống.".to_string());
    }
    if title_char_count > MAX_NOTE_TITLE_CHARS {
        return Err(format!(
            "Tiêu đề ghi chú không được vượt quá {} ký tự.",
            MAX_NOTE_TITLE_CHARS
        ));
    }

    let content_char_count = content.chars().count();
    if content_char_count > MAX_NOTE_CONTENT_CHARS {
        return Err(format!(
            "Nội dung ghi chú không được vượt quá {} ký tự.",
            MAX_NOTE_CONTENT_CHARS
        ));
    }

    let clean_subject_id = subject_id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.chars().take(80).collect::<String>());
    let clean_subject_name = subject_name
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.chars().take(200).collect::<String>());

    let now = Utc::now().to_rfc3339();
    let note_id = id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| {
            format!(
                "note_{}",
                Utc::now().timestamp_nanos_opt().unwrap_or_default()
            )
        });

    let existing_created_at: Option<String> = conn
        .query_row(
            "SELECT created_at FROM student_notes WHERE id = ?1",
            params![note_id],
            |row| row.get(0),
        )
        .ok();
    let created_at = existing_created_at.unwrap_or_else(|| now.clone());

    conn.execute(
        "INSERT INTO student_notes (id, title, content, subject_id, subject_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           content = excluded.content,
           subject_id = excluded.subject_id,
           subject_name = excluded.subject_name,
           updated_at = excluded.updated_at",
        params![
            note_id,
            trimmed_title,
            content,
            clean_subject_id,
            clean_subject_name,
            created_at,
            now
        ],
    )
    .map_err(|e| format!("Lỗi lưu ghi chú học tập vào SQLite: {}", e))?;

    Ok(StudentNoteRecord {
        id: note_id,
        title: trimmed_title.to_string(),
        content: content.to_string(),
        subject_id: clean_subject_id,
        subject_name: clean_subject_name,
        created_at,
        updated_at: now,
    })
}

pub(crate) fn delete_student_note_in_db(conn: &Connection, id: &str) -> Result<bool, String> {
    let trimmed_id = id.trim();
    if trimmed_id.is_empty() {
        return Err("Mã ghi chú không hợp lệ.".to_string());
    }
    let affected = conn
        .execute("DELETE FROM student_notes WHERE id = ?1", params![trimmed_id])
        .map_err(|e| format!("Lỗi xóa ghi chú học tập: {}", e))?;
    Ok(affected > 0)
}

pub(crate) fn import_student_notes_backup_in_db(
    conn: &mut Connection,
    notes: &[StudentNoteRecord],
) -> Result<usize, String> {
    if notes.len() > 2_000 {
        return Err("Số lượng ghi chú trong bản sao lưu vượt quá giới hạn an toàn (2000).".to_string());
    }

    let mut seen_ids = HashSet::new();
    for note in notes {
        if note.id.trim().is_empty() {
            return Err("Bản sao lưu chứa ghi chú thiếu mã định danh (id).".to_string());
        }
        if !seen_ids.insert(note.id.trim()) {
            return Err("Bản sao lưu chứa mã ghi chú trùng lặp.".to_string());
        }
        let title_len = note.title.trim().chars().count();
        if title_len == 0 || title_len > MAX_NOTE_TITLE_CHARS {
            return Err("Bản sao lưu chứa tiêu đề ghi chú không hợp lệ.".to_string());
        }
        if note.content.chars().count() > MAX_NOTE_CONTENT_CHARS {
            return Err("Bản sao lưu chứa nội dung ghi chú vượt quá 10.000 ký tự.".to_string());
        }
    }

    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction khôi phục ghi chú: {}", e))?;

    for note in notes {
        let now = Utc::now().to_rfc3339();
        let created_at = if note.created_at.trim().is_empty() {
            now.clone()
        } else {
            note.created_at.trim().to_string()
        };
        let updated_at = if note.updated_at.trim().is_empty() {
            now
        } else {
            note.updated_at.trim().to_string()
        };

        tx.execute(
            "INSERT INTO student_notes (id, title, content, subject_id, subject_name, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(id) DO UPDATE SET
               title = excluded.title,
               content = excluded.content,
               subject_id = excluded.subject_id,
               subject_name = excluded.subject_name,
               created_at = excluded.created_at,
               updated_at = excluded.updated_at",
            params![
                note.id.trim(),
                note.title.trim(),
                note.content,
                note.subject_id.as_deref().map(str::trim).filter(|s| !s.is_empty()),
                note.subject_name.as_deref().map(str::trim).filter(|s| !s.is_empty()),
                created_at,
                updated_at
            ],
        )
        .map_err(|e| format!("Lỗi khôi phục ghi chú '{}': {}", note.id, e))?;
    }

    tx.commit()
        .map_err(|e| format!("Lỗi commit khôi phục ghi chú: {}", e))?;
    Ok(notes.len())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::roots_from_bases;
    use std::path::PathBuf;

    fn temp_fixture_roots(label: &str) -> (PathBuf, Roots) {
        let root = std::env::temp_dir().join(format!(
            "ca-db-fixture-{}-{}",
            label,
            Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        let app_base = root.join("app-local-data");
        let docs_base = root.join("documents");
        let roots = roots_from_bases(app_base, docs_base);
        ensure_directories(&roots).unwrap();
        (root, roots)
    }

    #[test]
    fn test_v2_migration_and_privacy_guard() {
        let mut conn = Connection::open_in_memory().unwrap();
        ensure_db_schema(&mut conn).unwrap();
        ensure_default_records(&conn).unwrap();

        // 1. Verify schema v6 user_version (BVA-02: 0 -> 6)
        let v: i32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(v, 6);
        let lms_tables: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('lms_courses', 'lms_documents', 'student_notes')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(lms_tables, 3);

        // 2. Privacy guard test: when disabled (default false), save_chat_message & create_chat_session return error/0
        let res = save_chat_message(&conn, "default", "user", "Hello world").unwrap();
        assert_eq!(res, 0);
        assert!(create_chat_session(&conn, "Phiên khi disabled").is_err());
        let msg_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chat_messages", [], |r| r.get(0))
            .unwrap();
        assert_eq!(msg_count, 0);

        // 3. Opt-in test: when chatHistoryEnabled = true, save_chat_message writes message
        set_setting(&conn, "chatHistoryEnabled", "true").unwrap();
        let res2 = save_chat_message(&conn, "default", "user", "Hello world 2").unwrap();
        assert!(res2 > 0);
        let msg_count2: i64 = conn
            .query_row("SELECT COUNT(*) FROM chat_messages", [], |r| r.get(0))
            .unwrap();
        assert_eq!(msg_count2, 1);

        // 4. Test CRUD functions
        let new_sess = create_chat_session(&conn, "Hội thoại lập trình").unwrap();
        assert_eq!(new_sess.title, "Hội thoại lập trình");

        rename_chat_session(&conn, &new_sess.id, "Đã đổi tên").unwrap();
        toggle_pin_chat_session(&conn, &new_sess.id, true).unwrap();

        let sessions = list_chat_sessions(&conn).unwrap();
        let found = sessions.iter().find(|s| s.id == new_sess.id).unwrap();
        assert_eq!(found.title, "Đã đổi tên");
        assert!(found.pinned);

        // 5. Test Delete Session Cascade
        save_chat_message(&conn, &new_sess.id, "user", "Tin nhắn phụ").unwrap();
        delete_chat_session(&mut conn, &new_sess.id).unwrap();
        let sess_after = list_chat_sessions(&conn).unwrap();
        assert!(sess_after.iter().all(|s| s.id != new_sess.id));

        // 6. Test Clear All Preserves Default Session
        clear_all_chat_sessions(&mut conn).unwrap();
        let sess_clear = list_chat_sessions(&conn).unwrap();
        assert!(sess_clear.iter().any(|s| s.id == "default"));
    }

    #[test]
    fn test_migration_preserves_existing_chat_data_and_enables_foreign_keys() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
            );
            INSERT INTO chat_sessions VALUES ('legacy', 'Dữ liệu cũ', '2026-01-01', '2026-01-01');
            INSERT INTO chat_messages (session_id, role, content, created_at)
            VALUES ('legacy', 'user', 'Không được xóa khi khởi động', '2026-01-01');
            PRAGMA user_version = 1;
            "#,
        )
        .unwrap();

        ensure_db_schema(&mut conn).unwrap();

        let version: i32 = conn
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .unwrap();
        let foreign_keys: i32 = conn
            .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
            .unwrap();
        let message_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chat_messages", [], |row| row.get(0))
            .unwrap();

        assert_eq!(version, 6);
        let lms_tables: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('lms_courses', 'lms_documents', 'student_notes')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(lms_tables, 3);
        assert_eq!(foreign_keys, 1);
        assert_eq!(message_count, 1);
    }

    #[test]
    fn test_connector_schema_repairs_missing_tables_even_when_version_is_current() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE connector_schedules (id TEXT PRIMARY KEY, student_code TEXT NOT NULL, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL, weekday INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT, lecturer TEXT, source TEXT NOT NULL, source_record_id TEXT, fetched_at TEXT NOT NULL, sync_batch_id TEXT NOT NULL);
             INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id) VALUES ('keep', 'S1', 'M1', 'Môn cũ', 2, '08:00', '09:00', 'uth-portal', '2026-01-05', 'old');
             PRAGMA user_version = 6;",
        ).unwrap();

        ensure_db_schema(&mut conn).unwrap();

        let weeks_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_schedule_weeks'", [], |row| row.get(0)).unwrap();
        let transcript_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_transcripts'", [], |row| row.get(0)).unwrap();
        let exams_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_exams'", [], |row| row.get(0)).unwrap();
        let sync_status_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_sync_status'", [], |row| row.get(0)).unwrap();
        let notes_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='student_notes'", [], |row| row.get(0)).unwrap();
        let stored_subject: String = conn.query_row("SELECT subject_name FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        let unknown_date: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        let has_date_column: i64 = conn.query_row("SELECT COUNT(*) FROM pragma_table_info('connector_schedules') WHERE name='class_date'", [], |row| row.get(0)).unwrap();

        assert_eq!(weeks_exists, 1);
        assert_eq!(transcript_exists, 1);
        assert_eq!(exams_exists, 1);
        assert_eq!(sync_status_exists, 1);
        assert_eq!(notes_exists, 1);
        assert_eq!(stored_subject, "Môn cũ");
        assert_eq!(unknown_date, ""); // fetched_at không chứng minh ngày học.
        assert_eq!(has_date_column, 1);
        assert!(is_runtime_schema_complete(&conn));
        // Mở lại không được tự điền ngày suy diễn hay làm mất ngày đã có.
        conn.execute(
            "INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id, class_date) VALUES ('dated', 'S1', 'M2', 'Môn có ngày', 3, '08:00', '09:00', 'uth-portal', '2026-02-20', 'old', '2026-01-20')",
            [],
        ).unwrap();
        ensure_db_schema(&mut conn).unwrap();
        let dated: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='dated'", [], |row| row.get(0)).unwrap();
        let still_unknown: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        assert_eq!(dated, "2026-01-20");
        assert_eq!(still_unknown, "");
    }

    #[test]
    fn test_migrate_to_v6_directly_creates_student_notes_and_rejects_null_or_blank_primary_key() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute("PRAGMA user_version = 5;", []).unwrap();

        // Gọi trực tiếp migrate_to_v6 (không đi qua ensure_connector_runtime_schema) để chứng minh chính migrate_to_v6 tạo bảng
        migrate_to_v6(&mut conn).unwrap();

        let version: i32 = conn.query_row("PRAGMA user_version", [], |r| r.get(0)).unwrap();
        let notes_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='student_notes'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(version, 6);
        assert_eq!(notes_exists, 1);

        // Xác minh TEXT NOT NULL PRIMARY KEY chặn chèn NULL hoặc chuỗi rỗng làm khóa chính
        let null_id_insert = conn.execute(
            "INSERT INTO student_notes (id, title, content, created_at, updated_at) VALUES (NULL, 'T', 'C', '2026-01-01', '2026-01-01')",
            [],
        );
        assert!(null_id_insert.is_err());

        let blank_id_insert = conn.execute(
            "INSERT INTO student_notes (id, title, content, created_at, updated_at) VALUES ('   ', 'T', 'C', '2026-01-01', '2026-01-01')",
            [],
        );
        assert!(blank_id_insert.is_err());

        for id in ["N", "N2"] {
            conn.execute(
                "INSERT INTO student_notes (id, title, content, created_at, updated_at) VALUES (?1, 'T', 'C', '2026-01-01', '2026-01-01')",
                [id],
            )
            .unwrap();
        }
        let valid_notes: i64 = conn
            .query_row("SELECT COUNT(*) FROM student_notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(valid_notes, 2);
    }

    #[test]
    fn test_bva02_and_dt2_rule2_temp_db_fixture_upgrades_v1_to_v6_on_disk() {
        let (root, roots) = temp_fixture_roots("v1-to-v6");

        // Bước 1: Tạo file SQLite cũ ở user_version = 1 trên ổ cứng (chưa có connector_schedule_weeks, chưa có student_notes)
        {
            let conn_v1 = Connection::open(&roots.db_path).unwrap();
            conn_v1
                .execute_batch(
                    r#"
                    CREATE TABLE settings (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                    CREATE TABLE chat_sessions (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                    CREATE TABLE chat_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
                    );
                    CREATE TABLE action_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        action TEXT NOT NULL,
                        document_id TEXT,
                        result TEXT NOT NULL,
                        error_code TEXT,
                        created_at TEXT NOT NULL
                    );
                    CREATE TABLE connector_schedules (
                        id TEXT PRIMARY KEY,
                        student_code TEXT NOT NULL,
                        subject_code TEXT NOT NULL,
                        subject_name TEXT NOT NULL,
                        weekday INTEGER NOT NULL,
                        start_time TEXT NOT NULL,
                        end_time TEXT NOT NULL,
                        room TEXT,
                        lecturer TEXT,
                        source TEXT NOT NULL,
                        source_record_id TEXT,
                        fetched_at TEXT NOT NULL,
                        sync_batch_id TEXT NOT NULL
                    );
                    CREATE TABLE connector_exams (
                        id TEXT PRIMARY KEY,
                        student_code TEXT NOT NULL,
                        subject_code TEXT NOT NULL,
                        subject_name TEXT NOT NULL,
                        exam_date TEXT NOT NULL,
                        start_time TEXT NOT NULL,
                        duration_minutes INTEGER NOT NULL,
                        room TEXT,
                        format TEXT,
                        source TEXT NOT NULL,
                        source_record_id TEXT,
                        fetched_at TEXT NOT NULL,
                        sync_batch_id TEXT NOT NULL
                    );
                    INSERT INTO settings VALUES ('theme', 'light', '2026-01-01', '2026-01-01');
                    INSERT INTO chat_sessions VALUES ('s_old', 'Phiên học kỳ trước', '2026-01-01', '2026-01-01');
                    INSERT INTO chat_messages (session_id, role, content, created_at)
                        VALUES ('s_old', 'user', 'Kiểm thử phần mềm BVA & Decision Table', '2026-01-01');
                    INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id)
                        VALUES ('sched_1', '2251120001', 'ST101', 'Kiểm thử phần mềm', 3, '07:30', '11:00', 'uth-portal', '2026-01-05', 'batch_1');
                    INSERT INTO connector_exams (id, student_code, subject_code, subject_name, exam_date, start_time, duration_minutes, source, fetched_at, sync_batch_id)
                        VALUES ('exam_1', '2251120001', 'ST101', 'Kiểm thử phần mềm', '2026-12-24', '08:00', 90, 'uth-portal', '2026-01-05', 'batch_1');
                    PRAGMA user_version = 1;
                    "#,
                )
                .unwrap();
        }

        // Bước 1b: Chạy riêng migration để chứng minh tạo bảng mà không suy ngày từ fetched_at.
        {
            let mut raw_conn = Connection::open(&roots.db_path).unwrap();
            migrate_to_v2(&mut raw_conn).unwrap();
            migrate_to_v3(&mut raw_conn).unwrap();
            migrate_to_v4(&mut raw_conn).unwrap();
            migrate_to_v5(&mut raw_conn).unwrap();
            migrate_to_v6(&mut raw_conn).unwrap();

            let direct_notes_table: i64 = raw_conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='student_notes'",
                    [],
                    |r| r.get(0),
                )
                .unwrap();
            assert_eq!(direct_notes_table, 1);

            let migrated_class_date: String = raw_conn
                .query_row(
                    "SELECT class_date FROM connector_schedules WHERE id = 'sched_1'",
                    [],
                    |r| r.get(0),
                )
                .unwrap();
            assert_eq!(migrated_class_date, ""); // Ngày tải không xác định ngày học.
        }

        // Bước 2: Mở lại file DB tạm thông qua open_db(&roots) (cũng kiểm tra mở đồng thời không bị khóa)
        {
            let conn = open_db(&roots).unwrap();
            let conn_concurrent = open_db(&roots).unwrap();
            let concurrent_ver: i32 = conn_concurrent
                .query_row("PRAGMA user_version", [], |row| row.get(0))
                .unwrap();
            assert_eq!(concurrent_ver, 6);

            let version: i32 = conn
                .query_row("PRAGMA user_version", [], |row| row.get(0))
                .unwrap();
            assert_eq!(version, 6);

            // Kiểm tra sự tồn tại của tất cả các bảng quan trọng (đặc biệt là connector_schedule_weeks và student_notes)
            let required_tables: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN (
                        'connector_schedule_weeks',
                        'connector_transcripts',
                        'lms_courses',
                        'lms_documents',
                        'student_notes'
                    )",
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(required_tables, 5);

            // Kiểm tra bảo toàn dữ liệu cũ (Row Preservation & Unicode)
            let preserved_msg: String = conn
                .query_row(
                    "SELECT content FROM chat_messages WHERE session_id = 's_old'",
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(preserved_msg, "Kiểm thử phần mềm BVA & Decision Table");

            let preserved_sched: String = conn
                .query_row(
                    "SELECT subject_name FROM connector_schedules WHERE id = 'sched_1'",
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(preserved_sched, "Kiểm thử phần mềm");

            // Đảm bảo dữ liệu lịch thi cũ trong connector_exams không bị xóa khi nâng lên v6 (student_notes)
            let preserved_exam_count: i64 = conn
                .query_row("SELECT COUNT(*) FROM connector_exams WHERE id = 'exam_1'", [], |row| row.get(0))
                .unwrap();
            assert_eq!(preserved_exam_count, 1);

            // Thử chèn bản ghi vào connector_schedule_weeks và student_notes mới trên file DB vừa nâng cấp
            conn.execute(
                "INSERT INTO connector_schedule_weeks (student_code, week_start, fetched_at, sync_batch_id) VALUES (?1, ?2, ?3, ?4)",
                params!["2251120001", "2026-11-16", "2026-11-20T09:00:00Z", "batch_2"],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO student_notes (id, title, content, subject_id, subject_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
                params![
                    "note_01",
                    "Ghi chú BVA & Decision Table",
                    "Nội dung kiểm thử migration SQLite trên temp DB fixture",
                    "ST101",
                    "Kiểm thử phần mềm",
                    "2026-11-20T09:00:00Z"
                ],
            )
            .unwrap();
        }

        // Bước 3: Mở lại lần nữa (mô phỏng restart app) để chắc chắn dữ liệu ghi vào bảng mới bền vững trên đĩa
        {
            let conn = open_db(&roots).unwrap();
            let note_title: String = conn
                .query_row(
                    "SELECT title FROM student_notes WHERE id = 'note_01'",
                    [],
                    |row| row.get(0),
                )
                .unwrap();
            assert_eq!(note_title, "Ghi chú BVA & Decision Table");
        }

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_bva03_bva04_and_dt3_student_notes_crud_validation_and_backup_roundtrip() {
        let (root, roots) = temp_fixture_roots("student-notes-bva");
        let mut conn = open_db(&roots).unwrap();

        // 1. BVA-03 (Biên tiêu đề title: Min-1 = 0, Min = 1, Max = 100, Max+1 = 101)
        assert!(
            save_student_note_in_db(&conn, None, "   ", "Nội dung hợp lệ", None, None).is_err(),
            "BVA-03 Min-1 (0 ký tự) phải bị từ chối"
        );

        let min_title_note =
            save_student_note_in_db(&conn, Some("n_min"), "A", "Nội dung", None, None).unwrap();
        assert_eq!(min_title_note.title, "A");

        let max_title = "Đ".repeat(MAX_NOTE_TITLE_CHARS); // 100 ký tự Unicode
        let max_title_note =
            save_student_note_in_db(&conn, Some("n_max"), &max_title, "Nội dung", None, None)
                .unwrap();
        assert_eq!(max_title_note.title.chars().count(), 100);

        let over_max_title = "Đ".repeat(MAX_NOTE_TITLE_CHARS + 1); // 101 ký tự Unicode
        assert!(
            save_student_note_in_db(&conn, None, &over_max_title, "Nội dung", None, None).is_err(),
            "BVA-03 Max+1 (101 ký tự) phải bị từ chối"
        );

        // 2. BVA-04 (Biên nội dung content: Min = 0, Max = 10000, Max+1 = 10001)
        let empty_content_note =
            save_student_note_in_db(&conn, Some("n_c0"), "Tiêu đề chuẩn", "", None, None).unwrap();
        assert_eq!(empty_content_note.content, "");

        let max_content = "K".repeat(MAX_NOTE_CONTENT_CHARS); // 10000 ký tự
        let max_content_note = save_student_note_in_db(
            &conn,
            Some("n_cmax"),
            "Tiêu đề chuẩn",
            &max_content,
            Some("ST101"),
            Some("Kiểm thử phần mềm"),
        )
        .unwrap();
        assert_eq!(max_content_note.content.chars().count(), 10_000);
        assert_eq!(
            max_content_note.subject_name.as_deref(),
            Some("Kiểm thử phần mềm")
        );

        let over_max_content = "K".repeat(MAX_NOTE_CONTENT_CHARS + 1); // 10001 ký tự
        assert!(
            save_student_note_in_db(&conn, None, "Tiêu đề chuẩn", &over_max_content, None, None)
                .is_err(),
            "BVA-04 Max+1 (10001 ký tự) phải bị từ chối"
        );

        // 3. Decision Table 3: Tìm kiếm, lọc theo môn học và Xóa
        let filtered_st101 = list_student_notes_in_db(&conn, None, Some("ST101")).unwrap();
        assert_eq!(filtered_st101.len(), 1);
        assert_eq!(filtered_st101[0].id, "n_cmax");

        assert!(delete_student_note_in_db(&conn, "n_min").unwrap());
        assert!(!delete_student_note_in_db(&conn, "n_min").unwrap());

        // 4. Backup & Restore Round-trip giữ nguyên Unicode & liên kết môn học (CA-090 + CA-106)
        let backup_snapshot = list_student_notes_in_db(&conn, None, None).unwrap();
        for item in &backup_snapshot {
            delete_student_note_in_db(&conn, &item.id).unwrap();
        }
        assert_eq!(list_student_notes_in_db(&conn, None, None).unwrap().len(), 0);

        let restored_count = import_student_notes_backup_in_db(&mut conn, &backup_snapshot).unwrap();
        assert_eq!(restored_count, backup_snapshot.len());

        let after_restore = list_student_notes_in_db(&conn, None, Some("ST101")).unwrap();
        assert_eq!(after_restore.len(), 1);
        assert_eq!(
            after_restore[0].subject_name.as_deref(),
            Some("Kiểm thử phần mềm")
        );

        drop(conn);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn test_student_notes_backup_count_boundary_and_duplicate_id() {
        let (root, roots) = temp_fixture_roots("student-notes-backup-count");
        let mut conn = open_db(&roots).unwrap();
        let make_note = |index: usize| StudentNoteRecord {
            id: format!("note_{index}"),
            title: "Ghi chú".to_string(),
            content: "Nội dung".to_string(),
            subject_id: None,
            subject_name: None,
            created_at: "2026-01-01".to_string(),
            updated_at: "2026-01-01".to_string(),
        };
        let valid: Vec<_> = (0..2_000).map(make_note).collect();
        assert_eq!(import_student_notes_backup_in_db(&mut conn, &valid).unwrap(), 2_000);
        let count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM student_notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count_before, 2_000);

        let mut too_many = valid.clone();
        too_many.push(make_note(2_000));
        assert!(import_student_notes_backup_in_db(&mut conn, &too_many).is_err());

        let duplicate = vec![make_note(2_001), make_note(2_001)];
        assert!(import_student_notes_backup_in_db(&mut conn, &duplicate).is_err());
        let count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM student_notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count_after, count_before);
        drop(conn);
        fs::remove_dir_all(root).unwrap();
    }
}
