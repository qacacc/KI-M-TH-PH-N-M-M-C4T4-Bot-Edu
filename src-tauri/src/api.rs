//! REST API loopback phục vụ Postman và tích hợp local của ứng dụng.

use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{net::SocketAddr, thread};

use crate::{connectors::connector_engine, data, documents};

pub(crate) const API_ADDR: &str = "127.0.0.1:47821";

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
        Err(error) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "LOCAL_DATA_READ_FAILED",
            error,
        ),
    }
}

async fn documents(query: Query<AcademicQuery>) -> Response {
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
        Err(error) => {
            return fail(
                StatusCode::INTERNAL_SERVER_ERROR,
                "LOCAL_DATA_READ_FAILED",
                error,
            )
        }
    };
    match serde_json::to_value(items) {
        Ok(items) => return ok(items, "sample-local"),
        Err(error) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "RESPONSE_SERIALIZE_FAILED",
            error.to_string(),
        ),
    }
}

async fn schedule(query: Query<AcademicQuery>) -> Response {
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
        Err(error) => fail(
            StatusCode::SERVICE_UNAVAILABLE,
            "CONNECTOR_UNAVAILABLE",
            error,
        ),
    }
}

async fn exams(query: Query<AcademicQuery>) -> Response {
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
        Err(error) => fail(
            StatusCode::SERVICE_UNAVAILABLE,
            "CONNECTOR_UNAVAILABLE",
            error,
        ),
    }
}

async fn sync() -> Response {
    fail(
        StatusCode::SERVICE_UNAVAILABLE,
        "SYNC_NOT_READY",
        "Đồng bộ UTH đang bị khóa vì contract/auth chưa được xác minh.",
    )
}

async fn sync_status(query: Query<AcademicQuery>) -> Response {
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
        Err(error) => fail(
            StatusCode::INTERNAL_SERVER_ERROR,
            "LOCAL_DATA_READ_FAILED",
            error,
        ),
    }
}

async fn disconnect() -> Response {
    fail(
        StatusCode::NOT_IMPLEMENTED,
        "AUTH_DISCONNECT_REQUIRES_DESKTOP",
        "Ngắt phiên phải đi qua Tauri command để đóng WebView và cập nhật SQLite an toàn.",
    )
}

fn router() -> Router {
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
}

/// Khởi động API local một lần khi desktop app chạy.
pub(crate) fn start() {
    thread::Builder::new()
        .name("campus-local-rest-api".to_string())
        .spawn(|| {
            let runtime = match tokio::runtime::Builder::new_multi_thread()
                .enable_all()
                .build()
            {
                Ok(runtime) => runtime,
                Err(error) => {
                    eprintln!("Không tạo được runtime REST API: {error}");
                    return;
                }
            };
            runtime.block_on(async {
                let address: SocketAddr = match API_ADDR.parse() {
                    Ok(address) => address,
                    Err(error) => {
                        eprintln!("Địa chỉ REST API không hợp lệ: {error}");
                        return;
                    }
                };
                let listener = match tokio::net::TcpListener::bind(address).await {
                    Ok(listener) => listener,
                    Err(error) => {
                        eprintln!("Không mở được REST API tại {API_ADDR}: {error}");
                        return;
                    }
                };
                if let Err(error) = axum::serve(listener, router()).await {
                    eprintln!("REST API dừng do lỗi: {error}");
                }
            });
        })
        .expect("Không tạo được thread REST API local");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn health_endpoint_tra_thong_tin_loopback() {
        let response = health().await;
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn schedule_endpoint_tu_choi_thieu_student_code() {
        let response = schedule(Query(AcademicQuery::default())).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn sync_endpoint_khong_gia_danh_thanh_cong() {
        let response = sync().await;
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }
}
