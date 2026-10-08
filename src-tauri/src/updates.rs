use std::cmp::Ordering;

use crate::models::{UpdateCheckResult, UpdateManifest};

pub(crate) fn compare_versions(current: &str, latest: &str) -> Ordering {
    let parse = |value: &str| {
        value
            .split('.')
            .map(|part| part.parse::<u64>().unwrap_or(0))
            .collect::<Vec<_>>()
    };
    let left = parse(current);
    let right = parse(latest);
    let max_len = left.len().max(right.len());

    for index in 0..max_len {
        let a = *left.get(index).unwrap_or(&0);
        let b = *right.get(index).unwrap_or(&0);
        match a.cmp(&b) {
            Ordering::Equal => {}
            other => return other,
        }
    }
    Ordering::Equal
}

#[tauri::command]
pub(crate) fn check_for_update() -> Result<UpdateCheckResult, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();
    let Some(manifest_url) = option_env!("CAMPUS_ASSISTANT_UPDATE_MANIFEST_URL") else {
        return Ok(UpdateCheckResult {
            configured: false,
            current_version,
            latest_version: None,
            update_available: false,
            required: false,
            message: "Chưa cấu hình nguồn cập nhật. App sẽ không tự gọi mạng.".to_string(),
            download_url: None,
        });
    };

    if !manifest_url.starts_with("https://") {
        return Err("Nguồn cập nhật phải dùng HTTPS.".to_string());
    }

    let manifest: UpdateManifest = ureq::get(manifest_url)
        .call()
        .map_err(|_| "Không kiểm tra được phiên bản mới.".to_string())?
        .body_mut()
        .read_json()
        .map_err(|_| "Manifest cập nhật không hợp lệ.".to_string())?;

    let update_available = compare_versions(&current_version, &manifest.version) == Ordering::Less;
    Ok(UpdateCheckResult {
        configured: true,
        current_version,
        latest_version: Some(manifest.version),
        update_available,
        required: manifest.required.unwrap_or(false) && update_available,
        message: manifest.message.unwrap_or_else(|| {
            if update_available {
                "Có phiên bản mới. Bạn nên cập nhật để nhận sửa lỗi và cải tiến.".to_string()
            } else {
                "Bạn đang dùng phiên bản mới nhất.".to_string()
            }
        }),
        download_url: Some(manifest.download_url),
    })
}
