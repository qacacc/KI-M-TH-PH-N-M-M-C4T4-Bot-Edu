# Task Index

## Quy tac

- Moi lan chi mo mot task active.
- Task active phai co file rieng `tasks/CA-XXX-*.md`.
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
3. Task duoc them vao bang `Done`.
4. `PROJECT_TASKS.md` ghi ro da lam gi bang ngon ngu CURRENT, khong claim TARGET nhu CURRENT.
5. Tat ca Evidence Commands trong task deu pass voi output khop expected.
6. `npm run check:all` pass.
7. Neu la UI/UX, bao cao ghi ro da co hay chua co manual visual check.

## Active task

- Không có task active; CA-080/081 giữ Proposed, cần contract/fixture verified.

## Done

| ID | Ten | File | Ghi chu |
| --- | --- | --- | --- |
| CA-083 | Cách ly connector chưa xác minh | `tasks/CA-083-unverified-connector-quarantine.md` | Gỡ mapper đoán/gate auth-sync-cache/prototype, dữ liệu cũ giữ nguyên; 62 Vitest/39 Rust/audit 0, Playwright local PASS. Không claim connector thật hoàn thành. |
| CA-082 | Dữ liệu học tập đúng nguồn và sửa giao diện | `tasks/CA-082-academic-data-truth-and-ui-remediation.md` | Cache-only/GPA manual/portal feedback/UI; 61 Vitest, 37 Rust, audit 0, Playwright local PASS. Native auth/sync chưa verified; CA-080/081 Proposed. |
| CA-077 | Release Freeze and Final Handoff | `tasks/CA-077-release-freeze-final-handoff.md` | Chốt release freeze 2026-08-02, cập nhật CURRENT_STATE/README, `npm run check:all` pass; build NSIS installer pass tại `.release-target\\release\\bundle\\nsis\\Campus Assistant Local_1.0.1_x64-setup.exe`; MSI all-target bị lỗi WiX/file lock nên không dùng làm artifact cuối. |
| CA-076 | Fix Theme Default | `tasks/CA-076-fix-theme-default.md` | Sửa `applyAppearanceToDocument()` để auto theme trả quyền cho CSS token bằng `removeProperty`, bổ sung light guard cho settings controls; `npm run check:all` pass, manual visual chưa chạy. |
| CA-075 | Unified Runtime Flow and Chatbox Stability | `tasks/CA-075-unified-runtime-flow-and-chatbox-stability.md` | Chuẩn hóa nút Gửi, Enter, command suggestion, starter card, composer shortcut và command palette chat action qua `submitUserMessage`; bỏ silent bootstrap return; `npm run check:all` pass. |
| CA-074 | Runtime Docs Reconciliation | `tasks/CA-074-runtime-docs-reconciliation.md` | Đồng bộ docs CURRENT cho intent `NEEDS_SUBJECT`, chat history Rust privacy boundary, connector cache trước sample fallback, sidebar core và CA-064 Frozen; `npm run check:all` pass. |
| CA-073 | Sidebar Core Navigation Cleanup | `tasks/CA-073-sidebar-core-navigation-cleanup.md` | Sidebar core có `Gần đây`, `Học tập`, `Kết nối`; bỏ `Khám phá`, `Minigame`, `Phần thưởng` khỏi mặc định vì CA-064 vẫn Frozen; `npm run check:all` pass. |
| CA-072 | Chat Persistence Error Visibility | `tasks/CA-072-chat-persistence-error-visibility.md` | Không nuốt lỗi `save_chat_message`, privacy-disabled không cảnh báo, lỗi persistence thật hiện warning-box an toàn; `npm run check:all` pass. |
| CA-071 | Chat Intent Subject Clarification | `tasks/CA-071-chat-intent-subject-clarification.md` | Xóa fallback `subjects[0]`, thêm intent `NEEDS_SUBJECT`, thêm state `WAITING_FOR_SUBJECT`, bot hỏi rõ môn khi thiếu subject; `npm run check:all` pass. |
| CA-070 | Default Theme Reset and Light Mode Border Fix | `tasks/CA-070-default-theme-reset-and-light-mode-border-fix.md` | Thêm Campus Default, reset đúng Light/Dark, đồng bộ màu auto khi đổi theme, guard light mode không kéo viền/nút đen; `npm run check:all` pass, manual visual chưa chạy. |
| CA-069B | Logo Size and Background Fix | `tasks/CA-069B-logo-size-and-background-fix.md` | Tăng logo 30px/32px, loại bỏ nền card tối vuông chìm xung quanh logo, thêm src/vite-env.d.ts sửa lỗi import TypeScript PNG. |
| CA-060 | Fix Settings Tab Active Blank State | `tasks/CA-060-fix-settings-tab-active-blank-state.md` | Ép !important cho .settings-tab.active:hover và .settings-toggle.active:hover, xóa triệt để lỗi white-on-white. |
| CA-059 | Control visibility & a11y audit | `tasks/CA-059-control-visibility-and-a11y-audit.md` | Xóa trùng selector .settings-quick-btn & .settings-toggle, xóa .settings-toggle span, ép grid !important cho codex-option-card và thêm static regression checks. |
| CA-057 | Global Button & Spacing Layout Audit | `tasks/CA-057-global-button-layout-audit.md` | Chuẩn hóa toàn bộ hệ thống button base, primary, secondary, danger và parent spacing layout. |
| CA-056 | School account UX cleanup & polish | `tasks/CA-056-school-account-ux-cleanup.md` | Tái cấu trúc SchoolPage thành 3 khối rõ ràng, nút Primary/Secondary/Danger chuẩn, Accordion nâng cao và wording trung thực. |
| CA-001 | Task governance docs | `tasks/CA-001-task-governance.md` | Tao rule, architecture, UX/UI, backend, optimization va task template. |
| CA-037 | Codex-style Settings page | `tasks/CA-037-codex-style-settings.md` | Chinh Settings thanh layout 2 cot, section ro, control gon va security status trung thuc. |
| CA-038 | Match Codex Settings visual structure | `tasks/CA-038-codex-settings-visual-match.md` | Chinh Settings thanh mot cot trung tam, section stacked, option cards va grouped rows nhu anh Codex. |
| CA-039 | Settings dedicated page with back | `tasks/CA-039-settings-dedicated-page-back.md` | Settings mo nhu page rieng, an chrome workspace va co Back ve view truoc. |
| CA-040 | Settings controls real behavior | `tasks/CA-040-settings-controls-real-behavior.md` | Sua Back alignment, bo language gia, noi default screen/auto-focus/bottom panel vao App that. |
| CA-041 | Custom accent picker | `tasks/CA-041-custom-accent-picker.md` | Them nut + cho hang mau nhan, picker RGB/HEX co Huy/Xac nhan. |
| CA-031 | Preview da man hinh trong Appearance | `tasks/CA-031-theme-preview.md` | Appearance co preview chat, lich hoc, bang du lieu va kiem tra dung draft truoc khi ap dung. |
| CA-032 | Sidebar rail polish va tooltip | `tasks/CA-032-sidebar-rail-polish.md` | Sidebar rail gon co hover/focus bung menu, tooltip/label va khong ep content chinh. |
| CA-036 | Threat model connector truong | `tasks/CA-036-school-connector-threat-model.md` | Them threat model, connector design, consent/token/logging policy truoc khi code SSO/API truong. |
| CA-033 | Background image app-managed storage | `tasks/CA-033-background-managed-storage.md` | Khi apply, anh nen duoc luu vao AppLocalData/themes/current va settings khong can giu data URL dai. |
| CA-035 | Tach backend modules khong doi command | `tasks/CA-035-backend-module-split.md` | Tach backend thanh models, data, db, paths, diagnostics, updates, documents, theme_assets; command/payload giu nguyen. |
| CA-034 | Visual regression checks | `tasks/CA-034-visual-regression.md` | Them layout contract check khong dependency va dua vao `check:all`. |
| CA-042 | Remove Tauri core dynamic import warning | `tasks/CA-042-remove-tauri-core-dynamic-import.md` | Doi `convertFileSrc` sang static import de build log sach warning dynamic import. |
| CA-043 | School connector readiness UI | `tasks/CA-043-school-connector-readiness-ui.md` | Settings/Privacy hien ro connector truong chua active va cac gate bao mat truoc khi code SSO/API. |
| CA-044 | Ho so truong local | `tasks/CA-044-local-school-onboarding.md` | Them man Truong & tai khoan, chon UTH/truong khac, luu localStorage va login gate khong thu credential. |
| CA-045 | Public admissions info local | `tasks/CA-045-public-admissions-info.md` | Them intent va `/admissions` cho cau hoi tuyen sinh cong khai nhu khoi 2008 nhap hoc nam nao. |
| CA-046 | Don sidebar workspace | `tasks/CA-046-sidebar-declutter.md` | Sidebar chi giu workspace chinh; cac muc cau hinh/ky thuat vao Settings/titlebar/command palette. |
| CA-047 | Account footer va school verify gate | `tasks/CA-047-account-footer-and-school-verify-gate.md` | Settings nam canh account footer; account mo ho so truong; email khong dung de xac thuc sinh vien. |
| CA-048 | Account integration va preview icon cleanup | `tasks/CA-048-sidebar-account-integration-and-preview-icons.md` | Bo Truong khoi nav trai, preview dung lucide icon va giam overlay/blur khi khong co anh nen. |
| CA-049 | School profile shared state | `tasks/CA-049-school-profile-shared-state.md` | Ho so truong dung module chung; footer hien profile da luu va cap nhat ngay khi save/clear. |
| CA-050 | Command palette school va admissions | `tasks/CA-050-command-palette-school-admissions.md` | Ctrl+K tim duoc Truong & tai khoan va Tuyen sinh cong khai sau khi sidebar gon lai. |
| CA-051 | Send button bootstrap consistency | `tasks/CA-051-send-button-bootstrap-consistency.md` | Nut Gui gui duoc nhu phim Enter ke ca khi bootstrap chua xong, bot tra thong bao chua khoi tao. |
| CA-052 | Public admissions before bootstrap va school portal link | `tasks/CA-052-public-admissions-before-bootstrap-and-school-portal.md` | Public admissions chay truoc bootstrap; UTH mo portal chinh thuc ngoai app khong thu credential. |
| CA-053 | Public school site search | `tasks/CA-053-public-school-site-search.md` | Cau hoi tuyen sinh cong khai goi connector tim tu khoa tren trang cong khai UTH, khong con suy luan nam sinh + 18. |
| CA-054 | School public/auth completion gate | `tasks/CA-054-school-public-auth-completion-gate.md` | Them moc chi duoc bao xong/moi user test khi public/auth/vault/data flow dat end-to-end va co test/fallback. |
| CA-055 | Full function audit, docs cleanup, dead file cleanup | `tasks/CA-055-full-function-audit-doc-cleanup.md` | Them random chat UNKNOWN regression, sua FilesPage trash path/confirm, sua wording session local va xoa artifact/dead file. |
| CA-056 | School Account UX Cleanup & Polish | `tasks/CA-056-school-account-ux-cleanup.md` | Chia SchoolPage thanh 3 khoi, khong hard-code UTH cho moi truong, an dev/danger vao accordion va check:all pass. |
| CA-057 | Global Button & Spacing Layout Audit | `tasks/CA-057-global-button-layout-audit.md` | Chuan hoa button runtime contract cuoi CSS, them static layout checks va check:all pass. |
| CA-058 | Settings Controls & Portal Fallback | `tasks/CA-058-settings-controls-and-portal-fallback.md` | Doi portal UTH primary sang trinh duyet ngoai, dua WebView vao experimental, sua language/autofocus/logout settings. |

