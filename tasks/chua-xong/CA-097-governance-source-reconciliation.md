# CA-097 - Đối chiếu roadmap, task và feature với source

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Dùng audit này; không sửa runtime
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Roadmap COMPLETED M1-M3 và mã CA trùng ý nghĩa task thực; catalog vẫn STABLE/no gaps cho trash/search. CA060 index Done nhưng detail In Progress; CA044..053 thiếu Status; CA063/064 trùng spec.

Evidence: `docs/ROADMAP.md:13`, `docs/ROADMAP.md:33`, `docs/FEATURE_CATALOG.md:45`, `tasks/TASK_INDEX.md:54`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Một bảng canonical ID+path+scope+status; roadmap cũ là historical đến khi được đối chiếu. Không đổi task cũ Done chỉ vì code tồn tại, không cấp lại ID đã reserved hoặc đánh dấu native E2E chưa chạy.

## File dự kiến sửa sau duyệt

- `docs/ROADMAP.md`
- `docs/FEATURE_CATALOG.md`
- `docs/INVARIANTS.md`
- `docs/RUNTIME_FLOW_OVERVIEW.md`
- `docs/STATE_MACHINES.md`
- `docs/DEPENDENCY_MAP.md`
- `docs/REGRESSION_MATRIX.md`
- `docs/planning/CURRENT_STATE.txt`
- `tasks/TASK_INDEX.md`
- `README task folders/spec cũ`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Mỗi feature current có source/evidence/time/scope/known gap và tracking task, không còn STABLE contradicted.
- [ ] Giải quyết duplicate ID/UNKNOWN/Superseded với lịch sử/evidence, giữ backlink; chưa rõ thì pending không renumber đoán.
- [ ] Đồng bộ registry/index/README counts/path và docs; mọi closed gate có bằng chứng thay vì checkbox.
- [ ] CURRENT_STATE ghi kết quả thực (checkall pass nhưng fmt/clippy fail), native/website/manual chưa kiểm được đánh UNKNOWN.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; task/link/status validator; rg đối chiếu source/capability/docs.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

