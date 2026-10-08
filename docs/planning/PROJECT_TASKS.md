# Project Tasks

## Baseline hien tai

- App: Campus Assistant Local.
- Version source: `1.0.1`.
- Stack: Tauri 2, React, TypeScript, SQLite local, JSON local.
- Nguyen tac: local-first, khong AI API, khong RAG, khong gui hoi thoai/tai lieu/token ra server ngoai.
- File tong task nay la trang thai hien tai cua source sau khi doi chieu lai cac file chinh.

## Task dac biet dang dong bang

- `CA-064`: Reward & Minigame (`tasks/CA-064-special-reward-minigame-activation.md`).
- Trang thai: Frozen / Activation-only.
- Muc dich: giu y tuong ve reward local-first, XP/coin/streak, daily tasks va minigame hoc tap.
- Quy tac: khong duoc tu dong trien khai. Chi duoc mo khi user noi ro `kich hoat CA-064` hoac yeu cau bat dau lam reward va minigame.
- Khi kich hoat, bat buoc tach thanh task con nho va xin duyet ke hoach truoc khi sua code.

## Da lam trong source

### Nen tang va tai lieu

1. Tao scaffold Tauri + React + TypeScript.
2. Tao README va tai lieu scope/phat trien: `README.md`, `MVP_0.1.md`, `DATA_CONTRACTS.md`, `SECURITY_NOTES.md`, `ACCEPTANCE_CRITERIA.md`, `ROADMAP.md`, `DEVELOPMENT_DIRECTION.md`, `DEV_COMMANDS.md`, `DEV_WORKFLOW.md`.
3. Tao npm scripts cho dev, check, test, build, installer va dev launcher.
4. Tao `CampusAssistantLocal-Dev.exe` de chay app desktop dev qua Vite HMR.
5. Tao custom titlebar rieng cho Windows/Tauri va tat window decorations native trong Tauri config.
6. Tao bo task governance cho AI:
   - `AI_PROJECT_RULES.md`
   - `ARCHITECTURE.md`
   - `UX_UI_GUIDELINES.md`
   - `BACKEND_GUIDELINES.md`
   - `OPTIMIZATION_TARGETS.md`
   - `tasks/_TEMPLATE.md`
   - `tasks/TASK_INDEX.md`

### Du lieu local

7. Tao SQLite local cho settings, session metadata va action log.
8. Tao JSON local cho subjects, documents, announcements, schedule va exams.
9. Dong goi sample documents local trong workspace quan ly cua app.
10. Dashboard/status dung so lieu that tu bootstrap local, khong dung card gia cho module chua co.

### Chat va intent

10. Xay normalizer tieng Viet co dau/khong dau co ban.
11. Xay intent detector cho `FIND_DOCUMENTS`, `FIND_ANNOUNCEMENTS`, `FIND_SCHEDULE`, `FIND_EXAMS`.
12. Xay minimal conversation state cho flow document:
    - `IDLE`
    - `WAITING_FOR_SEMESTER`
    - `SHOWING_DOCUMENTS`
    - `WAITING_FOR_FILE_CONFIRMATION`
    - `COMPLETED`
13. Hoi hoc ky khi user thieu thong tin.
14. Hien thi danh sach tai lieu tu JSON local.
15. Cho chon file bang chat: `mo 1`, `mo file 1`, `copy 2`, `sao chep file 2`.
16. Co dieu khien flow bang chat: `huy`, `quay lai`, `xac nhan`, `khong`, `cancel`.
17. Co slash commands:
    - `/help`
    - `/documents`
    - `/announcements`
    - `/schedule`
    - `/exams`
    - `/files`
    - `/storage`
    - `/health`
    - `/release`
    - `/appearance`
    - `/theme`
    - `/logs`
    - `/privacy`
    - `/clear`
18. Composer co goi y lenh `/`, dieu huong bang ban phim va action theo context.
19. Khong luu/khoi phuc noi dung chat cu khi dong/mo app.

### File safety va action log

