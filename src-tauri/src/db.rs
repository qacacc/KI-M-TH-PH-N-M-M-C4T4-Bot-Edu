use chrono::Utc;
use rusqlite::{params, Connection};
use std::fs;
use std::sync::{Mutex, OnceLock};
use std::time::Duration as StdDuration;

use crate::models::{ActionLogEntry, ChatMessageRecord, ChatSessionRecord, DocumentRecord};
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

/// Kiểm tra schema; ngày học trống của cache cũ là dữ liệu chưa xác minh, không phải lỗi schema.
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
             INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id) VALUES ('keep', 'S1', 'M1', 'Môn cũ', 2, '08:00', '09:00', 'uth-portal', '2026-02-20', 'old');
             INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id) VALUES ('malformed', 'S1', 'M3', 'Môn thiếu mốc tuần', 3, '08:00', '09:00', 'uth-portal', 'not-a-date', 'old');
             PRAGMA user_version = 6;",
        ).unwrap();

        ensure_db_schema(&mut conn).unwrap();

        let weeks_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_schedule_weeks'", [], |row| row.get(0)).unwrap();
        let transcript_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_transcripts'", [], |row| row.get(0)).unwrap();
        let exams_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_exams'", [], |row| row.get(0)).unwrap();
        let sync_status_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='connector_sync_status'", [], |row| row.get(0)).unwrap();
        let notes_exists: i64 = conn.query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='student_notes'", [], |row| row.get(0)).unwrap();
        let stored_subject: String = conn.query_row("SELECT subject_name FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        let legacy_date: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        let has_date_column: i64 = conn.query_row("SELECT COUNT(*) FROM pragma_table_info('connector_schedules') WHERE name='class_date'", [], |row| row.get(0)).unwrap();

        assert_eq!(weeks_exists, 1);
        assert_eq!(transcript_exists, 1);
        assert_eq!(exams_exists, 1);
        assert_eq!(sync_status_exists, 1);
        assert_eq!(notes_exists, 1);
        assert_eq!(stored_subject, "Môn cũ");
        assert_eq!(legacy_date, "");
        assert_eq!(has_date_column, 1);
        assert!(is_runtime_schema_complete(&conn));

        // Ngày có nguồn xác thực trước migration phải được giữ nguyên khi mở lại.
        conn.execute(
            "INSERT INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, source, fetched_at, sync_batch_id, class_date) VALUES ('dated', 'S1', 'M2', 'Môn có ngày', 3, '08:00', '09:00', 'uth-portal', '2026-02-20', 'old', '2026-01-20')",
            [],
        ).unwrap();
        ensure_db_schema(&mut conn).unwrap();
        let dated: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='dated'", [], |row| row.get(0)).unwrap();
        let still_unknown: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='keep'", [], |row| row.get(0)).unwrap();
        let malformed_date: String = conn.query_row("SELECT class_date FROM connector_schedules WHERE id='malformed'", [], |row| row.get(0)).unwrap();
        assert_eq!(dated, "2026-01-20");
        assert_eq!(still_unknown, "");
        assert_eq!(malformed_date, "");
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
            ).unwrap();
        }
        let valid_notes: i64 = conn.query_row("SELECT COUNT(*) FROM student_notes", [], |row| row.get(0)).unwrap();
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

        // Bước 1b: Chạy riêng chuỗi migrate_to_v2..v6; ngày học thiếu nguồn xác thực phải giữ trống.
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
            assert_eq!(migrated_class_date, ""); // fetched_at là ngày tải, không chứng minh ngày học.
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
}
