use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CanonicalStudentProfile {
    pub(crate) school_id: String,
    pub(crate) school_name: String,
    pub(crate) student_code: String,
    pub(crate) display_name: String,
    pub(crate) is_authenticated: bool,
    pub(crate) updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CanonicalScheduleEntry {
    pub(crate) id: String,
    pub(crate) student_code: String,
    pub(crate) subject_code: String,
    pub(crate) subject_name: String,
    pub(crate) weekday: i64,
    pub(crate) start_time: String,
    pub(crate) end_time: String,
    pub(crate) room: String,
    pub(crate) lecturer: String,
    pub(crate) source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CanonicalExamEntry {
    pub(crate) id: String,
    pub(crate) student_code: String,
    pub(crate) subject_code: String,
    pub(crate) subject_name: String,
    pub(crate) exam_date: String,
    pub(crate) start_time: String,
    pub(crate) duration_minutes: i64,
    pub(crate) room: String,
    pub(crate) format: String,
    pub(crate) source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SyncResult {
    pub(crate) success: bool,
    pub(crate) student_code: String,
    pub(crate) student_name: String,
    pub(crate) schedules_count: usize,
    pub(crate) exams_count: usize,
    pub(crate) message: String,
}

impl CanonicalScheduleEntry {
    #[allow(dead_code)]
    pub(crate) fn is_valid_contract(&self) -> bool {
        !self.id.is_empty()
            && !self.student_code.is_empty()
            && !self.subject_code.is_empty()
            && !self.subject_name.is_empty()
            && self.weekday >= 2
            && self.weekday <= 8
            && self.start_time.contains(':')
            && self.end_time.contains(':')
    }
}

impl CanonicalExamEntry {
    #[allow(dead_code)]
    pub(crate) fn is_valid_contract(&self) -> bool {
        !self.id.is_empty()
            && !self.student_code.is_empty()
            && !self.subject_code.is_empty()
            && !self.subject_name.is_empty()
            && self.exam_date.contains('-')
            && self.start_time.contains(':')
            && self.duration_minutes > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_canonical_schedule_contract_validation() {
        let entry = CanonicalScheduleEntry {
            id: "sched-1".into(),
            student_code: "2251120001".into(),
            subject_code: "CS101".into(),
            subject_name: "Lap trinh Mang".into(),
            weekday: 2,
            start_time: "07:30".into(),
            end_time: "11:00".into(),
            room: "A101".into(),
            lecturer: "Nguyen Van A".into(),
            source: "uth-portal".into(),
        };
        assert!(entry.is_valid_contract());

        let invalid_weekday = CanonicalScheduleEntry {
            weekday: 9,
            ..entry.clone()
        };
        assert!(!invalid_weekday.is_valid_contract());
    }

    #[test]
    fn test_canonical_exam_contract_validation() {
        let entry = CanonicalExamEntry {
            id: "exam-1".into(),
            student_code: "2251120001".into(),
            subject_code: "CS101".into(),
            subject_name: "Lap trinh Mang".into(),
            exam_date: "2026-08-15".into(),
            start_time: "08:00".into(),
            duration_minutes: 90,
            room: "H1".into(),
            format: "Trac nghiem".into(),
            source: "uth-portal".into(),
        };
        assert!(entry.is_valid_contract());

        let invalid_duration = CanonicalExamEntry {
            duration_minutes: 0,
            ..entry.clone()
        };
        assert!(!invalid_duration.is_valid_contract());
    }
}
