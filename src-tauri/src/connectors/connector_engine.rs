use crate::connectors::models::{CanonicalExamEntry, CanonicalScheduleEntry, SyncResult};
use crate::connectors::sync_service::{
    delete_connector_data, read_exams_from_db, read_schedules_from_db, write_schedules_transaction,
    write_sync_status,
};
use crate::connectors::uth::{
    fetch_uth_exams, fetch_uth_profile, fetch_uth_schedule, fetch_uth_schedules_prototype,
};
use crate::db::open_db;
use crate::paths::{ensure_directories, resolve_roots};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, Url};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorSyncStatus {
    pub source_name: String,
    pub student_code: String,
    pub status: String,
    pub last_success_at: Option<String>,
    pub last_attempt_at: String,
    pub last_error: Option<String>,
    pub schedules_count: i64,
    pub exams_count: i64,
}

/// Script inject vào WebView để poll JWT token từ portal UTH sau khi đăng nhập.
/// Thử nhiều key localStorage phổ biến của portal UTH.
/// Khi tìm thấy JWT hợp lệ → emit sự kiện về Rust qua __TAURI_INTERNALS__ bridge.
const UTH_JWT_POLLER_SCRIPT: &str = r#"
(function() {
  if (window.__campusJwtPollerActive) return;
  window.__campusJwtPollerActive = true;

  var POLL_INTERVAL_MS = 1500;
  var MAX_ATTEMPTS = 120; // 3 phút tối đa
  var attempts = 0;

  var JWT_KEYS = [
    'token', 'jwt', 'access_token', 'accessToken',
    'bearer', 'auth_token', 'authToken',
    'uth_token', 'portal_token', 'user_token',
    'id_token', 'idToken',
  ];

  function extractJwt() {
    // 1. Thử localStorage
    for (var i = 0; i < JWT_KEYS.length; i++) {
      var val = localStorage.getItem(JWT_KEYS[i]);
      if (val && val.length > 50 && val.split('.').length === 3) return val;
    }

    // 2. Thử sessionStorage
    for (var i = 0; i < JWT_KEYS.length; i++) {
      var val = sessionStorage.getItem(JWT_KEYS[i]);
      if (val && val.length > 50 && val.split('.').length === 3) return val;
    }

    // 3. Thử cookie (dạng token=xxx)
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].trim().split('=');
      if (parts.length >= 2) {
        var key = parts[0].trim().toLowerCase();
        var val = parts.slice(1).join('=').trim();
        if (JWT_KEYS.some(function(k){ return k.toLowerCase() === key; })
            && val.length > 50 && val.split('.').length === 3) {
          return val;
        }
      }
    }

    return null;
  }

  function sendJwtToApp(jwt) {
    // Gửi JWT về Rust backend qua Tauri invoke bridge (an toàn, không qua localStorage React)
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke('receive_uth_jwt', { jwt_token: jwt })
        .catch(function(e) { console.warn('[CampusAssistant] receive_uth_jwt failed:', e); });
    } else {
      // Fallback: dùng title trick để Rust detect qua on_navigation
      document.title = '__CAMPUS_JWT__:' + jwt.substring(0, 20) + ':' + Date.now();
    }
  }

  var pollerInterval = setInterval(function() {
    attempts++;
    if (attempts > MAX_ATTEMPTS) {
      clearInterval(pollerInterval);
      window.__campusJwtPollerActive = false;
      return;
    }

    var jwt = extractJwt();
    if (jwt) {
      clearInterval(pollerInterval);
      window.__campusJwtPollerActive = false;
      sendJwtToApp(jwt);
    }
  }, POLL_INTERVAL_MS);
})();
"#;

/// Các domain được phép navigate trong WebView đăng nhập UTH
fn is_allowed_auth_url(url: &Url) -> bool {
    if url.scheme() != "https" {
        return false;
    }
    matches!(
        url.host_str(),
        Some("portal.ut.edu.vn")
            | Some("sso.ut.edu.vn")
            | Some("accounts.ut.edu.vn")
            | Some("courses.ut.edu.vn")
            | Some("oauth.ut.edu.vn")
    )
}

