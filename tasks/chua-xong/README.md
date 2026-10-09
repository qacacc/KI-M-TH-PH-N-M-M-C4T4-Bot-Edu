# Task Cần Thực Hiện

Cập nhật: 2026-10-09. Theo dõi 35 file cần làm/đối chiếu (13 spec mới sau audit), không có nghĩa cả 35 cần viết lại code.

## Quy tắc

- Task mới/yêu cầu chưa làm ghi ở đây trước; có spec chi tiết thì liên kết tới file đó, không tạo hệ mã song song.
- Phân biệt việc cần triển khai, việc chờ evidence, đối chiếu trạng thái và phần mở rộng đóng băng. Không tự kích hoạt tất cả cùng lúc.
- UNKNOWN ảnh hưởng bảo mật/contract: không đoán API; chỉ tiếp tục phần đã rõ. Không ghi mật khẩu/token/cookie/response chứa PII vào task.
- Trước chuyển Done: đáp ứng Done gate trong TASK_INDEX, có source/test evidence và giới hạn visual; cập nhật [Task Đã Xong](../done/README.md).

## Backlog từ audit source

[Báo cáo audit](../../docs/SOURCE_AUDIT_2026-10-09.md) có source evidence, ưu tiên và giới hạn kiểm chứng. Trạng thái hiện tại theo từng dòng; CA-086 có source dở chưa commit và đã dừng theo yêu cầu user.

| Task | Trạng thái | Chi tiết |
| --- | --- | --- |
| CA-084 - Nghiệm thu và phát hành từ source đã sửa (P1) | Proposed | [CA-084-release-audit-security-checklist.md](CA-084-release-audit-security-checklist.md) |
| CA-086 - Sửa lifecycle khởi tạo và trạng thái degraded (P1) | In Progress | [CA-086-app-bootstrap-lifecycle.md](CA-086-app-bootstrap-lifecycle.md) |
| CA-087 - Toàn vẹn phiên chat và lưu lịch sử (P1) | Proposed | [CA-087-chat-session-integrity.md](CA-087-chat-session-integrity.md) |
| CA-088 - Sửa lưu, phục hồi và tính GPA (P1) | Proposed | [CA-088-gpa-persistence-calculation.md](CA-088-gpa-persistence-calculation.md) |
| CA-089 - Nguồn dữ liệu và trạng thái trường trung thực (P1) | Proposed | [CA-089-school-ui-source-truth.md](CA-089-school-ui-source-truth.md) |
| CA-090 - Sao lưu và reset đúng phạm vi, không mất dữ liệu (P1) | Proposed | [CA-090-backup-reset-data-safety.md](CA-090-backup-reset-data-safety.md) |
| CA-091 - Thùng rác an toàn và một nguồn dữ liệu (P1) | Proposed | [CA-091-trash-recovery-native-owner.md](CA-091-trash-recovery-native-owner.md) |
| CA-092 - Xuất lịch đúng múi giờ và phạm vi học kỳ (P1) | Proposed | [CA-092-calendar-timezone-validity.md](CA-092-calendar-timezone-validity.md) |
| CA-093 - Tìm kiếm công khai: lỗi, thời gian và nguồn tin (P1) | Proposed | [CA-093-public-search-error-budget.md](CA-093-public-search-error-budget.md) |
| CA-094 - Gia cố desktop IPC và filesystem boundary (P1) | Proposed | [CA-094-desktop-ipc-hardening.md](CA-094-desktop-ipc-hardening.md) |
| CA-095 - Theme: persistence, draft và ownership ảnh nền (P2) | Proposed | [CA-095-appearance-persistence-assets.md](CA-095-appearance-persistence-assets.md) |
| CA-096 - Clean code tăng dần và test hành vi (P2) | Proposed | [CA-096-incremental-clean-code-tests.md](CA-096-incremental-clean-code-tests.md) |
| CA-097 - Đối chiếu roadmap, task và feature với source (P1) | Proposed | [CA-097-governance-source-reconciliation.md](CA-097-governance-source-reconciliation.md) |

Mapping yêu cầu review trước: GPA -> CA-088; portal/cache/GPA behavior tests -> CA-096; auth/semester/snapshot -> CA-080/081; native/release -> CA-084. Không tạo task trùng hoặc thực hiện các checkbox cũ như một scope thứ hai.

## Ưu tiên dữ liệu trường thật

