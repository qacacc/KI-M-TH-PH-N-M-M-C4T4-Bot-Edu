//! REST API loopback phục vụ Postman và tích hợp local của ứng dụng.

use axum::{
    body::Body,
    extract::{rejection::QueryRejection, Query, State},
    http::{header, HeaderMap, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    env,
    io::{self, Write},
    net::SocketAddr,
    sync::Arc,
    thread,
};
use subtle::ConstantTimeEq;

use crate::{connectors::connector_engine, data, documents};

pub(crate) const API_ADDR: &str = "127.0.0.1:47821";
const API_TOKEN_ENV: &str = "CAMPUS_ASSISTANT_LOCAL_API_TOKEN";
const MIN_API_TOKEN_LENGTH: usize = 32;
const MAX_API_TOKEN_LENGTH: usize = 256;

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct AcademicQuery {
    semester: Option<i64>,
    subject_id: Option<String>,
    student_code: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiError {
    code: &'static str,
    message: String,
}

fn ok(data: Value, source: &str) -> Response {
    (
        StatusCode::OK,
        Json(json!({
            "success": true,
            "data": data,
            "source": source,
            "syncedAt": null,
            "error": null
        })),
    )
        .into_response()
}

fn fail(status: StatusCode, code: &'static str, message: impl Into<String>) -> Response {
    let error = ApiError {
        code,
        message: message.into(),
    };
    (
        status,
        Json(json!({
            "success": false,
            "data": null,
            "source": null,
            "syncedAt": null,
            "error": error
        })),
    )
        .into_response()
}

fn local_data_read_failed(_details: String) -> Response {
    fail(
        StatusCode::INTERNAL_SERVER_ERROR,
        "LOCAL_DATA_READ_FAILED",
        "Không thể đọc dữ liệu cục bộ.",
    )
}

fn validation_error() -> Response {
    fail(
        StatusCode::BAD_REQUEST,
        "VALIDATION_ERROR",
        "Tham số query không hợp lệ.",
    )
}

fn parse_academic_query(
    query: Result<Query<AcademicQuery>, QueryRejection>,
) -> Result<AcademicQuery, Response> {
    query
        .map(|Query(query)| query)
        .map_err(|_| validation_error())
}

fn unauthorized() -> Response {
    let mut response = fail(
        StatusCode::UNAUTHORIZED,
        "UNAUTHORIZED",
        "Thiếu hoặc Bearer token không hợp lệ.",
    );
    response
        .headers_mut()
        .insert(header::WWW_AUTHENTICATE, HeaderValue::from_static("Bearer"));
    response
}

fn token_matches(headers: &HeaderMap, expected_token: &str) -> bool {
    let Some(value) = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
    else {
        return false;
    };
    let Some((scheme, supplied_token)) = value.split_once(' ') else {
        return false;
    };
    if !scheme.eq_ignore_ascii_case("Bearer")
        || supplied_token.is_empty()
        || supplied_token.len() > MAX_API_TOKEN_LENGTH
        || supplied_token
            .bytes()
            .any(|byte| byte.is_ascii_whitespace())
    {
        return false;
    }

    constant_time_eq(supplied_token.as_bytes(), expected_token.as_bytes())
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    if left.len() > MAX_API_TOKEN_LENGTH || right.len() > MAX_API_TOKEN_LENGTH {
        return false;
    }

    let mut left_padded = [0_u8; MAX_API_TOKEN_LENGTH];
    let mut right_padded = [0_u8; MAX_API_TOKEN_LENGTH];
    for index in 0..MAX_API_TOKEN_LENGTH {
        left_padded[index] = left.get(index).copied().unwrap_or_default();
        right_padded[index] = right.get(index).copied().unwrap_or_default();
    }
    let same_length = (left.len() as u16).ct_eq(&(right.len() as u16));
    bool::from(left_padded.ct_eq(&right_padded) & same_length)
}

async fn require_bearer_token(
    State(expected_token): State<Arc<str>>,
    request: Request<Body>,
    next: Next,
) -> Response {
    if !token_matches(request.headers(), &expected_token) {
        return unauthorized();
    }
    next.run(request).await
}

fn configured_api_token() -> Result<Arc<str>, String> {
    let token = env::var(API_TOKEN_ENV)
        .map_err(|_| format!("REST API local chưa được bật: cần cấu hình {API_TOKEN_ENV}."))?;
    validate_api_token(token)
}

fn validate_api_token(token: String) -> Result<Arc<str>, String> {
    if token.len() < MIN_API_TOKEN_LENGTH
        || token.len() > MAX_API_TOKEN_LENGTH
        || !token.is_ascii()
        || token
            .bytes()
            .any(|byte| byte.is_ascii_whitespace() || byte.is_ascii_control())
    {
        return Err(format!(
            "REST API local chưa được bật: {API_TOKEN_ENV} phải dài {MIN_API_TOKEN_LENGTH}–{MAX_API_TOKEN_LENGTH} ký tự ASCII, không chứa khoảng trắng."
        ));
    }
    Ok(Arc::from(token))
}

async fn health() -> Response {
    ok(
        json!({
            "service": "Campus Assistant Local REST API",
            "version": env!("CARGO_PKG_VERSION"),
            "transport": "loopback",
            "address": API_ADDR
        }),
        "runtime",
    )
}

async fn profile() -> Response {
    fail(
        StatusCode::NOT_FOUND,
        "PROFILE_NOT_CONNECTED",
        "Chưa có hồ sơ sinh viên đã xác minh trong cache local.",
    )
}

async fn announcements() -> Response {
    match documents::list_announcements() {
        Ok(items) => ok(json!(items), "sample-local"),
        Err(error) => local_data_read_failed(error),
    }
}

async fn documents(query: Result<Query<AcademicQuery>, QueryRejection>) -> Response {
    let query = match parse_academic_query(query) {
        Ok(query) => query,
        Err(response) => return response,
    };
    let subject_id = query.subject_id.as_deref().unwrap_or("");
    if subject_id.is_empty() {
        return fail(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "Tham số subjectId là bắt buộc.",
        );
    }
    let items = match data::load_documents() {
        Ok(items) => items
            .into_iter()
            .filter(|item| item.subject_id == subject_id)
            .filter(|item| {
                query
                    .semester
                    .is_none_or(|semester| item.semester == semester)
            })
            .collect::<Vec<_>>(),
        Err(error) => return local_data_read_failed(error),
    };
    match serde_json::to_value(items) {
        Ok(items) => return ok(items, "sample-local"),
        Err(_error) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "Đã xảy ra lỗi nội bộ.",
        ),
    }
}

async fn schedule(query: Result<Query<AcademicQuery>, QueryRejection>) -> Response {
    let query = match parse_academic_query(query) {
        Ok(query) => query,
        Err(response) => return response,
    };
    let student_code = query.student_code.as_deref().unwrap_or("");
    if student_code.is_empty() {
        return fail(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "Tham số studentCode là bắt buộc để đọc cache tài khoản.",
        );
    }
    match connector_engine::list_connector_schedules(student_code.to_string()) {
        Ok(items) => ok(json!(items), "uth-cache"),
        Err(error) => connector_failure(error),
    }
}

async fn exams(query: Result<Query<AcademicQuery>, QueryRejection>) -> Response {
    let query = match parse_academic_query(query) {
        Ok(query) => query,
        Err(response) => return response,
    };
    let student_code = query.student_code.as_deref().unwrap_or("");
    if student_code.is_empty() {
        return fail(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "Tham số studentCode là bắt buộc để đọc cache tài khoản.",
        );
    }
    match connector_engine::list_connector_exams(student_code.to_string()) {
        Ok(items) => ok(json!(items), "uth-cache"),
        Err(error) => connector_failure(error),
    }
}

fn connector_failure(error: String) -> Response {
    if error.starts_with("CONTRACT_UNVERIFIED:") {
        fail(
            StatusCode::SERVICE_UNAVAILABLE,
            "CONNECTOR_UNAVAILABLE",
            "Connector UTH chưa sẵn sàng vì contract chưa được xác minh.",
        )
    } else {
        fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "LOCAL_DATA_READ_FAILED",
            "Không thể đọc dữ liệu học tập cục bộ.",
        )
    }
}