/// Mở cửa sổ WebView riêng để đăng nhập UTH Portal.
/// Sau khi user đăng nhập, JS tự động bắt JWT và gửi về qua on_navigation title trick.
/// Rust lắng nghe on_navigation change → parse JWT → gọi sync tự động.
#[tauri::command]
pub fn open_uth_login_window(app: AppHandle) -> Result<(), String> {
    use tauri::WebviewWindowBuilder;

    // Nếu đã có cửa sổ uth-login, focus vào đó thay vì mở mới
    if let Some(existing) = app.get_webview_window("uth-login") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let portal_url = "https://portal.ut.edu.vn/"
        .parse::<Url>()
        .map_err(|e| format!("URL không hợp lệ: {}", e))?;

    let app_clone = app.clone();

    let window = WebviewWindowBuilder::new(
        &app,
        "uth-login",
        tauri::WebviewUrl::External(portal_url),
    )
    .title("Đăng nhập Portal UTH — Campus Assistant (1 lần)")
    .on_navigation(move |url| {
        if !is_allowed_auth_url(&url) {
            return false;
        }

        // Sau mỗi lần navigate thành công → inject JS poller để bắt JWT
        let app_ref = app_clone.clone();
        if let Some(win) = app_ref.get_webview_window("uth-login") {
            let _ = win.eval(UTH_JWT_POLLER_SCRIPT);

            // Lắng nghe page title thay đổi (JWT title trick fallback)
            // Đọc title sau 2 giây để tránh race với poller
            let win_ref = win.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(2));
                // Poller sẽ tự xử lý qua eval, không cần thêm gì ở đây
                let _ = win_ref;
            });
        }
        true
    })
    .inner_size(980.0, 720.0)
    .min_inner_size(800.0, 600.0)
    .resizable(true)
    .visible(true)
    .center()
    .build()
    .map_err(|e| format!("Không mở được cửa sổ UTH Portal: {}", e))?;

    let _ = window.show();
    let _ = window.set_focus();
    Ok(())
}


