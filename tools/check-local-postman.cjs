const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const collectionPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_collection.json");
const environmentPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_environment.json");
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));
const environment = JSON.parse(fs.readFileSync(environmentPath, "utf8"));
const items = collection.item;
let checks = 0;
const check = (name, fn) => {
  fn();
  checks += 1;
  console.log("PASS:", name);
};

check("Collection local REST tồn tại", () => {
  assert.equal(collection.info.name, "Campus Assistant Local REST API");
  assert.equal(items.length, 10);
});

check("Environment dùng loopback", () => {
  const base = environment.values.find(value => value.key === "BASE_URL");
  assert.equal(base.value, "http://127.0.0.1:47821");
  const token = environment.values.find(value => value.key === "API_TOKEN");
  const studentCode = environment.values.find(value => value.key === "STUDENT_CODE");
  assert.equal(token.value, "");
  assert.equal(token.type, "secret");
  assert.equal(studentCode.value, "");
  assert.equal(studentCode.type, "secret");
});

const expectedRoutes = [
  "/api/v1/health",
  "/api/v1/profile",
  "/api/v1/announcements",
  "/api/v1/documents",
  "/api/v1/schedule",
  "/api/v1/exams",
  "/api/v1/sync",
  "/api/v1/sync/status",
];
check("Đủ route cho bài nộp", () => {
  const routes = items.map(item => item.request.url);
  for (const route of expectedRoutes) assert.ok(routes.some(url => url.includes(route)), route);
});

check("Request có test script", () => {
  for (const item of items) {
    assert.ok(item.event?.some(event => event.listen === "test"), item.name);
  }
});

check("Không có token/PII trong collection", () => {
  const text = JSON.stringify(collection);
  assert.equal(/Bearer\s+[A-Za-z0-9+/_=-]{32,}|jwt|cookie|password|mssv\s*[:=]\s*\d{6,}/i.test(text), false);
});

check("Collection yêu cầu Bearer; probe 401 không gửi token", () => {
  assert.equal(collection.auth?.type, "bearer");
  assert.equal(collection.auth?.bearer?.[0]?.value, "{{API_TOKEN}}");
  const probe = items.find(item => item.name === "Auth - missing token");
  assert.ok(probe);
  assert.equal(probe.request.auth?.type, "noauth");
  assert.ok(JSON.stringify(probe.event).includes("HTTP 401"));
});

check("Có kiểm thử empty result và profile chưa kết nối", () => {
  const names = items.map(item => item.name);
  assert.ok(names.includes("Profile - not connected"));
  assert.ok(names.includes("Documents - valid empty result"));
});

console.log(`${checks} kiểm tra local Postman PASS; không gửi HTTP và không xác nhận contract UTH.`);