async fn sync() -> Response {
    fail(
        StatusCode::SERVICE_UNAVAILABLE,
        "SYNC_NOT_READY",
        "Đồng bộ UTH đang bị khóa vì contract/auth chưa được xác minh.",
    )
}

async fn sync_status(query: Result<Query<AcademicQuery>, QueryRejection>) -> Response {
    let query = match parse_academic_query(query) {
        Ok(query) => query,
        Err(response) => return response,
    };
    let student_code = query.student_code.as_deref().unwrap_or("");
    if student_code.is_empty() {
        return fail(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "Tham số studentCode là bắt buộc.",
        );
    }
    match connector_engine::get_connector_sync_status(student_code.to_string()) {
        Ok(Some(status)) => ok(json!(status), "sqlite"),
        Ok(None) => fail(
            StatusCode::NOT_FOUND,
            "NO_SYNC_STATUS",
            "Chưa có trạng thái đồng bộ.",
        ),
        Err(error) => local_data_read_failed(error),
    }
}

async fn disconnect() -> Response {
    fail(
        StatusCode::NOT_IMPLEMENTED,
        "AUTH_DISCONNECT_REQUIRES_DESKTOP",
        "Ngắt phiên phải đi qua Tauri command để đóng WebView và cập nhật SQLite an toàn.",
    )
}