20. Yeu cau xac nhan truoc khi mo/copy file.
21. Chi mo/copy file trong vung quan ly cua app.
22. Copy file sang `Documents/CampusAssistant/downloads`.
23. Khong xoa, doi ten, di chuyen file trong flow v1.0.1.
24. Chan traversal path pho bien: `../`, `..\`, absolute path, UNC path.
25. Co test chan symlink escape khi moi truong ho tro tao symlink.
26. Ghi action log metadata an toan, khong ghi noi dung tai lieu, token, secret, cookie hoac raw credential.
27. Co tab Nhat ky de xem/tim kiem/loc action log metadata.
28. Xoa action log metadata co confirm va khong xoa file mau.

### Cac trang local

29. Trang Chat voi starter cards va command suggestions.
30. Trang File mau hien metadata tai lieu mau local.
31. Trang Thong bao hien JSON local co filter/thong ke.
32. Trang Lich hoc hien JSON local co filter/thong ke.
33. Trang Lich thi hien JSON local co filter/thong ke.
34. Trang Bo nho hien summary workspace local va nut mo downloads.
35. Trang Kiem tra tao health report local.
36. Trang Kiem tra co xuat diagnostic report JSON vao downloads.
37. Trang Phat hanh hien checklist release local-first.
38. Trang Quyen rieng tu giai thich local-first va vung du lieu.
39. Trang Giao dien cho tuy bien giao dien local.

### UX/UI va layout

40. Refactor UI theo huong chat-first.
41. Bo dashboard cot phai khoi man hinh chat chinh de chat sach hon.
42. Cac page ngoai chat phu day vung giua voi width toi da rong hon.
43. Sidebar trai chuyen sang rail overlay: mac dinh gon, hover/focus moi bung ra.
44. Sidebar chia nhom: phien hien tai, tra cuu, he thong, ca nhan.
45. Utility panel va customize panel co resize/collapse rieng, width luu local.
46. Khi vao tab Giao dien, customize panel phai an de tranh mo song song hai noi tuy bien.
47. Da sua loi grid sau khi sidebar thanh fixed rail: content khong con bi ep vao cot hep/chu xuong dong tung ky tu.
48. Giam shadow nang tren box cha/card cha, uu tien border va surface phang hon.
49. Bo smooth scroll gay cam giac cham khi chat tu cuon.
50. Tach command suggestions khoi `isBusy` de bam nut lenh on dinh hon.
51. Chinh trang Cai dat theo huong Codex Settings: navigation noi bo ben trai, content ben phai, nhom Chung/Du lieu local/Bao mat/Cap nhat/Dev/Nang cao, control gon va security status trung thuc.
52. Chinh tiep trang Cai dat theo anh Codex that: mot cot trung tam, section stacked, option cards, grouped rows va toggle ben phai.
53. Chinh Settings thanh man hinh rieng nhu Codex: an sidebar/panel phu, an action workspace tren titlebar va co Back ve view truoc.
54. Sua Settings khong con control gia: Back canh trai, Work mode mot lua chon, Language ghi ro chi ho tro Tieng Viet, Default screen/Auto-focus/Bottom panel co tac dung that.

### Appearance Studio

55. Co draft/apply/discard/reset de tuy bien khong doi live lien tuc gay lag.
56. Cho chon light/dark, accent, mau nen, mau panel, mau chu chinh, mau chu phu.
57. Co font choices va density choices khong dung native select tho.
58. Co background image local.
59. Co background fit: cover, contain, actual size.
60. Co background position/focus controls.
61. Co blur nen, opacity nen, overlay toi/sang, accent tint.
62. Co panel opacity de lam glass/translucent theo anh nen.
63. Co skin presets: Dream Glass, Paper Focus, Aurora Study, Warm Minimal.
64. Co preview rieng de xem truoc theme truoc khi apply.
65. Co sanitize settings de tranh `NaN%` va gia tri localStorage hong.
66. Appearance settings luu local trong WebView va khong gui ra ngoai.
67. Hang mau nhan co nut `+` mo picker RGB/HEX, keo chinh mau va chi cap nhat draft khi bam Xac nhan.
68. Dong task CA-031: Preview da man hinh trong Appearance da co chat/lich hoc/bang du lieu/kiem tra.
69. Dong task CA-032: Sidebar rail da co hover/focus bung menu va tooltip/label khi gon.
70. Dong task CA-036: Them threat model va connector design truong that truoc khi code SSO/API.
71. Dong task CA-033: Background image khi apply duoc luu vao AppLocalData/themes/current thay vi giu data URL dai trong settings.

### Refactor frontend

72. Tach `useLayoutState` khoi `App.tsx`.
73. Them Vitest cho layout helper: collapse threshold, clamp width, load/save storage, fallback JSON hong.
74. Tach `useAppearanceDraft` khoi `App.tsx`.
75. Them Vitest cho appearance helper: hex validation, load/save storage, rgba va contrast guard.
76. Tach `ReleasePage`, `PrivacyPage`, `AppearancePage` sang `src/pages`.
77. Tach cac page con: File, Log, Storage, Health, Thong bao, Lich hoc, Lich thi.
78. Tach shared components: `DocumentTable`, `AnnouncementTable`, `ScheduleTable`, `ExamTable`, `StatusLine`.
79. Tach utility format: `formatBytes`, `formatWeekday`.
80. Rut gon `App.tsx` thanh orchestrator chinh sau refactor, nhung van con la file trung tam can tiep tuc chia nho sau.

### Backend/Rust

81. Tach DB schema init va default record seed de lenh doc metadata giam side effect.
82. Health test dung temp root rieng, khong cham AppLocalData/SQLite that cua nguoi dung.
83. Them Rust test DB idempotent: default session/settings khong bi nhan ban, setting user khong bi ghi de, khong tao action log ngoai y muon.
84. Them Rust test path traversal va symlink.
85. Them storage summary, health report, diagnostic export, update check manifest.
86. Version compare/update manifest co test.
87. Dong task CA-035: backend da tach thanh `models.rs`, `data.rs`, `db.rs`, `paths.rs`, `diagnostics.rs`, `updates.rs`, `documents.rs`, `theme_assets.rs` va giu command/payload cu.
88. Dong task CA-034: them `npm run test:layout` de bat regression layout/titlebar/sidebar/settings/appearance khong can dependency moi.
89. Dong task CA-042: bo dynamic import `@tauri-apps/api/core`, dung static `convertFileSrc` de build log sach hon.
90. Dong task CA-043: Settings/Privacy co School connector readiness, noi ro runtime chua co SSO/API/token va can consent/vault/mock portal truoc khi code.
91. Dong task CA-044: Them man Truong & tai khoan de chon truong, luu ho so sinh vien local va hien gate dang nhap cong truong chua san sang.
92. Dong task CA-045: Them intent tuyen sinh cong khai local, ho tro cau hoi "khoi 2008 thi nam nao nhap hoc" va slash command `/admissions`.
93. Dong task CA-046: Don sidebar chi giu workspace chinh, dua cac muc cau hinh/ky thuat vao Settings/titlebar/command palette.
94. Dong task CA-047: Chuyen Settings xuong footer canh account, account footer mo Truong & tai khoan, va lam ro xac thuc sinh vien qua cong truong/SSO chu khong qua email.
95. Dong task CA-048: Bo muc Truong khoi nav trai vi da tich hop vao account footer, thay emoji preview bang lucide icon va tat overlay/blur preview khi khong co anh nen.
96. Dong task CA-049: Tach ho so truong local thanh module dung chung, footer sinh vien hien ten/truong/mode da luu va cap nhat ngay sau khi save/clear.
97. Dong task CA-050: Them Truong & tai khoan va Tuyen sinh cong khai vao command palette de sidebar van gon nhung dieu huong nhanh day du.
98. Dong task CA-051: Sua nut Gui khong bi disable khi bootstrap chua xong, de click Gui va phim Enter dung chung hanh vi.
99. Dong task CA-052: Cho public admissions va `/admissions` chay truoc bootstrap; nut Mo cong truong mo portal UTH chinh thuc ngoai app, khong thu credential.
100. Dong task CA-053: Thay rule local nam sinh + 18 bang public connector tim tu khoa tren cac trang cong khai allowlist cua UTH va tra snippet/URL nguon.

### School Connector & Data Vault nang cao (source hien tai, mot phan experimental)

101. Xay dung cua so WebView Auth Gate rieng de mo cong UTH Portal chinh thuc bang `open_uth_login_window`.
102. Xay dung local session metadata store (`schoolVault.ts`) co thoi han 7 ngay, khong luu secret token/cookie trong localStorage.
103. Token connector neu co chi nam trong RAM backend (`connector_engine.rs`), chua co encrypted persistent vault.
104. Xay dung Che do Tan sinh vien / Public University Portal Mode voi du lieu cong khai va public search.
105. Tich hop engine tra cuu cong khai (`connectorEngine.ts`) va tra loi cau hoi truong trong chat (`chatSchoolIntegration.ts`) voi wording khong claim token vault that.
106. Xay dung bo Thung rac Local tren backend Rust (`trash.rs`) va UI File page co xoa/khoi phuc/don sach.
107. Xay dung bo quan ly preset giao dien ca nhan (`presetStore.ts`) va backup/restore cau hinh local (`backupRestore.ts`).
108. Chuan hoa giao dien Cai dat (`SettingsPage.tsx`) theo huong Codex Settings, khong claim DPAPI active khi source chua co.

## Vua sua trong lan nay - CA-055

109. Them regression test cho cau chat random ngoai du lieu: `"mai đi biển nên mặc áo màu gì"` phai ra `UNKNOWN`, khong bi nhan nham thanh intent nghiep vu.
110. Sua `FilesPage.tsx`: nut xoa file mau truyen `document.localPath` vao `moveFileToTrash`, khong truyen `document.id`.
111. Them confirm truoc khi chuyen file vao Thung rac Local va truoc khi don sach thung rac.
112. Sua wording chat truong: chi noi co metadata phien local, khong claim `Session Token Vault` khi source khong luu token/cookie secret.
113. Xoa artifact/dead file khong tham chieu: `powershell.exe`, `CampusAssistantLocal-Dev.pdb`, `dev-launcher.log`, `clippy-strict.log`, `src/components/QuickSearchModal.tsx`.
114. Dong bo docs: `FEATURE_CATALOG.md`, `FLOW_MAP.md`, `DATA_FLOW.md`, `REGRESSION_MATRIX.md`, `PROJECT_TASKS.md`, `TASK_INDEX.md`, task `CA-055`.
115. `npm run check:all` pass sau cleanup: 50 Vitest, layout check, build, 34 Rust tests, npm audit 0 vulnerabilities.

## Vua sua trong lan nay - CA-056 (School Account UX Cleanup & Polish)

116. Tái cấu trúc `SchoolPage.tsx` thành 3 khối rõ ràng: Hồ sơ local, Kết nối cổng trường, Dữ liệu local.
117. Ẩn/hạ cấp các nút Dev & Danger buttons vào mục Accordion Nâng cao (Advanced Collapsible).
118. Phân cấp nút bấm theo thứ tự: Primary (Mở cổng trường UTH), Secondary (Lưu hồ sơ), Danger (Xóa dữ liệu nằm cuối Accordion có confirm).
119. Đổi wording trung thực theo quy tắc CURRENT vs TARGET (`Cổng UTH: Có thể mở`, `Đồng bộ UTH: Thử nghiệm`, `Lưu token/cookie: Chưa bật`, `Xác thực: Qua website trường`).
120. Bổ sung CSS cho 3 khối section, status pills, collapsible accordion và danger zone trong `src/styles.css`.
121. Sửa khối kết nối không hard-code UTH cho mọi trường: UTH mở WebView hiện có, trường khác hiển thị connector chưa hỗ trợ và disabled primary button.
122. Chuyển action mở portal ngoài xuống Accordion Nâng cao để khối kết nối chỉ còn một action chính.
123. `npm run check:all` pass sau CA-056: 50 Vitest, layout check, build, 34 Rust tests, npm audit 0 vulnerabilities.

## Vua sua trong lan nay - CA-057 (Global Button & Spacing Layout Audit)

124. Rà soát và chuẩn hóa CSS base cho tất cả `<button>` trong ứng dụng (`display: inline-flex`, `align-items: center`, `justify-content: center`, `line-height: 1.4` ngăn cắt đáy).
125. Thêm runtime button contract override cuối `src/styles.css` để thắng các định nghĩa button cũ còn trùng cascade.
126. Chuẩn hóa đồng bộ hệ thống nút Primary (`settings-btn-primary`), Secondary (`settings-btn-secondary`), Danger (`settings-btn-danger`), Mode buttons (`school-mode-btn`), Accordion headers (`school-accordion-header`), Segmented controls, Composer chips, Sidebar & Titlebar buttons.
127. Bổ sung static layout rules vào `tools/layout-regression-check.cjs` cho min-height/alignment của các nhóm button chính.
## Vua sua trong lan nay - CA-076 (Fix Theme Default)

190. Thêm preset `Campus Default` đứng đầu danh sách `skinPresets` hỗ trợ 2 bản Light/Dark linh hoạt theo mode active.
191. Cập nhật nút **Khôi phục** để reset về `Campus Default` đúng theo mode hiện tại mà không làm trộn token dark vào light.
192. Sửa `applyAppearanceToDocument()` để khi `autoBg`, `autoPanel`, `autoText` đang bật thì xóa inline CSS variables `--bg`, `--panel`, `--panel-strong`, `--text`, `--muted` và trả quyền về CSS token `:root[data-theme]`.
193. Giữ nguyên màu custom của người dùng khi `auto... = false`, không đổi schema `AppearanceSettings`, không sửa background image/preset cá nhân.
194. Bổ sung light mode guard cho `.settings-tab`, `.settings-toggle`, `.settings-quick-btn`, `.btn-secondary`.
195. `npm run check:all` pass sau CA-076: 51 Vitest, layout check, build, 35 Rust tests, npm audit 0 vulnerabilities. Manual visual chưa chạy trực tiếp trên HMR.

## Vua sua trong lan nay - CA-070 (Default Theme Reset and Light Mode Border Fix)

182. Thêm preset `Campus Default` đứng đầu danh sách `skinPresets` hỗ trợ 2 bản Light/Dark linh hoạt theo mode active.
183. Cập nhật nút **Khôi phục** để reset về `Campus Default` đúng theo mode hiện tại mà không làm trộn token dark vào light.
184. Rà soát và loại bỏ các rule gây viền đen/nút đen trong Light mode mà không thay đổi Data Contract hay xóa `#000` toàn cục.
185. Cập nhật static assertions trong `tools/layout-regression-check.cjs`.

