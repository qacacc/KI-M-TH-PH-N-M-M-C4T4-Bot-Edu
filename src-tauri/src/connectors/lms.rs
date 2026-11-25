use crate::db::open_db;
use crate::models::{LmsCourseRecord, LmsDocumentRecord};
use crate::paths::{directory_stats, ensure_child_path, ensure_directories, resolve_roots};
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use serde::Deserialize;
use serde_json::Value;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, Url, WebviewWindow};

const LMS_ORIGIN: &str = "https://courses.ut.edu.vn";
const LMS_MAX_PAYLOAD_BYTES: usize = 1_000_000;
const LMS_MAX_COURSES: usize = 100;
const LMS_MAX_DOCUMENTS: usize = 5_000;
const LMS_MAX_DOWNLOAD_BYTES: u64 = 5 * 1024 * 1024 * 1024;

const LMS_CAPTURE_SCRIPT: &str = r#"
(function () {
  if (window.__caLmsCaptureInstalled) return;
  window.__caLmsCaptureInstalled = true;

  const origin = 'https://courses.ut.edu.vn';
  const coursePattern = /^\/course\/view\.php$/;
  const activityPattern = /^\/mod\/(folder|resource)\/view\.php$/;
  const pluginPattern = /^\/pluginfile\.php\//;
  const cleanText = (value, max) => (value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const fileLabel = path => {
    try { return decodeURIComponent(path.split('/').pop() || ''); }
    catch (_) { return ''; }
  };
  const courseIdOf = url => {
    const id = url.searchParams.get('id');
    return id && /^\d{1,16}$/.test(id) ? id : null;
  };
  const safePath = value => {
    try {
      const url = new URL(value, location.href);
      return url.origin === origin && pluginPattern.test(url.pathname)
        ? url.pathname
        : null;
    } catch (_) { return null; }
  };
  const parseHtml = html => new DOMParser().parseFromString(html, 'text/html');
  const textFor = (doc, selectors) => {
    for (const selector of selectors) {
      const node = doc.querySelector(selector);
      const value = cleanText(node && node.textContent, 240);
      if (value) return value;
    }
    return '';
  };
  const courseName = doc => textFor(doc, [
    '#page-header h1', '.page-header-headings h1', 'main h1', 'h1'
  ]);
  const uniqueBy = (items, key) => Array.from(new Map(items.map(item => [key(item), item])).values());

  async function scan() {
    if (location.origin !== origin || window.__caLmsScanRunning) return;
    if (location.pathname !== '/my/courses.php' && !coursePattern.test(location.pathname)) return;
    window.__caLmsScanRunning = true;
    try {
      const courseLinks = Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({ url: new URL(a.href, location.href), label: cleanText(a.innerText, 240) }))
        .filter(item => item.url.origin === origin && coursePattern.test(item.url.pathname) && courseIdOf(item.url))
        .slice(0, 100);
      if (coursePattern.test(location.pathname)) {
        const current = new URL(location.href);
        if (courseIdOf(current)) courseLinks.unshift({ url: current, label: courseName(document) });
      }

      const courses = [];
      const documents = [];
      let scannedActivities = 0;
      for (const link of uniqueBy(courseLinks, item => courseIdOf(item.url))) {
        const courseId = courseIdOf(link.url);
        if (!courseId) continue;
        let page = document;
        if (link.url.pathname !== location.pathname || link.url.search !== location.search) {
          const response = await fetch(link.url.href, { credentials: 'same-origin' });
          if (!response.ok) continue;
          page = parseHtml(await response.text());
        }
        const name = courseName(page) || link.label;
        if (!name) continue;
        courses.push({ id: courseId, name });

        // Lưu theo từng course để UI không phải chờ quét hết LMS.
        if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
          await window.__TAURI_INTERNALS__.invoke('receive_lms_snapshot', {
            snapshot: { courses: courses.slice(), documents: documents.slice() }
          });
        }

        const activityLinks = Array.from(page.querySelectorAll('a[href]'))
          .map(a => ({ url: new URL(a.href, origin), label: cleanText(a.innerText, 240) }))
          .filter(item => item.url.origin === origin && activityPattern.test(item.url.pathname))
          .slice(0, 500);

        for (const activity of uniqueBy(activityLinks, item => item.url.href)) {
          if (scannedActivities >= 500) break;
          scannedActivities++;
          let activityPage = null;
          try {
            const response = await fetch(activity.url.href, {
              credentials: 'same-origin',
              method: 'GET',
              redirect: 'manual'
            });
            const locationHeader = response.headers.get('Location');
            const redirectedPath = locationHeader ? safePath(locationHeader) : safePath(response.url);
            if (redirectedPath) {
              documents.push({ courseId, name: activity.label || 'Tài liệu LMS', path: redirectedPath });
              continue;
            }
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('text/html')) {
              activityPage = parseHtml(await response.text());
            } else if (response.body) {
              await response.body.cancel();
            }
          } catch (_) { continue; }
          if (!activityPage) continue;

          for (const anchor of activityPage.querySelectorAll('a[href]')) {
            const path = safePath(anchor.href);
            if (!path) continue;
            const label = cleanText(anchor.innerText, 240) || fileLabel(path) || activity.label;
            documents.push({ courseId, name: label, path });
            if (documents.length >= 5000) break;
          }
          if (documents.length > 0 && documents.length % 25 === 0) {
            await window.__TAURI_INTERNALS__.invoke('receive_lms_snapshot', {
              snapshot: { courses: courses.slice(), documents: documents.slice() }
            });
          }
          if (documents.length >= 5000) break;
        }
      }

      const payload = { courses: uniqueBy(courses, item => item.id), documents: uniqueBy(documents, item => item.path) };
      if (!payload.courses.length) return;
      await window.__TAURI_INTERNALS__.invoke('receive_lms_snapshot', { snapshot: payload });
    } catch (_) {
      window.dispatchEvent(new CustomEvent('ca-lms-scan-error'));
    } finally {
      window.__caLmsScanRunning = false;
    }
  }

  window.__caLmsRescan = scan;
  if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
    scan();
  }
})();
"#;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LmsSnapshot {
    courses: Vec<LmsCourseInput>,
    documents: Vec<LmsDocumentInput>,
}

