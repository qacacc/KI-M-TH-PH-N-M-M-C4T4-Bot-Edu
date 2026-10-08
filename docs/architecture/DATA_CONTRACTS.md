# Data Contracts

## Subject

```json
{
  "id": "network-programming",
  "name": "Lập trình mạng",
  "aliases": ["lap trinh mang", "ltm", "network programming"]
}
```

## Document

```json
{
  "id": "doc-001",
  "subjectId": "network-programming",
  "semester": 1,
  "name": "Slide chuong 1.pdf",
  "type": "slide",
  "sizeBytes": 2936012,
  "source": "Du lieu mau local",
  "localPath": "sample-documents/network-programming/slide-chuong-1.pdf",
  "updatedAt": "2026-07-19T00:00:00Z"
}
```

## Action Log

```json
{
  "action": "COPY_DOCUMENT",
  "documentId": "doc-001",
  "result": "SUCCESS",
  "timestamp": "2026-07-19T10:30:00Z"
}
```

## Announcement

```json
{
  "id": "ann-001",
  "title": "Lich dang ky hoc phan hoc ky 1",
  "category": "Dao tao",
  "priority": "important",
  "publishedAt": "2026-07-01T08:00:00+07:00",
  "source": "Du lieu mau local",
  "summary": "Noi dung tom tat thong bao mau."
}
```

## Schedule

```json
{
  "id": "sch-001",
  "subjectId": "network-programming",
  "subjectName": "Lap trinh mang",
  "semester": 1,
  "weekday": 2,
  "startTime": "07:00",
  "endTime": "09:30",
  "room": "A2-401",
  "lecturer": "Giang vien mau",
  "note": "Noi dung ghi chu mau."
}
```

## Exam

```json
{
  "id": "exam-001",
  "subjectId": "network-programming",
  "subjectName": "Lap trinh mang",
  "semester": 1,
  "examDate": "2026-08-20",
  "startTime": "07:30",
  "durationMinutes": 90,
  "room": "A2-501",
  "format": "Tu luan + thuc hanh",
  "note": "Du lieu mau local."
}
```

## Storage Summary

```json
{
  "sampleDocumentCount": 18,
  "sampleDocumentBytes": 39526,
  "downloadFileCount": 2,
  "downloadBytes": 4096,
  "actionLogCount": 5,
  "appLocalData": "C:/Users/PC/AppData/Local/CampusAssistant/AppLocalData",
  "managedWorkspace": "C:/Users/PC/Documents/CampusAssistant",
  "downloads": "C:/Users/PC/Documents/CampusAssistant/downloads"
}
```

## Health Report

```json
{
  "generatedAt": "2026-07-19T10:30:00Z",
  "version": "1.0.1",
  "items": [
    {
      "id": "database",
      "label": "SQLite",
      "status": "PASS",
      "detail": "Da ket noi. Action log: 0."
    }
  ]
}
```

## Diagnostic Export Result

```json
{
  "fileName": "campus-assistant-diagnostic-2026-07-19T10-30-00Z.json",
  "relativePath": "downloads/campus-assistant-diagnostic-2026-07-19T10-30-00Z.json",
  "message": "Da xuat bao cao chan doan vao downloads cua CampusAssistant."
}
```

## Release Checklist Item

```json
{
  "label": "Local-first",
  "status": "PASS",
  "detail": "Khong AI API, khong connector truong that, khong dang nhap tai khoan truong trong ban 1.0.1."
}
```

## Appearance Settings

```json
{
  "backgroundColor": "#0b0f17",
  "panelColor": "#111827",
  "textColor": "#f8fafc",
  "mutedColor": "#9ca3af",
  "fontFamily": "Inter, Segoe UI, system-ui, sans-serif",
  "fontScale": 1,
  "density": "comfortable",
  "backgroundImage": "asset://localhost/C:/Users/PC/AppData/Local/CampusAssistant/AppLocalData/themes/current/bg.png",
  "backgroundOpacity": 0.16,
  "backgroundBlur": 0,
  "backgroundFit": "cover",
  "backgroundPositionX": 50,
  "backgroundPositionY": 50,
  "backgroundDarkOverlay": 0,
  "backgroundLightOverlay": 0,
  "backgroundAccentTint": 0,
  "panelOpacity": 0.92
}
```

## Future School Connector Metadata

Ban 1.0.1 chua code connector truong that. Contract duoi day chi la draft cho threat model/design:

```json
{
  "schoolId": "uth",
  "displayName": "Truong Dai hoc Giao thong van tai TP.HCM",
  "officialDomains": ["example.edu.vn"],
  "authType": "webview-sso",
  "scopes": ["public", "schedule", "exams"],
  "status": "NOT_IMPLEMENTED"
}
```

Quy tac:

- Metadata co the luu SQLite khi co task connector.
- Token/cookie/password khong nam trong contract frontend va khong nam trong diagnostic export.
- Du lieu lay tu truong phai normalize ve `Announcement`, `Document`, `Schedule`, `Exam` truoc khi UI hien.

## Local School Profile

Ho so truong local la cau hinh nguoi dung tu nhap trong WebView, khong phai phien dang nhap SSO:

```json
{
  "schoolId": "uth",
  "schoolName": "Truong Dai hoc Giao thong van tai TP.HCM",
  "mode": "public",
  "displayName": "Sinh vien UTH",
  "studentCode": "",
  "schoolEmail": "",
  "updatedAt": "2026-07-22T00:00:00.000Z"
}
```

Quy tac:

- Luu trong `localStorage` voi key `ca-school-profile-v1`.
- Khong luu token, cookie, mat khau hoac credential.
- Nut dang nhap cong truong trong 1.0.1 chi hien gate/readiness, khong mo SSO that.
- Khi co connector that, profile nay chi la context chon truong; token phai nam trong vault rieng.
