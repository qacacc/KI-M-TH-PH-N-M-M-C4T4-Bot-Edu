use std::fs;
use std::path::{Component, Path, PathBuf};

#[derive(Debug)]
pub(crate) struct Roots {
    pub(crate) app_local_data: PathBuf,
    pub(crate) db_path: PathBuf,
    pub(crate) workspace: PathBuf,
    pub(crate) sample_documents: PathBuf,
    pub(crate) downloads: PathBuf,
}

pub(crate) fn resolve_roots() -> Result<Roots, String> {
    let app_base = dirs::data_local_dir()
        .ok_or_else(|| "Không xác định được thư mục dữ liệu local.".to_string())?
        .join("CampusAssistant")
        .join("AppLocalData");
    let documents_base = dirs::document_dir()
        .ok_or_else(|| "Không xác định được thư mục Documents.".to_string())?
        .join("CampusAssistant");

    Ok(roots_from_bases(app_base, documents_base))
}

pub(crate) fn roots_from_bases(app_base: PathBuf, documents_base: PathBuf) -> Roots {
    Roots {
        db_path: app_base.join("database").join("campus-assistant.db"),
        app_local_data: app_base,
        sample_documents: documents_base.join("sample-documents"),
        downloads: documents_base.join("downloads"),
        workspace: documents_base,
    }
}

pub(crate) fn ensure_directories(roots: &Roots) -> Result<(), String> {
    for dir in [
        roots.app_local_data.join("database"),
        roots.app_local_data.join("settings"),
        roots.app_local_data.join("sessions"),
        roots.app_local_data.join("logs"),
        roots.sample_documents.clone(),
        roots.workspace.join("managed-files"),
        roots.downloads.clone(),
    ] {
        fs::create_dir_all(dir)
            .map_err(|_| "Không tạo được thư mục dữ liệu ứng dụng.".to_string())?;
    }
    Ok(())
}

pub(crate) fn ensure_safe_relative_path(
    relative_path: &str,
    required_prefix: &str,
) -> Result<(), String> {
    let path = Path::new(relative_path);
    if path.is_absolute() {
        return Err("Đường dẫn tuyệt đối không được phép.".to_string());
    }
    if !path.starts_with(required_prefix) {
        return Err("Đường dẫn không nằm trong vùng tài liệu mẫu.".to_string());
    }
    for component in path.components() {
        match component {
            Component::Normal(_) => {}
            _ => return Err("Đường dẫn chứa thành phần không an toàn.".to_string()),
        }
    }
    Ok(())
}

pub(crate) fn ensure_child_path(base: &Path, child: &Path) -> Result<(), String> {
    let base = base
        .canonicalize()
        .map_err(|_| "Không xác thực được thư mục cho phép.".to_string())?;
    let candidate = if child.exists() {
        child
            .canonicalize()
            .map_err(|_| "Không xác thực được đường dẫn file.".to_string())?
    } else {
        let parent = child
            .parent()
            .ok_or_else(|| "Đường dẫn file không hợp lệ.".to_string())?
            .canonicalize()
            .map_err(|_| "Không xác thực được thư mục đích.".to_string())?;
        parent.join(
            child
                .file_name()
                .ok_or_else(|| "Tên file không hợp lệ.".to_string())?,
        )
    };

    if candidate.starts_with(&base) {
        Ok(())
    } else {
        Err("Đường dẫn nằm ngoài vùng ứng dụng quản lý.".to_string())
    }
}

pub(crate) fn directory_stats(path: &Path) -> Result<(usize, u64), String> {
    if !path.exists() {
        return Ok((0, 0));
    }

    let mut file_count = 0usize;
    let mut total_bytes = 0u64;
    let mut stack = vec![path.to_path_buf()];

    while let Some(current) = stack.pop() {
        for entry in
            fs::read_dir(&current).map_err(|_| "Không đọc được thư mục dữ liệu.".to_string())?
        {
            let entry =
                entry.map_err(|_| "Không đọc được mục trong thư mục dữ liệu.".to_string())?;
            let file_type = entry
                .file_type()
                .map_err(|_| "Không đọc được loại file.".to_string())?;
            if file_type.is_symlink() {
                continue;
            }
            if file_type.is_dir() {
                stack.push(entry.path());
            } else if file_type.is_file() {
                let metadata = entry
                    .metadata()
                    .map_err(|_| "Không đọc được metadata file.".to_string())?;
                file_count += 1;
                total_bytes += metadata.len();
            }
        }
    }

    Ok((file_count, total_bytes))
}

#[tauri::command]
pub(crate) fn open_downloads_folder() -> Result<(), String> {
    let roots = resolve_roots()?;
    ensure_directories(&roots)?;
    ensure_child_path(&roots.workspace, &roots.downloads)?;
    opener::open(&roots.downloads).map_err(|_| "Không mở được thư mục downloads.".to_string())
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("URL không hợp lệ.".to_string());
    }
    opener::open(&url).map_err(|_| "Không mở được URL trên trình duyệt.".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ensure_safe_relative_path_normal() {
        assert!(ensure_safe_relative_path("sample-documents/doc.pdf", "sample-documents").is_ok());
    }

    #[test]
    fn test_parent_traversal_rejected() {
        assert!(ensure_safe_relative_path("../outside.txt", "sample-documents").is_err());
        assert!(
            ensure_safe_relative_path("sample-documents/../outside.txt", "sample-documents")
                .is_err()
        );
    }

    #[test]
    fn test_absolute_path_rejected() {
        assert!(
            ensure_safe_relative_path("C:\\Windows\\System32\\cmd.exe", "sample-documents")
                .is_err()
        );
    }

    #[test]
    fn test_unc_path_rejected() {
        assert!(
            ensure_safe_relative_path("\\\\server\\share\\file.txt", "sample-documents").is_err()
        );
        assert!(ensure_safe_relative_path("\\\\?\\C:\\file.txt", "sample-documents").is_err());
    }

    #[test]
    fn test_ensure_child_path_outside_rejected() {
        let temp_dir = std::env::temp_dir();
        let base = temp_dir.join("base_workspace");
        let outside = temp_dir.join("outside_folder").join("file.txt");
        let _ = fs::create_dir_all(&base);
        let _ = fs::create_dir_all(outside.parent().unwrap());
        let _ = fs::write(&outside, b"secret");

        let res = ensure_child_path(&base, &outside);
        assert!(res.is_err());

        let _ = fs::remove_dir_all(base);
        let _ = fs::remove_dir_all(outside.parent().unwrap());
    }
}
