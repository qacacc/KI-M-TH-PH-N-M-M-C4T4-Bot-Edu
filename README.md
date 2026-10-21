# Campus Assistant Local

[English](#english) · [Tiếng Việt](#tiếng-việt)

## English

Campus Assistant Local is a local-first desktop application for students. It provides a rule-based chat interface, local academic views, document access, opt-in chat history, storage diagnostics, and a manual GPA calculator without sending credentials, tokens, cookies, chat content, or documents to a developer server.

### Current status

**CONFIRMED:** the current product boundary is a Tauri 2 + React + TypeScript + Rust desktop app with SQLite-local settings, session metadata, action logs, and opt-in chat history.

**LIMITED / NOT VERIFIED:** UTH authentication, live synchronization, and school API/business contracts are not verified. The release checklist now reports this as a warning instead of treating missing local academic data as a failure or claiming an unverified connector is ready.

**IN PROGRESS:** CA-084 release audit and checklist reconciliation. CA-090.01 has migration/reset evidence but still needs its own native/UI verification and review gate. CA-080 local REST/Postman checks are available; the real UTH contract remains unknown.

### Features in the verified local scope

- Tauri 2 desktop shell with React, TypeScript, Vite, and Rust.
- Rule-based local intent engine; this is not a general-purpose AI chat service.
- Local SQLite settings, metadata logs, and opt-in raw chat history.
- Local documents, announcements, schedules, and exams with explicit source boundaries.
- Manual GPA/CPA calculator with local persistence.
- Health report, storage summary, diagnostic export, and local-first release checklist.
- Appearance customization, light/dark themes, accent colors, managed background assets, and split-view layout.
- Managed file actions limited to the application workspace.
- Local Postman collection for REST error, empty-result, validation, cache, and sync-gate scenarios.

### Explicit boundaries

- No Ollama, OpenAI API, RAG, embeddings, vector database, or Zalo production bot.
- No production-ready school connector, SSO, credential vault, cookie capture, or session proxy.
- No default claim that local fixtures are a student's real academic data.
- No arbitrary filesystem browsing, rename, move, or system-wide file manager.
- Reward/minigame and mini-pet work remain frozen unless explicitly activated.

### Architecture

```text
React + TypeScript + Vite
          │
          │ Tauri IPC
          ▼
Rust + Tauri 2
          │
          ├── SQLite local data
          ├── Managed workspace/file boundary
          ├── Health and diagnostic services
          └── Explicitly gated school connector surface
```

### Development

```powershell
npm install
npm run dev:desktop
```

For the browser-only development server:

```powershell
npm run dev:web
```

Use `CampusAssistantLocal-Dev.exe` when working on the desktop UI with Vite HMR. Do not use `http://127.0.0.1:5173` as a substitute for the Tauri desktop runtime when testing native IPC.

### Verification

```powershell
npm run test
npm run test:layout
npm run check:postman
npm run build
npm run check:rust
npm run test:rust
npm run check:all
```

`npm run check:all` is the canonical gate. It runs Vitest, layout checks, local Postman checks, TypeScript/Vite build, Rust checks/tests, and `npm audit`.

### Release and package status

The repository currently has no published GitHub Release or package. Those GitHub pages are separate from this README. A release or Docker/package publication must be created deliberately from a verified commit; it is not implied by a passing local build.

### Contribution workflow

1. Update your branch from the latest `main`.
2. Make a focused change on a feature branch.
3. Run the relevant tests and `npm run check:all`.
4. Open a pull request with the task ID, files changed, test output, and known limits.
5. Merge only after review and checks pass.

Never commit credentials, tokens, cookies, `.env` secrets, raw chat, or personal academic data.

### Team / contributors

| Name | GitHub |
| --- | --- |
| Huỳnh Tấn Đạt | [@qacacc](https://github.com/qacacc) |
| Nguyễn Hữu Gia Khang | [@Bryan13032004](https://github.com/Bryan13032004) |
| Nguyễn Văn Hà | [@hakury9662](https://github.com/hakury9662) |
| Nguyễn Thị Ngọc Trâm | [@NgocTram05](https://github.com/NgocTram05) |
| Lê Đức Toàn | [@toan-ei](https://github.com/toan-ei) |
| Nguyễn Đình Khiêm | [@Khiem1074](https://github.com/Khiem1074) |
| Võ Anh Sơn | [@anhson05](https://github.com/anhson05) |

## Tiếng Việt

Campus Assistant Local là ứng dụng desktop local-first dành cho sinh viên. Ứng dụng cung cấp giao diện chat theo luật, các màn hình dữ liệu học tập cục bộ, truy cập tài liệu, lịch sử chat bật theo lựa chọn, chẩn đoán bộ nhớ và tính GPA thủ công. Ứng dụng không gửi mật khẩu, token, cookie, nội dung chat hoặc tài liệu đến máy chủ của nhóm phát triển.

### Trạng thái hiện tại

**ĐÃ XÁC NHẬN:** sản phẩm hiện tại là ứng dụng desktop Tauri 2 + React + TypeScript + Rust, dùng SQLite cục bộ cho cấu hình, metadata phiên, nhật ký thao tác và lịch sử chat opt-in.

**GIỚI HẠN / CHƯA XÁC MINH:** đăng nhập UTH, đồng bộ trực tiếp và hợp đồng API/nghiệp vụ của trường chưa được xác minh. Checklist phát hành hiện cảnh báo rõ giới hạn này, không còn coi dữ liệu học tập cục bộ rỗng là lỗi và không tự nhận connector chưa xác minh là sẵn sàng.

**ĐANG THỰC HIỆN:** CA-084 — audit và đối chiếu checklist phát hành. CA-090.01 đã có bằng chứng migration/reset nhưng vẫn còn cần kiểm tra native/UI và review riêng. CA-080 đã có bộ kiểm tra REST/Postman local; hợp đồng UTH thật vẫn chưa biết.

### Tính năng trong phạm vi local đã xác nhận

- Desktop Tauri 2 với React, TypeScript, Vite và Rust.
- Engine intent local theo luật, không phải dịch vụ AI chat tổng quát.
- SQLite cục bộ cho cấu hình, metadata log và lịch sử chat opt-in.
- Tài liệu, thông báo, lịch học và lịch thi local với ranh giới nguồn rõ ràng.
- Công cụ tính GPA/CPA thủ công và lưu cục bộ.
- Health report, thống kê storage, diagnostic export và checklist release local-first.
- Tùy chỉnh giao diện, light/dark, màu accent, ảnh nền được quản lý và bố cục split-view.
- Thao tác file chỉ nằm trong workspace do ứng dụng quản lý.
- Bộ Postman local cho các tình huống lỗi, kết quả rỗng, validation, cache và sync gate.

### Ranh giới không được hiểu nhầm

- Không có Ollama, OpenAI API, RAG, embedding, vector database hoặc bot Zalo production.
- Chưa có connector trường production-ready, SSO, vault credential, thu cookie hoặc proxy session.
- Không mặc định coi fixture local là dữ liệu học tập thật của sinh viên.
- Không duyệt file tùy ý trên toàn hệ thống, không rename/move file ngoài phạm vi quản lý.
- Reward/minigame và mini pet vẫn frozen nếu chưa được yêu cầu kích hoạt rõ ràng.

### Chạy dự án

```powershell
npm install
npm run dev:desktop
```

Chạy web server riêng:

```powershell
npm run dev:web
```

Khi sửa giao diện desktop, ưu tiên `CampusAssistantLocal-Dev.exe` để dùng Vite HMR. Không dùng `http://127.0.0.1:5173` thay cho runtime Tauri khi kiểm tra IPC native.

### Kiểm tra

```powershell
npm run check:all
```

Đây là cổng kiểm tra chuẩn, bao gồm Vitest, layout, Postman local, build TypeScript/Vite, Cargo check/test và `npm audit`.

### Release/Package

Repository hiện chưa có GitHub Release hoặc package được publish. Hai khu vực **Releases** và **Packages** trên GitHub không được tạo tự động bằng README. Chỉ tạo release hoặc publish Docker/package sau khi đã xác minh commit, test và artifact tương ứng.

### Quy trình đóng góp

1. Cập nhật branch từ `main` mới nhất.
2. Làm thay đổi trên feature branch riêng.
3. Chạy test liên quan và `npm run check:all`.
4. Tạo PR kèm task ID, file đã sửa, kết quả test và giới hạn còn lại.
5. Chỉ merge sau khi review và check đạt.

Không commit credential, token, cookie, secret `.env`, raw chat hoặc dữ liệu học tập cá nhân.

### Thành viên / contributors

| Họ và tên | GitHub |
| --- | --- |
| Huỳnh Tấn Đạt | [@qacacc](https://github.com/qacacc) |
| Nguyễn Hữu Gia Khang | [@Bryan13032004](https://github.com/Bryan13032004) |
| Nguyễn Văn Hà | [@hakury9662](https://github.com/hakury9662) |
| Nguyễn Thị Ngọc Trâm | [@NgocTram05](https://github.com/NgocTram05) |
| Lê Đức Toàn | [@toan-ei](https://github.com/toan-ei) |
| Nguyễn Đình Khiêm | [@Khiem1074](https://github.com/Khiem1074) |
| Võ Anh Sơn | [@anhson05](https://github.com/anhson05) |

### Tài liệu chính

- [`AGENTS.md`](AGENTS.md) — quy tắc làm việc và evidence gate.
- [`docs/AI_CHANGE_PROTOCOL.md`](docs/AI_CHANGE_PROTOCOL.md) — quy trình thay đổi.
- [`docs/INVARIANTS.md`](docs/INVARIANTS.md) — các bất biến bảo mật/dữ liệu/UI.
- [`tasks/TASK_INDEX.md`](tasks/TASK_INDEX.md) — trạng thái task và backlog.
- [`docs/REGRESSION_MATRIX.md`](docs/REGRESSION_MATRIX.md) — ma trận kiểm thử hồi quy.