## Vua sua trong lan nay - CA-071 (Chat Intent Subject Clarification)

186. Xóa fallback tự chọn môn đầu tiên khi chat không nhận diện được môn học.
187. Thêm intent `NEEDS_SUBJECT` và state `WAITING_FOR_SUBJECT` để bot hỏi rõ môn trước khi truy vấn tài liệu.
188. Thêm regression test bảo đảm câu `tìm tài liệu` hoặc `tìm tài liệu học kỳ 1` không tự lấy `subjects[0]`.
189. `npm run check:all` pass sau CA-071.

## Vua sua trong lan nay - CA-072 (Chat Persistence Error Visibility)

190. Sửa `appendMessage()` không còn nuốt lỗi `save_chat_message` bằng `.catch(() => {})`.
191. Privacy guard disabled là hành vi bình thường, không hiện cảnh báo user.
192. Lỗi lưu lịch sử thật hiển thị cảnh báo nhẹ trong UI và chỉ ghi console warning an toàn, không ghi raw chat.
193. Thêm static guard chống đưa empty catch trở lại.
194. `npm run check:all` pass sau CA-072.

## Vua sua trong lan nay - CA-073 (Sidebar Core Navigation Cleanup)

195. Đưa sidebar mặc định về core navigation: `Gần đây`, `Học tập`, `Kết nối`.
196. Loại `Khám phá`, `Minigame`, `Phần thưởng` khỏi sidebar mặc định vì `CA-064` vẫn Frozen / Activation-only.
197. Thêm `GPA / CPA` và `Trường & tài khoản` vào nhóm navigation đúng ngữ cảnh.
198. Cập nhật static guard để không kéo lại extension placeholder vào sidebar core.
199. `npm run check:all` pass sau CA-073: 51 Vitest, layout check, build, 35 Rust tests, npm audit 0 vulnerabilities.

