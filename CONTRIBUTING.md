# QUY TRÌNH LÀM VIỆC GITHUB & ĐÓNG GÓP MÃ NGUỒN (CONTRIBUTING)
## Dự án: Campus Assistant Local
> **Áp dụng cho tất cả thành viên trong nhóm · Đọc kỹ trước khi bắt đầu code**

---

## 1. Cấu trúc Repository (Monorepo)

Dự án dùng 1 repo duy nhất. Mỗi thành viên tập trung vào phân hệ của mình, không sửa đổi các file ngoài phạm vi phân công:

```text
campus-assistant-local/
├── src-tauri/             ← Backend Rust (SQLite, Tauri IPC Commands, Connectors, Bảo mật)
├── src/                   ← Frontend (React, TypeScript, Giao diện người dùng, Hooks, CSS)
│   ├── components/        ← Các UI component dùng chung
│   ├── pages/             ← Các trang tính năng chính (Chat, Trường & Tài khoản, Lịch học, Cài đặt...)
│   ├── schoolConnector/   ← Logic tích hợp cổng trường & tra cứu tài liệu
│   └── tauriApi.ts        ← Cầu nối gọi Native IPC sang Rust Backend
├── docs/                  ← Tài liệu kiến trúc, luồng dữ liệu, quy chuẩn an toàn
└── tasks/                 ← Danh sách quản lý task & nhiệm vụ kiểm thử
```

---

## 2. Quy tắc Nhánh (Branch)

### 2.1. Hai nhánh cố định — TUYỆT ĐỐI KHÔNG commit thẳng vào:
| Nhánh | Vai trò | Ai được merge vào? |
|---|---|---|
| **`main`** | **Production** — Mã nguồn hoàn chỉnh, đã test và đóng gói phát hành | **Chỉ Lead (Chủ Repo)** merge khi phát hành phiên bản mới |
| **`develop`** | **Integration** — Nhánh tích hợp chung của toàn nhóm | **Tất cả thành viên** — thông qua Pull Request (PR) sau khi Lead approve |

### 2.2. Cách đặt tên nhánh tính năng (Bắt buộc):
```bash
# Cú pháp:
<loại>/<tên-bạn>/<mô-tả-ngắn-gọn>

# Ví dụ thực tế:
feat/dat/uth-token-capture
feat/minh/schedule-table-ui
feat/nam/chat-history-export
fix/dat/webview-white-screen
fix/minh/layout-responsive-bug
refactor/nam/connector-sync-service
test/dat/school-vault-unit-test
chore/minh/update-deps
```

**Các tiền tố (prefix) được phép dùng:**
* `feat/` — Tính năng mới
* `fix/` — Sửa lỗi (bug fix)
* `refactor/` — Tái cấu trúc, làm sạch mã nguồn (không đổi logic tính năng)
* `test/` — Bổ sung test case, kiểm thử
* `chore/` — Cập nhật cấu hình, dependencies, script công cụ

---

## 3. Quy trình làm việc 5 bước Hằng ngày

Tuân thủ nghiêm ngặt 5 bước này mỗi ngày để tránh xung đột mã nguồn:

### Bước 1: Luôn đồng bộ code mới nhất trước khi bắt đầu code
```powershell
git checkout develop
git pull origin develop
```

### Bước 2: Tạo nhánh mới từ `develop` (Mỗi tính năng là một nhánh riêng)
```powershell
git checkout -b feat/<tên-bạn>/<tên-tính-năng>

# TUYỆT ĐỐI không bao giờ code trực tiếp trên develop hoặc main!
```

### Bước 3: Commit nhỏ, rõ ràng và thường xuyên
Không dồn code cả ngày vào một commit khổng lồ:
```powershell
# Ví dụ khi làm việc ở frontend:
git add src/pages/SchoolPage.tsx
git commit -m "feat(school): add 1-click uth auto sync button"

git add src/tauriApi.ts
git commit -m "feat(api): add onUthSyncResult event listener"
```

### Bước 4: Rebase với `develop` trước khi đẩy lên remote
Trước khi tạo PR, luôn cập nhật nhánh của bạn với code mới nhất mà nhóm vừa merge vào `develop`:
```powershell
git fetch origin
git rebase origin/develop

# Nếu gặp conflict:
# 1. Mở file conflict để sửa và giữ code đúng
# 2. git add <file-da-sua>
# 3. git rebase --continue

# Đẩy nhánh của bạn lên GitHub:
git push -u origin feat/<tên-bạn>/<tên-tính-năng>
```

