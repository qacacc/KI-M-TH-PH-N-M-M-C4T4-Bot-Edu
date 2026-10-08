# Connector Design

## Pham vi

Tai lieu nay dinh nghia cach thiet ke connector truong that trong tuong lai. Ban 1.0.1 chua trien khai SSO/API truong.

## Nguyen tac

- Connector la module local chay tren may nguoi dung.
- Khong proxy qua server nha phat trien.
- Khong co auto-discover endpoint bang cach doan/scrape am tham.
- Moi connector phai co manifest ro va consent theo scope.
- Du lieu lay ve phai normalize vao contract local truoc khi UI doc.

## Manifest truong

```ts
type SchoolConnectorManifest = {
  schoolId: string;
  displayName: string;
  officialDomains: string[];
  publicInfo: {
    enabled: boolean;
    sources: Array<{ label: string; url: string; kind: "html" | "json" | "rss" | "pdf" }>;
  };
  auth: {
    type: "none" | "oauth2" | "webview-sso";
    loginUrl?: string;
    callbackScheme?: string;
    requiredDomains: string[];
  };
  scopes: Array<"public" | "schedule" | "exams" | "grades" | "tuition">;
};
```

## Auth session

```ts
type AuthSessionMetadata = {
  schoolId: string;
  accountLabel: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  storage: "os-vault" | "encrypted-local-vault";
};
```

Quy tac:

- Metadata co the o SQLite.
- Secret/token/cookie phai o vault, khong nam trong metadata.
- Frontend chi nhan status da redact, khong nhan raw token.

## Interface muc logic

```ts
type PublicInfoProvider = {
  getPublicAnnouncements(): Promise<ConnectorResult<Announcement[]>>;
  getPublicDocuments(): Promise<ConnectorResult<Document[]>>;
};

type StudentDataProvider = {
  startAuth(scopes: string[]): Promise<AuthStartResult>;
  refreshAuth(): Promise<ConnectorResult<AuthSessionMetadata>>;
  revokeAuth(): Promise<ConnectorResult<void>>;
  syncSchedule(): Promise<ConnectorResult<Schedule[]>>;
  syncExams(): Promise<ConnectorResult<Exam[]>>;
  syncGrades?(): Promise<ConnectorResult<GradeSummary[]>>;
  healthCheck(): Promise<ConnectorHealth>;
};
```

## Result contract

```ts
type ConnectorResult<T> = {
  ok: boolean;
  data?: T;
  errorCode?: "AUTH_REQUIRED" | "CONSENT_REQUIRED" | "NETWORK_ERROR" | "RATE_LIMITED" | "UNSUPPORTED" | "PARSE_ERROR";
  message: string;
  source: {
    schoolId: string;
    connectorVersion: string;
    fetchedAt: string;
  };
};
```

## Normalized data

Connector khong duoc day raw portal response thang vao UI. Moi output phai map ve contract hien co:

- `Announcement`
- `Document`
- `Schedule`
- `Exam`

Contract moi sau nay can task rieng:

- `GradeSummary`
- `TuitionSummary`
- `AttendanceSummary`

## Flow dang nhap de xuat

1. User chon truong.
2. App hien domain va scope can cap.
3. User bam `Dang nhap voi cong truong`.
4. App mo WebView/OS browser toi domain trong manifest.
5. Portal truong xac thuc truc tiep.
6. App nhan session theo co che duoc phep.
7. App luu secret vao vault local, metadata vao SQLite.
8. App sync tung scope da duoc consent.

## Public portal mode

- Dung cho tan sinh vien/chua co tai khoan.
- Chi lay nguon cong khai da khai bao trong manifest.
- Luon hien nguon va thoi diem cap nhat.
- Khong lay thong tin ca nhan.

## Mock portal test

Bat buoc co mock portal truoc khi dung truong that:

- Auth thanh cong/that bai.
- Token het han.
- Scope bi tu choi.
- Portal thay doi HTML/API shape.
- Rate limit.
- Revoke token.
- Diagnostic export khong leak token/cookie/raw response.

Test phai dung temp root/temp vault, khong dung AppLocalData that.

## Rollout gate

Chi duoc code connector that khi:

- Threat model da duoc duyet.
- Co manifest cho truong dau tien.
- Co consent UI va revoke/delete UI.
- Co vault abstraction.
- Co mock portal va test leak.
- `npm run check:all` pass.
