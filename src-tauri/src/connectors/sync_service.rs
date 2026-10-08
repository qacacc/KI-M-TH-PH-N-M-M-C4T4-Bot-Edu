use crate::connectors::models::{CanonicalExamEntry, CanonicalScheduleEntry};
use chrono::Utc;
use rusqlite::{params, Connection};

/// Ghi toàn bộ dữ liệu lịch học, lịch thi và trạng thái vào SQLite bằng 1 Transaction duy nhất
/// Nếu có bất kỳ lỗi nào ở bất kỳ bước nào ➔ Rollback toàn bộ, giữ nguyên 100% dữ liệu cũ
pub(crate) fn sync_data_transaction(
    conn: &mut Connection,
    student_code: &str,
    source_name: &str,
    schedules: &[CanonicalScheduleEntry],
    exams: &[CanonicalExamEntry],
    batch_id: &str,
) -> Result<(usize, usize), String> {
    let fetched_at = Utc::now().to_rfc3339();
    let tx = conn
        .transaction()
        .map_err(|e| format!("Lỗi tạo transaction DB: {}", e))?;

    // 1. Chỉ xóa dữ liệu cũ của domain khi domain đó có dữ liệu mới cập nhật (Fail-safe Partial Sync)
    if !schedules.is_empty() {
        tx.execute(
            "DELETE FROM connector_schedules WHERE student_code = ?1",
            params![student_code],
        )
        .map_err(|e| format!("Lỗi xóa lịch học cũ: {}", e))?;
    }

    if !exams.is_empty() {
        tx.execute(
            "DELETE FROM connector_exams WHERE student_code = ?1",
            params![student_code],
        )
        .map_err(|e| format!("Lỗi xóa lịch thi cũ: {}", e))?;
    }

    // 2. Chèn lịch học
    for entry in schedules {
        tx.execute(
            "INSERT OR REPLACE INTO connector_schedules (id, student_code, subject_code, subject_name, weekday, start_time, end_time, room, lecturer, source, source_record_id, fetched_at, sync_batch_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                entry.id,
                entry.student_code,
                entry.subject_code,
                entry.subject_name,
                entry.weekday,
                entry.start_time,
                entry.end_time,
                entry.room,
                entry.lecturer,
                entry.source,
                entry.id,
                fetched_at,
                batch_id,
            ],
        ).map_err(|e| format!("Lỗi chèn lịch học '{}': {}", entry.subject_name, e))?;
    }

    // 3. Chèn lịch thi
    for entry in exams {
        tx.execute(
            "INSERT OR REPLACE INTO connector_exams (id, student_code, subject_code, subject_name, exam_date, start_time, duration_minutes, room, format, source, source_record_id, fetched_at, sync_batch_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                entry.id,
                entry.student_code,
                entry.subject_code,
                entry.subject_name,
                entry.exam_date,
                entry.start_time,
                entry.duration_minutes,
                entry.room,
                entry.format,
                entry.source,
                entry.id,
                fetched_at,
                batch_id,
            ],
        ).map_err(|e| format!("Lỗi chèn lịch thi '{}': {}", entry.subject_name, e))?;
    }

    // 4. Cập nhật trạng thái đồng bộ
    tx.execute(
        "INSERT INTO connector_sync_status (source_name, student_code, status, last_success_at, last_attempt_at, last_error, schedules_count, exams_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(source_name, student_code) DO UPDATE SET
           status = excluded.status,
           last_success_at = COALESCE(excluded.last_success_at, last_success_at),
           last_attempt_at = excluded.last_attempt_at,
           last_error = excluded.last_error,
           schedules_count = excluded.schedules_count,
           exams_count = excluded.exams_count",
        params![
            source_name,
            student_code,
            "ok",
            fetched_at,
            fetched_at,
            Option::<String>::None,
            schedules.len() as i64,
            exams.len() as i64,
        ],
    ).map_err(|e| format!("Lỗi ghi sync_status: {}", e))?;

    // Commit duy nhất một lần khi tất cả thành công
    tx.commit()
        .map_err(|e| format!("Lỗi commit transaction: {}", e))?;

    Ok((schedules.len(), exams.len()))
}

/// Ghi lịch học vào SQLite bằng transaction an toàn (legacy wrapper)
#[allow(dead_code)]
pub(crate) fn write_schedules_transaction(
    conn: &mut Connection,
    schedules: &[CanonicalScheduleEntry],
    student_code: &str,
    batch_id: &str,
) -> Result<usize, String> {
    let (sched_count, _) =
        sync_data_transaction(conn, student_code, "uth-portal", schedules, &[], batch_id)?;
    Ok(sched_count)
}