### Bước 5: Tạo Pull Request (PR) trên GitHub
1. Vào GitHub repo → Nhấn **"Compare & pull request"**.
2. Chọn nhánh đích là **`base: develop`** ← **`compare: feat/...`** (Không chọn `base: main`).
3. Điền mô tả theo mẫu PR, gắn Reviewer là **Lead dự án** và gửi.

---

## 4. Quy chuẩn Viết Commit Message (Conventional Commits)

Format chuẩn:
```text
<loại>(<phạm-vi>): <mô tả ngắn gọn hành động đã làm>
```

* **✅ ĐÚNG:**
  * `feat(school): implement auto token capture for uth login`
  * `feat(schedule): add semester filter to timetable table`
  * `fix(tauri): resolve native ipc path traversal vulnerability`
  * `refactor(chat): optimize keyword normalization performance`
  * `test(connector): add fixture test for uth mock schedule`
  * `chore(deps): update tauri-apps api to v2.0`
* **❌ SAI (Quá chung chung, không nắm được nội dung):**
  * `fix bug`
  * `update`
  * `done code`
  * `fix error`

---

## 5. Mẫu Tạo Pull Request (PR Template)

Khi gửi PR, điền đầy đủ thông tin:

```markdown
## 📌 Mô tả thay đổi
Triển khai tính năng tự động nhận diện token UTH qua WebView và lưu vào SQLite Local.

## 🏷 Loại thay đổi
- [x] feat: Tính năng mới
- [ ] fix: Sửa lỗi
- [ ] refactor: Tối ưu / Tái cấu trúc
- [ ] test / chore

## ✅ Checklist tự kiểm tra
- [x] Đã chạy kiểm tra cú pháp và build không có lỗi
- [x] Không commit file nhị phân nặng, file tạm, credentials hoặc file .env
- [x] Đã rebase với origin/develop mới nhất
- [x] Tuân thủ Invariants an toàn dữ liệu (không lưu mật khẩu người dùng)

## 🧪 Cách Lead / Reviewer test nhanh
1. Vào tab Trường & Tài khoản.
2. Nhấn nút "Đăng nhập & Tự động lấy dữ liệu (Chỉ 1 lần)".
3. Kiểm tra lịch học và ca thi hiển thị đầy đủ ở SQLite Local.
```

---

## 6. Xử lý sau khi Pull Request được Merge

Sau khi Lead đã duyệt và merge PR của bạn vào `develop`:

```powershell
# 1. Xóa nhánh cũ ở local:
git checkout develop
git branch -d feat/<tên-bạn>/<tên-tính-năng>

# 2. Kéo code develop mới nhất đã merge về máy:
git pull origin develop

# 3. Tạo nhánh mới cho công việc tiếp theo:
git checkout -b feat/<tên-bạn>/<task-mới>
```

---

## 7. Xử lý Xung đột Code (Merge Conflict)

Khi 2 người cùng sửa chung một đoạn code:
1. Mở file có conflict, tìm đoạn:
   ```text
   <<<<<<< HEAD (code trên develop hiện tại)
   code_cua_develop();
   =======
   code_cua_ban();
   >>>>>>> feat/... (nhánh của bạn)
   ```
2. Thảo luận với người viết code đó, giữ lại logic chính xác nhất, xóa bỏ các ký hiệu đánh dấu `<<<<<<<`, `=======`, `>>>>>>>`.
3. Chạy lệnh:
   ```powershell
   git add <file-da-sua>
   git rebase --continue
   ```

---

## 8. Những điều TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

| ❌ TUYỆT ĐỐI KHÔNG LÀM | ✅ HÀNH ĐỘNG THAY THẾ |
|---|---|
| Commit thẳng lên nhánh `develop` hoặc `main` | Tạo nhánh tính năng riêng rồi gửi Pull Request |
| Dồn code cả tuần vào 1 commit duy nhất | Commit thường xuyên, mỗi commit làm xong 1 việc trọn vẹn |
| Commit token, mật khẩu, file `.env`, file build `.exe` nặng | Kiểm tra kỹ `.gitignore` trước khi `git add` |
| Force push (`git push -f`) lên `develop` hoặc `main` | Chỉ force push trên nhánh cá nhân của bạn sau khi rebase |
| Tự ý bấm Merge PR của chính mình | Luôn đợi Lead review và approve |
| Để conflict chưa sửa triệt để mà vẫn push | Tự chạy thử app trên máy xem chạy được chưa rồi mới push |
