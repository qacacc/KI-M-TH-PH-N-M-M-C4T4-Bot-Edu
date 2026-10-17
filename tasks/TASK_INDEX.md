# Task Index

## Ba thư mục task theo yêu cầu user (2026-10-09)

- [Task đã xong](done/README.md): 31 file ghi Status: Done, không tính trùng và không tự xác nhận API/UI mới.
- [Task chưa xong](chua-xong/README.md): 36 file cần làm/đối chiếu, gồm 13 spec Proposed từ audit; Superseded không triển khai lại.
- [Task hoãn làm](hoan-lam/README.md): game/phần thưởng CA-064 và mini pet CA-085, đều Frozen / Activation-only.
- File chi tiết đã chuyển vào thư mục tương ứng; giữ nguyên trạng thái và evidence cũ. Khi task đổi nhóm, cập nhật liên kết, README, chỉ mục và PROJECT_TASKS.
- Bảng Done phía dưới là lịch sử; CA-060 còn In Progress và CA-044..053 thiếu Status nên chưa được đưa vào thư mục done. Các mâu thuẫn ghi trong chua-xong/README.md, không dùng bảng lịch sử để vượt Done gate.
- Tổng cộng 69 file task (31 done, 36 chua-xong, 2 hoan-lam). [Audit source](../docs/SOURCE_AUDIT_2026-10-09.md) là nguồn evidence cho backlog mới, không phải nghiệm thu mọi chức năng.

## Quy tac

- Moi lan chi mo mot task active.
- Task active phai co file rieng `tasks/chua-xong/CA-XXX-*.md`.
- Task phai duoc duyet ke hoach truoc khi sua code.
- Sau khi xong phai `npm run check:all` pass.
- Neu khong co Git repo hop le, truoc task lon can tao ZIP baseline hoac ghi ro cach rollback.
- Khong duoc bao `DONE` neu task van nam trong `Active task` hoac file task van ghi `Status: In Progress`.
- Moi claim quan trong trong walkthrough phai co `file:line`, lenh kiem chung, va output rut gon.
- `npm run check:all` PASS chi la dieu kien can; UI/UX claim phai ghi ro `AUTOMATED`, `STATIC SOURCE CHECK`, va `MANUAL VISUAL CHECK`.
- Neu source khong khop voi walkthrough, task phai giu trang thai `In Progress` va lap tuc bao user.

## Definition of Done bat buoc

Mot task chi duoc chuyen sang `Done` khi tat ca dieu kien sau deu dat:

1. File task ghi `Status: Done`.
2. Task duoc xoa khoi muc `Active task`.
3. Task duoc them vao bang `Done`, chuyen file vao `tasks/done/` va cap nhat lien ket.
4. `PROJECT_TASKS.md` ghi ro da lam gi bang ngon ngu CURRENT, khong claim TARGET nhu CURRENT.
5. Tat ca Evidence Commands trong task deu pass voi output khop expected.
6. `npm run check:all` pass.
7. Neu la UI/UX, bao cao ghi ro da co hay chua co manual visual check.

## Active task

- CA-098.01: thiết kế contract và Bearer auth cho REST loopback Postman. CA-080 vẫn In Progress nhưng chờ evidence contract UTH riêng, không thuộc task implementation đang chạy; CA-086 dừng theo yêu cầu user, source chưa commit; CA-081 Proposed.

## Done