## Vua sua trong lan nay - CA-074 (Runtime Docs Reconciliation)

200. Đồng bộ docs runtime sau các task core CA-071/CA-072/CA-073.
201. Cập nhật `SYSTEM_BLUEPRINT.md`: lịch học/lịch thi ưu tiên SQLite connector cache trước sample fallback.
202. Cập nhật `FLOW_MAP.md`: thêm `NEEDS_SUBJECT`, `CHAT_MESSAGE_PERSISTENCE`, `SIDEBAR_CORE_NAVIGATION`.
203. Cập nhật `STATE_MACHINES.md`: thêm state `WAITING_FOR_SUBJECT` và invariant không tự chọn môn đầu tiên.
204. Cập nhật `FEATURE_CATALOG.md`: chat intent là rule-based CURRENT, chat history local là opt-in CURRENT.
205. Thêm `docs/RUNTIME_FLOW_OVERVIEW.md` làm bản tổng CURRENT/PARTIAL/PLANNED cho runtime chính.
206. `npm run check:all` pass sau CA-074: 51 Vitest, layout check, build, 35 Rust tests, npm audit 0 vulnerabilities.

## Vua sua trong lan nay - CA-075 (Unified Runtime Flow and Chatbox Stability)

207. Chuẩn hóa các đường gửi chat qua một entry `submitUserMessage(rawValue, source)` trong `src/App.tsx`.
208. Nút Gửi, phím Enter, starter card, composer shortcut, command suggestion và command palette chat action cùng đi qua pipeline chung.
209. Bỏ silent return khi bootstrap chưa xong; pipeline trả feedback rõ `Ứng dụng đang khởi tạo dữ liệu local...` thay vì không phản hồi.
210. Giữ nguyên Rust privacy boundary cho chat history, không đổi Tauri command/payload, không đổi SQLite schema và không đổi intent contract.
211. Cập nhật `docs/FLOW_MAP.md`, `docs/RUNTIME_FLOW_OVERVIEW.md`, `docs/FEATURE_CATALOG.md` và static guard trong `tools/layout-regression-check.cjs`.
212. `npm run check:all` pass sau CA-075: 51 Vitest, layout check, build, 35 Rust tests, npm audit 0 vulnerabilities.

