# Roadmap

## Phase 1: Documents

- Tao README va tai lieu scope.
- Khoa data contracts, security notes va acceptance criteria.

## Phase 2: Scaffold

- Tao Tauri + React + TypeScript.
- Them layout co ban va theme.

## Phase 3: Data

- Tao SQLite schema.
- Tao JSON subjects/documents.
- Tao sample documents.

## Phase 4: Intent Slice

- Normalizer.
- Intent detector.
- Minimal state cho `FIND_DOCUMENTS`.
- Response template co ban.

## Phase 5: File Slice

- Hien thi tai lieu.
- Chon file.
- Xac nhan mo/copy.
- Path guard va action log.

## Phase 6: Local Campus Data

- Build.
- Test acceptance criteria.
- Security review v0.1.

## Phase 7: v0.5 Local Multi-Flow

- Them `FIND_ANNOUNCEMENTS`, `FIND_SCHEDULE`, `FIND_EXAMS`.
- Them JSON local cho thong bao, lich hoc va lich thi.
- Them tab Thong bao, Lich hoc, Lich thi.
- Dashboard dung so lieu that tu bootstrap local.
- Van chua connector truong that, chua dang nhap tai khoan, chua API AI.

## Phase 8: v1.0 Local Release

- Hoan thanh release local-first voi Chat, File mau, Thong bao, Lich hoc, Lich thi, Bo nho, Kiem tra, Phat hanh, Nhat ky va Quyen rieng tu.
- Dong goi NSIS/MSI.
- Them health report, diagnostic export va update manifest check.
- Giu gioi han: khong connector truong that, khong dang nhap tai khoan truong, khong AI API.

## Phase 9: v1.0.1 UX/UI va hardening

- Them custom titlebar Tauri va tat native decorations.
- Chuyen sidebar trai thanh rail overlay: mac dinh gon, hover/focus moi mo rong.
- Sua layout grid de content khong bi ep vao cot hep khi sidebar dung fixed overlay.
- Them split-view resize/collapse cho utility/customize panel.
- Tab Giao dien an customize panel ben phai de khong mo hai noi tuy bien cung luc.
- Them Appearance Studio: draft/apply/discard/reset, skin presets, background image, fit/focus/overlay, panel opacity, font, density va color tokens.
- Giam shadow nang, lam UI phang hon va bot lag khi doi theme.
- Refactor App.tsx: tach hooks, pages, shared tables va utils.
- Them test temp DB, path traversal, symlink, DB idempotent, layout helper va appearance helper.

## Phase 10: Sau v1.0.1

- Theme preset ca nhan co ten rieng, export/import.
- Luu background image vao app-managed storage thay vi WebView storage.
- Playwright visual regression test cho layout/sidebar/theme.
- Connector truong that chi duoc lam sau khi co threat model rieng.
- Zalo bot/guide production chi duoc lam sau khi co privacy model va permission model rieng.