fn router(api_token: Arc<str>) -> Router {
    Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/profile", get(profile))
        .route("/api/v1/announcements", get(announcements))
        .route("/api/v1/documents", get(documents))
        .route("/api/v1/schedule", get(schedule))
        .route("/api/v1/exams", get(exams))
        .route("/api/v1/sync/status", get(sync_status))
        .route("/api/v1/sync", post(sync))
        .route("/api/v1/auth/disconnect", post(disconnect))
        .layer(middleware::from_fn_with_state(
            api_token,
            require_bearer_token,
        ))
}

#[derive(Debug, PartialEq, Eq)]
enum ApiStartResult {
    Disabled,
    Started,
    ThreadUnavailable,
}

fn log_startup_message(message: &str) {
    // Ghi log là best-effort; lỗi ghi stderr không được làm sập ứng dụng desktop.
    let _ = write_startup_message(io::stderr().lock(), message);
}

fn write_startup_message(mut writer: impl Write, message: &str) -> io::Result<()> {
    writeln!(writer, "{message}")
}

fn start_with_token(api_token: Result<Arc<str>, String>) -> ApiStartResult {
    let api_token = match api_token {
        Ok(token) => token,
        Err(_) => return ApiStartResult::Disabled,
    };
    let spawn_result = thread::Builder::new()
        .name("campus-local-rest-api".to_string())
        .spawn(move || {
            let runtime = match tokio::runtime::Builder::new_multi_thread()
                .enable_all()
                .build()
            {
                Ok(runtime) => runtime,
                Err(_) => {
                    log_startup_message(
                        "REST API local không thể khởi chạy; ứng dụng desktop vẫn tiếp tục.",
                    );
                    return;
                }
            };
            runtime.block_on(async {
                let address: SocketAddr = match API_ADDR.parse() {
                    Ok(address) => address,
                    Err(_) => {
                        log_startup_message(
                            "REST API local không thể khởi chạy; ứng dụng desktop vẫn tiếp tục.",
                        );
                        return;
                    }
                };
                let listener = match tokio::net::TcpListener::bind(address).await {
                    Ok(listener) => listener,
                    Err(error) => {
                        log_startup_message(listener_bind_failure_message(&error));
                        return;
                    }
                };
                if axum::serve(listener, router(api_token)).await.is_err() {
                    log_startup_message("REST API local đã dừng; ứng dụng desktop vẫn tiếp tục.");
                }
            });
        });
    if spawn_result.is_err() {
        ApiStartResult::ThreadUnavailable
    } else {
        ApiStartResult::Started
    }
}