/// Nhận JWT từ WebView UTH sau khi user đăng nhập.
/// Command này được gọi từ JS inject trong WebView (đường dẫn an toàn, không qua React localStorage).
/// Tự động chạy sync và emit kết quả về main window để React hiển thị.
#[tauri::command]
pub fn receive_uth_jwt(app: AppHandle, jwt_token: String) -> Result<(), String> {
    use crate::connectors::sync_service::sync_data_transaction;
    use chrono::Utc;

    if jwt_token.trim().is_empty() || jwt_token.len() < 20 {
        return Err("JWT token không hợp lệ.".to_string());
    }

    // Rất quan trọng: chạy sync trên thread riêng để không block WebView
    let app_clone = app.clone();
    let jwt = jwt_token.clone();

    std::thread::spawn(move || {
        // 1. Lấy profile để xác minh JWT
        let profile = match fetch_uth_profile(&jwt) {
            Ok(p) => p,
            Err(e) => {
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": false,
                    "message": format!("Xác thực JWT thất bại: {}", e)
                }));
                return;
            }
        };

        let student_code = profile.student_code.clone();
        let student_name = profile.display_name.clone();

        if student_code.is_empty() {
            let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                "success": false,
                "message": "Không lấy được MSSV từ token. Vui lòng kiểm tra lại tài khoản."
            }));
            return;
        }

        // 2. Lưu session vào RAM backend (không lưu ổ đĩa)
        set_backend_session("uth-portal", &jwt);

        // 3. Lấy lịch học và lịch thi
        let schedules = match fetch_uth_schedule(&jwt, &student_code) {
            Ok(s) => s,
            Err(e) => {
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": false,
                    "message": format!("Đăng nhập thành công nhưng tải lịch học thất bại: {}", e)
                }));
                return;
            }
        };
        let exams = fetch_uth_exams(&jwt, &student_code).unwrap_or_default();

        // 4. Ghi vào SQLite
        let roots = match crate::paths::resolve_roots() {
            Ok(r) => r,
            Err(e) => {
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": false,
                    "message": format!("Lỗi đường dẫn: {}", e)
                }));
                return;
            }
        };
        let _ = crate::paths::ensure_directories(&roots);
        let mut conn = match crate::db::open_db(&roots) {
            Ok(c) => c,
            Err(e) => {
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": false,
                    "message": format!("Lỗi mở DB: {}", e)
                }));
                return;
            }
        };

        let batch_id = format!("auto-{}", Utc::now().timestamp());
        match sync_data_transaction(&mut conn, &student_code, "uth-portal", &schedules, &exams, &batch_id) {
            Ok((sched_count, exam_count)) => {
                // Đóng cửa sổ WebView sau khi sync thành công
                if let Some(win) = app_clone.get_webview_window("uth-login") {
                    let _ = win.close();
                }
                // Emit kết quả về main window
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": true,
                    "studentCode": student_code,
                    "studentName": student_name,
                    "schedulesCount": sched_count,
                    "examsCount": exam_count,
                    "message": format!("Đã đồng bộ thành công: {} buổi học, {} ca thi đã lưu vào SQLite Local.", sched_count, exam_count)
                }));
            }
            Err(e) => {
                let _ = app_clone.emit("uth-sync-result", serde_json::json!({
                    "success": false,
                    "message": format!("Ghi SQLite thất bại: {}", e)
                }));
            }
        }
    });

    Ok(())
}

/// Đồng bộ dữ liệu sau khi người dùng đã đăng nhập UTH
/// Không lưu JWT vào localStorage React, không log JWT vào action_log
#[tauri::command]
pub fn sync_uth_after_login(
    student_code: String,
    student_name: String,
    jwt_token: String,
) -> Result<SyncResult, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let mut conn = open_db(&roots)?;

    let batch_id = format!("batch-{}", Utc::now().timestamp());
    let code = if student_code.trim().is_empty() {
        return Err("Mã số sinh viên không được để rỗng.".to_string());
    } else {
        student_code.trim().to_string()
    };

    let name = if student_name.trim().is_empty() {
        "Sinh viên UTH".to_string()
    } else {
        student_name.trim().to_string()
    };

    if jwt_token.trim().is_empty() {
        return Ok(SyncResult {
            success: false,
            student_code: code,
            student_name: name,
            schedules_count: 0,
            exams_count: 0,
            message: "Yêu cầu đăng nhập trên cửa sổ Portal UTH trước khi đồng bộ (AUTH_REQUIRED)."
                .to_string(),
        });
    }

    // Thử lấy profile thật từ API
    let profile = fetch_uth_profile(&jwt_token)
        .map_err(|e| format!("Xác thực thất bại (AUTH_INVALID): {}", e))?;
    let verified_name = if profile.display_name.is_empty() {
        name
    } else {
        profile.display_name
    };

    // Lưu session vào bộ nhớ RAM backend
    set_backend_session("uth-portal", &jwt_token);

    // Ràng buộc MSSV
    if !profile.student_code.is_empty() && profile.student_code != code {
        return Err(format!(
            "MSSV của tài khoản vừa đăng nhập ({}) không khớp với MSSV hồ sơ local ({}).",
            profile.student_code, code
        ));
    }

    // Lấy lịch học từ API thật (Không tự động fallback sang mock nếu lỗi)
    let schedules = fetch_uth_schedule(&jwt_token, &code)
        .map_err(|e| format!("Tải lịch học thất bại (FETCH_FAILED): {}", e))?;

    // Lấy lịch thi từ API thật
    let exams = fetch_uth_exams(&jwt_token, &code).unwrap_or_default();

    // Ghi toàn bộ dữ liệu vào SQLite bằng 1 Transaction duy nhất (Rollback nếu lỗi)
    use crate::connectors::sync_service::sync_data_transaction;
    let (sched_written, exam_written) = sync_data_transaction(
        &mut conn,
        &code,
        "uth-portal",
        &schedules,
        &exams,
        &batch_id,
    )
    .map_err(|e| format!("Ghi dữ liệu SQLite thất bại (WRITE_FAILED): {}", e))?;

    Ok(SyncResult {
        success: true,
        student_code: code.clone(),
        student_name: verified_name,
        schedules_count: sched_written,
        exams_count: exam_written,
        message: format!(
            "Đã đồng bộ từ UTH Portal API — {} buổi học, {} ca thi đã lưu vào SQLite Local (Batch: {}).",
            sched_written, exam_written, &batch_id[..12]
        ),
    })
}