## Vua sua trong lan nay - CA-069B (Logo Size and Background Fix)

177. Tạo file `src/vite-env.d.ts` với `/// <reference types="vite/client" />` sửa triệt để lỗi TypeScript build khi import ảnh.
178. Cập nhật `.brand-icon.logo-brand` trong `src/App.tsx` và `src/styles.css`, xóa bỏ background card tối vuông chìm xung quanh logo.
179. Tăng kích thước logo Sidebar Expanded lên `30px` × `30px` và Collapsed rail 54px lên `32px` × `32px` hiển thị to, rõ nét.
180. Giữ Titlebar logo gọn `18px` × `18px`.
181. Cập nhật static assertions trong `tools/layout-regression-check.cjs`.

## Vua sua trong lan nay - CA-069 (Unified App Logo System)

172. Sao chép `logo.png` (1024x1024, nền trong suốt) từ root sang `src/assets/logo.png`.
173. Thay thế brand icon `Sparkles` trong Sidebar bằng `<img src={appLogo} alt="Campus Assistant Logo" className="brand-logo-img" />`.
174. Cập nhật Titlebar brand icon đồng bộ logo ứng dụng.
175. Bổ sung CSS sizing & protective scaling `object-fit: contain` và `image-rendering: -webkit-optimize-contrast` cho `.brand-logo-img` & `.titlebar-logo-img`.
176. Cập nhật static assertions trong `tools/layout-regression-check.cjs`.

