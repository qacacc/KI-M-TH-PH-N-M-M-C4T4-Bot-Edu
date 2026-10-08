use crate::connectors::models::{
    CanonicalExamEntry, CanonicalScheduleEntry, CanonicalStudentProfile,
};

pub(crate) const UTH_CONTRACT_UNVERIFIED: &str =
    "CONTRACT_UNVERIFIED: Chưa xác minh API và phiên đăng nhập UTH. Ứng dụng không tự tạo lịch học/lịch thi; dữ liệu đã lưu được giữ nguyên. Bạn vẫn có thể mở website trường để xem dữ liệu trực tiếp.";

/// Chỉ thay chốt này bằng connector thật sau khi có contract/fixture và kiểm thử bảo mật.
pub(crate) fn ensure_uth_contract_verified() -> Result<(), String> {
    Err(UTH_CONTRACT_UNVERIFIED.to_string())
}

pub(crate) fn fetch_uth_profile(_jwt: &str) -> Result<CanonicalStudentProfile, String> {
    Err(UTH_CONTRACT_UNVERIFIED.to_string())
}

pub(crate) fn fetch_uth_schedule(
    _jwt: &str,
    _student_code: &str,
) -> Result<Vec<CanonicalScheduleEntry>, String> {
    Err(UTH_CONTRACT_UNVERIFIED.to_string())
}

pub(crate) fn fetch_uth_exams(
    _jwt: &str,
    _student_code: &str,
) -> Result<Vec<CanonicalExamEntry>, String> {
    Err(UTH_CONTRACT_UNVERIFIED.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unverified_contract_never_returns_authenticated_profile_or_sample_data() {
        assert!(ensure_uth_contract_verified()
            .unwrap_err()
            .contains("CONTRACT_UNVERIFIED"));
        assert!(fetch_uth_profile("synthetic-test-token").is_err());
        assert!(fetch_uth_schedule("synthetic-test-token", "test-account").is_err());
        assert!(fetch_uth_exams("synthetic-test-token", "test-account").is_err());
    }
}
