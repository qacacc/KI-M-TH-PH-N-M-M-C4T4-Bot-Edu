use crate::connectors::models::{
    CanonicalExamEntry, CanonicalScheduleEntry, CanonicalStudentProfile,
};
use std::time::Duration;
use ureq::Agent;

const BASE_URL: &str = "https://portal.ut.edu.vn";
#[allow(dead_code)]
pub(crate) const UTH_LMS_BASE_URL: &str = "https://courses.ut.edu.vn";
#[allow(dead_code)]
pub(crate) const UTH_PROFILE_DETAIL_URL: &str = "https://portal.ut.edu.vn/inforDetail";

fn create_timeout_agent() -> Agent {
    let config = ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(3)))
        .timeout_connect(Some(Duration::from_secs(2)))
        .timeout_recv_response(Some(Duration::from_secs(2)))
        .build();
    Agent::new_with_config(config)
}

/// Kiểm tra JWT token còn hợp lệ không bằng cách gọi getSummaryProfile
#[allow(dead_code)]
pub(crate) fn check_uth_token_valid(jwt: &str) -> bool {
    let agent = create_timeout_agent();
    let url = format!("{}/api/v1/user/getSummaryProfile", BASE_URL);
    match agent
        .get(&url)
        .header("Authorization", &format!("Bearer {}", jwt))
        .call()
    {
        Ok(resp) => resp.status() == 200,
        Err(_) => false,
    }
}