| ID | Ten | File | Ghi chu |
| --- | --- | --- | --- |
| CA-083 | Cách ly connector chưa xác minh | `tasks/done/CA-083-unverified-connector-quarantine.md` | Gỡ mapper đoán/gate auth-sync-cache/prototype, dữ liệu cũ giữ nguyên; 62 Vitest/39 Rust/audit 0, Playwright local PASS. Không claim connector thật hoàn thành. |
| CA-082 | Dữ liệu học tập đúng nguồn và sửa giao diện | `tasks/done/CA-082-academic-data-truth-and-ui-remediation.md` | Cache-only/GPA manual/portal feedback/UI; 61 Vitest, 37 Rust, audit 0, Playwright local PASS. Native auth/sync chưa verified; CA-080/081 Proposed. |
| CA-077 | Release Freeze and Final Handoff | `tasks/done/CA-077-release-freeze-final-handoff.md` | Chốt release freeze 2026-08-02, cập nhật CURRENT_STATE/README, `npm run check:all` pass; build NSIS installer pass tại `.release-target\\release\\bundle\\nsis\\Campus Assistant Local_1.0.1_x64-setup.exe`; MSI all-target bị lỗi WiX/file lock nên không dùng làm artifact cuối. |
| CA-076 | Fix Theme Default | `tasks/done/CA-076-fix-theme-default.md` | Sửa `applyAppearanceToDocument()` để auto theme trả quyền cho CSS token bằng `removeProperty`, bổ sung light guard cho settings controls; `npm run check:all` pass, manual visual chưa chạy. |
| CA-075 | Unified Runtime Flow and Chatbox Stability | `tasks/done/CA-075-unified-runtime-flow-and-chatbox-stability.md` | Chuẩn hóa nút Gửi, Enter, command suggestion, starter card, composer shortcut và command palette chat action qua `submitUserMessage`; bỏ silent bootstrap return; `npm run check:all` pass. |
| CA-074 | Runtime Docs Reconciliation | `tasks/done/CA-074-runtime-docs-reconciliation.md` | Đồng bộ docs CURRENT cho intent `NEEDS_SUBJECT`, chat history Rust privacy boundary, connector cache trước sample fallback, sidebar core và CA-064 Frozen; `npm run check:all` pass. |
| CA-073 | Sidebar Core Navigation Cleanup | `tasks/done/CA-073-sidebar-core-navigation-cleanup.md` | Sidebar core có `Gần đây`, `Học tập`, `Kết nối`; bỏ `Khám phá`, `Minigame`, `Phần thưởng` khỏi mặc định vì CA-064 vẫn Frozen; `npm run check:all` pass. |
| CA-072 | Chat Persistence Error Visibility | `tasks/done/CA-072-chat-persistence-error-visibility.md` | Không nuốt lỗi `save_chat_message`, privacy-disabled không cảnh báo, lỗi persistence thật hiện warning-box an toàn; `npm run check:all` pass. |
| CA-071 | Chat Intent Subject Clarification | `tasks/done/CA-071-chat-intent-subject-clarification.md` | Xóa fallback `subjects[0]`, thêm intent `NEEDS_SUBJECT`, thêm state `WAITING_FOR_SUBJECT`, bot hỏi rõ môn khi thiếu subject; `npm run check:all` pass. |
| CA-070 | Default Theme Reset and Light Mode Border Fix | `tasks/done/CA-070-default-theme-reset-and-light-mode-border-fix.md` | Thêm Campus Default, reset đúng Light/Dark, đồng bộ màu auto khi đổi theme, guard light mode không kéo viền/nút đen; `npm run check:all` pass, manual visual chưa chạy. |
| CA-069B | Logo Size and Background Fix | `tasks/done/CA-069B-logo-size-and-background-fix.md` | Tăng logo 30px/32px, loại bỏ nền card tối vuông chìm xung quanh logo, thêm src/vite-env.d.ts sửa lỗi import TypeScript PNG. |
| CA-060 | Fix Settings Tab Active Blank State | `tasks/chua-xong/CA-060-fix-settings-tab-active-blank-state.md` | Ép !important cho .settings-tab.active:hover và .settings-toggle.active:hover, xóa triệt để lỗi white-on-white. |
| CA-059 | Control visibility & a11y audit | `tasks/done/CA-059-control-visibility-and-a11y-audit.md` | Xóa trùng selector .settings-quick-btn & .settings-toggle, xóa .settings-toggle span, ép grid !important cho codex-option-card và thêm static regression checks. |
| CA-057 | Global Button & Spacing Layout Audit | `tasks/done/CA-057-global-button-layout-audit.md` | Chuẩn hóa toàn bộ hệ thống button base, primary, secondary, danger và parent spacing layout. |
| CA-056 | School account UX cleanup & polish | `tasks/done/CA-056-school-account-ux-cleanup.md` | Tái cấu trúc SchoolPage thành 3 khối rõ ràng, nút Primary/Secondary/Danger chuẩn, Accordion nâng cao và wording trung thực. |
| CA-001 | Task governance docs | `tasks/done/CA-001-task-governance.md` | Tao rule, architecture, UX/UI, backend, optimization va task template. |
| CA-037 | Codex-style Settings page | `tasks/done/CA-037-codex-style-settings.md` | Chinh Settings thanh layout 2 cot, section ro, control gon va security status trung thuc. |
| CA-038 | Match Codex Settings visual structure | `tasks/done/CA-038-codex-settings-visual-match.md` | Chinh Settings thanh mot cot trung tam, section stacked, option cards va grouped rows nhu anh Codex. |
| CA-039 | Settings dedicated page with back | `tasks/done/CA-039-settings-dedicated-page-back.md` | Settings mo nhu page rieng, an chrome workspace va co Back ve view truoc. |
| CA-040 | Settings controls real behavior | `tasks/done/CA-040-settings-controls-real-behavior.md` | Sua Back alignment, bo language gia, noi default screen/auto-focus/bottom panel vao App that. |
| CA-041 | Custom accent picker | `tasks/done/CA-041-custom-accent-picker.md` | Them nut + cho hang mau nhan, picker RGB/HEX co Huy/Xac nhan. |
| CA-031 | Preview da man hinh trong Appearance | `tasks/done/CA-031-theme-preview.md` | Appearance co preview chat, lich hoc, bang du lieu va kiem tra dung draft truoc khi ap dung. |
| CA-032 | Sidebar rail polish va tooltip | `tasks/done/CA-032-sidebar-rail-polish.md` | Sidebar rail gon co hover/focus bung menu, tooltip/label va khong ep content chinh. |
| CA-036 | Threat model connector truong | `tasks/done/CA-036-school-connector-threat-model.md` | Them threat model, connector design, consent/token/logging policy truoc khi code SSO/API truong. |
| CA-033 | Background image app-managed storage | `tasks/done/CA-033-background-managed-storage.md` | Khi apply, anh nen duoc luu vao AppLocalData/themes/current va settings khong can giu data URL dai. |
| CA-035 | Tach backend modules khong doi command | `tasks/done/CA-035-backend-module-split.md` | Tach backend thanh models, data, db, paths, diagnostics, updates, documents, theme_assets; command/payload giu nguyen. |
| CA-034 | Visual regression checks | `tasks/done/CA-034-visual-regression.md` | Them layout contract check khong dependency va dua vao `check:all`. |
| CA-042 | Remove Tauri core dynamic import warning | `tasks/done/CA-042-remove-tauri-core-dynamic-import.md` | Doi `convertFileSrc` sang static import de build log sach warning dynamic import. |
| CA-043 | School connector readiness UI | `tasks/done/CA-043-school-connector-readiness-ui.md` | Settings/Privacy hien ro connector truong chua active va cac gate bao mat truoc khi code SSO/API. |
| CA-044 | Ho so truong local | `tasks/chua-xong/CA-044-local-school-onboarding.md` | Them man Truong & tai khoan, chon UTH/truong khac, luu localStorage va login gate khong thu credential. |
| CA-045 | Public admissions info local | `tasks/chua-xong/CA-045-public-admissions-info.md` | Them intent va `/admissions` cho cau hoi tuyen sinh cong khai nhu khoi 2008 nhap hoc nam nao. |
| CA-046 | Don sidebar workspace | `tasks/chua-xong/CA-046-sidebar-declutter.md` | Sidebar chi giu workspace chinh; cac muc cau hinh/ky thuat vao Settings/titlebar/command palette. |
| CA-047 | Account footer va school verify gate | `tasks/chua-xong/CA-047-account-footer-and-school-verify-gate.md` | Settings nam canh account footer; account mo ho so truong; email khong dung de xac thuc sinh vien. |
| CA-048 | Account integration va preview icon cleanup | `tasks/chua-xong/CA-048-sidebar-account-integration-and-preview-icons.md` | Bo Truong khoi nav trai, preview dung lucide icon va giam overlay/blur khi khong co anh nen. |
| CA-049 | School profile shared state | `tasks/chua-xong/CA-049-school-profile-shared-state.md` | Ho so truong dung module chung; footer hien profile da luu va cap nhat ngay khi save/clear. |
| CA-050 | Command palette school va admissions | `tasks/chua-xong/CA-050-command-palette-school-admissions.md` | Ctrl+K tim duoc Truong & tai khoan va Tuyen sinh cong khai sau khi sidebar gon lai. |
| CA-051 | Send button bootstrap consistency | `tasks/chua-xong/CA-051-send-button-bootstrap-consistency.md` | Nut Gui gui duoc nhu phim Enter ke ca khi bootstrap chua xong, bot tra thong bao chua khoi tao. |
| CA-052 | Public admissions before bootstrap va school portal link | `tasks/chua-xong/CA-052-public-admissions-before-bootstrap-and-school-portal.md` | Public admissions chay truoc bootstrap; UTH mo portal chinh thuc ngoai app khong thu credential. |
| CA-053 | Public school site search | `tasks/chua-xong/CA-053-public-school-site-search.md` | Cau hoi tuyen sinh cong khai goi connector tim tu khoa tren trang cong khai UTH, khong con suy luan nam sinh + 18. |
| CA-054 | School public/auth completion gate | `tasks/done/CA-054-school-public-auth-completion-gate.md` | Them moc chi duoc bao xong/moi user test khi public/auth/vault/data flow dat end-to-end va co test/fallback. |
| CA-055 | Full function audit, docs cleanup, dead file cleanup | `tasks/done/CA-055-full-function-audit-doc-cleanup.md` | Them random chat UNKNOWN regression, sua FilesPage trash path/confirm, sua wording session local va xoa artifact/dead file. |
| CA-056 | School Account UX Cleanup & Polish | `tasks/done/CA-056-school-account-ux-cleanup.md` | Chia SchoolPage thanh 3 khoi, khong hard-code UTH cho moi truong, an dev/danger vao accordion va check:all pass. |
| CA-057 | Global Button & Spacing Layout Audit | `tasks/done/CA-057-global-button-layout-audit.md` | Chuan hoa button runtime contract cuoi CSS, them static layout checks va check:all pass. |
| CA-058 | Settings Controls & Portal Fallback | `tasks/done/CA-058-settings-controls-and-portal-fallback.md` | Doi portal UTH primary sang trinh duyet ngoai, dua WebView vao experimental, sua language/autofocus/logout settings. |

