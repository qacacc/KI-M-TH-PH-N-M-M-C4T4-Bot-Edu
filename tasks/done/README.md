# Task Đã Xong

Cập nhật: 2026-10-09. Tổng hợp 31 file có `Status: Done` tại thời điểm rà soát.

## Quy tắc

- Đây là danh sách tổng hợp theo trạng thái tài liệu, không phải kiểm chứng lại toàn bộ runtime/API hoặc nghiệm thu UI mới.
- File chi tiết đã chuyển vào thư mục done; giữ nguyên trạng thái, phạm vi, evidence và giới hạn. Khi chuyển nhóm phải cập nhật liên kết, không xóa spec.
- Done chỉ áp dụng đúng scope: CA-083 hoàn thành cách ly an toàn, không có nghĩa đăng nhập/đồng bộ trường thật đã hoàn thành. Installer CA-077 là bản lịch sử, chưa build lại cho source mới.
- Task thiếu Status, còn In Progress hoặc chưa thống nhất governance nằm trong [Task Cần Thực Hiện](../chua-xong/README.md), không tự coi là Done.
- Khi task vượt gate hoàn thành: chuyển file từ chua-xong vào done, cập nhật README, TASK_INDEX và PROJECT_TASKS; không đổi trạng thái chỉ vì source đã tồn tại.

## Danh sách

| Task | Trạng thái ghi trong file | Chi tiết |
| --- | --- | --- |
| CA-001 - Task governance docs | Done | [CA-001-task-governance.md](CA-001-task-governance.md) |
| CA-031 - Preview da man hinh trong Appearance | Done | [CA-031-theme-preview.md](CA-031-theme-preview.md) |
| CA-032 - Sidebar rail polish va tooltip | Done | [CA-032-sidebar-rail-polish.md](CA-032-sidebar-rail-polish.md) |
| CA-033 - Background image app-managed storage | Done | [CA-033-background-managed-storage.md](CA-033-background-managed-storage.md) |
| CA-034 - Visual regression checks | Done | [CA-034-visual-regression.md](CA-034-visual-regression.md) |
| CA-035 - Tach backend modules khong doi command | Done | [CA-035-backend-module-split.md](CA-035-backend-module-split.md) |
| CA-036 - Threat model connector truong | Done | [CA-036-school-connector-threat-model.md](CA-036-school-connector-threat-model.md) |
| CA-037 - Codex-style Settings page | Done | [CA-037-codex-style-settings.md](CA-037-codex-style-settings.md) |
| CA-038 - Match Codex Settings visual structure | Done | [CA-038-codex-settings-visual-match.md](CA-038-codex-settings-visual-match.md) |
| CA-039 - Settings dedicated page with back | Done | [CA-039-settings-dedicated-page-back.md](CA-039-settings-dedicated-page-back.md) |
| CA-040 - Settings controls real behavior | Done | [CA-040-settings-controls-real-behavior.md](CA-040-settings-controls-real-behavior.md) |
| CA-041 - Custom accent picker | Done | [CA-041-custom-accent-picker.md](CA-041-custom-accent-picker.md) |
| CA-042 - Remove Tauri core dynamic import warning | Done | [CA-042-remove-tauri-core-dynamic-import.md](CA-042-remove-tauri-core-dynamic-import.md) |
| CA-043 - School connector readiness UI | Done | [CA-043-school-connector-readiness-ui.md](CA-043-school-connector-readiness-ui.md) |
| CA-054 - School public/auth completion gate | Done | [CA-054-school-public-auth-completion-gate.md](CA-054-school-public-auth-completion-gate.md) |
| CA-055 - Full function audit, docs cleanup, dead file cleanup | Done | [CA-055-full-function-audit-doc-cleanup.md](CA-055-full-function-audit-doc-cleanup.md) |
| CA-056 - School Account UX Cleanup & Polish | Done | [CA-056-school-account-ux-cleanup.md](CA-056-school-account-ux-cleanup.md) |
| CA-057 - Global Button & Spacing Layout Audit | Done | [CA-057-global-button-layout-audit.md](CA-057-global-button-layout-audit.md) |
| CA-058 - Settings Controls & Portal Fallback | Done | [CA-058-settings-controls-and-portal-fallback.md](CA-058-settings-controls-and-portal-fallback.md) |
| CA-059 - Sửa lỗi button/control bị trống, cắt nội dung và không hiển thị nhãn | Done | [CA-059-control-visibility-and-a11y-audit.md](CA-059-control-visibility-and-a11y-audit.md) |
| CA-069B - Logo Size and Background Fix | Done | [CA-069B-logo-size-and-background-fix.md](CA-069B-logo-size-and-background-fix.md) |
| CA-070 - Default Theme Reset and Light Mode Border Fix | Done | [CA-070-default-theme-reset-and-light-mode-border-fix.md](CA-070-default-theme-reset-and-light-mode-border-fix.md) |
| CA-071 - Chat Intent Subject Clarification | Done | [CA-071-chat-intent-subject-clarification.md](CA-071-chat-intent-subject-clarification.md) |
| CA-072 - Chat Persistence Error Visibility | Done | [CA-072-chat-persistence-error-visibility.md](CA-072-chat-persistence-error-visibility.md) |
| CA-073 - Sidebar Core Navigation Cleanup | Done | [CA-073-sidebar-core-navigation-cleanup.md](CA-073-sidebar-core-navigation-cleanup.md) |
| CA-074 - Runtime Docs Reconciliation | Done | [CA-074-runtime-docs-reconciliation.md](CA-074-runtime-docs-reconciliation.md) |
| CA-075 - Unified Runtime Flow and Chatbox Stability | Done | [CA-075-unified-runtime-flow-and-chatbox-stability.md](CA-075-unified-runtime-flow-and-chatbox-stability.md) |
| CA-076 - Fix Theme Default | Done | [CA-076-fix-theme-default.md](CA-076-fix-theme-default.md) |
| CA-077 - Release Freeze and Final Handoff | Done | [CA-077-release-freeze-final-handoff.md](CA-077-release-freeze-final-handoff.md) |
| CA-082 - Dữ liệu học tập đúng nguồn và sửa giao diện | Done | [CA-082-academic-data-truth-and-ui-remediation.md](CA-082-academic-data-truth-and-ui-remediation.md) |
| CA-083 - Cách ly connector chưa xác minh và ngừng dữ liệu mô phỏng | Done | [CA-083-unverified-connector-quarantine.md](CA-083-unverified-connector-quarantine.md) |

## Giới hạn kiểm chứng gần nhất

CA-083 ghi check:all PASS: 62 Vitest, 39 Rust, build/layout, audit 0; Playwright local PASS. Đây là evidence lần trước, không phải kết quả mới do lần tổng hợp tài liệu này tạo ra. Native auth/sync và installer mới chưa được xác minh.