/// Lấy hồ sơ sinh viên từ API getSummaryProfile
pub(crate) fn fetch_uth_profile(jwt: &str) -> Result<CanonicalStudentProfile, String> {
    let agent = create_timeout_agent();
    let url = format!("{}/api/v1/user/getSummaryProfile", BASE_URL);
    let mut resp = agent
        .get(&url)
        .header("Authorization", &format!("Bearer {}", jwt))
        .call()
        .map_err(|e| format!("Lỗi kết nối UTH: {}", e))?;

    let text = resp
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Lỗi đọc response: {}", e))?;

    let body: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Lỗi parse JSON: {}", e))?;

    // Trích xuất thông tin sinh viên từ response UTH Portal
    let data = body.get("data").unwrap_or(&body);
    let student_code = data
        .get("mssv")
        .or_else(|| data.get("masinhvien"))
        .or_else(|| data.get("studentId"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let display_name = data
        .get("hovaten")
        .or_else(|| data.get("name"))
        .or_else(|| data.get("fullName"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    Ok(CanonicalStudentProfile {
        school_id: "uth".to_string(),
        school_name: "Trường Đại học Giao thông vận tải TP.HCM".to_string(),
        student_code,
        display_name,
        is_authenticated: true, // Token đã được verify thật
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

/// Lấy lịch học theo tháng hiện tại từ UTH Portal
/// Endpoint: GET /api/v1/lichhoc/thang?date=YYYY-MM-DD
pub(crate) fn fetch_uth_schedule(
    jwt: &str,
    student_code: &str,
) -> Result<Vec<CanonicalScheduleEntry>, String> {
    let agent = create_timeout_agent();
    // Lấy lịch học tháng hiện tại
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let url = format!("{}/api/v1/lichhoc/thang?date={}", BASE_URL, today);

    let mut resp = agent
        .get(&url)
        .header("Authorization", &format!("Bearer {}", jwt))
        .call()
        .map_err(|e| format!("Lỗi lấy lịch học UTH: {}", e))?;

    let text = resp
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Lỗi đọc response lịch học: {}", e))?;

    let body: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Lỗi parse JSON lịch học: {}", e))?;

    let entries = body
        .get("data")
        .and_then(|d| d.as_array())
        .or_else(|| body.as_array())
        .cloned()
        .unwrap_or_default();

    let mut result = Vec::new();
    for (i, entry) in entries.iter().enumerate() {
        let subject_name = entry
            .get("tenMon")
            .or_else(|| entry.get("subjectName"))
            .or_else(|| entry.get("tenMonHoc"))
            .and_then(|v| v.as_str())
            .unwrap_or("Môn học")
            .to_string();

        let subject_code = entry
            .get("maMon")
            .or_else(|| entry.get("subjectCode"))
            .and_then(|v| v.as_str())
            .unwrap_or(&format!("UTH-{}", i))
            .to_string();

        let room = entry
            .get("phong")
            .or_else(|| entry.get("room"))
            .and_then(|v| v.as_str())
            .unwrap_or("Chưa xác định")
            .to_string();

        let start_time = entry
            .get("tietBD")
            .or_else(|| entry.get("startTime"))
            .and_then(|v| v.as_str())
            .unwrap_or("07:00")
            .to_string();

        let end_time = entry
            .get("tietKT")
            .or_else(|| entry.get("endTime"))
            .and_then(|v| v.as_str())
            .unwrap_or("09:30")
            .to_string();

        let weekday = entry
            .get("thu")
            .or_else(|| entry.get("weekday"))
            .and_then(|v| v.as_i64())
            .unwrap_or(2);

        let lecturer = entry
            .get("tenGiangVien")
            .or_else(|| entry.get("lecturer"))
            .and_then(|v| v.as_str())
            .unwrap_or("Giảng viên UTH")
            .to_string();

        result.push(CanonicalScheduleEntry {
            id: format!("uth-sch-{}-{}", student_code, i),
            student_code: student_code.to_string(),
            subject_code,
            subject_name,
            weekday,
            start_time,
            end_time,
            room,
            lecturer,
            source: "uth-portal".to_string(),
        });
    }

    Ok(result)
}

/// Lấy lịch thi từ UTH Portal (thử nhiều endpoint)
pub(crate) fn fetch_uth_exams(
    jwt: &str,
    student_code: &str,
) -> Result<Vec<CanonicalExamEntry>, String> {
    let agent = create_timeout_agent();
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let url = format!("{}/api/v1/lichhoc/thang?date={}", BASE_URL, today);

    let resp_res = agent
        .get(&url)
        .header("Authorization", &format!("Bearer {}", jwt))
        .call();

    let mut resp = match resp_res {
        Ok(r) => r,
        Err(_) => return Ok(vec![]),
    };

    let text = match resp.body_mut().read_to_string() {
        Ok(t) => t,
        Err(_) => return Ok(vec![]),
    };

    let body: serde_json::Value = match serde_json::from_str(&text) {
        Ok(b) => b,
        Err(_) => return Ok(vec![]),
    };

    // Lọc chỉ lấy các entry có type là "EXAM" nếu API có trường đó
    let entries = body
        .get("data")
        .and_then(|d| d.as_array())
        .cloned()
        .unwrap_or_default();

    let exams: Vec<CanonicalExamEntry> = entries
        .iter()
        .filter(|e| {
            e.get("loai")
                .and_then(|v| v.as_str())
                .map(|s| s.to_lowercase().contains("thi"))
                .unwrap_or(false)
        })
        .enumerate()
        .filter_map(|(i, entry)| {
            let subject_name = entry
                .get("tenMon")
                .and_then(|v| v.as_str())
                .unwrap_or("Môn thi")
                .to_string();

            let subject_code = entry
                .get("maMon")
                .and_then(|v| v.as_str())
                .unwrap_or(&format!("EXAM-{}", i))
                .to_string();

            let room = entry
                .get("phong")
                .and_then(|v| v.as_str())
                .unwrap_or("Chưa xác định")
                .to_string();

            let exam_date = match entry
                .get("ngay")
                .or_else(|| entry.get("examDate"))
                .and_then(|v| v.as_str())
            {
                Some(d) if !d.trim().is_empty() => d.to_string(),
                _ => return None, // Không tự bịa ngày thi
            };

            let start_time = entry
                .get("gioBD")
                .or_else(|| entry.get("startTime"))
                .and_then(|v| v.as_str())
                .unwrap_or("07:00")
                .to_string();

            let duration_minutes = entry
                .get("thoiLuong")
                .or_else(|| entry.get("durationMinutes"))
                .and_then(|v| v.as_i64())
                .unwrap_or(90);

            let format = entry
                .get("hinhThuc")
                .or_else(|| entry.get("format"))
                .and_then(|v| v.as_str())
                .unwrap_or("Chưa xác định")
                .to_string();

            Some(CanonicalExamEntry {
                id: format!("uth-exam-{}-{}", student_code, i),
                student_code: student_code.to_string(),
                subject_code,
                subject_name,
                exam_date,
                start_time,
                duration_minutes,
                room,
                format,
                source: "uth-portal".to_string(),
            })
        })
        .collect();

    Ok(exams)
}

/// Lấy prototype fallback (dùng khi API thật trả về rỗng)
pub(crate) fn fetch_uth_schedules_prototype(student_code: &str) -> Vec<CanonicalScheduleEntry> {
    vec![
        CanonicalScheduleEntry {
            id: format!("uth-sch-01-{}", student_code),
            student_code: student_code.to_string(),
            subject_code: "INT101".to_string(),
            subject_name: "Khai thác dữ liệu (Data Mining)".to_string(),
            weekday: 2,
            start_time: "07:00".to_string(),
            end_time: "09:30".to_string(),
            room: "A2-401 (Cơ sở 1 UTH)".to_string(),
            lecturer: "Giảng viên UTH".to_string(),
            source: "prototype-mock".to_string(),
        },
        CanonicalScheduleEntry {
            id: format!("uth-sch-02-{}", student_code),
            student_code: student_code.to_string(),
            subject_code: "INT102".to_string(),
            subject_name: "Trí tuệ nhân tạo (AI)".to_string(),
            weekday: 4,
            start_time: "13:00".to_string(),
            end_time: "15:30".to_string(),
            room: "Lab C1-203 (UTH)".to_string(),
            lecturer: "Giảng viên UTH".to_string(),
            source: "prototype-mock".to_string(),
        },
    ]
}