## Ready / Proposed

| ID | Uu tien | Ten | File | Loai |
| --- | --- | --- | --- | --- |

| CA-080 | P0 | Xác minh hợp đồng API trường bằng Postman | `tasks/CA-080-postman-school-api-contract-verification.md` | Proposed; cần response thật đã loại PII, không đoán endpoint. |
| CA-081 | P0 | Sửa parser UTH và tính toàn vẹn đồng bộ | `tasks/CA-081-uth-parser-sync-data-integrity.md` | Proposed / Remediation; phụ thuộc contract verified của CA-080. |

Thứ tự: CA-080 -> CA-081. Chưa kích hoạt runtime task; không coi các request Postman là API đã xác minh. CA-078/CA-079 chưa có file task trong snapshot này; giữ nguyên số đó để tránh xung đột công việc trước.

## Frozen / Activation-only

| ID | Ten | File | Dieu kien kich hoat |
| --- | --- | --- | --- |
| CA-064 | Reward & Minigame | `tasks/CA-064-special-reward-minigame-activation.md` | Chi mo khi user noi ro `kich hoat CA-064` hoac yeu cau bat dau lam reward va minigame. |

## Backlog sau nay

- CA-062 superseded by CA-063: `tasks/CA-062-actual-codex-layout-visual-fix.md` khong duoc tinh Done vi runtime cascade chua du chac.
- Theme preset named/export/import.
- Tach chat flow khoi `App.tsx`.
- CSS cleanup sau khi co visual tests.
- Zalo guide/production bot sau khi co privacy model rieng.
- Real school connector sau khi co threat model va user-consent model.