## Ready / Proposed

| ID | Uu tien | Ten | File | Loai |
| --- | --- | --- | --- | --- |

| CA-080 | P0 | Xác minh hợp đồng API trường bằng Postman | `tasks/chua-xong/CA-080-postman-school-api-contract-verification.md` | In Progress; local REST/Postman complete, UTH API/business contract UNKNOWN. |
| CA-081 | P0 | Sửa parser UTH và tính toàn vẹn đồng bộ | `tasks/chua-xong/CA-081-uth-parser-sync-data-integrity.md` | Proposed / Remediation; phụ thuộc contract verified của CA-080. |
| CA-084 | P1 | Nghiệm thu và phát hành từ source đã sửa | `tasks/chua-xong/CA-084-release-audit-security-checklist.md` | Proposed; chưa sửa runtime. |
| CA-086 | P1 | Sửa lifecycle khởi tạo và trạng thái degraded | `tasks/chua-xong/CA-086-app-bootstrap-lifecycle.md` | In Progress; source chưa commit, dừng theo yêu cầu user. |
| CA-087 | P1 | Toàn vẹn phiên chat và lưu lịch sử | `tasks/chua-xong/CA-087-chat-session-integrity.md` | Proposed; chưa sửa runtime. |
| CA-088 | P1 | Sửa lưu, phục hồi và tính GPA | `tasks/chua-xong/CA-088-gpa-persistence-calculation.md` | Proposed; chưa sửa runtime. |
| CA-089 | P1 | Nguồn dữ liệu và trạng thái trường trung thực | `tasks/chua-xong/CA-089-school-ui-source-truth.md` | Proposed; chưa sửa runtime. |
| CA-090 | P1 | Sao lưu và reset đúng phạm vi, không mất dữ liệu | `tasks/chua-xong/CA-090-backup-reset-data-safety.md` | Proposed; chưa sửa runtime. |
| CA-091 | P1 | Thùng rác an toàn và một nguồn dữ liệu | `tasks/chua-xong/CA-091-trash-recovery-native-owner.md` | Proposed; chưa sửa runtime. |
| CA-092 | P1 | Xuất lịch đúng múi giờ và phạm vi học kỳ | `tasks/chua-xong/CA-092-calendar-timezone-validity.md` | Proposed; chưa sửa runtime. |
| CA-093 | P1 | Tìm kiếm công khai: lỗi, thời gian và nguồn tin | `tasks/chua-xong/CA-093-public-search-error-budget.md` | Proposed; chưa sửa runtime. |
| CA-094 | P1 | Gia cố desktop IPC và filesystem boundary | `tasks/chua-xong/CA-094-desktop-ipc-hardening.md` | Proposed; chưa sửa runtime. |
| CA-095 | P2 | Theme: persistence, draft và ownership ảnh nền | `tasks/chua-xong/CA-095-appearance-persistence-assets.md` | Proposed; chưa sửa runtime. |
| CA-096 | P2 | Clean code tăng dần và test hành vi | `tasks/chua-xong/CA-096-incremental-clean-code-tests.md` | Proposed; chưa sửa runtime. |
| CA-097 | P1 | Đối chiếu roadmap, task và feature với source | `tasks/chua-xong/CA-097-governance-source-reconciliation.md` | Proposed; chưa sửa runtime. |