## Vua sua trong lan nay - CA-067 (Chat History Delete Modal Polish)

167. Tinh chỉnh Custom Delete Modal trong `src/pages/ChatHistoryPage.tsx` và `src/styles.css` hỗ trợ 100% Light/Dark theme.
168. Sử dụng token `var(--text)`, `var(--muted)`, `var(--panel)`, `var(--border)` thay vì hardcode `#1a1a1a`, `#ff2a4b`.
169. Chuẩn hóa overlay Light mode `rgba(17, 24, 39, 0.28)` blur 2px và Dark mode `rgba(0, 0, 0, 0.42)`.
170. Bổ sung accessibility đầy đủ: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, lắng nghe `Escape`, click overlay đóng modal, `autoFocus` nút Hủy.
171. Cập nhật static assertions trong `tools/layout-regression-check.cjs` kiểm tra loại bỏ hoàn toàn các màu hardcode cũ.

## Vua sua trong lan nay - CA-066 (Chat History MVP)

160. Tạo trang `src/pages/ChatHistoryPage.tsx` hiển thị Lịch sử trò chuyện local-first (Empty state khi disabled, danh sách phiên 4 nhóm `Đã ghim`, `Hôm nay`, `Tuần này`, `Cũ hơn` khi enabled).
161. Triển khai SQLite migration v2 có `conn.transaction()` thêm 2 cột `pinned` và `archived` vào `chat_sessions`.
162. Thêm backend guard trong Rust (`save_chat_message`) tự động ngắt ghi khi `chatHistoryEnabled = false`.
163. Áp dụng policy không backfill: chỉ lưu tin nhắn mới từ thời điểm opt-in trở đi.
164. Tải lại đầy đủ tin nhắn của phiên cũ khi người dùng chọn phiên từ trang `ChatHistoryPage`.
165. Sanitize và giới hạn độ dài tiêu đề phiên tối đa 100 ký tự khi đổi tên.
166. Bảo toàn/tái tạo session `default` khi thực hiện `clear_all_chat_sessions()`. Yêu cầu confirm khi xóa 1 phiên hoặc xóa tất cả.

## Vua sua trong lan nay - CA-065 (Sidebar Planned Items & History Entry)

155. Bổ sung Section `Gần đây` chứa item `Lịch sử trò chuyện` (badge `Local`) vào Sidebar ngay dưới `Phiên hiện tại`.
156. Bổ sung Section `Khám phá` chứa item `Minigame` (icon `Gamepad2`) và `Phần thưởng` (icon `Gift`, badge `Sắp có`) vào Sidebar ngay dưới `Tra cứu`.
157. Bọc tất cả text trong `span.nav-label` và badge trong `span.nav-badge`. Ép `display: none !important` cho ca hai ở trạng thái rail collapsed 54px.
158. Bổ sung click handler an toàn cho 3 item định hướng: hiển thị thông báo hệ thống/toast, không chuyển route/page mới, không lưu raw chat, không thêm SQLite schema.
159. Thêm static assertions kiểm tra cả `src/App.tsx` và `src/styles.css` trong `tools/layout-regression-check.cjs`.

## Vua sua trong lan nay - CA-064 (Sidebar UI Desktop Polish)

151. Tái cấu trúc Sidebar trong `src/App.tsx`: di chuyển nút "Ghim thanh bên" khỏi giữa sidebar lên Header `.brand` dưới dạng nút `.sidebar-pin-btn` 26x26px, xóa bỏ nút `sidebar-toggle-btn` nằm trôi nổi ở giữa.
152. Tinh chỉnh CSS Sidebar trong `src/styles.css`:
   - Header căn gọn, status pill "Ứng dụng local" nhỏ không chiếm nhiều chiều cao.
   - Nút "Cuộc trò chuyện mới" cao 38px, icon + text căn giữa.
   - Card "Trợ lý tài liệu" nhẹ hơn: viền nhẹ `1px solid color-mix(...)`, nền nhẹ, text phụ "Sẵn sàng" 11px muted.
   - Nhóm "Tra cứu": `gap: 4px`, mỗi item cao 34px, icon + text căn trái đồng đều.
   - Footer account: thu gọn height (52px), gear settings đặt rõ bên phải.
