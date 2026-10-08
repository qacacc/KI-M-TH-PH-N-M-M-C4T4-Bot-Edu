const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "src", "App.tsx"), "utf8");
const appearancePage = fs.readFileSync(path.join(root, "src", "pages", "AppearancePage.tsx"), "utf8");
const appearanceHook = fs.readFileSync(path.join(root, "src", "hooks", "useAppearanceDraft.ts"), "utf8");
const engine = fs.readFileSync(path.join(root, "src", "engine.ts"), "utf8");

const failures = [];

function assertContains(name, content, expected) {
  if (!content.includes(expected)) {
    failures.push(`${name}: thiếu "${expected}"`);
  }
}

function assertNotContains(name, content, unexpected) {
  if (content.includes(unexpected)) {
    failures.push(`${name}: không được chứa "${unexpected}"`);
  }
}

function assertCount(name, content, substring, expectedCount) {
  const count = content.split(substring).length - 1;
  if (count !== expectedCount) {
    failures.push(`${name}: xuất hiện ${count} lần (kỳ vọng ${expectedCount} lần)`);
  }
}

function assertRegex(name, content, pattern) {
  if (!pattern.test(content)) {
    failures.push(`${name}: không khớp ${pattern}`);
  }
}

// Titlebar: search phải nằm giữa và không đè action ở viewport nhỏ.
assertContains("titlebar search center", styles, ".titlebar-center-search");
assertRegex("titlebar search absolute center", styles, /\.titlebar-center-search\s*\{[\s\S]*position:\s*absolute[\s\S]*left:\s*50%[\s\S]*translateX\(-50%\)/);
assertContains("titlebar search small viewport hide", styles, "@media (max-width: 820px)");
assertContains("titlebar search gated outside settings", app, '{view !== "settings" && (');
assertContains("titlebar search opens command palette", app, 'className="titlebar-center-search"');

// Settings: mở như trang riêng, không kéo theo sidebar/panel workspace.
assertContains("settings shell mode", app, 'view === "settings" ? "app-shell settings-mode" : "app-shell"');
assertContains("settings css single column", styles, ".app-shell.settings-mode");
assertRegex("settings single column css", styles, /\.app-shell\.settings-mode\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);

// Appearance: không được mở song song customize panel bên phải.
assertContains("appearance hides customize width", app, 'const customizeWidth = view === "appearance" ? 0 : layoutWidths.customize');
assertContains("appearance hidden customize handle", app, 'view === "appearance" ? "resize-handle resize-handle-customize hidden"');
assertContains("collapsed side panels hide content", styles, ".customize-panel.collapsed > *");

// Sidebar rail: icon compact phải ổn định và tooltip chỉ xuất hiện khi rail đang gọn.
assertContains("sidebar compact selector", styles, ".sidebar:not(.expanded):not(:hover)");
assertContains("sidebar focus keeps expanded affordance", styles, ":not(:focus-within)");
assertContains("sidebar tooltip", styles, ".sidebar-tooltip");
assertContains("sidebar tooltip hidden when expanded", styles, ".sidebar.expanded .sidebar-tooltip");
assertContains("sidebar tooltip hidden on hover expanded", styles, ".sidebar:hover .sidebar-tooltip");
assertRegex("sidebar compact fixed icon size", styles, /\.sidebar:not\(\.expanded\):not\(:hover\)[\s\S]*\.nav-groups button[\s\S]*width:\s*36px[\s\S]*height:\s*36px/);

// Responsive middle content: main area không quay lại lỗi chữ bị ép dọc.
assertContains("large breakpoint removes utility panel", styles, "@media (max-width: 1500px)");
assertContains("medium breakpoint single content column", styles, "@media (max-width: 1180px)");
assertContains("content min width guard", styles, "minmax(0, 1fr)");

// Appearance Studio: preview và grid phải có responsive guard.
assertContains("appearance preview exists", styles, ".appearance-preview");
assertContains("appearance grid exists", styles, ".appearance-grid");
assertContains("appearance grid children min width", styles, ".appearance-grid > *");
assertContains("appearance mobile grid", styles, "@media (max-width: 750px)");

// System Button System: kiểm tra các class nút chuẩn hóa và quy tắc display flex alignment.
assertContains("button base inline-flex", styles, "display: inline-flex");
assertContains("settings primary button class", styles, ".settings-btn-primary");
assertContains("settings secondary button class", styles, ".settings-btn-secondary");
assertContains("settings danger button class", styles, ".settings-btn-danger");
assertRegex("button base line-height guard", styles, /button\s*\{[\s\S]*line-height:\s*1\.4/);
assertRegex("settings primary min height", styles, /\.settings-btn-primary[\s\S]*min-height:\s*38px/);
assertRegex("settings secondary min height", styles, /\.settings-btn-secondary[\s\S]*min-height:\s*38px/);
assertRegex("settings danger min height", styles, /\.settings-btn-danger[\s\S]*min-height:\s*38px/);
assertRegex("segmented button min height", styles, /\.segmented-control button\s*\{[\s\S]*min-height:\s*32px/);
assertRegex("school mode button min height", styles, /\.school-mode-btn\s*\{[\s\S]*min-height:\s*36px/);
assertRegex("school accordion min height", styles, /\.school-accordion-header\s*\{[\s\S]*min-height:\s*44px/);
assertRegex("composer chip alignment", styles, /\.composer-chip[\s\S]*min-height:\s*28px/);
assertContains("button disabled contract", styles, "pointer-events: none !important");

// CA-059: Control Visibility & Accessibility Guard
assertContains("titlebar appearance button aria-label", app, 'aria-label="Tùy biến Giao diện"');
assertContains("titlebar health button aria-label", app, 'aria-label="Kiểm tra hệ thống"');
assertContains("titlebar privacy button aria-label", app, 'aria-label="Quyền riêng tư & Bảo mật"');
assertContains("send button aria-label", app, 'aria-label="Gửi tin nhắn"');
assertRegex("assistant option card grid guard", styles, /\.assistant-option-card\s*\{[\s\S]*display:\s*grid/);

// CA-059: Duplicate Selector & Structural Integrity Guards
assertCount("settings quick btn single definition", styles, ".settings-quick-btn {", 1);
assertCount("settings toggle single definition", styles, ".settings-toggle {", 1);
assertNotContains("no settings toggle span rule", styles, ".settings-toggle span");
assertContains("assistant option card display grid important", styles, "display: grid !important");

// CA-060: Settings Tab & Toggle Active Hover & Contrast Guard
assertContains("settings tab active hover rule", styles, ".settings-tab.active:hover");
assertContains("settings tab active background important", styles, "background: var(--accent) !important");
assertContains("settings tab active color important", styles, "color: var(--accent-contrast, #ffffff) !important");
assertContains("settings toggle active hover rule", styles, ".settings-toggle.active:hover");

// CA-061: Default Campus-like Design Tokens & Layout Guard
assertContains("design token font sans", styles, "--font-sans");
assertContains("design token accent blue default", styles, "--accent: #3b82f6");
assertContains("design token radius md", styles, "--radius-md: 8px");
assertContains("design token space 4", styles, "--space-4: 16px");
assertContains("settings max width guard", styles, "max-width: 760px");

// CA-062: Sidebar Non-Overlapping & Final Cascade Guard
assertContains("sidebar content margin collapsed", styles, "margin-left: 54px !important");
assertContains("sidebar content margin expanded", styles, "margin-left: 260px !important");
assertContains("composer final width 820px important", styles, "width: min(100%, 820px) !important");
assertNotContains("no content clamp padding left 72px", styles, "clamp(72px, 5vw, 92px)");
assertNotContains("no composer accent 36% border", styles, "var(--accent) 36%");

// CA-063: Default Runtime Winner Guard
assertContains("default runtime contract marker", styles, "CA-063 DEFAULT RUNTIME CONTRACT");
assertContains("default font stack", styles, '--font-sans: "Inter", "Segoe UI", system-ui');
assertContains("default titlebar neutral background", styles, "background: var(--bg) !important");
assertContains("default sidebar default width", styles, "width: 54px !important");
assertContains("default sidebar expanded width", styles, "width: 260px !important");
assertContains("default content default margin", styles, "margin-left: 54px !important");
assertContains("default composer compact width", styles, "width: min(100%, 820px) !important");
assertContains("default composer neutral border", styles, "border: 1px solid var(--border) !important");
assertContains("default composer no backdrop", styles, "backdrop-filter: none !important");
// CA-063: Sidebar Desktop Polish Guard
assertContains("sidebar pin button contract", styles, ".sidebar-pin-btn");
assertContains("sidebar nav groups flex gap 4px", styles, "gap: 4px !important");
assertContains("sidebar new chat button height", styles, "min-height: 38px !important");
assertContains("sidebar session button contract", styles, "min-height: 40px !important");
assertContains("sidebar footer height contract", styles, "min-height: 52px !important");
assertContains("sidebar nav labels wrapped", app, 'className="nav-label"');
assertContains("sidebar collapsed label guard", styles, "CA-063 SIDEBAR COLLAPSED LABEL GUARD");
assertContains("sidebar collapsed hides nav label", styles, ".sidebar:not(.expanded):not(:hover) .nav-label");
assertRegex("sidebar collapsed buttons fixed square", styles, /\.sidebar:not\(\.expanded\):not\(:hover\) \.new-chat-button,[\s\S]*\.sidebar:not\(\.expanded\):not\(:hover\) \.nav-groups button[\s\S]*width:\s*36px !important[\s\S]*height:\s*36px !important/);

// CA-073: Sidebar Core Navigation Cleanup Guard
assertContains("app section gần đây", app, "<h2>Gần đây</h2>");
assertContains("app section học tập", app, "<h2>Học tập</h2>");
assertContains("app section kết nối", app, "<h2>Kết nối</h2>");
assertContains("app history entry", app, "Xem tất cả lịch sử");
assertContains("app gpa entry", app, "GPA / CPA");
assertContains("app school account entry", app, "Trường & tài khoản");
assertNotContains("app no default explore section", app, "<h2>Khám phá</h2>");
assertNotContains("app no default minigame placeholder", app, "Minigame");
assertNotContains("app no default reward placeholder", app, "Phần thưởng");
assertNotContains("app no planned feature click handler", app, "handlePlannedFeatureClick");
assertContains("css nav badge contract", styles, ".nav-badge");
assertContains("css collapsed nav badge hide", styles, ".sidebar:not(.expanded):not(:hover) .nav-badge");
assertNotContains("css no soon badge in core sidebar", styles, ".soon-badge");
assertNotContains("css no planned placeholder in core sidebar", styles, ".planned-item-placeholder");

const chatHistoryPage = fs.readFileSync(path.join(root, "src", "pages", "ChatHistoryPage.tsx"), "utf8");

// CA-066 & CA-067: Chat History MVP & Delete Modal Polish Guard
assertContains("chat history page empty state", chatHistoryPage, "Chưa bật lưu lịch sử local");
assertContains("chat history page pinned section", chatHistoryPage, "Đã ghim");
assertContains("chat history page today section", chatHistoryPage, "Hôm nay");
assertContains("chat history page custom delete modal", chatHistoryPage, "history-modal-overlay");
assertContains("chat history modal a11y role", chatHistoryPage, 'role="dialog"');
assertContains("chat history modal a11y modal", chatHistoryPage, 'aria-modal="true"');
assertContains("css chat history container", styles, ".chat-history-container");
assertContains("css chat history custom delete modal card", styles, ".history-modal-card");
assertContains("css chat history custom delete modal button", styles, ".modal-btn-delete");
assertContains("css chat history modal light overlay", styles, "rgba(17, 24, 39, 0.28)");
assertContains("css chat history modal theme panel", styles, "background: var(--panel);");
assertNotContains("css no hardcoded dark modal bg", styles, "background: #1a1a1a;");
assertNotContains("css no hardcoded dark modal overlay", styles, "rgba(0, 0, 0, 0.65)");

// CA-069 & CA-069B: Unified App Logo System & Size/Background Fix Guard
assertContains("app import logo asset", app, 'import appLogo from "./assets/logo.png"');
assertContains("app sidebar brand logo img", app, 'className="brand-logo-img"');
assertContains("app sidebar logo brand wrapper", app, 'className="brand-icon logo-brand"');
assertContains("app titlebar logo img", app, 'className="titlebar-logo-img"');
assertContains("css brand logo img rules", styles, ".brand-logo-img");
assertContains("css logo brand transparent bg", styles, ".brand-icon.logo-brand");
assertContains("css expanded logo 30px size", styles, "width: 30px;");
assertContains("css collapsed logo 32px size", styles, "width: 32px;");
assertContains("css logo object fit contain", styles, "object-fit: contain;");

// CA-070: Default Theme Reset and Light Mode Border Fix Guard
assertContains("appearance campus default preset id", appearancePage, 'id: "campus-default"');
assertContains("appearance campus default preset label", appearancePage, 'label: "Campus Default"');
assertContains("appearance campus default uses current theme", appearancePage, "theme,");
assertContains("appearance imports default theme helper", appearancePage, "getDefaultAppearanceForTheme");
assertContains("appearance hook default theme helper", appearanceHook, "function getDefaultAppearanceForTheme");
assertContains("appearance hook auto bg light dark sync", appearanceHook, "current.autoBg && current.backgroundColor === oppositePalette.backgroundColor");
assertContains("css campus default swatch", styles, ".skin-campus-default");
assertContains("css ca070 contract marker", styles, "CA-070 DEFAULT THEME RESET AND LIGHT MODE BORDER FIX");
assertContains("css light border token guard", styles, "--border: #e5e7eb");
assertContains("css light secondary button guard", styles, ':root[data-theme="light"] .settings-btn-secondary');

// CA-071: Chat Intent Subject Clarification Guard
assertNotContains("engine no subject zero fallback", engine, "subjects[0]");
assertContains("engine needs subject intent", engine, 'intent: "NEEDS_SUBJECT"');
assertContains("app waiting for subject state", app, 'step === "WAITING_FOR_SUBJECT"');

// CA-072: Chat Persistence Error Visibility Guard
assertContains("app history persistence warning state", app, "setHistoryPersistenceWarning");
assertContains("app save chat message command", app, 'invoke("save_chat_message"');
assertContains("app safe persistence warning text", app, "Lịch sử chat local chưa lưu được");
assertNotContains("app no empty catch persistence", app, ".catch(() => {})");
assertContains("css warning box", styles, ".warning-box");

// CA-075: Unified Runtime Flow & Chatbox Stability Guard
assertContains("app unified submit entry", app, "async function submitUserMessage");
assertContains("app bootstrap guard feedback", app, "Ứng dụng đang khởi tạo dữ liệu local");
assertContains("app bootstrap route guard", app, "canRouteBeforeBootstrap");
assertContains("app form submit uses unified pipeline", app, 'await submitUserMessage(input, "composer")');
assertContains("app submitText wrapper uses unified pipeline", app, "await submitUserMessage(rawValue, source)");
assertContains("app command suggestion uses unified pipeline", app, 'await submitUserMessage(command, "command-suggestion")');
assertNotContains("app no silent command suggestion bootstrap return", app, "if (!bootstrap) return;");

// CA-076: Fix Theme Default & Auto Property Removal Guard
assertContains("appearance hook auto bg removeProperty", appearanceHook, 'document.documentElement.style.removeProperty("--bg")');
assertContains("appearance hook auto panel removeProperty", appearanceHook, 'document.documentElement.style.removeProperty("--panel")');
assertContains("appearance hook auto text removeProperty", appearanceHook, 'document.documentElement.style.removeProperty("--text")');
assertContains("css light settings tab guard", styles, ':root[data-theme="light"] .settings-tab');

if (!fs.existsSync(path.join(root, "src", "vite-env.d.ts"))) {
  failures.push("thiếu file src/vite-env.d.ts");
}

if (failures.length > 0) {
  console.error("Layout regression check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Layout regression check passed.");
