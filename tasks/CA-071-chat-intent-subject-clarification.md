# CA-071 - Chat Intent Subject Clarification

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-08-02

## Muc tieu duy nhat

Sửa lỗi bot tự chọn môn đầu tiên khi người dùng hỏi tìm tài liệu nhưng không nêu rõ môn học.

## Current violation

`detectIntent()` hiện có fallback:

```ts
const subject = matchedSubject ?? subjects[0];
```

Điều này làm bot tự phát minh ngữ cảnh. Ví dụ người dùng nhập `tìm tài liệu` thì hệ thống có thể tự lấy môn đầu tiên thay vì hỏi lại.

## Target behavior

- Nếu câu có intent tìm tài liệu nhưng không xác định được môn học: trả về trạng thái cần hỏi rõ môn.
- Không truy vấn tài liệu khi thiếu `subjectId`.
- Bot hỏi người dùng nêu môn học hoặc chọn môn có sẵn.
- Nếu câu có môn hợp lệ như `tìm tài liệu lập trình mạng`: giữ nguyên flow hiện tại.
- Nếu câu random ngoài dữ liệu: vẫn `UNKNOWN`.

## Duoc phep lam

- Sửa `src/engine.ts`.
- Sửa `src/App.tsx` nếu cần xử lý trạng thái hỏi rõ môn.
- Sửa / thêm test trong `src/engine.test.ts`.
- Cập nhật static/layout check nếu cần.
- Cập nhật docs task/governance.

## Khong duoc lam

- Không thêm AI API.
- Không đổi backend/Tauri command.
- Không đổi schema SQLite.
- Không đổi dữ liệu JSON mẫu.
- Không refactor chat flow lớn ngoài phần cần thiết.
- Không bật lưu raw chat.

## Evidence commands

```powershell
rg -n "subjects\\[0\\]|NEEDS_SUBJECT|WAITING_FOR_SUBJECT" src
npm run check:all
```

## Tieu chi hoan thanh

- Source không còn fallback `matchedSubject ?? subjects[0]`.
- Test `tìm tài liệu` không tự chọn môn đầu tiên.
- Test `tìm tài liệu lập trình mạng` vẫn nhận đúng `FIND_DOCUMENTS`.
- Bot có phản hồi hỏi rõ môn khi thiếu subject.
- `npm run check:all` pass.

## Ket qua thuc hien

- Xoa fallback tu dong lay mon dau tien trong `detectIntent()`.
- Them intent `NEEDS_SUBJECT` khi user muon tim tai lieu nhung cau khong co mon hoc ro rang.
- Them helper `findSubjectInText()` de App dung lai trong buoc hoi mon.
- Them state `WAITING_FOR_SUBJECT` cho flow `FIND_DOCUMENTS`.
- Khi user nhap `tim tai lieu`, bot hoi mon hoc thay vi truy van tai lieu.
- Khi user dang o buoc hoi mon va nhap `lap trinh mang`, flow tiep tuc hoi hoc ky nhu cu.
- Them regression test chong tai phat loi tu suy doan mon.

## Evidence

- `rg -n "subjects\\[0\\]" src`: khong co ket qua.
- `npm run test`: 6 files / 51 tests pass.
- `npm run test:layout`: pass.
- `npm run build`: pass.
- `npm run check:rust`: pass.
- `npm run test:rust`: 35 tests pass.
- `npm audit`: 0 vulnerabilities.
- `npm run check:all`: pass.