153. Bổ sung static layout assertions trong `tools/layout-regression-check.cjs`.
154. Khắc phục lỗi sidebar collapsed 54px: bọc nhãn chữ trong `span.nav-label` để ẩn mượt mà khi thu gọn, chỉ giữ icon 36px và hiển thị tooltip khi hover.

## Vua sua trong lan nay - CA-063 (Codex Default Runtime Theme & Layout Contract)

142. Thay thế hướng CA-062 bằng runtime winner block cuối `src/styles.css` để default Codex-like thắng cascade CSS cũ.
143. Giữ nguyên hệ thống background/preset cá nhân: không sửa `--user-bg-*`, overlay, lưu ảnh nền hoặc Appearance Studio.
144. Chuẩn hóa runtime mặc định: font Inter/Segoe UI/system-ui, titlebar/sidebar neutral, content không bị sidebar che, card/bubble/composer dùng border nhẹ.
145. Migrate riêng màu legacy default `#6d5dfc` sang default mới `#3b82f6` trong `useAppearanceDraft.ts`.

## CA-062 superseded by CA-063

149. CA-062 không được tính Done vì chưa đủ runtime cascade winner và vẫn có nguy cơ bị rule cũ đè khi kiểm tra visual thực tế.
150. Mọi sửa tiếp theo cho default Codex-like layout phải đi qua `tasks/CA-063-codex-default-runtime-theme.md`.

## Vua sua trong lan nay - CA-061 (Default Big Layout & Codex-like Visual System)

138. Chuẩn hóa hệ thống Design Tokens mặc định trong `src/styles.css` theo tinh thần Codex-like: màu sắc trung tính (Neutral Gray), màu nhấn mặc định Blue Accent (`#3b82f6`), typography rõ ràng, radius nhẹ (6px/8px/10px), shadow tối giản.
139. Cập nhật fallback màu nhấn mặc định khi chưa có cấu hình cá nhân từ `#6d5dfc` thành `#3b82f6` trong `useAppearanceDraft.ts` và `App.tsx` (giữ nguyên 100% khả năng tùy biến preset cá nhân của người dùng).
140. Refine layout cho App Shell, Sidebar, Titlebar, Chat Layout, Settings Page (1-column max-width 760px), Cards, Buttons, Tables.
141. Bổ sung static layout assertions vào `tools/layout-regression-check.cjs` kiểm tra design tokens mới (`--font-sans`, `--accent: #3b82f6`, `--radius-md`, `--space-4`, `settings-shell max-width guard`).

## Vua sua trong lan nay - CA-060 (Fix Settings Tab Active Blank State)

134. Khắc phục triệt để lỗi visual bug: Tab Settings active (`.settings-tab.active`) bị biến thành ô trắng viền tím trong Light Mode do global `button:hover:not(:disabled)` đè `background: var(--panel-strong)` (`#ffffff`).
135. Cập nhật `src/styles.css` thêm quy tắc `:hover` và `:focus-visible` cho `.settings-tab.active` ép `color: var(--accent-contrast, #ffffff) !important; background: var(--accent) !important; border-color: transparent !important;`.
136. Rà soát đồng bộ các nút active khác (`.segmented-control button.active`, `.school-mode-btn.active`, `.settings-btn-primary`, `.settings-toggle.active`) đảm bảo `:hover` không bị hiện tượng white-on-white.
137. Bổ sung static layout assertion vào `tools/layout-regression-check.cjs` kiểm tra `.settings-tab.active:hover` contract và chạy `npm run check:all` pass 100%.

## Vua sua trong lan nay - CA-058 (Settings Controls & Portal Fallback)

129. Sửa `SchoolPage.tsx`: nút chính `Mở portal UTH trên trình duyệt` dùng trình duyệt mặc định thay vì mở WebView trắng.
130. Chuyển WebView UTH xuống Accordion Nâng cao với nhãn thử nghiệm, để action chính không còn phụ thuộc WebView chưa ổn định.
131. Sửa `SettingsPage.tsx`: khóa Language ở `Tiếng Việt (đang hỗ trợ)`, không còn lựa chọn English giả khi app chưa có i18n thật.
132. Sửa `SettingsPage.tsx` và `App.tsx`: Auto-focus Chat toggle cập nhật state runtime ngay, không chỉ lưu `localStorage`.
133. Sửa `SettingsPage.tsx`: nút đăng xuất phiên trường dùng session thật nếu có; khi chưa có session thì disabled và ghi rõ `Chưa có phiên trường`.
134. Cập nhật task `CA-058` và `TASK_INDEX.md`; `npm run check:all` pass sau CA-058: 50 Vitest, layout check, build, 34 Rust tests, npm audit 0 vulnerabilities.