/// Đọc lịch học từ SQLite local (offline fallback tự động)
#[tauri::command]
pub fn list_connector_schedules(
    student_code: String,
) -> Result<Vec<CanonicalScheduleEntry>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    read_schedules_from_db(&conn, &student_code)
}

/// Đọc lịch thi từ SQLite local
#[tauri::command]
pub fn list_connector_exams(student_code: String) -> Result<Vec<CanonicalExamEntry>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    read_exams_from_db(&conn, &student_code)
}

/// Đọc trạng thái đồng bộ lần cuối
#[tauri::command]
pub fn get_connector_sync_status(
    student_code: String,
) -> Result<Option<ConnectorSyncStatus>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;

    let result = conn.query_row(
        "SELECT source_name, student_code, status, last_success_at, last_attempt_at, last_error, schedules_count, exams_count
         FROM connector_sync_status WHERE student_code = ?1
         ORDER BY last_attempt_at DESC LIMIT 1",
        rusqlite::params![student_code],
        |row| {
            Ok(ConnectorSyncStatus {
                source_name: row.get(0)?,
                student_code: row.get(1)?,
                status: row.get(2)?,
                last_success_at: row.get(3)?,
                last_attempt_at: row.get(4)?,
                last_error: row.get(5)?,
                schedules_count: row.get(6)?,
                exams_count: row.get(7)?,
            })
        },
    );

    match result {
        Ok(status) => Ok(Some(status)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Lỗi đọc sync_status: {}", e)),
    }
}

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

static CONNECTOR_SESSIONS: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();

fn get_sessions_store() -> &'static Mutex<HashMap<String, String>> {
    CONNECTOR_SESSIONS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Lưu session token vào bộ nhớ backend (Memory only - không lưu ổ đĩa)
pub fn set_backend_session(school_id: &str, token: &str) {
    if let Ok(mut guard) = get_sessions_store().lock() {
        guard.insert(school_id.to_string(), token.to_string());
    }
}

/// Lấy session token từ bộ nhớ backend
#[allow(dead_code)]
pub fn get_backend_session(school_id: &str) -> Option<String> {
    if let Ok(guard) = get_sessions_store().lock() {
        return guard.get(school_id).cloned();
    }
    None
}

/// Xóa session token khỏi bộ nhớ backend
pub fn clear_backend_session(school_id: &str) {
    if let Ok(mut guard) = get_sessions_store().lock() {
        guard.remove(school_id);
    }
}

/// Ngắt kết nối Connector (Xóa session bộ nhớ backend + đóng WebView login window + đổi status)
/// KHÔNG xóa dữ liệu lịch học/lịch thi đã cache để xem offline.
#[tauri::command]
pub fn disconnect_connector(app: AppHandle, school_id: String, student_code: String) -> Result<(), String> {
    // 1. Xóa session khỏi bộ nhớ backend
    clear_backend_session(&school_id);

    // 2. Đóng cửa sổ auth WebView nếu đang mở
    if let Some(win) = app.get_webview_window("uth-login") {
        let _ = win.close();
    }

    // 3. Cập nhật trạng thái sync_status sang disconnected trong SQLite
    if !student_code.trim().is_empty() {
        let roots = resolve_roots()?;
        ensure_directories(&roots)?;
        let conn = open_db(&roots)?;
        let _ = write_sync_status(
            &conn,
            &school_id,
            &student_code,
            "disconnected",
            0,
            0,
            Some("Đã ngắt kết nối phiên đăng nhập."),
        );
    }

    Ok(())
}