/// Ghi lịch thi vào SQLite (legacy wrapper)
#[allow(dead_code)]
pub(crate) fn write_exams_transaction(
    conn: &mut Connection,
    exams: &[CanonicalExamEntry],
    student_code: &str,
    batch_id: &str,
) -> Result<usize, String> {
    let (_, exam_count) =
        sync_data_transaction(conn, student_code, "uth-portal", &[], exams, batch_id)?;
    Ok(exam_count)
}

/// Cập nhật trạng thái đồng bộ trong bảng connector_sync_status
pub(crate) fn write_sync_status(
    conn: &Connection,
    source: &str,
    student_code: &str,
    status: &str,
    schedules_count: usize,
    exams_count: usize,
    error: Option<&str>,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let last_success: Option<String> = if status == "ok" {
        Some(now.clone())
    } else {
        None
    };

    conn.execute(
        "INSERT INTO connector_sync_status (source_name, student_code, status, last_success_at, last_attempt_at, last_error, schedules_count, exams_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(source_name, student_code) DO UPDATE SET
           status = excluded.status,
           last_success_at = COALESCE(excluded.last_success_at, last_success_at),
           last_attempt_at = excluded.last_attempt_at,
           last_error = excluded.last_error,
           schedules_count = excluded.schedules_count,
           exams_count = excluded.exams_count",
        params![
            source,
            student_code,
            status,
            last_success,
            now,
            error,
            schedules_count as i64,
            exams_count as i64,
        ],
    ).map_err(|e| format!("Lỗi ghi sync_status: {}", e))?;

    Ok(())
}

/// Đọc lịch học từ SQLite (offline fallback)
pub(crate) fn read_schedules_from_db(
    conn: &Connection,
    student_code: &str,
) -> Result<Vec<CanonicalScheduleEntry>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, student_code, subject_code, subject_name, weekday, start_time, end_time, room, lecturer, source
         FROM connector_schedules
         WHERE student_code = ?1
         ORDER BY weekday, start_time"
    ).map_err(|e| format!("Lỗi chuẩn bị query lịch học: {}", e))?;

    let rows = stmt
        .query_map(params![student_code], |row| {
            Ok(CanonicalScheduleEntry {
                id: row.get(0)?,
                student_code: row.get(1)?,
                subject_code: row.get(2)?,
                subject_name: row.get(3)?,
                weekday: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                room: row.get(7)?,
                lecturer: row.get(8)?,
                source: row.get(9)?,
            })
        })
        .map_err(|e| format!("Lỗi query lịch học: {}", e))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Lỗi collect lịch học: {}", e))
}

/// Đọc lịch thi từ SQLite (offline fallback)
pub(crate) fn read_exams_from_db(
    conn: &Connection,
    student_code: &str,
) -> Result<Vec<CanonicalExamEntry>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, student_code, subject_code, subject_name, exam_date, start_time, duration_minutes, room, format, source
         FROM connector_exams
         WHERE student_code = ?1
         ORDER BY exam_date, start_time"
    ).map_err(|e| format!("Lỗi chuẩn bị query lịch thi: {}", e))?;

    let rows = stmt
        .query_map(params![student_code], |row| {
            Ok(CanonicalExamEntry {
                id: row.get(0)?,
                student_code: row.get(1)?,
                subject_code: row.get(2)?,
                subject_name: row.get(3)?,
                exam_date: row.get(4)?,
                start_time: row.get(5)?,
                duration_minutes: row.get(6)?,
                room: row.get(7)?,
                format: row.get(8)?,
                source: row.get(9)?,
            })
        })
        .map_err(|e| format!("Lỗi query lịch thi: {}", e))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Lỗi collect lịch thi: {}", e))
}

/// Xóa toàn bộ dữ liệu connector của student_code (khi disconnect)
pub(crate) fn delete_connector_data(conn: &Connection, student_code: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM connector_schedules WHERE student_code = ?1",
        params![student_code],
    )
    .map_err(|e| format!("Lỗi xóa lịch học connector: {}", e))?;

    conn.execute(
        "DELETE FROM connector_exams WHERE student_code = ?1",
        params![student_code],
    )
    .map_err(|e| format!("Lỗi xóa lịch thi connector: {}", e))?;

    conn.execute(
        "DELETE FROM connector_sync_status WHERE student_code = ?1",
        params![student_code],
    )
    .map_err(|e| format!("Lỗi xóa sync_status connector: {}", e))?;

    Ok(())
}