| Task | Trạng thái ghi trong file | Chi tiết |
| --- | --- | --- |
| CA-080 - Xác minh hợp đồng API trường bằng Postman | In Progress | [CA-080-postman-school-api-contract-verification.md](CA-080-postman-school-api-contract-verification.md) |
| CA-081 - Sửa parser UTH và tính toàn vẹn đồng bộ | Proposed | [CA-081-uth-parser-sync-data-integrity.md](CA-081-uth-parser-sync-data-integrity.md) |

- CA-080: xác minh request/response thật Profile/Schedule/Exams, fixtures đã loại PII; các miền thông báo/tài liệu/bảng điểm còn UNKNOWN nếu chưa có contract.
- CA-081: triển khai connector/parser/sync theo contract verified, không default nghiệp vụ giả; Error khác Empty, giữ cache tốt, xử lý snapshot đúng phạm vi. Auth/session cần isolation và native E2E trước bật gate CA-083.
- Yêu cầu user: đăng nhập một lần trong luồng được phép rồi app lấy dữ liệu tài khoản thật. Mở browser ngoài hiện không tạo session app; phải ghi rõ, không đánh dấu đã hỗ trợ.
- Học kỳ: khi connector được bật phải có dữ liệu học kỳ verified để lọc. Nếu chưa có, báo không thể lọc; không dùng semester=0 như học kỳ thật.

## Yêu cầu sửa đã ghi nhận từ review Sourcery

Các mục sau là PLANNED, chưa sửa runtime và chưa có task ID mới; tách spec sau khi chốt phạm vi, không dùng lại mã CA-080/081 cho lỗi GPA.

- [ ] GPA: phục hồi dữ liệu hợp lệ phải cho phép ghi v2 trở lại; reload giữ được dữ liệu phục hồi. Không tự ghi đè dữ liệu lỗi khi chưa có xác nhận.
- [ ] GPA: dữ liệu v1 không tồn tại/rỗng phải thông báo, không thay bảng hiện tại bằng [] ngoài ý muốn.
- [ ] GPA: hàng đang nhập chưa có điểm không tham gia tổng; phân biệt điểm chưa nhập với F/0 thật, giữ quy đổi chỉ là tham khảo.
- [ ] Test portal: dùng deferred promise để chứng minh await command, cả success/rejection, không chỉ mockResolvedValue.
- [ ] Test cache: fixture hợp lệ/mock/account khác có id/field riêng; assert chính xác bản ghi được chọn.
- [ ] Test GPA: tách từng lỗi tín chỉ/điểm/điểm chữ và kiểm tra độc lập, không gộp nhiều field sai trong một fixture.
- [ ] Chốt UX lưu trường khi mở portal: hiện có nút Lưu hồ sơ riêng; chưa duyệt tự lưu cả draft, không tự thay đổi hành vi hoặc suy ra đã xác thực.
- [ ] Native E2E: kiểm tra đăng nhập/định danh/sync/SQLite/UI và controls thực tế; sau ổn định build installer mới, không dùng bản lịch sử làm evidence source hiện tại.

## Task cũ chờ đối chiếu hoặc nghiệm thu

| Task | Trạng thái ghi trong file | Chi tiết |
| --- | --- | --- |
| CA-060 - Fix Settings Tab Active Blank State | In Progress | [CA-060-fix-settings-tab-active-blank-state.md](CA-060-fix-settings-tab-active-blank-state.md) |
| CA-061 - Default Big Layout & Codex-like Visual System | In Progress | [CA-061-default-big-layout-codex-visual.md](CA-061-default-big-layout-codex-visual.md) |
| CA-063 - Codex Default Runtime Theme & Layout Contract | In Progress | [CA-063-codex-default-runtime-theme.md](CA-063-codex-default-runtime-theme.md) |
| CA-063 - Sidebar UI Desktop Polish | In Progress | [CA-063-sidebar-ui-desktop-polish.md](CA-063-sidebar-ui-desktop-polish.md) |
| CA-064 - Sidebar UI Desktop Polish | In Progress | [CA-064-sidebar-ui-desktop-polish.md](CA-064-sidebar-ui-desktop-polish.md) |
| CA-065 - Sidebar Planned Items & History Entry | In Progress | [CA-065-sidebar-planned-items-history.md](CA-065-sidebar-planned-items-history.md) |
| CA-066 - Chat History MVP | In Progress | [CA-066-chat-history-mvp.md](CA-066-chat-history-mvp.md) |
| CA-067 - Chat History Delete Modal Polish | In Progress | [CA-067-chat-history-delete-modal-polish.md](CA-067-chat-history-delete-modal-polish.md) |
| CA-069 - Unified App Logo System | In Progress | [CA-069-unified-app-logo-system.md](CA-069-unified-app-logo-system.md) |

