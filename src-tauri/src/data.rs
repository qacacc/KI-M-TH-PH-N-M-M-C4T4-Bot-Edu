use crate::models::{AnnouncementRecord, DocumentRecord, ExamRecord, ScheduleRecord, Subject};

pub(crate) fn load_subjects() -> Result<Vec<Subject>, String> {
    serde_json::from_str(include_str!("../data/subjects.json"))
        .map_err(|_| "Không đọc được dữ liệu môn học mẫu.".to_string())
}

pub(crate) fn load_documents() -> Result<Vec<DocumentRecord>, String> {
    serde_json::from_str(include_str!("../data/documents.json"))
        .map_err(|_| "Không đọc được dữ liệu tài liệu mẫu.".to_string())
}

pub(crate) fn load_announcements() -> Result<Vec<AnnouncementRecord>, String> {
    serde_json::from_str(include_str!("../data/announcements.json"))
        .map_err(|_| "Không đọc được dữ liệu thông báo mẫu.".to_string())
}

pub(crate) fn load_schedule() -> Result<Vec<ScheduleRecord>, String> {
    serde_json::from_str(include_str!("../data/schedule.json"))
        .map_err(|_| "Không đọc được dữ liệu lịch học mẫu.".to_string())
}

pub(crate) fn load_exams() -> Result<Vec<ExamRecord>, String> {
    serde_json::from_str(include_str!("../data/exams.json"))
        .map_err(|_| "Không đọc được dữ liệu lịch thi mẫu.".to_string())
}