## Bo sung governance - Evidence-first completion gate

135. Cập nhật `AGENTS.md`: thêm cổng nghiệm thu Evidence-first, cấm báo Done nếu thiếu `file:line`, lệnh kiểm chứng và kết quả rút gọn.
136. Cập nhật `docs/INVARIANTS.md`: thêm `AI-006`, `AI-007`, `AI-008` để cấm báo cáo mâu thuẫn source và phân biệt `check:all` với manual UI verification.
137. Cập nhật `docs/AI_CHANGE_PROTOCOL.md`: thêm Evidence Commands ở Phase 0/2, bắt chạy lại ở Phase 4, và bắt đồng bộ task governance ở Phase 5.
138. Cập nhật `tasks/TASK_INDEX.md`: thêm Definition of Done bắt buộc cho mọi task trước khi chuyển sang Done.

## Trang thai du an

## Kế hoạch bổ sung 2026-10-08 - Postman và dữ liệu trường

- CONFIRMED: rà soát task hiện có chưa thấy task riêng xác minh contract Postman; các task CA-036/CA-054 là gate thiết kế và nghiệm thu, không thay thế evidence API thật.
- PLANNED: CA-080 xác minh Profile/Schedule/Exams bằng request thật, fixture loại PII, tham số ngày và response tests; Announcements/Documents/Grades ghi Unknown tới khi có bằng chứng.
- PLANNED: CA-081 sửa parser và sync theo contract verified, phân biệt Error/Empty, giữ cache khi lỗi và không điền giá trị nghiệp vụ giả.
- Hai task giữ `Status: Proposed` trong Ready / Proposed; chưa có task active, chưa sửa runtime hoặc collection, chưa gửi request trường.
- Phạm vi lần này chỉ là lập task và đồng bộ chỉ mục; không xác nhận build/API/E2E đã pass. Các mục release freeze cũ là lịch sử, kế hoạch mới được bổ sung theo yêu cầu user.

## Trạng thái baseline đã ghi trước đây

- Core local app, chat intent, file safety, docs governance va cac trang local da co test/build pass.
- Connector truong that van o trang thai experimental/partial: da co WebView portal va sync prototype, chua co E2E cookie/session extraction va encrypted persistent secret vault.
- Thu muc hien tai khong phai Git repository hop le, nen rollback phai dua vao backup/ZIP/file copy neu can.

## Vua sua trong lan nay - CA-077 (Release Freeze and Final Handoff)

213. Chot release freeze ngay 2026-08-02, khong them tinh nang moi.
214. Cap nhat `CURRENT_STATE.txt` tu trang thai CA-059 cu sang trang thai source 1.0.1 hien tai.
215. Cap nhat `README.md` de phan biet CURRENT / LIMITED / experimental: chat history opt-in, public admissions limited, UTH connector partial, Reward/Minigame Frozen.
216. Chay `npm run check:all`: pass, gom 51 Vitest, layout regression, TypeScript/Vite build, 35 Rust tests, npm audit 0 vulnerabilities.
217. `npm run build:installer` all-target khong dung duoc lam artifact cuoi vi MSI/WiX va target mac dinh gap loi Windows file lock / `light.exe`.
218. Build rieng NSIS bang `npm run tauri build -- --bundles nsis` voi `CARGO_TARGET_DIR=.release-target`: pass, tao `C:\Users\PC\Downloads\bot game\.release-target\release\bundle\nsis\Campus Assistant Local_1.0.1_x64-setup.exe`.
# CA-082 - Kết quả remediation 2026-10-08

- CURRENT: cache-only đúng MSSV/source cho chat/page; thông báo/tài liệu trường chưa đồng bộ ghi rõ giới hạn, mẫu tách tab riêng.
- GPA nhập tay trống mặc định, giữ v1; portal await/error, không coi MSSV/browser login là auth app.
- Sửa Emitter, responsive grid/bảng/avatar/window icons; check:all PASS 61 Vitest/37 Rust/audit 0.
- Playwright local PASS, screenshots đã xem; native auth/sync/window controls chưa E2E. Installer chưa build lại.
- CA-082 Done trong scope; CA-080/081 Proposed, không báo kết nối trường hoàn thành.