#[derive(Debug, Deserialize)]
struct LmsCourseInput {
    id: String,
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LmsDocumentInput {
    course_id: String,
    name: String,
    path: String,
}

fn is_allowed_lms_url(url: &Url) -> bool {
    // Cho phép document rỗng nội bộ khi WebView2 khởi tạo cửa sổ.
    if url.as_str() == "about:blank" {
        return true;
    }
    let Some(host) = url.host_str() else {
        return false;
    };
    url.scheme() == "https" && (host == "ut.edu.vn" || host.ends_with(".ut.edu.vn"))
}

fn sanitize_name(value: &str) -> Result<String, String> {
    let cleaned = value
        .chars()
        .filter(|ch| !ch.is_control())
        .map(|ch| {
            if matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') {
                '_'
            } else {
                ch
            }
        })
        .take(180)
        .collect::<String>()
        .trim()
        .trim_matches('.')
        .to_string();
    if cleaned.is_empty() || cleaned == "." || cleaned == ".." {
        return Err("LMS_FILE_NAME_INVALID".to_string());
    }
    Ok(cleaned)
}

fn validate_id(value: &str) -> Result<(), String> {
    if value.is_empty() || value.len() > 16 || !value.chars().all(|ch| ch.is_ascii_digit()) {
        return Err("LMS_COURSE_ID_INVALID".to_string());
    }
    Ok(())
}

fn validate_snapshot(snapshot: Value) -> Result<LmsSnapshot, String> {
    let bytes = serde_json::to_vec(&snapshot).map_err(|_| "LMS_SNAPSHOT_INVALID".to_string())?;
    if bytes.len() > LMS_MAX_PAYLOAD_BYTES {
        return Err("LMS_SNAPSHOT_TOO_LARGE".to_string());
    }
    let parsed: LmsSnapshot =
        serde_json::from_slice(&bytes).map_err(|_| "LMS_SNAPSHOT_INVALID".to_string())?;
    if parsed.courses.is_empty()
        || parsed.courses.len() > LMS_MAX_COURSES
        || parsed.documents.len() > LMS_MAX_DOCUMENTS
    {
        return Err("LMS_SNAPSHOT_LIMIT_EXCEEDED".to_string());
    }
    let mut course_ids = std::collections::HashSet::new();
    for course in &parsed.courses {
        validate_id(&course.id)?;
        sanitize_name(&course.name)?;
        course_ids.insert(course.id.as_str());
    }
    for document in &parsed.documents {
        validate_id(&document.course_id)?;
        if !course_ids.contains(document.course_id.as_str()) {
            return Err("LMS_DOCUMENT_COURSE_UNKNOWN".to_string());
        }
        sanitize_name(&document.name)?;
        validate_plugin_path(&document.path)?;
    }
    Ok(parsed)
}