fn listener_bind_failure_message(error: &io::Error) -> &'static str {
    if error.kind() == io::ErrorKind::AddrInUse {
        "REST API local đang được instance khác sử dụng; ứng dụng desktop vẫn tiếp tục."
    } else {
        "REST API local không thể mở cổng; ứng dụng desktop vẫn tiếp tục."
    }
}

/// Khởi động API local best-effort để lỗi cấu hình/API không chặn desktop.
pub(crate) fn start() {
    match start_with_token(configured_api_token()) {
        ApiStartResult::Disabled => {
            log_startup_message("REST API local đang tắt; ứng dụng desktop vẫn tiếp tục.");
        }
        ApiStartResult::ThreadUnavailable => {
            log_startup_message(
                "REST API local không thể khởi chạy; ứng dụng desktop vẫn tiếp tục.",
            );
        }
        ApiStartResult::Started => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Uri;

    struct FailingWriter;

    impl Write for FailingWriter {
        fn write(&mut self, _buffer: &[u8]) -> io::Result<usize> {
            Err(io::Error::new(io::ErrorKind::BrokenPipe, "closed"))
        }

        fn flush(&mut self) -> io::Result<()> {
            Err(io::Error::new(io::ErrorKind::BrokenPipe, "closed"))
        }
    }

    #[test]
    fn stderr_that_is_closed_does_not_panic_during_startup_logging() {
        let result = std::panic::catch_unwind(|| {
            write_startup_message(FailingWriter, "REST API local không thể khởi chạy.")
        });
        assert!(matches!(result, Ok(Err(error)) if error.kind() == io::ErrorKind::BrokenPipe));
    }

    #[tokio::test]
    async fn health_endpoint_tra_thong_tin_loopback() {
        let response = health().await;
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[test]
    fn bearer_token_yeu_cau_header_dung_va_so_sanh_constant_time() {
        let mut headers = HeaderMap::new();
        assert!(!token_matches(
            &headers,
            "test-token-that-is-long-enough-for-tests"
        ));

        headers.insert(
            header::AUTHORIZATION,
            HeaderValue::from_static("Basic test-token-that-is-long-enough-for-tests"),
        );
        assert!(!token_matches(
            &headers,
            "test-token-that-is-long-enough-for-tests"
        ));

        headers.insert(
            header::AUTHORIZATION,
            HeaderValue::from_static("Bearer wrong-token-value-long-enough-000000"),
        );
        assert!(!token_matches(
            &headers,
            "test-token-that-is-long-enough-for-tests"
        ));

        headers.insert(
            header::AUTHORIZATION,
            HeaderValue::from_static("Bearer test-token-that-is-long-enough-for-tests"),
        );
        assert!(token_matches(
            &headers,
            "test-token-that-is-long-enough-for-tests"
        ));
    }

    #[test]
    fn constant_time_comparison_checks_equal_different_and_length_mismatch() {
        assert!(constant_time_eq(b"secret-token", b"secret-token"));
        assert!(!constant_time_eq(b"secret-token", b"secret-tokeN"));
        assert!(!constant_time_eq(b"secret-token", b"secret-token-longer"));
    }

    #[test]
    fn thieu_token_khong_chan_desktop_startup() {
        assert_eq!(
            start_with_token(Err("token is missing".to_string())),
            ApiStartResult::Disabled
        );
    }

    #[tokio::test]
    async fn query_sai_kieu_tra_validation_error_theo_json_envelope() {
        let uri: Uri = "/api/v1/documents?semester=fall".parse().unwrap();
        let query = Query::<AcademicQuery>::try_from_uri(&uri);
        let response = parse_academic_query(query).unwrap_err();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["success"], false);
        assert_eq!(json["error"]["code"], "VALIDATION_ERROR");
        assert_eq!(json["data"], Value::Null);
    }

    #[tokio::test]
    async fn instance_thu_hai_nhan_biet_port_da_duoc_dung() {
        let first = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = first.local_addr().unwrap();
        let error = tokio::net::TcpListener::bind(address).await.unwrap_err();
        assert_eq!(error.kind(), io::ErrorKind::AddrInUse);
        assert!(listener_bind_failure_message(&error).contains("instance khác"));
        assert!(!listener_bind_failure_message(&error).contains(&error.to_string()));
    }

    #[test]
    fn api_token_config_yeu_cau_do_dai_va_ascii_khong_khoang_trang() {
        assert!(validate_api_token("a".repeat(MIN_API_TOKEN_LENGTH)).is_ok());
        assert!(validate_api_token("a".repeat(MIN_API_TOKEN_LENGTH - 1)).is_err());
        assert!(validate_api_token("a".repeat(MAX_API_TOKEN_LENGTH + 1)).is_err());
        assert!(validate_api_token(format!("{}é", "a".repeat(MIN_API_TOKEN_LENGTH))).is_err());
        assert!(validate_api_token(format!("{} ", "a".repeat(MIN_API_TOKEN_LENGTH))).is_err());
    }

    #[tokio::test]
    async fn unauthorized_response_co_header_challenge_va_envelope() {
        let response = unauthorized();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(
            response
                .headers()
                .get(header::WWW_AUTHENTICATE)
                .unwrap()
                .to_str()
                .unwrap(),
            "Bearer"
        );
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["success"], false);
        assert_eq!(json["error"]["code"], "UNAUTHORIZED");
        assert_eq!(json["data"], Value::Null);
    }

    #[tokio::test]
    async fn local_data_read_error_response_khong_lo_chi_tiet_noi_bo() {
        let response = local_data_read_failed("secret database path".to_string());
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body_text = String::from_utf8(body.to_vec()).unwrap();
        let json: Value = serde_json::from_str(&body_text).unwrap();

        assert_eq!(json["error"]["code"], "LOCAL_DATA_READ_FAILED");
        assert_eq!(json["error"]["message"], "Không thể đọc dữ liệu cục bộ.");
        assert!(!body_text.contains("secret database path"));
    }

    #[test]
    fn connector_failure_map_giu_503_cho_contract_gate_va_500_cho_loi_noi_bo() {
        assert_eq!(
            connector_failure("CONTRACT_UNVERIFIED: blocked".to_string()).status(),
            StatusCode::SERVICE_UNAVAILABLE
        );
        assert_eq!(
            connector_failure("SQLite read failed".to_string()).status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    #[tokio::test]
    async fn schedule_endpoint_tu_choi_thieu_student_code() {
        let response = schedule(Ok(Query(AcademicQuery::default()))).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn schedule_endpoint_giu_503_khi_contract_uth_chua_xac_minh() {
        let response = schedule(Ok(Query(AcademicQuery {
            student_code: Some("test-student".to_string()),
            ..AcademicQuery::default()
        })))
        .await;
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn exams_endpoint_giu_503_khi_contract_uth_chua_xac_minh() {
        let response = exams(Ok(Query(AcademicQuery {
            student_code: Some("test-student".to_string()),
            ..AcademicQuery::default()
        })))
        .await;
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn sync_endpoint_khong_gia_danh_thanh_cong() {
        let response = sync().await;
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
