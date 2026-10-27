# Test Plan — CA-099.01

> Trạng thái: **PLANNED** · Phạm vi: Frontend, REST API, SQLite và file boundary.

## 1. Mục tiêu

- Xác định phạm vi, phương pháp và điều kiện kiểm thử.
- Đảm bảo các yêu cầu được truy vết qua [Traceability_Matrix.md](./Traceability_Matrix.md).
- Phân biệt rõ kết quả local với hợp đồng UTH chưa được xác minh.

## 2. Phạm vi

| Khu vực | Nội dung |
| --- | --- |
| Frontend | Bootstrap, intent engine, command và điều hướng |
| REST API | Auth, validation, health, profile, schedule, exams |
| SQLite | Schema, migration, settings và cache |
| File | Managed workspace, path traversal, trash/restore |
| Provenance | Sample, cache, empty và error |

**Ngoài phạm vi:** UTH API thật, đăng nhập/token thật, live sync, performance và installer smoke.

## 3. Kỹ thuật kiểm thử

- **EP:** Input hợp lệ, rỗng, thiếu, sai kiểu và bị từ chối.
- **BVA:** Token 31/32 ký tự, query biên và ordinal file.
- **State Transition:** Bootstrap, chat flow, auth, connector gate và trash.
- **Negative/Security:** Path traversal, lỗi nội bộ và rò rỉ secret.

## 4. Entry / Exit criteria

### Entry

- Source và fixture local sẵn sàng.
- Dữ liệu test không chứa PII, token hoặc cookie thật.
- Có module/endpoint và expected result rõ ràng.

### Exit

- `TC-001–TC-010` được cập nhật kết quả trong ma trận truy vết.
- Test bắt buộc PASS hoặc có Defect ID.
- Không đánh dấu UTH là `VERIFIED` chỉ từ local test.

## 5. Lệnh kiểm thử

```powershell
npm run test
npm run test:layout
npm run check:postman
npm run build
npm run check:rust
npm run test:rust
npm run check:all
```

Manual Postman/desktop chỉ được ghi nhận sau khi chạy thực tế và không được lưu secret vào repository.

## 6. Defect log tối thiểu

`Defect ID` · `Test Case` · `Severity` · `Steps` · `Expected/Actual` · `Evidence` · `Status` · `Owner`

Evidence không được chứa token, cookie, mật khẩu hoặc dữ liệu cá nhân.