fn persist_lms_snapshot(
    conn: &mut rusqlite::Connection,
    courses: &[(String, String)],
    documents: &[(String, String, String, String)],
) -> Result<(), String> {
    let tx = conn
        .transaction()
        .map_err(|_| "Không tạo được transaction LMS.".to_string())?;
    let now = Utc::now().to_rfc3339();
    for (id, name) in courses {
        tx.execute(
            "INSERT INTO lms_courses(course_id, name, updated_at) VALUES (?1, ?2, ?3)
             ON CONFLICT(course_id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at",
            params![id, name, now],
        )
        .map_err(|_| "Không lưu được course LMS.".to_string())?;
    }
    for (id, course_id, name, path) in documents {
        tx.execute(
            "INSERT INTO lms_documents(document_id, course_id, name, source_path, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(document_id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at",
            params![id, course_id, name, path, now],
        )
        .map_err(|_| "Không lưu được metadata tài liệu LMS.".to_string())?;
    }
    tx.commit()
        .map_err(|_| "Không hoàn tất được transaction LMS.".to_string())?;
    Ok(())
}

fn validate_plugin_path(path: &str) -> Result<String, String> {
    let lower_path = path.to_ascii_lowercase();
    if path.len() > 4096
        || !path.starts_with("/pluginfile.php/")
        || path.contains(['?', '#', '\\'])
        || path
            .split('/')
            .any(|segment| segment == "." || segment == "..")
        || ["%2e", "%2f", "%5c"]
            .iter()
            .any(|encoded| lower_path.contains(encoded))
    {
        return Err("LMS_FILE_PATH_REJECTED".to_string());
    }
    let parsed = Url::parse(&format!("{LMS_ORIGIN}{path}"))
        .map_err(|_| "LMS_FILE_PATH_REJECTED".to_string())?;
    if parsed.host_str() != Some("courses.ut.edu.vn")
        || parsed.scheme() != "https"
        || !parsed.path().starts_with("/pluginfile.php/")
        || parsed
            .path_segments()
            .map(|mut parts| parts.any(|part| part == ".." || part == "."))
            .unwrap_or(true)
    {
        return Err("LMS_FILE_PATH_REJECTED".to_string());
    }
    Ok(parsed.path().to_string())
}

fn document_id(course_id: &str, path: &str) -> String {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in format!("{course_id}:{path}").bytes() {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("lms-{hash:016x}")
}

#[tauri::command]
pub async fn open_lms_window(app: AppHandle) -> Result<(), String> {
    use tauri::WebviewWindowBuilder;

    if let Some(existing) = app.get_webview_window("lms-login") {
        let current_url = existing.url().ok();
        if current_url
            .as_ref()
            .is_none_or(|url| url.as_str() == "about:blank")
        {
            let start = Url::parse("https://courses.ut.edu.vn/my/courses.php")
                .map_err(|_| "LMS_START_URL_INVALID".to_string())?;
            existing
                .navigate(start)
                .map_err(|_| "Không điều hướng được WebView trắng tới Courses.".to_string())?;
        }
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }
    let start = Url::parse("https://courses.ut.edu.vn/my/courses.php")
        .map_err(|_| "LMS_START_URL_INVALID".to_string())?;
    let app_for_events = app.clone();
    WebviewWindowBuilder::new(&app, "lms-login", tauri::WebviewUrl::External(start))
        .title("Course và học liệu LMS — Campus Assistant")
        .on_navigation(is_allowed_lms_url)
        .on_page_load(|webview, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Finished
                && payload.url().host_str() == Some("courses.ut.edu.vn")
            {
                let _ = webview.eval(LMS_CAPTURE_SCRIPT);
            }
        })
        .on_download(move |webview, event| {
            handle_lms_download(&app_for_events, webview.label(), event)
        })
        .inner_size(1080.0, 760.0)
        .min_inner_size(820.0, 600.0)
        .resizable(true)
        .visible(true)
        .center()
        .build()
        .map(|_| ())
        .map_err(|_| "Không mở được cửa sổ LMS.".to_string())
}

#[tauri::command]
pub async fn rescan_lms_courses(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("lms-login")
        .ok_or_else(|| "Mở LMS và đăng nhập trước khi quét course.".to_string())?;
    let current = window
        .url()
        .map_err(|_| "LMS_SOURCE_URL_UNAVAILABLE".to_string())?;
    if current.host_str() != Some("courses.ut.edu.vn")
        || !matches!(current.path(), "/my/courses.php" | "/course/view.php")
    {
        let target = Url::parse("https://courses.ut.edu.vn/my/courses.php")
            .map_err(|_| "LMS_START_URL_INVALID".to_string())?;
        window
            .navigate(target)
            .map_err(|_| "Không điều hướng được về danh sách course LMS.".to_string())?;
        return Ok(());
    }
    window
        .eval("if (window.__caLmsRescan) window.__caLmsRescan();")
        .map_err(|_| "Không chạy lại được quét LMS.".to_string())
}

#[tauri::command]
pub fn receive_lms_snapshot(
    app: AppHandle,
    window: WebviewWindow,
    snapshot: Value,
) -> Result<(), String> {
    let url = window
        .url()
        .map_err(|_| "LMS_SOURCE_URL_UNAVAILABLE".to_string())?;
    if window.label() != "lms-login"
        || url.scheme() != "https"
        || url.host_str() != Some("courses.ut.edu.vn")
        || !matches!(url.path(), "/my/courses.php" | "/course/view.php")
    {
        return Err("LMS_SOURCE_ORIGIN_REJECTED".to_string());
    }
    let parsed = validate_snapshot(snapshot)?;

    let mut courses = Vec::with_capacity(parsed.courses.len());
    for course in parsed.courses {
        validate_id(&course.id)?;
        let name = sanitize_name(&course.name)?;
        courses.push((course.id, name));
    }
    let known_courses = courses
        .iter()
        .map(|(id, _)| id.as_str())
        .collect::<std::collections::HashSet<_>>();
    let mut documents = Vec::with_capacity(parsed.documents.len());
    for document in parsed.documents {
        validate_id(&document.course_id)?;
        if !known_courses.contains(document.course_id.as_str()) {
            return Err("LMS_DOCUMENT_COURSE_UNKNOWN".to_string());
        }
        let name = sanitize_name(&document.name)?;
        let path = validate_plugin_path(&document.path)?;
        let id = document_id(&document.course_id, &path);
        documents.push((id, document.course_id, name, path));
    }

    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let mut conn = open_db(&roots)?;
    persist_lms_snapshot(&mut conn, &courses, &documents)?;
    let _ = app.emit("lms-snapshot-updated", (courses.len(), documents.len()));
    Ok(())
}

#[tauri::command]
pub fn list_lms_courses() -> Result<Vec<LmsCourseRecord>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let mut statement = conn
        .prepare("SELECT course_id, name, updated_at FROM lms_courses ORDER BY name COLLATE NOCASE")
        .map_err(|_| "Không đọc được course LMS.".to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(LmsCourseRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })
        .map_err(|_| "Không đọc được course LMS.".to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|_| "Không đọc được course LMS.".to_string())
}