Không tự đưa các file này vào Active task hoặc làm lại giao diện. Kiểm tra source/evidence, xác định còn việc hay chỉ thiếu nghiệm thu/governance rồi mới chốt trạng thái.

## Task thiếu Status

| Task | Trạng thái ghi trong file | Chi tiết |
| --- | --- | --- |
| CA-044 - Ho so truong local | UNKNOWN: chưa có Status | [CA-044-local-school-onboarding.md](CA-044-local-school-onboarding.md) |
| CA-045 - Public admissions info local | UNKNOWN: chưa có Status | [CA-045-public-admissions-info.md](CA-045-public-admissions-info.md) |
| CA-046 - Don sidebar workspace | UNKNOWN: chưa có Status | [CA-046-sidebar-declutter.md](CA-046-sidebar-declutter.md) |
| CA-047 - Account footer va school verify gate | UNKNOWN: chưa có Status | [CA-047-account-footer-and-school-verify-gate.md](CA-047-account-footer-and-school-verify-gate.md) |
| CA-048 - Account integration va preview icon cleanup | UNKNOWN: chưa có Status | [CA-048-sidebar-account-integration-and-preview-icons.md](CA-048-sidebar-account-integration-and-preview-icons.md) |
| CA-049 - School profile shared state | UNKNOWN: chưa có Status | [CA-049-school-profile-shared-state.md](CA-049-school-profile-shared-state.md) |
| CA-050 - Command palette school va admissions | UNKNOWN: chưa có Status | [CA-050-command-palette-school-admissions.md](CA-050-command-palette-school-admissions.md) |
| CA-051 - Send button bootstrap consistency | UNKNOWN: chưa có Status | [CA-051-send-button-bootstrap-consistency.md](CA-051-send-button-bootstrap-consistency.md) |
| CA-052 - Public admissions before bootstrap va school portal link | UNKNOWN: chưa có Status | [CA-052-public-admissions-before-bootstrap-and-school-portal.md](CA-052-public-admissions-before-bootstrap-and-school-portal.md) |
| CA-053 - Public school site search | UNKNOWN: chưa có Status | [CA-053-public-school-site-search.md](CA-053-public-school-site-search.md) |

TASK_INDEX cũ có liệt kê các file này trong Done, nhưng file chi tiết thiếu Status. Cần đối chiếu evidence và chuẩn hóa trạng thái; không kết luận chức năng chưa viết, cũng không tự xác nhận hoàn thành.

## Hoãn làm

Game/phần thưởng và mini pet nằm riêng trong [hoan-lam](../hoan-lam/README.md). Chỉ kích hoạt khi user yêu cầu rõ, không trộn với việc hoàn thiện core.

## Đã bị thay thế - không triển khai lại

| Task | Trạng thái ghi trong file | Chi tiết |
| --- | --- | --- |
| CA-062 - Fix Actual Codex-like Layout After Visual Review | Superseded by CA-063 | [CA-062-actual-codex-layout-visual-fix.md](CA-062-actual-codex-layout-visual-fix.md) |

CA-062 đã bị thay thế bởi CA-063, nhưng có hai file CA-063 nên cần chốt file successor đúng, không tự suy đoán.

## Mâu thuẫn quản trị cần xử lý

- CA-060: chỉ mục cũ ghi Done nhưng file chi tiết còn In Progress. Chưa chuyển sang Task Đã Xong.
- CA-063 có hai spec khác nhau, CA-064 có một spec sidebar và một spec Frozen Reward/Minigame. Giữ tên file để phân biệt, không tự đổi mã hay kích hoạt nhầm; việc chuyển thư mục không đổi trạng thái.
- CA-056/057 bị lặp dòng ở bảng Done cũ; danh sách tổng hợp chỉ tính mỗi file một lần.
- CA-078/079 chưa có file trong snapshot này, chưa cấp lại số. Không tạo task cho các mã đó chỉ từ lời nhắc lịch sử.
