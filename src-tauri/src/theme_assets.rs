use base64::Engine;
use std::fs;

pub(crate) fn is_valid_image(data: &[u8], ext: &str) -> bool {
    if data.len() < 4 {
        return false;
    }
    match ext {
        "png" => data.starts_with(&[0x89, 0x50, 0x4E, 0x47]),
        "jpg" | "jpeg" => data.starts_with(&[0xFF, 0xD8, 0xFF]),
        "webp" => data.starts_with(b"RIFF") && data.len() >= 12 && &data[8..12] == b"WEBP",
        _ => false,
    }
}

#[tauri::command]
pub(crate) fn save_theme_background(
    theme_id: String,
    ext: String,
    base64_data: String,
) -> Result<String, String> {
    if theme_id.is_empty()
        || !theme_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Theme ID không hợp lệ.".to_string());
    }

    let ext_lower = ext.to_lowercase();
    if !matches!(ext_lower.as_str(), "png" | "jpg" | "jpeg" | "webp") {
        return Err("Chỉ chấp nhận đuôi ảnh png, jpg, jpeg, webp.".to_string());
    }

    if base64_data.len() > 20_000_000 {
        return Err("Kích thước dữ liệu ảnh vượt quá giới hạn 20MB.".to_string());
    }

    let decoded = base64::prelude::BASE64_STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| format!("Lỗi giải mã base64: {}", e))?;

    if decoded.len() > 10_000_000 {
        return Err("Kích thước tệp tin sau giải mã vượt quá giới hạn 10MB.".to_string());
    }

    if !is_valid_image(&decoded, &ext_lower) {
        return Err("Loại file hoặc dữ liệu ảnh không trùng khớp với phần mở rộng.".to_string());
    }

    let roots = crate::paths::resolve_roots()?;
    let themes_dir = roots.app_local_data.join("themes").join(&theme_id);
    fs::create_dir_all(&themes_dir).map_err(|e| format!("Không tạo được thư mục theme: {}", e))?;

    let final_filename = format!("bg.{}", ext_lower);
    let final_path = themes_dir.join(&final_filename);
    let tmp_path = themes_dir.join("bg.tmp");

    let write_res = (|| {
        use std::io::Write;
        let mut file = fs::File::create(&tmp_path)?;
        file.write_all(&decoded)?;
        file.flush()?;
        Ok::<(), std::io::Error>(())
    })();

    if let Err(e) = write_res {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Lỗi ghi file tạm: {}", e));
    }

    fs::rename(&tmp_path, &final_path)
        .map_err(|e| format!("Lỗi đổi tên file (atomic write): {}", e))?;

    for other_ext in &["png", "jpg", "jpeg", "webp"] {
        if *other_ext != ext_lower {
            let old_file = themes_dir.join(format!("bg.{}", other_ext));
            if old_file.exists() {
                let _ = fs::remove_file(old_file);
            }
        }
    }

    Ok(format!("themes/{}/{}", theme_id, final_filename))
}

#[tauri::command]
pub(crate) fn delete_theme_background(theme_id: String) -> Result<(), String> {
    if theme_id.is_empty()
        || !theme_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Theme ID không hợp lệ.".to_string());
    }

    let roots = crate::paths::resolve_roots()?;
    let themes_dir = roots.app_local_data.join("themes").join(&theme_id);
    if themes_dir.exists() {
        for ext in &["png", "jpg", "jpeg", "webp"] {
            let file_path = themes_dir.join(format!("bg.{}", ext));
            if file_path.exists() {
                fs::remove_file(&file_path)
                    .map_err(|e| format!("Không xóa được file background cũ: {}", e))?;
            }
        }
        if let Ok(entries) = fs::read_dir(&themes_dir) {
            if entries.count() == 0 {
                let _ = fs::remove_dir(&themes_dir);
            }
        }
    }
    Ok(())
}