#[tauri::command]
pub fn list_lms_documents() -> Result<Vec<LmsDocumentRecord>, String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let expired_download = (Utc::now() - chrono::Duration::minutes(10)).to_rfc3339();
    let _ = conn.execute(
        "UPDATE lms_documents SET status = 'available' WHERE status = 'downloading' AND updated_at < ?1",
        params![expired_download],
    );
    let mut statement = conn
        .prepare(
            "SELECT d.document_id, d.course_id, c.name, d.name, d.source_path, d.local_path,
                d.size_bytes, d.status, d.updated_at
         FROM lms_documents d JOIN lms_courses c ON c.course_id = d.course_id
         ORDER BY c.name COLLATE NOCASE, d.name COLLATE NOCASE",
        )
        .map_err(|_| "Không đọc được tài liệu LMS.".to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(LmsDocumentRecord {
                id: row.get(0)?,
                course_id: row.get(1)?,
                course_name: row.get(2)?,
                name: row.get(3)?,
                source_path: row.get(4)?,
                local_path: row.get(5)?,
                size_bytes: row.get(6)?,
                status: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|_| "Không đọc được tài liệu LMS.".to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|_| "Không đọc được tài liệu LMS.".to_string())
}

#[tauri::command]
pub async fn download_lms_document(app: AppHandle, document_id: String) -> Result<(), String> {
    if !document_id.starts_with("lms-") || document_id.len() != 20 {
        return Err("LMS_DOCUMENT_ID_INVALID".to_string());
    }
    let Some(window) = app.get_webview_window("lms-login") else {
        open_lms_window(app.clone()).await?;
        return Err(
            "Cửa sổ Courses đã mở. Đăng nhập LMS trong cửa sổ đó rồi nhấn Tải lại tài liệu."
                .to_string(),
        );
    };
    let current_url = window
        .url()
        .map_err(|_| "Không kiểm tra được phiên LMS hiện tại.".to_string())?;
    if current_url.host_str() != Some("courses.ut.edu.vn") {
        let start = Url::parse("https://courses.ut.edu.vn/my/courses.php")
            .map_err(|_| "LMS_START_URL_INVALID".to_string())?;
        window
            .navigate(start)
            .map_err(|_| "Không điều hướng được cửa sổ LMS.".to_string())?;
        return Err(
            "Đã đưa cửa sổ Courses về LMS. Đăng nhập rồi nhấn Tải lại tài liệu.".to_string(),
        );
    }
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let record: Option<(String, String)> = conn
        .query_row(
            "SELECT source_path, status FROM lms_documents WHERE document_id = ?1",
            params![document_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|_| "Không đọc được tài liệu LMS.".to_string())?;
    let (path, status) = record.ok_or_else(|| "Không tìm thấy tài liệu LMS.".to_string())?;
    if status == "downloading" {
        return Err("Tệp này đang được tải.".to_string());
    }
    if status == "downloaded" {
        return Err("Tệp đã có trong thư mục Downloads của ứng dụng.".to_string());
    }
    let path = validate_plugin_path(&path)?;
    conn.execute(
        "UPDATE lms_documents SET status = 'downloading', updated_at = ?1 WHERE document_id = ?2",
        params![Utc::now().to_rfc3339(), document_id],
    )
    .map_err(|_| "Không cập nhật được trạng thái tải LMS.".to_string())?;
    let target = format!("{LMS_ORIGIN}{path}?forcedownload=1");
    let script = format!(
        "window.location.href = {};",
        serde_json::to_string(&target).unwrap_or_default()
    );
    if window.eval(&script).is_err() {
        let _ = conn.execute(
            "UPDATE lms_documents SET status = 'available' WHERE document_id = ?1",
            params![document_id],
        );
        return Err("Không gửi được yêu cầu tải trong phiên LMS.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn open_lms_document(document_id: String) -> Result<(), String> {
    if !document_id.starts_with("lms-") || document_id.len() != 20 {
        return Err("LMS_DOCUMENT_ID_INVALID".to_string());
    }
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    let conn = open_db(&roots)?;
    let local_path: Option<String> = conn
        .query_row(
            "SELECT local_path FROM lms_documents WHERE document_id = ?1 AND status = 'downloaded'",
            params![document_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|_| "Không đọc được đường dẫn tài liệu LMS.".to_string())?
        .flatten();
    let local_path = local_path.ok_or_else(|| "Tài liệu chưa được tải về local.".to_string())?;
    let file = roots.workspace.join(local_path);
    ensure_child_path(&roots.downloads, &file)?;
    if !file.is_file() {
        return Err("Tệp đã tải không còn tồn tại trong Downloads.".to_string());
    }
    opener::open(file).map_err(|_| "Không mở được tệp bằng ứng dụng mặc định.".to_string())
}

fn handle_lms_download(
    app: &AppHandle,
    window_label: &str,
    event: tauri::webview::DownloadEvent<'_>,
) -> bool {
    match event {
        tauri::webview::DownloadEvent::Requested { url, destination } => {
            if window_label != "lms-login"
                || url.scheme() != "https"
                || url.host_str() != Some("courses.ut.edu.vn")
                || !url.path().starts_with("/pluginfile.php/")
            {
                return false;
            }
            let Ok(roots) = resolve_roots() else {
                return false;
            };
            if ensure_directories(&roots).is_err() {
                return false;
            }
            let Ok(conn) = open_db(&roots) else {
                return false;
            };
            let Ok(Some((id, name))) = conn.query_row(
                "SELECT document_id, name FROM lms_documents WHERE source_path = ?1 AND status = 'downloading' LIMIT 1",
                params![url.path()], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            ).optional() else { return false; };
            let Ok(name) = sanitize_name(&name) else {
                let _ = conn.execute(
                    "UPDATE lms_documents SET status = 'available' WHERE document_id = ?1",
                    params![id],
                );
                return false;
            };
            let file_name = format!("{id}_{name}");
            let target: PathBuf = roots.downloads.join(file_name);
            if target.exists() || ensure_child_path(&roots.downloads, &target).is_err() {
                let _ = conn.execute(
                    "UPDATE lms_documents SET status = 'available' WHERE document_id = ?1",
                    params![id],
                );
                return false;
            }
            *destination = target;
            true
        }
        tauri::webview::DownloadEvent::Finished { url, path, success } => {
            if window_label != "lms-login"
                || url.scheme() != "https"
                || url.host_str() != Some("courses.ut.edu.vn")
                || !url.path().starts_with("/pluginfile.php/")
            {
                return false;
            }
            let Ok(roots) = resolve_roots() else {
                return false;
            };
            let Ok(mut conn) = open_db(&roots) else {
                return false;
            };
            let Ok(Some((id, name))) = conn.query_row(
                "SELECT document_id, name FROM lms_documents WHERE source_path = ?1 AND status = 'downloading' LIMIT 1",
                params![url.path()], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            ).optional() else { return false; };
            let mut status = if success { "available" } else { "error" };
            let mut local_path = None;
            let mut size = 0u64;
            if success {
                if let Some(file) = path.filter(|candidate| candidate.exists()) {
                    if ensure_child_path(&roots.downloads, &file).is_ok() {
                        if let Ok(metadata) = file.metadata() {
                            size = metadata.len();
                            let current_size = directory_stats(&roots.downloads)
                                .map(|(_, total)| total)
                                .unwrap_or(u64::MAX);
                            if size > 0 && current_size <= LMS_MAX_DOWNLOAD_BYTES {
                                status = "downloaded";
                                local_path = Some(format!(
                                    "downloads/{}_{}",
                                    id,
                                    sanitize_name(&name).unwrap_or_default()
                                ));
                            } else {
                                let _ = std::fs::remove_file(&file);
                                status = "error";
                            }
                        }
                    }
                }
            }
            if let Ok(tx) = conn.transaction() {
                let _ = tx.execute(
                    "UPDATE lms_documents SET status = ?1, local_path = ?2, size_bytes = ?3, updated_at = ?4 WHERE document_id = ?5",
                    params![status, local_path, if status == "downloaded" { size as i64 } else { 0 }, Utc::now().to_rfc3339(), id],
                );
                let _ = tx.commit();
            }
            let _ = app.emit("lms-snapshot-updated", (0usize, 0usize));
            true
        }
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lms_paths_reject_non_plugin_and_traversal() {
        assert!(validate_plugin_path("/pluginfile.php/123/file.pdf").is_ok());
        assert!(validate_plugin_path("/pluginfile.php/123/../secret").is_err());
        assert!(validate_plugin_path("/pluginfile.php/123/%2e%2e/secret").is_err());
        assert!(validate_plugin_path("https://attacker.invalid/pluginfile.php/a").is_err());
        assert!(validate_plugin_path("/mod/resource/view.php?id=1").is_err());
    }

    #[test]
    fn lms_course_id_boundary_accepts_one_to_sixteen_digits_only() {
        assert!(validate_id("1").is_ok());
        assert!(validate_id("1234567890123456").is_ok());
        assert!(validate_id("").is_err());
        assert!(validate_id("12345678901234567").is_err());
        assert!(validate_id("12a").is_err());
    }

    #[test]
    fn lms_snapshot_course_count_accepts_limit_and_rejects_limit_plus_one() {
        let make_snapshot = |count: usize| {
            let courses = (0..count)
                .map(|id| serde_json::json!({ "id": id.to_string(), "name": format!("Môn {id}") }))
                .collect::<Vec<_>>();
            serde_json::json!({ "courses": courses, "documents": [] })
        };
        assert!(validate_snapshot(make_snapshot(LMS_MAX_COURSES)).is_ok());
        assert_eq!(
            validate_snapshot(make_snapshot(LMS_MAX_COURSES + 1)).unwrap_err(),
            "LMS_SNAPSHOT_LIMIT_EXCEEDED"
        );
    }

    #[test]
    fn lms_snapshot_payload_accepts_exact_byte_limit_and_rejects_one_more() {
        let empty_name = serde_json::json!({
            "courses": [{ "id": "1", "name": "" }],
            "documents": []
        });
        let overhead = serde_json::to_vec(&empty_name).unwrap().len();
        let exact_name_len = LMS_MAX_PAYLOAD_BYTES - overhead;
        let make_snapshot = |name_len: usize| serde_json::json!({
            "courses": [{ "id": "1", "name": "a".repeat(name_len) }],
            "documents": []
        });
        assert_eq!(
            serde_json::to_vec(&make_snapshot(exact_name_len)).unwrap().len(),
            LMS_MAX_PAYLOAD_BYTES
        );
        assert!(validate_snapshot(make_snapshot(exact_name_len)).is_ok());
        assert_eq!(
            validate_snapshot(make_snapshot(exact_name_len + 1)).unwrap_err(),
            "LMS_SNAPSHOT_TOO_LARGE"
        );
    }

    #[test]
    fn lms_snapshot_document_count_accepts_limit_and_rejects_limit_plus_one() {
        let make_snapshot = |count: usize| {
            let documents = (0..count)
                .map(|index| serde_json::json!({
                    "courseId": "1",
                    "name": format!("Tệp {index}"),
                    "path": format!("/pluginfile.php/1/{index}.pdf")
                }))
                .collect::<Vec<_>>();
            serde_json::json!({ "courses": [{ "id": "1", "name": "Môn" }], "documents": documents })
        };
        assert!(validate_snapshot(make_snapshot(LMS_MAX_DOCUMENTS)).is_ok());
        assert_eq!(
            validate_snapshot(make_snapshot(LMS_MAX_DOCUMENTS + 1)).unwrap_err(),
            "LMS_SNAPSHOT_LIMIT_EXCEEDED"
        );
    }

    #[test]
    fn lms_path_accepts_max_length_and_rejects_max_plus_one() {
        let prefix = "/pluginfile.php/1/";
        let exact = format!("{prefix}{}", "a".repeat(4096 - prefix.len()));
        let over = format!("{exact}a");
        assert!(validate_plugin_path(&exact).is_ok());
        assert!(validate_plugin_path(&over).is_err());
    }

    #[test]
    fn lms_navigation_only_allows_https_uth_login_domains() {
        assert!(is_allowed_lms_url(&Url::parse("about:blank").unwrap()));
        assert!(is_allowed_lms_url(
            &Url::parse("https://courses.ut.edu.vn/my/courses.php").unwrap()
        ));
        assert!(is_allowed_lms_url(
            &Url::parse("https://sso.ut.edu.vn/login").unwrap()
        ));
        assert!(is_allowed_lms_url(
            &Url::parse("https://cas.ut.edu.vn/login").unwrap()
        ));
        assert!(!is_allowed_lms_url(
            &Url::parse("https://ut.edu.vn.attacker.example/login").unwrap()
        ));
        assert!(!is_allowed_lms_url(
            &Url::parse("http://courses.ut.edu.vn/my/courses.php").unwrap()
        ));
        assert!(!is_allowed_lms_url(
            &Url::parse("https://evil.example/courses.ut.edu.vn").unwrap()
        ));
    }

    #[test]
    fn lms_names_are_safe_for_managed_downloads() {
        assert_eq!(
            sanitize_name("lecture/../file.pdf").unwrap(),
            "lecture_.._file.pdf"
        );
        assert_eq!(sanitize_name("../").unwrap(), "_");
        assert!(sanitize_name("\u{0000}").is_err());
    }

    #[test]
    fn lms_document_ids_are_deterministic_and_course_scoped() {
        assert_eq!(
            document_id("314", "/pluginfile.php/1/a.pdf"),
            document_id("314", "/pluginfile.php/1/a.pdf")
        );
        assert_ne!(
            document_id("314", "/pluginfile.php/1/a.pdf"),
            document_id("315", "/pluginfile.php/1/a.pdf")
        );
    }

    #[test]
    fn lms_snapshot_validates_course_scope_and_only_plugin_paths() {
        let good = serde_json::json!({
            "courses": [{"id": "123", "name": "Môn học"}],
            "documents": [{"courseId": "123", "name": "Bài giảng.pdf", "path": "/pluginfile.php/1/lecture.pdf"}]
        });
        assert!(validate_snapshot(good).is_ok());

        let unknown_course = serde_json::json!({
            "courses": [{"id": "123", "name": "Môn học"}],
            "documents": [{"courseId": "124", "name": "Bài giảng.pdf", "path": "/pluginfile.php/1/lecture.pdf"}]
        });
        assert_eq!(
            validate_snapshot(unknown_course).unwrap_err(),
            "LMS_DOCUMENT_COURSE_UNKNOWN"
        );

        let non_file = serde_json::json!({
            "courses": [{"id": "123", "name": "Môn học"}],
            "documents": [{"courseId": "123", "name": "Link", "path": "/mod/resource/view.php?id=1"}]
        });
        assert_eq!(
            validate_snapshot(non_file).unwrap_err(),
            "LMS_FILE_PATH_REJECTED"
        );
    }

    #[test]
    fn lms_capture_script_never_reads_session_secrets() {
        assert!(LMS_CAPTURE_SCRIPT.contains("/my/courses.php"));
        assert!(LMS_CAPTURE_SCRIPT.contains("pluginPattern"));
        assert!(LMS_CAPTURE_SCRIPT.contains("receive_lms_snapshot"));
        assert!(!LMS_CAPTURE_SCRIPT.contains("localStorage"));
        assert!(!LMS_CAPTURE_SCRIPT.contains("sessionStorage"));
        assert!(!LMS_CAPTURE_SCRIPT.contains("document.cookie"));
        assert!(!LMS_CAPTURE_SCRIPT.contains("Authorization"));
    }

    #[test]
    fn lms_snapshot_upsert_preserves_downloaded_file_state() {
        let mut conn = rusqlite::Connection::open_in_memory().unwrap();
        crate::db::ensure_db_schema(&mut conn).unwrap();
        let course = vec![("123".to_string(), "Môn A".to_string())];
        let path = "/pluginfile.php/1/lecture.pdf".to_string();
        let id = document_id("123", &path);
        let document = vec![(
            id.clone(),
            "123".to_string(),
            "Bài giảng.pdf".to_string(),
            path,
        )];
        persist_lms_snapshot(&mut conn, &course, &document).unwrap();
        conn.execute(
            "UPDATE lms_documents SET status = 'downloaded', local_path = 'downloads/local.pdf', size_bytes = 12 WHERE document_id = ?1",
            params![id],
        )
        .unwrap();
        persist_lms_snapshot(
            &mut conn,
            &[("123".to_string(), "Môn A cập nhật".to_string())],
            &[(
                id.clone(),
                "123".to_string(),
                "Bài giảng đổi tên.pdf".to_string(),
                "/pluginfile.php/1/lecture.pdf".to_string(),
            )],
        )
        .unwrap();
        let row: (String, String, i64) = conn
            .query_row(
                "SELECT status, local_path, size_bytes FROM lms_documents WHERE document_id = ?1",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(
            row,
            (
                "downloaded".to_string(),
                "downloads/local.pdf".to_string(),
                12
            )
        );
    }
}