Thứ tự contract: CA-080 -> CA-081. Thứ tự sửa/clean/release theo audit 2026-10-09; ưu tiên data safety, không tự Active toàn backlog. CA-084 dùng ID reserved cho release, không làm auto-updater ngoài scope. CA-078/079 chưa có spec, không cấp lại mã. Không coi request Postman là API verified.

## Frozen / Activation-only

| ID | Ten | File | Dieu kien kich hoat |
| --- | --- | --- | --- |
| CA-064 | Reward & Minigame | `tasks/hoan-lam/CA-064-special-reward-minigame-activation.md` | Chi mo khi user noi ro `kich hoat CA-064` hoac yeu cau bat dau lam reward va minigame. |
| CA-085 | Mini pet | `tasks/hoan-lam/CA-085-mini-pet-activation.md` | Chỉ mở khi user yêu cầu rõ bắt đầu mini pet hoặc kích hoạt CA-085. |

## Backlog sau nay

- CA-062 superseded by CA-063: `tasks/chua-xong/CA-062-actual-codex-layout-visual-fix.md` khong duoc tinh Done vi runtime cascade chua du chac.
- Theme preset named/export/import.
- Tach chat flow khoi `App.tsx`.
- CSS cleanup sau khi co visual tests.
- Zalo guide/production bot sau khi co privacy model rieng.
- Real school connector sau khi co threat model va user-consent model.