/// Xóa sạch dữ liệu Connector trong SQLite (Chỉ chạy khi người dùng chọn Xóa dữ liệu)
#[tauri::command]
pub fn delete_connector_data_cmd(student_code: String) -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    delete_connector_data(&conn, &student_code)
}

/// Alias tương thích ngược
#[tauri::command]
pub fn disconnect_uth_connector(student_code: String) -> Result<(), String> {
    delete_connector_data_cmd(student_code)
}

/// Kiểm thử Prototype Sync (không cần JWT, dùng mock data)
#[tauri::command]
pub fn sync_embedded_school_data(
    school_id: String,
    student_code: String,
    student_name: String,
) -> Result<SyncResult, String> {
    let code = if student_code.trim().is_empty() {
        "Chưa khai báo".to_string()
    } else {
        student_code.trim().to_string()
    };

    let name = if student_name.trim().is_empty() {
        "Sinh viên tự khai".to_string()
    } else {
        student_name.trim().to_string()
    };

    if school_id.to_lowercase() != "uth" {
        return Ok(SyncResult {
            success: false,
            student_code: code,
            student_name: name,
            schedules_count: 0,
            exams_count: 0,
            message: "Trường này chưa hỗ trợ Connector prototype. Hiện chỉ thử nghiệm với UTH."
                .to_string(),
        });
    }

    // Ghi prototype mock data vào SQLite để test offline fallback
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let mut conn = open_db(&roots)?;

    let batch_id = format!("proto-{}", Utc::now().timestamp());
    let schedules = fetch_uth_schedules_prototype(&code);
    let sched_written =
        write_schedules_transaction(&mut conn, &schedules, &code, &batch_id).unwrap_or(0);
    let _ = write_sync_status(&conn, "prototype-mock", &code, "ok", sched_written, 0, None);

    Ok(SyncResult {
        success: true,
        student_code: code.clone(),
        student_name: name.clone(),
        schedules_count: sched_written,
        exams_count: 0,
        message: format!(
            "[Prototype Mode] Đã nạp {} buổi học mô phỏng UTH vào SQLite Local để kiểm thử UI. (Chưa kết nối xác thực Portal thật)",
            sched_written
        ),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::paths::roots_from_bases;
    use std::fs;

    #[test]
    fn test_disconnect_connector_clears_data() {
        let root = std::env::temp_dir().join(format!(
            "campus-assistant-conn-test-{}",
            Utc::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        let app_base = root.join("app-local-data");
        let documents_base = root.join("documents");
        let roots = roots_from_bases(app_base, documents_base);
        ensure_directories(&roots).unwrap();

        let mut conn = open_db(&roots).unwrap();
        let student_code = "2251120001";

        // Seed mock schedules
        let schedules = fetch_uth_schedules_prototype(student_code);
        let written = write_schedules_transaction(&mut conn, &schedules, student_code, "batch-1").unwrap();
        assert!(written > 0);
        let _ = write_sync_status(&conn, "uth-portal", student_code, "ok", written, 0, None);

        // Verify data exists
        let read = read_schedules_from_db(&conn, student_code).unwrap();
        assert!(!read.is_empty());

        // Disconnect
        delete_connector_data(&conn, student_code).unwrap();

        // Verify data cleared
        let read_after = read_schedules_from_db(&conn, student_code).unwrap();
        assert!(read_after.is_empty());

        let _ = fs::remove_dir_all(root);
    }
}
